import type { SupabaseClient, User } from '@supabase/supabase-js'

/**
 * Returns true if the currently authenticated user exists in public.app_admins.
 * Works with any Supabase client (browser or server).
 * Does NOT rely on the is_admin() RPC — queries the table directly.
 *
 * Pass `preloadedUser` to avoid a redundant getUser() call (e.g. in middleware
 * where getUser() has already been called for session refresh).
 */
export async function isUserAdmin(
  supabase: SupabaseClient,
  preloadedUser?: User | null
): Promise<boolean> {
  const user =
    preloadedUser !== undefined
      ? preloadedUser
      : (await supabase.auth.getUser()).data.user

  if (!user) return false

  const { data } = await supabase
    .from('app_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  return !!data
}
