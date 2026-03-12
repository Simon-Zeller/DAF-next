<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 1.4.0
Type: Minor — 4 new development workflow principles added.

Modified principles: N/A

Added sections:
  - XI. Test-Driven Development (TDD)
  - XII. One Task, One Branch
  - XIII. Manual Testing by the Agent
  - XIV. Task Completion Gate

Removed sections: N/A

Templates requiring updates:
  ✅ .specify/templates/plan-template.md — Constitution Check gates XI–XIV added

Follow-up TODOs:
  - None.
-->

# DAF Local Constitution

## Core Principles

### I. Agent-First, Tool-Assisted

Every workflow in DAF MUST be agent-orchestrated. Deterministic tools (compilers,
linters, validators, renderers) are invoked BY agents — they MUST NOT run standalone
outside an agent context. The agent owns the decision; the tool executes it.

When the boundary between agentic and deterministic is ambiguous, the rule is: make it
agentic. An agent invoking a deterministic tool is strictly more capable than the tool
alone. Hybrid modes (agent interprets deterministic output) are preferred over pure
tool-only automation.

Rationale: Intelligence lives in the agents. Tools are execution primitives. Separating
concerns ensures the pipeline can reason about failures, escalate, retry, and explain
decisions — none of which a standalone tool can do.

### II. Token-First

Every visual decision MUST originate as a design token. W3C DTCG is the single
canonical authoring format for all token tiers (global, semantic, component-scoped).
Tokens are authored once and compiled to every target platform (CSS, SCSS, TypeScript,
JSON, and any platform targets in the Brand Profile).

No hardcoded color, spacing, typography, or other visual value is permitted anywhere in
generated component source. Every style declaration MUST reference a compiled token.
Components MUST consume only semantic tokens — never global tokens or theme-specific
values directly. The Token Compliance Agent (32) enforces this at every pipeline run.

Rationale: Token-first is the foundation of zero drift. If tokens are the atoms, every
other artifact is a molecule. Breaking this rule means the design system can no longer
be compiled, themed, or maintained as a unit.

### III. Sequential Crew Handoff via Shared Filesystem

The pipeline is strictly sequential at the phase level. Each crew writes its outputs to
the shared output folder on disk. The next crew reads from that folder. The output
folder IS the shared state — there is no event bus, no pub/sub, no in-memory passing.

A crew MUST fail-fast if its declared required inputs are not present in the output
folder. A crew MUST NOT proceed by inferring or hallucinating missing inputs.

Phase ordering is non-negotiable: Phase N MUST NOT start before Phase N-1 has written
all its declared outputs. Within phases, intra-phase ordering is enforced where
documented in the PRD (Phase 3: Design-to-Code → Component Factory; Phase 4:
Documentation → Governance). Phase 5 crews have no mutual dependency.

Rationale: Filesystem-as-state makes every pipeline run inspectable, resumable, and
debuggable. Any agent at any phase can be re-run in isolation given the correct input
files on disk.

### IV. Bounded Retry, Never Silent Failure

The pipeline MUST implement bounded retry loops at all generator ↔ validator
boundaries. Retry limits are:

- Phases 1–3: Maximum **3 retries per component per validation stage**. Retry context
  accumulates — each attempt receives all prior rejection messages appended.
- Phases 4–6: Maximum **2 retries per crew** (crew-level re-run, no per-agent retry).

A component that exhausts retries MUST be marked `failed` in `reports/generation-summary.json`
with full error traces. It MUST NOT be silently dropped or omitted from the report.
The Pipeline Completeness Agent (34) MUST flag all stuck components.

Rollback cascades forward: restoring a checkpoint invalidates all subsequent phases.
The First Publish Agent (6) MUST never resume mid-sequence after a rollback — it
re-runs from the restored phase with a clean output slate.

Resume-on-failure via `--resume <output-folder>` is a first-class feature. The CLI
MUST support resumption from the last successfully written phase checkpoint.

Rationale: Silent failures produce incomplete design systems that appear valid. Bounded
retry with accumulating context gives agents the best opportunity to self-correct.
Cascading rollback prevents stale artifacts from corrupting downstream crews.

### V. Human Gates, Not Human Labor

Agents own all orchestration, generation, validation, and decision-making. Humans
review and approve only at defined gates — they MUST NOT be required for any
intermediate step.

Two mandatory human approval gates:

1. **Brand Profile Gate** (Phase 1, Agent 1): The user MUST approve the finalized,
   enriched `brand-profile.json` before the pipeline begins generation. No downstream
   crew runs until this gate is cleared.
2. **Final Output Gate** (Phase 6, Agent 6): The user MUST review the final generation
   report and output folder before the result is considered complete.

No other gates are permitted unless explicitly added via a constitutional amendment
with an accompanying ADR.

Rationale: Human review at the right moments captures intent and validates results.
Human review at every step defeats the purpose of an agentic pipeline.

### VI. Dual Quality Gate

Every component MUST pass both of the following independent quality thresholds before
it is fully accepted:

**Gate A — Composite Score** (Agent 20, Phase 3):
Minimum **70/100** composite score, weighted as:
- Test coverage: 25% (line coverage %)
- A11y pass rate: 25% (% of axe-core rules passing)
- Token compliance: 20% (% style values from tokens vs hardcoded)
- Composition depth: 15% (primitives-only = full marks, direct DOM = penalty)
- Spec completeness: 15% (all required YAML fields present)

**Gate B — Individual Gates** (Agent 30, Phase 4b):
All of the following MUST pass independently:
- Minimum **80% line test coverage** per component
- Zero critical accessibility violations (axe-core)
- All token references resolve (no phantom refs)
- Every component has documentation (verified after Phase 4a runs)
- Every component has at least one usage example in its docs

A component that passes Gate A but fails Gate B is NOT accepted. Both gates must pass.
Doc completeness is verified by the Drift Detection Agent (33) in Phase 5, NOT in
Phase 3. Checking doc completeness before docs exist is prohibited.

Rationale: The composite score catches overall poor quality. Individual gates catch
specific non-negotiable requirements that the composite can mask by averaging.

### VII. Anthropic-Only Model Tiers

All LLM invocations in the pipeline MUST use Anthropic models exclusively. No other
LLM provider is permitted. Three tiers are defined:

| Tier | Purpose | Default Model |
|---|---|---|
| Tier 1 — Generative | Complex code/prose generation requiring deep reasoning | claude-opus-4 |
| Tier 2 — Analytical | Structured analysis and reasoned decisions | claude-sonnet-4 |
| Tier 3 — Classification | Routing, classification, simple structural checks | claude-haiku-4 |
| Deterministic | No LLM — pure tool invocation | N/A |

Tier assignment for every agent is defined in PRD §3.7 and is non-negotiable in source
code. Tier overrides MUST be applied via environment variables only:
`DAF_TIER1_MODEL`, `DAF_TIER2_MODEL`, `DAF_TIER3_MODEL`. Hardcoding tier changes in
source is prohibited and constitutes a constitutional violation.

Rationale: Tier discipline controls cost and latency without sacrificing quality where
it matters. Anthropic-only prevents drift from inconsistent provider behaviors.

### VIII. Plugin Architecture

Every tool, compiler, and linter in the pipeline MUST be implemented as a plugin. The
core pipeline orchestration MUST NOT contain tool logic inline. Adding a new compiler
target, linter, or validation rule MUST be achievable by registering a new plugin —
no fork of core pipeline code is permitted.

Rationale: The plugin contract is what makes the pipeline extensible across brands,
platforms, and future tooling without accumulating technical debt in the core.

### IX. Phase Ordering is Strict

Phase N MUST NOT begin until Phase N-1 has completed successfully and written all
declared outputs. This applies at the phase level and within phases where documented:

- Phase 3: Design-to-Code Crew MUST complete before Component Factory Crew begins.
- Phase 4: Documentation Crew (4a) MUST complete before Governance Crew (4b) begins.
  The Quality Gate Agent (30) verifies "all components have docs" — this check
  requires documentation to exist.
- Phase 5: AI Semantic Layer and Analytics crews have no mutual dependency and MAY
  run in either order.

The First Publish Agent (6) is the sole enforcer of phase sequencing. No other
mechanism may advance or skip phases.

Rationale: Downstream crews have explicit file-level dependencies on upstream outputs.
Out-of-order execution produces artifacts based on missing or stale inputs.

### X. No Crew Crosses Boundaries

Every crew has a single, bounded responsibility defined by its I/O contract (PRD §3.6).
The following boundary rules are absolute:

- A crew MUST NOT produce both spec YAMLs and TSX source for the same component.
  (Bootstrap writes specs; Design-to-Code produces TSX.)
- A crew MUST NOT produce both raw tokens and compiled tokens.
  (Bootstrap writes raw; Token Engine validates and compiles.)
- A crew MUST NOT write to another crew's declared output namespace.
- Agent 5 (Pipeline Configuration) MUST NOT write to `governance/` directly.

Any boundary crossing constitutes a contract violation and MUST be treated as a
pipeline error, not a convenience shortcut.

Rationale: Boundary discipline is what makes each crew independently testable,
replaceable, and debuggable. Cross-contamination of responsibilities makes the
pipeline fragile and hard to reason about across phases.

### XI. Test-Driven Development (TDD)

Every function MUST have a corresponding test written BEFORE the function is
implemented — no exceptions. The Red-Green-Refactor cycle is mandatory:

1. Write a failing test that describes the expected behavior.
2. Get approval or proceed (test is in red).
3. Implement the minimum code to make the test pass (green).
4. Refactor only after tests are green.

Tests MUST be lean, readable, and scoped to a single behavior. Avoid:
- Over-mocked tests that test the mock, not the logic.
- Test files longer than the implementation file.
- Tests that test multiple unrelated behaviors in a single `it` block.

One test per behavior. Name it so a non-author can understand what it asserts
without reading the implementation.

Rationale: TDD is the most reliable way to ensure correctness before shipping.
Lean, understandable tests are the only tests that get maintained.

### XII. One Task, One Branch

Every task defined in `tasks.md` MUST be implemented on its own dedicated git branch
created from `main`. The branch naming convention is:
`task/[###-feature-name]/[task-id]-[short-description]`

When a task is fully complete (see Principle XIV), the branch MUST be merged into
`main` before the next task begins. No task accumulates work across multiple branches.
No task is merged while another task's branch is open.

Rationale: Small, focused branches keep history readable, conflicts minimal, and
each task independently revertable.

### XIII. Manual Testing by the Agent

Before declaring a task complete, the agent MUST manually test the feature as a
human user would — not just verify that automated tests pass.

This means:
- Running the actual CLI, server, or UI with realistic inputs.
- Walking through the primary user scenario from the spec end-to-end.
- Verifying that outputs (files, terminal output, UI state) look and behave correctly
  from a user's perspective — not just that internal assertions pass.
- Explicitly documenting what was tested and the observed outcome in the task
  completion note.

Automated tests and manual testing are complementary. One does not substitute
for the other.

Rationale: Automated tests verify logic. Manual testing verifies that the assembled
feature actually works for a human. Silent regressions in UX are invisible to unit tests.

### XIV. Task Completion Gate

A task is NOT complete until ALL five of the following conditions are verified and
documented:

1. **Green tests** — All automated tests pass (`npm test` or equivalent exits 0).
2. **Lint clean** — No lint errors or warnings (`npm run lint` exits 0).
3. **No TypeScript errors** — TypeScript compilation succeeds with zero errors
   (`tsc --noEmit` exits 0).
4. **No runtime errors** — The feature runs without unhandled exceptions or crashes
   under normal use.
5. **Manual testing passed** — Per Principle XIII, the agent has walked through the
   feature as a human user and confirmed correct behavior.

A task that passes 4 of 5 conditions is NOT complete. All 5 are mandatory.
The branch MUST NOT be merged until all 5 conditions are confirmed.

Rationale: Each condition catches a different class of defect. Skipping any one
condition is equivalent to shipping untested code.

## Pipeline Constraints

The following operational constraints apply to all pipeline runs and implementations:

**Local-only output.** The pipeline generates a testable folder on disk. There is no
cloud deployment, no remote registry push, and no network-dependent output step.
The output folder MUST be a standalone, installable package (`npm install` ready).

**Checkpoint integrity.** The Rollback Agent (40) MUST write timestamped snapshots of
the output folder at every phase boundary. Checkpoints MUST include all files written
by the completed phase. A checkpoint is invalid if any declared output file is missing
or zero-bytes.

**Resume semantics.** When `--resume <output-folder>` is invoked, the pipeline MUST
validate the last checkpoint's integrity before resuming. If the checkpoint is corrupt
or incomplete, the CLI MUST report the specific issue and ask the user whether to
restart from Phase 1. Silent resumption from a corrupt checkpoint is prohibited.

**Performance targets** (non-blocking, flagged as warnings if exceeded):
- Token compilation (5K tokens): < 30 seconds
- Full token pipeline: < 90 seconds
- Single component (Phase 3): < 5 minutes
- Batch, Starter scope (10 components): < 20 minutes
- Batch, Comprehensive scope (25+ components): < 60 minutes

## Development Workflow

**ADR requirement.** Any deviation from a constitutional principle MUST be documented
as an Architecture Decision Record in `docs/decisions/` before implementation begins.
The ADR MUST include: Context (why the deviation is needed), Decision (what is being
changed), and Consequences (what the tradeoffs are). An unapproved deviation without
an ADR is a constitutional violation regardless of outcome quality.

**Model tier overrides.** Changing the model assigned to any tier MUST be done
exclusively via environment variables (`DAF_TIER1_MODEL`, `DAF_TIER2_MODEL`,
`DAF_TIER3_MODEL`). Hardcoding model identifiers in source code at a different tier
than the PRD assignment is prohibited. Tier assignment changes (moving an agent from
one tier to another) require a constitutional amendment, not just an env var.

**Boundary contracts.** Every new agent or crew added to the pipeline MUST declare
its I/O contract (required reads, optional reads, writes) in the same format as PRD
§3.6 before implementation. A crew without a declared I/O contract MUST NOT be merged.

**Doc completeness timing.** Implementations MUST NOT check doc completeness in
Phase 3. The Drift Detection Agent (33) in Phase 5 owns this check. Any gate or
assertion in Phase 3 that references documentation existence is a violation.

## Governance

This constitution supersedes all implementation decisions, feature specifications, and
plan documents. When a conflict exists between this document and any other artifact,
this document takes precedence.

**Amendment process:**
1. Author an ADR documenting the proposed change, rationale, and consequences.
2. The ADR MUST be reviewed and accepted before the constitution is modified.
3. Increment the version following semantic versioning:
   - MAJOR: Backward-incompatible removal or redefinition of a principle.
   - MINOR: New principle or section added, or materially expanded guidance.
   - PATCH: Clarifications, wording, typo fixes, non-semantic refinements.
4. Update `Last Amended` date on the same day the change is applied.
5. All dependent templates MUST be reviewed for consistency on the same day.

**Compliance review.** Every feature plan MUST include a Constitution Check section
verifying alignment with all 10 principles before work begins. Plans that cannot
demonstrate compliance MUST include a reference to an accepted ADR justifying the
deviation.

**Version policy.** The constitution version is independent of the DAF product version.
Constitutional changes are infrequent; product releases are frequent.

**Version**: 1.4.0 | **Ratified**: 2026-03-12 | **Last Amended**: 2026-03-12
