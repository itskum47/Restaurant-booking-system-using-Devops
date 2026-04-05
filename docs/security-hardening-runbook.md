# Security Hardening Runbook

## 1. Immediate secret rotation plan

Rotate and revoke all previously committed credentials immediately:

1. NVIDIA/Groq/OpenAI style API keys
2. Stripe secret and webhook secret
3. Foursquare API key
4. JWT signing key
5. SMTP credentials
6. Database passwords
7. Grafana admin password

## 2. Git history purge (run in a controlled maintenance window)

```bash
# Backup first
git clone --mirror git@github.com:itskum47/Restaurant-booking-system-using-Devops.git repo-mirror.git
cd repo-mirror.git

# Remove sensitive files from all history (git-filter-repo required)
git filter-repo \
  --invert-paths \
  --path .env \
  --path services/frontend/.env \
  --path services/booking-service/.env

# Force push rewritten history
git push --force --all
git push --force --tags
```

After force-push, invalidate all existing local clones and re-clone.

## 3. Secret management target architecture

1. Runtime secrets in AWS Secrets Manager
2. Kubernetes secret sync via External Secrets Operator
3. CI secrets in GitHub Environments + protected secrets
4. No inline secrets in Helm values, Docker Compose, or source code

## 4. Required GitHub repository secrets

- KUBECONFIG_STAGING
- KUBECONFIG_PROD
- COSIGN_PRIVATE_KEY (if key-based signing is used)
- COSIGN_PASSWORD (if key-based signing is used)

## 5. Required Kubernetes secret keys

Use ExternalSecret resources to populate:

- restaurant-jwt-secret: JWT_SECRET
- restaurant-postgres-secret: POSTGRES_USER, POSTGRES_PASSWORD
- restaurant-mongo-secret: MONGO_URL
- restaurant-redis-secret: REDIS_URL
- restaurant-ai-keys: GEMINI_API_KEY
- restaurant-stripe-secret: STRIPE_SECRET_KEY

## 6. Mandatory blocking controls

1. Reject startup when required env vars are missing.
2. Block merge if Trivy HIGH/CRITICAL vulnerabilities are detected.
3. Enforce branch protections and signed commits.
4. Restrict production deployments to approved reviewers.

## 7. Post-remediation verification

```bash
# no exposed secrets in tracked files
grep -RInE "(sk_test_|whsec_|secret123|supersecretkey|nvapi-|gsk_)" . --exclude-dir=.git

# render and validate chart
helm lint helm/restaurant-booking
helm template restaurant-booking helm/restaurant-booking -f helm/restaurant-booking/values.yaml -f helm/restaurant-booking/values-staging.yaml >/tmp/staging.yaml
```
