# Classical Arabic Content Review Checklist & Quality Standards

**Purpose:** This document establishes the formal editorial and linguistic quality-control standards for all Arabic curriculum material, explanations, exercises, and reference tools in LearnClassic.

---

## 1. Review Status Lifecycle

Every lesson, chapter, exercise set, and reading entry carries an explicit `reviewStatus`:

| Status | Meaning | Promotion Criteria |
|---|---|---|
| `pending` | Drafted; automated checks pass, but content has not yet undergone manual linguistic review. | Default state for new or heavily modified material. |
| `reviewed` | A qualified reviewer has inspected the content, noted corrections or required changes, and preliminary corrections have been made. | Requires recorded review notes, date, and reviewer identifier. |
| `verified` | Approved against the project's Classical Arabic and pedagogical standards by an appropriately qualified reviewer. | Full sign-off on Arabic orthography, tashkīl, grammar rules, translations, and exercises. |

> [!IMPORTANT]
> **Automated checks (such as JSON validation or syntax linters) test only structural integrity.**  
> Never promote a lesson or exercise to `reviewed` or `verified` based on automated test runs alone. Linguistic verification requires qualified human review.

---

## 2. Review Metadata Schema

Where recorded in JSON files (`data/lessons/*.json`, `data/exercises/*.json`, `data/modules/*.json`):

```json
{
  "reviewStatus": "reviewed",
  "reviewMetadata": {
    "reviewer": "Reviewer Name / Handle",
    "reviewDate": "YYYY-MM-DD",
    "notes": "Reviewed hamzat al-wasl orthography and nominal sentence explanation."
  }
}
```

---

## 3. Linguistic & Pedagogical Review Checklist

Before marking any lesson, unit, or exercise as `verified`, evaluate every item below:

### 3.1 Arabic Orthography & Script
- [ ] **Hamzah accuracy:** Strict distinction between *hamzat al-qaṭʿ* (أ / إ / آ) and *hamzat al-waṣl* (ا / ٱ).
- [ ] **Definite Article:** Written as `الـ` (or instructional `ٱلـ`), never with hamzat al-qaṭʿ (`أَلْ`).
- [ ] **Alif Maqṣūrah & Yāʾ:** Proper use of bare `ى` (alif maqṣūrah) vs dotted `ي` (yāʾ) in Classical text.
- [ ] **Tāʾ Marbūṭah vs Hāʾ:** Consistent distinction between `ة` (with two dots) and `ـه` (pronominal suffix/stem).
- [ ] **Tanwīn Orthography:** Accusative tanwīn carries orthographic alif (`ـًا` or `ـًى`) where required by classical rules (except on tāʾ marbūṭah `ـَةً` and hamzah preceded by alif `ـَاءً`).

### 3.2 Vocalization & Tashkīl
- [ ] **Desinential Inflection (*Iʿrāb*):** Fully vowelled case endings (ḍammah, fatḥah, kasrah) and mood endings (ḍammah, fatḥah, sukūn).
- [ ] **Nunation (*Tanwīn*):** Indefinite singular triptotes carry explicit tanwīn (`-un`, `-an`, `-in`).
- [ ] **Shaddah:** Marked on all doubled consonants and solar-letter assimilations (`الشَّمْسُ`).
- [ ] **Vocalization Consistency:** Diacritics are placed accurately and consistently across all examples.

### 3.3 Grammatical Explanations & Terminology
- [ ] **Precision of Rules:** Scope of rules is clearly stated; introductory simplifications are explicitly identified as patterns rather than exceptionless universal laws.
- [ ] **Bilingual Terminology:** Standard Classical Arabic terms (*mubtadaʾ*, *khabar*, *fāʿil*, *mafʿūl bihi*, *iḍāfah*, *naʿt*, *badal*, *ḥāl*, *tamyīz*) are paired consistently with standard English translations.
- [ ] **Theoretical Alignment:** Concepts align with classical grammarians (*Sībawayh*, *Ibn Hishām*, *Al-Ājurrūmiyyah*) and modern reference standards (Haywood & Nahmad, Karin C. Ryding).

### 3.4 Verb Paradigms & Morphology (*Ṣarf*)
- [ ] **Metric Weight (*Wazn*):** Root letters (ف-ع-ل) are mapped correctly.
- [ ] **Weak & Irregular Roots:** Geminate contraction (*idghām*), weak letter deletion, and vowel shortening in closed syllables are verified against classical paradigms.
- [ ] **Semantic Tendencies:** Explanations describe semantic tendencies of derived forms (Forms II–X) without misleadingly promising mechanical 1:1 translations.

### 3.5 Translations & Sourced Excerpts
- [ ] **Translational Accuracy:** Translations reflect the exact grammatical nuances of the Arabic text without introducing colloquialisms.
- [ ] **Citation & Attribution:** Every classical passage, Qur'anic ayah, or hadith excerpt cites chapter, verse, or canonical collection accurately.
- [ ] **Separation of Disciplines:** Grammatical analysis (*iʿrāb*) is kept strictly distinct from theological commentary (*tafsīr*).

### 3.6 Exercises & Feedback
- [ ] **Unambiguous Questions:** Every prompt clearly specifies what is being asked.
- [ ] **Valid Answers:** All acceptable classical variants are handled (e.g., in typed answers).
- [ ] **Constructive Feedback:** Explanations clarify *why* the correct answer is correct and why plausible distractors are incorrect.

---

## 4. Suggested Content Review Workflow

```
[ Author Drafts Lesson / Exercises ]
                 │
                 ▼
[ Automated Validation Tests Pass ]  (node tests/curriculum-validation.js)
                 │
                 ▼
[ Reviewer Inspects against Checklist ]
  ├── 1. Orthography & Hamzah
  ├── 2. Tashkīl & Case/Mood
  ├── 3. Explanation & Terminology
  └── 4. Exercise Accuracy
                 │
                 ▼
[ Feedback Addressed by Author ]
                 │
                 ▼
[ Sign-off & Metadata Update ]  ("reviewStatus": "reviewed" / "verified")
                 │
                 ▼
[ Publication & Release ]
```
