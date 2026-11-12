output "ec2_public_ip" {
  description = "Public IP of the app host."
  value       = aws_eip.app.public_ip
}

output "ec2_public_dns" {
  description = "Public DNS name of the app host."
  value       = aws_eip.app.public_dns
}

output "app_url" {
  description = "Base URL of the running app (REST /api/v1, WS /ws)."
  value       = "http://${aws_eip.app.public_ip}:${var.app_port}"
}

output "database_endpoint" {
  description = "RDS PostgreSQL endpoint (host:port)."
  value       = aws_db_instance.postgres.endpoint
}

output "ecr_repository_url" {
  description = "ECR repository URI. Set this as the CI ECR_REPOSITORY secret."
  value       = aws_ecr_repository.app.repository_url
}

output "ssh_command" {
  description = "SSH command to reach the host."
  value       = "ssh -i <your-private-key> ubuntu@${aws_eip.app.public_ip}"
}

output "database_password" {
  description = "Generated database password (sensitive)."
  value       = local.db_password
  sensitive   = true
}

output "cognito_user_pool_id" {
  description = "Cognito user pool ID."
  value       = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  description = "Cognito app client ID."
  value       = aws_cognito_user_pool_client.web.id
}

output "kms_key_id" {
  description = "KMS key used to encrypt per-user LLM API keys."
  value       = aws_kms_key.app.key_id
}
