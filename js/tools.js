/**
 * Phase 6 — Advanced Classical Grammar Tools (#/tools):
 * 1. Verb-Form Explorer (Forms I–X)
 * 2. Conjugation Practice (Regular & Irregular Verbs)
 * 3. Root & Pattern Explorer
 * 4. Interactive Iʿrāb Parser
 * 5. Guided Classical Reading Mode
 */

let toolsCache = null;

export async function loadToolsData() {
  if (toolsCache) return toolsCache;
  const res = await fetch("./data/grammar-tools.json", { cache: "no-cache" });
  if (!res.ok) {
    throw new Error(`Failed to load grammar tools (HTTP ${res.status})`);
  }
  toolsCache = await res.json();
  return toolsCache;
}

export function renderToolsView(data, state, esc) {
  const activeTab = state.tab || "forms";

  const tabs = [
    ["forms", "Verb Forms I–X"],
    ["conjugation", "Conjugation Practice"],
    ["roots", "Root & Pattern Explorer"],
    ["irab", "Interactive Iʿrāb Lab"],
    ["reading", "Classical Reading"],
  ]
    .map(
      ([id, label]) =>
        `<button type="button" class="btn ${activeTab === id ? "btn-primary" : "btn-secondary"} tool-tab-btn" data-tab="${id}">${esc(label)}</button>`
    )
    .join("");

  let bodyHtml = "";

  if (activeTab === "forms") {
    const rows = data.verbForms
      .map(
        (vf) => `
        <tr>
          <td><strong>Form ${esc(vf.form)}</strong></td>
          <td lang="ar" dir="rtl" class="table-ar">${esc(vf.perfect)} / ${esc(vf.imperfect)}</td>
          <td lang="ar" dir="rtl" class="table-ar">${esc(vf.masdar)}</td>
          <td lang="ar" dir="rtl" class="table-ar">${esc(vf.activeParticiple)}</td>
          <td>${esc(vf.semantics)}<br><span class="arabic-inline" lang="ar" dir="rtl">${esc(vf.example.arabic)}</span> (${esc(vf.example.meaning)})</td>
        </tr>
      `
      )
      .join("");

    bodyHtml = `
      <section class="panel">
        <h2>Derived Verb-Form Explorer (Forms I–X)</h2>
        <p class="chapter-focus">Compare morphological patterns, verbal nouns (<em>maṣādir</em>), active participles, and semantic shifts across the ten triliteral stems.</p>
        <div class="table-wrap">
          <table class="grammar-table">
            <thead>
              <tr>
                <th>Form</th>
                <th>Perfect / Imperfect</th>
                <th>Maṣdar</th>
                <th>Active Participle</th>
                <th>Semantics &amp; Example</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
    `;
  } else if (activeTab === "conjugation") {
    const cards = data.conjugationDrills
      .map((drill) => {
        const picked = state.conjAnswers[drill.id];
        const checked = state.conjChecked[drill.id];
        const ok = picked === drill.answer;
        return `
          <article class="exercise-card">
            <div class="chapter-card-top">
              <span class="module-kicker">${esc(drill.verbClass)} · Root ${esc(drill.root)}</span>
              <span class="arabic-inline" lang="ar" dir="rtl">${esc(drill.lemma)} (${esc(drill.meaning)})</span>
            </div>
            <p><strong>${esc(drill.prompt)}</strong></p>
            <div class="choices-list">
              ${drill.choices
                .map(
                  (c) => `
                  <label class="choice-item">
                    <input type="radio" name="conj-${esc(drill.id)}" value="${esc(c)}" ${picked === c ? "checked" : ""} ${checked ? "disabled" : ""}>
                    <span lang="ar" dir="rtl" class="arabic-inline">${esc(c)}</span>
                  </label>
                `
                )
                .join("")}
            </div>
            <div class="reveal-controls">
              ${
                !checked
                  ? `<button type="button" class="btn btn-primary conj-check-btn" data-id="${esc(drill.id)}">Check</button>`
                  : `<button type="button" class="btn btn-secondary conj-retry-btn" data-id="${esc(drill.id)}">Try Again</button>`
              }
            </div>
            ${
              checked
                ? `<div class="feedback-box ${ok ? "feedback-correct" : "feedback-incorrect"}">
                     <p><strong>${ok ? "✓ Correct" : `✗ Incorrect — Expected: ${esc(drill.answer)}`}</strong></p>
                     <p>${esc(drill.explanation)}</p>
                   </div>`
                : ""
            }
          </article>
        `;
      })
      .join("");

    bodyHtml = `
      <section class="panel lesson-shell">
        <h2>Conjugation Practice (Regular &amp; Irregular Verbs)</h2>
        ${cards}
      </section>
    `;
  } else if (activeTab === "roots") {
    const q = (state.rootQuery || "").trim().toLowerCase();
    const items = data.rootPatterns.filter((r) => {
      if (!q) return true;
      return [r.word, r.root, r.pattern, r.category, r.note].join(" ").toLowerCase().includes(q);
    });

    bodyHtml = `
      <section class="panel">
        <h2>Root &amp; Pattern Explorer (Wazn)</h2>
        <div class="filter-bar">
          <input id="root-search" class="search-input" type="search" placeholder="Filter by word, root, or pattern…" value="${esc(state.rootQuery || "")}">
        </div>
        <div class="table-wrap">
          <table class="grammar-table">
            <thead>
              <tr><th>Word</th><th>Root</th><th>Pattern</th><th>Category</th><th>Morphological Note</th></tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (r) => `
                <tr>
                  <td lang="ar" dir="rtl" class="table-ar">${esc(r.word)}</td>
                  <td lang="ar" dir="rtl">${esc(r.root)}</td>
                  <td lang="ar" dir="rtl">${esc(r.pattern)}</td>
                  <td>${esc(r.category)}</td>
                  <td>${esc(r.note)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>
    `;
  } else if (activeTab === "irab") {
    const labs = data.irabLab
      .map((lab) => {
        const selectedIdx = state.irabSelected[lab.id];
        const selectedWord = Number.isInteger(selectedIdx) ? lab.words[selectedIdx] : null;
        return `
          <article class="panel">
            <span class="module-kicker">${esc(lab.sentenceType)}</span>
            <p class="arabic-example" lang="ar" dir="rtl">${esc(lab.sentence)}</p>
            <p class="chapter-focus">Translation: ${esc(lab.translation)}</p>
            <p><strong>Click a word to inspect its Iʿrāb:</strong></p>
            <div class="word-order-bank" lang="ar" dir="rtl">
              ${lab.words
                .map(
                  (w, i) =>
                    `<button type="button" class="token-chip ${selectedIdx === i ? "token-chosen" : ""} irab-word-btn" data-lab="${esc(lab.id)}" data-idx="${i}">${esc(w.word)}</button>`
                )
                .join("")}
            </div>
            ${
              selectedWord
                ? `
                <div class="rule-card" style="margin-top: 0.75rem;">
                  <p><strong lang="ar" dir="rtl" class="arabic-inline">${esc(selectedWord.word)}</strong></p>
                  <ul class="rules-list">
                    <li><strong>Syntactic Role:</strong> ${esc(selectedWord.role)}</li>
                    <li><strong>Case / Mood:</strong> ${esc(selectedWord.caseOrMood)}</li>
                    <li><strong>Governing Factor (ʿĀmil):</strong> ${esc(selectedWord.governor)}</li>
                  </ul>
                </div>
              `
                : ""
            }
          </article>
        `;
      })
      .join("");

    bodyHtml = `
      <section class="panel">
        <h2>Interactive Iʿrāb Lab</h2>
        <p class="chapter-focus">Select any word in a classical sentence to inspect its syntactic role, inflectional marker, and governing factor (<em>ʿāmil</em>).</p>
      </section>
      ${labs}
    `;
  } else if (activeTab === "reading") {
    const readings = data.classicalReadings
      .map(
        (rd) => `
        <article class="panel lesson-shell">
          <div class="chapter-card-top">
            <span class="module-kicker">${esc(rd.title)}</span>
            <span class="badge badge-${esc(rd.reviewStatus)}">review: ${esc(rd.reviewStatus)}</span>
          </div>
          <p class="chapter-focus">${esc(rd.source)}</p>
          <p class="arabic-example" lang="ar" dir="rtl">${esc(rd.arabic)}</p>
          <p><strong>Translation:</strong> ${esc(rd.translation)}</p>
          <h3>Word-by-Word Grammatical Analysis</h3>
          <ul class="rules-list">
            ${rd.tokens
              .map(
                (t) =>
                  `<li><span class="arabic-inline" lang="ar" dir="rtl">${esc(t.word)}</span> — ${esc(t.analysis)}</li>`
              )
              .join("")}
          </ul>
        </article>
      `
      )
      .join("");

    bodyHtml = `
      <div class="notice">
        Grammatical parsing is presented as linguistic analysis only and is distinct from tafsīr or theological commentary.
      </div>
      ${readings}
    `;
  }

  return `
    <section class="panel">
      <h1>Advanced Grammar Tools</h1>
      <p>Interactive morphology, conjugation, root extraction, <em>iʿrāb</em> parsing, and guided classical reading.</p>
      <div class="footer-actions">${tabs}</div>
    </section>
    ${bodyHtml}
  `;
}

export function bindToolsEvents(container, data, state, onUpdate) {
  container.querySelectorAll(".tool-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.tab = btn.dataset.tab;
      onUpdate();
    });
  });

  container.querySelectorAll('input[name^="conj-"]').forEach((input) => {
    input.addEventListener("change", (e) => {
      const id = e.target.name.replace(/^conj-/, "");
      state.conjAnswers[id] = e.target.value;
    });
  });

  container.querySelectorAll(".conj-check-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.conjChecked[btn.dataset.id] = true;
      onUpdate();
    });
  });

  container.querySelectorAll(".conj-retry-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      delete state.conjChecked[btn.dataset.id];
      delete state.conjAnswers[btn.dataset.id];
      onUpdate();
    });
  });

  const rootSearch = document.getElementById("root-search");
  if (rootSearch) {
    rootSearch.addEventListener("input", (e) => {
      state.rootQuery = e.target.value;
      onUpdate();
      const restored = document.getElementById("root-search");
      if (restored) {
        restored.focus();
        restored.setSelectionRange(restored.value.length, restored.value.length);
      }
    });
  }

  container.querySelectorAll(".irab-word-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.irabSelected[btn.dataset.lab] = Number(btn.dataset.idx);
      onUpdate();
    });
  });
}
