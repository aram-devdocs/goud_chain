# Free tier environment variables
# These mirror the root module variables

variable "tenancy_ocid" {
  type = string
}

variable "user_ocid" {
  type = string
}

variable "fingerprint" {
  type = string
}

variable "private_key_path" {
  type = string
}

variable "region" {
  type = string
}

variable "compartment_ocid" {
  type    = string
  default = ""
}

variable "environment" {
  type = string
}

variable "blockchain_node_count" {
  type = number
}

variable "instance_shape" {
  type = string
}

variable "instance_ocpus" {
  type = number
}

variable "instance_memory_gb" {
  type = number
}

variable "boot_volume_size_gb" {
  type = number
}

variable "block_volume_size_gb" {
  type = number
}

variable "ssh_public_key" {
  type = string
}

variable "allowed_ssh_cidrs" {
  type = list(string)
}

variable "allowed_http_cidrs" {
  type = list(string)
}

variable "enable_monitoring" {
  type = bool
}

variable "enable_redis" {
  type = bool
}

variable "backup_retention_days" {
  type = number
}

variable "tags" {
  type = map(string)
}

# DNS and domain configuration
variable "enable_dns" {
  type = bool
}

variable "domain_name" {
  type = string
}

variable "cloudflare_api_token" {
  type      = string
  sensitive = true
}

variable "cloudflare_zone_id" {
  type = string
}

variable "enable_cloudflare_proxy" {
  type = bool
}

variable "enable_node_dns" {
  type = bool
}

variable "dashboard_subdomain" {
  type = string
}

variable "api_subdomain" {
  type = string
}
