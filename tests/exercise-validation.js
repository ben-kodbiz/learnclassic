#!/usr/bin/env node
/**
 * Validates all exercise JSON files in data/exercises/*.json
 * using the same validation rules as js/exercise-engine.js.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateExerciseSet } from "../js/exercise-engine.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const exDir = path.join(rootDir, "data", "exercises");

function main() {
  const files = fs.readdirSync(exDir).filter((f) => f.endsWith(".json")).sort();
  if (files.length === 0) {
    throw new Error("No exercise JSON files found in data/exercises/");
  }

  let totalExercises = 0;
  const seenIds = new Set();

  for (const file of files) {
    const lessonId = file.replace(/\.json$/, "");
    const raw = JSON.parse(fs.readFileSync(path.join(exDir, file), "utf8"));
    validateExerciseSet(raw, lessonId);
    for (const ex of raw.exercises) {
      if (seenIds.has(ex.id)) {
        throw new Error(`Duplicate exercise id: ${ex.id}`);
      }
      seenIds.add(ex.id);
      if (!ex.reviewStatus) {
        throw new Error(`Missing reviewStatus on ${ex.id}`);
      }
      totalExercises++;
    }
  }

  console.log(`OK: Validated ${files.length} exercise sets (${totalExercises} exercises total).`);
}

main();
