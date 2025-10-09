# Variables for GCP Compute module

variable "project_id" {
  description = "Google Cloud project ID"
  type        = string
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "goud-chain"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
}

variable "zone" {
  description = "GCP zone for compute instance"
  type        = string
  default     = "us-central1-a" # FREE tier eligible zone
}

variable "machine_type" {
  description = "GCP machine type"
  type        = string
  default     = "e2-micro" # FREE tier: 0.25-2 vCPU (bursting), 1GB RAM
}

variable "boot_disk_size_gb" {
  description = "Boot disk size in GB (free tier allows 30GB)"
  type        = number
  default     = 30
}

variable "ssh_username" {
  description = "SSH username for instance access"
  type        = string
  default     = "ubuntu"
}

variable "ssh_public_key" {
  description = "SSH public key for instance access"
  type        = string
}

variable "allowed_ssh_cidrs" {
  description = "List of CIDR blocks allowed to SSH to instance"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "allowed_http_cidrs" {
  description = "List of CIDR blocks allowed to access HTTP endpoints"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "tags" {
  description = "Labels to apply to resources"
  type        = map(string)
  default     = {}
}
