# Feature Specification: Pre-Pipeline Brand Interview CLI

**Feature Branch**: `001-brand-interview-cli`  
**Created**: 2026-03-12  
**Status**: Draft  
**Input**: User description: "Feature: Pre-pipeline brand interview CLI. A standalone Node.js CLI tool (outside CrewAI) that conducts a structured conversation with the user and writes a raw brand-profile.json to disk."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Complete Brand Interview (Priority: P1)

A developer starting a new design system runs the CLI without any flags. The tool
asks a sequence of questions and writes a complete `brand-profile.json` to the
specified output folder when the interview is finished.

**Why this priority**: This is the primary entry point to the entire DAF pipeline.
Without a valid `brand-profile.json` on disk, no crew can run. Every other user story
is secondary to this one working end-to-end.

**Independent Test**: Run the CLI with `--output ./test-output`, answer all questions
using a fixed set of responses, verify that `./test-output/brand-profile.json` exists
and contains exactly the answered values with no injected enrichment or modification.

**Acceptance Scenarios**:

1. **Given** the CLI is invoked with a valid `--output` path, **When** the user
   completes all questions, **Then** `brand-profile.json` is written to the output
   folder and the CLI exits with code `0`, printing the output file path to stdout.
2. **Given** the CLI is midway through questions, **When** the user selects an
   archetype, **Then** the remaining questions are scoped to that archetype's required
   fields (e.g., Multi-Brand asks for brand names; Mobile-First does not ask about
   dense layouts).
3. **Given** the user provides an empty response to a required question (enters blank),
   **When** the CLI processes it, **Then** the same question is presented again with a
   prompt indicating the field is required.
4. **Given** all questions are answered, **When** the CLI writes the file, **Then**
   the JSON is syntactically valid and contains at minimum: `archetype`, `brandName`,
   `colors.primary`, `colors.secondary`, `typography`, `scope`, `accessibility.level`,
   and `themes`.

---

### User Story 2 — Bypass Interview with Existing File (Priority: P2)

A developer who has already authored a `brand-profile.json` by hand (or from a
previous run) can skip the interactive interview entirely by providing the file path
via `--from-file`. The CLI writes the file to the output folder as-is.

**Why this priority**: Power users and CI environments need a programmatic entry point.
This is the bypass escape hatch documented in the PRD: "the interview can also be
bypassed entirely by providing a hand-written `brand-profile.json`."

**Independent Test**: Run the CLI with `--from-file ./my-profile.json --output ./out`,
verify that `./out/brand-profile.json` is byte-for-byte identical to `./my-profile.json`
and that no interactive prompts were shown.

**Acceptance Scenarios**:

1. **Given** the CLI is invoked with a valid `--from-file` path pointing to a
   syntactically valid JSON file, **When** it runs, **Then** no prompts are shown, the
   file is written to the output folder, and the CLI exits with code `0`.
2. **Given** `--from-file` points to a file that is not valid JSON, **When** the CLI
   tries to parse it, **Then** a clear error message is written to stderr and the CLI
   exits with a non-zero code. No output file is written.
3. **Given** both `--from-file` and no `--output` are provided, **When** the CLI
   runs, **Then** it writes to the current working directory as the default output
   location.

---

### User Story 3 — Clean Interruption Handling (Priority: P3)

A developer who starts the interview but changes their mind can press Ctrl+C at any
point during the Q&A. The CLI exits cleanly without writing a partial or corrupt
`brand-profile.json`.

**Why this priority**: Partial JSON files written to the output folder would be picked
up by Agent 1 as if they were complete profiles, causing pipeline failures that are
hard to diagnose.

**Independent Test**: Start the CLI, answer the first two questions, send SIGINT
(Ctrl+C), verify that no file exists in the output folder.

**Acceptance Scenarios**:

1. **Given** the CLI is mid-interview, **When** the user presses Ctrl+C, **Then** the
   process exits cleanly, nothing is written to the output folder, and the exit code
   is non-zero.
2. **Given** the CLI receives SIGTERM, **When** it handles the signal, **Then** the
   same clean-exit behavior applies as with SIGINT.

---

### Edge Cases

- User enters an invalid hex format (e.g., `#GGG`) for a color — CLI accepts the
  value as-is and moves on. Semantic validation is Agent 1's responsibility.
- `--output` folder does not exist — CLI creates it (including nested directories).
- `--output` path exists but is a file, not a folder — CLI writes an error to stderr
  and exits non-zero.
- `--from-file` and interactive mode flags used at the same time as `--no-output` or
  conflicting flags — CLI detects the conflict, writes a usage error to stderr, exits
  non-zero.
- User selects the "Custom" archetype — all questions across all archetypes are asked
  with no field skipping.
- Multi-Brand archetype: user is asked to name each brand. Providing zero brand names
  causes re-prompt.
- `--output` folder is the current working directory (`.`) — write proceeds normally.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The CLI MUST present archetype selection as the first question, with
  exactly five options: Enterprise B2B, Consumer B2C, Mobile-First, Multi-Brand
  Platform, Custom.
- **FR-002**: After archetype selection, the CLI MUST ask archetype-scoped follow-up
  questions. Multi-Brand Platform MUST additionally ask for brand names (array of
  strings). All other fields are asked regardless of archetype.
- **FR-003**: The CLI MUST collect the following fields in every interview run:
  `brandName` (string), `colors.primary` (string), `colors.secondary` (string),
  `typography.fontFamily` (string), `typography.scaleRatio` (string, e.g. "1.25"),
  `scope` (Starter | Standard | Comprehensive), `accessibility.level` (AA | AAA),
  `themes` (array of strings, e.g. ["light", "dark", "high-contrast"]).
- **FR-004**: The CLI MUST write the collected values to `brand-profile.json` in the
  folder specified by `--output`. If `--output` is not provided, it MUST write to the
  current working directory.
- **FR-005**: The CLI MUST support `--from-file <path>` to bypass the interactive
  interview. When this flag is present, the CLI reads the specified JSON file and
  writes it to the output folder without modification and without prompting.
- **FR-006**: The CLI MUST NOT make any network calls during execution.
- **FR-007**: The CLI MUST NOT invoke any LLM during execution.
- **FR-008**: The CLI MUST NOT perform semantic validation of the collected values
  (no contradiction detection, no enrichment, no default filling). The raw values
  provided by the user are written exactly as entered.
- **FR-009**: On success, the CLI MUST print only the absolute path to the written
  `brand-profile.json` to stdout.
- **FR-010**: On any error, the CLI MUST write a human-readable error message to
  stderr and exit with a non-zero exit code. Stdout MUST remain empty on error.
- **FR-011**: The CLI MUST handle SIGINT and SIGTERM by exiting cleanly without
  writing any partial output file.
- **FR-012**: If `--from-file` is provided with a file that is not syntactically valid
  JSON, the CLI MUST reject it with an error message on stderr and exit non-zero.
- **FR-013**: Required fields that receive an empty response MUST be re-prompted until
  a non-empty value is provided.

### Key Entities

- **Brand Profile (raw)**: The JSON document this CLI produces. Contains all
  user-provided answers exactly as entered, grouped into: `archetype`, `brandName`,
  `colors`, `typography`, `scope`, `accessibility`, `themes`, and optionally
  `brands` (Multi-Brand only) and `componentOverrides` (advanced, any archetype).
  This is the *raw* profile — Agent 1 (Brand Discovery Agent) is responsible for
  validating, enriching, and resolving defaults from this file.

### CLI I/O Contract

This feature is the pre-pipeline entry point — it is not a CrewAI crew and has no
crew-level I/O contract. Its interface is:

| | Artifact |
|---|---|
| **Input (interactive)** | User responses via stdin |
| **Input (bypass)** | JSON file path supplied via `--from-file` |
| **Output** | `brand-profile.json` written to `--output` folder |
| **stdout** | Absolute path to the written file (success only) |
| **stderr** | Error messages (failures only) |
| **Exit code** | `0` on success, non-zero on any error |

Downstream consumer: **Agent 1 (Brand Discovery Agent)** reads the written
`brand-profile.json` as its sole required input. Agent 1 owns all validation,
enrichment, and contradiction detection — the CLI does none of this.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer with no prior knowledge of the tool can complete the full
  interview and have a ready-to-use `brand-profile.json` written in under 3 minutes.
- **SC-002**: The `--from-file` bypass produces a `brand-profile.json` that is
  byte-for-byte identical to the source file — zero transformation, zero data loss.
- **SC-003**: The CLI exits with code `0` on every successful write and a non-zero
  code on every error condition, enabling reliable use in shell scripts and CI pipelines.
- **SC-004**: All five archetypes produce structurally distinct raw profiles: the
  Multi-Brand archetype produces a profile with a `brands` array; all others do not.
- **SC-005**: Interrupting the CLI at any point during the interview (SIGINT/SIGTERM)
  leaves the output folder in exactly the state it was before the CLI was invoked —
  no partial files, no empty files.

## Assumptions

- The downstream Agent 1 (Brand Discovery Agent) is the authority on what constitutes
  a valid or complete `brand-profile.json`. The CLI makes no structural assumptions
  beyond collecting the documented fields.
- `typography.scaleRatio` is collected as a free-text string (e.g., "1.25", "Major
  Third"). Format enforcement is Agent 1's concern.
- The `themes` field is collected as a multi-select from a fixed list: `light`,
  `dark`, `high-contrast`. Users may also type a custom theme name.
- `componentOverrides` is an advanced/optional field. In the MVP the CLI does not ask
  for it; it is omitted from the raw profile if not provided.
- The CLI is invoked as `daf interview` or `node cli.js interview` — exact invocation
  style is determined during planning, not in this spec.

## Out of Scope

- Validation of color values (hex, named, oklch, etc.) — Agent 1's responsibility.
- Contradiction detection (e.g., "compact density" + "spacious spacing") — Agent 1.
- Default-filling for missing optional fields — Agent 1.
- Saving a partial interview for later resumption — the CLI is stateless per run.
- Any UI beyond text prompts in the terminal (no TUI libraries, no web UI).
- Authentication, multi-user support, or session management.
- Reading or writing any file other than `brand-profile.json`.
