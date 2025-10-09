# Terraform outputs for Goud Chain infrastructure on Google Cloud Platform
# These values are used by CI/CD and for manual operations

output "instance_public_ip" {
  description = "Public IP of the GCP compute instance"
  value       = module.compute.public_ip
}

output "instance_name" {
  description = "Name of the GCP compute instance"
  value       = module.compute.instance_name
}

output "load_balancer_url" {
  description = "Load balancer API URL"
  value       = var.enable_dns && module.dns.api_url != null ? module.dns.api_url : "http://${module.compute.public_ip}:8080"
}

output "dashboard_url" {
  description = "Dashboard URL"
  value       = var.enable_dns && module.dns.dashboard_url != null ? module.dns.dashboard_url : "http://${module.compute.public_ip}:3000"
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh ${var.ssh_username}@${module.compute.public_ip}"
}

output "deployment_summary" {
  description = "Summary of deployed resources"
  value = {
    environment  = var.environment
    region       = var.region
    zone         = var.zone
    machine_type = var.machine_type
    disk_size_gb = var.boot_disk_size_gb
    architecture = "single-vm-multi-container"
    node_count   = 2 # 2 blockchain nodes in Docker containers
    validators   = 2 # PoA validators
  }
}

output "health_check_commands" {
  description = "Commands to check health of deployed services"
  value = var.enable_dns && module.dns.api_url != null ? {
    load_balancer = "curl ${module.dns.api_url}/lb/health"
    node_health   = "curl ${module.dns.api_url}/health"
    blockchain    = "curl ${module.dns.api_url}/chain"
    } : {
    load_balancer = "curl http://${module.compute.public_ip}:8080/lb/health"
    node_health   = "curl http://${module.compute.public_ip}:8080/health"
    blockchain    = "curl http://${module.compute.public_ip}:8080/chain"
  }
}

output "dns_configuration" {
  description = "DNS configuration details"
  value = var.enable_dns ? {
    enabled               = true
    domain_name           = var.domain_name
    dashboard_fqdn        = module.dns.dashboard_fqdn
    api_fqdn              = module.dns.api_fqdn
    cloudflare_proxy      = var.enable_cloudflare_proxy
    dns_records           = module.dns.dns_records_created
    https_enabled         = var.enable_cloudflare_proxy
    manual_steps_required = var.enable_cloudflare_proxy ? "Configure Cloudflare SSL/TLS mode to 'Flexible' in dashboard" : "N/A"
    message               = "DNS is enabled and configured"
    } : {
    enabled               = false
    domain_name           = null
    dashboard_fqdn        = null
    api_fqdn              = null
    cloudflare_proxy      = false
    dns_records           = null
    https_enabled         = false
    manual_steps_required = null
    message               = "DNS management is disabled. Set enable_dns = true to enable."
  }
}
