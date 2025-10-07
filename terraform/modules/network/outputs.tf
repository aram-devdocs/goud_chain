# Network module outputs

output "vcn_id" {
  description = "OCID of the VCN"
  value       = oci_core_vcn.main.id
}

output "public_subnet_id" {
  description = "OCID of the public subnet"
  value       = oci_core_subnet.public.id
}

output "internet_gateway_id" {
  description = "OCID of the internet gateway"
  value       = oci_core_internet_gateway.main.id
}

output "security_list_id" {
  description = "OCID of the blockchain security list"
  value       = oci_core_security_list.blockchain.id
}

output "vcn_cidr" {
  description = "CIDR block of the VCN"
  value       = var.vcn_cidr_block
}
