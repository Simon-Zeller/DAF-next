# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [e.g., library/cli/web-service/mobile-app/compiler/desktop-app or NEEDS CLARIFICATION]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify alignment with all 10 DAF constitutional principles before proceeding:

- [ ] **I. Agent-First, Tool-Assisted** — Does this feature use agents to orchestrate all
  decisions? Are deterministic tools invoked by agents, not standalone?
- [ ] **II. Token-First** — Are all visual decisions expressed as design tokens? Is W3C DTCG
  the authoring format? No hardcoded values in component source?
- [ ] **III. Sequential Crew Handoff** — Does the crew write to the shared output folder?
  Does it fail-fast if required inputs are missing? No event bus or in-memory passing?
- [ ] **IV. Bounded Retry** — Are retry limits enforced (max 3/component for Phases 1–3,
  max 2/crew for Phases 4–6)? Are failures logged with full traces, never silent?
- [ ] **V. Human Gates** — Are the two mandatory gates (Brand Profile, Final Output) present?
  No additional gates unless accompanied by an ADR?
- [ ] **VI. Dual Quality Gate** — Does every component pass both composite score ≥ 70/100
  AND all individual Agent 30 gates? Doc completeness NOT checked in Phase 3?
- [ ] **VII. Anthropic-Only Model Tiers** — Are model assignments from PRD §3.7? No tier
  changes hardcoded in source? Overrides via env vars only?
- [ ] **VIII. Plugin Architecture** — Are all tools, compilers, linters implemented as
  plugins? No tool logic inlined in core pipeline code?
- [ ] **IX. Phase Ordering** — Does Phase N start only after Phase N-1 completes? Are
  intra-phase orderings respected (3: D2C→Factory; 4: Docs→Governance)?
- [ ] **X. No Crew Crosses Boundaries** — Does this crew stay within its declared I/O
  contract? No crew producing both specs and code, or both raw and compiled tokens?
- [ ] **XI. Test-Driven Development** — Is every function preceded by a failing test?
  Are tests lean, single-behavior, and named descriptively? No implementation before
  its test exists?
- [ ] **XII. One Task, One Branch** — Does every task in `tasks.md` have its own branch
  from `main`? Is the naming convention `task/[feature]/[id]-[desc]` followed?
  Is the branch merged to `main` before the next task begins?
- [ ] **XIII. Manual Testing by the Agent** — Has the agent walked through the primary
  user scenario end-to-end with realistic inputs? Is the observed outcome documented?
  Automated tests alone do NOT satisfy this gate.
- [ ] **XIV. Task Completion Gate** — Before merging: green tests, lint clean, zero
  TypeScript errors, no runtime errors, AND manual testing passed? All 5 are mandatory.

**If any gate fails**: Reference an accepted ADR in `docs/decisions/` before proceeding.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
