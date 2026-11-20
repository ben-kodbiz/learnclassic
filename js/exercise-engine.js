/**
 * JSON-driven Exercise Engine (Phase 3).
 * Validates exercise data before rendering, supports multiple-choice,
 * true-false, fill-in-blank, matching, and word-ordering, with
 * immediate explanatory feedback and retry of incorrect answers.
 */

import { renderFeedbackHtml } from "./feedback.js";
import { recordExerciseAttempt } from "./storage.js";

const exerciseCache = new Map();
const ALLOWED_TYPES = new Set([
  "multiple-choice",
  "true-false",
  "fill-in-blank",
  "matching",
  "word-ordering",
]);

export function validateExerciseSet(data, expectedLessonId) {
  if (!data || typeof data !== "object") {
    throw new Error("Exercise payload must be a JSON object.");
  }
  if (data.lessonId !== expectedLessonId) {
    throw new Error(`Exercise lessonId '${data.lessonId}' does not match '${expectedLessonId}'.`);
  }
  if (!Array.isArray(data.exercises) || data.exercises.length === 0) {
    throw new Error(`No exercises found for lesson '${expectedLessonId}'.`);
  }

  for (const ex of data.exercises) {
    if (!ex.id || !ex.prompt || ex.answer === undefined || !ex.explanation) {
      throw new Error(`Exercise '${ex.id || "unknown"}' is missing required fields.`);
    }
    if (!ALLOWED_TYPES.has(ex.type)) {
      throw new Error(`Unsupported exercise type '${ex.type}' in '${ex.id}'.`);
    }
    if (
      (ex.type === "multiple-choice" || ex.type === "true-false" || ex.type === "fill-in-blank") &&
      (!Array.isArray(ex.choices) || ex.choices.length < 2)
    ) {
      throw new Error(`Exercise '${ex.id}' requires at least 2 choices.`);
    }
    if (ex.type === "matching" && (!Array.isArray(ex.pairs) || ex.pairs.length < 2)) {
      throw new Error(`Matching exercise '${ex.id}' requires at least 2 pairs.`);
    }
    if (ex.type === "word-ordering" && (!Array.isArray(ex.tokens) || !Array.isArray(ex.answer))) {
      throw new Error(`Word-ordering exercise '${ex.id}' requires tokens and answer arrays.`);
    }
  }
  return data;
}

export async function loadExercises(lessonId) {
  if (exerciseCache.has(lessonId)) {
    return exerciseCache.get(lessonId);
  }
  const res = await fetch(`./data/exercises/${encodeURIComponent(lessonId)}.json`, {
    cache: "no-cache",
  });
  if (res.status === 404) {
    exerciseCache.set(lessonId, null);
    return null;
  }
  if (!res.ok) {
    throw new Error(`Failed to load exercises for ${lessonId} (HTTP ${res.status})`);
  }
  const raw = await res.json();
  const validated = validateExerciseSet(raw, lessonId);
  exerciseCache.set(lessonId, validated);
  return validated;
}

function hasArabic(text) {
  return /[\u0600-\u06FF]/.test(String(text || ""));
}

function renderExerciseInput(ex, state, esc) {
  if (ex.type === "multiple-choice" || ex.type === "true-false" || ex.type === "fill-in-blank") {
    return `
      <div class="choices-list" role="radiogroup" aria-label="${esc(ex.prompt)}">
        ${ex.choices
          .map((choice, idx) => {
            const checked = state.answers[ex.id] === choice ? "checked" : "";
            const arAttr = hasArabic(choice) ? 'lang="ar" dir="rtl"' : "";
            return `
              <label class="choice-item">
                <input type="radio" name="q-${esc(ex.id)}" value="${esc(choice)}" ${checked} ${state.checked[ex.id] ? "disabled" : ""}>
                <span ${arAttr}>${esc(choice)}</span>
              </label>
            `;
          })
          .join("")}
      </div>
    `;
  }

  if (ex.type === "matching") {
    const rightOptions = ex.pairs.map((p) => p.right);
    const currentMap = state.answers[ex.id] || {};
    return `
      <div class="matching-grid">
        ${ex.pairs
          .map((pair, idx) => {
            const selected = currentMap[pair.left] || "";
            return `
              <div class="matching-row">
                <span class="matching-left" ${hasArabic(pair.left) ? 'lang="ar" dir="rtl"' : ""}>${esc(pair.left)}</span>
                <select
                  class="select-input matching-select"
                  data-ex-id="${esc(ex.id)}"
                  data-left="${esc(pair.left)}"
                  ${state.checked[ex.id] ? "disabled" : ""}
                >
                  <option value="">Select match…</option>
                  ${rightOptions
                    .map(
                      (opt) =>
                        `<option value="${esc(opt)}" ${selected === opt ? "selected" : ""}>${esc(opt)}</option>`
                    )
                    .join("")}
                </select>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  if (ex.type === "word-ordering") {
    const chosen = Array.isArray(state.answers[ex.id]) ? state.answers[ex.id] : [];
    const remaining = [...ex.tokens];
    for (const tok of chosen) {
      const idx = remaining.indexOf(tok);
      if (idx !== -1) remaining.splice(idx, 1);
    }

    return `
      <div class="word-order-wrap" data-ex-id="${esc(ex.id)}">
        <div class="word-order-zone" lang="ar" dir="rtl" aria-label="Constructed sentence">
          ${
            chosen.length
              ? chosen
                  .map(
                    (tok, i) =>
                      `<button type="button" class="token-chip token-chosen" data-action="remove-token" data-ex-id="${esc(ex.id)}" data-idx="${i}" ${state.checked[ex.id] ? "disabled" : ""}>${esc(tok)}</button>`
                  )
                  .join("")
              : `<span class="chapter-focus" dir="ltr">Click words below in order…</span>`
          }
        </div>
        <div class="word-order-bank" lang="ar" dir="rtl" aria-label="Word bank">
          ${remaining
            .map(
              (tok) =>
                `<button type="button" class="token-chip" data-action="add-token" data-ex-id="${esc(ex.id)}" data-token="${esc(tok)}" ${state.checked[ex.id] ? "disabled" : ""}>${esc(tok)}</button>`
            )
            .join("")}
        </div>
      </div>
    `;
  }

  return "";
}

function evaluateAnswer(ex, userAnswer) {
  if (ex.type === "multiple-choice" || ex.type === "true-false" || ex.type === "fill-in-blank") {
    return userAnswer === ex.answer;
  }
  if (ex.type === "matching") {
    if (!userAnswer || typeof userAnswer !== "object") return false;
    return Object.entries(ex.answer).every(([k, v]) => userAnswer[k] === v);
  }
  if (ex.type === "word-ordering") {
    if (!Array.isArray(userAnswer) || userAnswer.length !== ex.answer.length) return false;
    return ex.answer.every((tok, idx) => userAnswer[idx] === tok);
  }
  return false;
}

export function renderExerciseSection(exerciseSet, state, esc) {
  const visibleExercises = state.retryMissedOnly
    ? exerciseSet.exercises.filter((ex) => state.results[ex.id] === false)
    : exerciseSet.exercises;

  const totalCount = exerciseSet.exercises.length;
  const checkedCount = Object.keys(state.results).length;
  const correctCount = Object.values(state.results).filter(Boolean).length;
  const incorrectCount = Object.values(state.results).filter((v) => v === false).length;

  const cards = visibleExercises
    .map((ex, i) => {
      const isChecked = Boolean(state.checked[ex.id]);
      const isCorrect = state.results[ex.id];
      return `
        <article class="exercise-card" id="exercise-${esc(ex.id)}">
          <div class="chapter-card-top">
            <span class="module-kicker">Question ${i + 1} · ${esc(ex.type)}</span>
            <span class="badge badge-${esc(ex.reviewStatus || "pending")}">review: ${esc(ex.reviewStatus || "pending")}</span>
          </div>
          <p><strong>${esc(ex.prompt)}</strong></p>
          ${ex.arabic ? `<p class="arabic-example" lang="ar" dir="rtl">${esc(ex.arabic)}</p>` : ""}
          ${renderExerciseInput(ex, state, esc)}
          <div class="reveal-controls">
            ${
              !isChecked
                ? `<button type="button" class="btn btn-primary check-ex-btn" data-ex-id="${esc(ex.id)}">Check Answer</button>`
                : `<button type="button" class="btn btn-secondary retry-one-btn" data-ex-id="${esc(ex.id)}">Try Again</button>`
            }
          </div>
          ${isChecked ? renderFeedbackHtml(ex, Boolean(isCorrect), esc) : ""}
        </article>
      `;
    })
    .join("");

  return `
    <section class="panel lesson-shell" aria-label="Practice Exercises">
      <div class="chapter-card-top">
        <span class="module-kicker">Interactive Practice</span>
        <span class="chapter-num">${correctCount} / ${totalCount} correct (${checkedCount} checked)</span>
      </div>
      <h2>Exercises</h2>
      ${cards}
      <div class="footer-actions">
        ${
          incorrectCount > 0 && !state.retryMissedOnly
            ? `<button type="button" id="retry-missed-btn" class="btn btn-primary">Retry ${incorrectCount} Incorrect Question${incorrectCount > 1 ? "s" : ""}</button>`
            : ""
        }
        ${
          state.retryMissedOnly
            ? `<button type="button" id="show-all-ex-btn" class="btn btn-secondary">Show All Questions</button>`
            : ""
        }
        ${
          checkedCount > 0
            ? `<button type="button" id="reset-ex-btn" class="btn btn-secondary">Reset Exercises</button>`
            : ""
        }
      </div>
    </section>
  `;
}

export function bindExerciseEvents(container, exerciseSet, state, onUpdate) {
  container.querySelectorAll('input[type="radio"]').forEach((input) => {
    input.addEventListener("change", (e) => {
      const exId = e.target.name.replace(/^q-/, "");
      state.answers[exId] = e.target.value;
    });
  });

  container.querySelectorAll(".matching-select").forEach((sel) => {
    sel.addEventListener("change", (e) => {
      const { exId, left } = e.target.dataset;
      state.answers[exId] = state.answers[exId] || {};
      state.answers[exId][left] = e.target.value;
    });
  });

  container.querySelectorAll('[data-action="add-token"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const { exId, token } = btn.dataset;
      state.answers[exId] = Array.isArray(state.answers[exId]) ? state.answers[exId] : [];
      state.answers[exId].push(token);
      onUpdate();
    });
  });

  container.querySelectorAll('[data-action="remove-token"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const exId = btn.dataset.exId;
      const idx = Number(btn.dataset.idx);
      if (Array.isArray(state.answers[exId])) {
        state.answers[exId].splice(idx, 1);
      }
      onUpdate();
    });
  });

  container.querySelectorAll(".check-ex-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const exId = btn.dataset.exId;
      const ex = exerciseSet.exercises.find((item) => item.id === exId);
      if (!ex) return;
      const ok = evaluateAnswer(ex, state.answers[exId]);
      state.checked[exId] = true;
      state.results[exId] = ok;
      recordExerciseAttempt(ex.id, ex.lessonId, ok, ex.skillTags || []);
      onUpdate();
    });
  });

  container.querySelectorAll(".retry-one-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const exId = btn.dataset.exId;
      delete state.checked[exId];
      delete state.results[exId];
      delete state.answers[exId];
      onUpdate();
    });
  });

  document.getElementById("retry-missed-btn")?.addEventListener("click", () => {
    for (const [exId, ok] of Object.entries(state.results)) {
      if (!ok) {
        delete state.checked[exId];
        delete state.answers[exId];
      }
    }
    state.retryMissedOnly = true;
    onUpdate();
  });

  document.getElementById("show-all-ex-btn")?.addEventListener("click", () => {
    state.retryMissedOnly = false;
    onUpdate();
  });

  document.getElementById("reset-ex-btn")?.addEventListener("click", () => {
    state.answers = {};
    state.checked = {};
    state.results = {};
    state.retryMissedOnly = false;
    onUpdate();
  });
}
