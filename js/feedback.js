/**
 * Renders explanatory grammar feedback (Section 3.3 of AGENTODO.md).
 * Never relies on colour alone; always includes explicit status text,
 * rule, governing factor (ʿāmil), role, case/mood, and common error notes.
 */

export function renderFeedbackHtml(exercise, isCorrect, esc) {
  const fb = exercise.feedback || {};
  const statusLabel = isCorrect ? "✓ Correct" : "✗ Incorrect";
  const cls = isCorrect ? "feedback-box feedback-correct" : "feedback-box feedback-incorrect";

  const expectedText =
    typeof exercise.answer === "string"
      ? exercise.answer
      : Array.isArray(exercise.answer)
        ? exercise.answer.join(" ")
        : Object.entries(exercise.answer || {})
            .map(([k, v]) => `${k} → ${v}`)
            .join(" | ");

  return `
    <div class="${cls}" role="status">
      <p class="feedback-status"><strong>${statusLabel}</strong></p>
      <p>${esc(exercise.explanation)}</p>
      ${
        !isCorrect
          ? `<p><strong>Expected Answer:</strong> <span class="feedback-answer">${esc(expectedText)}</span></p>`
          : ""
      }
      <ul class="rules-list">
        ${fb.rule ? `<li><strong>Rule:</strong> ${esc(fb.rule)}</li>` : ""}
        ${fb.governor ? `<li><strong>Governing Factor (ʿāmil):</strong> ${esc(fb.governor)}</li>` : ""}
        ${fb.role ? `<li><strong>Grammatical Role:</strong> ${esc(fb.role)}</li>` : ""}
        ${fb.caseOrMood ? `<li><strong>Case / Mood:</strong> ${esc(fb.caseOrMood)}</li>` : ""}
        ${fb.commonError ? `<li><strong>Common Error:</strong> ${esc(fb.commonError)}</li>` : ""}
      </ul>
    </div>
  `;
}
