// GENERIC PORTAL - 戻るボタン修正（navfix）
//
// 問題：このポータルはどのページでも「戻る」を押すと Bsd00701.xhtml に飛ばされ、
//       直前に見ていたページへ戻れない（サイト側が履歴を正しく積んでいない）。
//
// 対策（試作）：タブ内で訪問URLを自前のスタック(sessionStorage)に記録し、
//       戻る操作を popstate で捕まえて「スタック上の直前ページ」へ移動する。
//
// ⚠️ このポータルでの既知の問題：
//   内部ページはサーバー側にビュー状態(JSF ViewState)を持っており、
//   同じURLを GET で取り直すと HTTP 500 になる。この対策は location.assign で
//   直前URLを取り直すため、この500を踏んでしまう。→ 現状このポータルでは実用にならない。
//   そのためデフォルト OFF。有効化しても内部ページでは500になり得る点に注意。
//
// 設定キー（chrome.storage.local）:
//   smartBack : boolean  この機能の ON/OFF（デフォルト false）

"use strict";

(() => {
  const STACK_KEY = "citNavStack";
  const MAX = 50;

  function loadStack() {
    try {
      return JSON.parse(sessionStorage.getItem(STACK_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveStack(stack) {
    try {
      sessionStorage.setItem(STACK_KEY, JSON.stringify(stack.slice(-MAX)));
    } catch (e) {
      /* sessionStorage 使用不可時は黙って諦める（ポータルに影響を出さない） */
    }
  }

  // 現在ページをスタックに記録。
  // 直前と同じURL（リロードや、自前の戻りで到着した先）は積まない。
  function recordCurrent() {
    const here = location.href;
    const stack = loadStack();
    if (stack[stack.length - 1] !== here) {
      stack.push(here);
      saveStack(stack);
    }
  }

  // 戻る操作を捕捉。ガードとして積んだ履歴が pop された瞬間に発火する。
  function onPop() {
    const stack = loadStack();
    stack.pop(); // 現在ページを取り除く
    const prev = stack[stack.length - 1];
    saveStack(stack);

    if (prev && prev !== location.href) {
      // スタック上の直前ページへ（＝本来の戻る動作）
      location.assign(prev);
    } else {
      // 戻る先が無い（＝拡張が把握している最初のページ）。
      // サイトの壊れた戻り先へ飛ばさないよう、ガードを積み直して留まる。
      history.pushState({ citBack: true }, "");
    }
  }

  function setup() {
    recordCurrent();
    // 現在ページの上にガードの履歴エントリを積む（URLは変えない）。
    // 次の「戻る」でこのガードが pop され、onPop が本来の戻り先へ誘導する。
    history.pushState({ citBack: true }, "");
    window.addEventListener("popstate", onPop);
  }

  chrome.storage.local.get({ smartBack: false }, (s) => {
    if (chrome.runtime.lastError) return;
    if (s.smartBack) setup();
  });
})();
