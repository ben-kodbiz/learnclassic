/**
 * Loads glossary.json and renders the searchable Glossary view (#/glossary).
 */

let glossaryCache = null;

export async function loadGlossary() {
  if (glossaryCache) return glossaryCache;
  const res = await fetch("./data/glossary.json", { cache: "no-cache" });
  if (!res.ok) {
    throw new Error(`Failed to load glossary (HTTP ${res.status})`);
  }
  glossaryCache = await res.json();
  return glossaryCache;
}

export function getGlossaryById(glossary, id) {
  return glossary?.terms?.find((t) => t.id === id) || null;
}

export function renderGlossaryView(glossary, curriculum, query, esc) {
  const q = (query || "").trim().toLowerCase();
  const terms = (glossary?.terms || []).filter((t) => {
    if (!q) return true;
    return [t.term, t.termArabic, t.definition].join(" ").toLowerCase().includes(q);
  });

  const cards = terms.length
    ? terms
        .map((t) => {
          const links = (t.lessonIds || [])
            .map((lid) => {
              const ch = curriculum.chaptersById.get(lid);
              if (!ch) return "";
              const label =
                ch.chapter === "supplement"
                  ? "Literary Supplement"
                  : ch.chapter === "consolidation-1"
                    ? "Module 1 Consolidation"
                    : `Ch. ${ch.chapter}`;
              return `<a class="btn btn-secondary" href="#/chapter/${encodeURIComponent(lid)}">${esc(label)}: ${esc(ch.title)}</a>`;
            })
            .join("");

          return `
            <article class="panel glossary-card" id="term-${esc(t.id)}">
              <div class="chapter-card-top">
                <h2 class="chapter-title">${esc(t.term)}</h2>
                <span class="arabic-heading" lang="ar" dir="rtl">${esc(t.termArabic)}</span>
              </div>
              <p>${esc(t.definition)}</p>
              <div class="prereq-list">${links}</div>
            </article>
          `;
        })
        .join("")
    : `<section class="panel"><p>No glossary terms match your search.</p></section>`;

  return `
    <section class="panel">
      <h1>Classical Grammar Glossary</h1>
      <p>Core terminology in <em>Ṣarf</em>, <em>Naḥw</em>, and <em>Iʿrāb</em>, linked directly to the lessons where each concept is taught.</p>
      <div class="filter-bar">
        <label class="skip-link" for="glossary-search">Search glossary terms</label>
        <input
          id="glossary-search"
          class="search-input"
          type="search"
          placeholder="Search Arabic or English grammar terms…"
          value="${esc(query || "")}"
        >
      </div>
    </section>
    <div class="glossary-grid">
      ${cards}
    </div>
  `;
}
