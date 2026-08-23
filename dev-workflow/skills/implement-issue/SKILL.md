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

1. Fetch the full parent issue content. Store the parent's repository as `PARENT_REPO` — it may differ from the current repository and is reused in Post-Phase:
   ```bash
   PARENT_REPO="<parent.repository.nameWithOwner>"
   gh issue view <親Issue番号> --repo "$PARENT_REPO"
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

- **In-scope check**: Treat it as in-scope only if it supports the current Issue's existing deliverable without introducing a new artifact, an API/schema change, a data migration, or an independent acceptance flow (e.g., adjusting an existing check's message or tightening an existing validation). If in-scope, add it as an additional acceptance criterion, implement it, and persist it to the current Issue. Capture the added criterion text into a single-quoted variable (backticks / `$()` / double quotes inside single quotes are never evaluated by the shell; escape any literal single quote in the text as `'\''`), then merge it with the existing body and pass the result back through `--body`:
  ```bash
  ISSUE_BODY=$(gh issue view [現Issue番号] --json body --jq .body)
  NEW_CRITERION='<追加した受入基準>'
  UPDATED_BODY="${ISSUE_BODY}
  - [ ] ${NEW_CRITERION}"
  gh issue edit [現Issue番号] --body "$UPDATED_BODY"
  ```
- **Otherwise**, call `Skill(skill="task-planner:github-issue-creator")` to split it into a new child Issue. Fill `learning_context` (`background` / `hints` / `references` / `pre_implementation_checklist`) with the same schema as the existing child Issue template so the new Issue carries equivalent context. Apply the same single-quoted variable capture (never interpolate raw title/body text directly into the shell command) to whichever Issue receives the child list update:
  - If the current Issue has a parent (see Pre-Phase Parent Issue Resolution), register the new Issue as a sibling under that same parent, operating on the parent's own repository via `$PARENT_REPO` captured in Pre-Phase:
    ```bash
    PARENT_BODY=$(gh issue view [親Issue番号] --repo "$PARENT_REPO" --json body --jq .body)
    NEW_ISSUE_LINE='- #<新規Issue番号> <新規Issueタイトル>'
    UPDATED_PARENT_BODY="${PARENT_BODY}
    ${NEW_ISSUE_LINE}"
    gh issue edit [親Issue番号] --repo "$PARENT_REPO" --body "$UPDATED_PARENT_BODY"
    ```
  - If the current Issue has no parent, register the new Issue as a child of the current Issue:
    ```bash
    CURRENT_BODY=$(gh issue view [現Issue番号] --json body --jq .body)
    NEW_ISSUE_LINE='- #<新規Issue番号> <新規Issueタイトル>'
    UPDATED_CURRENT_BODY="${CURRENT_BODY}
    ${NEW_ISSUE_LINE}"
    gh issue edit [現Issue番号] --body "$UPDATED_CURRENT_BODY"
    ```

### Completion

1. Re-run the test suite to confirm all acceptance criteria are GREEN, including any added while handling hidden requirements.
2. If a new child or sibling Issue was created, verify the GitHub registration before reporting completion: the created Issue number, all 4 `learning_context` fields (`background` / `hints` / `references` / `pre_implementation_checklist`) in the new Issue's body, and the new Issue's number/title/URL reflected in the parent or current Issue body. If any check fails, do not report completion — resolve the cause and re-verify.
3. Report completion to the user and prompt them to commit and create a PR.
