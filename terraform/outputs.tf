output "aws_region" {
  description = "AWS deployment region"
  value       = var.aws_region
}

output "vpc_id" {
  description = "Identifier of the CloudPulse VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs configured with EKS tags"
  value       = aws_subnet.public[*].id
}

output "eks_cluster_name" {
  description = "Name of the Amazon EKS cluster"
  value       = aws_eks_cluster.main.name
}

output "eks_cluster_endpoint" {
  description = "Endpoint URL for Amazon EKS API server"
  value       = aws_eks_cluster.main.endpoint
}

output "eks_cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
}

output "eks_node_group_name" {
  description = "Name of the managed worker node group"
  value       = aws_eks_node_group.main.node_group_name
}

output "cluster_security_group_id" {
  description = "Security group ID automatically created by EKS for control plane to node communication"
  value       = aws_eks_cluster.main.vpc_config[0].cluster_security_group_id
}

output "kubectl_configure_command" {
  description = "AWS CLI command to configure kubectl credentials for the EKS cluster"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.main.name}"
}
