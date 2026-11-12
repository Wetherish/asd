# Deploy to AWS

CI/CD pipeline for the **asd-server** backend: GitHub Actions builds the Docker
image, pushes it to **Amazon ECR**, and deploys it to a **single EC2 host**
running the container against **RDS PostgreSQL**.

Everything here stays inside the AWS **Free Tier** (12-month, new accounts):

| Resource | Free Tier allowance |
|----------|---------------------|
| EC2 `t3.micro` | 750 hrs/month |
| RDS `db.t3.micro` (single-AZ, 20 GB) | 750 hrs/month + 20 GB |
| ECR | 500 MB storage |

> No NAT gateway, no Application Load Balancer — those aren't free. The host is
> in a public subnet and the database is in private subnets, reachable only
> from the host. This is a single-instance, non-HA setup by design.

## Architecture

```
GitHub push ──> Actions ──> build & push ──> ECR
                             │
                             └──> SSH to EC2 ──> docker pull & up
                                                     │
                     EC2 (public subnet) ──> RDS Postgres (private subnet)
```

---

## One-time setup

### 1. Prerequisites

- An AWS account (Free Tier eligible).
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed and configured (`aws configure`).
- [Terraform](https://developer.hashicorp.com/terraform/install) ≥ 1.3.
- An SSH key pair (`ssh-keygen -t ed25519` if you don't have one).

### 2. Create a CI deploy user

The pipeline needs an IAM user that can push to ECR:

```bash
aws iam create-user --user-name asd-cicd
aws iam attach-user-policy \
  --user-name asd-cicd \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser
aws iam create-access-key --user-name asd-cicd
```

Save the `AccessKeyId` and `SecretAccessKey` — you'll put them in GitHub
secrets in step 5.

### 3. Provision the infrastructure

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars — set ssh_public_key and (recommended) ssh_cidr to your IP

terraform init
terraform plan
terraform apply
```

`apply` prints the values you need next:

```text
ec2_public_ip       = 203.0.113.42
app_url             = http://203.0.113.42:4000
ecr_repository_url  = 123456789012.dkr.ecr.us-east-1.amazonaws.com/asd
```

The host bootstraps itself on first boot (installs Docker, pulls the image,
runs it). It can take 1–2 minutes; watch `sudo tail -f /var/log/user-data.log`
over SSH if it's slow.

### 4. Configure GitHub secrets

In **repo → Settings → Secrets and variables → Actions**, add:

| Secret | Value |
|--------|-------|
| `AWS_ACCESS_KEY_ID` | From step 2 |
| `AWS_SECRET_ACCESS_KEY` | From step 2 |
| `ECR_REPOSITORY` | `ecr_repository_url` from step 3 |
| `EC2_HOST` | `ec2_public_ip` (or public DNS) from step 3 |
| `EC2_SSH_KEY` | Your **private** SSH key (`~/.ssh/id_ed25519`, the whole file) |
| `EC2_USER` | `ubuntu` (optional — defaults to `ubuntu`) |

Optional repository **variable**:

| Variable | Value |
|----------|-------|
| `AWS_REGION` | e.g. `us-east-1` (defaults to `us-east-1`) |

### 5. Deploy

Push to `main` (or run the workflow manually from the Actions tab):

```bash
git push origin main
```

The workflow builds, pushes, and deploys. Verify:

```bash
curl http://<ec2_public_ip>:4000/api/v1/auth/session \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@asd.app"}'
```

---

## Everyday operations

- **Redeploy** — push to `main`, or run `Deploy to AWS` from the Actions tab.
- **See logs** — `ssh ubuntu@<ip> 'cd /opt/asd && docker compose logs -f asd-server'`.
- **SSH in** — `ssh -i ~/.ssh/id_ed25519 ubuntu@<ip>`.
- **Change app config** — edit `/opt/asd/.env` on the host, then
  `docker compose up -d`.
- **Destroy everything** — `terraform destroy` (deletes EC2, RDS, ECR, VPC).

## Notes & next steps

- **Secrets** — the DB password and JWT secret are auto-generated and stored in
  Terraform state (marked `sensitive`). Move them to AWS Secrets Manager and/or
  remote state (S3 + DynamoDB lock) before going beyond a single environment.
- **Static credentials** — the pipeline uses an IAM access key. The more secure
  option is GitHub's OIDC provider + an IAM role with `role-to-assume`; swap
  `configure-aws-credentials` accordingly.
- **TLS / domain** — the app is served over plain HTTP on `:4000`. For a public
  deployment, front it with a domain + TLS (e.g. Caddy on the host, or an ALB
  once you leave the free tier).
- **SQLite → Postgres** — the schema was migrated to PostgreSQL (see
  `asd-server/prisma/migrations/0001_init`). Local dev uses the `db` service in
  `asd-server/docker-compose.yml`.
