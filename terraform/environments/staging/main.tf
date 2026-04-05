terraform {
  required_version = ">= 1.6.0"
}

module "prod_like" {
  source = "../prod"

  region            = var.region
  cluster_role_arn  = var.cluster_role_arn
  node_role_arn     = var.node_role_arn
  oidc_provider_arn = var.oidc_provider_arn
  oidc_provider_url = var.oidc_provider_url
  secret_arns       = var.secret_arns
  private_subnets   = var.private_subnets
  public_subnets    = var.public_subnets
}
