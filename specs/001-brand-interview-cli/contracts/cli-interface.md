# CLI Interface Contract: brand-interview-cli

**Feature**: 001 Brand Interview CLI  
**Contract type**: CLI executable interface  
**Consumer**: Any developer running DAF locally; shell scripts; CI pipelines

---

## Invocation

```
daf-interview [options]
```

Or during development:

```
tsx packages/brand-interview-cli/src/cli.ts [options]
```

---

## Flags

| Flag | Type | Required | Default | Description |
|---|---|---|---|---|
| `--output <dir>` | string (path) | No | `.` (cwd) | Directory to write `brand-profile.json` into. Created if it does not exist. |
| `--from-file <path>` | string (path) | No | — | Skip the interview. Copy this JSON file to `--output/brand-profile.json` as-is. |

### Flag Rules

- `--output` and `--from-file` may be combined.
- `--from-file` and interactive mode flags (e.g., future `--no-color`) must not conflict.
- If `--output` points to a path that exists as a **file** (not a directory), the CLI
  writes an error to stderr and exits non-zero. No output is written.
- `--from-file` is mutually exclusive with interactive mode. Providing `--from-file`
  always suppresses all prompts.

---

## Standard I/O Contract

| Stream | Content | Condition |
|---|---|---|
| `stdout` | Absolute path to the written `brand-profile.json` | Success only |
| `stderr` | Human-readable error message | Any failure |
| `stdin` | Interactive prompt responses | Interactive mode only |

**Stdout on success example**:
```
/Users/me/my-project/output/brand-profile.json
```

**Stderr on failure examples**:
```
Error: --output path "/tmp/foo.txt" exists and is not a directory.

Error: --from-file "/path/to/file.json" is not valid JSON.
  Unexpected token 'x' at position 12

Error: --output directory could not be created: EACCES: permission denied, mkdir '/root/locked'
```

---

## Exit Codes

| Code | Meaning |
|---|---|
| `0` | Success: `brand-profile.json` written |
| `1` | General error (invalid flag, write failure, JSON parse failure) |
| `130` | Interrupted by SIGINT (Ctrl+C) |
| `143` | Terminated by SIGTERM |

---

## Interview Question Flow

When running in interactive mode (no `--from-file`), questions appear in this order:

1. **Archetype** — `select` type, 5 options (FR-001)
2. **Brand name** — `input`, required (FR-003)
3. **Primary color** — `input`, required (FR-003)
4. **Secondary color** — `input`, required (FR-003)
5. **Font family** — `input`, required (FR-003)
6. **Type scale ratio** — `input`, required, free-text (FR-003)
7. **Scope** — `select` type, 3 options (FR-003)
8. **Accessibility level** — `select` type, 2 options (FR-003)
9. **Themes** — `checkbox` type, min 1 selection (FR-003)
10. **Brand names** — `input` (repeating), Multi-Brand Platform only (FR-002)

Empty responses to required fields trigger re-prompt (FR-013).

---

## Invariants (hard constraints)

- The CLI MUST NOT make network calls (FR-006).
- The CLI MUST NOT invoke any LLM (FR-007).
- The CLI MUST NOT enrich, validate semantically, or add defaults to collected values (FR-008).
- The output file name is always `brand-profile.json` — not configurable.
- Stdout MUST be empty on any error condition (FR-010).
