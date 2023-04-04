import {getInfoAboutLink} from './link_tooltip';

describe('getInfoAboutLink should work as expected', () => {
    it('Should return an object of correct owner, repo, type, and number when given a valid GitLab hostname and href with all required information', () => {
        const href = 'https://gitlab.com/mattermost/test/-/merge_requests/123';
        const hostname = 'gitlab.com';
        const expected = {
            owner:'mattermost',
            repo: 'test',
            type: 'merge_requests',
            number: '123'
        }

        const result = getInfoAboutLink(href, hostname);
        expect(result).toEqual(expected);
    });

    it('Should return an object of correct owner, repo, and type when given a valid GitLab hostname and href missing the number', () => {
        const href = 'https://gitlab.com/mattermost/test/-/merge_requests';
        const hostname = 'gitlab.com';
        const expected = {
            owner:'mattermost',
            repo: 'test',
            type: 'merge_requests'
        }

        const result = getInfoAboutLink(href, hostname);
        expect(result).toEqual(expected);
    });

    it('Should return the correct owner and repo when given a valid GitLab hostname and href missing the type', () => {
        const href = 'https://gitlab.com/mattermost/test/123';
        const hostname = 'gitlab.com';
        const expected = {
            owner:'mattermost',
            repo: 'test'
        }

        const result = getInfoAboutLink(href, hostname);
        expect(result).toEqual(expected);
    });

    it('Should return an object with empty owner when given an empty hostname and valid href', () => {
        const href = 'https://gitlab.com/mattermost/test/-/merge_requests/123';
        const hostname = '';
        const expected = {
            owner:''
        };

        const result = getInfoAboutLink(href, hostname);
        expect(result).toEqual(expected);
    });

    it('Should return an object invalid owner, repo, type, and number when given a valid hostname and invalid href', () => {
        const href = 'https://gitlab.com/mattermost/test/-/merge_requests/123Yes';
        const hostname = 'gitlab.com';
        const expected = {
            owner:'mattermost',
            repo: 'test',
            type: 'merge_requests',
            number: '123Yes'
        }

        const result = getInfoAboutLink(href, hostname);
        expect(result).toEqual(expected);
    });
});
