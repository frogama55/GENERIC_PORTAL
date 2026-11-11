# 変更履歴（NexPortal Mobile）

Chrome 拡張版の変更履歴は [../cit-portal-ext/CHANGELOG.md](../cit-portal-ext/CHANGELOG.md) を参照．

## v0.1.0（試作版）

Chrome 拡張版 NexPortal v0.2.0 をもとに，スマホ向けのユーザースクリプト版を新規作成．

- **ユーザースクリプト化**：`build.mjs` で `src/` を1ファイル（`dist/nexportal-mobile.user.js`）に
  まとめる方式に変更．`manifest.json`・設定ポップアップ・アイコンは削除
- **互換層（`shim.js`）**：`chrome.storage.local` / `onChanged` を `GM.getValue` / `GM.setValue`
  の上に再現（使えない環境では localStorage にフォールバック）．共通コードは拡張版のまま使える
- **ページ内の設定パネル**：画面右下の歯車（⚙）から開くボトムシートに変更
- **添付ファイル**：タッチ端末では iframe ビューアをやめ，「開く（新しいタブ）／保存」ボタンに変更
  （iOS Safari が iframe 内の PDF を1ページ目しか表示できないため）．画像はその場で表示．
  拡張子から MIME を補い，新しいタブで表示されやすくした
- **スマホ向けスタイル（`mobile.css`）**：入力欄フォーカス時の自動ズーム防止，掲示カードの折り返し，
  タブの横スクロール，クイックランチャーの3列化，時間割・出欠表の横スクロール調整など
- **ローディング表示**：ページ側ブリッジを `<script>` 差し込みに変更．差し込めない環境では
  ポータル本来の表示にフォールバック

未確認事項：スマホ実機でのポータル表示，Userscripts アプリでのインストール・更新，
添付ファイルの「開く／保存」の動作．
