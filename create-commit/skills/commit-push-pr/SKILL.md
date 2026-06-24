---
name: commit-push-pr
description: >
  This skill should be used when the user asks to "commit and push", "commit push PR",
  "コミットしてPRを作成", "PR を作って", "コミットからPRまで一気にやって",
  "push して PR を出して", "変更をコミットしてプルリクを作りたい".
  Handles the full flow: commit → git push → Japanese PR creation.
---

# Commit Push PR Skill

End-to-end workflow for committing staged changes, pushing to remote, and creating a Japanese PR.

## Flow Overview

```
create-commit:commit → git push origin HEAD → PR 生成 → AskUserQuestion 確認 → gh pr create
```

---

## Step 1: Delegate Commit to `create-commit:commit`

Invoke the commit skill to handle staging, message generation, and commit execution:

```text
Skill(skill="create-commit:commit")
```

**Delegation mode**: The commit skill detects it is being called from another skill and skips the interactive `AskUserQuestion` confirmation step (Step 6 of the commit skill). It proceeds directly to commit execution.

If the commit skill reports "nothing to commit" or fails, stop immediately and report to the user.

---

## Step 2: Push to Remote

After the commit succeeds, push the current branch to the remote:

```bash
git push origin HEAD
```

If the push fails (e.g., remote rejected, no upstream), report the error and stop. Do not force-push without explicit user confirmation.

---

## Step 3: Generate PR Title and Body

Read `../../references/pr-template.md` to understand the format rules.

Generate the PR title and body **in Japanese** following the template:

**Title format:**

```text
<type>(<scope>): <日本語の1行説明>
```

**Body format:**

```markdown
## 背景

<なぜこの変更が必要か>

## 変更内容

- <変更点1>
- <変更点2>

## テスト方法

1. <手順1>

## 関連 Issue

closes #<Issue番号>
```

Infer the type, scope, and content from the commit message created in Step 1 and the staged diff. Refer to `../../references/pr-template.md` for detailed rules and examples.

**Draft PR criteria**: Apply `--draft` if any of the following are true:

- PR title contains `WIP` or `wip`
- Commit message contains `WIP`
- Branch name starts with `wip/`
- User explicitly requested a draft

---

## Step 4: Confirm with User

Present the generated PR title and body to the user using `AskUserQuestion` before creating the PR:

```text
AskUserQuestion({
  questions: [
    {
      question: "以下の内容で PR を作成してよいですか？\n\n**タイトル:**\n<generated title>\n\n**本文:**\n<generated body>",
      header: "PR 確認",
      options: [
        { label: "このまま作成する", description: "上記の内容で PR を作成します" },
        { label: "内容を修正する", description: "タイトルまたは本文を修正してから作成します" }
      ]
    }
  ]
})
```

If the user selects "内容を修正する", ask what to change, update the title/body accordingly, and re-confirm before proceeding.

---

## Step 5: Create PR

Execute `gh pr create` with the confirmed title and body:

```bash
gh pr create \
  --title "<type>(<scope>): <日本語の1行説明>" \
  --body "$(cat <<'EOF'
## 背景

<背景を記述>

## 変更内容

- <変更点1>

## テスト方法

1. <手順1>

## 関連 Issue

closes #<Issue番号>
EOF
)" \
  --base main
```

For draft PRs, add `--draft`:

```bash
gh pr create --draft \
  --title "..." \
  --body "..." \
  --base main
```

Report the resulting PR URL to the user.

---

## Additional Resources

- **`../../references/pr-template.md`** — PR タイトル・本文の日本語生成ルール、`gh pr create` コマンド例、ドラフト PR 判定条件
- **`../../references/commit-format.md`** — type / scope / subject / body の規約（commit スキルと共有）
