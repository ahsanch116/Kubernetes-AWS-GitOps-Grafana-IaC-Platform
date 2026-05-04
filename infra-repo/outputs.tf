output "cluster_name" {
  description = "EKS cluster name — used in kubectl and CI commands"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "EKS API server endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_certificate_authority" {
  description = "Base64 CA cert for kubeconfig"
  value       = module.eks.cluster_certificate_authority
  sensitive   = true
}

output "vpc_id" {
  value = module.vpc.vpc_id
}

output "configure_kubectl" {
  description = "Run this command after apply to configure kubectl"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${var.cluster_name}"
}