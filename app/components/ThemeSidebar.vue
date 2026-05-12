<script setup lang="ts">
import type { ThemeSlide } from '~/composables/useColorStore'

defineProps<{ open?: boolean }>()

const emit = defineEmits<{
  'new-theme': []
  import: [slide: ThemeSlide]
  close: []
}>()

const { themes, activeId, active, isDirty, switchTheme, removeTheme, renameTheme } = useColorStore()
const { saveData, parseImport } = useThemeStorage()
const { markClean } = useColorStore()

// ── inline rename ─────────────────────────────────────────────────────────────
const editingId  = ref('')
const editName   = ref('')
const nameInputs = ref<Record<string, HTMLInputElement>>({})

function startEdit(t: ThemeSlide, e: MouseEvent) {
  e.stopPropagation()
  editingId.value = t.id
  editName.value  = t.name
  nextTick(() => nameInputs.value[t.id]?.select())
}

function commitEdit(t: ThemeSlide) {
  if (editName.value.trim()) renameTheme(t.id, editName.value.trim())
  editingId.value = ''
}

// ── per-item save ─────────────────────────────────────────────────────────────
function saveTheme(id: string) {
  const t = themes.value.find(t => t.id === id)
  if (!t) return
  t.savedAt = new Date().toISOString()
  markClean(id)
  saveData(themes.value, activeId.value)
}

// ── primary swatch color ──────────────────────────────────────────────────────
function swatchCss(t: ThemeSlide) {
  const { l, c, h } = t.primary.color
  return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`
}

// ── file import ───────────────────────────────────────────────────────────────
const fileInput = ref<HTMLInputElement>()
const importError = ref('')

async function handleFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  importError.value = ''
  try {
    const slide = await parseImport(file)
    emit('import', slide)
  } catch (err: any) {
    importError.value = err.message
  } finally {
    ;(e.target as HTMLInputElement).value = ''
  }
}

function fmtDate(iso?: string) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
</script>

<template>
  <Teleport to="body">
    <div v-show="open" class="sidebar-backdrop" @click="$emit('close')" />
  </Teleport>

  <aside class="sidebar" :class="{ open }">
    <div class="sidebar-head">
      <span class="sidebar-title">Themes</span>
      <button class="sidebar-close" @click="$emit('close')">✕</button>
    </div>

    <div class="theme-list">
      <div
        v-for="t in themes"
        :key="t.id"
        class="theme-item"
        :class="{ active: t.id === activeId }"
        @click="switchTheme(t.id)"
      >
        <span class="swatch" :style="{ background: swatchCss(t) }" />

        <div class="theme-info">
          <template v-if="editingId === t.id">
            <input
              :ref="el => { if (el) nameInputs[t.id] = el as HTMLInputElement }"
              v-model="editName"
              class="name-edit"
              @blur="commitEdit(t)"
              @keydown.enter="commitEdit(t)"
              @keydown.escape="editingId = ''"
              @click.stop
            />
          </template>
          <template v-else>
            <span class="theme-name" @dblclick.stop="startEdit(t, $event)">{{ t.name }}</span>
            <span v-if="t.savedAt && !isDirty(t.id)" class="saved-date">{{ fmtDate(t.savedAt) }}</span>
          </template>
        </div>

        <button
          v-if="isDirty(t.id)"
          class="dirty-btn"
          title="Save this theme"
          @click.stop="saveTheme(t.id)"
        />

        <button
          class="del-btn"
          title="Delete theme"
          :disabled="themes.length <= 1"
          @click.stop="removeTheme(t.id)"
        >×</button>
      </div>
    </div>

    <div class="sidebar-foot">
      <button class="foot-btn primary" @click="$emit('new-theme')">+ New Theme</button>
      <button class="foot-btn" @click="fileInput?.click()">Import</button>
      <input ref="fileInput" type="file" accept=".json" hidden @change="handleFile" />
      <p v-if="importError" class="import-error">{{ importError }}</p>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 200px;
  min-width: 200px;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-head {
  padding: 14px 14px 10px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.sidebar-title {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-faint);
}

/* ── theme list ──────────────────────────────────────────────────────────────── */

.theme-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px 6px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.theme-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.1s;
  min-width: 0;
  position: relative;
}

.theme-item:hover { background: var(--surface-hover); }
.theme-item.active {
  background: var(--surface);
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}

.swatch {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  flex-shrink: 0;
  border: 1px solid rgba(0,0,0,0.12);
}

.theme-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.theme-name {
  font-size: 12px;
  color: var(--text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.theme-item.active .theme-name { color: var(--text); font-weight: 500; }

.saved-date {
  font-size: 10px;
  color: var(--text-faint);
}

.name-edit {
  width: 100%;
  background: var(--bg);
  border: 1px solid var(--accent);
  border-radius: 4px;
  padding: 1px 4px;
  color: var(--text);
  font-size: 12px;
  outline: none;
  min-width: 0;
}

/* ── dirty + delete buttons ──────────────────────────────────────────────────── */

.dirty-btn {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  padding: 0;
  transition: transform 0.15s, opacity 0.15s;
}

.dirty-btn:hover { transform: scale(1.5); opacity: 0.7; }

.del-btn {
  width: 16px;
  height: 16px;
  background: transparent;
  border: none;
  color: var(--text-placeholder);
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  flex-shrink: 0;
  opacity: 0;
  transition: color 0.1s, opacity 0.1s;
  border-radius: 3px;
}

.theme-item:hover .del-btn { opacity: 1; }
.del-btn:hover { color: #f87171; }
.del-btn:disabled { opacity: 0 !important; cursor: default; }

/* ── footer ──────────────────────────────────────────────────────────────────── */

.sidebar-foot {
  border-top: 1px solid var(--border);
  padding: 8px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

.foot-btn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
  padding: 6px 10px;
  border-radius: 7px;
  font-size: 11px;
  cursor: pointer;
  text-align: left;
  transition: color 0.1s, border-color 0.1s;
}

.foot-btn:hover { color: var(--text); border-color: var(--border-strong); }

.foot-btn.primary {
  background: var(--accent-subtle);
  border-color: var(--accent-border);
  color: var(--accent-text);
}

.foot-btn.primary:hover { opacity: 0.85; }

.import-error {
  font-size: 10px;
  color: #f87171;
  padding: 2px 2px;
}

/* ── mobile drawer ───────────────────────────────────────────────────────────── */

.sidebar-close { display: none; }

.sidebar-backdrop {
  display: none;
}

@media (max-width: 640px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 200;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    border-right: 1px solid var(--border);
  }

  .sidebar.open {
    transform: translateX(0);
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.25);
  }

  .sidebar-close {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: auto;
    background: transparent;
    border: none;
    color: var(--text-faint);
    font-size: 14px;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 4px;
    line-height: 1;
  }

  .sidebar-close:hover { color: var(--text); }

  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 199;
    background: var(--overlay);
  }
}
</style>
