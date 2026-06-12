# Theme Generator

A web-based design-system color theme tool built with **Nuxt 4 + Vue 3**. Create named themes, define base colors in the OKLCH color space, generate derived role colors, and export as JSON (re-importable) or CSS custom properties (drop-in ready).

> See [ARCHITECTURE.md](./ARCHITECTURE.md) for a full technical breakdown of components, composables, data flow, and the color model.

## Features

- **OKLCH color space** — perceptually uniform, great for accessible palettes
- **Delta-based color system** — derived colors are offsets from a base, not hardcoded values
- **Multiple themes** — create, rename, switch, delete, and import themes
- **Primary + Secondary color families** — each with independent base and derived role colors
- **Visibility toggles** — hide/show colors per theme without deleting them
- **Export** — JSON (full theme file) or CSS custom properties file
- **Persistence** — auto-saved to `localStorage` (`theme-gen-v2`)
- **Dark / light mode** — system-preference aware, toggleable
- **Responsive** — sidebar becomes a mobile drawer at ≤640 px
- **Unsaved-changes guard** — `beforeunload` warning when a theme has unsaved edits

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
# → http://localhost:3000
```

## Build

```bash
npm run build       # production build
npm run preview     # preview production build locally
npm run generate    # static site generation
```

## Tech Stack

| | |
|---|---|
| Framework | Nuxt 4.4 / Vue 3 |
| Language | TypeScript |
| Color math | [culori](https://culorijs.org/) (OKLCH conversion) |
| Styling | Scoped CSS + CSS custom properties |
| Persistence | Browser `localStorage` |
| Exports | Blob download API |
