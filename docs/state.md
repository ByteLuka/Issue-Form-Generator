# State & persistence

## Store — [`src/store/workspaceStore.ts`](../src/store/workspaceStore.ts)

A single [Zustand](https://zustand.docs.pmnd.rs) store holds the workspace and its actions:

```ts
interface WorkspaceData {
  templates: Template[];
  config: ChooserConfig;
  activeId: string; // uid of the open template, or CONFIG_TAB ('config')
}
```

### Templates

| Action                   | Effect                                                                                        |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| `setActive(id)`          | Opens a template or `config.yml` (`CONFIG_TAB`)                                               |
| `addTemplate(form?)`     | Adds a template after the active one and opens it; replaces the active one if it is untouched |
| `duplicateTemplate(uid)` | Copy with new uids and the name suffix "(copy)", inserted below and opened                    |
| `removeTemplate(uid)`    | Removes it and opens a neighbour; there is always at least one template                       |
| `resetWorkspace()`       | One blank template and the default config                                                     |

### Active template

These actions change the active template only and do nothing while `config.yml` is open:

| Action                        | Effect                                      |
| ----------------------------- | ------------------------------------------- |
| `updateSettings(patch)`       | Shallow-merges into `settings`              |
| `setFileName(name)`           | Sets the custom file name (`''` = derived)  |
| `addElement(element, index?)` | Inserts at `index` (default: end)           |
| `updateElement(element)`      | Replaces the element with the same `uid`    |
| `removeElement(uid)`          | Removes the element                         |
| `duplicateElement(uid)`       | Inserts a copy (unique `id`) directly below |
| `moveElement(from, to)`       | Reorders (used by drag & drop)              |

### config.yml

| Action                | Effect                                                         |
| --------------------- | -------------------------------------------------------------- |
| `updateConfig(patch)` | Shallow-merges into `config` (e.g. a new `contactLinks` array) |

All updates are immutable, so components and `useMemo` can rely on reference equality.

## Hooks — [`src/store/hooks.ts`](../src/store/hooks.ts)

| Hook                       | Returns                                                                        |
| -------------------------- | ------------------------------------------------------------------------------ |
| `useActiveTemplate()`      | The open template, or `null` while `config.yml` is open                        |
| `useIssueForm()`           | The open template; throws if none (for components rendered only for templates) |
| `useIsConfigActive()`      | `true` while `config.yml` is open                                              |
| `useWorkspace()`           | `{ templates, config }`, shallow-compared                                      |
| `useWorkspaceValidation()` | `validateWorkspace(workspace)`, memoized                                       |
| `useValidation()`          | Issues of the open template or `config.yml` (filtered by `scope`)              |
| `useIsWorkspaceEmpty()`    | `true` if nothing would be lost by clearing the workspace                      |

Components that need only one slice select it directly, e.g. `useWorkspaceStore((s) => s.config)`.
Actions can be read without subscribing via `useWorkspaceStore.getState()`.

## Persistence

The `persist` middleware saves the workspace to `localStorage` on every change.

| Setting      | Value                                          |
| ------------ | ---------------------------------------------- |
| Key          | `issue-form-generator:form`                    |
| Version      | `2`                                            |
| Stored parts | `templates`, `config`, `activeId` (no actions) |

The color scheme is stored separately by Mantine (`mantine-color-scheme-value`).

### Migrations

| From | To  | Change                                                                                    |
| ---- | --- | ----------------------------------------------------------------------------------------- |
| 1    | 2   | The single form (`{ settings, elements }`) becomes the first template of a new workspace. |

The `migrate(persisted, version)` function is exported and covered by
[`workspaceStore.test.ts`](../src/store/workspaceStore.test.ts).

When the model changes in a way that old saved data no longer fits:

1. Increase `STORAGE_VERSION` in `workspaceStore.ts`.
2. Extend `migrate` with a step from the previous version.
3. Add a test for the migration.

Without this, users with older saved data could see broken forms after a deployment.
