/**
 * Loads and indexes curriculum.json and module-1..3.json using relative paths
 * so the app works at root or under any GitHub Pages repository subpath.
 */

async function fetchJson(relPath) {
  const res = await fetch(relPath, { cache: "no-cache" });
  if (!res.ok) {
    throw new Error(`Failed to load ${relPath} (HTTP ${res.status})`);
  }
  return res.json();
}

export async function loadCurriculum() {
  const root = await fetchJson("./data/curriculum.json");
  const moduleDataList = await Promise.all(
    root.modules.map((m) => fetchJson(`./${m.dataFile}`))
  );

  const modules = root.modules.map((meta, idx) => {
    const detail = moduleDataList[idx];
    return {
      ...meta,
      weeks: detail.weeks,
    };
  });

  const chaptersById = new Map();
  const orderedChapters = [];

  for (const mod of modules) {
    for (const wk of mod.weeks) {
      for (const ch of wk.chapters) {
        const enriched = {
          ...ch,
          moduleId: mod.id,
          moduleNumber: mod.number,
          moduleTitle: mod.title,
          week: wk.week,
          weekTitle: wk.title,
        };
        chaptersById.set(ch.id, enriched);
        orderedChapters.push(enriched);
      }
    }
  }

  return {
    ...root,
    modules,
    chaptersById,
    orderedChapters,
  };
}
