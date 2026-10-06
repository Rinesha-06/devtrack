# DevTrack — Cost Control & Cloud Billing Optimization Report

> **Academic Project Cost Governance Specification**  
> Target: Google Cloud Free Trial ($300 trial credits, 90-day evaluation period)  
> Enforcement: Scale-to-Zero, Low-Cost Risk Architecture

---

## 1. Architectural Cost Philosophy

In academic cloud computing projects, cost overruns commonly occur when architects inadvertently provision idle infrastructure such as always-running Compute Engine virtual machines, managed Kubernetes clusters (GKE), Cloud NAT gateways, and unmetered load balancers.

DevTrack was engineered from Day 1 under a **Strict Zero-Cost Idle Baseline**:
* If no user is making requests, **active compute infrastructure drops to zero**.
* No permanent VM instances or persistent daemons are provisioned.
* All data tiers utilize pay-per-operation serverless designs.

---

## 2. Resource Risk Classification

### A. LOW COST RISK (Utilized by DevTrack)

| GCP Service | Role in DevTrack | Free-Tier Allowance / Cost Model | Optimization Settings Applied |
| :--- | :--- | :--- | :--- |
| **Cloud Run** | Backend REST API & Frontend SPA | First 2 million requests/month free; 360,000 GB-seconds memory free. | `--min-instances=0`<br>`--max-instances=2`<br>`--memory=512Mi`<br>`--cpu=1`<br>`startup-cpu-boost: true` |
| **Cloud Firestore** | NoSQL Document Database | 1 GB storage free; 50,000 reads, 20,000 writes, and 20,000 deletes daily free. | Documents read on demand with shallow queries; batch updates where applicable. |
| **Artifact Registry** | Docker Container Registry | 0.5 GB per month free storage. | Multi-stage Alpine Docker build creates ultra-compact image (~180 MB); obsolete image cleanup script included. |
| **Cloud Build** | CI/CD Automated Pipeline | First 120 build-minutes per day free on `e2-medium`. | Fast caching and sub-2-minute builds guarantee zero billing. |
| **Cloud Logging** | Structured Application Logs | 50 GB per project/month free. | Informative JSON logging without verbose debug trace spamming. |
| **Cloud Monitoring** | Telemetry & Latency Dashboards | Basic platform metrics free of charge. | Uses default Cloud Run Knative metrics. |

---

### B. HIGH COST RISK (Explicitly Excluded & Prohibited)

The following services have been **strictly blacklisted** from the DevTrack infrastructure to protect the student's credit balance:

* :no_entry_sign: **Google Kubernetes Engine (GKE)**: Avoided ($74/month cluster management fee + minimum VM node costs).
* :no_entry_sign: **Compute Engine VMs**: Avoided (always-on charges even when idle).
* :no_entry_sign: **Cloud NAT & Private Service Access**: Avoided ($32+/month static gateway baseline charges).
* :no_entry_sign: **Managed Cloud SQL (MySQL / Postgres)**: Avoided ($25-$80/month continuous instance reservation fee).
* :no_entry_sign: **Static External IP Addresses**: Avoided ($7+/month reservation penalty if unattached).
* :no_entry_sign: **Global HTTP(S) External Load Balancers**: Avoided ($18+/month baseline rule charge; Cloud Run native HTTPS domain is used instead).

---

## 3. Projected Monthly Spending Analysis

Assuming typical academic demonstration workload (10 demo runs, 500 test requests, 5 CI/CD builds):

| Component | Usage Volume | Standard GCP Rate | Net Estimated Cost |
| :--- | :--- | :--- | :--- |
| Cloud Run Invocations | ~1,500 requests | $0.40 / million | **$0.00** (Within Free Tier) |
| Cloud Run vCPU / Memory | ~400 vCPU-seconds | Free allowance: 180,000 vCPU-s | **$0.00** (Within Free Tier) |
| Cloud Firestore Reads/Writes | ~3,000 operations | Free allowance: 50,000/day | **$0.00** (Within Free Tier) |
| Artifact Registry Storage | ~0.25 GB | Free allowance: 0.5 GB/month | **$0.00** (Within Free Tier) |
| Cloud Build Minutes | ~8 build-minutes | Free allowance: 120 mins/day | **$0.00** (Within Free Tier) |
| **Total Estimated Expense** | — | — | **$0.00 / month** |

---

## 4. Teardown & Post-Evaluation Cleanup

When the academic evaluation or viva is complete, all cloud resources can be completely de-provisioned using the provided script:

```powershell
# Windows PowerShell
.\scripts\cleanup.ps1
```

```bash
# Linux / macOS
./scripts/cleanup.sh
```

This ensures zero lingering storage or registry fees occur over the remainder of the 90-day trial period.
