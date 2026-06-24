# Commit Format Reference

Follow [Conventional Commits](https://www.conventionalcommits.org/) for all commits in this repository.

## Format

```text
<type>(<scope>): <subject>

<body>
```

---

## Type List (example)

| type       | when to use                                    |
| ---------- | ---------------------------------------------- |
| `feat`     | 新機能の追加                                   |
| `fix`      | バグ修正                                       |
| `docs`     | ドキュメントのみの変更                         |
| `chore`    | ビルド・ツール・設定の変更（機能に影響しない） |
| `refactor` | 機能変更を伴わないリファクタリング             |
| `ci`       | CI/CD 設定の変更                               |

---

## Subject Rules

- **必ず日本語**で記述する
- **50文字以内**に収める
- 命令形（「〜する」「〜を追加する」）で書く
- 末尾にピリオドを付けない
- PRレビュー対応・作業経緯など「なぜその変更をしたか」は書かず、「何を変えたか」を表現する

### Good

```text
feat(auth): ログイン画面にバリデーションを追加する
fix(api): ユーザー取得時のNullPointerExceptionを修正する
docs(readme): セットアップ手順を更新する
```

### Bad

```text
feat(auth): Add login validation        ← 英語は不可
fix(api): fix bug                       ← 内容が不明瞭
feat(ui): レビュー指摘を修正した        ← 経緯であり変更内容ではない
feat(ui): ログイン画面のバリデーションを追加し、エラーメッセージの表示位置も調整しつつ、スタイルも整えた。  ← 長すぎる・複数変更
```

---

## Body Rules

- **必ず日本語**で記述する
- **変更の背景・目的**を記述する（何を変えたかではなく、なぜ変えたか）
- subject との間に空行を1行挿入する
- 箇条書きでも散文でも可

### Good

```text
feat(auth): ログイン画面にバリデーションを追加する

未入力のままフォームを送信できる状態だったため、
クライアント側でのバリデーションを実装した。
サーバー負荷の軽減とUX向上が目的。
```

### Bad

```text
feat(auth): ログイン画面にバリデーションを追加する

バリデーションを追加した。        ← subject の繰り返しに過ぎない
```

---

## Scope Estimation from `git diff --staged`

Run `git diff --staged` and infer scope from the changed file paths:

| Changed path pattern       | Inferred scope |
| -------------------------- | -------------- |
| `<plugin>/skills/<name>/`  | `<name>`       |
| `<plugin>/references/`     | `<plugin>`     |
| `<plugin>/.claude-plugin/` | `<plugin>`     |
| Root config files          | _(omit scope)_ |
| Multiple plugins changed   | _(omit scope)_ |

When the diff spans multiple unrelated areas, omit the scope rather than picking an arbitrary one.

---

## commitlint Constraints

This repository enforces rules via `commitlint.config.ts`:

- Extends `@commitlint/config-conventional`
- `subject-case`: `start-case`, `pascal-case`, and `upper-case` are **not allowed**

Japanese subjects satisfy the case constraint automatically. If writing an English subject (e.g. for scope-less chore commits), use `lower-case`.
