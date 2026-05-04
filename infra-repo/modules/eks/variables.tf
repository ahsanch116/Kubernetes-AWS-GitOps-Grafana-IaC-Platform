variable "cluster_name"       { type = string }
variable "environment"        { type = string }
variable "vpc_id"             { type = string }
variable "private_subnet_ids" { type = list(string) }
variable "node_instance_type" { type = string }
variable "desired_node_count" { type = number }
variable "min_node_count"     { type = number }
variable "max_node_count"     { type = number }

variable "admin_role_arn" {
  description = "IAM ARN to grant cluster-admin access"
  type        = string
}