#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="${1:-restaurant-system-staging}"

kubectl -n "$NAMESPACE" run synthetic-smoke \
  --image=curlimages/curl:8.7.1 \
  --restart=Never \
  --rm -i -- \
  sh -ec '
    check() {
      name="$1"
      url="$2"
      expected="$3"
      code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
      if [ "$code" != "$expected" ]; then
        echo "FAIL $name expected=$expected got=$code"
        exit 1
      fi
      echo "OK $name code=$code"
    }

    check gateway_health http://api-gateway:3000/health 200
    check ai_health http://ai-service:8001/health 200
    check booking_health http://booking-service:8002/health 200
    check restaurant_health http://restaurant-service:3001/health 200

    check auth_required_bookings http://api-gateway:3000/api/v1/bookings 401

    curl -sS -X POST http://api-gateway:3000/api/v1/ai/booking \
      -H "Content-Type: application/json" \
      -d "{\"message\":\"table for 2 italian tonight\"}" >/dev/null

    echo "SYNTHETIC_SMOKE_OK"
  '
