---
name: commit
description: Create a git commit following Conventional Commits conventions.
when_to_use: >
  Trigger phrases: "commit", "コミット", "コミットして", "変更をコミット".
disable-model-invocation: true
allowed-tools: Bash(git status *) Bash(git diff *) Bash(git add *) Bash(git commit *)
---

# Commit Skill

Read `../../references/commit-format.md` before generating any commit message.

> **Delegation mode**: If invoked from another skill (e.g., `commit-push-pr`), skip only the `AskUserQuestion` in Step 6. Step 3 still runs when the staged diff is empty (same condition as normal mode) so that unstaged tracked changes are not missed.

## Context

- Working tree: !`git status --short`
- Staged diff: !`git diff --staged`
- Branch: !`git branch --show-current`

## Flow

### Step 1: Check Working Tree Status

Use `Working tree` from Context. If empty, report to the user and stop immediately.

### Step 2: Check Staged Changes

Use `Staged diff` from Context. If it has content, skip to Step 4. Otherwise proceed to Step 3.

### Step 3: Stage Changes

Nothing is staged. Stage all tracked modified files:

```bash
git add -u
```

Then verify:

```bash
git diff --staged
```

If the output is empty (no tracked files were modified), report that there is nothing to commit and stop.

Do not run `git add .` or `git add -A` without explicit user confirmation — untracked files may include secrets or generated artifacts.

### Step 4: Analyze Staged Diff

Use `Staged diff` from Context (or the output of Step 3 if staging was needed).

Infer the `type`, `scope`, and content of the commit message. Refer to `../../references/commit-format.md` for scope inference rules.

### Step 5: Generate Commit Message

Generate a commit message following the format in `../../references/commit-format.md`:

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

- **`../../references/commit-format.md`** — Type list, subject/body rules, scope inference, good/bad examples, commitlint constraints
