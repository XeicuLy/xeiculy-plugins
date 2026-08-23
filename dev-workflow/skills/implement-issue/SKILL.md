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

### Handling Hidden Requirements

Before running the completion check below, if work outside the current acceptance criteria surfaces during implementation:

- **In-scope check**: Treat it as in-scope only if it supports the current Issue's existing deliverable without introducing a new artifact, an API/schema change, a data migration, or an independent acceptance flow (e.g., adjusting an existing check's message or tightening an existing validation). If in-scope, add it as an additional acceptance criterion, implement it, and persist it to the current Issue: fetch the existing body with `gh issue view [現Issue番号] --json body --jq .body`, append the new criterion to the checklist, then update with `gh issue edit [現Issue番号] --body "<統合後の本文>"` so existing content is preserved rather than overwritten.
- **Otherwise**, call `Skill(skill="task-planner:github-issue-creator")` to split it into a new child Issue. Fill `learning_context` (`background` / `hints` / `references` / `pre_implementation_checklist`) with the same schema as the existing child Issue template so the new Issue carries equivalent context.
  - If the current Issue has a parent (see Pre-Phase Parent Issue Resolution), register the new Issue as a sibling under that same parent. Fetch the parent Issue's existing body with `gh issue view [親Issue番号] --json body --jq .body`, append the new Issue to its child list, then update with `gh issue edit [親Issue番号] --body "<統合後の本文>"` so existing content is preserved rather than overwritten.
  - If the current Issue has no parent, register the new Issue as a child of the current Issue. Fetch the current Issue's existing body with `gh issue view [現Issue番号] --json body --jq .body`, append the new Issue to its child list, then update with `gh issue edit [現Issue番号] --body "<統合後の本文>"` so existing content is preserved rather than overwritten.

### Completion

1. 隠れた要件の対応で受入基準を追加した場合はそれを含め、全受入基準がGREENであることを確認するため、テストスイートを再実行する
2. 実装完了をユーザーに報告し、コミット・PR 作成を促す
