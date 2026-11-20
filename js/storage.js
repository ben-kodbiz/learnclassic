/**
 * Local progress, exercise attempt, and spaced-review persistence
 * using localStorage with graceful in-memory fallback.
 */

const STORAGE_KEY = "classical-arabic-grammar:v1";

export const STATUS_LABELS = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  "completed": "Completed",
  "needs-review": "Needs Review",
};

const INTERVAL_STEPS_DAYS = [1, 3, 7, 14, 30];

const DEFAULT_STATE = {
  version: 1,
  chapters: {},
  exerciseHistory: {},
  updatedAt: null,
};

let storageAvailable = true;
let memoryFallback = structuredClone(DEFAULT_STATE);

function normalizeState(parsed) {
  if (!parsed || typeof parsed !== "object") {
    return structuredClone(DEFAULT_STATE);
  }
  return {
    version: 1,
    chapters: parsed.chapters && typeof parsed.chapters === "object" ? parsed.chapters : {},
    exerciseHistory:
      parsed.exerciseHistory && typeof parsed.exerciseHistory === "object"
        ? parsed.exerciseHistory
        : {},
    updatedAt: parsed.updatedAt || null,
  };
}

function safeRead() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    return normalizeState(JSON.parse(raw));
  } catch {
    storageAvailable = false;
    return structuredClone(memoryFallback);
  }
}

function safeWrite(state) {
  state.updatedAt = new Date().toISOString();
  memoryFallback = structuredClone(state);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    storageAvailable = true;
    return true;
  } catch {
    storageAvailable = false;
    return false;
  }
}

export function isStorageAvailable() {
  try {
    const probe = "__storage_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  return storageAvailable;
}

export function getChapterStatus(chapterId) {
  const state = safeRead();
  const status = state.chapters[chapterId]?.status;
  return STATUS_LABELS[status] ? status : "not-started";
}

export function setChapterStatus(chapterId, status) {
  if (!STATUS_LABELS[status]) {
    throw new Error(`Invalid status: ${status}`);
  }
  const state = safeRead();
  if (status === "not-started") {
    delete state.chapters[chapterId];
  } else {
    state.chapters[chapterId] = {
      status,
      updatedAt: new Date().toISOString(),
    };
  }
  return safeWrite(state);
}

export function recordExerciseAttempt(exerciseId, lessonId, isCorrect, skillTags = []) {
  const state = safeRead();
  const now = new Date();
  const prev = state.exerciseHistory[exerciseId] || {
    lessonId,
    attempts: 0,
    correctCount: 0,
    streak: 0,
    lastCorrect: false,
    lastCheckedAt: null,
    nextReviewAt: null,
    intervalDays: 0,
    skillTags,
  };

  const streak = isCorrect ? prev.streak + 1 : 0;
  const intervalDays = isCorrect
    ? INTERVAL_STEPS_DAYS[Math.min(streak - 1, INTERVAL_STEPS_DAYS.length - 1)]
    : 0;
  const nextReview = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  state.exerciseHistory[exerciseId] = {
    lessonId,
    attempts: prev.attempts + 1,
    correctCount: prev.correctCount + (isCorrect ? 1 : 0),
    streak,
    lastCorrect: Boolean(isCorrect),
    lastCheckedAt: now.toISOString(),
    nextReviewAt: nextReview.toISOString(),
    intervalDays,
    skillTags: Array.isArray(skillTags) ? skillTags : prev.skillTags,
  };

  // Auto-mark lesson as in-progress if not yet started
  if (!state.chapters[lessonId]) {
    state.chapters[lessonId] = {
      status: "in-progress",
      updatedAt: now.toISOString(),
    };
  }

  return safeWrite(state);
}

export function getExerciseStats() {
  const state = safeRead();
  const entries = Object.entries(state.exerciseHistory);
  let totalAttempts = 0;
  let totalCorrect = 0;
  const missed = [];
  const dueReview = [];
  const weakTags = new Map();
  const nowIso = new Date().toISOString();

  for (const [id, rec] of entries) {
    totalAttempts += rec.attempts || 0;
    totalCorrect += rec.correctCount || 0;
    if (rec.lastCorrect === false) {
      missed.push({ id, ...rec });
      for (const tag of rec.skillTags || []) {
        weakTags.set(tag, (weakTags.get(tag) || 0) + 1);
      }
    }
    if (rec.nextReviewAt && rec.nextReviewAt <= nowIso) {
      dueReview.push({ id, ...rec });
    }
  }

  return {
    uniqueAttempted: entries.length,
    totalAttempts,
    totalCorrect,
    accuracyPct: totalAttempts ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
    missed,
    dueReview,
    weakTags: [...weakTags.entries()].sort((a, b) => b[1] - a[1]),
  };
}

export function getSummaryCounts(chapterIds) {
  const state = safeRead();
  const counts = {
    total: chapterIds.length,
    completed: 0,
    inProgress: 0,
    needsReview: 0,
    notStarted: 0,
  };

  for (const id of chapterIds) {
    const status = state.chapters[id]?.status || "not-started";
    if (status === "completed") counts.completed++;
    else if (status === "in-progress") counts.inProgress++;
    else if (status === "needs-review") counts.needsReview++;
    else counts.notStarted++;
  }
  return counts;
}

export function exportProgressJson() {
  return JSON.stringify(safeRead(), null, 2);
}

export function importProgressJson(rawJson) {
  const parsed = JSON.parse(rawJson);
  if (!parsed || typeof parsed !== "object" || typeof parsed.chapters !== "object") {
    throw new Error("Invalid progress file format.");
  }
  const clean = normalizeState(parsed);
  const validatedChapters = {};
  for (const [id, entry] of Object.entries(clean.chapters)) {
    if (entry && STATUS_LABELS[entry.status]) {
      validatedChapters[id] = {
        status: entry.status,
        updatedAt: entry.updatedAt || new Date().toISOString(),
      };
    }
  }
  clean.chapters = validatedChapters;
  return safeWrite(clean);
}

export function resetAllProgress() {
  return safeWrite(structuredClone(DEFAULT_STATE));
}
