// NexPortal - ローディングUIの刷新（loading.js）
//
// 目的：ポータルの画面切り替え・検索・タブ切替などは PrimeFaces の部分AJAXで行われ，
//   その間ポータル本来の（地味な）ローディング表示が画面中央に出る．これを拡張のデザインに
//   合わせた中央の小さなカード（スピナー＋「読み込み中…」）に置き換える．
//
// 仕組み：
//   AJAX の開始/終了は PrimeFaces が jQuery イベントで通知するが，それは隔離された content script
//   からは直接受け取れない．ページ側で動く loading-bridge.js がネイティブの CustomEvent
//   （cit-ajax-start / cit-ajax-end / cit-ajax-idle）に変換して流すので，ここではそれを購読する．
//   同時に複数のAJAXが走ることがあるため進行中カウントで管理し，0になったら隠す．
//   idle（jQuery の ajaxStop＝全部完了）が来たらカウントを0にリセットする．
//   速いAJAXでチラつかないよう，表示は少し遅らせて（SHOW_DELAY_MS）から出す．
//   加えて，メニュー遷移などの通常のページ遷移（フルPOST）中も beforeunload で出す．
//   通信・ポータル側DOMの書き換えはしない．
//
// 設定キー（chrome.storage.local）:
//   enabled    : boolean  拡張全体の ON/OFF（他の設定と AND で効く）
//   loadingUI  : boolean  この機能の ON/OFF（デフォルト true）

"use strict";

(() => {
  const DEFAULTS = { enabled: true, loadingUI: true };
  const SHOW_DELAY_MS = 150; // これより速く終わる処理では出さない
  const MAX_SHOW_MS = 20000; // 終了通知を取りこぼしても出しっぱなしにしない保険
  let masterEnabled = true;
  let featureEnabled = true;
  let pending = 0;
  let box = null;
  let showTimer = null;
  let hideTimer = null;
  let safetyTimer = null;
  let listening = false;

  function ensureBox() {
    if (box && box.isConnected) return box;
    box = document.createElement("div");
    box.className = "cit-loading-box";
    box.setAttribute("role", "status");
    box.innerHTML = '<div class="cit-spinner" aria-hidden="true"></div><span>読み込み中…</span>';
    (document.body || document.documentElement).appendChild(box);
    return box;
  }

  function show() {
    if (!masterEnabled || !featureEnabled) return;
    clearTimeout(hideTimer);
    if (showTimer) return; // 既に表示予約済み
    showTimer = setTimeout(() => {
      showTimer = null;
      ensureBox().classList.add("cit-loading-active");
    }, SHOW_DELAY_MS);
    clearTimeout(safetyTimer);
    safetyTimer = setTimeout(reset, MAX_SHOW_MS);
  }

  function hide() {
    clearTimeout(showTimer);
    showTimer = null;
    if (!box) return;
    // 消えるときも一拍おく（連続AJAXの合間に点滅しないように）
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (pending <= 0) box.classList.remove("cit-loading-active");
    }, 120);
  }

  function reset() {
    pending = 0;
    hide();
  }

  function onStart() {
    pending++;
    show();
  }

  function onEnd() {
    pending = Math.max(0, pending - 1);
    if (pending === 0) hide();
  }

  function onUnload() {
    // ページ遷移中は遅延なしで即表示
    if (!masterEnabled || !featureEnabled) return;
    clearTimeout(showTimer);
    showTimer = null;
    ensureBox().classList.add("cit-loading-active");
  }

  function attachListeners() {
    if (listening) return;
    listening = true;
    document.addEventListener("cit-ajax-start", onStart);
    document.addEventListener("cit-ajax-end", onEnd);
    document.addEventListener("cit-ajax-idle", reset);
    window.addEventListener("beforeunload", onUnload);
  }

  function detachListeners() {
    if (!listening) return;
    listening = false;
    document.removeEventListener("cit-ajax-start", onStart);
    document.removeEventListener("cit-ajax-end", onEnd);
    document.removeEventListener("cit-ajax-idle", reset);
    window.removeEventListener("beforeunload", onUnload);
    clearTimeout(showTimer);
    showTimer = null;
    if (box) box.classList.remove("cit-loading-active");
    pending = 0;
  }

  // 機能ON中だけ html に付け，ポータル本来の BlockUI 表示を CSS で隠す（OFFなら元に戻る）
  const CLASS_CUSTOM = "cit-loading-custom";

  function start() {
    document.documentElement.classList.add(CLASS_CUSTOM);
    ensureBox();
    attachListeners();
  }

  chrome.storage.local.get(DEFAULTS, (s) => {
    if (chrome.runtime.lastError) return;
    masterEnabled = !!s.enabled;
    featureEnabled = !!s.loadingUI;
    if (!masterEnabled || !featureEnabled) return;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
      start();
    }
  });

  chrome.storage.onChanged.addListener((c, area) => {
    if (area !== "local" || (!c.enabled && !c.loadingUI)) return;
    if (c.enabled) masterEnabled = !!c.enabled.newValue;
    if (c.loadingUI) featureEnabled = !!c.loadingUI.newValue;
    if (masterEnabled && featureEnabled) {
      start();
    } else {
      document.documentElement.classList.remove(CLASS_CUSTOM);
      detachListeners();
    }
  });
})();
