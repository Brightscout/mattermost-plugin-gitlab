import {Client4} from 'mattermost-redux/client';
import {ClientError} from 'mattermost-redux/client/client4';

export default class Client {
    setServerRoute = (url) => {
        this.url = `${url}/api/v1`;
    }

    getConnected = async (reminder = false) => {
        return this.doGet(`${this.url}/connected?reminder=` + reminder);
    };

    getReviews = async () => {
        return this.doGet(`${this.url}/reviews`);
    };

    getYourPrs = async () => {
        return this.doGet(`${this.url}/yourprs`);
    };

    getPrsDetails = async (prList) => {
        return this.doPost(`${this.url}/prdetails`, prList);
    }

    getYourAssignments = async () => {
        return this.doGet(`${this.url}/yourassignments`);
    };

    getMentions = async () => {
        return this.doGet(`${this.url}/mentions`);
    };

    getUnreads = async () => {
        return this.doGet(`${this.url}/unreads`);
    };

    getGitlabUser = async (userID) => {
        return this.doPost(`${this.url}/user`, {user_id: userID});
    };

    createIssue = async (payload) => {
        return this.doPost(`${this.url}/createissue`, payload);
    }

    searchIssues = async (searchTerm) => {
        return this.doGet(`${this.url}/searchissues?search=${searchTerm}`);
    }

    getProjects = async () => {
        return this.doGet(`${this.url}/projects`);
    }

    getLabels = async (pid) => {
        return this.doGet(`${this.url}/labels?pid=${pid}`);
    }

    getMilestones = async (pid) => {
        return this.doGet(`${this.url}/milestones?pid=${pid}`);
    }

    getAssignees = async (pid) => {
        return this.doGet(`${this.url}/assignees?pid=${pid}`);
    }

    doGet = async (url, body, headers = {}) => {
        headers['X-Timezone-Offset'] = new Date().getTimezoneOffset();

        const options = {
            method: 'get',
            headers,
        };

        const response = await fetch(url, Client4.getOptions(options));

        if (response.ok) {
            return response.json();
        }

        const text = await response.text();

        throw new ClientError(Client4.url, {
            message: text || '',
            status_code: response.status,
            url,
        });
    };

    doPost = async (url, body, headers = {}) => {
        headers['X-Timezone-Offset'] = new Date().getTimezoneOffset();

        const options = {
            method: 'post',
            body: JSON.stringify(body),
            headers,
        };

        const response = await fetch(url, Client4.getOptions(options));

        if (response.ok) {
            return response.json();
        }

        const text = await response.text();

        throw new ClientError(Client4.url, {
            message: text || '',
            status_code: response.status,
            url,
        });
    };

    doDelete = async (url, body, headers = {}) => {
        headers['X-Timezone-Offset'] = new Date().getTimezoneOffset();

        const options = {
            method: 'delete',
            headers,
        };

        const response = await fetch(url, Client4.getOptions(options));

        if (response.ok) {
            return response.json();
        }

        const text = await response.text();

        throw new ClientError(Client4.url, {
            message: text || '',
            status_code: response.status,
            url,
        });
    };

    doPut = async (url, body, headers = {}) => {
        headers['X-Timezone-Offset'] = new Date().getTimezoneOffset();

        const options = {
            method: 'put',
            body: JSON.stringify(body),
            headers,
        };

        const response = await fetch(url, Client4.getOptions(options));

        if (response.ok) {
            return response.json();
        }

        const text = await response.text();

        throw new ClientError(Client4.url, {
            message: text || '',
            status_code: response.status,
            url,
        });
    };
}
