// GENERIC PORTAL - 成績ページ（Kmg00601）の改善
//
// Stage A：開いた直後の表示パターンを「年度学期表示」にする。
// Stage B：年度学期ごとにページ切り替え（プルダウン＋前後ボタン）で1つずつ表示する。
//
// Stage A の仕組み：
//   表示パターンは PrimeFaces ラジオ #funcForm:initPtn（0=まとめて表示 / 1=年度学期表示）。
//   ラジオ変更だけでは成績表は再描画されない（onchange の u: に結果表が含まれない）ので、
//   ラジオを切り替えたあと「表示」ボタン #funcForm:search を押す必要がある。
//   → その2操作を読み込み時に1回だけ代理実行する（＝人間が手で押すのと同じ操作）。
//
// Stage B の仕組み：
//   年度学期表示では #funcForm の直下に「学期ラベル(…:N:gakki) → 成績表(…:N:sskList)」が
//   N=0,1,2… と並ぶ（ブロックを囲むラッパ要素は無いフラット構造）。
//   そこで #funcForm の各直下要素を id 中の N でグループ分けし、選択中の N 以外を隠す。
//   表示の出し分けだけなので追加の通信は発生しない。
//   ※ 隠す方法は display:none ではなく画面外送り（.cit-grade-hidden）。サイトの変更チェック
//     (collectData) の集計対象から外れて「編集中」誤判定が出るのを避けるため（メモ欄と同じ理由）。
//
// 設定キー（chrome.storage.local）:
//   gradesYearTerm : boolean  この機能の ON/OFF（デフォルト true）

"use strict";

(() => {
  const DEFAULTS = { gradesYearTerm: true };
  const RADIO_YEAR_TERM = "funcForm:initPtn:1"; // 年度学期表示
  const SEARCH_BTN = "funcForm:search"; // 「表示」ボタン
  const PAGER_ID = "cit-grade-pager";
  const HIDDEN = "cit-grade-hidden";

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

  // PrimeFaces のラジオは実体 input が隠れているので、見た目のボックスをクリックする。
  // それで切り替わらなければ input を直接操作して change を発火させる。
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

  // ラジオ変更の ajax 完了を待ってから「表示」を押す。
  // 完了の目印：年度学期表示になると昇順/降順（#funcForm:nendoSort）の無効化が解ける。
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

  // #funcForm の直下要素を、id に含まれる繰り返しインデックス N でグループ分けする。
  // 返り値: Map<"0"|"1"|…, Element[]>（2ブロック以上あるときのみ）
  function collectBlocks() {
    const form = document.getElementById("funcForm");
    if (!form) return null;
    const lists = [...form.querySelectorAll('[id$=":sskList"]')];
    if (lists.length < 2) return null;
    // 例: "funcForm:j_idt193:0:sskList" → prefix "funcForm:j_idt193"
    // ※ j_idtNNN は動的に変わるので固定値にせず、実物から取り出す
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
  // （年度と学期は別要素なので、連続した文字列としては存在しない）
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
    // 直前の選択を保つ。無ければ最新（最後）の年度学期を表示する
    if (selectedIdx === null || !map.has(selectedIdx)) {
      selectedIdx = keys[keys.length - 1];
    }

    const bar = document.createElement("div");
    bar.id = PAGER_ID;
    bar.className = "cit-grade-pager";

    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "cit-grade-btn";
    prev.textContent = "◀ 前";

    const select = document.createElement("select");
    select.className = "cit-grade-select";
    // 表示名を作る。年度が拾えず「前期」「前期」と重複する場合は連番で区別する
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
    next.className = "cit-grade-btn";
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
    // ajax でフォームが再描画されるため、DOM の変化を見て作り直す
    const obs = new MutationObserver(() => tick());
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }

  chrome.storage.local.get(DEFAULTS, (s) => {
    if (chrome.runtime.lastError) return;
    enabled = !!s.gradesYearTerm;
    if (!enabled) return;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
      start();
    }
  });
})();
