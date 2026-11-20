# Classical Arabic Grammar Learning Web App

A lightweight, static, browser-based **Classical Arabic Grammar** curriculum application focused on Morphology (*Ṣarf*), Syntax (*Naḥw*), Grammatical Inflection (*Iʿrāb*), and classical-text reading.

The 26-week syllabus is inspired by the chapter structure of J. A. Haywood & H. M. Nahmad’s *A New Arabic Grammar of the Written Language* (2nd Edition, 1965, Lund Humphries), adapted exclusively for Classical Arabic and excluding modern colloquial/dialect material.

## Features (Phase 0 & Phase 1)
- **Canonical 3-Module, 26-Week Curriculum Data** (`data/curriculum.json` and `data/modules/module-1..3.json`) covering Chapters 1–52 and the Literary Supplement.
- **Navigable Curriculum Map** (`index.html`, `js/`, `css/`) with module views, week breakdowns, chapter syllabus pages, prerequisite links, and search/status filtering.
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

Validate the curriculum JSON structure (3 modules, 26 weeks, Chapters 1–52 + Literary Supplement, prerequisites, and `reviewStatus` metadata):

```bash
node tests/curriculum-validation.js
```

## Content & Review Conventions

- **Originality:** Explanations, examples, and exercises are authored originally for this application rather than copying textbook prose or exercise sets.
- **Review Status:** All Arabic content items carry `reviewStatus` (`pending`, `reviewed`, or `verified`). Unreviewed material must remain marked `pending`.
- **Chapter 32–34 Ordering:** Textbook chapter numbers (`32`, `33`, `34`) are preserved while following the 26-week pedagogical grouping (Ch. 33 in Week 16, Ch. 32 in Week 17).

## GitHub Pages Deployment

Push to `main` with GitHub Pages configured to use **GitHub Actions** (`.github/workflows/deploy.yml`). All asset and data paths are relative (`./`), so the site works both at a custom domain root (`/`) and under a repository subpath (`/repo-name/`).
