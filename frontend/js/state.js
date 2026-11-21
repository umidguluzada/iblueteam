import { api } from "./api.js";

/** Əhatə səviyyəti (0, 1, 2) -> açar */
export const L = ["gap", "partial", "full"];

export const state = {
  matrix: null,
  stats: null,
  index: [], // [{id, name}] qayda formunda texnika axtarışı üçün
  sources: [], // log mənbəyi kataloqu (qayda formu üçün)
  platforms: [],
  user: null,
  filters: { q: "", platform: "Windows", tactic: "", ds: "", cov: "all", subs: false, heat: false },
  expanded: new Set(),
  selected: null,
};

const listeners = [];
/** Verilənlər yenilənəndə çağırılacaq funksiyanı qeydiyyata al */
export const onRefresh = (fn) => listeners.push(fn);

/** Platforma parametri: bütün platformalar üçün "all" */
export const platformParam = () => encodeURIComponent(state.filters.platform || "all");

export async function loadAll() {
  const p = platformParam();
  const [matrix, stats, sources] = await Promise.all([
    api.get(`/api/matrix?platform=${p}`),
    api.get(`/api/stats?platform=${p}`),
    api.get(`/api/data-sources?platform=${p}`),
  ]);
  state.matrix = matrix;
  state.stats = stats;
  state.sources = sources;
  state.index = buildIndex(matrix);
}

export async function loadPlatforms() {
  try {
    state.platforms = await api.get("/api/platforms");
  } catch {
    state.platforms = ["Windows"];
  }
}

/** Verilənləri yenidən yüklə və bütün görünüşləri yenilə (qayda dəyişəndən sonra) */
export async function refresh() {
  await loadAll();
  for (const fn of listeners) fn();
}

function buildIndex(m) {
  const seen = new Map();
  for (const tac of m.tactics) {
    for (const t of tac.techniques) {
      if (seen.has(t.id)) continue;
      seen.set(t.id, { id: t.id, name: t.name });
      for (const s of t.subs) seen.set(s.id, { id: s.id, name: `${t.name}: ${s.name}` });
    }
  }
  return [...seen.values()].sort((a, b) => a.id.localeCompare(b.id));
}
