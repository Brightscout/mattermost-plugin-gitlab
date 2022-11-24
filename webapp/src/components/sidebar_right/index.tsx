// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect, useState} from 'react';
import Scrollbars from 'react-custom-scrollbars';
import {useDispatch, useSelector} from 'react-redux';

import {Theme} from 'mattermost-redux/types/preferences';
import {makeStyleFromTheme, changeOpacity} from 'mattermost-redux/utils/theme_utils';

import {getYourPrDetails, getReviewDetails} from 'src/actions';
import {RHSStates} from 'src/constants';
import {getSidebarData} from 'src/selectors';
import {Item} from 'src/types/gitlab_items';

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

export const renderView = (props: Props) => (
    <div
        {...props}
        className='scrollbar--view'
    />
);

export const renderThumbHorizontal = (props: Props) => (
    <div
        {...props}
        className='scrollbar--horizontal'
    />
);

export const renderThumbVertical = (props: Props) => (
    <div
        {...props}
        className='scrollbar--vertical'
    />
);

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
            num_approvers: foundDetails.num_approvers,
            total_reviewers: pr.reviewers.length,
        };
    });
}

function SidebarRight({theme}: {theme: Theme}) {
    const sidebarData = useSelector(getSidebarData);
    const {username, yourAssignments, org, unreads, gitlabURL, rhsState, reviews, yourPrs, reviewDetails, yourPrDetails} = sidebarData;

    // States used for storing the PRs/Reviews along with their details which are present separately in redux state.
    const [prsWithDetails, setPrsWithDetails] = useState<Item[]>(yourPrs);
    const [reviewsWithDetails, setReviewsWithDetails] = useState<Item[]>(reviews);

    const dispatch = useDispatch();

    useEffect(() => {
        setReviewsWithDetails(mapPrsToDetails(reviews, reviewDetails));
    }, [reviews, reviewDetails]);

    useEffect(() => {
        setPrsWithDetails(mapPrsToDetails(yourPrs, yourPrDetails));
    }, [yourPrs, yourPrDetails]);

    // Dispatch the action on first render
    useEffect(() => {
        if (yourPrs && rhsState === RHSStates.PRS) {
            dispatch(getYourPrDetails(yourPrs));
        }

        if (reviews && rhsState === RHSStates.REVIEWS) {
            dispatch(getReviewDetails(reviews));
        }
    }, []);

    useEffect(() => {
        if (RHSStates.PRS === rhsState) {
            setPrsWithDetails(yourPrs);
            dispatch(getYourPrDetails(yourPrs));
        }
    }, [yourPrs, rhsState]);

    useEffect(() => {
        if (RHSStates.REVIEWS === rhsState) {
            setReviewsWithDetails(reviews);
            dispatch(getReviewDetails(reviews));
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
        gitlabItems = prsWithDetails;
        title = 'Your Open Merge Requests';
        listUrl = `${baseURL}${orgQuery}/merge_requests?state=opened&author_username=${username}`;
        break;
    case RHSStates.REVIEWS:
        gitlabItems = reviewsWithDetails;
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
            <GitlabItems
                key={item.id}
                item={item}
                theme={theme}
            />
        ));
    }

    return (
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
