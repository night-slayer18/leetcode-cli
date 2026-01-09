// Supabase client initialization
import { createClient } from '@supabase/supabase-js';

// Shared Supabase project for collaborative coding
// These are public anon keys - designed to be safe in client-side code
// They can only access Realtime channels, no database access without RLS
const SUPABASE_URL = 'https://abagrmwdpvnfyuqizyym.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_indrKu8VJmASdyLp7w8Hog_OyqT17cV';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function isSupabaseConfigured(): boolean {
  return true;
}
