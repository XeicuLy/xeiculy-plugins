# Commit Flow Reference

Common step-by-step flow for creating a git commit following [Conventional Commits](https://www.conventionalcommits.org/). Used by the `/commit` command.

Read `commit-format.md` before generating any commit message.

> **Delegation mode**: If invoked as part of another workflow (e.g., `/commit-push-pr`), skip only the `AskUserQuestion` in Step 6. Step 3 still runs when the staged diff is empty (same condition as normal mode) so that unstaged tracked changes are not missed.

## Flow

### Step 1: Check Working Tree Status

Use `Working tree` from Context. If empty, report to the user and stop immediately.

### Step 2: Check Staged Changes

Use `Staged diff` from Context. If it has content, skip to Step 4. Otherwise proceed to Step 3.

### Step 3: Stage Changes

Nothing is staged. Stage all tracked modified files first:

```bash
git add -u
```

Then check if there are untracked files in the working tree (look for lines starting with `??` in `Working tree` from Context). If untracked files exist, list them to the user and ask for confirmation using `AskUserQuestion`:

- Question: "以下のファイルはまだ追跡されていません。ステージングに含めますか？\n[list of untracked files]"
- Options: `["含める（git add -A）", "含めない（追跡済みファイルのみ）"]`

If the user confirms, run:

```bash
git add -A
```

Then verify the staged result:

```bash
git diff --staged
```

If the output is empty (no changes were staged), report that there is nothing to commit and stop.

### Step 4: Analyze Staged Diff

Use `Staged diff` from Context (or the output of Step 3 if staging was needed).

Infer the `type`, `scope`, and content of the commit message. Refer to `commit-format.md` for scope inference rules.

### Step 5: Generate Commit Message

Generate a commit message following the format in `commit-format.md`:

```text
<type>(<scope>): <subject>

<body>
```

- `subject` — 必ず日本語、50文字以内、命令形
- `body` — 必ず日本語、変更の背景・目的を記述（subject の繰り返し不可）

### Step 6: Confirm

Present the generated message to the user for approval using `AskUserQuestion`:

- Options: `["このメッセージでコミットする", "メッセージを修正する"]`
- If the user requests changes, update the message and re-confirm.

### Step 7: Execute Commit

```bash
git commit -m "$(cat <<'EOF'
<generated message>
EOF
)"
```

Report the resulting commit hash to the user.

## Additional Resources

- **`commit-format.md`** — Type list, subject/body rules, scope inference, good/bad examples, commitlint constraints
