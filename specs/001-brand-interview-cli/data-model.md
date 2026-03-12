# Data Model: 001 Brand Interview CLI

**Feature**: Pre-Pipeline Brand Interview CLI  
**Branch**: `001-brand-interview-cli`

---

## Entity: BrandProfile (Raw)

The sole output entity of this CLI. It is the *raw* profile — all values are
written exactly as the user entered them. No validation, no enrichment, no defaults
are applied. Agent 1 (Brand Discovery Agent) is the exclusive downstream consumer
and owns all semantic validation.

### Zod Schema (source of truth)

```typescript
import { z } from 'zod'

// --- Enumerations ---

export const ArchetypeSchema = z.enum([
  'Enterprise B2B',
  'Consumer B2C',
  'Mobile-First',
  'Multi-Brand Platform',
  'Custom',
])

export const ScopeSchema = z.enum([
  'Starter',
  'Standard',
  'Comprehensive',
])

export const AccessibilityLevelSchema = z.enum(['AA', 'AAA'])

// --- Sub-objects ---

export const ColorsSchema = z.object({
  primary: z.string(),    // e.g. "#1A2B3C" — no format enforcement at CLI level
  secondary: z.string(),
})

export const TypographySchema = z.object({
  fontFamily: z.string(),  // e.g. "Inter"
  scaleRatio: z.string(),  // e.g. "1.25" or "Major Third" — free-text, per FR-008
})

export const AccessibilitySchema = z.object({
  level: AccessibilityLevelSchema,
})

// --- Root ---

export const BrandProfileSchema = z.object({
  archetype: ArchetypeSchema,
  brandName: z.string(),
  colors: ColorsSchema,
  typography: TypographySchema,
  scope: ScopeSchema,
  accessibility: AccessibilitySchema,
  themes: z.array(z.string()),          // e.g. ["light", "dark", "high-contrast"]
  brands: z.array(z.string()).optional(), // Multi-Brand Platform only (FR-002)
  componentOverrides: z.record(z.unknown()).optional(), // Advanced, any archetype
})

export type BrandProfile = z.infer<typeof BrandProfileSchema>
export type Archetype    = z.infer<typeof ArchetypeSchema>
export type Scope        = z.infer<typeof ScopeSchema>
```

---

## Field Reference

| Field | Type | Required | Constraint | Source Requirement |
|---|---|---|---|---|
| `archetype` | enum (5) | Yes | First question | FR-001 |
| `brandName` | string | Yes | Non-empty | FR-003, FR-013 |
| `colors.primary` | string | Yes | Non-empty | FR-003 |
| `colors.secondary` | string | Yes | Non-empty | FR-003 |
| `typography.fontFamily` | string | Yes | Non-empty | FR-003 |
| `typography.scaleRatio` | string | Yes | Free-text, non-empty | FR-003 |
| `scope` | enum (3) | Yes | Selected from list | FR-003 |
| `accessibility.level` | enum (2) | Yes | Selected from list | FR-003 |
| `themes` | string[] | Yes | At least 1 item | FR-003 |
| `brands` | string[] | No | Multi-Brand only; ≥1 if asked | FR-002 |
| `componentOverrides` | Record\<string, unknown\> | No | Advanced field, any archetype | FR-003 |

---

## Archetype-to-Question Mapping

| Archetype | Extra questions | Skipped questions |
|---|---|---|
| Enterprise B2B | — | Dense layout questions skip |
| Consumer B2C | — | — |
| Mobile-First | — | Dense layout questions skip |
| Multi-Brand Platform | `brands` (array of brand names, ≥1) | — |
| Custom | All questions from all archetypes | Nothing skipped |

---

## State Transitions

The BrandProfile entity has exactly two states:

```
[In-memory / partial]
  │  User answers accumulate in a typed Partial<BrandProfile>
  │  Never persisted in this state
  │
  ▼ (All answers collected without interruption)
[On-disk / complete]
  │  Written atomically via fs.writeFile() to brand-profile.json
  │  Process exits 0
```

**There is no partial-write state.** The write is a single operation that only
occurs after the full interview completes (SC-005, FR-011). SIGINT or SIGTERM before
the write leaves the output folder untouched.

---

## Usage Contexts

### 1. Interactive interview → write

```
user input (stdin)
  → @inquirer/prompts prompt chain
  → Partial<BrandProfile> accumulator
  → BrandProfileSchema.parse() [structural assertion only]
  → fs.writeFile(outputPath/brand-profile.json, JSON.stringify(profile, null, 2))
```

### 2. --from-file bypass → copy

```
fs.readFile(fromFilePath)
  → JSON.parse()
  → BrandProfileSchema.safeParse() [validates structure, not semantics]
  → fs.writeFile(outputPath/brand-profile.json, original raw content bytes)
```

Note: In the `--from-file` path, the file is written as-is (byte-identical per SC-002).
The Zod parse is structural validation only — to produce a useful error message if the
file is malformed before passing it downstream.
