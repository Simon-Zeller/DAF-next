# Feature Specification: Governance Crew

**Feature Branch**: `007-governance-crew`
**Created**: 2026-03-12
**Status**: Draft
**Input**: User description: "Feature: Governance Crew. The sixth CrewAI crew in the
DAF pipeline (Phase 4b — runs after the Documentation Crew, before the AI Semantic
Layer and Analytics Crews). Purpose: generate a team adoption kit — structured
configuration artifacts that define how the design system should be operated when
adopted by a team."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Quality Gates Enforced Before Release (Priority: P1)

A design system lead runs the full DAF pipeline. After the Documentation Crew
completes, the Governance Crew's Quality Gate Agent evaluates every component against
five individual pass/fail gates: minimum 80% test coverage, zero critical accessibility
violations, all token references resolve, all components have documentation pages, and
all components have at least one usage example. Components that fail any gate are
flagged in the quality report with the specific gate name. Only components that pass
both the composite 70/100 score (from Agent 20) and all five individual gates are
fully accepted. The agent also generates four project-level test suite files
(`tests/tokens.test.ts`, `tests/a11y.test.ts`, `tests/composition.test.ts`,
`tests/compliance.test.ts`) that encode these gates as executable tests — these are
what `npm test` runs at release time.

**Why this priority**: Gate enforcement is the primary responsibility of the Governance
Crew and the mechanism that guarantees the released design system meets its quality
contract. Without it, the pipeline has no automated exit criteria and nothing to run
at release validation. All other governance artifacts (ownership, workflows, policies)
are valuable but not pipeline-blocking — this gate is.

**Independent Test**: Run Agent 30 alone against a pipeline output where one component
has 60% test coverage (below the 80% threshold) and one component has a missing doc
page. Verify that `governance/quality-gates.json` exists and records the 80% threshold
as derived from `pipeline-config.json`. Verify that `reports/quality-scorecard.json`
(as updated by Agent 30) flags the first component as failing the coverage gate and
the second as failing the docs gate. Verify that all four test suite files exist in
`tests/` with non-empty content. Verify that no component failing any gate is marked
as fully accepted.

**Acceptance Scenarios**:

1. **Given** a pipeline output where all components pass all five gate checks,
   **When** Agent 30 runs, **Then** `governance/quality-gates.json` is written with
   all five gate definitions and thresholds, and every component is marked as
   `fully-accepted` in the gate report.
2. **Given** a component with 65% line test coverage (below the 80% threshold from
   `pipeline-config.json`), **When** Agent 30 evaluates the coverage gate, **Then**
   that component is flagged as failing gate `min-test-coverage` with the actual
   coverage percentage recorded alongside the required threshold.
3. **Given** a component with at least one critical axe-core accessibility violation
   in `reports/a11y-audit.json`, **When** Agent 30 evaluates the a11y gate, **Then**
   that component is flagged as failing gate `a11y-zero-critical` with the violation
   count recorded.
4. **Given** a token reference in a component that does not resolve to any value in
   `tokens/compiled/tokens.json`, **When** Agent 30 evaluates the token resolution
   gate, **Then** that component is flagged as failing gate `token-refs-resolve` with
   the unresolvable token name recorded.
5. **Given** the Documentation Crew has run and one component has no file in
   `docs/components/`, **When** Agent 30 evaluates the docs gate, **Then** that
   component is flagged as failing gate `all-components-have-docs`.
6. **Given** a component with no usage example in either its spec YAML or its
   generated doc page, **When** Agent 30 evaluates the usage example gate, **Then**
   that component is flagged as failing gate `min-usage-examples`.
7. **Given** Agent 30 completes gate evaluation, **When** inspecting `tests/`,
   **Then** four test suite files exist (`tokens.test.ts`, `a11y.test.ts`,
   `composition.test.ts`, `compliance.test.ts`), each containing executable test
   cases that encode the corresponding gate's pass/fail logic.
8. **Given** the gate thresholds in `pipeline-config.json` specify `minTestCoverage:
   90` (overriding the default 80), **When** Agent 30 writes `governance/quality-gates.json`,
   **Then** the `min-test-coverage` gate threshold is 90 — the crew never invents or
   overrides threshold values.

---

### User Story 2 — Component Ownership Map Ready for Team Assignment (Priority: P1)

A design lead shares the generated design system with their engineering organization.
They open `governance/ownership.json` and find every component and token category
already classified into logical domains (e.g., "forms", "navigation", "feedback",
"layout", "data-display"). The domain categories come from `pipeline-config.json`'s
`domains.categories` array, so they match how the organization already thinks about
its product areas. Components that span multiple domains are flagged. Components with
no clear domain are identified as orphans. The ownership map is ready for the lead to
assign real team members to domains — no manual classification is needed.

**Why this priority**: Ownership is the foundation of team adoption. Without a clear
ownership map, the design system has no accountability structure and cannot scale
beyond the initial generation. The Governance Crew is the only place in the pipeline
where domain assignment occurs — no other crew has this responsibility.

**Independent Test**: Run Agent 26 alone against a Starter-scope pipeline output
(10 components). Verify `governance/ownership.json` exists. Assert every component
name from `reports/generation-summary.json` appears exactly once in the ownership map.
Assert each entry has a `domain` field matching one of the values in
`pipeline-config.json`'s `domains.categories`. Assert that any component flagged
as multi-domain has a `domains` array with more than one entry. Assert orphaned
components (if any) are listed under an `orphans` key.

**Acceptance Scenarios**:

1. **Given** a Starter-scope pipeline with 10 components and a `domains.categories`
   array of `["forms", "navigation", "feedback", "layout"]`, **When** Agent 26 runs,
   **Then** every component is assigned to exactly one domain from that list, and
   `governance/ownership.json` is written.
2. **Given** a `Modal` component that serves both "navigation" and "feedback" concerns,
   **When** Agent 26classifies it, **Then** the entry is flagged as multi-domain with
   both domain names listed and a human-readable note explaining the overlap.
3. **Given** a component that cannot be adequately classified into any domain from the
   `domains.categories` array, **When** Agent 26 processes it, **Then** the component
   is listed under an `orphans` array in `governance/ownership.json` with a note that
   it requires manual domain assignment.
4. **Given** token categories (color, typography, spacing, elevation, radius, motion),
   **When** Agent 26 generates the ownership map, **Then** each token category is also
   assigned to a domain — token ownership is included in the same map as component
   ownership.
5. **Given** a Comprehensive-scope pipeline (26 components), **When** Agent 26 runs,
   **Then** `governance/ownership.json` covers all 26 components and all token
   categories without omissions.

---

### User Story 3 — Contribution Workflows Defined for Token and Component Changes (Priority: P2)

A senior engineer wants to add a new component to the design system after initial
generation. They open `governance/workflow.json` and find a clear state machine
definition showing the exact pipeline a new component contribution must follow: which
stages it passes through, which quality gates apply at each stage, and what the
acceptance criteria are. A separate workflow for token changes shows what steps a
color update must go through before it reaches compiled output. Each workflow is
named, self-contained, and can be handed directly to a team's CI/CD process.

**Why this priority**: Workflows unlock the ongoing maintainability of the design
system. Without them, the design system is a one-time generation artifact. P2 because
they are essential for long-term adoption but do not affect the immediate pipeline
validation that Agent 30 provides (P1).

**Independent Test**: Run Agent 27 alone. Verify `governance/workflow.json` exists and
is valid JSON. Assert at minimum two named workflows are present: one for new component
contributions and one for token changes. Assert each workflow is a sequence of stages,
each stage has a name and an array of gate checks. Assert the token change workflow
includes a compilation and validation step. Assert the component workflow includes
a code generation, quality scoring, and documentation step.

**Acceptance Scenarios**:

1. **Given** a completed pipeline run, **When** Agent 27 runs, **Then**
   `governance/workflow.json` is written containing at least two named workflow
   definitions: `new-component` and `token-change`.
2. **Given** the `new-component` workflow, **When** inspecting its stages, **Then**
   it includes stages covering: spec authoring, code generation, quality gate
   evaluation, documentation generation, and acceptance — in that order.
3. **Given** the `token-change` workflow, **When** inspecting its stages, **Then**
   it includes stages covering: token file update, validation against the DTCG
   schema, compilation to all configured target formats, drift detection, and
   acceptance.
4. **Given** a Brand Profile specifying `accessibilityTier: AAA`, **When** Agent 27
   generates the `new-component` workflow, **Then** the quality gate evaluation stage
   includes an explicit AAA a11y check — not just the default AA check.
5. **Given** the quality gate thresholds from `pipeline-config.json`, **When** Agent
   27 embeds gate references in the workflow, **Then** the gate check names in
   `workflow.json` match the gate identifiers written by Agent 30 in
   `governance/quality-gates.json` — no invented gate names.

---

### User Story 4 — Deprecation Policy and Lifecycle Tags in Place (Priority: P2)

A platform lead reviews the generated design system before publishing it internally.
They open `governance/deprecation-policy.json` and find a complete policy: the grace
period before a deprecated component is removed (defaulting to the value from
`pipeline-config.json`), the rules for injecting deprecation warnings into consuming
code, migration guide requirements that must accompany any removal, and the criteria
that trigger removal eligibility. Every generated component and token category already
carries a lifecycle status tag (`stable`, `beta`, or `experimental`). Any component
listed in `pipeline-config.json`'s `lifecycle.betaComponents` has been tagged `beta`.

**Why this priority**: Lifecycle policy determines how safely the design system can
evolve after initial release. Teams adopt a design system with the expectation that
breaking changes are managed — a missing deprecation policy is a trust barrier. P2
because it governs future evolution, not the current release.

**Independent Test**: Run Agent 28 alone against a pipeline output where
`pipeline-config.json` specifies `deprecationGracePeriodDays: 120` and
`betaComponents: ["DatePicker", "ColorPicker"]`. Verify
`governance/deprecation-policy.json` exists with `gracePeriodDays: 120`. Verify that
the `DatePicker` and `ColorPicker` components are tagged `beta` in the deprecation
policy's lifecycle status map. Verify all other components from the generation summary
are tagged `stable` (or `experimental` if any were explicitly flagged as such in
`pipeline-config.json`).

**Acceptance Scenarios**:

1. **Given** `pipeline-config.json` specifies `deprecationGracePeriodDays: 90`,
   **When** Agent 28 generates `governance/deprecation-policy.json`, **Then** the
   policy's grace period is 90 days — the crew does not invent a different period.
2. **Given** `pipeline-config.json` lists `betaComponents: ["DatePicker"]`, **When**
   Agent 28 tags lifecycle statuses, **Then** `DatePicker` is tagged `beta` and all
   other Starter-scope components are tagged `stable` unless explicitly set otherwise.
3. **Given** `governance/deprecation-policy.json` is inspected, **When** reviewing
   its content, **Then** it contains: grace period, warning injection rules (condition
   under which warnings are emitted), migration guide requirements (what must
   accompany a removal PR), and removal criteria (conditions that must be met before
   a component can be removed).
4. **Given** a component tagged `beta`, **When** the deprecation policy is applied in
   future (by a downstream toolchain), **Then** the policy specifies a shorter grace
   period or different warning injection rule for beta components vs. stable ones.
5. **Given** a Comprehensive-scope pipeline with complex components typically treated
   as experimental (per `pipeline-config.json`'s `lifecycle.defaultStatus`), **When**
   Agent 28 tags lifecycle statuses, **Then** those components are correctly tagged
   `experimental` rather than defaulting to `stable`.

---

### User Story 5 — RFC Templates Enable Structured Future Changes (Priority: P3)

A developer wants to propose adding a new primitive to the design system. They open
`docs/templates/` and find a complete RFC template that tells them exactly what they
need to include in their proposal: the context, the decision they're proposing, the
consequences, and the approval criteria. A separate template handles breaking token
change proposals. Each template is standalone — a contributor can fill it in without
needing to read governance documentation first.

**Why this priority**: RFC templates lower the friction of contributing to the design
system after initial generation. P3 because they are process scaffolding for future
contributors — valuable but with no impact on the current generation run or release.

**Independent Test**: Run Agent 29 alone. Verify `docs/templates/` contains at
minimum two files: `rfc-new-primitive.md` and `rfc-breaking-token-change.md`. Open
each and assert it contains: a `## Context` section, a `## Proposed Decision` section,
a `## Consequences` section, and an `## Approval Criteria` section. Verify neither
template contains placeholder text (e.g., `[fill in]`) that would indicate an
incomplete template.

**Acceptance Scenarios**:

1. **Given** a completed pipeline run, **When** Agent 29 runs, **Then**
   `docs/templates/rfc-new-primitive.md` and `docs/templates/rfc-breaking-token-change.md`
   are written, each with all required sections populated with instructional guidance
   (not blank placeholders).
2. **Given** the `rfc-new-primitive.md` template, **When** inspecting its Approval
   Criteria section, **Then** it specifies that a new primitive RFC requires: spec
   YAML authoring, Design-to-Code Crew re-run, and full quality gate passage before
   merging.
3. **Given** the `rfc-breaking-token-change.md` template, **When** inspecting
   its Approval Criteria section, **Then** it specifies that a breaking token change
   requires: token diff generation, downstream component impact assessment, and a
   migration guide authored before the change is merged.
4. **Given** a Brand Profile specifying a custom RFC trigger rule (e.g., any change
   to the base token tier requires an RFC), **When** Agent 29 generates the templates,
   **Then** the approval criteria sections of relevant templates reflect that custom
   rule.

---

### Edge Cases

- `pipeline-config.json` is absent — the crew fails fast with an error: "pipeline-config.json
  not found; governance artifacts cannot be generated without the pipeline configuration
  seed." No partial output is written to `governance/`.
- `reports/quality-scorecard.json` is absent — Agent 30 writes the four test suite
  files and `governance/quality-gates.json` with thresholds from `pipeline-config.json`,
  but cannot evaluate per-component gate status; the gate report notes that the
  quality scorecard was unavailable and marks all component gate results as `unknown`.
- `docs/components/` is empty or absent when Agent 30 evaluates the "all components
  have docs" gate — every component is flagged as failing the docs gate; Agent 30 does
  not skip the gate or treat absence as a pass.
- `pipeline-config.json` specifies a `domains.categories` array that is empty — Agent
  26 detects the empty array, classifies all components as orphans, writes the
  ownership map with all components under `orphans`, and logs a crew-level warning
  that domain assignment could not be performed.
- A component name in `reports/generation-summary.json` is not present in any spec
  YAML — Agent 26 still assigns it a domain (using its component name as the
  classification signal) and flags it as `untracked-spec` in the ownership map.
- Agent 30 test suite generation produces a test file that covers a gate for which
  no components exist in scope (e.g., a form-specific compliance test when no form
  components were generated) — the test file is still written with an appropriate
  `it.skip` or empty test suite comment, never omitted entirely.
- `pipeline-config.json`'s `qualityGates.blockOnWarnings` is `true` — Agent 30
  treats quality warnings (not just failures) as gate failures; any component with
  a warning-level finding is marked as not fully accepted.

## Requirements *(mandatory)*

### Functional Requirements

**Agent 26 — Ownership Agent**

- **FR-001**: Agent 26 MUST write `governance/ownership.json` assigning every
  component listed in `reports/generation-summary.json` and every token category
  present in `tokens/*.tokens.json` to exactly one primary domain from the
  `domains.categories` array in `pipeline-config.json`.
- **FR-002**: Components that span more than one domain MUST be flagged as
  multi-domain, with all applicable domain names listed and a human-readable
  explanation of the overlap.
- **FR-003**: Components that cannot be assigned to any domain from the
  `domains.categories` array MUST be recorded under an `orphans` key in
  `governance/ownership.json`, not silently dropped or force-assigned.
- **FR-004**: The ownership map MUST be structured to support future human assignment
  — each domain entry MUST include an `assignee` field initialized to `null`, which
  teams populate during adoption.
- **FR-005**: Agent 26 MUST NOT write any file outside of `governance/`.

**Agent 27 — Workflow Agent**

- **FR-006**: Agent 27 MUST write `governance/workflow.json` containing at minimum
  two named workflow definitions: `new-component` and `token-change`.
- **FR-007**: Each workflow definition MUST be a named sequence of stages; each stage
  MUST include a `name` field and a `gates` array listing the quality gate identifiers
  that must pass before the stage is considered complete.
- **FR-008**: Gate identifiers referenced in `workflow.json` MUST match the gate
  identifiers written by Agent 30 in `governance/quality-gates.json` — no invented or
  mismatched gate names.
- **FR-009**: If `pipeline-config.json` specifies `a11yLevel: AAA`, the
  `new-component` workflow MUST include an explicit AAA accessibility check stage
  distinct from the default AA check.
- **FR-010**: Agent 27 MUST NOT write any file outside of `governance/`.

**Agent 28 — Deprecation Agent**

- **FR-011**: Agent 28 MUST write `governance/deprecation-policy.json` containing:
  `gracePeriodDays` (from `pipeline-config.json`'s `lifecycle.deprecationGracePeriodDays`),
  warning injection rules, migration guide requirements, and removal criteria.
- **FR-012**: Every component in `reports/generation-summary.json` MUST be tagged
  with a lifecycle status (`stable`, `beta`, or `experimental`) in the deprecation
  policy's lifecycle status map. Beta status for components listed in
  `pipeline-config.json`'s `lifecycle.betaComponents` MUST be applied.
- **FR-013**: The `gracePeriodDays` value MUST come from `pipeline-config.json` — 90
  days is the default only when the field is absent from the config; the crew never
  overrides an explicitly set value.
- **FR-014**: Agent 28 MUST NOT write any file outside of `governance/`.

**Agent 29 — RFC Agent**

- **FR-015**: Agent 29 MUST write at minimum two RFC template files to
  `docs/templates/`: `rfc-new-primitive.md` and `rfc-breaking-token-change.md`.
- **FR-016**: Each RFC template MUST contain all four required sections: `## Context`,
  `## Proposed Decision`, `## Consequences`, and `## Approval Criteria`. No section
  may be blank or contain unfilled placeholder text.
- **FR-017**: The Approval Criteria section of `rfc-new-primitive.md` MUST specify
  that a new primitive requires spec authoring, a Design-to-Code Crew re-run, and
  full quality gate passage.
- **FR-018**: The Approval Criteria section of `rfc-breaking-token-change.md` MUST
  specify that a breaking token change requires a token diff, a downstream component
  impact assessment, and a migration guide before merge.
- **FR-019**: Agent 29 MUST write only to `docs/templates/` — no other path.

**Agent 30 — Quality Gate Agent**

- **FR-020**: Agent 30 MUST write `governance/quality-gates.json` defining all five
  gate identifiers with their threshold values sourced exclusively from
  `pipeline-config.json`'s `qualityGates` block: `min-test-coverage` (threshold:
  `minTestCoverage`), `a11y-zero-critical` (threshold: 0 critical violations),
  `token-refs-resolve` (threshold: 100% resolution), `all-components-have-docs`
  (threshold: one file per component in `docs/components/`), `min-usage-examples`
  (threshold: 1 example per component).
- **FR-021**: Agent 30 MUST evaluate every component in `reports/generation-summary.json`
  against all five gates and record the result (pass/fail + actual value vs. threshold)
  for each gate per component in the gate report written to `reports/quality-scorecard.json`.
- **FR-022**: A component is `fully-accepted` only if it passes both the composite
  70/100 score (recorded by Agent 20) and all five individual gates (evaluated by
  Agent 30). Any component failing either check MUST NOT be marked as `fully-accepted`.
- **FR-023**: The "all components have docs" gate MUST be evaluated against the
  actual contents of `docs/components/` — Agent 30 checks for the existence of a file
  named `<ComponentName>.md` for each component in `reports/generation-summary.json`.
  If `docs/components/` is absent, every component fails this gate.
- **FR-024**: Agent 30 MUST generate exactly four test suite files:
  `tests/tokens.test.ts` (validates token JSON structure, DTCG schema compliance,
  and reference resolution), `tests/a11y.test.ts` (asserts all interactive components
  have correct ARIA roles), `tests/composition.test.ts` (asserts all components
  compose only from recognized primitives), `tests/compliance.test.ts` (asserts zero
  hardcoded style values appear in any component source).
- **FR-025**: The four test suite files MUST be executable — they must run when
  `npm test` is executed and produce pass/fail results. They MUST NOT be documentation
  stubs or placeholder files.
- **FR-026**: Gate threshold values MUST be derived from `pipeline-config.json`.
  Agent 30 MUST NOT invent or override threshold values — the `pipeline-config.json`
  is the authoritative source.

**Crew-Level**

- **FR-027**: The crew MUST fail fast (exit with an error, write nothing to
  `governance/`) if `pipeline-config.json` is absent from the output folder.
- **FR-028**: The crew MUST complete all five agent tasks in under 3 minutes for a
  Comprehensive-scope pipeline run.
- **FR-029**: The crew MUST append a governance-run status record to
  `reports/generation-summary.json` on completion, recording: start time, end time,
  per-agent task status (pass/fail), and any warnings (e.g., missing optional inputs,
  orphaned components detected, gate evaluation with unknown scorecard).
- **FR-030**: The crew MUST NOT write to `src/`, `tokens/`, `specs/`. It writes
  exclusively to `governance/`, `docs/templates/`, `tests/`, and the
  `reports/generation-summary.json` append.

### Key Entities

- **Ownership Map**: A JSON file at `governance/ownership.json` that classifies every
  component and token category into a domain. Each domain entry has an `assignee`
  field (initially `null`) awaiting a real team member. Multi-domain and orphan
  components are explicitly identified.
- **Workflow Definition**: A JSON file at `governance/workflow.json` structured as a
  map of named workflows, each containing an ordered sequence of stages with gate
  references. Acts as the contribution state machine for the design system.
- **Deprecation Policy**: A JSON file at `governance/deprecation-policy.json` defining
  the rules for how components and tokens are deprecated, warned, and removed.
  Contains the lifecycle status map tagging each component as stable/beta/experimental.
- **Quality Gates Config**: A JSON file at `governance/quality-gates.json` defining
  the five individual gate identifiers and their threshold values. The authoritative
  reference for what "fully accepted" means for any component; sourced from
  `pipeline-config.json` — not independently authored.
- **RFC Template**: A Markdown file in `docs/templates/` that provides a structured
  template for proposing changes to the design system. Each template is pre-filled
  with instructional guidance so contributors can use it without reading additional
  governance documentation.
- **Gate Report**: The per-component gate evaluation results written to
  `reports/quality-scorecard.json` by Agent 30. Records each gate's pass/fail status
  and the actual value vs. threshold for every component in the pipeline run.
- **Project Test Suites**: Four TypeScript test files in `tests/` generated by Agent
  30 that encode the quality gates as executable tests. These are the test files that
  `npm test` runs at release time.

### Crew I/O Contract *(mandatory for DAF crew features)*

| | Files |
|---|---|
| **Reads (required)** | `brand-profile.json`, `pipeline-config.json`, `specs/*.spec.yaml`, `reports/quality-scorecard.json` |
| **Reads (optional)** | `docs/components/` (Agent 30 — docs existence gate), `reports/generation-summary.json` |
| **Writes** | `governance/ownership.json`, `governance/workflow.json`, `governance/deprecation-policy.json`, `governance/quality-gates.json`, `docs/templates/rfc-new-primitive.md`, `docs/templates/rfc-breaking-token-change.md`, `tests/tokens.test.ts`, `tests/a11y.test.ts`, `tests/composition.test.ts`, `tests/compliance.test.ts`, appends to `reports/generation-summary.json` |

**Boundary constraints** (check all that apply):
- [x] This crew does NOT produce both spec YAMLs and TSX source for the same component
- [x] This crew does NOT produce both raw tokens and compiled tokens
- [x] This crew does NOT write to another crew's declared output namespace

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `governance/quality-gates.json` is written with all five gate definitions
  and threshold values that are verifiably sourced from `pipeline-config.json` — zero
  invented or hardcoded threshold values.
- **SC-002**: Every component in `reports/generation-summary.json` has a gate
  evaluation result in the gate report — 100% component coverage, no components
  skipped.
- **SC-003**: All four project-level test suite files (`tests/tokens.test.ts`,
  `tests/a11y.test.ts`, `tests/composition.test.ts`, `tests/compliance.test.ts`) are
  written and pass `tsc --noEmit` type checking with zero errors.
- **SC-004**: `governance/ownership.json` assigns every component and every token
  category to a domain or to `orphans` — zero components or token categories are
  absent from the ownership map.
- **SC-005**: Full governance artifact generation for a Comprehensive-scope pipeline
  run (26 components) completes in under 3 minutes, measured from crew start to
  `reports/generation-summary.json` append written.
- **SC-006**: Both RFC templates exist in `docs/templates/` and contain all four
  required sections with non-empty instructional content — no blank sections,
  no unfilled placeholder text.

## Assumptions

- `pipeline-config.json` is the authoritative configuration seed for all governance
  artifacts. The Governance Crew is a consumer of this file, not an author. Any
  threshold, lifecycle setting, or domain category that is not present in
  `pipeline-config.json` uses the documented default value; no values are invented.
- `reports/quality-scorecard.json` is written by the Component Factory Crew (Agent 20)
  before the Governance Crew starts. It contains per-component composite scores and
  per-component a11y audit results needed by Agent 30.
- `docs/components/` is written by the Documentation Crew (Agent 21) before the
  Governance Crew starts. The Phase 4 strict ordering (Documentation Crew → Governance
  Crew) is enforced by the pipeline orchestrator. Agent 30's "all components have docs"
  gate evaluation is only meaningful after this ordering is satisfied.
- The four test suite files written by Agent 30 (`tests/`) follow the project's Vitest
  configuration (`vitest.config.ts`) already generated by Agent 5. They do not create
  their own test runner configuration.
- Workflow gate identifiers in `governance/workflow.json` reference gates by their
  identifier strings (as defined in `governance/quality-gates.json`) — they do not
  embed gate logic directly. The workflow file is a process definition, not a
  gate evaluator.
- Human gate override data (if any) is not within the scope of this crew. Override
  data lives in `reports/generation-summary.json` and is consumed by the Documentation
  Crew's Generation Narrative Agent (23), not the Governance Crew.

## Out of Scope

- Evaluating the composite 70/100 quality score — that is the Component Factory
  Crew's responsibility (Agent 20). The Governance Crew enforces individual pass/fail
  gates only.
- Running `npm test` — that is the Release Crew's responsibility (Agent 39). The
  Governance Crew generates the test files; the Release Crew executes them.
- Generating the release changelog — that is the Release Crew's responsibility
  (Agent 37).
- Assigning real team members to domains — the ownership map provides the
  organizational blueprint; real assignment happens during team adoption, outside
  the generation pipeline.
- Authoring or modifying `src/`, `tokens/`, or `specs/` — this crew produces
  governance and process artifacts only.
- Enforcing governance policies at runtime (e.g., blocking a commit that doesn't
  follow a workflow) — the generated artifacts are configuration blueprints;
  enforcement tooling is outside DAF's scope.
