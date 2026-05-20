# Recruitment Enhancement Plan — Structured Applications & Auto-Scoring

Enhance the recruitment module with structured qualifications, Kenyan education system support, and hybrid auto-scoring (keyword + criteria + manual ranking).

---

## 1. Backend Changes

### 1.1 Job Model — New Columns
Add two JSONB columns to the `jobs` table:

**`qualifications`** — Array of qualification objects for scoring:
```json
[
  { "name": "Degree in Hospitality", "type": "required", "weight": 10 },
  { "name": "Food Safety Certification", "type": "preferred", "weight": 5 },
  { "name": "2+ years hotel experience", "type": "required", "weight": 8 }
]
```

**`evaluationParams`** — Keywords and criteria for auto-scoring:
```json
{
  "keywords": ["hospitality", "customer service", "hotel management", "front desk"],
  "criteria": [
    { "name": "yearsExperience", "label": "Years of Experience", "weight": 10, "operator": ">=", "value": 2 },
    { "name": "hasDegree", "label": "Has Relevant Degree", "weight": 8, "operator": "boolean" }
  ]
}
```

### 1.2 Job Controller — Update `createJob` / `updateJob`
- Accept `qualifications` and `evaluationParams` in request body
- Store as JSONB in the new columns

### 1.3 New Scoring Endpoint
**`POST /api/jobs/:id/score-applicants`** — Auto-scores all applicants for a job:
- **Keyword matching**: Scans `applicationData.workHistory[].description`, `coverLetter`, and skills for keyword occurrences. Each match adds points proportional to keyword count.
- **Criteria scoring**: Evaluates each criterion against structured application data (e.g., counts work history entries for yearsExperience, checks education for hasDegree).
- Returns each applicant with a `score` (0-100), `keywordMatches`, and `criteriaResults`.
- HR can still manually override with `manualScore` and `notes`.

### 1.4 Application Model — Add `score` columns
Add to `job_applications`:
- `auto_score` DECIMAL — computed score
- `manual_score` DECIMAL — HR override
- `score_breakdown` JSONB — detailed scoring breakdown
- `reviewer_notes` TEXT

---

## 2. Frontend Changes

### 2.1 Job Creation Form (`JobPostingManagement.jsx`)
Add two new sections to the job create/edit modal:

**Qualifications Builder**:
- Input field + "Add" button to build a list
- Each item: name text, type dropdown (required/preferred), weight number
- Drag/reorder or delete items
- Preview shows how it will appear to applicants

**Evaluation Parameters**:
- Keywords input: tag-style input (type keyword, press Enter to add)
- Criteria builder: add rows with name, label, weight, operator, value
- Preset criteria: yearsExperience, hasDegree, hasCertification

### 2.2 Application Form (`JobApplicationForm.jsx`)
Restructure to Kenyan education system + structured work history:

**Header**: Job title, department, location
**Qualifications Checklist** (read-only):
- Display all qualifications as a simple list
- "I have read and understood the requirements" checkbox
- Apply button disabled until checkbox is checked

**Structured Work History** (replaces single text field):
- "Add Work Experience" button
- Each entry: company, role, start date, end date, description
- Multiple entries supported, displayed as timeline cards

**Kenyan Education System**:
- Primary Education: school name, year completed, certificate (KCPE)
- Secondary Education: school name, year completed, certificate (KCSE), grade
- Further Education (optional, multiple): institution, qualification (certificate/diploma/degree/masters), field of study, start/end year
- Other Qualifications: free-form entries for short courses, certifications

**Remaining fields**: Cover letter, CV upload, references, phone

### 2.3 Applicant Review Dashboard (`ApplicantReviewDashboard.jsx`)
Add scoring and ranking features:

**Auto-Score Button**: Triggers scoring endpoint, displays results
**Score Column in Table**: Shows auto-score with color coding (green >70, yellow 40-70, red <40)
**Score Breakdown Modal**: Click score to see keyword matches and criteria results
**Manual Override**: HR can adjust score and add notes
**Filter by Score Range**: Quick filter for top candidates
**Sort by Score**: Default sort for ranked view

---

## 3. Implementation Order

| Step | File | Action |
|------|------|--------|
| 1 | `Job.model.js` | Add `qualifications`, `evaluationParams` columns |
| 2 | `JobApplication.model.js` | Add `auto_score`, `manual_score`, `score_breakdown`, `reviewer_notes` columns |
| 3 | `job.controller.js` | Update createJob/updateJob for new fields; add scoreApplicants endpoint |
| 4 | `job.routes.js` | Add scoring route |
| 5 | `JobPostingManagement.jsx` | Add qualifications builder + evaluation params to job form |
| 6 | `JobApplicationForm.jsx` | Restructure with Kenyan education, structured work history, qualifications checklist |
| 7 | `ApplicantReviewDashboard.jsx` | Add scoring UI, score column, breakdown modal, manual override |

---

## 4. Scoring Algorithm

```
totalScore = (keywordScore * 0.4) + (criteriaScore * 0.6)

keywordScore:
  - Count occurrences of each keyword in workHistory descriptions, coverLetter, skills
  - Normalize to 0-100 based on max possible matches

criteriaScore:
  - For each criterion, check if applicant meets it
  - Weighted average of all criteria (each 0-100)
  - Example: yearsExperience >= 2 → 100 points * weight 10
  - Example: hasDegree → 100 or 0 * weight 8

Manual override: HR sets manual_score which replaces auto_score in rankings
```
