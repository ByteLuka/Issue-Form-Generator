# Issue Form Generator

Design [GitHub issue forms](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms)
with a graphical editor and get the YAML as you type. Runs entirely in the browser as a static site on GitHub Pages.

## Features

- **Split view**: guided editor on the left, live YAML and a GitHub-style preview on the right (resizable).
- **Guided element creation**: click **Add element**, pick a type, then configure it step by step
  (Basics → Defaults / Options / File types → Validation).
- All element types: `markdown`, `input`, `textarea`, `dropdown`, `checkboxes`, `upload`,
  plus all top-level keys (`name`, `description`, `title`, `labels`, `assignees`, `projects`, `type`).
- Drag & drop reordering, duplicate, delete with undo.
- **Validation** against GitHub's form schema (duplicate ids, missing labels, dropdown defaults with "None", …).
- **Import** existing templates (paste or upload).
- **Starter templates**: bug report, feature request, documentation.
- **Auto-save** in the browser (localStorage). Nothing is sent to a server.
- Light, dark and system color scheme.
- Copy or download the YAML; the suggested path is `.github/ISSUE_TEMPLATE/<name>.yml`.

## Tech stack

[React](https://react.dev) · [TypeScript](https://www.typescriptlang.org) · [Vite](https://vite.dev) ·
[Mantine](https://mantine.dev) · [Zustand](https://zustand.docs.pmnd.rs) · [dnd-kit](https://dndkit.com) ·
[yaml](https://eemeli.org/yaml) · [Vitest](https://vitest.dev)

## Development

Requires Node.js (version in [`.nvmrc`](.nvmrc)).

```bash
npm install
npm run dev          # start dev server
npm test             # unit tests
npm run lint         # ESLint
npm run typecheck    # TypeScript
npm run format       # Prettier
npm run build        # production build in dist/
```

Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org) (checked by a git hook and
in CI), because they determine the next version. See [CONTRIBUTING.md](CONTRIBUTING.md).

### Project structure

```
src/
├── lib/              # framework-free logic: model, YAML generation/import, validation, templates
├── store/            # Zustand store (persisted to localStorage) and hooks
├── components/
│   ├── editor/       # form settings, element list, type picker, step-by-step element dialog
│   └── output/       # YAML view, preview, validation summary
├── App.tsx           # layout (split view / mobile tabs)
└── main.tsx          # providers (Mantine, modals, notifications, code highlighting)
```

## Documentation

Detailed developer documentation lives in [`docs/`](docs/README.md): architecture, data model, YAML generation and
validation, state, UI components, development guide, releasing and deployment.

## Versioning

The project uses [Semantic Versioning](https://semver.org). Releases are automated with
[release-please](https://github.com/googleapis/release-please): it derives the next version from Conventional
Commits, maintains a release pull request with the updated [CHANGELOG.md](CHANGELOG.md), and creates the tag and
GitHub release when that pull request is merged. Details: [docs/releasing.md](docs/releasing.md).

## Deployment (GitHub Pages)

The workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and deploys on every push to `main`.

One-time setup in the repository settings:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. On the GitHub Free plan, Pages is only available for **public** repositories.
3. **Settings → Actions → General → Allow GitHub Actions to create and approve pull requests** (for release-please).

The build uses relative asset paths, so it works for both `<user>.github.io` and `<user>.github.io/<repo>`.

## Security & dependency updates

- [`.github/dependabot.yml`](.github/dependabot.yml) opens weekly, grouped update PRs for npm packages and GitHub Actions.
- Enable **Dependabot alerts** and **Dependabot security updates** in **Settings → Advanced Security**
  (free for public repositories).
- Optional: enable **CodeQL → Default setup** in the same place for code scanning (free for public repositories).
- Pull requests run CI (format, lint, typecheck, tests, build), a commit message check and a dependency review.

See [docs/deployment.md](docs/deployment.md) for the full settings checklist.
