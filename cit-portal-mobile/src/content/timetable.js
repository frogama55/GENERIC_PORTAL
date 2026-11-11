// NexPortal - 時間割ページ（Kmd00801）の学期優先表示
//
// 時間割は前期・後期の table.classTable が並んで両方表示される作りになっている．
// 実機確認：各学期は「2026年度 後期」のような凡例（legend）を持つ折りたたみ枠（fieldset）に
// 入っており，その中に .rishuArea > .ofAuto > table.classTable がある．
// そのため後期になっても前期の表が先に目に入り，見たい方を探す必要がある．
//
// 成績ページ（grades.js）で先に実装した「学期ごとに1つずつページ切り替え」と同じUI
// （プルダウン＋前後ボタン，.cit-term-* クラス）をここでも使い，既定表示を「今学期」にする．
//   今学期の判定：4/1〜9/15 は前期，それ以外は後期（依頼者指定）．
//   年度は 4月〜翌3月を1年度とし（1〜3月は前年の年度），「YYYY年度 後期」のように年度も併せて照合する．
//
// 学期ブロックの見分け方：
//   table.classTable ごとに，それを囲む fieldset（.ui-fieldset）を1ブロックとする
//   （無ければ .ofAuto，それも無ければテーブル自身）．ラベルは fieldset の legend から
//   「YYYY」と「前期/後期/通年」を拾って組み立てる．legend が無い場合は直前の見出しを走査する．
//   2ブロック以上見つからない場合は何もしない（あれば効く／なければ無視）．
//
// 設定キー（chrome.storage.local）:
//   enabled          : boolean  拡張全体の ON/OFF（他の設定と AND で効く）
//   timetableYearTerm: boolean  この機能の ON/OFF（デフォルト true）

"use strict";

(() => {
  const DEFAULTS = { enabled: true, timetableYearTerm: true };
  const PAGER_ID = "cit-timetable-pager";
  const HIDDEN = "cit-term-hidden";
  const TERM_RE = /(前学期|後学期|前期|後期|通年)/;

  let enabled = true;
  let selectedIdx = null; // 選択中のブロックindex（ajax再描画をまたいで保持）

  // 今学期（4/1〜9/15＝前期，それ以外＝後期）と年度（4月始まり）
  function currentTerm() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const first = (m >= 4 && m <= 8) || (m === 9 && d <= 15);
    const year = m >= 4 ? y : y - 1;
    return { year, term: first ? "前期" : "後期" };
  }

  function normalizeTerm(t) {
    return t === "前学期" ? "前期" : t === "後学期" ? "後期" : t;
  }

  // 見出しテキストから「YYYY年度 前期」を組み立てる（年度・学期のどちらか一方でも可）
  function parseLabel(text) {
    const s = (text || "").replace(/\s+/g, " ").trim();
    const y = s.match(/(20\d{2})/);
    const t = s.match(TERM_RE);
    if (y && t) return y[1] + "年度 " + normalizeTerm(t[1]);
    if (t) return normalizeTerm(t[1]);
    if (y) return y[1] + "年度";
    return null;
  }

  // legend が無い場合の保険：ブロックの直前きょうだい／祖先の直前きょうだいの見出しを見る
  function nearbyLabel(block) {
    let node = block;
    for (let depth = 0; depth < 4 && node; depth++) {
      let sib = node.previousElementSibling;
      let hops = 0;
      while (sib && hops < 3) {
        const label = parseLabel((sib.textContent || "").slice(0, 60));
        if (label) return label;
        sib = sib.previousElementSibling;
        hops++;
      }
      node = node.parentElement;
    }
    return null;
  }

  function blockLabel(block, idx) {
    const legend = block.querySelector("legend, .ui-fieldset-legend");
    return (
      (legend && parseLabel(legend.textContent)) ||
      nearbyLabel(block) ||
      "区分 " + (idx + 1)
    );
  }

  // table.classTable を内包する「ブロック」を集める
  function collectBlocks() {
    const tables = [...document.querySelectorAll("table.classTable")];
    if (tables.length < 2) return null;
    const blocks = [];
    const seen = new Set();
    for (const table of tables) {
      // 実機：fieldset.ui-fieldset.colGakki（学期ごとの折りたたみ枠）
      const block =
        table.closest(".colGakki, .ui-fieldset, fieldset") || table.closest(".ofAuto") || table;
      if (seen.has(block)) continue;
      seen.add(block);
      blocks.push(block);
    }
    return blocks.length >= 2 ? blocks : null;
  }

  // 既定表示：年度＋学期が一致 → 学期だけ一致 → 最後（最新想定）．同名が複数なら後ろを優先
  function pickDefaultIdx(labels) {
    const cur = currentTerm();
    const yearStr = cur.year + "年度";
    const both = labels.map((l, i) => (l.includes(yearStr) && l.includes(cur.term) ? i : -1));
    const bothHit = both.filter((i) => i >= 0);
    if (bothHit.length) return bothHit[bothHit.length - 1];
    const term = labels.map((l, i) => (l.includes(cur.term) ? i : -1)).filter((i) => i >= 0);
    if (term.length) return term[term.length - 1];
    return labels.length - 1;
  }

  function applySelection(blocks) {
    blocks.forEach((block, i) => block.classList.toggle(HIDDEN, i !== selectedIdx));
  }

  function buildPager() {
    if (document.getElementById(PAGER_ID)) return; // 既にある
    const blocks = collectBlocks();
    if (!blocks) return;

    const rawLabels = blocks.map((b, i) => blockLabel(b, i));
    const labels = rawLabels.map((t, i) =>
      rawLabels.filter((x) => x === t).length > 1 ? t + "（" + (i + 1) + "）" : t
    );

    if (selectedIdx === null || selectedIdx >= blocks.length) {
      selectedIdx = pickDefaultIdx(rawLabels);
    }

    const bar = document.createElement("div");
    bar.id = PAGER_ID;
    bar.className = "cit-term-pager";

    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "cit-term-btn";
    prev.textContent = "◀ 前";

    const select = document.createElement("select");
    select.className = "cit-term-select";
    labels.forEach((label, i) => {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = label;
      select.appendChild(opt);
    });

    const next = document.createElement("button");
    next.type = "button";
    next.className = "cit-term-btn";
    next.textContent = "次 ▶";

    const cur = currentTerm();
    const badge = document.createElement("span");
    badge.className = "cit-term-current";
    badge.textContent = "今学期：" + cur.year + "年度 " + cur.term;

    function sync() {
      select.value = String(selectedIdx);
      prev.disabled = selectedIdx <= 0;
      next.disabled = selectedIdx >= blocks.length - 1;
      applySelection(blocks);
    }

    function move(step) {
      const i = selectedIdx + step;
      if (i < 0 || i >= blocks.length) return;
      selectedIdx = i;
      sync();
    }

    prev.addEventListener("click", () => move(-1));
    next.addEventListener("click", () => move(1));
    select.addEventListener("change", () => {
      selectedIdx = Number(select.value);
      sync();
    });

    bar.append(prev, select, next, badge);
    blocks[0].parentNode.insertBefore(bar, blocks[0]);
    sync();
  }

  function tick() {
    if (!enabled) return;
    buildPager();
  }

  function start() {
    tick();
    // ajax で再描画されるため，DOM の変化を見て作り直す
    const obs = new MutationObserver(() => tick());
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }

  chrome.storage.local.get(DEFAULTS, (s) => {
    if (chrome.runtime.lastError) return;
    enabled = !!s.enabled && !!s.timetableYearTerm;
    if (!enabled) return;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
      start();
    }
  });

  chrome.storage.onChanged.addListener((c, area) => {
    if (area !== "local" || (!c.enabled && !c.timetableYearTerm)) return;
    chrome.storage.local.get(DEFAULTS, (s) => {
      if (chrome.runtime.lastError) return;
      enabled = !!s.enabled && !!s.timetableYearTerm;
      if (enabled) tick();
    });
  });
})();
