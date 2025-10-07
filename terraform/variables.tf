# Global variables for Goud Chain infrastructure
# These variables can be overridden in environment-specific terraform.tfvars files

variable "tenancy_ocid" {
  description = "Oracle Cloud tenancy OCID"
  type        = string
}

variable "user_ocid" {
  description = "Oracle Cloud user OCID"
  type        = string
}

variable "fingerprint" {
  description = "Oracle Cloud API key fingerprint"
  type        = string
}

variable "private_key_path" {
  description = "Path to Oracle Cloud API private key"
  type        = string
}

variable "region" {
  description = "Oracle Cloud region"
  type        = string
  default     = "us-ashburn-1"
}

variable "compartment_ocid" {
  description = "Oracle Cloud compartment OCID (defaults to tenancy root)"
  type        = string
  default     = ""
}

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

variable "blockchain_node_count" {
  description = "Number of blockchain nodes to deploy"
  type        = number
  default     = 4

  validation {
    condition     = var.blockchain_node_count >= 1 && var.blockchain_node_count <= 50
    error_message = "Node count must be between 1 and 50"
  }
}

variable "instance_shape" {
  description = "OCI compute instance shape"
  type        = string
  default     = "VM.Standard.A1.Flex" # Free tier ARM shape
}

variable "instance_ocpus" {
  description = "Number of OCPUs per instance"
  type        = number
  default     = 1 # Free tier allocation per VM

  validation {
    condition     = var.instance_ocpus >= 1 && var.instance_ocpus <= 64
    error_message = "OCPUs must be between 1 and 64"
  }
}

variable "instance_memory_gb" {
  description = "Memory in GB per instance"
  type        = number
  default     = 6 # Free tier allocation per VM

  validation {
    condition     = var.instance_memory_gb >= 1 && var.instance_memory_gb <= 1024
    error_message = "Memory must be between 1 and 1024 GB"
  }
}

variable "boot_volume_size_gb" {
  description = "Boot volume size in GB"
  type        = number
  default     = 50 # Free tier boot volume size
}

variable "block_volume_size_gb" {
  description = "Block volume size in GB for blockchain data persistence"
  type        = number
  default     = 50 # Free tier allows 200 GB total (4x50 GB)
}

variable "ssh_public_key" {
  description = "SSH public key for instance access"
  type        = string
}

variable "allowed_ssh_cidrs" {
  description = "List of CIDR blocks allowed to SSH to instances"
  type        = list(string)
  default     = ["0.0.0.0/0"] # Restrict this in production!
}

variable "allowed_http_cidrs" {
  description = "List of CIDR blocks allowed to access HTTP endpoints"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "enable_monitoring" {
  description = "Enable Prometheus/Grafana monitoring stack"
  type        = bool
  default     = false # Set to true in staging/production
}

variable "enable_redis" {
  description = "Enable Redis cache"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "Number of days to retain volume backups"
  type        = number
  default     = 7
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project    = "goud-chain"
    ManagedBy  = "terraform"
    Repository = "https://github.com/your-repo/goud_chain"
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
