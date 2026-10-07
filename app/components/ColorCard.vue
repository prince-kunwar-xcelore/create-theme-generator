<script setup lang="ts">
import { parse, oklch as toOklchColor, formatHex } from 'culori'
import { resolveColor } from '~/composables/useColorStore'
import type { OklchColor } from '~/composables/useColorStore'

function hexToOklch(hex: string): OklchColor | null {
  const parsed = parse(hex.startsWith('#') ? hex : `#${hex}`)
  if (!parsed) return null
  const ok = toOklchColor(parsed)
  if (!ok) return null
  return { l: +(ok.l ?? 0).toFixed(4), c: +(ok.c ?? 0).toFixed(4), h: +((ok.h ?? 0)).toFixed(1) }
}

function oklchToHex(ok: OklchColor): string {
  return formatHex({ mode: 'oklch', l: ok.l, c: ok.c, h: ok.h }) ?? '#000000'
}

const props = defineProps<{
  name: string
  color?: OklchColor
  delta?: OklchColor
  base?: OklchColor
  removable?: boolean
}>()

const emit = defineEmits<{
  'update:name': [value: string]
  'update:color': [value: OklchColor]
  'update:delta': [value: OklchColor]
  remove: []
}>()

const isDelta = computed(() => !!props.base && props.delta !== undefined)
const expanded = ref(false)

const resolved = computed<OklchColor>(() =>
  isDelta.value ? resolveColor(props.delta!, props.base!) : props.color!
)

const cssColor = computed(() =>
  `oklch(${resolved.value.l.toFixed(3)} ${resolved.value.c.toFixed(3)} ${resolved.value.h.toFixed(1)})`
)

const lTrack = computed(() =>
  `linear-gradient(to right,
    oklch(0 ${resolved.value.c} ${resolved.value.h}),
    oklch(0.5 ${resolved.value.c} ${resolved.value.h}),
    oklch(1 ${resolved.value.c} ${resolved.value.h}))`
)

const cTrack = computed(() =>
  `linear-gradient(to right,
    oklch(${resolved.value.l} 0 ${resolved.value.h}),
    oklch(${resolved.value.l} 0.37 ${resolved.value.h}))`
)

const hTrack = computed(() => {
  const { l, c } = resolved.value
  return `linear-gradient(to right,
    oklch(${l} ${c} 0),
    oklch(${l} ${c} 60),
    oklch(${l} ${c} 120),
    oklch(${l} ${c} 180),
    oklch(${l} ${c} 240),
    oklch(${l} ${c} 300),
    oklch(${l} ${c} 360))`
})

const diff = computed(() => isDelta.value ? props.delta! : null)

function fmtDiff(val: number, decimals: number, unit = '') {
  if (Math.abs(val) < Math.pow(10, -decimals) / 2) return null
  return (val > 0 ? '+' : '') + val.toFixed(decimals) + unit
}

// ── hex input ─────────────────────────────────────────────────────────────────
const hexDraft   = ref('')
const hexFocused = ref(false)

watch(resolved, (c) => {
  if (!hexFocused.value) hexDraft.value = oklchToHex(c)
}, { immediate: true })

function onHexInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  hexDraft.value = val
  const ok = hexToOklch(val)
  if (ok) emit('update:color', ok)
}

function onHexBlur() {
  hexFocused.value = false
  hexDraft.value = oklchToHex(resolved.value)
}

// ── core update ───────────────────────────────────────────────────────────────
function updateValue(key: keyof OklchColor, absValue: number) {
  if (isDelta.value) {
    const newDelta = { ...props.delta! }
    if (key === 'h') {
      let d = absValue - props.base!.h
      if (d > 180) d -= 360
      if (d < -180) d += 360
      newDelta.h = d
    } else {
      newDelta[key] = absValue - props.base![key]
    }
    emit('update:delta', newDelta)
  } else {
    emit('update:color', { ...props.color!, [key]: absValue })
  }
}

function update(key: keyof OklchColor, e: Event) {
  updateValue(key, parseFloat((e.target as HTMLInputElement).value))
}

// ── inline number editing (card) ──────────────────────────────────────────────
const editingChannel = ref<keyof OklchColor | null>(null)
const numDraft       = ref('')
const numEditRef     = ref<HTMLInputElement | null>(null)

function numDisplay(key: keyof OklchColor): string {
  if (key === 'h') return Math.round(resolved.value.h).toString()
  if (key === 'c') return resolved.value.c.toFixed(3)
  return resolved.value.l.toFixed(2)
}

async function startEdit(key: keyof OklchColor) {
  editingChannel.value = key
  numDraft.value = numDisplay(key)
  await nextTick()
  numEditRef.value?.focus()
  numEditRef.value?.select()
}

function commitEdit(key: keyof OklchColor) {
  if (editingChannel.value !== key) return
  const v = parseFloat(numDraft.value)
  if (!isNaN(v)) updateValue(key, v)
  editingChannel.value = null
}

function onNumKeydown(key: keyof OklchColor, e: KeyboardEvent) {
  if (e.key === 'Enter') { e.preventDefault(); commitEdit(key) }
  if (e.key === 'Escape') editingChannel.value = null
}

// ── modal number inputs (v-model computed) ────────────────────────────────────
const modalL = computed({
  get: () => resolved.value.l,
  set: (v: number) => { if (!isNaN(v)) updateValue('l', v) },
})
const modalC = computed({
  get: () => resolved.value.c,
  set: (v: number) => { if (!isNaN(v)) updateValue('c', v) },
})
const modalH = computed({
  get: () => resolved.value.h,
  set: (v: number) => { if (!isNaN(v)) updateValue('h', v) },
})

// ── expanded modal ────────────────────────────────────────────────────────────
function openExpanded()  { expanded.value = true  }
function closeExpanded() { expanded.value = false }

function handleGlobalKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && expanded.value) closeExpanded()
}

onMounted(() => window.addEventListener('keydown', handleGlobalKey))
onUnmounted(() => window.removeEventListener('keydown', handleGlobalKey))
</script>

<template>
  <div class="card">
    <div class="swatch" :style="{ background: cssColor }">
      <button class="expand-btn" title="Open in focus view" @click="openExpanded">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.5 1H10V4.5M4.5 10H1V6.5M10 6.5V10H6.5M1 4.5V1H4.5"
                stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button v-if="removable" class="remove-btn" title="Remove" @click="$emit('remove')">×</button>
    </div>

    <div class="body">
      <input
        class="name-input"
        :value="name"
        placeholder="Color name"
        @input="$emit('update:name', ($event.target as HTMLInputElement).value)"
      />

      <div v-if="!isDelta" class="hex-row">
        <span class="lbl">#</span>
        <input
          class="hex-input"
          :value="hexDraft"
          placeholder="e.g. 3b82f6"
          spellcheck="false"
          @focus="hexFocused = true"
          @input="onHexInput"
          @blur="onHexBlur"
        />
      </div>

      <!-- L -->
      <div class="slider-row">
        <span class="lbl">L</span>
        <div class="track-wrap" :style="{ '--track': lTrack }">
          <input type="range" min="0" max="1" step="0.01" :value="resolved.l" @input="update('l', $event)" />
        </div>
        <input
          v-if="editingChannel === 'l'"
          ref="numEditRef"
          class="num-edit"
          type="number"
          v-model="numDraft"
          min="0" max="1" step="0.01"
          @blur="commitEdit('l')"
          @keydown="onNumKeydown('l', $event)"
        />
        <span v-else class="num" title="Click to edit" @click="startEdit('l')">{{ resolved.l.toFixed(2) }}</span>
        <span v-if="diff" class="delta" :class="diff.l > 0 ? 'pos' : diff.l < 0 ? 'neg' : 'zero'">
          {{ fmtDiff(diff.l, 2) ?? '—' }}
        </span>
      </div>

      <!-- C -->
      <div class="slider-row">
        <span class="lbl">C</span>
        <div class="track-wrap" :style="{ '--track': cTrack }">
          <input type="range" min="0" max="0.37" step="0.001" :value="resolved.c" @input="update('c', $event)" />
        </div>
        <input
          v-if="editingChannel === 'c'"
          ref="numEditRef"
          class="num-edit"
          type="number"
          v-model="numDraft"
          min="0" max="0.37" step="0.001"
          @blur="commitEdit('c')"
          @keydown="onNumKeydown('c', $event)"
        />
        <span v-else class="num" title="Click to edit" @click="startEdit('c')">{{ resolved.c.toFixed(3) }}</span>
        <span v-if="diff" class="delta" :class="diff.c > 0 ? 'pos' : diff.c < 0 ? 'neg' : 'zero'">
          {{ fmtDiff(diff.c, 3) ?? '—' }}
        </span>
      </div>

      <!-- H -->
      <div class="slider-row">
        <span class="lbl">H</span>
        <div class="track-wrap" :style="{ '--track': hTrack }">
          <input type="range" min="0" max="360" step="1" :value="resolved.h" @input="update('h', $event)" />
        </div>
        <input
          v-if="editingChannel === 'h'"
          ref="numEditRef"
          class="num-edit"
          type="number"
          v-model="numDraft"
          min="0" max="360" step="1"
          @blur="commitEdit('h')"
          @keydown="onNumKeydown('h', $event)"
        />
        <span v-else class="num" title="Click to edit" @click="startEdit('h')">{{ Math.round(resolved.h) }}°</span>
        <span v-if="diff" class="delta" :class="diff.h > 0 ? 'pos' : diff.h < 0 ? 'neg' : 'zero'">
          {{ fmtDiff(diff.h, 0, '°') ?? '—' }}
        </span>
      </div>

      <div class="css-tag">{{ cssColor }}</div>
    </div>
  </div>

  <!-- Focus / expand modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="expanded" class="modal-backdrop" @click.self="closeExpanded">
        <div class="modal-panel">
          <div class="modal-swatch" :style="{ background: cssColor }">
            <span class="modal-color-name">{{ name }}</span>
            <button class="modal-close" title="Close" @click="closeExpanded">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div v-if="!isDelta" class="hex-row">
              <span class="lbl">#</span>
              <input
                class="hex-input"
                :value="hexDraft"
                placeholder="e.g. 3b82f6"
                spellcheck="false"
                @focus="hexFocused = true"
                @input="onHexInput"
                @blur="onHexBlur"
              />
            </div>

            <!-- L -->
            <div class="modal-row" :class="{ 'is-delta': !!diff }">
              <span class="modal-lbl">L</span>
              <div class="modal-track-wrap" :style="{ '--track': lTrack }">
                <input type="range" min="0" max="1" step="0.001" :value="resolved.l" @input="update('l', $event)" />
              </div>
              <input class="modal-num" type="number" v-model.number="modalL" min="0" max="1" step="0.001" />
              <span v-if="diff" class="delta" :class="diff.l > 0 ? 'pos' : diff.l < 0 ? 'neg' : 'zero'">
                {{ fmtDiff(diff.l, 2) ?? '—' }}
              </span>
            </div>

            <!-- C -->
            <div class="modal-row" :class="{ 'is-delta': !!diff }">
              <span class="modal-lbl">C</span>
              <div class="modal-track-wrap" :style="{ '--track': cTrack }">
                <input type="range" min="0" max="0.37" step="0.001" :value="resolved.c" @input="update('c', $event)" />
              </div>
              <input class="modal-num" type="number" v-model.number="modalC" min="0" max="0.37" step="0.001" />
              <span v-if="diff" class="delta" :class="diff.c > 0 ? 'pos' : diff.c < 0 ? 'neg' : 'zero'">
                {{ fmtDiff(diff.c, 3) ?? '—' }}
              </span>
            </div>

            <!-- H -->
            <div class="modal-row" :class="{ 'is-delta': !!diff }">
              <span class="modal-lbl">H</span>
              <div class="modal-track-wrap" :style="{ '--track': hTrack }">
                <input type="range" min="0" max="360" step="0.5" :value="resolved.h" @input="update('h', $event)" />
              </div>
              <input class="modal-num" type="number" v-model.number="modalH" min="0" max="360" step="0.5" />
              <span v-if="diff" class="delta" :class="diff.h > 0 ? 'pos' : diff.h < 0 ? 'neg' : 'zero'">
                {{ fmtDiff(diff.h, 0, '°') ?? '—' }}
              </span>
            </div>

            <div class="css-tag">{{ cssColor }}</div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── card ──────────────────────────────────────────────────────────────────── */
.card {
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.swatch {
  height: 128px;
  position: relative;
  transition: background 0.1s;
}

.swatch::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%, rgba(0,0,0,0.12) 100%);
  pointer-events: none;
}

/* ── expand button ─────────────────────────────────────────────────────────── */
.expand-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  z-index: 1;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.32);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  opacity: 0;
  transition: opacity 0.15s, background 0.1s;
}

.swatch:hover .expand-btn {
  opacity: 1;
}

.expand-btn:hover {
  background: rgba(0, 0, 0, 0.58);
  color: #fff;
}

/* ── remove button ─────────────────────────────────────────────────────────── */
.remove-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 0.1s;
}

.remove-btn:hover {
  background: rgba(0, 0, 0, 0.7);
}

/* ── body ──────────────────────────────────────────────────────────────────── */
.body {
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.name-input {
  width: 100%;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 7px;
  padding: 6px 10px;
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.1s;
}

.name-input:focus {
  border-color: var(--border-strong);
}

/* ── slider rows ───────────────────────────────────────────────────────────── */
.slider-row {
  display: grid;
  grid-template-columns: 14px 1fr 40px 46px;
  align-items: center;
  gap: 6px;
}

.lbl {
  font-size: 11px;
  font-weight: 700;
  font-family: monospace;
  color: var(--text-muted);
}

/* clickable num span */
.num {
  font-size: 10px;
  font-family: monospace;
  color: var(--text-2);
  text-align: right;
  cursor: pointer;
  border-radius: 3px;
  padding: 1px 3px;
  transition: background 0.1s, color 0.1s;
  user-select: none;
}

.num:hover {
  background: var(--surface-2);
  color: var(--text);
}

/* inline edit input */
.num-edit {
  font-size: 10px;
  font-family: monospace;
  color: var(--text);
  text-align: right;
  background: var(--surface-2);
  border: 1px solid var(--accent, #6366f1);
  border-radius: 3px;
  padding: 0 3px;
  width: 100%;
  height: 18px;
  outline: none;
  box-sizing: border-box;
}

.num-edit::-webkit-inner-spin-button,
.num-edit::-webkit-outer-spin-button { -webkit-appearance: none; }
.num-edit { -moz-appearance: textfield; }

.track-wrap {
  position: relative;
}

.track-wrap input[type='range'] {
  width: 100%;
  height: 6px;
  appearance: none;
  -webkit-appearance: none;
  border-radius: 3px;
  background: var(--track);
  cursor: pointer;
  outline: none;
  display: block;
}

.track-wrap input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid rgba(0, 0, 0, 0.25);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
  cursor: pointer;
}

.track-wrap input[type='range']::-moz-range-thumb {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid rgba(0, 0, 0, 0.25);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
  cursor: pointer;
}

/* ── delta badges ──────────────────────────────────────────────────────────── */
.delta {
  font-size: 10px;
  font-family: monospace;
  text-align: right;
  padding: 1px 4px;
  border-radius: 3px;
  white-space: nowrap;
}

.delta.pos  { color: #4ade80; background: rgba(74, 222, 128, 0.08); }
.delta.neg  { color: #f87171; background: rgba(248, 113, 113, 0.08); }
.delta.zero { color: var(--text-faint); }

/* ── misc ──────────────────────────────────────────────────────────────────── */
.css-tag {
  font-size: 10px;
  font-family: monospace;
  color: var(--text-muted);
  background: var(--bg);
  border-radius: 5px;
  padding: 4px 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hex-row {
  display: grid;
  grid-template-columns: 14px 1fr;
  align-items: center;
  gap: 6px;
}

.hex-input {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 7px;
  padding: 5px 10px;
  color: var(--text);
  font-size: 12px;
  font-family: monospace;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.1s;
}

.hex-input:focus { border-color: var(--accent, #6366f1); }

/* ── focus modal ───────────────────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 24px;
  width: 100%;
  max-width: 680px;
  overflow: hidden;
  box-shadow: 0 32px 96px rgba(0, 0, 0, 0.5);
}

.modal-swatch {
  height: 260px;
  position: relative;
  display: flex;
  align-items: flex-end;
  padding: 20px;
  transition: background 0.1s;
}

.modal-swatch::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 55%, rgba(0,0,0,0.18) 100%);
  pointer-events: none;
}

.modal-color-name {
  font-size: 20px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.45);
  position: relative;
  z-index: 1;
}

.modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 1;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.38);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.88);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 0.1s;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.62);
}

.modal-body {
  padding: 26px 28px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── modal slider rows ─────────────────────────────────────────────────────── */
.modal-row {
  display: grid;
  grid-template-columns: 24px 1fr 80px;
  align-items: center;
  gap: 14px;
}

.modal-row.is-delta {
  grid-template-columns: 24px 1fr 80px 60px;
}

.modal-lbl {
  font-size: 15px;
  font-weight: 700;
  font-family: monospace;
  color: var(--text-muted);
}

.modal-track-wrap {
  position: relative;
}

.modal-track-wrap input[type='range'] {
  width: 100%;
  height: 14px;
  appearance: none;
  -webkit-appearance: none;
  border-radius: 7px;
  background: var(--track);
  cursor: pointer;
  outline: none;
  display: block;
}

.modal-track-wrap input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid rgba(0, 0, 0, 0.18);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.45);
  cursor: pointer;
}

.modal-track-wrap input[type='range']::-moz-range-thumb {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid rgba(0, 0, 0, 0.18);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.45);
  cursor: pointer;
}

.modal-num {
  font-size: 14px;
  font-family: monospace;
  color: var(--text);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 7px 10px;
  text-align: right;
  width: 100%;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.1s;
}

.modal-num:focus {
  border-color: var(--accent, #6366f1);
}

.modal-num::-webkit-inner-spin-button,
.modal-num::-webkit-outer-spin-button { -webkit-appearance: none; }
.modal-num { -moz-appearance: textfield; }

/* ── modal transition ──────────────────────────────────────────────────────── */
.modal-enter-active { transition: opacity 0.18s ease; }
.modal-leave-active { transition: opacity 0.14s ease; }
.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel { transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-enter-from,
.modal-leave-to { opacity: 0; }
.modal-enter-from .modal-panel,
.modal-leave-to .modal-panel { transform: scale(0.93) translateY(10px); }
</style>
