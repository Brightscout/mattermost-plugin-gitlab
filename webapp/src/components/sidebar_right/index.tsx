// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect, useState} from 'react';
import Scrollbars from 'react-custom-scrollbars';
import {Theme} from 'mattermost-redux/types/preferences';
import {makeStyleFromTheme, changeOpacity} from 'mattermost-redux/utils/theme_utils';

import {getYourPrDetails, getReviewDetails} from 'src/actions';
import {RHSStates} from 'src/constants';
import {Item} from 'src/types/gitlab_items';

import {getPluginState} from 'src/selectors';
import {useSelector} from 'react-redux';

import GitlabItems from './gitlab_items';

const AUTO_HIDE_TIMEOUT = 500;
const AUTO_HIDE_DURATION = 500;

interface Props {
    username: string;
    org: string;
    gitlabURL: string;
    reviews: Item[];
    unreads: Item[],
    yourPrs: Item[],
    yourAssignments: Item[],
    rhsState: string,
    theme: Theme,
}

export function renderView(props: Props) {
    return (
        <div
            {...props}
            className='scrollbar--view'
        />);
}

export function renderThumbHorizontal(props: Props) {
    return (
        <div
            {...props}
            className='scrollbar--horizontal'
        />);
}

export function renderThumbVertical(props: Props) {
    return (
        <div
            {...props}
            className='scrollbar--vertical'
        />);
}

function mapGitlabItemListToPrList(gilist: Item[]) {
    if (!gilist) {
        return [];
    }

    return gilist.map((pr: Item) => {
        return {sha: pr.sha, project_id: pr.project_id, iid: pr.iid};
    });
}

function shouldUpdateDetails(prs: Item[], prevPrs: Item[], targetState: string, currentState: string, prevState: string) {
    if (currentState !== targetState) {
        return false;
    }

    if (currentState !== prevState) {
        return true;
    }

    if (prs.length !== prevPrs.length) {
        return true;
    }

    for (let i = 0; i < prs.length; i++) {
        if (prs[i].id !== prevPrs[i].id) {
            return true;
        }
    }
    return false;
}

function mapPrsToDetails(prs: Item[], details: Item[]) {
    if (!prs || !prs.length) {
        return [];
    }

    return prs.map((pr) => {
        let foundDetails;
        if (details) {
            foundDetails = details.find((prDetails) => {
                return (pr.project_id === prDetails.project_id) && (pr.sha === prDetails.sha);
            });
        }
        if (!foundDetails) {
            return pr;
        }

        return {
            ...pr,
            status: foundDetails.status,
            approvers: foundDetails.approvers,
            total_reviewers: pr.total_reviewers,
        };
    });
}

function SidebarRight() {
    const store = useSelector((state) => getPluginState(state));
    const username = store.username;
    const yourAssignments = store.yourAssignments;
    const org = store.organization;
    const unreads = store.unreads;
    const gitlabURL = store.gitlabURL;
    const rhsState = store.rhsState;
    let reviews = store.reviews;
    let yourPrs = store.yourPrs;
    const reviewDetails = store.reviewDetails;
    const yourPrDetails = store.yourPrDetails;
    reviews = mapPrsToDetails(reviews, reviewDetails);
    yourPrs = mapPrsToDetails(yourPrs, yourPrDetails);

    const [prs, setPrs] = useState<Item[]>(yourPrs);
    const [prsRhsState, setPrsRhsState] = useState('');
    const [review, setReview] = useState<Item[]>(reviews);
    const [reviewsRhsState, setReviewsRhsState] = useState('');

    useEffect(() => {
        setPrs(yourPrs);
        setPrsRhsState(rhsState);
        setReview(reviews);
        setReviewsRhsState(rhsState);
        if (yourPrs && rhsState === RHSStates.PRS) {
            getYourPrDetails(
                mapGitlabItemListToPrList(yourPrs),
            );
            if (reviews && rhsState === RHSStates.REVIEWS) {
                getReviewDetails(
                    mapGitlabItemListToPrList(reviews),
                );
            }
        }
    }, []);

    useEffect(() => {
        if (shouldUpdateDetails(yourPrs, prs, RHSStates.PRS, rhsState, prsRhsState)) {
            setPrs(yourPrs);
            setPrsRhsState(rhsState);
            getYourPrDetails(mapGitlabItemListToPrList(yourPrs));
        }
    }, [yourPrs, rhsState]);

    useEffect(() => {
        if (shouldUpdateDetails(reviews, review, RHSStates.REVIEWS, rhsState, reviewsRhsState)) {
            setReview(reviews);
            setReviewsRhsState(rhsState);
            getReviewDetails(mapGitlabItemListToPrList(reviews));
        }
    }, [reviews, rhsState]);

    const style = getStyle(theme);
    const baseURL = gitlabURL || 'https://gitlab.com';
    let orgQuery = '/dashboard'; //default == all orgs
    if (org) {
        orgQuery = `/groups/${org}/-`;
    }

    let title = '';
    let gitlabItems: Item[] = [];
    let listUrl = '';

    switch (rhsState) {
    case RHSStates.PRS:
        gitlabItems = yourPrs;
        title = 'Your Open Merge Requests';
        listUrl = `${baseURL}${orgQuery}/merge_requests?state=opened&author_username=${username}`;
        break;
    case RHSStates.REVIEWS:
        gitlabItems = reviews;
        listUrl = `${baseURL}${orgQuery}/merge_requests?reviewer_username=${username}`;
        title = 'Merge Requests Needing Review';
        break;
    case RHSStates.UNREADS:
        gitlabItems = unreads;
        title = 'Unread Messages';
        listUrl = `${baseURL}/dashboard/todos`;
        break;
    case RHSStates.ASSIGNMENTS:
        gitlabItems = yourAssignments;
        title = 'Your Assignments';
        listUrl = `${baseURL}${orgQuery}/issues?assignee_username=${username}`;
        break;
    default:
        break;
    }

    let renderedGitlabItems: React.ReactNode = <div style={style.container}>{'You have no active items'}</div>;
    if (gitlabItems.length) {
        renderedGitlabItems = gitlabItems.map((item) => (
            <GitlabItems
                key={item.id}
                item={item}
                theme={theme}
            />
        ));
    }
    return (
        <>
            <Scrollbars
                autoHide={true}
                autoHideTimeout={AUTO_HIDE_TIMEOUT} // Hide delay in ms
                autoHideDuration={AUTO_HIDE_DURATION} // Duration for hide animation in ms.
                renderThumbHorizontal={renderThumbHorizontal}
                renderThumbVertical={renderThumbVertical}
                renderView={renderView}
            >
                <div style={style.sectionHeader}>
                    <strong>
                        <a
                            href={listUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                        >
                            {title}
                        </a>
                    </strong>
                </div>
                {renderedGitlabItems}
            </Scrollbars>
        </>
    );
}

const getStyle = makeStyleFromTheme((theme) => {
    return {
        container: {
            padding: '15px',
            borderTop: `1px solid ${changeOpacity(theme.centerChannelColor, 0.2)}`,
        },
        sectionHeader: {
            padding: '15px',
        },
    };
});

export default SidebarRight;
