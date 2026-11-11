// ==UserScript==
// @name         NexPortal Mobile
// @namespace    https://github.com/frogama55/GENERIC_PORTAL
// @version      0.1.0
// @description  大学ポータル（対象は特定の1サイトのみ）の見た目・表示動作をスマホでも見やすく整える非公式の個人開発スクリプト．外部送信なし・読み取り専用・ローカル動作．
// @match        https://portal.chibatech.ac.jp/uprx/*
// @run-at       document-start
// @inject-into  content
// @noframes
// @grant        GM.getValue
// @grant        GM.setValue
// @updateURL    https://raw.githubusercontent.com/frogama55/GENERIC_PORTAL/main/cit-portal-mobile/dist/nexportal-mobile.meta.js
// @downloadURL  https://raw.githubusercontent.com/frogama55/GENERIC_PORTAL/main/cit-portal-mobile/dist/nexportal-mobile.user.js
// @homepageURL  https://github.com/frogama55/GENERIC_PORTAL
// ==/UserScript==

// このファイルは build.mjs が自動生成したものです．直接編集せず，src/ を直してビルドし直してください．

(function () {
"use strict";

// 二重実行の防止（アプリの設定などで同じスクリプトが2回差し込まれた場合）
if (document.documentElement && document.documentElement.hasAttribute("data-nexportal-mobile")) return;
if (document.documentElement) document.documentElement.setAttribute("data-nexportal-mobile", "0.1.0");

const NEXPORTAL_VERSION = "0.1.0";
const NEXPORTAL_CSS = "/* ---- src/content/restyle.css ---- */\n/*\n * NexPortal - 見た目改変の本体\n *\n * すべてのルールは html.cit-restyle 配下に限定する．\n * → 設定OFFのときは html から cit-restyle クラスが外れ，素の見た目に戻る．\n *\n * 方針（フェーズ1）：\n *   - 特定要素の狙い撃ちはせず，まずはフォント・余白・配色・幅など「土台」を整える．\n *   - JSF/PrimeFaces 由来のクラス(.ui-*)は「あれば効く／なければ無視」で安全に当てる．\n *   - 通信・DOM生成はしない．純粋なCSSのみ．\n */\n\n/* ===== ベースタイポグラフィ ===== */\nhtml.cit-restyle body {\n  font-family: \"Hiragino Sans\", \"Yu Gothic\", \"Meiryo\", system-ui, sans-serif !important;\n  line-height: 1.6 !important;\n  color: #1f2933 !important;\n  -webkit-font-smoothing: antialiased;\n}\n\n/* 文字を少し大きく（設定 largeText 用） */\nhtml.cit-restyle.cit-restyle-large body {\n  font-size: 16px !important;\n}\n\n/* ===== リンク・見出しの視認性 ===== */\nhtml.cit-restyle a {\n  color: #1558b0 !important;\n}\nhtml.cit-restyle a:hover {\n  text-decoration: underline !important;\n}\nhtml.cit-restyle h1,\nhtml.cit-restyle h2,\nhtml.cit-restyle h3 {\n  line-height: 1.35 !important;\n  letter-spacing: 0.01em;\n}\n\n/* ===== 余白・行間のゆとり ===== */\nhtml.cit-restyle td,\nhtml.cit-restyle th {\n  padding: 8px 10px !important;\n}\nhtml.cit-restyle p,\nhtml.cit-restyle li {\n  line-height: 1.7 !important;\n}\n\n/* ===== テーブルの可読性（縞・境界・ヘッダ固定色） =====\n * 「項目名(th) / 値(td)」形式の情報照会系テーブル（学籍情報照会など）で，\n * th の背景が行ごとに濃紺／薄灰で交互になり縞が読みづらい問題への対応．\n * 原因：サイト既定の th に background-color だけでなく背景「画像」（グラデーション等）\n * が設定されており，background-color の上書きだけでは画像が上に残って消えない\n * （.btnSearch の検索ボタンで過去に踏んだのと同じ落とし穴）．\n * → background-image を明示的に none にして単色へ統一し，行の境界線も足して\n *   縞に頼らなくても見分けられるようにする． */\nhtml.cit-restyle table {\n  border-collapse: collapse !important;\n}\nhtml.cit-restyle table tr {\n  border-bottom: 1px solid #e7eaee;\n}\nhtml.cit-restyle table tr:nth-child(even) > td {\n  background-color: #f6f8fa !important;\n  background-image: none !important;\n}\nhtml.cit-restyle table td,\nhtml.cit-restyle table th {\n  border-color: #dfe3e8 !important;\n}\nhtml.cit-restyle th {\n  background-color: #eef2f6 !important;\n  background-image: none !important;\n  color: #1f2933 !important;\n}\nhtml.cit-restyle table tr:nth-child(even) > th {\n  background-color: #eef2f6 !important;\n  background-image: none !important;\n}\n\n/* 項目名セル（実機確認：<th> ではなく，サイトCSSで「濃い背景＋白文字」にした <td>）．\n * 上の縞ルールで偶数行の背景だけ薄くなり「薄灰に白文字」で読めなくなっていた．\n * 白文字のセル＝項目名セルと見なして restyle.js が .cit-label-cell を付けるので，\n * 背景・文字色をまとめて単色に統一する（奇数/偶数の縞より優先されるよう詳細度を上げる）． */\n/* 実機で確認できた固定セレクタ（学籍情報照会：table.ui-panelgrid > tr.ui-widget-content >\n * td.ui-panelgrid-cell.ui-widget-header.rowHeader > label.ui-outputlabel）も併記する． */\nhtml.cit-restyle table tr > td.cit-label-cell,\nhtml.cit-restyle table tr:nth-child(even) > td.cit-label-cell,\nhtml.cit-restyle table tr > td.ui-panelgrid-cell.ui-widget-header,\nhtml.cit-restyle table tr:nth-child(even) > td.ui-panelgrid-cell.ui-widget-header {\n  background-color: #e6ebf1 !important;\n  background-image: none !important;\n  color: #1f2933 !important;\n  font-weight: 600 !important;\n  border-right: 1px solid #d5dce3 !important;\n}\n\n/* ===== フォーム部品の当たり判定・見た目 ===== */\nhtml.cit-restyle input[type=\"text\"],\nhtml.cit-restyle input[type=\"password\"],\nhtml.cit-restyle input[type=\"search\"],\nhtml.cit-restyle select,\nhtml.cit-restyle textarea {\n  padding: 6px 8px !important;\n  border: 1px solid #c3cad3 !important;\n  border-radius: 6px !important;\n  background: #fff !important;\n}\nhtml.cit-restyle input:focus,\nhtml.cit-restyle select:focus,\nhtml.cit-restyle textarea:focus {\n  outline: 2px solid #1558b0 !important;\n  outline-offset: 1px;\n}\n\n/* ===== ボタン（汎用 + PrimeFaces .ui-button があれば） ===== */\nhtml.cit-restyle button,\nhtml.cit-restyle input[type=\"button\"],\nhtml.cit-restyle input[type=\"submit\"],\nhtml.cit-restyle .ui-button {\n  border-radius: 6px !important;\n  cursor: pointer;\n}\n\n/* ===== PrimeFaces パネル（存在すれば角丸・境界を整える） ===== */\nhtml.cit-restyle .ui-panel,\nhtml.cit-restyle .ui-widget-content {\n  border-radius: 8px !important;\n}\n\n/* ===== 掲示一覧（Bsd00701）をカード表示で見やすく =====\n * 1掲示の構造：\n *   div.alignRight               … 1件のラッパ\n *     dl.keiji                   … カテゴリ(span.keijiCategory) + タイトル(a.ui-commandlink) + 日付(テキスト)\n *     span.inlineBlock           … 操作ボタン（フラグ/既読）※想定\n *     div.cf / hr.ui-separator   … 装飾（カード化で不要）\n * → ラッパをカード＆横1行(flex)にして，タイトル行と操作ボタンを同じ行に収める．\n *   タイトルが長い場合は … で省略．重要/新着は i.iconColor*（表示時は hiddenStyle が外れる）．\n */\n\n/* ラッパ＝カード．dl.keiji を直下に持つ .alignRight だけを対象にする */\nhtml.cit-restyle div.alignRight:has(> dl.keiji) {\n  display: flex !important;\n  align-items: center;\n  flex-wrap: nowrap;\n  gap: 12px;\n  box-sizing: border-box;\n  margin: 0 0 8px !important;\n  padding: 8px 14px !important;\n  background: #fff !important;\n  border: 1px solid #e1e6ea !important;\n  border-radius: 10px !important;\n  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.06) !important;\n}\n\n/* clearfix と区切り線はカード化で不要 */\nhtml.cit-restyle div.alignRight:has(> dl.keiji) > .cf,\nhtml.cit-restyle dl.keiji ~ hr.ui-separator {\n  display: none !important;\n}\n\n/* タイトル行：カテゴリ＋タイトル＋日付を横並びにし，空きを占有 */\nhtml.cit-restyle dl.keiji {\n  display: flex !important;\n  align-items: center;\n  gap: 8px;\n  min-width: 0;\n  flex: 1 1 auto;\n  float: none !important;\n  width: auto !important;\n  margin: 0 !important;\n  line-height: 1.6 !important;\n  color: #52606d; /* 日付テキスト(dl直下)の色．タイトル・カテゴリは各自で上書き */\n}\n\n/* カテゴリをバッジ表示（縮まない） */\nhtml.cit-restyle .keiji .keijiCategory {\n  flex: 0 0 auto;\n  display: inline-block !important;\n  padding: 2px 10px !important;\n  border-radius: 999px !important;\n  background: #3b4a5a !important;\n  color: #fff !important;\n  font-size: 12px !important;\n  font-weight: 600 !important;\n}\n\n/* タイトル：伸びて空きを埋め，長い場合は … で1行省略\n * 太さ・色は既読/未読で分ける（未読はタイトルに fontBold が付く） */\nhtml.cit-restyle .keiji a.ui-commandlink {\n  flex: 1 1 auto;\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  font-size: 15px !important;\n}\nhtml.cit-restyle.cit-restyle-large .keiji a.ui-commandlink {\n  font-size: 16px !important;\n}\n\n/* 未読（fontBold あり）：太字＋濃い色でしっかり目立たせる */\nhtml.cit-restyle .keiji a.ui-commandlink.fontBold {\n  font-weight: 700 !important;\n  color: #0b3d91 !important;\n}\n\n/* 既読（fontBold なし）：通常太さ＋控えめグレーで後退させる */\nhtml.cit-restyle .keiji a.ui-commandlink:not(.fontBold) {\n  font-weight: 400 !important;\n  color: #6b7480 !important;\n}\n\n/* 重要アイコン（！）は残す（縮まない・余白詰め） */\nhtml.cit-restyle .keiji i.iconColorAttention {\n  flex: 0 0 auto;\n  margin: 0 !important;\n}\n\n/* 新着の電球アイコンは意味が分かりにくいので非表示（新着の視覚表示は廃止） */\nhtml.cit-restyle .keiji i.iconColorNew {\n  display: none !important;\n}\n\n/* 操作ボタン（フラグ/既読）をカード右側へ．縮小させない */\nhtml.cit-restyle div.alignRight:has(> dl.keiji) > .inlineBlock {\n  flex: 0 0 auto;\n  margin: 0 !important;\n}\n\n/* 重要（赤！アイコン表示）→ 赤帯＋淡背景 */\nhtml.cit-restyle div.alignRight:has(> dl.keiji):has(i.iconColorAttention:not(.hiddenStyle)) {\n  border-left: 4px solid #d64545 !important;\n  background: #fff8f7 !important;\n}\n\n/* ===== 既読 / 未読の見分け =====\n * 未読はタイトル(dl.keiji 直下の a)に fontBold が付く．\n * ボタン(フラグ/既読)のリンクを誤検出しないよう，判定は dl.keiji 直下の a に限定する．\n */\n\n/* カード先頭に丸ドットの枠を常に確保（既読は透明・未読は青） */\nhtml.cit-restyle div.alignRight:has(> dl.keiji)::before {\n  content: \"\";\n  flex: 0 0 auto;\n  width: 8px;\n  height: 8px;\n  border-radius: 50%;\n  background: transparent;\n}\nhtml.cit-restyle div.alignRight:has(> dl.keiji):has(dl.keiji > a.ui-commandlink.fontBold)::before {\n  background: #2f9e6f;\n}\n\n/* 既読カードは背景を少し落として後退させる（重要/新着の背景より後に置いて優先） */\nhtml.cit-restyle div.alignRight:has(> dl.keiji):has(dl.keiji > a.ui-commandlink:not(.fontBold)) {\n  background: #f2f4f6 !important;\n}\n\n/* ===== 掲示タブの絞り込み・改名 =====\n * タブは #funcForm:tabArea > ul.ui-tabs-nav > li．現状の並び（左から）：\n *   1 グループ / 2 全表示 / 3 授業 / 4 時間割変更 / 5 既読 / 6 未読 / 7 新着 / 8 重要 / 9 申込 / 10 フラグつき\n * 残すのは 1 グループ・2 全表示・6 未読・8 重要・10 フラグつき．他は非表示にする．\n * （8 重要は，トップの掲示「もっと見る」の飛び先として復活させた）\n */\n\n/* タブ帯の黒い背景を白くする（タブ本体の帯・その周囲とも） */\nhtml.cit-restyle #funcForm\\:tabArea,\nhtml.cit-restyle #funcForm\\:tabArea > ul.ui-tabs-nav {\n  background: #fff !important;\n  border-color: #dfe3e8 !important;\n}\n\nhtml.cit-restyle #funcForm\\:tabArea > ul.ui-tabs-nav > li:nth-child(3),\nhtml.cit-restyle #funcForm\\:tabArea > ul.ui-tabs-nav > li:nth-child(4),\nhtml.cit-restyle #funcForm\\:tabArea > ul.ui-tabs-nav > li:nth-child(5),\nhtml.cit-restyle #funcForm\\:tabArea > ul.ui-tabs-nav > li:nth-child(7),\nhtml.cit-restyle #funcForm\\:tabArea > ul.ui-tabs-nav > li:nth-child(9) {\n  display: none !important;\n}\n\n/* 「全表示」→「掲示一覧」に表示名だけ差し替え．\n * 元テキストを color:transparent で不可視化しつつ幅（≒4文字）は維持し，\n * ::before を重ねて中央に新ラベルを表示する．\n * ※ font-size:0 だとタブの em 指定パディングまで潰れて崩れるため，この方式にする． */\nhtml.cit-restyle #funcForm\\:tabArea > ul.ui-tabs-nav > li:nth-child(2) > a {\n  position: relative;\n  color: transparent !important;\n  white-space: nowrap;\n}\nhtml.cit-restyle #funcForm\\:tabArea > ul.ui-tabs-nav > li:nth-child(2) > a::before {\n  content: \"掲示一覧\";\n  position: absolute;\n  inset: 0;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  color: #1558b0 !important;\n}\n\n/* ===== 並び順ツールバーを丸ごと非表示 =====\n * 各タブパネル内の div.squeezeArea（並び順ラベル＋ドロップダウン＋各ボタン）が対象． */\nhtml.cit-restyle .ui-tabs-panels .squeezeArea {\n  display: none !important;\n}\n\n/* ===== 検索エリアの簡素化・中央寄せ（掲示一覧ページ限定！） =====\n * div.searchArea 内：入力欄 dl.searchItem ＋ 検索ボタン span.btnSearchLocation．\n * ※ 他ページにも .searchArea があるため，掲示一覧の検索欄（#funcForm:keyword を含むもの）\n *   だけに限定する（:has で絞る）．これを怠ると他ページの検索ボタンまで消えてしまう．\n * ボタン非表示に伴う検索実行は restyle.js の Enter ハンドラで担保する． */\nhtml.cit-restyle div.searchArea:has(#funcForm\\:keyword) .btnSearchLocation {\n  display: none !important;\n}\nhtml.cit-restyle div.searchArea:has(#funcForm\\:keyword) {\n  display: flex !important;\n  justify-content: center;\n  align-items: center;\n  flex-wrap: wrap;\n  gap: 10px;\n}\n\n/* 「授業科目」欄（ラベル dt.searchItemCell ＋ 入力 dd）は不要なので非表示（掲示一覧限定）．\n * キーワード欄(funcForm:keyword)だけ残す．キーワード側の dt は無クラスなので誤爆しない． */\nhtml.cit-restyle div.searchArea:has(#funcForm\\:keyword) dt.searchItemCell,\nhtml.cit-restyle div.searchArea:has(#funcForm\\:keyword) dd:has(#funcForm\\:jugyoKamoku) {\n  display: none !important;\n}\n\n/* 復活した検索ボタン（黄色い btnAltColorSearch）を拡張のテーマ色（青）に合わせる．\n * 掲示一覧ページのものは上で非表示なので影響なし．他ページの検索ボタンが対象． */\nhtml.cit-restyle .btnSearch,\nhtml.cit-restyle .btnSearch.btnAltColorSearch {\n  background: #1558b0 !important;\n  background-image: none !important;\n  border-color: #1558b0 !important;\n  color: #fff !important;\n}\nhtml.cit-restyle .btnSearch .ui-button-text {\n  color: #fff !important;\n}\nhtml.cit-restyle .btnSearch:hover,\nhtml.cit-restyle .btnSearch:focus {\n  background: #0d3f85 !important;\n  border-color: #0d3f85 !important;\n}\n\n/* ===== 時間割ページ（Kmd00801）の時間割グリッドをコンパクトに =====\n * table.classTable は時間割ページ固有．曜日(thead th.headerYobi)×時限(tbody tr, 左端 td.colJigen)．\n * 1コマ = td.colYobi > div.jugyo-info（fontB=教科名 / div=教員 / div=講義室 / taniSu=単位 /\n * sign=複数回等 / シラバスボタン）．教科名・教員・講義室・シラバスだけに圧縮する． */\n\n/* 内側スクロール枠(.ofAuto)の高さ固定を解除して全体を表示 */\nhtml.cit-restyle .rishuArea .ofAuto {\n  overflow: visible !important;\n  height: auto !important;\n  max-height: none !important;\n}\n\n/* 表全体をコンパクト＆全幅・等幅列 */\nhtml.cit-restyle table.classTable {\n  width: 100% !important;\n  table-layout: fixed !important;\n  border-collapse: collapse !important;\n  font-size: 11px !important;\n}\nhtml.cit-restyle table.classTable th.headerYobi {\n  padding: 3px 2px !important;\n  font-size: 11px !important;\n  text-align: center !important;\n}\nhtml.cit-restyle table.classTable th.headerJigen,\nhtml.cit-restyle table.classTable td.colJigen {\n  width: 3.8em !important;\n}\n\n/* 左端の時限ラベル：元の番号を font-size:0 で隠し，「N限 / HH:00」を自前で表示する．\n * （元の番号とCSSの時刻が重なって文字化けしていたため，丸ごと自前表示に切替） */\nhtml.cit-restyle table.classTable td.colJigen {\n  text-align: center !important;\n  vertical-align: middle !important;\n  background: #eef2f6 !important;\n  padding: 2px !important;\n  white-space: pre-line !important;\n  font-size: 0 !important;\n}\nhtml.cit-restyle table.classTable td.colJigen::after {\n  color: #1f2933;\n  font-weight: 700;\n  font-size: 11px;\n  line-height: 1.35;\n}\n/* ※ content の \"\\A \" は改行．\\A の直後にスペースを入れて16進エスケープを終端すること．\n *   スペースが無いと \\A9 が © (U+00A9) 等の16進エスケープと解釈され文字化けする． */\nhtml.cit-restyle table.classTable tbody tr:nth-child(1) td.colJigen::after { content: \"1限\\A 9:00\"; }\nhtml.cit-restyle table.classTable tbody tr:nth-child(2) td.colJigen::after { content: \"2限\\A 10:00\"; }\nhtml.cit-restyle table.classTable tbody tr:nth-child(3) td.colJigen::after { content: \"3限\\A 11:00\"; }\nhtml.cit-restyle table.classTable tbody tr:nth-child(4) td.colJigen::after { content: \"4限\\A 12:00\"; }\nhtml.cit-restyle table.classTable tbody tr:nth-child(5) td.colJigen::after { content: \"5限\\A 13:00\"; }\nhtml.cit-restyle table.classTable tbody tr:nth-child(6) td.colJigen::after { content: \"6限\\A 14:00\"; }\nhtml.cit-restyle table.classTable tbody tr:nth-child(7) td.colJigen::after { content: \"7限\\A 15:00\"; }\nhtml.cit-restyle table.classTable tbody tr:nth-child(8) td.colJigen::after { content: \"8限\\A 16:00\"; }\nhtml.cit-restyle table.classTable tbody tr:nth-child(9) td.colJigen::after { content: \"9限\\A 17:00\"; }\nhtml.cit-restyle table.classTable tbody tr:nth-child(10) td.colJigen::after { content: \"10限\\A 18:00\"; }\n\n/* 授業セル：上寄せ・詰めた余白・白背景＋罫線 */\nhtml.cit-restyle table.classTable td.colYobi {\n  vertical-align: top !important;\n  padding: 2px 3px !important;\n  background: #fff !important;\n  border: 1px solid #dfe3e8 !important;\n}\n\n/* コマ内：単位・複数回/定員有 のバッジを隠す（教科名・教員・講義室・シラバスだけ残す） */\nhtml.cit-restyle table.classTable .jugyo-info .taniSu,\nhtml.cit-restyle table.classTable .jugyo-info .sign {\n  display: none !important;\n}\nhtml.cit-restyle table.classTable .jugyo-info {\n  line-height: 1.15 !important;\n}\n/* 教科名：太字・最大2行で省略（高さを詰める） */\nhtml.cit-restyle table.classTable .jugyo-info .fontB {\n  font-size: 11px !important;\n  font-weight: 700 !important;\n  margin-bottom: 1px !important;\n  display: -webkit-box;\n  -webkit-line-clamp: 2;\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n}\n/* 教員・講義室（＋ボタン行）は1行に省略．講義室のキャンパス名は … で切れて省スペース化 */\nhtml.cit-restyle table.classTable .jugyo-info > div:not(.fontB):not(.taniSu):not(.sign) {\n  white-space: nowrap !important;\n  overflow: hidden !important;\n  text-overflow: ellipsis !important;\n}\n/* シラバスボタン（アイコンのみ）を小さく右寄せ */\nhtml.cit-restyle table.classTable .jugyo-info .noTextIconLine {\n  margin-top: 0 !important;\n}\nhtml.cit-restyle table.classTable .jugyo-info .noTextIconLine button {\n  padding: 0 3px !important;\n  min-width: 0 !important;\n  height: 18px !important;\n  line-height: 16px !important;\n}\n\n/* ===== ダイアログ本文のスクロールが端に達しても後ろのページへ連鎖させない ===== */\nhtml.cit-restyle .ui-dialog-content {\n  overscroll-behavior: contain;\n}\n\n/* ===== スクロールバーを細く控えめに ===== */\nhtml.cit-restyle ::-webkit-scrollbar {\n  width: 10px;\n  height: 10px;\n}\nhtml.cit-restyle ::-webkit-scrollbar-thumb {\n  background: #c3cad3;\n  border-radius: 6px;\n}\n\n/* ===== 添付ファイルのプレビュー用オーバーレイ（attachment.js が生成） =====\n * 拡張が作る自前UIなので .cit-restyle スコープ外（常に適用）． */\n.cit-pdf-overlay {\n  position: fixed;\n  inset: 0;\n  z-index: 2147483000;\n  background: rgba(15, 23, 32, 0.6);\n  display: flex;\n  flex-direction: column;\n  padding: 24px;\n  box-sizing: border-box;\n}\n.cit-pdf-bar {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  background: #1f2933;\n  color: #fff;\n  padding: 8px 12px;\n  border-radius: 8px 8px 0 0;\n}\n.cit-pdf-name {\n  font-size: 13px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.cit-pdf-actions {\n  display: flex;\n  gap: 8px;\n  flex: 0 0 auto;\n}\n.cit-pdf-btn {\n  font: inherit;\n  font-size: 13px;\n  color: #1f2933;\n  background: #fff;\n  border: 1px solid #cbd2d9;\n  border-radius: 6px;\n  padding: 4px 10px;\n  cursor: pointer;\n  text-decoration: none;\n  line-height: 1.6;\n}\n.cit-pdf-btn:hover {\n  background: #eef2f6;\n}\n.cit-pdf-frame {\n  flex: 1 1 auto;\n  width: 100%;\n  border: none;\n  background: #fff;\n  border-radius: 0 0 8px 8px;\n}\n\n/* プレビュー取得中のスピナー（fetch中，iframe読み込み前に表示） */\n.cit-pdf-loading {\n  flex: 1 1 auto;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  gap: 12px;\n  background: #fff;\n  border-radius: 0 0 8px 8px;\n  color: #52606d;\n  font-size: 13px;\n}\n.cit-spinner {\n  width: 30px;\n  height: 30px;\n  border: 3px solid #dfe3e8;\n  border-top-color: #1558b0;\n  border-radius: 50%;\n  animation: cit-spin 0.8s linear infinite;\n}\n@keyframes cit-spin {\n  to {\n    transform: rotate(360deg);\n  }\n}\n\n/* ===== 添付ファイルのクイック一覧（掲示ダイアログ下部・attachment.js が生成） =====\n * 「添付資料を確認」を経由せず，ファイル名クリックだけでプレビューへ直接遷移させるための一覧． */\n.cit-attach-quicklist {\n  margin: 10px 2px 4px;\n  padding: 10px 12px;\n  background: #f6f8fa;\n  border: 1px solid #e1e6ea;\n  border-radius: 8px;\n}\n.cit-attach-quicklist-title {\n  font-size: 12px;\n  font-weight: 600;\n  color: #52606d;\n  margin: 0 0 6px;\n}\n.cit-attach-quicklist-item {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  width: 100%;\n  font: inherit;\n  font-size: 13px;\n  color: #1558b0;\n  background: none;\n  border: none;\n  border-radius: 6px;\n  padding: 6px 8px;\n  cursor: pointer;\n  text-align: left;\n}\n.cit-attach-quicklist-item:hover {\n  background: #eaf1fb;\n  text-decoration: underline;\n}\n.cit-attach-quicklist-item .fa {\n  flex: 0 0 auto;\n  color: #7b8794;\n}\n.cit-attach-quicklist-item span.cit-attach-name {\n  flex: 1 1 auto;\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n/* 「添付資料を確認」を自動展開すると添付一覧が別ダイアログで前面に出てくるので，\n * そのダイアログ（＋モーダルの遮蔽 <id>_modal）は開いたまま不可視にし，掲示ダイアログ下部の\n * クイック一覧だけを見せる．閉じずに残すのは，ダウンロードボタンの代理クリック先を保つため．\n * ※ visibility:hidden はサイトの `* { visibility: visible !important }` に負けるので opacity で隠す．\n * 自動展開の直後〜検出まで（html.cit-attach-suppress）は，掲示ダイアログ(.cit-attach-host)以外の\n * ダイアログを一時的に全部不可視にして一瞬のチラつきも抑える． */\n.cit-attach-filedlg,\n.cit-attach-filedlg-mask,\nhtml.cit-attach-suppress .ui-dialog:not(.cit-attach-host),\nhtml.cit-attach-suppress [id$=\"_modal\"]:not(.cit-attach-host-mask) {\n  opacity: 0 !important;\n  pointer-events: none !important;\n}\n\n/* ===== ローディングUI（AJAX中の表示・loading.js が生成） =====\n * ポータル本来の「画面中央のローディング表示」の代わりに出す，中央の小さなカード\n * （スピナー＋「読み込み中…」）．loading-bridge.js 経由の AJAX 開始/終了に連動する．\n * クリックを遮らない（pointer-events:none）．拡張が作る自前UIなので常時スタイルする． */\n.cit-loading-box {\n  position: fixed;\n  left: 50%;\n  top: 50%;\n  transform: translate(-50%, -50%) scale(0.96);\n  z-index: 2147483001; /* .cit-pdf-overlay より前面 */\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  padding: 14px 22px;\n  background: rgba(255, 255, 255, 0.97);\n  border: 1px solid #e1e6ea;\n  border-radius: 12px;\n  box-shadow: 0 8px 24px rgba(16, 24, 40, 0.18);\n  font-family: \"Hiragino Sans\", \"Yu Gothic\", \"Meiryo\", system-ui, sans-serif;\n  font-size: 14px;\n  font-weight: 600;\n  color: #1f2933;\n  opacity: 0;\n  pointer-events: none;\n  transition: opacity 0.18s ease, transform 0.18s ease;\n}\n.cit-loading-box.cit-loading-active {\n  opacity: 1;\n  transform: translate(-50%, -50%) scale(1);\n}\n.cit-loading-box .cit-spinner {\n  width: 22px;\n  height: 22px;\n  border-width: 3px;\n}\n\n/* ポータル本来のローディング表示（PrimeFaces BlockUI）を隠す．実機：\n *   div#wrap > div#j_idt40.ui-blockui-content（「loading...」＋バーの gif：img#j_idt42）\n *   遮蔽レイヤ = div.ui-blockui.ui-widget-overlay（AJAX中のクリック防止）\n * 中身（gif）は消し，遮蔽は「見えないが操作は止める」ままにしてサイト本来の挙動を保つ．\n * html.cit-loading-custom は loading.js が機能ON時だけ付ける（OFFなら元の表示に戻る）．\n * ※ visibility は使えない（サイトに `* { visibility: visible !important }` がある）． */\nhtml.cit-loading-custom .ui-blockui-content {\n  display: none !important;\n}\nhtml.cit-loading-custom .ui-blockui.ui-widget-overlay {\n  opacity: 0 !important;\n}\n\n/* ===== トップページのクイックランチャー（topage.js が生成） =====\n * 元メニューを代理クリックするアイコンボタン群．拡張生成UIなので常時スタイルする． */\n.cit-quicklaunch {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 10px;\n  justify-content: center;\n  padding: 14px;\n  margin: 0 0 14px;\n  background: #fff;\n  border: 1px solid #e1e6ea;\n  border-radius: 10px;\n  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.06);\n}\n.cit-ql-btn {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  gap: 6px;\n  min-width: 96px;\n  padding: 12px 14px;\n  background: #f6f8fa;\n  border: 1px solid #d9dee3;\n  border-radius: 10px;\n  cursor: pointer;\n  color: #1f2933;\n  font-size: 13px;\n  font-weight: 600;\n  font-family: inherit;\n}\n.cit-ql-btn:hover {\n  background: #e9eef3;\n  border-color: #1558b0;\n}\n.cit-ql-btn .fa {\n  font-size: 22px;\n  color: #1558b0;\n  line-height: 1;\n}\n.cit-ql-label {\n  line-height: 1.2;\n}\n\n/* ===== トップページ刷新（html.cit-top）＝ ランチャー＋スケジュール＋掲示 に整理 =====\n * トップ判定は topage.js が中身(#mainWrapBottomPortal)で行い html に cit-top を付与．\n * 動的な j_idtNNN は避け，安定した id/class で狙う． */\n\n/* 左カラム（インフォメーションのアイコン群・リンク）を隠す */\nhtml.cit-top .portalSub {\n  display: none !important;\n}\n\n/* スケジュール（右カラム）を全幅に広げる */\nhtml.cit-top .portalMain {\n  width: 100% !important;\n  float: none !important;\n  margin: 0 !important;\n}\n\n/* 掲示（重要/期限ありボックス）は先頭5件までに絞る */\nhtml.cit-top #portalSupport ul.ui-datalist-data > li.ui-datalist-item:nth-child(n + 6) {\n  display: none !important;\n}\n\n/* ===== トップページのスケジュールをコンパクトな縦リストに =====\n * 横並びは狭くなると文字が被るため，縦に詰めて表示する． */\nhtml.cit-top #portalSchedule2 ul.ui-datalist-data {\n  margin: 0 !important;\n  padding: 0 !important;\n}\nhtml.cit-top #portalSchedule2 ul.ui-datalist-data > li.ui-datalist-item {\n  margin: 0 0 6px !important;\n  padding: 0 !important;\n  list-style: none;\n}\nhtml.cit-top #portalSchedule2 .lessonArea .ui-panel-content {\n  padding: 8px 12px !important;\n}\n/* 授業メモの編集欄は省スペースのため画面外へ（見えなくするが要素は残す）．\n * ※ display:none にすると，サイトの「変更チェック(collectData)」の集計対象から外れ，\n *    初期スナップショット(initData)とズレて「編集中」誤判定→確認ダイアログが出る．\n *    そのため display:none ではなく，集計対象に残る「画面外へ飛ばす」方式にする． */\n/* メモ欄は「囲み(.lessonMemoArea)」が無く，入力欄 input.dispJugyoMemo が div.lessonMain の\n * 直下に置かれている（登録ボタン・スペーサ画像もその兄弟）．実在するクラス/属性で狙う．\n * 旧構造(.lessonMemoArea)も念のため残す． */\nhtml.cit-top .lessonMemoArea,\nhtml.cit-top input.dispJugyoMemo,\nhtml.cit-top .lessonMain input.dispJugyoMemo ~ img,\nhtml.cit-top .lessonMain input.dispJugyoMemo ~ button,\nhtml.cit-top button[title*=\"授業メモ\"] {\n  position: absolute !important;\n  left: -99999px !important;\n  top: 0 !important;\n  width: 300px !important;\n}\n\n/* クラスプロファイルボタン（.cpBtn）を「シラバス」ボタンの横に並べて表示 */\nhtml.cit-top #portalSchedule2 .lessonBtnArea {\n  display: flex !important;\n  align-items: center;\n  gap: 4px;\n}\n\n/* 「シラバス照会」ボタンの表記を「シラバス」に短縮（幅も詰める） */\nhtml.cit-top #portalSchedule2 .lessonBtnArea button:not(.cpBtn) .ui-button-text {\n  font-size: 0 !important;\n  padding: 4px 10px !important;\n}\nhtml.cit-top #portalSchedule2 .lessonBtnArea button:not(.cpBtn) .ui-button-text::after {\n  content: \"シラバス\";\n  font-size: 13px !important;\n}\n\n/* 教員（p）／ 教室（div）を1行にまとめる */\nhtml.cit-top #portalSchedule2 .lessonDetail > p,\nhtml.cit-top #portalSchedule2 .lessonDetail > div {\n  display: inline !important;\n  margin: 0 !important;\n  padding: 0 !important;\n}\nhtml.cit-top #portalSchedule2 .lessonDetail > div::before {\n  content: \" ／ \";\n  color: #9aa5b1;\n}\n\n/* 自前の「もっと見る（重要一覧へ）」リンク（topage.js が設置） */\n.cit-keiji-more {\n  display: inline-block;\n  margin: 6px 0 2px;\n  color: #1558b0 !important;\n  font-weight: 600;\n  text-decoration: none;\n}\n.cit-keiji-more:hover {\n  text-decoration: underline;\n}\n\n/* ===== 自動ログアウト画面の「ログインページへ」ボタン（session.js が生成） ===== */\n.cit-relogin-wrap {\n  text-align: center;\n  margin: 18px 0 4px;\n}\n.cit-relogin-btn {\n  display: inline-block;\n  background: #1558b0;\n  color: #fff !important;\n  text-decoration: none !important;\n  font-size: 15px;\n  font-weight: 600;\n  padding: 10px 24px;\n  border-radius: 8px;\n  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.2);\n}\n/* 共通のリンク色ルール（html.cit-restyle a）に負けないよう，白を高詳細度で明示 */\nhtml.cit-restyle a.cit-relogin-btn,\na.cit-relogin-btn {\n  color: #fff !important;\n}\n.cit-relogin-btn:hover {\n  background: #0d3f85 !important;\n}\n\n/* ===== 年度学期の切り替えバー（grades.js / timetable.js が生成） =====\n * 成績ページ・時間割ページ共通の「学期ごとに1つずつ表示」UI．\n * 拡張が作る自前UIなので .cit-restyle スコープ外（常に適用）． */\n.cit-term-pager {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 10px;\n  margin: 10px 0 12px;\n  padding: 8px 12px;\n  background: #fff;\n  border: 1px solid #e1e6ea;\n  border-radius: 10px;\n  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.06);\n}\n.cit-term-btn {\n  font: inherit;\n  font-size: 13px;\n  font-weight: 600;\n  color: #fff;\n  background: #1558b0;\n  border: 1px solid #1558b0;\n  border-radius: 6px;\n  padding: 5px 14px;\n  cursor: pointer;\n}\n.cit-term-btn:hover:not(:disabled) {\n  background: #0d3f85;\n  border-color: #0d3f85;\n}\n.cit-term-btn:disabled {\n  background: #cbd2d9;\n  border-color: #cbd2d9;\n  cursor: default;\n}\n.cit-term-select {\n  font: inherit;\n  font-size: 14px;\n  font-weight: 600;\n  color: #1f2933;\n  background: #fff;\n  border: 1px solid #c3cad3;\n  border-radius: 6px;\n  padding: 5px 10px;\n  min-width: 11em;\n  cursor: pointer;\n}\n.cit-term-current {\n  font-size: 11px;\n  font-weight: 600;\n  color: #1558b0;\n  background: #eaf1fb;\n  border-radius: 999px;\n  padding: 2px 10px;\n}\n\n/* 非選択の学期は画面外へ（display:none にすると「編集中」誤判定の恐れがあるため，\n * 授業メモ欄と同じく要素は残したまま視覚的にだけ隠す） */\n.cit-term-hidden {\n  position: absolute !important;\n  left: -99999px !important;\n  top: 0 !important;\n  width: 1000px !important;\n}\n\n/* まとめた連続コマの2つ目以降を隠す（topage.js の mergeLessons が付与）．\n * display:none だとメモ欄が変更チェック(collectData)の対象から外れて\n * 「編集中」誤判定が出るため，画面外送りで隠す． */\n.cit-lesson-merged {\n  position: absolute !important;\n  left: -99999px !important;\n  top: 0 !important;\n  width: 600px !important;\n}\n\n/* ===== 出欠状況確認（Atb005）の表 =====\n * 元の作り：本物の表1つ（.scroll_div.attendanceInfo）＋ 固定ヘッダ/固定列を再現するための\n * 複製3つ（.fixed_header_display_none_at_print）を重ね，JSでスクロールを同期している．\n * これが「左右で縦スクロールの感触が違う」「1回まで固定される」「◯と日付がズレる」\n * 「ズームが変」の原因．→ 複製を隠し，本物の内部スクロールをやめて，\n * ブラウザ標準の position:sticky で固定し直す． */\n\n/* 1) 複製テーブルを隠す（絶対配置なのでレイアウトには影響しない）．\n * ※ visibility:hidden は不可．このサイトには `* { visibility: visible !important }` という\n *   CSSがあり，親を hidden にしても子要素が強制的に表示され複製ヘッダが浮いて残る．\n *   display:none なら子要素から復活できない．表示専用の複製で入力欄も無いので安全． */\n/* ※ このクラスは div(.scroll_div) にも table にも付く（サイトのJSが複製を作り直すと\n *   付く場所が変わる）．どちらでも消えるよう，自身と子孫の両方を対象にする． */\nhtml.cit-restyle .scroll_div.attendanceInfo.fixed_header_display_none_at_print,\nhtml.cit-restyle .attendanceInfo .fixed_header_display_none_at_print {\n  display: none !important;\n}\n\n/* 2) 本物：内部スクロールをやめてページのスクロールに一本化（ズーム対応も自然になる） */\nhtml.cit-restyle .scroll_div.attendanceInfo:not(.fixed_header_display_none_at_print) {\n  overflow: visible !important;\n  height: auto !important;\n  max-height: none !important;\n}\n\n/* 3) この表では縞模様を白で打ち消す．\n * ※ 詳細度の設計が要注意．この指定は (0,3,4)：\n *    - 全体の縞模様 (0,2,3) には勝つ\n *    - 固定列の白背景 (0,3,4・後方に記述) には負ける → 固定列は不透明を保てる\n *    - 状態色 td.height:has(...) (0,4,2) には負ける → 出席/欠席/休講の色が残る\n *   `td:nth-child(n+3)` のように条件を足すと状態色に勝ってしまい色が消えるので付けないこと．\n *   `transparent` にすると固定列が透けるので白で塗ること． */\nhtml.cit-restyle .attendanceInfo table tr:nth-child(even) > td {\n  background-color: #fff !important;\n}\n\n/* 4) ヘッダ行を上に固定 */\nhtml.cit-restyle .attendanceInfo table thead th {\n  position: sticky !important;\n  top: 0;\n  z-index: 3;\n  background: #eef2f6 !important;\n}\n\n/* 5) 「曜日時限」「授業科目」だけを左に固定（1回以降は横スクロールする） */\nhtml.cit-restyle .attendanceInfo table tr > th:nth-child(1),\nhtml.cit-restyle .attendanceInfo table tr > td:nth-child(1) {\n  position: sticky !important;\n  left: 0;\n  z-index: 2;\n  width: 6.5em !important;\n  min-width: 6.5em !important;\n  background: #fff !important;\n}\nhtml.cit-restyle .attendanceInfo table tr > th:nth-child(2),\nhtml.cit-restyle .attendanceInfo table tr > td:nth-child(2) {\n  position: sticky !important;\n  left: 6.5em;\n  z-index: 2;\n  width: 24em !important;\n  min-width: 24em !important;\n  background: #fff !important;\n}\n/* 固定ヘッダと固定列が交差する左上は最前面に */\nhtml.cit-restyle .attendanceInfo table thead th:nth-child(1),\nhtml.cit-restyle .attendanceInfo table thead th:nth-child(2) {\n  z-index: 4;\n  background: #eef2f6 !important;\n}\n\n/* 6) 出欠セル：日付とマークを中央揃えで縦に並べる．\n * ※ td に display:flex を指定すると「表のセル」でなくなり行が崩れるため，\n *   attendance.js が中身を div.cit-att-cell で包み，そのラッパを flex にする．\n *   ラッパ内は「日付 → マーク」の順に並べ替え済み． */\nhtml.cit-restyle .attendanceInfo td.height {\n  text-align: center !important;\n  vertical-align: middle !important;\n  padding: 4px 2px !important;\n}\nhtml.cit-restyle .attendanceInfo .cit-att-cell {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  gap: 1px;\n}\nhtml.cit-restyle .attendanceInfo .cit-att-cell > p.jugyoDate {\n  margin: 0 !important;\n  font-size: 11px !important;\n  line-height: 1.25 !important;\n  color: #52606d !important;\n  white-space: nowrap;\n}\nhtml.cit-restyle .attendanceInfo .cit-att-cell > .jugyoList {\n  display: block !important;\n  background: transparent !important;\n  line-height: 1.2 !important;\n  padding: 0 !important;\n}\nhtml.cit-restyle .attendanceInfo .syuketsuKbnMark {\n  font-size: 17px !important;\n  line-height: 1.1 !important;\n}\n\n/* 7) 状態の色は「浮いた四角」ではなくセル全体に敷く\n * （ラッパで包んだので直下ではなく子孫として判定する） */\nhtml.cit-restyle .attendanceInfo td.height:has(.attendance) {\n  background: #e8f5e9 !important;\n}\nhtml.cit-restyle .attendanceInfo td.height:has(.absence) {\n  background: #fdecec !important;\n}\nhtml.cit-restyle .attendanceInfo td.height:has(.nolecture) {\n  background: #f1f3f5 !important;\n}\n\n/* ---- src/mobile/mobile.css ---- */\n/*\n * NexPortal Mobile - スマホ向けの追加スタイル（mobile.css）\n *\n * restyle.css（Chrome 拡張版と共通の土台）の「あと」に読み込まれ，スマホで困る所だけを上書きする．\n * restyle.css 本体はなるべく触らない（拡張版の更新を取り込みやすくするため）．\n *\n * 構成：\n *   A. 設定ボタン・設定パネル（settings-panel.js が生成．自前UIなので常時スタイルする）\n *   B. タッチ端末向けの添付ビューア（attachment.js が生成）\n *   C. タッチ端末共通の調整（画面幅に関係なく効く）\n *   D. 狭い画面（幅 700px 以下）向けのレイアウト調整\n *\n * 【注意】D はポータルの実機（スマホ）表示を確認しながら詰める前提の初期値．\n *   ポータルの HTML 構造は docs/selectors.md（PC表示で調査）に基づいている．\n */\n\n/* ===== A. 設定ボタン・設定パネル ===== */\nbutton.cit-set-fab.cit-set-fab {\n  position: fixed;\n  right: calc(12px + env(safe-area-inset-right, 0px));\n  bottom: calc(12px + env(safe-area-inset-bottom, 0px));\n  z-index: 2147482000; /* 添付ビューア(.cit-pdf-overlay)より背面 */\n  width: 44px;\n  height: 44px;\n  padding: 0;\n  margin: 0;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 22px;\n  line-height: 1;\n  color: #1f2933;\n  background: rgba(255, 255, 255, 0.92);\n  border: 1px solid #cbd2d9;\n  border-radius: 50% !important;\n  box-shadow: 0 2px 8px rgba(16, 24, 40, 0.22);\n  opacity: 0.7;\n  cursor: pointer;\n  -webkit-tap-highlight-color: transparent;\n}\n.cit-set-fab:active {\n  opacity: 1;\n  background: #eef2f6;\n}\n@media print {\n  .cit-set-fab {\n    display: none !important;\n  }\n}\n\n.cit-set-backdrop {\n  position: fixed;\n  inset: 0;\n  z-index: 2147483002; /* ローディングカードより前面 */\n  display: flex;\n  align-items: flex-end;\n  justify-content: center;\n  background: rgba(15, 23, 32, 0.5);\n}\n.cit-set-sheet {\n  box-sizing: border-box;\n  display: flex;\n  flex-direction: column;\n  width: 100%;\n  max-width: 520px;\n  max-height: 88vh;\n  max-height: 88dvh;\n  background: #fff;\n  color: #1f2933;\n  border-radius: 16px 16px 0 0;\n  box-shadow: 0 -8px 24px rgba(16, 24, 40, 0.25);\n  font-family: \"Hiragino Sans\", \"Yu Gothic\", \"Meiryo\", system-ui, sans-serif;\n  font-size: 15px;\n  line-height: 1.5;\n  text-align: left;\n  animation: cit-set-up 0.2s ease-out;\n}\n@keyframes cit-set-up {\n  from {\n    transform: translateY(24px);\n  }\n  to {\n    transform: none;\n  }\n}\n/* PCなど広い画面では中央のダイアログとして出す */\n@media (min-width: 701px) {\n  .cit-set-backdrop {\n    align-items: center;\n  }\n  .cit-set-sheet {\n    border-radius: 16px;\n  }\n}\n.cit-set-head {\n  flex: 0 0 auto;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  padding: 12px 16px;\n  border-bottom: 1px solid #e4e7eb;\n}\n.cit-set-title {\n  font-size: 16px;\n  font-weight: 700;\n}\nbutton.cit-set-close.cit-set-close {\n  font: inherit;\n  font-size: 14px;\n  font-weight: 600;\n  color: #1558b0;\n  background: #eaf1fb;\n  border: none;\n  border-radius: 8px !important;\n  padding: 8px 14px;\n  min-height: 40px;\n  cursor: pointer;\n}\n.cit-set-body {\n  flex: 1 1 auto;\n  overflow-y: auto;\n  -webkit-overflow-scrolling: touch;\n  overscroll-behavior: contain;\n  padding: 12px 16px calc(16px + env(safe-area-inset-bottom, 0px));\n}\n.cit-set-disclaimer {\n  margin: 0 0 12px;\n  padding: 8px 10px;\n  font-size: 12px;\n  line-height: 1.6;\n  color: #7a4a00;\n  background: #fff6e5;\n  border: 1px solid #f0d99a;\n  border-radius: 8px;\n}\n.cit-set-section {\n  margin: 0 0 12px;\n  padding: 0 0 6px;\n  border-bottom: 1px solid #e4e7eb;\n}\n.cit-set-section-title {\n  margin: 0 0 2px;\n  font-size: 12px;\n  font-weight: 700;\n  color: #7b8794;\n}\n.cit-set-row {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  min-height: 44px;\n  padding: 6px 0;\n  margin: 0;\n  cursor: pointer;\n  font-weight: 400;\n}\n.cit-set-row-indent {\n  margin-left: 34px;\n}\n.cit-set-check {\n  flex: 0 0 auto;\n  width: 22px !important;\n  height: 22px !important;\n  margin: 0 !important;\n  accent-color: #1558b0;\n}\n.cit-set-text {\n  display: flex;\n  flex-direction: column;\n  min-width: 0;\n}\n.cit-set-label {\n  font-size: 15px;\n  color: #1f2933;\n}\n.cit-set-note {\n  font-size: 12px;\n  color: #7b8794;\n}\n.cit-set-hint {\n  margin: 0 0 12px;\n  font-size: 12px;\n  color: #52606d;\n}\n.cit-set-foot {\n  display: flex;\n  align-items: center;\n  flex-wrap: wrap;\n  gap: 4px 14px;\n  font-size: 12px;\n  color: #7b8794;\n}\n.cit-set-foot .cit-set-link,\nhtml.cit-restyle .cit-set-foot .cit-set-link {\n  color: #1558b0 !important;\n  text-decoration: none;\n}\n.cit-set-version {\n  margin-left: auto;\n}\n\n/* ===== B. タッチ端末向けの添付ビューア =====\n * iOS Safari は iframe 内の PDF を1ページ目しか表示できないので，iframe の代わりに\n * 「開く」「保存」の大きなボタン（画像はその場で表示）を出す．クラスは attachment.js が付ける． */\n.cit-pdf-overlay.cit-pdf-touch {\n  padding: calc(8px + env(safe-area-inset-top, 0px)) 8px calc(8px + env(safe-area-inset-bottom, 0px));\n}\n.cit-pdf-touch .cit-pdf-bar {\n  padding: 8px 10px;\n}\n.cit-pdf-touch .cit-pdf-close {\n  min-height: 36px;\n  padding: 4px 14px;\n}\n.cit-pdf-touch-body {\n  flex: 1 1 auto;\n  min-height: 0;\n  display: flex;\n  flex-direction: column;\n  align-items: stretch;\n  gap: 12px;\n  padding: 16px;\n  overflow: auto;\n  -webkit-overflow-scrolling: touch;\n  overscroll-behavior: contain;\n  background: #fff;\n  border-radius: 0 0 8px 8px;\n}\n.cit-pdf-image {\n  display: block;\n  max-width: 100%;\n  height: auto;\n  margin: 0 auto;\n}\n.cit-pdf-filecard {\n  flex: 1 1 auto;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  gap: 10px;\n  text-align: center;\n  color: #52606d;\n}\n.cit-pdf-filecard .fa {\n  font-size: 44px;\n  color: #9aa5b1;\n}\n.cit-pdf-filecard-name {\n  margin: 0;\n  font-size: 15px;\n  font-weight: 600;\n  color: #1f2933;\n  word-break: break-all;\n}\n.cit-pdf-filecard-note {\n  margin: 0;\n  font-size: 13px;\n}\n.cit-pdf-touch-actions {\n  flex: 0 0 auto;\n  display: flex;\n  gap: 10px;\n}\n.cit-pdf-touch-actions .cit-pdf-btn {\n  flex: 1 1 0;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  min-height: 48px;\n  font-size: 16px;\n  font-weight: 600;\n  border-radius: 10px;\n}\n.cit-pdf-touch-actions .cit-pdf-btn-primary,\nhtml.cit-restyle .cit-pdf-touch-actions a.cit-pdf-btn-primary {\n  color: #fff !important;\n  background: #1558b0;\n  border-color: #1558b0;\n}\n\n/* ===== C. タッチ端末共通の調整 ===== */\n\n/* 横向きにしたときなどに iOS が文字サイズを勝手に拡大するのを止める */\nhtml.cit-restyle {\n  -webkit-text-size-adjust: 100%;\n  text-size-adjust: 100%;\n}\n\n@media (hover: none) and (pointer: coarse) {\n  /* iOS は 16px 未満の入力欄にフォーカスすると画面を自動ズームする．16px にして防ぐ */\n  html.cit-restyle input[type=\"text\"],\n  html.cit-restyle input[type=\"password\"],\n  html.cit-restyle input[type=\"search\"],\n  html.cit-restyle select,\n  html.cit-restyle textarea,\n  .cit-term-select {\n    font-size: 16px !important;\n  }\n\n  /* 拡張が作るボタン類を指で押しやすい大きさに */\n  .cit-term-btn,\n  .cit-term-select {\n    min-height: 40px;\n  }\n  .cit-attach-quicklist-item {\n    min-height: 44px;\n    font-size: 15px;\n  }\n  .cit-relogin-btn {\n    padding: 14px 28px;\n    font-size: 16px;\n  }\n}\n\n/* ===== D. 狭い画面（幅 700px 以下）向けのレイアウト調整 ===== */\n@media (max-width: 700px) {\n  /* --- トップページのクイックランチャー：3列のグリッドに --- */\n  .cit-quicklaunch {\n    display: grid;\n    grid-template-columns: repeat(3, minmax(0, 1fr));\n    gap: 8px;\n    padding: 10px;\n  }\n  .cit-ql-btn {\n    min-width: 0;\n    min-height: 68px;\n    padding: 10px 4px;\n  }\n\n  /* --- 掲示一覧のカード：1行に詰め込まず，「カテゴリ・日付」→「タイトル（2行まで）」→「操作ボタン」 --- */\n  html.cit-restyle div.alignRight:has(> dl.keiji) {\n    flex-wrap: wrap;\n    gap: 6px 10px;\n    padding: 10px 12px !important;\n  }\n  html.cit-restyle dl.keiji {\n    flex: 1 1 0;\n    flex-wrap: wrap;\n    gap: 4px 8px;\n  }\n  html.cit-restyle .keiji a.ui-commandlink {\n    order: 1; /* タイトルを最後（＝2行目）へ．日付のテキストは order:0 のまま1行目に残る */\n    flex: 1 1 100%;\n    white-space: normal;\n    display: -webkit-box !important;\n    -webkit-box-orient: vertical;\n    -webkit-line-clamp: 2;\n    line-height: 1.45 !important;\n  }\n  html.cit-restyle div.alignRight:has(> dl.keiji) > .inlineBlock {\n    flex: 1 1 100%;\n    text-align: right;\n  }\n\n  /* --- 掲示タブ：折り返さず横スクロール --- */\n  html.cit-restyle #funcForm\\:tabArea > ul.ui-tabs-nav {\n    display: flex !important;\n    flex-wrap: nowrap;\n    overflow-x: auto;\n    -webkit-overflow-scrolling: touch;\n    scrollbar-width: none;\n  }\n  html.cit-restyle #funcForm\\:tabArea > ul.ui-tabs-nav::-webkit-scrollbar {\n    display: none;\n  }\n  html.cit-restyle #funcForm\\:tabArea > ul.ui-tabs-nav > li {\n    flex: 0 0 auto;\n    float: none !important;\n    white-space: nowrap;\n  }\n\n  /* --- 掲示の検索欄：横幅いっぱいに --- */\n  html.cit-restyle div.searchArea:has(#funcForm\\:keyword) #funcForm\\:keyword {\n    box-sizing: border-box;\n    width: 100% !important;\n    max-width: 100% !important;\n  }\n\n  /* --- 掲示詳細などのダイアログ：本文の高さを画面に収める（PCでは600px固定） --- */\n  html.cit-restyle .ui-dialog.rx-dialog .ui-dialog-content {\n    max-height: calc(100vh - 150px) !important;\n    max-height: calc(100dvh - 150px) !important;\n    -webkit-overflow-scrolling: touch;\n  }\n  html.cit-restyle .ui-dialog {\n    max-width: 100vw !important;\n  }\n\n  /* --- 時間割：列を潰さず，表の中だけ横スクロールさせる --- */\n  html.cit-restyle .rishuArea .ofAuto {\n    overflow-x: auto !important;\n    -webkit-overflow-scrolling: touch;\n  }\n  html.cit-restyle table.classTable {\n    min-width: 640px;\n  }\n\n  /* --- 出欠状況：左に固定する「授業科目」列を細くして，出欠マークの見える範囲を広げる --- */\n  html.cit-restyle .attendanceInfo table tr > th:nth-child(1),\n  html.cit-restyle .attendanceInfo table tr > td:nth-child(1) {\n    width: 3.6em !important;\n    min-width: 3.6em !important;\n    padding-left: 4px !important;\n    padding-right: 4px !important;\n  }\n  html.cit-restyle .attendanceInfo table tr > th:nth-child(2),\n  html.cit-restyle .attendanceInfo table tr > td:nth-child(2) {\n    left: 3.6em;\n    width: 8.5em !important;\n    min-width: 8.5em !important;\n    white-space: normal !important;\n    word-break: break-all;\n    font-size: 12px !important;\n    line-height: 1.35 !important;\n  }\n\n  /* --- 学期の切り替えバー：幅に収める --- */\n  .cit-term-pager {\n    flex-wrap: wrap;\n    gap: 6px;\n    padding: 8px;\n  }\n  .cit-term-select {\n    flex: 1 1 auto;\n    min-width: 0;\n  }\n  .cit-term-btn {\n    padding: 5px 10px;\n  }\n  /* --- 表のセル余白を少し詰める（横幅の節約） --- */\n  html.cit-restyle td,\n  html.cit-restyle th {\n    padding: 6px 6px !important;\n  }\n}\n";
const NEXPORTAL_PAGE_BRIDGE = "// NexPortal Mobile - ローディングUI用ブリッジ（page-bridge.js）※ページ側の世界で動く\n//\n// 【スマホ版の注意】Chrome 拡張版では manifest の \"world\": \"MAIN\" でページ側に置いていたが，\n// ユーザースクリプトでは inject.js が <script> 要素としてページへ差し込む（中身は同じ）．\n// 差し込みに成功した合図として <html data-cit-bridge=\"1\"> を付ける（inject.js が確認する）．\n//\n// PrimeFaces は AJAX の送信/完了/失敗を jQuery の `$(document).trigger('pfAjaxSend')` 等で\n// 通知する．jQuery の trigger はネイティブの DOM イベントを発火しないため，拡張の content script\n// （隔離された世界．ページの jQuery も見えない）からは addEventListener では受け取れない．\n// そこで manifest の \"world\": \"MAIN\" でページ側に置いたこの小さなスクリプトが jQuery イベントを\n// 購読し，ネイティブの CustomEvent に変換して document へ流す．loading.js がそれを受け取る．\n//\n// やるのはこの変換だけ．通信・DOM改変・ページ変数の書き換え・データの読み取りはしない．\n//\n// 購読するイベント：\n//   pfAjaxSend / pfAjaxComplete / pfAjaxError … PrimeFaces 5 以降（1リクエストごとに対）\n//   ajaxStart / ajaxStop                      … jQuery のグローバル ajax イベント（古い PrimeFaces 向け．\n//                                                ajaxStop は「全部終わった」合図なので idle として流す）\n\n(() => {\n  document.documentElement.setAttribute(\"data-cit-bridge\", \"1\");\n\n  function emit(name) {\n    document.dispatchEvent(new CustomEvent(name));\n  }\n\n  function bind() {\n    const $ = window.jQuery;\n    if (!$ || !$.fn) return false;\n    const d = $(document);\n    d.on(\"pfAjaxSend\", () => emit(\"cit-ajax-start\"));\n    d.on(\"pfAjaxComplete pfAjaxError\", () => emit(\"cit-ajax-end\"));\n    d.on(\"ajaxStart\", () => emit(\"cit-ajax-start\"));\n    d.on(\"ajaxStop\", () => emit(\"cit-ajax-idle\"));\n    return true;\n  }\n\n  if (bind()) return;\n  // document_idle で走るので通常は jQuery が居るが，念のため最大10秒待つ\n  let tries = 50;\n  const timer = setInterval(() => {\n    if (bind() || --tries <= 0) clearInterval(timer);\n  }, 200);\n})();\n";

// ======== src/mobile/shim.js ========
// NexPortal Mobile - chrome.* 互換レイヤ（shim.js）
//
// 目的：src/content/*.js は Chrome 拡張版（cit-portal-ext）と同じコードをそのまま使う．
//   それらが呼ぶ chrome.storage.local.get / set，chrome.storage.onChanged，
//   chrome.runtime.lastError / getManifest だけを，ユーザースクリプトの保存領域
//   （GM.getValue / GM.setValue）の上に再現する．
//
// 保存先：
//   1) GM.getValue / GM.setValue（Userscripts・Tampermonkey 等の保存領域．端末内のみ）
//   2) 使えない環境では，ポータルのオリジンの localStorage にフォールバック（これも端末内のみ）
//   どちらも外部送信はしない．設定は1つのキーに JSON でまとめて保存する．
//
// ビルド時に build.mjs が NEXPORTAL_VERSION を先に定義する．

const chrome = (() => {
  const STORE_KEY = "nexportal-settings";
  const hasGM =
    typeof GM !== "undefined" &&
    GM &&
    typeof GM.getValue === "function" &&
    typeof GM.setValue === "function";

  const listeners = [];
  let cache = null; // 読み込み済みの設定（オブジェクト）
  let loading = null; // 読み込み中の Promise
  let writeQueue = Promise.resolve(); // 書き込みの順番待ち

  function parse(raw) {
    try {
      const v = typeof raw === "string" ? JSON.parse(raw) : raw;
      return v && typeof v === "object" ? v : {};
    } catch (_) {
      return {};
    }
  }

  async function readRaw() {
    if (hasGM) {
      try {
        return parse(await GM.getValue(STORE_KEY, "{}"));
      } catch (_) {}
    }
    try {
      return parse(localStorage.getItem(STORE_KEY) || "{}");
    } catch (_) {
      return {};
    }
  }

  async function writeRaw(all) {
    const raw = JSON.stringify(all);
    if (hasGM) {
      try {
        await GM.setValue(STORE_KEY, raw);
        return;
      } catch (_) {}
    }
    try {
      localStorage.setItem(STORE_KEY, raw);
    } catch (_) {}
  }

  function load() {
    if (cache) return Promise.resolve(cache);
    if (!loading) {
      loading = readRaw().then((all) => {
        cache = all;
        loading = null;
        return all;
      });
    }
    return loading;
  }

  function fire(changes) {
    if (!Object.keys(changes).length) return;
    for (const fn of listeners.slice()) {
      try {
        fn(changes, "local");
      } catch (_) {}
    }
  }

  function diff(before, after) {
    const changes = {};
    for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
      if (before[k] !== after[k]) changes[k] = { oldValue: before[k], newValue: after[k] };
    }
    return changes;
  }

  // 別タブで設定を変えた場合に備え，タブが前面に戻ったら読み直して差分を通知する
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible" || !cache) return;
    const before = cache;
    readRaw().then((all) => {
      cache = all;
      fire(diff(before, all));
    });
  });

  return {
    runtime: {
      lastError: null,
      getManifest: () => ({ version: NEXPORTAL_VERSION }),
    },
    storage: {
      local: {
        // chrome.storage.local.get(既定値オブジェクト, callback) の形だけ対応
        get(defaults, cb) {
          load().then(() => {
            const all = cache;
            const out = Object.assign({}, defaults);
            for (const k of Object.keys(defaults || {})) {
              if (k in all) out[k] = all[k];
            }
            cb(out);
          });
        },
        set(obj, cb) {
          load().then(() => {
            // 連続して呼ばれても取りこぼさないよう，必ず「最新の cache」を土台にする
            const before = cache;
            const next = Object.assign({}, before, obj);
            const changes = diff(before, next);
            cache = next;
            // 書き込みは1件ずつ順番に（前の書き込みを新しい書き込みが追い越さないように）
            writeQueue = writeQueue
              .then(() => writeRaw(next))
              .then(() => {
                fire(changes);
                if (cb) cb();
              });
          });
        },
      },
      onChanged: {
        addListener(fn) {
          listeners.push(fn);
        },
      },
    },
  };
})();

// ======== src/mobile/inject.js ========
(function () {
// NexPortal Mobile - スタイルとページ側ブリッジの差し込み（inject.js）
//
// Chrome 拡張版では manifest.json が担っていた2つの仕事を，ユーザースクリプトで再現する．
//   1) restyle.css（＋スマホ用 mobile.css）を <style> として差し込む（manifest の "css"）
//   2) page-bridge.js をページ側の世界で動かす（manifest の "world": "MAIN"）
//
// ビルド時に build.mjs が NEXPORTAL_CSS / NEXPORTAL_PAGE_BRIDGE（どちらも文字列）を先に定義する．
// 通信はしない．

(() => {
  // --- 1) スタイル：できるだけ早く（document-start）入れて，素の見た目が一瞬見えるのを減らす ---
  const style = document.createElement("style");
  style.id = "nexportal-style";
  style.textContent = NEXPORTAL_CSS;

  function putStyle() {
    const parent = document.head || document.documentElement;
    if (!parent) return false;
    parent.appendChild(style);
    return true;
  }
  if (!putStyle()) {
    const obs = new MutationObserver(() => {
      if (putStyle()) obs.disconnect();
    });
    obs.observe(document, { childList: true });
  }

  // --- 2) ページ側ブリッジ：<script> 要素として差し込む（その場で同期実行される） ---
  // ページの CSP などで実行できなかった場合は <html data-cit-bridge> が付かないので，
  // html.cit-no-bridge を付けて loading.js に知らせる（ポータル本来のローディング表示に任せる）．
  function injectBridge() {
    const root = document.documentElement;
    try {
      const s = document.createElement("script");
      s.textContent = NEXPORTAL_PAGE_BRIDGE;
      root.appendChild(s);
      s.remove();
    } catch (_) {}
    if (!root.hasAttribute("data-cit-bridge")) root.classList.add("cit-no-bridge");
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectBridge, { once: true });
  } else {
    injectBridge();
  }
})();
})();

// ======== src/content/restyle.js ========
(function () {
// NexPortal - content script
//
// 役割：<html> にクラスを付け外しするだけ．実際の見た目は restyle.css が担当する．
// ネットワーク送信は一切しない．chrome.storage.local から設定を読むのみ．
//
// 設定キー（chrome.storage.local）:
//   enabled    : boolean  改変全体の ON/OFF（デフォルト true）
//   largeText  : boolean  文字を少し大きくする（デフォルト false）

"use strict";

const ROOT = document.documentElement;
const CLASS_ENABLED = "cit-restyle";
const CLASS_LARGE = "cit-restyle-large";

const DEFAULTS = { enabled: true, largeText: false };

// document_start 時点で描画前にスタイルを当ててちらつきを防ぐ．
// デフォルトは ON なので，まず即座にクラスを付けておき，
// storage 読み込み後に OFF なら外す（OFF は非デフォルトなので実害は最小）．
ROOT.classList.add(CLASS_ENABLED);

function apply(settings) {
  const s = Object.assign({}, DEFAULTS, settings);
  ROOT.classList.toggle(CLASS_ENABLED, s.enabled);
  ROOT.classList.toggle(CLASS_LARGE, s.enabled && s.largeText);
}

// 初回読み込み
chrome.storage.local.get(DEFAULTS, (settings) => {
  // 拡張コンテキスト消失時などのエラーは握りつぶす（ポータル側に影響を出さない）
  if (chrome.runtime.lastError) return;
  apply(settings);
});

// 設定画面での変更をリアルタイム反映
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  chrome.storage.local.get(DEFAULTS, (settings) => {
    if (chrome.runtime.lastError) return;
    apply(settings);
  });
});

// ===== 項目名セルの検出（.cit-label-cell）=====
// 学籍情報照会などの「項目名｜値」形式テーブルは，項目名が <th> ではなく，サイトCSSで
// 「濃い背景＋白文字」にした <td> だった（実機確認）．クラス名はページごとに違う可能性が
// あるので，計算スタイルの文字色が白系のセル＝項目名セルと見なしてクラスを付け，
// restyle.css 側で単色に統一する．色を見るだけで，中身のテキストは読まない．
const labelChecked = new WeakSet();

function isLightColor(rgb) {
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(rgb || "");
  if (!m) return false;
  const lum = 0.299 * Number(m[1]) + 0.587 * Number(m[2]) + 0.114 * Number(m[3]);
  return lum > 200;
}

function markLabelCells() {
  if (!ROOT.classList.contains(CLASS_ENABLED)) return;
  // レイアウト用の入れ子テーブルを持つセルは除外（誤検出を減らす）
  for (const td of document.querySelectorAll("table td:not(.cit-label-cell):not(:has(table))")) {
    if (labelChecked.has(td)) continue;
    labelChecked.add(td);
    if (!(td.textContent || "").trim()) continue;
    if (isLightColor(getComputedStyle(td).color)) td.classList.add("cit-label-cell");
  }
}

function startLabelCellWatch() {
  markLabelCells();
  let scheduled = false;
  const obs = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      markLabelCells();
    });
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startLabelCellWatch, { once: true });
} else {
  startLabelCellWatch();
}

// 掲示の検索：黄色い検索ボタンをCSSで隠すため，入力欄で Enter を押したら
// 元の検索ボタン(#funcForm:search)のクリックを呼んで検索を実行する．
// （サイト本来の検索を叩くだけ．外部送信はしない）
// ※ ajax で検索エリアが再描画されても効くよう document への委譲で登録する．
document.addEventListener(
  "keydown",
  (e) => {
    if (e.key !== "Enter") return;
    // IME変換確定のEnterを検索実行と誤認しない（日本語入力対策）．
    // 変換中は isComposing=true，環境によっては keyCode=229 になる．
    if (e.isComposing || e.keyCode === 229) return;
    // 改変OFF時は素の挙動に任せる（ボタンも表示されている）
    if (!ROOT.classList.contains(CLASS_ENABLED)) return;
    const target = e.target;
    if (!target || !target.closest || !target.closest(".searchArea")) return;
    const btn = document.getElementById("funcForm:search");
    if (btn) {
      e.preventDefault();
      btn.click();
    }
  },
  true
);

// 掲示ダイアログ内のスクロール速度を通常のブラウザと同じにする．
// このポータルはホイールを二重に処理してスクロールが速すぎるため，
// ダイアログ内では自前で標準量だけスクロールし，サイト側の処理を止める．
// 対象スクロール要素：#bsd00702:dialog（.ui-dialog.rx-dialog）内の .ui-dialog-content
document.addEventListener(
  "wheel",
  (e) => {
    if (!ROOT.classList.contains(CLASS_ENABLED)) return;
    const scroller =
      e.target &&
      e.target.closest &&
      e.target.closest(".ui-dialog.rx-dialog .ui-dialog-content");
    if (!scroller) return;
    let dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 16; // 行単位 → おおよそのpx
    else if (e.deltaMode === 2) dy *= scroller.clientHeight; // ページ単位
    scroller.scrollTop += dy;
    e.preventDefault();
    e.stopImmediatePropagation();
  },
  { capture: true, passive: false }
);

// ===== モーダル中は後ろのページを動かさない（スクロールロック）=====
// 掲示ダイアログやローディング中の遮蔽（.ui-widget-overlay）はクリックは止めるがホイールは
// 止めないため，カーソルがダイアログの外にあると後ろのページがスクロールしてしまう．
// 遮蔽が表示されている間（または拡張のローディングカード表示中）は，開いているダイアログの
// 本文（.ui-dialog-content）以外でのホイール／タッチ／スクロールキーを止める．
// ※ body に overflow:hidden を当てる方式はスクロールバー分の幅が変わって画面が横に跳ねるので，
//    イベントを止める方式にする（上のダイアログ内ホイール処理と同じ考え方）．
const FILE_DLG_MASK = "cit-attach-filedlg-mask"; // attachment.js が不可視化した添付一覧の遮蔽は数えない
const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);

function isShown(el) {
  return !!el && getComputedStyle(el).display !== "none";
}

function modalActive() {
  for (const o of document.querySelectorAll(".ui-widget-overlay")) {
    if (o.classList.contains(FILE_DLG_MASK)) continue;
    if (isShown(o)) return true;
  }
  return !!document.querySelector(".cit-loading-box.cit-loading-active");
}

// 開いているダイアログの本文の中か（そこでのスクロールは通す）
function insideOpenDialog(target, contentOnly) {
  if (!target || !target.closest) return false;
  const dlg = target.closest(".ui-dialog");
  if (!dlg || !isShown(dlg) || dlg.classList.contains("cit-attach-filedlg")) return false;
  return contentOnly ? !!target.closest(".ui-dialog-content") : true;
}

function isEditable(target) {
  return (
    !!target &&
    !!target.closest &&
    !!target.closest("input, textarea, select, [contenteditable=''], [contenteditable='true']")
  );
}

function blockScroll(e) {
  if (!ROOT.classList.contains(CLASS_ENABLED)) return;
  if (!modalActive()) return;
  if (insideOpenDialog(e.target, true)) return;
  // 【スマホ版】拡張が作る自前UI（添付ビューア・設定パネル）の中は指でスクロールできるよう通す
  if (e.target && e.target.closest && e.target.closest(".cit-pdf-overlay, .cit-set-sheet")) return;
  e.preventDefault();
}

document.addEventListener("wheel", blockScroll, { capture: true, passive: false });
document.addEventListener("touchmove", blockScroll, { capture: true, passive: false });
document.addEventListener(
  "keydown",
  (e) => {
    if (!SCROLL_KEYS.has(e.key)) return;
    if (!ROOT.classList.contains(CLASS_ENABLED)) return;
    if (!modalActive()) return;
    // ダイアログ内のボタン操作（Space）や入力欄のキーは通す
    if (insideOpenDialog(e.target, false) || isEditable(e.target)) return;
    e.preventDefault();
  },
  true
);
})();

// ======== src/content/loading.js ========
(function () {
// NexPortal - ローディングUIの刷新（loading.js）
//
// 目的：ポータルの画面切り替え・検索・タブ切替などは PrimeFaces の部分AJAXで行われ，
//   その間ポータル本来の（地味な）ローディング表示が画面中央に出る．これを拡張のデザインに
//   合わせた中央の小さなカード（スピナー＋「読み込み中…」）に置き換える．
//
// 仕組み：
//   AJAX の開始/終了は PrimeFaces が jQuery イベントで通知するが，それは隔離された content script
//   からは直接受け取れない．ページ側で動く loading-bridge.js がネイティブの CustomEvent
//   （cit-ajax-start / cit-ajax-end / cit-ajax-idle）に変換して流すので，ここではそれを購読する．
//   同時に複数のAJAXが走ることがあるため進行中カウントで管理し，0になったら隠す．
//   idle（jQuery の ajaxStop＝全部完了）が来たらカウントを0にリセットする．
//   速いAJAXでチラつかないよう，表示は少し遅らせて（SHOW_DELAY_MS）から出す．
//   加えて，メニュー遷移などの通常のページ遷移（フルPOST）中も beforeunload で出す．
//   通信・ポータル側DOMの書き換えはしない．
//
// 設定キー（chrome.storage.local）:
//   enabled    : boolean  拡張全体の ON/OFF（他の設定と AND で効く）
//   loadingUI  : boolean  この機能の ON/OFF（デフォルト true）

"use strict";

(() => {
  const DEFAULTS = { enabled: true, loadingUI: true };
  const SHOW_DELAY_MS = 150; // これより速く終わる処理では出さない
  const MAX_SHOW_MS = 20000; // 終了通知を取りこぼしても出しっぱなしにしない保険
  let masterEnabled = true;
  let featureEnabled = true;
  let pending = 0;
  let box = null;
  let showTimer = null;
  let hideTimer = null;
  let safetyTimer = null;
  let listening = false;

  function ensureBox() {
    if (box && box.isConnected) return box;
    box = document.createElement("div");
    box.className = "cit-loading-box";
    box.setAttribute("role", "status");
    box.innerHTML = '<div class="cit-spinner" aria-hidden="true"></div><span>読み込み中…</span>';
    (document.body || document.documentElement).appendChild(box);
    return box;
  }

  function show() {
    if (!masterEnabled || !featureEnabled) return;
    clearTimeout(hideTimer);
    if (showTimer) return; // 既に表示予約済み
    showTimer = setTimeout(() => {
      showTimer = null;
      ensureBox().classList.add("cit-loading-active");
    }, SHOW_DELAY_MS);
    clearTimeout(safetyTimer);
    safetyTimer = setTimeout(reset, MAX_SHOW_MS);
  }

  function hide() {
    clearTimeout(showTimer);
    showTimer = null;
    if (!box) return;
    // 消えるときも一拍おく（連続AJAXの合間に点滅しないように）
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (pending <= 0) box.classList.remove("cit-loading-active");
    }, 120);
  }

  function reset() {
    pending = 0;
    hide();
  }

  function onStart() {
    pending++;
    show();
  }

  function onEnd() {
    pending = Math.max(0, pending - 1);
    if (pending === 0) hide();
  }

  function onUnload() {
    // ページ遷移中は遅延なしで即表示
    if (!masterEnabled || !featureEnabled) return;
    clearTimeout(showTimer);
    showTimer = null;
    ensureBox().classList.add("cit-loading-active");
  }

  function attachListeners() {
    if (listening) return;
    listening = true;
    document.addEventListener("cit-ajax-start", onStart);
    document.addEventListener("cit-ajax-end", onEnd);
    document.addEventListener("cit-ajax-idle", reset);
    window.addEventListener("beforeunload", onUnload);
  }

  function detachListeners() {
    if (!listening) return;
    listening = false;
    document.removeEventListener("cit-ajax-start", onStart);
    document.removeEventListener("cit-ajax-end", onEnd);
    document.removeEventListener("cit-ajax-idle", reset);
    window.removeEventListener("beforeunload", onUnload);
    clearTimeout(showTimer);
    showTimer = null;
    if (box) box.classList.remove("cit-loading-active");
    pending = 0;
  }

  // 機能ON中だけ html に付け，ポータル本来の BlockUI 表示を CSS で隠す（OFFなら元に戻る）
  const CLASS_CUSTOM = "cit-loading-custom";

  function start() {
    // 【スマホ版】ページ側ブリッジを差し込めなかった環境（html.cit-no-bridge）では AJAX の
    // 開始/終了が分からないので，ポータル本来のローディング表示をそのまま使う．
    if (document.documentElement.classList.contains("cit-no-bridge")) return;
    document.documentElement.classList.add(CLASS_CUSTOM);
    ensureBox();
    attachListeners();
  }

  chrome.storage.local.get(DEFAULTS, (s) => {
    if (chrome.runtime.lastError) return;
    masterEnabled = !!s.enabled;
    featureEnabled = !!s.loadingUI;
    if (!masterEnabled || !featureEnabled) return;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
      start();
    }
  });

  chrome.storage.onChanged.addListener((c, area) => {
    if (area !== "local" || (!c.enabled && !c.loadingUI)) return;
    if (c.enabled) masterEnabled = !!c.enabled.newValue;
    if (c.loadingUI) featureEnabled = !!c.loadingUI.newValue;
    if (masterEnabled && featureEnabled) {
      start();
    } else {
      document.documentElement.classList.remove(CLASS_CUSTOM);
      detachListeners();
    }
  });
})();
})();

// ======== src/content/attachment.js ========
(function () {
// NexPortal - 添付ファイルのブラウザ内プレビュー（attachment viewer）
//
// 目的：掲示の添付PDFを，いちいちダウンロード/削除せずブラウザ内で閲覧できるようにする．
// さらに，「掲示ページ→添付資料を確認→ダウンロードボタン」と3手順かかっていた導線を短縮し，
// 掲示ダイアログ下部にファイル名を直接表示，クリック1回でプレビューへ行けるようにする．
//
// 仕組み：
//   添付一覧(.fileListArea)の「ダウンロード」ボタンはフォームを POST 送信してファイルを取得する
//   （Content-Disposition: attachment で強制DL）．この submit を横取りし，同じ内容を
//   same-origin の fetch で取得 → blob 化 → ページ内オーバーレイの iframe(＝Chrome内蔵PDF
//   ビューア) で表示する．「新しいタブで開く」「保存」も添える．取得中はスピナーを表示する．
//   【スマホ版】タッチ端末では iframe を使わず，「開く」「保存」ボタン（画像はその場で表示）にする．
//
//   加えて，掲示詳細ダイアログ内にある「添付資料を確認」相当の展開トリガを自動で1回だけ
//   クリックして .fileListArea を出し，そこからファイル名一覧（.cit-attach-quicklist）を
//   ダイアログ下部に複製表示する．各ファイル名をクリックすると，元のダウンロードボタンを
//   代理クリックするだけ（＝上のプレビュー横取りがそのまま効く）．
//
// セキュリティ（docs/security.md 準拠）：
//   - 通信先はポータル自身のみ(same-origin)．第三者へは一切送らない．
//   - 認証情報は読まない（クッキーはブラウザが自動付与．HttpOnlyで中身も読めない）．
//   - 取得データは表示のためだけの一時 blob．保存も外部送信もしない．
//   - 失敗時は通常のダウンロードにフォールバック（壊さない）．
//   - 「添付資料を確認」の自動展開は，サイト本来のボタンを代理クリックするだけ（新規の通信経路は
//     追加しない）．トップページの「もっと見る」自動展開と同じ考え方．
//
// 設定キー（chrome.storage.local）:
//   enabled      : boolean  拡張全体の ON/OFF（他の設定と AND で効く）
//   attachInline : boolean  この機能の ON/OFF（デフォルト true）．クイック一覧もこれに従う

"use strict";

(() => {
  const DEFAULTS = { enabled: true, attachInline: true };
  let masterEnabled = true;
  let featureEnabled = true;
  let bypass = false; // フォールバック時に横取りを1回だけ素通しするフラグ

  chrome.storage.local.get(DEFAULTS, (s) => {
    if (chrome.runtime.lastError) return;
    masterEnabled = !!s.enabled;
    featureEnabled = !!s.attachInline;
  });
  chrome.storage.onChanged.addListener((c, area) => {
    if (area !== "local") return;
    if (c.enabled) masterEnabled = !!c.enabled.newValue;
    if (c.attachInline) featureEnabled = !!c.attachInline.newValue;
  });

  // ---------- プレビュー横取り（ダウンロードのPOSTを fetch で再現） ----------

  // 添付一覧のダウンロード（フォームPOST）を横取りする
  document.addEventListener(
    "submit",
    (e) => {
      if (bypass) {
        bypass = false;
        return; // フォールバックの素通し
      }
      if (!masterEnabled || !featureEnabled) return;
      const submitter = e.submitter;
      if (!submitter || !submitter.closest) return;
      // 添付一覧(.fileListArea)内のボタンによる送信だけを対象にする
      if (!submitter.closest(".fileListArea")) return;
      const form = e.target;
      if (!form || form.tagName !== "FORM") return;
      e.preventDefault();
      const overlay = createOverlay();
      previewDownload(form, submitter, overlay).catch(() => {
        // 失敗したら通常のダウンロードに戻す（同じ送信を素通しで再実行）
        overlay.citClose();
        bypass = true;
        try {
          submitter.click();
        } catch (_) {}
      });
    },
    true
  );

  async function previewDownload(form, submitter, overlay) {
    const fd = new FormData(form);
    // 送信ボタンの name は FormData に自動で入らないので手で足す（JSFのコマンド判定に必要）
    if (submitter.name) fd.append(submitter.name, submitter.value || "");
    const res = await fetch(form.action || location.href, {
      method: "POST",
      body: new URLSearchParams(fd),
      credentials: "same-origin",
    });
    if (!res.ok) throw new Error("http " + res.status);
    const ct = res.headers.get("Content-Type") || "";
    // HTMLが返ってきた＝エラー/期限切れ等．プレビューせず通常DLへフォールバック．
    if (/text\/html/i.test(ct)) throw new Error("not a file");
    const filename =
      parseFilename(res.headers.get("Content-Disposition") || "") || "attachment";
    const blob = await res.blob();
    populateViewer(overlay, blob, filename);
  }

  // Content-Disposition から filename を取り出す（RFC5987 / RFC2047 に対応）
  function parseFilename(cd) {
    let m = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(cd);
    if (m) {
      try {
        return decodeURIComponent(m[1].replace(/["']/g, ""));
      } catch (_) {}
    }
    m = /filename="?([^";]+)"?/i.exec(cd);
    if (m) {
      const v = m[1];
      // =?UTF-8?B?base64?=（複数連結あり）を復号
      if (/=\?UTF-8\?B\?/i.test(v)) {
        try {
          return v
            .replace(/=\?UTF-8\?B\?([^?]+)\?=/gi, (_, b) => {
              const bin = atob(b);
              const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
              return new TextDecoder("utf-8").decode(bytes);
            })
            .trim();
        } catch (_) {}
      }
      return v;
    }
    return null;
  }

  // 取得中はスピナー表示のオーバーレイを即座に出し，blob が用意でき次第 populateViewer() で
  // 中身（ファイル名・操作ボタン・iframe）を差し込む．
  function createOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "cit-pdf-overlay";
    // 静的テンプレート．可変値(filename/url)は後で textContent/プロパティ経由で入れる（インジェクション防止）
    overlay.innerHTML =
      '<div class="cit-pdf-bar">' +
      '<span class="cit-pdf-name"></span>' +
      '<span class="cit-pdf-actions">' +
      '<button class="cit-pdf-btn cit-pdf-close" type="button">✕ 閉じる</button>' +
      "</span></div>" +
      '<div class="cit-pdf-loading"><div class="cit-spinner" aria-hidden="true"></div>' +
      "<span>添付ファイルを取得しています…</span></div>";

    overlay.querySelector(".cit-pdf-name").textContent = "読み込み中…";

    let objectUrl = null;
    function close() {
      overlay.remove();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      document.removeEventListener("keydown", onKey, true);
    }
    function onKey(ev) {
      if (ev.key === "Escape") close();
    }
    overlay.querySelector(".cit-pdf-close").addEventListener("click", close);
    overlay.addEventListener("click", (ev) => {
      if (ev.target === overlay) close(); // 背景クリックで閉じる
    });
    document.addEventListener("keydown", onKey, true);

    overlay.citClose = close;
    overlay.citSetUrl = (u) => {
      objectUrl = u;
    };

    document.body.appendChild(overlay);
    return overlay;
  }

  // 【スマホ版】タッチ端末（iPhone / iPad / Android）かどうか．
  // iOS Safari は iframe 内の PDF を1ページ目しか表示できないため，タッチ端末では iframe を使わず
  // 「開く（新しいタブ＝ブラウザ標準のビューア）」「保存」の大きなボタンを出す．画像はその場で表示する．
  const IS_TOUCH =
    typeof matchMedia === "function" && matchMedia("(hover: none) and (pointer: coarse)").matches;

  // 【スマホ版】サーバが application/octet-stream 等で返すと，新しいタブで開いても表示されず
  // ダウンロード扱いになる．拡張子から分かる範囲で MIME を補って blob を作り直す（中身は同じ）．
  const EXT_MIME = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    txt: "text/plain",
  };
  function typedBlob(blob, filename) {
    const ext = (/\.([a-z0-9]+)$/i.exec(filename) || [])[1];
    const mime = ext && EXT_MIME[ext.toLowerCase()];
    if (!mime || blob.type === mime) return blob;
    return new Blob([blob], { type: mime });
  }

  function populateViewer(overlay, rawBlob, filename) {
    const blob = typedBlob(rawBlob, filename);
    const url = URL.createObjectURL(blob);
    overlay.citSetUrl(url);
    overlay.querySelector(".cit-pdf-name").textContent = filename;

    const actions = overlay.querySelector(".cit-pdf-actions");
    const closeBtn = overlay.querySelector(".cit-pdf-close");

    const openA = document.createElement("a");
    openA.className = "cit-pdf-btn cit-pdf-open";
    openA.target = "_blank";
    openA.rel = "noopener";
    openA.href = url;
    openA.textContent = "新しいタブで開く";

    const saveA = document.createElement("a");
    saveA.className = "cit-pdf-btn cit-pdf-save";
    saveA.href = url;
    saveA.download = filename;
    saveA.textContent = "保存";

    const loadingEl = overlay.querySelector(".cit-pdf-loading");

    if (IS_TOUCH) {
      overlay.classList.add("cit-pdf-touch");
      const body = document.createElement("div");
      body.className = "cit-pdf-touch-body";

      if (/^image\//.test(blob.type)) {
        const img = document.createElement("img");
        img.className = "cit-pdf-image";
        img.alt = filename;
        img.src = url;
        body.appendChild(img);
      } else {
        const card = document.createElement("div");
        card.className = "cit-pdf-filecard";
        card.innerHTML =
          '<i class="fa fa-file-o" aria-hidden="true"></i>' +
          '<p class="cit-pdf-filecard-name"></p>' +
          '<p class="cit-pdf-filecard-note">「開く」を押すと新しいタブで表示します．</p>';
        card.querySelector(".cit-pdf-filecard-name").textContent = filename;
        body.appendChild(card);
      }

      const row = document.createElement("div");
      row.className = "cit-pdf-touch-actions";
      openA.textContent = "開く";
      openA.classList.add("cit-pdf-btn-primary");
      row.appendChild(openA);
      row.appendChild(saveA);
      body.appendChild(row);

      loadingEl.replaceWith(body);
      return;
    }

    actions.insertBefore(openA, closeBtn);
    actions.insertBefore(saveA, closeBtn);

    const frame = document.createElement("iframe");
    frame.className = "cit-pdf-frame";
    frame.title = "添付プレビュー";
    frame.src = url;
    loadingEl.replaceWith(frame);
  }

  // ---------- 添付導線の短縮：自動展開 ＋ ダイアログ下部のクイック一覧 ----------

  const EXPAND_LABEL = "添付資料を確認";
  const EXPAND_CANDIDATES = 'a, button, .ui-commandlink, .ui-button, [role="button"]';
  const SUPPRESS = "cit-attach-suppress"; // html に付ける：自動展開中は他ダイアログを不可視に
  const HOST = "cit-attach-host"; // 掲示ダイアログ（不可視にしない側）
  const FILE_DLG = "cit-attach-filedlg"; // 添付一覧ダイアログ（開いたまま不可視にする）
  const ROOT = document.documentElement;
  const triedExpandTriggers = new WeakSet();
  let lastTrigger = null; // 直近に自動展開したトリガ（クイック一覧の設置先を決めるのに使う）
  let suppressTimer = null;

  function unsuppress() {
    clearTimeout(suppressTimer);
    ROOT.classList.remove(SUPPRESS);
  }

  function dialogMask(dlg) {
    // PrimeFaces のモーダル遮蔽は <ダイアログid>_modal（body直下）
    return dlg && dlg.id ? document.getElementById(dlg.id + "_modal") : null;
  }

  // 「添付資料を確認」相当のボタン／リンクを見つけて1回だけ代理クリックする．
  // （.fileListArea を出すためのサイト本来の操作をなぞるだけ．新規の通信経路は増やさない）
  // 添付一覧は別ダイアログで前面に出てくるため，検出して隠すまでの間，掲示ダイアログ以外を
  // 不可視にしておく（保険で3秒後に解除）．
  function autoExpandAttachments() {
    for (const el of document.querySelectorAll(EXPAND_CANDIDATES)) {
      if (triedExpandTriggers.has(el)) continue;
      if ((el.textContent || "").trim() !== EXPAND_LABEL) continue;
      triedExpandTriggers.add(el);
      lastTrigger = el;
      const host = el.closest(".ui-dialog");
      if (host) {
        host.classList.add(HOST);
        const mask = dialogMask(host);
        if (mask) mask.classList.add(HOST + "-mask");
      }
      ROOT.classList.add(SUPPRESS);
      clearTimeout(suppressTimer);
      suppressTimer = setTimeout(unsuppress, 3000);
      el.click();
      return; // 1tickにつき1件（連打を避ける．ajax後の再tickで残りも処理される）
    }
  }

  // 添付一覧が別ダイアログで開いた場合，閉じずに不可視にする．
  // 閉じないのは，ダイアログを閉じる操作に伴うサーバ側の状態変化を避け，
  // クイック一覧からの代理クリック先（ダウンロードボタン）を確実に残すため．
  function hideFileDialog(fileListArea) {
    const dlg = fileListArea.closest(".ui-dialog");
    if (!dlg) return;
    if (lastTrigger && dlg.contains(lastTrigger)) return; // 掲示ダイアログ内に展開された → そのまま
    dlg.classList.add(FILE_DLG);
    const mask = dialogMask(dlg);
    if (mask) mask.classList.add(FILE_DLG + "-mask");
  }

  // 利用者が本物の「添付資料を確認」を自分で押したときは，隠していた一覧ダイアログを見せる
  document.addEventListener(
    "click",
    (e) => {
      if (!e.isTrusted) return;
      const el = e.target && e.target.closest && e.target.closest(EXPAND_CANDIDATES);
      if (!el || (el.textContent || "").trim() !== EXPAND_LABEL) return;
      for (const d of document.querySelectorAll("." + FILE_DLG)) d.classList.remove(FILE_DLG);
      for (const m of document.querySelectorAll("." + FILE_DLG + "-mask")) {
        m.classList.remove(FILE_DLG + "-mask");
      }
    },
    true
  );

  // .fileListArea の各行から「ファイル名」と「実際に押すべきダウンロードボタン」を集める．
  function collectFileRows(fileListArea) {
    const items = [];
    for (const row of fileListArea.querySelectorAll(".tableDownloadRow")) {
      const nameCell = row.querySelector(".downLoadCellFilNm");
      const btnCell = row.querySelector(".fileListCell.alignRight");
      if (!nameCell || !btnCell) continue;
      // 非表示の実送信ボタン(.dispNone)ではなく，本来ユーザが押す見た目のボタンを使う
      const btn = btnCell.querySelector("button:not(.dispNone)") || btnCell.querySelector("button");
      if (!btn) continue;
      const name = nameCell.textContent.trim();
      if (!name) continue;
      items.push({ name, btn });
    }
    return items;
  }

  function buildQuickList(fileListArea) {
    const items = collectFileRows(fileListArea);
    if (!items.length) return;
    // 同じ一覧要素が別の掲示で使い回されることがあるので，ファイル名の並びで変化を検出する．
    // 掲示ダイアログの再描画で一覧が消えた場合（isConnected=false）も作り直す．
    const sig = items.map((i) => i.name).join("\n");

    // 設置先：掲示ダイアログの本文（.ui-dialog-content）の末尾＝「掲示の一番下」．
    // 自動展開のトリガが見つからない場合だけ，一覧の直後に置く．
    const host =
      lastTrigger && lastTrigger.isConnected
        ? lastTrigger.closest(".ui-dialog-content") || lastTrigger.parentElement
        : null;

    // 一覧は設置先ごとに1つだけ．.fileListArea が複数ある（同じ内容で2つ描画される／入れ子）
    // 場合に同じ一覧が重複して並ぶのを防ぐ．内容（ファイル名の並び）が変われば作り直す．
    hideFileDialog(fileListArea);
    const existing = host
      ? host.querySelector(":scope > .cit-attach-quicklist")
      : fileListArea.nextElementSibling &&
        fileListArea.nextElementSibling.classList.contains("cit-attach-quicklist")
      ? fileListArea.nextElementSibling
      : null;
    if (existing && existing.dataset.sig === sig) {
      unsuppress();
      return;
    }
    if (existing) existing.remove();

    const box = document.createElement("div");
    box.className = "cit-attach-quicklist";
    box.dataset.sig = sig;

    const title = document.createElement("p");
    title.className = "cit-attach-quicklist-title";
    title.textContent = IS_TOUCH ? "添付ファイル（タップで開く）" : "添付ファイル（クリックでプレビュー）";
    box.appendChild(title);

    for (const item of items) {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "cit-attach-quicklist-item";
      row.innerHTML = '<i class="fa fa-file-o" aria-hidden="true"></i><span class="cit-attach-name"></span>';
      row.querySelector(".cit-attach-name").textContent = item.name;
      row.title = item.name;
      row.addEventListener("click", () => item.btn.click());
      box.appendChild(row);
    }

    if (host) host.appendChild(box);
    else fileListArea.insertAdjacentElement("afterend", box);
    unsuppress();
  }

  function tick() {
    if (!masterEnabled || !featureEnabled) return;
    autoExpandAttachments();
    document.querySelectorAll(".fileListArea").forEach(buildQuickList);
    // モーダル遮蔽(_modal)はダイアログ表示後に作られることがあるので，毎tick追従して隠す
    for (const d of document.querySelectorAll("." + FILE_DLG)) {
      const m = dialogMask(d);
      if (m) m.classList.add(FILE_DLG + "-mask");
    }
  }

  function start() {
    tick();
    // 掲示ダイアログの開閉・ajax再描画に追従する
    const obs = new MutationObserver(() => tick());
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
})();

// ======== src/content/session.js ========
(function () {
// NexPortal - セッション切れ時の再ログイン導線（session.js）
//
// 一定時間無操作で自動ログアウトされると，「長時間操作が行われなかったため，自動的にログアウト
// されました．この画面を閉じてください．」という行き止まり画面になる．この画面を検知して
// 「ログインページへ」ボタンを出し，ワンクリックで再ログインに進めるようにする．
//
// 指示書フェーズ3の安全な範囲：
//   ✅ セッション切れを検知して導線を出す／ワンクリックでログインページを開く
//   ❌ パスワードの保持・自動再ログインはしない
//
// 検知の要点：
//   - 「自動的にログアウト」はログイン画面にも注意書きとして出ることがあるため，それだけでは判定しない．
//     行き止まり画面に固有の「この画面を閉じ（てください）」を必須にする．
//   - ログインフォーム（パスワード欄）がある画面には出さない．
//   - メッセージが後から動的に描画される場合に備え，一定時間 DOM の変化を監視する．
//
// 設定キー（chrome.storage.local）:
//   enabled       : boolean  拡張全体の ON/OFF（他の設定と AND で効く）
//   reloginButton : boolean  この機能の ON/OFF（デフォルト true）

"use strict";

(() => {
  // ポータル入口．セッションが無いのでアクセスするとSSOログインへリダイレクトされる．
  const LOGIN_URL = "https://portal.chibatech.ac.jp/uprx/";
  const DEFAULTS = { enabled: true, reloginButton: true };
  const WATCH_MS = 15000; // 動的描画を待つ監視時間

  // 行き止まりの自動ログアウト画面か？（「この画面を閉じ」を必須にしてログイン画面と区別）
  function isLogoutDeadEnd() {
    const t = (document.body && document.body.textContent) || "";
    return /この画面を閉じ/.test(t) && /ログアウト|長時間操作/.test(t);
  }

  // ログイン用フォームがある画面（＝ここには再ログインボタンは出さない）
  function hasLoginForm() {
    return !!document.querySelector('input[type="password"], #kc-form-login');
  }

  // メッセージが入っている一番内側の箱を探す（ボタンの設置先）
  function findBox() {
    const els = [
      ...document.body.querySelectorAll("div,section,article,td,fieldset,p"),
    ];
    const both = els.filter((el) => {
      const t = el.textContent || "";
      return /この画面を閉じ/.test(t) && /ログアウト|長時間操作/.test(t);
    });
    if (!both.length) return null;
    both.sort((a, b) => (a.textContent || "").length - (b.textContent || "").length);
    return both[0];
  }

  function addButton() {
    if (document.getElementById("cit-relogin-btn")) return;
    const a = document.createElement("a");
    a.id = "cit-relogin-btn";
    a.className = "cit-relogin-btn";
    a.href = LOGIN_URL;
    a.textContent = "ログインページへ";

    const wrap = document.createElement("div");
    wrap.className = "cit-relogin-wrap";
    wrap.appendChild(a);

    const box = findBox();
    if (box) box.appendChild(wrap);
    else document.body.appendChild(wrap);
  }

  // 追加を試みる．true = これ以上の監視は不要（追加済み／対象外が確定）．
  function attempt() {
    if (document.getElementById("cit-relogin-btn")) return true;
    if (!document.body) return false;
    if (hasLoginForm()) return true; // ログイン画面には出さない
    if (!isLogoutDeadEnd()) return false;
    addButton();
    return true;
  }

  function start() {
    if (attempt()) return;
    // メッセージが後から描画される場合に備えて一定時間だけ監視する
    const obs = new MutationObserver(() => {
      if (attempt()) stop();
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    const timer = setTimeout(stop, WATCH_MS);
    function stop() {
      obs.disconnect();
      clearTimeout(timer);
    }
  }

  chrome.storage.local.get(DEFAULTS, (s) => {
    if (chrome.runtime.lastError) return;
    if (!s.enabled || !s.reloginButton) return;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
      start();
    }
  });
})();
})();

// ======== src/content/topage.js ========
(function () {
// NexPortal - トップページ刷新（topage.js）
//
// 頻繁に使う項目のアイコンバー（クイックランチャー）を設置する．まず Stage 1．
//
// クイックボタンは，元メニュー(#menuForm:mainMenu)の該当項目 <a> を「項目テキスト」で探して
// 同期的に .click() する（＝サイト本来のナビゲーションをそのまま使う）．POST遷移でも
// ポップアップでも確実に動く．URLを自作せず，ネットワークを新たに叩かない．
//
// 表示条件：グローバルメニュー(#menuForm:mainMenu)があるページ（＝ログイン済み）．
//   ポータルはページ内をAJAX/POSTで再描画するため，content script が再実行されなかったり
//   バーが消えたりする．そこで MutationObserver で監視し，消えていれば作り直す．
//
// 設定キー（chrome.storage.local）:
//   enabled : boolean  拡張全体の ON/OFF（他の設定と AND で効く）
//   topPage : boolean  トップページ刷新の ON/OFF（デフォルト true）

"use strict";

(() => {
  const DEFAULTS = { enabled: true, topPage: true };
  let masterEnabled = false;
  let featureEnabled = false;

  // 掲示を5件表示するため読み込み時に「もっと見る」を自動実行する．
  // （「編集中」誤判定の原因はメモ欄の display:none だったため，これは有効に戻す）
  const AUTO_EXPAND_KEIJI = true;

  const ITEMS = [
    { label: "掲示", menuText: "掲示板", icon: "fa-bullhorn" },
    { label: "時間割", menuText: "学生時間割表", icon: "fa-table" },
    { label: "出欠", menuText: "出欠状況確認", icon: "fa-check-square-o" },
    { label: "成績", menuText: "成績照会", icon: "fa-graduation-cap" },
    { label: "manaba", menuText: "manaba", icon: "fa-book" },
    { label: "証明書", menuText: "証明書発行サービス", icon: "fa-file-text-o" },
  ];

  function menuRoot() {
    return document.getElementById("menuForm:mainMenu");
  }

  function contentContainer() {
    return document.getElementById("funcContent");
  }

  function findMenuLink(text) {
    const root = menuRoot();
    if (!root) return null;
    for (const a of root.querySelectorAll("a.ui-menuitem-link")) {
      const t = a.querySelector(".ui-menuitem-text");
      if (t && t.textContent.trim() === text) return a;
    }
    return null;
  }

  function buildBar() {
    if (document.getElementById("cit-quicklaunch")) return; // 既にある
    if (!menuRoot()) return; // 未ログイン等
    const container = contentContainer();
    if (!container) return; // 差し込み先がまだ無ければ後で再挑戦

    const bar = document.createElement("div");
    bar.id = "cit-quicklaunch";
    bar.className = "cit-quicklaunch";

    for (const item of ITEMS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cit-ql-btn";
      btn.title = item.menuText;
      btn.innerHTML =
        '<i class="fa fa-fw ' +
        item.icon +
        '" aria-hidden="true"></i><span class="cit-ql-label"></span>';
      btn.querySelector(".cit-ql-label").textContent = item.label;
      btn.addEventListener("click", () => {
        const link = findMenuLink(item.menuText);
        if (link) link.click(); // 元メニューを同期的に代理クリック
      });
      bar.appendChild(btn);
    }

    container.insertBefore(bar, container.firstChild);
  }

  function markTop() {
    // トップページ判定は中身ベース（#mainWrapBottomPortal はトップ固有）．
    // URLは Pky00102 / Bsa00101 と揺れるため使わない．
    const isTop = !!document.getElementById("mainWrapBottomPortal");
    document.documentElement.classList.toggle("cit-top", isTop);
  }

  // ---- トップページの掲示（重要）を 5件表示＋「もっと見る」→重要一覧へ ----

  // 重要タブの datalist（dispTab_1 内）
  function keijiList(support) {
    const panel = support.querySelector(".dispTab_1");
    return panel ? panel.querySelector("ul.ui-datalist-data") : null;
  }

  // 元の「もっと見る」リンク（a.ui-commandlink でテキストが「もっと見る」．自作リンクは除外される）
  function findNativeMore(support) {
    for (const a of support.querySelectorAll("a.ui-commandlink")) {
      if (a.textContent.trim() === "もっと見る") return a;
    }
    return null;
  }

  function ensureMyMoreLink(support) {
    if (support.querySelector(".cit-keiji-more")) return;
    const panel = support.querySelector(".dispTab_1");
    if (!panel || !panel.parentNode) return;
    const a = document.createElement("a");
    a.href = "#";
    a.className = "cit-keiji-more";
    a.textContent = "もっと見る（重要の掲示一覧へ）";
    a.addEventListener("click", (e) => {
      e.preventDefault();
      // 掲示一覧ページへ遷移し，遷移先で「重要」タブを開くためのフラグを置く
      try {
        sessionStorage.setItem("citKeijiTab", "重要");
      } catch (_) {}
      const link = findMenuLink("掲示板");
      if (link) link.click();
    });
    panel.parentNode.appendChild(a); // 重要タブパネルの末尾に
  }

  function handleTopBulletins() {
    const support = document.getElementById("portalSupport");
    if (!support) return;
    const list = keijiList(support);
    const nativeMore = findNativeMore(support);

    // 1) 5件未満なら 元「もっと見る」を1回だけ自動実行して全件ロード
    if (AUTO_EXPAND_KEIJI && list && nativeMore && list.children.length < 5 && !nativeMore.dataset.citExpanded) {
      nativeMore.dataset.citExpanded = "1";
      const y = window.scrollY; // scrollProc() の自動スクロールを打ち消す
      nativeMore.click();
      setTimeout(() => window.scrollTo(0, y), 0);
      setTimeout(() => window.scrollTo(0, y), 250);
      return; // AJAX後に tick が再実行される
    }

    // 2) 元「もっと見る」を隠し，自前の「重要一覧へ」リンクを設置
    if (nativeMore) nativeMore.style.display = "none";
    ensureMyMoreLink(support);
  }

  // 掲示一覧ページ側：フラグがあれば「重要」タブを開く
  function activateKeijiTabIfFlagged() {
    let flag;
    try {
      flag = sessionStorage.getItem("citKeijiTab");
    } catch (_) {
      return;
    }
    if (!flag) return;
    const tabArea = document.getElementById("funcForm:tabArea");
    if (!tabArea) return;
    for (const a of tabArea.querySelectorAll("ul.ui-tabs-nav > li > a")) {
      if (a.textContent.trim() === flag) {
        try {
          sessionStorage.removeItem("citKeijiTab");
        } catch (_) {}
        a.click();
        return;
      }
    }
  }

  // ---- その日のスケジュール：同じ授業が連続するコマを1つにまとめる ----
  // 例）09:00-10:00 と 10:00-11:00 が同じ授業なら，先頭を「09:00 - 11:00」にして後続を隠す．

  const TIME_RE = /(\d{1,2}:\d{2})(\s*[-–—~〜]\s*)(\d{1,2}:\d{2})/;

  // 授業の同一性は「授業名＋教員/教室」で判定する
  function lessonKey(li) {
    const norm = (e) => (e ? e.textContent.replace(/\s+/g, "") : "");
    return norm(li.querySelector(".lessonTitle")) + "|" + norm(li.querySelector(".lessonDetail"));
  }

  function lessonTime(li) {
    const head = li.querySelector(".lessonHead");
    const m = head && head.textContent.match(TIME_RE);
    return m ? { start: m[1], end: m[3] } : null;
  }

  // .lessonHead 内の「HH:MM - HH:MM」の終了時刻だけ書き換える．
  // 開始と終了が別要素に分かれている場合（1つのテキストノードに揃っていない場合）にも対応する．
  function setLessonEnd(li, end) {
    const head = li.querySelector(".lessonHead");
    if (!head) return;
    const w = document.createTreeWalker(head, NodeFilter.SHOW_TEXT);
    const timeNodes = [];
    let n;
    while ((n = w.nextNode())) {
      if (TIME_RE.test(n.nodeValue)) {
        // 1つのノードに「開始 - 終了」が揃っている場合
        n.nodeValue = n.nodeValue.replace(TIME_RE, (m, a, sep) => a + sep + end);
        return;
      }
      if (/\d{1,2}:\d{2}/.test(n.nodeValue)) timeNodes.push(n);
    }
    // 分かれている場合は，最後に出てくる時刻＝終了時刻とみなして置き換える
    const lastNode = timeNodes[timeNodes.length - 1];
    if (lastNode) {
      lastNode.nodeValue = lastNode.nodeValue.replace(
        /(\d{1,2}:\d{2})(?![\s\S]*\d{1,2}:\d{2})/,
        end
      );
    }
  }

  function mergeLessons() {
    const box = document.getElementById("portalSchedule2");
    if (!box) return;
    const items = [...box.querySelectorAll("li.ui-datalist-item")];
    if (items.length < 2) return;
    if (!items.some((li) => !li.dataset.citLesson)) return; // 全て処理済みなら何もしない

    let i = 0;
    while (i < items.length) {
      const head = items[i];
      const first = lessonTime(head);
      const key = lessonKey(head);
      let last = first;
      let j = i + 1;
      // 同じ授業が「前のコマの終了＝次のコマの開始」で続く限りまとめる
      while (j < items.length && first && last) {
        const t = lessonTime(items[j]);
        if (lessonKey(items[j]) !== key || !t || t.start !== last.end) break;
        last = t;
        items[j].classList.add("cit-lesson-merged");
        j++;
      }
      if (first && last && last.end !== first.end) setLessonEnd(head, last.end);
      for (let k = i; k < j; k++) items[k].dataset.citLesson = "1";
      i = j;
    }
  }

  function tick() {
    if (!masterEnabled || !featureEnabled) return;
    markTop();
    buildBar();
    if (document.documentElement.classList.contains("cit-top")) {
      handleTopBulletins();
      mergeLessons();
    }
    activateKeijiTabIfFlagged();
  }

  function start() {
    tick();
    // AJAX/POSTでの部分再描画に備え，消えたら作り直す
    const obs = new MutationObserver(() => tick());
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }

  chrome.storage.local.get(DEFAULTS, (s) => {
    if (chrome.runtime.lastError) return;
    masterEnabled = !!s.enabled;
    featureEnabled = !!s.topPage;
    if (!masterEnabled || !featureEnabled) return;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
      start();
    }
  });

  // 設定変更に追従（全体スイッチ・個別スイッチの両方を見る）
  chrome.storage.onChanged.addListener((c, area) => {
    if (area !== "local" || (!c.enabled && !c.topPage)) return;
    if (c.enabled) masterEnabled = !!c.enabled.newValue;
    if (c.topPage) featureEnabled = !!c.topPage.newValue;
    if (masterEnabled && featureEnabled) {
      tick();
    } else {
      const b = document.getElementById("cit-quicklaunch");
      if (b) b.remove();
      document.documentElement.classList.remove("cit-top");
    }
  });
})();
})();

// ======== src/content/grades.js ========
(function () {
// NexPortal - 成績ページ（Kmg00601）の改善
//
// Stage A：開いた直後の表示パターンを「年度学期表示」にする．
// Stage B：年度学期ごとにページ切り替え（プルダウン＋前後ボタン）で1つずつ表示する．
//
// Stage A の仕組み：
//   表示パターンは PrimeFaces ラジオ #funcForm:initPtn（0=まとめて表示 / 1=年度学期表示）．
//   ラジオ変更だけでは成績表は再描画されない（onchange の u: に結果表が含まれない）ので，
//   ラジオを切り替えたあと「表示」ボタン #funcForm:search を押す必要がある．
//   → その2操作を読み込み時に1回だけ代理実行する（＝人間が手で押すのと同じ操作）．
//
// Stage B の仕組み：
//   年度学期表示では #funcForm の直下に「学期ラベル(…:N:gakki) → 成績表(…:N:sskList)」が
//   N=0,1,2… と並ぶ（ブロックを囲むラッパ要素は無いフラット構造）．
//   そこで #funcForm の各直下要素を id 中の N でグループ分けし，選択中の N 以外を隠す．
//   表示の出し分けだけなので追加の通信は発生しない．
//   ※ 隠す方法は display:none ではなく画面外送り（.cit-term-hidden）．サイトの変更チェック
//     (collectData) の集計対象から外れて「編集中」誤判定が出るのを避けるため（メモ欄と同じ理由）．
//
// 設定キー（chrome.storage.local）:
//   enabled        : boolean  拡張全体の ON/OFF（他の設定と AND で効く）
//   gradesYearTerm : boolean  この機能の ON/OFF（デフォルト true）

"use strict";

(() => {
  const DEFAULTS = { enabled: true, gradesYearTerm: true };
  const RADIO_YEAR_TERM = "funcForm:initPtn:1"; // 年度学期表示
  const SEARCH_BTN = "funcForm:search"; // 「表示」ボタン
  const PAGER_ID = "cit-term-pager";
  const HIDDEN = "cit-term-hidden";

  let enabled = true;
  let switched = false; // Stage A をページ読み込みごとに1回だけ実行する
  let selectedIdx = null; // 選択中の年度学期（ajax 再描画をまたいで保持）

  // ---------- Stage A：年度学期表示に切り替える ----------

  function yearTermRadio() {
    return document.getElementById(RADIO_YEAR_TERM);
  }

  // 成績ページか？（URLは Bsa00101 と共通なので中身で判定する）
  function isGradesPage() {
    const label = document.querySelector('label[for="' + RADIO_YEAR_TERM + '"]');
    return !!yearTermRadio() && !!label && /年度学期/.test(label.textContent || "");
  }

  // PrimeFaces のラジオは実体 input が隠れているので，見た目のボックスをクリックする．
  // それで切り替わらなければ input を直接操作して change を発火させる．
  function selectYearTerm(input) {
    const box = input
      .closest(".ui-radiobutton")
      ?.querySelector(".ui-radiobutton-box");
    if (box) box.click();
    if (!input.checked) {
      input.checked = true;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  // ラジオ変更の ajax 完了を待ってから「表示」を押す．
  // 完了の目印：年度学期表示になると昇順/降順（#funcForm:nendoSort）の無効化が解ける．
  function clickSearchWhenReady(tries) {
    const ready = document.querySelector(
      "#funcForm\\:nendoSort .ui-button:not(.ui-state-disabled)"
    );
    if (ready || tries <= 0) {
      const btn = document.getElementById(SEARCH_BTN);
      if (btn) btn.click();
      return;
    }
    setTimeout(() => clickSearchWhenReady(tries - 1), 200);
  }

  function autoSwitch() {
    if (switched) return;
    if (!isGradesPage()) return;
    const radio = yearTermRadio();
    if (!radio) return;
    switched = true;
    if (radio.checked) return; // 既に年度学期表示なら何もしない
    selectYearTerm(radio);
    clickSearchWhenReady(25); // 最大約5秒待つ
  }

  // ---------- Stage B：年度学期ごとのページ切り替え ----------

  function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // #funcForm の直下要素を，id に含まれる繰り返しインデックス N でグループ分けする．
  // 返り値: Map<"0"|"1"|…, Element[]>（2ブロック以上あるときのみ）
  function collectBlocks() {
    const form = document.getElementById("funcForm");
    if (!form) return null;
    const lists = [...form.querySelectorAll('[id$=":sskList"]')];
    if (lists.length < 2) return null;
    // 例: "funcForm:j_idt193:0:sskList" → prefix "funcForm:j_idt193"
    // ※ j_idtNNN は動的に変わるので固定値にせず，実物から取り出す
    const prefix = lists[0].id.replace(/:\d+:sskList$/, "");
    if (prefix === lists[0].id) return null;
    const sel = '[id^="' + prefix + ':"]';
    const re = new RegExp("^" + escapeRe(prefix) + ":(\\d+):");
    const map = new Map();
    for (const child of [...form.children]) {
      const el = child.matches(sel) ? child : child.querySelector(sel);
      if (!el) continue;
      const m = el.id.match(re);
      if (!m) continue;
      if (!map.has(m[1])) map.set(m[1], []);
      map.get(m[1]).push(child);
    }
    return map.size >= 2 ? map : null;
  }

  // ブロック先頭のテキストから「2025年度 前期」のような表示名を組み立てる
  // （年度と学期は別要素なので，連続した文字列としては存在しない）
  function blockLabel(nodes, idx) {
    let head = "";
    for (const n of nodes) {
      head += " " + (n.textContent || "");
      if (head.length > 200) break;
    }
    head = head.replace(/\s+/g, " ").trim().slice(0, 200);
    const y = head.match(/(20\d{2})/);
    const t = head.match(/(前期|後期|通年|前学期|後学期)/);
    if (y && t) return y[1] + "年度 " + t[1];
    if (y) return y[1] + "年度";
    if (t) return t[1];
    return "区分 " + (Number(idx) + 1);
  }

  function applySelection(map) {
    for (const [key, nodes] of map) {
      const hide = key !== selectedIdx;
      for (const n of nodes) n.classList.toggle(HIDDEN, hide);
    }
  }

  function buildPager() {
    if (document.getElementById(PAGER_ID)) return; // 既にある
    const map = collectBlocks();
    if (!map) return;
    const keys = [...map.keys()];
    // 直前の選択を保つ．無ければ最新（最後）の年度学期を表示する
    if (selectedIdx === null || !map.has(selectedIdx)) {
      selectedIdx = keys[keys.length - 1];
    }

    const bar = document.createElement("div");
    bar.id = PAGER_ID;
    bar.className = "cit-term-pager";

    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "cit-term-btn";
    prev.textContent = "◀ 前";

    const select = document.createElement("select");
    select.className = "cit-term-select";
    // 表示名を作る．年度が拾えず「前期」「前期」と重複する場合は連番で区別する
    const base = keys.map((k) => blockLabel(map.get(k), k));
    const labels = base.map((t, i) =>
      base.filter((x) => x === t).length > 1 ? t + "（" + (i + 1) + "）" : t
    );
    keys.forEach((key, i) => {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = labels[i];
      select.appendChild(opt);
    });

    const next = document.createElement("button");
    next.type = "button";
    next.className = "cit-term-btn";
    next.textContent = "次 ▶";

    function sync() {
      select.value = selectedIdx;
      const i = keys.indexOf(selectedIdx);
      prev.disabled = i <= 0;
      next.disabled = i >= keys.length - 1;
      applySelection(map);
    }

    function move(step) {
      const i = keys.indexOf(selectedIdx) + step;
      if (i < 0 || i >= keys.length) return;
      selectedIdx = keys[i];
      sync();
    }

    prev.addEventListener("click", () => move(-1));
    next.addEventListener("click", () => move(1));
    select.addEventListener("change", () => {
      selectedIdx = select.value;
      sync();
    });

    bar.append(prev, select, next);
    const anchor = map.get(keys[0])[0];
    anchor.parentNode.insertBefore(bar, anchor);
    sync();
  }

  // ---------- 実行 ----------

  function tick() {
    if (!enabled) return;
    autoSwitch();
    buildPager();
  }

  function start() {
    tick();
    // ajax でフォームが再描画されるため，DOM の変化を見て作り直す
    const obs = new MutationObserver(() => tick());
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }

  chrome.storage.local.get(DEFAULTS, (s) => {
    if (chrome.runtime.lastError) return;
    enabled = !!s.enabled && !!s.gradesYearTerm;
    if (!enabled) return;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
      start();
    }
  });
})();
})();

// ======== src/content/timetable.js ========
(function () {
// NexPortal - 時間割ページ（Kmd00801）の学期優先表示
//
// 時間割は前期・後期の table.classTable が並んで両方表示される作りになっている．
// 実機確認：各学期は「2026年度 後期」のような凡例（legend）を持つ折りたたみ枠（fieldset）に
// 入っており，その中に .rishuArea > .ofAuto > table.classTable がある．
// そのため後期になっても前期の表が先に目に入り，見たい方を探す必要がある．
//
// 成績ページ（grades.js）で先に実装した「学期ごとに1つずつページ切り替え」と同じUI
// （プルダウン＋前後ボタン，.cit-term-* クラス）をここでも使い，既定表示を「今学期」にする．
//   今学期の判定：4/1〜9/15 は前期，それ以外は後期（依頼者指定）．
//   年度は 4月〜翌3月を1年度とし（1〜3月は前年の年度），「YYYY年度 後期」のように年度も併せて照合する．
//
// 学期ブロックの見分け方：
//   table.classTable ごとに，それを囲む fieldset（.ui-fieldset）を1ブロックとする
//   （無ければ .ofAuto，それも無ければテーブル自身）．ラベルは fieldset の legend から
//   「YYYY」と「前期/後期/通年」を拾って組み立てる．legend が無い場合は直前の見出しを走査する．
//   2ブロック以上見つからない場合は何もしない（あれば効く／なければ無視）．
//
// 設定キー（chrome.storage.local）:
//   enabled          : boolean  拡張全体の ON/OFF（他の設定と AND で効く）
//   timetableYearTerm: boolean  この機能の ON/OFF（デフォルト true）

"use strict";

(() => {
  const DEFAULTS = { enabled: true, timetableYearTerm: true };
  const PAGER_ID = "cit-timetable-pager";
  const HIDDEN = "cit-term-hidden";
  const TERM_RE = /(前学期|後学期|前期|後期|通年)/;

  let enabled = true;
  let selectedIdx = null; // 選択中のブロックindex（ajax再描画をまたいで保持）

  // 今学期（4/1〜9/15＝前期，それ以外＝後期）と年度（4月始まり）
  function currentTerm() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const first = (m >= 4 && m <= 8) || (m === 9 && d <= 15);
    const year = m >= 4 ? y : y - 1;
    return { year, term: first ? "前期" : "後期" };
  }

  function normalizeTerm(t) {
    return t === "前学期" ? "前期" : t === "後学期" ? "後期" : t;
  }

  // 見出しテキストから「YYYY年度 前期」を組み立てる（年度・学期のどちらか一方でも可）
  function parseLabel(text) {
    const s = (text || "").replace(/\s+/g, " ").trim();
    const y = s.match(/(20\d{2})/);
    const t = s.match(TERM_RE);
    if (y && t) return y[1] + "年度 " + normalizeTerm(t[1]);
    if (t) return normalizeTerm(t[1]);
    if (y) return y[1] + "年度";
    return null;
  }

  // legend が無い場合の保険：ブロックの直前きょうだい／祖先の直前きょうだいの見出しを見る
  function nearbyLabel(block) {
    let node = block;
    for (let depth = 0; depth < 4 && node; depth++) {
      let sib = node.previousElementSibling;
      let hops = 0;
      while (sib && hops < 3) {
        const label = parseLabel((sib.textContent || "").slice(0, 60));
        if (label) return label;
        sib = sib.previousElementSibling;
        hops++;
      }
      node = node.parentElement;
    }
    return null;
  }

  function blockLabel(block, idx) {
    const legend = block.querySelector("legend, .ui-fieldset-legend");
    return (
      (legend && parseLabel(legend.textContent)) ||
      nearbyLabel(block) ||
      "区分 " + (idx + 1)
    );
  }

  // table.classTable を内包する「ブロック」を集める
  function collectBlocks() {
    const tables = [...document.querySelectorAll("table.classTable")];
    if (tables.length < 2) return null;
    const blocks = [];
    const seen = new Set();
    for (const table of tables) {
      // 実機：fieldset.ui-fieldset.colGakki（学期ごとの折りたたみ枠）
      const block =
        table.closest(".colGakki, .ui-fieldset, fieldset") || table.closest(".ofAuto") || table;
      if (seen.has(block)) continue;
      seen.add(block);
      blocks.push(block);
    }
    return blocks.length >= 2 ? blocks : null;
  }

  // 既定表示：年度＋学期が一致 → 学期だけ一致 → 最後（最新想定）．同名が複数なら後ろを優先
  function pickDefaultIdx(labels) {
    const cur = currentTerm();
    const yearStr = cur.year + "年度";
    const both = labels.map((l, i) => (l.includes(yearStr) && l.includes(cur.term) ? i : -1));
    const bothHit = both.filter((i) => i >= 0);
    if (bothHit.length) return bothHit[bothHit.length - 1];
    const term = labels.map((l, i) => (l.includes(cur.term) ? i : -1)).filter((i) => i >= 0);
    if (term.length) return term[term.length - 1];
    return labels.length - 1;
  }

  function applySelection(blocks) {
    blocks.forEach((block, i) => block.classList.toggle(HIDDEN, i !== selectedIdx));
  }

  function buildPager() {
    if (document.getElementById(PAGER_ID)) return; // 既にある
    const blocks = collectBlocks();
    if (!blocks) return;

    const rawLabels = blocks.map((b, i) => blockLabel(b, i));
    const labels = rawLabels.map((t, i) =>
      rawLabels.filter((x) => x === t).length > 1 ? t + "（" + (i + 1) + "）" : t
    );

    if (selectedIdx === null || selectedIdx >= blocks.length) {
      selectedIdx = pickDefaultIdx(rawLabels);
    }

    const bar = document.createElement("div");
    bar.id = PAGER_ID;
    bar.className = "cit-term-pager";

    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "cit-term-btn";
    prev.textContent = "◀ 前";

    const select = document.createElement("select");
    select.className = "cit-term-select";
    labels.forEach((label, i) => {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = label;
      select.appendChild(opt);
    });

    const next = document.createElement("button");
    next.type = "button";
    next.className = "cit-term-btn";
    next.textContent = "次 ▶";

    const cur = currentTerm();
    const badge = document.createElement("span");
    badge.className = "cit-term-current";
    badge.textContent = "今学期：" + cur.year + "年度 " + cur.term;

    function sync() {
      select.value = String(selectedIdx);
      prev.disabled = selectedIdx <= 0;
      next.disabled = selectedIdx >= blocks.length - 1;
      applySelection(blocks);
    }

    function move(step) {
      const i = selectedIdx + step;
      if (i < 0 || i >= blocks.length) return;
      selectedIdx = i;
      sync();
    }

    prev.addEventListener("click", () => move(-1));
    next.addEventListener("click", () => move(1));
    select.addEventListener("change", () => {
      selectedIdx = Number(select.value);
      sync();
    });

    bar.append(prev, select, next, badge);
    blocks[0].parentNode.insertBefore(bar, blocks[0]);
    sync();
  }

  function tick() {
    if (!enabled) return;
    buildPager();
  }

  function start() {
    tick();
    // ajax で再描画されるため，DOM の変化を見て作り直す
    const obs = new MutationObserver(() => tick());
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }

  chrome.storage.local.get(DEFAULTS, (s) => {
    if (chrome.runtime.lastError) return;
    enabled = !!s.enabled && !!s.timetableYearTerm;
    if (!enabled) return;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
      start();
    }
  });

  chrome.storage.onChanged.addListener((c, area) => {
    if (area !== "local" || (!c.enabled && !c.timetableYearTerm)) return;
    chrome.storage.local.get(DEFAULTS, (s) => {
      if (chrome.runtime.lastError) return;
      enabled = !!s.enabled && !!s.timetableYearTerm;
      if (enabled) tick();
    });
  });
})();
})();

// ======== src/content/attendance.js ========
(function () {
// NexPortal - 出欠状況確認ページ（Atb005）の改善
//
// 出欠セルの中身（マーク・日付）を div.cit-att-cell で包み，「日付 → マーク」の順に並べ替える．
// ※ td 自体を flex にすると「表のセル」でなくなって行が崩れるため，ラッパを挟む必要がある．
//
// 見た目（複製テーブルの非表示・内部スクロール解除・sticky固定・セルの整形）は restyle.css 側．
// 通信は一切しない．改変OFF時（html に cit-restyle が無い）は何もしない．

"use strict";

(() => {
  // 本物のテーブル（複製には fixed_header_display_none_at_print が付く）
  function realTable() {
    const box = document.querySelector(
      ".scroll_div.attendanceInfo:not(.fixed_header_display_none_at_print)"
    );
    return box ? box.querySelector("table:not(.fixed_header_display_none_at_print)") : null;
  }

  function wrapCells() {
    const table = realTable();
    if (!table) return;
    for (const td of table.querySelectorAll("td.height")) {
      const mark = td.querySelector(":scope > .jugyoList");
      if (!mark) continue; // 曜日時限・授業科目のセルは対象外
      if (td.querySelector(":scope > .cit-att-cell")) continue; // 処理済み
      const date = td.querySelector(":scope > p.jugyoDate");
      const wrap = document.createElement("div");
      wrap.className = "cit-att-cell";
      if (date) wrap.appendChild(date); // 日付を上に
      wrap.appendChild(mark);
      td.appendChild(wrap);
    }
  }

  function tick() {
    if (!document.documentElement.classList.contains("cit-restyle")) return;
    wrapCells();
  }

  function start() {
    tick();
    // ajax で表が描き直されるため，変化を見て包み直す
    const obs = new MutationObserver(() => tick());
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
})();

// ======== src/mobile/settings-panel.js ========
(function () {
// NexPortal Mobile - ページ内の設定パネル（settings-panel.js）
//
// Chrome 拡張版はツールバーのポップアップ（src/panel/settings.html）で設定していたが，
// ユーザースクリプトにはポップアップが無い．代わりに，ポータルの画面右下に小さな歯車ボタンを置き，
// 押すと下からせり上がる設定パネル（ボトムシート）を開く．
//
// - 設定は shim.js 経由で端末内に保存するだけ．外部送信なし．
// - NexPortal 全体を OFF にしても歯車ボタンは残す（残さないと ON に戻せなくなるため）．
// - 可変の文字列はすべて textContent で入れる（innerHTML には固定文字列しか渡さない）．

(() => {
  const DEFAULTS = {
    enabled: true,
    largeText: false,
    topPage: true,
    gradesYearTerm: true,
    timetableYearTerm: true,
    attachInline: true,
    reloginButton: true,
    loadingUI: true,
  };

  const SECTIONS = [
    {
      title: "基本",
      rows: [
        {
          key: "enabled",
          label: "NexPortal を有効にする",
          note: "OFFにすると全機能が止まり，元のポータル表示に戻ります",
        },
        { key: "largeText", label: "文字を少し大きくする", indent: true },
      ],
    },
    {
      title: "ページ別の機能",
      rows: [
        {
          key: "topPage",
          label: "トップページを刷新",
          note: "クイックランチャー＋スケジュール＋掲示に整理",
        },
        {
          key: "gradesYearTerm",
          label: "成績を年度学期表示で開く",
          note: "分類別ではなく年度学期別を既定にする",
        },
        {
          key: "timetableYearTerm",
          label: "時間割を今学期優先で表示",
          note: "後期になったら前期は折りたたみ，今の学期から表示",
        },
        {
          key: "attachInline",
          label: "添付ファイルをその場で開く",
          note: "掲示の下にファイル名を表示し，タップで開く（ポータルからのみ取得・外部送信なし）",
        },
        {
          key: "reloginButton",
          label: "自動ログアウト画面に再ログインボタン",
          note: "ログインページへ1タップで移動（パスワードは保存しません）",
        },
        {
          key: "loadingUI",
          label: "読み込み中のアニメーションを表示",
          note: "画面中央に小さなカード（スピナー）を表示",
        },
      ],
    },
  ];

  const REPO = "https://github.com/frogama55/GENERIC_PORTAL";
  let fab = null;
  let backdrop = null;

  function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text != null) e.textContent = text;
    return e;
  }

  function buildRow(row, settings) {
    const label = el("label", "cit-set-row" + (row.indent ? " cit-set-row-indent" : ""));
    const input = document.createElement("input");
    input.type = "checkbox";
    input.className = "cit-set-check";
    input.checked = !!settings[row.key];
    input.addEventListener("change", () => {
      chrome.storage.local.set({ [row.key]: input.checked });
    });
    const text = el("span", "cit-set-text");
    text.appendChild(el("span", "cit-set-label", row.label));
    if (row.note) text.appendChild(el("small", "cit-set-note", row.note));
    label.appendChild(input);
    label.appendChild(text);
    return label;
  }

  function close() {
    if (!backdrop) return;
    backdrop.remove();
    backdrop = null;
    document.removeEventListener("keydown", onKey, true);
  }

  function onKey(e) {
    if (e.key === "Escape") close();
  }

  function open() {
    if (backdrop) return;
    chrome.storage.local.get(DEFAULTS, (settings) => {
      if (backdrop) return;
      backdrop = el("div", "cit-set-backdrop");
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) close();
      });

      const sheet = el("div", "cit-set-sheet");
      sheet.setAttribute("role", "dialog");
      sheet.setAttribute("aria-modal", "true");
      sheet.setAttribute("aria-label", "NexPortal 設定");

      const head = el("div", "cit-set-head");
      head.appendChild(el("span", "cit-set-title", "NexPortal 設定"));
      const closeBtn = el("button", "cit-set-close", "閉じる");
      closeBtn.type = "button";
      closeBtn.addEventListener("click", close);
      head.appendChild(closeBtn);
      sheet.appendChild(head);

      const body = el("div", "cit-set-body");
      body.appendChild(
        el(
          "p",
          "cit-set-disclaimer",
          "⚠️ 使用は自己責任でお願いします．読み取り専用で実データは変更しませんが，表示が誤ることは" +
            "あります．単位・出席・成績など重要な情報は，必ず本来のポータル画面でも確認してください．"
        )
      );

      for (const section of SECTIONS) {
        const box = el("div", "cit-set-section");
        box.appendChild(el("p", "cit-set-section-title", section.title));
        for (const row of section.rows) box.appendChild(buildRow(row, settings));
        body.appendChild(box);
      }

      body.appendChild(
        el(
          "p",
          "cit-set-hint",
          "設定はこの端末内にだけ保存されます．一部の設定は，ページを開き直したあとに反映されます．"
        )
      );

      const foot = el("div", "cit-set-foot");
      const pp = el("a", "cit-set-link", "プライバシーポリシー");
      pp.href = REPO + "/blob/main/cit-portal-mobile/PRIVACY_POLICY.md";
      const repo = el("a", "cit-set-link", "リポジトリ");
      repo.href = REPO;
      for (const a of [pp, repo]) {
        a.target = "_blank";
        a.rel = "noopener";
      }
      foot.appendChild(pp);
      foot.appendChild(repo);
      foot.appendChild(el("span", "cit-set-version", "v" + chrome.runtime.getManifest().version));
      body.appendChild(foot);

      sheet.appendChild(body);
      backdrop.appendChild(sheet);
      document.body.appendChild(backdrop);
      document.addEventListener("keydown", onKey, true);
    });
  }

  function ensureFab() {
    if (!document.body) return;
    if (fab && fab.isConnected) return;
    if (!fab) {
      fab = el("button", "cit-set-fab", "⚙");
      fab.type = "button";
      fab.title = "NexPortal 設定";
      fab.setAttribute("aria-label", "NexPortal 設定を開く");
      fab.addEventListener("click", open);
    }
    document.body.appendChild(fab);
  }

  function start() {
    ensureFab();
    // ポータル側の再描画で body 直下が作り直されてもボタンを戻す
    const obs = new MutationObserver(ensureFab);
    obs.observe(document.body, { childList: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
})();

})();
