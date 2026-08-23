# wpb

A Boggle-like word game you can play on your phone. Drag across adjacent
tiles to spell words — 3+ letters, each tile used once per word. Find them
all!

Installable PWA: works offline, fullscreen on your phone.

## Play

https://mrstig.github.io/wpb/

## Development

Requires Node 20.19+ (Vite 7 requirement); CI uses Node 22.

```sh
npm install
npm run dev        # start dev server
npm test           # run unit + component tests (vitest)
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run build      # production build into dist/
npm run preview    # serve the production build
```

## Tech stack

- [Vite](https://vite.dev) + [TypeScript](https://www.typescriptlang.org)
- [Preact](https://preactjs.com) for the UI
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app) for the service
  worker and web manifest
- [Vitest](https://vitest.dev) for tests

Game logic (board generation, dictionary trie, solver, scoring, selection,
persistence) lives in `src/game/` as pure, unit-tested TypeScript modules,
independent of the DOM.

## Regenerating icons

The app icon is defined once as vector art in
`scripts/generate-icons.mjs`; all raster variants are generated from it:

```sh
npm run icons
```
