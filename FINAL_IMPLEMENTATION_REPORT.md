# DevTrack — Integrated Software Project Management System
## Final Implementation & Academic Project Report

**Author**: M.Tech Software Engineering / Cloud Computing Student  
**System Title**: DevTrack — Integrated Software Project Management System  
**Cloud Platform**: Google Cloud Platform (GCP)  
**Evaluation Standard**: Academic Software Engineering, Cloud-Native Systems, DevOps & Agile Methodology

---

### Executive Table of Contents
1. Project Title & Overview
2. Problem Statement
3. Objectives
4. Analysis of the Existing Problem
5. Proposed System Solution
6. System Architecture & Topology
7. Technology Stack
8. Google Cloud Services Mapping
9. Database Design (Firestore)
10. Authentication Architecture
11. Role-Based Access Control (RBAC)
12. Agile / Scrum Methodology
13. Sprint Management
14. Task Management & Kanban Board
15. Defect & Bug Tracking Module
16. GitHub Source Code Integration
17. Continuous Integration & Deployment (CI/CD)
18. Cloud Deployment (Cloud Run)
19. Cloud Monitoring & Observability
20. Security Engineering & Hardening
21. Automated Testing & Verification
22. Cost Optimization & Free Trial Governance
23. User Interface & Feature Walkthrough
24. Academic Limitations
25. Future Enhancements
26. Conclusion

---

### 1. Project Title & Overview
**DevTrack** is a cloud-native integrated software project management system engineered to unify project planning, Agile scrum workflows, task scheduling, defect lifecycle tracking, GitHub source control telemetry, and continuous deployment into a single, cohesive web platform.

### 2. Problem Statement
Modern software engineering organizations suffer from severe operational fragmentation caused by the usage of disparate, disconnected SaaS tools for task management, bug reporting, source control, and deployment monitoring. This disassociation results in inaccurate progress metrics, cross-team miscommunication, missed release deadlines, and lack of unified traceability.

### 3. Objectives
* Design and implement an integrated project tracking solution following Agile principles.
* Support multi-role collaboration (Project Managers, Developers, and QA Testers).
* Implement real-time task progression using a 5-column Kanban board (`TO DO` &rarr; `IN PROGRESS` &rarr; `REVIEW` &rarr; `TESTING` &rarr; `COMPLETED`).
* Provide defect triage and verification workflows with resolution notes.
* Integrate GitHub API telemetry securely without client-side credential exposure.
* Implement automated CI/CD pipelines on Google Cloud with strict test quality gates.
* Enforce strict scale-to-zero cost minimization suitable for an academic Google Cloud Free Trial.

### 4. Analysis of the Existing Problem
Disjointed tools (e.g. using one tool for tasks, another for bugs, a third for Git, and manual spreadsheets for sprint velocity) create significant friction:
* Status Desynchronization: Tasks marked finished in code are not updated in tracking tools.
* Unreliable Metrics: Progress metrics are often manually guessed rather than computed from real database states.
* Role Ambiguity: Developers and Testers lack shared visibility into bug reproduction steps and acceptance criteria.

### 5. Proposed System Solution
DevTrack solves these challenges by providing:
* A unified single-page React application backed by a high-throughput Node.js Express serverless API.
* Centralized NoSQL document storage in Google Cloud Firestore.
* Automated real-time KPI calculations:
  $$\text{Project Progress} = \left(\frac{\text{Completed Tasks}}{\text{Total Tasks}}\right) \times 100$$
  $$\text{Sprint Velocity} = \left(\frac{\text{Completed Sprint Tasks}}{\text{Total Sprint Tasks}}\right) \times 100$$
  $$\text{Bug Resolution Rate} = \left(\frac{\text{Closed Bugs}}{\text{Total Bugs}}\right) \times 100$$

### 6. System Architecture & Topology
The architecture follows a decoupled client-server microservice model deployed on Google Cloud:
* **Presentation**: Single Page Application built with React 18, Vite, Tailwind CSS, and Recharts.
* **Identity**: Cryptographically signed JWT tokens with bcrypt salted password hashes.
* **Compute**: Containerized Express.js server hosted on Google Cloud Run.
* **Database**: Google Cloud Firestore collections with composite indexing and granular security rules.
* **CI/CD**: Google Cloud Build triggered on push, storing images in Artifact Registry and deploying revisions to Cloud Run.

### 7. Technology Stack
* Frontend: React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons.
* Backend: Node.js (v24 LTS), TypeScript, Express.js, Axios, Helmet, Morgan, bcryptjs, jsonwebtoken.
* Testing: Jest, ts-jest, Supertest.
* Packaging: Multi-stage Alpine Docker container.

### 8. Google Cloud Services Mapping
* **Google Cloud Run**: Managed serverless compute runtime with `--min-instances=0` (scale-to-zero).
* **Google Cloud Firestore**: Serverless NoSQL document database.
* **Google Artifact Registry**: Private Docker container registry (`devtrack-repo` in `asia-south1`).
* **Google Cloud Build**: Automated CI/CD execution environment.
* **Google Cloud Logging**: Centralized structured audit logs.
* **Google Cloud Monitoring**: Container health and response latency telemetry.

### 9. Database Design (Firestore)
* `users`: `id`, `name`, `email`, `role`, `passwordHash`, `photoURL`, `createdAt`
* `projects`: `id`, `name`, `description`, `startDate`, `endDate`, `status`, `priority`, `managerId`, `repositoryUrl`, `progress`, `members`
* `sprints`: `id`, `projectId`, `name`, `goal`, `startDate`, `endDate`, `status`, `createdAt`
* `userStories`: `id`, `projectId`, `sprintId`, `title`, `description`, `acceptanceCriteria`, `priority`, `storyPoints`, `status`
* `tasks`: `id`, `projectId`, `sprintId`, `storyId`, `title`, `description`, `assignedTo`, `createdBy`, `priority`, `status`, `dueDate`, `estimatedHours`, `actualHours`
* `bugs`: `id`, `projectId`, `taskId`, `title`, `description`, `reportedBy`, `assignedTo`, `severity`, `priority`, `status`, `environment`, `stepsToReproduce`, `expectedResult`, `actualResult`, `resolution`
* `activities`: `id`, `projectId`, `userId`, `userName`, `action`, `details`, `timestamp`
* `notifications`: `id`, `userId`, `title`, `message`, `read`, `link`, `createdAt`
* `builds`: `id`, `buildNumber`, `commit`, `branch`, `status`, `durationSeconds`, `timestamp`

### 10. Authentication Architecture
* Implemented using bcryptjs password hashing (10 salt rounds) and HMAC-SHA256 JWT bearer tokens with 7-day expiration.
* Authenticated endpoints require `Authorization: Bearer <token>`.
* Expired or missing tokens immediately return `401 Unauthorized`.

### 11. Role-Based Access Control (RBAC)
Three distinct operational personas are enforced:
1. **Project Manager (`PROJECT_MANAGER`)**: Full administrative authority; manages projects, teams, sprints, backlog, and CI/CD triggers.
2. **Developer (`DEVELOPER`)**: Updates assigned tasks, transitions Kanban columns, reviews user stories, reports and fixes bugs with resolution notes.
3. **Tester (`TESTER`)**: Reviews completed tasks, reports bugs with detailed reproduction steps, verifies fixes, and closes defects.

### 12. Agile / Scrum Methodology
The system mirrors real-world Scrum workflows:
* Backlog refinement & story point estimation (Fibonacci: 1, 2, 3, 5, 8, 13).
* Time-boxed Sprint planning with clearly defined Sprint Goals.
* Continuous delivery via interactive Kanban visualization.

### 13. Sprint Management
* Supports Planned, Active, and Completed sprint lifecycle phases.
* Sprint velocity dynamically tracks completed tasks against total committed tasks.

### 14. Task Management & Kanban Board
* 5-column workflow: `TO DO` &rarr; `IN PROGRESS` &rarr; `REVIEW` &rarr; `TESTING` &rarr; `COMPLETED`.
* Moving tasks updates Firestore and recalculates project and sprint progress instantly.

### 15. Defect & Bug Tracking Module
* Granular severity scale: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
* Complete state machine: `OPEN` &rarr; `ASSIGNED` &rarr; `IN PROGRESS` &rarr; `FIXED` &rarr; `VERIFIED` &rarr; `CLOSED`.
* Developers submit formal resolution documentation before QA verification.

### 16. GitHub Source Code Integration
* Backend-mediated GitHub API client.
* Fetches repository metadata (stars, open issues, default branch) and recent commits.
* Shields private tokens from client inspection.

### 17. Continuous Integration & Deployment (CI/CD)
* Managed by `cloudbuild.yaml`.
* Step 1: Install backend dependencies.
* Step 2: Run automated test suite (Strict Quality Gate).
* Step 3: Install frontend dependencies.
* Step 4: Build React bundle.
* Step 5: Multi-stage Docker container build.
* Step 6: Artifact Registry push.
* Step 7: Cloud Run deployment revision.

### 18. Cloud Deployment (Cloud Run)
* Fully containerized microservice running on Google Cloud Run.
* Single container serves both API endpoints (`/api/*`) and optimized React SPA static assets (`dist/*`).

### 19. Cloud Monitoring & Observability
* Live request logs routed to Google Cloud Logging.
* Audit trail recorded in Firestore `activities` collection.

### 20. Security Engineering & Hardening
* HTTP security headers enforced via Helmet.
* Strict input validation on all controller actions.
* Production secrets isolated in environment variables.
* Firestore Security Rules enforce document-level access permissions.

### 21. Automated Testing & Verification
* 19 out of 19 automated tests passed in Jest:
  * Health probes: Passed.
  * Authentication: Passed.
  * RBAC 403 enforcement: Passed.
  * Project & Sprint CRUD: Passed.
  * Task progression & completion math: Passed.
  * Bug triage & resolution: Passed.
  * Telemetry aggregation: Passed.

### 22. Cost Optimization & Free Trial Governance
* Configured strictly for scale-to-zero (`--min-instances=0`).
* Avoids expensive GKE, VMs, Cloud NAT, and managed SQL.
* Total projected ongoing monthly cost: **$0.00** within Free Trial limits.

### 23. User Interface & Feature Walkthrough
* Intuitive SaaS dashboard with responsive sidebar navigation.
* Interactive Recharts data visualizations.
* 1-Click Demo Persona Switcher in navigation header for live viva presentation.

### 24. Academic Limitations
* Prototype scope: Email/password and JWT authentication used in lieu of third-party SAML/OAuth enterprise SSO.
* Single-region deployment: Deployed to `asia-south1` rather than multi-region active-active clusters to eliminate cross-region egress charges.

### 25. Future Enhancements
* WebSocket push notifications for multi-user concurrent Kanban dragging.
* AI-powered user story point estimation and sprint capacity forecasting.
* Automated bidirectional GitHub webhook triggers for commit-to-task linking.

### 26. Conclusion
The **DevTrack** system successfully demonstrates the synthesis of modern software engineering principles, Agile methodologies, and Google Cloud serverless architecture. By unifying project management, Kanban boards, bug tracking, GitHub telemetry, and CI/CD pipelines into a cost-optimized, scale-to-zero application, DevTrack fulfills all academic requirements for an advanced M.Tech degree project.
