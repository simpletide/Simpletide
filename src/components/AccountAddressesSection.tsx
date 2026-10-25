import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { ChevronDown, Loader2, MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  addAddress,
  emptyAddressInput,
  formatSavedAddressLines,
  loadSavedAddresses,
  persistSavedAddresses,
  removeAddress,
  setDefaultAddress,
  updateAddress,
  validateAddressInput,
  type SavedAddress,
  type SavedAddressInput,
} from "@/lib/saved-addresses";
import { US_STATES } from "@/lib/us-states";
import {
  ACCOUNT_FONT,
  accountBody,
  accountCaption,
  accountCard,
  accountLabel,
  accountMuted,
  accountSectionSubtitle,
  accountSectionTitle,
  CTA_BUTTON,
  CTA_GRADIENT,
} from "@/lib/account-ui";

type Props = {
  user: User;
};

/** Peptora-style drawer inputs — neutral gray, blue glow on focus */
const DRAWER_INPUT =
  "w-full rounded-xl border border-transparent bg-[#f5f5f5] px-4 py-3.5 text-[15px] leading-snug text-neutral-900 placeholder:text-neutral-400 transition-[box-shadow,border-color] duration-150 focus:border-[#4a85ad] focus:outline-none focus:ring-0 focus:shadow-[0_0_0_3px_rgba(58,120,165,0.16)]";

const DRAWER_FONT = ACCOUNT_FONT;

export function AccountAddressesSection({ user }: Props) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SavedAddressInput>(emptyAddressInput());
  const [fullName, setFullName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setAddresses(await loadSavedAddresses(user));
    } catch {
      toast.error("Could not load your addresses.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setFormError(null);
  };

  useEffect(() => {
    if (!formOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeForm();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [formOpen]);

  const persist = async (next: SavedAddress[]) => {
    setSaving(true);
    try {
      await persistSavedAddresses(user, next);
      setAddresses(next);
    } catch {
      toast.error("Could not save your addresses. Please try again.");
      throw new Error("persist failed");
    } finally {
      setSaving(false);
    }
  };

  const splitFullName = (value: string): Pick<SavedAddressInput, "firstName" | "lastName"> => {
    const trimmed = value.trim();
    if (!trimmed) return { firstName: "", lastName: "" };
    const parts = trimmed.split(/\s+/);
    return {
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" ") || "",
    };
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyAddressInput());
    setFullName("");
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (addr: SavedAddress) => {
    setEditingId(addr.id);
    setForm({
      firstName: addr.firstName,
      lastName: addr.lastName,
      street: addr.street,
      apartment: addr.apartment,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
      country: addr.country,
      phone: addr.phone,
    });
    setFullName(`${addr.firstName} ${addr.lastName}`.trim());
    setFormError(null);
    setFormOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const { firstName, lastName } = splitFullName(fullName);
    const payload: SavedAddressInput = { ...form, firstName, lastName };
    const err = validateAddressInput(payload);
    if (err) {
      setFormError(err);
      return;
    }
    setFormError(null);
    try {
      const next = editingId
        ? updateAddress(addresses, editingId, payload)
        : addAddress(addresses, payload);
      await persist(next);
      toast.success(editingId ? "Address updated." : "Address saved.");
      closeForm();
    } catch {
      /* toast shown in persist */
    }
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm("Remove this address?")) return;
    try {
      await persist(removeAddress(addresses, id));
      toast.success("Address removed.");
      if (editingId === id) closeForm();
    } catch {
      /* toast shown in persist */
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await persist(setDefaultAddress(addresses, id));
      toast.success("Default address updated.");
    } catch {
      /* toast shown in persist */
    }
  };

  const patchForm = (patch: Partial<SavedAddressInput>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className={accountSectionTitle}>My Addresses</h2>
          <p className={accountSectionSubtitle}>Manage your shipping and billing addresses.</p>
        </div>
        <button type="button" onClick={openAdd} disabled={saving} className={CTA_BUTTON}>
          Add new address <Plus className="h-4 w-4" />
        </button>
      </div>

      {formOpen && (
        <AddressFormDrawer
          title={editingId ? "Edit Address" : "Add New Address"}
          fullName={fullName}
          setFullName={setFullName}
          form={form}
          patchForm={patchForm}
          formError={formError}
          saving={saving}
          onClose={closeForm}
          onSubmit={handleSubmit}
          submitLabel="Save address"
        />
      )}

      <div className={accountCard}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#7c3aed]" />
            <p className={accountMuted}>Loading addresses…</p>
          </div>
        ) : addresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <MapPin className="mb-4 h-10 w-10 text-neutral-300" strokeWidth={1.5} />
            <h3 className={accountSectionTitle}>No addresses saved</h3>
            <p className={`mt-2 max-w-sm ${accountMuted}`}>
              Add a shipping address to speed up checkout.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {addresses.map((addr) => (
              <li key={addr.id} className="p-5 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className={`min-w-0 leading-relaxed ${accountBody}`}>
                    {addr.isDefault && (
                      <span className="mb-2 inline-block rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#7c3aed]">
                        Default
                      </span>
                    )}
                    {formatSavedAddressLines(addr).map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {!addr.isDefault && (
                      <button
                        type="button"
                        onClick={() => void handleSetDefault(addr.id)}
                        disabled={saving}
                        className={`rounded-lg border border-neutral-200 px-3 py-1.5 ${accountCaption} font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60`}
                      >
                        Set as default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEdit(addr)}
                      disabled={saving}
                      className={`inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 ${accountCaption} font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRemove(addr.id)}
                      disabled={saving}
                      className={`inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 ${accountCaption} font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function AddressFormDrawer({
  title,
  fullName,
  setFullName,
  form,
  patchForm,
  formError,
  saving,
  onClose,
  onSubmit,
  submitLabel,
}: {
  title: string;
  fullName: string;
  setFullName: (v: string) => void;
  form: SavedAddressInput;
  patchForm: (patch: Partial<SavedAddressInput>) => void;
  formError: string | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  submitLabel: string;
}) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <>
      {/* Backdrop — same pattern as cart drawer */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[70] cursor-pointer bg-black/50 transition-opacity duration-300 ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden={false}
      />

      {/* Right-side drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-drawer-title"
        style={{ fontFamily: DRAWER_FONT }}
        className={`fixed top-0 right-0 z-[71] flex h-full w-full max-w-full flex-col bg-white text-neutral-900 shadow-2xl transition-transform duration-300 ease-out sm:w-[min(100%,540px)] ${
          entered ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-8 py-6">
          <h3 id="address-drawer-title" className={accountSectionTitle}>
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable form */}
        <form
          id="address-form"
          onSubmit={(e) => void onSubmit(e)}
          className="flex-1 space-y-6 overflow-y-auto px-8 py-8"
        >
          <DrawerField label="Full name" id="addr-full-name">
            <input
              id="addr-full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={DRAWER_INPUT}
              placeholder="Enter your full name"
              autoComplete="name"
            />
          </DrawerField>

          <DrawerField label="Phone number" id="addr-phone">
            <input
              id="addr-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => patchForm({ phone: e.target.value })}
              className={DRAWER_INPUT}
              placeholder="Enter your phone number"
              autoComplete="tel"
            />
          </DrawerField>

          <DrawerField label="Address #01" id="addr-street">
            <input
              id="addr-street"
              value={form.street}
              onChange={(e) => patchForm({ street: e.target.value })}
              className={DRAWER_INPUT}
              placeholder="Street address"
              autoComplete="address-line1"
            />
          </DrawerField>

          <DrawerField label="Address #02" id="addr-apt">
            <input
              id="addr-apt"
              value={form.apartment}
              onChange={(e) => patchForm({ apartment: e.target.value })}
              className={DRAWER_INPUT}
              placeholder="Apartment, suite, etc. (optional)"
              autoComplete="address-line2"
            />
          </DrawerField>

          <DrawerField label="City" id="addr-city">
            <input
              id="addr-city"
              value={form.city}
              onChange={(e) => patchForm({ city: e.target.value })}
              className={DRAWER_INPUT}
              placeholder="Enter your city"
              autoComplete="address-level2"
            />
          </DrawerField>

          <DrawerField label="State" id="addr-state">
            <div className="relative">
              <select
                id="addr-state"
                value={form.state}
                onChange={(e) => patchForm({ state: e.target.value })}
                className={`${DRAWER_INPUT} appearance-none pr-10`}
                autoComplete="address-level1"
              >
                <option value="">Select state</option>
                {US_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
            </div>
          </DrawerField>

          <DrawerField label="Postal Code" id="addr-zip">
            <input
              id="addr-zip"
              value={form.zipCode}
              onChange={(e) => patchForm({ zipCode: e.target.value })}
              className={DRAWER_INPUT}
              placeholder="Enter postal code"
              autoComplete="postal-code"
            />
          </DrawerField>

          <DrawerField label="Country" id="addr-country">
            <div className="relative">
              <select
                id="addr-country"
                value={form.country}
                onChange={(e) => patchForm({ country: e.target.value })}
                className={`${DRAWER_INPUT} appearance-none pr-10`}
                autoComplete="country"
              >
                <option value="US">United States</option>
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
            </div>
          </DrawerField>

          {formError && <p className="text-[13px] font-medium text-red-600">{formError}</p>}
        </form>

        {/* Sticky footer */}
        <div className="flex shrink-0 gap-4 border-t border-neutral-200 bg-white px-8 py-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full bg-[#f5f5f5] py-3.5 text-[15px] font-semibold text-neutral-800 transition-colors hover:bg-[#ebebeb]"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="address-form"
            disabled={saving}
            className={`flex-1 rounded-full py-3.5 text-[15px] font-semibold ${CTA_GRADIENT}`}
          >
            {saving ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : submitLabel}
          </button>
        </div>
      </aside>
    </>
  );
}

function DrawerField({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className={`mb-2.5 block ${accountLabel}`}>{label}</span>
      {children}
    </label>
  );
}
