import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = envFile.split('\n').reduce((acc, line) => {
  const [key, ...value] = line.split('=');
  if (key && value) acc[key.trim()] = value.join('=').trim().replace(/^"|"$/g, '');
  return acc;
}, {});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBuckets() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) console.error('Error fetching buckets:', error);
  else console.log('Buckets:', data);
  
  // Try to create the bucket if it doesn't exist
  if (data && !data.find(b => b.name === 'report-photos')) {
    console.log('Bucket "report-photos" not found. Creating it...');
    const { data: createData, error: createError } = await supabase.storage.createBucket('report-photos', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/heic']
    });
    if (createError) console.error('Error creating bucket:', createError);
    else console.log('Bucket created:', createData);
  }
}

checkBuckets();
