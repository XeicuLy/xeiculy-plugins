---
name: github-issue-creator
description: >
  This skill should be used when creating GitHub Issues from task decomposition results.
  Handles parent/child issue creation, sub-issue registration, and label inference.
  Trigger phrases: "issue 作成", "Issue を作成", "create issue", "issue 作って",
  "子Issue を作成", "GitHub Issue を作りたい", "タスクをIssueにしたい".
version: 0.1.0
---

# GitHub Issue 作成スキル

タスク分解の結果から GitHub Issue を作成する。親 Issue と子 Issue を作成し、Sub Issue として紐付ける。

## 前提条件

- `gh` CLI が使用可能であること
- カレントディレクトリが Git リポジトリであること
- GitHub への認証が完了していること

## 受け取る情報

呼び出し元から以下の情報が渡される（なければユーザーに確認する）:

- **要件サマリー**: 機能の概要・対象ユーザー・主要な仕様
- **採用アーキテクチャ**: 選択されたアプローチとその設計方針
- **タスクリスト**: 各タスクのタイトル・概要・変更ファイル・依存関係

---

## Step -1: 入力検証（事前）

Issue 作成を開始する前に、受け取ったタスク情報の整合性を検証する。検証に失敗した場合は処理を中止してエラーを返す。

検証項目:

- `child_issues` が存在する場合、各 child_issue に一意の識別子（インデックスまたはローカルID）が含まれていること
- 各 child_issue の任意フィールド `depends_on` が指定されている場合、参照先はすべて `child_issues` の識別子であること
- 呼び出し元が明示的に `dependency_table` を渡している場合、`dependency_table` に記載された依存ペア集合と `child_issues[*].depends_on` で表される依存ペア集合が完全に一致すること
- タイトル・変更ファイルパスなどの必須項目が存在すること

失敗時: 検証エラーの詳細をユーザーに報告して処理を中断する。

---

## Step 0: ラベルの準備

### 0-1. 既存ラベルの取得

```bash
gh label list --limit 100
```

### 0-2. 各 Issue に付与するラベルの推論

受け取ったタスク情報（タイトル・概要・変更ファイルパス・アーキテクチャ種別）をもとにラベルを決定する。
詳細なパターン対応表は `references/label-patterns.md` を参照する。

**種別ラベル（親・子 Issue 共通、1 つ選択）:**

| 優先度 | 条件                           | ラベル          |
| ------ | ------------------------------ | --------------- |
| 1      | バグ修正                       | `bugfix`        |
| 2      | 新機能の追加                   | `feature`       |
| 3      | リファクタリング（新機能なし） | `refactor`      |
| 4      | インフラ・CI/CD 変更           | `infra`         |
| 5      | ドキュメントのみ               | `documentation` |

**レイヤーラベル（子 Issue のみ、変更ファイルパスから複数付与可）:** `references/label-patterns.md` の汎用パターンテーブルを参照する。

### 0-3. 必要なラベルの新規作成

```bash
gh label create "[ラベル名]" \
  --description "[説明]" \
  --color "[6桁の16進数カラーコード（#なし）]" \
  --force
```

カラーコードの目安:

- `feature` / `refactor` / `infra`: `0e8a16`（緑）
- `bugfix`: `d73a4a`（赤）
- `documentation`: `0075ca`（青）
- レイヤー系: `0075ca`（青）

### 0-4. ラベルマッピングの確定

以下の形式で各 Issue のラベルを確定し、以降のステップで参照する:

```
親Issue ラベル: [feature]
子Issue #1 ラベル: [feature, layer: service, layer: api]
子Issue #2 ラベル: [feature, layer: migration]
```

---

## Step 1: 親 Issue の作成

`.github/ISSUE_TEMPLATE/task-parent.md` が存在する場合はそのセクション構造に従って本文を生成する。存在しない場合は以下の汎用フォーマットを使用する:

```markdown
## 背景・動機

[機能の背景・動機を簡潔に説明する]

## ゴール

[リリースで達成したいことを明記する]

## 子 Issue リスト

<!-- 子 Issue 作成後に更新する -->

## 補足事項

[設計上のトレードオフ・後回しにするものがあれば記載（なければ省略）]

## 関連 Issue

[closes #N / refs #N の形式で記載（なければ省略）]
```

```bash
gh issue create \
  --title "Feature: [機能名]" \
  --body "[Body内容]" \
  --label "[種別ラベル]"
```

作成後、親 Issue 番号を記録する。

---

## Step 2: 子 Issue の作成

依存関係の順番（依存なしのタスクから）に各タスクを子 Issue として作成する。

`.github/ISSUE_TEMPLATE/task-child.md` が存在する場合はそのセクション構造に従う。存在しない場合は以下の汎用フォーマットを使用する:

```markdown
## 概要

[このタスクで実装・変更する内容を 1〜2 文で説明する]

## 変更ファイル

| 操作   | ファイルパス |
| ------ | ------------ |
| CREATE | path/to/file |
| MODIFY | path/to/file |

## 実装メモ

[設計上の制約・注意点・採用するアプローチの根拠を記載する]

## 実装要件

- [何をすべきか（What）を箇条書きで列挙する。コードスニペットや How は原則含めない]

## 依存関係

[先に完了していなければならない Issue を記載する。なければ「なし」]

## 受入基準

- [ ] 実装が完了している
- [ ] テストが追加・更新されている
- [ ] レビュアーが変更内容を理解できる
```

```bash
gh issue create \
  --title "{タスクタイトル}" \
  --body "[Body内容]" \
  --label "[種別ラベル],[layer: XXX]"
```

作成した子 Issue 番号をローカル ID とのマッピングで記録する。

---

## Step 3: 子 Issue を Sub Issue として紐付ける

```bash
# リポジトリ情報の取得
gh repo view --json owner,name --jq '{owner: .owner.login, name: .name}'

# REST API の数値 ID を取得して Sub Issue として登録
# ⚠️ gh issue view --json id は GraphQL node ID（文字列）を返すため使用不可
child_issue_number=[子Issue番号]
child_issue_id=$(gh api /repos/{OWNER}/{REPO}/issues/${child_issue_number} --jq '.id')

gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
  /repos/{OWNER}/{REPO}/issues/[親Issue番号]/sub_issues \
  -F "sub_issue_id=${child_issue_id}"
```

すべての子 Issue についてこのコマンドをループで実行する。

---

## Step 3.5: 子 Issue 間の依存関係を blocked by として設定する

タスクリストの `depends_on` に基づき、子 Issue 間に "blocked by" 関係を設定する。`depends_on` が空 / なしの子 Issue はスキップする。

```bash
# node_id は GraphQL mutation に必要（REST API の .node_id フィールドから取得）
blocked_issue_number=[depends_on を持つ子Issueの番号]
blocking_issue_number=[depends_on で参照されている子Issueの番号]

blocked_node_id=$(gh api /repos/{OWNER}/{REPO}/issues/${blocked_issue_number} --jq '.node_id')
blocking_node_id=$(gh api /repos/{OWNER}/{REPO}/issues/${blocking_issue_number} --jq '.node_id')

gh api graphql -f query="
mutation {
  addBlockedBy(input: {
    issueId: \"${blocked_node_id}\",
    blockingIssueId: \"${blocking_node_id}\"
  }) {
    issue { number issueDependenciesSummary { blockedBy blocking } }
  }
}"
```

設定後、各子 Issue の `issueDependenciesSummary.blockedBy` が期待値と一致することを確認する。

---

## Step 4: 親 Issue の「子 Issue リスト」セクションを更新する

```bash
gh issue edit [親Issue番号] \
  --body "[子 Issue リストセクションを子Issue番号・タイトル・URLで埋めた更新後のBody全文]"
```

更新後の子 Issue リストセクション例:

```markdown
## 子 Issue リスト

- #2（依存: なし）
- #3（依存: #2）
- #4（依存: #2）
- #5（依存: #3, #4）
```

---

## 出力フォーマット

すべての Issue を作成・紐付けした後、以下の形式で報告する:

```
📋 親Issue

#[番号] - [タイトル]
[URL]
🏷️ ラベル: [ラベル1], [ラベル2]

📦 子Issue（実装タスク）

1. #[番号] - [タイトル]
   [URL]
   🏷️ ラベル: [ラベル1], [ラベル2]
   依存関係: [なし / #番号]

---
📊 Issue構造

📋 #[親番号] [親タイトル]
├── 📦 #[子番号] [子タイトル]
│   └── 📦 #[子番号] [子タイトル]
└── 📦 #[子番号] [子タイトル]

---
🎯 次のステップ

1. 実装開始: #[最初のタスク番号]から着手してください
2. 並列実装可能: [並列実装できるタスクがあれば記載]
3. 進捗管理: 親Issue #[番号]で全体の進捗を確認できます
4. PRの作成: 各Issueごとに1つのPRを作成してください
```

---

## 注意事項

- Issue 作成に失敗した場合はエラーメッセージを確認し、権限・認証・ネットワークの問題を特定して報告する

## Additional Resources

- **`references/label-patterns.md`** — レイヤーラベルの汎用パターン対応表
