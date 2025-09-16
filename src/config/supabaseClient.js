import { createClient } from '@supabase/supabase-js';

// Read from environment variables if available; fallback to window globals for CRA
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || window.__ENV__?.SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || window.__ENV__?.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export default supabase;


