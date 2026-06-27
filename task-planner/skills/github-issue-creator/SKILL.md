---
name: github-issue-creator
description: >
  This skill should be used when creating GitHub Issues from task decomposition results.
  Handles parent/child issue creation, sub-issue registration, and label inference.
  Trigger phrases: "issue 作成", "Issue を作成", "create issue", "issue 作って",
  "子Issue を作成", "GitHub Issue を作りたい", "タスクをIssueにしたい".
version: 0.1.0
---

# GitHub Issue Creator Skill

Create GitHub Issues from task decomposition results. Create a parent Issue and child Issues, and link them as Sub Issues.

## Prerequisites

- `gh` CLI must be available
- Current directory must be a Git repository
- Authentication to GitHub must be complete

## Input Information

The following information is passed from the caller (confirm with the user if missing):

- **Requirements summary**: Feature overview, target users, key specifications
- **Adopted architecture**: Selected approach and its design policy
- **Task list**: Title, summary, changed files, and dependencies for each task

---

## Step -1: Input Validation (Pre-check)

Validate the consistency of the received task information before starting Issue creation. If validation fails, stop processing and return an error.

Validation items:

- If `child_issues` exists, each child_issue must contain a unique identifier (index or local ID)
- If the optional `depends_on` field is specified for each child_issue, all referenced values must be identifiers in `child_issues`
- If the caller explicitly passes a `dependency_table`, the dependency pairs in `dependency_table` must exactly match the dependency pairs represented by `child_issues[*].depends_on`
- Required fields such as title and changed file paths must be present

On failure: Report validation error details to the user and halt processing.

---

## Step 0: Label Preparation

### 0-1. Fetch existing labels

```bash
gh label list --limit 100
```

### 0-2. Infer labels to assign to each Issue

Determine labels based on the received task information (title, summary, changed file paths, architecture type).
Refer to `references/label-patterns.md` for the detailed pattern mapping table.

**Type labels (common to parent and child Issues, select 1):**

| Priority | Condition                      | Label           |
| -------- | ------------------------------ | --------------- |
| 1        | Bug fix                        | `bugfix`        |
| 2        | New feature addition           | `feature`       |
| 3        | Refactoring (no new features)  | `refactor`      |
| 4        | Infrastructure / CI/CD changes | `infra`         |
| 5        | Documentation only             | `documentation` |

**Layer labels (child Issues only, multiple allowed based on changed file paths):** Refer to the generic pattern table in `references/label-patterns.md`.

### 0-3. Create required labels

```bash
gh label create "[label name]" \
  --description "[description]" \
  --color "[6-digit hex color code (no #)]" \
  --force
```

Color code guidelines:

- `feature` / `refactor` / `infra`: `0e8a16` (green)
- `bugfix`: `d73a4a` (red)
- `documentation`: `0075ca` (blue)
- Layer labels: `0075ca` (blue)

### 0-4. Finalize label mapping

Finalize labels for each Issue in the following format and reference them in subsequent steps:

```
親Issue ラベル: [feature]
子Issue #1 ラベル: [feature, layer: service, layer: api]
子Issue #2 ラベル: [feature, layer: migration]
```

---

## Step 1: Create Parent Issue

If `.github/ISSUE_TEMPLATE/task-parent.md` exists, follow its section structure to generate the body. If it does not exist, use the following generic format:

```markdown
## 背景・動機

[機能の背景・動機を簡潔に説明する]

## ゴール

[リリースで達成したいことを明記する]

## 子 Issue リスト

<!-- 子 Issue 作成後に更新する -->

## 補足事項

[設計上のトレードオフ・後回しにするものがあれば記載（なければ省略）]

## 関連 Issue

[closes #N / refs #N の形式で記載（なければ省略）]
```

```bash
gh issue create \
  --title "Feature: [機能名]" \
  --body "[Body内容]" \
  --label "[種別ラベル]"
```

Record the parent Issue number after creation.

---

## Step 2: Create Child Issues

Create each task as a child Issue in dependency order (tasks with no dependencies first).

If `.github/ISSUE_TEMPLATE/task-child.md` exists, follow its section structure. If it does not exist, use the following generic format:

```markdown
## 概要

[このタスクで実装・変更する内容を 1〜2 文で説明する]

## 変更ファイル

| 操作   | ファイルパス |
| ------ | ------------ |
| CREATE | path/to/file |
| MODIFY | path/to/file |

## 実装メモ

[設計上の制約・注意点・採用するアプローチの根拠を記載する]

## 実装要件

- [何をすべきか（What）を箇条書きで列挙する。コードスニペットや How は原則含めない]

## 依存関係

[先に完了していなければならない Issue を記載する。なければ「なし」]

## 受入基準

- [ ] 実装が完了している
- [ ] テストが追加・更新されている
- [ ] レビュアーが変更内容を理解できる

<!-- learning_context が存在する場合のみ出力する -->

## 背景・なぜこの実装が必要か

[learning_context.background を記載する]

<!-- learning_context が存在する場合のみ出力する -->

## 実装ヒント

- [learning_context.hints[] を箇条書きで記載する]

<!-- learning_context が存在する場合のみ出力する -->

## 参考リンク

- [learning_context.references[] を箇条書きで記載する]

<!-- learning_context が存在する場合のみ出力する -->

## 実装前チェックリスト

- [ ] [learning_context.pre_implementation_checklist[] を - [ ] 形式で記載する]
```

```bash
gh issue create \
  --title "{タスクタイトル}" \
  --body "[Body内容]" \
  --label "[種別ラベル],[layer: XXX]"
```

Record the created child Issue numbers with their local ID mapping.

---

## Step 3: Link Child Issues as Sub Issues

```bash
# Get repository information
gh repo view --json owner,name --jq '{owner: .owner.login, name: .name}'

# Get numeric ID via REST API and register as Sub Issue
# ⚠️ gh issue view --json id returns a GraphQL node ID (string) — do not use it
child_issue_number=[子Issue番号]
child_issue_id=$(gh api /repos/{OWNER}/{REPO}/issues/${child_issue_number} --jq '.id')

gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
  /repos/{OWNER}/{REPO}/issues/[親Issue番号]/sub_issues \
  -F "sub_issue_id=${child_issue_id}"
```

Execute this command in a loop for all child Issues.

---

## Step 3.5: Set "blocked by" dependencies between child Issues

Set "blocked by" relationships between child Issues based on `depends_on` in the task list. Skip child Issues with empty or missing `depends_on`.

```bash
# node_id is required for GraphQL mutation (obtained from the REST API .node_id field)
blocked_issue_number=[depends_on を持つ子Issueの番号]
blocking_issue_number=[depends_on で参照されている子Issueの番号]

blocked_node_id=$(gh api /repos/{OWNER}/{REPO}/issues/${blocked_issue_number} --jq '.node_id')
blocking_node_id=$(gh api /repos/{OWNER}/{REPO}/issues/${blocking_issue_number} --jq '.node_id')

gh api graphql -f query="
mutation {
  addBlockedBy(input: {
    issueId: \"${blocked_node_id}\",
    blockingIssueId: \"${blocking_node_id}\"
  }) {
    issue { number issueDependenciesSummary { blockedBy blocking } }
  }
}"
```

After setting, verify that `issueDependenciesSummary.blockedBy` for each child Issue matches the expected values.

---

## Step 4: Update the "Child Issue List" section of the parent Issue

```bash
gh issue edit [親Issue番号] \
  --body "[子 Issue リストセクションを子Issue番号・タイトル・URLで埋めた更新後のBody全文]"
```

Example of updated child Issue list section:

```markdown
## 子 Issue リスト

- #2（依存: なし）
- #3（依存: #2）
- #4（依存: #2）
- #5（依存: #3, #4）
```

---

## Output Format

After creating and linking all Issues, report in the following format:

```
📋 親Issue

#[番号] - [タイトル]
[URL]
🏷️ ラベル: [ラベル1], [ラベル2]

📦 子Issue（実装タスク）

1. #[番号] - [タイトル]
   [URL]
   🏷️ ラベル: [ラベル1], [ラベル2]
   依存関係: [なし / #番号]

---
📊 Issue構造

📋 #[親番号] [親タイトル]
├── 📦 #[子番号] [子タイトル]
│   └── 📦 #[子番号] [子タイトル]
└── 📦 #[子番号] [子タイトル]

---
🎯 次のステップ

1. 実装開始: #[最初のタスク番号]から着手してください
2. 並列実装可能: [並列実装できるタスクがあれば記載]
3. 進捗管理: 親Issue #[番号]で全体の進捗を確認できます
4. PRの作成: 各Issueごとに1つのPRを作成してください
```

---

## Notes

- If Issue creation fails, check the error message and identify permission, authentication, or network issues and report them.

## Additional Resources

- **`references/label-patterns.md`** — Generic pattern mapping table for layer labels
- **`examples/task-child.md`** — 子 Issue 本文の記述例（`learning_context` を含む完全サンプル）
