import {Theme} from 'mattermost-redux/types/preferences';
import * as CSS from 'csstype';
import { notificationReasons } from 'src/components/sidebar_right/gitlab_items';

export interface Label {
    id: number;
    name: string;
    color: CSS.Properties;
    text_color: CSS.Properties;
}

export interface User {
    username: string;
}

export interface References {
    full: string;
}

export interface Project {
    path_with_namespace: string;
}

export interface Target {
    title: string;
}

export interface Item {
    url: string;
    iid: number;
    has_conflicts: boolean;
    id: number;
    title: string;
    created_at: string;
    updated_at: string;
    action_name: keyof typeof notificationReasons;
    web_url: string;
    target_url: string;
    repository_url?: string;
    author: User;
    references: References;
    project: Project;
    merge_status: string;
    merge_error: string;
    owner?: User;
    milestone?: {
        title: string;
    };
    repository?: {
        full_name: string;
    };
    labels?: Label[];
    target: Target;
}

export interface GitlabItemsProps {
    item: Item;
    theme: Theme;
}
