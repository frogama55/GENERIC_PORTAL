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
