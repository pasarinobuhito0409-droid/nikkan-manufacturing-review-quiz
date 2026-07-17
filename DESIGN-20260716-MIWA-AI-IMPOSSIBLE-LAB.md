# Miwa + AI impossible-law laboratory

## Purpose

Make the July 16 3D lab feel like Miwa-san's own invention room.

The room must feel like a loved evening hobby, not assigned professional work.

The room is not limited to the 3D tab.

It is the shared background of the entire review app:

- recall,
- evidence,
- 3D lab,
- header,
- mode navigation,
- bottom controls.

The study must be visible from the first question screen.

The scene must communicate one clear story:

`mathematical theory -> physical experiment -> working invention`

## Identity boundary

No portrait reference exists.

The inventor is therefore shown from behind and at a slight rear angle.

The image represents Miwa-san without claiming an exact facial likeness.

Relaxed body language, coffee, open mathematics books, erased attempts,
and playful geometric models show that mathematics itself is enjoyable.

## First look

The learner first sees a photorealistic Japanese inventor using ordinary AI tools
inside a workshop-study that could be built in 2026.

The room has the warm intellectual density of a great theoretical physicist's study:
dark wood shelves, worn books, loose handwritten papers, a chalkboard, and a classic lamp.

It is inspired by the atmosphere of Einstein's study without depicting Einstein,
copying a historical photograph, or turning the inventor into a period character.

Mathematics, physics, chemistry, current fabrication equipment, and a prototype machine
must all belong to the same believable workspace.

## 3D layer

The existing adaptive robot remains interactive in the foreground.

The robot appears only inside the 3D tab.

Other tabs keep the same study background without the robot overlay.

Add a restrained animated theory pipeline anchored to the physical scene:

1. THEORY: a small cyan trace moves along the real whiteboard-to-monitor route.
2. TEST: a measuring pulse travels across the real workbench.
3. INVENT: a brass prototype ring activates around the physical machine.

The animation must remain visible without hiding the photorealistic background.

## Interaction

- `部品をずらす` starts the experiment.
- `固定ルート` follows the old route and fails.
- `AI再計画` observes, recalculates, and reaches the shifted part.
- Drag rotates the 3D layer.
- Wheel or pinch zooms the 3D layer.

## Visual direction

- full-bleed photorealistic background,
- book-lined study and invention workshop in one room,
- handwritten chalkboard theory on the left,
- ordinary AI simulation near the center,
- working prototype and fabrication tools on the right,
- adult black, graphite, stainless steel, brass, and controlled cyan,
- no purple glow,
- no generic stock-photo pose,
- no readable fake scientific claims,
- no holograms or floating screens,
- no giant science-fiction machine,
- no heavy text blocks,
- UI remains readable over the image.

## Acceptance criteria

- The first recall screen visibly uses the study background.
- Evidence and 3D tabs retain the same room identity.
- Header, navigation, reading stage, and controls use translucent surfaces instead of hiding the room.
- The generated background is copied into the project and PWA cache.
- The image is visibly different from the previous plain black laboratory.
- The canvas is transparent enough for the background to remain visible.
- THEORY, TEST, and INVENT have visible animated 3D cues.
- Fixed mode still fails against the shifted target.
- AI mode succeeds only after measured contact.
- Desktop 1520 x 912 and mobile 390 x 844 have no overlap or horizontal overflow.
- Canvas pixels change over time and after interaction.
- Public GitHub Pages serves the v40 asset and lab.

## 2026-07-17 scientific visual learning redesign

The July 17 update changes the whole app, not only the 3D tab.

The shared learning lens is:

`OBSERVE -> PRINCIPLE -> VERIFY -> INVENT`

Every mode keeps the same visual language:

- `OBSERVE`: what the newspaper or real device shows.
- `PRINCIPLE`: the physical reason in one short breath.
- `VERIFY`: a number, condition, or comparison that can be checked.
- `INVENT`: the practical device idea that follows from the principle.

The first viewport must make the current theme obvious before the learner reads
longer text. The July 17 theme is optical fiber, AI data-center demand, InP
transmitters, and liquid cooling.

### Image roles

- The newspaper crop remains evidence only.
- The hero image is a realistic photonics laboratory scene.
- Each revealed answer has one new explanation-specific realistic teaching image.
- The three teaching images are never reused across answers or mixed with source crops.

### Whole-app visual rules

- Keep the invention-study background visible through every root-app surface.
- Use a high-contrast graphite reading plane with paper-like text areas.
- Use cyan for light/data, amber for heat/energy, green for verified result,
  and red only for the curiosity marker.
- Put the learning lens strip directly below the mode tabs so it remains visible
  in recall, evidence, and lab views.
- Use one main explanation column and one visual column on desktop.
- Stack image before explanation on mobile.
- Keep one visible line to one idea, with generous gaps between numbered items.
- Never shrink text to fit a panel. Shorten or split it instead.
- Teaching-diagram labels must be short Japanese phrases. English sentences are a hard fail; only necessary technical symbols such as `InP`, `GPU`, `AI`, `nm`, and `℃` may remain.

### July 17 acceptance criteria

- The current set is append-only and shows `作成日 2026-07-17`.
- The first recall viewport shows the scientific learning lens and a readable question.
- The evidence view shows the article crop at readable inline size, not only as a thumbnail.
- Each of the three July 17 answers reveals a different teaching image.
- The answer image appears inside the answer panel after the choice is checked.
- Desktop 1520 x 912 and mobile 390 x 844 show no overlap or horizontal overflow.
- The same whole-app background treatment is visible in recall, evidence, and lab.
- The app remains usable if a previous set is selected.
