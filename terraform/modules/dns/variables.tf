# DNS module variables

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for the domain"
  type        = string
}

variable "domain_name" {
  description = "Base domain name (e.g., goudchain.com)"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
}

variable "enable_dns" {
  description = "Enable DNS record creation"
  type        = bool
  default     = true
}

variable "enable_cloudflare_proxy" {
  description = "Enable Cloudflare proxy (CDN + HTTPS)"
  type        = bool
  default     = true
}

variable "enable_node_dns" {
  description = "Create DNS records for individual nodes"
  type        = bool
  default     = false
}

variable "load_balancer_ip" {
  description = "Public IP address of the load balancer"
  type        = string
}

variable "node_public_ips" {
  description = "Public IP addresses of all blockchain nodes"
  type        = list(string)
  default     = []
}

variable "node_count" {
  description = "Number of blockchain nodes"
  type        = number
  default     = 0
}

variable "dashboard_subdomain" {
  description = "Subdomain for dashboard (will be prefixed with environment)"
  type        = string
  default     = "dashboard"
}

variable "api_subdomain" {
  description = "Subdomain for API (will be prefixed with environment)"
  type        = string
  default     = "api"
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
