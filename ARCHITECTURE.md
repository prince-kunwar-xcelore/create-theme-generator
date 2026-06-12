# Architecture

Quick-reference for new conversations / agents. Read this before touching any component.

---

## What the app does

Users build color themes for design systems. Each theme has two base colors (primary, secondary) and any number of derived "role" colors (e.g. hover, muted, destructive). All colors are expressed in **OKLCH** — a perceptually uniform color space that makes it easy to produce harmonious, accessible palettes by adjusting lightness/chroma/hue independently.

---

## File map

```
app/
├── app.vue                              # root — layout, sections, entry point
├── components/
│   ├── ColorCard.vue                    # OKLCH slider editor for one color
│   ├── ColorManagerPanel.vue            # add/toggle/rename primary derived colors
│   ├── SecondaryColorManagerPanel.vue   # same, for secondary derived colors
│   ├── ExportMenu.vue                   # JSON + CSS export dropdown
│   ├── ThemeSidebar.vue                 # theme list, create/rename/delete/import
│   ├── SaveModal.vue                    # (available, not wired in app.vue yet)
│   └── LoadModal.vue                    # (available, not wired in app.vue yet)
└── composables/
    ├── useColorStore.ts                 # all state + CRUD
    ├── useThemeStorage.ts               # localStorage + file export/import
    └── useTheme.ts                      # dark/light mode preference
```

---

## Data model (`useColorStore.ts`)

```ts
OklchColor   { l: 0–1, c: 0–0.37, h: 0–360 }

BaseColor    { id, name, color: OklchColor }
             // absolute color — the primary or secondary base

DerivedColor { id, name, delta: OklchColor }
             // offset from a base — resolveColor(delta, base) gives the real color

ThemeSlide {
  id, name, savedAt?
  primary:            BaseColor       // primary base
  secondary:          BaseColor       // secondary base
  customColors:       DerivedColor[]  // primary-family role colors
  hiddenColorIds:     string[]        // IDs hidden from the primary panel
  secondaryColors:    DerivedColor[]  // secondary-family role colors
  secondaryHiddenIds: string[]        // IDs hidden from the secondary panel
}
```

**`resolveColor(delta, base)`** — adds delta to base with clamping (l/c bounded, h wraps 360). This is the single source of truth for computing a real color from a derived one.

**Default base values**
- Primary: `oklch(0.55 0.22 250)` (blue-ish)
- Secondary: `oklch(0.55 0.18 320)` (purple-ish)

---

## State management (`useColorStore.ts`)

Uses Nuxt `useState` (SSR-safe global reactive state — no Pinia needed).

| State key | Type | Purpose |
|---|---|---|
| `themes` | `ThemeSlide[]` | all themes |
| `activeId` | `string` | which theme is active |
| `dirtyIds` | `string[]` | themes with unsaved changes |

Key computed shortcuts off the active theme: `primary`, `secondary`, `customColors`, `hiddenIds`, `secondaryColors`, `secondaryHiddenIds`.

**Dirty tracking** — `markDirty(id?)` / `markClean(id)` / `isDirty(id)`. Every mutation calls `markDirty()`. Saving calls `markClean()`. The sidebar shows a `●` indicator per dirty theme.

---

## Components

### `app.vue`
- Owns three collapsible sections: **Base Colors**, **Primary Role Colors**, **Secondary Role Colors**
- Wires all composables and passes props/events down
- Registers `beforeunload` to warn if any theme is dirty
- Seeds default delta values for primary (`hover`, `muted`, `subtle`, `strong`) and secondary (`info`, `warning`, `success`, `destructive`, `ring`) on first load

### `ThemeSidebar.vue`
- Lists all themes with a color swatch preview (3 dots: primary, a derived color, secondary)
- Double-click theme name to rename inline
- Buttons: new theme, delete theme, import JSON, save per theme
- Mobile: renders as a left-side drawer with a backdrop overlay (toggled by a hamburger in the header)

### `ColorCard.vue`
- Two modes controlled by the `mode` prop:
  - `"absolute"` — edits a `BaseColor.color` directly; shows a hex input
  - `"delta"` — edits a `DerivedColor.delta`; shows delta values and the resolved color
- Three OKLCH sliders (L, C, H) with gradient tracks computed from the current color
- Emits `update:color` (absolute mode) or `update:delta` (delta mode)
- Shows the resolved `oklch(...)` string

### `ColorManagerPanel.vue` / `SecondaryColorManagerPanel.vue`
- Slide-out panel (300 px) attached to the right of the color section
- Add color by name → appends a new `DerivedColor` with zero delta
- Per-color: visibility checkbox, inline name edit, delete button, color swatch
- Header: select-all / deselect-all checkbox (indeterminate state when partial), hidden count badge

### `ExportMenu.vue`
- Dropdown with two actions:
  - **Export JSON** → `downloadJSON(activeTheme)` — full `ThemeSlide` as `.json`
  - **Export CSS** → `downloadCSS(activeTheme)` — `:root { --primary: oklch(...); ... }`

---

## Composables

### `useThemeStorage.ts`
Storage key: `theme-gen-v2`

| Function | What it does |
|---|---|
| `loadData()` | Reads `{ themes, activeId }` from localStorage; returns `null` if absent/corrupt |
| `saveData(themes, activeId)` | Serializes to localStorage |
| `downloadJSON(theme)` | Blob-downloads the raw `ThemeSlide` as `.json` |
| `downloadCSS(theme)` | Builds `:root { ... }` block with all resolved `oklch()` values, downloads as `.css` |
| `parseImport(file)` | Reads a `.json` file, validates `primary`+`secondary` fields, returns a fresh `ThemeSlide` |

CSS variable naming: color name → lowercase + hyphenated → `--color-name`.

### `useTheme.ts`
- Reads `localStorage('theme-pref')`; falls back to `prefers-color-scheme`
- Applies `data-theme="dark"|"light"` on `<html>`
- Exports `{ isDark, toggle }`

---

## Data flow

```
User edits slider / hex in ColorCard
  → emits update:color | update:delta
  → app.vue mutates active ThemeSlide
  → markDirty()
  → computed refs re-evaluate → UI re-renders

User clicks Save (ThemeSidebar)
  → saveData(themes, activeId)
  → markClean(id)

User clicks Export (ExportMenu)
  → downloadJSON() or downloadCSS()
  → Blob → anchor click → file download

App mounts
  → loadData() from localStorage
  → if found: hydrate themes + activeId
  → if not: use createDefaultSlide()
```

---

## Worktrees

| Path | Branch | Status |
|---|---|---|
| `create-theme-generator` | `main` | stable |
| `create-theme-generator-explore` | `feature/collapsible-sections` | collapsible section panels |
| `create-theme-generator-secondary-roles` | `feature/secondary-role-colors` | secondary color family |

---

## Conventions

- All color mutations go through `useColorStore` — never mutate `ThemeSlide` directly outside of it.
- Always call `markDirty()` after any mutation that should be persisted.
- `resolveColor` is pure — use it freely for display; never store the resolved value, always store deltas.
- `useState` keys (`"themes"`, `"activeThemeId"`, `"dirtyThemeIds"`) must stay stable — changing them breaks SSR hydration.
- CSS custom properties live in `app.vue`'s `<style>` block under `:root` and `[data-theme="dark"]`.
