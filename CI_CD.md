# DevTrack — CI/CD Pipeline Specification (Google Cloud Build)

This document specifies the automated Continuous Integration and Continuous Deployment (CI/CD) pipeline for **DevTrack**.

---

## 1. Pipeline Workflow Stages

```
Code Push to Git
       │
       ▼
[Stage 1] Install Backend Dependencies (`npm ci`)
       │
       ▼
[Stage 2] Automated Jest Quality Gate (`npm test`)
       │   ├── IF FAILED ──► Terminate Pipeline (No Deployment)
       │   └── IF PASSED ──► Proceed to Stage 3
       ▼
[Stage 3] Install Frontend Dependencies (`npm ci`)
       │
       ▼
[Stage 4] Build Production Frontend Bundle (`vite build`)
       │
       ▼
[Stage 5] Build Multi-Stage Docker Container Image
       │
       ▼
[Stage 6] Push Image to Google Artifact Registry
       │
       ▼
[Stage 7] Deploy Revision to Google Cloud Run (`--min-instances=0`)
       │
       ▼
Live Zero-Downtime Traffic Routing
```

---

## 2. Declarative Definition (`cloudbuild.yaml`)

The pipeline is codified in `cloudbuild.yaml` at the root of the repository:
* Uses official lightweight builder images (`node:22-alpine`, `gcr.io/cloud-builders/docker`, `gcr.io/google.com/cloudsdktool/cloud-sdk`).
* Executes on cost-free `E2_MEDIUM` build machines within the daily 120-minute free-tier allowance.
* Enforces strict quality gate: container compilation never commences unless all 19 automated API tests pass.
