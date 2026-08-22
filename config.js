// Shared configuration for The Style Katha
window.SITE_CONFIG = {
  supabase: {
    url: 'https://kiisyribpkttraufwldg.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpaXN5cmlicGt0dHJhdWZ3bGRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NjE2MzksImV4cCI6MjEwMjUzNzYzOX0.g_d3q70aIdk2unsiU34h4Q1JW6Z4LdzjFVMyRuJeFBs'
  },
  storage: {
    productBucket: 'product-images'
  },
  whatsapp: {
    // Fallback only — the live number comes from Supabase (site_settings)
    number: '9177133424'
  },
  currency: {
    symbol: '₹',
    locale: 'en-IN'
  },
  brand: {
    name: 'The Style Katha',
    tagline: 'Jewellery | Clothing | Timeless Style'
  }
};

// Initialize Supabase client
window.supabaseClient = window.supabase.createClient(
  window.SITE_CONFIG.supabase.url,
  window.SITE_CONFIG.supabase.anonKey
);