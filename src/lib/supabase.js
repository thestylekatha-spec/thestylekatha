import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://kiisyribpkttraufwldg.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpaXN5cmlicGt0dHJhdWZ3bGRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NjE2MzksImV4cCI6MjEwMjUzNzYzOX0.g_d3q70aIdk2unsiU34h4Q1JW6Z4LdzjFVMyRuJeFBs';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export const SITE_CONFIG = {
  whatsapp: { number: '9177133424' },
  currency: { symbol: '\u20B9', locale: 'en-IN' },
  brand: { name: 'The Style Katha', tagline: 'Jewellery | Clothing | Timeless Style' },
  storage: { productBucket: 'product-images' },
};

function decodeJwtPayload(token) {
  try {
    const part = token.split('.')[1];
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(b64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')
    );
    return JSON.parse(json);
  } catch (_e) {
    return null;
  }
}

function validateAnonKey(key) {
  var payload = decodeJwtPayload(key);
  if (!payload) {
    console.error('[Supabase] Your VITE_SUPABASE_ANON_KEY is malformed. Go to Supabase Dashboard > Project Settings > API, copy the "anon" / "public" key, and paste it into your .env file.');
    return;
  }
  var nowSec = Math.floor(Date.now() / 1000);
  var SKEW = 300;
  if (payload.iat && payload.iat > nowSec + SKEW) {
    var iatDate = new Date(payload.iat * 1000).toISOString();
    console.error(
      '[Supabase] JWT "issued at" (' + iatDate + ') is in the future. ' +
      'The server will reject it with 401 "JWT issued at future". ' +
      'Fix: open Supabase Dashboard > Project Settings > API, copy the current anon key, ' +
      'and replace VITE_SUPABASE_ANON_KEY in your .env file. Then restart the dev server.'
    );
  }
  if (payload.exp && payload.exp + SKEW < nowSec) {
    var expDate = new Date(payload.exp * 1000).toISOString();
    console.error(
      '[Supabase] JWT expired on ' + expDate + '. ' +
      'Copy the current anon key from Supabase Dashboard > Project Settings > API into your .env file.'
    );
  }
}

validateAnonKey(SUPABASE_ANON_KEY);

export function isAuthError(err) {
  if (!err) return false;
  var msg = String((err.message || err) || err);
  return /jwt|401|unauthorized|invalid api key|signature|anon/i.test(msg);
}

export function dbErrorMessage(label, err) {
  var msg = String((err && err.message) || err || 'Unknown error');
  if (/jwt|api key|401|unauthorized|signature/i.test(msg)) {
    return label + ': Database authentication failed. Copy the correct anon key from Supabase Dashboard > Project Settings > API into your .env file and restart.';
  }
  if (/network|fetch|Failed to fetch/i.test(msg)) {
    return label + ': Cannot reach the database. Check your internet connection and try again.';
  }
  return label + ': ' + msg;
}
