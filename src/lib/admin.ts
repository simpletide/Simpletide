/**
 * Strictly locked to the single Simpletide admin account.
 * Also enforced server-side inside `supabase/functions/admin-orders/index.ts`.
 */
export const PAYMENT_ADMIN_EMAILS = ["simpletidebusiness@gmail.com"];

export function canAccessPaymentAdmin(email?: string | null): boolean {
  return Boolean(email && PAYMENT_ADMIN_EMAILS.includes(email.trim().toLowerCase()));
}
