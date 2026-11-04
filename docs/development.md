# Development guide

## Setup

```bash
nvm use            # Node version from .nvmrc
npm install        # also installs the git hooks (husky)
npm run dev        # http://localhost:5173
```

## Scripts

| Script                 | Purpose                            |
| ---------------------- | ---------------------------------- |
| `npm run dev`          | Vite dev server with hot reload    |
| `npm run build`        | Type-check and build into `dist/`  |
| `npm run preview`      | Serve the production build locally |
| `npm test`             | Run unit tests once (Vitest)       |
| `npm run test:watch`   | Tests in watch mode                |
| `npm run lint`         | ESLint                             |
| `npm run typecheck`    | TypeScript project check           |
| `npm run format`       | Format everything with Prettier    |
| `npm run format:check` | Check formatting (used in CI)      |

CI runs `format:check`, `lint`, `typecheck`, `test` and `build`; run them locally before opening a pull request.

## Commit messages

Commits must follow [Conventional Commits](https://www.conventionalcommits.org), e.g. `feat: add config.yml editor`
or `fix(preview): show dropdown default`. A git hook (husky + commitlint) rejects other messages. The type decides
the next version — see [Releasing & versioning](releasing.md).

## Code style

- TypeScript `strict`, no `any` without reason.
- Prettier: single quotes, 100 characters, trailing commas.
- Business logic goes into `src/lib` (pure functions + tests), not into components.
- Components select only the store slice they need.
- Keep comments short and explain _why_, not _what_.

## Testing

| Kind      | Where                          | What                                                 |
| --------- | ------------------------------ | ---------------------------------------------------- |
| Unit      | `src/lib/*.test.ts`            | YAML generation, import, validation, file names, zip |
| Store     | `src/store/*.test.ts`          | Actions, active-template behavior, storage migration |
| Component | `src/components/**/*.test.tsx` | User flows, e.g. the guided element dialog           |

- Tests run in jsdom with Vitest. `src/test/setup.ts` adds jest-dom matchers, cleans up after each test and stubs
  browser APIs that jsdom lacks (`matchMedia`, `ResizeObserver`, `document.fonts`, `scrollIntoView`).
- Render components with `renderWithProviders` from `src/test/render.tsx`. It wraps them in `MantineProvider`
  with `env="test"` (no transitions, no portals) and returns a `user` from `@testing-library/user-event`.
- Query like a user would: by role and accessible name (`getByRole('button', { name: 'Next' })`).
- Reset the store in `beforeEach` with `useWorkspaceStore.getState().resetWorkspace()`.
- `src/lib` must stay fully covered: every serializer/parser/validator change needs a test.

## How to add a new element type

GitHub occasionally adds new element types (e.g. `upload`). Checklist:

1. **Model** — `src/lib/types.ts`: add to `ELEMENT_TYPES`, define the interface, add it to `FormElement`.
2. **Factory & info** — `src/lib/elements.ts`: case in `createElement`, entry in `ELEMENT_INFO`.
3. **YAML output** — `src/lib/serialize.ts`: case in `elementToPlain`.
4. **Import** — `src/lib/parse.ts`: case in `parseElement`.
5. **Validation** — `src/lib/validate.ts`: rules for the new type.
6. **Icon & color** — `src/components/elementIcons.ts`.
7. **Dialog steps** — `src/components/editor/stepConfig.ts` (`stepsFor`, `stepErrors`),
   a step component in `steps.tsx` if needed, and the case in `ElementDialog.renderStep`.
8. **Card summary** — `summary()` in `ElementCard.tsx`.
9. **Preview** — case in `PreviewElement` in `FormPreview.tsx`.
10. **Tests** — round-trip and validation tests in `src/lib/lib.test.ts`; optionally add it to a starter template.
11. **Component test** — extend `src/components/editor/ElementDialog.test.tsx` if the type has its own step.
12. **Docs** — update [data-model.md](data-model.md) and [yaml.md](yaml.md).

TypeScript's exhaustive `switch` statements point out most places you missed.

## Dependency notes

- TypeScript is pinned to 6.x because `typescript-eslint` does not support TypeScript 7 yet. Dependabot ignores
  TypeScript major updates until then (see `.github/dependabot.yml`).
- `@mantine/*` packages must always have the same version; Dependabot groups them.
