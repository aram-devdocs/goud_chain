# Storage module variables

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
  description = "Number of blockchain nodes"
  type        = number
}

variable "block_volume_size_gb" {
  description = "Size of each block volume in GB"
  type        = number
}

variable "availability_domains" {
  description = "Availability domains for block volumes (one per node)"
  type        = list(string)
}

variable "instance_ids" {
  description = "List of instance OCIDs to attach volumes to"
  type        = list(string)
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}
