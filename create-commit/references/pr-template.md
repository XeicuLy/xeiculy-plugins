# PR Template Reference

Defines Japanese generation rules for PR titles and bodies. The `commit-push-pr` skill reads this file when creating a PR.

---

## PR Title Format

```text
<type>(<scope>): <日本語の1行説明>
```

- **必ず日本語**で記述する
- **72文字以内**に収める
- type と scope は `commit-format.md` の規約に従う
- 末尾にピリオドを付けない

### Good

```text
feat(commit-push-pr): PR 作成コマンドを実装する
fix(task-planner): Issue 取得時のエラーハンドリングを修正する
docs(create-commit): PR 日本語生成ルールを定義する
```

### Bad

```text
feat(commit-push-pr): Implement PR creation    ← 英語は不可
fix: bug fix                                   ← 内容が不明瞭
feat(ui): ログイン画面の修正とスタイル調整とバリデーション追加  ← 長すぎる・複数変更
```

---

## Body Sections

本文は以下の4セクションで構成する。**全セクション日本語必須**。

```markdown
## 背景

<!-- なぜこの変更が必要か。課題・動機・背景を記述する -->

## 変更内容

<!-- 何を変えたか。箇条書きで変更点を列挙する -->

-

## テスト方法

<!-- レビュアーが動作を確認するための手順を記述する -->

1.

## 関連 Issue

<!-- 対応する Issue 番号を記載する -->

closes #
```

### Section Rules

| Section    | Content                            | Required |
| ---------- | ---------------------------------- | -------- |
| 背景       | 変更の動機・課題・目的（「なぜ」） | ✓        |
| 変更内容   | 変更した内容の箇条書き（「何を」） | ✓        |
| テスト方法 | 動作確認の手順（番号付きリスト）   | ✓        |
| 関連 Issue | `closes #<番号>` 形式で記載        | ✓        |

---

## `gh pr create` Command

```bash
gh pr create \
  --title "<type>(<scope>): <日本語の1行説明>" \
  --body "$(cat <<'EOF'
## 背景

<背景を記述>

## 変更内容

- <変更点1>
- <変更点2>

## テスト方法

1. <手順1>
2. <手順2>

## 関連 Issue

closes #<Issue番号>
EOF
)" \
  --base main
```

---

## Draft PR Criteria

以下のいずれかに該当する場合、`--draft` フラグを付けてドラフト PR として作成する。

| Condition                                | Decision |
| ---------------------------------------- | -------- |
| タイトルに `WIP` または `wip` が含まれる | draft    |
| コミットメッセージに `WIP` が含まれる    | draft    |
| ブランチ名が `wip/` で始まる             | draft    |
| ユーザーが明示的にドラフトを指定した     | draft    |
| 上記のいずれにも該当しない               | normal   |

```bash
# draft PR
gh pr create --draft \
  --title "<type>(<scope>): <日本語の1行説明>" \
  --body "..." \
  --base main
```
