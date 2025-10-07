# Storage module - Block volumes for blockchain data persistence

terraform {
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 6.0"
    }
  }
}

# Block volumes for blockchain data
resource "oci_core_volume" "blockchain_data" {
  count = var.node_count

  compartment_id      = var.compartment_id
  availability_domain = var.availability_domains[count.index]
  display_name        = "${var.project_name}-${var.environment}-node${count.index + 1}-data"
  size_in_gbs         = var.block_volume_size_gb

  freeform_tags = merge(
    var.tags,
    {
      NodeNumber = count.index + 1
      Purpose    = "blockchain-data"
    }
  )

  lifecycle {
    prevent_destroy = true # Prevent accidental deletion of blockchain data
    ignore_changes = [
      availability_domain, # Ignore AZ recalculation (prevents volume replacement)
      defined_tags,        # Ignore Oracle-managed tags
    ]
  }
}

# Attach block volumes to instances
# Note: To prevent 409 Conflict errors from parallel attachments, consider using
# `-parallelism=1` with terraform apply
# See: https://github.com/oracle/terraform-provider-oci/issues/73
resource "oci_core_volume_attachment" "blockchain_data" {
  count = var.node_count

  attachment_type = "paravirtualized"
  instance_id     = var.instance_ids[count.index]
  volume_id       = oci_core_volume.blockchain_data[count.index].id
  display_name    = "${var.project_name}-${var.environment}-node${count.index + 1}-data-attachment"
}

# Backup policy for blockchain data volumes
# Note: Free tier allows 5 backups total
resource "oci_core_volume_backup_policy_assignment" "blockchain_data" {
  count = min(var.node_count, 2) # Only backup first 2 nodes to stay within free tier

  asset_id  = oci_core_volume.blockchain_data[count.index].id
  policy_id = data.oci_core_volume_backup_policies.default_policies.volume_backup_policies[0].id
}

# Get default backup policies
data "oci_core_volume_backup_policies" "default_policies" {
  filter {
    name   = "display_name"
    values = ["silver"] # Weekly backups
  }
}
