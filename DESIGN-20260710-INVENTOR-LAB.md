# Inventor Laboratory Review App Redesign

Date: 2026-07-10
Owner: Main GPT-5.6 Ultra orchestrator

## 1. Product Goal

Turn the existing long, simple quiz page into a mobile-first invention laboratory where Miwa-san studies one principle at a time through:

`recall -> confidence -> immediate correction -> realistic visual -> retry -> spaced weak-point review`

The app must feel like a real precision laboratory, but every visual and interaction must serve learning rather than decoration.

## 2. Three-Second Contract

- First look: today's one research theme and its real mechanism.
- First action: answer before seeing the explanation.
- Operation order: Recall -> Evidence -> 3D Lab -> Next.
- Takeaway: the root principle, not the company headline alone.
- Done: public smartphone URL shows the new shell, stable controls, quantum set, realistic images, working 3D, and preserved old progress.

## 3. Research-Backed Learning Model

### Strong evidence

- Retrieval practice: show the question before the answer. Corrective feedback follows the attempt.
  - https://pubmed.ncbi.nlm.nih.gov/33683913/
- Spacing: record the due date and increase the interval after successful recall.
  - https://pubmed.ncbi.nlm.nih.gov/16719566/
- Interleaving: mix confusable related principles after initial understanding; do not fully randomize unrelated questions.
  - https://pubmed.ncbi.nlm.nih.gov/31556629/
- Feedback: show a short correction immediately, then retest the same principle after a delay.
  - https://www.nature.com/articles/s41599-024-03983-6
- Multimedia signaling: keep the explanation beside the exact visual target, reveal one mechanism at a time, and remove decorative media.
  - https://www.nature.com/articles/s41598-024-59411-x

### Promising recent evidence

- Adaptive microlearning can reduce avoidable cognitive load when the path and feedback adapt to the learner.
  - https://www.nature.com/articles/s41598-024-77122-1
- Item difficulty is a useful cold-start signal for adaptive review.
  - https://link.springer.com/article/10.1007/s11257-024-09401-5
- 3D resources can support positive emotion and reduce reported cognitive load, but 3D must explain a mechanism rather than decorate the page.
  - https://www.nature.com/articles/s41599-024-03544-x
- Hiding non-required information can improve performance and lower cognitive load in interactive visualizations.
  - https://www.sciencedirect.com/science/article/pii/S1071581924001423

## 4. App Architecture

### Persistent shell

1. Instrument header
   - active set title
   - created date
   - progress meter
   - research-shelf button
2. Mode rail
   - Recall
   - Evidence
   - 3D Lab
   - Weak Lab
3. Learning stage
   - only one active view
   - internal scrolling when needed
   - real or realistic visual remains dominant
4. Fixed control dock
   - Back
   - Confidence: unsure / maybe / certain
   - Answer or Retry
   - Next

The controls keep the same position across all questions and mobile/desktop viewports.

### Views

- Recall: one question, choices, confidence, then correction.
- Evidence: red curiosity, green importance, yellow glossary, source crop viewer.
- 3D Lab: full-stage quantum experiment, no card frame.
- Weak Lab: due and high-confidence-wrong items first.
- Research Shelf: compact dated set list in a drawer; no horizontal card strip.

## 5. Visual System

- Background: surgical white and light brushed aluminum.
- Text: graphite.
- Instrument accent: oxidized teal.
- Status colors: signal red, green, and safety amber only where meaningful.
- Avoid dark slate dominance, purple, beige, gradients, glowing orbs, and generic SaaS cards.
- Use rails, calibration marks, instrument readouts, thin separators, and real lab imagery.
- Border radius: 8 px or less.
- Main stage is unframed and full-width; do not put a card inside a card.
- Mobile button target: minimum 44 px.

Preview contract:

`C:\Users\今林拓也\.codex\generated_images\019f4430-33d7-7c12-b75b-401026f52a1c\exec-fd7241bc-3c21-423f-a2af-6383f0873ed5.png`

## 6. Today's Quantum Lesson

### Exact source evidence

- Oxide developed a 643 nm narrow-linewidth CW laser for LQUOM.
- The reported linewidth is 100 kHz or less.
- The article reports 1000 hours of continuous stable operation.
- The laser is used as an excitation source for converting communication wavelength light to a quantum-memory-compatible wavelength.
- The wider technology stack includes wavelength conversion, entangled-photon sources, and quantum-memory crystals.

Do not infer the memory material, exact transition, conversion method, or pre/post-conversion wavelengths from the article.

### Yellow glossary

- 狭線幅（きょうせんぷく）: the laser color has very little spread.
- 連続発振（れんぞくはっしん）: the laser emits continuously rather than in pulses.
- 励起光源（れいきこうげん）: light that supplies energy to drive another optical process.
- 量子中継機（りょうしちゅうけいき）: a station that stores and connects entanglement between shorter links.
- 波長変換素子（はちょうへんかんそし）: a crystal or device that changes light frequency/wavelength.
- 量子もつれ光源（りょうしもつれこうげん）: a source that creates linked photon pairs.
- 量子メモリー結晶（りょうしめもりーけっしょう）: a crystal that temporarily maps a photon's quantum state into matter.
- 深紫外（しんしがい）: short-wavelength ultraviolet light; the inherited value is precision-control know-how, not the same wavelength.

### Quiz questions

1. What does 643 nm identify? Correct: the laser's center wavelength.
2. Why are both narrow linewidth and frequency stability needed? Correct: a thin line can still drift outside the memory/conversion acceptance range.
3. What is inherited from deep-UV laser development? Correct: stable, reliable, precise optical control.

Each answer uses its own new generated realistic teaching image.

## 7. 3D Quantum Lab

Full-stage Three.js scene:

- laser module
- optical path and fiber
- wavelength-conversion crystal
- quantum-memory crystal
- two repeater nodes

Controls:

- linewidth: 10-500 kHz
- frequency drift: -500 to +500 kHz
- crystal temperature offset: -2 to +2 C
- fiber loss: 0-100%

Outputs:

- spectral overlap
- storage success estimate
- visible beam stability
- repeater-link completion

This is an educational principle model, not Oxide's internal product model. State that clearly in the UI.

## 8. State Model

Preserve:

- `window.NIKKAN_QUIZ_SETS`
- append-only set IDs
- current answer key format: `setId::questionId`
- existing localStorage progress

Add a separate v3 learning record:

- confidence
- response time
- hint use
- retry success
- last reviewed date
- due date
- consecutive correct count
- high-confidence error flag

Priority:

`due + high-confidence wrong + repeated error + important marker + item difficulty`

## 9. Implementation Split

- Main Ultra: design, acceptance, source/evidence separation, images, final judgment.
- GPT-5.6 medium worker A: application shell and stable control layout.
- GPT-5.6 medium worker B: append quantum data set and update PWA cache.
- GPT-5.6 medium worker C: isolated Three.js quantum lab module.
- GPT-5.6 high: public-critical final review.

## 10. Verification

- JS syntax checks.
- Local HTTP 200.
- No broken visible images.
- Canvas has nonblank pixels and changes after slider input.
- Mobile: 390x844.
- Desktop: 1440x900.
- No overlap or clipped controls.
- Source crop never appears as a revealed answer image.
- New set is appended and dated.
- Public URL reflects the new cache version.
- Real public browser screenshots show Recall, Evidence, and 3D Lab.
