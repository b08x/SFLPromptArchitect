#!/bin/bash
set -e

echo "📦 Creating Vault backup at $(date)"

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/vault_backup_$TIMESTAMP.json"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Export all secrets (for KV v2 engine)
echo "🔄 Backing up KV secrets..."

# List all secret paths and export them
vault kv list -format=json secret/ > /tmp/secret_paths.json

if [ -s /tmp/secret_paths.json ]; then
    # Create structured backup
    echo "{" > "$BACKUP_FILE"
    echo "  \"timestamp\": \"$(date -Iseconds)\"," >> "$BACKUP_FILE"
    echo "  \"vault_version\": \"$(vault version | head -n1)\"," >> "$BACKUP_FILE"
    echo "  \"secrets\": {" >> "$BACKUP_FILE"
    
    # Process each secret path
    FIRST=true
    for path in $(jq -r '.[]' /tmp/secret_paths.json 2>/dev/null || echo "ai-providers database auth"); do
        if [ "$FIRST" = false ]; then
            echo "," >> "$BACKUP_FILE"
        fi
        FIRST=false
        
        echo "    \"$path\": {" >> "$BACKUP_FILE"
        
        # Get the secret data
        if vault kv get -format=json "secret/$path" > /tmp/secret_data.json 2>/dev/null; then
            jq '.data.data' /tmp/secret_data.json | sed 's/^/      /' >> "$BACKUP_FILE"
        else
            echo "      {}" >> "$BACKUP_FILE"
        fi
        
        echo -n "    }" >> "$BACKUP_FILE"
    done
    
    echo "" >> "$BACKUP_FILE"
    echo "  }" >> "$BACKUP_FILE"
    echo "}" >> "$BACKUP_FILE"
    
    echo "✅ Backup created: $BACKUP_FILE"
else
    echo "⚠️  No secrets found to backup"
fi

# Clean up old backups (keep last 7 days)
find "$BACKUP_DIR" -name "vault_backup_*.json" -mtime +7 -delete 2>/dev/null || true

echo "🧹 Old backups cleaned up"
echo "📦 Backup completed successfully"