# 対象ページの要素調査結果

> フェーズ1では特定要素の狙い撃ちはしていない（土台のCSS改善のみ）。
> 実際に使ってみて「ここを直したい」という箇所が出たら、下記の手順でセレクタを調べ、
> この表に追記していく。狙い撃ちCSSは restyle.css にセクションを足して対応する。

## 対象システム

- UNIVERSAL PASSPORT（uprx）系ポータル（JSF / PrimeFaces ベースと推測）
- 主要URL: `https://portal.chibatech.ac.jp/uprx/up/pk/pky001/Pky00102.xhtml`
- 注意: JSFは要素IDが動的生成されることがあり、`id` 直指定は壊れやすい。
  可能なら安定した class や構造（見出しテキスト＋隣接要素など）で狙う。

## セレクタ調査の手順（自分で行う）

1. 改善したいページをログイン済み状態で開く。
2. 対象部分を右クリック →「検証」。
3. 開発者ツールで、その要素の `tagName` / `class` / `id` / 親要素の構造を控える。
4. `id` に数字や `j_idt` のような自動生成っぽい文字列が含まれる場合はメモしておく
   （そのIDは他ページで変わる可能性があるため、class や構造で狙う方針にする）。
5. 下の表に追記する。

## 調査メモ（随時追記）

### 掲示一覧ページ `up/bs/bsd007/Bsd00701.xhtml`（調査済み）

各掲示1件の構造：

```
div.alignRight              … 掲示1件のラッパ（複数繰り返し）
  dl.keiji                  … 掲示本体。※ id="keiji" が重複しているのでクラスで狙う
    i.iconColorAttention    … 重要フラグ（赤！）。表示時は class から hiddenStyle が外れる
    i.iconColorNew          … 新着フラグ（電球）。同上
    span.keijiCategory       … カテゴリ（図書館 / 施設 / 教務 / 学生 など）
    a.ui-commandlink        … タイトル。クリックは AJAX（onclick="PrimeFaces.ab(...)"）でURLは変わらない
    （テキストノード）        … 日付 例 "2026/07/06"（CSSで単独指定は不可）
  span.inlineBlock
  div.cf                    … clearfix
  hr.ui-separator           … 掲示間の区切り線
```

操作ボタン（フラグ/既読）は `dl.keiji` の兄弟 `span.inlineBlock` に入っている（実機で確認済み）。

実装（restyle.css の「掲示一覧」セクション）：
- ラッパ `div.alignRight:has(> dl.keiji)` を横1行の flex カードにする
  （枠線・角丸・余白。`> .cf` と `dl.keiji ~ hr.ui-separator` は非表示）
- `dl.keiji` も flex 行にし、`.keijiCategory`（バッジ・固定幅）＋ `a.ui-commandlink`（flex伸長）＋日付
- タイトル `a.ui-commandlink` は `overflow:hidden; text-overflow:ellipsis; white-space:nowrap` で
  長文を … 省略（1行固定）
- `span.inlineBlock`（操作ボタン）を flex で右側に固定配置 → タイトルと同じ行に収まる
- 重要はカード全体に：
  `div.alignRight:has(> dl.keiji):has(i.iconColorAttention:not(.hiddenStyle))` → 赤帯＋淡背景
- 新着の表示は廃止（依頼者判断）：電球アイコン `i.iconColorNew` は `display:none`、青帯も削除。

### 掲示タブの絞り込み・改名（`#funcForm:tabArea > ul.ui-tabs-nav > li`）

- 現状の並び（左から）：1 グループ / 2 全表示 / 3 授業 / 4 時間割変更 / 5 既読 / 6 未読 /
  7 新着 / 8 重要 / 9 申込 / 10 フラグつき
- 残すのは 1・2・6・8・10（グループ / 全表示 / 未読 / 重要 / フラグつき）。他は `li:nth-child(...)` で非表示。
  ※ 8 重要 は、トップの掲示「もっと見る」の飛び先として復活させた。
- 「全表示」(li:nth-child(2)) は元テキストを `font-size:0` で隠し、`a::before { content:"掲示一覧" }`
  で表示名だけ「掲示一覧」に差し替え。
- 注意：nth-child はタブの並び順に依存。将来ポータル側でタブ構成が変わったら番号を見直すこと。

### 並び順ツールバーの非表示

- 各タブパネル（`.ui-tabs-panels > .ui-tabs-panel`）内の `div.squeezeArea` が
  「並び順 … [▼][↓A][＋][表示]」の行。まるごと `display:none`。

### 検索エリアの簡素化・中央寄せ（`div.searchArea`）

- 構造：`div.searchArea` > `dl.searchItem`（入力欄）＋ `span.btnSearchLocation`（黄色い検索ボタン
  `button#funcForm:search`）。
- 実装：`.btnSearchLocation` を `display:none` で隠し、`div.searchArea` を flex 中央寄せに。
  ※【重要】他ページにも `.searchArea` があるため、必ず `div.searchArea:has(#funcForm\:keyword)`
  で**掲示一覧ページ限定**にスコープすること（怠ると他ページの検索ボタンまで消える）。
  検索ボタン自体は `.btnSearch`（黄色 `btnAltColorSearch`）。他ページで復活する分は拡張テーマ色（青）に上書き。
- ボタンを隠すと押せないので、検索実行は restyle.js の Enter ハンドラで担保：
  `.searchArea` 内で Enter → `document.getElementById("funcForm:search").click()`
  （ajax 再描画に耐えるよう document への委譲で登録。改変OFF時は素の挙動）。
  IME変換確定のEnterを誤検索しないよう `e.isComposing || e.keyCode===229` で除外する。
- 検索欄の内部構造（`dl.searchItem > .searchItemRowBottom` 内）：
  - キーワード：`dt`（無クラス・ラベル）＋ `dd`（`input#funcForm:keyword`、name=funcForm:keyword、
    件名・差出人・本文の全文検索）
  - 授業科目：`dt.searchItemCell`（ラベル）＋ `dd`（`input#funcForm:jugyoKamoku`、
    name=funcForm:jugyoKamoku、科目コード/名称での絞り込み）→ **別フィールド**
- 授業科目欄は不要につき非表示：`dt.searchItemCell` と `dd:has(#funcForm\:jugyoKamoku)` を
  `display:none`。キーワード欄のみ残す。
- ボタンのラベル短縮（「フラグをつける」→「フラグ」等）は、収まりが良くなったため**見送り**（依頼者判断）

既読/未読の目印（実機で確認済み）：
- **未読** … タイトル `dl.keiji > a.ui-commandlink` に `fontBold` クラスが付く
- **既読** … `fontBold` が付かない（`class="ui-commandlink ui-widget "`）
- 実装：未読＝太字＋濃色＋カード先頭に緑ドット、既読＝通常太さ＋グレー＋カード背景を少し暗く。
  判定は `dl.keiji > a`（タイトル）に限定し、フラグ/既読ボタンのリンクを誤検出しないようにする。

未確認・今後：
- 掲示の並びは `#funcForm:tabArea` のタブ（グループ/全表示/授業/…）配下。タブごとに
  `funcForm:tabArea:N:...` の N が変わる。`.keiji` 基準で狙っているのでタブ切替には影響されないはず。
- 掲示タイトルのクリックは AJAX（PrimeFaces.ab）。詳細がダイアログ `#bsd00702:dialog` で開く可能性あり（要確認）。

### 掲示詳細ダイアログ `#bsd00702:dialog`（class: ui-dialog rx-dialog rx-dialog-large）

- 掲示タイトルをクリックすると、このダイアログがポップアップで開く（別ページ遷移ではない）。
- スクロール領域は `.ui-dialog-content`（高さ600px固定、DevToolsで[scroll]表示）。
- 問題：ホイールのスクロールが速すぎる（サイト側の二重処理と推測）。全画面化でも直らない＝箱サイズでなく量の問題。
- 対策（restyle.js）：`.ui-dialog.rx-dialog .ui-dialog-content` 上の wheel を capture で横取りし、
  `deltaY`（deltaMode考慮）ぶんだけ自前で scrollTop 加算、preventDefault + stopImmediatePropagation で
  サイト側処理を止める。改変OFF時は素の挙動。

### 添付ファイルのダウンロード（PrimeFaces fileDownload）

- 実装：`Bsd00701.xhtml` への **POST**。レスポンスは `Content-Type: application/pdf`＋
  `Content-Disposition: attachment`（強制ダウンロード）。`Set-Cookie: primefaces.download=true`。
- GETの固定URLは無いため、ブラウザ内表示にはPOSTの再現（フォーム submit の横取り→fetchでblob取得→
  object URLで新規タブ表示）が必要。強制attachmentのためChromeのPDF設定では inline 表示にできない。
- 添付一覧の構造（「添付資料を確認」で開くダイアログ内）：
  ```
  .fileListArea
    .fileList
      .tableDownloadRow > .fileListCell.downLoadCellFilNm   … ファイル名
      .fileListCell.alignRight
        button#...appendList:N:j_idt521 (ui-button-icon-only noText, fa-download)
            … クリック時: PrimeFaces.ab(...) で検証ajax → onco で PF('button_0').click()
        button#...appendList:N:j_idt522 (dispNone, onclick="this.form.target='';")
            … PF('button_0')。これがフォームを full POST してファイルをストリーム（実DL）
  ```
- 実装（attachment.js）：`.fileListArea` 内ボタンによる **submit を横取り** →
  ライブなフォームの FormData（ViewState等を含む）＋submitterのnameで same-origin fetch(POST)
  → blob → ページ内オーバーレイ(.cit-pdf-overlay)の iframe で表示。新しいタブ/保存も添える。
- 失敗時（!ok / HTMLが返る等）は `bypass` フラグを立てて submitter を再クリックし、通常DLへ戻す。
- セキュリティ設計は docs/security.md 参照（same-origin限定・認証情報を読まない・保存しない）。

### トップページ刷新（topage.js）／メインメニュー `#menuForm:mainMenu`

- メニュー項目 `a.ui-menuitem-link` の中に `span.ui-menuitem-text`（表示名）。遷移方式は2種類：
  - **内部POST遷移**：`data-pfconfirmcommand` に `menuForm:mainMenu_menuid` を積んで
    `submit('menuForm')`。onclick は `confirmIfModified(this);return false;`。
  - **ポップアップ**：onclick で `window.open('/uprx/popupWindow.xhtml?...')` ＋ `PrimeFaces.ab(...)`。
- クイックランチャーは、項目**表示名の一致**で元 `<a>` を探し **同期的に .click()** して代理起動する
  （URL自作せずサイト本来の遷移を使う＝POST/ポップアップ両対応・確実）。
- 採用項目と menuid（参考）：
  掲示板 `0_3_0_0` / 学生時間割表 `2_0_0_0` / 出欠状況確認 `2_1_0_4` / 成績照会 `2_1_0_5` /
  manaba `4`(popup) / 証明書発行サービス `5_1_0_0`(popup)。
- トップページ判定：`location.pathname` が `/pk/pky001/Pky00102.xhtml`。
  刷新時は `html.cit-top` を付与（Stage2/3 のCSSフック）。設定キー `topPage`（既定true）。
- トップページの構造（安定 id/class。動的 `j_idtNNN` は避ける）：
  - `#mainWrapBottomPortal` … トップ固有 → **トップ判定に使用**（URLは Pky00102/Bsa00101 と揺れる）。
    topage.js の markTop がこれで `html.cit-top` を付与。
  - `#portalSupport` … 上部の掲示ボックス（重要/期限あり タブ）。掲示1件 = `li.ui-datalist-item`
    （中に `.signPortalKeiji`＝掲示バッジ, `.textDate`, `a.textTitle`＝件名, `.textFrom`）。
  - `#portalCont` … メイン。`.portalSub`＝左カラム（インフォメーションのアイコン群・リンク）、
    `.portalMain`＝右カラム（スケジュール。中は `#portalDate`/`#portalSchedule1`/`#portalSchedule2`、
    授業1件 = `.lessonArea`（`.lessonTitle`/`.lessonDetail`/`.lessonKeijiArea` 等））。
  - `.scheduleBtnArea` … スケジュール下部のボタン群。
- 実装（restyle.css, `html.cit-top` スコープ）：`.portalSub` を非表示、`.portalMain` を全幅、
  `#portalSupport ... li.ui-datalist-item:nth-child(n+6)` で掲示を先頭5件に制限。
- 2カラム化：`#mainWrapBottomPortal` を flex（wrap可）にし、`#portalSupport`（掲示）＝左、
  `#portalCont`（スケジュール）＝右（flex 1 : 2、狭い時は縦積み）。
- 授業1コマ = `.lessonArea` > `.ui-panel-content` > `.lessonHead`（時間/出席率/教室変更）＋
  `.lessonMain`（`.lessonTitle` 授業名, `.lessonDetail` 教員/教室, `.lessonBtnArea` シラバス/クラスプロファイル,
  `.lessonKeijiArea` 授業評価回答通知）＋`.lessonMemoArea`（メモ・非表示）。
  - `.lessonBtnArea` 内：シラバス照会 = `button`（title「シラバス照会…」）、クラスプロファイル =
    `button.cpBtn`。→ `.cpBtn` を非表示、`button:not(.cpBtn) .ui-button-text` を font-size:0＋
    `::after{content:"シラバス"}` で短縮。
  - `.lessonDetail` = `<p>`（教員）＋`<div>`（教室）→ inline化＋`div::before{content:" ／ "}` で1行。
  - 同じ授業が1時間ごとに別コマとして並ぶため、`mergeLessons()`（topage.js）で
    「授業名＋教員/教室」が同じかつ**前コマの終了＝次コマの開始**で連続するものをまとめる。
    先頭コマの `.lessonHead` 内の「HH:MM - HH:MM」の終了時刻だけ書き換え、後続 `li` に
    `.cit-lesson-merged`（画面外送り）を付ける。処理済みは `li.dataset.citLesson` で判定（再描画対応）。
  - `.lessonMemoArea` 内は memo input（`input.dispJugyoMemo`, `ctrl-checkModify`）＋登録button。
    ※【重要】メモ欄を `display:none` にすると「編集中」確認ダイアログが離脱時に誤発生する。
    仕組み：`confirmIfModified`→`isModified()` が `initData !== collectData()` で判定。メモを
    display:none にすると collectData の集計対象から外れ、初期スナップショットとズレて誤検知。
    しかも「initData取得」と「拡張がcit-top付与→非表示」の順序次第で**間欠的**に出る。
    対策：display:none をやめ、`.lessonMemoArea` を画面外(position:absolute; left:-99999px)へ飛ばして
    **集計対象に残したまま**視覚的に隠す。`ctrl-checkModify` は外さない（外すと逆にズレる）。
- 掲示ボックス `#portalSupport` の中身：`#funcForm:j_idtNNN`(ui-tabs) に「重要」「期限あり」タブ。
  重要タブ = `.dispTab_1` > datalist（初期3件）。その外に「もっと見る」= `a.ui-commandlink`（テキスト
  「もっと見る」、onclick `PrimeFaces.ab(u:"@(.dispTab_1)")` で残りをAJAX読込→全5件）。
- 実装（topage.js handleTopBulletins、cit-top時）：
  - 5件未満なら「もっと見る」を**1回だけ自動click**して全件ロード（scrollProc対策で scrollY を復元）。
    ※ 読込時に1回だけ追加リクエスト発生（ポーリングではない）。
  - 元「もっと見る」は隠し、自前 `.cit-keiji-more`「もっと見る（重要の掲示一覧へ）」を設置。
    クリックで `sessionStorage.citKeijiTab='重要'` を置き、メニュー「掲示板」を代理クリックして遷移。
  - 遷移先（掲示一覧ページ）で `activateKeijiTabIfFlagged()` がフラグを見て `#funcForm:tabArea` の
    タブ`<a>`（テキスト「重要」）を click → 重要タブを開く。フラグは消す。
- スケジュール省スペース化（restyle.css, cit-top）：`#portalSchedule2 ul.ui-datalist-data` を
  flex 横並び、各 `li.ui-datalist-item` をカード（flex:1 1 300px, max 460px）、`.lessonArea` の
  `.ui-panel-content` を余白圧縮、`.lessonMemoArea`（メモ編集欄）を非表示。第一版・要調整。

### 時間割ページ `up/km/kmd008/Kmd00801.xhtml`（学生時間割表）

- 時間割グリッド = `table.classTable`（`.rishuArea > .ofAuto` 内、前期・後期で各1つ）。
  thead: `th.headerJigen`（左上空）＋ `th.headerYobi`×6（月〜土）。
  tbody: 10行（1〜10限）。各行 `td.colJigen.ui-widget-header`（時限番号・DOM上は1〜10全部ある）＋
  `td.colYobi`×6。
- コマ = `td.colYobi > div.jugyo-info(.noClass=空)`。中身：`.fontB`(教科名)／`div`(教員)／
  `div`(講義室 `<span>室</span>／<span>キャンパス</span>`)／`.taniSu`(単位)／`.sign.signClass`(複数回/定員有)／
  `.noTextIconLine > button`(シラバス, fa-book, title「シラバス照会…」)。
- 実装（restyle.css, `table.classTable` スコープ）：
  - `.ofAuto` の高さ固定解除。表を table-layout:fixed・全幅・font12px。
  - `td.colJigen` に色を明示（**縞 `tr:nth-child(even)` で偶数の時限番号が薄背景に薄文字で消えていた**のを修正）
    元番号を font-size:0 で隠し `tr:nth-child(N) td.colJigen::after{content:"N限\A HH:00"}` で
    1限9:00〜10限18:00 を表示。**注意：`\A` の直後に半角スペース必須**（`\A9` だと © 等の
    16進エスケープになり文字化けする。`\A ` で改行として終端する）。
  - `.taniSu` と `.sign` を非表示（教科名・教員・講義室・シラバスのみ残す）。セルは白背景＋罫線。

### 成績ページ `up/km/kmg006/Kmg00601.xhtml`（成績照会）

- URLは他ページと共通の `Bsa00101.xhtml` になるため、**中身で判定**する
  （`#funcForm:initPtn:1` と `label[for="funcForm:initPtn:1"]` のテキスト「年度学期表示」）。
- 表示パターン = PrimeFaces ラジオ `#funcForm:initPtn`
  （`:0`=まとめて表示（既定・checked） / `:1`=年度学期表示）。実体 input は
  `.ui-helper-hidden-accessible` 内に隠れており、見た目は `.ui-radiobutton-box`。
  onchange の ajax `u:` は `nendoSort / searchItemRowR / searchItemRow2 / searchItemRow3 / comments`
  のみで **結果表は再描画されない** → 反映には「表示」ボタン `#funcForm:search`
  （`PrimeFaces.ab({s:"funcForm:search",u:"funcForm"})`）を押す必要がある。
- 実装（grades.js, Stage A）：読み込み時に1回だけ「年度学期表示」ラジオを代理クリック →
  ajax 完了（`#funcForm:nendoSort .ui-button` から `ui-state-disabled` が外れる）を最大約5秒ポーリング
  → `#funcForm:search` をクリック。設定キー `gradesYearTerm`（既定true）。
- 昇順/降順 = `#funcForm:nendoSort`（まとめて表示のときは disabled）。PDF出力 = `#funcForm:create`。
- 年度学期表示の結果構造（調査結果）：
  - 年度学期ごとに **ラッパ要素は無く**、`#funcForm` の**直下**に
    `label#funcForm:j_idtNNN:{N}:gakki`（学期ラベル）→ `div#funcForm:j_idtNNN:{N}:sskList`（成績表）
    が N=0,1,2… と並ぶフラット構造。成績表の列は `科目|単位数|評価|GPA対象|出席率|教員氏名`。
  - **年度と学期は別要素**なので「2025年度 前期」という連続文字列は存在しない
    （最初その前提で探して0件だった）。表示名はブロック先頭テキストから `20\d{2}` と
    `前期|後期|通年` を拾って組み立てる。
  - `j_idtNNN` は動的なので固定せず、`[id$=":sskList"]` から prefix を実物から取り出すこと。
  - GPA推移表は別物：`#funcForm:Kmy001`（ui-accordion）内の `#funcForm:Kmy001:gpaList`。
    こちらの `td.colNendoGakki` は「2025年度 前期」を1セルで持つので**成績表と間違えやすい**。
- 実装（grades.js, Stage B）：`#funcForm` の各直下要素を id 中の N でグループ分けし、
  プルダウン＋前後ボタン（`.cit-grade-pager`）で選択中の N 以外を隠す（既定は最新＝最後）。
  隠し方は `display:none` ではなく `.cit-grade-hidden`（画面外送り）。display:none だと
  変更チェック(collectData)の対象から外れ「編集中」誤判定が出るリスクがあるため（メモ欄と同じ理由）。

### 自動ログアウト画面（セッション切れ）

- 一定時間無操作で自動ログアウトされると、URLは `.../pk/pky001/Pky00102.xhtml`（＝通常のトップと
  同じURL）だが、本文が「長時間操作が行われなかったため、自動的にログアウトされました。この画面を
  閉じてください。」というメッセージだけになる。
- URLでは通常トップと区別できないので、**本文テキスト**で検知する（session.js）。
  ただし `自動的にログアウト` はログイン画面にも注意書きとして出るため、**行き止まり画面固有の
  「この画面を閉じ（てください）」を必須**にして区別する（＋ `ログアウト`/`長時間操作` を併用）。
- さらに、`input[type=password]`（ログインフォーム）がある画面には出さない二重の保険。
- メッセージが後から動的描画される場合に備え、`MutationObserver` で最大15秒だけ監視して検知する。
- 検知したら「ログインページへ」ボタン（`.cit-relogin-btn`、リンク先 `https://portal.chibatech.ac.jp/uprx/`）
  をメッセージ箱に追加。入口へ行くとセッションが無いのでSSOログインへ誘導される。
- パスワード保持・自動再ログインはしない（指示書フェーズ3の安全な範囲）。

### ページ遷移の方式（「戻る」対応の判断材料）

- メニューによるページ遷移は **GET**（URLが変わる）→ ブラウザの戻るは本来効くはず。
- ただし掲示タイトル等の一部操作は **AJAX（PrimeFaces.ab）** でURLが変わらない → その操作は
  戻るの履歴に残らない。「戻る」が効かないと感じるのは主にこの箇所と推測。要切り分け。
