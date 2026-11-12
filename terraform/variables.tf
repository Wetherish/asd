variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name, used to prefix resource names and the ECR repo."
  type        = string
  default     = "asd"
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "prod"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "instance_type" {
  description = "EC2 instance type. t3.micro is Free Tier eligible."
  type        = string
  default     = "t3.micro"
}

variable "db_instance_class" {
  description = "RDS instance class. db.t3.micro is Free Tier eligible."
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "PostgreSQL database name."
  type        = string
  default     = "asd"
}

variable "db_username" {
  description = "PostgreSQL master username."
  type        = string
  default     = "asd"
}

variable "db_password" {
  description = "PostgreSQL master password. Leave empty to auto-generate."
  type        = string
  sensitive   = true
  default     = ""
}

variable "jwt_secret" {
  description = "Secret used to sign JWTs. Leave empty to auto-generate."
  type        = string
  sensitive   = true
  default     = ""
}

variable "ssh_public_key" {
  description = "Public key material (OpenSSH) for SSH access to the EC2 host."
  type        = string
}

variable "ssh_cidr" {
  description = "CIDR allowed to SSH into the host. Restrict to your own IP."
  type        = string
  default     = "0.0.0.0/0"
}

variable "app_cidr" {
  description = "CIDR allowed to reach the app over HTTP."
  type        = string
  default     = "0.0.0.0/0"
}

variable "app_port" {
  description = "Port the app listens on inside the container."
  type        = number
  default     = 4000
}

variable "cors_origin" {
  description = "Allowed CORS origins (comma-separated list, or '*' for any)."
  type        = string
  default     = "*"
}

variable "llm_provider" {
  description = "LLM provider: openai | anthropic | deepseek | openrouter | openai-compatible."
  type        = string
  default     = "openai"
}

variable "llm_api_key" {
  description = "LLM API key. Empty uses the deterministic fallback engine."
  type        = string
  sensitive   = true
  default     = ""
}

variable "llm_model" {
  description = "LLM model identifier."
  type        = string
  default     = "gpt-4o-mini"
}

variable "llm_base_url" {
  description = "Optional LLM base URL override."
  type        = string
  default     = ""
}

variable "seed_on_start" {
  description = "Whether the container seeds demo data on first start."
  type        = string
  default     = "true"
}
