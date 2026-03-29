# Runbook: High Error Rate

**Alert:** `HighErrorRate` — 5xx error rate > 5% sustained for 5 min  
**Severity:** Warning → Critical  
**Runbook Owner:** On-call engineer  
**Last Updated:** 2026-03-28

---

## 1. Detection

Triggered by Prometheus alert `HighErrorRate`:
```
sum(rate(http_requests_total{status=~"5.."}[5m]))
/ sum(rate(http_requests_total[5m])) > 0.05
```
Also visible in: Grafana → **System Overview** → Error Rate panel.

---

## 2. Impact Assessment

| Error Rate | Impact |
|---|---|
| 5–10% | Some users experiencing errors |
| 10–25% | Significant degradation, customers unable to complete bookings |
| > 25% | Major incident — escalate immediately |

---

## 3. Initial Triage (< 5 min)

```bash
# Which services are returning 5xx?
kubectl top pods -n restaurant-system
kubectl get pods -n restaurant-system | grep -v Running

# Check recent logs for errors
kubectl logs -n restaurant-system -l app=api-gateway --tail=100 | grep '"status":5'
kubectl logs -n restaurant-system -l app=booking-service --tail=100 | grep -i error

# Check pod events
kubectl get events -n restaurant-system --sort-by='.lastTimestamp' | tail -20
```

---

## 4. Root Cause Checklist

### a) Database connectivity
```bash
kubectl exec -n restaurant-system deployment/booking-service -- \
  python -c "import asyncpg; import asyncio; asyncio.run(asyncpg.connect('postgresql://admin:${POSTGRES_PASSWORD}@postgres:5432/restaurant_booking'))" && echo OK
```

### b) Downstream service health
```bash
kubectl get pods -n restaurant-system
# Check if ai-service, restaurant-service are Running
```

### c) Recent deployments
```bash
kubectl rollout history deployment -n restaurant-system
# If a bad deploy → rollback immediately:
kubectl rollout undo deployment/booking-service -n restaurant-system
```

### d) Resource exhaustion
```bash
kubectl describe nodes | grep -A 5 "Allocated resources"
kubectl top pods -n restaurant-system --sort-by=memory
```

### e) Upstream dependency (Groq API)
```bash
curl -I https://api.groq.com/healthz
```

---

## 5. Remediation

| Cause | Fix |
|---|---|
| Bad deployment | `kubectl rollout undo deployment/<name> -n restaurant-system` |
| DB connection exhaustion | Restart pgbouncer: `kubectl rollout restart deployment/pgbouncer -n restaurant-system` |
| OOM kill | Increase memory limits in Helm values + redeploy |
| Groq API down | Enable fallback mode: `kubectl set env deployment/ai-service GROQ_FALLBACK=true -n restaurant-system` |

---

## 6. Escalation

- **15 min without fix:** Page senior on-call via PagerDuty
- **30 min at >25% error rate:** Declare P1 incident, notify product team
- **45 min:** Consider enabling maintenance page
