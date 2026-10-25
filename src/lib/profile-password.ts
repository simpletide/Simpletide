import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type PasswordChangeInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export function userHasEmailPassword(user: User): boolean {
  return user.identities?.some((identity) => identity.provider === "email") ?? false;
}

export function wantsPasswordChange(input: PasswordChangeInput): boolean {
  return Boolean(
    input.currentPassword.trim() || input.newPassword.trim() || input.confirmPassword.trim(),
  );
}

export function validatePasswordChange(
  user: User,
  input: PasswordChangeInput,
): { ok: true } | { ok: false; message: string } {
  if (!wantsPasswordChange(input)) return { ok: true };

  const current = input.currentPassword.trim();
  const next = input.newPassword.trim();
  const confirm = input.confirmPassword.trim();
  const hasEmailPassword = userHasEmailPassword(user);

  if (hasEmailPassword) {
    if (!current || !next || !confirm) {
      return { ok: false, message: "Fill in all password fields to change your password." };
    }
    if (current === next) {
      return { ok: false, message: "New password must be different from your current password." };
    }
  } else if (!next || !confirm) {
    return { ok: false, message: "Enter and confirm your new password." };
  }

  if (next !== confirm) {
    return { ok: false, message: "New passwords do not match." };
  }
  if (next.length < 8) {
    return { ok: false, message: "New password must be at least 8 characters." };
  }

  return { ok: true };
}

/** Verifies the current password (email accounts) and updates to the new password. */
export async function applyPasswordChange(user: User, input: PasswordChangeInput): Promise<void> {
  const next = input.newPassword.trim();
  const hasEmailPassword = userHasEmailPassword(user);

  if (hasEmailPassword) {
    const email = user.email?.trim();
    if (!email) throw new Error("Your account does not have an email address.");

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: input.currentPassword,
    });
    if (signInError || !data.session) {
      throw new Error("Current password is incorrect.");
    }
  }

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) {
    throw new Error(error.message || "Could not update your password.");
  }
}
