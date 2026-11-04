# Data model

Defined in [`src/lib/types.ts`](../src/lib/types.ts). Reference for GitHub's schema:
[Syntax for issue forms](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms)
and [Syntax for GitHub's form schema](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-githubs-form-schema).

## `IssueForm`

```ts
interface IssueForm {
  settings: FormSettings; // top-level keys
  elements: FormElement[]; // `body`
}
```

### `FormSettings` → top-level keys

| Model field   | YAML key      | Type       | Required by GitHub | Notes                                 |
| ------------- | ------------- | ---------- | ------------------ | ------------------------------------- |
| `name`        | `name`        | `string`   | yes                | Must be unique across all templates   |
| `description` | `description` | `string`   | yes                |                                       |
| `title`       | `title`       | `string`   | no                 | Pre-filled issue title                |
| `labels`      | `labels`      | `string[]` | no                 | Written as a flow list `[a, b]`       |
| `assignees`   | `assignees`   | `string[]` | no                 | Leading `@` is stripped in the editor |
| `projects`    | `projects`    | `string[]` | no                 | Format `OWNER/NUMBER`                 |
| `type`        | `type`        | `string`   | no                 | Organization issue type               |

## `FormElement`

A discriminated union on `type`. Every element has a `uid` (random UUID) that exists **only inside the app**;
it is never written to YAML.

All elements except `markdown` share `FieldBase`:

| Model field   | YAML                     | Notes                                |
| ------------- | ------------------------ | ------------------------------------ |
| `id`          | `id`                     | Optional, `[A-Za-z0-9_-]`, unique    |
| `label`       | `attributes.label`       | Required                             |
| `description` | `attributes.description` | Markdown                             |
| `required`    | `validations.required`   | Only enforced in public repositories |

Type-specific fields:

| Type         | Model field   | YAML                     | Notes                                                 |
| ------------ | ------------- | ------------------------ | ----------------------------------------------------- |
| `markdown`   | `value`       | `attributes.value`       | No `id`, no validations                               |
| `input`      | `placeholder` | `attributes.placeholder` |                                                       |
|              | `value`       | `attributes.value`       | Default value                                         |
|              | `minLength`   | `validations.min_length` | `number \| null`                                      |
| `textarea`   | same as input |                          |                                                       |
|              | `render`      | `attributes.render`      | Linguist language; turns the answer into a code block |
| `dropdown`   | `options`     | `attributes.options`     | `string[]`, distinct, non-empty                       |
|              | `multiple`    | `attributes.multiple`    |                                                       |
|              | `default`     | `attributes.default`     | Index into `options` or `null`                        |
| `checkboxes` | `options`     | `attributes.options`     | `{ label: string; required: boolean }[]`              |
| `upload`     | `accept`      | `validations.accept`     | Comma-separated extensions, e.g. `.png,.jpg`          |

`FieldElement` is the union without `markdown`; `isField(element)` narrows to it.

## Creating elements

[`src/lib/elements.ts`](../src/lib/elements.ts):

| Function                              | Purpose                                                                    |
| ------------------------------------- | -------------------------------------------------------------------------- |
| `createElement(type)`                 | New element with empty defaults (dropdown/checkboxes get one empty option) |
| `duplicateElement(element, takenIds)` | Deep copy with a new `uid`; `id` gets a `-copy` suffix (made unique)       |
| `uniqueId(base, takenIds)`            | `base`, `base-2`, `base-3`, …                                              |
| `slugifyId(label)`                    | `"What happened?"` → `"what-happened"` (used to suggest ids)               |
| `suggestFileName(name)`               | `"Bug report"` → `"bug_report.yml"`                                        |
| `createEmptyForm()`                   | Blank form                                                                 |
| `ELEMENT_INFO`                        | Display name and description per type (used by the type picker)            |
