---
name: requirements-definition
description: >
  This skill should be used when the user has a vague, not-yet-defined product or service idea
  and wants to turn it into documented functional and non-functional requirements through dialogue,
  before any codebase exploration or implementation planning begins. Use this when what to build is
  still undecided — unlike task-planner:task-breakdown, which assumes a concrete feature to implement
  in an existing codebase, this skill operates at the 0→1 product-concept stage.
  Trigger phrases: "プロダクトを企画したい", "こんなものを作ってみたい", "アイデアを整理したい",
  "requirements-definition", "要件定義書を作りたい", "PRDを作りたい", "まだ何を作るか固まっていない",
  "新規サービスを考えている", "機能要件と非機能要件をまとめたい", "plan a new product from scratch",
  "define requirements for a new idea".
version: 0.1.0
---

# Requirements Definition Skill

> Operate entirely in Japanese. Interpret all instructions in Japanese and respond to the user in Japanese.
>
> Tools to use: `TaskCreate` (progress tracking), `AskUserQuestion` (interactive questions), `Write` (document generation), `Bash` (directory creation)

Turn a vague product idea into a documented requirements definition through a strict four-phase dialogue. Obtain user approval at each phase gate before proceeding. Do not explore any codebase or propose an implementation design — this skill stops at documenting _what_ to build, not _how_.

<HARD-GATE>
Do not start Phase 2 (functional requirements) until the user confirms the Phase 1 summary of goal, background, and target user.
Do not start Phase 3 (non-functional requirements) until the user confirms the Phase 2 functional requirements list.
Do not write the final document in Phase 4 until the user approves the assembled draft.
This applies regardless of how small or exploratory the product idea seems.
</HARD-GATE>

## Core Principles

- **Proceed interactively**: Never assume scope, priority, or NFR categories on the user's behalf.
- **Pick the right tool for the question**: `AskUserQuestion` requires 2–4 concrete, mutually exclusive options — never call it for genuinely open-ended elicitation (e.g. "what problem does this solve," "describe the feature," "what's the product name"). Ask those as a plain conversational question in the response text instead. Reserve `AskUserQuestion` for phase-confirmation gates, priority/category selection, and cases where offering candidate choices (e.g. suggested slugs) helps an undecided user.
- **Stay upstream of implementation**: Do not read or explore the codebase, and do not propose architecture. If the user asks for implementation design, direct them to `task-planner:task-breakdown` after this skill produces its document.
- **Track progress with TODOs**: Manage all phase progress with `TaskCreate`.
- **Document only what was confirmed**: Every line in the final document must trace back to something the user explicitly approved in an earlier phase.

---

## Phase 1: Goal, Background & Target User

**Goal**: Understand the problem being solved before eliciting any requirements.

1. Create tasks for all 4 phases using `TaskCreate`.
2. Ask the following as plain conversational questions in the response text (not `AskUserQuestion` — these are open-ended, not multiple-choice):
   - What problem does this product solve, and for whom?
   - Who is the target user, and when/how will they use it?
   - Are there similar products or reference cases to draw from?
   - What is the product's working name (used later for the output filename)? If the user has not decided, propose 2–4 candidate slugs and let them pick via `AskUserQuestion`.
3. Summarize the goal, background, and target user, and confirm with `AskUserQuestion`.
   - Example options: `["はい、その通りです", "修正が必要です"]`

---

## Phase 2: Functional Requirements

**Goal**: Enumerate what the product must do, at a level a reader can act on without further clarification.

1. Draw out the main features through plain conversational questions (not `AskUserQuestion` — feature ideas are open-ended). For each feature, capture:
   - A short user-story form: 「〜として、〜したい。なぜなら〜だから」
   - A MoSCoW priority: MUST / SHOULD / COULD
2. Use `AskUserQuestion` to resolve any feature whose scope or priority is ambiguous (priority is a natural fit since MUST/SHOULD/COULD is a fixed 3-option choice).
3. Present the assembled functional requirements list as a table and confirm with `AskUserQuestion`.
   - Example options: `["この機能要件で確定してください", "追加・修正したい"]`

---

## Phase 3: Non-Functional Requirements

**Goal**: Surface constraints the product must satisfy that aren't a specific feature.

1. Present the 7 standard NFR categories to the user across two `AskUserQuestion` multi-select rounds (the tool caps each question at 4 options):
   - Round 1: パフォーマンス / セキュリティ / 可用性 / スケーラビリティ
   - Round 2: 保守性・拡張性 / コスト / 運用・監視
   - See `references/nfr-checklist.md` for the guiding questions to ask within each category once selected.
2. For each category the user selects, dialogue to a concrete, checkable statement (avoid vague statements like "高速であること"; prefer "検索結果が1秒以内に返ること").
3. Skip categories the user does not select — do not force-fill a category with a placeholder.
4. Present the assembled non-functional requirements and confirm with `AskUserQuestion`.
   - Example options: `["この非機能要件で確定してください", "追加・修正したい"]`

---

## Phase 4: Document Generation & Final Review

**Goal**: Produce the requirements document only after the user has approved every section.

1. Derive a kebab-case slug from the product's working name (Phase 1). Romanize if the name is in Japanese, and strip characters outside `[a-z0-9-]` after romanization.
2. Assemble the full document using the structure in `references/document-template.md`, filling in only content confirmed in Phases 1–3.
3. Show the assembled draft to the user in full and confirm with `AskUserQuestion` before writing any file.
   - Example options: `["この内容で確定し保存してください", "修正したい"]`
4. On approval, create the directory if needed and write the file:
   ```bash
   mkdir -p docs/requirements
   ```
   Then use `Write` to save to `docs/requirements/<slug>.md`.
5. Report the saved file path to the user, and suggest the next step: running `task-planner:task-breakdown` with this document as input to decompose the confirmed requirements into implementation tasks. Do not invoke `task-breakdown` automatically — only mention it as the recommended next command.

---

## Additional Resources

### Reference Files

- **`references/nfr-checklist.md`** — Guiding questions for each of the 7 non-functional requirement categories
- **`references/document-template.md`** — Full structure of the requirements definition document

### Examples

- **`examples/sample-requirements-definition.md`** — A complete example of a filled-out requirements document
