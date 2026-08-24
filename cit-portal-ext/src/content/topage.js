// GENERIC PORTAL - トップページ刷新（topage.js）
//
// 頻繁に使う項目のアイコンバー（クイックランチャー）を設置する。まず Stage 1。
//
// クイックボタンは、元メニュー(#menuForm:mainMenu)の該当項目 <a> を「項目テキスト」で探して
// 同期的に .click() する（＝サイト本来のナビゲーションをそのまま使う）。POST遷移でも
// ポップアップでも確実に動く。URLを自作せず、ネットワークを新たに叩かない。
//
// 表示条件：グローバルメニュー(#menuForm:mainMenu)があるページ（＝ログイン済み）。
//   ポータルはページ内をAJAX/POSTで再描画するため、content script が再実行されなかったり
//   バーが消えたりする。そこで MutationObserver で監視し、消えていれば作り直す。
//
// 設定キー（chrome.storage.local）:
//   topPage : boolean  トップページ刷新の ON/OFF（デフォルト true）

"use strict";

(() => {
  const DEFAULTS = { topPage: true };
  let enabled = false;

  // 掲示を5件表示するため読み込み時に「もっと見る」を自動実行する。
  // （「編集中」誤判定の原因はメモ欄の display:none だったため、これは有効に戻す）
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
    // トップページ判定は中身ベース（#mainWrapBottomPortal はトップ固有）。
    // URLは Pky00102 / Bsa00101 と揺れるため使わない。
    const isTop = !!document.getElementById("mainWrapBottomPortal");
    document.documentElement.classList.toggle("cit-top", isTop);
  }

  // ---- トップページの掲示（重要）を 5件表示＋「もっと見る」→重要一覧へ ----

  // 重要タブの datalist（dispTab_1 内）
  function keijiList(support) {
    const panel = support.querySelector(".dispTab_1");
    return panel ? panel.querySelector("ul.ui-datalist-data") : null;
  }

  // 元の「もっと見る」リンク（a.ui-commandlink でテキストが「もっと見る」。自作リンクは除外される）
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
      // 掲示一覧ページへ遷移し、遷移先で「重要」タブを開くためのフラグを置く
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

    // 2) 元「もっと見る」を隠し、自前の「重要一覧へ」リンクを設置
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

  function tick() {
    if (!enabled) return;
    markTop();
    buildBar();
    if (document.documentElement.classList.contains("cit-top")) {
      handleTopBulletins();
    }
    activateKeijiTabIfFlagged();
  }

  function start() {
    tick();
    // AJAX/POSTでの部分再描画に備え、消えたら作り直す
    const obs = new MutationObserver(() => tick());
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }

  chrome.storage.local.get(DEFAULTS, (s) => {
    if (chrome.runtime.lastError) return;
    enabled = !!s.topPage;
    if (!enabled) return;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
      start();
    }
  });

  // 設定変更に追従
  chrome.storage.onChanged.addListener((c, area) => {
    if (area !== "local" || !c.topPage) return;
    enabled = !!c.topPage.newValue;
    if (enabled) {
      tick();
    } else {
      const b = document.getElementById("cit-quicklaunch");
      if (b) b.remove();
      document.documentElement.classList.remove("cit-top");
    }
  });
})();
