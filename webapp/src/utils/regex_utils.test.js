import {validateGitlabURL} from './regex_utils';

describe("validateGitlabURL", () => {
    it("should return true for valid GitLab repository URL", () => {
      const URL = "https://gitlab.com/username/repo/-/merge_requests/1234";
      expect(validateGitlabURL(URL)).toBe(true);
    });
  
    it("should return false for invalid GitLab repository URL", () => {
      const URL = "https://github.com/username/repo";
      expect(validateGitlabURL(URL)).toBe(false);
    });
  
    it("should return false for non-URL string input", () => {
      const URL = "not a URL";
      expect(validateGitlabURL(URL)).toBe(false);
    });
});
