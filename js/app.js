import { hasArabic, normalizeArabic } from "./arabic-utils.js";
import { loadCurriculum } from "./curriculum.js";
import {
  bindExerciseEvents,
  loadExercises,
  renderExerciseSection,
} from "./exercise-engine.js";
import { loadGlossary, renderGlossaryView } from "./glossary.js";
import { bindLessonRevealEvents, loadLesson, renderLessonBody } from "./lesson-renderer.js";
import { renderProgressDashboard } from "./progress.js";
import { startRouter } from "./router.js";
import { bindToolsEvents, loadToolsData, renderToolsView } from "./tools.js";
import {
  STATUS_LABELS,
  exportProgressJson,
  getChapterStatus,
  getSummaryCounts,
  importProgressJson,
  isStorageAvailable,
  resetAllProgress,
  setChapterStatus,
} from "./storage.js";

let curriculum = null;
let glossary = null;
let toolsData = null;
let currentRoute = { view: "home" };
let searchQuery = "";
let glossaryQuery = "";
let statusFilter = "all";
const exerciseStates = new Map();
const toolsState = {
  tab: "forms",
  conjAnswers: {},
  conjChecked: {},
  rootQuery: "",
  irabSelected: {},
};

function getExerciseState(lessonId) {
  if (!exerciseStates.has(lessonId)) {
    exerciseStates.set(lessonId, {
      answers: {},
      checked: {},
      results: {},
      retryMissedOnly: false,
    });
  }
  return exerciseStates.get(lessonId);
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function chapterLabel(ch) {
  if (ch.chapter === "supplement") return "Literary Supplement";
  if (ch.chapter === "consolidation-1") return "Module 1 Consolidation";
  return `Chapter ${ch.chapter}`;
}

function hasFullLesson(chapterId) {
  return (curriculum?.availableLessons || []).includes(chapterId);
}

function statusBadgeHtml(status) {
  const label = STATUS_LABELS[status] || STATUS_LABELS["not-started"];
  return `<span class="badge badge-${esc(status)}">${esc(label)}</span>`;
}

function storageNoticeHtml() {
  if (isStorageAvailable()) return "";
  return `
    <div class="notice" role="status">
      Browser localStorage is unavailable or blocked. Progress will be kept for this session only; use Export Progress to save a backup.
    </div>
  `;
}

function renderProgressBar(counts) {
  const pct = counts.total ? Math.round((counts.completed / counts.total) * 100) : 0;
  return `
    <div class="progress-bar-wrap">
      <div class="progress-label">
        <span>Overall Curriculum Progress</span>
        <span>${counts.completed} / ${counts.total} units completed (${pct}%)</span>
      </div>
      <div class="progress-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
        <div class="progress-fill" style="width: ${pct}%"></div>
      </div>
      <div class="meta-row">
        <span>In progress: ${counts.inProgress}</span>
        <span>Needs review: ${counts.needsReview}</span>
        <span>Not started: ${counts.notStarted}</span>
      </div>
    </div>
  `;
}

function renderChapterCard(ch) {
  const status = getChapterStatus(ch.id);
  const href = `#/chapter/${encodeURIComponent(ch.id)}`;
  const lessonBadge = hasFullLesson(ch.id)
    ? `<span class="badge badge-lesson">Interactive Lesson</span>`
    : "";
  return `
    <article class="chapter-card">
      <div class="chapter-card-top">
        <span class="chapter-num">${esc(chapterLabel(ch))}</span>
        <div class="prereq-list">${lessonBadge}${statusBadgeHtml(status)}</div>
      </div>
      <h4 class="chapter-title">
        <a href="${href}">${esc(ch.title)}</a>
      </h4>
      <p class="arabic-inline" lang="ar" dir="rtl">${esc(ch.titleArabic)}</p>
      <p class="chapter-focus">${esc(ch.classicalFocus)}</p>
      <p class="chapter-focus"><strong>Ref:</strong> ${esc(ch.rydingReference)}</p>
      <div class="meta-row">
        <span>~${esc(ch.estimatedMinutes)} min</span>
        <a href="${href}">${hasFullLesson(ch.id) ? "Open lesson →" : "Open syllabus →"}</a>
      </div>
    </article>
  `;
}

function renderWeeksList(weeks) {
  const rawQ = searchQuery.trim();
  const qLower = rawQ.toLowerCase();
  const qNormAr = normalizeArabic(rawQ);
  const blocks = [];

  for (const wk of weeks) {
    const filtered = wk.chapters.filter((ch) => {
      const status = getChapterStatus(ch.id);
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!rawQ) return true;

      const haystackEn = [
        chapterLabel(ch),
        ch.title,
        ch.textbookTitle,
        ch.rydingReference,
        ch.classicalFocus,
        ...(ch.coreRules || []),
      ]
        .join(" ")
        .toLowerCase();

      if (haystackEn.includes(qLower)) return true;

      const haystackAr = [ch.titleArabic, ...(ch.coreRules || [])].join(" ");
      if (normalizeArabic(haystackAr).includes(qNormAr)) return true;

      return false;
    });

    if (filtered.length === 0) continue;

    blocks.push(`
      <section class="week-section" aria-labelledby="week-${wk.week}-heading">
        <div class="week-header">
          <h3 id="week-${wk.week}-heading">Week ${wk.week}: ${esc(wk.title)}</h3>
          <span class="chapter-num">${filtered.length} ${filtered.length === 1 ? "unit" : "units"}</span>
        </div>
        <div class="chapters-list">
          ${filtered.map(renderChapterCard).join("")}
        </div>
      </section>
    `);
  }

  if (blocks.length === 0) {
    return `<section class="panel"><p>No chapters match the current filter.</p></section>`;
  }
  return blocks.join("");
}

function renderHome() {
  const allIds = curriculum.orderedChapters.map((c) => c.id);
  const counts = getSummaryCounts(allIds);

  const moduleCards = curriculum.modules
    .map((mod) => {
      const modIds = mod.weeks.flatMap((w) => w.chapters.map((c) => c.id));
      const mc = getSummaryCounts(modIds);
      return `
        <article class="module-card">
          <span class="module-kicker">Module ${mod.number} · Weeks ${mod.weekRange[0]}–${mod.weekRange[1]}</span>
          <h2>${esc(mod.title)}</h2>
          <p class="arabic-inline" lang="ar" dir="rtl">${esc(mod.titleArabic)}</p>
          <p class="chapter-focus">${esc(mod.summary)}</p>
          <div class="meta-row">
            <span>${esc(mod.chapterRange)}</span>
            <span>${mc.completed}/${mc.total} completed</span>
          </div>
          <p><a class="btn btn-primary" href="#/module/${encodeURIComponent(mod.id)}">Explore Module ${mod.number}</a></p>
        </article>
      `;
    })
    .join("");

  const allWeeks = curriculum.modules.flatMap((m) => m.weeks);
  const irabSteps = (curriculum.scope?.irabRoutine || [])
    .map((step) => `<li>${esc(step)}</li>`)
    .join("");

  const sampleLinks = (curriculum.availableLessons || [])
    .map((lid) => {
      const ch = curriculum.chaptersById.get(lid);
      return ch
        ? `<a class="btn btn-secondary" href="#/chapter/${encodeURIComponent(lid)}">M${ch.moduleNumber} · ${esc(chapterLabel(ch))}: ${esc(ch.title)}</a>`
        : "";
    })
    .join("");

  return `
    ${storageNoticeHtml()}
    <section class="panel hero-panel">
      <h1>${esc(curriculum.title)}</h1>
      <p>${esc(curriculum.subtitle)}</p>
      <p>${esc(curriculum.scope.focus)}</p>
      <div class="meta-row">
        <span><strong>Dual-Source Syllabus:</strong> Haywood &amp; Nahmad (1965) + Karin C. Ryding (2005)</span>
        <span><strong>3 Modules · 26 Weeks · ${counts.total} Units</strong></span>
      </div>
      ${renderProgressBar(counts)}
      ${
        sampleLinks
          ? `<div class="lesson-block" style="margin-top: 1rem;"><strong>Available Interactive Lessons:</strong><div class="prereq-list" style="margin-top: 0.4rem;">${sampleLinks}</div></div>`
          : ""
      }
    </section>

    <section class="panel" aria-labelledby="irab-routine-heading">
      <h2 id="irab-routine-heading">Daily 3-Step Textual Iʿrāb Routine</h2>
      <ol class="rules-list">${irabSteps}</ol>
    </section>

    <section aria-label="Modules overview" class="modules-grid">
      ${moduleCards}
    </section>

    <section aria-label="Full curriculum map">
      <div class="filter-bar">
        <label class="skip-link" for="curriculum-search">Search chapters</label>
        <input
          id="curriculum-search"
          class="search-input"
          type="search"
          placeholder="Search topics, Ryding refs, Arabic terms, or chapters…"
          value="${esc(searchQuery)}"
        >
        <label class="skip-link" for="status-filter">Filter by status</label>
        <select id="status-filter" class="select-input">
          <option value="all" ${statusFilter === "all" ? "selected" : ""}>All statuses</option>
          <option value="not-started" ${statusFilter === "not-started" ? "selected" : ""}>Not Started</option>
          <option value="in-progress" ${statusFilter === "in-progress" ? "selected" : ""}>In Progress</option>
          <option value="completed" ${statusFilter === "completed" ? "selected" : ""}>Completed</option>
          <option value="needs-review" ${statusFilter === "needs-review" ? "selected" : ""}>Needs Review</option>
        </select>
      </div>
      ${renderWeeksList(allWeeks)}
    </section>
  `;
}

function renderModule(moduleId) {
  const mod = curriculum.modules.find((m) => m.id === moduleId);
  if (!mod) return renderNotFound();

  const modIds = mod.weeks.flatMap((w) => w.chapters.map((c) => c.id));
  const counts = getSummaryCounts(modIds);

  return `
    ${storageNoticeHtml()}
    <p><a href="#/" class="btn btn-secondary">← All Modules</a></p>
    <section class="panel">
      <span class="module-kicker">Module ${mod.number} · Weeks ${mod.weekRange[0]}–${mod.weekRange[1]}</span>
      <h1>${esc(mod.title)}</h1>
      <p class="arabic-heading" lang="ar" dir="rtl">${esc(mod.titleArabic)}</p>
      <p>${esc(mod.summary)}</p>
      <p><strong>Module checkpoint:</strong> ${esc(mod.checkpoint)}</p>
      ${renderProgressBar(counts)}
    </section>
    ${renderWeeksList(mod.weeks)}
  `;
}

function renderChapter(chapterId, lessonData, exerciseData) {
  const ch = curriculum.chaptersById.get(chapterId);
  if (!ch) return renderNotFound();

  const status = getChapterStatus(ch.id);
  const idx = curriculum.orderedChapters.findIndex((c) => c.id === ch.id);
  const prev = idx > 0 ? curriculum.orderedChapters[idx - 1] : null;
  const next = idx < curriculum.orderedChapters.length - 1 ? curriculum.orderedChapters[idx + 1] : null;

  const unmetPrereqs = (ch.prerequisites || []).filter(
    (pid) => getChapterStatus(pid) !== "completed"
  );

  const prereqWarning = unmetPrereqs.length
    ? `
      <div class="notice" role="status">
        <strong>Recommended prerequisite${unmetPrereqs.length > 1 ? "s" : ""}:</strong>
        You can study out of order, but completing
        ${unmetPrereqs
          .map((pid) => {
            const pch = curriculum.chaptersById.get(pid);
            return pch
              ? `<a href="#/chapter/${encodeURIComponent(pid)}">${esc(chapterLabel(pch))}: ${esc(pch.title)}</a>`
              : esc(pid);
          })
          .join(", ")}
        first is recommended.
      </div>
    `
    : "";

  const prereqLinks = (ch.prerequisites || []).length
    ? ch.prerequisites
        .map((pid) => {
          const pch = curriculum.chaptersById.get(pid);
          return pch
            ? `<a class="btn btn-secondary" href="#/chapter/${encodeURIComponent(pid)}">${esc(chapterLabel(pch))}</a>`
            : "";
        })
        .join("")
    : `<span class="chapter-focus">None (entry unit)</span>`;

  const lessonSection = lessonData
    ? renderLessonBody(lessonData, glossary, esc)
    : `
      <div class="notice">
        Full interactive lesson content for this unit is scheduled for Phase 5. Use the syllabus summary and reference chapters above while studying.
      </div>
    `;

  return `
    ${storageNoticeHtml()}
    <p>
      <a href="#/module/${encodeURIComponent(ch.moduleId)}" class="btn btn-secondary">← Module ${ch.moduleNumber}</a>
      <a href="#/" class="btn btn-secondary">Curriculum Map</a>
    </p>
    ${prereqWarning}
    <article class="panel detail-grid">
      <div class="chapter-card-top">
        <span class="module-kicker">Module ${ch.moduleNumber} · Week ${ch.week} · ${esc(chapterLabel(ch))}</span>
        ${statusBadgeHtml(status)}
      </div>
      <h1>${esc(ch.title)}</h1>
      <p class="arabic-heading" lang="ar" dir="rtl">${esc(ch.titleArabic)}</p>
      <div class="chapter-focus">
        <div><strong>Primary Curriculum (Haywood &amp; Nahmad):</strong> <em>${esc(ch.textbookTitle)}</em></div>
        <div><strong>Theoretical Reference (Karin C. Ryding):</strong> ${esc(ch.rydingReference)}</div>
      </div>

      <div>
        <h2>Grammatical Focus (Naḥw &amp; Ṣarf)</h2>
        <p>${esc(ch.classicalFocus)}</p>
      </div>

      <div>
        <h2>Core Rules</h2>
        <ul class="rules-list">
          ${(ch.coreRules || []).map((r) => `<li>${esc(r)}</li>`).join("")}
        </ul>
      </div>

      <div>
        <h2>Practice &amp; Classical Application</h2>
        <p>${esc(ch.practiceFocus)}</p>
      </div>

      <div>
        <h2>Prerequisites</h2>
        <div class="prereq-list">${prereqLinks}</div>
      </div>

      <div class="meta-row">
        <span>Estimated time: ~${esc(ch.estimatedMinutes)} min</span>
        <span>Content review status: <strong>${esc(ch.reviewStatus)}</strong></span>
      </div>

      <div>
        <label for="chapter-status-select"><strong>Your Study Status:</strong></label>
        <select id="chapter-status-select" class="select-input" data-chapter-id="${esc(ch.id)}">
          ${Object.entries(STATUS_LABELS)
            .map(
              ([val, label]) =>
                `<option value="${esc(val)}" ${status === val ? "selected" : ""}>${esc(label)}</option>`
            )
            .join("")}
        </select>
      </div>
    </article>

    ${lessonSection}
    ${exerciseData ? renderExerciseSection(exerciseData, getExerciseState(chapterId), esc) : ""}

    <div class="panel footer-inner">
      <div>
        ${
          prev
            ? `<a class="btn btn-secondary" href="#/chapter/${encodeURIComponent(prev.id)}">← ${esc(chapterLabel(prev))}</a>`
            : ""
        }
      </div>
      <div>
        ${
          next
            ? `<a class="btn btn-primary" href="#/chapter/${encodeURIComponent(next.id)}">${esc(chapterLabel(next))} →</a>`
            : ""
        }
      </div>
    </div>
  `;
}

function renderNotFound() {
  return `
    <section class="panel">
      <h1>View Not Found</h1>
      <p>The requested module, chapter, or page does not exist.</p>
      <p><a href="#/" class="btn btn-primary">Return to Curriculum Map</a></p>
    </section>
  `;
}

function updateNavHighlight(route) {
  const activeKey =
    route.view === "home"
      ? "home"
      : route.view === "glossary"
        ? "glossary"
        : route.view === "progress"
          ? "progress"
          : route.view === "tools"
            ? "tools"
            : route.view === "module"
          ? route.moduleId
          : route.view === "chapter"
            ? curriculum.chaptersById.get(route.chapterId)?.moduleId || ""
            : "";

  document.querySelectorAll(".nav-link").forEach((el) => {
    el.classList.toggle("is-active", el.dataset.nav === activeKey);
  });
}

async function render() {
  const root = document.getElementById("app-root");
  if (!curriculum) return;

  updateNavHighlight(currentRoute);

  if (currentRoute.view === "home") {
    root.innerHTML = renderHome();
  } else if (currentRoute.view === "glossary") {
    root.innerHTML = renderGlossaryView(glossary, curriculum, glossaryQuery, esc);
  } else if (currentRoute.view === "progress") {
    root.innerHTML = renderProgressDashboard(curriculum, renderProgressBar, esc);
  } else if (currentRoute.view === "tools") {
    root.innerHTML = renderToolsView(toolsData, toolsState, esc);
    bindToolsEvents(root, toolsData, toolsState, render);
  } else if (currentRoute.view === "module") {
    root.innerHTML = renderModule(currentRoute.moduleId);
  } else if (currentRoute.view === "chapter") {
    let lessonData = null;
    let exerciseData = null;
    try {
      [lessonData, exerciseData] = await Promise.all([
        loadLesson(currentRoute.chapterId),
        loadExercises(currentRoute.chapterId),
      ]);
    } catch (err) {
      root.innerHTML = `<section class="panel"><h1>Lesson Load Error</h1><p>${esc(err.message)}</p></section>`;
      return;
    }
    root.innerHTML = renderChapter(currentRoute.chapterId, lessonData, exerciseData);
    bindLessonRevealEvents(root);
    if (exerciseData) {
      bindExerciseEvents(root, exerciseData, getExerciseState(currentRoute.chapterId), render);
    }
  } else {
    root.innerHTML = renderNotFound();
  }

  bindViewEvents();
}

function bindViewEvents() {
  const searchEl = document.getElementById("curriculum-search");
  if (searchEl) {
    searchEl.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      render();
      const restored = document.getElementById("curriculum-search");
      if (restored) {
        restored.focus();
        restored.setSelectionRange(restored.value.length, restored.value.length);
      }
    });
  }

  const glossarySearchEl = document.getElementById("glossary-search");
  if (glossarySearchEl) {
    glossarySearchEl.addEventListener("input", (e) => {
      glossaryQuery = e.target.value;
      render();
      const restored = document.getElementById("glossary-search");
      if (restored) {
        restored.focus();
        restored.setSelectionRange(restored.value.length, restored.value.length);
      }
    });
  }

  const filterEl = document.getElementById("status-filter");
  if (filterEl) {
    filterEl.addEventListener("change", (e) => {
      statusFilter = e.target.value;
      render();
    });
  }

  const statusSelect = document.getElementById("chapter-status-select");
  if (statusSelect) {
    statusSelect.addEventListener("change", (e) => {
      setChapterStatus(e.target.dataset.chapterId, e.target.value);
      render();
    });
  }
}

function bindFooterActions() {
  document.getElementById("export-progress-btn")?.addEventListener("click", () => {
    const blob = new Blob([exportProgressJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "arabic-grammar-progress.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("import-progress-input")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("File is not valid JSON.");
      }
      if (!parsed || typeof parsed !== "object" || !parsed.chapters) {
        throw new Error("File does not contain valid LearnClassic progress data.");
      }
      const count = Object.keys(parsed.chapters || {}).length;
      const ok = window.confirm(
        `Import progress file containing ${count} chapter record(s)? This will replace your current study progress.`
      );
      if (!ok) return;

      importProgressJson(text);
      render();
      alert("Progress imported successfully.");
    } catch (err) {
      alert(`Could not import progress: ${err.message}`);
    } finally {
      e.target.value = "";
    }
  });

  document.getElementById("reset-progress-btn")?.addEventListener("click", () => {
    if (window.confirm("Reset all saved chapter progress? This cannot be undone.")) {
      resetAllProgress();
      render();
    }
  });
}

async function init() {
  const root = document.getElementById("app-root");
  bindFooterActions();

  try {
    [curriculum, glossary, toolsData] = await Promise.all([
      loadCurriculum(),
      loadGlossary(),
      loadToolsData(),
    ]);
    startRouter((route) => {
      currentRoute = route;
      render();
    });
  } catch (err) {
    root.innerHTML = `
      <section class="panel">
        <h1>Unable to Load Curriculum</h1>
        <p>${esc(err.message)}</p>
        <p>If opening directly via <code>file://</code>, start a local static server (e.g. <code>python3 -m http.server</code>).</p>
      </section>
    `;
  }
}

init();
