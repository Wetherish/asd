resource "aws_db_subnet_group" "postgres" {
  name       = "${local.name_prefix}-rds-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = { Name = "${local.name_prefix}-rds-subnet-group" }
}

resource "aws_db_instance" "postgres" {
  identifier = "${local.name_prefix}-postgres"

  engine         = "postgres"
  engine_version = "16"
  instance_class = var.db_instance_class

  db_name  = var.db_name
  username = var.db_username
  password = local.db_password

  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.postgres.name

  publicly_accessible     = false
  multi_az                = false
  skip_final_snapshot     = true
  # Free Tier (new AWS experience) caps automated-backup retention below 7 days.
  # 0 disables automated backups. Raise this after upgrading the account plan.
  backup_retention_period = 0

  tags = { Name = "${local.name_prefix}-postgres" }
}
