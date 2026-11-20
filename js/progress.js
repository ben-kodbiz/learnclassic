/**
 * Progress & Review Dashboard (#/progress).
 */

import { renderReviewQueue } from "./review.js";
import { getExerciseStats, getSummaryCounts } from "./storage.js";

export function renderProgressDashboard(curriculum, renderProgressBar, esc) {
  const allIds = curriculum.orderedChapters.map((c) => c.id);
  const overall = getSummaryCounts(allIds);
  const stats = getExerciseStats();

  const moduleRows = curriculum.modules
    .map((mod) => {
      const ids = mod.weeks.flatMap((w) => w.chapters.map((c) => c.id));
      const mc = getSummaryCounts(ids);
      const pct = mc.total ? Math.round((mc.completed / mc.total) * 100) : 0;
      return `
        <article class="module-card">
          <span class="module-kicker">Module ${mod.number} · Weeks ${mod.weekRange[0]}–${mod.weekRange[1]}</span>
          <h3>${esc(mod.title)}</h3>
          <p class="chapter-focus">${mc.completed} / ${mc.total} completed (${pct}%) · ${mc.inProgress} in progress · ${mc.needsReview} needs review</p>
          <p><a class="btn btn-secondary" href="#/module/${encodeURIComponent(mod.id)}">Open Module ${mod.number}</a></p>
        </article>
      `;
    })
    .join("");

  const weakTagPills = stats.weakTags.length
    ? stats.weakTags
        .map(([tag, count]) => `<span class="badge badge-needs-review">${esc(tag)} (${count})</span>`)
        .join(" ")
    : `<span class="chapter-focus">No difficult concepts recorded yet.</span>`;

  return `
    <section class="panel">
      <h1>Progress &amp; Revision Dashboard</h1>
      <p>Track lesson completion, exercise accuracy, missed questions, and your spaced-review queue. All data is stored locally in your browser.</p>
      ${renderProgressBar(overall)}
    </section>

    <section class="modules-grid" aria-label="Exercise summary">
      <article class="module-card">
        <span class="module-kicker">Exercise Attempts</span>
        <h2>${stats.totalAttempts}</h2>
        <p class="chapter-focus">${stats.uniqueAttempted} unique questions attempted</p>
      </article>
      <article class="module-card">
        <span class="module-kicker">Overall Accuracy</span>
        <h2>${stats.accuracyPct}%</h2>
        <p class="chapter-focus">${stats.totalCorrect} correct out of ${stats.totalAttempts} checks</p>
      </article>
      <article class="module-card">
        <span class="module-kicker">Concepts to Review</span>
        <div class="prereq-list">${weakTagPills}</div>
      </article>
    </section>

    <section aria-label="Module progress breakdown" class="modules-grid">
      ${moduleRows}
    </section>

    ${renderReviewQueue(stats, curriculum, esc)}
  `;
}
