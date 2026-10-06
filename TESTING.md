# DevTrack — Automated Testing & Quality Assurance Guide

> **Test Strategy**: Multi-Tier Quality Gate (Unit, Integration, Security, & Regression Testing)  
> **Framework**: Jest, ts-jest, Supertest  
> **Execution Location**: Local CLI + Automated Cloud Build CI/CD Pipeline

---

## 1. Quality Gate Philosophy

In modern Agile DevOps pipelines, code is never deployed to cloud environments without passing automated verification. DevTrack enforces an automated test gate in `cloudbuild.yaml` (Step 2: `backend-tests`). If any test fails, the pipeline aborts immediately, blocking container image compilation and Cloud Run deployment.

---

## 2. Test Suite Organization

The test suite (`backend/tests/api.test.ts`) is organized into six functional domains:

### Domain 1: Health Probes & Authentication
* `GET /api/health`: Verifies HTTP 200, uptime, and service identity.
* `GET /api/auth/me`: Verifies decoding of JWT payload and retrieval of correct user profile.
* `GET /api/auth/me (No token)`: Verifies HTTP 401 Unauthorized rejection.
* `POST /api/auth/register`: Verifies user registration, bcrypt password hashing, and token issuance.
* `POST /api/auth/login (Invalid password)`: Verifies HTTP 401 response for bad credentials.

### Domain 2: Role-Based Access Control (RBAC) & Projects
* `POST /api/projects (As Project Manager)`: Confirms HTTP 201 Created and project generation.
* `POST /api/projects (As Developer)`: Confirms strict HTTP 403 Forbidden rejection when non-PM roles attempt admin actions.
* `GET /api/projects`: Confirms collection retrieval.
* `GET /api/projects/:id`: Confirms single entity lookup.

### Domain 3: Agile Sprints & User Stories
* `POST /api/sprints`: Confirms sprint generation by Project Manager.
* `POST /api/stories`: Confirms user story creation in product backlog.
* `GET /api/sprints/:id`: Confirms dynamic calculation of sprint velocity (`completedTasks / totalTasks * 100`).

### Domain 4: Task Management Lifecycle & Transitions
* `POST /api/tasks`: Confirms task creation with estimate, priority, and project binding.
* `PATCH /api/tasks/:id/status`: Simulates complete Kanban progression:
  1. `TO DO` &rarr; `IN PROGRESS`
  2. `IN PROGRESS` &rarr; `COMPLETED`
  * Confirms automatic recalculation of overall project completion percentage.

### Domain 5: Defect & Bug Tracking Lifecycle
* `POST /api/bugs`: Allows QA Tester to report defects with reproduction steps.
* `PATCH /api/bugs/:id/status`: Simulates the complete triage flow:
  1. `OPEN` &rarr; `FIXED` (with Developer resolution notes)
  2. `FIXED` &rarr; `CLOSED` (QA verification)

### Domain 6: Telemetry & CI/CD History
* `GET /api/dashboard/stats`: Verifies real-time aggregation across all collections.
* `GET /api/github/repository`: Verifies GitHub API proxy without client token leakage.
* `GET /api/cicd/builds`: Verifies Cloud Build pipeline stages and build log history.

---

## 3. Running Tests Locally

### Interactive Execution
```bash
cd backend
npm test
```

### Headless / CI Execution
```powershell
# Windows PowerShell
.\scripts\run-tests.ps1
```

```bash
# Linux / macOS
./scripts/run-tests.sh
```

---

## 4. Test Execution Results

```text
PASS tests/api.test.ts (9.528 s)
  DevTrack Complete API Test Suite
    1. Health and Authentication
      √ GET /api/health should return healthy status (45 ms)
      √ GET /api/auth/me should return authenticated user profile (46 ms)
      √ GET /api/auth/me should reject request without token (40 ms)
      √ POST /api/auth/register should create a new developer (179 ms)
      √ POST /api/auth/login should reject invalid credentials (136 ms)
    2. Role-Based Access Control (RBAC) & Projects
      √ POST /api/projects should be permitted for PROJECT_MANAGER (44 ms)
      √ POST /api/projects should be FORBIDDEN (403) for DEVELOPER (30 ms)
      √ GET /api/projects should list all projects for authenticated users (35 ms)
      √ GET /api/projects/:id should return single project details (30 ms)
    3. Agile Sprints & User Stories
      √ POST /api/sprints should allow PM to create a Sprint (56 ms)
      √ POST /api/stories should create a User Story (38 ms)
      √ GET /api/sprints/:id should return computed progress (31 ms)
    4. Task Management Lifecycle & Transitions
      √ POST /api/tasks should create a task (52 ms)
      √ PATCH /api/tasks/:id/status should transition status: TO DO -> IN PROGRESS -> COMPLETED (75 ms)
    5. Bug Tracking Lifecycle
      √ POST /api/bugs should allow Tester to report a bug (91 ms)
      √ PATCH /api/bugs/:id/status should transition: OPEN -> FIXED -> CLOSED (61 ms)
    6. Dashboard Analytics, GitHub & CI/CD Telemetry
      √ GET /api/dashboard/stats should compute real database statistics (32 ms)
      √ GET /api/github/repository should return repository information safely (488 ms)
      √ GET /api/cicd/builds should return Cloud Build pipeline history (35 ms)

Test Suites: 1 passed, 1 total
Tests:       19 passed, 19 total
Snapshots:   0 total
Time:        10.113 s
```
