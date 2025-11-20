#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests the database connection and basic functionality
 */

const { Client } = require('pg');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_DATABASE || 'b2b_ecommerce',
  user: process.env.DB_USERNAME || 'ecommerce',
  password: process.env.DB_PASSWORD || 'ecommerce_password',
};

async function testConnection() {
  console.log('🧪 Testing Database Connection...');
  console.log('================================');
  
  const client = new Client(config);
  
  try {
    // Connect to the database
    await client.connect();
    console.log('✅ Connected to PostgreSQL successfully!');
    
    // Test basic query
    const result = await client.query('SELECT current_database(), current_user, version()');
    console.log('\n📊 Database Information:');
    console.log('Database:', result.rows[0].current_database);
    console.log('User:', result.rows[0].current_user);
    console.log('Version:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
    
    // Test extensions
    console.log('\n🔧 Checking Extensions:');
    const extensions = await client.query(`
      SELECT extname 
      FROM pg_extension 
      WHERE extname IN ('uuid-ossp', 'pg_trgm', 'unaccent')
      ORDER BY extname
    `);
    
    extensions.rows.forEach(ext => {
      console.log(`✅ ${ext.extname}`);
    });
    
    // Test schema access
    console.log('\n📋 Checking Schema Access:');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      LIMIT 5
    `);
    
    if (tables.rows.length === 0) {
      console.log('ℹ️  No tables found in public schema (expected for fresh setup)');
    } else {
      console.log('Tables in public schema:');
      tables.rows.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    }
    
    console.log('\n✅ All database tests passed!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🐛 Troubleshooting:');
    console.log('1. Make sure PostgreSQL container is running: npm run docker:up');
    console.log('2. Check database setup: npm run db:check');
    console.log('3. Verify .env configuration');
    console.log('4. Check container logs: npm run docker:logs');
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the test
testConnection();
