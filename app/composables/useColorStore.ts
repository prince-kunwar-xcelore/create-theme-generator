export interface OklchColor {
  l: number; // 0–1
  c: number; // 0–0.37
  h: number; // 0–360
}

export interface BaseColor {
  id: string;
  name: string;
  color: OklchColor;
}

export interface DerivedColor {
  id: string;
  name: string;
  delta: OklchColor;
}

export interface ThemeSlide {
  id: string;
  name: string;
  savedAt?: string;
  primary: BaseColor;
  secondary: BaseColor;
  customColors: DerivedColor[];
  hiddenColorIds: string[];
}

export function resolveColor(delta: OklchColor, base: OklchColor): OklchColor {
  return {
    l: Math.max(0, Math.min(1, base.l + delta.l)),
    c: Math.max(0, Math.min(0.37, base.c + delta.c)),
    h: (((base.h + delta.h) % 360) + 360) % 360,
  };
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function createDefaultSlide(name = "Theme 1"): ThemeSlide {
  return {
    id: genId(),
    name,
    primary: {
      id: "primary",
      name: "Primary",
      color: { l: 0.55, c: 0.22, h: 250 },
    },
    secondary: {
      id: "secondary",
      name: "Secondary",
      color: { l: 0.55, c: 0.18, h: 320 },
    },
    customColors: [],
    hiddenColorIds: [],
  };
}

export const useColorStore = () => {
  const themes = useState<ThemeSlide[]>("themes", () => [createDefaultSlide()]);
  const activeId = useState<string>("activeThemeId", () => themes.value[0]!.id);
  const dirtyIds = useState<string[]>("dirtyThemeIds", () => []);

  const active = computed(
    () => themes.value.find((t) => t.id === activeId.value) ?? themes.value[0]!,
  );

  // Convenience refs — keeps existing component APIs working
  const primary = computed(() => active.value.primary);
  const secondary = computed(() => active.value.secondary);
  const customColors = computed(() => active.value.customColors);
  const hiddenIds = computed(() => active.value.hiddenColorIds);

  // ── dirty tracking ────────────────────────────────────────────────────────────
  function markDirty(id = activeId.value) {
    if (!dirtyIds.value.includes(id)) dirtyIds.value = [...dirtyIds.value, id];
  }
  function markClean(id: string) {
    dirtyIds.value = dirtyIds.value.filter((x) => x !== id);
  }
  function isDirty(id: string) {
    return dirtyIds.value.includes(id);
  }

  // ── theme management ──────────────────────────────────────────────────────────
  function addTheme(name?: string) {
    const slide = createDefaultSlide(
      name ?? `Theme ${themes.value.length + 1}`,
    );
    themes.value.push(slide);
    activeId.value = slide.id;
    markDirty(slide.id);
  }

  function removeTheme(id: string) {
    if (themes.value.length <= 1) return;
    const idx = themes.value.findIndex((t) => t.id === id);
    themes.value = themes.value.filter((t) => t.id !== id);
    markClean(id);
    if (activeId.value === id)
      activeId.value = themes.value[Math.max(0, idx - 1)].id;
  }

  function switchTheme(id: string) {
    activeId.value = id;
  }

  function importTheme(slide: ThemeSlide) {
    themes.value.push(slide);
    activeId.value = slide.id;
    markDirty(slide.id);
  }

  function renameTheme(id: string, name: string) {
    const t = themes.value.find((t) => t.id === id);
    if (t) {
      t.name = name;
      markDirty(id);
    }
  }

  // ── color operations (always on active theme) ─────────────────────────────────
  function addColor(name: string, delta: OklchColor = { l: 0, c: 0, h: 0 }) {
    active.value.customColors.push({ id: genId(), name, delta });
    markDirty();
  }

  function removeColor(id: string) {
    const a = active.value;
    a.customColors = a.customColors.filter((c) => c.id !== id);
    a.hiddenColorIds = a.hiddenColorIds.filter((x) => x !== id);
    markDirty();
  }

  // ── visibility ────────────────────────────────────────────────────────────────
  function isVisible(id: string) {
    return !active.value.hiddenColorIds.includes(id);
  }

  function toggleVisibility(id: string) {
    const a = active.value;
    a.hiddenColorIds = a.hiddenColorIds.includes(id)
      ? a.hiddenColorIds.filter((x) => x !== id)
      : [...a.hiddenColorIds, id];
    markDirty();
  }

  function setAllVisible() {
    active.value.hiddenColorIds = [];
    markDirty();
  }
  function hideAll() {
    active.value.hiddenColorIds = active.value.customColors.map((c) => c.id);
    markDirty();
  }

  return {
    themes,
    activeId,
    active,
    dirtyIds,
    primary,
    secondary,
    customColors,
    hiddenIds,
    markDirty,
    markClean,
    isDirty,
    addTheme,
    removeTheme,
    switchTheme,
    importTheme,
    renameTheme,
    addColor,
    removeColor,
    isVisible,
    toggleVisibility,
    setAllVisible,
    hideAll,
  };
};
