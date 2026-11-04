# Implementation Plan — Issue Form Generator

A static site (GitHub Pages) for designing [GitHub issue forms](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms)
graphically. Left: guided editor. Right: live YAML output and a GitHub-style preview.

This file is updated after every implementation step.

## Research summary

- **Issue form schema** (`.github/ISSUE_TEMPLATE/*.yml`)
  - Top level: `name`_, `description`_, `body`*, `title`, `labels`, `assignees`, `projects` (`OWNER/NUMBER`), `type`.
  - Body element types: `markdown`, `input`, `textarea`, `dropdown`, `checkboxes`, `upload`.
  - `id`: optional, `[A-Za-z0-9_-]`, unique in the form, not allowed on `markdown`.
  - `input`/`textarea`: `label`*, `description`, `placeholder`, `value`; textarea also `render` (Linguist language).
    Validations `required`, `min_length`.
  - `dropdown`: `label`_, `description`, `multiple`, `options`_ (distinct strings), `default` (index; options may then not contain "None").
    Validations `required`.
  - `checkboxes`: `label`_, `description`, `options`_ (`{label, required}`). Validations `required`.
  - `upload`: `label`*, `description`. Validations `required`, `accept` (comma-separated extensions).
  - `required` validations only take effect in public repositories.
- **Hosting**: GitHub Pages via the official `actions/deploy-pages` workflow. On the free plan Pages works for public repositories only.
- **Dependabot**: alerts and security updates are free for public repos (enabled in repo settings); version updates are configured with `.github/dependabot.yml`.

## Tech stack

| Concern          | Choice                                                                        |
| ---------------- | ----------------------------------------------------------------------------- |
| Build            | Vite 8 + TypeScript 6                                                         |
| UI               | React 19 + Mantine 9 (light / dark / auto via `MantineProvider` color scheme) |
| Icons            | Tabler Icons                                                                  |
| State            | Zustand (with `persist` middleware → localStorage auto-save)                  |
| Drag & drop      | dnd-kit                                                                       |
| YAML             | `yaml` (eemeli/yaml) for both generating and importing                        |
| Highlighting     | `@mantine/code-highlight`                                                     |
| Preview markdown | `react-markdown`                                                              |
| Quality          | ESLint (typescript-eslint), Prettier, Vitest                                  |

## Design decisions (agreed with the user)

- UI library: Mantine.
- Add flow: `+` → type picker modal → guided stepper dialog (Basics → Content/Defaults → Validation). Elements then
  appear as cards that can be edited, reordered via drag & drop, duplicated and deleted.
- YAML panel: read-only, highlighted, copy + download; separate "Import YAML" action.
- Extras: auto-save in browser, GitHub-style preview tab, starter templates, validation warnings.

## Steps

- [x] **1. Scaffold** — Vite + React + TS, Mantine, ESLint, Prettier, Vitest, scripts, `.gitignore`.
- [x] **2. Domain model** — types for form + elements, YAML serializer, YAML importer, validator, starter templates; unit tests.
- [x] **3. State** — Zustand store with persistence (form metadata, elements CRUD, reorder, duplicate, reset, load).
- [x] **4. App shell** — header (logo, templates, import, reset, color scheme toggle light/dark/auto, GitHub link), responsive split view.
- [x] **5. Form settings editor** — name, description, title, labels, assignees, projects, type.
- [x] **6. Element list** — sortable cards (dnd-kit) with edit / duplicate / delete, `+` button.
- [x] **7. Guided add/edit dialog** — type picker + stepper per element type.
- [x] **8. Output panel** — tabs YAML / Preview, highlighted YAML, copy, download, validation warnings.
- [x] **9. GitHub-style preview** — render form like GitHub does.
- [x] **10. Import YAML** — modal with paste/upload, parse errors shown.
- [x] **11. CI/CD** — GitHub Actions: CI (lint, typecheck, test, build) + Pages deploy; Dependabot config.
- [x] **12. Docs & polish** — README, final review, manual check in browser.
- [x] **13. Semantic versioning** — Conventional Commits (commitlint + husky + CI), release-please, CHANGELOG, version in UI.
- [x] **14. Developer documentation** — `docs/` folder with architecture, model, YAML, state, UI, development, releasing, deployment.

## Progress log

- **Step 1** — Vite 8, React 19, TypeScript 6.0 (typescript-eslint does not support TS 7 yet), Mantine 9, ESLint 10,
  Prettier, Vitest 5. Branch renamed `master` → `main`. Relative `base: './'` so the build works on any Pages URL.
- **Step 2** — `src/lib/`: `types.ts` (model), `elements.ts` (factories, ids, file names), `serialize.ts` (YAML output,
  empty optional keys omitted, blank line between body elements), `parse.ts` (import incl. comma-delimited lists and
  warnings for unknown keys), `validate.ts` (schema rules → errors / warnings), `templates.ts` (blank, bug,
  feature, docs). 13 unit tests incl. round-trip of all templates.
- **Step 3** — `src/store/formStore.ts` (Zustand + `persist` → localStorage key `issue-form-generator:form`),
  `src/store/hooks.ts` (`useIssueForm`, memoized `useValidation`).
- **Step 4** — `AppShell` header with templates menu, import, clear, light/dark/system toggle (Mantine persists the
  choice) and a GitHub link (repo URL injected at build time from `GITHUB_REPOSITORY`). Desktop uses Mantine's
  resizable `Splitter`; below 62em a segmented control switches between editor and output. Header buttons become
  icon-only below 48em.
- **Step 5** — `FormSettingsEditor`: name, description, title, labels (tags), plus collapsible assignees, projects,
  issue type.
- **Step 6** — `ElementList` / `ElementCard`: dnd-kit sortable cards with badges (type, required, multiple, render),
  inline validation indicator, edit / insert below / duplicate / delete (with Undo notification).
- **Step 7** — `TypePickerModal` + `ElementDialog` with Mantine `Stepper`. Steps per type (`stepConfig.ts`); new
  elements must pass each step, existing ones can jump and save anytime. Id is derived from the label until edited.
  Option lists support Enter-to-add. Live "YAML for this element" accordion.
- **Step 8** — `OutputPanel`: YAML/Preview tabs, copy, download (`<slug>.yml`), highlighted YAML with line numbers
  (highlight.js, custom GitHub-like token colors for both schemes), `ValidationSummary` (click an issue to scroll to the
  element). Vendor code split into `react` / `mantine` / `vendor` chunks.
- **Step 9** — `FormPreview`: template chooser card, labels/type/assignees, title, and every element rendered like on
  GitHub (Markdown via react-markdown + remark-gfm).
- **Step 10** — `ImportModal`: paste or upload, errors inline, warnings in a notification, confirmation before
  replacing a non-empty form.
- **Step 11** — `.github/workflows/ci.yml` (format, lint, typecheck, test, build + dependency review on PRs),
  `.github/workflows/deploy.yml` (Pages via `actions/deploy-pages`), `.github/dependabot.yml` (weekly grouped npm and
  Actions updates; TypeScript majors ignored until typescript-eslint supports TS 7).
- **Step 12** — README. Verified in headless Chromium (light, dark, mobile): template load, full add-dropdown flow,
  preview, reload persistence, import with warnings, delete + undo; no console errors.
  Known: `npm audit` reports a moderate `minimatch` advisory in ESLint dev tooling only (not shipped); the only
  automatic fix downgrades ESLint, so it is left for Dependabot.

- **Step 13** — SemVer via release-please (`release-please-config.json`, `.release-please-manifest.json`,
  `.github/workflows/release.yml`), starting at 1.0.0 with a hand-written `CHANGELOG.md` entry and local tag `v1.0.0`.
  Conventional Commits enforced by husky `commit-msg` hook + commitlint, and in CI (PR commits and PR title).
  Dependabot uses `fix(deps)` (runtime → patch release) / `chore(deps)` (dev → no release) / `ci(deps)`.
  Version injected at build time (`__APP_VERSION__`) and shown as a badge in the header, linking to the release.
- **Step 14** — `docs/`: index, architecture (with Mermaid diagram), data model, YAML generation/import/validation,
  state & persistence, UI components, development guide (incl. "add a new element type" checklist), releasing,
  CI/CD & deployment. `CONTRIBUTING.md` added; README links to the docs.

## Possible next steps

- Editor for `config.yml` (template chooser: `blank_issues_enabled`, `contact_links`).
- Manage several templates at once and download them as a zip.
- Shareable link that encodes the form in the URL.
- Component tests for the dialog flow.
