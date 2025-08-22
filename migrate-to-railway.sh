#!/bin/bash

# Database Migration Script: Neon to Railway
# Usage: ./migrate-to-railway.sh "your-railway-public-url"

set -e  # Exit on any error

echo "🚀 FlowLingo Database Migration: Neon → Railway"
echo "=============================================="

# Check if Railway URL is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide the Railway public DATABASE_URL"
    echo "Usage: ./migrate-to-railway.sh 'postgresql://user:pass@host.railway.app:port/dbname'"
    exit 1
fi

RAILWAY_URL="$1"
OLD_URL="$DATABASE_URL"

echo "📋 Migration Plan:"
echo "  From: Neon Database"
echo "  To:   Railway Database"
echo ""

# Test Railway connection
echo "🔍 Testing Railway connection..."
if psql "$RAILWAY_URL" -c "SELECT 1" > /dev/null 2>&1; then
    echo "✅ Railway database connection successful!"
else
    echo "❌ Cannot connect to Railway database. Please check your URL."
    exit 1
fi

# Step 1: Export current environment
echo ""
echo "📦 Step 1: Saving current environment..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

# Step 2: Push schema to Railway
echo ""
echo "🏗️  Step 2: Creating schema in Railway database..."
export DATABASE_URL="$RAILWAY_URL"
npm run db:push --force

# Step 3: Import data
echo ""
echo "📥 Step 3: Importing data to Railway..."
psql "$RAILWAY_URL" < neon_data_backup.sql

# Step 4: Verify migration
echo ""
echo "✨ Step 4: Verifying migration..."
TABLES=$(psql "$RAILWAY_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")
USERS=$(psql "$RAILWAY_URL" -t -c "SELECT COUNT(*) FROM users" 2>/dev/null || echo "0")

echo "  Tables created: $TABLES"
echo "  Users migrated: $USERS"

# Step 5: Update .env file
echo ""
echo "📝 Step 5: Updating environment configuration..."
cat > .env.new << EOF
# Railway Database Configuration
DATABASE_URL=$RAILWAY_URL

# Keep your existing non-database variables
$(grep -v "^DATABASE_URL\|^PG" .env 2>/dev/null || true)

# PostgreSQL specific vars (parsed from Railway URL)
$(echo "$RAILWAY_URL" | sed -n 's|postgresql://\([^:]*\):\([^@]*\)@\([^:]*\):\([^/]*\)/\(.*\)|PGUSER=\1\nPGPASSWORD=\2\nPGHOST=\3\nPGPORT=\4\nPGDATABASE=\5|p')
EOF

echo ""
echo "🎉 Migration Complete!"
echo "===================="
echo ""
echo "✅ Next Steps:"
echo "1. Review .env.new file"
echo "2. Test your application with: npm run dev"
echo "3. If everything works, replace .env with .env.new"
echo "4. Keep backups until you're sure everything is working!"
echo ""
echo "📌 Rollback Instructions:"
echo "If something goes wrong, restore with:"
echo "  cp .env.backup.* .env"
echo "  export DATABASE_URL='$OLD_URL'"
echo ""
echo "Your backups are safe in:"
echo "  - neon_full_backup.sql (complete backup)"
echo "  - neon_data_backup.sql (data only)"
echo "  - .env.backup.* (environment backup)"