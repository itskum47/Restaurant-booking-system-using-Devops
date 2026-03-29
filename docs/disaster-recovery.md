# Disaster Recovery Plan
## RTO and RPO Requirements
- Recovery Time Objective (RTO): 30 mins
- Recovery Point Objective (RPO): 1 hour

## Scenarios
### Scenario 1: Database Failure
Restore the database from the latest EBS snapshot.

### Scenario 2: Cluster Failure
Provision a new EKS cluster using our Terraform scripts and redeploy Helm charts.
