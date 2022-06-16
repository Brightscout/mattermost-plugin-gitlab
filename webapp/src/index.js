// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import SidebarHeader from './components/sidebar_header';
import TeamSidebar from './components/team_sidebar';
import UserAttribute from './components/user_attribute';
import Reducer from './reducers';
import SidebarRight from './components/sidebar_right';
import CreateIssuePostMenuAction from './components/create_issue_menu';
import AttachCommentToIssuePostMenuAction from './components/attach_comment_to_issue_menu';
import CreateIssueModal from './components/modals/create_issue';
import AttachCommentToIssueModal from './components/modals/attach_comment_to_issue';
import {getConnected, setShowRHSAction} from './actions';
import {
    handleConnect,
    handleDisconnect,
    handleReconnect,
    handleRefresh,
    handleOpenCreateIssueModal,
} from './websocket';
import {id} from './manifest';
import Client from './client';
import {getPluginServerRoute} from './selectors';

let activityFunc;
let lastActivityTime = Number.MAX_SAFE_INTEGER;
const activityTimeout = 60 * 60 * 1000; // 1 hour

class PluginClass {
    async initialize(registry, store) {
        registry.registerReducer(Reducer);

        // This needs to be called before any API calls below
        Client.setServerRoute(getPluginServerRoute(store.getState()));

        await getConnected(true)(store.dispatch, store.getState);

        registry.registerLeftSidebarHeaderComponent(SidebarHeader);
        registry.registerBottomTeamSidebarComponent(TeamSidebar);
        registry.registerPopoverUserAttributesComponent(UserAttribute);
        registry.registerRootComponent(CreateIssueModal);
        registry.registerPostDropdownMenuComponent(CreateIssuePostMenuAction);
        registry.registerRootComponent(AttachCommentToIssueModal);
        registry.registerPostDropdownMenuComponent(AttachCommentToIssuePostMenuAction);

        const {showRHSPlugin} = registry.registerRightHandSidebarComponent(SidebarRight, 'GitLab Plugin');
        store.dispatch(setShowRHSAction(() => store.dispatch(showRHSPlugin)));

        registry.registerWebSocketEventHandler(
            `custom_${id}_gitlab_connect`,
            handleConnect(store),
        );
        registry.registerWebSocketEventHandler(
            `custom_${id}_gitlab_disconnect`,
            handleDisconnect(store),
        );
        registry.registerWebSocketEventHandler(
            `custom_${id}_gitlab_refresh`,
            handleRefresh(store),
        );
        registry.registerWebSocketEventHandler(
            `custom_${id}_create_issue`,
            handleOpenCreateIssueModal(store),
        );
        registry.registerReconnectHandler(handleReconnect(store));

        activityFunc = () => {
            const now = new Date().getTime();
            if (now - lastActivityTime > activityTimeout) {
                handleReconnect(store, true)();
            }
            lastActivityTime = now;
        };

        document.addEventListener('click', activityFunc);
    }

    deinitialize() {
        document.removeEventListener('click', activityFunc);
    }
}

global.window.registerPlugin(id, new PluginClass());
