# Variables for dev environment
# Mirror of root variables for pass-through

variable "project_id" {
  description = "Google Cloud project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "GCP zone"
  type        = string
  default     = "us-central1-a"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "goud-chain"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "machine_type" {
  description = "GCP machine type"
  type        = string
  default     = "e2-micro"
}

variable "boot_disk_size_gb" {
  description = "Boot disk size in GB"
  type        = number
  default     = 30
}

variable "ssh_username" {
  description = "SSH username"
  type        = string
  default     = "ubuntu"
}

variable "ssh_public_key" {
  description = "SSH public key"
  type        = string
}

variable "allowed_ssh_cidrs" {
  description = "Allowed SSH CIDRs"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "allowed_http_cidrs" {
  description = "Allowed HTTP CIDRs"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "tags" {
  description = "Resource labels"
  type        = map(string)
  default = {
    project     = "goud-chain"
    environment = "dev"
    managed_by  = "terraform"
  }
}

variable "enable_dns" {
  description = "Enable Cloudflare DNS"
  type        = bool
  default     = true
}

variable "domain_name" {
  description = "Domain name"
  type        = string
  default     = "goudchain.com"
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  type        = string
  sensitive   = true
  default     = ""
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID"
  type        = string
  default     = ""
}

variable "enable_cloudflare_proxy" {
  description = "Enable Cloudflare proxy"
  type        = bool
  default     = true
}

variable "dashboard_subdomain" {
  description = "Dashboard subdomain"
  type        = string
  default     = "dashboard"
}

variable "api_subdomain" {
  description = "API subdomain"
  type        = string
  default     = "api"
}
