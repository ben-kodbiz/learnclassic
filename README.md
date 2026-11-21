# Classical Arabic Grammar Learning Web App

A lightweight, static, browser-based **Classical Arabic Grammar** curriculum application focused on Morphology (*Ṣarf*), Syntax (*Naḥw*), Grammatical Inflection (*Iʿrāb*), and classical-text reading.

The 26-week syllabus is inspired by the chapter structure of J. A. Haywood & H. M. Nahmad’s *A New Arabic Grammar of the Written Language* (2nd Edition, 1965, Lund Humphries), adapted exclusively for Classical Arabic and excluding modern colloquial/dialect material.

## Curriculum Structure & Modules

The 26-week curriculum is arranged in 3 canonical modules (`data/curriculum.json` and `data/modules/module-1..3.json`):

- **Module 1 (Weeks 1–8):** Foundational Classical Morphology & Nominal Syntax (*Al-Mabādiʾ wa-l-Asmāʾ*) — Haywood & Nahmad Ch. 1–13, Ryding Ch. 1–10, 12–13, 21–22, 36, plus Week 8 Consolidation (`m1-w08-cons`).
- **Module 2 (Weeks 9–17):** The Classical Verbal System, Mood Governance & Morphological Stems (*Ṣiyagh al-Fiʿl wa-Aḥwāluh*) — Haywood & Nahmad Ch. 14–31, 33, Ryding Ch. 2, 20–32, 34–35, 38, App. I, plus Week 17 Consolidation.
- **Module 3 (Weeks 18–26):** Advanced Classical Syntax, Qur'anic Structures & Textual Iʿrāb (*Al-Asālīb wa-l-Iʿrāb al-Mutaqaddim*) — Haywood & Nahmad Ch. 32, 34–52 & Supplement, Ryding Ch. 5–6, 8–11, 14–16, 18–19, 36–37, 39, App. II.

## Features
- **Canonical 3-Module, 26-Week Curriculum Data** (`data/curriculum.json` and `data/modules/module-1..3.json`) covering Chapters 1–52, Module 1 Consolidation, and the Literary Supplement.
- **Navigable Curriculum Map** (`index.html`, `js/`, `css/`) with module views, week breakdowns, chapter syllabus pages, prerequisite links, and search/status filtering.
- **Interactive Practice Engine** supporting multiple-choice, true/false, fill-in-the-blank, matching, word-ordering, and typed Arabic active recall with diacritic tools.
- **RTL/LTR Bilingual Typography** (`css/arabic.css`) using `lang="ar"` / `dir="rtl"` isolation and CSS logical properties.
- **Local Progress Persistence** (`localStorage`) with JSON export/import and reset confirmation.
- **GitHub Pages Ready** using relative paths and hash routing (`#/module/...`, `#/chapter/...`).

## Local Development

Because the app loads JSON files via `fetch()`, serve the repository with any static HTTP server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Validation & Tests

Validate curriculum data, exercise schemas, and Arabic normalization:

```bash
# Validate curriculum data, weeks, chapter links, prerequisites, and glossary
node tests/curriculum-validation.js

# Validate interactive exercises (multiple-choice, matching, word-order, typed Arabic)
node tests/exercise-validation.js

# Test Arabic orthography, normalization, and diacritic matching
node tests/arabic-utils-test.js
```

## Content & Review Conventions

- **Originality:** Explanations, examples, and exercises are authored originally for this application rather than copying textbook prose or exercise sets.
- **Review Status Lifecycle:** All Arabic content items carry `reviewStatus` (`pending`, `reviewed`, or `verified`). Unreviewed material must remain marked `pending`. Content is never certified merely because automated scripts pass. See `docs/CONTENT_REVIEW_CHECKLIST.md` for the quality-control criteria.
- **Chapter 32–34 Ordering:** Textbook chapter numbers (`32`, `33`, `34`) are preserved while following the 26-week pedagogical grouping (Ch. 33 in Week 16, Ch. 32 and 34 in Week 18).

## GitHub Pages Deployment

Push to `main` with GitHub Pages configured to use **GitHub Actions** (`.github/workflows/deploy.yml`). All asset and data paths are relative (`./`), so the site works both at a custom domain root (`/`) and under a repository subpath (`/repo-name/`).
