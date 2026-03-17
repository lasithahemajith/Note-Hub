# 📝 NoteHub – Microservices Note-Taking Platform

A production-style, **lightweight microservices platform** for taking notes, built for learning DevOps practices. Designed to run on an **8GB RAM laptop** while demonstrating real-world architecture.

---

## 🏗️ Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTP
┌──────▼──────────────────────────────┐
│           Frontend (React)           │  :80
│   Served via nginx (static files)   │
└──────┬──────────────────────────────┘
       │ /api/*  →  NGINX Ingress
┌──────▼──────────────────────────────┐
│           API Gateway               │  :3000
│   JWT validation · Rate limiting    │
│   Routes: /api/auth  /api/notes     │
└──────┬──────────────┬───────────────┘
       │              │
┌──────▼─────┐  ┌─────▼──────┐
│ Auth Svc   │  │ Notes Svc  │
│  :3001     │  │  :3002     │
│ /register  │  │ POST /     │
│ /login     │  │ GET  /     │
│ /verify    │  │ PUT  /:id  │
└──────┬─────┘  │ DELETE/:id │
       │        └─────┬──────┘
       └──────┬───────┘
       ┌──────▼──────┐
       │    MySQL    │
       │    :3306    │
       │  users tbl  │
       │  notes tbl  │
       └─────────────┘
```

### Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 18 + nginx |
| API Gateway | Node.js + Express |
| Auth Service | Node.js + Express + JWT + bcrypt |
| Notes Service | Node.js + Express + MySQL |
| Database | MySQL 8.0 |
| Container Runtime | Docker |
| Orchestration | Kubernetes (Minikube / k3d / k3s) |
| Packaging | Helm 3 |
| Monitoring | Prometheus + Grafana |
| Logging | Loki + Promtail + Grafana |
| CI/CD | GitHub Actions |

---

## 📁 Project Structure

```
notehub-platform/
├── .github/
│   └── workflows/
│       └── ci-cd.yml            # GitHub Actions pipeline
│
├── services/
│   ├── auth-service/            # JWT auth microservice
│   │   ├── src/
│   │   │   ├── index.js
│   │   │   ├── db.js
│   │   │   ├── logger.js
│   │   │   └── routes/auth.js
│   │   ├── Dockerfile
│   │   ├── .dockerignore
│   │   └── package.json
│   │
│   ├── notes-service/           # CRUD notes microservice
│   │   ├── src/
│   │   │   ├── index.js
│   │   │   ├── db.js
│   │   │   ├── logger.js
│   │   │   └── routes/notes.js
│   │   ├── Dockerfile
│   │   ├── .dockerignore
│   │   └── package.json
│   │
│   └── api-gateway/             # Proxy + JWT validation + rate limiting
│       ├── src/
│       │   ├── index.js
│       │   └── logger.js
│       ├── Dockerfile
│       ├── .dockerignore
│       └── package.json
│
├── frontend/                    # React SPA
│   ├── public/
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   └── pages/
│   │       ├── AuthPage.js
│   │       └── NotesPage.js
│   ├── Dockerfile               # Multi-stage: build → nginx
│   ├── nginx.conf
│   └── package.json
│
├── infra/
│   ├── kubernetes/              # Raw K8s manifests
│   │   ├── configmap.yaml
│   │   ├── secrets.yaml
│   │   ├── mysql.yaml
│   │   ├── auth-service.yaml
│   │   ├── notes-service.yaml
│   │   ├── api-gateway.yaml
│   │   ├── frontend.yaml
│   │   └── ingress.yaml
│   │
│   └── helm/
│       └── notehub/             # Helm chart
│           ├── Chart.yaml
│           ├── values.yaml
│           └── templates/
│               ├── _helpers.tpl
│               ├── configmap.yaml
│               ├── secrets.yaml
│               ├── mysql.yaml
│               ├── auth-deployment.yaml
│               ├── auth-service.yaml
│               ├── notes-deployment.yaml
│               ├── notes-service.yaml
│               ├── api-gateway-deployment.yaml
│               ├── api-gateway-service.yaml
│               ├── frontend-deployment.yaml
│               ├── frontend-service.yaml
│               └── ingress.yaml
│
├── monitoring/                  # Prometheus + Grafana setup
│   ├── README.md
│   └── servicemonitor.yaml
│
├── logging/                     # Loki + Promtail setup
│   └── README.md
│
├── docker-compose.yml           # Local development
├── .env.example                 # Environment variable template
└── README.md
```

---

## 🚀 Quick Start – Local (Docker Compose)

### Prerequisites

- Docker 20+ and Docker Compose v2+
- 8GB RAM available

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/lasithahemajith/Note-Hub.git
cd Note-Hub

# 2. Copy environment variables
cp .env.example .env

# 3. Start all services
docker compose up --build

# 4. Open browser
open http://localhost
```

All services will be available:

| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| API Gateway | http://localhost:3000 |
| Auth Service | http://localhost:3001 |
| Notes Service | http://localhost:3002 |

### Test the API

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' | jq -r .token)

# Create a note
curl -X POST http://localhost:3000/api/notes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My first note","content":"Hello NoteHub!"}'

# Get all notes
curl http://localhost:3000/api/notes \
  -H "Authorization: Bearer $TOKEN"
```

---

## ☸️ Kubernetes Deployment

### Prerequisites

- kubectl
- Minikube **or** k3d **or** k3s
- Helm 3

### Option A: Minikube

```bash
# Start Minikube (limit resources for 8GB laptop)
minikube start --memory=4096 --cpus=4 --driver=docker

# Enable Ingress
minikube addons enable ingress

# Get Minikube IP
minikube ip   # e.g. 192.168.49.2
```

### Option B: k3d (Recommended – lighter than Minikube)

```bash
# Install k3d
curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash

# Create cluster
k3d cluster create notehub \
  --port "80:80@loadbalancer" \
  --port "443:443@loadbalancer" \
  --agents 1
```

---

## 📦 Deploy with Raw Kubernetes Manifests

```bash
# 1. Create namespace
kubectl create namespace notehub

# 2. Apply ConfigMap and Secrets first
kubectl apply -f infra/kubernetes/configmap.yaml
kubectl apply -f infra/kubernetes/secrets.yaml

# 3. Deploy MySQL
kubectl apply -f infra/kubernetes/mysql.yaml

# 4. Wait for MySQL to be ready
kubectl wait --for=condition=ready pod -l app=mysql -n notehub --timeout=120s

# 5. Deploy services
kubectl apply -f infra/kubernetes/auth-service.yaml
kubectl apply -f infra/kubernetes/notes-service.yaml
kubectl apply -f infra/kubernetes/api-gateway.yaml
kubectl apply -f infra/kubernetes/frontend.yaml

# 6. Create Ingress
kubectl apply -f infra/kubernetes/ingress.yaml

# 7. Add host entry (Minikube)
echo "$(minikube ip)  notehub.local" | sudo tee -a /etc/hosts

# 8. Open app
open http://notehub.local
```

---

## 🎯 Deploy with Helm (Recommended)

```bash
# 1. Create namespace
kubectl create namespace notehub

# 2. Install chart
helm install notehub ./infra/helm/notehub \
  --namespace notehub \
  --set image.repository=YOUR_DOCKERHUB_USERNAME/notehub \
  --set jwt.secret=your_jwt_secret \
  --set database.password=your_db_password \
  --set database.rootPassword=your_root_password

# 3. Check status
helm status notehub -n notehub
kubectl get all -n notehub

# 4. Upgrade (after image changes)
helm upgrade notehub ./infra/helm/notehub --namespace notehub

# 5. Uninstall
helm uninstall notehub -n notehub
```

---

## 📊 Monitoring Setup (Prometheus + Grafana)

See [monitoring/README.md](monitoring/README.md) for full instructions.

**Quick Start:**

```bash
# Add Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install
kubectl create namespace monitoring
helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set grafana.adminPassword=admin123 \
  --set prometheus.prometheusSpec.retention=12h

# Access Grafana
kubectl port-forward -n monitoring svc/kube-prometheus-stack-grafana 3030:80
open http://localhost:3030  # admin / admin123
```

---

## 📜 Logging Setup (Loki + Promtail)

See [logging/README.md](logging/README.md) for full instructions.

**Quick Start:**

```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

kubectl create namespace logging
helm install loki grafana/loki-stack \
  --namespace logging \
  --set grafana.enabled=false

# Add Loki data source in Grafana:
# URL: http://loki.logging.svc.cluster.local:3100
```

---

## 🔁 CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci-cd.yml`) runs automatically on push to `main`.

### Pipeline Stages

```
push to main
     │
     ▼
┌─────────┐
│  Lint   │  npm ci for each service
└────┬────┘
     │
     ▼
┌─────────┐
│  Build  │  docker buildx build + push to DockerHub
└────┬────┘
     │
     ▼
┌──────────┐
│  Deploy  │  helm upgrade --install
└──────────┘
```

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `DOCKERHUB_USERNAME` | DockerHub username |
| `DOCKERHUB_TOKEN` | DockerHub access token |
| `KUBE_CONFIG` | Base64-encoded kubeconfig |
| `JWT_SECRET` | JWT signing secret |
| `DB_PASSWORD` | MySQL user password |
| `MYSQL_ROOT_PASSWORD` | MySQL root password |

### Add Secrets

```bash
# In your GitHub repo: Settings → Secrets → Actions → New repository secret

# Encode your kubeconfig
cat ~/.kube/config | base64 | tr -d '\n'
```

---

## 🗄️ Database Schema

### users

```sql
CREATE TABLE users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    email      VARCHAR(255) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### notes

```sql
CREATE TABLE notes (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    title      VARCHAR(255) NOT NULL,
    content    TEXT,
    user_id    INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 🔐 Security Features

| Feature | Implementation |
|---------|----------------|
| Password hashing | bcrypt (salt rounds: 10) |
| Authentication | JWT (HS256, 7-day expiry) |
| Rate limiting | express-rate-limit (200 req/15min global, 20 req/15min auth) |
| Secrets management | Kubernetes Secrets / Helm values |
| Input validation | express-validator |
| CORS | cors middleware |

> ⚠️ **Production checklist:** Change all default passwords and JWT secrets. Use a secrets manager (e.g., HashiCorp Vault, AWS Secrets Manager) instead of plain Kubernetes Secrets.

---

## 🌐 API Reference

### Auth Service (`/api/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | ✗ | Register new user |
| POST | `/login` | ✗ | Login, returns JWT |
| GET | `/verify` | Bearer token | Verify JWT token |

### Notes Service (`/api/notes`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | ✅ | Create a note |
| GET | `/` | ✅ | Get all user notes |
| PUT | `/:id` | ✅ | Update a note |
| DELETE | `/:id` | ✅ | Delete a note |

---

## 🧰 Resource Usage (Approximate)

| Component | RAM Request | RAM Limit |
|-----------|------------|-----------|
| MySQL | 256Mi | 512Mi |
| Auth Service | 64Mi | 128Mi |
| Notes Service | 64Mi | 128Mi |
| API Gateway | 64Mi | 128Mi |
| Frontend (nginx) | 32Mi | 64Mi |
| **Total App** | **~480Mi** | **~960Mi** |
| Prometheus + Grafana | ~400Mi | ~800Mi |
| Loki + Promtail | ~200Mi | ~400Mi |
| **Grand Total** | **~1.1GB** | **~2.2GB** |

Well within the 8GB RAM budget ✅

---

## ☁️ Cloud Deployment

### Oracle Cloud (k3s)

```bash
# Install k3s on your OCI instance
curl -sfL https://get.k3s.io | sh -

# Copy kubeconfig
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER ~/.kube/config

# Deploy NoteHub
kubectl create namespace notehub
helm install notehub ./infra/helm/notehub \
  --namespace notehub \
  --set ingress.host=YOUR_DOMAIN_OR_IP \
  --set image.repository=YOUR_DOCKERHUB_USERNAME/notehub
```

---

## 🛠️ Development Tips

```bash
# View logs for all services
docker compose logs -f

# Restart a single service
docker compose restart auth-service

# Shell into a container
docker compose exec auth-service sh

# Check Kubernetes pod logs
kubectl logs -f deployment/auth-service -n notehub

# Port-forward a service for debugging
kubectl port-forward svc/auth-service 3001:3001 -n notehub
```

---

## 📜 License

MIT