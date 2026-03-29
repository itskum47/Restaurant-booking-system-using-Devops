# Disaster Recovery Plan

## Objectives
- **RTO (Recovery Time Objective):** 4 hours
- **RPO (Recovery Point Objective):** 1 hour

## 1. Database Failure (PostgreSQL / MongoDB)
### Scenario: Primary database pod crashes or volume gets corrupted.
**Action Plan:**
1. StatefulSet controller will automatically attempt to recreate the pod.
2. If volume is corrupted, restore from the latest backup in S3/GCS.
3. For Postgres: run the `pg_restore` command using the `db-backup` cronjob records.
4. For MongoDB: run `mongorestore` using the latest archive.

## 2. Cluster Complete Failure (Region Outage)
### Scenario: Entire Kubernetes cluster goes down due to regional outage.
**Action Plan:**
1. Update DNS/Traffic manager to route traffic to the standby region.
2. Ensure infrastructure is provisioned in the secondary region via Terraform.
3. Apply Kubernetes manifests (Helm charts) to the secondary cluster.
4. Restore latest database backups to the new region.
5. Verify application health using the smoke-test Helm hook before updating DNS.

## 3. High Severity Security Incident
### Scenario: Unauthorized access detected.
**Action Plan:**
1. Isolate the affected pods (NetworkPolicy or cordon).
2. Revoke and rotate all compromised secrets/keys via ExternalSecrets/Vault.
3. Analyze logs in the observability stack to identify the attack vector.
4. Deploy patch and restore uncompromised backup if data was tampered with.
