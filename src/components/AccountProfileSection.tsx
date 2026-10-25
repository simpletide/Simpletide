import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { Calendar, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import PaymentAdmin from "@/components/PaymentAdmin";
import { supabase } from "@/integrations/supabase/client";
import { displayNameFor, profileInitialsFor } from "@/lib/auth-context";
import { canAccessPaymentAdmin } from "@/lib/admin";
import {
  applyPasswordChange,
  userHasEmailPassword,
  validatePasswordChange,
  wantsPasswordChange,
} from "@/lib/profile-password";
import { avatarUrlFromUser, uploadProfileAvatar } from "@/lib/profile-avatar";
import {
  accountBody,
  accountCaption,
  accountCard,
  accountLabel,
  accountSectionSubtitle,
  accountSectionTitle,
  AVATAR_GRADIENT,
  CTA_BUTTON,
  CTA_GRADIENT,
} from "@/lib/account-ui";

type ProfileTab = "profile" | "payment-admin";

type ProfileMeta = {
  full_name?: string;
  name?: string;
  phone?: string;
  company?: string;
  city?: string;
  date_of_birth?: string;
  bio?: string;
  avatar_url?: string;
};

type Props = {
  user: User;
  tab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
};

const PROFILE_INPUT =
  "w-full rounded-full border border-transparent bg-[#f5f5f5] px-4 py-2.5 text-[15px] leading-snug text-neutral-900 placeholder:text-neutral-400 transition-[box-shadow,border-color] duration-150 focus:border-[#4a85ad] focus:outline-none focus:ring-0 focus:shadow-[0_0_0_3px_rgba(58,120,165,0.16)]";

const PROFILE_TEXTAREA =
  "w-full rounded-2xl border border-transparent bg-[#f5f5f5] px-4 py-2.5 text-[15px] leading-snug text-neutral-900 placeholder:text-neutral-400 transition-[box-shadow,border-color] duration-150 focus:border-[#4a85ad] focus:outline-none focus:ring-0 focus:shadow-[0_0_0_3px_rgba(58,120,165,0.16)]";

const CHANGE_PHOTO_BUTTON =
  "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-[15px] font-semibold text-neutral-800 transition-colors hover:bg-neutral-50";

function readMeta(user: User): ProfileMeta {
  return (user.user_metadata || {}) as ProfileMeta;
}

function ProfileAvatar({
  user,
  size = "lg",
  urlOverride,
}: {
  user: User;
  size?: "lg" | "xl";
  urlOverride?: string | null;
}) {
  const url = urlOverride ?? avatarUrlFromUser(user);
  const dim = size === "xl" ? "h-24 w-24 text-3xl" : "h-20 w-20 text-2xl";
  if (url) {
    return (
      <img
        src={url}
        alt=""
        className={`${dim} shrink-0 rounded-full object-cover`}
      />
    );
  }
  return (
    <div
      className={`${dim} flex shrink-0 items-center justify-center rounded-full font-semibold tracking-tight ${AVATAR_GRADIENT}`}
    >
      {profileInitialsFor(user)}
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className={`mb-0.5 ${accountCaption}`}>{label}</p>
      <p className={`font-semibold text-neutral-900 ${accountBody}`}>{value || "—"}</p>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className={`mb-1 block ${accountLabel}`}>{label}</span>
      {children}
    </label>
  );
}

type EditFormState = {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  city: string;
  dateOfBirth: string;
  bio: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

function emptyForm(user: User): EditFormState {
  const meta = readMeta(user);
  return {
    fullName: displayNameFor(user),
    email: user.email || "",
    phone: meta.phone || "",
    company: meta.company || "",
    city: meta.city || "",
    dateOfBirth: meta.date_of_birth || "",
    bio: meta.bio || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  };
}

export function AccountProfileSection({ user, tab, onTabChange }: Props) {
  const isAdmin = canAccessPaymentAdmin(user.email);
  const meta = readMeta(user);
  const displayName = displayNameFor(user);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [form, setForm] = useState<EditFormState>(() => emptyForm(user));
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAdmin && tab === "payment-admin") {
      onTabChange("profile");
    }
  }, [isAdmin, tab, onTabChange]);

  useEffect(() => {
    if (!editing) setForm(emptyForm(user));
  }, [user, editing]);

  useEffect(() => {
    setAvatarPreview(null);
  }, [user.id, readMeta(user).avatar_url]);

  const openEdit = () => {
    setForm(emptyForm(user));
    setEditing(true);
  };

  const handlePhotoChange = async (file: File) => {
    setUploadingPhoto(true);
    try {
      const publicUrl = await uploadProfileAvatar(user.id, file);
      setAvatarPreview(publicUrl);
      toast.success("Profile photo updated.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not upload photo. Please try again.";
      toast.error(message);
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const photoPicker = (
    <>
      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handlePhotoChange(file);
        }}
      />
      <button
        type="button"
        disabled={uploadingPhoto}
        onClick={() => photoInputRef.current?.click()}
        className={`${CHANGE_PHOTO_BUTTON} gap-2`}
      >
        {uploadingPhoto ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading…
          </>
        ) : (
          "Change photo"
        )}
      </button>
      <p className={`mt-1.5 ${accountCaption}`}>JPG, GIF, PNG or WebP. Max 10MB.</p>
    </>
  );

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();

    const passwordInput = {
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
      confirmPassword: form.confirmPassword,
    };
    const changingPassword = wantsPasswordChange(passwordInput);

    const passwordValidation = validatePasswordChange(user, passwordInput);
    if (!passwordValidation.ok) {
      toast.error(passwordValidation.message);
      return;
    }

    setSaving(true);
    try {
      if (changingPassword) {
        await applyPasswordChange(user, passwordInput);
      }

      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: form.fullName.trim(),
          phone: form.phone.trim() || undefined,
          company: form.company.trim() || undefined,
          city: form.city.trim() || undefined,
          date_of_birth: form.dateOfBirth.trim() || undefined,
          bio: form.bio.trim() || undefined,
        },
      });
      if (error) throw error;

      toast.success(changingPassword ? "Profile and password updated." : "Profile updated.");
      setEditing(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not save your profile. Please try again.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: ProfileTab; label: string; icon?: ReactNode }[] = [
    { id: "profile", label: "Profile" },
    ...(isAdmin
      ? [{ id: "payment-admin" as const, label: "Payment Admin", icon: <CreditCard className="h-4 w-4" /> }]
      : []),
  ];

  const hasEmailPassword = userHasEmailPassword(user);

  return (
    <section>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className={accountSectionTitle}>My Profile</h2>
          <p className={accountSectionSubtitle}>
            {tab === "payment-admin"
              ? "Manage payments and order fulfillment."
              : "Manage your personal information."}
          </p>
        </div>
        {tab === "profile" && !editing && (
          <button type="button" onClick={openEdit} className={CTA_BUTTON}>
            Edit profile
          </button>
        )}
      </header>

      {tabs.length > 1 && !editing && (
        <nav className="mb-6 flex gap-1 border-b border-neutral-200" aria-label="Profile sections">
          {tabs.map((item, index) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`inline-flex items-center gap-2 border-b-2 py-2.5 text-[14px] font-semibold transition-colors ${
                  index === 0 ? "pl-0 pr-4" : "px-4"
                } ${
                  active
                    ? "border-[#7c3aed] text-[#7c3aed]"
                    : "border-transparent text-neutral-500 hover:text-neutral-800"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>
      )}

      {tab === "profile" && !editing && (
        <div className={`${accountCard} p-5 md:p-6`}>
          <div className="mb-5">
            <ProfileAvatar user={user} urlOverride={avatarPreview} />
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            <ProfileField label="Full Name" value={displayName} />
            <ProfileField label="Email" value={user.email || ""} />
            <ProfileField label="Phone Number" value={meta.phone || ""} />
            <ProfileField label="Company" value={meta.company || ""} />
            <ProfileField label="City" value={meta.city || ""} />
            <ProfileField label="Password" value="••••••••" />
            <ProfileField label="Date of Birth" value={meta.date_of_birth || ""} />
            <div className="sm:col-span-2">
              <ProfileField label="Bio" value={meta.bio || ""} />
            </div>
          </div>
        </div>
      )}

      {tab === "profile" && editing && (
        <div className="w-full max-w-2xl">
          <form onSubmit={(e) => void handleSave(e)} className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <ProfileAvatar user={user} size="xl" urlOverride={avatarPreview} />
              <div className="min-w-0">{photoPicker}</div>
            </div>

            <div className="space-y-3">
              <FormField label="Full name">
                <input
                  className={PROFILE_INPUT}
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  autoComplete="name"
                />
              </FormField>

              <FormField label="Email">
                <input
                  className={`${PROFILE_INPUT} text-neutral-500`}
                  value={form.email}
                  readOnly
                  aria-readonly="true"
                />
              </FormField>

              <FormField label="Phone number">
                <input
                  className={PROFILE_INPUT}
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                  autoComplete="tel"
                />
              </FormField>

              <FormField label="Company">
                <input
                  className={PROFILE_INPUT}
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  placeholder="Enter your company"
                  autoComplete="organization"
                />
              </FormField>

              <FormField label="City">
                <input
                  className={PROFILE_INPUT}
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="Enter your city"
                  autoComplete="address-level2"
                />
              </FormField>

              <FormField label="Date of Birth">
                <div className="relative">
                  <input
                    className={`${PROFILE_INPUT} pr-12`}
                    value={form.dateOfBirth}
                    onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                    placeholder="mm/dd/yyyy"
                    autoComplete="bday"
                  />
                  <Calendar
                    className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                    aria-hidden
                  />
                </div>
              </FormField>

              <FormField label="Bio">
                <textarea
                  className={`${PROFILE_TEXTAREA} min-h-[88px] resize-y`}
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="Tell us about yourself"
                  rows={4}
                />
              </FormField>
            </div>

            <div className="border-t border-neutral-200 pt-5">
              <h3 className={`mb-3 ${accountSectionTitle}`}>
                {hasEmailPassword ? "Change Password" : "Set Password"}
              </h3>
              {!hasEmailPassword && (
                <p className={`mb-3 ${accountCaption}`}>
                  You signed in with Google. Set a password here to also sign in with email.
                </p>
              )}
              <div className="space-y-3">
                {hasEmailPassword && (
                  <FormField label="Current password">
                    <input
                      className={PROFILE_INPUT}
                      type="password"
                      value={form.currentPassword}
                      onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
                      placeholder="Enter current password"
                      autoComplete="current-password"
                    />
                  </FormField>
                )}
                <FormField label="New password">
                  <input
                    className={PROFILE_INPUT}
                    type="password"
                    value={form.newPassword}
                    onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                  />
                </FormField>
                <FormField label="Confirm new password">
                  <input
                    className={PROFILE_INPUT}
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                </FormField>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-full border border-neutral-200 px-6 py-3 text-[15px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`inline-flex items-center justify-center gap-2 rounded-full px-8 py-3 text-[15px] font-semibold text-white disabled:opacity-60 ${CTA_GRADIENT}`}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save changes
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === "payment-admin" && isAdmin && !editing && (
        <div className="overflow-hidden rounded-xl border border-neutral-800">
          <PaymentAdmin />
        </div>
      )}
    </section>
  );
}
