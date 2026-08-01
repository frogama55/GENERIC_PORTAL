// CIT Portal Restyle - 添付ファイルのブラウザ内プレビュー（attachment viewer）
//
// 目的：掲示の添付PDFを、いちいちダウンロード/削除せずブラウザ内で閲覧できるようにする。
//
// 仕組み：
//   添付一覧(.fileListArea)の「ダウンロード」ボタンはフォームを POST 送信してファイルを取得する
//   （Content-Disposition: attachment で強制DL）。この submit を横取りし、同じ内容を
//   same-origin の fetch で取得 → blob 化 → ページ内オーバーレイの iframe(＝Chrome内蔵PDF
//   ビューア) で表示する。「新しいタブで開く」「保存」も添える。
//
// セキュリティ（docs/security.md 準拠）：
//   - 通信先はポータル自身のみ(same-origin)。第三者へは一切送らない。
//   - 認証情報は読まない（クッキーはブラウザが自動付与。HttpOnlyで中身も読めない）。
//   - 取得データは表示のためだけの一時 blob。保存も外部送信もしない。
//   - 失敗時は通常のダウンロードにフォールバック（壊さない）。
//
// 設定キー（chrome.storage.local）:
//   attachInline : boolean  この機能の ON/OFF（デフォルト true）

"use strict";

(() => {
  const DEFAULTS = { attachInline: true };
  let enabled = DEFAULTS.attachInline;
  let bypass = false; // フォールバック時に横取りを1回だけ素通しするフラグ

  chrome.storage.local.get(DEFAULTS, (s) => {
    if (chrome.runtime.lastError) return;
    enabled = s.attachInline;
  });
  chrome.storage.onChanged.addListener((c, area) => {
    if (area === "local" && c.attachInline) enabled = c.attachInline.newValue;
  });

  // 添付一覧のダウンロード（フォームPOST）を横取りする
  document.addEventListener(
    "submit",
    (e) => {
      if (bypass) {
        bypass = false;
        return; // フォールバックの素通し
      }
      if (!enabled) return;
      const submitter = e.submitter;
      if (!submitter || !submitter.closest) return;
      // 添付一覧(.fileListArea)内のボタンによる送信だけを対象にする
      if (!submitter.closest(".fileListArea")) return;
      const form = e.target;
      if (!form || form.tagName !== "FORM") return;
      e.preventDefault();
      previewDownload(form, submitter).catch(() => {
        // 失敗したら通常のダウンロードに戻す（同じ送信を素通しで再実行）
        bypass = true;
        try {
          submitter.click();
        } catch (_) {}
      });
    },
    true
  );

  async function previewDownload(form, submitter) {
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
    // HTMLが返ってきた＝エラー/期限切れ等。プレビューせず通常DLへフォールバック。
    if (/text\/html/i.test(ct)) throw new Error("not a file");
    const filename =
      parseFilename(res.headers.get("Content-Disposition") || "") || "attachment";
    const blob = await res.blob();
    showViewer(blob, filename);
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

  function showViewer(blob, filename) {
    const url = URL.createObjectURL(blob);
    const overlay = document.createElement("div");
    overlay.className = "cit-pdf-overlay";
    // 静的テンプレート。可変値(filename/url)は後で textContent/プロパティ経由で入れる（インジェクション防止）
    overlay.innerHTML =
      '<div class="cit-pdf-bar">' +
      '<span class="cit-pdf-name"></span>' +
      '<span class="cit-pdf-actions">' +
      '<a class="cit-pdf-btn cit-pdf-open" target="_blank" rel="noopener">新しいタブで開く</a>' +
      '<a class="cit-pdf-btn cit-pdf-save">保存</a>' +
      '<button class="cit-pdf-btn cit-pdf-close" type="button">✕ 閉じる</button>' +
      "</span></div>" +
      '<iframe class="cit-pdf-frame" title="添付プレビュー"></iframe>';

    overlay.querySelector(".cit-pdf-name").textContent = filename;
    const openA = overlay.querySelector(".cit-pdf-open");
    openA.href = url;
    const saveA = overlay.querySelector(".cit-pdf-save");
    saveA.href = url;
    saveA.download = filename;
    overlay.querySelector(".cit-pdf-frame").src = url;

    const onKey = (ev) => {
      if (ev.key === "Escape") close();
    };
    function close() {
      overlay.remove();
      URL.revokeObjectURL(url);
      document.removeEventListener("keydown", onKey, true);
    }
    overlay.querySelector(".cit-pdf-close").addEventListener("click", close);
    overlay.addEventListener("click", (ev) => {
      if (ev.target === overlay) close(); // 背景クリックで閉じる
    });
    document.addEventListener("keydown", onKey, true);

    document.body.appendChild(overlay);
  }
})();
