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
                │   ├── Templates menu      → confirm → loadForm(template.create())
                │   ├── Import button       → ImportModal
                │   ├── Clear button        → confirm → loadForm(createEmptyForm())
                │   ├── ColorSchemeToggle
                │   └── GitHub link / version badge
                └── Splitter (desktop ≥ 62em) | SegmentedControl tabs (mobile)
                    ├── Editor
                    │   ├── FormSettingsEditor
                    │   └── ElementList
                    │       ├── ElementCard × n   (dnd-kit sortable)
                    │       ├── TypePickerModal
                    │       └── ElementDialog     (Stepper + step components)
                    └── OutputPanel
                        ├── ValidationSummary
                        ├── CodeHighlight (YAML tab)
                        └── FormPreview  (Preview tab)
```

## Components

### App shell

| Component           | File                                   | Responsibility                                                         |
| ------------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| `App`               | `src/App.tsx`                          | Responsive layout: resizable split view or tab switch on small screens |
| `Header`            | `src/components/Header.tsx`            | Templates, import, clear, theme toggle, version, repository link       |
| `ColorSchemeToggle` | `src/components/ColorSchemeToggle.tsx` | Light / dark / system switch (`useMantineColorScheme`)                 |
| `ImportModal`       | `src/components/ImportModal.tsx`       | Paste or upload YAML, shows `ImportError`, reports warnings            |
| `Markdown`          | `src/components/Markdown.tsx`          | `react-markdown` + GFM inside Mantine `Typography`; no raw HTML        |

### Editor (`src/components/editor`)

| Component            | Responsibility                                                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `Editor`             | Container for the left side                                                                                                               |
| `FormSettingsEditor` | Top-level keys; assignees/projects/type in a collapsible section                                                                          |
| `ElementList`        | Sortable list, empty state, _Add element_ button, dialog state machine, delete with undo                                                  |
| `ElementCard`        | One element: drag handle, type badge, summary, issue indicator, actions                                                                   |
| `TypePickerModal`    | First step of adding: choose the element type                                                                                             |
| `ElementDialog`      | Guided configuration on a draft copy; Stepper navigation; live YAML snippet                                                               |
| `stepConfig.ts`      | `stepsFor(element)` (which steps a type has) and `stepErrors(element, takenIds)` (blocking errors)                                        |
| `steps.tsx`          | Step components: `MarkdownStep`, `BasicsStep`, `ContentStep`, `DropdownOptionsStep`, `CheckboxOptionsStep`, `FilesStep`, `ValidationStep` |

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

| Component           | Responsibility                                                                       |
| ------------------- | ------------------------------------------------------------------------------------ |
| `OutputPanel`       | Tabs, copy and download buttons, file name hint, memoized YAML                       |
| `ValidationSummary` | Error/warning counts, expandable list; clicking an element issue scrolls to its card |
| `FormPreview`       | Interactive approximation of GitHub's issue form (inputs are not saved)              |

## Styling

- Theme: [`src/theme.ts`](../src/theme.ts) (GitHub-like system font stack, rounded corners).
- Global CSS: [`src/styles.css`](../src/styles.css) — full-height layout, card flash animation, type picker hover,
  YAML token colors for light and dark scheme (`--hl-*` variables).
- Prefer Mantine props (`c`, `fw`, `p`, …) and CSS variables like `var(--mantine-color-default-border)` over custom
  CSS so both color schemes work automatically.
