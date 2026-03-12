# Feature Specification: Design-to-Code Crew

**Feature Branch**: `004-design-to-code-crew`
**Created**: 2026-03-12
**Status**: Draft
**Input**: User description: "Feature: Design-to-Code Crew. The third CrewAI crew in
the DAF pipeline. Receives compiled tokens, spec YAMLs, and the ThemeConfig from the
Token Engine Crew and runs 5 agents to generate production-ready TSX source files for
all primitives and components defined in the spec YAMLs."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — All Primitives Generated as Token-Bound TSX (Priority: P1)

A developer has run Bootstrap and Token Engine successfully. The Design-to-Code
Crew's Primitive Generator (Agent 11) reads all 9 primitive spec YAMLs and produces
one TSX file per primitive in `src/primitives/`. Every style value in every primitive
is a token reference resolved through the ThemeConfig — no hardcoded hex colors, no
raw px values, no inline magic numbers. A barrel `index.ts` file exports all
primitives.

**Why this priority**: Primitives are the foundation every component is built on top
of. Without them, Agent 12 has nothing to compose with. This is the first,
irreversible dependency in the component generation chain.

**Independent Test**: Run Agent 11 only. Verify that exactly 9 `.tsx` files exist in
`src/primitives/`, plus `index.ts`. Run `tsc --noEmit` — zero type errors. Grep every
generated file for hardcoded hex, px, or rem values — zero matches. Verify each file
imports only from `src/theme/theme.config.ts` and `tokens/compiled/tokens.ts` for
visual values (no direct style literals).

**Acceptance Scenarios**:

1. **Given** 9 valid primitive spec YAMLs on disk, **When** Agent 11 runs, **Then**
   exactly 9 `.tsx` files are written to `src/primitives/` (Box, Stack, Grid, Text,
   Icon, Pressable, Divider, Spacer, ThemeProvider) plus `src/primitives/index.ts`.
2. **Given** any generated primitive TSX file, **When** searching the file for
   hardcoded visual values (hex colors, raw `px`/`rem`/`em` literals, named CSS
   colors, hardcoded `opacity` or `shadow` values), **Then** zero matches are found.
3. **Given** a `Stack` primitive spec with `direction: horizontal | vertical`,
   **When** Agent 11 generates `Stack.tsx`, **Then** it accepts a `direction` prop
   that maps to the appropriate token-bound layout value (gap, flexDirection) per the
   spec's variant enumeration.
4. **Given** a brand profile with `directions: [ltr, rtl]`, **When** Agent 11
   generates directional primitives (Box, Stack, Grid), **Then** start/end logical
   CSS properties are used instead of left/right, and an RTL variant is included that
   inverts directional token references.
5. **Given** all 9 primitives generated, **When** running `tsc --noEmit` against the
   full `src/primitives/` directory with the project's `tsconfig.json`, **Then** zero
   type errors are reported.
6. **Given** Agent 11 generates `ThemeProvider.tsx`, **When** inspecting the file,
   **Then** it wraps the ThemeConfig from `src/theme/theme.config.ts` — it contains
   no theme logic or token values authored directly within the component.

---

### User Story 2 — All Components Generated from Primitives (Priority: P1)

After primitives exist, the Component Generator (Agent 12) reads each component spec
YAML and produces one TSX file per component in `src/components/`. Components are
assembled exclusively from primitives — they do not use raw HTML elements. All variant
styling and interactive state transitions defined in the spec YAML are faithfully
represented in the generated code.

**Why this priority**: Components are the primary deliverable of the entire DAF
pipeline. Everything before this point — the interview, tokens, specs — exists to
make component generation possible. This is what a developer installs and uses.

**Independent Test**: Run on a Starter scope profile. Verify exactly 10 component
`.tsx` files in `src/components/`. Grep all component files for raw HTML elements
(`<div`, `<span`, `<button`, `<input`, `<ul`, `<li`, etc.) — zero matches. Verify all
visual values are token references. Run `tsc --noEmit` — zero errors.

**Acceptance Scenarios**:

1. **Given** component spec YAMLs for a Starter scope (10 components), **When** Agent
   12 runs, **Then** exactly 10 `.tsx` files are written to `src/components/` plus
   `src/components/index.ts`.
2. **Given** a Standard scope (19 components) or Comprehensive scope (26 components),
   **When** Agent 12 runs, **Then** the number of generated component files matches
   the scope exactly.
3. **Given** any generated component TSX file, **When** inspecting its import
   statements and JSX, **Then** all structural elements come from `src/primitives/*`
   — zero raw HTML element tags (`<div>`, `<span>`, `<button>`, etc.) appear in
   component files.
4. **Given** a `Button` spec YAML with variants `primary | secondary | destructive |
   ghost`, **When** Agent 12 generates `Button.tsx`, **Then** all four variants are
   implemented and each references only token-bound values from the ThemeConfig for
   its visual differentiation.
5. **Given** a component spec YAML with interactive states (hover, focus, active,
   disabled), **When** Agent 12 generates the component, **Then** each state is
   implemented using spec-defined token references — no hardcoded `opacity`, `filter`,
   or color adjustments.
6. **Given** a brand profile `componentOverrides` entry for a specific component (e.g.,
   a custom Button `borderRadius` token), **When** Agent 12 generates that component,
   **Then** the override is applied and the overridden prop does not fall back to the
   default spec value.
7. **Given** a component listed in `pipeline-config.json`'s `lifecycle.betaComponents`
   (e.g., DatePicker), **When** Agent 12 generates that component file, **Then** a
   `@beta` JSDoc tag appears in the file header comment block.
8. **Given** all components generated, **When** running `tsc --noEmit`, **Then** zero
   type errors are reported.

---

### User Story 3 — State Logic Extracted into Companion Hooks (Priority: P1)

For each interactive component with a non-trivial state machine (Input, Select,
Checkbox, Radio, Modal, Accordion, Tooltip, Toast, Dropdown, DatePicker, Drawer,
Stepper, FileUpload, RichText — when in scope), the Hook Generator (Agent 13) produces
a companion `useXxx.ts` hook file in `src/hooks/`. The TSX component file for that
component contains no `useState` or `useReducer` calls — all state is managed through
the hook.

**Why this priority**: State/presentation separation is a hard architectural constraint
from the DAF constitution. If hooks are missing or the boundary is breached (component
contains state logic directly), the generated code violates the contract that Quality
Gate agents enforce. This directly gates the Composite Quality Score.

**Independent Test**: Run the crew with a Standard scope profile (which includes Modal,
Accordion, Tooltip, Toast, Dropdown). Verify exactly one `useXxx.ts` file per
qualifying interactive component exists in `src/hooks/`. Grep all `src/components/`
files for `useState` and `useReducer` — zero matches. Grep all `src/hooks/` files for
imports from `src/components/` — zero matches.

**Acceptance Scenarios**:

1. **Given** a Starter scope, **When** Agent 13 runs, **Then** hook files are
   generated for: useInput, useSelect, useCheckbox, useRadio, useModal — exactly 5
   hook files plus `src/hooks/index.ts`.
2. **Given** a Standard scope (adds Accordion, Tooltip, Toast, Dropdown), **When**
   Agent 13 runs, **Then** 9 hook files are generated (Starter 5 + useAccordion,
   useTooltip, useToast, useDropdown) plus index.
3. **Given** a Comprehensive scope (adds DatePicker, Drawer, Stepper, FileUpload,
   RichText), **When** Agent 13 runs, **Then** 14 hook files are generated plus index.
4. **Given** any generated component TSX file for a hook-qualified component, **When**
   searching the file for `useState`, `useReducer`, or `useContext` managing local
   UI state, **Then** zero direct state calls are found — all state is delegated to
   the companion hook.
5. **Given** any generated hook file, **When** inspecting its import declarations,
   **Then** no import from `src/components/` is present (one-way dependency only:
   components import hooks, not the reverse).
6. **Given** all hook files generated, **When** running `tsc --noEmit`, **Then** zero
   type errors are reported.

---

### User Story 4 — Tests Generated with ≥ 80% Coverage (Priority: P1)

After all TSX and hook files exist, the Test Generator (Agent 14) produces a
corresponding test file for every component and hook in `src/__tests__/`. Each test
file covers: render without crash, all variant renders, all interactive states
(including keyboard navigation), a11y assertions (ARIA role, attributes), and at least
one snapshot. Coverage target is ≥ 80% per component/hook file.

**Why this priority**: The 80% line coverage threshold is a hard quality gate defined
in the constitution and `pipeline-config.json`. The Quality Gate crews (Agents 20 and
30) block on this. If tests are absent or under-threshold, the Composite Quality Score
cannot meet the ≥ 70/100 minimum.

**Independent Test**: Run Agent 14. Execute `vitest --coverage` in the project root.
Open the coverage report and verify that every file in `src/components/`,
`src/primitives/`, and `src/hooks/` shows ≥ 80% line coverage. Inspect one test file
and confirm: render test, all variant tests, keyboard navigation test, ARIA attribute
test, and snapshot are present.

**Acceptance Scenarios**:

1. **Given** all TSX and hook files generated, **When** Agent 14 runs, **Then** a
   corresponding `*.test.tsx` exists for every component and primitive file, and a
   `*.test.ts` exists for every hook file.
2. **Given** a component with 4 variants (e.g., Button: primary, secondary, destructive,
   ghost), **When** inspecting its test file, **Then** at least one test per variant
   is present (4 variant tests minimum).
3. **Given** an interactive component with keyboard navigation (e.g., Modal — Escape
   closes, Tab traps focus), **When** inspecting its test file, **Then** explicit
   keyboard event tests fire those keys and assert the resulting state change.
4. **Given** any component test file, **When** inspecting it, **Then** at least one
   snapshot test (`toMatchSnapshot()` or `toMatchInlineSnapshot()`) is present.
5. **Given** any component test file, **When** inspecting it, **Then** at least one
   accessibility assertion is present: either a role query (`getByRole`), an ARIA
   attribute assertion, or an `axe` / `jest-axe` call.
6. **Given** all test files generated, **When** running `vitest --coverage`, **Then**
   every file in `src/components/`, `src/primitives/`, and `src/hooks/` reports
   ≥ 80% line coverage. If any file is below threshold, Agent 14 retries up to 2
   times before escalating.
7. **Given** Agent 14 has run, **When** running the full test suite, **Then** zero
   test failures are reported from the initially-generated tests.

---

### User Story 5 — Storybook Stories Generated for All Components and Primitives (Priority: P2)

After TSX generation, the Storybook Generator (Agent 15) produces one `*.stories.tsx`
file per component and primitive in `src/stories/`. Each story file implements: a
Default story, one story per variant, one story per significant interactive state, and
an a11y story that runs the Storybook a11y addon checks.

**Why this priority**: Stories are required by the Documentation Crew (Phase 4a) and
the Quality Gate (Agent 30 requires at least one usage example per component). They
are downstream of all four other agents in this crew and do not block Phase 3 quality
gates, so they are P2. However, they must be present before the pipeline can be
considered complete.

**Independent Test**: Run Agent 15. Verify that exactly (9 primitives + N components)
`.stories.tsx` files exist in `src/stories/`. Open one component story file and
confirm: it exports a `Default` story, one export per variant, and an `A11y` story
that imports the a11y addon meta. Run `storybook build` — zero build errors.

**Acceptance Scenarios**:

1. **Given** all TSX files generated, **When** Agent 15 runs, **Then** one
   `.stories.tsx` file exists per component and per primitive in `src/stories/`.
2. **Given** a `Button` component with 4 variants, **When** inspecting
   `Button.stories.tsx`, **Then** it exports: `Default`, `Primary`, `Secondary`,
   `Destructive`, `Ghost` — at least 5 named exports.
3. **Given** an interactive component (e.g., `Modal`), **When** inspecting its story
   file, **Then** at least one story demonstrates a significant interactive state
   (e.g., `Open`, `WithLongContent`, `Dismissible`).
4. **Given** any generated story file, **When** inspecting its default export (CSF3
   meta object), **Then** the a11y addon is referenced in the meta configuration
   (either via `parameters.a11y` or a global `decorators` entry), enabling the a11y
   panel for that story.
5. **Given** all story files generated, **When** running `storybook build`, **Then**
   zero build errors are reported.

---

### Edge Cases

- A spec YAML references a primitive not in the 9-primitive set — Agent 11 reports an
  unknown primitive error and halts that file's generation. The error does not
  cascade to other primitives.
- A component spec YAML's composition tree references a primitive that Agent 11 failed
  to generate — Agent 12 detects the missing import, reports the error, and skips that
  component file. Remaining components proceed.
- A hook-qualified interactive component is not in the scope tier (e.g., Modal is
  present in Starter but Accordion is not) — Agent 13 silently skips out-of-scope
  components; no error is reported for intentionally excluded components.
- `componentOverrides` in the brand profile references a token name that does not
  exist in the compiled token set — Agent 12 logs a warning and falls back to the
  spec YAML default. The pipeline does not halt.
- A component spec YAML declares a variant that maps to the same visual token values
  as another variant — Agent 12 generates both variants faithfully as specified;
  deduplication of visually-identical variants is not a concern for this crew.
- Agent 14 generates a test that references a component prop not present in the TSX
  (type mismatch) — Agent 14 catches the `tsc --noEmit` failure on the test file and
  retries the test generation for that component, up to 2 times.
- A `src/primitives/` or `src/components/` directory already contains files from a
  previous run — Agent 11/12 overwrite existing files idempotently. Overwrite is
  logged per file.
- Brand profile specifies `directions: [ltr, rtl]` but a primitive spec YAML has no
  RTL section — Agent 11 generates the LTR version only and logs a warning that RTL
  support for that primitive is incomplete.
- The Comprehensive scope introduces beta components (DatePicker, DataGrid, TreeView,
  Drawer, Stepper, FileUpload, RichText) — Agent 12 MUST add `@beta` to all of these
  regardless of `pipeline-config.json` content, since they are always beta in
  Comprehensive scope per PRD definition.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Design-to-Code Crew MUST fail-fast with a structured error if any
  required input is absent: `specs/*.spec.yaml`, `tokens/compiled/tokens.ts`,
  `tokens/compiled/tokens.css`, `tokens/compiled/tokens.json`,
  `src/theme/theme.config.ts`, `brand-profile.json`, `pipeline-config.json`.
- **FR-002**: Agent 11 MUST generate exactly 9 primitive TSX files in
  `src/primitives/`: Box, Stack, Grid, Text, Icon, Pressable, Divider, Spacer,
  ThemeProvider — one file per primitive, regardless of scope or archetype.
- **FR-003**: Agent 11 MUST generate `src/primitives/index.ts` as a barrel export
  for all 9 primitive files.
- **FR-004**: No generated primitive or component TSX file MUST contain hardcoded
  visual values (hex colors, raw `px`/`rem`/`em` dimension literals, named CSS colors,
  hardcoded opacity or shadow values). All visual values MUST be resolved via ThemeConfig
  or compiled token references.
- **FR-005**: Agent 11 MUST generate ThemeProvider.tsx as a wrapper for the
  ThemeConfig object from `src/theme/theme.config.ts`. ThemeProvider MUST NOT author
  any theme logic or token values directly within the component.
- **FR-006**: When `brand-profile.json` includes `rtl` in its supported directions,
  Agent 11 MUST generate directional primitives (Box, Stack, Grid) using logical CSS
  properties (`inlineStart`/`inlineEnd` instead of `left`/`right`) and include an RTL
  variant.
- **FR-007**: Agent 12 MUST generate the component set matching the Brand Profile
  scope: 10 components for Starter, 19 for Standard, 26 for Comprehensive.
- **FR-008**: Agent 12 MUST generate `src/components/index.ts` as a barrel export for
  all generated component files.
- **FR-009**: All generated component TSX files MUST import structural elements from
  `src/primitives/*` only. Raw HTML elements (`<div>`, `<span>`, `<button>`,
  `<input>`, `<ul>`, `<li>`, etc.) MUST NOT appear in component files. They are
  permitted only in primitive files.
- **FR-010**: Agent 12 MUST implement all variants and interactive states defined in
  each component's spec YAML. No variant or state defined in the spec may be omitted.
- **FR-011**: Agent 12 MUST apply `componentOverrides` from the Brand Profile to the
  relevant component's token bindings. Overrides take precedence over spec YAML
  defaults.
- **FR-012**: Agent 12 MUST add a `@beta` JSDoc tag to the file header of every
  component listed in `pipeline-config.json`'s `lifecycle.betaComponents`.
- **FR-013**: All interactive components MUST implement keyboard navigation per their
  spec YAML's a11y section — including correct ARIA roles, ARIA attribute management,
  focus trap where specified, and keyboard event handlers (at minimum: Enter, Space,
  Escape, Tab, Arrow keys where applicable).
- **FR-014**: Agent 13 MUST generate one `useXxx.ts` hook file per qualifying
  interactive component. Qualifying components: Input, Select, Checkbox, Radio, Modal
  (Starter+); Accordion, Tooltip, Toast, Dropdown (Standard+); DatePicker, Drawer,
  Stepper, FileUpload, RichText (Comprehensive only).
- **FR-015**: Agent 13 MUST generate `src/hooks/index.ts` as a barrel export for all
  generated hook files.
- **FR-016**: Hook files MUST NOT import from `src/components/`. The dependency is
  one-way: components import hooks, hooks do not import components.
- **FR-017**: Component TSX files for hook-qualified components MUST NOT contain
  `useState`, `useReducer`, or direct `useContext` calls for UI state management. All
  such state MUST be delegated to the companion hook.
- **FR-018**: Agent 14 MUST generate a test file for every component, primitive, and
  hook file produced by Agents 11–13.
- **FR-019**: Every component test file MUST cover: render without crash, all variants,
  all interactive states, at least one ARIA/role accessibility assertion, and at least
  one snapshot.
- **FR-020**: Every interactive component test file MUST include keyboard navigation
  tests that simulate the key events specified in the spec YAML's a11y section and
  assert the resulting state.
- **FR-021**: Agent 14 MUST achieve ≥ 80% line coverage per component/primitive/hook
  file as measured by `vitest --coverage`. If a file falls below threshold, Agent 14
  retries generation for that file up to 2 times before escalating.
- **FR-022**: Agent 15 MUST generate one `*.stories.tsx` file per component and per
  primitive in `src/stories/`.
- **FR-023**: Every story file MUST export: a `Default` story, one named story per
  variant, at least one story per significant interactive state, and at minimum one
  story with a11y addon meta configuration enabled.
- **FR-024**: All generated story files MUST follow CSF3 (Component Story Format 3)
  conventions — default export is the meta object, named exports are stories.
- **FR-025**: Agent 11 and Agent 12 MUST retry up to 2 times when a generated TSX
  file fails `tsc --noEmit`, appending the compiler error to the generation context on
  each retry. Exhausted retries escalate as a hard failure.

### Key Entities

- **Primitive TSX**: A generated TypeScript React component in `src/primitives/` that
  implements a single structural or utility building block (Box, Stack, Grid, Text,
  Icon, Pressable, Divider, Spacer, ThemeProvider). Contains no raw HTML elements in
  its public API surface. Accepts style props resolved exclusively through token
  references or ThemeConfig values.

- **Component TSX**: A generated TypeScript React component in `src/components/` that
  implements a complete UI component assembled from primitives. Implements all variants
  and states from its spec YAML. Manages no UI state directly — delegates to a
  companion hook if hook-qualified.

- **Hook**: A generated TypeScript custom hook in `src/hooks/` that encapsulates all
  UI state logic for a qualifying interactive component. Exports a typed return object
  with state values and event handlers. Has no dependency on `src/components/`.

- **Test Suite**: A set of generated test files in `src/__tests__/` providing verifiable
  correctness coverage for all components, primitives, and hooks. Meets the ≥ 80% line
  coverage threshold enforced by Quality Gate agents.

- **Story Set**: A set of generated Storybook story files in `src/stories/` providing
  visual documentation and a11y verification for all components and primitives. Each
  story file is CSF3-compliant and includes a11y addon integration.

### Crew I/O Contract

| | Files |
|---|---|
| **Reads (required)** | `specs/*.spec.yaml`, `tokens/compiled/tokens.ts`, `tokens/compiled/tokens.css`, `tokens/compiled/tokens.json`, `src/theme/theme.config.ts`, `brand-profile.json` (validated), `pipeline-config.json` |
| **Reads (optional)** | `tokens/compiled/brands/<brand-name>/` (Multi-Brand override compilations) |
| **Writes** | `src/primitives/*.tsx` (9 files), `src/primitives/index.ts`, `src/components/*.tsx` (N per scope), `src/components/index.ts`, `src/hooks/use*.ts` (M per scope), `src/hooks/index.ts`, `src/__tests__/*.test.tsx`, `src/__tests__/*.test.ts`, `src/stories/*.stories.tsx` |

**Boundary constraints**:
- [x] This crew does NOT produce both spec YAMLs and TSX source for the same component
      (spec YAMLs are read-only inputs from Bootstrap; TSX is this crew's output only)
- [x] This crew does NOT produce both raw tokens and compiled tokens (tokens/ is
      read-only; this crew writes only to src/)
- [x] This crew does NOT write to another crew's declared output namespace (`tokens/`,
      `specs/`, `docs/`, `governance/`)

### Token Bindings *(mandatory for any component-producing feature)*

All style values in generated TSX files MUST reference compiled tokens. The Token
categories consumed by this crew:

- `color.*` (semantic tier) — foreground, background, border, interactive state colors
- `spacing.*` (semantic tier) — padding, margin, gap values for all layout primitives
- `typography.*` (semantic tier) — fontFamily, fontSize, fontWeight, lineHeight, letterSpacing
- `radius.*` (semantic tier) — borderRadius for Box, Pressable, Card, Badge, Input, Button
- `shadow.*` (semantic tier) — boxShadow for elevation-bearing components (Card, Modal, Dropdown, Tooltip)
- `motion.*` (semantic tier) — transition duration and easing for interactive state transitions
- `sizing.*` (semantic tier) — width, height, minWidth constraints for Icon, Avatar, Divider
- `component.*` (component tier) — component-specific overrides for any token in the above categories

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Agent 11 produces the exact expected primitive file count (9 TSX + 1
  barrel). Running `tsc --noEmit` on `src/primitives/` reports zero type errors.
- **SC-002**: Agent 12 produces the component file count matching the scope exactly
  (10/19/26 TSX + 1 barrel). Running `tsc --noEmit` on `src/components/` reports zero
  type errors.
- **SC-003**: Zero raw HTML element tags appear in any file under `src/components/`.
  Verified by grepping for `<div`, `<span`, `<button`, `<input`, `<ul`, `<li` in the
  `src/components/` directory.
- **SC-004**: Zero hardcoded visual values appear in any generated file under `src/`.
  Verified by grepping for hex color patterns (`#[0-9a-fA-F]{3,8}`), bare `px`/`rem`
  dimension literals, and named CSS colors in `src/primitives/` and
  `src/components/`.
- **SC-005**: Running `vitest --coverage` reports ≥ 80% line coverage for every file
  in `src/components/`, `src/primitives/`, and `src/hooks/`.
- **SC-006**: Running `storybook build` completes with zero errors, and the built
  Storybook contains at least one story per component and per primitive.
- **SC-007**: Zero circular imports between `src/hooks/` and `src/components/`.
  Verified by a dependency graph check confirming no hook file imports from
  `src/components/`.

## Assumptions

- Agent 11 runs before Agent 12. The crew enforces sequential execution: primitives →
  components → hooks → tests → stories.
- The ThemeConfig exported from `src/theme/theme.config.ts` is a valid TypeScript
  object (guaranteed by Token Engine Crew). Agent 11 trusts its type signature without
  re-validating it.
- `src/primitives/`, `src/components/`, `src/hooks/`, `src/__tests__/`, and
  `src/stories/` may or may not exist when the crew starts. All absent directories are
  created before writing.
- Existing files from a prior run are overwritten idempotently by Agents 11–15.
  Overwrite is logged but does not constitute an error.
- The "no HTML elements in components" constraint applies only to JSX surface.
  Forwarding `ref` to a DOM element via a primitive's internal implementation is
  permitted — the constraint governs the component author's JSX, not the compiled DOM
  output.
- Storybook is configured in the project (`.storybook/main.ts` etc.) before the crew
  runs. The Storybook Generator assumes a working Storybook config exists; it does not
  scaffold the config itself.

## Out of Scope

- Generating documentation prose for components — that is the Documentation Crew
  (Phase 4a).
- Generating governance ownership or workflow files — that is the Governance Crew
  (Phase 4b).
- Running the quality composite score calculation or individual quality gate checks —
  that is Agent 20 (Composite Quality Score) and Agent 30 (Quality Gate Enforcer).
- Publishing or building the final npm package — that is the Release Crew (Phase 6).
- Generating CSS Modules, Styled Components, or Emotion variants — this pipeline
  generates token-bound inline style props and CSS custom property references only.
- Generating E2E or integration tests — Agent 14 generates unit and component tests
  only. E2E test scaffolding is out of scope for DAF Local.
- Figma component synchronization or design handoff tooling — out of scope for
  DAF Local.
