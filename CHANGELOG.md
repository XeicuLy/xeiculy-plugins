# Changelog

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
