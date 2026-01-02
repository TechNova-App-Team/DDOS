import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if we have real credentials
const hasRealCredentials = supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') && 
  !supabaseAnonKey.includes('placeholder');

// Create a mock client if credentials are not real
const mockClient = {
  from: () => ({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data: null, error: null })
      })
    }),
    insert: async () => ({ error: null }),
    update: async () => ({ error: null })
  })
};

// Create real or mock client based on credentials
export const supabase = hasRealCredentials
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (mockClient as any);
