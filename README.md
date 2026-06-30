# GetFit 🏋️

A secure, fast, **client-side** fitness web app built on the open
[exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset) (ExerciseDB v1).
Browse 1,324 exercises with animated demonstrations, build workouts, run guided
sessions with a rest timer, and track your progress — all **private by design**:
nothing leaves your browser.

## Features

- **Exercise Library** — search (name + muscles, accent-insensitive, ranked) and filter
  all 1,324 exercises by body part, target muscle, and equipment. Shareable filter URLs,
  incremental loading.
- **Exercise Detail** — animated GIF demo, target/secondary muscles, and step-by-step
  instructions in **6 languages** (English, Spanish, Italian, Turkish, Russian, Chinese),
  plus related exercises.
- **Workout Builder** — create workouts, add exercises, set sets/reps/rest, reorder
  (keyboard-accessible), and start a session. Auto-saved.
- **Guided Session Player** — exercise-by-exercise, set logging, a rest timer (skip / +15s),
  and a session that **resumes after a reload**.
- **Progress** — streak, totals, a dependency-free volume chart, an activity heatmap,
  and full session history.
- **Favorites**, **dark/light themes**, **reduce-motion** (click-to-play GIFs), units (kg/lb),
  and **data export/import** (JSON).
- **Accessible** (WCAG-minded: keyboard, focus management, ARIA, screen-reader chart/heatmap
  equivalents, reduced motion) and **secure** (strict CSP, no backend, no tracking).

## Tech stack

Vite · React 18 · TypeScript (strict) · Tailwind CSS · React Router · Zustand (localStorage persistence) · lucide-react.
No charting/animation libraries — bar chart and motion are hand-rolled. Lean by design.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

Build & preview the production bundle (with the strict CSP applied):

```bash
npm run build      # prepares data + typechecks + builds
npm run preview    # http://localhost:4173
```

### Data

`public/data/exercises.json` (~9.7 MB, includes 6-language instructions) is the full dataset.
`npm run prepare-data` (run automatically by `build`) derives a lean
`public/data/exercises.index.json` (~270 KB) used for browsing/search; the full file is
fetched lazily only when instructions are first needed.

## Project structure

```
public/data/        exercises.json (full) + exercises.index.json (lean, generated)
public/_headers      Netlify/Cloudflare security headers
vercel.json          Vercel security headers
scripts/             prepare-data.mjs (full → index split)
src/
  lib/               data, taxonomy, theme, session math, hooks, safeUrl
  state/             zustand store (persisted) + DataContext (loads dataset)
  components/        shell, shared UI, ExerciseCard/Gif, FilterPanel, WorkoutPicker, ui/*
  pages/             Dashboard, Library, ExerciseDetail, Workouts, Builder,
                     Player, SessionSummary, Progress, Favorites, Settings, NotFound
```

## Security & privacy

There is **no backend**. All user data (workouts, history, favorites, settings) lives in
`localStorage` and is never uploaded. The app ships a strict Content-Security-Policy, hotlinks
exercise GIFs from `static.exercisedb.dev` over an `img-src`-only allowance (images can't execute
script), and validates all stored/imported data. See [SECURITY.md](./SECURITY.md).

> Note: `frame-ancestors` / `X-Frame-Options` are delivered as real HTTP headers (see
> `public/_headers` and `vercel.json`) because they are ignored in a `<meta>` CSP.

## Deployment

Any static host works (`dist/`). `vercel.json` and `public/_headers` carry the full security
header set for Vercel and Netlify/Cloudflare Pages respectively.

## Data attribution

Exercise content originates from **ExerciseDB v1 (AscendAPI)**, redistributed via the open
[exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset). Animation media is
referenced (not copied) from `static.exercisedb.dev`. This project claims no ownership of the
underlying exercise content; it is used for educational/demo purposes.
