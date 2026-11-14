#!/bin/bash
set -euo pipefail
exec > /var/log/user-data.log 2>&1

# ---------------------------------------------------------------------------
# Bootstrap: install Docker + Compose plugin + AWS CLI, then pull and run the
# app from ECR. Runs once at first launch; subsequent deploys are done by the
# CI pipeline over SSH.
# ---------------------------------------------------------------------------

apt-get update -y
apt-get install -y ca-certificates curl awscli

# Docker (Ubuntu 22.04 / jammy)
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu jammy stable" > /etc/apt/sources.list.d/docker.list
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
usermod -aG docker ubuntu

# --- App directory -----------------------------------------------------------

mkdir -p /opt/asd

cat > /opt/asd/.env <<'ENVEOF'
DATABASE_URL=${database_url}
JWT_SECRET=${jwt_secret}
AWS_REGION=${region}
KMS_KEY_ID=${kms_key_id}
COGNITO_USER_POOL_ID=${cognito_user_pool_id}
COGNITO_CLIENT_ID=${cognito_client_id}
PORT=${app_port}
CORS_ORIGIN=${cors_origin}
LLM_PROVIDER=${llm_provider}
LLM_API_KEY=${llm_api_key}
LLM_MODEL=${llm_model}
LLM_BASE_URL=${llm_base_url}
SEED_ON_START=${seed_on_start}
ECR_REPOSITORY=${ecr_repository}
IMAGE_TAG=latest
BLOB_DIR=/data/blobs
ENVEOF

cat > /opt/asd/docker-compose.yml <<'COMPOSEEOF'
services:
  asd-server:
    image: "$${ECR_REPOSITORY}:$${IMAGE_TAG:-latest}"
    init: true
    restart: unless-stopped
    ports:
      - "${app_port}:${app_port}"
    env_file:
      - .env
    volumes:
      - appdata:/data

volumes:
  appdata:
COMPOSEEOF

# --- First start -------------------------------------------------------------

cd /opt/asd
aws ecr get-login-password --region ${region} | docker login --username AWS --password-stdin ${ecr_repository}
docker compose pull
docker compose up -d
