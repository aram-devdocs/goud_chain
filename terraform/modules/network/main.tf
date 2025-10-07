# Network module - VCN, subnets, security, routing for Goud Chain

# Virtual Cloud Network (VCN)
resource "oci_core_vcn" "main" {
  compartment_id = var.compartment_id
  display_name   = "${var.project_name}-${var.environment}-vcn"
  cidr_blocks    = [var.vcn_cidr_block]
  dns_label      = replace("${var.project_name}${var.environment}", "-", "")

  freeform_tags = var.tags
}

# Internet Gateway for public internet access
resource "oci_core_internet_gateway" "main" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${var.project_name}-${var.environment}-igw"
  enabled        = true

  freeform_tags = var.tags
}

# Route table for public subnet
resource "oci_core_route_table" "public" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${var.project_name}-${var.environment}-public-rt"

  route_rules {
    network_entity_id = oci_core_internet_gateway.main.id
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
  }

  freeform_tags = var.tags
}

# Security list for blockchain nodes
resource "oci_core_security_list" "blockchain" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${var.project_name}-${var.environment}-blockchain-sl"

  # Egress rules - allow all outbound traffic
  egress_security_rules {
    protocol    = "all"
    destination = "0.0.0.0/0"
    stateless   = false
  }

  # Ingress rules

  # SSH (port 22)
  dynamic "ingress_security_rules" {
    for_each = var.allowed_ssh_cidrs
    content {
      protocol    = "6" # TCP
      source      = ingress_security_rules.value
      stateless   = false
      description = "Allow SSH from ${ingress_security_rules.value}"

      tcp_options {
        min = 22
        max = 22
      }
    }
  }

  # HTTP API - Load Balancer (port 8080)
  dynamic "ingress_security_rules" {
    for_each = var.allowed_http_cidrs
    content {
      protocol    = "6" # TCP
      source      = ingress_security_rules.value
      stateless   = false
      description = "Allow HTTP API from ${ingress_security_rules.value}"

      tcp_options {
        min = 8080
        max = 8080
      }
    }
  }

  # Dashboard (port 3000)
  dynamic "ingress_security_rules" {
    for_each = var.allowed_http_cidrs
    content {
      protocol    = "6" # TCP
      source      = ingress_security_rules.value
      stateless   = false
      description = "Allow Dashboard from ${ingress_security_rules.value}"

      tcp_options {
        min = 3000
        max = 3000
      }
    }
  }

  # Individual node debugging ports (8081-8083) - optional
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = var.vcn_cidr_block
    stateless   = false
    description = "Allow node debugging ports within VCN"

    tcp_options {
      min = 8081
      max = 8083
    }
  }

  # P2P communication (port 9000) - allow from VCN for internal P2P
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = var.vcn_cidr_block
    stateless   = false
    description = "Allow P2P within VCN"

    tcp_options {
      min = 9000
      max = 9000
    }
  }

  # P2P communication (port 9001-9003) - node-specific P2P ports
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = var.vcn_cidr_block
    stateless   = false
    description = "Allow node P2P ports within VCN"

    tcp_options {
      min = 9001
      max = 9003
    }
  }

  # ICMP for ping
  ingress_security_rules {
    protocol    = "1" # ICMP
    source      = "0.0.0.0/0"
    stateless   = false
    description = "Allow ping"

    icmp_options {
      type = 3
      code = 4
    }
  }

  freeform_tags = var.tags
}

# Public subnet for blockchain nodes
resource "oci_core_subnet" "public" {
  compartment_id             = var.compartment_id
  vcn_id                     = oci_core_vcn.main.id
  cidr_block                 = var.public_subnet_cidr
  display_name               = "${var.project_name}-${var.environment}-public-subnet"
  dns_label                  = "public"
  route_table_id             = oci_core_route_table.public.id
  security_list_ids          = [oci_core_security_list.blockchain.id]
  prohibit_public_ip_on_vnic = false

  freeform_tags = var.tags
}
