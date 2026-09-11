---
description: Full workflow from commit to push to Japanese PR creation.
argument-hint: ''
allowed-tools: Bash(git status *) Bash(git diff *) Bash(git add *) Bash(git commit *) Bash(git branch *) Bash(git push *) Bash(gh pr create *)
disable-model-invocation: true
---

# Commit Push PR

End-to-end workflow for committing staged changes, pushing to remote, and creating a Japanese PR.

## Context

- Working tree: !`git status --short`
- Staged diff: !`git diff --staged`
- Branch: !`git branch --show-current`

## Flow Overview

```
commit-flow.md（Delegation mode） → git push origin HEAD → PR 生成 → AskUserQuestion 確認 → gh pr create
```

---

## Step 1: Run the Commit Flow

`/commit` (`create-commit/commands/commit.md`) has `disable-model-invocation: true`, so it cannot be reached via the `SlashCommand` tool. Instead, read `../references/commit-flow.md` directly and follow its steps using `Working tree` / `Staged diff` / `Branch` from Context above.

**Delegation mode**: Per `commit-flow.md`'s own delegation note, skip only the `AskUserQuestion` in Step 6 and proceed directly to commit execution (Step 7). Step 3 still runs when the staged diff is empty (same condition as normal mode) so that unstaged tracked changes are not missed.

If Step 1 of `commit-flow.md` reports "nothing to commit" (empty working tree) or the commit fails, stop immediately and report to the user.

---

## Step 2: Push to Remote

After the commit succeeds, push the current branch to the remote:

```bash
git push origin HEAD
```

If the push fails (e.g., remote rejected, no upstream), report the error and stop. Do not force-push without explicit user confirmation.

---

## Step 3: Generate PR Title and Body

Read `../references/pr-template.md` for title format, body sections, section rules, and draft PR criteria.

Infer type, scope, and content from the commit message (Step 1) and the staged diff. The `Staged diff` in Context above is captured before Step 1 runs, so if `commit-flow.md`'s Step 3 staged additional changes (i.e., the initial `Staged diff` was empty), use the `git diff --staged` output produced there instead — otherwise the PR body may be generated from an empty diff.

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

Execute `gh pr create` using the command format in `../references/pr-template.md`. Add `--draft` if applicable per draft criteria.

Report the resulting PR URL to the user.

---

## Additional Resources

- **`../references/pr-template.md`** — PR タイトル・本文の日本語生成ルール、`gh pr create` コマンド例、ドラフト PR 判定条件
- **`../references/commit-flow.md`** — コミット生成の7ステップフロー（`/commit` コマンドと共有、Delegation mode 記述あり）
- **`../references/commit-format.md`** — type / scope / subject / body の規約（`/commit` コマンドと共有）
