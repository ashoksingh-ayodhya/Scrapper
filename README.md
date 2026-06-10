# whoisashok.com — A Three.js B2B Marketing Manifesto

> Marketing is physics. I'm the physicist.

A continuous-scroll manifesto site presenting **20 marketing physics theories**, each rendered as a unique interactive WebGL scene — from a gravitational lead funnel to Gray-Scott reaction-diffusion segments.

## Stack

- **Vite + React + TypeScript**
- **Three.js / @react-three/fiber / drei** — 20 lazy-loaded interactive scenes
- **Lenis** smooth scroll, with scroll velocity piped into a **zustand** store that every scene and shader reads
- **Tailwind CSS v3** with the Fraunces / JetBrains Mono editorial palette
- **GSAP** for the velocity-driven TextSpringRig on display type

## Run

```bash
npm install
npm run dev      # local dev at :5173
npm run build    # type-check + production build
npm run lint
```

## Architecture notes

- `src/data/theories.ts` — 100% of the copy lives here; components never hardcode content.
- `src/components/scenes/` — one self-contained file per theory scene, mapped by `registry.ts` (`visualComponent` string → `React.lazy` import).
- `src/components/scenes/SceneCanvas.tsx` — IntersectionObserver-gated `<Canvas>`: offscreen scenes are unmounted entirely so at most ~2 WebGL contexts are ever alive.
- Scenes read scroll velocity inside `useFrame` via `usePhysicsStore.getState()` — no React re-renders on scroll.
- `src/lib/accents.ts` — static Tailwind class maps + hex palette (dynamic `text-${accent}` strings would be purged by the JIT).

## Easter eggs

- Highlight any formula text → it shatters into Three.js glyphs and reassembles after 3s.
- Type `override_budget=true` into the footer console → smooth-scroll hijack to top.
- Open with a generic corporate intro ("Hi Ashok, I am r…") → the console auto-corrects your payload.
- Fast scroll → the star field cracks and the Lorenz ribbons tear.
