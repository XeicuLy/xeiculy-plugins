# github-issue-creator ペイロードスキーマ

`task-planner:github-issue-creator` スキルへ渡す情報の形式定義。

## フィールド一覧

| フィールド            | 型     | 必須 | 説明                                                              |
| --------------------- | ------ | ---- | ----------------------------------------------------------------- |
| `requirements`        | string | ✅   | 確定した要件のサマリー（機能概要・対象ユーザー・主要な仕様）      |
| `chosen_architecture` | string | ✅   | 選択したアプローチ名と設計方針                                    |
| `child_issues`        | array  | ✅   | タスクリスト（後述）                                              |
| `dependency_table`    | array  | —    | 依存ペアの明示リスト。`child_issues[*].depends_on` と一致すること |

## child_issues の各要素

| フィールド      | 型       | 必須 | 説明                                            |
| --------------- | -------- | ---- | ----------------------------------------------- |
| `id`            | string   | ✅   | タスクのローカル識別子（例: `T1`, `T2`）        |
| `title`         | string   | ✅   | タスクタイトル（例: `Piniaストアの型定義追加`） |
| `summary`       | string   | ✅   | このタスクで実装・変更する内容（1〜2文）        |
| `changed_files` | array    | ✅   | 変更ファイルリスト（後述）                      |
| `notes`         | string   | —    | 設計上の制約・注意点                            |
| `requirements`  | string[] | —    | 実装要件（What を箇条書き）                     |
| `depends_on`    | string[] | —    | 依存する child_issue の id 配列                 |

## changed_files の各要素

```json
{
  "path": "src/stores/user.ts",
  "op": "CREATE"
}
```

`op` は `CREATE` / `MODIFY` / `DELETE` のいずれか。

## ペイロード例

```json
{
  "requirements": "ユーザーのお気に入り機能を追加する。ログイン済みユーザーが商品をお気に入り登録・解除でき、お気に入り一覧ページで確認できる。",
  "chosen_architecture": "プラグマティックアプローチ: Piniaストアで状態管理、REST API経由でバックエンドと連携",
  "child_issues": [
    {
      "id": "T1",
      "title": "お気に入りストアの実装",
      "summary": "Piniaを使ったお気に入り状態管理ストアを実装する。",
      "changed_files": [
        { "path": "src/stores/favorites.ts", "op": "CREATE" },
        { "path": "src/stores/favorites.test.ts", "op": "CREATE" }
      ],
      "depends_on": []
    },
    {
      "id": "T2",
      "title": "お気に入りAPIクライアントの実装",
      "summary": "バックエンドのお気に入りAPIを呼び出すクライアント関数を実装する。",
      "changed_files": [
        { "path": "src/api/favorites.ts", "op": "CREATE" },
        { "path": "src/api/favorites.test.ts", "op": "CREATE" }
      ],
      "depends_on": []
    },
    {
      "id": "T3",
      "title": "お気に入り一覧ページの実装",
      "summary": "お気に入り登録した商品を一覧表示するページコンポーネントを実装する。",
      "changed_files": [
        { "path": "src/pages/FavoritesPage.vue", "op": "CREATE" },
        { "path": "src/pages/FavoritesPage.test.ts", "op": "CREATE" },
        { "path": "src/router/index.ts", "op": "MODIFY" }
      ],
      "depends_on": ["T1", "T2"]
    }
  ]
}
```
