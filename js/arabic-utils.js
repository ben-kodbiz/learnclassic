/**
 * Arabic orthography, normalization, and phonetic utilities.
 */

const TASHKEEL_REGEX = /[\u064B-\u065F\u0670]/g;
const TATWEEL_REGEX = /\u0640/g;

export function hasArabic(text) {
  return /[\u0600-\u06FF]/.test(String(text || ""));
}

export function stripTashkeel(text) {
  if (!text) return "";
  return String(text).replace(TASHKEEL_REGEX, "");
}

/**
 * Normalizes Arabic text for tolerant search and active-recall matching:
 * - Strips diacritics (tashkīl) and tatwīl (kashīdah).
 * - Normalizes alif with hamzah (أ, إ, آ, ٱ) to bare alif (ا).
 * - Normalizes alif maqṣūrah (ى) to yāʾ (ي).
 * - Optionally normalizes tāʾ marbūṭah (ة) to hāʾ (ه).
 */
export function normalizeArabic(text, { normalizeTaaMarbutah = true } = {}) {
  if (!text) return "";
  let s = String(text)
    .replace(TASHKEEL_REGEX, "")
    .replace(TATWEEL_REGEX, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .trim();

  if (normalizeTaaMarbutah) {
    s = s.replace(/ة/g, "ه");
  }
  return s;
}
