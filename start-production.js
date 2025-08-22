#!/usr/bin/env node

// Production Start Script for Railway
// This handles database migration and server startup

import { execSync } from 'child_process';
import { Pool } from '@neondatabase/serverless';

console.log('🚀 Starting FlowLingo Production Server...\n');

// Check required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'OPENAI_API_KEY'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('\nPlease add these in Railway dashboard:');
  missingVars.forEach(v => {
    if (v === 'JWT_SECRET') {
      console.error(`  ${v}=<generate-a-long-random-string>`);
    } else {
      console.error(`  ${v}=<your-${v.toLowerCase().replace(/_/g, '-')}>`);
    }
  });
  process.exit(1);
}

console.log('✅ All required environment variables found\n');

// Run database migration if needed
console.log('📦 Checking database schema...');
try {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  pool.query(`
    SELECT COUNT(*) as table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('users', 'sessions', 'vocabulary_words', 'conversations')
  `).then(async (result) => {
    const tableCount = parseInt(result.rows[0].table_count);
    
    if (tableCount < 4) {
      console.log('⚠️  Some tables are missing. Running migration...');
      try {
        execSync('npm run db:push', { stdio: 'inherit' });
        console.log('✅ Database migration completed!\n');
      } catch (migrationError) {
        console.error('❌ Migration failed:', migrationError.message);
        console.error('Continuing anyway - tables might already exist\n');
      }
    } else {
      console.log('✅ All required tables exist\n');
    }
    
    await pool.end();
    
    // Start the server
    console.log('🌐 Starting Express server...\n');
    // Use tsx to run TypeScript directly
    execSync('npx tsx server/index.ts', { stdio: 'inherit' });
    
  }).catch(async (err) => {
    console.error('⚠️  Could not check tables:', err.message);
    console.log('Running migration to be safe...');
    
    try {
      execSync('npm run db:push', { stdio: 'inherit' });
      console.log('✅ Database migration completed!\n');
    } catch (migrationError) {
      console.error('❌ Migration failed:', migrationError.message);
      console.error('Continuing anyway - tables might already exist\n');
    }
    
    await pool.end();
    
    // Start the server anyway
    console.log('🌐 Starting Express server...\n');
    // Use tsx to run TypeScript directly
    execSync('npx tsx server/index.ts', { stdio: 'inherit' });
  });
  
} catch (error) {
  console.error('❌ Database check failed:', error.message);
  console.log('Attempting to start server anyway...\n');
  
  // Try migration just in case
  try {
    execSync('npm run db:push', { stdio: 'inherit' });
  } catch (migrationError) {
    console.error('Migration attempt failed, continuing...\n');
  }
  
  // Start the server
  execSync('npx tsx server/index.ts', { stdio: 'inherit' });
}