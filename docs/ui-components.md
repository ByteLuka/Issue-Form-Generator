# UI components

All components use [Mantine](https://mantine.dev). Icons come from [Tabler Icons](https://tabler.io/icons).

## Component tree

```
main.tsx
└── MantineProvider (defaultColorScheme="auto")
    └── CodeHighlightAdapterProvider (highlight.js, YAML only)
        └── ModalsProvider + Notifications
            └── App
                ├── Header
                │   ├── NewTemplateMenu     → addTemplate(starter.create())
                │   ├── Import button       → ImportModal (forms → new templates, config.yml → replaces config)
                │   ├── Clear button        → confirm → resetWorkspace()
                │   ├── ColorSchemeToggle
                │   └── GitHub link / version badge
                └── Splitter (desktop ≥ 62em) | SegmentedControl tabs (mobile)
                    ├── Editor
                    │   ├── TemplateTabs        (one tab per template + config.yml, new/duplicate/delete)
                    │   └── template open:      FormSettingsEditor + ElementList
                    │       ├── ElementCard × n   (dnd-kit sortable)
                    │       ├── TypePickerModal
                    │       └── ElementDialog     (Stepper + step components)
                    │     config.yml open:      ConfigEditor
                    └── OutputPanel
                        ├── ValidationSummary
                        ├── CodeHighlight      (YAML tab)
                        ├── FormPreview        (Preview tab, template)
                        └── ChooserPreview     (Preview tab, config.yml)
```

## Components

### App shell

| Component           | File                                   | Responsibility                                                          |
| ------------------- | -------------------------------------- | ----------------------------------------------------------------------- |
| `App`               | `src/App.tsx`                          | Responsive layout: resizable split view or tab switch on small screens  |
| `Header`            | `src/components/Header.tsx`            | New template, import, clear workspace, theme toggle, version, repo link |
| `NewTemplateMenu`   | `src/components/NewTemplateMenu.tsx`   | Menu with blank form and starter templates (used in header and tabs)    |
| `ColorSchemeToggle` | `src/components/ColorSchemeToggle.tsx` | Light / dark / system switch (`useMantineColorScheme`)                  |
| `ImportModal`       | `src/components/ImportModal.tsx`       | Paste or upload several files; detects issue forms and config.yml       |
| `Markdown`          | `src/components/Markdown.tsx`          | `react-markdown` + GFM inside Mantine `Typography`; no raw HTML         |

### Editor (`src/components/editor`)

| Component            | Responsibility                                                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `Editor`             | Left side: tabs on top, scrollable editor of the open template or config.yml below                                                        |
| `TemplateTabs`       | Tabs for all templates and config.yml with error dots; new, duplicate and delete template                                                 |
| `FormSettingsEditor` | Top-level keys and file name; assignees/projects/type in a collapsible section                                                            |
| `ElementList`        | Sortable list, empty state, _Add element_ button, dialog state machine, delete with undo                                                  |
| `ElementCard`        | One element: drag handle, type badge, summary, issue indicator, actions                                                                   |
| `TypePickerModal`    | First step of adding: choose the element type                                                                                             |
| `ElementDialog`      | Guided configuration on a draft copy; Stepper navigation; live YAML snippet                                                               |
| `stepConfig.ts`      | `stepsFor(element)` (which steps a type has) and `stepErrors(element, takenIds)` (blocking errors)                                        |
| `steps.tsx`          | Step components: `MarkdownStep`, `BasicsStep`, `ContentStep`, `DropdownOptionsStep`, `CheckboxOptionsStep`, `FilesStep`, `ValidationStep` |
| `ConfigEditor`       | config.yml: blank issues switch, contact links (add, edit, reorder, remove)                                                               |

`ElementList` keeps a small state machine for the dialogs:

```
null ──(+ / insert below)──▶ { mode: 'pick', index }
{ mode: 'pick' } ──(type chosen)──▶ { mode: 'add', element, index }
null ──(edit)──▶ { mode: 'edit', element }
add / edit ──(save / cancel)──▶ null
```

Steps per element type:

| Type         | Steps                            |
| ------------ | -------------------------------- |
| `markdown`   | Content                          |
| `input`      | Basics → Defaults → Validation   |
| `textarea`   | Basics → Defaults → Validation   |
| `dropdown`   | Basics → Options → Validation    |
| `checkboxes` | Basics → Options → Validation    |
| `upload`     | Basics → File types → Validation |

New elements must pass each step before moving on; existing elements can jump to any step and save anytime.
In `BasicsStep` the `id` follows the label (`slugifyId`) until the user edits the id manually.

### Output (`src/components/output`)

| Component           | Responsibility                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------- |
| `OutputPanel`       | Tabs, copy, download menu (single file or all files as zip), file path hint, memoized YAML  |
| `ValidationSummary` | Error/warning counts, expandable list; clicking an issue scrolls to its card                |
| `FormPreview`       | Interactive approximation of GitHub's issue form (inputs are not saved)                     |
| `ChooserPreview`    | GitHub's "new issue" page: templates sorted by file name, contact links, blank issue option |

## Styling

- Theme: [`src/theme.ts`](../src/theme.ts) (GitHub-like system font stack, rounded corners).
- Global CSS: [`src/styles.css`](../src/styles.css) — full-height layout, card flash animation, type picker hover,
  YAML token colors for light and dark scheme (`--hl-*` variables).
- `MONO_INPUT` (`src/components/inputStyles.ts`) sets a monospace font on the input only, not on its label and
  description.
- Prefer Mantine props (`c`, `fw`, `p`, …) and CSS variables like `var(--mantine-color-default-border)` over custom
  CSS so both color schemes work automatically.
