# 琉球衣装AR体験 / Ryukyu Costume AR Experience

琉球王国の歴史的衣装をARで体験できるWebアプリケーション。

## セットアップ

### GitHub Pages へのデプロイ

```bash
# リポジトリを作成してクローン
git init ryukyu-ar-costume
cd ryukyu-ar-costume

# ファイルを配置（index.html, 衣装画像を含む）

git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<username>/ryukyu-ar-costume.git
git push -u origin main
```

GitHub リポジトリの Settings → Pages で、Source を `main` ブランチの `/ (root)` に設定する。

### ローカルでの確認

Macでは、1つ上のフォルダの `ARを起動.command` をダブルクリックし、`http://127.0.0.1:8000/` をブラウザで開く。ターミナルは利用中開いたままにする。すでにサーバーを起動している場合は追加起動せずURLを開く。`index.html` の直接ダブルクリック（file://）では画像のCORS/WebGL制限があるため、アプリが起動前に案内する。

`files/` をドキュメントルートにして開く。同じMacの `localhost` はHTTPでもカメラを利用できる。以前の「HTTPではカメラが動かない」という説明は誤り。他の端末からアクセスする場合はHTTPSを使う。

```bash
# 博物館AR ディレクトリから実行
cd files
python3 -m http.server 8000

# HTTPS でのローカルテスト（mkcert を使う場合）
mkcert localhost
npx http-server -S -C localhost.pem -K localhost-key.pem -p 8443
```

同じMacでは `http://localhost:8000/` を開き、「AR体験を始める」を押してカメラを許可する。HTTPSで起動した場合は `https://localhost:8443/` を開く。

## 起動・停止と負荷対策

- 画面を表示してからカメラを起動する。非表示領域で初期化して映像サイズが0になる問題を防ぐ。
- A-Frameキャンバスも表示後・MindAR初期化後にリサイズする。2026-09-19、Chromeの実カメラで男女の衣装表示・顔穴透過・切替を確認済み。Safariは同修正の実機確認未実施。
- 顔認識の準備中もカメラ映像を表示し、準備状態を画面上部に示す。失敗時は理由を表示し、左上の矢印から再試行できる。
- カメラは640×480・24fpsを目安に要求する（実際の値はカメラによる）。描画のピクセル比は1、アンチエイリアスと不要な顔の遮蔽メッシュを無効にする。
- 戻る・別タブへ移動・ページ終了時にカメラと顔認識を停止する。再開は開始ボタンから行う。
- MindAR 1.2.5の内部メソッド `_setupAR` / `_resize` / `_processVideo` を起動制御に使用する。ライブラリ更新時は互換性を再確認する。

検証: プロジェクト直下で `node files/check-lifecycle.cjs`。起動・停止・再開・タブ非表示・カメラ拒否を模擬環境で検査する。実カメラの描画や速度はSafari/Chromeで別途確認が必要。

## ディレクトリ構成

```
ryukyu-ar-costume/
├── index.html          メインアプリケーション
├── costume-fit.js      顔穴と追跡位置の自動位置合わせ
├── orion_man.png       男性衣装画像
├── orion_woman.png     女性衣装画像
└── README.md
```

## 衣装画像の差し替え

`orion_man.png` と `orion_woman.png` は `index.html` の男性・女性衣装として読み込まれる。AR画面下部の「男性衣装」「女性衣装」ボタンで切り替える。顔ハメの選択肢はこの2種類で、庶民（commoner）は表示しない。既存の画像ファイルは保管している。

画像の要件：
- PNG形式、背景は透過
- 顔の部分を楕円形にくり抜く（透過にする）
- 縦長のアスペクト比（推奨: 幅640px程度、高さ1400px程度）
- 顔の穴の位置は画像上部10〜20%の範囲に配置

## AR表示の位置調整

プロトタイプ段階のため、衣装の重ね合わせ位置の微調整が必要になる場合がある。

通常は `costume-fit.js` が頬・額・顎の追跡位置とPNGの顔穴を合わせる。男性の顔穴は画像ピクセル座標で `(306,189)–(371,268)`、女性は `(313,239)–(375,315)`。画像全体の683:1024の縦横比を維持する。画像を変更するときは、この計測値も更新する。

衣装は照明に依存しない `shader: flat` と透過対応設定で描画する。PNGのデコードに失敗した場合はエラーを表示する。公開・コピー時は `costume-fit.js` も同じフォルダに含める。

AR画面で `i` ボタンを素早く3回タップすると、キャリブレーション用のスライダーが表示される。

- Y位置: 衣装の上下位置（マイナス方向 = 下にずらす）
- Z位置: 衣装の前後位置（マイナス方向 = 奥にずらす）
- 幅 / 高さ: 衣装画像のスケール

調整後の値をメモして `index.html` 内の `<a-plane>` タグの `position`, `width`, `height` 属性に反映すること。

スライダー操作時は自動位置合わせを解除し、手動設定に切り替える。ページを再読み込みすると自動設定に戻る。恒久的な手動設定を使う場合は対象の `costume-fit` 属性も外す。

## 技術スタック

- MindAR.js v1.2.5（顔トラッキング）
- A-Frame v1.5.0（WebXR レンダリング）
- Vanilla HTML/CSS/JavaScript

## この技術を選んだ理由

- MindAR.js はブラウザ内で顔トラッキングを行えるため、専用アプリを配布せずにAR体験を提供できる。
- A-Frame は3D要素をHTMLとして記述でき、衣装画像を顔のアンカーに重ねる本プロトタイプに適している。
- Vanilla JavaScript は依存関係と初期ロードを小さく保ち、展示環境での運用を単純にする。

## 既知の制約

- 顔ハメ看板的な表現であり、体全体への完全フィットはしない
- iOS Safari ではカメラ権限の挙動が異なる場合がある
- CDN からライブラリを読み込むため、オフライン環境では動作しない
- 衣装画像と顔のアラインメントは手動でのキャリブレーションが必要
