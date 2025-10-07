# Compute module variables

variable "compartment_id" {
  description = "OCID of the compartment"
  type        = string
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "node_count" {
  description = "Number of blockchain nodes to deploy"
  type        = number
}

variable "instance_shape" {
  description = "OCI compute instance shape"
  type        = string
}

variable "instance_ocpus" {
  description = "Number of OCPUs per instance"
  type        = number
}

variable "instance_memory_gb" {
  description = "Memory in GB per instance"
  type        = number
}

variable "boot_volume_size_gb" {
  description = "Boot volume size in GB"
  type        = number
}

variable "ssh_public_key" {
  description = "SSH public key for instance access"
  type        = string
}

variable "subnet_id" {
  description = "OCID of the subnet"
  type        = string
}

variable "enable_monitoring" {
  description = "Enable monitoring stack"
  type        = bool
}

variable "enable_redis" {
  description = "Enable Redis cache"
  type        = bool
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}
