# DNS module - Cloudflare DNS management for Goud Chain

terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

# A record for dashboard (dev.goudchain.com)
resource "cloudflare_record" "dashboard" {
  count = var.enable_dns ? 1 : 0

  zone_id = var.cloudflare_zone_id
  name    = var.environment == "production" ? var.dashboard_subdomain : "${var.environment}-${var.dashboard_subdomain}"
  value   = var.load_balancer_ip
  type    = "A"
  ttl     = 1 # Auto TTL when proxied
  proxied = var.enable_cloudflare_proxy

  comment = "Goud Chain ${var.environment} Dashboard - managed by Terraform"
}

# A record for API (dev-api.goudchain.com)
resource "cloudflare_record" "api" {
  count = var.enable_dns ? 1 : 0

  zone_id = var.cloudflare_zone_id
  name    = var.environment == "production" ? var.api_subdomain : "${var.environment}-${var.api_subdomain}"
  value   = var.load_balancer_ip
  type    = "A"
  ttl     = 1 # Auto TTL when proxied
  proxied = var.enable_cloudflare_proxy

  comment = "Goud Chain ${var.environment} API - managed by Terraform"
}

# Optional: A records for individual nodes (for debugging)
resource "cloudflare_record" "nodes" {
  count = var.enable_dns && var.enable_node_dns ? var.node_count : 0

  zone_id = var.cloudflare_zone_id
  name    = var.environment == "production" ? "node${count.index + 1}" : "${var.environment}-node${count.index + 1}"
  value   = var.node_public_ips[count.index]
  type    = "A"
  ttl     = 300 # 5 minutes
  proxied = false # Don't proxy node debugging endpoints

  comment = "Goud Chain ${var.environment} Node ${count.index + 1} - managed by Terraform"
}
