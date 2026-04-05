terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

locals {
  name = "restaurant-booking-prod"
  tags = {
    environment = "prod"
    project     = "restaurant-booking"
    managed_by  = "terraform"
  }
}

module "network" {
  source          = "../../modules/network"
  name            = local.name
  vpc_cidr        = "10.40.0.0/16"
  private_subnets = var.private_subnets
  public_subnets  = var.public_subnets
  tags            = local.tags
}

module "eks" {
  source             = "../../modules/eks"
  cluster_name       = local.name
  kubernetes_version = "1.30"
  cluster_role_arn   = var.cluster_role_arn
  node_role_arn      = var.node_role_arn
  subnet_ids         = module.network.private_subnet_ids
  instance_types     = ["m6i.large"]
  node_desired       = 4
  node_min           = 3
  node_max           = 12
  tags               = local.tags
}

module "irsa" {
  source            = "../../modules/iam-irsa"
  name              = local.name
  oidc_provider_arn = var.oidc_provider_arn
  oidc_provider_url = var.oidc_provider_url
  secret_arns       = var.secret_arns
  tags              = local.tags
}
