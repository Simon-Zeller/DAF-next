# Tasks: Pre-Pipeline Brand Interview CLI

**Feature**: `001-brand-interview-cli`  
**Input**: Design documents from `/specs/001-brand-interview-cli/`  
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

**TDD**: Tests are written before every implementation — Constitution XI is mandatory.  
Each task runs on its own branch: `task/001-brand-interview-cli/[id]-[desc]`  
Merged to `main` after passing all 5 Task Completion Gate conditions (Constitution XIV).

---

## Phase 1: Setup

**Purpose**: Monorepo and package scaffolding — nothing else can begin until this is done.

- [] T001 Create npm workspaces configuration in package.json (repo root, `"workspaces": ["packages/*"]`)
- [] T002 Scaffold package in packages/brand-interview-cli/ (package.json, tsconfig.json, vitest.config.ts, .eslintrc.json)

---

## Phase 2: Foundational — Schema & Writer

**Purpose**: Shared modules (`schema.ts` and `writer.ts`) that every user story depends on. Must be complete before any story work begins.

**⚠️ CRITICAL**: No user story implementation begins until this phase is complete.

> **TDD Order**: Write the failing test → confirm it fails (red) → implement to pass (green).

- [ ] T003 [P] Write failing tests for BrandProfileSchema (valid profiles, enum fields, Multi-Brand `brands` conditional, invalid inputs) in packages/brand-interview-cli/tests/unit/schema.test.ts
- [ ] T004 Implement BrandProfileSchema and exported TypeScript types (`BrandProfile`, `Archetype`, `Scope`) in packages/brand-interview-cli/src/schema.ts
- [ ] T005 [P] Write failing tests for writer module (success write, output dir auto-creation, `--output` pointing to a file errors, path returned on success) in packages/brand-interview-cli/tests/unit/writer.test.ts
- [ ] T006 [P] Implement writer module (`writeProfile`, `ensureOutputDir`) in packages/brand-interview-cli/src/writer.ts

**Checkpoint**: `schema.ts` and `writer.ts` fully tested and passing. Foundation ready.

---

## Phase 3: User Story 1 — Complete Brand Interview (Priority: P1) 🎯 MVP

**Goal**: Developer runs the CLI interactively, answers questions, and receives `brand-profile.json` on disk.

**Independent Test**: `npx tsx packages/brand-interview-cli/src/cli.ts --output /tmp/daf-test` — answer all prompts with fixed test values. Verify `/tmp/daf-test/brand-profile.json` exists, contains the exact values entered (no modification), and the CLI exits `0` printing the absolute file path to stdout.

> **TDD Order**: Write the failing test → confirm it fails (red) → implement to pass (green).

### Tests for User Story 1

- [ ] T007 [P] [US1] Write failing unit tests for interview question flow (archetype selection first, archetype-scoped field ordering, Multi-Brand `brands` extra question, empty-response re-prompt, Custom archetype asks all fields) in packages/brand-interview-cli/tests/unit/interview.test.ts
- [ ] T010 [P] [US1] Write failing integration tests for end-to-end complete interview (exit 0, stdout is absolute path, brand-profile.json content matches answers, no extra fields injected) in packages/brand-interview-cli/tests/integration/cli.test.ts

### Implementation for User Story 1

- [ ] T008 [US1] Implement interview module (question sequence, archetype branching, `Partial<BrandProfile>` accumulator, empty re-prompt loop) in packages/brand-interview-cli/src/interview.ts
- [ ] T009 [US1] Implement CLI entry point: Commander setup, `--output` flag, `--help`, wire `interview()` → `writeProfile()`, print absolute path to stdout on success in packages/brand-interview-cli/src/cli.ts

**Checkpoint**: User Story 1 fully functional. Run the CLI interactively and verify `brand-profile.json` is written correctly. This is the MVP.

---

## Phase 4: User Story 2 — Bypass Interview with `--from-file` (Priority: P2)

**Goal**: Developer provides an existing `brand-profile.json` via `--from-file`; CLI copies it to the output folder without prompting.

**Independent Test**: `npx tsx packages/brand-interview-cli/src/cli.ts --from-file ./fixtures/valid-profile.json --output /tmp/daf-test` — verify output file is byte-for-byte identical to source, no prompts appeared, exit code `0`.

> **TDD Order**: Write the failing test → confirm it fails (red) → implement to pass (green).

### Tests for User Story 2

- [ ] T011 [P] [US2] Write failing integration tests for `--from-file` bypass (valid JSON copy is byte-identical, invalid JSON → stderr + exit non-zero + no output file written, missing `--output` defaults to cwd) in packages/brand-interview-cli/tests/integration/cli.test.ts

### Implementation for User Story 2

- [ ] T012 [US2] Implement `--from-file` flag in packages/brand-interview-cli/src/cli.ts: read file, `safeParse` for structural validation error message, write bytes as-is to output folder, no prompts shown

**Checkpoint**: User Stories 1 and 2 both independently testable. `--from-file` produces a byte-identical copy.

---

## Phase 5: User Story 3 — Clean Interruption Handling (Priority: P3)

**Goal**: Ctrl+C or SIGTERM during the interview exits cleanly — no partial file written to disk.

**Independent Test**: Start the CLI, answer one question, send SIGINT. Verify no file exists in the output folder and exit code is `130`.

> **TDD Order**: Write the failing test → confirm it fails (red) → implement to pass (green).

### Tests for User Story 3

- [ ] T013 [P] [US3] Write failing integration tests for clean interruption (SIGINT mid-interview → no output file, exit 130; SIGTERM → no output file, exit 143) in packages/brand-interview-cli/tests/integration/cli.test.ts

### Implementation for User Story 3

- [ ] T014 [US3] Implement SIGTERM handler (`process.on('SIGTERM', () => process.exit(143))`) registered at startup in packages/brand-interview-cli/src/signals.ts
- [ ] T015 [US3] Wire `ExitPromptError` catch in packages/brand-interview-cli/src/cli.ts (catch from `@inquirer/core`, exit 130, no write) and call `registerSignalHandlers()` from packages/brand-interview-cli/src/signals.ts

**Checkpoint**: All three user stories independently functional. Interruption leaves output folder untouched.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, flag validation, and final Task Completion Gate verification.

- [ ] T016 [P] Add flag conflict validation and remaining edge cases in packages/brand-interview-cli/src/cli.ts: `--output` exists as file (stderr + exit 1), conflicting flags (stderr + exit 1), nested `--output` dir creation
- [ ] T017 Run full Task Completion Gate for all tasks: `npm test` (green), `npm run lint` (clean), `npm run typecheck` (zero errors), manual walkthrough of all three user stories with documented observed output

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **blocks all user stories**
- **Phase 3 (US1)**: Depends on Phase 2 — MVP increment
- **Phase 4 (US2)**: Depends on Phase 3 (cli.ts established)
- **Phase 5 (US3)**: Depends on Phase 3 (interview.ts established)
- **Phase 6 (Polish)**: Depends on Phases 3–5 complete

### User Story Dependencies

| Story | Depends on | Can start when |
|---|---|---|
| US1 (P1) | Phase 2 complete | schema.ts + writer.ts green |
| US2 (P2) | US1 complete | cli.ts entry point exists |
| US3 (P3) | US1 complete | interview.ts + cli.ts exist |

### Within Each User Story

1. Failing tests written first (red) — `[P]` tasks T007, T010, T011, T013 can overlap writing
2. Implementation written to pass them (green)
3. Story checkpoint verified before next story begins

### Parallel Opportunities

**Phase 2**: T003 and T005 (test-writing) can run in parallel — different files  
**Phase 2**: T004 and T006 (implementation) can run in parallel — no cross-dependency  
**Phase 3**: T007 and T010 (test-writing) can run in parallel  
**Phase 4**: T011 (test-writing) before T012 (implementation)  
**Phase 5**: T013 (test-writing) before T014+T015  

---

## Parallel Example: Phase 2

```bash
# Launch in parallel (different files, no dependency):
Task T003: "Write failing schema tests in tests/unit/schema.test.ts"
Task T005: "Write failing writer tests in tests/unit/writer.test.ts"

# After T003 passes, in parallel:
Task T004: "Implement schema.ts"
Task T006: "Implement writer.ts"  ← once T005 is failing (red)
```

---

## Parallel Example: User Story 1

```bash
# Launch in parallel (writing failing tests, different files):
Task T007: "Write failing interview unit tests in tests/unit/interview.test.ts"
Task T010: "Write failing integration tests in tests/integration/cli.test.ts"

# After T007 is confirmed failing:
Task T008: "Implement interview.ts"  → then T009: "Implement cli.ts"
```

---

## Implementation Strategy

### MVP: User Story 1 Only

1. Phase 1: Setup (T001–T002)
2. Phase 2: Foundational (T003–T006)
3. Phase 3: US1 (T007–T010)
4. **Validate**: Run CLI manually, check brand-profile.json output
5. **Ship**: Hand `brand-profile.json` to Agent 1

### Full Feature (All Stories)

1. MVP above
2. Phase 4: US2 (T011–T012) — adds `--from-file` bypass
3. Phase 5: US3 (T013–T015) — adds clean interruption
4. Phase 6: Polish + Task Completion Gate (T016–T017)

---

## Branch Naming Convention

Each task gets its own branch off `main`:

```
task/001-brand-interview-cli/T001-npm-workspaces
task/001-brand-interview-cli/T002-package-scaffold
task/001-brand-interview-cli/T003-schema-tests
task/001-brand-interview-cli/T004-schema-impl
task/001-brand-interview-cli/T005-writer-tests
task/001-brand-interview-cli/T006-writer-impl
task/001-brand-interview-cli/T007-interview-unit-tests
task/001-brand-interview-cli/T008-interview-impl
task/001-brand-interview-cli/T009-cli-entry-point
task/001-brand-interview-cli/T010-cli-integration-tests-us1
task/001-brand-interview-cli/T011-cli-integration-tests-us2
task/001-brand-interview-cli/T012-from-file-impl
task/001-brand-interview-cli/T013-cli-integration-tests-us3
task/001-brand-interview-cli/T014-signals-impl
task/001-brand-interview-cli/T015-sigint-wire
task/001-brand-interview-cli/T016-edge-cases
task/001-brand-interview-cli/T017-completion-gate
```

Merge each branch to `main` before starting the next task.

---

## Task Completion Gate (Constitution XIV)

Before any branch is merged:

```bash
npm test           # ✅ all tests green
npm run lint       # ✅ zero lint errors
npm run typecheck  # ✅ tsc --noEmit exits 0
# ✅ no runtime errors under normal use
# ✅ manual walkthrough documented (per Constitution XIII)
```

All 5 conditions are mandatory. A task that passes 4 of 5 is NOT complete.
