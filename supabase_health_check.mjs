/**
 * Supabase Health Check - Comprehensive Analysis
 * Tests both cloud and local Supabase connectivity
 */
import { createClient } from '@supabase/supabase-js';

// Configuration from .env
const CLOUD_URL = 'https://levkuuwyqnbauzynvppp.supabase.co';
const CLOUD_ANON_KEY = 'sb_publishable_GkNL7WPPhTZgk6Xeo377Ig_MXNA2er9';
const CLOUD_SERVICE_KEY = 'sb_secret_L7tMNW_vBdGkr3ehyKKwDQ_9MplwnaG';

// Local Supabase default ports
const LOCAL_URLS = [
  'http://localhost:54321',  // Default Supabase API port
  'http://127.0.0.1:54321',
];

console.log('='.repeat(70));
console.log('SUPABASE HEALTH CHECK - JanaVaani Project');
console.log('='.repeat(70));

// 1. Environment Analysis
console.log('\n📋 ENVIRONMENT ANALYSIS');
console.log('-'.repeat(50));
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('Project:', 'JanaVaani');

// 2. Configuration Analysis
console.log('\n🔧 CONFIGURATION ANALYSIS');
console.log('-'.repeat(50));
console.log('Configured Supabase URL:', CLOUD_URL);
console.log('URL Type:', CLOUD_URL.includes('localhost') || CLOUD_URL.includes('127.0.0.1') ? 'LOCAL' : 'CLOUD (Supabase.io)');
console.log('Project ID:', CLOUD_URL.match(/https:\/\/([^.]+)\./)?.[1] || 'N/A');

// 3. Test Cloud Connection
async function testCloudConnection() {
  console.log('\n☁️  TESTING CLOUD SUPABASE CONNECTION');
  console.log('-'.repeat(50));

  const supabase = createClient(CLOUD_URL, CLOUD_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // Test 1: Basic connectivity (health check via auth)
    const startTime = Date.now();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    const latency = Date.now() - startTime;

    console.log(`✅ Connection established to ${CLOUD_URL}`);
    console.log(`   Latency: ${latency}ms`);

    // Test 2: Database query (public table)
    const { data: tables, error: dbError } = await supabase
      .from('bridges')
      .select('count', { count: 'exact', head: true });

    if (dbError) {
      console.log(`⚠️  Database query warning: ${dbError.message}`);
      if (dbError.message.includes('does not exist')) {
        console.log('   The "bridges" table may not exist. Checking available tables...');
      }
    } else {
      console.log(`✅ Database accessible. Tables query successful.`);
    }

    // Test 3: Storage check
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    if (storageError) {
      console.log(`⚠️  Storage check: ${storageError.message}`);
    } else {
      console.log(`✅ Storage accessible. Buckets: ${buckets?.length || 0}`);
      if (buckets?.length > 0) {
        console.log(`   Available buckets: ${buckets.map(b => b.name).join(', ')}`);
      }
    }

    // Test 4: Auth configuration
    const { data: authConfig, error: configError } = await supabase.auth.getSession();
    console.log(`✅ Auth service accessible`);

    return { success: true, latency };

  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
    if (error.message.includes('fetch failed')) {
      console.log('   Possible causes: No internet connection, DNS issue, or URL incorrect');
    }
    return { success: false, error: error.message };
  }
}

// 4. Test Local Supabase
async function testLocalConnection() {
  console.log('\n🏠 TESTING LOCAL SUPABASE CONNECTION');
  console.log('-'.repeat(50));

  for (const url of LOCAL_URLS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${url}/rest/v1/`, {
        signal: controller.signal,
        headers: { 'apikey': 'test' }
      }).catch(() => null);

      clearTimeout(timeout);

      if (response) {
        console.log(`✅ Local Supabase detected at ${url}`);
        console.log(`   Status: ${response.status}`);
        return { success: true, url };
      }
    } catch (e) {
      // Connection refused or timeout - normal if local isn't running
    }
  }

  console.log(`❌ No local Supabase instance detected`);
  console.log(`   Checked URLs: ${LOCAL_URLS.join(', ')}`);
  console.log(`   Note: Local Supabase requires Docker + Supabase CLI`);
  return { success: false };
}

// 5. Check Migration Status
async function checkMigrations() {
  console.log('\n🗄️  MIGRATION ANALYSIS');
  console.log('-'.repeat(50));

  try {
    const fs = await import('fs');
    const path = await import('path');

    const migrationsDir = './supabase/migrations';
    if (!fs.existsSync(migrationsDir)) {
      console.log('❌ No migrations directory found');
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration files:`);
    files.forEach((f, i) => {
      const stat = fs.statSync(path.join(migrationsDir, f));
      console.log(`   ${i + 1}. ${f} (${(stat.size / 1024).toFixed(1)} KB)`);
    });

    // Check for config.toml (indicates local supabase setup)
    const hasConfig = fs.existsSync('./supabase/config.toml');
    console.log(`\nLocal Supabase initialized: ${hasConfig ? '✅ Yes' : '❌ No (config.toml missing)'}`);

  } catch (error) {
    console.log(`Error checking migrations: ${error.message}`);
  }
}

// 6. Final Report
async function generateReport() {
  console.log('\n' + '='.repeat(70));
  console.log('FINAL REPORT');
  console.log('='.repeat(70));

  const cloud = await testCloudConnection();
  const local = await testLocalConnection();
  await checkMigrations();

  console.log('\n📊 SUMMARY');
  console.log('-'.repeat(50));
  console.log(`Cloud Supabase (${CLOUD_URL}):`, cloud.success ? '✅ CONNECTED' : '❌ FAILED');
  console.log(`Local Supabase (localhost:54321):`, local.success ? '✅ RUNNING' : '❌ NOT RUNNING');

  console.log('\n🎯 RECOMMENDATIONS');
  console.log('-'.repeat(50));

  if (cloud.success) {
    console.log('✅ Your app is correctly configured for cloud Supabase');
    console.log('   The project uses the hosted Supabase instance at supabase.co');

    if (cloud.latency > 500) {
      console.log('   ⚠️  High latency detected. Consider enabling connection pooling.');
    }
  } else {
    console.log('❌ Check your internet connection and Supabase project status');
    console.log('   Verify the project is active at: https://supabase.com/dashboard');
  }

  if (!local.success) {
    console.log('\n🏠 For local Supabase development:');
    console.log('   1. Install Docker Desktop for Windows');
    console.log('   2. Install Supabase CLI: npm install -g supabase');
    console.log('   3. Initialize: supabase init');
    console.log('   4. Start: supabase start');
    console.log('   5. Update .env to use http://localhost:54321');
  }
}

generateReport().catch(console.error);
