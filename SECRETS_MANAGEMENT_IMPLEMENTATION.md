# Secrets Management Implementation Guide

## Overview

This guide provides step-by-step instructions for migrating from environment variable-based API key management to a secure HashiCorp Vault-based secrets management system.

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │  HashiCorp      │
│                 │    │                  │    │    Vault        │
│                 │────┤  - Runtime       │────┤                 │
│                 │    │    Secret        │    │  - KV Store     │
│                 │    │    Retrieval     │    │  - AppRole Auth │
│                 │    │  - Fallback to   │    │  - Audit Logs   │
│                 │    │    Env Vars      │    │  - Auto-renewal │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Benefits

✅ **Enhanced Security**: API keys stored encrypted in Vault vs plaintext in .env
✅ **Audit Trail**: Complete logging of all secret access attempts  
✅ **Automatic Rotation**: Support for dynamic secret rotation
✅ **Fine-grained Access**: Role-based permissions for different services
✅ **Development Friendly**: Graceful fallback to environment variables
✅ **Operational Visibility**: Health checks and monitoring integration

## Implementation Steps

### Step 1: Update Dependencies

```bash
cd backend
npm install node-vault@^0.10.2
npm install --save-dev @types/node-vault@^0.9.14
```

### Step 2: Deploy with Vault

#### Development Mode (with .env fallback)

```bash
# Start with Vault integration (keeps .env fallback)
docker-compose -f docker-compose.yml -f docker-compose.secrets.yml up -d

# Check Vault is running
curl http://localhost:8200/v1/sys/health

# Access Vault UI
open http://localhost:8200
# Token: dev-root-token (development only)
```

#### Production Mode

```bash
# Set production environment
export NODE_ENV=production

# Start services
docker-compose -f docker-compose.yml -f docker-compose.secrets.yml up -d

# Get AppRole credentials from logs
docker logs sfl-vault-init
```

### Step 3: Configure Secrets in Vault

#### Using Vault CLI

```bash
# Set Vault address
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=dev-root-token

# Add AI Provider API keys
vault kv put secret/ai-providers \
    openai_api_key="your-openai-key" \
    anthropic_api_key="your-anthropic-key" \
    google_ai_api_key="your-google-key"

# Add database credentials  
vault kv put secret/database \
    database_url="postgres://user:pass@db:5432/sfl_db" \
    redis_url="redis://cache:6379"

# Add authentication secrets
vault kv put secret/auth \
    jwt_secret="your-secure-jwt-secret" \
    session_secret="your-secure-session-secret"
```

#### Using Vault Web UI

1. Navigate to http://localhost:8200
2. Login with token: `dev-root-token`
3. Go to Secrets Engines → secret
4. Create secrets under paths:
   - `ai-providers/` - API keys for AI services
   - `database/` - Database connection strings
   - `auth/` - JWT and session secrets

### Step 4: Production Security Configuration

#### AppRole Authentication Setup

```bash
# Production environment variables
export VAULT_ROLE_ID="your-role-id-from-init"
export VAULT_SECRET_ID="your-secret-id-from-init"
export NODE_ENV=production

# Remove development token
unset VAULT_TOKEN
```

#### Environment Variables for Production

```bash
# Required for production backend
VAULT_ADDR=http://vault:8200
VAULT_ROLE_ID=your-role-id
VAULT_SECRET_ID=your-secret-id
VAULT_MOUNT_PATH=secret
NODE_ENV=production
```

### Step 5: Health Check Integration

```bash
# Check secrets management health
curl http://localhost:4000/health/secrets

# Detailed system health
curl http://localhost:4000/health/detailed
```

## Migration Strategy

### Phase 1: Parallel Operation (Current Implementation)
- ✅ Vault integration added alongside existing .env system
- ✅ Graceful fallback to environment variables in development
- ✅ No breaking changes to existing functionality

### Phase 2: Gradual Migration  
1. Deploy Vault infrastructure
2. Migrate non-sensitive configuration first
3. Gradually move API keys to Vault
4. Update monitoring and alerting

### Phase 3: Full Production  
1. Remove .env file dependencies for sensitive data
2. Enforce Vault-only mode in production
3. Implement secret rotation policies
4. Setup automated backup and disaster recovery

## Security Considerations

### Development Environment
- Uses Vault dev mode with static token
- Fallback to .env files for easy development
- TLS verification disabled for localhost

### Production Environment  
- AppRole authentication with short-lived tokens
- Encrypted communication (configure TLS certificates)
- File-based storage (upgrade to cloud storage)
- Regular secret rotation policies
- Comprehensive audit logging

## Code Changes Summary

### New Files Created
- `backend/src/config/secrets.ts` - Secrets management service
- `backend/src/routes/health.ts` - Health check endpoints
- `docker-compose.secrets.yml` - Vault integration
- `scripts/vault-init.sh` - Vault initialization script
- `scripts/vault-backup.sh` - Backup automation
- `vault-config/vault-production.hcl` - Production config

### Modified Files
- `backend/src/config/env.ts` - Async secret retrieval
- `backend/src/services/unifiedAIService.ts` - Updated API key retrieval
- `backend/package.json` - Added Vault dependencies

## Troubleshooting

### Common Issues

**Vault Connection Failed**
```bash
# Check Vault status
docker logs sfl-vault
curl http://localhost:8200/v1/sys/health

# Verify network connectivity
docker network ls
```

**Token Expired**
```bash
# Check token status
vault auth -method=token

# Renew token (AppRole will auto-renew)
vault token renew
```

**Secret Not Found**
```bash
# List available secrets
vault kv list secret/

# Check specific secret
vault kv get secret/ai-providers
```

**Fallback Mode Active**
- Verify Vault configuration in environment variables
- Check Vault service health  
- Review application logs for connection errors

### Health Check Endpoints

```bash
# Basic health
GET /health

# Detailed system status
GET /health/detailed

# Secrets-specific status  
GET /health/secrets
```

## Backup and Recovery

### Automated Backups
- Hourly snapshots of all secrets
- 7-day retention policy
- JSON format for easy restoration

### Manual Backup
```bash
# Create immediate backup
docker exec sfl-vault-backup sh /vault-backup.sh
```

### Recovery
```bash
# Restore from backup (manual process)
vault kv put secret/ai-providers @backup_file.json
```

## Monitoring and Alerting

### Key Metrics
- Vault service availability
- Token renewal success rate  
- Secret access patterns
- Backup completion status

### Recommended Alerts
- Vault service down > 1 minute
- Token renewal failures
- Backup failures  
- Unusual secret access patterns

## Next Steps

1. **Deploy to Staging**: Test the complete flow in staging environment
2. **Performance Testing**: Verify secret retrieval performance under load
3. **Security Audit**: Review AppRole policies and access patterns
4. **Disaster Recovery**: Test backup/restore procedures
5. **Team Training**: Educate team on Vault operations and troubleshooting

## Support

For issues or questions:
1. Check application logs: `docker logs sfl-backend`
2. Check Vault logs: `docker logs sfl-vault`
3. Review health endpoints for system status
4. Consult HashiCorp Vault documentation for advanced configuration