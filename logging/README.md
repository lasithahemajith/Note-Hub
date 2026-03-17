# Logging Setup: Loki + Promtail + Grafana

This directory contains instructions for setting up log aggregation using the Loki stack — a lightweight alternative to the ELK stack, ideal for 8GB RAM environments.

> **Why Loki?** Loki indexes only metadata (labels), not the full log content, making it significantly cheaper in RAM/CPU than Elasticsearch.

---

## Prerequisites

- Helm 3 installed
- Grafana already installed (via kube-prometheus-stack in `monitoring/`)
- `kubectl` configured

---

## 1. Add Grafana Helm Repository

```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
```

---

## 2. Install Loki Stack

```bash
kubectl create namespace logging

helm install loki grafana/loki-stack \
  --namespace logging \
  --set loki.enabled=true \
  --set promtail.enabled=true \
  --set grafana.enabled=false \
  --set loki.persistence.enabled=false \
  --set loki.resources.requests.memory=128Mi \
  --set loki.resources.limits.memory=256Mi \
  --set promtail.resources.requests.memory=64Mi \
  --set promtail.resources.limits.memory=128Mi
```

> **Note:** We disable the bundled Grafana because we already have one from the monitoring stack.

---

## 3. Add Loki as a Data Source in Grafana

1. Open Grafana (http://localhost:3030)
2. Go to **Configuration → Data Sources → Add data source**
3. Choose **Loki**
4. Set URL to: `http://loki.logging.svc.cluster.local:3100`
5. Click **Save & Test**

---

## 4. Query Logs in Grafana

Go to **Explore** and use LogQL queries:

```logql
# All NoteHub logs
{namespace="notehub"}

# Auth service logs only
{namespace="notehub", app="auth-service"}

# Errors only
{namespace="notehub"} |= "error"

# Filter by level
{namespace="notehub"} | json | level="error"
```

---

## 5. Verify Promtail is Running

```bash
# Check Promtail DaemonSet
kubectl get daemonset -n logging

# Check Promtail logs
kubectl logs -n logging -l app=promtail -f

# Check Loki logs
kubectl logs -n logging -l app=loki -f
```

---

## 6. Port-forward Loki (optional, for direct access)

```bash
kubectl port-forward -n logging svc/loki 3100:3100
# Check Loki status
curl http://localhost:3100/ready
```

---

## 7. Uninstall

```bash
helm uninstall loki -n logging
kubectl delete namespace logging
```

---

## ELK Stack Alternative (Higher RAM Usage)

If you prefer the ELK stack (requires ~4GB RAM just for Elasticsearch):

```bash
helm repo add elastic https://helm.elastic.co
helm repo update

kubectl create namespace logging

# Elasticsearch
helm install elasticsearch elastic/elasticsearch \
  --namespace logging \
  --set replicas=1 \
  --set minimumMasterNodes=1 \
  --set resources.requests.memory=1Gi \
  --set resources.limits.memory=2Gi

# Kibana
helm install kibana elastic/kibana \
  --namespace logging \
  --set resources.requests.memory=512Mi

# Filebeat (log shipper)
helm install filebeat elastic/filebeat \
  --namespace logging

# Access Kibana
kubectl port-forward -n logging svc/kibana-kibana 5601:5601
open http://localhost:5601
```

> ⚠️ **Warning:** ELK stack is NOT recommended for 8GB RAM laptops. Use Loki instead.
