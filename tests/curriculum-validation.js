#!/usr/bin/env node
/**
 * Validates data/curriculum.json and data/modules/module-*.json
 * against the dual-source syllabus (Haywood & Nahmad + Karin C. Ryding):
 * 3 modules, 26 weeks, Chapters 1-52 + consolidation-1 + supplement,
 * valid prerequisites, rydingReference, and recorded reviewStatus.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

function readJson(relPath) {
  const fullPath = path.join(rootDir, relPath);
  const raw = fs.readFileSync(fullPath, "utf8");
  return JSON.parse(raw);
}

function assert(cond, msg) {
  if (!cond) {
    throw new Error(`Validation failed: ${msg}`);
  }
}

function main() {
  const curriculum = readJson("data/curriculum.json");
  assert(curriculum.modules && curriculum.modules.length === 3, "Expected 3 modules");
  assert(curriculum.totalWeeks === 26, "Expected totalWeeks === 26");
  assert(
    Array.isArray(curriculum.referenceEditions) && curriculum.referenceEditions.length === 2,
    "Expected 2 referenceEditions (Haywood & Nahmad + Ryding)"
  );

  const validStatuses = new Set(
    curriculum.conventions?.reviewStatuses || ["pending", "reviewed", "verified"]
  );
  const seenWeeks = new Set();
  const seenChapters = new Set();
  const allChapterIds = new Set();
  const allChapters = [];

  for (const modMeta of curriculum.modules) {
    assert(validStatuses.has(modMeta.reviewStatus), `Invalid reviewStatus on ${modMeta.id}`);
    const mod = readJson(modMeta.dataFile);
    assert(mod.moduleId === modMeta.id, `moduleId mismatch in ${modMeta.dataFile}`);
    assert(Array.isArray(mod.weeks) && mod.weeks.length > 0, `No weeks in ${modMeta.dataFile}`);

    for (const weekObj of mod.weeks) {
      assert(Number.isInteger(weekObj.week), `Invalid week number in ${modMeta.id}`);
      assert(!seenWeeks.has(weekObj.week), `Duplicate week ${weekObj.week}`);
      seenWeeks.add(weekObj.week);
      assert(
        Array.isArray(weekObj.chapters) && weekObj.chapters.length > 0,
        `Week ${weekObj.week} has no chapters`
      );

      for (const ch of weekObj.chapters) {
        assert(ch.id && !allChapterIds.has(ch.id), `Missing or duplicate chapter id: ${ch.id}`);
        allChapterIds.add(ch.id);
        assert(!seenChapters.has(ch.chapter), `Duplicate chapter key: ${ch.chapter}`);
        seenChapters.add(ch.chapter);
        assert(
          ch.title && ch.titleArabic && ch.textbookTitle && ch.rydingReference,
          `Missing required title or rydingReference on ${ch.id}`
        );
        assert(Array.isArray(ch.coreRules) && ch.coreRules.length > 0, `Missing coreRules on ${ch.id}`);
        assert(validStatuses.has(ch.reviewStatus), `Invalid reviewStatus on ${ch.id}`);
        allChapters.push(ch);
      }
    }
  }

  for (let w = 1; w <= 26; w++) {
    assert(seenWeeks.has(w), `Missing week ${w}`);
  }
  for (let c = 1; c <= 52; c++) {
    assert(seenChapters.has(c), `Missing chapter ${c}`);
  }
  assert(seenChapters.has("consolidation-1"), "Missing Module 1 consolidation unit");
  assert(seenChapters.has("supplement"), "Missing literary supplement");

  for (const ch of allChapters) {
    assert(Array.isArray(ch.prerequisites), `Missing prerequisites array on ${ch.id}`);
    for (const pre of ch.prerequisites) {
      assert(allChapterIds.has(pre), `Unknown prerequisite '${pre}' in ${ch.id}`);
    }
  }

  // Validate glossary.json
  const glossary = readJson("data/glossary.json");
  assert(Array.isArray(glossary.terms) && glossary.terms.length > 0, "Glossary must have terms");
  const glossaryIds = new Set();
  for (const term of glossary.terms) {
    assert(term.id && !glossaryIds.has(term.id), `Missing or duplicate glossary id: ${term.id}`);
    glossaryIds.add(term.id);
    assert(term.term && term.termArabic && term.definition, `Incomplete glossary entry: ${term.id}`);
    for (const lid of term.lessonIds || []) {
      assert(allChapterIds.has(lid), `Unknown lessonId '${lid}' in glossary term '${term.id}'`);
    }
  }

  // Validate availableLessons JSON files
  const allowedSectionTypes = new Set(["explanation", "rule", "example", "table", "callout"]);
  const lessons = curriculum.availableLessons || [];
  assert(lessons.length >= 3, "Expected at least 3 availableLessons (one per module)");
  for (const lid of lessons) {
    assert(allChapterIds.has(lid), `Unknown availableLesson id: ${lid}`);
    const lesson = readJson(`data/lessons/${lid}.json`);
    assert(lesson.id === lid, `Lesson id mismatch in ${lid}.json`);
    assert(validStatuses.has(lesson.reviewStatus), `Invalid reviewStatus on lesson ${lid}`);
    assert(Array.isArray(lesson.sections) && lesson.sections.length > 0, `No sections in ${lid}`);
    for (const sec of lesson.sections) {
      assert(allowedSectionTypes.has(sec.type), `Invalid section type '${sec.type}' in ${lid}`);
    }
    for (const tid of lesson.glossaryTerms || []) {
      assert(glossaryIds.has(tid), `Unknown glossaryTerm '${tid}' in lesson ${lid}`);
    }
  }

  console.log(
    `OK: Validated 3 modules, ${seenWeeks.size} weeks, ${allChapters.length} units, ${glossary.terms.length} glossary terms, and ${lessons.length} interactive lessons.`
  );
}

main();
