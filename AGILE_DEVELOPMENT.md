# DevTrack — Agile / Scrum Development Methodology Report

This document records the incremental development of **DevTrack** itself following the **Agile/Scrum Framework**.

---

## Sprint Cadence Overview

```
Sprint 1 (Auth & Team) ──► Sprint 2 (Backlog & Sprints) ──► Sprint 3 (Kanban Board)
           ▲                                                        │
           │                                                        ▼
Sprint 6 (Cloud Deploy) ◄── Sprint 5 (DevOps & CI/CD)  ◄── Sprint 4 (Bug Tracking)
```

---

## Sprint 1: Foundation, Authentication & Team Management

* **Goal**: Establish serverless repository architecture, user authentication, and Role-Based Access Control (RBAC).
* **User Stories**:
  * *US-101*: As an administrator, I want to authenticate users using JWT and password hashing so that unauthorized access is blocked.
  * *US-102*: As a Project Manager, I want to create engineering teams and assign roles (PM, Dev, Tester).
* **Engineering Tasks**:
  1. Configure Node.js TypeScript project structure.
  2. Implement bcryptjs hashing with 10 salt rounds.
  3. Create `authMiddleware` and `authorizeRoles()` middleware.
  4. Build registration, login, and `/me` routes.
* **Output Delivered**: Fully operational authentication subsystem with role tokens.
* **Sprint Review**: Verified that developers cannot access administrative endpoints.

---

## Sprint 2: Project Management & Product Backlog

* **Goal**: Enable Project Managers to create projects and maintain prioritized product backlogs.
* **User Stories**:
  * *US-201*: As a Project Manager, I want to create projects with timeline dates and GitHub links.
  * *US-202*: As a Product Owner, I want to create user stories with story point estimations.
* **Engineering Tasks**:
  1. Author `projectController` with automated progress recalculation.
  2. Author `storyController` supporting story points (1, 2, 3, 5, 8, 13).
  3. Author `sprintController` with sprint start/end lifecycle.
* **Output Delivered**: Projects view, backlog management table, and sprint goal planner.
* **Sprint Review**: Enabled filtering of backlog user stories by sprint association.

---

## Sprint 3: Interactive Kanban Task Management

* **Goal**: Implement a responsive 5-column Kanban board with real-time status transitions.
* **User Stories**:
  * *US-301*: As a Developer, I want to view my assigned tasks and transition them across workflow stages.
  * *US-302*: As a Project Manager, I want project completion percentages to dynamically update when tasks are completed.
* **Engineering Tasks**:
  1. Build multi-column board (`TO DO`, `IN PROGRESS`, `REVIEW`, `TESTING`, `COMPLETED`).
  2. Create lightweight `PATCH /api/tasks/:id/status` endpoint.
  3. Wire dynamic progress hook: `completedTasks / totalTasks * 100`.
* **Output Delivered**: Functional Kanban board with transition controls and priority indicators.
* **Sprint Review**: Verified that moving a task to `COMPLETED` immediately updates overall project progress.

---

## Sprint 4: Defect & Bug Tracking Module

* **Goal**: Build a complete defect triage workflow for QA Testers and Developers.
* **User Stories**:
  * *US-401*: As a Tester, I want to report defects with reproduction steps, environment details, and severity.
  * *US-402*: As a Developer, I want to record resolution notes when marking a bug as fixed.
  * *US-403*: As a Tester, I want to verify fixes before closing bugs.
* **Engineering Tasks**:
  1. Create `bugController` with states: `OPEN`, `ASSIGNED`, `IN PROGRESS`, `FIXED`, `VERIFIED`, `CLOSED`.
  2. Build modal for adding resolution explanations.
  3. Implement notifications for reporters and assignees.
* **Output Delivered**: Defect management table, severity metrics, and resolution modal.
* **Sprint Review**: Tested complete QA cycle from defect filing to closure.

---

## Sprint 5: GitHub Telemetry & CI/CD Cloud Build

* **Goal**: Integrate source code version control telemetry and automated Cloud Build pipeline.
* **User Stories**:
  * *US-501*: As a Project Manager, I want to inspect recent GitHub commits inside the system.
  * *US-502*: As a DevOps Engineer, I want automated Cloud Build pipelines that halt if tests fail.
* **Engineering Tasks**:
  1. Author `githubController` with token shielding.
  2. Create `cloudbuild.yaml` multi-stage pipeline.
  3. Author `cicdController` to expose build history and trigger actions.
* **Output Delivered**: GitHub commits view and Cloud Build monitoring page.
* **Sprint Review**: Confirmed that GitHub API tokens are never leaked to frontend JavaScript bundles.

---

## Sprint 6: Cloud Run Deployment, Testing & Documentation

* **Goal**: Deploy containerized application to Google Cloud Run with scale-to-zero settings, execute end-to-end regression tests, and prepare academic reports.
* **User Stories**:
  * *US-601*: As an M.Tech student, I want to deploy to Cloud Run with scale-to-zero for lowest cost risk.
  * *US-602*: As an evaluator, I want 100% automated test coverage and complete architecture documentation.
* **Engineering Tasks**:
  1. Author multi-stage Alpine Dockerfile.
  2. Execute Jest test suite (19/19 passing tests).
  3. Package PowerShell and Bash deployment scripts.
  4. Author comprehensive Markdown documentation.
* **Output Delivered**: Production-ready container image, passing test suite, and final academic project reports.
* **Sprint Review**: Project achieved all 55 project requirements outlined in the course specification.
