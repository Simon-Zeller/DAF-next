# Feature Specification: Documentation Crew

**Feature Branch**: `006-documentation-crew`
**Created**: 2026-03-12
**Status**: Draft
**Input**: User description: "Feature: Documentation Crew. The fifth CrewAI crew in
the DAF pipeline (Phase 4a — runs after the Component Factory Crew quality gate
passes, before the Governance Crew). Purpose: generate all project documentation from
code, tokens, and generation metadata. Documentation is a derived artifact — never
separately authored."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Component Docs Generated for Every Component (Priority: P1)

A developer delivers the completed design system package to a teammate. The teammate
opens `docs/components/` and finds one Markdown file per component. Each file contains
a prop table with types, defaults, and required flags; a variant showcase that
enumerates all variants with plain-language descriptions; at least two usage examples
(basic and advanced); and a token binding reference listing which tokens the component
consumes. Where a component failed the Component Factory quality gate, a visible
warning banner appears at the top of that component's doc page specifying which gate
failed and that the component is not fully accepted.

**Why this priority**: Component documentation is the primary reason the Documentation
Crew exists. It is also a hard prerequisite for the Governance Crew — Agent 30 (Quality
Gate Agent) fails the pipeline unless every component has a doc page. Without P1, the
entire Phase 4+ pipeline is blocked.

**Independent Test**: Run Agent 21 alone against a Starter-scope output folder
(10 components). Verify that exactly 10 files exist in `docs/components/`. Open any
file and assert it contains: a `## Props` table, a `## Variants` section, at least two
fenced code blocks under `## Usage`, and a `## Token Bindings` section. Verify that
any component listed in `reports/quality-scorecard.json` as failed has a `> ⚠️
Quality gate failed` callout as its first content block.

**Acceptance Scenarios**:

1. **Given** a Starter-scope pipeline run with 10 components in `src/components/`,
   **When** Agent 21 runs, **Then** exactly 10 Markdown files are written to
   `docs/components/`, one per component, named `<ComponentName>.md`.
2. **Given** any generated component doc page, **When** inspecting its structure,
   **Then** it contains: (a) a Props table with columns Type, Default, and Required;
   (b) a Variants section listing all spec-defined variants; (c) a minimum of two
   usage code examples (basic + advanced); (d) a Token Bindings section listing every
   token the component references.
3. **Given** `reports/quality-scorecard.json` lists `DatePicker` as having failed the
   accessibility gate, **When** Agent 21 generates `docs/components/DatePicker.md`,
   **Then** the file's first content block is a warning callout identifying the failed
   gate name and stating the component has not passed the full quality gate.
4. **Given** a Standard-scope run (19 components) or Comprehensive-scope run
   (26 components), **When** Agent 21 runs, **Then** the number of doc files in
   `docs/components/` matches the component count exactly — no components are missing,
   no extra files are created.
5. **Given** All component doc generation is complete, **When** Agent 21 also writes
   `docs/README.md`, **Then** the README contains installation instructions, a quick
   start example importing at least one component, a full list of available
   components, a token overview summary, and links to individual component doc pages.
6. **Given** a component with a beta lifecycle status flag in `pipeline-config.json`,
   **When** Agent 21 generates that component's doc page, **Then** a `🧪 Beta`
   stability badge appears in the page header and a note states the API is subject to
   change.

---

### User Story 2 — Token Catalog Surfaces Every Token with Context (Priority: P1)

A design lead opens `docs/tokens/` to audit the generated token set before approving
the design system for team use. They find a structured catalog that lists every token
with its resolved value, which tier it belongs to (global, semantic, or
component-scoped), a prose description of its intended usage context, and a
human-readable visual representation — color swatches for color tokens, a size
progression display for type and spacing scales. The catalog is organized by category
so they can navigate quickly to a specific concern (e.g., color, typography, spacing,
elevation).

**Why this priority**: The token catalog is the bridge between automated generation
and human review. Without it, the design lead cannot verify that the Token Engine's
output reflects the intended brand direction. It also feeds the search index (Agent 25)
and informs the generation narrative (Agent 23).

**Independent Test**: Run Agent 22 alone. Verify that `docs/tokens/token-catalog.md`
exists. Open the file and assert: every token name from `tokens/compiled/tokens.json`
appears at least once; color tokens have a `swatch` field showing the hex value; type
scale tokens list sizes in ascending order; spacing scale tokens list sizes in
ascending order. Verify tokens are grouped under category headings that match the
W3C DTCG category structure (color, typography, spacing, elevation, radius, motion).

**Acceptance Scenarios**:

1. **Given** all three token tier files exist on disk, **When** Agent 22 runs, **Then**
   `docs/tokens/token-catalog.md` is written with every token from all three tiers
   appearing under a category heading.
2. **Given** any color token in the catalog, **When** inspecting its entry, **Then**
   the entry includes: the resolved hex value, the tier it belongs to, the usage
   context description, and a human-readable swatch label — no token entry is left
   without a resolved value.
3. **Given** a type scale containing 8 step values, **When** the token catalog
   renders the typography section, **Then** the 8 steps are displayed in ascending
   order as a visual size progression.
4. **Given** `tokens/diff.json` is present (re-generation run), **When** Agent 22
   generates the catalog, **Then** each token entry is annotated with its change
   status: `added`, `modified`, or `removed` — tokens without a change status are
   treated as unchanged.
5. **Given** `tokens/diff.json` is absent (first generation), **When** Agent 22
   generates the catalog, **Then** all tokens are classified as `added` and the catalog
   notes this is the initial generation with no prior version to diff against.
6. **Given** a component-scoped token that overrides a semantic token, **When** Agent
   22 renders that token's catalog entry, **Then** it clearly identifies both the
   overriding component-scoped value and the underlying semantic token it overrides.

---

### User Story 3 — Generation Narrative Explains Design Rationale (Priority: P2)

A senior engineer is onboarding to the generated design system. They open
`docs/decisions/generation-narrative.md` and read a plain-language explanation of why
the design system looks the way it does: which brand archetype was selected and what
criteria led to that selection, which specific Brand Profile answers drove which token
structure decisions, how the modular scale ratio was chosen and what trade-offs it
makes, what the accessibility tier choice means in practical terms for the color
palette, and whether any human gate overrides occurred and what the reviewer's
justification was. Every major decision has a traceable origin.

**Why this priority**: The narrative is the "why" document — it distinguishes an
automatically generated design system from a thoughtfully designed one. It is critical
for team adoption and trust, but it does not block the Governance Crew gate (which
checks for docs existence, not narrative quality), so it ranks P2.

**Independent Test**: Run Agent 23 alone. Verify `docs/decisions/generation-narrative.md`
exists with minimum 500 words. Assert the file contains sections covering: archetype
selection, token structure rationale, scale ratio choice, accessibility tier
implications, and (if applicable) human gate overrides. Verify that every claim in
the narrative can be traced to a value in `brand-profile.json` or the pipeline run
log — no invented rationale without a grounded source.

**Acceptance Scenarios**:

1. **Given** a completed pipeline run with a populated `brand-profile.json`,
   **When** Agent 23 runs, **Then** `docs/decisions/generation-narrative.md` is
   written and contains at minimum: archetype selection rationale, token decision
   rationale, modular scale choice explanation, and accessibility tier implications.
2. **Given** a Brand Profile with `accessibilityTier: AAA`, **When** Agent 23 writes
   the narrative, **Then** the narrative explicitly describes how the AAA requirement
   constrained the color palette choices and what trade-offs were made.
3. **Given** a human gate override was recorded (reviewer explicitly changed a
   setting at Gate 1 or Gate 2), **When** Agent 23 writes the narrative, **Then**
   the override is documented: what the original generation proposed, what the reviewer
   changed, and (if captured) the reviewer's stated justification.
4. **Given** `tokens/diff.json` is present, **When** Agent 23 produces the narrative,
   **Then** a section covers what changed relative to the prior version — which brand
   decisions drove token modifications and what downstream impact those changes have.
5. **Given** no human overrides occurred, **When** Agent 23 produces the narrative,
   **Then** the narrative states explicitly that no overrides occurred and all outputs
   reflect the original generation decisions unmodified.

---

### User Story 4 — ADRs Capture Every Significant Generation Decision (Priority: P2)

A lead architect reviews the generated design system for adoption. They navigate to
`docs/decisions/adrs/` and find one Architecture Decision Record per significant
generation decision. Each ADR follows the standard Context → Decision → Consequences
format. They can understand, at a glance, why the modular scale uses a 1.25 ratio
instead of 1.5, why a particular composition model was chosen, why the token naming
convention is structured the way it is, and what the accessibility tier choice means
for future component additions. The ADRs are standalone — no prior context is needed
to understand any single ADR.

**Why this priority**: ADRs are the structured equivalent of the narrative — they are
the records future contributors consult when making a change. P2 because they support
long-term governance but do not block the immediate Governance Crew gate.

**Independent Test**: Run Agent 24 alone. Verify `docs/decisions/adrs/` contains at
least 4 ADR files (archetype, scale, composition, accessibility). Open any ADR and
assert it contains: a `## Context` section, a `## Decision` section, and a
`## Consequences` section. Verify that each decision in an ADR can be independently
verified against `brand-profile.json` or the spec outputs.

**Acceptance Scenarios**:

1. **Given** a completed pipeline run, **When** Agent 24 runs, **Then** at least four
   ADR files are written to `docs/decisions/adrs/`: one for archetype selection,
   one for token scale algorithm, one for composition model, and one for accessibility
   tier implications.
2. **Given** any ADR file, **When** inspecting its structure, **Then** it contains
   exactly three sections: `## Context` (what situation prompted the decision),
   `## Decision` (what was decided and why), `## Consequences` (trade-offs and
   downstream implications).
3. **Given** a brand profile with a custom `componentScope` beyond the default
   Starter set, **When** Agent 24 generates ADRs, **Then** an additional ADR is
   written for the scope selection decision.
4. **Given** a human gate override was recorded at Gate 1 or Gate 2, **When** Agent
   24 generates ADRs, **Then** a dedicated ADR is written capturing the override as a
   decision: original proposal as context, override as the decision, downstream
   implications as consequences.

---

### User Story 5 — Search Index Enables Instant Navigation (Priority: P3)

A developer is working on a feature and needs to know which component to use for a
toast notification, and which token controls its background color. They query the
`docs/search-index.json` (via a local search tool or future doc site integration)
and receive ranked results across components, tokens, and decisions — all in a single
query. Filtering by category narrows results to just tokens; filtering by status
returns only stable components.

**Why this priority**: The search index adds discoverability on top of an already
complete documentation set. It is high-leverage for large design systems but is
not required for the Governance Crew gate or team adoption review — hence P3.

**Independent Test**: Run Agent 25 alone against a completed `docs/` directory.
Verify `docs/search-index.json` exists and is valid JSON. Assert the index
contains entries for: at least one component name, at least one prop name, at least
one token name, and at least one doc text excerpt. Verify that each entry has a
`category` field and a `status` field that accept filter values. Verify the index
file is under 5 MB.

**Acceptance Scenarios**:

1. **Given** a completed `docs/` directory, **When** Agent 25 runs, **Then**
   `docs/search-index.json` is written as valid JSON with at least one entry per
   component, per token category, and per ADR.
2. **Given** any component entry in the search index, **When** inspecting its fields,
   **Then** it contains: component name, prop names (array), a text excerpt from the
   component's doc page, category (e.g., "form", "navigation", "feedback"), and
   status (stable/beta/experimental).
3. **Given** any token entry in the search index, **When** inspecting its fields,
   **Then** it contains: token name, resolved value, tier, usage context description,
   and category.
4. **Given** the full pipeline scope (Comprehensive, 26 components), **When** Agent
   25 builds the search index, **Then** the resulting `docs/search-index.json` file
   is no larger than 5 MB and loads in under 2 seconds in a standard runtime.
5. **Given** a component with beta lifecycle status, **When** its entry appears in
   the search index, **Then** the status field value is `beta` — not `stable` — so
   consumers can filter it correctly.

---

### Edge Cases

- A component exists in `src/components/` but has no corresponding spec YAML in
  `specs/` — Agent 21 generates the doc from the TSX source alone, notes the missing
  spec, and flags the doc page as "spec not found."
- `reports/quality-scorecard.json` is absent — the crew continues doc generation
  without quality gate warnings; a crew-level warning is written to the run log
  stating the scorecard was not found, so gate status is unknown.
- `tokens/diff.json` is absent (first generation) — Agent 22 classifies all tokens
  as `added`; Agent 23 omits the "what changed" section and notes this is the initial
  generation run.
- A component's TSX source file is unreadable (corrupt or empty) — Agent 21 writes a
  stub doc page with a prominent error state noting the source was unreadable; it does
  NOT skip the component entirely (the Governance Crew gate checks doc existence, not
  doc quality).
- The `brand-profile.json` optional read is absent — Agent 23 produces the narrative
  from pipeline config data alone; the archetype section and human override section
  are written but note that the brand profile was not available for cross-reference.
- `reports/generation-summary.json` records zero components generated (empty pipeline
  run) — the crew fails fast with an explicit error: "No components found in generation
  summary; documentation cannot be generated."
- A component exists in `src/components/` but was never listed in any spec YAML and
  is absent from `reports/generation-summary.json` — Agent 21 documents it with an
  "untracked component" warning; it does not fabricate a spec.

## Requirements *(mandatory)*

### Functional Requirements

**Agent 21 — Doc Generation Agent**

- **FR-001**: Agent 21 MUST generate one Markdown documentation file per component
  in `docs/components/`, named `<ComponentName>.md`, for every component present in
  `src/components/**/*.tsx` as listed in `reports/generation-summary.json`.
- **FR-002**: Each component doc MUST contain, in order: a page title and stability
  badge, a Props table (columns: Prop Name, Type, Default, Required), a Variants
  section enumerating all spec-defined variants with descriptions, a Usage section with
  at minimum one basic and one advanced code example, and a Token Bindings section
  listing each token the component references.
- **FR-003**: Any component whose entry in `reports/quality-scorecard.json` shows one
  or more failed quality gates MUST have a warning callout as the first content block
  of its doc page, identifying the specific gate(s) that failed.
- **FR-004**: Agent 21 MUST write `docs/README.md` containing: installation
  instructions (npm install), a quick start code example, an available
  components list, an available token categories overview, and internal links to all
  component doc pages and the token catalog.
- **FR-005**: Components flagged as beta in `pipeline-config.json` MUST have a `🧪
  Beta` badge in the doc page header and a note that the API is subject to change.
- **FR-006**: Agent 21 MUST NOT write to any path outside of `docs/` — reads from
  `src/`, `specs/`, `tokens/`, and `reports/` are permitted; writes are restricted
  to `docs/`.

**Agent 22 — Token Catalog Agent**

- **FR-007**: Agent 22 MUST write `docs/tokens/token-catalog.md` containing every
  token from all three tier files (`base.tokens.json`, `semantic.tokens.json`,
  `component.tokens.json`) organized by W3C DTCG category (color, typography, spacing,
  elevation, radius, motion, and any custom categories in the project).
- **FR-008**: Each token entry in the catalog MUST include: token name, resolved
  value, tier (global/semantic/component-scoped), and a usage context description.
  Color tokens additionally MUST display the hex value as a human-readable swatch
  label.
- **FR-009**: Token scale categories (typography, spacing) MUST be rendered as ordered
  progressions from smallest to largest value, not alphabetically.
- **FR-010**: If `tokens/diff.json` is present, each token entry MUST be annotated
  with its change status (`added`, `modified`, `removed`, or no annotation for
  unchanged). If `tokens/diff.json` is absent, all tokens MUST be annotated as
  `added` and a note at the top of the catalog MUST state this is the initial
  generation run.
- **FR-011**: Component-scoped token entries MUST identify both their own resolved
  value and the semantic token they override (if any), making the override chain
  visible to the reader.

**Agent 23 — Generation Narrative Agent**

- **FR-012**: Agent 23 MUST write `docs/decisions/generation-narrative.md` covering
  all four mandatory narrative sections: (1) archetype selection and selection
  criteria, (2) token structure rationale tied to specific Brand Profile inputs,
  (3) modular scale ratio choice and trade-offs, (4) accessibility tier implications
  for the color palette.
- **FR-013**: Every claim in the narrative MUST be traceable to a value in
  `brand-profile.json`, `reports/generation-summary.json`, or recorded human gate
  override data — no invented rationale is permitted.
- **FR-014**: If human gate overrides occurred, a fifth mandatory section MUST be
  present: what the original generation proposed, what the reviewer changed, and (if
  captured) the reviewer's stated justification.
- **FR-015**: If `tokens/diff.json` is present, the narrative MUST include a
  "What Changed" section summarizing which brand decisions drove token modifications
  and what downstream components were affected.
- **FR-016**: The narrative MUST be written in plain language accessible to a
  non-technical design stakeholder — no source code, no technical implementation
  details, no crew or agent names.

**Agent 24 — Decision Record Agent**

- **FR-017**: Agent 24 MUST generate at least four ADR files in
  `docs/decisions/adrs/`, one each for: archetype selection, token scale algorithm,
  composition model, and accessibility tier choice.
- **FR-018**: Each ADR MUST follow the format: `## Context` → `## Decision` →
  `## Consequences` — no other structure is permitted. Each section MUST be present
  and non-empty.
- **FR-019**: If a custom component scope (beyond the default Starter set) was
  selected in the Brand Profile, an additional ADR MUST be written for the scope
  selection decision.
- **FR-020**: If human gate overrides were recorded, a dedicated ADR MUST be written
  per override event, treating the override as the decision to document.
- **FR-021**: ADR files MUST be named with a zero-padded numeric prefix and a
  kebab-case title reflecting the decision topic (e.g., `001-archetype-selection.md`,
  `002-token-scale-algorithm.md`).

**Agent 25 — Search Index Agent**

- **FR-022**: Agent 25 MUST write `docs/search-index.json` as valid JSON containing
  entries for every component, every token category, and every ADR written in the
  current pipeline run.
- **FR-023**: Each component entry in the search index MUST contain: component name,
  array of prop names, a text excerpt from the component doc page (minimum 60 words),
  category, and status.
- **FR-024**: Each token entry in the search index MUST contain: token name, resolved
  value, tier, usage context description, and category.
- **FR-025**: The search index MUST be filterable by `category` and `status` fields —
  these fields MUST be present and non-null on every entry.
- **FR-026**: `docs/search-index.json` MUST be no larger than 5 MB for a
  Comprehensive-scope (26 components) pipeline run.

**Crew-Level**

- **FR-027**: The crew MUST fail fast (exit with an error and write no `docs/` output)
  if `reports/generation-summary.json` records zero components generated.
- **FR-028**: The crew MUST complete all five agent tasks in under 5 minutes for a
  Comprehensive-scope pipeline run.
- **FR-029**: The crew MUST write a crew-level run log to
  `reports/documentation-run.json` recording: start time, end time, agent task
  completion status (pass/fail), and any warnings encountered (missing optional
  inputs, unreadable sources, untracked components).
- **FR-030**: The crew MUST NOT write to `src/`, `tokens/`, `specs/`, `reports/`
  (except `reports/documentation-run.json`), or `governance/`.

### Key Entities

- **Component Doc Page**: A Markdown file in `docs/components/` that is the canonical
  human-readable reference for a single component. Contains props, variants, usage
  examples, token bindings, quality gate status, and stability badge.
- **Token Catalog**: A Markdown file in `docs/tokens/` that is the canonical
  human-readable reference for the full token set. Organized by W3C DTCG category,
  annotated with tiers, resolved values, and diff status.
- **Generation Narrative**: A Markdown file at `docs/decisions/generation-narrative.md`
  that explains why the design system was generated the way it was. Authored from
  brand profile inputs and pipeline run data — never separately invented.
- **Architecture Decision Record (ADR)**: A structured Markdown file in
  `docs/decisions/adrs/` that captures one significant generation decision per file
  in Context → Decision → Consequences format. Immutable once written (future changes
  are new ADRs, not edits).
- **Search Index**: A JSON file at `docs/search-index.json` providing structured,
  filterable entries across all docs output. Each entry has a category and status
  field to enable programmatic filtering.
- **Documentation Run Log**: A JSON file at `reports/documentation-run.json` that
  records the result of the crew run. Written by the crew itself; read by the
  Governance Crew to verify documentation generation succeeded.

### Crew I/O Contract *(mandatory for DAF crew features)*

| | Files |
|---|---|
| **Reads (required)** | `specs/*.spec.yaml`, `src/components/**/*.tsx`, `tokens/base.tokens.json`, `tokens/semantic.tokens.json`, `tokens/component.tokens.json`, `reports/generation-summary.json` |
| **Reads (optional)** | `brand-profile.json`, `tokens/diff.json`, `reports/quality-scorecard.json`, `pipeline-config.json` |
| **Writes** | `docs/components/*.md`, `docs/tokens/token-catalog.md`, `docs/README.md`, `docs/decisions/generation-narrative.md`, `docs/decisions/adrs/*.md`, `docs/search-index.json`, `reports/documentation-run.json` |

**Boundary constraints** (check all that apply):
- [x] This crew does NOT produce both spec YAMLs and TSX source for the same component
- [x] This crew does NOT produce both raw tokens and compiled tokens
- [x] This crew does NOT write to another crew's declared output namespace

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every component present in `reports/generation-summary.json` has a
  corresponding documentation file in `docs/components/` — 100% component doc
  coverage, verified by a file-count diff between the generation summary and the
  `docs/components/` directory.
- **SC-002**: The Governance Crew's "all components have docs" quality gate passes on
  the first attempt — no documentation-related failures appear in
  `reports/governance-gate.json` after the Documentation Crew completes.
- **SC-003**: Full documentation generation for a Comprehensive-scope pipeline run
  (26 components, all three token tiers) completes in under 5 minutes, measured from
  crew start to `docs/search-index.json` written.
- **SC-004**: `docs/search-index.json` contains entries for 100% of generated
  components and 100% of token categories, with no entry missing a `category` or
  `status` field, and the file is no larger than 5 MB.
- **SC-005**: Every component doc page for a component that failed a Component Factory
  quality gate displays a warning callout — zero failed components have documentation
  without a quality warning.
- **SC-006**: The generation narrative (`docs/decisions/generation-narrative.md`)
  covers all four mandatory sections (archetype, token rationale, scale choice,
  accessibility implications) and every factual claim can be traced to a specific
  value in `brand-profile.json` or the generation summary.

## Assumptions

- `reports/generation-summary.json` is the authoritative list of components for which
  documentation must be produced. The crew does not scan `src/components/` independently
  to discover components — it uses the generation summary as its component manifest.
- `reports/quality-scorecard.json` is written by the Component Factory Crew (Agent 20)
  before the Documentation Crew starts. If it is absent, quality gate warnings are
  omitted from doc pages (not an error condition for the Documentation Crew itself).
- Token tier files are fully resolved and compiled by the Token Engine Crew before this
  crew runs. The Documentation Crew reads resolved values; it does not re-run
  compilation logic.
- The `tokens/diff.json` optional input follows the format established by the Token
  Compiler Agent (Agent 8): each entry has `name`, `status` (`added`/`modified`/
  `removed`), `before` (prior value or null), and `after` (new value or null).
- Human gate override data (if present) is captured in `reports/generation-summary.json`
  under a `humanOverrides` key. The Generation Narrative Agent reads overrides from
  this location.
- The crew does not localize or translate documentation. All output is in the language
  of the brand profile's `locale` setting (default: English). Multi-language support
  is out of scope for this version.

## Out of Scope

- Generating a deployed documentation site or static HTML — output is Markdown and
  JSON only.
- Validating the correctness of the components themselves — that is the Component
  Factory Crew's responsibility.
- Writing migration guides or codemods — that is the Release Crew's responsibility.
- Generating test files — the Governance Crew writes test suites (Agent 30).
- Authoring or modifying `src/`, `tokens/`, `specs/`, or `governance/` — this crew
  is read-only relative to all namespaces except `docs/` and `reports/documentation-run.json`.
