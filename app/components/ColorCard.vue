<script setup lang="ts">
import { resolveColor } from '~/composables/useColorStore'
import type { OklchColor } from '~/composables/useColorStore'

const props = defineProps<{
  name: string
  // Absolute mode — primary / secondary
  color?: OklchColor
  // Delta mode — custom colors
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

// The actual displayed color — either absolute or resolved from delta+base
const resolved = computed<OklchColor>(() =>
  isDelta.value
    ? resolveColor(props.delta!, props.base!)
    : props.color!
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

// In delta mode the stored delta IS the diff — show it directly
const diff = computed(() => (isDelta.value ? props.delta! : null))

function fmtDiff(val: number, decimals: number, unit = '') {
  if (Math.abs(val) < Math.pow(10, -decimals) / 2) return null
  return (val > 0 ? '+' : '') + val.toFixed(decimals) + unit
}

function update(key: keyof OklchColor, e: Event) {
  const v = parseFloat((e.target as HTMLInputElement).value)

  if (isDelta.value) {
    const newDelta = { ...props.delta! }
    if (key === 'h') {
      // Normalise to shortest path so ΔH stays in (-180, +180]
      let d = v - props.base!.h
      if (d > 180) d -= 360
      if (d < -180) d += 360
      newDelta.h = d
    } else {
      newDelta[key] = v - props.base![key]
    }
    emit('update:delta', newDelta)
  } else {
    emit('update:color', { ...props.color!, [key]: v })
  }
}
</script>

<template>
  <div class="card">
    <div class="swatch" :style="{ background: cssColor }">
      <button v-if="removable" class="remove-btn" title="Remove" @click="$emit('remove')">×</button>
    </div>

    <div class="body">
      <input
        class="name-input"
        :value="name"
        placeholder="Color name"
        @input="$emit('update:name', ($event.target as HTMLInputElement).value)"
      />

      <div class="slider-row">
        <span class="lbl">L</span>
        <div class="track-wrap" :style="{ '--track': lTrack }">
          <input type="range" min="0" max="1" step="0.01" :value="resolved.l" @input="update('l', $event)" />
        </div>
        <span class="num">{{ resolved.l.toFixed(2) }}</span>
        <span v-if="diff" class="delta" :class="diff.l > 0 ? 'pos' : diff.l < 0 ? 'neg' : 'zero'">
          {{ fmtDiff(diff.l, 2) ?? '—' }}
        </span>
      </div>

      <div class="slider-row">
        <span class="lbl">C</span>
        <div class="track-wrap" :style="{ '--track': cTrack }">
          <input type="range" min="0" max="0.37" step="0.001" :value="resolved.c" @input="update('c', $event)" />
        </div>
        <span class="num">{{ resolved.c.toFixed(3) }}</span>
        <span v-if="diff" class="delta" :class="diff.c > 0 ? 'pos' : diff.c < 0 ? 'neg' : 'zero'">
          {{ fmtDiff(diff.c, 3) ?? '—' }}
        </span>
      </div>

      <div class="slider-row">
        <span class="lbl">H</span>
        <div class="track-wrap" :style="{ '--track': hTrack }">
          <input type="range" min="0" max="360" step="1" :value="resolved.h" @input="update('h', $event)" />
        </div>
        <span class="num">{{ Math.round(resolved.h) }}°</span>
        <span v-if="diff" class="delta" :class="diff.h > 0 ? 'pos' : diff.h < 0 ? 'neg' : 'zero'">
          {{ fmtDiff(diff.h, 0, '°') ?? '—' }}
        </span>
      </div>

      <div class="css-tag">{{ cssColor }}</div>
    </div>
  </div>
</template>

<style scoped>
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

.slider-row {
  display: grid;
  grid-template-columns: 14px 1fr 38px 46px;
  align-items: center;
  gap: 6px;
}

.lbl {
  font-size: 11px;
  font-weight: 700;
  font-family: monospace;
  color: var(--text-muted);
}

.num {
  font-size: 10px;
  font-family: monospace;
  color: var(--text-2);
  text-align: right;
}

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

.delta {
  font-size: 10px;
  font-family: monospace;
  text-align: right;
  padding: 1px 4px;
  border-radius: 3px;
  white-space: nowrap;
}

.delta.pos {
  color: #4ade80;
  background: rgba(74, 222, 128, 0.08);
}

.delta.neg {
  color: #f87171;
  background: rgba(248, 113, 113, 0.08);
}

.delta.zero {
  color: var(--text-faint);
}

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
</style>
