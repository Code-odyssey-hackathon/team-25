/**
 * Deployment Readiness Check - JanaVaani Project
 * Validates production configuration before deployment
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

console.log('🚀 DEPLOYMENT READINESS CHECK');
console.log('='.repeat(70));

const results = {
  passed: [],
  warnings: [],
  failed: []
};

function pass(msg) { results.passed.push(msg); console.log('✅', msg); }
function warn(msg) { results.warnings.push(msg); console.log('⚠️ ', msg); }
function fail(msg) { results.failed.push(msg); console.log('❌', msg); }

// 1. Environment Variables Check
console.log('\n📋 ENVIRONMENT VARIABLES');
console.log('-'.repeat(50));

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_OPENWEATHER_KEY',
  'HUGGING_FACE_API_KEY'
];

const __dirname = path.dirname(new URL(import.meta.url).pathname).replace(/^\//, '');
const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');

for (const envVar of requiredEnvVars) {
  const hasVar = envContent.includes(envVar) && !envContent.includes(`${envVar}=your_`);
  if (hasVar) {
    pass(`${envVar} is set`);
  } else {
    fail(`${envVar} is missing or placeholder`);
  }
}

// Check for placeholder values
if (envContent.includes('YOUR_PROJECT_ID') || envContent.includes('your_')) {
  warn('Found placeholder values in .env file');
}

// 2. Supabase Configuration
console.log('\n☁️  SUPABASE CONFIGURATION');
console.log('-'.repeat(50));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://levkuuwyqnbauzynvppp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_GkNL7WPPhTZgk6Xeo377Ig_MXNA2er9';

if (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1')) {
  fail('Supabase URL points to localhost - must use cloud URL for production');
} else if (supabaseUrl.includes('supabase.co')) {
  pass(`Using cloud Supabase: ${supabaseUrl}`);
} else {
  warn(`Unusual Supabase URL: ${supabaseUrl}`);
}

// 3. Test Production Connection
async function testProdConnection() {
  console.log('\n🔌 TESTING PRODUCTION CONNECTION');
  console.log('-'.repeat(50));

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // Test database
    const { data, error } = await supabase.from('bridges').select('count', { count: 'exact', head: true });
    if (error) {
      fail(`Database connection failed: ${error.message}`);
    } else {
      pass('Database connection successful');
    }

    // Test auth
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      warn(`Auth service warning: ${authError.message}`);
    } else {
      pass('Auth service accessible');
    }

    // Test storage
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    if (storageError) {
      warn(`Storage warning: ${storageError.message}`);
    } else {
      pass(`Storage accessible (${buckets?.length || 0} buckets)`);
    }

  } catch (err) {
    fail(`Connection error: ${err.message}`);
  }
}

// 4. Migrations Check
console.log('\n🗄️  DATABASE MIGRATIONS');
console.log('-'.repeat(50));

const migrationsDir = path.join(__dirname, 'supabase/migrations');
if (fs.existsSync(migrationsDir)) {
  const migrations = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
  pass(`${migrations.length} migration files found`);

  // Check for applied migrations indicator
  const hasAppliedMarker = fs.existsSync(path.join(migrationsDir, '.applied')) ||
                          fs.existsSync(path.join(migrationsDir, 'schema.sql'));

  if (!hasAppliedMarker) {
    warn('Migrations may not have been applied to production database');
    console.log('   Run: npx supabase db push (if using CLI)');
    console.log('   Or apply migrations manually via Supabase Dashboard SQL Editor');
  }

  // Check migration ordering
  const migrationNumbers = migrations
    .map(f => parseInt(f.match(/^(\d+)_/)?.[1]))
    .filter(n => !isNaN(n));

  const hasGaps = migrationNumbers.some((n, i) => i > 0 && n !== migrationNumbers[i-1] + 1);
  if (hasGaps) {
    warn('Migration numbering has gaps - verify all migrations are applied');
  }

} else {
  fail('Migrations directory not found');
}

// 5. Edge Functions Check
console.log('\n⚡ EDGE FUNCTIONS');
console.log('-'.repeat(50));

const functionsDir = path.join(__dirname, 'supabase/functions');
if (fs.existsSync(functionsDir)) {
  const functions = fs.readdirSync(functionsDir).filter(f =>
    fs.statSync(path.join(functionsDir, f)).isDirectory()
  );
  pass(`${functions.length} Edge Functions found: ${functions.join(', ')}`);

  for (const func of functions) {
    const indexFile = path.join(functionsDir, func, 'index.ts');
    if (!fs.existsSync(indexFile)) {
      fail(`Edge Function "${func}" missing index.ts`);
    }
  }
} else {
  warn('No Edge Functions directory found');
}

// 6. Next.js Configuration
console.log('\n⚙️  NEXT.JS CONFIGURATION');
console.log('-'.repeat(50));

const nextConfig = path.join(__dirname, 'next.config.mjs');
if (fs.existsSync(nextConfig)) {
  const config = fs.readFileSync(nextConfig, 'utf8');

  if (config.includes('output:')) {
    pass('Output mode configured in next.config.mjs');
  } else {
    warn('No output mode specified - may default to server');
  }

  if (config.includes('images:')) {
    pass('Image optimization configured');
  } else {
    warn('Image configuration not found');
  }
} else {
  fail('next.config.mjs not found');
}

// 7. Package.json Scripts
console.log('\n📦 BUILD SCRIPTS');
console.log('-'.repeat(50));

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const hasBuild = packageJson.scripts?.build;
const hasStart = packageJson.scripts?.start;

if (hasBuild) pass('Build script configured');
else fail('Missing build script');

if (hasStart) pass('Start script configured');
else warn('Missing start script (may need for production)');

// 8. API Routes
console.log('\n🌐 API ROUTES');
console.log('-'.repeat(50));

const apiDir = path.join(__dirname, 'app/api');
if (fs.existsSync(apiDir)) {
  const apiRoutes = [];
  function scanDir(dir, prefix = '') {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath, `${prefix}/${item}`);
      } else if (item === 'route.js' || item === 'route.ts') {
        apiRoutes.push(prefix || '/');
      }
    }
  }
  scanDir(apiDir);
  pass(`${apiRoutes.length} API routes found: ${apiRoutes.join(', ') || 'none'}`);
} else {
  warn('No API routes directory found');
}

// 9. Vercel Configuration
console.log('\n▲ VERCEL CONFIGURATION');
console.log('-'.repeat(50));

if (fs.existsSync(path.join(__dirname, 'vercel.json'))) {
  pass('vercel.json found');
  const vercelConfig = fs.readFileSync(path.join(__dirname, 'vercel.json'), 'utf8');

  if (vercelConfig.includes('builds') || vercelConfig.includes('routes')) {
    pass('Vercel build configuration present');
  }

  if (vercelConfig.includes('env')) {
    warn('Vercel has environment variables in config - ensure these are also set in dashboard');
  }
} else {
  warn('No vercel.json found - will use default Next.js configuration');
}

// 10. Dependencies Check
console.log('\n📚 DEPENDENCIES');
console.log('-'.repeat(50));

const criticalDeps = [
  '@supabase/supabase-js',
  'next',
  'react',
  'react-dom'
];

for (const dep of criticalDeps) {
  if (packageJson.dependencies?.[dep]) {
    pass(`${dep} installed (${packageJson.dependencies[dep]})`);
  } else {
    fail(`${dep} not found in dependencies`);
  }
}

// 11. Security Checks
console.log('\n🔒 SECURITY CHECKS');
console.log('-'.repeat(50));

// Check for .env in gitignore
const gitignore = fs.existsSync(path.join(__dirname, '.gitignore')) ? fs.readFileSync(path.join(__dirname, '.gitignore'), 'utf8') : '';
if (gitignore.includes('.env')) {
  pass('.env is in .gitignore');
} else {
  fail('.env NOT in .gitignore - CRITICAL SECURITY RISK');
}

// Check for exposed keys in code
const srcDir = path.join(__dirname, 'src');
let exposedKeyFound = false;
if (fs.existsSync(srcDir)) {
  function scanForKeys(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanForKeys(fullPath);
      } else if (item.endsWith('.js') || item.endsWith('.jsx') || item.endsWith('.ts') || item.endsWith('.tsx')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        // Check for hardcoded supabase keys (not from env)
        if (content.includes('supabase.co') && !content.includes('process.env') && !content.includes('Deno.env')) {
          if (!content.includes('SUPABASE_URL') || content.match(/https:\/\/.*\.supabase\.co[^$]/)) {
            warn(`Possible hardcoded URL in ${fullPath}`);
            exposedKeyFound = true;
          }
        }
      }
    }
  }
  try { scanForKeys(srcDir); } catch (e) {}
}

if (!exposedKeyFound) {
  pass('No obvious hardcoded secrets found in source code');
}

// Run async checks
await testProdConnection();

// Final Summary
console.log('\n' + '='.repeat(70));
console.log('DEPLOYMENT READINESS SUMMARY');
console.log('='.repeat(70));
console.log(`✅ Passed: ${results.passed.length}`);
console.log(`⚠️  Warnings: ${results.warnings.length}`);
console.log(`❌ Failed: ${results.failed.length}`);

const isReady = results.failed.length === 0;
console.log('\n' + (isReady ? '🎉 READY FOR DEPLOYMENT' : '⛔ FIX ISSUES BEFORE DEPLOYING'));

if (results.warnings.length > 0) {
  console.log('\nWarnings to review:');
  results.warnings.forEach(w => console.log(`  - ${w}`));
}

if (results.failed.length > 0) {
  console.log('\nFailed checks (MUST FIX):');
  results.failed.forEach(f => console.log(`  - ${f}`));
}

// Deployment instructions
console.log('\n📖 DEPLOYMENT STEPS');
console.log('-'.repeat(50));
console.log('1. Ensure all environment variables are set in hosting platform');
console.log('2. Run: npm install');
console.log('3. Run: npm run build');
console.log('4. Deploy to Vercel/Netlify/other platform');
console.log('5. Verify Edge Functions are deployed to Supabase');
console.log('6. Run migrations on production database if needed');
console.log('7. Test all critical user flows');

process.exit(isReady ? 0 : 1);
