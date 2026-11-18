// NexPortal Mobile - ダイアログの「閉じる」ボタンを指で押せる大きさにする（dialog-close.js）
//
// 掲示詳細・シラバスなどのダイアログ（PrimeFaces の .ui-dialog）は，右上に小さな × アイコン
// （a.ui-dialog-titlebar-close）しかない．スマホでは PC 用の幅を縮小表示するので，この × は
// 数ピクセルになり，実機ではタップしても当たらなかった．
//
// タッチ端末では，ダイアログのタイトルバーに大きな「✕ 閉じる」ボタンを足す．押すと元の × を
// 代理クリックするだけ（閉じる処理はサイト本来のもの．新しい通信経路は足さない）．
// 元の × が無いダイアログには何もしない．大きさは mobile.css が縮小率に合わせて拡大する．

(() => {
  const IS_TOUCH =
    typeof matchMedia === "function" && matchMedia("(hover: none) and (pointer: coarse)").matches;
  if (!IS_TOUCH) return;

  const DEFAULTS = { enabled: true };
  let enabled = true;

  function addButtons() {
    if (!enabled) return;
    for (const bar of document.querySelectorAll(".ui-dialog .ui-dialog-titlebar")) {
      if (bar.querySelector(":scope > .cit-dlg-close")) continue;
      const orig = bar.querySelector(".ui-dialog-titlebar-close");
      if (!orig) continue;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cit-dlg-close";
      btn.setAttribute("aria-label", "閉じる");
      btn.textContent = "✕ 閉じる";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const target = bar.querySelector(".ui-dialog-titlebar-close") || orig;
        target.click();
      });
      bar.appendChild(btn);
      bar.classList.add("cit-dlg-bar");
    }
  }

  function start() {
    addButtons();
    let scheduled = false;
    new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        addButtons();
      });
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  chrome.storage.local.get(DEFAULTS, (s) => {
    enabled = !!s.enabled;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
      start();
    }
  });
  chrome.storage.onChanged.addListener((c) => {
    if (c.enabled) enabled = !!c.enabled.newValue;
    for (const b of document.querySelectorAll(".cit-dlg-close")) b.hidden = !enabled;
    if (enabled) addButtons();
  });
})();
