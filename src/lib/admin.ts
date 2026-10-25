/**
 * Emails allowed to reach the Payment Admin (Venmo/Zelle) dashboard.
 * Keep this in sync with ADMIN_EMAILS inside PaymentAdmin.tsx (the dashboard
 * also self-gates server-side via the admin APIs).
 */
export const PAYMENT_ADMIN_EMAILS = ["aiden9ki@gmail.com", "ryanthorsen34@gmail.com"];

export function canAccessPaymentAdmin(email?: string | null): boolean {
  return Boolean(email && PAYMENT_ADMIN_EMAILS.includes(email.trim().toLowerCase()));
}
