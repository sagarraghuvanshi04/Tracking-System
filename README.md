# TalentFlow AI — Smart ATS Hiring Suite

A production-grade, AI-driven Applicant Tracking System built with the **MERN stack**, Tailwind CSS, and OpenRouter AI.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js 18, Tailwind CSS v3, Recharts, React Router v6 |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ODM + Atlas) |
| AI | OpenRouter API (8 free model fallback chain) |
| Auth | JWT (7-day expiry), Role-based login |
| File Parsing | pdf-parse (PDF), mammoth (DOCX), native fs (TXT) |
| Email | Nodemailer (Gmail SMTP) |

---

## Features

### Part 1 — Core ATS Platform
- ✅ User Authentication & Role Management (Admin, Recruiter, Hiring Manager)
- ✅ Role-based Login & Register with role selector
- ✅ Job Posting Management (CRUD, search, filters, pagination, status)
- ✅ AI Resume Parsing via OpenRouter (PDF, TXT, DOC, DOCX) with reparse
- ✅ Candidate Profile Extraction & Management
- ✅ Candidate Pipeline Tracking (7 stages: applied → screening → interview → technical → offer → hired → rejected)
- ✅ AI Candidate Scoring & Recommendations (0–100 score, 4-metric breakdown)
- ✅ Advanced Search & Filters (name, skill, experience, job role, stage)
- ✅ Shortlisting & Notes
- ✅ Interview Scheduling with Email Notifications
- ✅ Recruitment Dashboard & Analytics (7 stat cards, bar chart, pie chart, conversion rate, avg AI score)
- ✅ Duplicate Candidate Detection
- ✅ Responsive UI (Desktop 1440px / Mobile 390px)

### Part 2 — AI Intelligence Module
- ✅ Resume Parsing using AI/NLP (OpenRouter — 8 model fallback chain)
- ✅ Skill Matching against Job Descriptions
- ✅ Candidate Ranking based on Relevance (0–100 score)
- ✅ Explainable AI Recommendations (why hire, concerns, skills present/missing, confidence level)
- ✅ Keyword Extraction & Resume Insights
- ✅ Candidate Fit Score Generation (skills, experience, education, overall fit breakdown)
- ✅ Duplicate Candidate Detection (email-based)
- ✅ Smart Shortlisting Suggestions (AI-ranked candidates per job, score ≥ 60)
- ✅ Kanban Pipeline View (visual board with stage movement controls)

### Part 3 — Premium Landing Page
- ✅ Dark enterprise-grade UI (completely different from ATS app)
- ✅ All required marketing copy:
  - "Hire Smarter with AI"
  - "Transform Your Recruitment Process"
  - "Find the Best Talent Faster"
  - "AI-Powered Hiring. Smarter Decisions. Better Teams."
  - "Start Hiring Today"
  - "Limited Early Access Available"
- ✅ Hero section with live dashboard stats preview
- ✅ Stats, Features, How It Works, Testimonials, Pricing, FAQ sections
- ✅ Fully responsive (mobile + desktop)

---

## Project Structure

```
Tracking System/
├── backend/
│   ├── controllers/
│   │   ├── aiController.js          # AI parse, score, explain endpoints
│   │   ├── applicationController.js # CRUD + stage + notes + shortlist + rescore
│   │   ├── authController.js        # JWT auth + role-based login + user management
│   │   ├── candidateController.js   # Resume upload + parse + reparse + duplicates + shortlist
│   │   ├── dashboardController.js   # Analytics aggregations + conversion rate + avg AI score
│   │   ├── interviewController.js   # Schedule + email invite
│   │   └── jobController.js         # Job CRUD + search
│   ├── middleware/
│   │   ├── auth.js                  # JWT protect + role authorize
│   │   └── upload.js                # Multer file upload (5MB limit)
│   ├── models/
│   │   ├── Application.js           # Stage history, AI scores, notes
│   │   ├── Candidate.js             # Skills, experience, education, duplicate flag
│   │   ├── Interview.js             # Scheduling, type, meeting link
│   │   ├── Job.js                   # Full text search index
│   │   └── User.js                  # Roles, bcrypt password
│   ├── routes/                      # Express routers for all 7 resource types
│   ├── utils/
│   │   ├── email.js                 # Nodemailer — application, interview, status update emails
│   │   └── openrouter.js            # 8-model fallback chain: parseResume, scoreCandidate, extractKeywords, explainCandidate
│   ├── uploads/                     # Resume file storage
│   ├── .env
│   ├── package.json
│   ├── seed.js
│   └── server.js
└── frontend/
    └── src/
        ├── api/
        │   ├── client.js            # Axios instance + interceptors
        │   └── services.js          # All API calls
        ├── components/
        │   ├── layout/
        │   │   ├── Layout.js        # App shell with topbar
        │   │   └── Sidebar.js       # Role-based navigation
        │   └── ui/
        │       └── index.js         # Button, Badge, Card, Modal, Input, Select, Textarea, ScoreRing, StageBadge, Spinner
        ├── context/
        │   └── AuthContext.js       # JWT auth state
        └── pages/
            ├── auth/
            │   ├── Login.js         # Role-based login
            │   └── Register.js      # Role selection on signup
            ├── dashboard/           # Stats + charts + recent activity
            ├── jobs/                # Job cards + CRUD modals
            ├── candidates/          # Resume upload + AI parse + skill/exp filters
            ├── applications/        # List + AI score panel + notes + stage
            ├── pipeline/            # Kanban board (7 columns) + AI scores
            ├── shortlist/           # AI shortlisting + explainable AI + duplicates
            ├── interviews/          # Schedule + email invite
            ├── landing/             # Premium dark landing page (Part 3)
            └── Settings.js          # User role management (admin only)
```

---

## Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- OpenRouter API key → https://openrouter.ai

### Backend

```bash
cd backend
npm install
```

Create `.env`:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key_here
OPENROUTER_API_KEY=your_openrouter_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
CLIENT_URL=http://localhost:3000
PORT=5000
```

Seed demo users:
```bash
npm run seed
```

Start server:
```bash
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

Create `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
NODE_PATH=src
```

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@talentflow.ai | admin123 |
| Recruiter | recruiter@talentflow.ai | recruiter123 |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login with role validation |
| POST | /api/auth/register | Register |
| GET | /api/auth/me | Get current user |
| GET | /api/auth/users | List users (admin) |
| PUT | /api/auth/users/:id/role | Update user role (admin) |
| GET | /api/jobs | List jobs (search, filter, paginate) |
| POST | /api/jobs | Create job (admin/recruiter) |
| PUT | /api/jobs/:id | Update job (admin/recruiter) |
| DELETE | /api/jobs/:id | Delete job (admin) |
| GET | /api/candidates | List candidates (search, skill, exp filters) |
| POST | /api/candidates/upload-resume | Upload & AI parse resume |
| POST | /api/candidates/:id/reparse | Re-run AI parsing on saved resume |
| GET | /api/candidates/duplicates/list | List duplicate candidates |
| GET | /api/candidates/shortlist/:jobId | AI smart shortlist for a job |
| GET | /api/applications | List applications (filter by job/stage/shortlisted) |
| POST | /api/applications | Create application (triggers AI scoring) |
| PUT | /api/applications/:id/stage | Update pipeline stage + send email |
| POST | /api/applications/:id/notes | Add note |
| PUT | /api/applications/:id/shortlist | Toggle shortlist |
| POST | /api/applications/:id/rescore | Re-run AI scoring |
| GET | /api/interviews | List interviews |
| POST | /api/interviews | Schedule interview + send email |
| PUT | /api/interviews/:id | Update interview |
| DELETE | /api/interviews/:id | Delete interview |
| GET | /api/dashboard/stats | Dashboard analytics + conversion rate + avg AI score |
| POST | /api/ai/parse-resume | Parse resume text |
| POST | /api/ai/score-candidate | Score candidate for job |
| POST | /api/ai/extract-keywords | Extract keywords |
| GET | /api/ai/explain/:applicationId | Explainable AI — full reasoning breakdown |

---

## AI Features

### Resume Parsing
Extracts: name, email, phone, location, summary, skills[], experience[], education[], totalExperienceYears

### Candidate Scoring
Returns: overallScore (0–100), skillsMatch, experienceMatch, educationMatch, overallFit, recommendation (Strong Hire / Hire / Maybe / No Hire), keyStrengths[], gaps[], keywords[]

### Explainable AI
Returns: summary, whyHire[], concerns[], skillsPresent[], skillsMissing[], experienceInsights, cultureFitIndicators[], improvementSuggestions[], confidenceLevel (High/Medium/Low), finalVerdict

### AI Model Fallback Chain
Tries 8 free OpenRouter models in sequence. On 429 rate limit, waits and tries next model automatically:
1. openai/gpt-oss-120b:free
2. openai/gpt-oss-20b:free
3. google/gemma-4-31b-it:free
4. google/gemma-4-26b-a4b-it:free
5. meta-llama/llama-3.3-70b-instruct:free
6. deepseek/deepseek-v4-flash:free
7. qwen/qwen3-coder:free
8. meta-llama/llama-3.2-3b-instruct:free

---

## Deployment

### Render (recommended)

**Backend:**
1. New Web Service → connect repo → Root: `backend`
2. Build: `npm install` · Start: `npm start`
3. Add all `.env` variables in Environment tab

**Frontend:**
1. New Static Site → Root: `frontend`
2. Build: `npm run build` · Publish: `build`
3. Set `REACT_APP_API_URL=https://your-backend.onrender.com/api`

---

## Design System

- **Primary**: Indigo 600 (`#4f46e5`) — ATS app
- **Landing**: Violet/Indigo gradient on dark `#0a0a0f` background
- **Typography**: Inter (system font stack)
- **Breakpoints**: Mobile 390px, Desktop 1440px
