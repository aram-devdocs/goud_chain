# DNS module outputs

output "dashboard_fqdn" {
  description = "Fully qualified domain name for dashboard and API (single-domain architecture)"
  value       = var.enable_dns ? (var.environment == "production" ? "${var.dashboard_subdomain}.${var.domain_name}" : "${var.environment}-${var.dashboard_subdomain}.${var.domain_name}") : null
}

# API no longer has separate subdomain - accessed via {dashboard_fqdn}/api/*
# output "api_fqdn" {
#   description = "DEPRECATED: API now accessed via dashboard domain /api/* path"
#   value       = var.enable_dns ? (var.environment == "production" ? "${var.api_subdomain}.${var.domain_name}" : "${var.environment}-${var.api_subdomain}.${var.domain_name}") : null
# }

output "node_fqdns" {
  description = "Fully qualified domain names for all nodes"
  value = var.enable_dns && var.enable_node_dns ? [
    for i in range(var.node_count) :
    var.environment == "production" ? "node${i + 1}.${var.domain_name}" : "${var.environment}-node${i + 1}.${var.domain_name}"
  ] : []
}

output "dashboard_url" {
  description = "Full HTTPS URL for dashboard (API accessible via /api/* path)"
  value       = var.enable_dns ? (var.enable_cloudflare_proxy ? "https://${var.environment == "production" ? "${var.dashboard_subdomain}.${var.domain_name}" : "${var.environment}-${var.dashboard_subdomain}.${var.domain_name}"}" : "http://${var.environment == "production" ? "${var.dashboard_subdomain}.${var.domain_name}" : "${var.environment}-${var.dashboard_subdomain}.${var.domain_name}"}:3000") : null
}

# API no longer has separate URL - accessed via {dashboard_url}/api/*
# output "api_url" {
#   description = "DEPRECATED: API now accessed via dashboard URL /api/* path"
#   value       = var.enable_dns ? (var.enable_cloudflare_proxy ? "https://${var.environment == "production" ? "${var.api_subdomain}.${var.domain_name}" : "${var.environment}-${var.api_subdomain}.${var.domain_name}"}" : "http://${var.environment == "production" ? "${var.api_subdomain}.${var.domain_name}" : "${var.environment}-${var.api_subdomain}.${var.domain_name}"}:8080") : null
# }

output "dns_records_created" {
  description = "Summary of DNS records created (single-domain architecture)"
  value = var.enable_dns ? {
    dashboard = {
      fqdn    = var.environment == "production" ? "${var.dashboard_subdomain}.${var.domain_name}" : "${var.environment}-${var.dashboard_subdomain}.${var.domain_name}"
      ip      = var.load_balancer_ip
      proxied = var.enable_cloudflare_proxy
      note    = "Serves both dashboard (/) and API (/api/*)"
    }
    # API subdomain removed - now accessed via dashboard domain /api/* path
    nodes = var.enable_node_dns ? [
      for i in range(var.node_count) : {
        fqdn = var.environment == "production" ? "node${i + 1}.${var.domain_name}" : "${var.environment}-node${i + 1}.${var.domain_name}"
        ip   = var.node_public_ips[i]
      }
    ] : []
  } : null
}
