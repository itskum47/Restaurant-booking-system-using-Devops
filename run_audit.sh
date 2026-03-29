#!/bin/bash
# 1.1
echo "=== 1.1 ==="
cd services/ai-service
grep -n "March\|next Friday\|tomorrow\|evening\|AM\|PM\|occasion\|special_request" \
  app/llm_service.py | head -30
cd ../..
# 1.2
echo "=== 1.2 ==="
grep -n "generate_time_slots\|hardcoded\|17:00\|18:00\|19:00\|20:00\|21:00\|SELECT\|query" \
  services/ai-service/app/llm_service.py \
  services/booking-service/app/routes/bookings.py 2>/dev/null | head -20
# 1.3
echo "=== 1.3 ==="
grep -rn "waitlist\|waitlisted\|HTTP 202\|status.*202" \
  services/booking-service/app/ --include="*.py" | head -10
grep -n "waitlist" k8s/jobs/db-migration-configmap.yaml 2>/dev/null || \
grep -n "waitlist" k8s/jobs/db-migration-job.yaml 2>/dev/null
# 1.4
echo "=== 1.4 ==="
grep -rn "api/v1\|prefix.*v1" services/booking-service/app/ \
  services/ai-service/app/ --include="*.py" | head -5
grep -n "openapi\|swagger" services/booking-service/app/main.py \
  services/api-gateway/src/index.js 2>/dev/null | head -5
ls openapi*.json 2>/dev/null || \
ls services/*/openapi.json 2>/dev/null || echo "NO_OPENAPI_FILE"
# 1.5
echo "=== 1.5 ==="
grep -rn "language\|i18n\|detect_lang\|multilingual\|lang" \
  services/ai-service/app/ --include="*.py" | head -10
# 1.6
echo "=== 1.6 ==="
grep -rn "history\|preference\|collaborative\|recommend\|mock.*recommend\|fallback" \
  services/ai-service/app/ --include="*.py" | head -10

# 2.1
echo "=== 2.1 ==="
for svc in ai-service booking-service restaurant-service api-gateway \
           notification-service frontend; do
  path="services/$svc/Dockerfile"
  if [ ! -f "$path" ]; then path="$svc/Dockerfile"; fi
  if grep -q "AS builder\|AS base\|FROM.*AS" "$path" 2>/dev/null; then
    echo "✅ $svc: multi-stage"
  else
    echo "❌ $svc: missing or single-stage"
  fi
done
# 2.2
echo "=== 2.2 ==="
for svc in ai-service booking-service restaurant-service api-gateway \
           notification-service frontend; do
  path="services/$svc/.dockerignore"
  if [ ! -f "$path" ]; then path="$svc/.dockerignore"; fi
  [ -f "$path" ] && echo "✅ $svc" || echo "❌ $svc: missing .dockerignore"
done
# 2.3
echo "=== 2.3 ==="
grep -c "healthcheck:" docker-compose.yml
grep "healthcheck:" docker-compose.yml
# 2.4
echo "=== 2.4 ==="
grep -n "sha\|SHA\|git.*rev\|IMAGE_TAG\|github.sha\|CI_COMMIT_SHA" \
  .github/workflows/ci-cd.yml \
  .gitlab-ci.yml \
  docker-compose.yml \
  helm/restaurant-booking/values.yaml 2>/dev/null | head -10
# 2.5
echo "=== 2.5 ==="
grep -n "registry\|ECR\|GCR\|docker.io\|REGISTRY\|imageRegistry" \
  .github/workflows/ci-cd.yml \
  helm/restaurant-booking/values.yaml 2>/dev/null | head -10
# 2.6
echo "=== 2.6 ==="
for svc in ai-service booking-service; do
  path="services/$svc/Dockerfile"
  if [ ! -f "$path" ]; then path="$svc/Dockerfile"; fi
  grep -q "HEALTHCHECK" "$path" 2>/dev/null && \
    echo "✅ $svc" || echo "❌ $svc: missing HEALTHCHECK"
done
# 2.7
echo "=== 2.7 ==="
grep -rn "USER\|adduser\|runAsNonRoot\|runAsUser" \
  services/*/Dockerfile */Dockerfile 2>/dev/null | grep -v "#" | head -10
grep -n "runAsNonRoot" k8s/rbac/service-accounts.yaml \
  helm/restaurant-booking/values.yaml 2>/dev/null | head -5

# 3.1
echo "=== 3.1 ==="
ls k8s/namespaces/ 2>/dev/null
grep -l "ResourceQuota\|LimitRange" k8s/namespaces/*.yaml 2>/dev/null || \
grep -l "ResourceQuota\|LimitRange" k8s/resource-quotas/*.yaml 2>/dev/null
grep "restaurant-system-dev\|restaurant-system-staging\|restaurant-system-prod" \
  k8s/namespaces/*.yaml 2>/dev/null | head -5
# 3.2
echo "=== 3.2 ==="
grep -rn "RollingUpdate\|maxSurge\|maxUnavailable" k8s/ \
  helm/restaurant-booking/templates/ 2>/dev/null | head -5
grep -rn "replicas:" k8s/ helm/restaurant-booking/ 2>/dev/null | head -5
# 3.3
echo "=== 3.3 ==="
grep -rn "ClusterIP\|LoadBalancer" k8s/ \
  helm/restaurant-booking/templates/ 2>/dev/null | head -10
grep -n "Ingress\|ingressClassName\|nginx" \
  k8s/ingress/ingress.yaml \
  helm/restaurant-booking/templates/ingress.yaml 2>/dev/null | head -5
# 3.4
echo "=== 3.4 ==="
grep -rn "kind: ConfigMap" k8s/ \
  helm/restaurant-booking/templates/ 2>/dev/null | head -10
grep -rn "configMapKeyRef\|configMapRef" k8s/ \
  helm/restaurant-booking/templates/ 2>/dev/null | head -5
# 3.5
echo "=== 3.5 ==="
ls k8s/secrets/external-secrets.yaml 2>/dev/null || \
ls k8s/external-secrets/ 2>/dev/null
grep -c "ExternalSecret\|SecretStore" \
  k8s/secrets/external-secrets.yaml 2>/dev/null || echo "0"
grep -rn "secret123\|supersecretkey\|password123" \
  k8s/ helm/ services/ --include="*.yaml" --include="*.py" \
  --include="*.js" --include="*.env" 2>/dev/null | grep -v "#\|test\|mock"
# 3.6
echo "=== 3.6 ==="
cat k8s/autoscaling/hpa.yaml 2>/dev/null || \
cat k8s/*/hpa.yaml 2>/dev/null || \
cat helm/restaurant-booking/templates/hpa.yaml 2>/dev/null
grep -n "AverageValue\|Pods\|External\|bookings\|ai_inference" \
  k8s/autoscaling/hpa.yaml 2>/dev/null | head -10
# 3.7
echo "=== 3.7 ==="
grep -rn "requests:\|limits:" \
  helm/restaurant-booking/values.yaml \
  k8s/*/deployment*.yaml 2>/dev/null | wc -l
# 3.8
echo "=== 3.8 ==="
grep -rn "livenessProbe:\|readinessProbe:" \
  k8s/ helm/restaurant-booking/templates/ 2>/dev/null | wc -l
# 3.9
echo "=== 3.9 ==="
grep -rn "PersistentVolumeClaim\|volumeClaimTemplates\|PVC" \
  k8s/ 2>/dev/null | head -10
# 3.10
echo "=== 3.10 ==="
grep -n "kind: NetworkPolicy" \
  k8s/network-policies/default-deny.yaml \
  k8s/network-policies/allow-policies.yaml \
  k8s/security/network-policies.yaml 2>/dev/null
grep -c "kind: NetworkPolicy" \
  k8s/network-policies/*.yaml \
  k8s/security/*.yaml 2>/dev/null | awk -F: '{sum+=$2} END{print sum}'
# 3.11
echo "=== 3.11 ==="
grep -c "kind: PodDisruptionBudget" \
  k8s/pod-disruption-budgets/pdbs.yaml \
  k8s/security/pod-disruption-budgets.yaml 2>/dev/null
# 3.12
echo "=== 3.12 ==="
grep -n "tls:\|cert-manager\|letsencrypt\|ssl-redirect" \
  k8s/ingress/ingress.yaml \
  helm/restaurant-booking/templates/ingress.yaml 2>/dev/null
# 3.13
echo "=== 3.13 ==="
grep -c "kind: ServiceAccount" k8s/rbac/service-accounts.yaml 2>/dev/null
grep -c "kind: Role\b" k8s/rbac/roles.yaml 2>/dev/null
grep -c "kind: RoleBinding" k8s/rbac/role-bindings.yaml 2>/dev/null

# 4.1
echo "=== 4.1 ==="
ls helm/restaurant-booking/Chart.yaml \
   helm/restaurant-booking/values.yaml \
   helm/restaurant-booking/templates/ 2>/dev/null
ls helm/restaurant-booking/templates/*.yaml 2>/dev/null | wc -l
# 4.2
echo "=== 4.2 ==="
ls helm/restaurant-booking/values-dev.yaml \
   helm/restaurant-booking/values-staging.yaml \
   helm/restaurant-booking/values-prod.yaml 2>/dev/null
# 4.3
echo "=== 4.3 ==="
grep -n "existingSecret\|secretKeyRef\|externalSecret" \
  helm/restaurant-booking/values.yaml | head -10
grep -rn "password:\s*['\"]?\w" helm/restaurant-booking/values.yaml | \
  grep -v "existingSecret\|#\|''\|\"\"" | head -5
# 4.4
echo "=== 4.4 ==="
grep -rn "helm.sh/hook" \
  helm/restaurant-booking/templates/ \
  k8s/jobs/ 2>/dev/null | head -10
grep "pre-install\|pre-upgrade" \
  helm/restaurant-booking/templates/*.yaml 2>/dev/null | head -3
grep "post-install\|post-upgrade" \
  helm/restaurant-booking/templates/*.yaml 2>/dev/null | head -3
# 4.5
echo "=== 4.5 ==="
helm lint helm/restaurant-booking/ --strict 2>&1 || true
# 4.6
echo "=== 4.6 ==="
helm template restaurant-booking helm/restaurant-booking/ \
  -f helm/restaurant-booking/values-prod.yaml > /dev/null 2>&1 && \
  echo "RENDER_OK" || echo "RENDER_FAILED"
# 4.7
echo "=== 4.7 ==="
grep -E "^version:|^appVersion:" helm/restaurant-booking/Chart.yaml

# 5.1
echo "=== 5.1 ==="
cat .github/workflows/ci-cd.yml 2>/dev/null | \
  grep -E "test|lint|scan|trivy|push|deploy|build" | head -20
# 5.2
echo "=== 5.2 ==="
find services/ -name "test_*.py" -o -name "*.test.js" \
  -o -name "*.spec.js" 2>/dev/null | wc -l
grep -rn "cov-fail-under\|coverageThreshold\|--coverage" \
  services/*/pytest.ini \
  services/*/pyproject.toml \
  services/*/package.json 2>/dev/null | head -5
# 5.3
echo "=== 5.3 ==="
grep -rn "trivy\|snyk\|grype" \
  .github/workflows/*.yml \
  .gitlab-ci.yml 2>/dev/null | head -5
# 5.4
echo "=== 5.4 ==="
grep -rn "canary\|blue.green\|bluegreen\|blue_green\|ArgoRollout\|Rollout" \
  k8s/ .github/ .gitlab-ci.yml 2>/dev/null | head -5
# 5.5
echo "=== 5.5 ==="
grep -rn "environment:\|staging\|production\|approval\|wait_for_approval\|needs.*staging" \
  .github/workflows/ci-cd.yml \
  .gitlab-ci.yml 2>/dev/null | head -10
# 5.6
echo "=== 5.6 ==="
find . -name "Application.yaml" -o -name "argo*.yaml" \
  -o -name "flux*.yaml" 2>/dev/null | head -5
grep -rn "argoproj\|fluxcd\|gitops" . \
  --include="*.yaml" 2>/dev/null | head -5

# 6.1
echo "=== 6.1 ==="
grep -rn "kube-prometheus-stack\|prometheus-community" \
  k8s/monitoring/*.yaml \
  .github/workflows/*.yml \
  Makefile 2>/dev/null | head -5
# 6.2
echo "=== 6.2 ==="
grep -c "kind: ServiceMonitor" \
  k8s/monitoring/prometheus-rules.yaml \
  k8s/monitoring/service-monitors.yaml 2>/dev/null || echo 0
# 6.3
echo "=== 6.3 ==="
grep -rn "bookings_created_total\|waitlist_size\|mock_recommendation_total\|http_requests_total" \
  services/booking-service/app/ \
  services/ai-service/app/ --include="*.py" | head -10
# 6.4
echo "=== 6.4 ==="
grep -n "kubeStateMetrics\|nodeExporter\|kube-state-metrics\|node-exporter" \
  k8s/monitoring/*.yaml 2>/dev/null | head -5
# 6.5
echo "=== 6.5 ==="
grep -c "alert:" k8s/monitoring/prometheus-rules.yaml 2>/dev/null || echo 0
# 6.6
echo "=== 6.6 ==="
ls k8s/monitoring/alertmanager/alertmanager-config.yaml 2>/dev/null
grep -n "slack\|pagerduty\|receiver" \
  k8s/monitoring/alertmanager/alertmanager-config.yaml 2>/dev/null | head -10
# 6.7
echo "=== 6.7 ==="
grep -c "record:" k8s/monitoring/prometheus-rules.yaml 2>/dev/null || echo 0
# 6.8
echo "=== 6.8 ==="
grep -rn "ai_inference_duration\|ai_requests_total\|accuracy\|model_version" \
  services/ai-service/app/ --include="*.py" | head -5

# 7.1
echo "=== 7.1 ==="
ls k8s/monitoring/grafana/datasources-configmap.yaml 2>/dev/null
grep -n "Prometheus\|Loki\|Tempo" \
  k8s/monitoring/grafana/datasources-configmap.yaml 2>/dev/null | head -6
# 7.2
echo "=== 7.2 ==="
ls k8s/monitoring/grafana/dashboards/*.json 2>/dev/null
ls k8s/monitoring/grafana/dashboards/*.json 2>/dev/null | wc -l
# 7.3
echo "=== 7.3 ==="
ls k8s/monitoring/grafana/dashboard-provisioner*.yaml 2>/dev/null
grep -n "providers\|path.*dashboards" \
  k8s/monitoring/grafana/dashboard-provisioner*.yaml 2>/dev/null | head -5
# 7.4 to 7.8
echo "=== 7.4-7.8 ==="
for dash in system-overview booking-service ai-service business-metrics slo-sla; do
  f="k8s/monitoring/grafana/dashboards/${dash}.json"
  if [ -f "$f" ]; then
    panels=$(grep -c '"type"' "$f" 2>/dev/null || echo 0)
    echo "✅ ${dash}.json — ${panels} panels"
  else
    echo "❌ ${dash}.json — MISSING"
  fi
done

# 8.1
echo "=== 8.1 ==="
grep -n "kind: StatefulSet" \
  k8s/databases/postgres-statefulset.yaml 2>/dev/null || \
grep -rn "kind: StatefulSet" k8s/ --include="*.yaml" 2>/dev/null | grep -i postgres
# 8.2
echo "=== 8.2 ==="
ls k8s/jobs/db-migration-job.yaml 2>/dev/null
grep -n "flyway\|Flyway\|migrate" k8s/jobs/db-migration-job.yaml 2>/dev/null | head -3
grep -n "helm.sh/hook.*pre" k8s/jobs/db-migration-job.yaml \
  helm/restaurant-booking/templates/*.yaml 2>/dev/null | head -3
# 8.3
echo "=== 8.3 ==="
grep -n "requirepass\|REDIS_PASSWORD\|auth.enabled" \
  k8s/databases/redis-deployment.yaml \
  helm/restaurant-booking/values.yaml 2>/dev/null | head -5
# 8.4
echo "=== 8.4 ==="
grep -c "kind: CronJob" \
  k8s/cronjobs/postgres-backup.yaml \
  k8s/cronjobs/mongodb-backup.yaml 2>/dev/null || echo 0
ls k8s/cronjobs/*.yaml 2>/dev/null
# 8.5
echo "=== 8.5 ==="
grep -rn "pgbouncer\|PgBouncer\|6432" k8s/ \
  helm/restaurant-booking/ 2>/dev/null | head -5

# 9.1
echo "=== 9.1 ==="
grep -rn "istio\|linkerd\|mtls\|mTLS\|PeerAuthentication\|ServiceMesh" \
  k8s/ --include="*.yaml" 2>/dev/null | head -5
# 9.2
echo "=== 9.2 ==="
grep -rn "JWT\|jwt\|Bearer\|auth.*middleware\|verify.*token" \
  services/api-gateway/src/ \
  services/booking-service/app/ --include="*.py" --include="*.js" | head -10
grep -n "allow_origins" services/*/app/main.py 2>/dev/null
# 9.3
echo "=== 9.3 ==="
grep -rn "RATE_LIMIT\|rateLimit\|rate_limit\|slowDown\|express-rate-limit" \
  services/api-gateway/src/ --include="*.js" | head -5
grep -rn "nginx.ingress.*limit\|rate-limit" \
  k8s/ingress/ingress.yaml \
  helm/restaurant-booking/templates/ingress.yaml 2>/dev/null | head -5
# 9.4
echo "=== 9.4 ==="
grep -rn "guest_email\|guest_name\|phone\|print.*email\|logger.*email" \
  services/booking-service/app/ --include="*.py" | head -10
grep -rn "redact\|mask\|PII\|gdpr\|password.*filter\|token.*filter" \
  k8s/logging/ services/ --include="*.py" --include="*.yaml" | head -5
# 9.5
echo "=== 9.5 ==="
grep -rn "pod-security.kubernetes.io" k8s/namespaces/*.yaml 2>/dev/null | head -5
# 9.6
echo "=== 9.6 ==="
ls k8s/secrets/external-secrets.yaml 2>/dev/null
grep -n "refreshInterval\|rotation\|SecretStore\|ClusterSecretStore" \
  k8s/secrets/external-secrets.yaml 2>/dev/null | head -5

# 10.1
echo "=== 10.1 ==="
ls k8s/logging/fluent-bit-config.yaml \
   k8s/logging/promtail-config.yaml \
   k8s/logging/loki-values.yaml 2>/dev/null
grep -n "Loki\|Elasticsearch\|fluent\|promtail" \
  k8s/logging/*.yaml 2>/dev/null | head -5
# 10.2
echo "=== 10.2 ==="
grep -rn "structlog\|correlation_id\|x-correlation-id\|CorrelationID" \
  services/booking-service/app/ \
  services/ai-service/app/ --include="*.py" | head -10
grep -rn "print(" services/booking-service/app/ \
  services/ai-service/app/ --include="*.py" | grep -v "#\|test" | head -5
# 10.3
echo "=== 10.3 ==="
grep -rn "opentelemetry\|OTLPSpanExporter\|TracerProvider\|setup_tracing" \
  services/booking-service/app/ \
  services/ai-service/app/ --include="*.py" | head -5
ls k8s/monitoring/tempo/tempo-values.yaml 2>/dev/null
# 10.4
echo "=== 10.4 ==="
grep -rn "retention\|30.*day\|rotate\|maxAge\|retentionPeriod" \
  k8s/logging/ k8s/monitoring/tempo/ 2>/dev/null | head -5
# 10.5
echo "=== 10.5 ==="
grep -rn "sentry\|Sentry\|SENTRY_DSN\|exception_handler\|capture_exception" \
  services/ --include="*.py" --include="*.js" | head -5

# 11.1
echo "=== 11.1 ==="
ls load-tests/*.js 2>/dev/null
grep -c "export const options" load-tests/*.js 2>/dev/null || echo 0
grep -n "thresholds:" load-tests/booking-flow.js 2>/dev/null | head -3
# 11.2
echo "=== 11.2 ==="
ls docs/runbooks/*.md 2>/dev/null
grep "alert:" k8s/monitoring/prometheus-rules.yaml 2>/dev/null | \
  awk '{print $2}' | while read alert; do
    [ -f "docs/runbooks/${alert}.md" ] && \
      echo "✅ runbook: $alert" || \
      echo "❌ missing runbook: $alert"
  done
# 11.3
echo "=== 11.3 ==="
ls docs/disaster-recovery.md 2>/dev/null
grep -n "RTO\|RPO\|30 min\|1 hour" docs/disaster-recovery.md 2>/dev/null | head -5
grep -c "Scenario\|scenario\|##" docs/disaster-recovery.md 2>/dev/null || echo 0
# 11.4
echo "=== 11.4 ==="
grep -rn "litmus\|chaos\|LitmusChaos\|ChaosEngine\|pod.kill" \
  k8s/ --include="*.yaml" 2>/dev/null | head -5

# 12.1
echo "=== 12.1 ==="
ls docs/architecture.md 2>/dev/null
grep -n "Container\|Context\|Level\|C4\|Flow\|Service" \
  docs/architecture.md 2>/dev/null | wc -l
# 12.2
echo "=== 12.2 ==="
ls openapi.json services/*/openapi.json 2>/dev/null
grep -rn "openapi.*export\|/docs\|swagger" \
  services/booking-service/app/main.py \
  Makefile 2>/dev/null | head -5
# 12.3
echo "=== 12.3 ==="
grep -n "deploy\|test\|install\|run\|make\|docker" README.md 2>/dev/null | head -10
wc -l README.md 2>/dev/null
# 12.4
echo "=== 12.4 ==="
ls docs/oncall.md 2>/dev/null
grep -n "escalat\|L1\|L2\|pagerduty\|on.call\|Owner" \
  docs/oncall.md 2>/dev/null | head -5
