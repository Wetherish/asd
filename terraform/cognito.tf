# --- Cognito: real user authentication --------------------------------------
# Email is the sign-in identifier (auto-verified so sign-up is immediate).
# The backend uses the public SignUp / InitiateAuth flows (no IAM needed).

resource "aws_cognito_user_pool" "main" {
  name = "${local.name_prefix}-users"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = false
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }
}

resource "aws_cognito_user_pool_client" "web" {
  name         = "${local.name_prefix}-web"
  user_pool_id = aws_cognito_user_pool.main.id

  # No client secret → USER_PASSWORD_AUTH works without SECRET_HASH.
  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]
}

# Let the backend auto-confirm sign-ups (email-as-username pools don't
# auto-confirm via AutoVerifiedAttributes alone).
resource "aws_iam_policy" "cognito_admin" {
  name = "${local.name_prefix}-cognito-admin-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "cognito-idp:AdminConfirmSignUp",
        "cognito-idp:AdminUpdateUserAttributes",
      ]
      Resource = [aws_cognito_user_pool.main.arn]
    }]
  })
}

resource "aws_iam_role_policy_attachment" "cognito_admin" {
  role       = aws_iam_role.ec2.name
  policy_arn = aws_iam_policy.cognito_admin.arn
}
