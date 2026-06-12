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

For conceptual, manufacturing, technical, robot, or invention topics:

- choose the 3 most important questions,
- generate or attach one explanatory image per revealed answer panel,
- make it PWA-ready when the user wants repeat review,
- mirror the artifact into `claude-config/projects/textbooks/`,
- update the quiz skill, gate, and branch route.
