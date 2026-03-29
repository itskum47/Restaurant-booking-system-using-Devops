# 🧪 Gemini Integration Testing & Verification Guide

**Purpose:** Validate that Google Gemini API integration is working correctly  
**Expected Time:** 15-20 minutes  
**Status:** Ready for Testing

---

## 📋 Pre-Deployment Checklist

- [ ] Gemini API key obtained from https://aistudio.google.com/app/apikey
- [ ] Docker installed and running: `docker --version`
- [ ] kubectl configured and tested: `kubectl cluster-info`
- [ ] Helm installed: `helm version`
- [ ] All files modified per GEMINI_INTEGRATION.md
- [ ] Project root has `.env.example` with GEMINI_API_KEY

---

## 🚀 Deployment Checklist

### Step 1: Run Deployment Script
```bash
cd /Users/kumarmangalam/Desktop/Devops/project/restaurant-booking-system

# Run automated deployment
./scripts/deploy-gemini.sh "YOUR-GEMINI-API-KEY-HERE" dev

# Expected output:
# ✅ kubernetes.io/pem authenticated
# ✅ Docker image built: restaurant-booking/ai-service:1.0.0
# ✅ Helm chart deployed successfully
# ✅ Deployment is ready
# ✅ Gemini integration verified!
```

**OR Manual Deployment:**

### Step 2: Update Secret (Manual)
```bash
GEMINI_KEY=$(echo -n "YOUR-GEMINI-API-KEY" | base64)

kubectl patch secret restaurant-secrets -n restaurant-system \
  --type='json' \
  -p="[
    {\"op\": \"remove\", \"path\": \"/data/OPENAI_API_KEY\"},
    {\"op\": \"add\", \"path\": \"/data/GEMINI_API_KEY\", \"value\": \"$GEMINI_KEY\"}
  ]"
```

### Step 3: Build & Deploy (Manual)
```bash
# Build image
docker build -t restaurant-booking/ai-service:1.0.0 ./services/ai-service/

# Deploy with Helm
helm upgrade restaurant-booking ./helm/restaurant-booking \
  --namespace restaurant-system \
  --values helm/restaurant-booking/values-dev.yaml
```

---

## ✅ Basic Verification Tests

### Test 1: Pod Status Check
```bash
# Check all pods are running
kubectl get pods -n restaurant-system

# Expected output:
# NAME                                READY   STATUS    RESTARTS
# ai-service-64d9f8c7c9-xyz12         1/1     Running   0
# api-gateway-7f8c4...                1/1     Running   0
# postgres-0                          1/1     Running   0
# ...

# Check ai-service specifically
kubectl get pod -n restaurant-system -l app=ai-service
```

✅ **Pass Criteria:** All pods show `Running` status

---

### Test 2: Service Health Check
```bash
# Forward service to localhost
kubectl port-forward -n restaurant-system svc/ai-service 8001:8001 &

# Test health endpoint
curl -s http://localhost:8001/health | jq .

# Expected response:
# {
#   "status": "healthy",
#   "engine": "Google Gemini",
#   "model": "gemini-1.5-flash",
#   "version": "1.0.0"
# }
```

✅ **Pass Criteria:**
- Status is "healthy"
- Engine shows "Google Gemini"
- Model shows "gemini-1.5-flash" (or your configured model)

---

### Test 3: Metrics Endpoint
```bash
# Check Prometheus metrics
curl -s http://localhost:8001/metrics | grep gemini

# Expected output should include:
# gemini_requests_total{status="success"} 0
# gemini_latency_seconds_bucket{le="+Inf"} 0
# gemini_tokens_total{direction="input"} 0
```

✅ **Pass Criteria:** Metrics endpoint returns Gemini-specific metrics

---

## 🎯 Functional Tests

### Test 4: Simple Booking Request
```bash
# Test basic booking intent parsing
curl -X POST http://localhost:8001/api/v1/ai/booking \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Book me a table for 2 at an Italian restaurant this Friday at 8pm",
    "conversation_history": []
  }' | jq .

# Expected response:
# {
#   "intent": "gemini",
#   "confidence": 0.85,
#   "intent_data": {
#     "cuisine": "italian",
#     "date": "this friday",
#     "time": "20:00",
#     "party_size": 2,
#     "budget": null,
#     "special_requests": null,
#     "occasion": null
#   },
#   "response": "What a lovely choice! Italian cuisine is perfect...",
#   "recommendations": [
#     {
#       "id": 1,
#       "name": "Osteria del Mare",
#       "cuisine": "Italian Seafood",
#       "rating": 4.9,
#       "why_recommended": "Perfect for intimate dining..."
#     },
#     ...
#   ]
# }
```

✅ **Pass Criteria:**
- HTTP 200 response
- Contains `intent_data` object with parsed booking details
- Contains `response` field (Gemini conversation response)
- Contains `recommendations` array (minimum 1 recommendation)
- Confidence score > 0.7

---

### Test 5: Multi-turn Conversation
```bash
# First turn - understand context
RESPONSE_1=$(curl -s -X POST http://localhost:8001/api/v1/ai/booking \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Book me a table for 2 for this Friday",
    "conversation_history": []
  }')

echo "First response:"
echo $RESPONSE_1 | jq '.response'
echo ""

# Second turn - refine with context
curl -X POST http://localhost:8001/api/v1/ai/booking \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Actually, make it 4 people instead",
    "conversation_history": [
      {
        "role": "user",
        "content": "Book me a table for 2 for this Friday"
      },
      {
        "role": "assistant",
        "content": "Great! I found some wonderful options..."
      }
    ]
  }' | jq .

# Expected: party_size should be 4 (updated from 2)
```

✅ **Pass Criteria:**
- Party size updates from 2 → 4
- Gemini understands context from previous turn
- Response acknowledges the change ("Updated to 4 people...")
- recommendations_updated field shows new matching restaurants

---

### Test 6: Different Cuisines
```bash
# Test various cuisine types
cuisines=("Japanese" "French" "Mediterranean" "Mexican" "Thai")

for cuisine in "${cuisines[@]}"; do
  echo "Testing $cuisine:"
  curl -s -X POST http://localhost:8001/api/v1/ai/booking \
    -H "Content-Type: application/json" \
    -d "{
      \"message\": \"I want $cuisine food for my dinner\",
      \"conversation_history\": []
    }" | jq '.intent_data.cuisine'
  echo ""
done

# Expected output:
# "japanese"
# "french"
# "mediterranean"
# "mexican"
# "thai"
```

✅ **Pass Criteria:** All cuisines correctly identified

---

### Test 7: Edge Cases & Error Handling

#### Test 7a: Empty Message
```bash
curl -X POST http://localhost:8001/api/v1/ai/booking \
  -H "Content-Type: application/json" \
  -d '{"message": "", "conversation_history": []}' | jq .

# Expected: 400 Bad Request or graceful empty response
```

#### Test 7b: Very Long Message
```bash
LONG_MSG=$(python3 -c "print('I want to book a restaurant ' * 50)")

curl -X POST http://localhost:8001/api/v1/ai/booking \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"$LONG_MSG\", \"conversation_history\": []}" | jq .

# Expected: HTTP 200 with truncated/parsed intent
```

#### Test 7c: Special Characters
```bash
curl -X POST http://localhost:8001/api/v1/ai/booking \
  -H "Content-Type: application/json" \
  -d '{"message": "Book me at Café du Monde (São Paulo) für 2! 🍽️", "conversation_history": []}'

# Expected: HTTP 200, proper handling of special characters
```

✅ **Pass Criteria:** No 500 errors, graceful handling of edge cases

---

## 📊 Performance Tests

### Test 8: Response Time (P95 < 3s)
```bash
# Measure latency
for i in {1..10}; do
  time curl -s -X POST http://localhost:8001/api/v1/ai/booking \
    -H "Content-Type: application/json" \
    -d '{"message": "Italian dinner for 2 Friday", "conversation_history": []}' \
    > /dev/null
done

# Check Prometheus metrics
curl -s http://localhost:8001/metrics | grep gemini_latency_seconds_bucket

# Expected: Real real	0m0.800s (varies, but sub-3s recommended)
```

✅ **Pass Criteria:**
- Average response time < 2s
- P95 response time < 3s (check metrics)
- No timeouts

---

### Test 9: Concurrent Requests
```bash
# Simulate 10 concurrent requests
for i in {1..10}; do
  curl -s -X POST http://localhost:8001/api/v1/ai/booking \
    -H "Content-Type: application/json" \
    -d "{\"message\": \"Book request $i\", \"conversation_history\": []}" \
    > /dev/null &
done

wait

# Check pod CPU/memory
kubectl top pods -n restaurant-system -l app=ai-service

# Expected CPU: < 500m, Memory: < 256Mi
```

✅ **Pass Criteria:**
- All requests complete successfully
- No pod restarts
- Resource usage within limits

---

## 🔍 Logging & Debugging Tests

### Test 10: Verify Logs
```bash
# Check service logs
kubectl logs -n restaurant-system -l app=ai-service --tail=100

# Expected logs should show:
# [INFO] Gemini initialized: gemini-1.5-flash
# [INFO] POST /api/v1/ai/booking
# [DEBUG] Parsing booking intent: "..."
# [DEBUG] Gemini response: {...}
# [INFO] Response sent (latency: 850ms)
```

### Test 11: Check Prometheus Scraping
```bash
# Verify Prometheus is scraping metrics
kubectl port-forward -n restaurant-system svc/prometheus 9090:9090 &

# Visit: http://localhost:9090
# Search for: "gemini_"
# Should show all Gemini metrics with recent data points
```

✅ **Pass Criteria:**
- All gemini_* metrics visible in Prometheus
- Recent data points (within last 5 minutes)
- No "stale" indicator on metrics

---

## 🚨 Alert Testing

### Test 12: Verify Alert Rules
```bash
# Check if alert rules are loaded in Prometheus
kubectl port-forward -n restaurant-system svc/prometheus 9090:9090 &

# In Prometheus UI, go to Alerts tab
# Should see:
# ✓ GeminiHighLatency
# ✓ GeminiHighErrorRate  
# ✓ HighGeminiTokenUsage
```

### Test 13: Trigger High Latency Alert (Optional)
```bash
# Add artificial delay to Gemini API to test alerting
# (In production, monitor real latency)

# Check alert in Prometheus UI or Grafana
# Expected: Alert fires after P95 latency > 3s for 5 minutes
```

---

## 🎛️ Frontend Integration Tests

### Test 14: Chat Interface Flow
```bash
# Start frontend dev server
cd services/frontend
npm run dev

# In browser:
# 1. Open http://localhost:5173
# 2. Navigate to Chat/Booking section
# 3. Send message: "Book me Italian for 2"
# 4. Verify:
#    ✓ AI responds with restaurant options
#    ✓ Recommendations show in chat
#    ✓ No errors in console
# 5. Send follow-up: "Actually, make it 4 people"
# 6. Verify:
#    ✓ AI understands context
#    ✓ Recommendations update based on party size
#    ✓ Conversation flows naturally
```

### Test 15: DevTools Verification
```bash
# In Firefox/Chrome DevTools:
# 1. Open Network tab
# 2. Send booking request in chat
# 3. Look for POST /api/v1/ai/booking
# 4. Check request payload:
#    {
#      "message": "...",
#      "conversation_history": [
#        {"role": "user", "content": "..."},
#        {"role": "assistant", "content": "..."}
#      ]
#    }
# 5. Check response:
#    {
#      "intent": "gemini",
#      "intent_data": {...},
#      "response": "...",
#      "recommendations": [...]
#    }
```

✅ **Pass Criteria:**
- Network requests show Gemini responses
- conversation_history array populated correctly
- Response fields match expected schema

---

## 📈 Monitoring Tests

### Test 16: Grafana Dashboards
```bash
# Port-forward Grafana
kubectl port-forward -n restaurant-system svc/grafana 3000:3000 &

# Access: http://localhost:3000 (user: admin)
# Navigate to "AI Service" dashboard
# Verify panels show:
# ✓ Gemini Requests per Second
# ✓ P95 Latency (should be graph)
# ✓ Error Rate (%)
# ✓ Token Usage (input/output)
```

---

## 🔄 Fallback & Mock Mode Tests

### Test 17: Mock Mode Verification
```bash
# Test with missing API key
kubectl set env deployment/ai-service \
  GEMINI_API_KEY="invalid" \
  -n restaurant-system

kubectl rollout restart deployment/ai-service -n restaurant-system
kubectl rollout status deployment/ai-service -n restaurant-system

# Pod logs should show: "WARNING: Using mock responses"
kubectl logs -n restaurant-system -l app=ai-service

# Test booking endpoint
curl -X POST http://localhost:8001/api/v1/ai/booking \
  -H "Content-Type: application/json" \
  -d '{"message": "Italian dinner", "conversation_history": []}' | jq .

# Should return mock recommendations even without valid API key
```

✅ **Pass Criteria:**
- Service responds with mock recommendations
- No 500 errors
- Graceful degradation confirmed

---

## 🎯 Final Verification Checklist

- [ ] All pods running (`kubectl get pods`)
- [ ] Health endpoint returns "Google Gemini"
- [ ] Booking API returns valid responses
- [ ] Multi-turn conversations work (context preserved)
- [ ] Metrics visible in Prometheus
- [ ] Alerts configured in PrometheusRule
- [ ] Grafana dashboards display Gemini metrics
- [ ] Frontend receives and displays recommendations
- [ ] Performance meets SLA (P95 < 3s)
- [ ] Fallback/mock mode works
- [ ] No error rate spikes in metrics
- [ ] Logs show no errors or warnings (except mock mode)

---

## 🐛 Troubleshooting Guide

### Issue: "Pod stuck in CrashLoopBackOff"
```bash
# Check logs
kubectl logs -n restaurant-system -l app=ai-service

# Common causes:
# 1. GEMINI_API_KEY not set
# 2. Requirements not installed correctly
# 3. Port already in use

# Solution: Restart with restart flag
kubectl rollout restart deployment/ai-service -n restaurant-system
```

### Issue: "403 Invalid API Key"
```bash
# Verify key in secret
kubectl get secret restaurant-secrets -n restaurant-system -o jsonpath='{.data.GEMINI_API_KEY}' | base64 -d

# Get new key from: https://aistudio.google.com/app/apikey
# Update secret and restart
```

### Issue: "High latency (>5s)"
```bash
# Check pod resources
kubectl top pods -n restaurant-system -l app=ai-service

# Check network
kubectl exec -n restaurant-system <pod-name> -- ping generativelanguage.googleapis.com

# Scale up replicas if needed
kubectl scale deployment ai-service --replicas=3 -n restaurant-system
```

### Issue: "Metrics not appearing in Prometheus"
```bash
# Verify service is scraping
kubectl port-forward svc/prometheus 9090:9090 -n restaurant-system &

# In Prometheus UI: Status → Targets
# Look for "ai-service" target
# Should show "UP" status with recent scrapes

# If DOWN, check service monitor
kubectl get servicemonitor -n restaurant-system
```

---

## ✅ Sign-Off

**Testing Completed By:** _____________________  
**Date:** _____________________  
**Overall Status:** ☐ PASS ☐ FAIL ☐ CONDITIONAL PASS

**Notes:**
```
[Space for testing notes]


```

**Recommended Next Steps:**
1. [ ] Merge changes to main branch
2. [ ] Tag release: `git tag v1.0.0-gemini`
3. [ ] Deploy to staging for extended testing
4. [ ] Monitor production metrics for 24-48 hours
5. [ ] Document cost savings and performance gains

---

**Questions?** Refer to [GEMINI_INTEGRATION.md](./GEMINI_INTEGRATION.md) or reach out to DevOps team.

*End of Testing Guide*
