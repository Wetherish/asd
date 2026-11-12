# --- KMS: per-user API-key encryption at rest ---------------------------------
# Each user's LLM API key is encrypted with this key before it's written to the
# database. The backend decrypts it (with the EC2 instance role) only when that
# user's agent runs.

resource "aws_kms_key" "app" {
  description             = "${local.name_prefix} app encryption key"
  deletion_window_in_days = 7
  enable_key_rotation     = true
}

resource "aws_kms_alias" "app" {
  name          = "alias/${local.name_prefix}-app"
  target_key_id = aws_kms_key.app.key_id
}

resource "aws_iam_policy" "kms" {
  name = "${local.name_prefix}-kms-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:GenerateDataKey",
      ]
      Resource = [aws_kms_key.app.arn]
    }]
  })
}

resource "aws_iam_role_policy_attachment" "kms" {
  role       = aws_iam_role.ec2.name
  policy_arn = aws_iam_policy.kms.arn
}
