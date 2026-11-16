// NexPortal Mobile - ローディングUI用ブリッジ（page-bridge.js）※ページ側の世界で動く
//
// 【スマホ版の注意】Chrome 拡張版では manifest の "world": "MAIN" でページ側に置いていたが，
// ユーザースクリプトでは inject.js が <script> 要素としてページへ差し込む（中身は同じ）．
// 差し込みに成功した合図として <html data-cit-bridge="1"> を付ける（inject.js が確認する）．
//
// PrimeFaces は AJAX の送信/完了/失敗を jQuery の `$(document).trigger('pfAjaxSend')` 等で
// 通知する．jQuery の trigger はネイティブの DOM イベントを発火しないため，拡張の content script
// （隔離された世界．ページの jQuery も見えない）からは addEventListener では受け取れない．
// そこで manifest の "world": "MAIN" でページ側に置いたこの小さなスクリプトが jQuery イベントを
// 購読し，ネイティブの CustomEvent に変換して document へ流す．loading.js がそれを受け取る．
//
// やるのはこの変換と，下の「添付ファイル表示用のタブを開く」だけ．通信・ページ変数の書き換え・
// データの読み取りはしない．
//
// 購読するイベント：
//   pfAjaxSend / pfAjaxComplete / pfAjaxError … PrimeFaces 5 以降（1リクエストごとに対）
//   ajaxStart / ajaxStop                      … jQuery のグローバル ajax イベント（古い PrimeFaces 向け．
//                                                ajaxStop は「全部終わった」合図なので idle として流す）

(() => {
  document.documentElement.setAttribute("data-cit-bridge", "1");

  function emit(name) {
    document.dispatchEvent(new CustomEvent(name));
  }

  function bind() {
    const $ = window.jQuery;
    if (!$ || !$.fn) return false;
    const d = $(document);
    d.on("pfAjaxSend", () => emit("cit-ajax-start"));
    d.on("pfAjaxComplete pfAjaxError", () => emit("cit-ajax-end"));
    d.on("ajaxStart", () => emit("cit-ajax-start"));
    d.on("ajaxStop", () => emit("cit-ajax-idle"));
    return true;
  }

  // ---- 【スマホ版】添付ファイル表示用の新しいタブを，ページ側の世界で開く ----
  // attachment.js が，利用者がファイル名をタップした瞬間に合図（cit-tab-open）を送ってくる．
  // ユーザースクリプトの世界からは window.open できないブラウザがあるため，ここで代わりに開く．
  // やるのは「空のタブを開く → 渡されたURLへ移動 → 不要なら閉じる」だけ．移動先は，このページ自身が
  // 作った一時URL（blob:＋このサイトのオリジン）に限る．それ以外のURLへは移動しない．
  let tab = null;
  const root = document.documentElement;
  document.addEventListener("cit-tab-open", () => {
    try {
      tab = window.open("", "_blank");
    } catch (_) {
      tab = null;
    }
    if (tab) {
      try {
        tab.document.title = "読み込み中…";
        tab.document.body.textContent = "添付ファイルを読み込んでいます…";
      } catch (_) {}
    }
    root.setAttribute("data-cit-tab", tab ? "1" : "0");
  });
  document.addEventListener("cit-tab-go", () => {
    const url = root.getAttribute("data-cit-tab-url") || "";
    root.removeAttribute("data-cit-tab-url");
    const t = tab;
    tab = null;
    if (!t) return;
    if (url.indexOf("blob:" + location.origin + "/") === 0) t.location.replace(url);
    else t.close();
  });
  document.addEventListener("cit-tab-close", () => {
    if (tab) {
      try {
        tab.close();
      } catch (_) {}
    }
    tab = null;
  });

  if (bind()) return;
  // document_idle で走るので通常は jQuery が居るが，念のため最大10秒待つ
  let tries = 50;
  const timer = setInterval(() => {
    if (bind() || --tries <= 0) clearInterval(timer);
  }, 200);
})();
