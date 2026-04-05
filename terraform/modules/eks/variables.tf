variable "cluster_name" { type = string }
variable "kubernetes_version" { type = string }
variable "cluster_role_arn" { type = string }
variable "node_role_arn" { type = string }
variable "subnet_ids" { type = list(string) }
variable "instance_types" { type = list(string) }
variable "node_desired" { type = number }
variable "node_min" { type = number }
variable "node_max" { type = number }
variable "tags" {
  type    = map(string)
  default = {}
}
