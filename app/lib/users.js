import { supabaseAdmin } from '@/lib/supabase/admin'

// Email + first name for a user. Emails live in auth.users, not in profiles.
export async function getUserContact(userId) {
  try {
    const {
      data: { user },
    } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (!user?.email) return null
    return {
      email: user.email,
      firstName: user.user_metadata?.first_name || user.email.split('@')[0],
    }
  } catch (err) {
    console.error('[getUserContact] lookup failed:', err.message)
    return null
  }
}
