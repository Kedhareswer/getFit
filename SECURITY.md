# Security model

GetFit is a **client-side-only** single-page app. It has no backend, no API keys, no accounts,
and no telemetry. The dataset is a same-origin static file; exercise GIFs are hotlinked images;
all user data lives in `localStorage`. The attack surface is correspondingly small, and the
controls below keep it that way.

## Threat model → mitigation

| Threat | Mitigation |
|---|---|
| **XSS via dataset text** (third-party `name`/`instructions`/muscles could contain markup) | All dataset text is rendered through JSX interpolation (React auto-escapes). `instruction_steps` (a `string[]`) is rendered as `<ol><li>{step}</li></ol>`, never joined into HTML. No `dangerouslySetInnerHTML` anywhere. |
| **XSS via user text** (workout names, imported JSON) | Same JSX-only rendering. Inputs are length-capped and re-validated on read. Imported JSON is parsed in `try/catch` and shape-validated before use. |
| **Malicious / broken exercise media** | GIF host allowed only in `img-src` (images can't execute script). URL built from a regex-validated `media_id` only. `<img referrerPolicy="no-referrer" loading="lazy">` with an `onError` fallback to a local placeholder (handler cleared to avoid loops). |
| **localStorage tampering / corrupt state** | Zustand `persist` with a versioned key (`getfit-v1`) and a defensive `merge` that drops non-conforming shapes and falls back to clean defaults — never throws to the UI. |
| **Storage quota / DoS** | Collections are bounded: workouts ≤ 200, exercises/workout ≤ 60, history ≤ 500 (FIFO), favorites unbounded but id-only. Only lightweight user data is stored — never the 9.7 MB dataset. |
| **Clickjacking** | `frame-ancestors 'none'` + `X-Frame-Options: DENY` delivered as **HTTP headers** (`public/_headers`, `vercel.json`). |
| **Reverse tabnabbing / unsafe links** | External links use `target="_blank" rel="noopener noreferrer"`. Non-constant URLs pass through `safeUrl()` (https/relative allowlist; rejects `javascript:`/`data:`/`blob:`). |
| **Supply chain** | Lean, fixed dependency set; commit the lockfile and use `npm ci`; run `npm audit`. No runtime third-party `<script>`/CDN. |
| **Secrets exposure** | None by design — no backend, no env secrets, public dataset. |

## Content-Security-Policy

Injected as a `<meta http-equiv>` on production builds (see `vite.config.ts`) and, preferably,
delivered as an HTTP header by the host (`public/_headers` / `vercel.json`):

```
default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: https://static.exercisedb.dev;
connect-src 'self'; frame-ancestors 'none'; frame-src 'none'; form-action 'self';
manifest-src 'self'; worker-src 'self'; upgrade-insecure-requests
```

`'unsafe-inline'` is present only for **styles** (React inline `style` attributes + Tailwind);
`script-src` stays `'self'` with no inline/eval. The dev server omits the meta CSP so HMR works;
verify the real policy with `npm run preview`.

## Additional headers (host-delivered)

`X-Content-Type-Options: nosniff` · `Referrer-Policy: strict-origin-when-cross-origin` ·
`Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()` ·
`Cross-Origin-Opener-Policy: same-origin` · `Cross-Origin-Resource-Policy: same-origin` ·
`Cache-Control: no-store` on `index.html`.

## Input validation

Numeric workout fields are clamped (`sets 1–20`, `reps 1–100`, `rest 0–600s`, `weight 0–2000`,
one decimal) in the store; names are trimmed and length-capped. See `src/state/store.ts`.

## Reporting

This is a demo project. If you find an issue with the redistributed dataset content, contact the
[exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset) maintainers.
