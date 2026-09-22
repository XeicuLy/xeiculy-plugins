---
name: adr-writer
description: >
  This skill should be used when the user faces a technical judgment call in solo development
  (refactoring decisions, changeability, database/library selection, performance vs. cost
  trade-offs, etc.) and wants to think it through in dialogue before recording the outcome as an
  Architecture Decision Record. It enforces a strict four-phase dialogue workflow where each phase
  requires explicit user approval before proceeding, then saves the confirmed decision in MADR
  format under `docs/adr/`.
  Trigger phrases: "ADRを書きたい", "技術判断を整理したい", "adr-writer", "この選択で悩んでいる",
  "どっちの技術を選ぶべきか相談したい", "決定記録を残したい", "リファクタリングするか判断したい",
  "write an ADR", "record this technical decision", "help me decide between these options".
  Not for requirement definition (`product-planner:requirements-definition`) or implementation
  task decomposition (`task-planner:task-breakdown`) — this skill only documents a technical
  judgment that has already been scoped.
version: 0.1.0
allowed-tools: AskUserQuestion Write Glob Bash(mkdir -p docs/adr)
---

# ADR Writer Skill

> Operate entirely in Japanese. Interpret all instructions in Japanese and respond to the user in Japanese.
>
> Tools to use: `AskUserQuestion` (phase-gate approval and option selection), `Write` (ADR generation), `Glob` (existing ADR number lookup), `Bash` (directory creation)

Turn a technical judgment call into a documented Architecture Decision Record through a strict four-phase dialogue. Obtain user approval at each phase gate before proceeding. Do not explore the codebase or write implementation code — this skill stops at documenting the decision and its rationale, not carrying it out.

<HARD-GATE>
Do not start Phase 2 (Considered Options) until the user confirms the Phase 1 summary of context and decision drivers.
Do not start Phase 3 (Tradeoff Analysis) until the user confirms the Phase 2 considered options list.
Do not start Phase 4 (Decision & ADR Generation) until the user confirms the Phase 3 tradeoff comparison.
Do not write the ADR file until the user approves the assembled draft in Phase 4.
This applies regardless of how small or obvious the decision seems.
</HARD-GATE>

## Core Principles

- **Proceed interactively**: Never assume the decision, its drivers, or the winning option on the user's behalf.
- **Pick the right tool for the question**: `AskUserQuestion` requires 2–4 concrete, mutually exclusive options — never call it for genuinely open-ended elicitation (e.g. "何に悩んでいるか," "背景を教えてください"). Ask those as a plain conversational question in the response text instead. Reserve `AskUserQuestion` for phase-confirmation gates, decision-driver/category selection from the checklist, and option comparisons that fit 2–4 choices.
- **Stay upstream of implementation**: Do not read or explore the codebase, and do not write code. If the user wants to act on the decision, that belongs to a separate implementation flow after this skill produces its ADR.
- **Ground trade-offs in the checklist**: Use `references/decision-criteria-checklist.md` to deepen the discussion, but only for the categories relevant to the decision at hand — do not force every category into the ADR.
- **Avoid vague claims**: Reject statements like "たぶん速くなる" or "安全なはず" — push for verifiable criteria or concrete numbers before recording them.
- **Document only what was confirmed**: Every line in the final ADR must trace back to something the user explicitly approved in an earlier phase.

---

## Phase 1: Context & Decision Drivers

**Goal**: Understand why a decision is needed now, and which criteria will judge it.

1. Ask the following as plain conversational questions in the response text (not `AskUserQuestion` — these are open-ended, not multiple-choice):
   - What are you trying to decide, and why does it need a decision now?
   - What triggered this (a problem observed, a new requirement, a limitation hit)?
   - What is the decision's working title (used later for the ADR title and filename slug)?
2. Present the relevant categories from `references/decision-criteria-checklist.md` (パフォーマンス / 変更容易性 / 運用・ランニングコスト / 学習コスト / セキュリティ / ロックイン耐性) and let the user multi-select which ones apply to this decision via `AskUserQuestion` (the tool caps each question at 4 options, so split into two rounds if the user wants to consider more than 4).
3. For each selected category, ask its guiding questions from the checklist conversationally to sharpen it into a concrete decision driver (avoid vague phrasing; push for checkable statements).
4. Summarize the context and the confirmed decision drivers, and confirm with `AskUserQuestion`.
   - Example options: `["このまま確定してください", "修正したい"]`

---

## Phase 2: Considered Options

**Goal**: Enumerate the candidate options being weighed, without yet judging them.

1. Draw out the candidate options through plain conversational questions (not `AskUserQuestion` — option ideas are open-ended). For each option, capture a short name and a one-line description of what it entails.
2. Use `AskUserQuestion` only if the user is undecided among a small set of already-named candidates and wants help narrowing which ones are worth comparing further.
3. Present the assembled list of considered options and confirm with `AskUserQuestion`.
   - Example options: `["この選択肢一覧で確定してください", "追加・修正したい"]`

---

## Phase 3: Tradeoff Analysis

**Goal**: Compare every considered option against the confirmed decision drivers.

1. For each decision driver confirmed in Phase 1, dialogue through how each option scores against it, using the checklist's guiding questions to keep the discussion concrete (verifiable criteria or numbers, not impressions).
2. Assemble the comparison as a table (rows: considered options, columns: decision drivers) with a short note per cell.
3. Surface any option that clearly fails a decision driver, and confirm with the user whether it should be dropped before the decision phase.
4. Present the assembled tradeoff comparison and confirm with `AskUserQuestion`.
   - Example options: `["この比較内容で確定してください", "修正したい"]`

---

## Phase 4: Decision & ADR Generation

**Goal**: Record the final decision and consequences, then produce the ADR file only after full approval.

1. Ask the user which option they are adopting and why, referencing the Phase 3 comparison (open-ended — plain conversational question).
2. Dialogue through the consequences of the decision: what improves, what gets harder, and what follow-up work or risk it introduces.
3. Derive a kebab-case English slug from the decision's working title (Phase 1). Romanize or translate if the title is in Japanese, and strip characters outside `[a-z0-9-]`.
4. Determine the next ADR number: use `Glob` on `docs/adr/*.md` to find existing files, take the highest `NNNN` prefix, and increment by 1 (zero-padded to 4 digits). Start at `0001` if no files exist.
5. Assemble the full ADR using the structure in `references/madr-template.md`, filling in only content confirmed in Phases 1–4 (Status is `proposed` unless the user says otherwise).
6. Show the assembled draft to the user in full and confirm with `AskUserQuestion` before writing any file.
   - Example options: `["この内容で確定し保存してください", "修正したい"]`
7. On approval, create the directory if needed and write the file:
   ```bash
   mkdir -p docs/adr
   ```
   Then use `Write` to save to `docs/adr/<NNNN>-<slug>.md`.
8. Report the saved file path to the user.

---

## Additional Resources

### Reference Files

- **`references/madr-template.md`** — Full MADR structure and the ADR numbering/slug rule
- **`references/decision-criteria-checklist.md`** — Guiding questions for each of the 6 decision-criteria categories
