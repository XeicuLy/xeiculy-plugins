---
name: commit
description: >
  Use when creating a git commit following Conventional Commits conventions.
  Trigger phrases: "commit", "コミット", "create a commit", "コミットして", "変更をコミット",
  "コミットメッセージを生成", "変更内容をコミット".
---

# Commit Skill

Read `../../references/commit-format.md` before generating any commit message.

## Flow

### Step 1: Check Working Tree Status

```bash
git status
```

If the working tree is clean (no changes), report to the user and stop immediately.

### Step 2: Check Staged Changes

```bash
git diff --staged --stat
```

### Step 3: Stage Changes

If nothing is staged, stage all tracked modified files:

```bash
git add -u
```

Do not run `git add .` or `git add -A` without explicit user confirmation — untracked files may include secrets or generated artifacts.

> **Delegation mode**: If this skill was invoked from another skill (e.g., `commit-push-pr`, `resolve-pr-comments`), trust the caller has already staged the appropriate files. Skip to Step 4.

### Step 4: Read Staged Diff

```bash
git diff --staged
```

Use this output to infer the `type`, `scope`, and the content of the commit message. Refer to `../../references/commit-format.md` for scope inference rules.

### Step 5: Generate Commit Message

Generate a commit message following the format in `../../references/commit-format.md`:

```text
<type>(<scope>): <subject>

<body>
```

- `subject` — 必ず日本語、50文字以内、命令形
- `body` — 必ず日本語、変更の背景・目的を記述（subject の繰り返し不可）

### Step 6: Confirm (interactive mode only)

**Skip this step if invoked from another skill.** If the conversation context indicates this skill is being called from `commit-push-pr`, `resolve-pr-comments`, or any other skill, proceed directly to Step 7.

Otherwise, present the generated message to the user for approval using `AskUserQuestion`:

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
