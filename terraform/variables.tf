variable "aws_region" {
  description = "Target AWS region for deploying infrastructure"
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Project identifier applied to resource names and tags"
  type        = string
  default     = "cloudpulse"
}

variable "environment" {
  description = "Deployment environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for the dedicated CloudPulse VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets in distinct availability zones"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "availability_zones" {
  description = "Availability zones for subnet placement"
  type        = list(string)
  default     = ["ap-south-1a", "ap-south-1b"]
}

variable "cluster_name" {
  description = "Name of the Amazon EKS cluster"
  type        = string
  default     = "cloudpulse-eks"
}

variable "kubernetes_version" {
  description = "Kubernetes control plane version for EKS (using 1.32 for optimal standard-support window)"
  type        = string
  default     = "1.32"
}

variable "node_instance_types" {
  description = "EC2 instance types for EKS managed worker nodes"
  type        = list(string)
  default     = ["t3.small"]
}

variable "node_desired_size" {
  description = "Desired number of worker nodes in the managed node group"
  type        = number
  default     = 1
}

variable "node_min_size" {
  description = "Minimum number of worker nodes in the managed node group"
  type        = number
  default     = 1
}

variable "node_max_size" {
  description = "Maximum number of worker nodes in the managed node group"
  type        = number
  default     = 2
}
