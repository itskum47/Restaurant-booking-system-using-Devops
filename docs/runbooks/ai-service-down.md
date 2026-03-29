# Runbook: AI Service Down

**Alert:** `ServiceDown` — `ai-service` pod `up == 0` for > 2 min  
**Severity:** Critical  
**Runbook Owner:** On-call engineer  
**Last Updated:** 2026-03-28

---

## 1. Impact

AI service powers NLP parsing for natural-language booking requests.  
When down:
- Natural-language bookings fail with 503
- Standard form bookings still work (booking-service unaffected)
- Slot recommendation feature unavailable

---

## 2. Quick Check (< 2 min)

```bash
# Pod status
kubectl get pods -n restaurant-system -l app=ai-service -o wide

# Recent events
kubectl describe pod -n restaurant-system -l app=ai-service | tail -30

# Logs (last restart)
kubectl logs -n restaurant-system -l app=ai-service --previous --tail=100
```

---

## 3. Common Causes & Fixes

### a) OOMKilled
```bash
kubectl describe pod -n restaurant-system -l app=ai-service | grep -A 3 "Last State"
# If OOMKilled:
kubectl patch deployment ai-service -n restaurant-system \
  --type='json' -p='[{"op":"replace","path":"/spec/template/spec/containers/0/resources/limits/memory","value":"2Gi"}]'
```

### b) CrashLoopBackOff — Groq API key invalid
```bash
kubectl logs -n restaurant-system -l app=ai-service | grep -i "api_key\|unauthorized\|401"
# Rotate key:
kubectl create secret generic restaurant-secrets \
  --from-literal=GROQ_API_KEY=<new-key> \
  --dry-run=client -n restaurant-system -o yaml | kubectl apply -f -
kubectl rollout restart deployment/ai-service -n restaurant-system
```

### c) ImagePullBackOff
```bash
kubectl describe pod -n restaurant-system -l app=ai-service | grep -A 5 "Failed"
# Fix imagePullSecret or revert to last known-good image:
kubectl set image deployment/ai-service ai-service=<registry>/ai-service:<last-good-tag> -n restaurant-system
```

### d) SIGKILL / forced restart (HPA pressure)
```bash
kubectl get hpa -n restaurant-system
# Temporarily freeze scaling:
kubectl annotate hpa ai-service cluster-autoscaler.kubernetes.io/safe-to-evict=false -n restaurant-system
```

---

## 4. Graceful Degradation

While AI service is down, redirect NLP requests to fallback parser:
```bash
kubectl set env deployment/api-gateway AI_SERVICE_FALLBACK=true -n restaurant-system
```
This enables simplified regex-based date/party-size extraction so bookings still work.

---

## 5. Restore & Verify

```bash
# Rollout restart
kubectl rollout restart deployment/ai-service -n restaurant-system
kubectl rollout status deployment/ai-service -n restaurant-system --timeout=5m

# Verify health endpoint
kubectl exec -n restaurant-system deployment/api-gateway -- \
  curl -s http://ai-service:8001/health | python3 -m json.tool

# Disable fallback
kubectl set env deployment/api-gateway AI_SERVICE_FALLBACK- -n restaurant-system
```

---

## 6. Escalation

- **5 min without pods starting:** Wake AI team lead
- **15 min:** P1 — Groq or infra-level issue
