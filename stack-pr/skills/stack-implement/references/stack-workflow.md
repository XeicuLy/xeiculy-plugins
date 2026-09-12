# Stack Workflow Reference

Maps each step of the `dev-workflow:implement-issue` loop to the `gh stack` operation that must
be delegated to the official `Skill(skill="gh-stack:gh-stack")` at that point, plus the branch
naming rule that keeps `gh stack add` consistent with the Issue being implemented.

> **Scope note**: This file does not re-document `gh stack` command flags, exit codes, or
> preconditions — those belong to the official skill and its own `references/` (see
> `references/commands.md`, `references/troubleshooting.md` there). This table only answers
> "which operation, when" for orchestrating a dependency chain of Issues.

## Branch Naming Rule

```text
issue-<Issue番号>-<slug>
```

`<slug>` is a mechanical kebab-case conversion of the Issue title:

1. Take the Issue title as-is.
2. Strip every character that is not an ASCII letter, digit, hyphen, or whitespace (drop Japanese
   text and any other punctuation/symbols such as `:` `(` `)` — do not transliterate; existing
   hyphens are kept as-is).
3. Lowercase the remainder, collapse any run of whitespace into a single `-`, collapse repeated
   `-` into one, and trim leading/trailing `-`.
4. If the result is empty (e.g., a fully Japanese title), fall back to `issue-<Issue番号>` with no
   slug.

**Example**: Issue #100 `stack-pr: gh-stack委譲対応表の作成` → drop `:` and the Japanese suffix →
`stack-pr gh-stack` → lowercase + collapse whitespace/hyphens → `stack-pr-gh-stack` → branch name
`issue-100-stack-pr-gh-stack`.

This name is passed explicitly to `gh stack init` / `gh stack add` — both must always receive an
explicit branch name when invoked non-interactively (see the official skill's non-interactive-use
table), so the slug is computed before either call, never left for the command to prompt for.

## Operation Mapping

| ループの段階                                                                                                             | 発生タイミング                                                                   | 委譲する操作                                 |
| ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | -------------------------------------------- |
| 依存チェーンの最初のIssueを実装する直前（まだローカルにスタックが存在しない）                                            | チェーン先頭Issueの `dev-workflow:implement-issue` Pre-Phaseの直後、実装に入る前 | `gh stack init issue-<先頭Issue番号>-<slug>` |
| チェーン内2番目以降のIssueを実装する直前（既存スタックの最上位ブランチにいる）                                           | 各Issueの `dev-workflow:implement-issue` Pre-Phaseの直後、実装に入る前           | `gh stack add issue-<Issue番号>-<slug>`      |
| 1つのIssueの全受入基準がGREENになった直後                                                                                | 各Issueの `dev-workflow:implement-issue` Post-Phase（Completion）到達時、毎回    | `gh stack push`                              |
| チェーン内の最後のIssue（依存グラフ解決で「これより先に依存するIssueがない」と判定された末端）のPost-Phaseが完了した直後 | チェーン全体の実装が完了した時、1回のみ                                          | `gh stack submit --auto`                     |
| 上記いずれかの操作の前後でスタックの現在状態を確認したい時                                                               | 任意                                                                             | `gh stack view --json`                       |

`gh stack push` はチェーンの途中でも毎回実行し、ブランチをリモートに反映しておく。PRの作成・更新
（`gh stack submit`）はチェーン全体が完了するまで遅延させ、スタック全体を1回でまとめて提出する
（レビュー用のPRリンクをIssueごとに何度も作り直さないため）。

### Why push every Issue but submit only once

- `push` has no side effect beyond updating remote branches — running it after every Issue keeps
  work backed up without creating anything reviewers see.
- `submit` creates/updates PRs and the GitHub Stack object. Running it once, after the last Issue
  in the chain, avoids re-editing already-created PR descriptions on every intermediate Issue and
  matches the "個別Issueの実装ループはdev-workflow:implement-issueに委譲する" design in
  [`stack-pr/README.md`](../../../README.md).

## Example: 3-Issue Dependency Chain

Chain: `#100 (bottom) → #104 (depends on #100) → #106 (depends on #104)`.

Branch names below are illustrative outputs of the naming rule, shortened for readability — the
exact slug for any given Issue depends on the literal ASCII content of its title (see the
Branch Naming Rule algorithm above for how to derive it precisely).

```text
1. Resolve dependency order (out of scope here — see the future dependency-graph skill)
2. Issue #100:
   - Pre-Phase: fetch Issue #100
   - Delegate: gh stack init issue-100-stack-pr-gh-stack
   - feature-dev 7-Phase implementation
   - Post-Phase Completion: all criteria GREEN
   - Delegate: gh stack push
3. Issue #104:
   - Pre-Phase: fetch Issue #104
   - Delegate: gh stack add issue-104-stack-implement
   - feature-dev 7-Phase implementation
   - Post-Phase Completion: all criteria GREEN
   - Delegate: gh stack push
4. Issue #106 (last in chain):
   - Pre-Phase: fetch Issue #106
   - Delegate: gh stack add issue-106-marketplace-json
   - feature-dev 7-Phase implementation
   - Post-Phase Completion: all criteria GREEN
   - Delegate: gh stack push
   - Delegate: gh stack submit --auto   # whole stack, once
```

Every `gh stack *` call above is issued by invoking `Skill(skill="gh-stack:gh-stack")` with the
specific command as the instruction — the official skill is responsible for choosing the correct
non-interactive flags (`--auto`, `--json`, explicit branch names) and for exit-code recovery.
