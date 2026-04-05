variable "region" { type = string }

variable "cluster_role_arn" { type = string }
variable "node_role_arn" { type = string }
variable "oidc_provider_arn" { type = string }
variable "oidc_provider_url" { type = string }
variable "secret_arns" { type = list(string) }

variable "private_subnets" {
  type = map(object({
    cidr = string
    az   = string
  }))
}

variable "public_subnets" {
  type = map(object({
    cidr = string
    az   = string
  }))
}
