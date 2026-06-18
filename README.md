# 日刊工業 ものづくり復習 3問

Created: 2026-06-12

Live app:

https://pasarinobuhito0409-droid.github.io/nikkan-manufacturing-review-quiz/

## Purpose

This is a smartphone-ready PWA quiz for 三輪さん.

It reviews the important points from the recent 日刊工業新聞 manufacturing topics:

- AI現場力のデータ化
- DC水冷サーバー検証
- ティーチングレスCNCとARMROID自動化
- ミュトス級AIと重要インフラ安全
- マニュアル頼らず創意工夫
- 2026/6/18 見出し：AI判断過程、遠隔施工、特許・ライセンス用語

## Files

- `index.html` — touch/click quiz body
- `manifest.webmanifest` — PWA install metadata
- `service-worker.js` — offline cache
- `assets/` — one explanatory image per answer panel

## Durable Rule

When 三輪さん says `問題作って`, `3問`, `復習`, or `テスト`, the default output is not plain text.

Use a touch/click HTML quiz.

New quiz sets are append-only.

Do not replace the old set when a new article is turned into questions.

Add the new set to `quiz-data.js`, add its images to `assets/`, and let the app show it in the review shelf.

Every quiz set must include a visible `date` as `作成日`.

Use this for managing when each 3-question set was made.

For conceptual, manufacturing, technical, robot, or invention topics:

- choose the 3 most important questions,
- distribute correct answers across choices instead of putting the answer in the same position,
- make wrong choices plausible enough that 三輪さん must understand the concept, not just spot an obviously silly option,
- avoid trick questions; each wrong choice should reveal a real misunderstanding,
- generate or attach one explanatory image per revealed answer panel,
- make it PWA-ready when the user wants repeat review,
- mirror the artifact into `claude-config/projects/textbooks/`,
- update the quiz skill, gate, and branch route.
