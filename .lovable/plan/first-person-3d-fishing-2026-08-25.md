# First-Person 3D Fishing

Replace the SVG side-view scene with a true first-person 3D lake built on Three.js (React Three Fiber). The player stands on a dock, looks around with the mouse, walks with WASD, and fishes with a redesigned cast/reel system.

## The experience

- Open the page, click once to lock the mouse pointer, and you're standing on a wooden dock at the edge of a lake.
- Mouse look, WASD to walk, Shift to sprint, Esc to release the mouse.
- Look out at the water and hold left-click to charge a cast — a power meter fills. Release to throw the lure; distance scales with charge.
- The bobber lands with a splash and floats. After a random delay a fish bites: the bobber dips, the rod tip bends, a sound-free visual cue plus a "!" prompt appears.
- Click within the bite window to hook it. Miss it and the fish escapes.
- Once hooked, a reeling mini-game runs: hold left-click to reel, but keep line tension in the safe band shown by a tension bar. Too much tension too long and the line snaps; too little and the fish swims off. Bigger fish fight harder and longer.
- Land it and a catch card shows species, weight, and length, then it's added to your collection.
- Weather still cycles through the five states, now as 3D sky/lighting/particle changes (sunset glow, mountain overcast, snowfall, rain, starfield). Weather affects which species bite and how hard they fight.
- Press Tab for the fish collection, and a key for achievements — both as overlay panels instead of the old cabin door / gravestone hotspots.

## Scene content

- Lake surface with animated waves and reflections, a shoreline, distant mountains, pine trees, the log cabin, and Luna Wildrose's grave preserved as 3D props you can walk up to.
- First-person rod and hands visible in view, animating for idle, cast, and reel.

## Reworked mechanics

| Old | New |
| --- | --- |
| Space toggles fishing on/off | Hold-to-charge cast with power meter |
| Fish caught instantly on reel | Bite window + hook timing + tension reeling mini-game |
| Random size only | Species depend on weather, cast distance, and depth; size drives fight difficulty |
| Cabin/grave click hotspots | Keyboard-opened overlay panels |
| Position clamped 43–57% | Free walking on dock and shore with collision bounds |

## Technical notes

- Add `three`, `@react-three/fiber@^8.18`, `@react-three/drei@^9.122.0`.
- New folder `src/components/game3d/`: `Game3D.tsx` (Canvas + state), `Player.tsx` (PointerLockControls + movement), `Lake.tsx`, `Terrain.tsx`, `Props.tsx` (cabin, grave, trees), `RodView.tsx` (first-person rod), `Bobber.tsx`, `Weather3D.tsx`, plus a `useFishing` hook holding the cast/bite/hook/reel state machine.
- HUD stays in DOM (React overlay over the canvas): power meter, tension bar, catch card, collection and achievement panels, control hints.
- Reuse existing `FishCatch`, `GameStats`, `Achievement` localStorage entities unchanged; extend catch records with `length` and `fightTime`.
- Delete `src/components/fishing/*` SVG scene components once the 3D scene replaces them; `Index.tsx` renders `Game3D`.
- Keep achievements working, add a couple tied to the new mechanics (first hooked fish, first snapped line survived).

## Build order

1. Install deps, scaffold Canvas + pointer-lock player on flat ground.
2. Lake, terrain, skybox, and props.
3. First-person rod view and cast trajectory + bobber physics.
4. Bite/hook/tension state machine and HUD meters.
5. Weather cycle in 3D with species tables.
6. Collection/achievement overlays, persistence wiring, cleanup of old SVG files.
