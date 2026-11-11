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
