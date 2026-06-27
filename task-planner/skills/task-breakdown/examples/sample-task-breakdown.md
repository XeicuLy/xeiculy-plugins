# Sample: Task Decomposition and Issue Payload

Example execution of Phases 5–6 for the requirement "I want to add a user favorites feature."

---

## Phase 5 Output: Task List

### Task Table

| ID  | Title                           | Files Changed | Dependencies |
| --- | ------------------------------- | ------------- | ------------ |
| T1  | お気に入りストアの実装          | 2             | None         |
| T2  | お気に入りAPIクライアントの実装 | 2             | None         |
| T3  | お気に入り一覧ページの実装      | 3             | T1, T2       |

### Self-Evaluation Results

**Granularity check**: Each task changes 2–3 files. Within the guideline (3–10). No issues.

**Cohesion check**: All tasks include both implementation and tests. No issues.

**Independence check**:

- T1 can be merged independently (store only)
- T2 can be merged independently (API client only)
- T3 must be merged after T1 and T2 are complete (page depends on store and API)

**Dependency mapping**:

```
T1 ──┐
     ├── T3
T2 ──┘
```

T1 and T2 can be implemented in parallel.

**Improvement proposals**: Current task decomposition is appropriate. No splits or consolidations needed.

**Educational context check**:

- T1: `background` explains why the favorites store must be implemented before the page component. `hints` reference the existing `src/stores/user.ts` pattern and test setup. `references` include file:line pointers. `pre_implementation_checklist` has 4 items. No issues.
- T2: `background` explains the benefit of isolating the API client layer. `hints` reference `src/api/client.ts` to avoid duplicating HTTP configuration. `references` include file:line pointers. `pre_implementation_checklist` has 3 items. No issues.
- T3: `background` explains why T1 and T2 must be complete before implementation. `hints` reference existing page component patterns and router configuration. `references` include file:line pointers. `pre_implementation_checklist` has 4 items. No issues.

---

## Phase 6 Input: github-issue-creator Payload

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
      "learning_context": {
        "background": "Piniaストアはアプリ全体の状態をリアクティブに管理するレイヤーです。コンポーネントが直接 API を呼ぶ設計にすると、複数のページで状態が重複して管理されバグの温床になります。ストアを中間に置くことで「状態の唯一の場所（single source of truth）」が生まれます。favoritesストアはT2・T3の両方から使われるため最初に実装します。",
        "hints": [
          "ストアの基本形はこう書く: `export const useFavoritesStore = defineStore('favorites', () => { const itemIds = ref<string[]>([]); const addFavorite = (id: string) => { itemIds.value.push(id) }; return { itemIds, addFavorite } })` — Composition API スタイルで ref() が状態、関数がアクション",
          "テストの冒頭に必ず `beforeEach(() => { setActivePinia(createPinia()) })` を入れる — これがないと前のテストの状態が残り、テストが互いに影響し合う",
          "既存の src/stores/user.ts:15 のアクション定義を見れば、async/await と try-catch をどう組み合わせるかが分かる"
        ],
        "references": [
          "src/stores/user.ts:15 — 非同期アクションと try-catch のパターンを確認する",
          "src/stores/cart.ts:12 — 配列状態（items[]）の追加・削除操作の書き方を確認する",
          "https://pinia.vuejs.org/core-concepts/ — defineStore の基本概念（Setup Store vs Options Store）"
        ],
        "pre_implementation_checklist": [
          "既存のストア実装（src/stores/user.ts）を読み、defineStore の呼び出し形式を確認した",
          "Pinia がプロジェクトに導入済みであることを確認した（package.json に pinia がある）",
          "追加するストアID 'favorites' が既存のストアと衝突しないことを確認した",
          "src/stores/index.ts へのエクスポート追加が必要か確認した"
        ]
      },
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
      "learning_context": {
        "background": "コンポーネントが直接 fetch/axios を呼ぶ設計にすると、エンドポイントURLやヘッダー設定が各コンポーネントに散らばります。APIクライアント層を一か所に集めることで「エンドポイントが変わった→このファイルだけ直す」という修正範囲の局所化が実現できます。",
        "hints": [
          "GET はこう書く: `export const getFavorites = (): Promise<string[]> => client.get('/favorites').then(res => res.data)` — client は src/api/client.ts の axios インスタンス",
          "DELETE のパスパラメータは動的に作る: `export const removeFavorite = (id: string) => client.delete('/favorites/' + id)` — テンプレートリテラルで /favorites/${id} のようなパスを動的に生成できる",
          "テストで実際のHTTP通信を防ぐ: `vi.mock('./client')` でモジュールごと差し替え、`(client.get as Mock).mockResolvedValue({ data: ['item1'] })` で戻り値を制御する"
        ],
        "references": [
          "src/api/user.ts:8 — GET/POST/DELETE 各メソッドの呼び出し形式と型定義パターンを確認する",
          "src/api/client.ts:1 — axios インスタンスの作り方（baseURL・headers 設定）を確認する",
          "https://vitest.dev/guide/mocking.html — vi.mock の使い方と mockResolvedValue の書き方"
        ],
        "pre_implementation_checklist": [
          "既存の src/api/user.ts を読み、関数の型定義と戻り値の扱いを確認した",
          "バックエンドAPIの仕様（エンドポイント・リクエスト/レスポンスのJSON形式）を確認した",
          "共通APIクライアント（src/api/client.ts）のエラーハンドリング方針を確認した"
        ]
      },
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
      "learning_context": {
        "background": "Vueのページコンポーネントはルーターで URL に紐づけて初めてアプリに統合されます。T1・T2 が揃った後にこのタスクを実装することで、ストアとAPIクライアントを組み合わせた「動く画面」として機能します。コンポーネント単体では何も動かない、という設計上の役割を意識してください。",
        "hints": [
          "コンポーネントの起点はこう書く: `<script setup lang=\"ts\">\\nconst store = useFavoritesStore()\\nconst { itemIds } = storeToRefs(store)\\nonMounted(() => store.fetchFavorites())\\n</script>` — storeToRefs を使わないと template 内でリアクティビティが失われる",
          "空状態の分岐はこう書く: `<template>\\n  <ul v-if=\"itemIds.length > 0\">...</ul>\\n  <p v-else>お気に入りはまだありません</p>\\n</template>`",
          "ルートの追加は src/router/index.ts の routes 配列に `{ path: '/favorites', name: 'favorites', component: () => import('@/pages/FavoritesPage.vue') }` を1行追加するだけ — lazy import（`() => import(...)`）が既存パターン"
        ],
        "references": [
          "src/pages/ProductListPage.vue:1 — script setup の全体構造と onMounted でのデータ取得パターンを確認する",
          "src/router/index.ts:20 — routes 配列への追加形式と lazy import の書き方を確認する",
          "src/stores/favorites.ts:1 — T1 で実装したストアの公開 API（何が return されているか）を確認する",
          "https://vuejs.org/guide/components/script-setup.html — script setup 構文の基礎"
        ],
        "pre_implementation_checklist": [
          "T1（お気に入りストア）の実装が完了し、useFavoritesStore が動作することを確認した",
          "T2（お気に入りAPIクライアント）の実装が完了していることを確認した",
          "既存ページコンポーネント（src/pages/ProductListPage.vue）を読み、script setup の構造を把握した",
          "ルーターのパス命名規則を既存ルートと一致させた（例: /favorites）"
        ]
      },
      "depends_on": ["T1", "T2"]
    }
  ]
}
```

---

## Phase 6 Output Example: Created Issue Structure

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
