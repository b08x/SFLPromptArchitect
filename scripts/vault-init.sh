#!/bin/bash
set -e

echo "🔐 Initializing HashiCorp Vault for SFL Prompt Studio..."

# Wait for Vault to be ready
echo "⏳ Waiting for Vault to be available..."
until vault status &> /dev/null; do
    echo "Vault not ready, waiting..."
    sleep 2
done

echo "✅ Vault is available"

# Check if we're in development mode
if [ "$NODE_ENV" != "production" ]; then
    echo "🔧 Development mode: Setting up basic secrets structure"
    
    # Enable KV v2 secrets engine if not already enabled
    vault secrets enable -path=secret kv-v2 2>/dev/null || echo "KV secrets engine already enabled"
    
    # Create sample secrets for development
    echo "📝 Creating development secrets..."
    
    # AI Provider secrets (empty values - to be populated manually)
    vault kv put secret/ai-providers \
        google_ai_api_key="${GEMINI_API_KEY:-}" \
        openai_api_key="${OPENAI_API_KEY:-}" \
        anthropic_api_key="${ANTHROPIC_API_KEY:-}" \
        openrouter_api_key="${OPENROUTER_API_KEY:-}"
    
    # Database secrets
    vault kv put secret/database \
        database_url="${DATABASE_URL:-postgres://user:password@db:5432/sfl_db}" \
        redis_url="${REDIS_URL:-redis://cache:6379}"
    
    # Authentication secrets
    vault kv put secret/auth \
        jwt_secret="${JWT_SECRET:-dev-jwt-secret-please-change-in-production}" \
        session_secret="${SESSION_SECRET:-dev-session-secret-please-change-in-production}"
    
    echo "🎯 Development secrets created successfully"
    
else
    echo "🚀 Production mode: Setting up AppRole authentication"
    
    # Enable AppRole auth method
    vault auth enable approle 2>/dev/null || echo "AppRole auth method already enabled"
    
    # Create policy for the backend application
    cat > /tmp/backend-policy.hcl << EOF
path "secret/data/ai-providers/*" {
  capabilities = ["read"]
}
path "secret/data/database/*" {
  capabilities = ["read"]
}
path "secret/data/auth/*" {
  capabilities = ["read"]
}
EOF
    
    vault policy write backend-policy /tmp/backend-policy.hcl
    
    # Create AppRole
    vault write auth/approle/role/backend-role \
        token_policies="backend-policy" \
        token_ttl=1h \
        token_max_ttl=4h \
        bind_secret_id=true
    
    # Get Role ID
    ROLE_ID=$(vault read -field=role_id auth/approle/role/backend-role/role-id)
    
    # Generate Secret ID
    SECRET_ID=$(vault write -field=secret_id -f auth/approle/role/backend-role/secret-id)
    
    echo "🔑 AppRole credentials generated:"
    echo "VAULT_ROLE_ID=$ROLE_ID"
    echo "VAULT_SECRET_ID=$SECRET_ID"
    echo ""
    echo "⚠️  Store these credentials securely and set them as environment variables"
    echo "   for your backend service in production"
    
    # Save credentials to a secure file (for initial setup only)
    cat > /vault/config/approle-credentials.txt << EOF
VAULT_ROLE_ID=$ROLE_ID
VAULT_SECRET_ID=$SECRET_ID
EOF
    chmod 600 /vault/config/approle-credentials.txt
    
    echo "📝 Production setup completed"
fi

echo ""
echo "🎉 Vault initialization completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. For development: Your API keys will fall back to .env file if not set in Vault"
echo "   2. For production: Populate secrets in Vault using the web UI at http://localhost:8200"
echo "   3. Vault UI Token (dev): ${VAULT_TOKEN}"
echo ""
echo "💡 To manually add secrets to Vault:"
echo "   vault kv put secret/ai-providers openai_api_key='your-key-here'"
echo "   vault kv put secret/ai-providers anthropic_api_key='your-key-here'"
echo ""