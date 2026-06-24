---
name: commit-push-pr
description: Full workflow from commit to push to Japanese PR creation.
when_to_use: >
  "commit and push", "commit push PR", "コミットしてPRを作成", "PR を作って", "push して PR を出して".
disable-model-invocation: true
allowed-tools: Bash(git push *) Bash(gh pr create *)
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

Read `../../references/pr-template.md` for title format, body sections, section rules, and draft PR criteria.

Infer type, scope, and content from the commit message (Step 1) and the staged diff.

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

Execute `gh pr create` using the command format in `../../references/pr-template.md`. Add `--draft` if applicable per draft criteria.

Report the resulting PR URL to the user.

---

## Additional Resources

- **`../../references/pr-template.md`** — PR タイトル・本文の日本語生成ルール、`gh pr create` コマンド例、ドラフト PR 判定条件
- **`../../references/commit-format.md`** — type / scope / subject / body の規約（commit スキルと共有）
