// Commit messages must follow Conventional Commits (https://www.conventionalcommits.org).
// release-please reads them to decide the next version and to write CHANGELOG.md.
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Allow long lines in the body, e.g. URLs and Co-Authored-By trailers.
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
  },
};
