terraform {
  required_version = ">= 1.6.0"

  # Add this block
  backend "s3" {
    bucket = "platform-terraform-state-442042534130"
    key    = "eks/terraform.tfstate"
    region = "us-east-1"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}