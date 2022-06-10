// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {PureComponent} from 'react';
import {Theme} from 'mattermost-redux/types/preferences';

import IssueAttributeSelector from '../issue_attribute_selector';

interface PropTypes{
    projectID: number;
    projectName: string;
    theme: Theme;
    selectedAssignees: any;
    onChange: any;
    actions: any;
};

interface Assignee{
    id: number;
    username: string;
}

interface Selection{
    value: number;
    label: string;
}

export default class GitlabAssigneeSelector extends PureComponent<PropTypes> {

    loadAssignees = async () => {
        if (this.props.projectName === '') {
            return [];
        }

        const options = await this.props.actions.getAssigneeOptions(this.props.projectID);

        if (options.error) {
            throw new Error('Failed to load assignees');
        }

        if (!options || !options.data) {
            return [];
        }
        return options.data.map((option: Assignee) => ({
            value: option.id,
            label: option.username,
        }));
    };

    onChange = (selection: Selection) => this.props.onChange(selection);

    render() {
        return (
            <div className='form-group margin-bottom x3'>
                <label className='control-label margin-bottom x2'>
                    {'Assignees'}
                </label>
                <IssueAttributeSelector
                    {...this.props}
                    isMulti={true}
                    onChange={this.onChange}
                    selection={this.props.selectedAssignees}
                    loadOptions={this.loadAssignees}
                />
            </div>
        );
    }
}