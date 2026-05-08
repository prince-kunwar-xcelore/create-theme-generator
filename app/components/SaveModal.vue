<script setup lang="ts">
const props = defineProps<{ open: boolean }>()

const emit = defineEmits<{
  save: [{ name: string; saveLocal: boolean; downloadJson: boolean; downloadCsv: boolean }]
  close: []
}>()

const name = ref('My Theme')
const saveLocal = ref(true)
const downloadJson = ref(false)
const downloadCsv = ref(false)
const nameInput = ref<HTMLInputElement>()

watch(
  () => props.open,
  (v) => { if (v) nextTick(() => nameInput.value?.focus()) },
)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

function submit() {
  const trimmed = name.value.trim()
  if (!trimmed) return
  if (!saveLocal.value && !downloadJson.value && !downloadCsv.value) return
  emit('save', { name: trimmed, saveLocal: saveLocal.value, downloadJson: downloadJson.value, downloadCsv: downloadCsv.value })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="overlay" @click.self="$emit('close')" @keydown="onKeydown">
        <div class="modal" role="dialog" aria-modal="true">
          <div class="modal-head">
            <span class="modal-title">Save Theme</span>
            <button class="close-btn" @click="$emit('close')">×</button>
          </div>

          <div class="modal-body">
            <label class="field-label">Name</label>
            <input
              ref="nameInput"
              v-model="name"
              class="text-input"
              placeholder="My Theme"
              @keydown.enter="submit"
            />

            <label class="field-label" style="margin-top: 20px;">Save to</label>

            <div class="options">
              <label class="option">
                <input type="checkbox" v-model="saveLocal" />
                <span class="option-text">
                  <span class="option-name">Browser storage</span>
                  <span class="option-desc">Saved in localStorage, accessible next visit</span>
                </span>
              </label>

              <label class="option">
                <input type="checkbox" v-model="downloadJson" />
                <span class="option-text">
                  <span class="option-name">Download JSON</span>
                  <span class="option-desc">Full save file — can be reloaded later</span>
                </span>
              </label>

              <label class="option">
                <input type="checkbox" v-model="downloadCsv" />
                <span class="option-text">
                  <span class="option-name">Download CSV</span>
                  <span class="option-desc">Flat export with resolved values + deltas</span>
                </span>
              </label>
            </div>
          </div>

          <div class="modal-foot">
            <button class="btn-ghost" @click="$emit('close')">Cancel</button>
            <button
              class="btn-primary"
              :disabled="!name.trim() || (!saveLocal && !downloadJson && !downloadCsv)"
              @click="submit"
            >Save</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-radius: 14px;
  width: 420px;
  max-width: calc(100vw - 32px);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 0;
}

.modal-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-2);
}

.close-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: var(--text-faint);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.1s;
  padding: 0;
}

.close-btn:hover { color: var(--text-2); }

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-faint);
  display: block;
  margin-bottom: 6px;
}

.text-input {
  width: 100%;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 12px;
  color: var(--text);
  font-size: 13px;
  outline: none;
  transition: border-color 0.1s;
  box-sizing: border-box;
}

.text-input:focus { border-color: var(--border-strong); }

.options {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.1s;
}

.option:hover { background: var(--surface-hover); }

.option input[type='checkbox'] {
  margin-top: 2px;
  accent-color: var(--accent);
  cursor: pointer;
  flex-shrink: 0;
}

.option-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-name {
  font-size: 13px;
  color: var(--text-2);
}

.option-desc {
  font-size: 11px;
  color: var(--text-faint);
}

.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 0 20px 20px;
}

.btn-ghost {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: color 0.1s, border-color 0.1s;
}

.btn-ghost:hover { color: var(--text-2); border-color: var(--border-strong); }

.btn-primary {
  background: var(--accent);
  border: none;
  color: #fff;
  padding: 7px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.1s;
}

.btn-primary:disabled { opacity: 0.35; cursor: default; }
.btn-primary:not(:disabled):hover { opacity: 0.85; }

.modal-enter-active,
.modal-leave-active { transition: opacity 0.15s; }
.modal-enter-from,
.modal-leave-to { opacity: 0; }
</style>
