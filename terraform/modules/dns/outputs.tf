# DNS module outputs

output "dashboard_fqdn" {
  description = "Fully qualified domain name for dashboard"
  value       = var.enable_dns ? (var.environment == "production" ? "${var.dashboard_subdomain}.${var.domain_name}" : "${var.environment}-${var.dashboard_subdomain}.${var.domain_name}") : null
}

output "api_fqdn" {
  description = "Fully qualified domain name for API"
  value       = var.enable_dns ? (var.environment == "production" ? "${var.api_subdomain}.${var.domain_name}" : "${var.environment}-${var.api_subdomain}.${var.domain_name}") : null
}

output "node_fqdns" {
  description = "Fully qualified domain names for all nodes"
  value = var.enable_dns && var.enable_node_dns ? [
    for i in range(var.node_count) :
    var.environment == "production" ? "node${i + 1}.${var.domain_name}" : "${var.environment}-node${i + 1}.${var.domain_name}"
  ] : []
}

output "dashboard_url" {
  description = "Full HTTPS URL for dashboard"
  value       = var.enable_dns ? (var.enable_cloudflare_proxy ? "https://${var.environment == "production" ? "${var.dashboard_subdomain}.${var.domain_name}" : "${var.environment}-${var.dashboard_subdomain}.${var.domain_name}"}" : "http://${var.environment == "production" ? "${var.dashboard_subdomain}.${var.domain_name}" : "${var.environment}-${var.dashboard_subdomain}.${var.domain_name}"}:3000") : null
}

output "api_url" {
  description = "Full HTTPS URL for API"
  value       = var.enable_dns ? (var.enable_cloudflare_proxy ? "https://${var.environment == "production" ? "${var.api_subdomain}.${var.domain_name}" : "${var.environment}-${var.api_subdomain}.${var.domain_name}"}" : "http://${var.environment == "production" ? "${var.api_subdomain}.${var.domain_name}" : "${var.environment}-${var.api_subdomain}.${var.domain_name}"}:8080") : null
}

output "notebook_fqdn" {
  description = "Fully qualified domain name for Jupyter notebook"
  value       = var.enable_dns ? (var.environment == "production" ? "${var.notebook_subdomain}.${var.domain_name}" : "${var.environment}-${var.notebook_subdomain}.${var.domain_name}") : null
}

output "notebook_url" {
  description = "Full HTTPS URL for Jupyter notebook"
  value       = var.enable_dns ? (var.enable_cloudflare_proxy ? "https://${var.environment == "production" ? "${var.notebook_subdomain}.${var.domain_name}" : "${var.environment}-${var.notebook_subdomain}.${var.domain_name}"}" : "http://${var.environment == "production" ? "${var.notebook_subdomain}.${var.domain_name}" : "${var.environment}-${var.notebook_subdomain}.${var.domain_name}"}:8888") : null
}

output "dns_records_created" {
  description = "Summary of DNS records created"
  value = var.enable_dns ? {
    dashboard = {
      fqdn    = var.environment == "production" ? "${var.dashboard_subdomain}.${var.domain_name}" : "${var.environment}-${var.dashboard_subdomain}.${var.domain_name}"
      ip      = var.load_balancer_ip
      proxied = var.enable_cloudflare_proxy
    }
    api = {
      fqdn    = var.environment == "production" ? "${var.api_subdomain}.${var.domain_name}" : "${var.environment}-${var.api_subdomain}.${var.domain_name}"
      ip      = var.load_balancer_ip
      proxied = var.enable_cloudflare_proxy
    }
    notebook = {
      fqdn    = var.environment == "production" ? "${var.notebook_subdomain}.${var.domain_name}" : "${var.environment}-${var.notebook_subdomain}.${var.domain_name}"
      ip      = var.load_balancer_ip
      proxied = var.enable_cloudflare_proxy
    }
    nodes = var.enable_node_dns ? [
      for i in range(var.node_count) : {
        fqdn = var.environment == "production" ? "node${i + 1}.${var.domain_name}" : "${var.environment}-node${i + 1}.${var.domain_name}"
        ip   = var.node_public_ips[i]
      }
    ] : []
  } : null
}
