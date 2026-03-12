# Feature Specification: DS Bootstrap Crew

**Feature Branch**: `002-ds-bootstrap-crew`
**Created**: 2026-03-12
**Status**: Draft
**Input**: User description: "Feature: DS Bootstrap Crew. The first CrewAI crew in
the DAF pipeline. Receives the raw brand-profile.json written by the interview CLI
and runs 6 agents to produce all foundational artifacts that every downstream crew
depends on."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Brand Profile Validated and Approved (Priority: P1)

A developer has answered the brand interview and has a raw `brand-profile.json` on
disk. They start the DAF pipeline. The Bootstrap Crew's Brand Discovery Agent (Agent
1) reads the file, resolves all fields against the selected archetype's defaults,
detects any contradictions, fills missing optional fields with sensible defaults, and
presents the finalized profile for human approval. Only after the user approves does
the crew continue.

**Why this priority**: This is the mandatory Human Gate 1. Nothing in the DAF pipeline
runs until the Brand Profile is validated and approved. Every downstream artifact
derives from this output. A corrupt or contradictory Brand Profile poisons the entire
pipeline.

**Independent Test**: Provide a raw `brand-profile.json` with a deliberate
contradiction (e.g., `density: compact` + `spacing: spacious`). Verify that Agent 1
flags the contradiction in its output, proposes a resolution, and halts at the
approval gate before writing the validated file.

**Acceptance Scenarios**:

1. **Given** a raw `brand-profile.json` with all required fields present and
   internally consistent, **When** Agent 1 runs, **Then** it writes an enriched
   `brand-profile.json` with archetype defaults resolved and halts at the human
   approval gate before proceeding.
2. **Given** a raw `brand-profile.json` with a density/spacing contradiction,
   **When** Agent 1 runs, **Then** it detects the contradiction, proposes a resolution
   in its output, and presents both the contradiction and proposed fix at the approval
   gate — the user can accept, reject, or override.
3. **Given** a raw `brand-profile.json` missing an optional field (e.g., no
   `typography.scaleRatio` provided), **When** Agent 1 runs, **Then** the enriched
   profile contains a sensible archetype-appropriate default for that field, and the
   filled default is visible in the approval output.
4. **Given** the user rejects the validated profile at the approval gate (e.g., wants
   to change the primary color), **When** rejection is recorded, **Then** the pipeline
   halts without writing any further artifacts, and a message instructs the user to
   re-run the interview CLI with corrections.
5. **Given** the user approves the validated profile, **When** approval is recorded,
   **Then** the enriched `brand-profile.json` is written to the output folder and
   Agents 2–5 proceed.

---

### User Story 2 — Raw Token Set Generated for All Archetypes (Priority: P1)

After Brand Profile approval, the Token Foundation Agent (Agent 2) generates a
complete initial token set across all three W3C DTCG tiers (global, semantic,
component-scoped). The output is three raw JSON files written to `tokens/`. For the
Multi-Brand archetype, additional brand override files are written to `tokens/brands/`.

**Why this priority**: Compiled tokens are the prerequisite for all component
generation (Phase 3). Without a valid three-tier raw token set, the Token Engine Crew
(Phase 2) cannot run, and nothing downstream can proceed.

**Independent Test**: Run the Bootstrap Crew with an Enterprise B2B brand profile.
Verify that `tokens/base.tokens.json`, `tokens/semantic.tokens.json`, and
`tokens/component.tokens.json` are all present and syntactically valid W3C DTCG JSON.
Verify that no compiled artifacts exist in `tokens/compiled/` — compilation is
exclusively the Token Engine Crew's responsibility.

**Acceptance Scenarios**:

1. **Given** an approved brand profile with `archetype: Enterprise B2B`, **When**
   Agent 2 runs, **Then** all three tier files are written atomically to `tokens/`.
   If any one file fails to write, none is written (partial output is not permitted).
2. **Given** an approved brand profile with `archetype: Multi-Brand Platform` and a
   `brands` array of two brand names, **When** Agent 2 runs, **Then** in addition to
   the three base tier files, two brand override files are written to
   `tokens/brands/<brand-name>.tokens.json` — one per brand.
3. **Given** Agent 2 has run, **When** inspecting the output folder, **Then** no
   files exist under `tokens/compiled/`. Compilation artifacts in `tokens/compiled/`
   created by Agent 2 constitute a boundary violation.
4. **Given** a `colors.primary` value in the brand profile that produces insufficient
   contrast against white when used as a foreground, **When** Agent 2 generates the
   semantic color tokens, **Then** it auto-adjusts the paired semantic token to achieve
   WCAG AA contrast (≥ 4.5:1) and logs the adjustment in its output.
5. **Given** a brand profile with `accessibility.level: AAA`, **When** Agent 2
   generates color tokens, **Then** all foreground/background semantic token pairs
   are generated to meet WCAG AAA contrast (≥ 7:1) rather than AA.

---

### User Story 3 — Spec YAMLs Generated for Primitives and Components (Priority: P1)

After token generation, Agent 3 (Primitive Scaffolding) and Agent 4 (Core Component)
generate canonical spec YAML files for all primitives and scoped-tier components.
These spec files are the sole source of truth for the Design-to-Code Crew in Phase 3.

**Why this priority**: The spec YAMLs are as foundational as the token files. Without
them, Phase 3 has nothing to generate from. Both spec output and token output are
required before the Bootstrap Crew can be considered complete.

**Independent Test**: Run with a Starter-scope brand profile. Verify that exactly 9
primitive spec files exist (`Box.spec.yaml`, `Stack.spec.yaml`, etc.) and exactly 10
component spec files exist (Button through Modal). Run with a Standard-scope profile
and verify 9 primitives + 19 component specs exist.

**Acceptance Scenarios**:

1. **Given** any approved brand profile, **When** Agent 3 runs, **Then** exactly 9
   primitive spec YAMLs are written to `specs/`: Box, Stack, Grid, Text, Icon,
   Pressable, Divider, Spacer, ThemeProvider.
2. **Given** a brand profile with `scope: Starter`, **When** Agent 4 runs, **Then**
   exactly 10 component spec YAMLs are written: Button, Input, Checkbox, Radio,
   Select, Card, Badge, Avatar, Alert, Modal.
3. **Given** a brand profile with `scope: Standard`, **When** Agent 4 runs, **Then**
   19 component spec YAMLs are written (Starter 10 + Table, Tabs, Accordion, Tooltip,
   Toast, Dropdown, Pagination, Breadcrumb, Navigation).
4. **Given** a brand profile with `scope: Comprehensive`, **When** Agent 4 runs,
   **Then** 26 component spec YAMLs are written (Standard 19 + DatePicker, DataGrid,
   TreeView, Drawer, Stepper, FileUpload, RichText).
5. **Given** any generated spec YAML, **When** inspecting its token bindings section,
   **Then** every token reference resolves to a token name that exists in the
   generated `tokens/semantic.tokens.json` or `tokens/component.tokens.json`. No
   hardcoded hex, px, or rem values appear in any spec file.
6. **Given** a brand profile with `componentOverrides` for a specific component (e.g.,
   a custom Button variant), **When** Agent 4 generates the Button spec, **Then** the
   overrides from the Brand Profile are reflected in the generated spec YAML.

---

### User Story 4 — Pipeline Config and Scaffolding Files Generated (Priority: P2)

Agent 5 (Pipeline Configuration) generates `pipeline-config.json` and the three
project scaffolding files (`tsconfig.json`, `vitest.config.ts`, `vite.config.ts`).
These files must exist before Phase 2 runs so downstream crews can compile and test.

**Why this priority**: Scaffolding files are required by Phase 2+ for TypeScript
compilation (`tsc --noEmit`) and test execution. Without them, the Token Engine Crew
cannot validate compiled output. This is a hard prerequisite for the entire downstream
pipeline, but it is secondary to the token and spec outputs which are higher stakes.

**Acceptance Scenarios**:

1. **Given** an approved brand profile with `accessibility.level: AAA`, **When**
   Agent 5 generates `pipeline-config.json`, **Then**
   `qualityGates.a11yLevel` is `"AAA"` and quality gate thresholds are set stricter
   than the AA defaults.
2. **Given** a brand profile with `scope: Comprehensive`, **When** Agent 5 generates
   `pipeline-config.json`, **Then** `lifecycle.betaComponents` contains the names of
   the 7 Comprehensive-tier components (DatePicker, DataGrid, TreeView, Drawer,
   Stepper, FileUpload, RichText).
3. **Given** Agent 5 has run, **When** inspecting the output folder, **Then** no
   files exist under `governance/`. Writing to `governance/` from Agent 5 is a
   boundary violation — that namespace belongs exclusively to the Governance Crew.
4. **Given** Agent 5 has run, **When** a downstream crew invokes `tsc --noEmit`,
   **Then** the generated `tsconfig.json` is well-formed and recognized by the
   TypeScript compiler without errors (given valid TypeScript source).

---

### User Story 5 — Full Pipeline Orchestrated to Completion (Priority: P2)

Agent 6 (First Publish Agent) orchestrates the full downstream pipeline in sequence,
monitors each crew's completion, and presents the final generation report to the user
for review (Human Gate 2).

**Why this priority**: Agent 6 is the mechanism that makes Bootstrap the entry point
to the entire pipeline. Without it, the Bootstrap Crew produces foundational artifacts
but nothing downstream runs. It is lower priority than the artifact-producing agents
only because it cannot be tested until those agents work.

**Acceptance Scenarios**:

1. **Given** all Bootstrap artifacts are on disk, **When** Agent 6 runs, **Then**
   it invokes downstream crews in strict order: Token Engine → Design-to-Code →
   Component Factory → Documentation → Governance → AI Semantic Layer → Analytics →
   Release. No crew is invoked before its predecessor has written all declared outputs.
2. **Given** a downstream crew fails after exhausting retries, **When** Agent 6
   detects the failure, **Then** it marks the crew as `failed` in the generation
   report, continues the pipeline with remaining crews where possible, and includes
   the full error trace in `reports/generation-summary.json`.
3. **Given** all downstream crews complete (with or without partial failures), **When**
   Agent 6 finishes, **Then** it halts at Human Gate 2: the user must review the
   generation report and output folder before the result is considered complete.
4. **Given** a Phase 2 validation rejects Phase 1 token output (cross-phase retry),
   **When** Agent 6 handles the rejection, **Then** it re-invokes Agent 2 with the
   rejection context appended, restores the pre-Token-Engine checkpoint via the
   Rollback Agent (40) before re-running, and does so up to the configured retry
   limit (default 3).

---

### Edge Cases

- Raw `brand-profile.json` is missing the `archetype` field — Agent 1 MUST reject
  with a structured error. Archetype is required; no default can be assumed.
- Raw `brand-profile.json` contains an unrecognized archetype string — Agent 1 MUST
  reject with a list of valid archetypes.
- Multi-Brand profile with zero entries in the `brands` array — Agent 1 MUST flag
  this as a contradiction and request at least one brand name.
- `colors.primary` and `colors.secondary` are identical — Agent 1 flags this as a
  warning (not a hard rejection) and includes a suggested secondary color in the
  approval output.
- Agent 2 generates a token name that conflicts with an existing W3C DTCG reserved
  keyword — the token is renamed with a `daf.` namespace prefix and the change is
  logged.
- The `brands` array contains duplicate brand names — Agent 1 deduplicates and
  warns.
- Agent 3 or 4 produces a spec YAML that references a token not present in the
  generated token files — this is detected during Bootstrap's own internal consistency
  check before the crew hands off to Token Engine.
- `--output` folder already contains artifacts from a previous run — Agent 1 detects
  this and asks the user whether to overwrite or abort before proceeding.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Bootstrap Crew MUST read `brand-profile.json` from the output
  folder as its sole required input. It MUST fail-fast with a structured error if
  this file does not exist.
- **FR-002**: Agent 1 MUST validate the raw Brand Profile for field completeness,
  internal consistency, and archetype-field compatibility before enriching it.
- **FR-003**: Agent 1 MUST resolve archetype defaults for all unspecified optional
  fields based on the selected archetype's documented defaults.
- **FR-004**: Agent 1 MUST detect and report contradictions between field values
  (e.g., `density: compact` paired with `spacing: spacious`). Contradictions MUST
  be presented at the Human Gate with proposed resolutions — not silently resolved.
- **FR-005**: Human Gate 1 MUST block all downstream agents (Agents 2–6) until
  the user explicitly approves the validated Brand Profile.
- **FR-006**: Agent 2 MUST generate all three token tier files atomically. Either
  all three are written successfully or none are written.
- **FR-007**: All tokens generated by Agent 2 MUST conform to W3C DTCG format.
  `$type` and `$value` are required on every leaf token.
- **FR-008**: Agent 2 MUST generate contrast-safe color pairs for all
  foreground/background semantic token combinations, meeting the accessibility level
  specified in the Brand Profile (AA: ≥ 4.5:1 normal, ≥ 3:1 large; AAA: ≥ 7:1
  normal, ≥ 4.5:1 large).
- **FR-009**: For Multi-Brand archetype, Agent 2 MUST write one brand override file
  per brand name in `brands` array to `tokens/brands/<brand-name>.tokens.json`.
- **FR-010**: Agent 2 MUST NOT write any files to `tokens/compiled/`. Compilation
  is exclusively the Token Engine Crew's responsibility.
- **FR-011**: Agent 3 MUST generate exactly 9 primitive spec YAMLs (Box, Stack,
  Grid, Text, Icon, Pressable, Divider, Spacer, ThemeProvider) regardless of archetype
  or scope.
- **FR-012**: Agent 4 MUST generate the component set defined by the Brand Profile's
  scope tier: 10 for Starter, 19 for Standard, 26 for Comprehensive.
- **FR-013**: Every spec YAML generated by Agents 3 and 4 MUST define: component
  name, props (with types and defaults), variants, interactive states, token bindings,
  composition (which primitives it uses), allowed children/slots, and a11y
  requirements.
- **FR-014**: No spec YAML generated by Agent 3 or 4 MUST contain hardcoded visual
  values (no hex colors, no px/rem values). All visual values MUST be token
  references.
- **FR-015**: Agent 5 MUST generate `pipeline-config.json`, `tsconfig.json`,
  `vitest.config.ts`, and `vite.config.ts`. All four files are required outputs.
- **FR-016**: Agent 5 MUST NOT write any files under `governance/`.
- **FR-017**: Agent 6 MUST invoke downstream crews in the exact sequence defined in
  PRD §3.1. Out-of-order invocation is prohibited.
- **FR-018**: Agent 6 MUST implement cross-phase retry routing: when a Phase 2
  validation fails, Agent 6 re-invokes Agent 2 with rejection context appended, up
  to the `pipeline-config.json` retry limit.
- **FR-019**: Human Gate 2 MUST block completion until the user explicitly reviews
  and approves the final generation report.
- **FR-020**: The Bootstrap Crew MUST NOT produce any TSX source files, compiled
  CSS/SCSS/TS/JSON token artifacts, or governance JSON files.

### Key Entities

- **Brand Profile (validated)**: The enriched, approved JSON document produced by
  Agent 1. Extends the raw Brand Profile with: resolved archetype defaults, detected
  contradictions and their resolutions, and a `_meta` block recording which fields
  were defaulted vs. user-provided. This is the authoritative Brand Profile used by
  all downstream crews.

- **Raw Token Set**: Three W3C DTCG JSON files produced by Agent 2:
  `base.tokens.json` (global tier — primitive values), `semantic.tokens.json`
  (semantic tier — named intent, per-theme values), `component.tokens.json`
  (component-scoped tier). For Multi-Brand, additionally: `brands/<name>.tokens.json`
  per brand (semantic overrides only).

- **Component Spec YAML**: A canonical YAML file per component or primitive defining
  the complete contract: props schema, variant enumeration, interactive state machine,
  token binding map, primitive composition tree, slot definitions, and a11y attribute
  requirements. These files are the source of truth for Phase 3 generation.

- **Pipeline Config**: `pipeline-config.json` — a seed configuration document
  (schema defined in PRD §3.8) that bridges the Brand Profile intent to the Governance
  Crew's operational rules. Contains quality gate thresholds, lifecycle defaults,
  domain categories, retry limits, model tier identifiers, and build config.

### Crew I/O Contract

| | Files |
|---|---|
| **Reads (required)** | `brand-profile.json` (raw, written by the interview CLI) |
| **Reads (optional)** | — |
| **Writes** | `brand-profile.json` (validated, overwrites raw), `specs/*.spec.yaml` (9 primitives + N components per scope), `tokens/base.tokens.json` (raw), `tokens/semantic.tokens.json` (raw), `tokens/component.tokens.json` (raw), `tokens/brands/*.tokens.json` (Multi-Brand only), `pipeline-config.json`, `tsconfig.json`, `vitest.config.ts`, `vite.config.ts` |

**Boundary constraints**:
- [x] This crew does NOT produce both spec YAMLs and TSX source for the same component
- [x] This crew does NOT produce both raw tokens and compiled tokens
- [x] This crew does NOT write to another crew's declared output namespace (`tokens/compiled/`, `governance/`, `src/`, `docs/`)

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Given any valid raw Brand Profile, the Bootstrap Crew produces all
  declared output artifacts with zero missing files before handing off to Token Engine.
- **SC-002**: Every spec YAML passes a schema validation check confirming the presence
  of all required sections (props, variants, states, token bindings, composition,
  a11y). Zero required sections are omitted.
- **SC-003**: Every foreground/background semantic color pair in the generated
  `semantic.tokens.json` meets the WCAG contrast threshold specified in the Brand
  Profile (AA or AAA) — verifiable by running the WCAG contrast formula on the
  resolved hex values.
- **SC-004**: The `pipeline-config.json` file is valid JSON and contains all required
  top-level keys (`qualityGates`, `lifecycle`, `domains`, `retry`, `models`,
  `buildConfig`) with values derived from — not contradicting — the approved Brand
  Profile.
- **SC-005**: No files appear in `tokens/compiled/`, `governance/`, or `src/` after
  the Bootstrap Crew completes — boundary compliance is fully enforced.
- **SC-006**: The Human Gate 1 blocks all downstream processing until approval is
  recorded. Running the pipeline without triggering the approval gate is not possible.

## Assumptions

- The `brand-profile.json` written by the interview CLI is syntactically valid JSON.
  If it is not, Agent 1 rejects it with a parse error immediately (before any
  validation logic runs).
- Agent 2 uses a modular scale algorithm for typography (e.g., Major Third = 1.25,
  Perfect Fourth = 1.333). The exact ratio comes from `typography.scaleRatio` in the
  Brand Profile.
- The ThemeProvider primitive spec is always generated, even for single-theme design
  systems, because it is part of the fixed primitives set.
- `tsconfig.json`, `vitest.config.ts`, and `vite.config.ts` generated by Agent 5 are
  library-mode configurations (Vite in library mode, Vitest for unit tests). They are
  not application configurations.
- Agent 6 is the sole orchestrator of the downstream pipeline. No other agent or
  external process may invoke downstream crews directly.

## Out of Scope

- Token validation, naming lint, or contrast verification — these are Token Engine
  Crew responsibilities (Phase 2).
- Compiling tokens to CSS, SCSS, TypeScript, or any platform output — Token Engine.
- Generating TSX source, test files, or Storybook stories from specs — Design-to-Code
  Crew (Phase 3).
- Generating governance artifacts (`ownership.json`, `workflow.json`, etc.) — Governance
  Crew (Phase 4b).
- Writing `docs/` content of any kind — Documentation Crew (Phase 4a).
- Detecting spec ↔ code ↔ doc drift — Analytics Crew (Phase 5).
