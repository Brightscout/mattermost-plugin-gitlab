// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {PureComponent} from 'react';
import {Theme} from 'mattermost-redux/types/preferences';

import ReactSelectSetting from '../react_select_setting';

interface Project{
    path_with_namespace: string;
    id: number;
}

interface PropTypes{
    yourProjects: Project[];
    theme: Theme;
    onChange: (project: Selection) => void;
    actions: any;
    value: string;
    addValidate: (key: string, validateField: () => boolean) => void;
    removeValidate: (key: string) => void;
};

interface Selection {
    name: string;
    project_id: number | undefined;
}

interface StateTypes{
    invalid: boolean;
    error: null|string;
    isLoading: boolean;
}

const initialState = {
    invalid: false,
    error: null,
    isLoading: false,
};

export default class GitlabProjectSelector extends PureComponent<PropTypes, StateTypes> {
    
    constructor(props: PropTypes) {
        super(props);
        this.state = initialState;
    }

    componentDidMount() {
        this.loadProjects();
    }

    loadProjects = async ()=>{
        this.setState({isLoading:true})
        await this.props.actions.getProjects();
        this.setState({isLoading:false});
    }

    onChange = (_: string, name: string) => {
        const project = this.props.yourProjects.find((p: Project) => p.path_with_namespace === name);
        this.props.onChange({name, project_id: project?.id});
    }

    render() {
        const projectOptions = this.props.yourProjects.map((item: Project) => ({value: item.path_with_namespace, label: item.path_with_namespace}));
        return (
            <div className={'form-group margin-bottom x3'}>
                <ReactSelectSetting
                    name={'project'}
                    label={'Project'}
                    limitOptions={true}
                    required={true}
                    onChange={this.onChange}
                    options={projectOptions}
                    isMulti={false}
                    key={'project'}
                    isLoading={this.state.isLoading}
                    theme={this.props.theme}
                    addValidate={this.props.addValidate}
                    removeValidate={this.props.removeValidate}
                    value={projectOptions.find((option: any) => option.value === this.props.value)}
                />
                <div className={'help-text'}>
                    {'Returns GitLab projects connected to the user account'} <br/>
                </div>
            </div>
        );
    }
}
