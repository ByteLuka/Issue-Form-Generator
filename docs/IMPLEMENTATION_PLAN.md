# Implementation Plan — Issue Form Generator

A static site (GitHub Pages) for designing [GitHub issue forms](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms)
graphically. Left: guided editor. Right: live YAML output and a GitHub-style preview.

This file is updated after every implementation step.

## Research summary

- **Issue form schema** (`.github/ISSUE_TEMPLATE/*.yml`)
  - Top level: `name`*, `description`*, `body`*, `title`, `labels`, `assignees`, `projects` (`OWNER/NUMBER`), `type`.
  - Body element types: `markdown`, `input`, `textarea`, `dropdown`, `checkboxes`, `upload`.
  - `id`: optional, `[A-Za-z0-9_-]`, unique in the form, not allowed on `markdown`.
  - `input`/`textarea`: `label`*, `description`, `placeholder`, `value`; textarea also `render` (Linguist language).
    Validations `required`, `min_length`.
  - `dropdown`: `label`*, `description`, `multiple`, `options`* (distinct strings), `default` (index; options may then not contain "None").
    Validations `required`.
  - `checkboxes`: `label`*, `description`, `options`* (`{label, required}`). Validations `required`.
  - `upload`: `label`*, `description`. Validations `required`, `accept` (comma-separated extensions).
  - `required` validations only take effect in public repositories.
- **Hosting**: GitHub Pages via the official `actions/deploy-pages` workflow. On the free plan Pages works for public repositories only.
- **Dependabot**: alerts and security updates are free for public repos (enabled in repo settings); version updates are configured with `.github/dependabot.yml`.

## Tech stack

| Concern | Choice |
| --- | --- |
| Build | Vite 8 + TypeScript 6 |
| UI | React 19 + Mantine 9 (light / dark / auto via `MantineProvider` color scheme) |
| Icons | Tabler Icons |
| State | Zustand (with `persist` middleware → localStorage auto-save) |
| Drag & drop | dnd-kit |
| YAML | `yaml` (eemeli/yaml) for both generating and importing |
| Highlighting | `@mantine/code-highlight` |
| Preview markdown | `react-markdown` |
| Quality | ESLint (typescript-eslint), Prettier, Vitest |

## Design decisions (agreed with the user)

- UI library: Mantine.
- Add flow: `+` → type picker modal → guided stepper dialog (Basics → Content/Defaults → Validation). Elements then
  appear as cards that can be edited, reordered via drag & drop, duplicated and deleted.
- YAML panel: read-only, highlighted, copy + download; separate "Import YAML" action.
- Extras: auto-save in browser, GitHub-style preview tab, starter templates, validation warnings.

## Steps

- [x] **1. Scaffold** — Vite + React + TS, Mantine, ESLint, Prettier, Vitest, scripts, `.gitignore`.
- [x] **2. Domain model** — types for form + elements, YAML serializer, YAML importer, validator, starter templates; unit tests.
- [ ] **3. State** — Zustand store with persistence (form metadata, elements CRUD, reorder, duplicate, reset, load).
- [ ] **4. App shell** — header (logo, templates, import, reset, color scheme toggle light/dark/auto, GitHub link), responsive split view.
- [ ] **5. Form settings editor** — name, description, title, labels, assignees, projects, type.
- [ ] **6. Element list** — sortable cards (dnd-kit) with edit / duplicate / delete, `+` button.
- [ ] **7. Guided add/edit dialog** — type picker + stepper per element type.
- [ ] **8. Output panel** — tabs YAML / Preview, highlighted YAML, copy, download, validation warnings.
- [ ] **9. GitHub-style preview** — render form like GitHub does.
- [ ] **10. Import YAML** — modal with paste/upload, parse errors shown.
- [ ] **11. CI/CD** — GitHub Actions: CI (lint, typecheck, test, build) + Pages deploy; Dependabot config.
- [ ] **12. Docs & polish** — README, final review, manual check in browser.

## Progress log

- **Step 1** — Vite 8, React 19, TypeScript 6.0 (typescript-eslint does not support TS 7 yet), Mantine 9, ESLint 10,
  Prettier, Vitest 5. Branch renamed `master` → `main`. Relative `base: './'` so the build works on any Pages URL.
- **Step 2** — `src/lib/`: `types.ts` (model), `elements.ts` (factories, ids, file names), `serialize.ts` (YAML output,
  empty optional keys omitted, blank line between body elements), `parse.ts` (import incl. comma-delimited lists and
  warnings for unknown keys), `validate.ts` (schema rules → errors / warnings), `templates.ts` (blank, bug,
  feature, docs). 13 unit tests incl. round-trip of all templates.
