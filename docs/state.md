# State & persistence

## Store — [`src/store/formStore.ts`](../src/store/formStore.ts)

A single [Zustand](https://zustand.docs.pmnd.rs) store holds the `IssueForm` (`settings` + `elements`) and its actions.

| Action                        | Effect                                         |
| ----------------------------- | ---------------------------------------------- |
| `updateSettings(patch)`       | Shallow-merges into `settings`                 |
| `addElement(element, index?)` | Inserts at `index` (default: end)              |
| `updateElement(element)`      | Replaces the element with the same `uid`       |
| `removeElement(uid)`          | Removes the element                            |
| `duplicateElement(uid)`       | Inserts a copy (unique `id`) directly below    |
| `moveElement(from, to)`       | Reorders (used by drag & drop)                 |
| `loadForm(form)`              | Replaces everything (templates, import, clear) |

All updates are immutable, so components and `useMemo` can rely on reference equality.

## Hooks — [`src/store/hooks.ts`](../src/store/hooks.ts)

| Hook               | Returns                                                                      |
| ------------------ | ---------------------------------------------------------------------------- |
| `useIssueForm()`   | `{ settings, elements }`, shallow-compared (re-renders only on real changes) |
| `useValidation()`  | `validateForm(form)`, memoized per form                                      |
| `useIsFormEmpty()` | `true` if there is nothing to lose (used to skip confirmation dialogs)       |

Components that need only one slice select it directly, e.g. `useFormStore((s) => s.settings)`.
Actions can be read without subscribing via `useFormStore.getState()`.

## Persistence

The `persist` middleware saves `settings` and `elements` to `localStorage` on every change.

| Setting      | Value                                 |
| ------------ | ------------------------------------- |
| Key          | `issue-form-generator:form`           |
| Version      | `1`                                   |
| Stored parts | `settings`, `elements` (no functions) |

The color scheme is stored separately by Mantine (`mantine-color-scheme-value`).

### Changing the model

If `FormSettings` or an element type changes in a way that old saved data no longer fits:

1. Increase `version` in the `persist` options.
2. Add a `migrate(persistedState, version)` function that converts older data.
3. Add a test for the migration.

Without this, users with older saved data could see broken forms after a deployment.
