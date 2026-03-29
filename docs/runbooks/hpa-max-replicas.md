# Runbook: HPA Max Replicas Reached

**Alert:** Custom alert or manual observation — HPA at max replicas  
**Severity:** Warning → Critical  
**Runbook Owner:** On-call engineer  
**Last Updated:** 2026-03-28

---

## 1. Detect

```bash
# Check all HPAs
kubectl get hpa -n restaurant-system

# Which HPAs are at max?
kubectl get hpa -n restaurant-system -o json | python3 -c "
import sys, json
d = json.load(sys.stdin)
for i in d['items']:
    name = i['metadata']['name']
    curr = i['status']['currentReplicas']
    maxr = i['spec']['maxReplicas']
    cpu  = i['status'].get('currentMetrics', [{}])[0].get('resource', {}).get('current', {}).get('averageUtilization', 'n/a')
    if curr >= maxr:
        print(f'AT MAX: {name} {curr}/{maxr}  CPU={cpu}%')
"
```

---

## 2. Understand Why

```bash
# CPU usage trend
kubectl top pods -n restaurant-system

# Memory usage trend  
kubectl top pods -n restaurant-system --sort-by=memory

# Recent events
kubectl get events -n restaurant-system | grep -i "hpa\|scale\|trigger"

# Check if this is organic traffic or a burst/attack
kubectl logs -n restaurant-system -l app=api-gateway --tail=200 \
  | grep -oP '"ip":"\K[^"]+' | sort | uniq -c | sort -rn | head -10
```

---

## 3. Short-Term Actions

### Increase max replicas temporarily (if legitimate traffic)
```bash
# Patch HPA max
kubectl patch hpa booking-service -n restaurant-system \
  --type='merge' -p='{"spec":{"maxReplicas":20}}'

# Monitor scale progress
kubectl get hpa -n restaurant-system -w
```

### Check node capacity
```bash
kubectl describe nodes | grep -A 8 "Allocated resources"
# If nodes at capacity — scale node group or trigger CA
```

### Rate-limit at gateway if traffic is suspicious
```bash
# Temporarily tighten rate limits
kubectl set env deployment/api-gateway \
  RATE_LIMIT_RPM=30 \
  RATE_LIMIT_BURST=10 \
  -n restaurant-system
kubectl rollout restart deployment/api-gateway -n restaurant-system
```

---

## 4. Long-Term Fixes

1. Review `resources.requests.cpu` — if undersized, pods auto-scale too aggressively
2. Consider KEDA (Kubernetes Event-Driven Autoscaling) for queue-based scaling
3. Review HPA stabilization window: add `behavior.scaleDown.stabilizationWindowSeconds: 300`
4. Pre-scale before known high-traffic windows (e.g., Friday evenings)

---

## 5. Escalation

- **HPA maxed + response time degrading:** P2 — wake on-call lead
- **All services maxed + nodes full:** P1 — infrastructure incident
