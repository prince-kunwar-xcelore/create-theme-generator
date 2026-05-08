<script setup lang="ts">
import type { ThemeData, SaveEntry } from '~/composables/useThemeStorage'

const props = defineProps<{ open: boolean }>()

const emit = defineEmits<{
  load: [ThemeData]
  close: []
}>()

const { listSaves, deleteLocalSave, parseUpload } = useThemeStorage()

const saves = ref<SaveEntry[]>([])
const fileInput = ref<HTMLInputElement>()
const error = ref('')

watch(
  () => props.open,
  (v) => {
    if (v) {
      saves.value = listSaves()
      error.value = ''
    }
  },
  { immediate: true },
)

function load(entry: SaveEntry) {
  emit('load', entry.data)
}

function remove(id: string) {
  deleteLocalSave(id)
  saves.value = listSaves()
}

async function handleFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  error.value = ''
  try {
    const { data } = await parseUpload(file)
    emit('load', data)
  } catch (err: any) {
    error.value = err.message
  } finally {
    ;(e.target as HTMLInputElement).value = ''
  }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="overlay" @click.self="$emit('close')">
        <div class="modal" role="dialog" aria-modal="true">
          <div class="modal-head">
            <span class="modal-title">Load Theme</span>
            <button class="close-btn" @click="$emit('close')">×</button>
          </div>

          <div class="modal-body">
            <!-- Browser saves -->
            <label class="section-label">Saved in browser</label>

            <div v-if="saves.length" class="save-list">
              <div v-for="entry in saves" :key="entry.id" class="save-row">
                <div class="save-info">
                  <span class="save-name">{{ entry.name }}</span>
                  <span class="save-date">{{ fmtDate(entry.savedAt) }}</span>
                </div>
                <div class="save-actions">
                  <button class="action-btn load" @click="load(entry)">Load</button>
                  <button class="action-btn delete" @click="remove(entry.id)" title="Delete">×</button>
                </div>
              </div>
            </div>

            <div v-else class="empty-saves">No saves in browser yet.</div>

            <!-- File upload -->
            <label class="section-label" style="margin-top: 20px;">Load from file</label>
            <p class="hint">Upload a previously downloaded <code>.json</code> file.</p>

            <button class="upload-btn" @click="fileInput?.click()">Choose file…</button>
            <input ref="fileInput" type="file" accept=".json" hidden @change="handleFile" />

            <p v-if="error" class="error">{{ error }}</p>
          </div>

          <div class="modal-foot">
            <button class="btn-ghost" @click="$emit('close')">Close</button>
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
  background: var(--overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-radius: 14px;
  width: 460px;
  max-width: calc(100vw - 32px);
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 0;
  flex-shrink: 0;
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
  padding: 0;
  transition: color 0.1s;
}

.close-btn:hover { color: var(--text-2); }

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-faint);
  display: block;
  margin-bottom: 4px;
}

.save-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.save-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  gap: 12px;
}

.save-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.save-name {
  font-size: 13px;
  color: var(--text-2);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.save-date {
  font-size: 11px;
  color: var(--text-faint);
}

.save-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.action-btn {
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 10px;
  transition: opacity 0.1s;
}

.action-btn.load {
  background: var(--accent-subtle);
  color: var(--accent-text);
  border: 1px solid var(--accent-border);
}

.action-btn.load:hover { opacity: 0.8; }

.action-btn.delete {
  background: transparent;
  color: var(--text-faint);
  border: 1px solid var(--border);
  font-size: 15px;
  padding: 4px 8px;
}

.action-btn.delete:hover { color: #f87171; border-color: #f8717144; }

.empty-saves {
  font-size: 13px;
  color: var(--text-faint);
  padding: 16px 0 8px;
}

.hint {
  font-size: 12px;
  color: var(--text-faint);
  margin-bottom: 4px;
}

.hint code {
  color: var(--text-muted);
  background: var(--surface-2);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 11px;
}

.upload-btn {
  background: var(--surface-2);
  border: 1px dashed var(--border);
  color: var(--text-muted);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  align-self: flex-start;
  transition: color 0.1s, border-color 0.1s;
}

.upload-btn:hover { color: var(--text); border-color: var(--border-strong); }

.error {
  font-size: 12px;
  color: #f87171;
  background: rgba(248, 113, 113, 0.08);
  border: 1px solid rgba(248, 113, 113, 0.2);
  border-radius: 6px;
  padding: 8px 12px;
  margin-top: 4px;
}

.modal-foot {
  display: flex;
  justify-content: flex-end;
  padding: 0 20px 20px;
  flex-shrink: 0;
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

.modal-enter-active,
.modal-leave-active { transition: opacity 0.15s; }
.modal-enter-from,
.modal-leave-to { opacity: 0; }
</style>
