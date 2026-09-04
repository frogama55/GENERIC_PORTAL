// NexPortal - トップページ刷新（topage.js）
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

  // ---- その日のスケジュール：同じ授業が連続するコマを1つにまとめる ----
  // 例）09:00-10:00 と 10:00-11:00 が同じ授業なら、先頭を「09:00 - 11:00」にして後続を隠す。

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

  // .lessonHead 内の「HH:MM - HH:MM」の終了時刻だけ書き換える。
  // 開始と終了が別要素に分かれている場合（1つのテキストノードに揃っていない場合）にも対応する。
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
    // 分かれている場合は、最後に出てくる時刻＝終了時刻とみなして置き換える
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
    if (!enabled) return;
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
