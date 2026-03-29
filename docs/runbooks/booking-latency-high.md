# Runbook: Booking Service High Latency

**Alert:** `HighLatency` — P95 latency > 2 s for `booking-service` for > 5 min  
**Severity:** Warning  
**Runbook Owner:** On-call engineer  
**Last Updated:** 2026-03-28

---

## 1. Quick Assessment

```bash
# Live P95 latency
kubectl exec -n monitoring deployment/prometheus -- \
  promtool query instant \
  'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{service="booking-service"}[5m]))'

# Recent slow requests
kubectl logs -n restaurant-system -l app=booking-service --tail=200 \
  | python3 -c "import sys,json; [print(l) for l in sys.stdin if json.loads(l).get('duration_ms',0)>500]" 2>/dev/null \
  || kubectl logs -n restaurant-system -l app=booking-service --tail=200 | grep -E '"duration_ms":[0-9]{4,}'
```

---

## 2. Root Cause Investigation

### a) Database slow queries
```bash
# Connect to Postgres
kubectl exec -n restaurant-system statefulset/postgres -- \
  psql -U admin -d restaurant_booking -c \
  "SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

### b) pgbouncer saturation
```bash
kubectl logs -n restaurant-system deployment/pgbouncer | grep -i "pool\|timeout\|queue"
kubectl exec -n restaurant-system deployment/pgbouncer -- \
  psql -h localhost -p 5432 -U pgbouncer pgbouncer -c "SHOW POOLS;"
```

### c) AI service latency bleeding into booking flow
```bash
kubectl exec -n restaurant-system deployment/api-gateway -- \
  curl -s -w "\ntotal: %{time_total}s\n" http://ai-service:8001/health
```

### d) Redis cache misses
```bash
kubectl exec -n restaurant-system deployment/redis -- \
  redis-cli info stats | grep -E "keyspace_hits|keyspace_misses"
```

### e) High concurrency / thread pool exhaustion
```bash
kubectl top pods -n restaurant-system -l app=booking-service
kubectl exec -n restaurant-system deployment/booking-service -- \
  python3 -c "import asyncio; print('active tasks:', len(asyncio.all_tasks()))" 2>/dev/null || true
```

---

## 3. Immediate Mitigations

| Cause | Mitigation |
|---|---|
| Missing DB index | `kubectl exec statefulset/postgres -- psql -U admin -d restaurant_booking -c "CREATE INDEX CONCURRENTLY ..."` |
| pgbouncer queue full | `kubectl scale deployment/pgbouncer --replicas=2 -n restaurant-system` |
| Cache miss storm | Warm Redis: trigger cache-warm endpoint or `kubectl rollout restart deployment/booking-service` |
| Pod CPU throttled | `kubectl autoscale deployment/booking-service --min=2 --max=10 --cpu-percent=70 -n restaurant-system` |

---

## 4. Long-term Fixes

- Add missing indexes via Flyway migration
- Tune pgbouncer `pool_mode=transaction`, raise `max_client_conn`
- Increase HPA `targetCPUUtilizationPercentage` lower threshold

---

## 5. Escalation

- **10 min at P95 > 5 s:** Page lead engineer
- **20 min:** Consider circuit-breaker on booking endpoint
