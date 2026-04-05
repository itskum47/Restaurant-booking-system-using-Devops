variable "name" { type = string }
variable "oidc_provider_arn" { type = string }
variable "oidc_provider_url" { type = string }
variable "secret_arns" { type = list(string) }
variable "tags" {
  type    = map(string)
  default = {}
}
