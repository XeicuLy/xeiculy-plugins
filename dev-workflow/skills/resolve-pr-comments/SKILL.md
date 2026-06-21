---
name: resolve-pr-comments
description: >
  Use when responding to GitHub PR review comments (PR番号 + レビュー/指摘/CHANGES_REQUESTED,
  or PRコメント対応). Fetches and classifies comments (要対応/推奨対応/対応不要), confirms with
  user, then hands off to feature-dev 7-Phase Workflow with TDD enforcement. After implementation,
  replies to each comment individually on GitHub. Not for implementing issues, debugging, CI
  failures, or git ops.
---

# Resolve PR Comments Skill

## Pre-Phase: Collect and Classify Comments

Detect the current repository, then fetch the PR and its review comments:

```bash
REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner')
gh pr view <PR番号> --repo "$REPO"
gh api repos/$REPO/pulls/<PR番号>/reviews
gh api repos/$REPO/pulls/<PR番号>/comments
```

If the PR is linked to an issue, fetch its requirements as well:

```bash
gh issue view <Issue番号> --repo "$REPO"
```

**Record the `id` field of each comment** — this is required for replies in the Post-Phase.

### Classification Criteria

| Class        | Description                                                        |
| ------------ | ------------------------------------------------------------------ |
| **要対応**   | Bugs, security issues, spec violations — must fix                  |
| **推奨対応** | Nitpicks, style, maintainability — confirm with user before fixing |
| **対応不要** | Already fixed, out of scope, intentional design                    |

### Present Classification to User

```
## PR #<番号> レビューコメント対応方針

### 要対応（<件数>件）
1. [comment_id: <ID>] [ファイル:行] <指摘内容> → <対応内容>

### 推奨対応（<件数>件）
1. [comment_id: <ID>] [ファイル:行] <指摘内容> → <対応内容>

### 対応不要（<件数>件）
1. [comment_id: <ID>] [ファイル] <指摘内容> → 理由: <理由>
```

Use `AskUserQuestion` to confirm 推奨対応 items, then finalize the list of comments to address.

---

## Phase 2 onwards: `feature-dev` 7-Phase Workflow

```
Skill(skill="feature-dev:feature-dev")
```

Pass the finalized comment list and resolution plan as Discovery output, then start from **Phase 2 (Codebase Exploration)**.

---

## Implementation Phase TDD Cycle (overrides feature-dev Phase 5)

Complete each comment fix one at a time using RED → GREEN → REFACTOR.

See `../../references/tdd-cycle.md` for the full rules.

---

## Post-Phase: Reply to Each GitHub PR Comment

After implementation and commit are complete, reply to each comment on GitHub individually.

### Confirm Implementation with User

Before committing, use `AskUserQuestion` to present the changes and obtain approval:

```
AskUserQuestion(
  questions=[{
    "question": "以下の修正内容を確認してください。問題なければコミットに進みます。\n\n<対応した修正の一覧>",
    "header": "実装確認",
    "options": [
      { "label": "問題なし、コミットへ", "description": "このままコミットフェーズへ進む" },
      { "label": "修正が必要", "description": "指摘があれば追加で対応する" }
    ],
    "multiSelect": false
  }]
)
```

If "問題なし、コミットへ" is selected, proceed to commit. If "修正が必要", address the feedback first.

### Commit, Push, and Get Hash

After approval, execute the following sequence **without waiting for additional user input**:

**1. Create commit**

```
Skill(skill="commit-commands:commit")
```

**2. Push immediately after commit**

```bash
git push origin HEAD
```

**3. Get commit hash immediately after push**

```bash
git log --oneline -1
```

> **Important:** Commit → push → get hash → reply to PR comments must be executed as one uninterrupted sequence. Report completion of each step and proceed to the next without stopping for user input.

### Reply Commands

**For addressed comments (要対応 / 推奨対応):**

```bash
gh api repos/$REPO/pulls/<PR番号>/comments/<comment_id>/replies \
  -f body="対応しました。

**対応内容:** <具体的な修正内容の説明>
**コミット:** <commit_hash>"
```

**For unaddressed comments (対応不要):**

```bash
gh api repos/$REPO/pulls/<PR番号>/comments/<comment_id>/replies \
  -f body="対応不要と判断しました。

**理由:** <対応しなかった理由>"
```

### Reply Flow

1. Construct reply commands for all comments
2. Execute all replies in sequence immediately — do not wait for user confirmation between replies
3. Report to the user once all replies are posted

> **Note:** `gh api` replies create threaded replies on the target comment. For PR-level comments that do not support threads, post as a new comment instead: `gh pr comment <PR番号> --body "..."`.
