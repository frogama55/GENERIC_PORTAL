// 設定画面のロジック。chrome.storage.local に読み書きするだけ。外部送信なし。
"use strict";

const DEFAULTS = {
  enabled: true,
  largeText: false,
  topPage: true,
  gradesYearTerm: true,
  attachInline: true,
  reloginButton: true,
  smartBack: false,
};

const enabledEl = document.getElementById("enabled");
const largeTextEl = document.getElementById("largeText");
const topPageEl = document.getElementById("topPage");
const gradesYearTermEl = document.getElementById("gradesYearTerm");
const attachInlineEl = document.getElementById("attachInline");
const reloginButtonEl = document.getElementById("reloginButton");
const smartBackEl = document.getElementById("smartBack");

// 現在の設定を読み込んでチェックボックスに反映
chrome.storage.local.get(DEFAULTS, (settings) => {
  enabledEl.checked = settings.enabled;
  largeTextEl.checked = settings.largeText;
  topPageEl.checked = settings.topPage;
  gradesYearTermEl.checked = settings.gradesYearTerm;
  attachInlineEl.checked = settings.attachInline;
  reloginButtonEl.checked = settings.reloginButton;
  smartBackEl.checked = settings.smartBack;
});

// 変更を保存（content script が storage.onChanged で拾って即反映する）
function save() {
  chrome.storage.local.set({
    enabled: enabledEl.checked,
    largeText: largeTextEl.checked,
    topPage: topPageEl.checked,
    gradesYearTerm: gradesYearTermEl.checked,
    attachInline: attachInlineEl.checked,
    reloginButton: reloginButtonEl.checked,
    smartBack: smartBackEl.checked,
  });
}

enabledEl.addEventListener("change", save);
largeTextEl.addEventListener("change", save);
topPageEl.addEventListener("change", save);
gradesYearTermEl.addEventListener("change", save);
attachInlineEl.addEventListener("change", save);
reloginButtonEl.addEventListener("change", save);
smartBackEl.addEventListener("change", save);
