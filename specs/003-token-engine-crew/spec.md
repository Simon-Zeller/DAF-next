# Feature Specification: Token Engine Crew

**Feature Branch**: `003-token-engine-crew`
**Created**: 2026-03-12
**Status**: Draft
**Input**: User description: "Feature: Token Engine Crew. The second CrewAI crew in
the DAF pipeline. Receives all raw token files and spec YAMLs from the Bootstrap
Crew and runs 4 agents to produce validated, compiled, and platform-ready token
artifacts that every component-generating crew depends on."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Raw Tokens Validated Before Compilation (Priority: P1)

A developer has just run the Bootstrap Crew and has three raw W3C DTCG token files
on disk. The Token Engine Crew's Token Validator (Agent 7) runs before any compilation
begins. It systematically checks every token in all three tier files for structural
validity, naming convention compliance, and alias resolution correctness. If even one
token fails, the entire crew halts and triggers a retry on Bootstrap's Token
Foundation Agent (Agent 2).

**Why this priority**: Compiling invalid tokens produces silently broken output — CSS
variables with unresolvable aliases, TypeScript constants with wrong types, or a theme
config that doesn't match the design intent. Validation is the gate that makes all
downstream compilation trustworthy. No other crew agent can run until validation
passes.

**Independent Test**: Provide a `semantic.tokens.json` with one alias pointing to a
base token name that does not exist (`$value: "{color.bran.primary}"` — note the
typo). Verify Agent 7 catches the orphaned alias, reports the exact token path and
the unresolved reference, and halts without producing any compiled output.

**Acceptance Scenarios**:

1. **Given** three raw token files where every token has `$type` and `$value`, all
   aliases resolve correctly, and all names are kebab-case without collisions, **When**
   Agent 7 runs, **Then** it reports zero validation errors and proceeds to Agent 8.
2. **Given** a `base.tokens.json` where one leaf token is missing its `$type` field,
   **When** Agent 7 runs, **Then** it reports the exact token path (e.g.,
   `color.neutral.100`) as a structural error and halts the crew without writing any
   compiled output.
3. **Given** a `semantic.tokens.json` with a circular alias (token A `$value` points
   to token B, and token B `$value` points to token A), **When** Agent 7 runs,
   **Then** it detects the cycle, reports both token paths involved, and halts the
   crew.
4. **Given** a `component.tokens.json` with an alias that points to a non-existent
   semantic token, **When** Agent 7 runs, **Then** it reports an orphaned alias error
   with the source token path and the unresolved reference value.
5. **Given** a token name in any tier file that contains uppercase letters (e.g.,
   `colorPrimary` instead of `color-primary`), **When** Agent 7 runs, **Then** it
   reports a naming convention violation and halts.
6. **Given** two tokens in different tier files that resolve to the same CSS custom
   property name after compilation, **When** Agent 7 runs, **Then** it reports a
   naming collision and halts.
7. **Given** a spec YAML referencing a token name `color.action.primary` that does not
   exist in either `semantic.tokens.json` or `component.tokens.json`, **When** Agent 7
   runs, **Then** it reports the unresolved spec reference (including which spec file
   and which field) and halts.
8. **Given** Agent 7 halts due to any validation failure, **When** the failure is
   recorded, **Then** Agent 6 (First Publish) is notified to trigger a Bootstrap
   retry on Agent 2, and the rejection context (all validation errors) is passed to
   Agent 2 on retry.

---

### User Story 2 — Tokens Compiled to All Platform Targets (Priority: P1)

After successful validation, the Token Compiler (Agent 8) transforms the raw W3C
DTCG token files into three platform-ready artifacts: CSS custom properties, TypeScript
ESM constants, and a flat JSON map. All three are written atomically to
`tokens/compiled/`. For Multi-Brand pipelines, brand override compilations are written
to per-brand subdirectories.

**Why this priority**: The compiled token files are the direct inputs for Phase 3
(Design-to-Code). No component can be generated without an importable token set. This
is the primary deliverable of the Token Engine Crew.

**Independent Test**: Provide valid three-tier token files from a single-brand
Enterprise B2B profile. Verify that `tokens/compiled/tokens.css` contains valid CSS
with `--` custom property syntax, `tokens/compiled/tokens.ts` is valid TypeScript ESM,
and `tokens/compiled/tokens.json` is a flat key-value JSON object. Verify none of the
raw files in `tokens/` have been modified.

**Acceptance Scenarios**:

1. **Given** validated raw token files, **When** Agent 8 runs, **Then** all three
   platform targets (`tokens.css`, `tokens.ts`, `tokens.json`) are written atomically
   to `tokens/compiled/`. If any one target fails to write, none are written.
2. **Given** a token with a `$description` field, **When** Agent 8 compiles to CSS,
   **Then** the description appears as a CSS comment immediately above the custom
   property declaration (e.g., `/* Primary brand color for interactive elements */`).
3. **Given** the same token with a `$description` field, **When** Agent 8 compiles to
   TypeScript, **Then** the description appears as a JSDoc comment above the exported
   constant.
4. **Given** validated raw tokens, **When** Agent 8 generates `tokens.ts`, **Then**
   the file exports: a `TokenName` union type (all valid dot-notation token keys), a
   `TokenValue` type, and a typed `get(name: TokenName): TokenValue` helper function.
5. **Given** tokens spanning all three tiers, **When** Agent 8 generates `tokens.css`,
   **Then** base tier tokens appear first as `:root` custom properties, semantic tier
   tokens reference base tokens using `var()`, and component tier tokens reference
   semantic tokens using `var()`. The specificity cascade order (base → semantic →
   component) is preserved in the output file.
6. **Given** a Multi-Brand profile with two brands (`brand-a`, `brand-b`), **When**
   Agent 8 compiles brand overrides, **Then** three override files are written for
   each brand: `tokens/compiled/brands/brand-a/tokens.css`, `tokens.ts`, `tokens.json`
   and the same for `brand-b`. Override files contain only the tokens that differ from
   the base.
7. **Given** Agent 8 has run, **When** inspecting `tokens/base.tokens.json`,
   `tokens/semantic.tokens.json`, and `tokens/component.tokens.json`, **Then** their
   content is byte-for-byte identical to before Agent 8 ran (raw files are immutable
   to this agent).

---

### User Story 3 — ThemeProvider Configuration Generated (Priority: P1)

After compilation, the Theme Builder (Agent 9) generates `src/theme/theme.config.ts`
— a typed TypeScript configuration object derived entirely from the compiled semantic
tokens. Light and dark mode variants are included when the Brand Profile specifies
both themes. This config is the only output of the theme step; the actual React
ThemeProvider component is generated by Phase 3.

**Why this priority**: The ThemeProvider config is a hard dependency for Phase 3.
Every component generated by the Design-to-Code Crew consumes the theme config to
resolve its visual values at runtime. Without it, Phase 3 cannot wire components to
the token system.

**Independent Test**: Run Agent 9 with a brand profile that specifies `themes: [light,
dark]`. Verify that `src/theme/theme.config.ts` is valid TypeScript, exports a default
`ThemeConfig` object (not a React component), contains separate `light` and `dark`
sub-objects whose values reference only token names present in
`tokens/compiled/tokens.ts`, and contains no hardcoded hex color, px, or rem values.

**Acceptance Scenarios**:

1. **Given** compiled semantic tokens and a brand profile with `themes: [light]`,
   **When** Agent 9 runs, **Then** `src/theme/theme.config.ts` is written with a
   single theme variant containing all semantic token entries mapped to their compiled
   token references.
2. **Given** compiled semantic tokens and a brand profile with `themes: [light, dark]`,
   **When** Agent 9 runs, **Then** `src/theme/theme.config.ts` contains both a `light`
   and a `dark` object with appropriate token values for each mode.
3. **Given** the generated `theme.config.ts`, **When** inspecting the file, **Then**
   it contains zero hardcoded visual values (no hex colors, no px, no rem, no named
   CSS colors). Every value is a reference to a compiled token name.
4. **Given** the generated `theme.config.ts`, **When** running `tsc --noEmit` against
   it with the project's `tsconfig.json`, **Then** zero type errors are reported.
5. **Given** Agent 9 has run, **When** inspecting `src/theme/`, **Then** only
   `theme.config.ts` exists — no `.tsx` files, no React component, no JSX. The
   ThemeProvider component itself is not generated here.

---

### User Story 4 — Token Dictionary and Index Generated (Priority: P2)

After compilation, the Token Documentation Agent (Agent 10) produces two artifacts:
`tokens/TOKEN-DICTIONARY.md` — a human-readable reference of every token — and
`tokens/compiled/index.ts` — a re-export barrel for the three compiled TypeScript
files. Together they make the token set discoverable for both humans and tooling.

**Why this priority**: The TOKEN-DICTIONARY.md and index barrel are quality-of-life
outputs, not hard dependencies for Phase 3. Phase 3 can function without them.
However, they are required by the Documentation Crew (Phase 4a) and expected by the
AI Semantic Layer Crew (Phase 5b). Generating them here, at the earliest opportunity,
ensures they stay in sync with the actual compiled tokens.

**Independent Test**: Run Agent 10 with compiled token files. Open
`tokens/TOKEN-DICTIONARY.md` and verify: entries are sorted alphabetically within each
tier section, each entry shows the token name, resolved value, and `$description` (if
present), and no token from the compiled files is absent from the dictionary.

**Acceptance Scenarios**:

1. **Given** compiled token files, **When** Agent 10 generates `TOKEN-DICTIONARY.md`,
   **Then** the document is organized with three top-level sections: Global (base
   tier), Semantic, Component-Scoped — in that order.
2. **Given** any single tier section in `TOKEN-DICTIONARY.md`, **When** inspecting
   its entries, **Then** entries are sorted strictly alphabetically by token name
   within the tier.
3. **Given** a token with a `$description` in the raw files, **When** it appears in
   `TOKEN-DICTIONARY.md`, **Then** its description is rendered alongside its name and
   resolved value.
4. **Given** the three compiled TypeScript files (`tokens.ts` plus any brand override
   `tokens.ts`), **When** Agent 10 generates `tokens/compiled/index.ts`, **Then** it
   re-exports all named exports from each TypeScript file (including brand overrides
   if present), and is itself valid TypeScript (`tsc --noEmit` passes).
5. **Given** a Multi-Brand compilation with two brands, **When** Agent 10 generates
   `TOKEN-DICTIONARY.md`, **Then** each brand's override tokens appear in a dedicated
   sub-section under each tier, clearly distinguished from the base tokens.

---

### Edge Cases

- Raw token file is syntactically invalid JSON (parse error before any DTCG
  validation can run) — Agent 7 MUST reject with a parse error identifying which
  file is malformed. Crew halts immediately.
- All three raw token files are present but one is an empty JSON object `{}` — Agent
  7 reports a structural error (no tokens found in file) and halts.
- A base token has `$value` that is itself an alias reference (circular base tier
  dependency) — Agent 7 detects and reports the cross-tier circular reference.
- A token name matches a CSS reserved keyword (e.g., a token named `inherit` or
  `initial`) — Agent 7 flags this as a reserved keyword violation. Compilation of
  that token is not attempted.
- Agent 8 encounters a `$type: "composite"` token (not a standard W3C DTCG simple
  type) — Agent 8 skips it with a warning in the output log. Composite tokens are
  out of scope for this pipeline version.
- Brand profile specifies `themes: [light, dark]` but the raw semantic tokens contain
  only light-mode values (no dark-mode token group) — Agent 9 reports a missing dark
  mode token set and writes only the light theme config, logging the gap for the user.
- `tokens/compiled/` already contains artifacts from a previous run — Agent 8
  overwrites them without prompting (idempotent compilation). The overwrite is logged.
- `src/theme/` does not yet exist on disk — Agent 9 creates the directory before
  writing `theme.config.ts`.
- The number of tokens in the raw files exceeds a threshold where the TOKEN-DICTIONARY
  would be unreadably large (e.g., > 1000 tokens) — Agent 10 adds a summary table at
  the top of the dictionary with token counts by category.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Token Engine Crew MUST fail-fast with a structured error if any
  required input file (`base.tokens.json`, `semantic.tokens.json`,
  `component.tokens.json`, `brand-profile.json`) is absent from disk before Agent 7
  runs.
- **FR-002**: Agent 7 MUST validate every leaf token in all three tier files for
  the presence of both `$type` and `$value` fields. Missing either field on any
  leaf token is a hard validation failure.
- **FR-003**: Agent 7 MUST validate that all `$value` alias references (format:
  `{token.path}`) resolve to an existing token in the same or a lower tier. Forward
  references (component → base, semantic → component) are prohibited.
- **FR-004**: Agent 7 MUST detect circular alias chains across all tiers and report
  every token path involved in the cycle.
- **FR-005**: Agent 7 MUST validate that all token names conform to kebab-case
  convention and contain no uppercase letters, spaces, or leading/trailing hyphens.
- **FR-006**: Agent 7 MUST detect naming collisions — two tokens that would produce
  identical CSS custom property names after compilation.
- **FR-007**: Agent 7 MUST cross-reference all spec YAMLs against the token files
  and report any token reference in a spec that does not resolve to a real token in
  `semantic.tokens.json` or `component.tokens.json`.
- **FR-008**: Agent 7 MUST halt the entire crew on the first validation failure.
  Partial compilation after a validation failure is prohibited.
- **FR-009**: Agent 7 MUST pass its full validation error report to Agent 6 for
  Bootstrap retry routing when halting.
- **FR-010**: Agent 8 MUST compile tokens from all three tier files into three
  platform targets: CSS custom properties (`.css`), TypeScript ESM constants (`.ts`),
  flat JSON map (`.json`).
- **FR-011**: Agent 8 MUST write all three platform targets atomically. If any single
  target fails to write, the other targets MUST NOT be persisted.
- **FR-012**: Agent 8 MUST preserve `$description` values as inline comments in both
  CSS and TypeScript compiled output. Tokens without `$description` receive no
  comment.
- **FR-013**: Agent 8 MUST generate a `TokenName` union type (all valid token keys),
  a `TokenValue` type, and a typed `get(name: TokenName): TokenValue` helper in the
  TypeScript output.
- **FR-014**: Agent 8 MUST order compiled CSS output: base tier `:root` declarations
  first, followed by semantic tier `var()` references, followed by component tier
  `var()` references. All three tiers MUST be present in a single `tokens.css` file.
- **FR-015**: Agent 8 MUST NOT modify any file under `tokens/` except by writing
  to `tokens/compiled/`. The raw tier files are immutable to this agent.
- **FR-016**: For Multi-Brand profiles, Agent 8 MUST compile per-brand override sets
  to `tokens/compiled/brands/<brand-name>/` — one directory per brand with the three
  platform targets. Override files contain only tokens that differ from the base
  compiled output.
- **FR-017**: Agent 9 MUST generate `src/theme/theme.config.ts` as a TypeScript file
  with a default export of a typed `ThemeConfig` object.
- **FR-018**: Agent 9 MUST derive all ThemeConfig values from compiled semantic token
  references. No hardcoded visual values (hex, px, rem, named CSS colors) are
  permitted in `theme.config.ts`.
- **FR-019**: Agent 9 MUST generate separate light and dark variant objects within
  the ThemeConfig when the Brand Profile specifies `themes: [light, dark]`. When only
  one theme is specified, only that variant is generated.
- **FR-020**: Agent 9 MUST NOT generate any React component, JSX, or `.tsx` file.
  `theme.config.ts` MUST be a plain TypeScript module.
- **FR-021**: Agent 10 MUST generate `tokens/TOKEN-DICTIONARY.md` organized by tier
  (Global → Semantic → Component-Scoped) with entries sorted alphabetically by token
  name within each tier.
- **FR-022**: Agent 10 MUST include the token name, resolved value, and description
  (if present) for every token in `TOKEN-DICTIONARY.md`.
- **FR-023**: Agent 10 MUST generate `tokens/compiled/index.ts` that re-exports all
  named exports from `tokens.ts` (and brand override `tokens.ts` files if present).

### Key Entities

- **Validated Raw Token Set**: The three W3C DTCG JSON files (`base.tokens.json`,
  `semantic.tokens.json`, `component.tokens.json`) after Agent 7 has confirmed
  structural, naming, and alias correctness. The files themselves are unchanged on
  disk — validation is a read-only process.

- **Compiled Token Set**: The three platform-ready output files produced by Agent 8.
  `tokens.css` — CSS custom properties in cascade order; `tokens.ts` — TypeScript ESM
  constants with types and `get()` helper; `tokens.json` — flat key/value JSON map.
  All live in `tokens/compiled/`.

- **Brand Override Compilation**: Per-brand compiled token files for Multi-Brand
  profiles. Contain only the delta tokens (those that differ from the base compiled
  set). Located at `tokens/compiled/brands/<brand-name>/`.

- **ThemeConfig**: A typed TypeScript object exported from `src/theme/theme.config.ts`
  that maps semantic token categories to their compiled type-safe references. Has
  optional `light` and `dark` sub-objects. Consumed by the Phase 3 ThemeProvider
  component generation.

- **Token Dictionary**: `tokens/TOKEN-DICTIONARY.md` — an authoritative human-readable
  index of all tokens, organized and sorted for discoverability. Used by developers,
  the Documentation Crew, and the AI Semantic Layer Crew.

### Crew I/O Contract

| | Files |
|---|---|
| **Reads (required)** | `tokens/base.tokens.json` (raw), `tokens/semantic.tokens.json` (raw), `tokens/component.tokens.json` (raw), `specs/*.spec.yaml` (cross-reference only), `brand-profile.json` (validated) |
| **Reads (optional)** | `tokens/brands/*.tokens.json` (Multi-Brand overrides) |
| **Writes** | `tokens/compiled/tokens.css`, `tokens/compiled/tokens.ts`, `tokens/compiled/tokens.json`, `tokens/compiled/index.ts`, `tokens/compiled/brands/<brand-name>/tokens.{css,ts,json}` (Multi-Brand only), `tokens/TOKEN-DICTIONARY.md`, `src/theme/theme.config.ts` |

**Boundary constraints**:
- [x] This crew does NOT produce both spec YAMLs and TSX source for the same component
- [x] This crew does NOT produce both raw tokens and compiled tokens (raw files are
  read-only; only compiled output is written)
- [x] This crew does NOT write to another crew's declared output namespace (`specs/`,
  `src/components/`, `docs/`, `governance/`)

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Given any valid Bootstrap output, Agent 7 produces zero false negatives —
  every structural, naming, and alias error in the raw token files is detected and
  reported before any compilation begins.
- **SC-002**: The three compiled platform targets are byte-for-byte consistent with
  each other — every token present in `tokens.json` is present in `tokens.css` and
  `tokens.ts`, and vice versa. Zero tokens are silently omitted from any target.
- **SC-003**: Running `tsc --noEmit` on `tokens/compiled/tokens.ts` and
  `src/theme/theme.config.ts` against the project `tsconfig.json` produces zero type
  errors.
- **SC-004**: Every `$description` present in any raw token file appears as a comment
  in the corresponding compiled CSS and TypeScript output. Zero descriptions are lost
  during compilation.
- **SC-005**: The `TOKEN-DICTIONARY.md` entry count equals the total leaf token count
  across all three raw tier files. Zero tokens are omitted from the dictionary.
- **SC-006**: No raw token file (`tokens/base.tokens.json`, `tokens/semantic.tokens.json`,
  `tokens/component.tokens.json`) is modified by any agent in this crew. Verified by
  comparing file checksums before and after the crew runs.

## Assumptions

- The raw token files produced by Bootstrap Agent 2 are syntactically valid JSON.
  If they are not (parse error), Agent 7 produces a parse error — not a DTCG
  validation error — and halts.
- All token `$type` values are from the W3C DTCG standard simple types: `color`,
  `dimension`, `fontFamily`, `fontWeight`, `fontStyle`, `duration`, `cubicBezier`,
  `number`, `string`. Composite types are not supported in this pipeline version and
  are skipped with a warning.
- `src/theme/` may or may not exist when Agent 9 runs. The agent creates the
  directory if absent.
- Brand names in the `brands` array of the Brand Profile are valid directory name
  components (no slashes, no special characters). Name safety was validated by
  Bootstrap Agent 1.
- `tokens/compiled/` may contain stale output from a prior run. Agent 8 overwrites
  existing files idempotently.

## Out of Scope

- Generating any React component, including the ThemeProvider component — that is
  Phase 3 (Design-to-Code Crew).
- Generating Storybook token stories or visual token documentation beyond
  TOKEN-DICTIONARY.md — that is the Documentation Crew (Phase 4a).
- Semantic token naming suggestions or automated token auditing against a design
  system brand guideline — that is the AI Semantic Layer Crew (Phase 5b).
- CSS-in-JS output formats (Styled Components theme, Emotion theme, Stitches config)
  — not in scope for this pipeline version.
- Figma token sync or design tool export — out of scope for DAF Local.
- Detecting drift between tokens and existing component source — that is the
  Analytics Crew (Phase 5a).
