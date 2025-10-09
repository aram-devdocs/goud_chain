# Dev environment - uses root Terraform modules

terraform {
  required_version = ">= 1.6.0"

  # Remote state backend in Google Cloud Storage
  # This allows local and GitHub Actions to share the same state
  # Run scripts/setup-terraform-backend.sh to create the bucket
  backend "gcs" {
    bucket = "goudchain-terraform-state"
    prefix = "dev/terraform.tfstate"
  }

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

# Configure GCP provider
provider "google" {
  project = var.project_id
  region  = var.region
}

# Configure Cloudflare provider
provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Use the root module
module "goud_chain" {
  source = "../.."

  # Pass through all variables from terraform.tfvars
  project_id         = var.project_id
  region             = var.region
  zone               = var.zone
  project_name       = var.project_name
  environment        = var.environment
  machine_type       = var.machine_type
  boot_disk_size_gb  = var.boot_disk_size_gb
  ssh_username       = var.ssh_username
  ssh_public_key     = var.ssh_public_key
  allowed_ssh_cidrs  = var.allowed_ssh_cidrs
  allowed_http_cidrs = var.allowed_http_cidrs
  tags               = var.tags

  # DNS configuration
  enable_dns              = var.enable_dns
  domain_name             = var.domain_name
  cloudflare_api_token    = var.cloudflare_api_token
  cloudflare_zone_id      = var.cloudflare_zone_id
  enable_cloudflare_proxy = var.enable_cloudflare_proxy
  dashboard_subdomain     = var.dashboard_subdomain
  api_subdomain           = var.api_subdomain
}

# Re-export all outputs
output "instance_public_ip" {
  value = module.goud_chain.instance_public_ip
}

output "instance_name" {
  value = module.goud_chain.instance_name
}

output "load_balancer_url" {
  value = module.goud_chain.load_balancer_url
}

output "dashboard_url" {
  value = module.goud_chain.dashboard_url
}

output "ssh_command" {
  value = module.goud_chain.ssh_command
}

output "deployment_summary" {
  value = module.goud_chain.deployment_summary
}

output "health_check_commands" {
  value = module.goud_chain.health_check_commands
}

output "dns_configuration" {
  value = module.goud_chain.dns_configuration
}
