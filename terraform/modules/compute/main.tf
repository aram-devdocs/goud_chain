# Compute module - Google Cloud Compute Engine instance for Goud Chain

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
}

# Get the latest Ubuntu 22.04 LTS image
data "google_compute_image" "ubuntu" {
  family  = "ubuntu-2204-lts"
  project = "ubuntu-os-cloud"
}

# Single e2-micro instance (FREE tier)
resource "google_compute_instance" "blockchain_node" {
  name         = "${var.project_name}-${var.environment}-vm"
  machine_type = var.machine_type
  zone         = var.zone

  tags = ["blockchain-node", "http-server", "https-server"]

  boot_disk {
    initialize_params {
      image = data.google_compute_image.ubuntu.self_link
      size  = var.boot_disk_size_gb
      type  = "pd-standard" # Standard persistent disk (free tier eligible)
    }
  }

  network_interface {
    network = "default" # Use default VPC (free tier)

    access_config {
      # Ephemeral public IP
    }
  }

  metadata = {
    ssh-keys       = "${var.ssh_username}:${var.ssh_public_key}"
    enable-oslogin = "FALSE"
    startup-script = file("${path.module}/startup.sh")
    user-data      = <<-EOT
      #cloud-config
      packages:
        - docker.io
        - docker-compose
        - git
        - curl
      runcmd:
        - systemctl enable docker
        - systemctl start docker
        - usermod -aG docker ${var.ssh_username}
        - mkdir -p /data
        - chmod 755 /data
        - chown ${var.ssh_username}:${var.ssh_username} /data
    EOT
  }

  service_account {
    scopes = ["cloud-platform"]
  }

  allow_stopping_for_update = true

  labels = merge(
    var.tags,
    {
      environment = var.environment
      role        = "blockchain-node"
    }
  )

  lifecycle {
    ignore_changes = [
      metadata["ssh-keys"], # Prevent replacement on key changes
    ]
  }
}

# Firewall rule for SSH (port 22)
resource "google_compute_firewall" "ssh" {
  name    = "${var.project_name}-${var.environment}-allow-ssh"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = var.allowed_ssh_cidrs
  target_tags   = ["blockchain-node"]
}

# Firewall rule for HTTP API (port 8080)
resource "google_compute_firewall" "http_api" {
  name    = "${var.project_name}-${var.environment}-allow-http-api"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["8080"]
  }

  source_ranges = var.allowed_http_cidrs
  target_tags   = ["blockchain-node"]
}

# Firewall rule for Dashboard (port 3000)
resource "google_compute_firewall" "dashboard" {
  name    = "${var.project_name}-${var.environment}-allow-dashboard"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["3000"]
  }

  source_ranges = var.allowed_http_cidrs
  target_tags   = ["blockchain-node"]
}

# Firewall rule for Jupyter Notebook (port 8888)
resource "google_compute_firewall" "jupyter" {
  name    = "${var.project_name}-${var.environment}-allow-jupyter"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["8888"]
  }

  source_ranges = var.allowed_http_cidrs
  target_tags   = ["blockchain-node"]
}

# Firewall rule for HTTP/HTTPS (for Cloudflare origin requests)
resource "google_compute_firewall" "http_https" {
  name    = "${var.project_name}-${var.environment}-allow-http-https"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  source_ranges = var.allowed_http_cidrs
  target_tags   = ["http-server", "https-server"]
}
