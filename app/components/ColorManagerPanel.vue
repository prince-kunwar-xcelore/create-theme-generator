<script setup lang="ts">
import { resolveColor } from '~/composables/useColorStore'
import type { DerivedColor } from '~/composables/useColorStore'

defineProps<{ open: boolean }>()
defineEmits<{ close: [] }>()

const {
  primary,
  customColors,
  hiddenIds,
  addColor,
  removeColor,
  isVisible,
  toggleVisibility,
  setAllVisible,
  hideAll,
} = useColorStore()

// ── add input ─────────────────────────────────────────────────────────────────
const newName = ref('')
const addInput = ref<HTMLInputElement>()

watch(
  () => useAttrs().open as boolean | undefined,
  (v) => { if (v) nextTick(() => addInput.value?.focus()) },
)

function handleAdd() {
  const name = newName.value.trim()
  if (!name) return
  addColor(name)
  newName.value = ''
  addInput.value?.focus()
}

// ── select-all checkbox ───────────────────────────────────────────────────────
const allCheckRef = ref<HTMLInputElement>()

const allVisible = computed(() => hiddenIds.value.length === 0)

watchEffect(() => {
  if (!allCheckRef.value) return
  const h = hiddenIds.value.length
  const n = customColors.value.length
  allCheckRef.value.indeterminate = h > 0 && h < n
})

function toggleAll() {
  allVisible.value ? hideAll() : setAllVisible()
}

// ── swatch color ──────────────────────────────────────────────────────────────
function swatchCss(c: DerivedColor): string {
  const r = resolveColor(c.delta, primary.value.color)
  return `oklch(${r.l.toFixed(3)} ${r.c.toFixed(3)} ${r.h.toFixed(1)})`
}
</script>

<template>
  <Teleport to="body">
    <Transition name="panel">
      <div v-if="open" class="backdrop" @click.self="$emit('close')">
        <div class="panel">

          <div class="panel-head">
            <span class="panel-title">
              Colors
              <span class="count">{{ customColors.length }}</span>
            </span>
            <button class="close-btn" @click="$emit('close')">×</button>
          </div>

          <!-- Add input -->
          <div class="add-row">
            <input
              ref="addInput"
              v-model="newName"
              class="add-input"
              placeholder="Color name…"
              @keydown.enter="handleAdd"
            />
            <button class="add-btn" :disabled="!newName.trim()" @click="handleAdd" title="Add (Enter)">
              ↵
            </button>
          </div>

          <!-- Select all -->
          <div class="list-controls">
            <label class="all-row">
              <input
                ref="allCheckRef"
                type="checkbox"
                :checked="allVisible"
                @change="toggleAll"
              />
              <span class="all-label">all</span>
            </label>
            <span class="visible-count">
              {{ customColors.length - hiddenIds.length }} shown
            </span>
          </div>

          <!-- Color list -->
          <div class="color-list">
            <div
              v-for="c in customColors"
              :key="c.id"
              class="color-row"
              :class="{ hidden: !isVisible(c.id) }"
            >
              <input
                type="checkbox"
                :checked="isVisible(c.id)"
                @change="toggleVisibility(c.id)"
              />
              <span class="dot" :style="{ background: swatchCss(c) }" />
              <input
                class="name-input"
                :value="c.name"
                @input="c.name = ($event.target as HTMLInputElement).value"
                @keydown.enter="($event.target as HTMLInputElement).blur()"
              />
              <button class="del-btn" title="Remove" @click="removeColor(c.id)">×</button>
            </div>

            <div v-if="!customColors.length" class="empty-list">
              Type a name above and press Enter.
            </div>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: var(--overlay);
  z-index: 50;
  display: flex;
  justify-content: flex-end;
}

.panel {
  width: 300px;
  height: 100%;
  background: var(--surface);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-panel);
}

/* ── header ─────────────────────────────────────────────────────────────────── */

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-2);
  display: flex;
  align-items: center;
  gap: 6px;
}

.count {
  font-size: 11px;
  color: var(--text-faint);
  font-weight: 400;
  background: var(--surface-2);
  padding: 1px 6px;
  border-radius: 10px;
}

.close-btn {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  background: transparent;
  border: none;
  color: var(--text-faint);
  font-size: 17px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: color 0.1s;
}

.close-btn:hover { color: var(--text-2); }

/* ── add row ─────────────────────────────────────────────────────────────────── */

.add-row {
  display: flex;
  gap: 6px;
  padding: 12px 12px 0;
  flex-shrink: 0;
}

.add-input {
  flex: 1;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 7px;
  padding: 7px 10px;
  color: var(--text);
  font-size: 13px;
  outline: none;
  transition: border-color 0.1s;
  min-width: 0;
}

.add-input:focus { border-color: var(--border-strong); }
.add-input::placeholder { color: var(--text-placeholder); }

.add-btn {
  width: 32px;
  height: 32px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 7px;
  color: var(--text-muted);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: color 0.1s, border-color 0.1s;
  padding: 0;
}

.add-btn:not(:disabled):hover { color: var(--text); border-color: var(--border-strong); }
.add-btn:disabled { opacity: 0.3; cursor: default; }

/* ── list controls ───────────────────────────────────────────────────────────── */

.list-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 8px;
  flex-shrink: 0;
}

.all-row {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.all-row input[type='checkbox'] {
  accent-color: var(--accent);
  cursor: pointer;
  width: 13px;
  height: 13px;
}

.all-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-faint);
}

.visible-count {
  font-size: 11px;
  color: var(--text-faint);
  font-family: monospace;
}

/* ── color list ──────────────────────────────────────────────────────────────── */

.color-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.color-row {
  display: grid;
  grid-template-columns: 20px 12px 1fr 24px;
  align-items: center;
  gap: 8px;
  padding: 6px 6px;
  border-radius: 7px;
  transition: background 0.1s;
}

.color-row:hover { background: var(--surface-hover); }

.color-row.hidden { opacity: 0.4; }

.color-row input[type='checkbox'] {
  accent-color: var(--accent);
  cursor: pointer;
  width: 13px;
  height: 13px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.name-input {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 5px;
  padding: 3px 6px;
  color: var(--text-2);
  font-size: 12px;
  outline: none;
  width: 100%;
  min-width: 0;
  transition: border-color 0.1s, background 0.1s;
}

.name-input:focus {
  background: var(--bg);
  border-color: var(--border);
}

.del-btn {
  background: transparent;
  border: none;
  color: var(--text-placeholder);
  font-size: 15px;
  cursor: pointer;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: color 0.1s;
  flex-shrink: 0;
}

.del-btn:hover { color: #f87171; }

.empty-list {
  font-size: 12px;
  color: var(--text-faint);
  padding: 20px 6px;
  text-align: center;
}

/* ── transition ──────────────────────────────────────────────────────────────── */

.panel-enter-active,
.panel-leave-active { transition: transform 0.2s ease, opacity 0.2s; }
.panel-enter-from,
.panel-leave-to { transform: translateX(100%); opacity: 0; }
</style>
