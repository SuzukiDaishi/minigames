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
- **カメラ許可は起動中1回だけ**: ゲーム一覧を親画面として残し、取得した1本のカメラ stream を
  [`shared/minigames.js`](shared/minigames.js) 経由で各ゲームに共有します。一覧からゲームを切り替えても取得し直しません。
- **PWA**: 一覧のページをホーム画面へ追加すると、アプリ内で一覧と各ゲームを行き来できます。
  iOSではホーム画面アプリごとに許可が別管理になるため、**一覧のページをホーム画面に追加**するのがおすすめです。
- Safari で毎回きかれてしまうときは、`あア → ウェブサイトの設定 → カメラ → 許可` に設定してください
  （ゲーム内の「📷 カメラのせってい」から手順を表示できます）。

## GitHub Pages

`main` ブランチに push すると GitHub Actions (`.github/workflows/deploy-pages.yml`) が自動でデプロイします。
