// 設定画面のロジック．chrome.storage.local に読み書きするだけ．外部送信なし．
"use strict";

const DEFAULTS = {
  enabled: true,
  largeText: false,
  topPage: true,
  gradesYearTerm: true,
  timetableYearTerm: true,
  attachInline: true,
  reloginButton: true,
  loadingUI: true,
};

const enabledEl = document.getElementById("enabled");
const largeTextEl = document.getElementById("largeText");
const topPageEl = document.getElementById("topPage");
const gradesYearTermEl = document.getElementById("gradesYearTerm");
const timetableYearTermEl = document.getElementById("timetableYearTerm");
const attachInlineEl = document.getElementById("attachInline");
const reloginButtonEl = document.getElementById("reloginButton");
const loadingUIEl = document.getElementById("loadingUI");

// 現在の設定を読み込んでチェックボックスに反映
chrome.storage.local.get(DEFAULTS, (settings) => {
  enabledEl.checked = settings.enabled;
  largeTextEl.checked = settings.largeText;
  topPageEl.checked = settings.topPage;
  gradesYearTermEl.checked = settings.gradesYearTerm;
  timetableYearTermEl.checked = settings.timetableYearTerm;
  attachInlineEl.checked = settings.attachInline;
  reloginButtonEl.checked = settings.reloginButton;
  loadingUIEl.checked = settings.loadingUI;
});

// 変更を保存（content script が storage.onChanged で拾って即反映する）
function save() {
  chrome.storage.local.set({
    enabled: enabledEl.checked,
    largeText: largeTextEl.checked,
    topPage: topPageEl.checked,
    gradesYearTerm: gradesYearTermEl.checked,
    timetableYearTerm: timetableYearTermEl.checked,
    attachInline: attachInlineEl.checked,
    reloginButton: reloginButtonEl.checked,
    loadingUI: loadingUIEl.checked,
  });
}

enabledEl.addEventListener("change", save);
largeTextEl.addEventListener("change", save);
topPageEl.addEventListener("change", save);
gradesYearTermEl.addEventListener("change", save);
timetableYearTermEl.addEventListener("change", save);
attachInlineEl.addEventListener("change", save);
reloginButtonEl.addEventListener("change", save);
loadingUIEl.addEventListener("change", save);

// フッターにバージョン番号を表示
const versionEl = document.getElementById("version");
if (versionEl) versionEl.textContent = "v" + chrome.runtime.getManifest().version;
