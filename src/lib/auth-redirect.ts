/** Post-auth destinations allowed when linked from checkout "Log in". */
const ALLOWED_REDIRECTS = new Set(["/checkout"]);

export function authRedirectFromSearch(raw: unknown): string | undefined {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) return undefined;
  return ALLOWED_REDIRECTS.has(raw) ? raw : undefined;
}

export function validateAuthSearch(search: Record<string, unknown>) {
  const redirect = authRedirectFromSearch(search.redirect);
  return redirect ? { redirect } : {};
}
