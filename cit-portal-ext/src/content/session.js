// GENERIC PORTAL - セッション切れ時の再ログイン導線（session.js）
//
// 一定時間無操作で自動ログアウトされると、「長時間操作が行われなかったため、自動的にログアウト
// されました。この画面を閉じてください。」という行き止まり画面になる。この画面を検知して
// 「ログインページへ」ボタンを出し、ワンクリックで再ログインに進めるようにする。
//
// 指示書フェーズ3の安全な範囲：
//   ✅ セッション切れを検知して導線を出す／ワンクリックでログインページを開く
//   ❌ パスワードの保持・自動再ログインはしない
//
// 検知の要点：
//   - 「自動的にログアウト」はログイン画面にも注意書きとして出ることがあるため、それだけでは判定しない。
//     行き止まり画面に固有の「この画面を閉じ（てください）」を必須にする。
//   - ログインフォーム（パスワード欄）がある画面には出さない。
//   - メッセージが後から動的に描画される場合に備え、一定時間 DOM の変化を監視する。
//
// 設定キー（chrome.storage.local）:
//   reloginButton : boolean  この機能の ON/OFF（デフォルト true）

"use strict";

(() => {
  // ポータル入口。セッションが無いのでアクセスするとSSOログインへリダイレクトされる。
  const LOGIN_URL = "https://portal.chibatech.ac.jp/uprx/";
  const DEFAULTS = { reloginButton: true };
  const WATCH_MS = 15000; // 動的描画を待つ監視時間

  // 行き止まりの自動ログアウト画面か？（「この画面を閉じ」を必須にしてログイン画面と区別）
  function isLogoutDeadEnd() {
    const t = (document.body && document.body.textContent) || "";
    return /この画面を閉じ/.test(t) && /ログアウト|長時間操作/.test(t);
  }

  // ログイン用フォームがある画面（＝ここには再ログインボタンは出さない）
  function hasLoginForm() {
    return !!document.querySelector('input[type="password"], #kc-form-login');
  }

  // メッセージが入っている一番内側の箱を探す（ボタンの設置先）
  function findBox() {
    const els = [
      ...document.body.querySelectorAll("div,section,article,td,fieldset,p"),
    ];
    const both = els.filter((el) => {
      const t = el.textContent || "";
      return /この画面を閉じ/.test(t) && /ログアウト|長時間操作/.test(t);
    });
    if (!both.length) return null;
    both.sort((a, b) => (a.textContent || "").length - (b.textContent || "").length);
    return both[0];
  }

  function addButton() {
    if (document.getElementById("cit-relogin-btn")) return;
    const a = document.createElement("a");
    a.id = "cit-relogin-btn";
    a.className = "cit-relogin-btn";
    a.href = LOGIN_URL;
    a.textContent = "ログインページへ";

    const wrap = document.createElement("div");
    wrap.className = "cit-relogin-wrap";
    wrap.appendChild(a);

    const box = findBox();
    if (box) box.appendChild(wrap);
    else document.body.appendChild(wrap);
  }

  // 追加を試みる。true = これ以上の監視は不要（追加済み／対象外が確定）。
  function attempt() {
    if (document.getElementById("cit-relogin-btn")) return true;
    if (!document.body) return false;
    if (hasLoginForm()) return true; // ログイン画面には出さない
    if (!isLogoutDeadEnd()) return false;
    addButton();
    return true;
  }

  function start() {
    if (attempt()) return;
    // メッセージが後から描画される場合に備えて一定時間だけ監視する
    const obs = new MutationObserver(() => {
      if (attempt()) stop();
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    const timer = setTimeout(stop, WATCH_MS);
    function stop() {
      obs.disconnect();
      clearTimeout(timer);
    }
  }

  chrome.storage.local.get(DEFAULTS, (s) => {
    if (chrome.runtime.lastError) return;
    if (!s.reloginButton) return;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
      start();
    }
  });
})();
