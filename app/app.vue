<script setup lang="ts">
import type { OklchColor, ThemeSlide } from '~/composables/useColorStore'

const DEFAULT_COLORS: { name: string; delta: OklchColor }[] = [
  { name: 'Accent',     delta: { l:  0.05, c:  0.08, h:  25 } },
  { name: 'Background', delta: { l: -0.45, c: -0.20, h:   0 } },
  { name: 'Foreground', delta: { l:  0.40, c: -0.19, h:   0 } },
  { name: 'Surface',    delta: { l: -0.38, c: -0.18, h:   0 } },
  { name: 'Sidebar',    delta: { l: -0.32, c: -0.16, h:  -5 } },
  { name: 'Muted',      delta: { l:  0.08, c: -0.14, h:   0 } },
  { name: 'Border',     delta: { l: -0.20, c: -0.16, h:   0 } },
]

const DEFAULT_SECONDARY_COLORS: { name: string; delta: OklchColor }[] = [
  { name: 'Info',        delta: { l:  0.05, c:  0.06, h: -20 } },
  { name: 'Warning',     delta: { l:  0.10, c:  0.10, h:  40 } },
  { name: 'Success',     delta: { l:  0.05, c:  0.08, h:  80 } },
  { name: 'Destructive', delta: { l:  0.00, c:  0.12, h: 100 } },
  { name: 'Ring',        delta: { l: -0.10, c:  0.04, h:   0 } },
]

// ── store ─────────────────────────────────────────────────────────────────────
const {
  themes, activeId, active, isDirty,
  primary, secondary, customColors, hiddenIds,
  secondaryColors, secondaryHiddenIds,
  markDirty, markClean,
  addTheme, importTheme,
  addColor, removeColor,
  isVisible,
  addSecondaryColor, removeSecondaryColor,
  isSecondaryVisible,
} = useColorStore()

const { loadData, saveData, downloadJSON, downloadCSS } = useThemeStorage()
const { theme, init: initTheme, toggle: toggleTheme } = useTheme()

// ── visible slices ────────────────────────────────────────────────────────────
const visibleColors          = computed(() => customColors.value.filter(c => isVisible(c.id)))
const visibleSecondaryColors = computed(() => secondaryColors.value.filter(c => isSecondaryVisible(c.id)))

// ── panel / sidebar / collapse state ─────────────────────────────────────────
const showPanel          = ref(false)
const showSecondaryPanel = ref(false)
const sidebarOpen        = ref(false)

const collapsed = reactive({ base: false, primary: false, secondary: false })

// ── seed default colors ───────────────────────────────────────────────────────
function seedDefaults() {
  for (const c of DEFAULT_COLORS) addColor(c.name, c.delta)
}

function seedSecondaryDefaults() {
  for (const c of DEFAULT_SECONDARY_COLORS) addSecondaryColor(c.name, c.delta)
}

// ── bootstrap ─────────────────────────────────────────────────────────────────
onMounted(() => {
  initTheme()
  const saved = loadData()
  if (saved) {
    themes.value   = saved.themes
    activeId.value = saved.activeId ?? saved.themes[0]?.id
  } else {
    seedDefaults()
    seedSecondaryDefaults()
  }
})

// ── sidebar events ────────────────────────────────────────────────────────────
function handleNewTheme() {
  addTheme()
  seedDefaults()
  seedSecondaryDefaults()
}

function handleImport(slide: ThemeSlide) {
  importTheme(slide)
}

// ── save ──────────────────────────────────────────────────────────────────────
function save() {
  active.value.savedAt = new Date().toISOString()
  markClean(activeId.value)
  saveData(themes.value, activeId.value)
}
</script>

<template>
  <div class="app">
    <header class="header">
      <div class="header-inner">
        <span class="logo">⬡</span>
        <h1>Theme Generator</h1>
        <div class="header-actions">
          <button class="hdr-btn icon menu-btn" title="Themes" @click="sidebarOpen = true">☰</button>
          <button
            class="hdr-btn icon"
            :title="theme === 'dark' ? 'Switch to light' : 'Switch to dark'"
            @click="toggleTheme"
          >{{ theme === 'dark' ? '☀' : '☾' }}</button>
          <ExportMenu />
          <button
            class="hdr-btn accent"
            :class="{ dirty: isDirty(activeId) }"
            @click="save"
          >Save{{ isDirty(activeId) ? ' ●' : '' }}</button>
        </div>
      </div>
    </header>

    <div class="workspace">
      <ThemeSidebar :open="sidebarOpen" @new-theme="handleNewTheme" @import="handleImport" @close="sidebarOpen = false" />

      <main class="main">
        <div class="content">

          <!-- ── Base Colors ───────────────────────────────────────────────── -->
          <section class="section">
            <button class="section-toggle" @click="collapsed.base = !collapsed.base">
              <span class="section-label">Base Colors</span>
              <span class="chevron" :class="{ open: !collapsed.base }">›</span>
            </button>
            <div class="section-body" :class="{ collapsed: collapsed.base }">
              <div class="section-body-inner">
                <div class="grid">
                  <ColorCard
                    :name="primary.name"
                    :color="primary.color"
                    @update:name="primary.name = $event; markDirty()"
                    @update:color="primary.color = $event; markDirty()"
                  />
                  <ColorCard
                    :name="secondary.name"
                    :color="secondary.color"
                    @update:name="secondary.name = $event; markDirty()"
                    @update:color="secondary.color = $event; markDirty()"
                  />
                </div>
              </div>
            </div>
          </section>

          <!-- ── Primary Role Colors ──────────────────────────────────────── -->
          <section class="section">
            <button class="section-toggle" @click="collapsed.primary = !collapsed.primary">
              <span class="section-label">Primary Role Colors</span>
              <div class="section-toggle-right">
                <span v-if="hiddenIds.length" class="hidden-badge">{{ hiddenIds.length }} hidden</span>
                <button class="manage-btn" @click.stop="showPanel = true">
                  Colors <span class="manage-count">{{ customColors.length }}</span>
                </button>
                <span class="chevron" :class="{ open: !collapsed.primary }">›</span>
              </div>
            </button>
            <div class="section-body" :class="{ collapsed: collapsed.primary }">
              <div class="section-body-inner">
                <div v-if="visibleColors.length" class="grid">
                  <ColorCard
                    v-for="c in visibleColors"
                    :key="c.id"
                    :name="c.name"
                    :delta="c.delta"
                    :base="primary.color"
                    :removable="true"
                    @update:name="c.name = $event; markDirty()"
                    @update:delta="c.delta = $event; markDirty()"
                    @remove="removeColor(c.id)"
                  />
                </div>
                <div v-else-if="customColors.length" class="empty">
                  All colors are hidden — open <strong>Colors</strong> to show some.
                </div>
                <div v-else class="empty">
                  No colors yet — click <strong>Colors</strong> to add some.
                </div>
              </div>
            </div>
          </section>

          <!-- ── Secondary Role Colors ─────────────────────────────────────── -->
          <section class="section">
            <button class="section-toggle" @click="collapsed.secondary = !collapsed.secondary">
              <span class="section-label">Secondary Role Colors</span>
              <div class="section-toggle-right">
                <span v-if="secondaryHiddenIds.length" class="hidden-badge">{{ secondaryHiddenIds.length }} hidden</span>
                <button class="manage-btn" @click.stop="showSecondaryPanel = true">
                  Colors <span class="manage-count">{{ secondaryColors.length }}</span>
                </button>
                <span class="chevron" :class="{ open: !collapsed.secondary }">›</span>
              </div>
            </button>
            <div class="section-body" :class="{ collapsed: collapsed.secondary }">
              <div class="section-body-inner">
                <div v-if="visibleSecondaryColors.length" class="grid">
                  <ColorCard
                    v-for="c in visibleSecondaryColors"
                    :key="c.id"
                    :name="c.name"
                    :delta="c.delta"
                    :base="secondary.color"
                    :removable="true"
                    @update:name="c.name = $event; markDirty()"
                    @update:delta="c.delta = $event; markDirty()"
                    @remove="removeSecondaryColor(c.id)"
                  />
                </div>
                <div v-else-if="secondaryColors.length" class="empty">
                  All colors are hidden — open <strong>Colors</strong> to show some.
                </div>
                <div v-else class="empty">
                  No colors yet — click <strong>Colors</strong> to add some.
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>

    <ColorManagerPanel :open="showPanel" @close="showPanel = false" />
    <SecondaryColorManagerPanel :open="showSecondaryPanel" @close="showSecondaryPanel = false" />
  </div>
</template>

<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

[data-theme="dark"] {
  --bg:               #0a0a0a;
  --surface:          #161616;
  --surface-raised:   #191919;
  --surface-2:        #222222;
  --surface-hover:    #1e1e1e;
  --border:           #2a2a2a;
  --border-strong:    #555555;
  --text:             #e0e0e0;
  --text-2:           #cccccc;
  --text-muted:       #888888;
  --text-faint:       #555555;
  --text-placeholder: #3a3a3a;
  --accent:           #7c7cff;
  --accent-text:      #9999ff;
  --accent-subtle:    rgba(124, 124, 255, 0.13);
  --accent-border:    rgba(124, 124, 255, 0.3);
  --overlay:          rgba(0, 0, 0, 0.65);
  --sidebar-bg:       #0a0a0a;
  --shadow-card:      none;
  --shadow-panel:     -16px 0 48px rgba(0, 0, 0, 0.5);
}

[data-theme="light"] {
  --bg:               #ffffff;
  --surface:          #ffffff;
  --surface-raised:   #ffffff;
  --surface-2:        #f3f4f8;
  --surface-hover:    #f7f8fc;
  --sidebar-bg:       #f0f1f5;
  --border:           #e0e1e8;
  --border-strong:    #9999aa;
  --text:             #111111;
  --text-2:           #2a2a3a;
  --text-muted:       #555566;
  --text-faint:       #888899;
  --text-placeholder: #aaaabc;
  --accent:           #5555ee;
  --accent-text:      #4444cc;
  --accent-subtle:    rgba(85, 85, 238, 0.1);
  --accent-border:    rgba(85, 85, 238, 0.25);
  --overlay:          rgba(0, 0, 0, 0.35);
  --shadow-card:      0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.07);
  --shadow-panel:     0 4px 24px rgba(0,0,0,0.12);
}

html, body {
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  height: 100%;
}
</style>

<style scoped>
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── header ──────────────────────────────────────────────────────────────────── */

.header {
  border-bottom: 1px solid var(--border);
  padding: 0 20px;
  height: 52px;
  display: flex;
  align-items: center;
  background: var(--surface);
  flex-shrink: 0;
  z-index: 10;
}

.header-inner { display: flex; align-items: center; gap: 10px; width: 100%; }

.logo { font-size: 20px; opacity: 0.4; }

h1 {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.2px;
  color: var(--text-2);
  flex: 1;
}

.header-actions { display: flex; gap: 8px; align-items: center; }

.hdr-btn {
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text-muted);
  padding: 5px 12px;
  border-radius: 7px;
  font-size: 12px;
  cursor: pointer;
  transition: color 0.1s, border-color 0.1s;
}

.hdr-btn:hover { color: var(--text); border-color: var(--border-strong); }
.hdr-btn.icon   { padding: 5px 9px; font-size: 14px; }

.hdr-btn.accent {
  background: var(--accent-subtle);
  border-color: var(--accent-border);
  color: var(--accent-text);
}

.hdr-btn.accent:hover { opacity: 0.85; }

/* ── workspace ───────────────────────────────────────────────────────────────── */

.workspace {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.main {
  flex: 1;
  overflow-y: auto;
}

/* ── content ─────────────────────────────────────────────────────────────────── */

.content {
  padding: 32px 32px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* ── sections ────────────────────────────────────────────────────────────────── */

.section {
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--surface);
}

.section-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  gap: 10px;
  text-align: left;
}

.section-toggle:hover { background: var(--surface-hover); }

.section-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.section-toggle-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chevron {
  font-size: 16px;
  color: var(--text-faint);
  line-height: 1;
  transition: transform 0.25s ease;
  display: inline-block;
  transform: rotate(0deg);
}

.chevron.open { transform: rotate(90deg); }

/* ── collapsible body ────────────────────────────────────────────────────────── */

.section-body {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows 0.25s ease;
}

.section-body.collapsed {
  grid-template-rows: 0fr;
}

.section-body-inner {
  overflow: hidden;
  padding: 12px 16px 16px;
}

/* ── badges + manage button ──────────────────────────────────────────────────── */

.hidden-badge {
  font-size: 11px;
  color: var(--text-faint);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 2px 8px;
}

.manage-btn {
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text-muted);
  padding: 4px 10px;
  border-radius: 7px;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: color 0.1s, border-color 0.1s;
}

.manage-btn:hover { color: var(--text); border-color: var(--border-strong); }

.manage-count {
  font-size: 10px;
  background: var(--border);
  color: var(--text-faint);
  padding: 1px 5px;
  border-radius: 7px;
}

/* ── grid + empty ────────────────────────────────────────────────────────────── */

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.empty {
  padding: 36px;
  text-align: center;
  color: var(--text-faint);
  font-size: 13px;
  border: 1px dashed var(--border);
  border-radius: 12px;
}

.empty strong { color: var(--text-muted); }

@media (min-width: 641px) {
  .menu-btn { display: none; }
}

@media (max-width: 640px) {
  .content { padding: 16px 12px; }
}
</style>
