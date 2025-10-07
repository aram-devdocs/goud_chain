# Storage module outputs

output "block_volume_ids" {
  description = "OCIDs of all block volumes"
  value       = oci_core_volume.blockchain_data[*].id
}

output "volume_attachment_ids" {
  description = "OCIDs of all volume attachments"
  value       = oci_core_volume_attachment.blockchain_data[*].id
}

output "volume_details" {
  description = "Detailed information about all volumes"
  value = [
    for i, volume in oci_core_volume.blockchain_data : {
      name       = volume.display_name
      size_gb    = volume.size_in_gbs
      state      = volume.state
      device     = "/dev/oracleoci/oraclevdb"
      mount_path = "/data/node${i + 1}"
    }
  ]
}
