# --- Stable public IP ---------------------------------------------------------
# Auto-assigned public IPs change on every stop/start (a user_data change
# triggers one), so pin the app host to a stable Elastic IP.

resource "aws_eip" "app" {
  domain = "vpc"
}

resource "aws_eip_association" "app" {
  instance_id   = aws_instance.app.id
  allocation_id = aws_eip.app.id
}
