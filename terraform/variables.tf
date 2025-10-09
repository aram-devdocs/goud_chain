# Global variables for Goud Chain infrastructure on Google Cloud Platform

# GCP Project Configuration
variable "project_id" {
  description = "Google Cloud project ID"
  type        = string
}

variable "region" {
  description = "GCP region (for regional resources)"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "GCP zone for compute instance"
  type        = string
  default     = "us-central1-a" # FREE tier eligible zone
}

# Project Configuration
variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "goud-chain"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be one of: dev, staging, production"
  }
}

# Compute Configuration
variable "machine_type" {
  description = "GCP machine type (e2-micro for FREE tier)"
  type        = string
  default     = "e2-micro"
}

variable "boot_disk_size_gb" {
  description = "Boot disk size in GB (FREE tier allows 30GB standard PD)"
  type        = number
  default     = 30
}

# SSH Configuration
variable "ssh_username" {
  description = "SSH username for instance access"
  type        = string
  default     = "ubuntu"
}

variable "ssh_public_key" {
  description = "SSH public key for instance access"
  type        = string
}

# Network Security
variable "allowed_ssh_cidrs" {
  description = "List of CIDR blocks allowed to SSH to instance"
  type        = list(string)
  default     = ["0.0.0.0/0"] # Restrict this in production!
}

variable "allowed_http_cidrs" {
  description = "List of CIDR blocks allowed to access HTTP endpoints"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

# Resource Tags
variable "tags" {
  description = "Common labels to apply to all resources"
  type        = map(string)
  default = {
    project    = "goud-chain"
    managed_by = "terraform"
  }
}

# DNS and domain configuration
variable "enable_dns" {
  description = "Enable DNS management via Cloudflare"
  type        = bool
  default     = false
}

variable "domain_name" {
  description = "Base domain name (e.g., goudchain.com)"
  type        = string
  default     = "goudchain.com"
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token with DNS edit permissions"
  type        = string
  sensitive   = true
  default     = ""
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for the domain"
  type        = string
  default     = ""
}

variable "enable_cloudflare_proxy" {
  description = "Enable Cloudflare proxy for CDN and HTTPS"
  type        = bool
  default     = true
}

variable "enable_node_dns" {
  description = "Create DNS records for individual nodes (for debugging)"
  type        = bool
  default     = false
}

variable "dashboard_subdomain" {
  description = "Subdomain for dashboard (will be prefixed with environment for non-prod)"
  type        = string
  default     = "dashboard"
}

variable "api_subdomain" {
  description = "Subdomain for API (will be prefixed with environment for non-prod)"
  type        = string
  default     = "api"
}
