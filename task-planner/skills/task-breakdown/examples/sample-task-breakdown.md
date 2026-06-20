# サンプル: タスク分解とIssueペイロード

「ユーザーのお気に入り機能を追加したい」という要件に対するフェーズ5〜6の実行例。

---

## フェーズ5 出力: タスクリスト

### タスク一覧

| ID  | タイトル                        | 変更ファイル数 | 依存   |
| --- | ------------------------------- | -------------- | ------ |
| T1  | お気に入りストアの実装          | 2              | なし   |
| T2  | お気に入りAPIクライアントの実装 | 2              | なし   |
| T3  | お気に入り一覧ページの実装      | 3              | T1, T2 |

### 自己評価結果

**粒度チェック**: 各タスク 2〜3 ファイル変更。目安（3〜10個）内。問題なし。

**凝集度チェック**: 全タスクに実装とテストが含まれている。問題なし。

**独立性チェック**:

- T1 は単独でマージ可能（ストアのみ）
- T2 は単独でマージ可能（APIクライアントのみ）
- T3 は T1・T2 完了後にマージ（ページがストアとAPIに依存）

**依存関係マッピング**:

```
T1 ──┐
     ├── T3
T2 ──┘
```

T1 と T2 は並列実装可能。

**改善提案**: 現状のタスク分解は適切。分割・統合の必要なし。

---

## フェーズ6 入力: github-issue-creator ペイロード

```json
{
  "requirements": "ログイン済みユーザーが商品をお気に入り登録・解除でき、お気に入り一覧ページで確認できる。",
  "chosen_architecture": "プラグマティックアプローチ: Piniaストアで状態管理、REST API経由でバックエンドと連携",
  "child_issues": [
    {
      "id": "T1",
      "title": "お気に入りストアの実装",
      "summary": "Piniaを使ったお気に入り状態管理ストアを実装する。登録・解除・一覧取得の各アクションを含む。",
      "changed_files": [
        { "path": "src/stores/favorites.ts", "op": "CREATE" },
        { "path": "src/stores/favorites.test.ts", "op": "CREATE" }
      ],
      "requirements": [
        "favoritesストアを作成し、登録済みアイテムIDの配列を状態として保持する",
        "addFavorite / removeFavorite / fetchFavorites アクションを実装する",
        "各アクションのユニットテストを追加する"
      ],
      "depends_on": []
    },
    {
      "id": "T2",
      "title": "お気に入りAPIクライアントの実装",
      "summary": "バックエンドの /favorites エンドポイントを呼び出すクライアント関数を実装する。",
      "changed_files": [
        { "path": "src/api/favorites.ts", "op": "CREATE" },
        { "path": "src/api/favorites.test.ts", "op": "CREATE" }
      ],
      "requirements": [
        "GET /favorites, POST /favorites/:id, DELETE /favorites/:id の呼び出し関数を実装する",
        "エラーハンドリングを共通のAPIクライアントパターンに合わせる",
        "モックを使ったユニットテストを追加する"
      ],
      "depends_on": []
    },
    {
      "id": "T3",
      "title": "お気に入り一覧ページの実装",
      "summary": "お気に入り登録した商品を一覧表示するページコンポーネントを実装し、ルーティングに追加する。",
      "changed_files": [
        { "path": "src/pages/FavoritesPage.vue", "op": "CREATE" },
        { "path": "src/pages/FavoritesPage.test.ts", "op": "CREATE" },
        { "path": "src/router/index.ts", "op": "MODIFY" }
      ],
      "requirements": [
        "FavoritesPage コンポーネントを作成し、favoritesストアと連携する",
        "/favorites ルートをルーターに追加する",
        "お気に入りが0件の場合の空状態UIを実装する",
        "コンポーネントテストを追加する"
      ],
      "depends_on": ["T1", "T2"]
    }
  ]
}
```

---

## フェーズ6 出力例: 作成されたIssue構造

```
📋 親Issue

#42 - Feature: お気に入り機能の追加
https://github.com/user/repo/issues/42
🏷️ ラベル: feature

📦 子Issue（実装タスク）

1. #43 - お気に入りストアの実装
   https://github.com/user/repo/issues/43
   🏷️ ラベル: feature, layer: frontend
   依存関係: なし

2. #44 - お気に入りAPIクライアントの実装
   https://github.com/user/repo/issues/44
   🏷️ ラベル: feature, layer: api
   依存関係: なし

3. #45 - お気に入り一覧ページの実装
   https://github.com/user/repo/issues/45
   🏷️ ラベル: feature, layer: frontend
   依存関係: #43, #44

---
📊 Issue構造

📋 #42 Feature: お気に入り機能の追加
├── 📦 #43 お気に入りストアの実装
├── 📦 #44 お気に入りAPIクライアントの実装
└── 📦 #45 お気に入り一覧ページの実装（#43, #44 完了後）
```
