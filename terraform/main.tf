# Main Terraform configuration for Goud Chain
# This orchestrates all modules to build the complete infrastructure

# Main Terraform configuration for Goud Chain
# This module orchestrates all infrastructure components
#
# NOTE: This is used as a child module, called from environments/*/main.tf
# Provider configuration is handled by the calling environment module

# Use compartment OCID if provided, otherwise use tenancy root
locals {
  compartment_id = var.compartment_ocid != "" ? var.compartment_ocid : var.tenancy_ocid

  common_tags = merge(
    var.tags,
    {
      Environment = var.environment
    }
  )
}

# Network infrastructure (VCN, subnets, security lists, internet gateway)
module "network" {
  source = "./modules/network"

  compartment_id     = local.compartment_id
  project_name       = var.project_name
  environment        = var.environment
  allowed_ssh_cidrs  = var.allowed_ssh_cidrs
  allowed_http_cidrs = var.allowed_http_cidrs
  tags               = local.common_tags
}

# Compute instances (blockchain nodes + load balancer)
module "compute" {
  source = "./modules/compute"

  compartment_id      = local.compartment_id
  project_name        = var.project_name
  environment         = var.environment
  node_count          = var.blockchain_node_count
  instance_shape      = var.instance_shape
  instance_ocpus      = var.instance_ocpus
  instance_memory_gb  = var.instance_memory_gb
  boot_volume_size_gb = var.boot_volume_size_gb
  ssh_public_key      = var.ssh_public_key
  subnet_id           = module.network.public_subnet_id
  tags                = local.common_tags
  enable_monitoring   = var.enable_monitoring
  enable_redis        = var.enable_redis

  depends_on = [module.network]
}

# Block storage for blockchain data persistence
module "storage" {
  source = "./modules/storage"

  compartment_id        = local.compartment_id
  project_name          = var.project_name
  environment           = var.environment
  node_count            = var.blockchain_node_count
  block_volume_size_gb  = var.block_volume_size_gb
  availability_domains  = module.compute.availability_domains
  instance_ids          = module.compute.instance_ids
  backup_retention_days = var.backup_retention_days
  tags                  = local.common_tags

  depends_on = [module.compute]
}

# DNS management via Cloudflare
module "dns" {
  source = "./modules/dns"

  cloudflare_zone_id      = var.cloudflare_zone_id
  domain_name             = var.domain_name
  environment             = var.environment
  enable_dns              = var.enable_dns
  enable_cloudflare_proxy = var.enable_cloudflare_proxy
  enable_node_dns         = var.enable_node_dns
  load_balancer_ip        = length(module.compute.public_ips) > 0 ? module.compute.public_ips[0] : ""
  node_public_ips         = module.compute.public_ips
  node_count              = var.blockchain_node_count
  dashboard_subdomain     = var.dashboard_subdomain
  api_subdomain           = var.api_subdomain
  tags                    = local.common_tags

  depends_on = [module.compute]
}
