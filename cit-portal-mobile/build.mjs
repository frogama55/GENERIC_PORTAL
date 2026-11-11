// NexPortal Mobile - ビルドスクリプト（build.mjs）
//
// src/ 以下のファイルを1つのユーザースクリプトにまとめ，dist/ に出力する．外部ライブラリは使わない．
//
//   使い方：  node build.mjs      （または npm run build）
//
//   出力：
//     dist/nexportal-mobile.user.js … 本体（利用者がインストールするファイル）
//     dist/nexportal-mobile.meta.js … ヘッダだけ（ユーザースクリプトアプリが更新確認に使う）
//
// バージョンは package.json の "version"．更新を配るときは，ここを上げてからビルドし，
// dist/ ごとコミットして main に push する（利用者側のアプリが @updateURL を見て更新を検知する）．

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(ROOT, p), "utf8");

const { version } = JSON.parse(read("package.json"));

// 配布元（公開リポジトリの raw URL）．リポジトリやブランチを変えたらここを直す．
const RAW_BASE =
  "https://raw.githubusercontent.com/frogama55/GENERIC_PORTAL/main/cit-portal-mobile/dist";
const NAME = "nexportal-mobile";

// スタイル：拡張版と共通の restyle.css のあとに，スマホ用の mobile.css を重ねる
const CSS_FILES = ["src/content/restyle.css", "src/mobile/mobile.css"];

// 本体：上から順に実行される．content/ は Chrome 拡張版 manifest.json の "js" と同じ並び．
const JS_FILES = [
  "src/mobile/shim.js", // chrome.* 互換（先頭に置く．ここだけ包まず，後続から chrome を参照させる）
  "src/mobile/inject.js", // スタイルとページ側ブリッジの差し込み
  "src/content/restyle.js",
  "src/content/loading.js",
  "src/content/attachment.js",
  "src/content/session.js",
  "src/content/topage.js",
  "src/content/grades.js",
  "src/content/timetable.js",
  "src/content/attendance.js",
  "src/mobile/settings-panel.js", // ページ内の設定パネル
];
const UNWRAPPED = new Set(["src/mobile/shim.js"]);

const header = `// ==UserScript==
// @name         NexPortal Mobile
// @namespace    https://github.com/frogama55/GENERIC_PORTAL
// @version      ${version}
// @description  大学ポータル（対象は特定の1サイトのみ）の見た目・表示動作をスマホでも見やすく整える非公式の個人開発スクリプト．外部送信なし・読み取り専用・ローカル動作．
// @match        https://portal.chibatech.ac.jp/uprx/*
// @run-at       document-start
// @inject-into  content
// @noframes
// @grant        GM.getValue
// @grant        GM.setValue
// @updateURL    ${RAW_BASE}/${NAME}.meta.js
// @downloadURL  ${RAW_BASE}/${NAME}.user.js
// @homepageURL  https://github.com/frogama55/GENERIC_PORTAL
// ==/UserScript==
`;

const css = CSS_FILES.map((f) => `/* ---- ${f} ---- */\n${read(f)}`).join("\n");

const parts = JS_FILES.map((f) => {
  const src = read(f).trimEnd();
  const body = UNWRAPPED.has(f) ? src : `(function () {\n${src}\n})();`;
  return `// ======== ${f} ========\n${body}\n`;
});

const out = `${header}
// このファイルは build.mjs が自動生成したものです．直接編集せず，src/ を直してビルドし直してください．

(function () {
"use strict";

// 二重実行の防止（アプリの設定などで同じスクリプトが2回差し込まれた場合）
if (document.documentElement && document.documentElement.hasAttribute("data-nexportal-mobile")) return;
if (document.documentElement) document.documentElement.setAttribute("data-nexportal-mobile", ${JSON.stringify(version)});

const NEXPORTAL_VERSION = ${JSON.stringify(version)};
const NEXPORTAL_CSS = ${JSON.stringify(css)};
const NEXPORTAL_PAGE_BRIDGE = ${JSON.stringify(read("src/mobile/page-bridge.js"))};

${parts.join("\n")}
})();
`;

mkdirSync(join(ROOT, "dist"), { recursive: true });
writeFileSync(join(ROOT, "dist", `${NAME}.user.js`), out);
writeFileSync(join(ROOT, "dist", `${NAME}.meta.js`), header);
console.log(`built dist/${NAME}.user.js (v${version}, ${(out.length / 1024).toFixed(1)} KB)`);
