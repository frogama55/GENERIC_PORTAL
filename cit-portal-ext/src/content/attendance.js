// NexPortal - 出欠状況確認ページ（Atb005）の改善
//
// 出欠セルの中身（マーク・日付）を div.cit-att-cell で包み、「日付 → マーク」の順に並べ替える。
// ※ td 自体を flex にすると「表のセル」でなくなって行が崩れるため、ラッパを挟む必要がある。
//
// 見た目（複製テーブルの非表示・内部スクロール解除・sticky固定・セルの整形）は restyle.css 側。
// 通信は一切しない。改変OFF時（html に cit-restyle が無い）は何もしない。

"use strict";

(() => {
  // 本物のテーブル（複製には fixed_header_display_none_at_print が付く）
  function realTable() {
    const box = document.querySelector(
      ".scroll_div.attendanceInfo:not(.fixed_header_display_none_at_print)"
    );
    return box ? box.querySelector("table:not(.fixed_header_display_none_at_print)") : null;
  }

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
    wrapCells();
  }

  function start() {
    tick();
    // ajax で表が描き直されるため、変化を見て包み直す
    const obs = new MutationObserver(() => tick());
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
