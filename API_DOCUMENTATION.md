# DevTrack — REST API Documentation

Base URL: `/api`  
Authentication: HTTP Bearer Token (`Authorization: Bearer <token>`)

---

## 1. Authentication Endpoints

### Register User
* **Endpoint**: `POST /api/auth/register`
* **Access**: Public
* **Payload**:
  ```json
  {
    "name": "Alex Rivera",
    "email": "alex@devtrack.io",
    "password": "password123",
    "role": "DEVELOPER"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "user_1791317...",
      "name": "Alex Rivera",
      "email": "alex@devtrack.io",
      "role": "DEVELOPER"
    }
  }
  ```

### User Login
* **Endpoint**: `POST /api/auth/login`
* **Access**: Public
* **Payload**:
  ```json
  {
    "email": "pm@devtrack.io",
    "password": "password123"
  }
  ```
* **Response (200 OK)**: Returns JWT bearer token and user profile.

### Current User Profile
* **Endpoint**: `GET /api/auth/me`
* **Access**: Authenticated

---

## 2. Project Endpoints

### List Projects
* **Endpoint**: `GET /api/projects`
* **Access**: Authenticated

### Get Single Project
* **Endpoint**: `GET /api/projects/:id`
* **Access**: Authenticated

### Create Project
* **Endpoint**: `POST /api/projects`
* **Access**: `PROJECT_MANAGER` only
* **Payload**:
  ```json
  {
    "name": "DevTrack Platform",
    "description": "Cloud-native project management system",
    "priority": "HIGH",
    "repositoryUrl": "https://github.com/google/devtrack-demo",
    "startDate": "2026-10-01",
    "endDate": "2026-11-15"
  }
  ```

### Update Project
* **Endpoint**: `PUT /api/projects/:id`
* **Access**: `PROJECT_MANAGER` only

### Delete Project
* **Endpoint**: `DELETE /api/projects/:id`
* **Access**: `PROJECT_MANAGER` only

---

## 3. Agile Sprints & Backlog Endpoints

### List Sprints
* **Endpoint**: `GET /api/sprints?projectId=:projectId`
* **Access**: Authenticated

### Create Sprint
* **Endpoint**: `POST /api/sprints`
* **Access**: `PROJECT_MANAGER` only
* **Payload**:
  ```json
  {
    "projectId": "proj_01",
    "name": "Sprint 2 — Backlog & Kanban",
    "goal": "Deliver interactive task boards",
    "startDate": "2026-10-05",
    "endDate": "2026-10-19",
    "status": "Active"
  }
  ```

### List User Stories (Backlog)
* **Endpoint**: `GET /api/stories?projectId=:projectId&sprintId=:sprintId`
* **Access**: Authenticated

### Create User Story
* **Endpoint**: `POST /api/stories`
* **Access**: `PROJECT_MANAGER` only

---

## 4. Task Management Endpoints

### List Tasks
* **Endpoint**: `GET /api/tasks?projectId=:projectId&status=:status`
* **Access**: Authenticated

### Create Task
* **Endpoint**: `POST /api/tasks`
* **Access**: `PROJECT_MANAGER` or `DEVELOPER`

### Update Task Status (Kanban Transition)
* **Endpoint**: `PATCH /api/tasks/:id/status`
* **Access**: Authenticated
* **Payload**:
  ```json
  {
    "status": "IN PROGRESS"
  }
  ```
* **Allowed Values**: `TO DO`, `IN PROGRESS`, `REVIEW`, `TESTING`, `COMPLETED`
* **Side Effects**: Automatically recalculates Project progress percentage and Sprint progress, and creates an audit activity log entry.

---

## 5. Defect & Bug Tracking Endpoints

### List Bugs
* **Endpoint**: `GET /api/bugs?projectId=:projectId&severity=:severity&status=:status`
* **Access**: Authenticated

### Report Defect
* **Endpoint**: `POST /api/bugs`
* **Access**: Authenticated (`TESTER`, `DEVELOPER`, `PROJECT_MANAGER`)
* **Payload**:
  ```json
  {
    "projectId": "proj_01",
    "title": "Database connection pool timeout",
    "severity": "CRITICAL",
    "priority": "HIGH",
    "environment": "Google Cloud Run",
    "stepsToReproduce": "Trigger 50 concurrent requests",
    "expectedResult": "All requests succeed within 200ms",
    "actualResult": "504 Gateway Timeout"
  }
  ```

### Transition Defect Status & Resolution
* **Endpoint**: `PATCH /api/bugs/:id/status`
* **Access**: Authenticated
* **Payload**:
  ```json
  {
    "status": "FIXED",
    "resolution": "Increased pool limit and added exponential backoff retry"
  }
  ```
* **Allowed Statuses**: `OPEN`, `ASSIGNED`, `IN PROGRESS`, `FIXED`, `VERIFIED`, `CLOSED`, `REOPENED`

---

## 6. Dashboard, GitHub & CI/CD Endpoints

### Compute Dashboard Analytics
* **Endpoint**: `GET /api/dashboard/stats?projectId=:projectId`
* **Access**: Authenticated
* **Response**: Computes real-time KPIs, distributions, and activity feeds directly from database records.

### Fetch GitHub Repository Telemetry
* **Endpoint**: `GET /api/github/repository?url=:url`
* **Access**: Authenticated

### Fetch Cloud Build Pipeline History
* **Endpoint**: `GET /api/cicd/builds`
* **Access**: Authenticated

### Trigger Cloud Build
* **Endpoint**: `POST /api/cicd/trigger`
* **Access**: `PROJECT_MANAGER` only

---

## 7. Standard HTTP Status Codes

| Code | Meaning | Context in DevTrack |
| :--- | :--- | :--- |
| `200 OK` | Success | Successful read or update operation |
| `201 Created` | Resource Created | Successful creation of project, task, sprint, or user |
| `400 Bad Request` | Validation Error | Missing required fields or invalid status enum value |
| `401 Unauthorized` | Auth Required | Missing, invalid, or expired JWT bearer token |
| `403 Forbidden` | RBAC Rejection | User role does not possess permissions for this action |
| `404 Not Found` | Entity Missing | Resource ID does not exist in collection |
| `500 Server Error` | Internal Failure | Unhandled exception (sanitized in production) |
