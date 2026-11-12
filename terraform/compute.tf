data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_key_pair" "deploy" {
  key_name   = "${local.name_prefix}-deploy-key"
  public_key = var.ssh_public_key
}

# --- Instance profile: pull images from ECR + allow SSM access ---------------

resource "aws_iam_role" "ec2" {
  name = "${local.name_prefix}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "ec2.amazonaws.com" }
        Action    = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecr_read" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2.name
}

# --- The app host ------------------------------------------------------------

resource "aws_instance" "app" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public.id
  vpc_security_group_ids      = [aws_security_group.ec2.id]
  key_name                    = aws_key_pair.deploy.key_name
  iam_instance_profile        = aws_iam_instance_profile.ec2.name
  associate_public_ip_address = true

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
  }

  user_data = base64encode(templatefile("${path.module}/templates/user_data.sh.tpl", {
    region         = var.aws_region
    ecr_repository = aws_ecr_repository.app.repository_url
    database_url   = local.database_url
    jwt_secret     = local.jwt_secret
    cors_origin    = var.cors_origin
    llm_provider   = var.llm_provider
    llm_api_key    = var.llm_api_key
    llm_model      = var.llm_model
    llm_base_url   = var.llm_base_url
    seed_on_start  = var.seed_on_start
    app_port       = var.app_port

    kms_key_id           = aws_kms_key.app.key_id
    cognito_user_pool_id = aws_cognito_user_pool.main.id
    cognito_client_id    = aws_cognito_user_pool_client.web.id
  }))

  tags = { Name = "${local.name_prefix}-app" }
}
