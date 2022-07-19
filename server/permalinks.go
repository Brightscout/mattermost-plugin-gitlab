package main

import (
	"context"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/xanzy/go-gitlab"
)

// maxPermalinkReplacements sets the maximum limit to the number of
// permalink replacements that can be performed on a single message.
const maxPermalinkReplacements = 10

const permalinkReqTimeout = 5 * time.Second

// maxPreviewLines sets the maximum number of preview lines that will be shown
// while replacing a permalink.
const maxPreviewLines = 10

// permalinkLineContext shows the number of lines before and after to show
// if the link points to a single line.
const permalinkLineContext = 3

// replacement holds necessary info to replace GitLab permalinks
// in messages with a code preview block.
type replacement struct {
	index         int      // index of the permalink in the string
	word          string   // the permalink
	permalinkInfo
}

type permalinkInfo struct { // holds the necessary metadata of a permalink
	haswww string
	commit string
	user   string
	repo   string
	path   string
	line   string
}

// getPermalinkReplacements returns the permalink replacements that need to be performed
// on a message. The returned slice is sorted by the index in ascending order.
func (p *Plugin) getPermalinkReplacements(msg string) []replacement {
	// find the permalinks from the msg using a regex
	matches := gitlabPermalinkRegex.FindAllStringSubmatch(msg, -1)
	indices := gitlabPermalinkRegex.FindAllStringIndex(msg, -1)
	var replacements []replacement
	for i, m := range matches {
		// have a limit on the number of replacements to do
		if i > maxPermalinkReplacements {
			break
		}
		word := m[0]
		index := indices[i][0]
		r := replacement{
			index: index,
			word:  word,
		}
		// ignore if the word is inside a link
		if isInsideLink(msg, index) {
			continue
		}
		// populate the permalinkInfo with the extracted groups of the regex
		for j, name := range gitlabPermalinkRegex.SubexpNames() {
			if j == 0 {
				continue
			}
			switch name {
			case "haswww":
				r.permalinkInfo.haswww = m[j]
			case "user":
				r.permalinkInfo.user = m[j]
			case "repo":
				r.permalinkInfo.repo = m[j]
			case "commit":
				r.permalinkInfo.commit = m[j]
			case "path":
				r.permalinkInfo.path = m[j]
			case "line":
				r.permalinkInfo.line = m[j]
			}
		}
		replacements = append(replacements, r)
	}
	return replacements
}

// makeReplacements performs the given replacements on the msg and returns
// the new msg. The replacements slice needs to be sorted by the index in ascending order.
func (p *Plugin) makeReplacements(msg string, replacements []replacement, glClient *gitlab.Client) string {
	// iterating the slice in reverse to preserve the replacement indices.
	for i := len(replacements) - 1; i >= 0; i-- {
		r := replacements[i]
		// quick bailout if the commit hash is not proper.
		if _, err := hex.DecodeString(r.permalinkInfo.commit); err != nil {
			p.API.LogDebug("bad git commit hash in permalink", "error", err.Error(), "hash", r.permalinkInfo.commit)
			continue
		}

		// get the file contents
		opts := gitlab.GetFileOptions{
			Ref: &r.permalinkInfo.commit,
		}
		projectPath := fmt.Sprintf("%s/%s", r.permalinkInfo.user, r.permalinkInfo.repo)
		// TODO: make all of these requests concurrently.
		_, cancel := context.WithTimeout(context.Background(), permalinkReqTimeout)
		file, _, err := glClient.RepositoryFiles.GetFile(projectPath, r.permalinkInfo.path, &opts)
		defer cancel()
		if err != nil {
			p.API.LogDebug("error while fetching file contents", "error", err.Error(), "path", r.permalinkInfo.path)
			continue
		}
		// if this is not a file, ignore.
		if file == nil {
			p.API.LogWarn("permalink is not a file", "file", r.permalinkInfo.path)
			continue
		}
		decoded, err := base64.StdEncoding.DecodeString(file.Content)
		if err != nil {
			p.API.LogDebug("error while decoding file contents", "error", err.Error(), "path", r.permalinkInfo.path)
			continue
		}

		// get the required lines.
		start, end := getLineNumbers(r.permalinkInfo.line)
		// bad anchor tag, ignore.
		if start == -1 || end == -1 {
			continue
		}
		isTruncated := false
		if end-start > maxPreviewLines {
			end = start + maxPreviewLines
			isTruncated = true
		}
		lines, err := filterLines(string(decoded), start, end)
		if err != nil {
			p.API.LogDebug("error while filtering lines", "error", err.Error(), "path", r.permalinkInfo.path)
		}
		if lines == "" {
			p.API.LogDebug("line numbers out of range. Skipping.", "file", r.permalinkInfo.path, "start", start, "end", end)
			continue
		}
		final := getCodeMarkdown(r.permalinkInfo.user, r.permalinkInfo.repo, r.permalinkInfo.path, r.word, lines, isTruncated)

		// replace word in msg starting from r.index only once.
		msg = msg[:r.index] + strings.Replace(msg[r.index:], r.word, final, 1)
	}
	return msg
}
