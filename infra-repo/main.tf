module "vpc" {
  source = "./modules/vpc"

  cluster_name = var.cluster_name
  environment  = var.environment
}

module "eks" {
  source = "./modules/eks"
  admin_role_arn = "arn:aws:iam::442042534130:root"

  cluster_name       = var.cluster_name
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  node_instance_type = var.node_instance_type
  desired_node_count = var.desired_node_count
  min_node_count     = var.min_node_count
  max_node_count     = var.max_node_count
}