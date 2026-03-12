# Quickstart: brand-interview-cli

**Feature**: 001 Brand Interview CLI  
**Package**: `packages/brand-interview-cli`

---

## Prerequisites

- Node.js ≥ 20 (ESM + `--import` flag support)
- npm ≥ 10

---

## 1. Repo Setup (first time only)

```bash
# From the repo root
npm install
```

This installs all workspaces, including `packages/brand-interview-cli`.

---

## 2. Run the Interview (development)

```bash
cd packages/brand-interview-cli

# Interactive interview — writes brand-profile.json to ./output/
npx tsx src/cli.ts --output ./output

# Bypass interview — copy an existing profile to ./output/
npx tsx src/cli.ts --from-file ./my-profile.json --output ./output
```

On success, the CLI prints the absolute path of the written file:

```
/path/to/your-project/output/brand-profile.json
```

---

## 3. Run Tests

```bash
cd packages/brand-interview-cli

# Run all tests (unit + integration)
npm test

# Watch mode during development
npm run test:watch

# Type-check only (no emit)
npm run typecheck
```

---

## 4. Lint

```bash
cd packages/brand-interview-cli
npm run lint
```

---

## 5. Task Completion Gate

Before a task branch is merged to `main`, all five conditions must pass:

```bash
npm test         # green tests
npm run lint     # lint clean
npm run typecheck  # zero TypeScript errors
# + no runtime errors (manual run)
# + manual walk-through documented
```

---

## 6. Package Structure

```
packages/brand-interview-cli/
├── src/
│   ├── cli.ts          # Commander setup; entry point (shebang: #!/usr/bin/env tsx)
│   ├── interview.ts    # Question flow, answer accumulator
│   ├── schema.ts       # Zod BrandProfileSchema; TypeScript types
│   ├── writer.ts       # fs.writeFile wrapper; directory creation
│   └── signals.ts      # SIGTERM handler registration
├── tests/
│   ├── unit/
│   │   ├── interview.test.ts   # Question flow logic
│   │   ├── schema.test.ts      # Zod schema validation
│   │   └── writer.test.ts      # File write logic
│   └── integration/
│       └── cli.test.ts         # End-to-end CLI invocation via child_process
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## 7. Output File

After a successful run:

```
<output-dir>/
└── brand-profile.json
```

Example `brand-profile.json`:

```json
{
  "archetype": "Consumer B2C",
  "brandName": "Luminary",
  "colors": {
    "primary": "#5B3AFF",
    "secondary": "#FF6B6B"
  },
  "typography": {
    "fontFamily": "Inter",
    "scaleRatio": "1.25"
  },
  "scope": "Standard",
  "accessibility": {
    "level": "AA"
  },
  "themes": ["light", "dark"]
}
```

---

## 8. Downstream Consumer

The `brand-profile.json` written here is the sole required input for
**Agent 1 (Brand Discovery Agent)**. That agent owns all semantic validation,
enrichment, and default resolution. The CLI writes what the user told it — nothing more.
