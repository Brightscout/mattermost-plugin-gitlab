import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {
    getReviews,
    getTodos,
    getYourPrs,
    getYourAssignments,
    updateRHSState,
} from '../../actions';

import {id} from '../../manifest';

import {getPluginServerRoute} from '../../selectors';

import SidebarButtons from './sidebar_buttons.jsx';

function mapStateToProps(state) {
    return {
        connected: state[`plugins-${id}`].connected,
        username: state[`plugins-${id}`].username,
        clientId: state[`plugins-${id}`].clientId,
        reviews: state[`plugins-${id}`].reviews,
        yourPrs: state[`plugins-${id}`].yourPrs,
        yourAssignments: state[`plugins-${id}`].yourAssignments,
        todos: state[`plugins-${id}`].todos,
        gitlabURL: state[`plugins-${id}`].gitlabURL,
        org: state[`plugins-${id}`].organization,
        pluginServerRoute: getPluginServerRoute(state),
        showRHSPlugin: state[`plugins-${id}`].rhsPluginAction,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(
            {
                getReviews,
                getTodos,
                getYourPrs,
                getYourAssignments,
                updateRHSState,
            },
            dispatch,
        ),
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(SidebarButtons);
