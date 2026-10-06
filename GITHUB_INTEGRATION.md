# DevTrack — GitHub Integration Architecture & Security

This guide details how **DevTrack** connects to GitHub for version control telemetry while preserving security best practices.

---

## 1. Architectural Model

```
Browser Client (React UI)
       │
       │ (1) Request repository metadata
       ▼
Cloud Run Backend (Express.js)
       │
       │ (2) Server-to-server call with optional GITHUB_TOKEN
       ▼
GitHub REST API v3 (api.github.com)
```

### Key Security Safeguards:
1. **Zero Client Token Exposure**: The frontend bundle never receives or stores GitHub tokens.
2. **Reverse Proxy Pattern**: All requests are routed through `/api/github/repository` and `/api/github/commits`.
3. **Graceful Fallback**: If GitHub rate limits occur or network access is offline, the backend returns grounded repository data so the application never fails during presentations.

---

## 2. Configuration

To connect private repositories or increase GitHub API rate limits from 60 to 5,000 requests/hour:
1. Generate a Personal Access Token on GitHub with `repo:status` and `public_repo` read scopes.
2. Set the `GITHUB_TOKEN` environment variable in your `.env` file or Cloud Run service configuration:
   ```bash
   GITHUB_TOKEN=ghp_yourTokenHere
   ```
