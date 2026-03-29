# Runbook: Pod Restarting Frequently

**Alert:** `PodRestarting` — > 3 restarts in 30 min  
**Severity:** Warning  
**Runbook Owner:** On-call engineer  
**Last Updated:** 2026-03-28

---

## 1. Identify the Pod

```bash
# Which pods are restarting most?
kubectl get pods -n restaurant-system \
  --sort-by='.status.containerStatuses[0].restartCount' | tail -10

# Restart counts with reasons
kubectl get pods -n restaurant-system -o json | python3 -c "
import sys, json
d = json.load(sys.stdin)
for p in d['items']:
    for cs in p['status'].get('containerStatuses', []):
        r = cs.get('restartCount', 0)
        if r >= 3:
            last = cs.get('lastState', {}).get('terminated', {})
            print(f\"{p['metadata']['name']} | restarts={r} | reason={last.get('reason','?')} | exit={last.get('exitCode','?')}\")
"
```

---

## 2. Root Cause by Exit Code

| Exit Code | Meaning | First Action |
|---|---|---|
| 0 | Clean exit — liveness probe mismatch | Check probe path/port |
| 1 | Application error | Check logs |
| 137 | OOMKilled | Increase memory limits |
| 143 | SIGTERM — not handled cleanly | Check graceful shutdown |
| 255 | Unhandled exception | Check Python traceback |

```bash
# Check crash logs
kubectl logs -n restaurant-system <pod-name> --previous --tail=200

# Describe for events
kubectl describe pod -n restaurant-system <pod-name>
```

---

## 3. OOMKilled Mitigation

```bash
# Confirm OOM
kubectl describe pod -n restaurant-system <pod-name> | grep -A 3 "OOMKilled"

# Temporary memory increase (patch without Helm)
kubectl patch deployment booking-service -n restaurant-system \
  --type='json' \
  -p='[{"op":"replace","path":"/spec/template/spec/containers/0/resources/limits/memory","value":"1Gi"}]'
```

---

## 4. Liveness Probe Failure

```bash
# Test probe path manually
kubectl exec -n restaurant-system deployment/<service> -- \
  curl -s -o /dev/null -w "%{http_code}" http://localhost:<port>/health

# Extend probe grace period temporarily
kubectl patch deployment <service> -n restaurant-system \
  --type='json' \
  -p='[{"op":"replace","path":"/spec/template/spec/containers/0/livenessProbe/failureThreshold","value":10}]'
```

---

## 5. Prevent Further Restarts During Investigation

```bash
# Pause HPA to stop scaling while you investigate
kubectl patch hpa <service> -n restaurant-system \
  --type='merge' -p='{"spec":{"minReplicas":2}}'

# Cordon bad node (if node-specific)
kubectl cordon <node-name>
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data
```

---

## 6. Fix & Verify

```bash
# After fix — watch for stability
kubectl get pods -n restaurant-system -w
# Should stay Running without incrementing restarts for 10 min
```

---

## 7. Escalation

- **> 10 restarts in 30 min:** Page lead engineer
- **Multiple services restarting:** P1 — cluster or shared dependency issue
