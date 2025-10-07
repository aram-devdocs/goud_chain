# Compute module - Oracle Cloud instances for Goud Chain blockchain nodes

terraform {
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 5.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
  }
}

# Get the latest Ubuntu 22.04 image (ARM or x86 depending on shape)
data "oci_core_images" "ubuntu" {
  compartment_id           = var.compartment_id
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "22.04"
  shape                    = var.instance_shape

  filter {
    name   = "display_name"
    values = ["^Canonical-Ubuntu-22.04-.*"]
    regex  = true
  }
}

# Get availability domains
data "oci_identity_availability_domains" "ads" {
  compartment_id = var.compartment_id
}

# Load cloud-init script
data "local_file" "cloud_init" {
  filename = "${path.module}/cloud-init.yaml"
}

# Blockchain node instances
resource "oci_core_instance" "blockchain_node" {
  count = var.node_count

  compartment_id      = var.compartment_id
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[count.index % length(data.oci_identity_availability_domains.ads.availability_domains)].name
  display_name        = "${var.project_name}-${var.environment}-node${count.index + 1}"
  shape               = var.instance_shape

  # Don't specify fault_domain - let Oracle auto-assign for better capacity availability
  # Per: https://docs.oracle.com/en-us/iaas/Content/Compute/Tasks/troubleshooting-out-of-host-capacity.htm

  shape_config {
    ocpus         = var.instance_ocpus
    memory_in_gbs = var.instance_memory_gb
  }

  create_vnic_details {
    subnet_id        = var.subnet_id
    display_name     = "${var.project_name}-${var.environment}-node${count.index + 1}-vnic"
    assign_public_ip = true
    hostname_label   = "node${count.index + 1}"
  }

  source_details {
    source_type             = "image"
    source_id               = data.oci_core_images.ubuntu.images[0].id
    boot_volume_size_in_gbs = var.boot_volume_size_gb
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    user_data           = base64encode(data.local_file.cloud_init.content)
  }

  freeform_tags = merge(
    var.tags,
    {
      NodeNumber = count.index + 1
      Role       = count.index == 0 ? "load-balancer" : "blockchain-node"
    }
  )

  lifecycle {
    ignore_changes = [
      source_details[0].source_id, # Ignore image updates
      metadata,                    # Ignore cloud-init script changes (prevents instance replacement)
      availability_domain,         # Ignore AZ recalculation (prevents instance replacement)
      freeform_tags,               # Ignore tag changes
      defined_tags,                # Ignore Oracle-managed tags
    ]
  }
}
