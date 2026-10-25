// Shared product-image + variant helpers for the cart drawer so
// both render the exact same vial imagery, sizing, and variant labels.
import { slugFor, getProductBySlug, GLOW_VIAL_IMAGE } from "@/lib/catalog";
import { vialImageForProduct } from "@/lib/product-vial-variants";

import vialGlp3Rt from "@/assets/vial-glp3-rt.png.asset.json";
import vialGlp2Tz from "@/assets/glp-2-tz-new.png.asset.json";
import vialTesamorelin from "@/assets/vial-tesamorelin.png.asset.json";
import vialGhkCu from "@/assets/vial-ghk-cu.png.asset.json";
import vialKlow from "@/assets/vial-klow.png.asset.json";
import vialWolverine from "@/assets/vial-wolverine.png.asset.json";
import vialCjcIpa from "@/assets/vial-cjc-ipa.png.asset.json";
import vialNad from "@/assets/nad-v2.png.asset.json";
import vialMt1 from "@/assets/mt1-v2.png.asset.json";
import vialMt2 from "@/assets/mt2-v2.png.asset.json";
import vialKlow80 from "@/assets/klow-v2.png.asset.json";
import vialAdamax10 from "@/assets/adamax-v2.png.asset.json";
import vialGlp3Rt5 from "@/assets/glp3rt-v2.png.asset.json";
import vialTesamorelin10 from "@/assets/tesa-v2.png.asset.json";
import vialMotsC10 from "@/assets/motsc-v2.png.asset.json";
import vialGlutathione500 from "@/assets/glutathione-v2.png.asset.json";
import vialBacWater10ml from "@/assets/bac-water-10ml-v2.png.asset.json";
import vialCjcIpa20 from "@/assets/cjc-ipa-v2.png.asset.json";

// Map cart item base names → product imagery so items render with a thumbnail.
const PRODUCT_IMAGES: Record<string, string> = {
  "GLP-3 RT (RETA)": vialGlp3Rt5.url,
  "GLP-3 RT": vialGlp3Rt.url,
  "GLP-2 TZ": vialGlp2Tz.url,
  "TESAMORELIN": vialTesamorelin10.url,
  "TESAMORELIN ": vialTesamorelin.url,
  "MOTS-C": vialMotsC10.url,
  "GHK-CU": vialGhkCu.url,
  "GLOW": GLOW_VIAL_IMAGE,
  "GLOW (GHK-CU 50MG, TB-500 10MG, BPC-157 10MG)": GLOW_VIAL_IMAGE,
  "KLOW (GHK-CU 80MG, TB-500 10MG, BPC-157 10MG, KPV 10MG)": vialKlow80.url,
  "KLOW": vialKlow.url,
  "ADAMAX": vialAdamax10.url,
  "GLUTATHIONE": vialGlutathione500.url,
  "BAC WATER": vialBacWater10ml.url,
  "CJC-1295 + Ipamorelin": vialCjcIpa20.url,
  "CJC-1295 + IPAMORELIN": vialCjcIpa.url,
  "NAD+": vialNad.url,
  "MT1": vialMt1.url,
  "MELANOTAN 2": vialMt2.url,
  "WOLVERINE (BPC-157 5MG, TB-500 5MG)": vialWolverine.url,
};

// Resolve a product's transparent PNG hero vial (variant-aware when mg size is known).
export function imageForTitle(title: string, variant?: string | null): string | null {
  return vialImageForProduct(title, variant) ?? PRODUCT_IMAGES[title] ?? null;
}

// Fallback size/strength for single-option products that were added without an
// explicit variant, so the mg pill always shows in the drawer.
export function sizeForTitle(title: string): string | null {
  const slug = slugFor(title);
  return (slug ? getProductBySlug(slug)?.variants?.[0]?.size : undefined) ?? null;
}

// "10mg" → "10 mg", "10ML" → "10 ml" (Peptora-style spacing + lowercase unit)
export function formatVariant(v: string): string {
  return v.replace(/(\d)\s*([a-zA-Z]+)/g, (_, n: string, unit: string) =>
    /^(mg|ml|mcg|iu)$/i.test(unit) ? `${n} ${unit.toLowerCase()}` : `${n} ${unit}`,
  );
}

export function splitNameVariant(name: string): { title: string; variant: string | null } {
  // BAC Water (3 ml) → title "BAC WATER", variant "3 ml"
  const bacMatch = name.match(/^BAC Water \(([^)]+)\)$/i);
  if (bacMatch) {
    return { title: "BAC WATER", variant: bacMatch[1] };
  }
  // "Name - 60mg" → split
  const dashIdx = name.lastIndexOf(" - ");
  if (dashIdx > -1) {
    const title = name.slice(0, dashIdx);
    const variant = name.slice(dashIdx + 3);
    return { title, variant };
  }
  return { title: name, variant: null };
}
