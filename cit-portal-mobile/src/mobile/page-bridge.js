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
// やるのはこの変換だけ．通信・DOM改変・ページ変数の書き換え・データの読み取りはしない．
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

  if (bind()) return;
  // document_idle で走るので通常は jQuery が居るが，念のため最大10秒待つ
  let tries = 50;
  const timer = setInterval(() => {
    if (bind() || --tries <= 0) clearInterval(timer);
  }, 200);
})();
