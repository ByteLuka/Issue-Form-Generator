# YAML generation, import & validation

All three live in `src/lib` and are pure functions without React.

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

## Import — [`parse.ts`](../src/lib/parse.ts)

`yamlToForm(source)` returns `{ form, warnings }` or throws `ImportError`.

Throws when:

- the YAML cannot be parsed,
- the root is not a map,
- `body` exists but is not a list.

Lenient behavior (each produces a warning where something is dropped):

- `labels`, `assignees`, `projects` accept both lists and comma-delimited strings (as GitHub does).
- Unknown top-level or element keys are ignored → warning.
- Body items that are not maps or have an unsupported `type` are skipped → warning.
- `required` is only `true` if the YAML value is literally `true`.
- `min_length` / `default` are kept only if they are non-negative integers.
- Checkbox options given as plain strings are converted to `{ label, required: false }`.

New `uid`s are generated for every imported element.

## Validation — [`validate.ts`](../src/lib/validate.ts)

`validateForm(form)` returns `ValidationIssue[]`:

```ts
interface ValidationIssue {
  level: 'error' | 'warning'; // error = GitHub rejects the template, warning = likely mistake
  message: string;
  elementUid?: string; // undefined for form-level issues
}
```

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

[`src/lib/lib.test.ts`](../src/lib/lib.test.ts) covers omission of empty keys, multi-line output, quoting,
round-trips (`formToYaml` → `yamlToForm`) of every starter template, lenient import, import errors and the
validation rules.
