terraform {
  required_version = ">= 1.3.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Optional: store state remotely once you have an S3 bucket. For a first
  # deploy, local state works — but move to S3 before multiple people touch it.
  #
  # backend "s3" {
  #   bucket = "asd-terraform-state"
  #   key    = "prod/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = var.aws_region
}

data "aws_availability_zones" "available" {
  state = "available"
}

# Auto-generated secrets (override via variables for deterministic values).
resource "random_password" "db" {
  length  = 24
  special = false
}

resource "random_password" "jwt" {
  length  = 32
  special = false
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"

  db_password = var.db_password != "" ? var.db_password : random_password.db.result
  jwt_secret  = var.jwt_secret != "" ? var.jwt_secret : random_password.jwt.result

  azs = slice(data.aws_availability_zones.available.names, 0, 2)

  database_url = "postgresql://${var.db_username}:${local.db_password}@${aws_db_instance.postgres.endpoint}/${var.db_name}?schema=public"
}
