// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect, useState} from 'react';
import Scrollbars from 'react-custom-scrollbars';
import {useDispatch, useSelector} from 'react-redux';

import {Theme} from 'mattermost-redux/types/preferences';
import {makeStyleFromTheme, changeOpacity} from 'mattermost-redux/utils/theme_utils';

import {getYourPrDetails, getReviewDetails} from 'src/actions';
import {RHSStates} from 'src/constants';
import {getPluginState} from 'src/selectors';
import {Item} from 'src/types/gitlab_items';

import I18nProvider from '../i18n_provider';

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
        const foundDetails = details && details.find((prDetails) => pr.project_id === prDetails.project_id && pr.sha === prDetails.sha);
        if (!foundDetails) {
            return pr;
        }

        return {
            ...pr,
            status: foundDetails.status,
            approvers: foundDetails.approvers,
            total_reviewers: pr.reviewers.length,
        };
    });
}

function SidebarRight({theme}: {theme: Theme}) {
    const {username, yourAssignments, org, unreads, gitlabURL, rhsState, reviews, yourPrs, reviewDetails, yourPrDetails} = useSelector((state) => {
        const store = getPluginState(state);
        return {
            username: store.username,
            reviews: store.reviews,
            reviewDetails: store.reviewDetails,
            yourPrs: store.yourPrs,
            yourPrDetails: store.yourPrDetails,
            yourAssignments: store.yourAssignments,
            unreads: store.unreads,
            org: store.organization,
            gitlabURL: store.gitlabURL,
            rhsState: store.rhsState,
        };
    });

    const [updatedPrs, setUpdatedPrs] = useState<Item[]>(yourPrs);
    const [RHSState, setRHSState] = useState('');
    const [updatedReviews, setUpdatedReviews] = useState<Item[]>(reviews);
    const dispatch = useDispatch();

    useEffect(() => {
        setUpdatedReviews(mapPrsToDetails(reviews, reviewDetails));
    }, [reviews, reviewDetails]);

    useEffect(() => {
        setUpdatedPrs(mapPrsToDetails(yourPrs, yourPrDetails));
    }, [yourPrs, yourPrDetails]);

    useEffect(() => {
        if (yourPrs && rhsState === RHSStates.PRS) {
            dispatch(getYourPrDetails(
                mapGitlabItemListToPrList(yourPrs),
            ));
            if (reviews && rhsState === RHSStates.REVIEWS) {
                dispatch(getReviewDetails(
                    mapGitlabItemListToPrList(reviews),
                ));
            }
        }
    }, []);

    useEffect(() => {
        if (shouldUpdateDetails(yourPrs, updatedPrs, RHSStates.PRS, rhsState, RHSState)) {
            setUpdatedPrs(yourPrs);
            setRHSState(rhsState);
            dispatch(getYourPrDetails(mapGitlabItemListToPrList(yourPrs)));
        }
    }, [yourPrs, rhsState]);

    useEffect(() => {
        if (shouldUpdateDetails(reviews, updatedReviews, RHSStates.REVIEWS, rhsState, RHSState)) {
            setUpdatedReviews(reviews);
            setRHSState(rhsState);
            dispatch(getReviewDetails(mapGitlabItemListToPrList(reviews)));
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
    if (gitlabItems?.length) {
        renderedGitlabItems = gitlabItems.map((item) => (
            <I18nProvider
                key={item.id}
            >
                <GitlabItems
                    item={item}
                    theme={theme}
                />
            </I18nProvider>
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
