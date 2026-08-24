// GENERIC PORTAL - content script
//
// 役割：<html> にクラスを付け外しするだけ。実際の見た目は restyle.css が担当する。
// ネットワーク送信は一切しない。chrome.storage.local から設定を読むのみ。
//
// 設定キー（chrome.storage.local）:
//   enabled    : boolean  改変全体の ON/OFF（デフォルト true）
//   largeText  : boolean  文字を少し大きくする（デフォルト false）

"use strict";

const ROOT = document.documentElement;
const CLASS_ENABLED = "cit-restyle";
const CLASS_LARGE = "cit-restyle-large";

const DEFAULTS = { enabled: true, largeText: false };

// document_start 時点で描画前にスタイルを当ててちらつきを防ぐ。
// デフォルトは ON なので、まず即座にクラスを付けておき、
// storage 読み込み後に OFF なら外す（OFF は非デフォルトなので実害は最小）。
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

// 掲示の検索：黄色い検索ボタンをCSSで隠すため、入力欄で Enter を押したら
// 元の検索ボタン(#funcForm:search)のクリックを呼んで検索を実行する。
// （サイト本来の検索を叩くだけ。外部送信はしない）
// ※ ajax で検索エリアが再描画されても効くよう document への委譲で登録する。
document.addEventListener(
  "keydown",
  (e) => {
    if (e.key !== "Enter") return;
    // IME変換確定のEnterを検索実行と誤認しない（日本語入力対策）。
    // 変換中は isComposing=true、環境によっては keyCode=229 になる。
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

// 掲示ダイアログ内のスクロール速度を通常のブラウザと同じにする。
// このポータルはホイールを二重に処理してスクロールが速すぎるため、
// ダイアログ内では自前で標準量だけスクロールし、サイト側の処理を止める。
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
