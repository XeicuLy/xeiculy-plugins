---
name: implement-issue
description: >
  Use when implementing a GitHub Issue (issue番号 + 実装/対応/コード/修正, or #XX 対応して).
  Fetches Issue context from GitHub, then hands off to feature-dev 7-Phase Workflow with TDD
  enforcement in implementation. Not for PR review comments, debugging, or git ops.
---

# Implement Issue Skill

## Pre-Phase: Fetch Issue Information

Detect the current repository and fetch the issue:

```bash
REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner')
gh issue view <Issue番号> --repo "$REPO"
```

Understand the following:

- Title, acceptance criteria (checklist), implementation notes, dependent issues

If dependent issues are incomplete, report to the user and stop.
For parent issues, fetch child issues as well and determine implementation order.

### Parent Issue Resolution

After fetching the target issue, check whether it has a parent issue using the GitHub GraphQL API:

```bash
OWNER=$(gh repo view --json owner --jq '.owner.login')
NAME=$(gh repo view --json name --jq '.name')
gh api graphql -f query="
{
  repository(owner: \"$OWNER\", name: \"$NAME\") {
    issue(number: <Issue番号>) {
      parent {
        number
        title
        body
        repository {
          nameWithOwner
        }
      }
    }
  }
}"
```

If a parent issue exists:

1. Fetch the full parent issue content:
   ```bash
   gh issue view <親Issue番号> --repo "<parent.repository.nameWithOwner>"
   ```
2. Understand the parent's overall goal: what the parent issue is trying to achieve end-to-end.
3. Identify where the current issue fits within that goal — which phase, step, or concern it addresses.
4. Before handing off to `feature-dev`, present a context summary:
   - **Overall goal** (from parent): what the feature/initiative is trying to accomplish
   - **Current scope** (this issue): which part of that goal is being implemented now
   - **Remaining scope** (sibling issues, if any): what comes before or after

This framing ensures that implementation decisions (API shape, data structures, abstractions) are made with the full picture in mind rather than the issue in isolation.

---

## Phase 1 onwards: `feature-dev` 7-Phase Workflow

```text
Skill(skill="feature-dev:feature-dev")
```

Pass the Pre-Phase issue information as requirements and proceed from Phase 1 (Discovery).

---

## Implementation Phase TDD Cycle (overrides feature-dev Phase 5)

Complete each acceptance criterion one at a time using RED → GREEN → REFACTOR.

See `../../references/tdd-cycle.md` for the full rules.

---

## Post-Phase: Completion Check

Once all acceptance criteria are GREEN:

1. 全受入基準がGREENであることを確認するため、テストスイートを再実行する
2. 実装完了をユーザーに報告し、コミット・PR 作成を促す

### Handling Hidden Requirements

If work outside the current acceptance criteria surfaces during implementation:

- If it fits within the current Issue's scope, add it as an additional acceptance criterion and implement it.
- If it requires separate implementation, call `Skill(skill="task-planner:github-issue-creator")` to split it into a new child Issue under the same parent. Fill `learning_context` (`background` / `hints` / `references` / `pre_implementation_checklist`) with the same schema as the existing child Issue template so the new Issue carries equivalent context.
- Reuse the parent Issue's child-list update pattern (`gh issue edit [親Issue番号] --body "..."`) to register the new Issue.
