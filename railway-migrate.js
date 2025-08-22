#!/usr/bin/env node

// Railway Database Migration Script
// This script migrates your database schema to Railway's PostgreSQL

const { execSync } = require('child_process');

console.log('🚀 Starting Railway Database Migration...\n');

// Check if we're in production
if (process.env.NODE_ENV !== 'production' && !process.env.DATABASE_URL?.includes('railway')) {
  console.log('⚠️  Not in Railway production environment. Skipping migration.');
  process.exit(0);
}

console.log('📊 Database URL detected:', process.env.DATABASE_URL ? 'Yes' : 'No');

try {
  // Step 1: Push schema to database
  console.log('\n📦 Step 1: Pushing schema to database...');
  execSync('npm run db:push', { stdio: 'inherit' });
  console.log('✅ Schema pushed successfully!\n');

  // Step 2: Verify tables exist
  console.log('🔍 Step 2: Verifying database tables...');
  const { Pool } = require('@neondatabase/serverless');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `).then(result => {
    console.log('✅ Tables found:', result.rows.map(r => r.table_name).join(', '));
    pool.end();
    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  }).catch(err => {
    console.error('❌ Error verifying tables:', err.message);
    pool.end();
    process.exit(1);
  });

} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}