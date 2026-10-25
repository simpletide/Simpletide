import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { normalizeStateCode } from "@/lib/us-states";

export type SavedAddress = {
  id: string;
  firstName: string;
  lastName: string;
  street: string;
  apartment: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
};

export type SavedAddressInput = Omit<SavedAddress, "id" | "isDefault"> & { isDefault?: boolean };

const META_KEY = "saved_addresses";

function storageKey(userId: string): string {
  return `simpletide_saved_addresses_${userId}`;
}

function newId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `addr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function normalize(raw: unknown): SavedAddress | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const street = String(o.street || "").trim();
  const city = String(o.city || "").trim();
  if (!street || !city) return null;

  return {
    id: String(o.id || newId()),
    firstName: String(o.firstName || "").trim(),
    lastName: String(o.lastName || "").trim(),
    street,
    apartment: String(o.apartment || "").trim(),
    city,
    state: normalizeStateCode(String(o.state || "")),
    zipCode: String(o.zipCode || "").trim(),
    country: String(o.country || "US").trim() || "US",
    phone: String(o.phone || "").replace(/\D/g, ""),
    isDefault: Boolean(o.isDefault),
  };
}

function normalizeList(raw: unknown): SavedAddress[] {
  if (!Array.isArray(raw)) return [];
  const out: SavedAddress[] = [];
  for (const item of raw) {
    const addr = normalize(item);
    if (addr) out.push(addr);
  }
  return ensureSingleDefault(out);
}

function ensureSingleDefault(list: SavedAddress[]): SavedAddress[] {
  if (list.length === 0) return list;
  const defaultIdx = list.findIndex((a) => a.isDefault);
  if (defaultIdx === -1) {
    return list.map((a, i) => ({ ...a, isDefault: i === 0 }));
  }
  return list.map((a, i) => ({ ...a, isDefault: i === defaultIdx }));
}

export function formatSavedAddressLines(addr: SavedAddress): string[] {
  const lines: string[] = [];
  const name = `${addr.firstName} ${addr.lastName}`.trim();
  if (name) lines.push(name);
  lines.push(`${addr.street}${addr.apartment ? `, ${addr.apartment}` : ""}`);
  lines.push(`${addr.city}, ${addr.state} ${addr.zipCode}`.trim());
  if (addr.country && addr.country !== "US") lines.push(addr.country);
  if (addr.phone) lines.push(addr.phone);
  return lines;
}

export function emptyAddressInput(): SavedAddressInput {
  return {
    firstName: "",
    lastName: "",
    street: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    phone: "",
  };
}

export function validateAddressInput(input: SavedAddressInput): string | null {
  if (!input.firstName.trim()) return "Please enter your full name.";
  if (!input.street.trim()) return "Street address is required.";
  if (!input.city.trim()) return "City is required.";
  if (!input.state.trim()) return "State is required.";
  if (!input.zipCode.trim()) return "ZIP code is required.";
  if (!input.phone.trim()) return "Phone number is required.";
  return null;
}

export async function loadSavedAddresses(user: User): Promise<SavedAddress[]> {
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const fromMeta = normalizeList(meta?.[META_KEY]);
  if (fromMeta.length > 0) return fromMeta;

  try {
    const raw = localStorage.getItem(storageKey(user.id));
    if (raw) return normalizeList(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return [];
}

export async function persistSavedAddresses(user: User, addresses: SavedAddress[]): Promise<void> {
  const normalized = ensureSingleDefault(addresses);
  try {
    localStorage.setItem(storageKey(user.id), JSON.stringify(normalized));
  } catch {
    /* ignore */
  }

  const { error } = await supabase.auth.updateUser({
    data: { [META_KEY]: normalized },
  });
  if (error) throw error;
}

export function addAddress(list: SavedAddress[], input: SavedAddressInput): SavedAddress[] {
  const addr: SavedAddress = {
    id: newId(),
    ...input,
    state: normalizeStateCode(input.state),
    apartment: input.apartment.trim(),
    phone: input.phone.replace(/\D/g, ""),
    isDefault: list.length === 0 || Boolean(input.isDefault),
  };
  const next = input.isDefault || list.length === 0
    ? [...list.map((a) => ({ ...a, isDefault: false })), addr]
    : [...list, addr];
  return ensureSingleDefault(next);
}

export function updateAddress(
  list: SavedAddress[],
  id: string,
  input: SavedAddressInput,
): SavedAddress[] {
  const next = list.map((a) =>
    a.id === id
      ? {
          ...a,
          ...input,
          state: normalizeStateCode(input.state),
          apartment: input.apartment.trim(),
          phone: input.phone.replace(/\D/g, ""),
        }
      : a,
  );
  return ensureSingleDefault(next);
}

export function removeAddress(list: SavedAddress[], id: string): SavedAddress[] {
  return ensureSingleDefault(list.filter((a) => a.id !== id));
}

export function setDefaultAddress(list: SavedAddress[], id: string): SavedAddress[] {
  return list.map((a) => ({ ...a, isDefault: a.id === id }));
}

/** Checkout-compatible shipping_address object for the default saved address. */
export function toCheckoutShipping(addr: SavedAddress, email: string) {
  return {
    firstName: addr.firstName,
    lastName: addr.lastName,
    street: addr.street,
    apartment: addr.apartment,
    city: addr.city,
    state: addr.state,
    zipCode: addr.zipCode,
    country: addr.country,
    phone: addr.phone,
    email,
  };
}

export async function getDefaultSavedAddress(user: User): Promise<SavedAddress | null> {
  const list = await loadSavedAddresses(user);
  return list.find((a) => a.isDefault) ?? list[0] ?? null;
}
