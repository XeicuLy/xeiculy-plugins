# Dependency Graph Resolution

Resolves a GitHub Issue dependency graph (parent → sub-issues → blocked-by) into a single linear stack implementation order. Consumed by `stack-implement/SKILL.md`'s Pre-Phase to decide, for a given parent Issue, which order to loop `dev-workflow:implement-issue` over its sub-issues before stacking each result with `gh-stack`.

This spec assumes Issues were created by `task-planner:github-issue-creator` (`--parent` / `--blocked-by` flags), which produces one parent Issue with a **flat** list of direct sub-issues — no grandchildren. Nested sub-issue trees are out of scope; if a fetched sub-issue itself has sub-issues, treat it as a validation error (see Step 6).

## Prerequisites

- `gh` CLI version 2.94.0 or later (same requirement as `github-issue-creator`)
- Read access to the target repository's Issues

## Input

- **Parent Issue number** (required) — passed from the caller (e.g. the user, or `stack-implement/SKILL.md`'s Pre-Phase)
- **`dependency_table`** (optional) — the `child_issues` array from the original `task-planner:github-issue-creator` payload (see `task-planner/skills/task-breakdown/references/issue-schema.md`), if the caller still has it. Its `id` / `depends_on` values are local task IDs (e.g. `T1`), not GitHub issue numbers. Used only for the cross-check in Step 4.
- **`child_issue_id_map`** (optional, required if `dependency_table` is supplied) — the local-ID-to-GitHub-issue-number mapping recorded by `github-issue-creator` Step 2 when it created each child Issue (e.g. `{"T1": 99, "T2": 100}`). Used to normalize `dependency_table` before the Step 4 comparison.

---

## Step 1: Fetch the sub-issue list

```bash
gh issue view <親Issue番号> --repo <owner>/<repo> --json number,title,state,subIssues,subIssuesSummary
```

`subIssues.nodes[]` gives each direct sub-issue's `number`, `title`, `state` (`OPEN` / `CLOSED`). This is the full node set of the graph. If `subIssues.totalCount` is 0, stop and report to the user — there is nothing to stack.

## Step 2: Fetch each sub-issue's `blockedBy`

For every sub-issue number from Step 1:

```bash
gh issue view <子Issue番号> --repo <owner>/<repo> --json number,title,state,blockedBy,subIssues,subIssuesSummary
```

If `subIssues.totalCount` is greater than 0, this sub-issue itself has children — a nested tree the flat-graph assumption at the top of this document does not support. Halt immediately and report it as a validation error per Step 6, without proceeding to the edge collection below.

`blockedBy.nodes[]` gives the Issues that must close before this one can start. Collect `(from, to)` edges as `to depends on from` for every `blockedBy` entry whose number is in the Step 1 node set.

If a `blockedBy` entry's number is **not** in the Step 1 node set (a dependency on an Issue outside this parent's sub-issue tree — e.g. a cross-cutting Issue like #95 blocking both #99 and #100 belongs to the _same_ parent tree and is fine, but a dependency on an unrelated Issue elsewhere is not), report it to the user as an external dependency and ask whether to treat it as already satisfied (if `CLOSED`) or block the whole stack (if `OPEN`). Do not silently drop it.

## Step 3: Build the graph

- **Nodes**: every sub-issue from Step 1, each tagged with its `state`.
- **Edges**: every `(from, to)` pair from Step 2, read as "`to` depends on `from`".
- **Already-satisfied nodes**: any node with `state == "CLOSED"`. Keep them in the graph (they still count for edge resolution) but exclude them from the final stack order in Step 5 — there is nothing left to implement for them.

## Step 4: Cross-check against `dependency_table` (optional)

If the caller supplied a `dependency_table`, first normalize it: using `child_issue_id_map`, convert every `child_issues[*].id` and each entry of `depends_on` from its local ID (e.g. `T1`) to the corresponding GitHub issue number, producing an edge set in the same `(from, to)` shape as Step 3. Then verify that the edge set built in Step 3 exactly matches this normalized edge set (same check `github-issue-creator` Step -1 already performs before Issue creation — this step re-verifies that GitHub's live state still agrees with it). On mismatch, report the specific differing pairs and halt — do not guess which source is correct.

If no `dependency_table` is supplied, skip this step; the graph from Step 3 (live GitHub state) is authoritative.

---

## Step 5: Topological sort (Kahn's algorithm)

This reuses `github-issue-creator`'s "create tasks with no dependencies first" ordering rule (`task-planner/skills/github-issue-creator/SKILL.md:139`), generalized into a repeatable algorithm and given a deterministic tie-break, since `gh-stack` stacks branches one at a time and needs a single total order even when two Issues are mutually independent:

1. Compute each node's **in-degree** = number of incoming edges from `OPEN` nodes only. A `CLOSED` dependency is already satisfied, so edges whose source is a `CLOSED` node are excluded from in-degree entirely — a node blocked only by `CLOSED` issues starts at in-degree 0.
2. Put all `OPEN` nodes with in-degree 0 into a ready set. `CLOSED` nodes are never placed in the ready set or the output order — they exist only to be excluded when computing in-degree (per Step 3), not to be processed as ready items.
3. Repeat until the ready set is empty:
   - Pick the **lowest-numbered** Issue in the ready set (deterministic tie-break — matches the ascending order `github-issue-creator` creates Issues in) and append it to the stack order.
   - Decrement the in-degree of every `OPEN` node it points to (its dependents). Any dependent that reaches in-degree 0 joins the ready set.
4. The resulting list is the stack implementation order, each entry to be looped through `dev-workflow:implement-issue` → commit → `gh-stack add` in that sequence.

## Step 6: Cycle detection and error policy

After Step 5, if any `OPEN` node was never appended to the stack order (its in-degree never reached 0), the remaining subgraph (leftover nodes and the edges between them) contains at least one cycle — but not every leftover node is necessarily part of a cycle; some may simply be blocked by one (e.g. `#14` depends only on `#12`, and `#12` ↔ `#13` form a cycle — `#14` is leftover but not itself cyclic).

- **Halt immediately** — do not attempt a partial or best-effort order.
- **Identify the cycle(s)**: run a cycle-detection pass over the leftover subgraph (e.g. DFS with a recursion stack, or Tarjan's SCC algorithm). Report each strongly-connected component of size > 1 as a cycle, e.g. `#12 → blocked by #13, #13 → blocked by #12`.
- **Separately report residual nodes**: leftover nodes that are not part of any cycle but remain unresolved because they (transitively) depend on one, e.g. `#14 → blocked by #12 (part of a cycle)`.
- Ask the user to fix the dependency declaration on GitHub (`gh issue edit --remove-blocked-by` / re-create the Issue) before retrying — this tool does not modify Issue relationships itself.

This also covers the flat-graph assumption from the top of this document: if Step 2 discovers a sub-issue that itself has sub-issues, treat it the same way — halt and report it as an unsupported nested structure, rather than silently ignoring the grandchildren.

---

## Output Format

Report the resolved order to the caller as a table, skipping `CLOSED` nodes (already satisfied) but keeping them visible as context:

```
📊 依存グラフ解決結果（親Issue #86）

✅ 解決済み（実装スキップ）:
- #95 stack-pr: プラグイン骨格の新規作成 (CLOSED)

📦 スタック実装順序:
1. #99 stack-pr: 依存グラフ解決仕様の作成（依存: #95）
2. #100 stack-pr: gh-stack委譲対応表の作成（依存: #95）
3. #104 stack-pr: stack-implement本体skillの実装（依存: #99, #100）
```

---

## Worked Example

Live data from this repository's own `#86` sub-issue tree (fetched via the commands in Steps 1–2):

| Issue | State  | blockedBy |
| ----- | ------ | --------- |
| #95   | CLOSED | —         |
| #99   | OPEN   | #95       |
| #100  | OPEN   | #95       |
| #104  | OPEN   | #99, #100 |
| #106  | OPEN   | #104      |

Applying Step 5:

1. In-degrees (counting only edges from `OPEN` sources): `#99`=0, `#100`=0 (their only dependency, `#95`, is `CLOSED` and excluded), `#104`=2, `#106`=1.
2. Ready set starts as `{#99, #100}` (both `OPEN`, in-degree 0). `#95` is never placed in the ready set — it is `CLOSED` and excluded entirely from in-degree tracking.
3. Lowest-numbered first: append `#99`, then `#100`. Removing their edges drops `#104` to in-degree 0 → ready set `{#104}`.
4. Append `#104`. Removing its edge drops `#106` to in-degree 0 → append `#106`.

Result: **`#99 → #100 → #104 → #106`**. The Output Format example above shows the same chain truncated at `#104` for brevity — `#106` would be appended as step 4 there too.

---

## Additional Resources

- **`stack-workflow.md`** — gh-stack delegation table consumed alongside this file by `stack-implement/SKILL.md` (added in a later Issue)
- **`task-planner/skills/task-breakdown/references/issue-schema.md`** — `dependency_table` field definition used in Step 4
- **`task-planner/skills/github-issue-creator/SKILL.md`** — the "no dependencies first" ordering rule this algorithm generalizes
