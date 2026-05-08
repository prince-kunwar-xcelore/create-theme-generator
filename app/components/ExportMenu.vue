<script setup lang="ts">
const { active } = useColorStore()
const { downloadJSON, downloadCSS } = useThemeStorage()

const open = ref(false)
const menuRef = ref<HTMLElement>()

function handleClickOutside(e: MouseEvent) {
  if (!menuRef.value?.contains(e.target as Node)) open.value = false
}

onMounted(()  => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))

function doJSON() { downloadJSON(active.value); open.value = false }
function doCSS()  { downloadCSS(active.value);  open.value = false }
</script>

<template>
  <div ref="menuRef" class="export-wrap">
    <button class="hdr-btn" @click.stop="open = !open">
      Export <span class="chevron" :class="{ open }">▾</span>
    </button>

    <Transition name="drop">
      <div v-if="open" class="dropdown">
        <button class="drop-item" @click="doJSON">
          <span class="drop-icon">↓</span>
          <span>
            <span class="drop-label">JSON</span>
            <span class="drop-desc">Re-importable save file</span>
          </span>
        </button>
        <button class="drop-item" @click="doCSS">
          <span class="drop-icon">↓</span>
          <span>
            <span class="drop-label">CSS theme</span>
            <span class="drop-desc">Ready-to-use CSS custom properties</span>
          </span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.export-wrap {
  position: relative;
}

.hdr-btn {
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text-muted);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  transition: color 0.1s, border-color 0.1s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.hdr-btn:hover { color: var(--text); border-color: var(--border-strong); }

.chevron {
  font-size: 10px;
  transition: transform 0.15s;
  display: inline-block;
}

.chevron.open { transform: rotate(180deg); }

.dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  min-width: 220px;
  z-index: 20;
}

.drop-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
}

.drop-item:hover { background: var(--surface-hover); }

.drop-icon {
  font-size: 14px;
  color: var(--text-muted);
  flex-shrink: 0;
  width: 16px;
  text-align: center;
}

.drop-label {
  display: block;
  font-size: 13px;
  color: var(--text-2);
  font-weight: 500;
}

.drop-desc {
  display: block;
  font-size: 11px;
  color: var(--text-faint);
  margin-top: 1px;
}

.drop-enter-active, .drop-leave-active { transition: opacity 0.1s, transform 0.1s; }
.drop-enter-from, .drop-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
