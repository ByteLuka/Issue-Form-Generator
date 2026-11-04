# YAML generation, import & validation

All of this lives in `src/lib` and consists of pure functions without React.

## Generation — [`serialize.ts`](../src/lib/serialize.ts)

| Function                 | Returns                                                 |
| ------------------------ | ------------------------------------------------------- |
| `formToPlain(form)`      | Plain JS object as GitHub expects it (useful for tests) |
| `formToYaml(form)`       | YAML string of the whole form                           |
| `elementToYaml(element)` | YAML of one body element (used in the element dialog)   |

Output rules:

- **Key order**: `name`, `description`, `title`, `labels`, `projects`, `assignees`, `type`, `body`.
  Inside elements: `type`, `id`, `attributes`, `validations`.
- **Empty optional values are omitted**: empty strings, empty lists, `false` booleans, empty `validations`.
  `name`, `description`, `label` and markdown `value` are always written, even if empty, so the gap is visible.
- `id`, `type`, `render` are trimmed; whitespace is removed from `accept`.
- A dropdown `default` of `0` is kept (it is a valid index).
- `labels`, `projects` and `assignees` are written as flow lists (`[bug, triage]`).
- Multi-line strings use block literals (`|-`), lines are never wrapped (`lineWidth: 0`).
- Strings that need quoting (e.g. starting with `#` or containing `: `) are quoted automatically by the `yaml` library.
- An empty line separates body elements for readability.

## Files and zip — [`workspace.ts`](../src/lib/workspace.ts)

| Function                       | Returns                                                                                 |
| ------------------------------ | --------------------------------------------------------------------------------------- |
| `templateFileNames(templates)` | File name per template (see [data model](data-model.md#file-names))                     |
| `workspaceFiles(workspace)`    | `{ path, content }[]` under `.github/ISSUE_TEMPLATE/`; `config.yml` only if not default |
| `buildZip(workspace)`          | `Promise<Blob>` of all files; JSZip is imported dynamically on first use                |

## Import — [`parse.ts`](../src/lib/parse.ts)

| Function               | Returns                                                                      |
| ---------------------- | ---------------------------------------------------------------------------- |
| `parseImport(source)`  | `{ kind: 'form', form, warnings }` or `{ kind: 'config', config, warnings }` |
| `yamlToForm(source)`   | `{ form, warnings }` for an issue form                                       |
| `yamlToConfig(source)` | `{ config, warnings }` for a `config.yml`                                    |

`parseImport` treats a file as `config.yml` when it has no `body` but `blank_issues_enabled` or `contact_links`.
All functions throw `ImportError` for unusable input.

Throws when:

- the YAML cannot be parsed,
- the root is not a map,
- `body` exists but is not a list,
- `contact_links` exists but is not a list.

Lenient behavior (each produces a warning where something is dropped):

- `labels`, `assignees`, `projects` accept both lists and comma-delimited strings (as GitHub does).
- Unknown top-level or element keys are ignored → warning.
- Body items that are not maps or have an unsupported `type` are skipped → warning.
- `required` is only `true` if the YAML value is literally `true`.
- `min_length` / `default` are kept only if they are non-negative integers.
- Checkbox options given as plain strings are converted to `{ label, required: false }`.

- A missing `blank_issues_enabled` means enabled, as on GitHub.
- Unknown keys in `config.yml` and its contact links are ignored → warning.

New `uid`s are generated for every imported element and contact link.

## Validation — [`validate.ts`](../src/lib/validate.ts)

| Function                       | Checks                                                                    |
| ------------------------------ | ------------------------------------------------------------------------- |
| `validateForm(form)`           | One issue form                                                            |
| `validateConfig(config)`       | `config.yml`                                                              |
| `validateWorkspace(workspace)` | All of the above plus rules across templates; sets `scope` on every issue |

All return `ValidationIssue[]`:

```ts
interface ValidationIssue {
  level: 'error' | 'warning'; // error = GitHub rejects the template, warning = likely mistake
  message: string;
  elementUid?: string; // element or contact link; undefined for file-level issues
  scope?: string; // template uid or CONFIG_SCOPE ('config'), set by validateWorkspace
}
```

The UI runs `validateWorkspace` once per change and filters by `scope`.

| Level   | Rule                                                               |
| ------- | ------------------------------------------------------------------ |
| error   | `name` is empty                                                    |
| error   | `description` is empty                                             |
| error   | A project is not in `OWNER/NUMBER` format                          |
| error   | The body has no non-markdown element                               |
| error   | A markdown element has no content                                  |
| error   | A field has no label                                               |
| error   | Two fields have the same label                                     |
| error   | An `id` contains characters other than letters, digits, `-`, `_`   |
| error   | Two fields have the same `id`                                      |
| error   | `minLength` is negative                                            |
| error   | Dropdown: no options, empty options, or duplicate options          |
| error   | Dropdown: `default` points to a non-existing option                |
| error   | Dropdown: `default` is set and options contain "None" or "n/a"     |
| error   | Checkboxes: no options or an empty option label                    |
| error   | Upload: an `accept` entry is not an extension (e.g. missing dot)   |
| warning | Upload: an extension GitHub does not support (`UPLOAD_EXTENSIONS`) |
| warning | A field has no `id`                                                |

The element dialog additionally blocks _Next_/_Save_ for the subset of rules that concern the current step
([`stepConfig.ts`](../src/components/editor/stepConfig.ts) → `stepErrors`).

## Tests

- [`src/lib/lib.test.ts`](../src/lib/lib.test.ts): omission of empty keys, multi-line output, quoting, round-trips
  (`formToYaml` → `yamlToForm`) of every starter template, lenient import, import errors and validation rules.
- [`src/lib/workspace.test.ts`](../src/lib/workspace.test.ts): file names, exported files, zip content, `config.yml`
  generation/import/validation, import detection and workspace-wide validation.
