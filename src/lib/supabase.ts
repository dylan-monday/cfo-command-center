// Supabase Client Configuration
// Browser and server-side clients for CFO Command Center
//
// Note: Using permissive typing until we generate proper Supabase types.
// Run `npx supabase gen types typescript --project-id <project-id> > src/types/supabase.ts`
// to generate proper types.

import { createBrowserClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Permissive database type until proper types are generated
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PermissiveDatabase = any;

// Browser client - for client-side components
export function createBrowserSupabaseClient(): SupabaseClient<PermissiveDatabase> {
  return createBrowserClient<PermissiveDatabase>(supabaseUrl, supabaseAnonKey);
}

// Server client with service role key - for server components and API routes (bypasses RLS)
// This is a single-user app, so RLS bypass is safe and simplifies data access
export function createServerSupabaseClient(): SupabaseClient<PermissiveDatabase> {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server operations');
  }
  return createClient<PermissiveDatabase>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Admin client with service role key - bypasses RLS (use carefully)
export function createAdminSupabaseClient(): SupabaseClient<PermissiveDatabase> {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations');
  }
  return createClient<PermissiveDatabase>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Default export for simple cases
export const supabase = createClient<PermissiveDatabase>(supabaseUrl, supabaseAnonKey);
