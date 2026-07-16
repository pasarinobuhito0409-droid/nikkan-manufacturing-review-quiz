# 2026-07-16 adaptive robot 3D lab

## Purpose

Teach one principle from the July 16 newspaper set:

`see -> decide -> rebuild the path -> move`

The learner must understand why an AI robot can recover when a part moves,
while a fixed-route robot keeps following the old path.

## First look

The first viewport shows one factory cell with:

- a robot arm,
- a blue target part,
- an amber obstacle,
- an old dashed path,
- a newly planned cyan path.

No introductory card blocks the 3D scene.

## Interaction order

1. Press `部品をずらす`.
2. Compare `固定ルート` and `AI再計画`.
3. Watch the state change through `見る`, `考える`, and `動く`.
4. Drag to rotate and use the wheel or pinch to zoom.

## Model boundary

This is a principle model, not a reproduction of Yaskawa or Google hardware.

The robot path and collision judgment are simplified for learning.

## Visual direction

- full-bleed Three.js scene,
- adult dark laboratory palette,
- warm brass for fixed behavior,
- cyan for sensing and replanning,
- restrained labels,
- no decorative cards inside cards,
- short-breath Japanese text.

## Acceptance criteria

- The July 16 set opens this lab from its `3Dラボ` tab.
- Fixed mode keeps the old path after the target moves.
- AI mode visibly scans and creates a new path.
- The moving robot reaches the changed target in AI mode.
- Desktop 1520 x 912 and mobile 390 x 844 show no overlap or horizontal overflow.
- Canvas pixels are nonblank and change over time.
- Controls work with mouse and touch.
- Public GitHub Pages serves every new file.
