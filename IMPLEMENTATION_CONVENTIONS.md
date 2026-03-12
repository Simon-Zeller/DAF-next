# Implementation Conventions — DAF 001-Brand-Interview-CLI

**MANDATORY**: Every implementing agent MUST follow ALL conventions below. Non-compliance blocks merge to `main`.

---

## 1. Branch Naming Convention

### Format:
```
task/001-brand-interview-cli/[TASK-ID]-[kebab-case-description]
```

### Examples:
```
✅ CORRECT:
  task/001-brand-interview-cli/T001-npm-workspaces
  task/001-brand-interview-cli/T003-schema-tests
  task/001-brand-interview-cli/T008-interview-impl

❌ INCORRECT:
  feature/T001    (missing feature ID)
  T001-setup      (missing prefix)
  task/001-setup  (missing task ID)
  task/001-brand-interview-cli/T001_npm_workspaces  (underscores instead of kebab)
```

### Enforcement:
- **ALWAYS** create feature branches from `main` (not from other branches)
- **NEVER** commit directly to `main` or `010-release-crew`
- **ALWAYS** verify branch name with: `git branch -a | grep task`

---

## 2. Task Completion Gate — 5 Mandatory Conditions

**BEFORE merging ANY branch to `main`, ALL 5 must pass:**

```bash
# Condition 1: Tests pass
npm test
# Expectation: Test Files X passed (X), Tests Y passed (Y) | no ✖ errors

# Condition 2: Lint clean
npm run lint
# Expectation: Zero errors, only warnings acceptable (no ✖ errors)

# Condition 3: TypeScript type check
npm run typecheck
# Expectation: Exit code 0, no "Found X errors"

# Condition 4: No runtime errors
# Manual verification required — run CLI/workflow as documented in task spec

# Condition 5: Manual walkthrough documented
# Developer provides evidence (screenshots, logs, or copy-paste output) in PR
```

**Blocking Condition**: If ANY one of the 5 fails, the branch CANNOT be merged.

### Verification Checklist (must include in PR):

```markdown
## Task Completion Gate ✓

- [ ] npm test — all tests passing
- [ ] npm run lint — zero lint errors
- [ ] npm run typecheck — tsc --noEmit exits 0
- [ ] Manual walkthrough — no runtime errors
- [ ] Evidence documented below

### Evidence (copy-paste output or screenshot):

\`\`\`
[paste terminal output or describe manual test result]
\`\`\`
```

---

## 3. TDD (Test-Driven Development) — Constitution XI

**Mandatory order for every implementation task:**

1. **RED**: Write failing test first → run → see it fail
2. **GREEN**: Write minimal implementation → run → test passes
3. **REFACTOR**: Improve without breaking test

### Example Timeline for T004 (Schema Implementation):

```bash
# ❌ DO NOT START HERE:
git checkout -b task/001-brand-interview-cli/T004-schema-impl

# ✅ ALWAYS START HERE:
# T003 tests already exist (passing)
npm test packages/brand-interview-cli/tests/unit/schema.test.ts
# Output: "All tests passing"

# NOW implement src/schema.ts to satisfy those tests
# Re-run after each implementation step
npm test packages/brand-interview-cli/tests/unit/schema.test.ts
```

### Files That MUST Have Tests Before Implementation:

From tasks.md Phase 2-6:
- `T003` → tests before `T004` ✅
- `T005` → tests before `T006` ✅
- `T007`, `T010` → tests before `T008`, `T009` ✅
- `T011` → tests before `T012` ✅
- `T013` → tests before `T014`, `T015` ✅

---

## 4. Commit Message Convention

### Format:
```
<type>(<scope>): <subject>

<body>

Closes: <task-id>
```

### Types:
- `feat` — New feature/functionality
- `fix` — Bug fix or configuration correction
- `test` — Test-only changes
- `refactor` — Code restructuring (no feature change)
- `docs` — Documentation updates
- `chore` — Dependencies, build config

### Scope:
```
001-brand-interview-cli
```

### Subject:
- Imperative mood ("add" not "added")
- Lowercase
- No period at end
- Max 50 characters

### Examples:

```bash
✅ CORRECT:
  feat(001-brand-interview-cli): T003 write schema unit tests
  
  - Test valid profiles validate correctly
  - Test enum fields reject invalid values
  - Test Multi-Brand conditional branching
  
  Closes: T003

✅ CORRECT:
  fix(001-brand-interview-cli): resolve ESLint tsconfig conflict
  
  Updated .eslintrc to exclude test files from project parsing.
  
  Closes: T002

❌ INCORRECT:
  T003 Schema Tests                  (no type/scope)
  test: write tests                  (no scope)
  feat(001): Added more validation   (unclear, wrong mood)
  feat(001-brand-interview-cli): T003 write schema unit tests. (period)
```

### Closes Reference:
Every commit must reference exactly ONE task:
```
Closes: T001
Closes: T003
```

Not: `Closes: T001-T002` (one per commit) or `Closes: Phase 1` (must be specific task)

---

## 5. Parallel Task Execution

**Tasks with `[P]` marker CAN run in parallel. Sequential tasks MUST run in order.**

### Phase 2 Example:

```
✅ PARALLEL (different files, no cross-dependency):
   T003 [P]: Write failing schema tests
   T005 [P]: Write failing writer tests
   
   After both are RED (failing):
   
   T004 (sequential): Implement schema.ts  
   T006 [P]: Implement writer.ts  ← once T005 is confirmed failing

❌ INCORRECT:
   T004 before T003 (implementation before test)
   T008 before T003 (user story impl before foundational tests)
```

**Reference**: tasks.md "Parallel Opportunities" section lists which can overlap.

---

## 6. Branch Merge Workflow

### Step-by-Step:

1. **Create feature branch from main:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b task/001-brand-interview-cli/T001-description
   ```

2. **Implement task (TDD):**
   - Write tests first
   - Implement to pass
   - Commit with proper message

3. **Verify Task Completion Gate:**
   ```bash
   npm test
   npm run lint
   npm run typecheck
   # Manual walkthrough
   ```

4. **Push to GitHub:**
   ```bash
   git push origin task/001-brand-interview-cli/T001-description
   ```

5. **Create PR with gate checklist:**
   - Use IMPLEMENTATION_CONVENTIONS.md section 2 checklist
   - Paste evidence of all 5 conditions passing
   - Reference task ID

6. **Mark task complete in tasks.md:**
   - Update line: `- [ ] T001 ...` → `- [x] T001 ...`
   - Commit this change to the feature branch

7. **Merge to main (after code review):**
   ```bash
   git checkout main
   git pull origin main
   git merge task/001-brand-interview-cli/T001-description --no-ff
   git push origin main
   ```

8. **Delete feature branch:**
   ```bash
   git branch -d task/001-brand-interview-cli/T001-description
   git push origin --delete task/001-brand-interview-cli/T001-description
   ```

---

## 7. What NOT To Do ❌

| Violation | Impact | Fix |
|-----------|--------|-----|
| Skip Task Completion Gate | Branch cannot merge | Run all 5 checks before PR |
| Commit directly to main | Breaks protocol | Always use feature branch |
| Write code before tests | Tests may not exercise code | Reorder: write test first |
| Merge parallel tasks sequentially | Wastes time | Check `[P]` markers in tasks.md |
| Vague commit messages | History unreadable | Use: `feat(scope): subject - Closes: TX` |
| Update tasks.md in wrong branch | Merge conflicts | Update in feature branch, push with PR |
| Skip manual walkthrough | Runtime errors hidden | Document observed behavior in PR |
| Run multiple unrelated tasks | Scope creep | Stick to ONE task per branch |

---

## 8. Enforcing Compliance

### For Next Implementing Agent:

**Option 1: Pre-Commit Git Hook** (automatic validation)
```bash
# File: .git/hooks/pre-commit
# Validates: branch name, commit message format, tests still pass
```

**Option 2: PR Templates** (GitHub)
```
.github/pull_request_template.md - enforces checklist in all PRs
```

**Option 3: Agent Instructions** (AI-specific)
```
.instructions.md — explicit rules for Copilot agents
```

**Option 4: Memory Persistence** (inter-session consistency)
```
/memories/repo/001-conventions.md — stored facts about this feature
```

All 4 are recommended for maximum enforcement.

---

## 9. Questions to Ask Before Starting Any Task

- [ ] Have I checked out `main` and pulled latest?
- [ ] Is my branch named `task/001-brand-interview-cli/[ID]-[description]`?
- [ ] Does the task have a `[P]` marker? Can I run it in parallel?
- [ ] Are all prerequisite tests already passing?
- [ ] Will I write tests BEFORE implementation (TDD)?
- [ ] Can I verify all 5 Task Completion Gate conditions?
- [ ] Will my commit message reference the task ID in "Closes:" line?
- [ ] Have I updated tasks.md to mark the task complete?

If ANY answer is "No" or uncertain, **STOP** and clarify before proceeding.

---

## 10. Red Flags — Stop and Escalate

🚫 **STOP work immediately if:**

1. Task Completion Gate has any red (✖)
2. Branch name doesn't match convention
3. Tests are skipped or commented out
4. Feature is implemented before tests exist
5. Commit message doesn't have task ID
6. More than one task per branch
7. Code is pushed directly to main
8. Manual walkthrough section of PR is blank

**Action**: Revert, fix, re-verify before proceeding.

---

## References

- **Tasks**: [specs/001-brand-interview-cli/tasks.md](docs/specs/001-brand-interview-cli/tasks.md)
- **Plan**: [specs/001-brand-interview-cli/plan.md](docs/specs/001-brand-interview-cli/plan.md)
- **Data Model**: [specs/001-brand-interview-cli/data-model.md](docs/specs/001-brand-interview-cli/data-model.md)
- **Contracts**: [specs/001-brand-interview-cli/contracts/](docs/specs/001-brand-interview-cli/contracts/)

---

**Last Updated**: 2026-03-12  
**Enforced By**: [Constitution XI (TDD), XII (Branch), XIV (Gate), XIII (Walkthrough)]
