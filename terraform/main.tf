# Main Terraform configuration for Goud Chain
# This orchestrates all modules to build the complete infrastructure

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 5.0"
    }
  }

  # Optional: Configure remote backend for state management
  # Uncomment and configure for production use
  # backend "s3" {
  #   bucket = "goud-chain-terraform-state"
  #   key    = "infrastructure/terraform.tfstate"
  #   region = "us-ashburn-1"
  # }
}

provider "oci" {
  tenancy_ocid     = var.tenancy_ocid
  user_ocid        = var.user_ocid
  fingerprint      = var.fingerprint
  private_key_path = var.private_key_path
  region           = var.region
}

# Use compartment OCID if provided, otherwise use tenancy root
locals {
  compartment_id = var.compartment_ocid != "" ? var.compartment_ocid : var.tenancy_ocid

  common_tags = merge(
    var.tags,
    {
      Environment = var.environment
      DeployedAt  = timestamp()
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
  availability_domain   = module.compute.availability_domain
  instance_ids          = module.compute.instance_ids
  backup_retention_days = var.backup_retention_days
  tags                  = local.common_tags

  depends_on = [module.compute]
}
