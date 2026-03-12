## 001-Brand-Interview-CLI Implementation Agent Instructions

**Scope**: This file applies when you are implementing any task (T001–T017) for the `001-brand-interview-cli` feature.

### MANDATORY Principles

1. **ALWAYS read** [/IMPLEMENTATION_CONVENTIONS.md](../IMPLEMENTATION_CONVENTIONS.md) before starting any task
2. **NEVER** skip any of the 5 Task Completion Gate conditions
3. **ALWAYS** use the feature branch convention: `task/001-brand-interview-cli/[ID]-[kebab-case]`
4. **ALWAYS** follow TDD: tests first (red) → implementation (green) → refactor
5. **ALWAYS** mark tasks complete in [`tasks.md`](specs/001-brand-interview-cli/tasks.md) with `[x]`

### Before You Start

- [ ] Have I read `/IMPLEMENTATION_CONVENTIONS.md`?
- [ ] Am I on the correct feature branch (`task/001-brand-interview-cli/...`)?
- [ ] Do I understand which tasks can run in parallel (`[P]` markers)?
- [ ] Are all prerequisite tasks completed?
- [ ] Have I identified which tests need writing FIRST?

### TDD Workflow

For **every implementation task**:

1. **RED phase**: Write failing test file
   ```bash
   npm test [new-test-file]  # Should fail
   ```

2. **GREEN phase**: Implement source code
   ```bash
   npm test [new-test-file]  # Should pass
   ```

3. **REFACTOR phase**: Improve without breaking tests
   ```bash
   npm test [new-test-file]  # Still passes
   ```

4. **Verify all gates**:
   ```bash
   npm test
   npm run lint
   npm run typecheck
   ```

### Commit Rules

Every commit must:
- [ ] Be on the feature branch
- [ ] Have format: `<type>(001-brand-interview-cli): <subject> - Closes: TX`
- [ ] Include exactly ONE task ID in "Closes:" line
- [ ] Pass pre-commit hook (branch + message validation)

Example:
```
feat(001-brand-interview-cli): T003 write schema unit tests

- Test valid brand profiles validate
- Test enum fields reject invalid values
- Test Multi-Brand conditional

Closes: T003
```

### Task Completion Gate Checklist

**Before creating PR, verify ALL 5:**

```bash
# Gate 1: Tests
npm test
# Expected: "Test Files X passed (X) | Tests Y passed (Y)"

# Gate 2: Lint
npm run lint
# Expected: No ✖ errors shown

# Gate 3: TypeScript
npm run typecheck
# Expected: (clean exit, no errors)

# Gate 4: Manual walkthrough
# Run the CLI or feature as specified in tasks.md
# Take screenshot or copy terminal output

# Gate 5: Document results
# Paste evidence in PR using .github/pull_request_template.md
```

### Parallel Task Rules

**Check tasks.md for `[P]` markers:**

- `[P]` tasks = can run in parallel (different files)
- Non-marked tasks = sequential only

Example:
```
✅ CAN run in parallel:
   T003 [P] (schema tests)  +  T005 [P] (writer tests)

❌ CANNOT run in parallel:
   T004 (schema impl)  +  T005 (writer tests) — T005 is prerequisite
```

### What NOT To Do

- ❌ Commit before or without running tests
- ❌ Implement code before tests exist
- ❌ Skip any Task Completion Gate condition
- ❌ Use branch name without task ID
- ❌ Merge directly to main (always via PR)
- ❌ Combine multiple tasks in one branch
- ❌ Leave Manual Walkthrough section blank in PR

### If Gate Fails

1. **Identify which condition failed** (test? lint? typecheck? runtime? docs?)
2. **Fix the specific condition**
3. **Re-run ALL gates** to confirm
4. **Do NOT create PR** until all 5 pass

### Questions to Escalate

- "Can I skip the manual walkthrough?" → **NO** (Constitution XIII)
- "Can I merge with 4/5 gate conditions?" → **NO** (all 5 mandatory)
- "Can I put multiple tasks in one branch?" → **NO** (one per branch)
- "Can I implement without tests first?" → **NO** (violates Constitution XI)

### References

- **Conventions**: [/IMPLEMENTATION_CONVENTIONS.md](../IMPLEMENTATION_CONVENTIONS.md)
- **Tasks**: [specs/001-brand-interview-cli/tasks.md](../specs/001-brand-interview-cli/tasks.md)
- **Plan**: [specs/001-brand-interview-cli/plan.md](../specs/001-brand-interview-cli/plan.md)
- **Data Model**: [specs/001-brand-interview-cli/data-model.md](../specs/001-brand-interview-cli/data-model.md)
- **PR Template**: [.github/pull_request_template.md](.github/pull_request_template.md)
- **Memory**: [/memories/repo/001-brand-interview-cli-conventions.md](/memories/repo/001-brand-interview-cli-conventions.md)

---

**This instruction file is non-negotiable for 001-brand-interview-cli tasks.**
