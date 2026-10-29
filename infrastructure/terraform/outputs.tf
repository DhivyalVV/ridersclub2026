output "cloudfront_cdn_domain" {
  description = "CloudFront CDN domain serving RidersClub Shell and Federated Remotes"
  value       = aws_cloudfront_distribution.mfe_cdn.domain_name
}

output "api_alb_dns_name" {
  description = "Public DNS name of the Application Load Balancer for @ridersclub/api"
  value       = aws_lb.api_alb.dns_name
}

output "ecr_api_repository_url" {
  description = "Amazon ECR repository URL for pushing @ridersclub/api images"
  value       = aws_ecr_repository.api.repository_url
}

output "mfe_s3_bucket_name" {
  description = "S3 bucket storing static bundles for Shell and Federated Remotes"
  value       = aws_s3_bucket.mfe_assets.bucket
}

output "media_uploads_s3_bucket_name" {
  description = "Encrypted S3 bucket for validated Marketplace & Garage media uploads"
  value       = aws_s3_bucket.media_uploads.bucket
}

