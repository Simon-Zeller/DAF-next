# Feature Specification: Release Crew

**Feature Branch**: `010-release-crew`
**Created**: 2026-03-12
**Status**: Draft
**Input**: User description: "Feature: Release Crew. The ninth and final CrewAI crew
in the DAF pipeline (Phase 6 — runs after all Phase 5 crews have completed). Purpose:
assemble the final output as a valid, locally installable package with correct
versioning, changelog, and adoption helper codemods. The Publish Agent's pass/fail
determines the final pipeline status — this is the last crew before the output review
gate."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Package Assembles and Passes Full Validation (Priority: P1)

After all nine prior crews have completed, the Release Crew assembles the final
`package.json` with all dependencies, entry points, and export maps. It then runs
the full validation sequence: `npm install` to verify dependency resolution, `tsc
--noEmit` to verify TypeScript compilation, and `npm test` to run all generated
tests. All three steps pass. The pipeline writes a final `PASS` status to
`reports/generation-summary.json` and the output folder is ready for the output
review gate. The user sees a clean report showing all components passed, all tests
passed, and the assigned version number.

**Why this priority**: Package assembly and validation is the single gate that
determines whether the generated design system is actually usable. A token system can
be beautiful and a component library can be complete, but if the package is missing
an export map entry or a test fails to compile, the consumer cannot install or use it.
This is the terminal quality gate for the entire pipeline.

**Independent Test**: Run Agents 36 and 39 against a clean Comprehensive-scope
pipeline output (all prior crews have passed). Verify `package.json` exists with a
valid `name`, `version`, `main`, `exports`, and `types` fields. Verify `src/index.ts`
exists and re-exports at least one component. Verify the validation sequence
completes without error and `reports/generation-summary.json` records
`pipelineStatus: PASS`, a `finalVersion`, and a `testResults` object with counts of
passed and failed tests.

**Acceptance Scenarios**:

1. **Given** all prior crews have completed successfully and all quality gates have
   passed, **When** Agent 39 assembles the package, **Then** `package.json` exists
   with `version` set to `1.0.0`, a `main` entry point, an `exports` map covering all
   generated components, and a `types` field pointing to the TypeScript declarations.
2. **Given** `package.json` is assembled, **When** Agent 39 runs `npm install`,
   **Then** all declared dependencies resolve without error — no missing packages,
   no version conflicts.
3. **Given** dependencies are installed, **When** Agent 39 runs `tsc --noEmit`,
   **Then** TypeScript compilation produces zero errors — all generated component
   source files compile cleanly against the project's `tsconfig.json`.
4. **Given** TypeScript compilation passes, **When** Agent 39 runs `npm test`,
   **Then** all unit, a11y, and governance tests pass and `reports/generation-summary.json`
   is updated with `testResults` containing total test count, passing count, failing
   count (zero on a clean run), and per-component test status.
5. **Given** all three validation steps pass, **When** Agent 39 writes the final
   status, **Then** `reports/generation-summary.json` records `pipelineStatus: PASS`
   and `finalVersion: "1.0.0"`.
6. **Given** one or more components failed validation in Phase 3 (retry-exhausted)
   but the overall pipeline continued, **When** Agent 36 calculates the version,
   **Then** the assigned version is `0.x.0` (experimental), not `1.0.0`, because the
   run is incomplete.

---

### User Story 2 — Release Changelog Inventories the Full Release (Priority: P1)

After the pipeline completes, a team lead opens `docs/changelog.md` to review what
was generated before approving the release. The document lists every component by name
with its status (generated, failed, partial), quality score, and test result. It
shows the token category summary — how many tokens per tier, which compilation
targets were produced. It summarizes the quality gate outcomes and explicitly lists
any known issues or failed components. The lead can read this document and make an
informed approval or rejection decision without opening any individual component file.

**Why this priority**: The changelog is the primary document the user reads at the
output review gate. Without it, the user must manually inspect the generation summary
JSON, the quality scorecard, and individual component folders to piece together what
the pipeline produced. A well-structured changelog is what makes the output review
gate a human-scale decision rather than a data archaeology exercise.

**Independent Test**: Run Agent 37 against a pipeline output that includes at least
one fully generated component, one failed component, and one token category summary.
Verify `docs/changelog.md` exists and contains: a component inventory section listing
both components with their status/score, a token summary section, a quality gate
section, and a known issues section naming the failed component.

**Acceptance Scenarios**:

1. **Given** a pipeline run with 26 generated components, **When** Agent 37 writes
   the changelog, **Then** `docs/changelog.md` contains a component inventory section
   with one entry per component, each showing: component name, generation status
   (`generated | failed | partial`), quality score (from `reports/quality-scorecard.json`),
   and test result (`pass | fail | unknown`).
2. **Given** the token tier files and compilation report are available, **When** Agent
   37 writes the token summary section, **Then** it includes: count of tokens per
   tier (global/semantic/component-scoped), total token count, and list of
   compilation targets produced (e.g., CSS custom properties, JS tokens, TypeScript
   declarations).
3. **Given** the quality scorecard records individual gate results, **When** Agent 37
   writes the quality gate section, **Then** it lists each of the five quality gate
   categories (from the Governance Crew) with a pass/fail result.
4. **Given** one or more components exhausted retries and are marked as failed,
   **When** Agent 37 writes the known issues section, **Then** each failed component
   is listed by name with the last failure reason from `reports/generation-summary.json`
   — not a generic message, the actual recorded reason.
5. **Given** a pipeline where all components passed and no components failed, **When**
   Agent 37 writes the changelog, **Then** the known issues section is present with
   the text "No known issues — all components generated successfully" rather than
   omitting the section.

---

### User Story 3 — Adoption Codemods Accelerate Consumer Migration (Priority: P2)

A frontend team receives the generated design system output. They need to migrate an
existing codebase from ad-hoc HTML elements and inline styles to design system
components. They open the generated codemod examples in `docs/codemods/` and find
ready-to-adapt scripts for the most common migration patterns: replacing raw `<button>`
elements with `<Button>`, replacing raw `<input>` fields with `<Input>`, and replacing
hardcoded color values with CSS variable token references. They adapt the example
scripts to their specific codebase patterns and run them without having to author
the AST transformation logic from scratch.

**Why this priority**: Adoption codemods are P2 because they are additive guidance
artifacts, not correctness requirements. The design system is usable without them.
However, without example codemods, teams face a significant migration effort — they
know _what_ to migrate to but not _how_ to automate it at scale. Generating example
codemods as part of the release makes the design system's migration path
self-documenting.

**Independent Test**: Run Agent 38 against a pipeline output with at least one
generated component. Verify a `docs/codemods/` directory exists containing at least
one codemod example file. Open one codemod file and verify it contains: a comment
explaining the migration it demonstrates, an example `before` code snippet, an
example `after` code snippet, and an AST transformation pattern that could be used
as a template.

**Acceptance Scenarios**:

1. **Given** the pipeline has generated a `Button` component, **When** Agent 38
   produces codemod examples, **Then** `docs/codemods/` contains at least one file
   with a codemod demonstrating migration from raw `<button>` (or native button
   patterns) to `<Button>` from the design system.
2. **Given** the Analytics Crew has identified hardcoded color values in
   `reports/token-compliance.json`, **When** Agent 38 writes a token migration codemod,
   **Then** the example codemod pattern addresses at minimum the most frequently
   occurring hardcoded color value type found in the compliance report.
3. **Given** `docs/codemods/` is generated, **When** each codemod file is opened,
   **Then** every file has a plain-language header comment explaining: (1) what
   pattern it migrates from, (2) what it migrates to, and (3) what part of the design
   system it adopts.
4. **Given** a codemod file exists, **When** it is reviewed for structure, **Then**
   it includes a clearly labeled `before` example and a clearly labeled `after`
   example so the migration transformation is human-readable without executing the
   codemod.

---

### User Story 4 — Pipeline Checkpoints Enable Non-Destructive Recovery (Priority: P2)

The pipeline is running a Comprehensive-scope generation. The Documentation Crew
(Phase 4) fails catastrophically — it exhausts all retries and produces no valid doc
output. Rather than corrupting the output folder with partial documentation files on
top of the completed token and component artifacts, the Rollback Agent restores the
output folder to the checkpoint taken before the Documentation Crew started. All
Phase 4 and Phase 5 crew artifacts are discarded; the Phase 1–3 artifacts (tokens,
components, Component Factory reports) are preserved. The pipeline operator is
notified which crew failed and what was rolled back. They can re-run from Phase 4
without losing their Phase 1–3 work.

**Why this priority**: Rollback protection is P2 because it primarily matters for
long-running Comprehensive-scope runs where losing Phase 1–3 work (which may take
20–40 minutes) due to a downstream failure would be highly disruptive. For small
Starter-scope runs, re-running the full pipeline is fast enough that rollback is
less critical. The checkpoint mechanism provides a safety net proportional to the
value at risk.

**Independent Test**: Simulate a catastrophic Documentation Crew failure (exhausted
retries, no recoverable output) in a test pipeline run. Verify that: (1) the output
folder state after rollback matches the checkpoint taken before the Documentation
Crew started (Phase 3 artifacts present, Phase 4+ artifacts absent), and (2)
`reports/rollback-log.json` records the crew that failed, the checkpoint restored,
and a timestamp.

**Acceptance Scenarios**:

1. **Given** Agent 40 is instantiated at pipeline start (before any crew runs),
   **When** the pipeline begins Phase 1, **Then** Agent 40 takes an initial empty-state
   checkpoint before the Bootstrap Crew writes any output.
2. **Given** a crew completes successfully, **When** the pipeline advances to the next
   phase, **Then** Agent 40 takes a checkpoint of the current output folder state
   before the next crew starts — so the restoring point is always post-success, not
   pre-failure.
3. **Given** the Documentation Crew exhausts all retries and fails catastrophically,
   **When** Agent 40 is invoked by Agent 6, **Then** the output folder is restored
   to the checkpoint taken before the Documentation Crew started, and
   `reports/rollback-log.json` is written with: the failed crew name, the timestamp
   of the failure, the checkpoint path or snapshot ID restored, and a summary of
   what was discarded.
4. **Given** a rollback has occurred, **When** Agent 6 triggers a forward cascade,
   **Then** all crews from the failed phase onward are re-run from the restored state
   — no crew from Phase 4+ may use stale artifacts from the failed run.
5. **Given** the pipeline completes without any catastrophic failure, **When** the
   pipeline finishes, **Then** `reports/rollback-log.json` exists with a summary
   recording zero rollbacks performed.

---

### User Story 5 — Version Number Reflects Actual Release Quality (Priority: P3)

After a Comprehensive-scope run where two components failed validation, the operator
opens `package.json` and sees version `0.1.0` rather than `1.0.0`. The version
accurately communicates that the release is incomplete — consumers who install this
package understand from the version alone that it is an experimental build and should
not be treated as production-ready. When the pipeline re-runs and all components pass,
the version graduates to `1.0.0` automatically.

**Why this priority**: Semver accuracy is P3 because the design system is usable at
any version — consumers can inspect the changelog to understand completeness. However,
a `1.0.0` badge on an incomplete release would actively mislead consumers, which is
worse than a missing optimization. Correct versioning is a correctness requirement,
but its production impact is low enough to rank below package assembly and changelog.

**Independent Test**: Run Agent 36 alone against: (a) a quality scorecard where all
components pass all gates → assert `package.json` version is `1.0.0`; (b) a quality
scorecard where two components are marked as failed → assert the version is `0.x.0`
format (e.g., `0.1.0`).

**Acceptance Scenarios**:

1. **Given** all quality gates pass and zero components are in a failed state,
   **When** Agent 36 calculates the version, **Then** the assigned version is `1.0.0`.
2. **Given** one or more components are in a `failed` or `partial` state in
   `reports/generation-summary.json`, **When** Agent 36 calculates the version,
   **Then** the assigned version is a `0.x.0` format (e.g., `0.1.0`) — never `1.0.0`.
3. **Given** the scope is `Starter` or `Standard` (not `Comprehensive`) and all
   in-scope components pass, **When** Agent 36 calculates the version, **Then** the
   assigned version is still `1.0.0` — scope does not downgrade the version; only
   failure states do.
4. **Given** Agent 36 assigns a version, **When** Agent 39 writes `package.json`,
   **Then** the `version` field uses exactly the version Agent 36 calculated — the
   Publish Agent does not override or re-derive the version.

---

### Edge Cases

- `npm install` fails due to an unresolvable dependency — Agent 39 records
  `validationStep: npm-install`, the error output, and `pipelineStatus: FAIL` in
  `reports/generation-summary.json`. The remaining validation steps (`tsc`, `npm test`)
  are skipped. The output folder is not cleaned up — it is left in its assembled state
  for the operator to inspect at the output review gate.
- `tsc --noEmit` fails due to a type error in generated component source — Agent 39
  records `validationStep: tsc`, the compiler error output (first 50 lines to avoid
  token bloat), and `pipelineStatus: FAIL`. The `npm test` step is skipped.
- `npm test` fails due to test assertion errors — Agent 39 records `validationStep:
  npm-test`, the test runner output with failing test names, and `pipelineStatus:
  FAIL`. The failing test results are also included in the `testResults` block of
  `reports/generation-summary.json` so the Analytics Crew's Breakage Correlation Agent
  can classify them on a re-run.
- `reports/quality-scorecard.json` is absent when Agent 36 runs — Agent 36 cannot
  confirm that all quality gates passed; it defaults to `0.x.0` versioning and records
  a warning in `reports/generation-summary.json` noting the scorecard was unavailable.
- Agent 40 attempts a snapshot but the output folder exceeds an expected size
  threshold — Agent 40 records a `snapshot-warn` event in `reports/rollback-log.json`,
  completes the snapshot anyway, and the pipeline continues. No pipeline step is
  blocked by a large snapshot.
- Agent 40 attempts a restore but the target checkpoint is corrupted or missing —
  Agent 40 records a `restore-failed` event in `reports/rollback-log.json`, does NOT
  attempt a partial restore (which would leave the output folder in an inconsistent
  state), and signals Agent 6 to halt the pipeline entirely. The operator is
  notified through the generation summary.
- `docs/changelog.md` already exists from a previous run (partial re-run scenario) —
  Agent 37 overwrites it entirely. The changelog always reflects the current run's
  state, not a merge of previous and current runs.
- `src/index.ts` already exists from a previous partial run — Agent 39 overwrites it
  entirely to ensure the barrel export matches the current set of generated components
  exactly.

## Requirements *(mandatory)*

### Functional Requirements

**Agent 36 — Semver Agent**

- **FR-001**: Agent 36 MUST assign `1.0.0` if and only if: all components in
  `reports/generation-summary.json` have a `status` of `generated` (not `failed` or
  `partial`), and `reports/quality-scorecard.json` exists and records all five
  quality gate categories as passed.
- **FR-002**: Agent 36 MUST assign a `0.x.0` version for any run that has one or more
  failed/partial components or a missing/failed quality scorecard. The minor version
  `x` is calculated as: (number of fully-generated components / total in-scope
  components) × 10, rounded down (e.g., 20/26 components passing → `0.7.0`).
- **FR-003**: Agent 36 MUST write its version decision and rationale to
  `reports/generation-summary.json` under a `versionDecision` object before Agent 37
  or Agent 39 run.

**Agent 37 — Release Changelog Agent**

- **FR-004**: Agent 37 MUST write `docs/changelog.md` containing four sections in
  order: (1) Component Inventory, (2) Token Summary, (3) Quality Gate Summary,
  (4) Known Issues.
- **FR-005**: The Component Inventory section MUST list every component from
  `reports/generation-summary.json` with: name, `status` (`generated | failed |
  partial`), quality score (from `reports/quality-scorecard.json`, or `N/A` if
  absent), and test result (`pass | fail | unknown`).
- **FR-006**: The Token Summary section MUST include: total token count across all
  tier files, count per tier (global/semantic/component-scoped), and the list of
  compilation targets produced (read from `tokens/compiled/` directory listing).
- **FR-007**: The Quality Gate Summary section MUST list each of the five quality gate
  categories from the Governance Crew with its pass/fail result and the aggregate
  composite score if available.
- **FR-008**: The Known Issues section MUST always be present. If zero components
  failed, it MUST state "No known issues — all components generated successfully."
  If failures exist, each failed component is listed with its last recorded failure
  reason from `reports/generation-summary.json`.
- **FR-009**: `docs/changelog.md` is NOT a design rationale document — it MUST NOT
  contain generation narrative, design decisions, or brand rationale. It is a release
  inventory document only.
- **FR-010**: Agent 37 MUST overwrite `docs/changelog.md` if it already exists from a
  previous run.

**Agent 38 — Codemod Agent**

- **FR-011**: Agent 38 MUST write example codemod files to `docs/codemods/`. Each
  file MUST contain: a plain-language header comment (what it migrates from, what it
  migrates to, what design system element it adopts), a labeled `before` example,
  a labeled `after` example, and an AST transformation pattern that could be adapted
  by a consumer.
- **FR-012**: Agent 38 MUST generate at minimum one codemod per generated component
  that has a matching native HTML element equivalent (e.g., `Button` → `<button>`,
  `Input` → `<input>`, `Select` → `<select>`). Components without native equivalents
  (e.g., design-system-specific layout wrappers) do not require a codemod.
- **FR-013**: Agent 38 MUST generate at least one token migration codemod demonstrating
  replacement of hardcoded color values with CSS variable token references. If
  `reports/token-compliance.json` is available, the example MUST use the most
  frequently occurring violation type as its demonstration case.
- **FR-014**: Agent 38 MUST NOT generate codemods that execute arbitrary shell commands
  or filesystem operations beyond reading and transforming source files.
- **FR-015**: Agent 38 MUST NOT write to any path outside of `docs/codemods/`.

**Agent 39 — Publish Agent**

- **FR-016**: Agent 39 MUST write `package.json` with at minimum: `name`, `version`
  (from Agent 36's decision), `main`, `module`, `types`, `exports` (covering all
  generated components), `peerDependencies`, and `scripts` (at minimum `build`,
  `test`, `typecheck`).
- **FR-017**: Agent 39 MUST write `src/index.ts` as a barrel export re-exporting all
  generated components and all generated primitives. Barrel `index.ts` files MUST
  also be written within each component directory if one does not already exist.
- **FR-018**: Agent 39 MUST execute the validation sequence in strict order: `npm
  install` first, then `tsc --noEmit`, then `npm test`. If any step fails, all
  remaining steps MUST be skipped.
- **FR-019**: Agent 39 MUST update `reports/generation-summary.json` after validation
  with: `pipelineStatus` (`PASS | FAIL`), `finalVersion`, `validationStep` (the step
  that failed, or `all-passed`), and a `testResults` object with total, passed,
  failed, and skipped counts.
- **FR-020**: Agent 39 MUST NOT delete or overwrite any file in `src/components/`,
  `src/primitives/`, `tokens/`, `specs/`, `docs/` (except appending to
  `docs/changelog.md` is handled by Agent 37, and writing `docs/codemods/` is handled
  by Agent 38). Agent 39's write scope is: `package.json`, `src/index.ts`, barrel
  `index.ts` files per component/primitive directory, and
  `reports/generation-summary.json` final status update.
- **FR-021**: If `npm test` fails, Agent 39 MUST record the failing test names and
  their failure messages (first 200 characters per message) in `reports/generation-summary.json`
  under `testResults.failures` — not just a count.

**Agent 40 — Rollback Agent**

- **FR-022**: Agent 40 MUST be instantiated by Agent 6 at pipeline start, before any
  crew runs. It MUST NOT be part of the Release Crew's task sequence — it operates
  as a standalone utility invoked by Agent 6 at phase boundaries.
- **FR-023**: Agent 40 MUST take a checkpoint before each crew starts. A checkpoint
  captures the full output folder state (file tree + contents) at that moment. The
  checkpoint is identified by a unique ID and a phase label (e.g., `phase-3-start`).
- **FR-024**: Agent 40 MUST write `reports/rollback-log.json` recording all
  checkpoint events (timestamps, phase labels, checkpoint IDs) and all rollback
  events (failed crew name, checkpoint restored, files discarded count, timestamp).
- **FR-025**: When Agent 40 restores a checkpoint, it MUST restore the output folder
  to an exact match of the checkpoint state — no partial restores. If a checkpoint is
  corrupted or missing, Agent 40 MUST signal a halt to Agent 6 and record a
  `restore-failed` event — it MUST NOT attempt a partial restore.
- **FR-026**: Agent 40 MUST NOT write to any path other than checkpoints storage and
  `reports/rollback-log.json`.

**Crew-Level**

- **FR-027**: The Release Crew task sequence is strictly ordered: T1 → T2 → T3 → T4
  → T5 → T6. No task may start until all prior tasks have completed.
- **FR-028**: The crew MUST finalize `reports/generation-summary.json` with
  `pipelineStatus`, `finalVersion`, and `completedAt` timestamp as the very last
  write of the entire pipeline.
- **FR-029**: The crew MUST NOT modify `specs/`, `governance/`, `registry/` or
  `tokens/` in any way. These directories are read-only for the Release Crew.

### Key Entities

- **Package Manifest** (`package.json`): The final installable package descriptor.
  Assembled by Agent 39 from the full pipeline output — it names every generated
  component in its `exports` map and pins the version calculated by Agent 36.
- **Release Changelog** (`docs/changelog.md`): A human-readable inventory document
  listing what the release contains. The primary artifact reviewed at the output
  review gate. Covers components, tokens, quality gates, and known issues.
- **Adoption Codemods** (`docs/codemods/`): Example AST transformation scripts that
  demonstrate how to migrate from ad-hoc HTML/CSS to design system components and
  tokens. Templates for consumer migration tooling.
- **Version Decision**: The output of Agent 36, recorded in `reports/generation-summary.json`
  before package assembly. Determines whether the release is `1.0.0` (all gates
  passed) or `0.x.0` (experimental/incomplete).
- **Rollback Log** (`reports/rollback-log.json`): Written by Agent 40 throughout the
  entire pipeline lifetime. Records every checkpoint taken and every rollback
  performed. The audit trail for pipeline recovery operations.
- **Pipeline Status**: The final `pipelineStatus` field in `reports/generation-summary.json`,
  written by Agent 39 after the validation sequence. `PASS` or `FAIL`. The single
  field that the output review gate reads to determine overall pipeline outcome.

### Crew I/O Contract *(mandatory for DAF crew features)*

| | Files |
|---|---|
| **Reads (required)** | `reports/generation-summary.json`, `reports/quality-scorecard.json`, `specs/*.spec.yaml`, `src/components/**/*.tsx`, `src/primitives/*.tsx`, `tokens/compiled/*`, `tokens/*.tokens.json`, `docs/**`, `governance/*.json`, `registry/*.json`, `brand-profile.json`, `pipeline-config.json`, `tsconfig.json`, `vitest.config.ts` |
| **Reads (optional)** | `reports/token-compliance.json`, `reports/drift-report.json`, `reports/pipeline-completeness.json` |
| **Writes** | `package.json`, `src/index.ts`, barrel `index.ts` per component/primitive directory, `docs/changelog.md`, `docs/codemods/*.md`, `reports/generation-summary.json` (final status update), `reports/rollback-log.json` (Agent 40, throughout pipeline lifetime) |

**Boundary constraints** (check all that apply):
- [x] This crew does NOT produce both spec YAMLs and TSX source for the same component
- [x] This crew does NOT produce both raw tokens and compiled tokens
- [x] This crew does NOT write to another crew's declared output namespace

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every generated component in `reports/generation-summary.json` appears
  in the `exports` map of `package.json` — zero generated components are absent from
  the package entry points.
- **SC-002**: All three validation steps (`npm install`, `tsc --noEmit`, `npm test`)
  pass without errors on a clean pipeline run where all prior crews have succeeded.
- **SC-003**: `docs/changelog.md` covers 100% of components from
  `reports/generation-summary.json` in its Component Inventory section — zero
  components omitted.
- **SC-004**: The version in `package.json` accurately reflects the run's completeness:
  `1.0.0` if and only if all quality gates passed and zero components failed; `0.x.0`
  in all other cases.
- **SC-005**: `reports/rollback-log.json` exists and is valid JSON after every pipeline
  run, recording at minimum one checkpoint event (the initial empty-state checkpoint)
  even on a fully successful run.
- **SC-006**: `reports/generation-summary.json` contains `pipelineStatus`,
  `finalVersion`, and `completedAt` as the final write of the pipeline — these three
  fields are always present in the final report, never absent.

## Assumptions

- Agent 39 uses the `tsconfig.json` generated by the DS Bootstrap Crew (Phase 1) as
  the TypeScript configuration for compilation validation. It does not regenerate or
  modify `tsconfig.json`.
- The test runner is `vitest`, configured by the `vitest.config.ts` generated in
  Phase 1. Agent 39 invokes `npm test` which executes `vitest run` according to that
  config. No alternative test runners are assumed.
- Agent 40's checkpoint storage is a local temporary directory within the project
  workspace (e.g., `.specify/checkpoints/`). It is not a versioned artifact — it
  exists only for the current pipeline run and may be cleaned up after the run
  completes.
- The Release Crew is the only crew that reads the entire output folder holistically.
  All other crews read from specific subdirectories. Agent 39's broad read access is
  intentional — package assembly requires a complete view of all generated artifacts.
- The Codemod Agent (38) generates example/template codemods — not production-ready,
  project-specific migration scripts. Consumers are expected to adapt the patterns to
  their own codebase. Agent 38 does not execute the codemods against any source files.
- The Release Crew's `docs/changelog.md` is a cumulative record of the current run.
  It does not maintain a versioned history of previous runs. Version history management
  (e.g., `CHANGELOG.md` with a cumulative `## [1.0.0]` / `## [0.7.0]` structure) is
  out of scope for the MVP.

## Out of Scope

- Publishing the package to a registry (npm, GitHub Packages, private registry) —
  the Release Crew assembles and validates the package locally. Registry publication
  is a post-pipeline manual step.
- Generating TypeScript declaration files (`.d.ts`) — declaration generation is
  handled by the build tooling invoked via `tsc` or `vite build`. Agent 39 invokes
  the build; it does not write declaration files directly.
- Maintaining a cumulative versioned changelog (e.g., appending to an existing
  `CHANGELOG.md` across multiple runs) — `docs/changelog.md` reflects the current
  run only.
- Running the codemods against any source files — the Codemod Agent generates
  examples/templates, not an automated migration runner.
- Version bump management for subsequent releases (e.g., tracking semver increments
  between v1.0.0 and v1.1.0 across runs) — versioning is computed fresh from the
  current run's quality data each time.
- Cross-platform build validation — the pipeline is designed to run in a single
  Node.js environment. Multi-platform or cross-compilation validation is out of scope.
