# Secrets Management Migration Checklist

## Pre-Migration Preparation

- [ ] **Backup Current Environment**
  - [ ] Export current .env file
  - [ ] Document all API keys and their sources
  - [ ] Create backup of current Docker configuration

- [ ] **Install Dependencies**
  - [ ] Run `npm install` in backend directory
  - [ ] Verify Vault client dependencies are installed
  - [ ] Test build with new dependencies: `npm run build`

- [ ] **Review Security Requirements**
  - [ ] Identify sensitive vs non-sensitive configuration
  - [ ] Plan secret rotation schedule
  - [ ] Define access control policies

## Development Environment Setup

- [ ] **Start Development Stack**
  - [ ] `docker-compose -f docker-compose.yml -f docker-compose.secrets.yml up -d`
  - [ ] Verify Vault UI accessible at http://localhost:8200
  - [ ] Check health endpoint: `curl http://localhost:4000/health/secrets`

- [ ] **Verify Fallback Behavior**
  - [ ] Confirm API calls work with existing .env file
  - [ ] Test graceful degradation when Vault is unavailable
  - [ ] Verify error handling and logging

- [ ] **Populate Development Secrets**
  - [ ] Access Vault UI with token: `dev-root-token`
  - [ ] Add test API keys under `secret/ai-providers/`
  - [ ] Test secret retrieval via health endpoint

## Production Environment Preparation

- [ ] **Security Configuration**
  - [ ] Generate AppRole credentials: `docker logs sfl-vault-init`
  - [ ] Store VAULT_ROLE_ID and VAULT_SECRET_ID securely
  - [ ] Configure TLS certificates (if using HTTPS)
  - [ ] Review and apply security policies

- [ ] **Infrastructure Setup**
  - [ ] Deploy Vault with persistent storage
  - [ ] Configure backup automation
  - [ ] Set up monitoring and alerting
  - [ ] Test disaster recovery procedures

- [ ] **Secret Population**
  - [ ] Migrate API keys from .env to Vault
  - [ ] Verify all secrets are accessible
  - [ ] Test API functionality with Vault-sourced keys
  - [ ] Document secret paths and access patterns

## Testing and Validation

- [ ] **Functional Testing**
  - [ ] Test all AI provider integrations
  - [ ] Verify database connectivity
  - [ ] Test authentication flows
  - [ ] Validate session management

- [ ] **Performance Testing**
  - [ ] Measure secret retrieval latency
  - [ ] Test under load conditions
  - [ ] Verify caching effectiveness
  - [ ] Monitor token renewal behavior

- [ ] **Security Testing**
  - [ ] Verify no plaintext secrets in logs
  - [ ] Test access control policies
  - [ ] Validate audit trail generation
  - [ ] Test token expiration handling

## Deployment Steps

- [ ] **Staging Deployment**
  - [ ] Deploy to staging with Vault integration
  - [ ] Run full test suite
  - [ ] Verify health check endpoints
  - [ ] Test backup and recovery procedures

- [ ] **Production Deployment**
  - [ ] Set `NODE_ENV=production`
  - [ ] Configure production Vault credentials
  - [ ] Deploy with zero downtime strategy
  - [ ] Monitor application startup and health

- [ ] **Post-Deployment Verification**
  - [ ] Verify all services are healthy
  - [ ] Check secret access patterns in audit logs
  - [ ] Monitor error rates and performance metrics
  - [ ] Validate backup automation

## Clean-up and Documentation

- [ ] **Environment Cleanup**
  - [ ] Remove sensitive data from .env files (production)
  - [ ] Archive old configuration files
  - [ ] Update deployment documentation
  - [ ] Clean up temporary files and logs

- [ ] **Team Enablement**
  - [ ] Train team on Vault operations
  - [ ] Document troubleshooting procedures
  - [ ] Create operational runbooks
  - [ ] Establish incident response procedures

- [ ] **Monitoring Setup**
  - [ ] Configure Vault health monitoring
  - [ ] Set up alerting for secret access failures
  - [ ] Monitor token renewal patterns
  - [ ] Track backup success/failure rates

## Rollback Plan (If Needed)

- [ ] **Immediate Rollback**
  - [ ] Revert to previous Docker Compose configuration
  - [ ] Restore original .env file
  - [ ] Restart services without Vault integration
  - [ ] Verify functionality with environment variables

- [ ] **Post-Rollback Actions**
  - [ ] Document issues encountered
  - [ ] Plan remediation steps
  - [ ] Schedule retry with fixes
  - [ ] Review security implications

## Success Criteria

- [ ] **Functional Success**
  - ✅ All AI provider integrations work correctly
  - ✅ Database and Redis connectivity maintained
  - ✅ No regression in application functionality
  - ✅ Health checks report system as healthy

- [ ] **Security Success**
  - ✅ No plaintext secrets in application logs
  - ✅ Audit trail captures all secret access
  - ✅ AppRole authentication working correctly
  - ✅ Token renewal happening automatically

- [ ] **Operational Success**
  - ✅ Monitoring and alerting functional
  - ✅ Backup automation working
  - ✅ Team can troubleshoot issues independently
  - ✅ Documentation complete and accessible

## Notes and Observations

**Date: ___________**

**Team Members:**
- [ ] Backend Developer: ___________
- [ ] DevOps Engineer: ___________  
- [ ] Security Engineer: ___________

**Issues Encountered:**
- ________________________________
- ________________________________
- ________________________________

**Lessons Learned:**
- ________________________________
- ________________________________
- ________________________________

**Recommendations for Future:**
- ________________________________
- ________________________________
- ________________________________