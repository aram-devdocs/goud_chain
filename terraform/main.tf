# Main Terraform configuration for Goud Chain on Google Cloud Platform
# This orchestrates all modules to build the complete infrastructure

terraform {
  required_version = ">= 1.6.0"

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

# Local variables
locals {
  common_tags = merge(
    var.tags,
    {
      environment = var.environment
      managed_by  = "terraform"
    }
  )
}

# Compute instance (single VM for all blockchain nodes)
module "compute" {
  source = "./modules/compute"

  project_id         = var.project_id
  project_name       = var.project_name
  environment        = var.environment
  zone               = var.zone
  machine_type       = var.machine_type
  boot_disk_size_gb  = var.boot_disk_size_gb
  ssh_username       = var.ssh_username
  ssh_public_key     = var.ssh_public_key
  allowed_ssh_cidrs  = var.allowed_ssh_cidrs
  allowed_http_cidrs = var.allowed_http_cidrs
  tags               = local.common_tags
}

# DNS management via Cloudflare
module "dns" {
  source = "./modules/dns"

  cloudflare_zone_id      = var.cloudflare_zone_id
  domain_name             = var.domain_name
  environment             = var.environment
  enable_dns              = var.enable_dns
  enable_cloudflare_proxy = var.enable_cloudflare_proxy
  enable_node_dns         = false # Single VM, no individual node DNS needed
  load_balancer_ip        = module.compute.public_ip
  node_public_ips         = [module.compute.public_ip]
  node_count              = 1 # Single VM deployment
  dashboard_subdomain     = var.dashboard_subdomain
  api_subdomain           = var.api_subdomain
  tags                    = local.common_tags

  depends_on = [module.compute]
}
