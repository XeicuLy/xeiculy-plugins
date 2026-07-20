# Changelog

## v2.0.1

[compare changes](https://github.com/XeicuLy/xeiculy-plugins/compare/v2.0.0...v2.0.1)

### 📖 Documentation

- **dev-workflow:** REFACTOR節に振る舞いベーステスト見直しステップを追加する ([#85](https://github.com/XeicuLy/xeiculy-plugins/pull/85))

### ❤️ Contributors

- KAKI ([@XeicuLy](https://github.com/XeicuLy))

## v2.0.0

[compare changes](https://github.com/XeicuLy/xeiculy-plugins/compare/v1.1.1...v2.0.0)

### ✨ Features

- **release:** プラグイン単位の変更検知とbump判定ロジックを追加する ([#79](https://github.com/XeicuLy/xeiculy-plugins/pull/79))
- **release:** プラグイン単位の選択的バージョン更新を実装する ([#80](https://github.com/XeicuLy/xeiculy-plugins/pull/80))

### ♻️ Refactors

- **github-issue-creator:** Sub Issue/blocked-by登録をgh apiからネイティブフラグへ移行する ([#82](https://github.com/XeicuLy/xeiculy-plugins/pull/82))

### 📖 Documentation

- ライセンス(MIT)を追加する ([e5b8781](https://github.com/XeicuLy/xeiculy-plugins/commit/e5b8781))
- **claude-md:** リリース手順にプラグイン単位の選択的バージョン更新を追記する ([#81](https://github.com/XeicuLy/xeiculy-plugins/pull/81))

### 🏡 Chore

- **commitlint:** Subject-case ルールを無効化する ([afb738a](https://github.com/XeicuLy/xeiculy-plugins/commit/afb738a))

### ❤️ Contributors

- KAKI ([@XeicuLy](https://github.com/XeicuLy))
- XeicuLy ([@XeicuLy](https://github.com/XeicuLy))

## v1.1.1

[compare changes](https://github.com/XeicuLy/xeiculy-plugins/compare/v1.1.0...v1.1.1)

### 🐛 Bug Fixes

- **dev-workflow:** Implement-issue の Post-Phase から superpowers 依存を除去 ([#72](https://github.com/XeicuLy/xeiculy-plugins/pull/72))

### ❤️ Contributors

- KAKI ([@XeicuLy](https://github.com/XeicuLy))

## v1.1.0

[compare changes](https://github.com/XeicuLy/xeiculy-plugins/compare/v1.0.0...v1.1.0)

### ✨ Features

- Product-planner プラグインを新規追加する ([#69](https://github.com/XeicuLy/xeiculy-plugins/pull/69))

### ❤️ Contributors

- KAKI ([@XeicuLy](https://github.com/XeicuLy))

## v1.0.0

[compare changes](https://github.com/XeicuLy/xeiculy-plugins/compare/v0.6.1...v1.0.0)

### ✨ Features

- **task-breakdown:** Issue-schema.md に learning_context フィールドを追加する ([#63](https://github.com/XeicuLy/xeiculy-plugins/pull/63))
- **task-breakdown:** Phase 2/5 に learning_context 生成ロジックを追加する ([#64](https://github.com/XeicuLy/xeiculy-plugins/pull/64))
- **task-breakdown:** Decomposition-guidelines.md に第6評価視点を追加する ([#65](https://github.com/XeicuLy/xeiculy-plugins/pull/65))
- **github-issue-creator:** 子 Issue テンプレートに learning_context 対応の教育的セクションを追加する ([#66](https://github.com/XeicuLy/xeiculy-plugins/pull/66))
- **task-breakdown:** Sample-task-breakdown.md に learning_context の実装例を追加する ([#67](https://github.com/XeicuLy/xeiculy-plugins/pull/67))
- **github-issue-creator:** Examples/task-child.md を新規作成する ([#68](https://github.com/XeicuLy/xeiculy-plugins/pull/68))

### 🐛 Bug Fixes

- **commit:** Untracked ファイルのステージング漏れを防ぐ確認フローを追加する ([4c80590](https://github.com/XeicuLy/xeiculy-plugins/commit/4c80590))

### ❤️ Contributors

- KAKI ([@XeicuLy](https://github.com/XeicuLy))
- XeicuLy ([@XeicuLy](https://github.com/XeicuLy))

## v0.6.1

[compare changes](https://github.com/XeicuLy/xeiculy-plugins/compare/v0.6.0...v0.6.1)

### 🐛 Bug Fixes

- **commit:** Commit スキルから disable-model-invocation フラグを削除する ([#55](https://github.com/XeicuLy/xeiculy-plugins/pull/55))

### ❤️ Contributors

- KAKI ([@XeicuLy](https://github.com/XeicuLy))

## v0.6.0

[compare changes](https://github.com/XeicuLy/xeiculy-plugins/compare/v0.5.1...v0.6.0)

### ✨ Features

- **implement-issue:** 親Issueの情報を取得してコンテキストを提示する ([#54](https://github.com/XeicuLy/xeiculy-plugins/pull/54))

### 📖 Documentation

- CHANGELOG.md から重複した v0.3.0 セクションを削除する ([f270b17](https://github.com/XeicuLy/xeiculy-plugins/commit/f270b17))

### ❤️ Contributors

- KAKI ([@XeicuLy](https://github.com/XeicuLy))
- XeicuLy ([@XeicuLy](https://github.com/XeicuLy))

## v0.5.1

[compare changes](https://github.com/XeicuLy/xeiculy-plugins/compare/v0.5.0...v0.5.1)

### 🐛 Bug Fixes

- **dev-workflow:** Resolve-pr-comments の commit-commands:commit 参照を create-commit:commit に更新する ([#50](https://github.com/XeicuLy/xeiculy-plugins/pull/50))

### ♻️ Refactors

- **create-commit:** スキルのトークン消費を最適化する ([#53](https://github.com/XeicuLy/xeiculy-plugins/pull/53))

### 📖 Documentation

- **create-commit:** README.md を新規作成する ([#51](https://github.com/XeicuLy/xeiculy-plugins/pull/51))
- **root:** ルート README.md に create-commit エントリを追加する ([#52](https://github.com/XeicuLy/xeiculy-plugins/pull/52))

### 🏡 Chore

- .prettierignore の .claude-plugin 除外をワイルドカードに統一する ([002470a](https://github.com/XeicuLy/xeiculy-plugins/commit/002470a))

### ❤️ Contributors

- KAKI ([@XeicuLy](https://github.com/XeicuLy))
- XeicuLy ([@XeicuLy](https://github.com/XeicuLy))

## v0.5.0

[compare changes](https://github.com/XeicuLy/xeiculy-plugins/compare/v0.4.1...v0.5.0)

### ✨ Features

- **create-commit:** プラグイン骨格を生成する ([#33](https://github.com/XeicuLy/xeiculy-plugins/pull/33), [#41](https://github.com/XeicuLy/xeiculy-plugins/pull/41))
- **commit:** Skills/commit/SKILL.md を実装する ([#44](https://github.com/XeicuLy/xeiculy-plugins/pull/44))
- **commit-push-pr:** Skills/commit-push-pr/SKILL.md を実装する ([#45](https://github.com/XeicuLy/xeiculy-plugins/pull/45))
- **create-commit:** Skills/clean_gone/SKILL.md を実装する ([#46](https://github.com/XeicuLy/xeiculy-plugins/pull/46))
- **create-commit:** Marketplace.json に create-commit エントリを追加する ([#47](https://github.com/XeicuLy/xeiculy-plugins/pull/47))

### 📖 Documentation

- **create-commit:** Conventional Commits と日本語 body ルールを commit-format.md に定義する ([#42](https://github.com/XeicuLy/xeiculy-plugins/pull/42))
- **create-commit:** References/pr-template.md で PR 日本語生成ルールを定義する ([#43](https://github.com/XeicuLy/xeiculy-plugins/pull/43))

### 🏡 Chore

- **commitlint:** Body-max-line-length ルールを無効化する ([eac5b74](https://github.com/XeicuLy/xeiculy-plugins/commit/eac5b74))

### ❤️ Contributors

- KAKI ([@XeicuLy](https://github.com/XeicuLy))
- XeicuLy ([@XeicuLy](https://github.com/XeicuLy))

## v0.4.1

[compare changes](https://github.com/XeicuLy/xeiculy-plugins/compare/v0.4.0...v0.4.1)

### 🐛 Bug Fixes

- **docs:** CHANGELOG.md の v0.4.0 セクションヘッダーを修正 ([#29](https://github.com/XeicuLy/xeiculy-plugins/pull/29))
- **release:** Scripts/release.ts のリリースバグを修正 ([#30](https://github.com/XeicuLy/xeiculy-plugins/pull/30))

### 📖 Documentation

- **release:** CLAUDE.md リリース手順を新フローに更新 ([#31](https://github.com/XeicuLy/xeiculy-plugins/pull/31))

### ❤️ Contributors

- KAKI ([@XeicuLy](https://github.com/XeicuLy))

## v0.4.0

[compare changes](https://github.com/XeicuLy/xeiculy-plugins/compare/v0.3.0...v0.4.0)

### ✨ Features

- **release:** Scripts/release.ts 実装 ([#24](https://github.com/XeicuLy/xeiculy-plugins/pull/24))

### 🏡 Chore

- **commitlint:** Subject の文頭大文字を許可する ([fd1c09a](https://github.com/XeicuLy/xeiculy-plugins/commit/fd1c09a))
- **release:** Changelogen 導入・release-it 削除・changelog.config.ts 追加 ([#23](https://github.com/XeicuLy/xeiculy-plugins/pull/23))

### 🤖 CI

- **release:** Release.yml を workflow_dispatch トリガーに移行 ([#25](https://github.com/XeicuLy/xeiculy-plugins/pull/25))

### ❤️ Contributors

- KAKI ([@XeicuLy](https://github.com/XeicuLy))
- XeicuLy ([@XeicuLy](https://github.com/XeicuLy))

### Features

* **dev-workflow:** implement-issue と resolve-pr-comments スキルを持つ dev-workflow プラグインを追加 ([#17](https://github.com/XeicuLy/xeiculy-plugins/issues/17)) ([7371add](https://github.com/XeicuLy/xeiculy-plugins/commit/7371addee248cba5792a6d732fae1a9c600ff953))

## [0.2.2](https://github.com/XeicuLy/xeiculy-plugins/compare/v0.2.1...v0.2.2) (2026-06-20)

## [0.2.1](https://github.com/XeicuLy/xeiculy-plugins/compare/v0.2.0...v0.2.1) (2026-06-20)

# 0.2.0 (2026-06-20)


### Bug Fixes

* actions/setup-nodeのnode-versionパラメータをnode-version-fileに修正 ([#15](https://github.com/XeicuLy/xeiculy-plugins/issues/15)) ([7d74c40](https://github.com/XeicuLy/xeiculy-plugins/commit/7d74c40bf2f6b45a258a8d50c3b4d21c3b8b2045))


### Features

* バージョン同期スクリプト scripts/sync-versions.ts を作成 ([#6](https://github.com/XeicuLy/xeiculy-plugins/issues/6)) ([#13](https://github.com/XeicuLy/xeiculy-plugins/issues/13)) ([1066cf2](https://github.com/XeicuLy/xeiculy-plugins/commit/1066cf29357d4adcd0c5d3b374dca4c91a7c4ede))
