/**
 * JSON-driven Lesson Renderer (Phase 2).
 * Supports explanation, rule, example (with progressive reveal),
 * table, and callout sections, plus glossary term links.
 */

const lessonCache = new Map();

export async function loadLesson(lessonId) {
  if (lessonCache.has(lessonId)) {
    return lessonCache.get(lessonId);
  }
  const res = await fetch(`./data/lessons/${encodeURIComponent(lessonId)}.json`, {
    cache: "no-cache",
  });
  if (res.status === 404) {
    lessonCache.set(lessonId, null);
    return null;
  }
  if (!res.ok) {
    throw new Error(`Failed to load lesson ${lessonId} (HTTP ${res.status})`);
  }
  const data = await res.json();
  lessonCache.set(lessonId, data);
  return data;
}

function renderSection(sec, idx, esc) {
  if (sec.type === "explanation") {
    return `
      <section class="lesson-block">
        <h3>${esc(sec.heading)}</h3>
        <p>${esc(sec.body)}</p>
      </section>
    `;
  }

  if (sec.type === "rule") {
    return `
      <section class="rule-card">
        <div class="chapter-card-top">
          <span class="module-kicker">${esc(sec.label)}</span>
          ${sec.arabicTerm ? `<span class="arabic-inline" lang="ar" dir="rtl">${esc(sec.arabicTerm)}</span>` : ""}
        </div>
        <p>${esc(sec.summary)}</p>
      </section>
    `;
  }

  if (sec.type === "table") {
    const headers = (sec.headers || []).map((h) => `<th scope="col">${esc(h)}</th>`).join("");
    const rows = (sec.rows || [])
      .map(
        (row) =>
          `<tr>${row
            .map((cell) => {
              const hasAr = /[\u0600-\u06FF]/.test(String(cell));
              return hasAr
                ? `<td lang="ar" dir="rtl" class="table-ar">${esc(cell)}</td>`
                : `<td>${esc(cell)}</td>`;
            })
            .join("")}</tr>`
      )
      .join("");
    return `
      <section class="lesson-block">
        ${sec.heading ? `<h3>${esc(sec.heading)}</h3>` : ""}
        <div class="table-wrap">
          <table class="grammar-table">
            <thead><tr>${headers}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
    `;
  }

  if (sec.type === "example") {
    const exId = `ex-reveal-${idx}`;
    return `
      <section class="example-card" data-example-id="${exId}">
        <div class="chapter-card-top">
          <span class="module-kicker">Arabic Model</span>
          <span class="badge badge-${esc(sec.reviewStatus || "pending")}">review: ${esc(sec.reviewStatus || "pending")}</span>
        </div>
        <p class="arabic-example" lang="ar" dir="rtl">${esc(sec.arabic)}</p>
        <div class="reveal-controls">
          ${
            sec.transliteration
              ? `<button type="button" class="btn btn-secondary reveal-btn" data-target="${exId}-translit" aria-expanded="false">Reveal Transliteration</button>`
              : ""
          }
          <button type="button" class="btn btn-secondary reveal-btn" data-target="${exId}-irab" aria-expanded="false">Reveal Iʿrāb &amp; Notes</button>
          <button type="button" class="btn btn-secondary reveal-btn" data-target="${exId}-trans" aria-expanded="false">Reveal Translation</button>
        </div>
        ${
          sec.transliteration
            ? `<div id="${exId}-translit" class="reveal-panel" hidden><p><strong>Transliteration:</strong> <em>${esc(sec.transliteration)}</em></p></div>`
            : ""
        }
        <div id="${exId}-irab" class="reveal-panel" hidden>
          ${sec.irab ? `<p class="arabic-inline" lang="ar" dir="rtl">${esc(sec.irab)}</p>` : ""}
          ${sec.notes ? `<p>${esc(sec.notes)}</p>` : ""}
        </div>
        <div id="${exId}-trans" class="reveal-panel" hidden>
          <p><strong>Translation:</strong> ${esc(sec.translation)}</p>
        </div>
      </section>
    `;
  }

  if (sec.type === "callout") {
    const cls = sec.variant === "warning" ? "callout callout-warning" : "callout";
    return `
      <aside class="${cls}">
        <h4>${esc(sec.heading)}</h4>
        <p>${esc(sec.body)}</p>
      </aside>
    `;
  }

  return "";
}

export function renderLessonBody(lesson, glossary, esc) {
  const objectives = (lesson.objectives || []).map((o) => `<li>${esc(o)}</li>`).join("");
  const glossaryLinks = (lesson.glossaryTerms || [])
    .map((tid) => {
      const term = glossary?.terms?.find((t) => t.id === tid);
      if (!term) return "";
      return `<a class="btn btn-secondary" href="#/glossary">${esc(term.term)} (<span lang="ar" dir="rtl">${esc(term.termArabic)}</span>)</a>`;
    })
    .join("");

  return `
    <section class="panel lesson-shell" aria-label="Interactive lesson">
      <div class="chapter-card-top">
        <span class="module-kicker">Interactive Lesson</span>
        <span class="badge badge-${esc(lesson.reviewStatus || "pending")}">review: ${esc(lesson.reviewStatus || "pending")}</span>
      </div>

      <div class="lesson-block">
        <h2>Learning Objectives</h2>
        <ul class="rules-list">${objectives}</ul>
      </div>

      ${
        lesson.recallPrompt
          ? `
        <div class="callout">
          <h3>Recall Prompt</h3>
          <p>${esc(lesson.recallPrompt)}</p>
        </div>
      `
          : ""
      }

      ${(lesson.sections || []).map((s, i) => renderSection(s, i, esc)).join("")}

      ${
        glossaryLinks
          ? `
        <div class="lesson-block">
          <h3>Linked Glossary Terms</h3>
          <div class="prereq-list">${glossaryLinks}</div>
        </div>
      `
          : ""
      }

      <p class="chapter-focus"><em>${esc(lesson.source)}</em></p>
    </section>
  `;
}

export function bindLessonRevealEvents(container) {
  container.querySelectorAll(".reveal-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target) return;
      const isHidden = target.hasAttribute("hidden");
      if (isHidden) {
        target.removeAttribute("hidden");
        btn.setAttribute("aria-expanded", "true");
        btn.textContent = btn.textContent.replace("Reveal ", "Hide ");
      } else {
        target.setAttribute("hidden", "");
        btn.setAttribute("aria-expanded", "false");
        btn.textContent = btn.textContent.replace("Hide ", "Reveal ");
      }
    });
  });
}
