---
name: project-peakform
description: PeakForm fitness/coaching SaaS platform — tech stack, architecture decisions, and current state
metadata:
  type: project
---

PeakForm is a fitness & coaching SaaS platform for personal trainers and athletes (Greek market focus).

**Why:** Replace WhatsApp/Excel/PDF workflows with a unified digital platform.

**Tech Stack decided:**
- Web: Next.js 15 + TypeScript + Tailwind CSS (App Router)
- API: Node.js + Express + TypeScript + Prisma ORM
- DB: PostgreSQL
- Mobile: React Native (Expo) — planned for phase 2
- Monorepo: npm workspaces at `apps/web` and `apps/api`

**Architecture:**
- Monorepo at `c:\Users\nnikoliadis\Downloads\Peak-Form-GR`
- `apps/api` — Express REST API on port 3001, JWT auth (15min access + 7d refresh tokens)
- `apps/web` — Next.js on port 3000, rewrites `/api/*` to API server
- Two roles: TRAINER and ATHLETE

**Current state (foundation complete):**
- Prisma schema: User, RefreshToken, TrainerAthlete, Exercise, WorkoutProgram, ProgramWeek, WorkoutDay, WorkoutExercise, WorkoutAssignment, WorkoutLog, SetLog, CheckIn
- Auth endpoints: POST /api/auth/register, /login, /refresh, /logout, GET /api/auth/me
- Users endpoints: GET/POST trainer athletes management
- Next.js: Login page, Register page (with role selector), Trainer dashboard, Athlete dashboard, Sidebar + MobileNav
- Design: Dark theme (gray-950 bg), brand color sky-blue (brand-600), accent orange

**How to apply:** When suggesting next features, build on this foundation. Next natural steps: workout program builder, exercise library, workout logging for athletes.

**Setup instructions for user:**
1. `cd apps/api && cp .env.example .env` (fill DB URL)
2. `cd apps/api && npm install && npx prisma migrate dev`
3. `cd apps/web && cp .env.local.example .env.local`
4. `cd apps/web && npm install`
5. From root: `npm install && npm run dev`
