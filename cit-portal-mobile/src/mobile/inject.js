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

  // --- 1.5) 自前UIの拡大率（--cit-ui-scale） ---
  // このポータルはスマホ用の画面幅指定（viewport）が無く，スマホでは PC 用の幅（約980px）を
  // 縮小して表示する．そのままだと拡張が作るボタンやパネルも一緒に縮んで小さくなるので，
  // 「ページの幅 ÷ 端末の画面幅」を拡大率として <html> に渡し，mobile.css が zoom で打ち消す．
  // タッチ端末だけが対象．PC や，スマホ幅で表示されているページでは 1（等倍）になる．
  const touch =
    typeof matchMedia === "function" && matchMedia("(hover: none) and (pointer: coarse)").matches;
  function updateUiScale() {
    const root = document.documentElement;
    if (!root) return;
    let scale = 1;
    if (touch && window.screen) {
      const landscape = matchMedia("(orientation: landscape)").matches;
      const a = screen.width;
      const b = screen.height;
      const device = landscape ? Math.max(a, b) : Math.min(a, b);
      if (device > 0 && root.clientWidth > 0) scale = root.clientWidth / device;
    }
    scale = Math.min(4, Math.max(1, scale));
    root.style.setProperty("--cit-ui-scale", scale.toFixed(3));
  }
  updateUiScale();
  document.addEventListener("DOMContentLoaded", updateUiScale, { once: true });
  window.addEventListener("resize", updateUiScale);
  window.addEventListener("orientationchange", () => setTimeout(updateUiScale, 300));

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
