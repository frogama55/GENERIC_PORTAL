// CIT Portal Restyle - 成績ページ（Kmg00601）の改善
//
// Stage A：開いた直後の表示パターンを「年度学期表示」にする。
//
// 仕組み：
//   表示パターンは PrimeFaces のラジオ #funcForm:initPtn（0=まとめて表示 / 1=年度学期表示）。
//   ラジオ変更だけでは成績表は再描画されない（onchange の u: に結果表が含まれないため）ので、
//   ラジオを切り替えたあと「表示」ボタン #funcForm:search を押す必要がある。
//   → その2操作を読み込み時に1回だけ代理実行する（＝人間が手で押すのと同じ操作）。
//
// 注意：読み込み時に ajax が2回だけ発生する（ポーリングではない）。外部送信はしない。
//
// 設定キー（chrome.storage.local）:
//   gradesYearTerm : boolean  この機能の ON/OFF（デフォルト true）

"use strict";

(() => {
  const DEFAULTS = { gradesYearTerm: true };
  const RADIO_YEAR_TERM = "funcForm:initPtn:1"; // 年度学期表示
  const SEARCH_BTN = "funcForm:search"; // 「表示」ボタン
  let enabled = true;
  let done = false; // ページ読み込みごとに1回だけ実行する

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

  function run() {
    if (done || !enabled) return;
    if (!isGradesPage()) return;
    const radio = yearTermRadio();
    if (!radio) return;
    done = true;
    if (radio.checked) return; // 既に年度学期表示なら何もしない
    selectYearTerm(radio);
    clickSearchWhenReady(25); // 最大約5秒待つ
  }

  function start() {
    run();
    // ajax でフォームが再描画されるため、DOM の変化を見て初回のみ実行する
    const obs = new MutationObserver(() => run());
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
