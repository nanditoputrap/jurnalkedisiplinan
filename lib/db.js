import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isDatabaseConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

export const supabaseAdmin = isDatabaseConfigured
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

const throwIfSupabaseError = (error) => {
  if (error) {
    throw error;
  }
};

export const getAppState = async () => {
  if (!supabaseAdmin) {
    throw new Error('Supabase belum dikonfigurasi.');
  }

  const { data, error } = await supabaseAdmin
    .from('app_state')
    .select('payload, updated_at')
    .eq('id', 'main')
    .maybeSingle();

  throwIfSupabaseError(error);

  return data || null;
};

export const saveAppState = async (payload) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase belum dikonfigurasi.');
  }

  const { data, error } = await supabaseAdmin
    .from('app_state')
    .upsert(
      {
        id: 'main',
        payload,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: 'id'
      }
    )
    .select('updated_at')
    .single();

  throwIfSupabaseError(error);

  return data || null;
};
