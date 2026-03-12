# Implementation Plan: Pre-Pipeline Brand Interview CLI

**Branch**: `001-brand-interview-cli` | **Date**: 2026-03-12 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/001-brand-interview-cli/spec.md`

## Summary

A standalone Node.js TypeScript CLI (`@daf/brand-interview-cli`) that conducts a
structured brand interview via `@inquirer/prompts` and writes a raw
`brand-profile.json` to disk. No network calls, no LLM, no CrewAI dependency. This
CLI is the human entry point into the entire DAF pipeline — it produces the sole
required input for Agent 1 (Brand Discovery Agent).

**Technical approach**: `commander` parses flags; `@inquirer/prompts` drives the
interactive Q&A; answers accumulate in a `Partial<BrandProfile>` typed by a `zod`
schema; on completion the profile is written with `fs.writeFile`. SIGINT is handled
by catching `ExitPromptError` from `@inquirer/core`; SIGTERM via a top-level
`process.on('SIGTERM')` listener. A `--from-file` flag bypasses the interview entirely.
Tests run with `vitest`; TDD is enforced per Constitution XI.

## Technical Context

**Language/Version**: Node.js 20+ / TypeScript 5 (strict mode, ESM)  
**Primary Dependencies**: `@inquirer/prompts` v3 (interactive prompts), `commander` v12 (CLI flags), `zod` v3 (schema + types), `tsx` v4 (dev runner)  
**Storage**: Filesystem only — single `brand-profile.json` written to `--output` directory  
**Testing**: `vitest` v2 (unit + integration); `@vitest/coverage-v8` for coverage  
**Target Platform**: macOS / Linux CLI (local developer workstation)  
**Project Type**: CLI  
**Performance Goals**: Interactive responsiveness (<100ms between prompt and next question); process startup <1s  
**Constraints**: No network calls (FR-006); no LLM invocations (FR-007); no CrewAI dependency; standalone — no DAF pipeline packages required to run  
**Scale/Scope**: Small — 5 user stories, single output file, ~6 source modules, ~4 test files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

> **Note**: Principles I–X are evaluated against the DAF pipeline. This CLI is
> explicitly a **pre-pipeline, standalone tool** — it sits outside CrewAI and has no
> crew-level responsibilities. Principles marked `N/A` are not violations; they are
> genuinely out of scope for a human-facing CLI precursor.

- [x] **I. Agent-First, Tool-Assisted** — **N/A (pre-pipeline tool)**. This CLI is
  the human entry point that _produces_ the input for the agentic pipeline. It
  deliberately contains no agents. FR-007 prohibits LLM calls. The pipeline itself
  is agent-orchestrated; this tool is the human gate before the pipeline starts.

- [x] **II. Token-First** — **N/A**. This CLI produces JSON, not visual output.
  No design tokens involved.

- [x] **III. Sequential Crew Handoff** — **N/A (not a crew)**. However, the CLI
  DOES write to the shared filesystem (`brand-profile.json`) and the downstream crew
  reads from there — filesystem-as-state is respected.

- [x] **IV. Bounded Retry** — **N/A**. No generator–validator retry loop. Single
  interactive operation.

- [x] **V. Human Gates** — ✅ **This CLI IS the Brand Profile Gate**. The user
  completing the interview and approving the output satisfies the first mandatory
  human gate defined in the constitution.

- [x] **VI. Dual Quality Gate** — **N/A**. No component generation in this feature.

- [x] **VII. Anthropic-Only Model Tiers** — ✅ FR-007 explicitly prohibits any LLM
  invocation. Compliant by design.

- [x] **VIII. Plugin Architecture** — **N/A**. Standalone CLI; not part of the core
  pipeline plugin system.

- [x] **IX. Phase Ordering** — ✅ This CLI runs as a prerequisite before Phase 1.
  No phase can begin until a valid `brand-profile.json` exists on disk.

- [x] **X. No Crew Crosses Boundaries** — ✅ Single, bounded output:
  `brand-profile.json`. The CLI writes nothing else.

- [x] **XI. Test-Driven Development** — ✅ All functions in `interview.ts`,
  `schema.ts`, `writer.ts`, and `signals.ts` will have tests written before
  implementation. TDD enforced per Constitution XI.

- [x] **XII. One Task, One Branch** — ✅ Each task in `tasks.md` will be
  implemented on its own branch: `task/001-brand-interview-cli/[id]-[desc]`.
  Merged to `main` on task completion.

- [x] **XIII. Manual Testing by the Agent** — ✅ Each task includes a manual
  walk-through: running the CLI with realistic inputs, verifying terminal output
  and the written file, documenting the observed result.

- [x] **XIV. Task Completion Gate** — ✅ All 5 conditions required before merge:
  green tests, lint clean, zero TypeScript errors, no runtime errors, manual
  testing passed.

**Constitution Check result**: PASS — no violations. No ADR required.

## Project Structure

### Documentation (this feature)

```text
specs/001-brand-interview-cli/
├── plan.md              # This file
├── research.md          # Dependency and pattern decisions
├── data-model.md        # BrandProfile entity + Zod schema
├── quickstart.md        # Setup, run, test guide
├── contracts/
│   ├── cli-interface.md          # CLI flags, stdio, exit codes
│   └── brand-profile.schema.json # JSON Schema for brand-profile.json
└── tasks.md             # Generated by speckit.tasks (not created here)
```

### Source Code (repository root)

```text
packages/
└── brand-interview-cli/
    ├── src/
    │   ├── cli.ts          # Commander setup; bin entry point (#!/usr/bin/env tsx)
    │   ├── interview.ts    # Question flow; Partial<BrandProfile> accumulator
    │   ├── schema.ts       # Zod BrandProfileSchema; exported TypeScript types
    │   ├── writer.ts       # fs.writeFile + mkdirp; atomic write guarantees
    │   └── signals.ts      # SIGTERM handler registration
    ├── tests/
    │   ├── unit/
    │   │   ├── interview.test.ts   # Question order, archetype branching, re-prompt
    │   │   ├── schema.test.ts      # Valid/invalid profiles; edge cases
    │   │   └── writer.test.ts      # Write success, dir creation, path-is-file error
    │   └── integration/
    │       └── cli.test.ts         # End-to-end via child_process.spawn
    ├── package.json
    ├── tsconfig.json
    └── vitest.config.ts

# Repo root (added once, shared across all packages)
package.json             # npm workspaces: ["packages/*"]
```

**Structure Decision**: Single `packages/brand-interview-cli/` workspace. No monorepo
tooling (Turborepo, Nx) introduced — plain npm workspaces is sufficient at this scope.
Future crew packages will be added as additional entries under `packages/`.

## Complexity Tracking

> No constitution violations. No complexity justification needed.

