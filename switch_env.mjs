/**
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
  const envContent = `# Local Supabase Development
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
`;

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
