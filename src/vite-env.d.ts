/// <reference types="vite/client" />

/** URL of the GitHub repository, empty when built outside GitHub Actions. */
declare const __REPO_URL__: string;

/** App version from package.json (semantic versioning, managed by release-please). */
declare const __APP_VERSION__: string;
