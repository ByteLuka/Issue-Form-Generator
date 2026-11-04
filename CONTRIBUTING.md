# Contributing

Thanks for helping improve the Issue Form Generator!

1. Fork and clone the repository, then run `npm install` (this also installs the git hooks).
2. Create a branch, make your change and add tests for logic in `src/lib`.
3. Run `npm run format && npm run lint && npm run typecheck && npm test && npm run build`.
4. Commit using [Conventional Commits](https://www.conventionalcommits.org), e.g. `feat: add config.yml editor`
   or `fix(import): keep dropdown default of 0`. The commit type decides the next version.
5. Open a pull request with a conventional title (it becomes the commit message when squash-merging).

Read the [development guide](docs/development.md) for the project structure, code style and a checklist for adding new
element types, and [releasing & versioning](docs/releasing.md) for how releases work.
