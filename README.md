# minigames
ミニゲーム集です

🌐 **遊ぶ:** https://suzukidaishi.github.io/minigames/

## ゲーム一覧

| ゲーム | 説明 |
| --- | --- |
| [🐛 ゆびシャクトリ レース](https://suzukidaishi.github.io/minigames/inchworm-race/) | カメラに手をうつして、人差し指を「曲げて→伸ばす」とシャクトリムシが進むレースゲーム。CPU対戦・ふたり対戦対応。 |
| [🍘 ふたりで協力！柿ピー玉入れ](https://suzukidaishi.github.io/minigames/kakipi-tamaire/) | 顔の位置と頭の傾きで頭上のバーを操作し、落ちてくる柿ピーを跳ね返してカゴに入れる協力ゲーム。1〜2人プレイ対応。 |
| [🐸 ケロジャンプ！](https://suzukidaishi.github.io/minigames/kero-jump/) | 顔を縦にピョコッと動かしてジャンプする横スクロールアクション。ひとり・ふたり対戦対応。 |

## 共通のしくみ

- **戻るボタン**: どのゲームからも 🏠 ボタンでゲーム一覧に戻れます（プレイ中は確認をはさみます）。
- **カメラ許可は1回だけ**: カメラの取得は [`shared/minigames.js`](shared/minigames.js) に一本化しており、
  同じページ内では stream を使い回し、許可した事実は `localStorage` に記録して他のゲームと共有します。
- **PWA**: 各ゲームの manifest は `scope` を親（`/minigames/`）にしているため、どのアイコンから起動しても
  ホーム画面アプリの中のまま一覧・他ゲームへ移動でき、**そのアプリの中ではカメラ許可は最初の1回だけ**です。
  iOS ではホーム画面アプリごとに許可が別管理になるので、**一覧のページをホーム画面に追加**するのがおすすめです。
- Safari で毎回きかれてしまうときは、`あア → ウェブサイトの設定 → カメラ → 許可` に設定してください
  （ゲーム内の「📷 カメラのせってい」から手順を表示できます）。

## GitHub Pages

`main` ブランチに push すると GitHub Actions (`.github/workflows/deploy-pages.yml`) が自動でデプロイします。
