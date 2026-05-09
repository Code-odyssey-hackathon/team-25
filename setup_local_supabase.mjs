/**
 * Local Supabase Setup Helper - JanaVaani
 * Guides you through setting up local Supabase for development
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🏠 LOCAL SUPABASE SETUP GUIDE');
console.log('='.repeat(70));

// Check prerequisites
console.log('\n📋 CHECKING PREREQUISITES');
console.log('-'.repeat(50));

const checks = {
  docker: false,
  supabaseCLI: false,
  nodeModules: false,
  migrations: false
};

// Check Docker
try {
  execSync('docker --version', { stdio: 'pipe' });
  console.log('✅ Docker is installed');
  checks.docker = true;
} catch {
  console.log('❌ Docker NOT installed');
  console.log('   Download: https://www.docker.com/products/docker-desktop');
}

// Check Supabase CLI
try {
  execSync('supabase --version', { stdio: 'pipe' });
  console.log('✅ Supabase CLI is installed');
  checks.supabaseCLI = true;
} catch {
  console.log('❌ Supabase CLI NOT installed');
  console.log('   Install: npm install -g supabase');
}

// Check node_modules
if (fs.existsSync(path.join(__dirname, 'node_modules'))) {
  console.log('✅ node_modules exists');
  checks.nodeModules = true;
} else {
  console.log('⚠️  node_modules missing - run: npm install');
}

// Check migrations
if (fs.existsSync(path.join(__dirname, 'supabase/migrations'))) {
  const migrations = fs.readdirSync(path.join(__dirname, 'supabase/migrations'))
    .filter(f => f.endsWith('.sql'));
  console.log(`✅ ${migrations.length} migration files found`);
  checks.migrations = true;
} else {
  console.log('❌ Migrations directory not found');
}

// Check if supabase is initialized
const isInitialized = fs.existsSync(path.join(__dirname, 'supabase/config.toml'));
if (isInitialized) {
  console.log('✅ Supabase project initialized (config.toml exists)');
} else {
  console.log('⚠️  Supabase not initialized yet');
}

console.log('\n' + '='.repeat(70));

// Setup steps
if (!checks.docker || !checks.supabaseCLI) {
  console.log('\n⛔ INSTALL MISSING PREREQUISITES FIRST');
  console.log('-'.repeat(50));

  if (!checks.docker) {
    console.log('\n🐳 INSTALL DOCKER:');
    console.log('   1. Download Docker Desktop for Windows:');
    console.log('      https://www.docker.com/products/docker-desktop');
    console.log('   2. Install and start Docker Desktop');
    console.log('   3. Wait for Docker to fully start (whale icon in system tray)');
    console.log('   4. Test: docker --version');
  }

  if (!checks.supabaseCLI) {
    console.log('\n🔧 INSTALL SUPABASE CLI:');
    console.log('   npm install -g supabase');
    console.log('   # or using scoop:');
    console.log('   scoop install supabase');
  }
} else {
  console.log('\n🎉 ALL PREREQUISITES MET!');
  console.log('-'.repeat(50));

  console.log('\n📖 SETUP STEPS:');
  console.log('-'.repeat(50));

  if (!isInitialized) {
    console.log('\n1️⃣  INITIALIZE SUPABASE PROJECT:');
    console.log('   cd d:\\BVB\\team-25');
    console.log('   supabase init');
    console.log('   # This creates supabase/config.toml');
  }

  console.log('\n2️⃣  START LOCAL SUPABASE:');
  console.log('   supabase start');
  console.log('   # This starts PostgreSQL, Auth, Storage, Edge Functions');
  console.log('   # First run downloads Docker images (~2GB) - be patient!');

  console.log('\n3️⃣  GET LOCAL CREDENTIALS:');
  console.log('   supabase status');
  console.log('   # Copy the API URL and anon key');

  console.log('\n4️⃣  CREATE LOCAL ENV FILE:');
  console.log('   # Create .env.local with local credentials:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321');
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=<local_anon_key_from_status>');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=<local_service_key_from_status>');

  console.log('\n5️⃣  APPLY MIGRATIONS TO LOCAL DB:');
  console.log('   supabase db reset');
  console.log('   # This applies all migrations in supabase/migrations/');

  console.log('\n6️⃣  START NEXT.JS DEV SERVER:');
  console.log('   npm run dev');
  console.log('   # App will use local Supabase!');

  console.log('\n📊 LOCAL SUPABASE SERVICES (after start):');
  console.log('   - API URL: http://localhost:54321');
  console.log('   - DB URL: postgresql://postgres:postgres@localhost:54322/postgres');
  console.log('   - Studio (GUI): http://localhost:54323');
  console.log('   - Inbucket (Email): http://localhost:54324');
  console.log('   - Edge Functions: http://localhost:54321/functions/v1/<name>');
}

console.log('\n' + '='.repeat(70));
console.log('💡 USEFUL COMMANDS');
console.log('-'.repeat(50));
console.log('supabase start          # Start all services');
console.log('supabase stop           # Stop all services');
console.log('supabase status         # Show status & credentials');
console.log('supabase db reset       # Reset DB and reapply migrations');
console.log('supabase db push        # Push migrations to remote');
console.log('supabase functions serve # Serve Edge Functions locally');

console.log('\n📝 NOTE FOR DEVELOPMENT:');
console.log('-'.repeat(50));
console.log('Create .env.local file to override production credentials:');
console.log('  NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321');
console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase status>');
console.log('  SUPABASE_SERVICE_ROLE_KEY=<from supabase status>');
console.log('');
console.log('Next.js loads .env.local before .env, so local takes precedence!');

// Create a helper script
console.log('\n🛠️  Creating helper script...');

const switchScript = `/**
 * Switch between local and production Supabase
 * Usage: node switch_env.mjs [local|production]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mode = process.argv[2];

if (!mode || !['local', 'production'].includes(mode)) {
  console.log('Usage: node switch_env.mjs [local|production]');
  process.exit(1);
}

if (mode === 'local') {
  const envContent = \`# Local Supabase Development
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_local_service_key_here

# Other APIs (same as production)
NEXT_PUBLIC_OPENWEATHER_KEY=ed2f33ba6d909a796651996087608398
HUGGING_FACE_API_KEY=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

# Feature Flags
NEXT_PUBLIC_ENABLE_VOICE_REPORT=true
NEXT_PUBLIC_ENABLE_AI_PHOTO_PARSE=true
NEXT_PUBLIC_ENABLE_ME_TOO_UPVOTE=true
NEXT_PUBLIC_ENABLE_CITY_PULSE=true
NEXT_PUBLIC_ENABLE_PREDICTIVE_INFRA=true
NEXT_PUBLIC_ENABLE_MASTER_TICKETS=true
NEXT_PUBLIC_ENABLE_AUTO_ESCALATION=true
NEXT_PUBLIC_ENABLE_CIVIC_TRUST=true
NEXT_PUBLIC_ENABLE_BLOCKCHAIN=true
NEXT_PUBLIC_ENABLE_CIVIC_REWARDS=true
NEXT_PUBLIC_ENABLE_AI_CHAT=true
NEXT_PUBLIC_ENABLE_SOS=true
NEXT_PUBLIC_ENABLE_PREDICTIVE_MAINTENANCE=false
NEXT_PUBLIC_ENABLE_DIRECT_CHAT=false
\`;

  fs.writeFileSync(path.join(__dirname, '.env.local'), envContent);
  console.log('✅ Created .env.local for LOCAL development');
  console.log('⚠️  Update NEXT_PUBLIC_SUPABASE_ANON_KEY with key from: supabase status');
  console.log('⚠️  Update SUPABASE_SERVICE_ROLE_KEY with key from: supabase status');
} else {
  if (fs.existsSync(path.join(__dirname, '.env.local'))) {
    fs.unlinkSync(path.join(__dirname, '.env.local'));
    console.log('✅ Removed .env.local - now using PRODUCTION .env');
  } else {
    console.log('✅ Already using PRODUCTION .env');
  }
}
`;

fs.writeFileSync(path.join(__dirname, 'switch_env.mjs'), switchScript);
console.log('✅ Created switch_env.mjs - use to switch between local/prod');

console.log('\n' + '='.repeat(70));
