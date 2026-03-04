# OnlySurf --- API Build Guidelines (NestJS on Vercel)

Deployment: Vercel Fluid Compute \| DB: Neon Postgres \| Cache: Upstash
Redis \| Video: Mux \| Auth: Firebase \| Billing: Stripe \| Email:
Resend

This document guides an AI coding agent building the OnlySurf API
(API-first SaaS). Goal: build a scalable NestJS backend supporting surf
coaches, athletes, sessions, waves, and subscriptions.

------------------------------------------------------------------------

# 1. Introduction

OnlySurf is a surf coaching and progression platform.

Coaches: - manage athletes - create sessions - upload waves - score
performance

Athletes: - view waves they appear in - review feedback - save waves to
a personal archive

The API powers: - web app - future mobile apps

------------------------------------------------------------------------

# 2. Architecture

**Stack:**

-   NestJS (TypeScript)
-   PostgreSQL (Neon)
-   Prisma ORM
-   Firebase Auth
-   Mux (video processing)
-   Upstash Redis (caching)
-   Stripe (subscriptions)
-   Resend (emails)
-   Deploy on Vercel Fluid Compute

**Principles:**

-   API‑first architecture
-   Serverless friendly
-   Multi‑tenant system using Academy
-   Direct uploads to Mux
-   Authorization via role + subscription plan

------------------------------------------------------------------------

# 3. Application Features

**Coach features:**

-   manage academy
-   manage athletes
-   create sessions
-   upload waves
-   tag athletes
-   score waves
-   add notes to waves
-   track performance
-   track payments (assign payments and follow up)
-   premium public profile (pro & academy)

**Free Athlete features:**

-   view tagged waves
-   view feedback
-   download waves
-   create free surf sessions (pro)
-   save waves permanently (pro)
-   score own waves (pro)
-   access statistics (pro)

------------------------------------------------------------------------

# 4. Database Entities

## User

Platform account linked to Firebase UID.

## Profile

Shared profile for athletes and coaches.

## Academy

Represents a surf school.

## AcademyMembership

Links users to academies.

## Session

Training session or free surf session.

## SessionRoster

Athletes assigned to sessions.

## VideoAsset

Reference to video stored in Mux.

## Wave

Single wave video clip.

# SavedWave

SavedWave represents a wave that an athlete chooses to keep in their
archive.

Properties:

-   references the original Wave
-   stores duration snapshot for quota calculations
-   preserves reference to session, coach and academy

## WaveTag

Links waves to athletes.

## Score / Feedback

Coach scoring for a wave.

## Subscription

Stripe subscription record.

## WebhookEvent

Stores processed webhook IDs.

------------------------------------------------------------------------

# 5. API Endpoints

All endpoints start with /v1

**Health**

GET /health

**Auth**

POST /auth/session
GET /me
PATCH /me/profile

**Academies**

POST /academies
GET /academies/:id
PATCH /academies/:id
GET /academies/:id/members
POST /academies/:id/invites

**Athletes**

GET /athletes
POST /athletes
GET /athletes/:id
PATCH /athletes/:id
DELETE /athletes/:id

**Sessions**

GET /sessions
POST /sessions
GET /sessions/:id
PATCH /sessions/:id
DELETE /sessions/:id
POST /sessions/:id/roster

**Media**

POST /media/mux/uploads
POST /media/mux/webhook

**Waves**

GET /waves
POST /waves
GET /waves/:id
PATCH /waves/:id
DELETE /waves/:id
GET /waves/:id/download

**Saved Waves**

POST /saved-waves
GET /saved-waves
DELETE /saved-waves/:id

**Scoring**

POST /waves/:id/scores

**Notes**

POST /waves/:id/notes

**Stats**
GET /sessions/:id/summary
GET /athletes/:id/stats
GET /me/stats

**Payments**
GET /payments
POST /payments
GET /athletes/:id/payments
GET /me/payments

**Billing**

GET /billing/plans
POST /billing/checkout
POST /billing/portal
POST /billing/webhook

------------------------------------------------------------------------

# 6. Billing

The platform uses Stripe subscriptions.

**Requirements:**

-   monthly billing
-   annual billing
-   7 day trial
-   Stripe Checkout
-   Stripe Customer Portal
-   Stripe Webhooks

**Two plan categories:**

-   Coach plans (starter, pro, academy)
-   Athlete (free, Pro)

Video limits are defined using minutes processed.

All coach plans include a 1 month video archive.

**After 1 month:**

-   sessions are archived
-   athletes must save waves or download files to retain them

------------------------------------------------------------------------

## Coach Plans

### Coach Starter --- €19.99/month

**Limits**

-   10 athletes
-   20 sessions/month
-   120 video minutes/month
-   1 coach
-   1 month archive

**Features**

-   athlete management
-   sessions
-   wave tagging
-   scoring
-   basic statistics (sessions, sessions per athlete, waves, minutes stored)

**Restrictions**

-   no premium coach profile
-   no co‑coaches
-   no payment tracking

------------------------------------------------------------------------

### Coach Pro --- €39.99/month

**Limits**

-   40 athletes
-   80 sessions/month
-   600 video minutes/month
-   up to 3 coaches
-   1 month archive

**Features**

-   everything in Starter
-   premium coach profile
-   leaderboards
-   session summaries
-   athlete statistics
-   athlete payment tracking

------------------------------------------------------------------------

### Academy Plan --- €99.99/month

**Limits**

-   150 athletes
-   300 sessions/month
-   2000 video minutes/month
-   unlimited coaches
-   1 month archive

**Features**

-   everything in Coach Pro
-   academy dashboard
-   academy leaderboard
-   academy payment tracking

------------------------------------------------------------------------

## Athlete Plans

### Free Athlete

-   view tagged waves
-   download waves

**Restrictions**

-   cannot create sessions
-   no statistics
-   no archive

------------------------------------------------------------------------

### Pro Surfer --- €4.99/month

**Limits**

-   300 minutes archived video

**Features**

-   create free surf sessions
-   save waves
-   personal archive
-   statistics

------------------------------------------------------------------------

# 7. Archiving Strategy

When sessions are archived:

1.  Get all waves in session
2.  Check if wave has SavedWave references
3.  If zero references → delete Mux asset
4.  If referenced → keep asset

This allows:

-   athletes to keep saved waves
-   unused videos to be deleted

If an athlete deletes a savedWave:

1. Check if there is another savedWave referencing the same Mux asset
2. If not, delete the Mux asset
3. If there is, just delete the savedWave and keep the Mux asset

------------------------------------------------------------------------

# 8. Development Order

1. NestJS scaffold
2. Prisma + Neon setup
3. Firebase authentication
4. Academy system
5. Athlete management
6. Session management
7. Mux upload integration
8. Wave management
9. Saved wave archive system
10. Scoring
11. Statistics
12. Stripe billing
13. Testing

------------------------------------------------------------------------

# 9. Definition of Done

The MVP is complete when:

-   coaches manage athletes and sessions
-   waves upload successfully
-   athletes view and download waves
-   athletes save waves
-   saved waves survive session archiving
-   statistics work
-   Stripe subscriptions function
-   API deploys successfully on Vercel

# 10. Document updates

This is the MVP requirements. If anything outside the scope of this MVP is asked, update this documentation accordingly.
