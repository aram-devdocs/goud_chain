# Free Tier environment - uses root Terraform modules

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

# Configure OCI provider
provider "oci" {
  tenancy_ocid     = var.tenancy_ocid
  user_ocid        = var.user_ocid
  fingerprint      = var.fingerprint
  private_key_path = var.private_key_path
  region           = var.region
}

# Configure Cloudflare provider
provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Use the root module
module "goud_chain" {
  source = "../.."

  # Pass through all variables from terraform.tfvars
  tenancy_ocid          = var.tenancy_ocid
  user_ocid             = var.user_ocid
  fingerprint           = var.fingerprint
  private_key_path      = var.private_key_path
  region                = var.region
  compartment_ocid      = var.compartment_ocid
  environment           = var.environment
  blockchain_node_count = var.blockchain_node_count
  instance_shape        = var.instance_shape
  instance_ocpus        = var.instance_ocpus
  instance_memory_gb    = var.instance_memory_gb
  boot_volume_size_gb   = var.boot_volume_size_gb
  block_volume_size_gb  = var.block_volume_size_gb
  ssh_public_key        = var.ssh_public_key
  allowed_ssh_cidrs     = var.allowed_ssh_cidrs
  allowed_http_cidrs    = var.allowed_http_cidrs
  enable_monitoring     = var.enable_monitoring
  enable_redis          = var.enable_redis
  backup_retention_days = var.backup_retention_days
  tags                  = var.tags

  # DNS configuration
  enable_dns              = var.enable_dns
  domain_name             = var.domain_name
  cloudflare_api_token    = var.cloudflare_api_token
  cloudflare_zone_id      = var.cloudflare_zone_id
  enable_cloudflare_proxy = var.enable_cloudflare_proxy
  enable_node_dns         = var.enable_node_dns
  dashboard_subdomain     = var.dashboard_subdomain
  api_subdomain           = var.api_subdomain
}

# Re-export all outputs
output "load_balancer_public_ip" {
  value = module.goud_chain.load_balancer_public_ip
}

output "load_balancer_url" {
  value = module.goud_chain.load_balancer_url
}

output "dashboard_url" {
  value = module.goud_chain.dashboard_url
}

output "node_public_ips" {
  value = module.goud_chain.node_public_ips
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
