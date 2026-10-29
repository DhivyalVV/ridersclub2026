variable "aws_region" {
  description = "AWS region for RidersClub infrastructure"
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Deployment environment name (staging or prod)"
  type        = string
  default     = "staging"
}

variable "vpc_cidr" {
  description = "CIDR block for the RidersClub VPC"
  type        = string
  default     = "10.20.0.0/16"
}

variable "db_instance_class" {
  description = "RDS PostgreSQL 16 instance class (cost-conscious default)"
  type        = string
  default     = "db.t4g.micro"
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "ridersclub_db"
}

variable "db_username" {
  description = "PostgreSQL master username"
  type        = string
  default     = "ridersclub_admin"
}

variable "db_password" {
  description = "PostgreSQL master password (pass via TF_VAR_db_password)"
  type        = string
  sensitive   = true
}

variable "api_cpu" {
  description = "ECS Fargate CPU units for @ridersclub/api (256 = 0.25 vCPU)"
  type        = number
  default     = 256
}

variable "api_memory" {
  description = "ECS Fargate memory (MiB) for @ridersclub/api"
  type        = number
  default     = 512
}

variable "monthly_budget_limit_usd" {
  description = "Monthly AWS cost guardrail alert threshold in USD"
  type        = string
  default     = "50"
}

variable "budget_alert_email" {
  description = "Email address to receive AWS Budgets 80% and 100% alerts"
  type        = string
  default     = "devops@ridersclub.example"
}

