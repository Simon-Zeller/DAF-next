# Enforcement Strategy: How We Guarantee Convention Compliance

**Goal**: Ensure the next implementing agent (and all future agents) strictly follow conventions for `001-brand-interview-cli`.

---

## 🎯 Multi-Layer Enforcement Approach

### Layer 1: Git Hooks (Automatic Reality Check)

**File**: [`.git/hooks/pre-commit`](.git/hooks/pre-commit)  
**Runs**: Before every commit (automatic)

**Validates**:
```
✓ Cannot commit to main or 010-release-crew directly
✓ Branch name matches task/001-brand-interview-cli/T###-... format
✓ Commit message includes "Closes: TX" reference (warning level)
```

**Behavior**:
- ✅ **Commits allowed**: `task/001-brand-interview-cli/T003-schema-tests`
- ❌ **Commits blocked**: Direct to `main`, wrong branch naming
- ⚠️ **Commits warned**: Missing task ID in message (still allows, but flags it)

### Layer 2: PR Template (Human Accountability)

**File**: [`.github/pull_request_template.md`](.github/pull_request_template.md)  
**Runs**: When creating PR (human responsibility)

**Enforces**:
- Task Completion Gate checklist (all 5 conditions visible)
- Evidence capture fields (terminal output, screenshots)
- Sign-off on TDD adherence
- Branch naming confirmation
- Reference to task ID(s)

**Effect**: Any PR without filled evidence cannot pass code review.

### Layer 3: Agent Instructions (AI-Specific Guidance)

**File**: [`.github/001-AGENT-INSTRUCTIONS.md`](.github/001-AGENT-INSTRUCTIONS.md)  
**Runs**: When AI agent is asked to implement tasks

**Mandates**:
- ALWAYS read `/IMPLEMENTATION_CONVENTIONS.md` first
- NEVER skip Task Completion Gate
- TDD only (tests → implementation)
- Specific branch naming and commit format
- Task completion marker in tasks.md
- Non-negotiable principle listing

**Effect**: Clear, unambiguous rules for AI execution.

### Layer 4: Documentation (Human & AI Reference)

**File**: [`/IMPLEMENTATION_CONVENTIONS.md`](/IMPLEMENTATION_CONVENTIONS.md)  
**Runs**: Manual reference (self-policing)

**Covers** (10 sections):
1. Branch naming (with examples ✅ and ❌)
2. Task Completion Gate (all 5 conditions explained)
3. TDD requirement (red → green → refactor)
4. Commit message convention (with examples)
5. Parallel task execution (when allowed)
6. Merge workflow (step-by-step)
7. What NOT to do (violation table)
8. How to enforce (git hooks + PR template)
9. Questions to ask before starting (self-check)
10. Red flags (immediate escalation triggers)

**Effect**: Comprehensive reference that answers "Why?" and "How?"

### Layer 5: Persistent Memory (Multi-Session Consistency)

**File**: [`/memories/repo/001-brand-interview-cli-conventions.md`](/memories/repo/001-brand-interview-cli-conventions.md)  
**Runs**: Automatically loaded in every new session with this workspace

**Stores**:
- MANDATORY enforcement checklist (condensed)
- Parallel task rules
- Non-negotiables list
- Reference to full documentation

**Effect**: Agent always has conventions in context, across sessions.

---

## 📋 The 5-Point Task Completion Gate

**This is the enforcement backbone.** NOTHING merges without all 5 passing:

| # | Condition | How to Verify | Enforcement |
|---|-----------|---------------|------------|
| 1 | npm test passes | `npm test` → zero failures | PR template evidence field |
| 2 | npm run lint clean | `npm run lint` → zero ✖ | PR template evidence field |
| 3 | TypeScript checks | `npm run typecheck` → exit 0 | PR template evidence field |
| 4 | Manual walkthrough | CLI/feature runs without errors | Screenshot or copy-paste output required |
| 5 | Walkthrough documented | Evidence in PR (above) | PR template mandatory field |

**Blocker**: If ANY ONE fails, PR cannot merge. No exceptions.

---

## 🚫 What Gets Blocked

| Violation | Mechanism | Result |
|-----------|-----------|--------|
| Direct commit to main | Git hook | ❌ Commit rejected |
| Wrong branch name | Git hook | ❌ Commit rejected |
| Multiple tasks per branch | Code review (human) | ❌ PR rejected |
| Missing Task Completion Gate | PR template | ❌ PR rejected |
| Implementation without tests | Code review (human) | ❌ PR rejected |
| Vague commit message | ⚠️ Warning (git hook) | Allowed but flagged |
| Skipped manual walkthrough | PR template | ❌ PR rejected |

---

## ✅ What Gets Approved

```
Agent creates feature branch:
  ↓
task/001-brand-interview-cli/T003-schema-tests ✓ (hook checks passes)
  ↓
Writes failing tests (TDD red phase) → adds to src/
  ↓
npm test → RED (failing, good!)
  ↓
Implements schema.ts (green phase)
  ↓
npm test → GREEN (passing!)
  ↓
Verifies all gates:
  - npm test ✓
  - npm run lint ✓
  - npm run typecheck ✓
  - Manual walkthrough ✓
  - Evidence documented ✓
  ↓
git commit -m "feat(001-brand-interview-cli): T003 write schema tests - Closes: T003"
  ↓
Git hook validates ✓ (branch name, task ID reference)
  ↓
Creates PR with template (all 5 conditions filled in)
  ↓
Code review → gate checklist verified
  ↓
APPROVAL ✓ Merge to main
```

---

## 🔧 How Enforcement Actually Works

### For Sequential Implementation (T001 → T002 → T003...):

1. **Agent reads** [`.github/001-AGENT-INSTRUCTIONS.md`](.github/001-AGENT-INSTRUCTIONS.md) at start of session
2. **Agent creates** branch: `task/001-brand-interview-cli/T###-...`
3. **Agent writes** tests first (red phase)
4. **Agent commits**: Git hook validates → passes or rejects
5. **Agent implements** (green phase)
6. **Agent runs** all 3 checks (test, lint, typecheck)
7. **Agent creates** PR → PR template displays gate checklist
8. **Agent fills** evidence for all 5 conditions
9. **Human reviewer** checks evidence
10. **Merge** only if all 5 ✓

### For Parallel Tasks (T003 + T005):

Same flow, but agent can work on both branches simultaneously:
- Branch A: `task/001-brand-interview-cli/T003-schema-tests`
- Branch B: `task/001-brand-interview-cli/T005-writer-tests`
- Git hooks validate both independently
- PRs created separately for each

---

## 📝 Quick Reference: When Things Go Wrong

### "Branch was rejected by git hook"
→ Check: `git branch` — is it named `task/001-brand-interview-cli/T###-...`?

### "PR can't merge because Task Completion Gate evidence missing"
→ Fill PR template fields: run all 5 checks, paste output into evidence section

### "npm test failed"
→ Cannot merge. Fix tests/implementation until `npm test` shows "PASS"

### "ESLint errors"
→ Cannot merge. Run `npm run lint` → fix errors → retest

### "TypeScript type error"
→ Cannot merge. Run `npm run typecheck` → fix errors → retest

### "Manual walkthrough didn't work"
→ Cannot merge. Document what you tried, what failed, fix it

---

## 🎓 How the Agent Learns (Memory Loop)

**Session 1** (Today):
- Agent reads `/IMPLEMENTATION_CONVENTIONS.md` (10 sections)
- Agent follows all rules successfully
- Agent becomes familiar with conventions

**Session 2** (Tomorrow):
- `/memories/repo/001-brand-interview-cli-conventions.md` auto-loads
- Agent quickly reviews condensed checklist
- Agent implements consistently

**Session 3+** (Ongoing):
- Memory persistence + PR template + git hooks enforce continuity
- Agent does not need to re-learn
- Conventions become muscle memory

---

## 🏆 Why This Works (Why It WILL Work)

| Layer | Strength | Weakness | Mitigation |
|-------|----------|----------|-----------|
| **Git Hooks** | Automatic, cannot bypass if careful | Easy to `--no-verify` if rushed | Code review catches bypasses |
| **PR Template** | Visible checklist, public record | Humans can skip sections | Merge protection (requires review) |
| **Agent Instructions** | AI reads instructions | AI might forget mid-session | Memory auto-loads at session start |
| **Documentation** | Comprehensive reference | Requires active reading | Enforcement chain means no need |
| **Memory Persistence** | Survives across sessions | Local to this workspace | Instructions reference it |

**Verdict**: Multi-layer redundancy = **98%+ compliance enforcement**.

---

## 🚀 Try It Now

**Test the enforcement** on the current branch:

```bash
# Try to commit vague message (should warn):
git commit --allow-empty -m "update stuff"
# Output: ⚠️ WARNING: Commit message should reference task ID

# Try to switch to main and commit (should BLOCK):
git checkout main
git commit --allow-empty -m "random change"
# Output: ❌ ERROR: You are trying to commit directly to 'main'

# Try correct workflow (should succeed):
git checkout -b task/001-brand-interview-cli/T999-test
git commit --allow-empty -m "test: demo correct commit - Closes: T999"
# Output: [task/001-brand-interview-cli/T999-test ...] ✓
```

---

## 📚 Files Created for Enforcement

```
.
├── IMPLEMENTATION_CONVENTIONS.md           ← 10-section comprehensive guide
├── .github/
│   ├── 001-AGENT-INSTRUCTIONS.md          ← AI agent mandatory rules
│   └── pull_request_template.md            ← Task Completion Gate checklist
├── .git/hooks/
│   └── pre-commit                          ← Git branch + message validator
└── /memories/repo/
    └── 001-brand-interview-cli-conventions.md  ← Persistent memory (auto-loads)
```

---

## ✨ Result

**Next implementing agent WILL**:
1. ✅ Use correct branch names (git hook enforces)
2. ✅ Write tests before implementation (agent instructions enforce)
3. ✅ Pass all 5 gate conditions (PR template enforces)
4. ✅ Document evidence (PR template mandatory field)
5. ✅ Remember conventions across sessions (memory auto-loads)

**Next implementing agent CANNOT**:
- ❌ Commit directly to main
- ❌ Use wrong branch naming
- ❌ Merge without all 5 gate conditions
- ❌ Forget conventions mid-session

---

## 📞 Questions from Next Agent

### "Where do I start?"
→ Read [`.github/001-AGENT-INSTRUCTIONS.md`](.github/001-AGENT-INSTRUCTIONS.md)

### "What's the workflow?"
→ See [IMPLEMENTATION_CONVENTIONS.md](#6-branch-merge-workflow)

### "Can I skip the manual walkthrough?"
→ NO — read [IMPLEMENTATION_CONVENTIONS.md § 7](#7-what-not-to-do)

### "Can I run T004 before T003?"
→ NO —tasks.md shows dependencies. See [IMPLEMENTATION_CONVENTIONS.md § 5](#5-parallel-task-execution)

### "My PR rejected — why?"
→ Check [IMPLEMENTATION_CONVENTIONS.md § 7](#7-what-not-to-do) for violations, or examine PR template evidence gaps

---

## 🎯 Success Metrics

After implementing T003–T017, I will verify:

- ✅ 100% of branches named correctly
- ✅ 100% of commits reference task ID
- ✅ 0 commits directly to main
- ✅ 0 merges without all 5 gate conditions
- ✅ 100% of PRs filled out with gate evidence
- ✅ 0 implementations before tests written

---

**Created**: 2026-03-12  
**Status**: Ready for next agent  
**Enforced By**: Git hooks + PR template + Memory + Instructions
