// NexPortal Mobile - ページ内の設定パネル（settings-panel.js）
//
// Chrome 拡張版はツールバーのポップアップ（src/panel/settings.html）で設定していたが，
// ユーザースクリプトにはポップアップが無い．代わりに，ポータルの画面右下に小さな歯車ボタンを置き，
// 押すと下からせり上がる設定パネル（ボトムシート）を開く．
//
// - 設定は shim.js 経由で端末内に保存するだけ．外部送信なし．
// - NexPortal 全体を OFF にしても歯車ボタンは残す（残さないと ON に戻せなくなるため）．
// - 可変の文字列はすべて textContent で入れる（innerHTML には固定文字列しか渡さない）．

(() => {
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

  const SECTIONS = [
    {
      title: "基本",
      rows: [
        {
          key: "enabled",
          label: "NexPortal を有効にする",
          note: "OFFにすると全機能が止まり，元のポータル表示に戻ります",
        },
        { key: "largeText", label: "文字を少し大きくする", indent: true },
      ],
    },
    {
      title: "ページ別の機能",
      rows: [
        {
          key: "topPage",
          label: "トップページを刷新",
          note: "クイックランチャー＋スケジュール＋掲示に整理",
        },
        {
          key: "gradesYearTerm",
          label: "成績を年度学期表示で開く",
          note: "分類別ではなく年度学期別を既定にする",
        },
        {
          key: "timetableYearTerm",
          label: "時間割を今学期優先で表示",
          note: "後期になったら前期は折りたたみ，今の学期から表示",
        },
        {
          key: "attachInline",
          label: "添付ファイルをその場で開く",
          note: "掲示の下にファイル名を表示し，タップで開く（ポータルからのみ取得・外部送信なし）",
        },
        {
          key: "reloginButton",
          label: "自動ログアウト画面に再ログインボタン",
          note: "ログインページへ1タップで移動（パスワードは保存しません）",
        },
        {
          key: "loadingUI",
          label: "読み込み中のアニメーションを表示",
          note: "画面中央に小さなカード（スピナー）を表示",
        },
      ],
    },
  ];

  const REPO = "https://github.com/frogama55/GENERIC_PORTAL";
  let fab = null;
  let backdrop = null;

  function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text != null) e.textContent = text;
    return e;
  }

  function buildRow(row, settings) {
    const label = el("label", "cit-set-row" + (row.indent ? " cit-set-row-indent" : ""));
    const input = document.createElement("input");
    input.type = "checkbox";
    input.className = "cit-set-check";
    input.checked = !!settings[row.key];
    input.addEventListener("change", () => {
      chrome.storage.local.set({ [row.key]: input.checked });
    });
    const text = el("span", "cit-set-text");
    text.appendChild(el("span", "cit-set-label", row.label));
    if (row.note) text.appendChild(el("small", "cit-set-note", row.note));
    label.appendChild(input);
    label.appendChild(text);
    return label;
  }

  function close() {
    if (!backdrop) return;
    backdrop.remove();
    backdrop = null;
    document.removeEventListener("keydown", onKey, true);
  }

  function onKey(e) {
    if (e.key === "Escape") close();
  }

  function open() {
    if (backdrop) return;
    chrome.storage.local.get(DEFAULTS, (settings) => {
      if (backdrop) return;
      backdrop = el("div", "cit-set-backdrop");
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) close();
      });

      const sheet = el("div", "cit-set-sheet");
      sheet.setAttribute("role", "dialog");
      sheet.setAttribute("aria-modal", "true");
      sheet.setAttribute("aria-label", "NexPortal 設定");

      const head = el("div", "cit-set-head");
      head.appendChild(el("span", "cit-set-title", "NexPortal 設定"));
      const closeBtn = el("button", "cit-set-close", "閉じる");
      closeBtn.type = "button";
      closeBtn.addEventListener("click", close);
      head.appendChild(closeBtn);
      sheet.appendChild(head);

      const body = el("div", "cit-set-body");
      body.appendChild(
        el(
          "p",
          "cit-set-disclaimer",
          "⚠️ 使用は自己責任でお願いします．読み取り専用で実データは変更しませんが，表示が誤ることは" +
            "あります．単位・出席・成績など重要な情報は，必ず本来のポータル画面でも確認してください．"
        )
      );

      for (const section of SECTIONS) {
        const box = el("div", "cit-set-section");
        box.appendChild(el("p", "cit-set-section-title", section.title));
        for (const row of section.rows) box.appendChild(buildRow(row, settings));
        body.appendChild(box);
      }

      body.appendChild(
        el(
          "p",
          "cit-set-hint",
          "設定はこの端末内にだけ保存されます．一部の設定は，ページを開き直したあとに反映されます．"
        )
      );

      const foot = el("div", "cit-set-foot");
      const pp = el("a", "cit-set-link", "プライバシーポリシー");
      pp.href = REPO + "/blob/main/cit-portal-mobile/PRIVACY_POLICY.md";
      const repo = el("a", "cit-set-link", "リポジトリ");
      repo.href = REPO;
      for (const a of [pp, repo]) {
        a.target = "_blank";
        a.rel = "noopener";
      }
      foot.appendChild(pp);
      foot.appendChild(repo);
      foot.appendChild(el("span", "cit-set-version", "v" + chrome.runtime.getManifest().version));
      body.appendChild(foot);

      sheet.appendChild(body);
      backdrop.appendChild(sheet);
      document.body.appendChild(backdrop);
      document.addEventListener("keydown", onKey, true);
    });
  }

  function ensureFab() {
    if (!document.body) return;
    if (fab && fab.isConnected) return;
    if (!fab) {
      fab = el("button", "cit-set-fab", "⚙");
      fab.type = "button";
      fab.title = "NexPortal 設定";
      fab.setAttribute("aria-label", "NexPortal 設定を開く");
      fab.addEventListener("click", open);
    }
    document.body.appendChild(fab);
  }

  function start() {
    ensureFab();
    // ポータル側の再描画で body 直下が作り直されてもボタンを戻す
    const obs = new MutationObserver(ensureFab);
    obs.observe(document.body, { childList: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
