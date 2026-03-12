# Feature Specification: Component Factory Crew

**Feature Branch**: `005-component-factory-crew`
**Created**: 2026-03-12
**Status**: Draft
**Input**: User description: "Feature: Component Factory Crew. The fourth CrewAI
crew in the DAF pipeline. Runs immediately after the Design-to-Code Crew and is
responsible for validating all generated source artifacts against the dual quality
gate before the pipeline proceeds to Phase 4. This crew does not generate new
source — it evaluates, scores, enforces the gate, and triggers rollback when
quality is insufficient."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — All Generated Artifacts Measured and Scored (Priority: P1)

A developer has just run the Design-to-Code Crew. Before anything is published or
documented, the Component Factory Crew's Coverage Runner (Agent 50) executes the
full test suite and a11y check suite against every file in `src/`. The results are
written to `reports/coverage/` and `reports/a11y-report.json`. The Composite Quality
Score agent (Agent 20) then reads those reports and produces a per-component score
out of 100, broken down across five weighted dimensions, writing the results to
`reports/quality-scores.json`.

**Why this priority**: Nothing in Phase 4 is meaningful if the generated components
don't actually work, aren't accessible, and aren't sufficiently tested. The scoring
step transforms raw test output into structured, comparable quality data. Without it,
the gate has nothing to evaluate. This is the foundational step of the entire crew.

**Independent Test**: Run Agent 50 then Agent 20 against a known set of components
— one that passes all thresholds and one artificially failing (e.g., a component
with 70% coverage and one critical a11y violation). Verify that
`reports/quality-scores.json` contains one entry per component with all five score
dimensions present, and that the individual scores add up to the reported composite.

**Acceptance Scenarios**:

1. **Given** all `src/` artifacts are present, **When** Agent 50 runs, **Then**
   `reports/coverage/` contains a valid LCOV-format coverage report and
   `reports/a11y-report.json` contains one entry per component with zero or more
   violations listed.
2. **Given** Agent 50 produces an empty or malformed report (e.g., test runner
   exits with no output), **When** Agent 50 detects the anomaly, **Then** it
   re-runs once and logs the retry. If the second run also produces an invalid
   report, Agent 50 escalates as a hard failure without proceeding to Agent 20.
3. **Given** valid coverage and a11y reports, **When** Agent 20 runs, **Then**
   `reports/quality-scores.json` contains one entry per component with: composite
   score (0–100), and individual sub-scores for coverage (0–30), a11y (0–25),
   token integrity (0–20), documentation presence (0–15), and usage examples (0–10).
4. **Given** a component with 85% coverage, zero a11y violations, all token refs
   resolved, a documentation file present, and 3 story examples, **When** Agent 20
   scores it, **Then** the composite is ≥ 70 and all five sub-scores reflect the
   full entitlement for that dimension.
5. **Given** a component with 60% coverage (below the 80% threshold), **When**
   Agent 20 computes its coverage sub-score, **Then** the coverage dimension score
   is proportionally reduced and the composite reflects the shortfall.
6. **Given** `pipeline-config.json` specifies a custom composite threshold of 75
   (overriding the default 70), **When** Agent 20 reads the config, **Then** it
   records the threshold in `quality-scores.json` so Agent 30 uses the
   config-driven value — not a hardcoded default.

---

### User Story 2 — Dual Quality Gate Enforced Before Phase 4 (Priority: P1)

After scoring, the Quality Gate Enforcer (Agent 30) reads `quality-scores.json` and
applies the dual-gate rule to every component. A component passes only if its
composite score meets the threshold AND all five individual gates independently pass.
Passing all components unlocks Phase 4. Any failure triggers the Rollback Agent.

**Why this priority**: The dual gate is a non-negotiable constitution principle
(Principle VI). Agent 30 is the single enforcement point for that principle. If this
step is bypassed or soft-fails, the pipeline could deliver a broken or inaccessible
component library. It is the most critical decision point in the entire pipeline.

**Independent Test**: Provide a `quality-scores.json` with one component that has
composite 85/100 but has `a11yCritical: 1` (a critical a11y violation). Verify Agent
30 records a gate failure for that component in `gate-report.json`, does not
proceed to Phase 4 signalling, and triggers the Rollback Agent.

**Acceptance Scenarios**:

1. **Given** all components score ≥ 70/100 composite AND all individual gates pass,
   **When** Agent 30 evaluates `quality-scores.json`, **Then** `gate-report.json`
   records a `pass` entry for every component and Agent 30 signals pipeline
   continuation to Phase 4.
2. **Given** one component scores 65/100 composite (below threshold), **When** Agent
   30 evaluates it, **Then** `gate-report.json` records a `fail` entry for that
   component with `reason: composite_below_threshold` and Agent 30 triggers the
   Rollback Agent.
3. **Given** one component scores 85/100 composite but has one critical a11y
   violation (dual-gate failure), **When** Agent 30 evaluates it, **Then**
   `gate-report.json` records a `fail` for that component with
   `reason: a11y_critical_violation` — the composite score alone is not sufficient
   to pass.
4. **Given** one component has an unresolved token reference, **When** Agent 30
   evaluates its token integrity gate, **Then** `gate-report.json` records a `fail`
   with `reason: unresolved_token_reference` and lists the exact unresolved token
   path.
5. **Given** a brand profile with `accessibility.level: AAA`, **When** Agent 30
   reads the a11y gate threshold from `pipeline-config.json`, **Then** the a11y gate
   requires zero critical AND zero serious violations (not just zero critical), and
   any serious violation triggers a gate fail.
6. **Given** a component listed in `lifecycle.betaComponents` with composite 65/100
   and 65% coverage, **When** Agent 30 evaluates it with beta-relaxed thresholds
   (composite ≥ 60, coverage ≥ 60%), **Then** `gate-report.json` records a `pass`
   for that component under the beta thresholds.
7. **Given** a component listed in `lifecycle.betaComponents` with a critical a11y
   violation, **When** Agent 30 evaluates it, **Then** `gate-report.json` records a
   `fail` — the a11y individual gate is NOT relaxed for beta components.
8. **Given** all evaluations complete, **When** inspecting `gate-report.json`,
   **Then** it contains one entry per component regardless of pass/fail — no
   component is omitted from the audit trail.

---

### User Story 3 — Failed Components Rolled Back and Phase 3 Retried (Priority: P1)

When Agent 30 signals a gate failure, the Rollback Agent (Agent 40) kicks in.
It reads `gate-report.json` to identify which components failed and which gate
dimension caused the failure. It then restores the `src/` directory to its
pre-Phase-3 checkpoint and re-signals Bootstrap Agent 6 with the full failure
context, allowing Phase 3 to regenerate with the quality feedback incorporated.
The retry counter in `pipeline-config.json` is decremented on each rollback.

**Why this priority**: Without rollback and retry, gate failures are terminal. The
pipeline's value proposition — self-correcting generation — depends entirely on this
agent executing correctly. An incorrect rollback (e.g., partial restore, wrong
checkpoint) corrupts the pipeline state and makes subsequent retries meaningless.

**Independent Test**: With the retry counter at 2, trigger a gate failure by
providing a `gate-report.json` with one failing component. Verify that `src/` is
fully restored to its pre-Phase-3 state (no generated component files remain), the
retry counter decrements to 1 in `pipeline-config.json`, and the failure context
from `gate-report.json` is passed back to Agent 6. Then set the counter to 0 and
trigger a gate failure — verify the Rollback Agent escalates as a hard failure
without attempting a rollback.

**Acceptance Scenarios**:

1. **Given** Agent 30 signals a gate failure, **When** Agent 40 runs, **Then** the
   `src/` directory is fully restored to its pre-Phase-3 checkpoint state — all
   files generated by the Design-to-Code Crew are removed and any pre-existing
   files are restored.
2. **Given** a gate failure with three failing components, **When** Agent 40
   prepares the retry signal for Agent 6, **Then** the failure context includes:
   each failing component's name, the gate dimension(s) that failed, the exact
   scores received, and the delta needed to pass.
3. **Given** a successful rollback, **When** Agent 40 updates `pipeline-config.json`,
   **Then** the retry counter is decremented by exactly 1.
4. **Given** the retry counter in `pipeline-config.json` is already 0, **When**
   Agent 40 is triggered, **Then** it does NOT perform a rollback — instead it
   writes a hard failure record to `reports/gate-report.json` (with
   `status: retries_exhausted`) and escalates to the pipeline operator.
5. **Given** Agent 40 is triggered, **When** it performs the rollback, **Then**
   `specs/` and `tokens/` directories are untouched — only `src/` is reverted to
   checkpoint.
6. **Given** a rollback completes, **When** inspecting `reports/gate-report.json`,
   **Then** a `rollback_executed` timestamp entry is appended to the report record
   for auditability.

---

### Edge Cases

- `src/components/` is empty (Design-to-Code Crew produced zero files) — Agent 50
  detects no test targets, writes an empty coverage report, and Agent 20 produces
  zero component entries in `quality-scores.json`. Agent 30 records a pipeline-level
  failure: `reason: no_components_generated`.
- A test file fails to compile before the test runner can execute it — Agent 50
  records the compilation failure in the a11y/coverage reports as a zero-coverage
  entry for that component. Agent 20 scores that component's coverage as 0/30 and
  documentation as 0/15.
- `pipeline-config.json` is missing the `qualityGates` key — Agent 20 falls back to
  hardcoded defaults (composite ≥ 70, coverage ≥ 80%, a11y critical = 0) and logs a
  warning that the config was incomplete.
- A component exists in `src/components/` but has no corresponding story file —
  Agent 20 scores that component's usage examples dimension as 0/10.
- A component exists in `src/components/` but has no corresponding documentation
  entry — Agent 20 scores that component's documentation dimension as 0/15.
- `reports/` directory does not exist when Agent 50 runs — Agent 50 creates it
  (and subdirectories) before writing any output.
- The a11y check suite encounters a component that cannot be rendered in the test
  environment (e.g., missing provider) — Agent 50 records a render-failure entry
  for that component in `a11y-report.json` and counts it as a critical a11y
  violation for scoring purposes.
- Multiple gate dimensions fail simultaneously for the same component — Agent 30
  records all failure reasons in `gate-report.json` for that component, not just
  the first one found.
- The pre-Phase-3 checkpoint does not exist (first run, no prior checkpoint) — Agent
  40 cannot restore `src/` to a checkpoint. It records a `checkpoint_missing` hard
  failure and escalates without attempting a partial rollback.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Component Factory Crew MUST fail-fast if any required input is
  absent: at least one file in `src/components/`, `src/primitives/`, `src/__tests__/`,
  `tokens/compiled/tokens.ts`, `tokens/compiled/tokens.json`, and
  `pipeline-config.json`.
- **FR-002**: Agent 50 MUST run before Agents 20 and 30. Agents 20 and 30 MUST NOT
  run if Agent 50 has not produced valid, non-empty output reports.
- **FR-003**: Agent 50 MUST execute the full test suite against `src/` and write a
  valid LCOV coverage report to `reports/coverage/`.
- **FR-004**: Agent 50 MUST run an automated a11y check suite against all components
  in `src/components/` and write the results to `reports/a11y-report.json` with one
  structured entry per component listing violation counts by severity.
- **FR-005**: If Agent 50's coverage or a11y output is empty or malformed, Agent 50
  MUST retry once. After two failed attempts, Agent 50 escalates as a hard failure.
- **FR-006**: Agent 20 MUST compute a composite quality score (0–100) for every
  component using the weighted formula: coverage (30 pts) + a11y (25 pts) + token
  integrity (20 pts) + documentation presence (15 pts) + usage examples (10 pts).
- **FR-007**: Agent 20 MUST read quality gate thresholds from `pipeline-config.json`.
  When thresholds are absent from the config, Agent 20 falls back to defaults
  (composite ≥ 70, coverage ≥ 80%, a11y critical violations = 0,
  token resolution = 100%, documentation present, examples ≥ 1) and logs a warning.
- **FR-008**: Agent 20 MUST write `reports/quality-scores.json` containing: one entry
  per component, each with the composite score, all five sub-scores, the threshold
  values used, and the source report references that informed each sub-score.
- **FR-009**: Agent 30 MUST read `quality-scores.json` and apply the dual-gate rule:
  both the composite threshold AND all five individual gate conditions must be
  satisfied independently.
- **FR-010**: Agent 30 MUST write one `gate-report.json` entry per evaluated
  component, including components that pass. No component may be omitted from
  the report.
- **FR-011**: For each failing component, Agent 30 MUST record in `gate-report.json`:
  the component name, all gate dimensions that failed, the actual score received,
  and the threshold that was not met.
- **FR-012**: Beta components (listed in `pipeline-config.json`'s
  `lifecycle.betaComponents`) MUST be evaluated with relaxed thresholds: composite
  ≥ 60/100 and coverage ≥ 60%. The a11y individual gate (zero critical violations)
  remains strict for beta components.
- **FR-013**: When `brand-profile.json` specifies `accessibility.level: AAA`, Agent
  30 MUST apply the AAA a11y gate: zero critical AND zero serious violations required.
  This overrides the default AA gate.
- **FR-014**: When all components pass the dual gate, Agent 30 MUST signal pipeline
  continuation to Phase 4 without triggering the Rollback Agent.
- **FR-015**: When any component fails the dual gate, Agent 30 MUST trigger Agent 40
  and MUST NOT signal Phase 4 continuation.
- **FR-016**: Agent 40 MUST be triggered exclusively by Agent 30. No other agent or
  external process may invoke Agent 40.
- **FR-017**: Agent 40 MUST restore the `src/` directory to its pre-Phase-3
  checkpoint state when triggered. The restore MUST be complete — partial restores
  are not permitted.
- **FR-018**: Agent 40 MUST decrement the retry counter in `pipeline-config.json`
  by 1 after each successful rollback.
- **FR-019**: When the retry counter in `pipeline-config.json` is 0, Agent 40 MUST
  NOT perform a rollback. It MUST write a `retries_exhausted` entry to
  `gate-report.json` and escalate to the pipeline operator as a hard failure.
- **FR-020**: Agent 40 MUST NOT modify `specs/` or `tokens/` during rollback. Only
  `src/` is reverted to the checkpoint.
- **FR-021**: When the pre-Phase-3 checkpoint does not exist, Agent 40 MUST record
  a `checkpoint_missing` hard failure and escalate without attempting any rollback.
- **FR-022**: The Component Factory Crew MUST NOT write to `src/`, `specs/`,
  `tokens/`, `docs/`, or `governance/`. All crew output is isolated to `reports/`.
- **FR-023**: Agent 30 MUST append a `rollback_executed` timestamp to the
  `gate-report.json` entry when Agent 40 completes a rollback, for auditability.

### Key Entities

- **Quality Score**: A structured record in `quality-scores.json` for a single
  component. Contains: component name, composite score (0–100), five sub-scores
  (coverage, a11y, token integrity, documentation, usage examples), the thresholds
  applied (stable or beta tier), and references to the source reports used for scoring.

- **Gate Report**: A structured record in `gate-report.json` for every evaluated
  component — both passing and failing. For failures: includes all failed gate
  dimensions, actual scores received, and thresholds not met. For passes: records
  the composite score and pass timestamp. Serves as the complete quality audit trail
  for the pipeline run.

- **Pre-Phase-3 Checkpoint**: A snapshot of the `src/` directory state immediately
  before the Design-to-Code Crew writes any output. Used exclusively by Agent 40 to
  restore `src/` on gate failure. The checkpoint mechanism is filesystem-level (e.g.,
  a copy or git stash) — the spec does not prescribe the implementation technique.

- **Retry Counter**: An integer value in `pipeline-config.json` tracking how many
  Phase 3 retry attempts remain. Initialized to 3 by Bootstrap Agent 5. Decremented
  by Agent 40 on each rollback. When 0, hard failure escalation is mandatory.

### Crew I/O Contract

| | Files |
|---|---|
| **Reads (required)** | `src/components/*.tsx`, `src/primitives/*.tsx`, `src/hooks/use*.ts`, `src/__tests__/*.test.{tsx,ts}`, `src/stories/*.stories.tsx`, `tokens/compiled/tokens.ts`, `tokens/compiled/tokens.json`, `pipeline-config.json` |
| **Reads (optional)** | `brand-profile.json` (for AAA a11y gate override), `reports/coverage/` (Agent 20 reads Agent 50's output), `reports/a11y-report.json` (Agent 20 reads Agent 50's output) |
| **Writes** | `reports/quality-scores.json`, `reports/gate-report.json`, `reports/coverage/` (LCOV), `reports/a11y-report.json` |

**Boundary constraints**:
- [x] This crew does NOT produce both spec YAMLs and TSX source for the same component
      (this crew produces no source at all — it is evaluation-only)
- [x] This crew does NOT produce both raw tokens and compiled tokens
      (this crew reads tokens but writes nothing to `tokens/`)
- [x] This crew does NOT write to another crew's declared output namespace (`src/`,
      `specs/`, `tokens/`, `docs/`, `governance/`). Rollback Agent reverts `src/` to
      a checkpoint but does not author new content there.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `reports/quality-scores.json` contains exactly one entry per component
  file in `src/components/` and `src/primitives/`. Zero components are omitted from
  scoring.
- **SC-002**: `reports/gate-report.json` contains exactly one entry per evaluated
  component, including those that pass. The entry count matches the component count
  in `quality-scores.json`.
- **SC-003**: When Agent 30 triggers a gate failure, the `src/` directory is
  verifiably restored: the file list and content of `src/` after rollback equals
  the pre-Phase-3 checkpoint state.
- **SC-004**: The retry counter in `pipeline-config.json` decrements by exactly 1
  per rollback execution. It never goes below 0.
- **SC-005**: When all components pass the dual gate, Phase 4 continuation is
  signalled and zero rollback executions occur.
- **SC-006**: The composite score computed by Agent 20 is reproducible: running the
  same crew against the same inputs twice produces identical `quality-scores.json`
  output.

## Assumptions

- The pre-Phase-3 checkpoint is created by the pipeline orchestration layer (Agent 6
  or equivalent) before the Design-to-Code Crew writes any output. The Component
  Factory Crew assumes the checkpoint exists and does not create it.
- `pipeline-config.json` is present and readable before this crew runs (guaranteed
  by Bootstrap Agent 5).
- `brand-profile.json` is present and readable — used only to determine the AAA a11y
  gate override. If absent, the AA default is applied.
- The a11y check suite used by Agent 50 can render React components in a headless
  environment. If the test environment cannot render a component (e.g., missing
  ThemeProvider), the render failure is treated as a critical violation for scoring.
- `reports/` directory may or may not exist when the crew starts. Agent 50 creates it
  if absent.
- A component listed in `lifecycle.betaComponents` that does not have a corresponding
  file in `src/components/` is silently skipped — no error is raised for beta
  components not yet generated.

## Out of Scope

- Regenerating, fixing, or modifying component TSX, hook, test, or story files —
  this crew is evaluation-only. Any remediation happens in Phase 3 retries.
- Running the full downstream pipeline (Phase 4+) — that is signalled by Agent 30
  to Agent 6, which orchestrates Phase 4 separately.
- Generating documentation — that is the Documentation Crew (Phase 4a).
- Visual regression testing — not in scope for DAF Local. Component Factory Crew
  validates functional correctness and a11y, not visual snapshots.
- Performance profiling or bundle-size analysis — out of scope for this crew.
- Enforcing code style or linting (ESLint, Prettier) — not a quality gate dimension
  in this pipeline version.
