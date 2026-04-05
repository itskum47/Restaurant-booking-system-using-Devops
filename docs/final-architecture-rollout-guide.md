# Final Architecture and Rollout Guide

## 1. Final Production Architecture

### Control Plane
- GitHub Actions for CI/CD orchestration
- GHCR as image registry
- Helm as single deployment source of truth
- Terraform for cloud infrastructure lifecycle

### Runtime Plane
- Kubernetes namespace per environment (staging, prod)
- Services:
  - frontend
  - api-gateway
  - ai-service
  - restaurant-service
  - booking-service
  - notification-service
- Data stores:
  - PostgreSQL
  - MongoDB
  - Redis

### Security Plane
- External Secrets Operator + AWS Secrets Manager
- Restricted Pod Security Standard labels
- NetworkPolicy default deny + explicit allows
- Non-root pods, RuntimeDefault seccomp, dropped capabilities
- JWT auth enforced (no bypass)

### Observability Plane
- Prometheus metrics collection
- Alertmanager routing
- Grafana dashboards
- Correlation ID propagation from gateway to downstream services

## 2. Deployment Model

- Local development: docker compose with required env injection
- Staging: Helm deployment with staging values
- Production: Helm deployment with progressive rollout steps

## 3. Release Strategy

### Staging
1. Build and push images
2. Generate SBOM
3. Trivy gating
4. Cosign signing
5. Deploy via Helm
6. Smoke tests

### Production
1. Manual environment approval gate
2. Progressive rollout step 1 (limited replica strategy)
3. Canary validation checks
4. Progressive rollout step 2 (full rollout)
5. Rollout status verification

## 4. Rollback Strategy

- Helm atomic deployments for safe failure rollback
- Explicit Helm rollback command available through operations runbooks
- Progressive rollout can halt before full traffic shift if canary checks fail

## 5. Secret and Key Governance

- No secrets hardcoded in source
- No fallback credentials allowed in auth or payment paths
- Rotation runbook documented in docs/security-hardening-runbook.md
- Git history cleanup commands documented for previously exposed secrets

## 6. Go-Live Verification Checklist

- helm lint passes
- helm template renders for staging and prod
- kubeconform validation passes in CI
- Trivy gate passes for all service images
- Cosign signing succeeds
- ExternalSecret sync healthy
- Readiness and liveness probes healthy
- SLO alerts and dashboards active

## 7. Recommended PR Order

1. Security cleanup and key rotation
2. Auth and fallback hardening
3. Helm security templates and staging values
4. CI/CD enterprise pipeline and supply-chain controls
5. Resilience controls (idempotency, retries, correlation IDs)
6. Progressive rollout manifests
7. Terraform infra baseline
8. Final documentation and runbooks
