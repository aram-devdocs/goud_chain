# Outputs for GCP Compute module

output "instance_id" {
  description = "GCP compute instance ID"
  value       = google_compute_instance.blockchain_node.instance_id
}

output "instance_name" {
  description = "GCP compute instance name"
  value       = google_compute_instance.blockchain_node.name
}

output "public_ip" {
  description = "Public IP address of the instance"
  value       = google_compute_instance.blockchain_node.network_interface[0].access_config[0].nat_ip
}

output "private_ip" {
  description = "Private IP address of the instance"
  value       = google_compute_instance.blockchain_node.network_interface[0].network_ip
}

output "zone" {
  description = "GCP zone where instance is running"
  value       = google_compute_instance.blockchain_node.zone
}

output "machine_type" {
  description = "Machine type of the instance"
  value       = google_compute_instance.blockchain_node.machine_type
}
