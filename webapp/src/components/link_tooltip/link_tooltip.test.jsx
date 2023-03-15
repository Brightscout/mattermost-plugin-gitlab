import {getInfoAboutLink} from './link_tooltip'

describe("getInfoAboutLink", () => {

    it("should return the correct owner, repo, type, and number when given a valid GitLab href and hostname with all required information", () => {
      const href = "https://gitlab.com/mattermost/test/-/merge_requests/123";
      const hostname = "gitlab.com";
      const expected = ["mattermost", "test", "merge_requests", "123"];
      
      const result = getInfoAboutLink(href, hostname);
  
      expect(result).toEqual(expected);
    });

    it("should return the correct owner, repo, type, and undefined number when given a valid GitLab href and hostname missing the number", () => {
      const href = "https://gitlab.com/mattermost/test/-/merge_requests";
      const hostname = "gitlab.com";
      const expected = ["mattermost", "test", "merge_requests", undefined];
  
      const result = getInfoAboutLink(href, hostname);
  
      expect(result).toEqual(expected);
    });
  
    it("should return the correct owner, repo, undefined type, and number when given a valid GitLab href and hostname missing the type", () => {
      const href = "https://gitlab.com/mattermost/test/123";
      const hostname = "gitlab.com";
      const expected = ["mattermost", "test", undefined, undefined];
  
      const result = getInfoAboutLink(href, hostname);
  
      expect(result).toEqual(expected);
    });
  
    it("should return an array of empty strings when given a valid href and empty hostname", () => {
      const href = "https://gitlab.com/mattermost/test/-/merge_requests/123";
      const hostname = "";
      const expected = ["", undefined, undefined, undefined];
  
      const result = getInfoAboutLink(href, hostname);
  
      expect(result).toEqual(expected);
    });
});
