# Brand Interview CLI

Pre-pipeline CLI for conducting structured brand interviews. Outputs `brand-profile.json` for downstream DAF agents.

## Quick Start

```bash
# Install dependencies from workspace root
npm install

# Run the CLI interactively
npm run dev -- --output ./output

# Run tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Features

- ✅ Interactive brand interview via CLI prompts
- ✅ Archetype-based question sequencing
- ✅ `--from-file` flag to bypass interview
- ✅ SIGINT/SIGTERM clean interruption handling
- ✅ Full TypeScript with strict mode
- ✅ Test-driven development (TDD)

## Development

- **Language**: TypeScript 5 (ES2020)
- **Runtime**: Node.js 20+
- **Testing**: Vitest
- **Strict Mode**: Enabled

## Output

Writes a single file: `brand-profile.json` containing:

```json
{
  "brandName": "...",
  "archetype": "Enterprise B2B",
  ...
}
```

See `../../../specs/001-brand-interview-cli/data-model.md` for full schema.
