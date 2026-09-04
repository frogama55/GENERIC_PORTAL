# プライバシー設計メモ（外部送信しないことの担保・開発者向け）

> このファイルは開発者向けの技術メモです。利用者向けの正式なプライバシーポリシーは
> [PRIVACY_POLICY.md](../PRIVACY_POLICY.md)（リポジトリ直下）を参照してください。

この拡張はいかなるデータも拡張の外へ送信しない。

## 送信しないことの根拠（コードレベル）

- **ネットワーク権限を持たない（ポータル以外へは送れない）**
  `manifest.json` の `permissions` は `storage` のみ。`host_permissions` は
  `https://portal.chibatech.ac.jp/uprx/*` のみ。外部ドメインへの権限は一切ないため、
  たとえバグがあってもポータル以外へは通信できない（構造で担保）。
- **通信はポータルへの same-origin のみ**
  添付プレビュー機能(attachment.js)だけは `fetch` を使うが、送信先は **ポータル自身**
  （`form.action` = 同一オリジンの Bsd00701.xhtml）に限定。第三者へは一切送らない。
  クッキーはブラウザが自動付与するだけで、拡張はその値を読まない（セッションは HttpOnly）。
  取得したPDFは表示のための一時 blob で、保存も外部送信もしない。詳細は docs/security.md。
- **background (service worker) を持たない**
  定期処理・自動ポーリングの類は実装していない。
- **保存先はローカルのみ**
  設定（enabled / largeText）は `chrome.storage.local` にのみ保存する。
  `chrome.storage.sync`（Googleアカウント同期）も使っていない。
- **認証情報を扱わない**
  ID・パスワード・トークンの読み取り／保存／自動入力は行わない。
  SSOドメイン（`sso.chibatech.ac.jp`）には content script を注入しない。

## やらないこと（ハードルール）

- 外部サーバー・APIへのデータ送信（テレメトリ・分析含む）
- 認証情報の保存・自動入力・自動再ログイン
- ポータルへのPOST等の書き込み・データ変更（読み取り専用に徹する）
- 短間隔ポーリング・ループでの連続アクセス
