# CI/CD & deployment

## Workflows (`.github/workflows`)

| Workflow      | Trigger                       | Jobs                                                                                        |
| ------------- | ----------------------------- | ------------------------------------------------------------------------------------------- |
| `ci.yml`      | push to `main`, pull requests | Format, lint, typecheck, test, build; on PRs also commit message lint and dependency review |
| `deploy.yml`  | push to `main`, manual        | Test, build, upload `dist/`, deploy to GitHub Pages                                         |
| `release.yml` | push to `main`, manual        | release-please: maintain the release PR, create tags and GitHub releases                    |

All workflows use the Node version from `.nvmrc` and npm caching. Permissions are restricted per workflow
(`contents: read` by default; only deploy and release get write permissions).

## GitHub Pages

- The build uses `base: './'`, so the same build works for `https://<user>.github.io/` and
  `https://<user>.github.io/<repo>/`.
- `GITHUB_REPOSITORY` (set by Actions) is injected at build time and used for the GitHub link and the release
  notes link in the header. Local builds simply hide these links.
- Deployments use the official `actions/configure-pages`, `actions/upload-pages-artifact` and `actions/deploy-pages`.

## Dependabot

`.github/dependabot.yml` opens weekly (Monday) pull requests:

| Ecosystem      | Grouping                                                 | Commit prefix                     |
| -------------- | -------------------------------------------------------- | --------------------------------- |
| npm            | mantine, react, dnd-kit, lint-and-format, testing, build | `fix(deps)` / `chore(deps)` (dev) |
| GitHub Actions | all actions in one PR                                    | `ci(deps)`                        |

TypeScript major updates are ignored until `typescript-eslint` supports TypeScript 7.

## Repository settings checklist (GitHub Free)

| Setting                                                                                     | Why                                                                                              |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Repository visibility **public**                                                            | Pages, Dependabot security features, dependency review and CodeQL are free only for public repos |
| Settings → Pages → Source: **GitHub Actions**                                               | Enables the deploy workflow                                                                      |
| Settings → Actions → General → **Allow GitHub Actions to create and approve pull requests** | Needed by release-please                                                                         |
| Settings → Advanced Security → **Dependabot alerts** and **Dependabot security updates**    | Vulnerability alerts and automatic fix PRs                                                       |
| Settings → Advanced Security → **CodeQL analysis → Default setup** (optional)               | Code scanning                                                                                    |
| Settings → Branches → protect `main`, require the CI checks (optional)                      | Keeps `main` green                                                                               |
