# Todo

Work items queue. Generated from roadmap by `/update-roadmap`.

## In Progress

_No work in progress. Run `/work` to start the next item._

## Up Next

_No items queued. Run `/update-roadmap` to generate work items from spec._

---

## How to Use

1. **Add specs**: Create requirement documents in `spec/`
2. **Generate roadmap**: Run `/update-roadmap` to analyze specs and create work items
3. **Start working**: Run `/work` to begin the next item
4. **Track progress**: Items move from "Up Next" → "In Progress" → Archive

## Archive

Completed items are automatically moved to `.agents/archive/done.md` along with their artifacts:
- Research files → `.agents/archive/research/`
- Plan files → `.agents/archive/plans/`
- Work state → `.agents/archive/work/`

This keeps the active todo list lean and reduces context usage.

## Work Item Format

```markdown
- [ ] **work-item-slug** - Short description
  - Requirements: REQ-001, REQ-002
  - Dependencies: other-item-slug (if any)
  - Estimate: 1-5 tests
```
