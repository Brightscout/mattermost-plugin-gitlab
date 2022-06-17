import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import Octicon, {GitMerge, GitPullRequest, IssueClosed, IssueOpened} from '@primer/octicons-react';

import Client from '../../client';
import './tooltip.css';
import {validateGitlabURL} from '../../utils/regex_utils';

const STATE_COLOR_MAP = {
    OPENED_COLOR: '#28a745',
    CLOSED_COLOR: '#cb2431',
    MERGED_COLOR: '#6f42c1',
};

const STATE_TYPES = {
    OPENED: 'opened',
    CLOSED: 'closed',
};

const LINK_TYPES = {
    MERGE_REQUESTS: 'merge_requests',
    ISSUES: 'issues',
};

export const LinkTooltip = ({href, connected}) => {
    const [data, setData] = useState(null);
    useEffect(() => {
        const init = async () => {
            if (href.includes('gitlab.com/') && validateGitlabURL(href)) {
                const [owner, repo, , type, number] = href.split('gitlab.com/')[1].split('/');
                let res;
                switch (type) {
                case LINK_TYPES.ISSUES:
                    res = await Client.getIssue(owner, repo, number);
                    break;
                case LINK_TYPES.MERGE_REQUESTS:
                    res = await Client.getPullRequest(owner, repo, number);
                    break;
                }
                if (res) {
                    res = {...res, owner, repo, type};
                }
                setData(res);
            }
        };
        if (data) {
            return;
        }
        if (connected) {
            init();
        }
    }, []);

    const getIconElement = () => {
        let color;
        let iconType;
        const {OPENED_COLOR, CLOSED_COLOR, MERGED_COLOR} = STATE_COLOR_MAP;
        switch (data.type) {
        case LINK_TYPES.MERGE_REQUESTS:
            color = OPENED_COLOR;
            iconType = GitPullRequest;
            if (data.state === STATE_TYPES.CLOSED) {
                if (data.merged) {
                    color = MERGED_COLOR;
                    iconType = GitMerge;
                } else {
                    color = CLOSED_COLOR;
                }
            }
            break;
        case LINK_TYPES.ISSUES:
            color = data.state === STATE_TYPES.OPENED ? OPENED_COLOR : CLOSED_COLOR;
            iconType = data.state === STATE_TYPES.OPENED ? IssueOpened : IssueClosed;
            break;
        }
        const icon = (
            <span style={{color}}>
                <Octicon
                    icon={iconType}
                    size='small'
                    verticalAlign='middle'
                />
            </span>
        );
        return icon;
    };

    if (data) {
        const date = new Date(data.created_at).toDateString();

        return (
            <div className='gitlab-tooltip'>
                <div className='gitlab-tooltip box gitlab-tooltip--large gitlab-tooltip--bottom-left p-4'>
                    <div className='header mb-1'>
                        <a
                            title={data.repo}
                            href={href}
                        >
                            {data.repo}
                        </a>
                        <span className='text-spacing'>on</span><span>{date}</span>
                    </div>

                    <div className='body d-flex mt-2'>
                        <span className='pt-1 pb-1 pr-2'>
                            {getIconElement()}
                        </span>

                        {/* info */}
                        <div className='tooltip-info mt-1'>
                            <a href={href}>
                                <h5 className='mr-1'>{data.title}</h5>
                                <span className='mr-number'>#{data.iid}</span>
                            </a>
                            <div className='markdown-text mt-1 mb-1'>
                                <ReactMarkdown
                                    source={data.description}
                                    disallowedTypes={['heading']}
                                    linkTarget='_blank'
                                />
                            </div>

                            {/* base <- head */}
                            {data.type === LINK_TYPES.MERGE_REQUESTS && (
                                <div className='base-head mt-1 mr-3'>
                                    <span
                                        title={data.target_branch}
                                        className='commit-ref'
                                        style={{maxWidth: '140px'}}
                                    >
                                        {data.target_branch}
                                    </span>
                                    <span className='mx-1'>←</span>
                                    <span
                                        title={data.source_branch}
                                        className='commit-ref'
                                    >
                                        {data.source_branch}
                                    </span>
                                </div>
                            )}

                            <div className='see-more mt-1'>
                                <a
                                    href={href}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                >
                                    See more
                                </a>
                            </div>

                            {/* Labels */}
                            <div className='labels mt-3'>
                                {data.labels && data.labels_with_details && data.labels_with_details.length && data.labels_with_details.map((label, index) => {
                                    return (
                                        <span
                                            key={index}
                                            className='label mr-1'
                                            title={label.description}
                                            style={{backgroundColor: label.color}}
                                        >
                                            <span style={{color: label.text_color}}>{label.name}</span>
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

LinkTooltip.propTypes = {
    href: PropTypes.string.isRequired,
    connected: PropTypes.bool.isRequired,
};
