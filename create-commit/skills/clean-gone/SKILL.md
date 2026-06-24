---
name: clean-gone
description: Clean up local branches whose remote tracking branch has been deleted.
when_to_use: >
  "clean gone branches", "gone ブランチを削除", "リモートで削除されたブランチを整理", "不要なブランチを削除".
disable-model-invocation: true
allowed-tools: Bash(git fetch *) Bash(git branch *)
---

# Clean Gone Branches Skill

Cleans up local branches whose remote tracking branch has been deleted.

## Step 1: Fetch and Prune Remote Refs

```bash
git fetch --prune
```

This removes stale remote-tracking refs and prevents false positives from outdated remote state.

## Step 2: List Gone Branches

Capture the output without relying on grep's exit code:

```bash
gone_branches=$(git branch -vv | grep ': gone]' || true)
```

The `|| true` prevents exit code 1 (no matches) from being treated as an error.

Parse `gone_branches` to extract branch names (first column, stripping leading `*` if present).

If `gone_branches` is empty, report "削除対象の gone ブランチはありません" and stop.

## Step 3: Ask User to Select Branches for Deletion

Present the list of gone branches to the user using `AskUserQuestion` with `multiSelect: true`:

```text
AskUserQuestion({
  questions: [
    {
      question: "削除する gone ブランチを選択してください（複数選択可）",
      header: "ブランチ選択",
      multiSelect: true,
      options: [
        { label: "<branch-name>", description: "gone: <upstream-ref>" },
        ...
      ]
    }
  ]
})
```

If the user selects no branches, report that no branches were deleted and stop.

## Step 4: Classify Selected Branches

For each selected branch, check if it is fully merged into the current branch:

```bash
git branch --merged | grep -w "<branch-name>"
grep_exit=$?
```

Interpret the exit code explicitly:

- **exit 0** (match found) → **Merged**: safe to delete with `git branch -d`
- **exit 1** (no match) → **Unmerged**: requires force delete with `git branch -D` — must get explicit user confirmation first
- **exit 2+** (grep error) → treat as an actual error and abort

## Step 5: Confirm Force Deletion for Unmerged Branches

If any selected branch is unmerged, present a separate confirmation using `AskUserQuestion` before proceeding:

```text
AskUserQuestion({
  questions: [
    {
      question: "以下のブランチはマージされていません。強制削除（-D）してよいですか？\n\n<unmerged-branch-list>",
      header: "強制削除確認",
      options: [
        { label: "強制削除する", description: "git branch -D で削除します（復元不可）" },
        { label: "スキップする", description: "未マージブランチの削除をスキップします" }
      ]
    }
  ]
})
```

If the user selects "スキップする", remove all unmerged branches from the deletion list. Proceed only with merged branches.

## Step 6: Delete Branches

Delete each branch in the confirmed list:

```bash
# For merged branches
git branch -d <branch-name>

# For unmerged branches (only if user confirmed in Step 5)
git branch -D <branch-name>
```

Report success or failure for each branch.

## Step 7: Report Results

Report each branch as deleted, skipped (with reason), or errored.
