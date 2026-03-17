# Monitoring Setup: Prometheus + Grafana

This directory contains instructions for setting up monitoring on your NoteHub cluster.

## Prerequisites

- Helm 3 installed
- Kubernetes cluster running (Minikube / k3d / k3s)
- `kubectl` configured

---

## 1. Add Helm Repositories

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
```

---

## 2. Install kube-prometheus-stack (Prometheus + Grafana + Alertmanager)

```bash
# Create namespace
kubectl create namespace monitoring

# Install the stack with lightweight settings (suitable for 8GB RAM)
helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set grafana.adminPassword=admin123 \
  --set prometheus.prometheusSpec.retention=12h \
  --set prometheus.prometheusSpec.resources.requests.memory=256Mi \
  --set prometheus.prometheusSpec.resources.limits.memory=512Mi \
  --set alertmanager.alertmanagerSpec.resources.requests.memory=64Mi \
  --set alertmanager.alertmanagerSpec.resources.limits.memory=128Mi \
  --set grafana.resources.requests.memory=128Mi \
  --set grafana.resources.limits.memory=256Mi \
  --set nodeExporter.enabled=true \
  --set kubeStateMetrics.enabled=true
```

---

## 3. Access Grafana

```bash
# Port-forward Grafana
kubectl port-forward -n monitoring svc/kube-prometheus-stack-grafana 3030:80

# Open in browser
open http://localhost:3030

# Default credentials
# Username: admin
# Password: admin123
```

---

## 4. Access Prometheus

```bash
kubectl port-forward -n monitoring svc/kube-prometheus-stack-prometheus 9090:9090
open http://localhost:9090
```

---

## 5. Access Alertmanager

```bash
kubectl port-forward -n monitoring svc/kube-prometheus-stack-alertmanager 9093:9093
open http://localhost:9093
```

---

## 6. NoteHub Service Metrics

Each NoteHub service exposes a `/metrics` endpoint (Prometheus format).

To configure Prometheus to scrape them, apply the ServiceMonitor:

```bash
kubectl apply -f servicemonitor.yaml
```

---

## 7. Grafana Dashboards

### Import Pre-built Dashboards

In Grafana UI (http://localhost:3030):

1. Go to **Dashboards → Import**
2. Enter the following dashboard IDs:

| Dashboard | ID |
|-----------|-----|
| Kubernetes Cluster Overview | 7249 |
| Node Exporter Full | 1860 |
| Pod Resource Usage | 6781 |

### NoteHub Custom Dashboard

Import `notehub-dashboard.json` from this directory for a custom NoteHub overview.

---

## 8. Uninstall

```bash
helm uninstall kube-prometheus-stack -n monitoring
kubectl delete namespace monitoring
```
