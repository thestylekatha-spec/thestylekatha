import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kiisyribpkttraufwldg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpaXN5cmlicGt0dHJhdWZ3bGRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NjE2MzksImV4cCI6MjEwMjUzNzYzOX0.g_d3q70aIdk2unsiU34h4Q1JW6Z4LdzjFVMyRuJeFBs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const SITE_CONFIG = {
  whatsapp: { number: '9177133424' },
  currency: { symbol: '₹', locale: 'en-IN' },
  brand: { name: 'The Style Katha', tagline: 'Jewellery | Clothing | Timeless Style' },
  storage: { productBucket: 'product-images' },
};
