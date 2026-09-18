// NexPortal - 添付ファイルのブラウザ内プレビュー（attachment viewer）
//
// 目的：掲示の添付PDFを，いちいちダウンロード/削除せずブラウザ内で閲覧できるようにする．
// さらに，「掲示ページ→添付資料を確認→ダウンロードボタン」と3手順かかっていた導線を短縮し，
// 掲示ダイアログ下部にファイル名を直接表示，クリック1回でプレビューへ行けるようにする．
//
// 仕組み：
//   添付一覧(.fileListArea)の「ダウンロード」ボタンはフォームを POST 送信してファイルを取得する
//   （Content-Disposition: attachment で強制DL）．この submit を横取りし，同じ内容を
//   same-origin の fetch で取得 → blob 化 → ページ内オーバーレイの iframe(＝Chrome内蔵PDF
//   ビューア) で表示する．「新しいタブで開く」「保存」も添える．取得中はスピナーを表示する．
//
//   加えて，掲示詳細ダイアログ内にある「添付資料を確認」相当の展開トリガを自動で1回だけ
//   クリックして .fileListArea を出し，そこからファイル名一覧（.cit-attach-quicklist）を
//   ダイアログ下部に複製表示する．各ファイル名をクリックすると，元のダウンロードボタンを
//   代理クリックするだけ（＝上のプレビュー横取りがそのまま効く）．
//
// セキュリティ（docs/security.md 準拠）：
//   - 通信先はポータル自身のみ(same-origin)．第三者へは一切送らない．
//   - 認証情報は読まない（クッキーはブラウザが自動付与．HttpOnlyで中身も読めない）．
//   - 取得データは表示のためだけの一時 blob．保存も外部送信もしない．
//   - 失敗時は通常のダウンロードにフォールバック（壊さない）．
//   - 「添付資料を確認」の自動展開は，サイト本来のボタンを代理クリックするだけ（新規の通信経路は
//     追加しない）．トップページの「もっと見る」自動展開と同じ考え方．
//
// 設定キー（chrome.storage.local）:
//   enabled      : boolean  拡張全体の ON/OFF（他の設定と AND で効く）
//   attachInline : boolean  この機能の ON/OFF（デフォルト true）．クイック一覧もこれに従う

"use strict";

(() => {
  const DEFAULTS = { enabled: true, attachInline: true };
  let masterEnabled = true;
  let featureEnabled = true;
  let bypass = false; // フォールバック時に横取りを1回だけ素通しするフラグ

  chrome.storage.local.get(DEFAULTS, (s) => {
    if (chrome.runtime.lastError) return;
    masterEnabled = !!s.enabled;
    featureEnabled = !!s.attachInline;
  });
  chrome.storage.onChanged.addListener((c, area) => {
    if (area !== "local") return;
    if (c.enabled) masterEnabled = !!c.enabled.newValue;
    if (c.attachInline) featureEnabled = !!c.attachInline.newValue;
  });

  // ---------- プレビュー横取り（ダウンロードのPOSTを fetch で再現） ----------

  // 添付一覧のダウンロード（フォームPOST）を横取りする
  document.addEventListener(
    "submit",
    (e) => {
      if (bypass) {
        bypass = false;
        return; // フォールバックの素通し
      }
      if (!masterEnabled || !featureEnabled) return;
      const submitter = e.submitter;
      if (!submitter || !submitter.closest) return;
      // 添付一覧(.fileListArea)内のボタンによる送信だけを対象にする
      if (!submitter.closest(".fileListArea")) return;
      const form = e.target;
      if (!form || form.tagName !== "FORM") return;
      e.preventDefault();
      const overlay = createOverlay();
      previewDownload(form, submitter, overlay).catch(() => {
        // 失敗したら通常のダウンロードに戻す（同じ送信を素通しで再実行）
        overlay.citClose();
        bypass = true;
        try {
          submitter.click();
        } catch (_) {}
      });
    },
    true
  );

  async function previewDownload(form, submitter, overlay) {
    const fd = new FormData(form);
    // 送信ボタンの name は FormData に自動で入らないので手で足す（JSFのコマンド判定に必要）
    if (submitter.name) fd.append(submitter.name, submitter.value || "");
    const res = await fetch(form.action || location.href, {
      method: "POST",
      body: new URLSearchParams(fd),
      credentials: "same-origin",
    });
    if (!res.ok) throw new Error("http " + res.status);
    const ct = res.headers.get("Content-Type") || "";
    // HTMLが返ってきた＝エラー/期限切れ等．プレビューせず通常DLへフォールバック．
    if (/text\/html/i.test(ct)) throw new Error("not a file");
    const filename =
      parseFilename(res.headers.get("Content-Disposition") || "") || "attachment";
    const blob = await res.blob();
    populateViewer(overlay, blob, filename);
  }

  // Content-Disposition から filename を取り出す（RFC5987 / RFC2047 に対応）
  function parseFilename(cd) {
    let m = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(cd);
    if (m) {
      try {
        return decodeURIComponent(m[1].replace(/["']/g, ""));
      } catch (_) {}
    }
    m = /filename="?([^";]+)"?/i.exec(cd);
    if (m) {
      const v = m[1];
      // =?UTF-8?B?base64?=（複数連結あり）を復号
      if (/=\?UTF-8\?B\?/i.test(v)) {
        try {
          return v
            .replace(/=\?UTF-8\?B\?([^?]+)\?=/gi, (_, b) => {
              const bin = atob(b);
              const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
              return new TextDecoder("utf-8").decode(bytes);
            })
            .trim();
        } catch (_) {}
      }
      return v;
    }
    return null;
  }

  // 取得中はスピナー表示のオーバーレイを即座に出し，blob が用意でき次第 populateViewer() で
  // 中身（ファイル名・操作ボタン・iframe）を差し込む．
  function createOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "cit-pdf-overlay";
    // 静的テンプレート．可変値(filename/url)は後で textContent/プロパティ経由で入れる（インジェクション防止）
    overlay.innerHTML =
      '<div class="cit-pdf-bar">' +
      '<span class="cit-pdf-name"></span>' +
      '<span class="cit-pdf-actions">' +
      '<button class="cit-pdf-btn cit-pdf-close" type="button">✕ 閉じる</button>' +
      "</span></div>" +
      '<div class="cit-pdf-loading"><div class="cit-spinner" aria-hidden="true"></div>' +
      "<span>添付ファイルを取得しています…</span></div>";

    overlay.querySelector(".cit-pdf-name").textContent = "読み込み中…";

    let objectUrl = null;
    function close() {
      overlay.remove();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      document.removeEventListener("keydown", onKey, true);
    }
    function onKey(ev) {
      if (ev.key === "Escape") close();
    }
    overlay.querySelector(".cit-pdf-close").addEventListener("click", close);
    overlay.addEventListener("click", (ev) => {
      if (ev.target === overlay) close(); // 背景クリックで閉じる
    });
    document.addEventListener("keydown", onKey, true);

    overlay.citClose = close;
    overlay.citSetUrl = (u) => {
      objectUrl = u;
    };

    document.body.appendChild(overlay);
    return overlay;
  }

  function populateViewer(overlay, blob, filename) {
    const url = URL.createObjectURL(blob);
    overlay.citSetUrl(url);
    overlay.querySelector(".cit-pdf-name").textContent = filename;

    const actions = overlay.querySelector(".cit-pdf-actions");
    const closeBtn = overlay.querySelector(".cit-pdf-close");

    const openA = document.createElement("a");
    openA.className = "cit-pdf-btn cit-pdf-open";
    openA.target = "_blank";
    openA.rel = "noopener";
    openA.href = url;
    openA.textContent = "新しいタブで開く";

    const saveA = document.createElement("a");
    saveA.className = "cit-pdf-btn cit-pdf-save";
    saveA.href = url;
    saveA.download = filename;
    saveA.textContent = "保存";

    actions.insertBefore(openA, closeBtn);
    actions.insertBefore(saveA, closeBtn);

    const frame = document.createElement("iframe");
    frame.className = "cit-pdf-frame";
    frame.title = "添付プレビュー";
    frame.src = url;
    overlay.querySelector(".cit-pdf-loading").replaceWith(frame);
  }

  // ---------- 添付導線の短縮：自動展開 ＋ ダイアログ下部のクイック一覧 ----------

  const EXPAND_LABEL = "添付資料を確認";
  const EXPAND_CANDIDATES = 'a, button, .ui-commandlink, .ui-button, [role="button"]';
  const SUPPRESS = "cit-attach-suppress"; // html に付ける：自動展開中は他ダイアログを不可視に
  const HOST = "cit-attach-host"; // 掲示ダイアログ（不可視にしない側）
  const FILE_DLG = "cit-attach-filedlg"; // 添付一覧ダイアログ（開いたまま不可視にする）
  const ROOT = document.documentElement;
  const triedExpandTriggers = new WeakSet();
  let lastTrigger = null; // 直近に自動展開したトリガ（クイック一覧の設置先を決めるのに使う）
  let suppressTimer = null;

  function unsuppress() {
    clearTimeout(suppressTimer);
    ROOT.classList.remove(SUPPRESS);
  }

  function dialogMask(dlg) {
    // PrimeFaces のモーダル遮蔽は <ダイアログid>_modal（body直下）
    return dlg && dlg.id ? document.getElementById(dlg.id + "_modal") : null;
  }

  // 「添付資料を確認」相当のボタン／リンクを見つけて1回だけ代理クリックする．
  // （.fileListArea を出すためのサイト本来の操作をなぞるだけ．新規の通信経路は増やさない）
  // 添付一覧は別ダイアログで前面に出てくるため，検出して隠すまでの間，掲示ダイアログ以外を
  // 不可視にしておく（保険で3秒後に解除）．
  function autoExpandAttachments() {
    for (const el of document.querySelectorAll(EXPAND_CANDIDATES)) {
      if (triedExpandTriggers.has(el)) continue;
      if ((el.textContent || "").trim() !== EXPAND_LABEL) continue;
      triedExpandTriggers.add(el);
      lastTrigger = el;
      const host = el.closest(".ui-dialog");
      if (host) {
        host.classList.add(HOST);
        const mask = dialogMask(host);
        if (mask) mask.classList.add(HOST + "-mask");
      }
      ROOT.classList.add(SUPPRESS);
      clearTimeout(suppressTimer);
      suppressTimer = setTimeout(unsuppress, 3000);
      el.click();
      return; // 1tickにつき1件（連打を避ける．ajax後の再tickで残りも処理される）
    }
  }

  // 添付一覧が別ダイアログで開いた場合，閉じずに不可視にする．
  // 閉じないのは，ダイアログを閉じる操作に伴うサーバ側の状態変化を避け，
  // クイック一覧からの代理クリック先（ダウンロードボタン）を確実に残すため．
  function hideFileDialog(fileListArea) {
    const dlg = fileListArea.closest(".ui-dialog");
    if (!dlg) return;
    if (lastTrigger && dlg.contains(lastTrigger)) return; // 掲示ダイアログ内に展開された → そのまま
    dlg.classList.add(FILE_DLG);
    const mask = dialogMask(dlg);
    if (mask) mask.classList.add(FILE_DLG + "-mask");
  }

  // 利用者が本物の「添付資料を確認」を自分で押したときは，隠していた一覧ダイアログを見せる
  document.addEventListener(
    "click",
    (e) => {
      if (!e.isTrusted) return;
      const el = e.target && e.target.closest && e.target.closest(EXPAND_CANDIDATES);
      if (!el || (el.textContent || "").trim() !== EXPAND_LABEL) return;
      for (const d of document.querySelectorAll("." + FILE_DLG)) d.classList.remove(FILE_DLG);
      for (const m of document.querySelectorAll("." + FILE_DLG + "-mask")) {
        m.classList.remove(FILE_DLG + "-mask");
      }
    },
    true
  );

  // .fileListArea の各行から「ファイル名」と「実際に押すべきダウンロードボタン」を集める．
  function collectFileRows(fileListArea) {
    const items = [];
    for (const row of fileListArea.querySelectorAll(".tableDownloadRow")) {
      const nameCell = row.querySelector(".downLoadCellFilNm");
      const btnCell = row.querySelector(".fileListCell.alignRight");
      if (!nameCell || !btnCell) continue;
      // 非表示の実送信ボタン(.dispNone)ではなく，本来ユーザが押す見た目のボタンを使う
      const btn = btnCell.querySelector("button:not(.dispNone)") || btnCell.querySelector("button");
      if (!btn) continue;
      const name = nameCell.textContent.trim();
      if (!name) continue;
      items.push({ name, btn });
    }
    return items;
  }

  function buildQuickList(fileListArea) {
    const items = collectFileRows(fileListArea);
    if (!items.length) return;
    // 同じ一覧要素が別の掲示で使い回されることがあるので，ファイル名の並びで変化を検出する．
    // 掲示ダイアログの再描画で一覧が消えた場合（isConnected=false）も作り直す．
    const sig = items.map((i) => i.name).join("\n");

    // 設置先：掲示ダイアログの本文（.ui-dialog-content）の末尾＝「掲示の一番下」．
    // 自動展開のトリガが見つからない場合だけ，一覧の直後に置く．
    const host =
      lastTrigger && lastTrigger.isConnected
        ? lastTrigger.closest(".ui-dialog-content") || lastTrigger.parentElement
        : null;

    // 一覧は設置先ごとに1つだけ．.fileListArea が複数ある（同じ内容で2つ描画される／入れ子）
    // 場合に同じ一覧が重複して並ぶのを防ぐ．内容（ファイル名の並び）が変われば作り直す．
    hideFileDialog(fileListArea);
    const existing = host
      ? host.querySelector(":scope > .cit-attach-quicklist")
      : fileListArea.nextElementSibling &&
        fileListArea.nextElementSibling.classList.contains("cit-attach-quicklist")
      ? fileListArea.nextElementSibling
      : null;
    if (existing && existing.dataset.sig === sig) {
      unsuppress();
      return;
    }
    if (existing) existing.remove();

    const box = document.createElement("div");
    box.className = "cit-attach-quicklist";
    box.dataset.sig = sig;

    const title = document.createElement("p");
    title.className = "cit-attach-quicklist-title";
    title.textContent = "添付ファイル（クリックでプレビュー）";
    box.appendChild(title);

    for (const item of items) {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "cit-attach-quicklist-item";
      row.innerHTML = '<i class="fa fa-file-o" aria-hidden="true"></i><span class="cit-attach-name"></span>';
      row.querySelector(".cit-attach-name").textContent = item.name;
      row.title = item.name;
      row.addEventListener("click", () => item.btn.click());
      box.appendChild(row);
    }

    if (host) host.appendChild(box);
    else fileListArea.insertAdjacentElement("afterend", box);
    unsuppress();
  }

  function tick() {
    if (!masterEnabled || !featureEnabled) return;
    autoExpandAttachments();
    document.querySelectorAll(".fileListArea").forEach(buildQuickList);
    // モーダル遮蔽(_modal)はダイアログ表示後に作られることがあるので，毎tick追従して隠す
    for (const d of document.querySelectorAll("." + FILE_DLG)) {
      const m = dialogMask(d);
      if (m) m.classList.add(FILE_DLG + "-mask");
    }
  }

  function start() {
    tick();
    // 掲示ダイアログの開閉・ajax再描画に追従する
    const obs = new MutationObserver(() => tick());
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
