# github-issue-creator Payload Schema

Format definition for information passed to the `task-planner:github-issue-creator` skill.

## Field List

| Field                 | Type   | Required | Description                                                                   |
| --------------------- | ------ | -------- | ----------------------------------------------------------------------------- |
| `requirements`        | string | ✅       | Summary of finalized requirements (feature overview, target users, key specs) |
| `chosen_architecture` | string | ✅       | Selected approach name and design policy                                      |
| `child_issues`        | array  | ✅       | Task list (see below)                                                         |
| `dependency_table`    | array  | —        | Explicit list of dependency pairs. Must match `child_issues[*].depends_on`    |

## Fields for each child_issues element

| Field           | Type     | Required | Description                                              |
| --------------- | -------- | -------- | -------------------------------------------------------- |
| `id`            | string   | ✅       | Local task identifier (e.g., `T1`, `T2`)                 |
| `title`         | string   | ✅       | Task title (e.g., `Piniaストアの型定義追加`)             |
| `summary`       | string   | ✅       | What this task implements or changes (1–2 sentences)     |
| `changed_files` | array    | ✅       | List of changed files (see below)                        |
| `notes`         | string   | —        | Design constraints or caveats                            |
| `requirements`  | string[] | —        | Implementation requirements (what to do, in bullet form) |
| `depends_on`    | string[] | —        | Array of child_issue IDs this task depends on            |

## Fields for each changed_files element

```json
{
  "path": "src/stores/user.ts",
  "op": "CREATE"
}
```

`op` must be one of `CREATE`, `MODIFY`, or `DELETE`.

## Payload Example

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
