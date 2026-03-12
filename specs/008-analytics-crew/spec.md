# Feature Specification: Analytics Crew

**Feature Branch**: `008-analytics-crew`
**Created**: 2026-03-12
**Status**: Draft
**Input**: User description: "Feature: Analytics Crew. The seventh CrewAI crew in the
DAF pipeline (Phase 5 — runs after Governance Crew; has no strict ordering dependency
relative to the AI Semantic Layer Crew, so both Phase 5 crews may run in either
order). Purpose: analyze the generated design system for quality, consistency,
compliance, and structural health. Produces reports only."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Token Compliance Violations Surfaced Before Release (Priority: P1)

A design system engineer opens the pipeline output after a Comprehensive-scope run.
Before approving the release, they check `reports/token-compliance.json` and
`reports/token-usage.json`. The compliance report lists every location in every
generated component where a hardcoded style value — a hex color, a raw pixel spacing,
a bare font size — appears instead of a token reference. Each entry names the
component, the offending value, and the token that should replace it. The usage report
shows which defined tokens were never referenced in any component source, so they can
evaluate whether those tokens should be kept or pruned. Both reports are produced
without modifying any source file.

**Why this priority**: Token compliance is the single most common generation failure
mode — a component that uses `color: #333` instead of `var(--color-text-primary)` is
silently drifting from the token architecture. These violations cannot be caught by
the Governance Crew's quality gates alone (which check for the presence of tests, not
for inline style values). Catching them in a dedicated report before the user approves
the release is the Analytics Crew's highest-value contribution.

**Independent Test**: Introduce one hardcoded `color: #FF0000` into a generated
component and one unused token into `tokens/semantic.tokens.json`. Run Agents 31 and
32 alone. Verify `reports/token-compliance.json` exists and contains an entry for the
modified component with the offending value `#FF0000` and a suggested token
replacement. Verify `reports/token-usage.json` exists and lists the unused semantic
token under an `unused` array.

**Acceptance Scenarios**:

1. **Given** a generated component that contains a hardcoded hex color (`#1A1A1A`),
   **When** Agent 32 runs its static analysis, **Then** `reports/token-compliance.json`
   contains an entry for that component with: the component name, the offending value
   (`#1A1A1A`), the violation type (`hardcoded-color`), and a suggested token
   replacement from the resolved token set.
2. **Given** a generated component that uses `padding: 8px` as a hardcoded value,
   **When** Agent 32 runs, **Then** the entry in `reports/token-compliance.json`
   identifies the violation type as `hardcoded-spacing` and suggests the
   corresponding spacing token.
3. **Given** a semantic token defined in `tokens/semantic.tokens.json` that is never
   referenced in any `.tsx` source file or story file, **When** Agent 31 scans the
   output, **Then** `reports/token-usage.json` lists that token under `unusedTokens`
   with the token name and its tier.
4. **Given** all components are fully token-compliant (zero hardcoded values),
   **When** Agent 32 runs, **Then** `reports/token-compliance.json` is written with
   an empty `violations` array and a summary line stating zero violations were found.
5. **Given** a component uses a deprecated token reference (a token present in
   `tokens/base.tokens.json` with a `deprecated: true` flag), **When** Agent 32 scans
   it, **Then** a `deprecated-token` violation entry is written with the deprecated
   token name and the recommended replacement token.
6. **Given** Agent 31 completes its scan, **When** inspecting
   `reports/token-usage.json`, **Then** it contains: a `usedTokens` map (token name →
   array of component names that reference it), an `unusedTokens` array, an
   `unreferencedPrimitives` array (primitives defined but not imported by any
   component), and a `primitiveUsage` map (primitive name → components that import
   it).

---

### User Story 2 — Spec/Code/Docs Drift Detected and Auto-Fixed (Priority: P1)

After the Design-to-Code Crew and Documentation Crew have both run, a prop was added
to a component's spec YAML in a late-stage update that was not reflected in the
generated documentation. The Drift Detection Agent compares all three representations
— spec, code, and docs — for every component. It finds the inconsistency: the prop
exists in the spec and in the generated code, but the doc page omits it. Because this
is auto-fixable drift (the spec and code agree; only the docs lag), the agent patches
the doc file in place and records the fix in `reports/drift-report.json`. Any
inconsistency where code disagrees with the spec is non-fixable — it is recorded
with a recommended action for the pipeline operator.

**Why this priority**: Drift is a silent correctness failure. A doc page that
misrepresents a component's API is worse than a missing doc page because it actively
misleads consumers. The spec is the single source of truth — gaps between spec and
docs undermine the value of the Documentation Crew's output. Auto-fixing where
possible, and clearly flagging what cannot be auto-fixed, makes drift visible and
actionable.

**Independent Test**: Create a spec YAML for a component with a `size` prop. Generate
the component code reflecting that prop. Manually remove the `size` prop from the
component's generated doc page. Run Agent 33. Verify that `docs/components/<Component>.md`
now contains the `size` prop entry (auto-fixed). Verify `reports/drift-report.json`
records the fix: component name, the missing prop, fix type `auto-fixed`. Then
introduce a spec YAML with a `variant` prop that is absent from the generated code.
Run Agent 33. Verify `reports/drift-report.json` records this as `non-fixable` with
a recommended action of "re-run Design-to-Code Crew for this component."

**Acceptance Scenarios**:

1. **Given** a component where a prop exists in the spec YAML and the component's
   TSX source but is absent from the generated doc page, **When** Agent 33 runs,
   **Then** the doc page is patched to include the prop entry AND
   `reports/drift-report.json` records the fix with: component name, prop name, fix
   type `auto-fixed`, and a timestamp.
2. **Given** a component where a prop exists in the spec YAML but is absent from the
   generated TSX source (code-vs-spec mismatch), **When** Agent 33 runs, **Then** the
   spec YAML is NOT modified, the doc page is NOT modified, and
   `reports/drift-report.json` records the inconsistency as `non-fixable` with
   recommended action `re-run Design-to-Code Crew for <ComponentName>`.
3. **Given** a component where a variant is present in the TSX source but not defined
   in the spec YAML, **When** Agent 33 runs, **Then** the inconsistency is recorded
   in `reports/drift-report.json` as `non-fixable` with recommended action `update
   spec YAML for <ComponentName> to add variant or remove from code`.
4. **Given** a token referenced in a component's doc page that does not resolve to
   any entry in `tokens/compiled/tokens.json`, **When** Agent 33 runs, **Then** the
   inconsistency is recorded as `non-fixable` (phantom token reference) with the
   unresolvable token name.
5. **Given** a component with zero drift between spec, code, and docs, **When** Agent
   33 runs, **Then** no entry for that component appears in the `inconsistencies`
   array of `reports/drift-report.json`.
6. **Given** Agent 33 patches a doc file, **When** Agent 35 subsequently appends its
   breakage-correlation section to `reports/drift-report.json`, **Then** the auto-fix
   records from Agent 33 are preserved — Agent 35 appends only, does not overwrite.

---

### User Story 3 — Pipeline Completeness Reveals Stuck Components (Priority: P2)

After a Comprehensive-scope run, the pipeline operator notices in the generation
summary that three components are marked as failed. They open
`reports/pipeline-completeness.json` and see a stage-by-stage completeness map for
every component. Two of the three failed components are stuck at the `tests-written`
stage (code exists but no test file), while the third is stuck at `a11y-passed`
(code and tests exist but the a11y audit recorded a critical violation). Each stuck
component has a recommended intervention. The operator can now target exactly the
right re-run option at the output review gate without re-running the entire pipeline.

**Why this priority**: Pipeline completeness reporting is what transforms raw quality
scores into actionable prioritization. Without it, a failed component is just a
failure. With it, the operator knows whether to re-run the Design-to-Code Crew, the
Component Factory Crew, or only the Documentation Crew. It is P2 because the
information is additive to the existing quality reports, not a hard gate.

**Independent Test**: Run Agent 34 against a pipeline output where one component has
a TSX file but no `.test.tsx` file. Verify `reports/pipeline-completeness.json`
exists. Assert that component appears with `stageReached: code-generated` and
`blockedAt: tests-written`. Assert the `recommendedIntervention` field is non-empty
and mentions re-running the Design-to-Code Crew.

**Acceptance Scenarios**:

1. **Given** a component with a spec YAML, a TSX source file, and a test file but
   no doc page in `docs/components/`, **When** Agent 34 runs, **Then** that component
   appears in `reports/pipeline-completeness.json` with `stageReached: tests-written`,
   `blockedAt: docs-generated`, and a recommended intervention of "re-run
   Documentation Crew."
2. **Given** a component that has passed all pipeline stages including the quality
   gate, **When** Agent 34 runs, **Then** that component appears with
   `stageReached: fully-complete` and no `blockedAt` or `recommendedIntervention`
   fields.
3. **Given** a component with a TSX source file but no corresponding test file,
   **When** Agent 34 runs, **Then** the component's `blockedAt` is `tests-written`
   and the recommended intervention references re-running the Design-to-Code Crew
   (specifically the Test Generator agent).
4. **Given** a component with code and tests but a recorded critical a11y violation
   in `reports/a11y-audit.json`, **When** Agent 34 runs, **Then** the component's
   `blockedAt` is `a11y-passed` and the recommended intervention references the
   Component Factory Crew's accessibility remediation.
5. **Given** all components have reached `fully-complete`, **When** Agent 34 runs,
   **Then** `reports/pipeline-completeness.json` has a top-level `allComplete: true`
   summary field.

---

### User Story 4 — Root-Cause Failures Identified Across Dependency Chains (Priority: P2)

Three components failed during the pipeline run. The operator opens
`reports/drift-report.json` (breakage correlation section) and sees that only one is
a root-cause failure — `Button` failed its composition validation. The other two
failures (`Card` and `Dialog`) are downstream: they both import `Button`, so their
failures propagate from the same root cause. The report provides the full dependency
chain for each downstream failure. The operator knows that fixing `Button` alone will
likely resolve all three failures, so they use the `--retry-components Button` option
at the output review gate rather than re-running the entire pipeline.

**Why this priority**: Breakage correlation prevents the operator from spending time
debugging downstream failures that will be resolved automatically once the root cause
is fixed. Especially valuable for large Comprehensive-scope runs where multiple
cascading failures can appear after a single root-cause issue.

**Independent Test**: Run Agent 35 against a reports/generation-summary.json that
records two failed components where one imports the other. Verify the
breakage-correlation section of `reports/drift-report.json` classifies the imported
component as `root-cause` and the importing component as `downstream`, with the
dependency chain (imported-by) listed.

**Acceptance Scenarios**:

1. **Given** `reports/generation-summary.json` records `Button` as failed (validation
   exhausted) and `Card` as failed, and `src/components/Card/Card.tsx` imports from
   `src/components/Button/`, **When** Agent 35 runs, **Then** the breakage-correlation
   section of `reports/drift-report.json` classifies `Button` as `root-cause` and
   `Card` as `downstream` with `dependencyChain: ["Button"]`.
2. **Given** a three-level dependency chain where `Icon` fails, `Button` imports
   `Icon`, and `Card` imports `Button`, **When** Agent 35 traces the chain, **Then**
   `Card` is classified as `downstream` with `dependencyChain: ["Icon", "Button"]`
   — the full chain is recorded, not just the immediate dependency.
3. **Given** a component that fails with no dependent components importing it,
   **When** Agent 35 classifies it, **Then** it is classified as `root-cause` with an
   empty `dependencyChain` array.
4. **Given** zero component failures recorded in `reports/generation-summary.json`,
   **When** Agent 35 runs, **Then** it appends a breakage-correlation section to
   `reports/drift-report.json` with an empty `failures` array and a
   `summary: "No failures to correlate"` field.
5. **Given** both retry-exhausted failures (from Phase 3) and test failures (recorded
   by the Release Crew's final `npm test`), **When** Agent 35 analyzes them, **Then**
   both failure sources are included in the correlation analysis — no failure source
   is silently ignored.

---

### User Story 5 — Full Analytics Run Completes Within Time Budget (Priority: P3)

The pipeline operator runs a Comprehensive-scope generation (26 components, all three
token tiers, full docs). The Analytics Crew completes all five agent tasks — token
usage scan, compliance scan, drift detection, completeness tracking, and breakage
correlation — and writes all four report files within 5 minutes. The operator can
review the full analytics output without waiting beyond the acceptable pipeline
window.

**Why this priority**: The Analytics Crew runs in Phase 5 with no hard downstream
dependency (the Release Crew runs after it). However, a slow analytics run delays
the operator's ability to review the generation output. The 5-minute budget matches
the Documentation Crew's NFR and ensures Phase 5 does not become the pipeline
bottleneck.

**Independent Test**: Run the full Analytics Crew against a Comprehensive-scope
pipeline output and record the wall-clock time from crew start to all four report
files written. Assert the elapsed time is under 5 minutes.

**Acceptance Scenarios**:

1. **Given** a Comprehensive-scope pipeline output (26 components, three token tier
   files, full docs), **When** the Analytics Crew runs all five agents in sequence,
   **Then** all four report files exist and the crew completes in under 5 minutes.
2. **Given** any scope (Starter, Standard, or Comprehensive), **When** the Analytics
   Crew completes, **Then** `reports/token-usage.json`, `reports/token-compliance.json`,
   `reports/drift-report.json`, and `reports/pipeline-completeness.json` all exist
   with valid JSON content and non-zero file sizes.

---

### Edge Cases

- `reports/quality-scorecard.json` is absent — Agent 34 marks every component's
  `quality-gate-passed` stage as `unknown` rather than failed; the completeness report
  notes the scorecard was unavailable. All other agent tasks continue normally.
- `reports/a11y-audit.json` is absent — Agent 34 marks the `a11y-passed` stage as
  `unknown` for all components. Agent 32's static scan is unaffected (it reads source
  files, not audit reports). The completeness report notes the a11y audit was
  unavailable.
- A component source file is unreadable (corrupt or zero bytes) — Agents 31, 32, and
  33 record a `source-unreadable` error for that component in their respective reports
  and continue processing all other components. No agent aborts the full run for a
  single unreadable file.
- `docs/components/` is absent or empty when Agent 33 runs — the drift detection
  report records every component as having `doc-missing` drift (non-fixable, since
  there is no doc to patch); Agent 33 does not attempt to auto-generate doc pages —
  that is the Documentation Crew's responsibility.
- Agent 33 attempts an auto-fix doc patch but the patched doc file fails a basic
  structural validation (e.g., the result has duplicate section headers) — the patch
  is rolled back, the doc file is left unchanged, and the drift entry is reclassified
  from `auto-fixed` to `auto-fix-failed` in `reports/drift-report.json`.
- Agent 35 finds a component that is imported by another component, but the importer
  itself is not in `reports/generation-summary.json` (it may have been generated
  outside the current pipeline run) — Agent 35 records the import relationship as
  `external-dependent` and does not classify the importer as downstream.
- `reports/generation-summary.json` records zero components — the crew fails fast
  with an error log entry; all four report files are still written with empty data
  arrays and a `summary` field noting the generation summary was empty.

## Requirements *(mandatory)*

### Functional Requirements

**Agent 31 — Usage Tracking Agent**

- **FR-001**: Agent 31 MUST write `reports/token-usage.json` containing: a
  `usedTokens` map (token name → array of component names that reference it), an
  `unusedTokens` array (tokens defined in any tier file not referenced in any `.tsx`
  source), an `unreferencedPrimitives` array (primitives defined in `src/primitives/`
  but not imported by any component), and a `primitiveUsage` map (primitive name →
  array of component names that import it).
- **FR-002**: The `unusedTokens` entries MUST include the token name, its tier
  (global/semantic/component-scoped), and its resolved value.
- **FR-003**: Agent 31 MUST scan all `.tsx` files under `src/components/` and
  `src/primitives/` — not only files listed in `reports/generation-summary.json` —
  so that manually added or partially generated files are also covered.
- **FR-004**: Agent 31 MUST NOT write to any path outside of `reports/`.

**Agent 32 — Token Compliance Agent**

- **FR-005**: Agent 32 MUST write `reports/token-compliance.json` containing a
  `violations` array. Each entry MUST include: component name, violation type
  (`hardcoded-color`, `hardcoded-spacing`, `hardcoded-font-size`,
  `deprecated-token`), the offending literal value, and the suggested replacement
  token name from the resolved token set.
- **FR-006**: Agent 32 MUST scan for all four violation types: hardcoded color values
  (hex, `rgb()`, `hsl()`), hardcoded spacing values (bare `px`, `rem`, `em` numeric
  literals used as style values), hardcoded font size literals, and references to
  tokens flagged `deprecated: true` in any tier file.
- **FR-007**: `reports/token-compliance.json` MUST always be written even when zero
  violations are found. When no violations exist, the `violations` array MUST be
  empty and a `summary` field MUST state zero violations were found.
- **FR-008**: Agent 32 MUST NOT modify any source file. It is a read-only scanning
  agent with the sole write being `reports/token-compliance.json`.

**Agent 33 — Drift Detection Agent**

- **FR-009**: Agent 33 MUST compare three representations per component — spec YAML
  (`specs/<Component>.spec.yaml`), TSX source (`src/components/<Component>/`), and
  doc page (`docs/components/<Component>.md`) — and record every inconsistency in
  `reports/drift-report.json`.
- **FR-010**: The spec YAML is always authoritative. Agent 33 MUST NEVER modify a
  spec YAML. It may only patch doc files (auto-fixable drift) or record non-fixable
  drift entries.
- **FR-011**: Auto-fixable drift is defined as: a prop, variant, or token binding
  that exists in both the spec YAML and the TSX source but is absent or incorrect in
  the doc page. Agent 33 MUST patch the doc file in place for all auto-fixable drift
  entries.
- **FR-012**: Non-fixable drift is defined as any inconsistency where the TSX source
  disagrees with the spec YAML (missing prop, extra undocumented variant, phantom
  token). Agent 33 MUST record non-fixable entries with `recommendedAction` populated.
- **FR-013**: Every auto-fix patch MUST be recorded in `reports/drift-report.json`
  with: component name, drift type, what was patched, fix status (`auto-fixed` or
  `auto-fix-failed`), and a timestamp.
- **FR-014**: If an auto-fix attempt results in an invalid doc structure, Agent 33
  MUST roll back the patch, leave the doc file unchanged, and record the entry as
  `auto-fix-failed` — never leave a partially patched doc file on disk.
- **FR-015**: Agent 33 writes `reports/drift-report.json` first; Agent 35 appends a
  `breakagecorrelation` section. Agent 33 MUST structure its output to accommodate
  this append — the file MUST be valid JSON after Agent 33 writes it and remain valid
  after Agent 35 appends.

**Agent 34 — Pipeline Completeness Agent**

- **FR-016**: Agent 34 MUST write `reports/pipeline-completeness.json` containing
  one entry per component in `reports/generation-summary.json`. Each entry MUST
  include: component name, `stageReached` (the furthest pipeline stage the component
  successfully passed), `blockedAt` (the first stage it failed or is missing
  evidence for, or null if fully complete), and `recommendedIntervention` (null if
  fully complete, otherwise a plain-language action).
- **FR-017**: The pipeline stages MUST be evaluated in this order: `spec-validated`,
  `code-generated`, `a11y-passed`, `tests-written`, `docs-generated`,
  `quality-gate-passed`, `fully-complete`. A component's `stageReached` is the last
  stage for which evidence exists on disk or in reports.
- **FR-018**: Stage evidence rules: `spec-validated` — spec YAML exists;
  `code-generated` — TSX source file exists; `a11y-passed` — no critical violations
  in `reports/a11y-audit.json` (if absent, stage is `unknown`); `tests-written` —
  `.test.tsx` file exists alongside the source; `docs-generated` — doc file exists in
  `docs/components/`; `quality-gate-passed` — component marked as `fully-accepted`
  in `reports/quality-scorecard.json` (if absent, stage is `unknown`).
- **FR-019**: If all components reach `fully-complete`, Agent 34 MUST set a top-level
  `allComplete: true` summary field in `reports/pipeline-completeness.json`.
- **FR-020**: Agent 34 MUST NOT write to any path outside of `reports/`.

**Agent 35 — Breakage Correlation Agent**

- **FR-021**: Agent 35 MUST append a `breakageCorrelation` section to the existing
  `reports/drift-report.json` written by Agent 33. It MUST NOT overwrite the file;
  it appends only. The resulting file MUST remain valid JSON.
- **FR-022**: For each failed component in `reports/generation-summary.json`, Agent
  35 MUST determine whether it is `root-cause` (fails independently) or `downstream`
  (fails because a component it imports has also failed). Classification is based on
  import analysis of `src/components/**/*.tsx`.
- **FR-023**: Each failure entry in the `breakageCorrelation` section MUST include:
  component name, classification (`root-cause` or `downstream`), `dependencyChain`
  (array of upstream component names in dependency order, empty for root-cause
  failures), and `failureSource` (`retry-exhausted` or `test-failure`).
- **FR-024**: Agent 35 MUST source failures from both `reports/generation-summary.json`
  (retry-exhausted failures from Phases 2–3) and any test run failures recorded in
  the same file by the Release Crew — both failure sources MUST be included.
- **FR-025**: Agent 35 MUST NOT modify any source file, spec file, or doc file. Its
  only write is the append to `reports/drift-report.json`.

**Crew-Level**

- **FR-026**: The crew MUST complete all five agent tasks in under 5 minutes for a
  Comprehensive-scope pipeline run (26 components).
- **FR-027**: The crew MUST NOT write to `src/`, `tokens/`, `specs/`, or
  `governance/`. Doc file patches by Agent 33 (`docs/components/`) are the sole
  exception to the crew's reports-only write policy, and only for auto-fixable drift.
- **FR-028**: The crew MUST write all four report files even if individual agents
  encounter errors — a report file with an `errors` array is preferable to a missing
  report file. Partial data is recorded alongside the error condition.
- **FR-029**: The crew MUST append a crew-level analytics run record to
  `reports/generation-summary.json` on completion, recording: start time, end time,
  per-agent status (pass/fail/partial), and count summaries (violations found,
  inconsistencies found, components fully complete, failures correlated).

### Key Entities

- **Token Usage Map**: A JSON structure in `reports/token-usage.json` mapping every
  defined token to the components that use it, and identifying tokens that are defined
  but never consumed. The primary artifact for token pruning decisions.
- **Compliance Report**: A JSON file at `reports/token-compliance.json` listing every
  hardcoded style value found in component source that should be a token reference.
  Each entry is actionable — it names the fix.
- **Drift Report**: A JSON file at `reports/drift-report.json` covering two domains:
  (1) spec/code/docs inconsistencies written by Agent 33, including auto-fix
  records; (2) breakage correlation written by Agent 35. Two agents write to the
  same file in sequence — Agent 33 first, Agent 35 appends.
- **Pipeline Completeness Map**: A JSON file at `reports/pipeline-completeness.json`
  showing the furthest pipeline stage each component reached. The primary artifact
  for targeting partial re-runs at the output review gate.
- **Breakage Correlation**: The `breakageCorrelation` section appended to
  `reports/drift-report.json` by Agent 35. Classifies each failed component as
  root-cause or downstream and provides the full dependency chain.

### Crew I/O Contract *(mandatory for DAF crew features)*

| | Files |
|---|---|
| **Reads (required)** | `specs/*.spec.yaml`, `src/**/*.tsx`, `docs/components/*.md`, `tokens/base.tokens.json`, `tokens/semantic.tokens.json`, `tokens/component.tokens.json`, `reports/generation-summary.json`, `reports/quality-scorecard.json` |
| **Reads (optional)** | `reports/a11y-audit.json`, `reports/composition-audit.json` |
| **Writes** | `reports/token-usage.json`, `reports/token-compliance.json`, `reports/drift-report.json`, `reports/pipeline-completeness.json`, patches to `docs/components/*.md` (Agent 33 auto-fix only), appends to `reports/generation-summary.json` |

**Boundary constraints** (check all that apply):
- [x] This crew does NOT produce both spec YAMLs and TSX source for the same component
- [x] This crew does NOT produce both raw tokens and compiled tokens
- [x] This crew does NOT write to another crew's declared output namespace

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `reports/token-compliance.json` accounts for 100% of `.tsx` source
  files in `src/components/` and `src/primitives/` — zero source files are skipped
  by the compliance scan.
- **SC-002**: Every inconsistency detected by Agent 33 is recorded in
  `reports/drift-report.json` as either `auto-fixed` or `non-fixable` — zero
  inconsistencies are silently dropped. Auto-fixed patches leave the doc file in a
  structurally valid state verifiable by re-running doc validation.
- **SC-003**: `reports/pipeline-completeness.json` contains one entry per component
  in `reports/generation-summary.json` — 100% component coverage, zero omissions.
- **SC-004**: Every failed component in `reports/generation-summary.json` has a
  corresponding classification entry in the `breakageCorrelation` section of
  `reports/drift-report.json` — zero failures are unclassified.
- **SC-005**: The full Analytics Crew run completes in under 5 minutes for a
  Comprehensive-scope pipeline (26 components, three token tiers, full docs).
- **SC-006**: All four report files are valid JSON and non-empty after every Analytics
  Crew run, regardless of whether violations, drift, or failures were found — a clean
  run produces reports with empty arrays and summary fields, not missing files.

## Assumptions

- Agent 33's drift detection uses the spec YAML as the sole source of truth for what
  a component's API should be. Code and docs are compared against the spec — not
  against each other in isolation.
- Auto-fixable drift is limited to doc-only gaps: a prop, variant, or token binding
  that exists in both the spec and the code but is missing from or incorrect in the
  doc page. Any broader structural inconsistency is non-fixable.
- Agent 35 determines import relationships by analyzing import statements in
  `src/components/**/*.tsx` source files. It does not run the build or use a bundler
  — it performs static import analysis only.
- The Governance Crew's test suite files (`tests/`) exist by the time the Analytics
  Crew runs (Phase 5 follows Phase 4). The Analytics Crew reads test evidence
  (`.test.tsx` file existence) but does not execute tests itself.
- `reports/generation-summary.json` is the authoritative component manifest for
  Agent 34 and Agent 35. Components present on disk but absent from the summary are
  not tracked for completeness or failure correlation.
- The Analytics Crew has no strict ordering dependency relative to the AI Semantic
  Layer Crew. Both are Phase 5 crews and may run in either order. The Analytics Crew
  does not read from or depend on the AI Semantic Layer Crew's outputs
  (`registry/`, `.cursorrules`, `copilot-instructions.md`).

## Out of Scope

- Fixing hardcoded style values in component source — Agent 32 reports violations;
  it does not auto-correct source code. Source fixes require re-running the
  Design-to-Code Crew.
- Regenerating component source or tests — the Analytics Crew is a read-only analysis
  crew with the single exception of Agent 33's auto-fix doc patches.
- Running `npm test` or executing the project's test suites — that is the Release
  Crew's responsibility (Agent 39).
- Analyzing the AI Semantic Layer Crew's registry outputs — the Analytics Crew
  covers source, specs, docs, and tokens only.
- Authoring or modifying `governance/`, `src/`, `tokens/`, or `specs/`.
