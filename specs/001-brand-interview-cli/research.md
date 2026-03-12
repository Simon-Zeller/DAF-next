# Research: 001 Brand Interview CLI

**Feature**: Pre-Pipeline Brand Interview CLI  
**Branch**: `001-brand-interview-cli`  
**Status**: Complete — all decisions resolved

---

## Decision 1: Interactive Prompt Library

**Decision**: Use `@inquirer/prompts` v3+

**Rationale**: `inquirer` v9+ migrated to ESM-only and split into modular packages
under the `@inquirer/` scope. `@inquirer/prompts` is the official monorepo bundle
that includes all standard prompt types (input, select, checkbox). It has first-class
TypeScript support and importantly throws `ExitPromptError` (from `@inquirer/core`) on
Ctrl+C — enabling clean SIGINT handling without raw signal listeners conflicting with
the prompt library's own signal handling.

**Alternatives considered**:
- `inquirer` v8 (CommonJS): Deprecated, last CJS release, no ESM
- `prompts`: Lighter but less maintained; typed community types only
- `enquirer`: Smaller ecosystem, no `ExitPromptError` pattern; harder to test

---

## Decision 2: Test Framework

**Decision**: Use `vitest` v2+

**Rationale**: ESM-native test runner — zero configuration for TypeScript ESM projects.
Identical API to Jest (`describe`, `it`, `expect`, `vi.mock()`). Significantly faster
than Jest for watch mode and unit test cycles. Mocking ESM modules with `vi.mock()` is
first-class, which is required to mock `@inquirer/prompts` in unit tests. No Babel
transforms, no `ts-jest` configuration.

**Alternatives considered**:
- `jest` + `ts-jest`: ESM support is experimental; requires transform config, resolver
  overrides, and `NODE_OPTIONS=--experimental-vm-modules`
- `node:test` (native): Minimal API; no native mocking; poor DX for this scope
- `mocha` + `chai`: More config than vitest; no native ESM mocking

---

## Decision 3: CLI Argument Parsing

**Decision**: Use `commander` v12+

**Rationale**: Industry-standard argument parser for Node.js CLIs. Handles `--output`
and `--from-file` with type coercion, built-in `--help` generation, and flag conflict
detection. TypeScript support via `@types` is complete and well-tested. Lightweight
(no runtime dependencies).

**Alternatives considered**:
- `yargs`: Heavier API surface, better for complex nested subcommand CLIs
- `meow`: Minimal but requires manual flag validation and type coercion
- Manual `process.argv`: Fragile; no `--help` generation; error-prone flag parsing

---

## Decision 4: Schema Validation

**Decision**: Use `zod` v3

**Rationale**: `zod` provides both runtime validation (for `--from-file` JSON parsing)
and compile-time TypeScript type inference via `z.infer<typeof BrandProfileSchema>`.
The schema is the single source of truth for the shape of `brand-profile.json`. Zod
`.safeParse()` returns structured errors that translate cleanly to human-readable
stderr messages (FR-012). No separate `d.ts` file needed — schema and types are
co-located.

**Alternatives considered**:
- `ajv` + JSON Schema: Verbose; requires separate TypeScript type definitions
- `io-ts`: More complex API; overkill for this schema size
- Manual validation: Error-prone; no type inference for `BrandProfile`

---

## Decision 5: SIGINT / Interruption Handling

**Decision**: Catch `ExitPromptError` from `@inquirer/prompts`; no raw `SIGINT`
listener on the prompt flow

**Rationale**: When the user presses Ctrl+C, `@inquirer/prompts` throws
`ExitPromptError` (exported from `@inquirer/core`). The interview function catches
this at the top level and calls `process.exit(130)` (the standard convention for
SIGINT-terminated processes) without writing any file. This is simpler and more
reliable than `process.on('SIGINT')`, which conflicts with the prompt library's own
signal handler and can cause double-exit or garbled terminal state.

For `SIGTERM`: A separate `process.on('SIGTERM', () => process.exit(143))` handler
is registered at startup. This exits before any write occurs because all answers are
accumulated in memory and written only after the interview completes.

**Alternatives considered**:
- `process.on('SIGINT', handler)`: Conflicts with inquirer internals; unreliable
- Write to temp file + atomic rename + cleanup on signal: Unnecessary complexity
  since the write is a single synchronous operation after the interview completes

---

## Decision 6: TypeScript Setup

**Decision**: TypeScript 5 with `tsx` as the dev runner; `tsc --noEmit` for type
checking; no compile-to-`dist` step required for local tooling

**Rationale**: This is a local development CLI — not published to npm. The `bin`
entry in `package.json` points to `src/cli.ts` with a `tsx` shebang
(`#!/usr/bin/env tsx`). This keeps the feedback loop fast: no build step between
editing and running. Type checking runs via `tsc --noEmit` as part of the Task
Completion Gate (Constitution XIV). If distribution is needed later, `tsup` can be
added without changing any source code.

**Alternatives considered**:
- `tsc` + `dist/`: Adds a build step; no benefit for a local tool
- `ts-node`: Slower than `tsx`; requires `esm` loader config for ESM projects
- `esbuild` / `tsup` from day one: Premature optimization; adds complexity

---

## Decision 7: Package Layout

**Decision**: `packages/brand-interview-cli/` at the monorepo root

**Rationale**: The DAF project will ultimately contain 9 crew packages plus this CLI.
A `packages/` monorepo layout under the repo root provides clear separation between
features from day one. Package name: `@daf/brand-interview-cli`. Plain npm workspaces
(`workspaces: ["packages/*"]` in root `package.json`) — no Turborepo or Nx introduced
yet, as complexity is not justified at this scope.

**Alternatives considered**:
- Root-level `src/`: Clutters the root when later crew packages are added
- `tools/brand-interview-cli/`: Unconventional; `packages/` is the standard
- Flat root package: Makes adding future packages significantly messier

---

## Summary of Resolved Decisions

| Area | Choice | Version |
|---|---|---|
| Prompt library | `@inquirer/prompts` | v3+ |
| Test framework | `vitest` | v2+ |
| CLI args | `commander` | v12+ |
| Schema / validation | `zod` | v3 |
| SIGINT handling | `ExitPromptError` catch pattern | — |
| TypeScript runner | `tsx` | v4+ |
| Package layout | `packages/brand-interview-cli/` (npm workspaces) | — |
