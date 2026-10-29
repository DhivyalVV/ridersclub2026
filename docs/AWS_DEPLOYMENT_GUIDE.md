# RidersClub — AWS Deployment & Terraform Operations Guide (Phase 15)

> **Cost Guardrail Notice**: No cloud resources are provisioned automatically. All Terraform configurations in [`infrastructure/terraform/`](../infrastructure/terraform/) and the manual workflow in [`.github/workflows/deploy-aws.yml`](../.github/workflows/deploy-aws.yml) require explicit operator execution.

---

## 1. AWS Reference Architecture

1. **Frontend Edge & Micro-Frontend Hosting (`S3 + CloudFront`)**:
   - `@ridersclub/shell` and all 6 federated remotes (`community`, `rides`, `help`, `mechanics`, `garage`, `marketplace`) are compiled to static bundles and stored in an encrypted private S3 bucket (`aws_s3_bucket.mfe_assets`) fronted by Amazon CloudFront with Origin Access Control (OAC).
   - **Cache Policy Separation**:
     - Hashed Vite chunks (`/assets/*`) are served with `Cache-Control: public, max-age=31536000, immutable`.
     - Module Federation manifests (`*remoteEntry.js`) and `/index.html` are served with `TTL = 0` (`no-cache, no-store, must-revalidate`) so independent remote deployments roll out immediately without stale manifest errors.
2. **Backend Compute (`Amazon ECS Fargate + Application Load Balancer`)**:
   - `@ridersclub/api` runs as a non-root container (`infrastructure/docker/Dockerfile.api`) on AWS Fargate across two Availability Zones behind an Application Load Balancer (`aws_lb.api_alb`) with `/api/v1/health` target group checks.
3. **Database & Media Storage (`Amazon RDS PostgreSQL 16 + S3`)**:
   - `aws_db_instance.postgres` runs PostgreSQL 16.4 in private subnets accessible strictly from the ECS API security group (`port 5432`).
   - `aws_s3_bucket.media_uploads` stores validated JPEG/PNG/WebP Marketplace and Garage images with AES-256 server-side encryption and public access blocked.
4. **Automated Cost Guardrail (`AWS Budgets`)**:
   - `aws_budgets_budget.monthly_guardrail` sends email alerts at **80% actual** and **100% forecasted** monthly spend against `monthly_budget_limit_usd` (default `$50/month`).

---

## 2. Estimated Monthly AWS Cost Breakdown (Staging / Low-Traffic Prod)

| AWS Service | Configuration | Estimated Monthly Cost (USD) |
| :--- | :--- | :--- |
| **Amazon ECS Fargate** | 1 task (`0.25 vCPU`, `512 MiB` RAM) | `~$9.00` |
| **Application Load Balancer** | 1 ALB + minimal LCU usage | `~$16.50` |
| **Amazon RDS PostgreSQL 16** | `db.t4g.micro` (20 GB GP3 storage, Single-AZ staging) | `~$14.50` |
| **Amazon S3 + CloudFront** | MFE static bundles + 10 GB media + 50 GB CDN transfer | `~$1.50` |
| **CloudWatch Logs & ECR** | 14-day log retention + Docker image storage | `~$1.50` |
| **Estimated Total** | | **`~$43.00 / month`** |

---

## 3. Step-by-Step Provisioning & Teardown Commands

### Validate & Plan Terraform (Dry Run — $0 Cost)
```powershell
cd infrastructure/terraform
terraform init -backend=false
terraform validate
terraform plan -var="db_password=ChangeMe_StrongPassword_2026!"
```

### Provision Infrastructure (Only When Ready to Deploy)
```powershell
cd infrastructure/terraform
terraform apply -var="environment=staging" -var="db_password=ChangeMe_StrongPassword_2026!"
```

### Destroy Infrastructure (Stop All Billing Immediately)
```powershell
cd infrastructure/terraform
terraform destroy -var="environment=staging" -var="db_password=ChangeMe_StrongPassword_2026!"
```

