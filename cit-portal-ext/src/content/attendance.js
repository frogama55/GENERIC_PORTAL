// GENERIC PORTAL - 出欠状況確認ページ（Atb005）の改善
//
// 日付に曜日を添える（例 04/13 → 04/13(月)）。
// 曜日は「開講年度学期」の年度＋日付から算出する。取れない場合は行の「曜日時限」から拾う
// （※ 週2回で曜日が異なる授業もあるため、可能なら日付から計算する方が正確）。
//
// レイアウト（複製テーブルの非表示・内部スクロール解除・sticky固定・セルの整形）は
// restyle.css 側で行う。ここは日付テキストの書き換えのみ。
//
// 通信は一切しない。改変OFF時（html に cit-restyle が無い）は何もしない。

"use strict";

(() => {
  const WD = ["日", "月", "火", "水", "木", "金", "土"];

  // 本物のテーブル（複製には fixed_header_display_none_at_print が付く）
  function realTable() {
    const box = document.querySelector(
      ".scroll_div.attendanceInfo:not(.fixed_header_display_none_at_print)"
    );
    return box ? box.querySelector("table") : null;
  }

  // 「2026年度 前期」から年度と学期を取り出す
  function termInfo() {
    const m = (document.body.textContent || "").match(
      /(20\d{2})\s*年度\s*(前期|後期|通年)?/
    );
    return m ? { year: Number(m[1]), term: m[2] || "" } : null;
  }

  // MM/DD と年度から曜日を求める（後期の1〜3月は翌年扱い）
  function weekdayFromDate(text, info) {
    if (!info) return null;
    const m = text.match(/^(\d{1,2})\/(\d{1,2})$/);
    if (!m) return null;
    const mo = Number(m[1]);
    const year = info.term === "後期" && mo <= 3 ? info.year + 1 : info.year;
    const d = new Date(year, mo - 1, Number(m[2]));
    return isNaN(d.getTime()) ? null : WD[d.getDay()];
  }

  function addWeekdays() {
    const table = realTable();
    if (!table) return;
    const info = termInfo();
    for (const tr of table.querySelectorAll("tbody tr")) {
      // 日付から曜日が出せない場合の保険として、行の「曜日時限」の曜日を使う
      const first = tr.querySelector("td");
      const fm = first && (first.textContent || "").match(/[月火水木金土日]/);
      const rowWd = fm ? fm[0] : null;

      for (const p of tr.querySelectorAll("p.jugyoDate")) {
        if (p.dataset.citWd) continue; // 二重付与を防ぐ
        const t = (p.textContent || "").trim();
        if (!t || /[（(]/.test(t)) {
          p.dataset.citWd = "1";
          continue;
        }
        const wd = weekdayFromDate(t, info) || rowWd;
        if (!wd) continue;
        p.dataset.citWd = "1";
        p.textContent = t + "(" + wd + ")";
      }
    }
  }

  // 出欠セルの中身（マーク・日付）を div.cit-att-cell で包み、「日付 → マーク」の順に並べ替える。
  // ※ td 自体を flex にすると「表のセル」でなくなって行が崩れるため、ラッパを挟む。
  function wrapCells() {
    const table = realTable();
    if (!table) return;
    for (const td of table.querySelectorAll("td.height")) {
      const mark = td.querySelector(":scope > .jugyoList");
      if (!mark) continue; // 曜日時限・授業科目のセルは対象外
      if (td.querySelector(":scope > .cit-att-cell")) continue; // 処理済み
      const date = td.querySelector(":scope > p.jugyoDate");
      const wrap = document.createElement("div");
      wrap.className = "cit-att-cell";
      if (date) wrap.appendChild(date); // 日付を上に
      wrap.appendChild(mark);
      td.appendChild(wrap);
    }
  }

  function tick() {
    if (!document.documentElement.classList.contains("cit-restyle")) return;
    addWeekdays();
    wrapCells();
  }

  function start() {
    tick();
    // ajax で表が描き直されるため、変化を見て付け直す
    const obs = new MutationObserver(() => tick());
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
