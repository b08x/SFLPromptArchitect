# HashiCorp Vault Production Configuration
# This configuration is for production deployments with proper storage backend

ui = true
cluster_name = "sfl-prompt-studio-vault"

# File storage backend (replace with cloud storage for production)
storage "file" {
  path = "/vault/data"
}

# Network listener configuration
listener "tcp" {
  address = "0.0.0.0:8200"
  tls_disable = 1  # Enable TLS in production with proper certificates
  # tls_cert_file = "/vault/certs/vault.crt"
  # tls_key_file = "/vault/certs/vault.key"
}

# Enable Prometheus metrics (optional)
telemetry {
  prometheus_retention_time = "24h"
  disable_hostname = true
}

# API address for cluster communication
api_addr = "http://0.0.0.0:8200"

# Disable mlock for containerized environments
disable_mlock = true

# Log level
log_level = "INFO"

# Seal configuration (use auto-unseal in production)
# seal "awskms" {
#   region = "us-west-2"
#   kms_key_id = "alias/vault-unseal-key"
# }