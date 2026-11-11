// NexPortal Mobile - chrome.* 互換レイヤ（shim.js）
//
// 目的：src/content/*.js は Chrome 拡張版（cit-portal-ext）と同じコードをそのまま使う．
//   それらが呼ぶ chrome.storage.local.get / set，chrome.storage.onChanged，
//   chrome.runtime.lastError / getManifest だけを，ユーザースクリプトの保存領域
//   （GM.getValue / GM.setValue）の上に再現する．
//
// 保存先：
//   1) GM.getValue / GM.setValue（Userscripts・Tampermonkey 等の保存領域．端末内のみ）
//   2) 使えない環境では，ポータルのオリジンの localStorage にフォールバック（これも端末内のみ）
//   どちらも外部送信はしない．設定は1つのキーに JSON でまとめて保存する．
//
// ビルド時に build.mjs が NEXPORTAL_VERSION を先に定義する．

const chrome = (() => {
  const STORE_KEY = "nexportal-settings";
  const hasGM =
    typeof GM !== "undefined" &&
    GM &&
    typeof GM.getValue === "function" &&
    typeof GM.setValue === "function";

  const listeners = [];
  let cache = null; // 読み込み済みの設定（オブジェクト）
  let loading = null; // 読み込み中の Promise
  let writeQueue = Promise.resolve(); // 書き込みの順番待ち

  function parse(raw) {
    try {
      const v = typeof raw === "string" ? JSON.parse(raw) : raw;
      return v && typeof v === "object" ? v : {};
    } catch (_) {
      return {};
    }
  }

  async function readRaw() {
    if (hasGM) {
      try {
        return parse(await GM.getValue(STORE_KEY, "{}"));
      } catch (_) {}
    }
    try {
      return parse(localStorage.getItem(STORE_KEY) || "{}");
    } catch (_) {
      return {};
    }
  }

  async function writeRaw(all) {
    const raw = JSON.stringify(all);
    if (hasGM) {
      try {
        await GM.setValue(STORE_KEY, raw);
        return;
      } catch (_) {}
    }
    try {
      localStorage.setItem(STORE_KEY, raw);
    } catch (_) {}
  }

  function load() {
    if (cache) return Promise.resolve(cache);
    if (!loading) {
      loading = readRaw().then((all) => {
        cache = all;
        loading = null;
        return all;
      });
    }
    return loading;
  }

  function fire(changes) {
    if (!Object.keys(changes).length) return;
    for (const fn of listeners.slice()) {
      try {
        fn(changes, "local");
      } catch (_) {}
    }
  }

  function diff(before, after) {
    const changes = {};
    for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
      if (before[k] !== after[k]) changes[k] = { oldValue: before[k], newValue: after[k] };
    }
    return changes;
  }

  // 別タブで設定を変えた場合に備え，タブが前面に戻ったら読み直して差分を通知する
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible" || !cache) return;
    const before = cache;
    readRaw().then((all) => {
      cache = all;
      fire(diff(before, all));
    });
  });

  return {
    runtime: {
      lastError: null,
      getManifest: () => ({ version: NEXPORTAL_VERSION }),
    },
    storage: {
      local: {
        // chrome.storage.local.get(既定値オブジェクト, callback) の形だけ対応
        get(defaults, cb) {
          load().then(() => {
            const all = cache;
            const out = Object.assign({}, defaults);
            for (const k of Object.keys(defaults || {})) {
              if (k in all) out[k] = all[k];
            }
            cb(out);
          });
        },
        set(obj, cb) {
          load().then(() => {
            // 連続して呼ばれても取りこぼさないよう，必ず「最新の cache」を土台にする
            const before = cache;
            const next = Object.assign({}, before, obj);
            const changes = diff(before, next);
            cache = next;
            // 書き込みは1件ずつ順番に（前の書き込みを新しい書き込みが追い越さないように）
            writeQueue = writeQueue
              .then(() => writeRaw(next))
              .then(() => {
                fire(changes);
                if (cb) cb();
              });
          });
        },
      },
      onChanged: {
        addListener(fn) {
          listeners.push(fn);
        },
      },
    },
  };
})();
