# Documentation

Developer documentation for the Issue Form Generator. For a short overview and quick start see the
[project README](../README.md).

| Document                                        | Contents                                                           |
| ----------------------------------------------- | ------------------------------------------------------------------ |
| [Architecture](architecture.md)                 | Big picture, folder structure, data flow, key decisions            |
| [Data model](data-model.md)                     | The in-memory form model and how it maps to GitHub's schema        |
| [YAML generation, import & validation](yaml.md) | `serialize.ts`, `parse.ts`, `validate.ts` in detail                |
| [State & persistence](state.md)                 | Zustand store, actions, localStorage auto-save, migrations         |
| [UI components](ui-components.md)               | Component tree and responsibilities of each component              |
| [Development guide](development.md)             | Setup, scripts, testing, code style, how to add a new element type |
| [Releasing & versioning](releasing.md)          | Semantic versioning, Conventional Commits, release-please          |
| [CI/CD & deployment](deployment.md)             | GitHub Actions, GitHub Pages, Dependabot, repository settings      |
| [Implementation plan](IMPLEMENTATION_PLAN.md)   | Original plan and progress log                                     |
