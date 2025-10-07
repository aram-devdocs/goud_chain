# Compute module outputs

output "instance_ids" {
  description = "OCIDs of all compute instances"
  value       = oci_core_instance.blockchain_node[*].id
}

output "public_ips" {
  description = "Public IP addresses of all instances"
  value       = oci_core_instance.blockchain_node[*].public_ip
}

output "private_ips" {
  description = "Private IP addresses of all instances"
  value       = oci_core_instance.blockchain_node[*].private_ip
}

output "availability_domain" {
  description = "Availability domain of the first instance"
  value       = oci_core_instance.blockchain_node[0].availability_domain
}

output "instance_details" {
  description = "Detailed information about all instances"
  value = [
    for i, instance in oci_core_instance.blockchain_node : {
      name       = instance.display_name
      public_ip  = instance.public_ip
      private_ip = instance.private_ip
      ad         = instance.availability_domain
      state      = instance.state
    }
  ]
}
