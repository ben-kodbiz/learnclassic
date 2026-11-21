#!/usr/bin/env node
/**
 * Tests for Arabic normalization, diacritics stripping, and active-recall matching.
 */

import { hasArabic, normalizeArabic, stripTashkeel } from "../js/arabic-utils.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Test failed: ${message}`);
  }
}

function runTests() {
  // Test hasArabic
  assert(hasArabic("كِتَابٌ"), "Expected hasArabic('كِتَابٌ') to be true");
  assert(!hasArabic("al-kitab"), "Expected hasArabic('al-kitab') to be false");
  assert(hasArabic("Word: شَمْس"), "Expected mixed text to detect Arabic");

  // Test stripTashkeel
  assert(stripTashkeel("الشَّمْسُ") === "الشمس", `Expected 'الشمس', got '${stripTashkeel("الشَّمْسُ")}'`);
  assert(stripTashkeel("عِلْمٌ") === "علم", `Expected 'علم', got '${stripTashkeel("عِلْمٌ")}'`);
  assert(stripTashkeel("بِاسْمِ اللَّهِ") === "باسم الله", `Expected 'باسم الله', got '${stripTashkeel("بِاسْمِ اللَّهِ")}'`);

  // Test normalizeArabic
  assert(normalizeArabic("إِعْرَابٌ") === "اعراب", `Expected 'اعراب', got '${normalizeArabic("إِعْرَابٌ")}'`);
  assert(normalizeArabic("مُبْتَدَأٌ") === "مبتدا", `Expected 'مبتدا', got '${normalizeArabic("مُبْتَدَأٌ")}'`);
  assert(normalizeArabic("الشَّمْسُ") === "الشمس", `Expected 'الشمس', got '${normalizeArabic("الشَّمْسُ")}'`);
  assert(normalizeArabic("ٱلْقَمَرُ") === "القمر", `Expected 'القمر', got '${normalizeArabic("ٱلْقَمَرُ")}'`);
  assert(normalizeArabic("صَلَاةٌ") === "صلاه", `Expected 'صلاه', got '${normalizeArabic("صَلَاةٌ")}'`);
  assert(normalizeArabic("عَلَى") === "علي", `Expected 'علي', got '${normalizeArabic("عَلَى")}'`);

  // Cross-matching: user types without diacritics, matches vowelled target
  const target = "العِلْمُ نُورٌ";
  const user1 = "العلم نور";
  const user2 = "العِلْمُ نُورٌ";
  const user3 = "العلمُ نور";
  assert(normalizeArabic(user1) === normalizeArabic(target), "user1 should match target");
  assert(normalizeArabic(user2) === normalizeArabic(target), "user2 should match target");
  assert(normalizeArabic(user3) === normalizeArabic(target), "user3 should match target");

  console.log("OK: All arabic-utils tests passed.");
}

runTests();
