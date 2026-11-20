/**
 * Renders the Missed-Question Review Queue and Spaced-Review Schedule
 * inside the Progress & Review dashboard (#/progress).
 */

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function renderReviewQueue(stats, curriculum, esc) {
  const missedHtml = stats.missed.length
    ? stats.missed
        .map((item) => {
          const ch = curriculum.chaptersById.get(item.lessonId);
          const title = ch ? ch.title : item.lessonId;
          return `
            <li class="review-item">
              <div>
                <strong>${esc(title)}</strong>
                <span class="chapter-focus"> · Question <code>${esc(item.id)}</code> · Attempts: ${item.attempts}</span>
              </div>
              <a class="btn btn-secondary" href="#/chapter/${encodeURIComponent(item.lessonId)}">Practice Again →</a>
            </li>
          `;
        })
        .join("")
    : `<p class="chapter-focus">No missed questions right now. Great work!</p>`;

  const dueHtml = stats.dueReview.length
    ? stats.dueReview
        .map((item) => {
          const ch = curriculum.chaptersById.get(item.lessonId);
          const title = ch ? ch.title : item.lessonId;
          const badge = item.lastCorrect
            ? `<span class="badge badge-in-progress">Due (interval: ${item.intervalDays}d)</span>`
            : `<span class="badge badge-needs-review">Due Now</span>`;
          return `
            <li class="review-item">
              <div>
                ${badge}
                <strong>${esc(title)}</strong>
                <span class="chapter-focus"> · Last checked: ${esc(formatDate(item.lastCheckedAt))}</span>
              </div>
              <a class="btn btn-primary" href="#/chapter/${encodeURIComponent(item.lessonId)}">Review →</a>
            </li>
          `;
        })
        .join("")
    : `<p class="chapter-focus">No spaced-review items due right now. Complete exercises in lessons to build your schedule.</p>`;

  return `
    <section class="panel" aria-labelledby="missed-queue-heading">
      <h2 id="missed-queue-heading">Missed-Question Review Queue (${stats.missed.length})</h2>
      <p class="chapter-focus">Questions answered incorrectly on your most recent attempt appear here until you answer them correctly.</p>
      <ul class="review-list">${missedHtml}</ul>
    </section>

    <section class="panel" aria-labelledby="spaced-review-heading">
      <h2 id="spaced-review-heading">Spaced-Review Schedule (${stats.dueReview.length} due)</h2>
      <p class="chapter-focus">Correctly answered items step through 1 → 3 → 7 → 14 → 30 day review intervals; missed items become due immediately.</p>
      <ul class="review-list">${dueHtml}</ul>
    </section>
  `;
}
