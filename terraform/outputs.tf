# Terraform outputs for Goud Chain infrastructure
# These values are used by CI/CD and for manual operations

output "load_balancer_public_ip" {
  description = "Public IP of the load balancer (primary API endpoint)"
  value       = length(module.compute.public_ips) > 0 ? module.compute.public_ips[0] : null
}

output "load_balancer_url" {
  description = "Load balancer API URL"
  value       = length(module.compute.public_ips) > 0 ? "http://${module.compute.public_ips[0]}:8080" : null
}

output "dashboard_url" {
  description = "Dashboard URL"
  value       = length(module.compute.public_ips) > 0 ? "http://${module.compute.public_ips[0]}:3000" : null
}

output "node_public_ips" {
  description = "Public IP addresses of all blockchain nodes"
  value       = module.compute.public_ips
}

output "node_private_ips" {
  description = "Private IP addresses of all blockchain nodes for P2P communication"
  value       = module.compute.private_ips
}

output "instance_ids" {
  description = "OCIDs of all compute instances"
  value       = module.compute.instance_ids
}

output "block_volume_ids" {
  description = "OCIDs of all block volumes for blockchain data"
  value       = module.storage.block_volume_ids
}

output "vcn_id" {
  description = "OCID of the Virtual Cloud Network"
  value       = module.network.vcn_id
}

output "subnet_id" {
  description = "OCID of the public subnet"
  value       = module.network.public_subnet_id
}

output "ssh_command" {
  description = "SSH command to connect to the first node (load balancer)"
  value       = length(module.compute.public_ips) > 0 ? "ssh ubuntu@${module.compute.public_ips[0]}" : null
}

output "deployment_summary" {
  description = "Summary of deployed resources"
  value = {
    environment      = var.environment
    region           = var.region
    node_count       = var.blockchain_node_count
    instance_shape   = var.instance_shape
    total_ocpus      = var.blockchain_node_count * var.instance_ocpus
    total_memory_gb  = var.blockchain_node_count * var.instance_memory_gb
    total_storage_gb = var.blockchain_node_count * var.block_volume_size_gb
  }
}

output "health_check_commands" {
  description = "Commands to check health of deployed services"
  value = length(module.compute.public_ips) > 0 ? {
    load_balancer = "curl http://${module.compute.public_ips[0]}:8080/lb/health"
    node_health   = "curl http://${module.compute.public_ips[0]}:8080/health"
    blockchain    = "curl http://${module.compute.public_ips[0]}:8080/chain"
  } : null
}
