# ☁️ Cloud-Native Platform — Production-Grade Microservices on AWS EKS

A complete, production-style cloud-native platform built from scratch using Kubernetes, GitOps, and Infrastructure as Code. This project demonstrates a full end-to-end DevOps workflow — from writing code locally to automated deployment on AWS using industry-standard tooling.

---

## 📌 Project Overview

This platform runs three microservices on AWS EKS, managed entirely through a GitOps workflow. A developer pushing code triggers an automated CI pipeline that builds Docker images, pushes them to ECR, updates the GitOps repository, and ArgoCD automatically deploys the changes to Kubernetes — with zero manual `kubectl apply` commands.

The entire AWS infrastructure is provisioned with Terraform, applications are packaged with Helm, and the system is monitored with Prometheus and Grafana.

---

## 🗂️ Repository Structure

This monorepo contains three components, each representing a separate concern:

```
cloud-native-platform/
├── app-repo/                        ← Microservices source code + CI pipeline
│   ├── user-service/
│   │   ├── src/
│   │   │   ├── index.js
│   │   │   └── index.test.js
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── product-service/
│   │   ├── src/
│   │   │   ├── index.js
│   │   │   └── index.test.js
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── order-service/
│   │   ├── src/
│   │   │   ├── index.js
│   │   │   └── index.test.js
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── docker-compose.yml
│   └── .github/workflows/ci.yaml
│
├── infra-repo/                      ← AWS infrastructure (Terraform)
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── versions.tf
│   └── modules/
│       ├── vpc/
│       └── eks/
│
└── gitops-repo/                     ← Helm charts + ArgoCD applications
    ├── charts/
    │   └── microservice/            ← Reusable Helm chart for all services
    │       ├── Chart.yaml
    │       ├── values.yaml
    │       └── templates/
    │           ├── deployment.yaml
    │           ├── service.yaml
    │           └── hpa.yaml
    ├── values/                      ← Per-service value overrides
    │   ├── user-service.yaml
    │   ├── product-service.yaml
    │   └── order-service.yaml
    ├── environments/
    │   └── dev/                     ← ArgoCD Application CRDs
    │       ├── user-service.yaml
    │       ├── product-service.yaml
    │       └── order-service.yaml
    └── apps/
        └── monitoring/
            └── servicemonitors.yaml
```

---

## 🏗️ Architecture Diagram

> 📷 _Insert architecture diagram here_

---

## ⚙️ Tech Stack

| Category | Technology | Purpose |
|---|---|---|
| Cloud Provider | AWS | Hosting all infrastructure |
| Container Runtime | Docker | Build and package applications |
| Orchestration | Kubernetes (EKS) | Run and manage containers at scale |
| Infrastructure as Code | Terraform | Provision AWS resources repeatably |
| Container Registry | Amazon ECR | Store Docker images privately |
| CI Pipeline | GitHub Actions | Automate test, build, push on every commit |
| GitOps | ArgoCD | Automated, Git-driven deployments |
| App Packaging | Helm | Template and manage K8s manifests |
| Observability | Prometheus + Grafana | Metrics collection, dashboards, alerting |
| Load Balancing | AWS ELB | Expose services to the internet |
| Networking | VPC, Subnets, NAT Gateway | Secure network topology |

---

## 🔄 End-to-End CI/CD Flow

```
Developer pushes code to app-repo
          │
          ▼
GitHub Actions triggers
          │
    ┌─────┴──────┐
    │  Run Tests  │  ← 3 services tested in parallel
    └─────┬──────┘
          │ (only if all tests pass)
          ▼
    Build Docker image
    Tag with git commit SHA
          │
          ▼
    Push to Amazon ECR
          │
          ▼
    Update image tag in gitops-repo
          │
          ▼
    ArgoCD detects drift (polls every 3 min)
          │
          ▼
    Auto-sync to EKS cluster
          │
          ▼
    Rolling update — zero downtime deployment ✅
```

---

## 📦 Microservices

| Service | Port | Description | Calls |
|---|---|---|---|
| user-service | 3001 | User management REST API | — |
| product-service | 3002 | Product catalog REST API | — |
| order-service | 3003 | Order processing API | user-service, product-service |

### API Endpoints

**user-service**
```
GET  /health          → service health check
GET  /users           → list all users
GET  /users/:id       → get user by ID
POST /users           → create new user
```

**product-service**
```
GET  /health          → service health check
GET  /products        → list all products
GET  /products/:id    → get product by ID
```

**order-service**
```
GET  /health          → service health check
GET  /orders          → list all orders
POST /orders          → create order (validates user + product via service calls)
```

---

## ✅ Prerequisites

Make sure you have all of these installed before starting:

| Tool | Version | Install |
|---|---|---|
| Node.js | 18+ | https://nodejs.org |
| Docker Desktop | 20+ | https://docker.com |
| kubectl | 1.28+ | https://kubernetes.io/docs/tasks/tools |
| Kind | latest | https://kind.sigs.k8s.io |
| Helm | 3+ | https://helm.sh |
| Terraform | 1.6+ | https://terraform.io |
| AWS CLI | 2+ | https://aws.amazon.com/cli |
| Git | any | https://git-scm.com |

You also need:
- An **AWS account** with programmatic access (Access Key + Secret Key)
- A **GitHub account** with three repos created:
  - `app-repo`
  - `infra-repo`
  - `gitops-repo`
- A **GitHub Personal Access Token** (PAT) with `repo` scope

---

## 🚀 Full Setup Guide

### Phase 1 — Local Development

#### Step 1 — Clone and run locally

```bash
git clone https://github.com/ahsanch116/Cloud-native-platform.git
cd Cloud-native-platform/app-repo

# Install dependencies for all services
cd user-service    && npm install && cd ..
cd product-service && npm install && cd ..
cd order-service   && npm install && cd ..

# Run all services with Docker Compose
docker compose up --build
```

#### Step 2 — Test the services locally

```powershell
# Health checks
Invoke-RestMethod -Uri "http://localhost:3001/health"
Invoke-RestMethod -Uri "http://localhost:3002/health"
Invoke-RestMethod -Uri "http://localhost:3003/health"

# Create an order (tests inter-service communication)
Invoke-RestMethod -Uri "http://localhost:3003/orders" `
  -Method POST -ContentType "application/json" `
  -Body '{"userId":1,"productId":2,"quantity":2}'
```

#### Step 3 — Deploy to local Kubernetes (Kind)

```bash
# Create local cluster
kind create cluster --name platform-local

# Build and load images into Kind
docker build -t user-service:v1    ./user-service
docker build -t product-service:v1 ./product-service
docker build -t order-service:v1   ./order-service

kind load docker-image user-service:v1    --name platform-local
kind load docker-image product-service:v1 --name platform-local
kind load docker-image order-service:v1   --name platform-local

# Deploy to local K8s
kubectl apply -f k8s/

# Watch pods come up
kubectl get pods -w

# Port-forward and test
kubectl port-forward service/order-service 3003:3003
```

---

### Phase 2 — AWS Infrastructure with Terraform

#### Step 1 — Configure AWS credentials

```bash
aws configure
# Enter: Access Key ID, Secret Access Key, region: us-east-1, output: json

# Verify
aws sts get-caller-identity
```

#### Step 2 — Create S3 bucket for Terraform state

```bash
aws s3api create-bucket \
  --bucket platform-terraform-state-YOUR_ACCOUNT_ID \
  --region us-east-1

aws s3api put-bucket-versioning \
  --bucket platform-terraform-state-YOUR_ACCOUNT_ID \
  --versioning-configuration Status=Enabled
```

#### Step 3 — Provision EKS cluster

```bash
cd infra-repo

terraform init
terraform plan      # review what will be created
terraform apply     # type yes — takes 12-15 minutes
```

#### Step 4 — Connect kubectl to EKS

```bash
aws eks update-kubeconfig --region us-east-1 --name platform-cluster

# Verify connection
kubectl get nodes
```

---

### Phase 3 — Push Images to ECR

```bash
# Create ECR repositories
aws ecr create-repository --repository-name user-service    --region us-east-1
aws ecr create-repository --repository-name product-service --region us-east-1
aws ecr create-repository --repository-name order-service   --region us-east-1

# Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build, tag, push all services
cd app-repo

docker build -t user-service:v1 ./user-service
docker tag  user-service:v1 YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/user-service:v1
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/user-service:v1

docker build -t product-service:v1 ./product-service
docker tag  product-service:v1 YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/product-service:v1
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/product-service:v1

docker build -t order-service:v1 ./order-service
docker tag  order-service:v1 YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/order-service:v1
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/order-service:v1
```

---

### Phase 4 — GitHub Actions CI Pipeline

#### Step 1 — Add secrets to app-repo

Go to `app-repo` → Settings → Secrets and variables → Actions → New repository secret

| Secret | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | Your IAM access key |
| `AWS_SECRET_ACCESS_KEY` | Your IAM secret key |
| `AWS_REGION` | `us-east-1` |
| `AWS_ACCOUNT_ID` | Your AWS account ID |
| `GITOPS_REPO_TOKEN` | Your GitHub PAT |

#### Step 2 — Trigger CI

```bash
cd app-repo
git add .
git commit -m "trigger ci"
git push origin main
```

Go to GitHub → app-repo → Actions → watch the pipeline run.

---

### Phase 5 — ArgoCD GitOps

#### Step 1 — Install ArgoCD

```bash
kubectl create namespace argocd
kubectl create namespace platform

kubectl apply -n argocd \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for all pods to be Running
kubectl get pods -n argocd -w
```

#### Step 2 — Add GitHub credentials (for private gitops-repo)

```bash
kubectl -n argocd create secret generic gitops-repo-creds \
  --from-literal=url=https://github.com/ahsanch116/gitops-repo.git \
  --from-literal=username=ahsanch116 \
  --from-literal=password=YOUR_GITHUB_PAT \
  --from-literal=type=git

kubectl -n argocd label secret gitops-repo-creds \
  argocd.argoproj.io/secret-type=repository
```

#### Step 3 — Get admin password and open UI

```powershell
# Get password
$encoded = kubectl -n argocd get secret argocd-initial-admin-secret `
  -o jsonpath="{.data.password}"
[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($encoded))

# Open UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Visit: https://localhost:8080
# Username: admin | Password: output from above
```

#### Step 4 — Deploy applications

```bash
cd gitops-repo
kubectl apply -f environments/dev/

# Watch pods appear
kubectl get pods -n platform -w
```

---

### Phase 6 — Helm Charts

```bash
cd gitops-repo

# Validate chart renders correctly
helm template user-service charts/microservice \
  -f values/user-service.yaml --namespace platform

helm template product-service charts/microservice \
  -f values/product-service.yaml --namespace platform

helm template order-service charts/microservice \
  -f values/order-service.yaml --namespace platform
```

---

### Phase 7 — Prometheus + Grafana

#### Step 1 — Install monitoring stack

```bash
helm repo add prometheus-community \
  https://prometheus-community.github.io/helm-charts
helm repo update

kubectl create namespace monitoring

helm install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set grafana.adminPassword=admin123 \
  --set prometheus.prometheusSpec.scrapeInterval=15s \
  --set grafana.service.type=LoadBalancer \
  --wait

# Watch pods come up
kubectl get pods -n monitoring -w
```

#### Step 2 — Access Grafana

```bash
kubectl get svc -n monitoring monitoring-grafana
# Open EXTERNAL-IP in browser
# Username: admin | Password: admin123
```

#### Step 3 — Apply ServiceMonitor

```bash
kubectl apply -f gitops-repo/apps/monitoring/servicemonitors.yaml
```

#### Step 4 — Key Grafana PromQL queries

```promql
# Request rate per service
sum(rate(http_requests_total[5m])) by (pod)

# P95 response time
histogram_quantile(0.95,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le, pod))

# Orders per minute
rate(orders_created_total[1m]) * 60

# Total revenue
order_revenue_total

# Pod memory usage
container_memory_working_set_bytes{namespace="platform"}
```

---

## 📋 Operations Runbook

### Daily commands

```bash
# Check cluster health
kubectl get nodes
kubectl get pods -n platform
kubectl get pods -n argocd

# Check service endpoints
kubectl get svc -n platform

# View logs for a service
kubectl logs -l app=order-service -n platform --tail=50

# Describe a pod (debugging)
kubectl describe pod <pod-name> -n platform
```

### Rebuild infrastructure after destroying

```bash
# 1. Rebuild EKS cluster
cd infra-repo
terraform apply --auto-approve

# 2. Reconnect kubectl
aws eks update-kubeconfig --region us-east-1 --name platform-cluster

# 3. Recreate namespaces
kubectl create namespace argocd
kubectl create namespace platform

# 4. Reinstall ArgoCD
kubectl apply -n argocd \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 5. Re-add GitHub credentials
kubectl -n argocd create secret generic gitops-repo-creds \
  --from-literal=url=https://github.com/ahsanch116/gitops-repo.git \
  --from-literal=username=ahsanch116 \
  --from-literal=password=YOUR_GITHUB_PAT \
  --from-literal=type=git
kubectl -n argocd label secret gitops-repo-creds \
  argocd.argoproj.io/secret-type=repository

# 6. Re-authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# 7. Deploy applications
cd gitops-repo
kubectl apply -f environments/dev/

# 8. Reinstall monitoring
helm install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace \
  --set grafana.adminPassword=admin123 \
  --set grafana.service.type=LoadBalancer
```

### Destroy everything (cost saving)

```bash
cd infra-repo
terraform destroy --auto-approve
```

### Force ArgoCD to sync immediately

```bash
# Via CLI (install argocd CLI first)
argocd app sync user-service
argocd app sync product-service
argocd app sync order-service

# Or via UI: open app → click SYNC
```

### Test self-healing

```bash
# Delete a pod and watch ArgoCD recreate it
kubectl delete pod -l app=user-service -n platform
kubectl get pods -n platform -w

# Manually scale to 0 — ArgoCD will revert it within 3 minutes
kubectl scale deployment user-service --replicas=0 -n platform
kubectl get pods -n platform -w
```

### Rollback a deployment

```bash
# In GitOps, rollback = revert the Git commit
cd gitops-repo
git revert HEAD
git push origin main
# ArgoCD auto-deploys the previous version
```

---

## 💰 Cost Awareness

| Resource | Cost |
|---|---|
| EKS control plane | ~$0.10/hr |
| 2x t2.micro nodes | ~$0.024/hr |
| NAT Gateway | ~$0.045/hr |
| ELB | ~$0.025/hr |
| **Total while running** | **~$6-8/day** |

> Always run `terraform destroy` after each session to avoid unnecessary charges.
> ECR image storage and S3 state storage cost cents per month — safe to leave running.

---

---

# 📚 Learning Outcomes

## Technologies Used

### Docker
**Definition:** A platform for packaging applications and their dependencies into lightweight, portable containers that run consistently across any environment.

**Concepts learned:**
- Writing multi-stage `Dockerfile` builds
- Using `node:18-alpine` base image for smaller, more secure images
- Running containers as non-root users (security best practice)
- Docker Compose for multi-container local development
- Health checks in Docker Compose with `condition: service_healthy`
- Building and tagging images with semantic versions and git SHAs

---

### Kubernetes
**Definition:** An open-source container orchestration system that automates deployment, scaling, and management of containerized applications.

**Concepts learned:**
- **Pod** — smallest deployable unit, wraps one or more containers
- **Deployment** — declares desired pod count and manages rolling updates
- **Service** — stable DNS name and load balancer for a set of pods
- **Namespace** — logical isolation of resources within a cluster
- **ClusterIP** — service only reachable inside the cluster
- **NodePort** — service exposed on a port of every node
- **LoadBalancer** — service that provisions a cloud load balancer
- **Liveness probe** — K8s restarts pod if this HTTP check fails
- **Readiness probe** — K8s stops routing traffic if this check fails
- **HPA (Horizontal Pod Autoscaler)** — scales pods based on CPU/memory
- **Resource requests and limits** — preventing resource starvation
- **ConfigMap** — storing non-sensitive configuration
- **RBAC** — Role-Based Access Control for cluster security
- **CoreDNS** — internal DNS that resolves `service-name.namespace.svc.cluster.local`
- Self-healing: K8s automatically recreates deleted or crashed pods

---

### AWS EKS (Elastic Kubernetes Service)
**Definition:** AWS-managed Kubernetes service that runs the control plane for you, letting you focus on worker nodes and workloads.

**Concepts learned:**
- Difference between control plane (managed by AWS) and worker nodes (your EC2s)
- Private subnets for worker nodes — nodes never directly exposed to internet
- Public subnets for load balancers — only entry point is the ELB
- NAT Gateway — lets private nodes reach internet (for ECR pulls) without being reachable
- EKS Access Entries — modern IAM-to-Kubernetes RBAC mapping (replaces aws-auth ConfigMap)
- `aws eks update-kubeconfig` — configures local kubectl to talk to EKS
- Node groups — managed pools of EC2 instances as Kubernetes workers

---

### Terraform
**Definition:** Infrastructure as Code (IaC) tool that lets you define cloud infrastructure in declarative configuration files and manage it through a lifecycle of create, update, destroy.

**Concepts learned:**
- **Provider** — plugin that talks to a cloud API (hashicorp/aws)
- **Resource** — a piece of infrastructure (VPC, subnet, EKS cluster)
- **Module** — reusable group of resources (vpc module, eks module)
- **Variables** — parameterize modules for reuse
- **Outputs** — expose values after apply (cluster endpoint, VPC ID)
- **State file** — Terraform's record of what it created (never commit to Git)
- **S3 backend** — store state file remotely for team access and safety
- **`terraform plan`** — preview changes before applying (always run this)
- **`terraform apply`** — create or update infrastructure
- **`terraform destroy`** — tear down all managed resources
- Dependency graph — Terraform resolves resource creation order automatically

---

### GitHub Actions
**Definition:** CI/CD platform built into GitHub that runs automated workflows triggered by Git events like pushes and pull requests.

**Concepts learned:**
- **Workflow** — YAML file defining automation (`.github/workflows/`)
- **Trigger** — what starts the workflow (`on: push`, `on: pull_request`)
- **Job** — a unit of work that runs on a runner machine
- **Step** — individual command within a job
- **Matrix strategy** — run the same job in parallel for multiple values (3 services simultaneously)
- **`needs`** — job dependency (build only runs after tests pass)
- **Secrets** — encrypted variables for credentials (AWS keys, GitHub PAT)
- **`actions/checkout`** — clones your repo into the runner
- **`aws-actions/configure-aws-credentials`** — sets up AWS CLI in the runner
- Caching `node_modules` to speed up subsequent runs
- Using git commit SHA as Docker image tag for full traceability

---

### ArgoCD
**Definition:** A declarative GitOps continuous delivery tool for Kubernetes that keeps cluster state in sync with a Git repository.

**Concepts learned:**
- **GitOps** — Git is the single source of truth for cluster state
- **Application CRD** — ArgoCD's custom resource that defines what repo/path to watch
- **Sync** — ArgoCD applies manifests from Git to the cluster
- **Self-heal** — ArgoCD reverts manual `kubectl` changes automatically
- **Prune** — ArgoCD deletes resources removed from Git
- **Drift detection** — ArgoCD polls Git every 3 minutes and detects differences
- **Healthy / Synced / OutOfSync** — ArgoCD application states
- Why GitOps beats manual `kubectl apply`: audit trail, rollback = git revert, no snowflake clusters

---

### Helm
**Definition:** Kubernetes package manager that uses templates and value files to generate Kubernetes YAML, enabling reuse and environment-specific configuration.

**Concepts learned:**
- **Chart** — a collection of templates and default values
- **Values** — variables that get injected into templates at render time
- **`Release.Name`** — the name given to a Helm deployment
- **Template syntax** — `{{ .Values.image.tag }}`, `{{- if .Values.autoscaling.enabled }}`
- **`helm template`** — render chart to YAML without deploying (for validation)
- **`helm install`** — deploy a chart to a cluster
- **`helm upgrade`** — update a running release
- **valueFiles** — override default values per environment or service
- Why Helm: one template serves all services — change probe timing in one place, all services update

---

### Prometheus
**Definition:** Open-source monitoring system that scrapes metrics from HTTP endpoints at regular intervals and stores them as time-series data.

**Concepts learned:**
- **Scraping** — Prometheus pulls metrics from `/metrics` endpoints every 15s
- **PromQL** — Prometheus Query Language for querying time-series data
- **Counter** — metric that only increases (total requests, total errors)
- **Histogram** — metric that tracks distributions (response time buckets)
- **Labels** — key-value pairs that add dimensions to metrics (pod, route, status_code)
- **ServiceMonitor** — Prometheus Operator CRD that tells Prometheus what to scrape
- **PrometheusRule** — defines alerting rules
- `rate()` — calculates per-second rate over a time window
- `histogram_quantile()` — calculates percentile (P95, P99) from histogram data
- Business metrics vs system metrics — tracking `orders_created_total` alongside CPU

---

### Grafana
**Definition:** Open-source analytics and visualization platform that queries data sources like Prometheus and renders interactive dashboards.

**Concepts learned:**
- Connecting Prometheus as a data source
- Building panels with PromQL queries
- Visualization types: Time series, Stat, Gauge, Bar chart
- Dashboard as code — dashboards can be exported as JSON and version controlled
- Alerting rules — fire notifications when thresholds are breached

---

## Key DevOps Concepts Learned

### The 12-Factor App
Applications should read config from environment variables, not hardcoded values. The order-service uses `USER_SERVICE_URL` env var — same code runs locally, in Docker, and in Kubernetes by just changing the variable.

### Infrastructure as Code (IaC)
Every cloud resource is defined in version-controlled code. No clicking in the AWS console. The entire platform can be destroyed and rebuilt identically in 15 minutes.

### GitOps
Git is the single source of truth for both application code and infrastructure state. All changes go through Git, giving a full audit trail and making rollback as simple as `git revert`.

### Immutable Infrastructure
Instead of updating a running container, you build a new image, push it, and replace the old container. The old image is never modified.

### Separation of Concerns (Three-Repo Pattern)
- `app-repo` — developers own this, focused on business logic
- `infra-repo` — platform team owns this, focused on AWS resources
- `gitops-repo` — ArgoCD owns this, it's the desired state of the cluster

### Zero-Downtime Deployments
Kubernetes rolling updates replace pods one at a time. Readiness probes ensure new pods are healthy before traffic is routed to them. Old pods are only removed after new ones are confirmed ready.

### Observability (The Three Pillars)
- **Metrics** (Prometheus) — what is happening, measured as numbers
- **Logs** (kubectl logs) — what happened, as text events
- **Traces** — how a request moved through services (Phase 8: Istio)

### Defense in Depth (Security Layers)
- Worker nodes in private subnets — not reachable from internet
- Only ELB in public subnet — single controlled entry point
- Non-root Docker containers — limits blast radius if exploited
- ECR private registry — images not publicly accessible
- IAM roles with least privilege — nodes only have ECR read access

---

*Built with ❤️ as a portfolio project demonstrating production-grade DevOps practices.*
