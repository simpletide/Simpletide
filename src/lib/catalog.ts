import vialGlp3Rt from "@/assets/reta1.png.asset.json";
const glp3RtHero10 = "/images/cards/glp-3-rt.jpg";
import vialGlp2Tz from "@/assets/glp-2-tz-new.png.asset.json";
const glp2TzHero10 = "/images/cards/glp-2-tz.jpg";
import vialTesamorelin from "@/assets/vial-tesamorelin.png.asset.json";
import vialMotsC from "@/assets/vial-mots-c.png.asset.json";
const motsCHero10 = "/images/cards/mots-c.jpg";
import vialGhkCu from "@/assets/vial-ghk-cu.png.asset.json";
const ghkCuHero50 = "/images/hero-vials/simpletide-selank-10mg.png";
const dsipHero5 = "/images/hero-vials/simpletide-bpc157-10mg.png";
import vialKlow from "@/assets/vial-klow.png.asset.json";
import vialWolverine from "@/assets/vial-wolverine.png.asset.json";
const wolverineHero10 = "/images/cards/wolverine.jpg";
import vialCjcIpa from "@/assets/vial-cjc-ipa.png.asset.json";
const cjcIpaHero10 = "/images/cards/cjc-1295-ipamorelin.jpg";
import vialNad from "@/assets/vial-nad-plus.png.asset.json";
const nadPlusHero500 = "/images/hero-vials/simpletide-selank-semax-20mg.png";
import vialMt1 from "@/assets/mt1-v2.png.asset.json";
import vialMt2 from "@/assets/mt2-v2.png.asset.json";
import vialAdamax from "@/assets/adamax-v2.png.asset.json";
import vialGlutathione from "@/assets/glutathione-v2.png.asset.json";
import vialBacWater from "@/assets/bac-water-10ml-v2.png.asset.json";

export const GLOW_VIAL_IMAGE = "/images/hero-vials/simpletide-selank-semax-20mg.png";

/**
 * Tightly cropped transparent vial thumbnails (public/images/vial-thumbs),
 * all generated with one shared crop so every vial renders at the same scale.
 */
const VIAL_THUMBS: Record<string, string> = {
  "glp-3-rt": "simpletide_glp3_rt_10mg_transparent",
  "glp-2-tz": "simpletide_glp2_tz_10mg_transparent",
  "glp-1-sm": "simpletide_glp1_sm_10mg_transparent",
  "ghk-cu": "simpletide_ghk_cu_50mg_transparent",
  "ahk-cu": "simpletide_ahk_cu_50mg_transparent",
  "mots-c": "simpletide_mots_c_10mg_transparent",
  "cjc-1295-ipamorelin": "simpletide_cjc1295_ipamorelin_10mg_transparent",
  wolverine: "simpletide_wolverine_10mg_transparent",
  "nad-plus": "simpletide_nad_plus_500mg_transparent",
  tesamorelin: "simpletide_tesamorelin_10mg_transparent",
  klow: "simpletide_klow_80mg_transparent",
  glow: "simpletide_glow_70mg_transparent",
  adamax: "simpletide_adamax_10mg_transparent",
  glutathione: "simpletide_glutathione_1500mg_transparent",
  mt1: "simpletide_mt1_10mg_transparent",
  "melanotan-2": "simpletide_mt2_10mg_transparent",
  dsip: "simpletide_dsip_10mg_transparent",
  "ara-290": "simpletide_ara_290_10mg_transparent",
  "5-amino-1mq": "simpletide_5_amino_1mq_5mg_transparent",
  kpv: "simpletide_kpv_10mg_transparent",
  "kpv-ghk-cu": "simpletide_kpv_ghk_cu_60mg_transparent",
  "bac-water": "simpletide_bac_water_10ml_transparent",
  sermorelin: "simpletide_sermorelin_10mg_transparent",
  kisspeptin: "simpletide_kisspeptin_10mg_transparent",
  "pt-141": "simpletide_pt_141_10mg_transparent",
  "thymosin-alpha-1": "simpletide_thymosin_alpha_1_10mg_transparent",
  epithalon: "simpletide_epithalon_10mg_transparent",
  semax: "simpletide_semax_10mg_transparent",
  selank: "simpletide_selank_10mg_glp3_matched",
  "selank-semax": "simpletide_selank_semax_20mg_glp3_matched",
  "ss-31": "simpletide_ss31_10mg_transparent",
  "ss-31-mots-c": "simpletide_ss31_mots_c_40mg_transparent",
  "bpc-157": "simpletide_bpc157_10mg_transparent",
  "tb-500": "simpletide_tb500_10mg_transparent",
  ipamorelin: "simpletide_ipamorelin_10mg_transparent",
  "igf1-lr3": "simpletide_igf1_lr3_1mg_transparent",
  cagrilintide: "simpletide_cagrilintide_10mg_glp3_matched",
  elora: "simpletide_elora_10mg_transparent",
  "snap-8": "simpletide_snap8_10mg_transparent",
  vip: "simpletide_vip_10mg_transparent",
};

export function vialThumbFor(slug: string): string | null {
  const file = VIAL_THUMBS[slug];
  return file ? `/images/vial-thumbs/${file}.webp` : null;
}

export type CatalogVariant = {
  size: string;
  price: number;
  originalPrice?: number;
  lot: string;
  purity: string;
  testDate: string;
};

/**
 * A multi-unit "bundle" discount tier. Generic + data-driven so the same
 * product template can offer bundle pricing across the whole catalog.
 * `minQty` is the number of vials the tier represents (and the quantity a
 * card click snaps to); `discountPct` is applied to the per-unit price.
 */
export type BundleTier = {
  id: string;
  label: string;
  minQty: number;
  discountPct: number;
  badge?: string;
  /** When true, this tier is the default selection (e.g. "best value"). */
  highlight?: boolean;
};

/** Default bundle tiers shared by every product unless overridden per-product. */
export const BUNDLE_TIERS: BundleTier[] = [
  { id: "duo", label: "2 Vials", minQty: 2, discountPct: 5 },
  { id: "trio", label: "3 Vials", minQty: 3, discountPct: 7 },
  { id: "quad", label: "5+ Vials", minQty: 5, discountPct: 10, badge: "BEST VALUE", highlight: true },
];

/** A single bullet in a description section: a primary line + optional sub-note. */
export type DescriptionItem = { text: string; note?: string };
/** A stacked description block: a bold heading followed by bulleted items. */
export type DescriptionSection = { heading: string; items: DescriptionItem[] };

export type CatalogProduct = {
  slug: string;
  name: string;
  title: string;
  tagline: string;
  /** Short descriptor shown under the title on the product hero (Peptora-style). */
  subtitle?: string;
  category: string;
  image: string;
  /** Optional transparent "floating" image used on the product detail hero. */
  heroImage?: string;
  badge?: "BEST SELLING!" | "SALE!" | null;
  variants: CatalogVariant[];
  /** Optional per-product bundle tiers; falls back to BUNDLE_TIERS. */
  bundleTiers?: BundleTier[];
  description: string;
  researchNotes: string;
  storage: string;
  /**
   * Stacked, compound-specific "Product Description" content (Peptora-style).
   * Unique per product; rendered as bold headings with bulleted items.
   */
  descriptionSections?: DescriptionSection[];
  /**
   * For bundle/blend products: a short, comma-separated list of the peptides
   * included (e.g. "GHK-Cu 100mg, GLP-3 RT 30mg, MT2 10mg"). When set, the
   * product hero shows "Includes: …" instead of the "Size:" line.
   */
  bundleContents?: string;
};

/**
 * Per-product Certificate of Analysis image(s), served statically from
 * `public/images/coa/`. A single string applies to every variant size; a
 * record maps a specific variant size to its own size-specific COA scan.
 * Empty until Simpletide batch certificates are available.
 */
const PRODUCT_COAS: Record<string, string | Record<string, string>> = {};

/** True when a product has at least one COA scan available. */
export function hasCoa(slug: string): boolean {
  return slug in PRODUCT_COAS;
}

/**
 * Resolve the *real* COA scan URL for a specific product variant. A variant
 * only counts as having a genuine certificate when:
 *   - the product maps that exact size to a scan (record form), or
 *   - the product has a single product-wide scan (string form) AND this is the
 *     primary variant (index 0).
 *
 * Every other variant returns `null` so the product page can render a matching
 * "placeholder" COA card (styled the same, but its preview button does nothing)
 * instead of duplicating another size's scan. `null` is also returned for
 * products that have no COA on file yet.
 */
export function coaUrlForVariant(
  slug: string,
  size: string,
  index = 0,
): string | null {
  const entry = PRODUCT_COAS[slug];
  if (!entry) return null;
  if (typeof entry === "string") return index === 0 ? entry : null;
  return entry[size] ?? null;
}

/**
 * Standard, compound-agnostic "tail" sections shared by single-vial research
 * peptides (Research Use Notes / Storage / Handling). The compound-specific
 * lead section is supplied per product in REAL_DESCRIPTIONS.
 */
function stdTail(lightSensitive = false): DescriptionSection[] {
  return [
    {
      heading: "Research Use Notes",
      items: [
        { text: "Supplied as lyophilized powder", note: "Requires reconstitution before use" },
        { text: "Bacteriostatic water required for mixing (sold separately)", note: "Swirl gently, never shake" },
        { text: "Allow powder to fully dissolve before drawing" },
      ],
    },
    {
      heading: "Storage",
      items: [
        {
          text: lightSensitive
            ? "Store lyophilized vial frozen and protected from light"
            : "Store lyophilized vial frozen for long-term holding",
        },
        { text: "Keep reconstituted solution at 2 to 8°C", note: "Protect from light and heat" },
      ],
    },
    {
      heading: "Handling",
      items: [
        { text: "Maintain sterile technique throughout reconstitution", note: "For laboratory research use only" },
        { text: "Avoid repeated freeze-thaw cycles to preserve integrity" },
      ],
    },
  ];
}

/**
 * Compound-specific "Product Description" copy for single-vial research
 * peptides that would otherwise fall back to placeholder text. Keyed by slug;
 * `description` is the short blurb shown while the accordion is collapsed, and
 * `descriptionSections` render the expanded, bulleted detail. Each entry leads
 * with an accurate, compound-specific section, then reuses stdTail().
 */
const REAL_DESCRIPTIONS: Record<string, { description: string; descriptionSections: DescriptionSection[] }> = {
  "ara-290": {
    description:
      "ARA-290 (cibinetide) is an 11–amino acid peptide modeled on the tissue-protective region of erythropoietin, studied for anti-inflammatory and tissue-repair signaling without stimulating red blood cell production.",
    descriptionSections: [
      {
        heading: "ARA-290 (Cibinetide)",
        items: [
          { text: "11-amino-acid peptide based on the helix-B surface region of erythropoietin (EPO)", note: "Non-hematopoietic — does not raise red blood cell counts" },
          { text: "Selectively activates the innate repair receptor (EPOR / CD131 heterodimer)", note: "Studied for anti-inflammatory and tissue-protective signaling" },
          { text: "Referenced in neuropathic-pain and small-fiber-neuropathy research models" },
        ],
      },
      ...stdTail(),
    ],
  },
  "5-amino-1mq": {
    description:
      "5 Amino-1MQ is a small-molecule NNMT inhibitor studied in adipocyte and metabolic research for its effects on cellular NAD+ levels and energy metabolism.",
    descriptionSections: [
      {
        heading: "5-Amino-1MQ",
        items: [
          { text: "Small-molecule inhibitor of nicotinamide N-methyltransferase (NNMT)", note: "A research compound rather than a peptide" },
          { text: "Studied for effects on cellular NAD+ levels and energy metabolism", note: "Referenced in fat-cell and metabolic models" },
          { text: "Investigated for its role in lipid and adipocyte research" },
        ],
      },
      ...stdTail(),
    ],
  },
  "kpv": {
    description:
      "KPV is a tripeptide (Lys-Pro-Val) derived from the C-terminus of alpha-MSH, studied for anti-inflammatory signaling in laboratory research.",
    descriptionSections: [
      {
        heading: "KPV (Lysine-Proline-Valine)",
        items: [
          { text: "C-terminal tripeptide fragment of alpha-melanocyte-stimulating hormone (α-MSH)", note: "Retains the anti-inflammatory core of α-MSH" },
          { text: "Studied for modulation of inflammatory signaling pathways", note: "Investigated in gut and skin research models" },
          { text: "Small, stable sequence frequently studied alongside repair peptides" },
        ],
      },
      ...stdTail(),
    ],
  },
  "semax": {
    description:
      "Semax is a synthetic ACTH(4-10) analog (Met-Glu-His-Phe-Pro-Gly-Pro) studied for neuroprotective and cognitive-signaling effects in research models.",
    descriptionSections: [
      {
        heading: "Semax (ACTH 4-10 Analog)",
        items: [
          { text: "Synthetic heptapeptide analog of the ACTH(4-10) fragment (MEHFPGP)", note: "Developed within Russian neuropeptide research" },
          { text: "Studied for neuroprotective and nootropic signaling", note: "Investigated for BDNF and NGF expression in models" },
          { text: "Referenced in cognition and cerebral-ischemia research" },
        ],
      },
      ...stdTail(),
    ],
  },
  "selank": {
    description:
      "Selank is a synthetic analog of the immunopeptide tuftsin, studied for anxiolytic and neuromodulatory signaling in research settings.",
    descriptionSections: [
      {
        heading: "Selank (Tuftsin Analog)",
        items: [
          { text: "Synthetic heptapeptide analog of the endogenous immunopeptide tuftsin", note: "Developed within Russian neuropeptide research" },
          { text: "Studied for anxiolytic and neuromodulatory effects", note: "Investigated for GABAergic and BDNF-related signaling" },
          { text: "Referenced in stress and cognition research models" },
        ],
      },
      ...stdTail(),
    ],
  },
  "ss-31": {
    description:
      "SS-31 (elamipretide) is a mitochondria-targeting tetrapeptide that binds cardiolipin on the inner mitochondrial membrane, studied for mitochondrial-function research.",
    descriptionSections: [
      {
        heading: "SS-31 (Elamipretide)",
        items: [
          { text: "Mitochondria-targeting tetrapeptide that concentrates at the inner mitochondrial membrane", note: "Binds the phospholipid cardiolipin" },
          { text: "Studied for support of mitochondrial structure and bioenergetics", note: "Investigated for reduction of reactive oxygen species" },
          { text: "Referenced in cellular-energy and age-related research models" },
        ],
      },
      ...stdTail(),
    ],
  },
  "ll-37": {
    description:
      "LL-37 is the only human cathelicidin-derived antimicrobial peptide, studied for innate-immune, antimicrobial, and wound-healing signaling in research.",
    descriptionSections: [
      {
        heading: "LL-37 (Cathelicidin)",
        items: [
          { text: "37-residue human cathelicidin-derived antimicrobial peptide", note: "A component of the innate immune system" },
          { text: "Studied for broad antimicrobial and immunomodulatory activity", note: "Investigated for membrane-disruption and host-defense roles" },
          { text: "Referenced in wound-healing and inflammation research models" },
        ],
      },
      ...stdTail(),
    ],
  },
  "bpc-157": {
    description:
      "BPC-157 is a stable pentadecapeptide derived from a gastric protective protein, widely studied for tissue-repair and angiogenesis signaling in research models.",
    descriptionSections: [
      {
        heading: "BPC-157 (Body Protection Compound)",
        items: [
          { text: "Stable 15-amino-acid sequence derived from a gastric protective protein", note: "Often referred to as \"body protection compound\"" },
          { text: "Studied for tissue-repair, tendon, and angiogenesis signaling", note: "Investigated for cytoprotective effects in models" },
          { text: "Referenced widely in gut and connective-tissue research" },
        ],
      },
      ...stdTail(),
    ],
  },
  "tb-500": {
    description:
      "TB-500 is a synthetic fragment of Thymosin Beta-4 studied for actin regulation, cell migration, and tissue-repair research.",
    descriptionSections: [
      {
        heading: "TB-500 (Thymosin Beta-4 Fragment)",
        items: [
          { text: "Synthetic peptide based on the active region of Thymosin Beta-4", note: "Interacts with the cytoskeletal protein actin" },
          { text: "Studied for cell migration, angiogenesis, and tissue repair", note: "Investigated for flexibility and recovery in models" },
          { text: "Frequently paired with BPC-157 in tissue-repair research" },
        ],
      },
      ...stdTail(),
    ],
  },
  "sermorelin": {
    description:
      "Sermorelin is a GHRH(1-29) analog studied as a growth-hormone secretagogue that stimulates endogenous growth-hormone release in research models.",
    descriptionSections: [
      {
        heading: "Sermorelin (GHRH 1-29)",
        items: [
          { text: "Synthetic analog of the first 29 residues of growth-hormone-releasing hormone", note: "The biologically active core of GHRH" },
          { text: "Studied for stimulation of endogenous growth-hormone release", note: "Acts on pituitary GHRH receptors in models" },
          { text: "Referenced in growth-hormone-axis research" },
        ],
      },
      ...stdTail(),
    ],
  },
  "ipamorelin": {
    description:
      "Ipamorelin is a selective pentapeptide growth-hormone secretagogue (ghrelin-receptor agonist) studied for clean, targeted growth-hormone release.",
    descriptionSections: [
      {
        heading: "Ipamorelin",
        items: [
          { text: "Selective pentapeptide growth-hormone secretagogue", note: "Acts as a ghrelin / GHS-R receptor agonist" },
          { text: "Studied for targeted growth-hormone release", note: "Investigated for minimal effect on cortisol and prolactin" },
          { text: "Commonly paired with GHRH analogs such as CJC-1295 in research" },
        ],
      },
      ...stdTail(),
    ],
  },
  "igf1-lr3": {
    description:
      "IGF1-LR3 is a long-acting 83–amino acid analog of insulin-like growth factor 1, studied for IGF-1 receptor signaling, cell growth, and proliferation in research.",
    descriptionSections: [
      {
        heading: "IGF1-LR3 (Long R3 IGF-1)",
        items: [
          { text: "83-amino-acid analog of insulin-like growth factor 1 (IGF-1)", note: "Arg3 substitution plus an N-terminal extension" },
          { text: "Studied for IGF-1 receptor signaling, cell growth, and proliferation", note: "Reduced binding to IGF binding proteins extends activity" },
          { text: "Longer-acting profile than native IGF-1 in research models" },
        ],
      },
      ...stdTail(),
    ],
  },
  "cagrilintide": {
    description:
      "Cagrilintide is a long-acting amylin analog studied for appetite regulation and metabolic signaling in research models.",
    descriptionSections: [
      {
        heading: "Cagrilintide",
        items: [
          { text: "Long-acting synthetic analog of the hormone amylin", note: "Engages amylin and calcitonin receptors" },
          { text: "Studied for appetite regulation and satiety signaling", note: "Investigated alongside incretin peptides in metabolic models" },
          { text: "Designed for an extended, once-weekly research profile" },
        ],
      },
      ...stdTail(),
    ],
  },
  "hcg": {
    description:
      "HCG (human chorionic gonadotropin) is a glycoprotein hormone studied for luteinizing-hormone-like signaling on the reproductive axis in research.",
    descriptionSections: [
      {
        heading: "HCG (Human Chorionic Gonadotropin)",
        items: [
          { text: "Glycoprotein hormone that mimics luteinizing hormone (LH)", note: "Acts on LH / HCG receptors in research models" },
          { text: "Studied for stimulation of gonadal steroidogenesis", note: "Investigated within hypothalamic-pituitary-gonadal axis research" },
          { text: "Supplied and measured by international units (IU) of activity" },
        ],
      },
      ...stdTail(),
    ],
  },
  "epithalon": {
    description:
      "Epithalon is a synthetic tetrapeptide (Ala-Glu-Asp-Gly) modeled on the pineal peptide epithalamin, studied for telomerase and cellular-aging signaling in research.",
    descriptionSections: [
      {
        heading: "Epithalon (Epitalon)",
        items: [
          { text: "Synthetic tetrapeptide (Ala-Glu-Asp-Gly) based on the pineal peptide epithalamin", note: "Developed within Russian gerontology research" },
          { text: "Studied for telomerase activation and cellular aging", note: "Investigated for circadian and antioxidant signaling" },
          { text: "Referenced in longevity and pineal-function research models" },
        ],
      },
      ...stdTail(true),
    ],
  },
  "kisspeptin": {
    description:
      "Kisspeptin is a neuropeptide product of the KISS1 gene that signals through KISS1R (GPR54), studied as an upstream regulator of the reproductive hormone axis.",
    descriptionSections: [
      {
        heading: "Kisspeptin (KISS1 / GPR54)",
        items: [
          { text: "Neuropeptide encoded by the KISS1 gene", note: "Signals through the KISS1R (GPR54) receptor" },
          { text: "Studied as an upstream trigger of GnRH and the reproductive axis", note: "Investigated for regulation of LH and FSH release" },
          { text: "Referenced in fertility and puberty research models" },
        ],
      },
      ...stdTail(),
    ],
  },
  "pt-141": {
    description:
      "PT-141 (bremelanotide) is a melanocortin-receptor agonist derived from Melanotan II, studied for centrally mediated sexual-function signaling in research.",
    descriptionSections: [
      {
        heading: "PT-141 (Bremelanotide)",
        items: [
          { text: "Cyclic melanocortin-receptor agonist derived from Melanotan II", note: "Acts mainly on the MC4R / MC3R receptors" },
          { text: "Studied for centrally mediated sexual-function signaling", note: "Acts through the nervous system rather than the vasculature" },
          { text: "Referenced in libido and arousal research models" },
        ],
      },
      ...stdTail(),
    ],
  },
  "thymosin-alpha-1": {
    description:
      "Thymosin Alpha-1 is a 28–amino acid immune-modulating peptide studied for T-cell function and immune-regulation research.",
    descriptionSections: [
      {
        heading: "Thymosin Alpha-1 (Tα1)",
        items: [
          { text: "28-amino-acid peptide originally isolated from the thymus", note: "A key modulator of immune signaling" },
          { text: "Studied for enhancement of T-cell maturation and function", note: "Investigated in immune-regulation and antiviral models" },
          { text: "Referenced in immunology and host-defense research" },
        ],
      },
      ...stdTail(),
    ],
  },
  "cjc-1295-with-dac": {
    description:
      "CJC-1295 With Dac is a long-acting GHRH analog whose Drug Affinity Complex binds serum albumin to extend half-life, studied for sustained growth-hormone-axis signaling.",
    descriptionSections: [
      {
        heading: "CJC-1295 with DAC",
        items: [
          { text: "Synthetic growth-hormone-releasing hormone (GHRH) analog", note: "Includes a Drug Affinity Complex (DAC)" },
          { text: "DAC binds serum albumin to greatly extend half-life", note: "Studied for sustained growth-hormone release" },
          { text: "Longer-acting profile than GHRH analogs without DAC" },
        ],
      },
      ...stdTail(),
    ],
  },
  "cjc-1295-no-dac": {
    description:
      "CJC-1295 No Dac (Mod GRF 1-29) is a short-acting GHRH analog studied for pulsatile growth-hormone release, often paired with a GH secretagogue.",
    descriptionSections: [
      {
        heading: "CJC-1295 No DAC (Mod GRF 1-29)",
        items: [
          { text: "Modified GHRH(1-29) analog without the Drug Affinity Complex", note: "Short-acting growth-hormone-releasing peptide" },
          { text: "Studied for pulsatile, near-physiologic growth-hormone release", note: "Acts on pituitary GHRH receptors in models" },
          { text: "Frequently paired with ipamorelin in research protocols" },
        ],
      },
      ...stdTail(),
    ],
  },
  "aod-9604": {
    description:
      "AOD-9604 is a synthetic fragment of human growth hormone (residues 176-191) studied for fat-metabolism and lipolysis signaling without the growth effects of full GH.",
    descriptionSections: [
      {
        heading: "AOD-9604 (HGH Fragment 176-191)",
        items: [
          { text: "Synthetic peptide based on the C-terminal 176-191 region of human growth hormone", note: "Retains the fat-metabolism domain only" },
          { text: "Studied for lipolysis and fat-metabolism signaling", note: "Investigated without the growth or insulin effects of full GH" },
          { text: "Referenced in metabolic and adipose-tissue research models" },
        ],
      },
      ...stdTail(),
    ],
  },
};

/**
 * Placeholder catalog entry for products awaiting full pricing. Each one uses
 * its transparent png-folder vial (public/images/cards/<slug>.jpg) on the detail
 * hero and the shop composite for the card image. When a slug has researched
 * copy in REAL_DESCRIPTIONS, that text is applied; otherwise a generic blurb is
 * used until copy is written.
 */
function ph(
  slug: string,
  name: string,
  category: string,
  size = "10mg",
  price = 0,
): CatalogProduct {
  const lot = "ST-" + slug.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5) + "-001";
  const real = REAL_DESCRIPTIONS[slug];
  return {
    slug,
    name,
    title: name,
    tagline: "Research-grade compound.",
    category,
    image: `/images/cards/${slug}.jpg`,
    heroImage: `/images/cards/${slug}.jpg`,
    variants: [{ size, price, lot, purity: "99%+", testDate: "2026-03-01" }],
    description:
      real?.description ??
      `${name} supplied as a high-purity research compound for laboratory use. Full product details coming soon.`,
    researchNotes:
      "Reconstitute with sterile bacteriostatic water using sterile technique. For laboratory research use only.",
    storage:
      "Store lyophilized at 2-8°C, protected from light. Refrigerate after reconstitution.",
    descriptionSections: real?.descriptionSections,
  };
}

const ALL_PRODUCTS: CatalogProduct[] = [
  {
    slug: "glp-3-rt",
    name: "GLP-3 RT (RETA)",
    title: "GLP-3 RT",
    tagline: "Next-generation metabolic research compound.",
    subtitle: "Triple Agonist Research Peptide",
    category: "Compounds",
    image: vialGlp3Rt.url,
    heroImage: glp3RtHero10,
    badge: "BEST SELLING!",
    variants: [
      { size: "10mg", price: 65, lot: "ST-G3-1024A", purity: "99.21%", testDate: "2026-02-14" },
      { size: "20mg", price: 120, lot: "ST-G3-1024B", purity: "99.34%", testDate: "2026-02-14" },
      { size: "30mg", price: 150, lot: "ST-G3-1024C", purity: "99.18%", testDate: "2026-02-14" },
      { size: "60mg", price: 240, lot: "ST-G3-1024D", purity: "99.27%", testDate: "2026-02-14" },
    ],
    description:
      "GLP-3 RT (RETA) is a high-purity research-grade peptide manufactured for advanced metabolic and receptor signaling studies. Synthesized under tightly controlled laboratory conditions for batch-level consistency.",
    researchNotes:
      "Reconstitute with sterile bacteriostatic water. Allow to dissolve at room temperature without agitation. Avoid repeated freeze-thaw cycles to preserve molecular integrity.",
    storage:
      "Store lyophilized powder at 2–8°C. After reconstitution, refrigerate at 2–8°C and use within 21 days. Strictly for qualified laboratory professionals.",
    descriptionSections: [
      {
        heading: "GLP-3 RT (Retatrutide)",
        items: [
          {
            text: "Triple receptor peptide that targets GLP-1, GIP, and glucagon pathways",
            note: "Studied for metabolic support and body weight reduction",
          },
          {
            text: "Designed to influence appetite signaling and energy balance",
            note: "Long acting profile in research settings",
          },
          { text: "Typically referenced in once-weekly research protocols" },
        ],
      },
      {
        heading: "Research Use Notes",
        items: [
          { text: "Supplied as lyophilized powder", note: "Requires reconstitution before use" },
          {
            text: "BAC water required for mixing (sold separately)",
            note: "Swirl gently, do not shake",
          },
          { text: "Allow powder to fully dissolve before drawing" },
        ],
      },
      {
        heading: "Storage",
        items: [{ text: "Store lyophilized powder vial in freezer" }],
      },
      {
        heading: "Keep at 2 to 8°C",
        items: [
          { text: "Protect from light and heat", note: "After mixing, keep refrigerated" },
          { text: "Use within typical research handling window after reconstitution" },
        ],
      },
      {
        heading: "Handling",
        items: [
          {
            text: "Use sterile technique during reconstitution",
            note: "For laboratory research use only",
          },
        ],
      },
    ],
  },
  {
    slug: "glp-2-tz",
    name: "GLP-2 TZ",
    title: "GLP-2 TZ",
    tagline: "Gastrointestinal and tissue research compound.",
    category: "Compounds",
    image: vialGlp2Tz.url,
    heroImage: glp2TzHero10,
    badge: "BEST SELLING!",
    variants: [
      { size: "10mg", price: 60, lot: "ST-G2-1124A", purity: "99.12%", testDate: "2026-03-02" },
      { size: "20mg", price: 110, lot: "ST-G2-1124B", purity: "99.28%", testDate: "2026-03-02" },
      { size: "30mg", price: 140, lot: "ST-G2-1124C", purity: "99.31%", testDate: "2026-03-02" },
      { size: "60mg", price: 220, lot: "ST-G2-1124D", purity: "99.35%", testDate: "2026-03-02" },
    ],
    description:
      "High-purity GLP-2 TZ supplied for advanced peptide research. Manufactured to exacting laboratory specifications for purity and consistency.",
    researchNotes:
      "Reconstitute with sterile bacteriostatic water. Swirl gently — never shake. Use sterile technique throughout handling.",
    storage:
      "Store sealed at 2–8°C protected from light. Refrigerate after reconstitution and use within 21 days.",
    descriptionSections: [
      {
        heading: "GLP-2 TZ (Tirzepatide)",
        items: [
          {
            text: "Dual receptor peptide that engages both GLP-1 and GIP pathways",
            note: "Studied for metabolic and glucose-regulation research",
          },
          {
            text: "Investigated for effects on appetite signaling and energy balance",
            note: "Long-acting profile in research models",
          },
          { text: "Commonly referenced in once-weekly research protocols" },
        ],
      },
      {
        heading: "Research Use Notes",
        items: [
          { text: "Supplied as lyophilized powder", note: "Requires reconstitution before use" },
          {
            text: "Bacteriostatic water required for mixing (sold separately)",
            note: "Swirl gently, never shake",
          },
          { text: "Let the solution clarify fully before drawing" },
        ],
      },
      {
        heading: "Storage",
        items: [
          { text: "Store sealed lyophilized vial frozen for long-term holding" },
          {
            text: "Keep at 2 to 8°C once in active use",
            note: "Protect from light and ambient heat",
          },
        ],
      },
      {
        heading: "Handling",
        items: [
          {
            text: "Maintain sterile technique throughout reconstitution",
            note: "For laboratory research use only",
          },
          { text: "Avoid repeated freeze-thaw cycles to preserve integrity" },
        ],
      },
    ],
  },
  {
    slug: "ghk-cu",
    name: "GHK-Cu",
    title: "GHK-Cu",
    tagline: "Copper tripeptide for tissue research.",
    category: "Compounds",
    image: vialGhkCu.url,
    heroImage: ghkCuHero50,
    badge: "BEST SELLING!",
    variants: [
      { size: "50mg", price: 40, lot: "ST-GHK-09A", purity: "99.05%", testDate: "2026-01-22" },
      { size: "100mg", price: 55, lot: "ST-GHK-09B", purity: "99.17%", testDate: "2026-01-22" },
    ],
    description:
      "GHK-Cu is a copper-binding tripeptide supplied for laboratory study of tissue and matrix-related research applications.",
    researchNotes:
      "Reconstitute with sterile bacteriostatic water. Solution should be clear blue. Avoid prolonged light exposure during handling.",
    storage:
      "Store lyophilized at 2–8°C. Refrigerate reconstituted solution and use within 30 days.",
    descriptionSections: [
      {
        heading: "GHK-Cu (Copper Tripeptide-1)",
        items: [
          {
            text: "Naturally occurring copper-binding tripeptide (Gly-His-Lys)",
            note: "Studied in tissue-remodeling and extracellular-matrix research",
          },
          {
            text: "Investigated for roles in skin and connective-tissue models",
            note: "Frequently referenced in regenerative research literature",
          },
          { text: "Copper complex gives the reconstituted solution a blue tint" },
        ],
      },
      {
        heading: "Research Use Notes",
        items: [
          { text: "Supplied as lyophilized powder", note: "Requires reconstitution before use" },
          {
            text: "Bacteriostatic water required for mixing (sold separately)",
            note: "Solution should appear clear blue",
          },
          { text: "Minimize light exposure while handling" },
        ],
      },
      {
        heading: "Storage",
        items: [
          { text: "Store lyophilized vial frozen for extended holding" },
          {
            text: "Keep reconstituted solution at 2 to 8°C",
            note: "Refrigerated solution stable for up to 30 days",
          },
        ],
      },
      {
        heading: "Handling",
        items: [
          {
            text: "Use sterile technique during reconstitution",
            note: "For laboratory research use only",
          },
        ],
      },
    ],
  },
  {
    slug: "mots-c",
    name: "MOTS-c",
    title: "MOTS-c",
    tagline: "Mitochondrial-derived peptide for cellular energy research.",
    category: "Compounds",
    image: vialMotsC.url,
    heroImage: motsCHero10,
    badge: "BEST SELLING!",
    variants: [
      { size: "10mg", price: 65, lot: "ST-MTS-22A", purity: "99.41%", testDate: "2026-02-08" },
      { size: "40mg", price: 160, lot: "ST-MTS-22B", purity: "99.36%", testDate: "2026-02-08" },
    ],
    description:
      "MOTS-c is a mitochondrial-derived peptide supplied for advanced cellular and metabolic research applications.",
    researchNotes:
      "Reconstitute with sterile bacteriostatic water. Allow to dissolve undisturbed. Maintain sterile workflow.",
    storage:
      "Store lyophilized at 2–8°C. Refrigerated reconstituted solutions remain stable for up to 28 days.",
    descriptionSections: [
      {
        heading: "MOTS-c (Mitochondrial-Derived Peptide)",
        items: [
          {
            text: "16-amino-acid peptide encoded within the mitochondrial 12S rRNA",
            note: "Studied in cellular metabolism and energy-homeostasis research",
          },
          {
            text: "Investigated for roles in metabolic-stress and insulin-sensitivity models",
            note: "Often referenced in exercise-mimetic research",
          },
          { text: "Acts as a signaling peptide between mitochondria and the nucleus" },
        ],
      },
      {
        heading: "Research Use Notes",
        items: [
          { text: "Supplied as lyophilized powder", note: "Requires reconstitution before use" },
          {
            text: "Bacteriostatic water required for mixing (sold separately)",
            note: "Allow to dissolve undisturbed",
          },
          { text: "Confirm a clear solution before drawing" },
        ],
      },
      {
        heading: "Storage",
        items: [
          { text: "Store lyophilized vial frozen for long-term holding" },
          {
            text: "Keep reconstituted solution at 2 to 8°C",
            note: "Stable refrigerated for up to 28 days",
          },
        ],
      },
      {
        heading: "Handling",
        items: [
          {
            text: "Maintain sterile workflow during reconstitution",
            note: "For laboratory research use only",
          },
        ],
      },
    ],
  },
  {
    slug: "cjc-1295-ipamorelin",
    name: "CJC-1295 + Ipamorelin",
    title: "CJC-1295 + Ipamorelin",
    tagline: "Dual-peptide blend for endocrine research.",
    category: "Blends",
    image: vialCjcIpa.url,
    heroImage: cjcIpaHero10,
    badge: "SALE!",
    variants: [
      { size: "10mg", price: 75, lot: "ST-CJC-31A", purity: "99.08%", testDate: "2026-01-30" },
      { size: "20mg", price: 120, lot: "ST-CJC-31B", purity: "99.19%", testDate: "2026-01-30" },
    ],
    description:
      "Pre-blended CJC-1295 and Ipamorelin formulated for laboratory study of endocrine signaling pathways.",
    researchNotes:
      "Reconstitute with sterile bacteriostatic water. Mix gently and allow to dissolve fully before transfer.",
    storage:
      "Store at 2–8°C. Refrigerate after reconstitution and use within 21 days.",
    descriptionSections: [
      {
        heading: "CJC-1295 + Ipamorelin",
        items: [
          {
            text: "Pre-blended GHRH analog (CJC-1295) and selective secretagogue (Ipamorelin)",
            note: "Studied together for growth-hormone-axis research",
          },
          {
            text: "CJC-1295 component investigated for sustained GHRH-receptor signaling",
            note: "Extended half-life profile in research settings",
          },
          {
            text: "Ipamorelin component referenced as a selective ghrelin-receptor agonist",
            note: "Noted for minimal off-target activity in studies",
          },
        ],
      },
      {
        heading: "Research Use Notes",
        items: [
          {
            text: "Supplied as a co-lyophilized powder blend",
            note: "Requires reconstitution before use",
          },
          {
            text: "Bacteriostatic water required for mixing (sold separately)",
            note: "Mix gently and let dissolve fully",
          },
          { text: "Transfer only once the solution is fully clear" },
        ],
      },
      {
        heading: "Storage",
        items: [
          { text: "Store sealed lyophilized vial frozen for long-term holding" },
          {
            text: "Keep reconstituted blend at 2 to 8°C",
            note: "Use within typical research handling window",
          },
        ],
      },
      {
        heading: "Handling",
        items: [
          {
            text: "Use sterile technique throughout reconstitution",
            note: "For laboratory research use only",
          },
        ],
      },
    ],
  },
  {
    slug: "wolverine",
    name: "Wolverine",
    title: "Wolverine",
    tagline: "BPC-157 and TB-500 dual-action research blend.",
    category: "Blends",
    image: vialWolverine.url,
    heroImage: wolverineHero10,
    variants: [
      { size: "10mg", price: 70, lot: "ST-WLV-44A", purity: "99.14%", testDate: "2026-02-19" },
      { size: "20mg", price: 120, lot: "ST-WLV-44B", purity: "99.22%", testDate: "2026-02-19" },
      { size: "40mg", price: 200, lot: "ST-WLV-44C", purity: "99.31%", testDate: "2026-02-19" },
    ],
    description:
      "Co-formulated BPC-157 and TB-500 for tissue repair research workflows. Manufactured to high-purity standards.",
    researchNotes:
      "Reconstitute with sterile bacteriostatic water. Avoid agitation. Maintain sterile technique throughout.",
    storage:
      "Store lyophilized at 2–8°C. Refrigerated reconstituted solution stable for up to 21 days.",
    descriptionSections: [
      {
        heading: "Wolverine (BPC-157 / TB-500)",
        items: [
          {
            text: "Dual blend of BPC-157 and TB-500 (a thymosin beta-4 fragment)",
            note: "Studied in tissue-repair and recovery research models",
          },
          {
            text: "BPC-157 component investigated for cytoprotective and angiogenic activity",
            note: "Stable gastric pentadecapeptide in research",
          },
          {
            text: "TB-500 component referenced for actin regulation and cell migration",
            note: "Studied in connective-tissue research",
          },
        ],
      },
      {
        heading: "Research Use Notes",
        items: [
          {
            text: "Supplied as a co-lyophilized powder blend",
            note: "Requires reconstitution before use",
          },
          {
            text: "Bacteriostatic water required for mixing (sold separately)",
            note: "Avoid agitation while dissolving",
          },
          { text: "Allow full dissolution before drawing" },
        ],
      },
      {
        heading: "Storage",
        items: [
          { text: "Store lyophilized vial frozen for extended holding" },
          {
            text: "Keep reconstituted blend at 2 to 8°C",
            note: "Refrigerated solution stable for up to 21 days",
          },
        ],
      },
      {
        heading: "Handling",
        items: [
          {
            text: "Maintain sterile technique during reconstitution",
            note: "For laboratory research use only",
          },
        ],
      },
    ],
  },
  {
    slug: "nad-plus",
    name: "NAD+",
    title: "NAD+",
    tagline: "Cellular longevity & metabolic research.",
    category: "Compounds",
    image: vialNad.url,
    heroImage: nadPlusHero500,
    variants: [
      { size: "500mg", price: 65, lot: "ST-NAD-77A", purity: "99.46%", testDate: "2026-03-04" },
      { size: "1000mg", price: 1000, lot: "ST-NAD-77B", purity: "99.52%", testDate: "2026-03-04" },
    ],
    description:
      "High-purity NAD+ supplied for cellular metabolism and longevity research.",
    researchNotes:
      "Reconstitute with sterile bacteriostatic water. Use within recommended window after reconstitution.",
    storage:
      "Store lyophilized at 2–8°C protected from light. Refrigerate after reconstitution.",
    descriptionSections: [
      {
        heading: "NAD+ (Nicotinamide Adenine Dinucleotide)",
        items: [
          {
            text: "Essential coenzyme central to cellular redox and energy metabolism",
            note: "Studied in mitochondrial-function and longevity research",
          },
          {
            text: "Investigated for roles in sirtuin activity and DNA-repair pathways",
            note: "Frequently referenced in cellular-aging models",
          },
          { text: "Participates in electron-transfer reactions across many enzymes" },
        ],
      },
      {
        heading: "Research Use Notes",
        items: [
          { text: "Supplied as lyophilized powder", note: "Requires reconstitution before use" },
          {
            text: "Bacteriostatic water required for mixing (sold separately)",
            note: "Swirl gently until fully dissolved",
          },
          { text: "Light-sensitive — minimize exposure while handling" },
        ],
      },
      {
        heading: "Storage",
        items: [
          { text: "Store lyophilized vial frozen and protected from light" },
          {
            text: "Keep reconstituted solution at 2 to 8°C",
            note: "Protect from light and heat",
          },
        ],
      },
      {
        heading: "Handling",
        items: [
          {
            text: "Use sterile technique during reconstitution",
            note: "For laboratory research use only",
          },
        ],
      },
    ],
  },
  {
    slug: "tesamorelin",
    name: "Tesamorelin",
    title: "Tesamorelin",
    tagline: "Growth-hormone releasing research compound.",
    category: "Compounds",
    image: vialTesamorelin.url,
    heroImage: "/images/cards/tesamorelin.jpg",
    badge: "SALE!",
    variants: [
      { size: "10mg", price: 85, originalPrice: 95, lot: "ST-TSM-55A", purity: "99.24%", testDate: "2026-02-25" },
    ],
    description:
      "Tesamorelin manufactured to high-purity laboratory specifications for endocrine research.",
    researchNotes:
      "Reconstitute with sterile bacteriostatic water. Allow to dissolve at room temperature undisturbed.",
    storage:
      "Store at 2–8°C. Refrigerate after reconstitution and use within 21 days.",
    descriptionSections: [
      {
        heading: "Tesamorelin (GHRH Analog)",
        items: [
          {
            text: "Stabilized synthetic analog of growth-hormone-releasing hormone",
            note: "Studied in endocrine and growth-hormone-axis research",
          },
          {
            text: "Investigated for activity at the GHRH receptor and downstream signaling",
            note: "Referenced in metabolic and adipose-tissue research models",
          },
          { text: "Modified GHRH(1-44) structure for improved research stability" },
        ],
      },
      {
        heading: "Research Use Notes",
        items: [
          { text: "Supplied as lyophilized powder", note: "Requires reconstitution before use" },
          {
            text: "Bacteriostatic water required for mixing (sold separately)",
            note: "Allow to dissolve at room temperature undisturbed",
          },
          { text: "Confirm a clear solution before drawing" },
        ],
      },
      {
        heading: "Storage",
        items: [
          { text: "Store lyophilized vial frozen for long-term holding" },
          {
            text: "Keep reconstituted solution at 2 to 8°C",
            note: "Use within typical research handling window",
          },
        ],
      },
      {
        heading: "Handling",
        items: [
          {
            text: "Maintain sterile technique during reconstitution",
            note: "For laboratory research use only",
          },
        ],
      },
    ],
  },
  {
    slug: "klow",
    name: "KLOW",
    title: "KLOW",
    tagline: "Premium four-peptide master stack.",
    category: "Bundles",
    image: vialKlow.url,
    heroImage: "/images/hero-vials/simpletide-bpc157-10mg.png",
    badge: "BEST SELLING!",
    variants: [
      { size: "80mg", price: 105, lot: "ST-KLW-90A", purity: "99.18%", testDate: "2026-02-11" },
    ],
    description:
      "KLOW combines GHK-Cu, TB-500, BPC-157, and KPV into a single research-grade master stack.",
    researchNotes:
      "Reconstitute with sterile bacteriostatic water following standard sterile workflow.",
    storage:
      "Store at 2–8°C. Refrigerate after reconstitution and use within 28 days.",
    descriptionSections: [
      {
        heading: "KLOW (GHK-Cu / TB-500 / BPC-157 / KPV)",
        items: [
          {
            text: "Four-peptide master stack combining GHK-Cu, TB-500, BPC-157, and KPV",
            note: "Studied across tissue-repair and matrix research",
          },
          {
            text: "GHK-Cu and BPC-157 components referenced in remodeling research",
            note: "Copper tripeptide plus gastric pentadecapeptide",
          },
          {
            text: "KPV component investigated as an alpha-MSH fragment in inflammation models",
            note: "TB-500 referenced for cell-migration research",
          },
        ],
      },
      {
        heading: "Research Use Notes",
        items: [
          {
            text: "Supplied as a co-lyophilized multi-peptide powder",
            note: "Requires reconstitution before use",
          },
          {
            text: "Bacteriostatic water required for mixing (sold separately)",
            note: "Swirl gently to combine, do not shake",
          },
          { text: "Allow all components to fully dissolve before drawing" },
        ],
      },
      {
        heading: "Storage",
        items: [
          { text: "Store sealed lyophilized vial frozen for long-term holding" },
          {
            text: "Keep reconstituted stack at 2 to 8°C",
            note: "Refrigerated solution stable for up to 28 days",
          },
        ],
      },
      {
        heading: "Handling",
        items: [
          {
            text: "Use sterile technique during reconstitution",
            note: "For laboratory research use only",
          },
        ],
      },
    ],
  },
  {
    slug: "glow",
    name: "GLOW",
    title: "GLOW",
    tagline: "Tri-peptide blend for matrix research.",
    category: "Blends",
    image: GLOW_VIAL_IMAGE,
    heroImage: GLOW_VIAL_IMAGE,
    variants: [
      { size: "70mg", price: 85, lot: "ST-GLW-66A", purity: "99.22%", testDate: "2026-02-12" },
    ],
    description:
      "GLOW combines GHK-Cu, TB-500, and BPC-157 into a single research-grade stack for matrix studies.",
    researchNotes:
      "Reconstitute with sterile bacteriostatic water. Mix gently to dissolve.",
    storage:
      "Store at 2–8°C. Refrigerate after reconstitution and use within 28 days.",
    descriptionSections: [
      {
        heading: "GLOW (GHK-Cu / TB-500 / BPC-157)",
        items: [
          {
            text: "Three-peptide blend of GHK-Cu, TB-500, and BPC-157",
            note: "Studied in skin, matrix, and recovery research",
          },
          {
            text: "GHK-Cu component contributes a blue tint on reconstitution",
            note: "Copper tripeptide referenced in remodeling research",
          },
          {
            text: "TB-500 and BPC-157 components studied for cell migration and repair",
            note: "Common pairing in connective-tissue models",
          },
        ],
      },
      {
        heading: "Research Use Notes",
        items: [
          {
            text: "Supplied as a co-lyophilized multi-peptide powder",
            note: "Requires reconstitution before use",
          },
          {
            text: "Bacteriostatic water required for mixing (sold separately)",
            note: "Mix gently until the blue solution is clear",
          },
          { text: "Allow full dissolution before drawing" },
        ],
      },
      {
        heading: "Storage",
        items: [
          { text: "Store lyophilized vial frozen for extended holding" },
          {
            text: "Keep reconstituted blend at 2 to 8°C",
            note: "Refrigerated solution stable for up to 28 days",
          },
        ],
      },
      {
        heading: "Handling",
        items: [
          {
            text: "Maintain sterile technique during reconstitution",
            note: "For laboratory research use only",
          },
        ],
      },
    ],
  },
  {
    slug: "bac-water",
    name: "Bac Water",
    title: "Bacteriostatic Water",
    tagline: "Sterile diluent for laboratory reconstitution.",
    category: "Supplies",
    image: vialBacWater.url,
    heroImage: "/images/hero-vials/simpletide-bpc157-10mg.png",
    variants: [
      { size: "10ML", price: 20, lot: "ST-BAC-12A", purity: "USP Grade", testDate: "2026-03-01" },
    ],
    description:
      "Sterile bacteriostatic water with 0.9% benzyl alcohol for laboratory reconstitution of lyophilized research compounds.",
    researchNotes:
      "Use sterile syringe and needle for withdrawal. Discard vial after 28 days of first puncture.",
    storage:
      "Store at room temperature, away from direct light.",
    descriptionSections: [
      {
        heading: "Bacteriostatic Water",
        items: [
          {
            text: "Sterile water containing 0.9% benzyl alcohol as a bacteriostatic agent",
            note: "Used to reconstitute lyophilized research compounds",
          },
          {
            text: "Benzyl alcohol limits microbial growth across multiple withdrawals",
            note: "Supports multi-dose research handling",
          },
          { text: "Clear, colorless USP-grade diluent" },
        ],
      },
      {
        heading: "Reconstitution Notes",
        items: [
          {
            text: "Inject slowly down the inside wall of the powder vial",
            note: "Avoid spraying directly onto the powder",
          },
          {
            text: "Swirl gently to dissolve — do not shake",
            note: "Let the solution settle until clear",
          },
          { text: "Use a fresh sterile syringe and needle for each withdrawal" },
        ],
      },
      {
        heading: "Storage",
        items: [
          { text: "Store the unopened vial at room temperature, away from direct light" },
          { text: "Refrigerate the research solutions it reconstitutes as those compounds require" },
        ],
      },
      {
        heading: "Handling",
        items: [
          {
            text: "Wipe the stopper with alcohol before each puncture",
            note: "Discard 28 days after first puncture",
          },
          { text: "For laboratory reconstitution use only" },
        ],
      },
    ],
  },
  {
    slug: "adamax",
    name: "Adamax",
    title: "Adamax",
    tagline: "Specialized research compound.",
    category: "Compounds",
    image: vialAdamax.url,
    heroImage: "/images/cards/adamax.jpg",
    badge: "BEST SELLING!",
    variants: [
      { size: "10mg", price: 65, lot: "ST-ADX-18A", purity: "99.11%", testDate: "2026-02-03" },
    ],
    description:
      "Adamax is an enhanced derivative of the nootropic Semax — an N-acetylated, adamantane-modified ACTH(4-10) analog studied for neuroprotective and cognitive-signaling research.",
    researchNotes:
      "Reconstitute with sterile bacteriostatic water under sterile technique.",
    storage:
      "Store at 2–8°C. Refrigerate after reconstitution.",
    descriptionSections: [
      {
        heading: "Adamax (Modified Semax)",
        items: [
          {
            text: "Enhanced derivative of the ACTH(4-10) analog Semax (MEHFPGP)",
            note: "Carries N-terminal acetylation plus an adamantane modification",
          },
          {
            text: "Modifications studied for greater stability and blood-brain-barrier penetration",
            note: "Investigated for BDNF / TrkB-related signaling like its Semax parent",
          },
          { text: "Referenced in nootropic and neuroprotection research models" },
        ],
      },
      {
        heading: "Research Use Notes",
        items: [
          { text: "Supplied as lyophilized powder", note: "Requires reconstitution before use" },
          {
            text: "Bacteriostatic water required for mixing (sold separately)",
            note: "Use sterile technique throughout",
          },
          { text: "Allow powder to fully dissolve before drawing" },
        ],
      },
      {
        heading: "Storage",
        items: [
          { text: "Store lyophilized vial frozen for long-term holding" },
          {
            text: "Keep reconstituted solution at 2 to 8°C",
            note: "Protect from light and heat",
          },
        ],
      },
      {
        heading: "Handling",
        items: [
          {
            text: "Maintain sterile workflow during reconstitution",
            note: "For laboratory research use only",
          },
        ],
      },
    ],
  },
  {
    slug: "glutathione",
    name: "Glutathione",
    title: "Glutathione",
    tagline: "Antioxidant research compound.",
    category: "Compounds",
    image: vialGlutathione.url,
    heroImage: "/images/hero-vials/simpletide-bpc157-10mg.png",
    variants: [
      { size: "1500mg", price: 0, lot: "ST-GTH-41A", purity: "99.33%", testDate: "2026-02-17" },
    ],
    description:
      "High-purity glutathione for oxidative-stress and cellular research applications.",
    researchNotes:
      "Reconstitute with sterile bacteriostatic water. Protect from light.",
    storage:
      "Store at 2–8°C. Use within 21 days after reconstitution.",
    descriptionSections: [
      {
        heading: "Glutathione (GSH)",
        items: [
          {
            text: "Endogenous tripeptide of glutamate, cysteine, and glycine",
            note: "Studied as a primary cellular antioxidant",
          },
          {
            text: "Investigated for roles in redox balance and detoxification pathways",
            note: "Referenced in oxidative-stress research models",
          },
          { text: "Its thiol group drives free-radical-scavenging activity" },
        ],
      },
      {
        heading: "Research Use Notes",
        items: [
          { text: "Supplied as lyophilized powder", note: "Requires reconstitution before use" },
          {
            text: "Bacteriostatic water required for mixing (sold separately)",
            note: "Swirl gently until dissolved",
          },
          { text: "Light- and air-sensitive — minimize exposure while handling" },
        ],
      },
      {
        heading: "Storage",
        items: [
          { text: "Store lyophilized vial frozen and protected from light" },
          {
            text: "Keep reconstituted solution at 2 to 8°C",
            note: "Use within typical research handling window",
          },
        ],
      },
      {
        heading: "Handling",
        items: [
          {
            text: "Use sterile technique during reconstitution",
            note: "For laboratory research use only",
          },
        ],
      },
    ],
  },
  {
    slug: "mt1",
    name: "MT1",
    title: "MT-1",
    tagline: "Melanocortin research compound.",
    category: "Compounds",
    image: vialMt1.url,
    heroImage: "/images/cards/mt1.jpg",
    variants: [
      { size: "10mg", price: 50, lot: "ST-MT1-05A", purity: "99.08%", testDate: "2026-01-29" },
    ],
    description:
      "MT-1 supplied for melanocortin receptor research at high laboratory purity.",
    researchNotes:
      "Reconstitute with sterile bacteriostatic water using sterile technique.",
    storage:
      "Store at 2–8°C protected from light.",
    descriptionSections: [
      {
        heading: "MT-1 (Melanotan I)",
        items: [
          {
            text: "Linear analog of alpha-melanocyte-stimulating hormone (α-MSH)",
            note: "Studied in melanocortin-receptor and pigmentation research",
          },
          {
            text: "Investigated for melanogenesis signaling in research models",
            note: "Acts on melanocortin receptors in studies",
          },
          { text: "Linear peptide structure distinguishes it from the cyclic MT-2" },
        ],
      },
      {
        heading: "Research Use Notes",
        items: [
          { text: "Supplied as lyophilized powder", note: "Requires reconstitution before use" },
          {
            text: "Bacteriostatic water required for mixing (sold separately)",
            note: "Swirl gently, do not shake",
          },
          { text: "Allow powder to fully dissolve before drawing" },
        ],
      },
      {
        heading: "Storage",
        items: [
          { text: "Store lyophilized vial frozen and protected from light" },
          {
            text: "Keep reconstituted solution at 2 to 8°C",
            note: "Protect from light and heat",
          },
        ],
      },
      {
        heading: "Handling",
        items: [
          {
            text: "Use sterile technique during reconstitution",
            note: "For laboratory research use only",
          },
        ],
      },
    ],
  },
  {
    slug: "melanotan-2",
    name: "Melanotan 2",
    title: "Melanotan 2",
    tagline: "Melanocortin research compound.",
    category: "Compounds",
    image: vialMt2.url,
    heroImage: "/images/cards/melanotan-2.jpg",
    variants: [
      { size: "10mg", price: 40, lot: "ST-MT2-07A", purity: "99.14%", testDate: "2026-01-29" },
    ],
    description:
      "Melanotan 2 supplied for melanocortin receptor research at high laboratory purity.",
    researchNotes:
      "Reconstitute with sterile bacteriostatic water using sterile technique.",
    storage:
      "Store at 2–8°C protected from light.",
    descriptionSections: [
      {
        heading: "Melanotan 2 (MT-II)",
        items: [
          {
            text: "Cyclic synthetic analog of alpha-melanocyte-stimulating hormone (α-MSH)",
            note: "Studied in melanocortin-receptor and pigmentation research",
          },
          {
            text: "Investigated as a non-selective melanocortin-receptor agonist",
            note: "Referenced in melanogenesis research models",
          },
          { text: "Cyclic lactam structure increases stability versus the linear MT-1" },
        ],
      },
      {
        heading: "Research Use Notes",
        items: [
          { text: "Supplied as lyophilized powder", note: "Requires reconstitution before use" },
          {
            text: "Bacteriostatic water required for mixing (sold separately)",
            note: "Swirl gently until clear",
          },
          { text: "Confirm full dissolution before drawing" },
        ],
      },
      {
        heading: "Storage",
        items: [
          { text: "Store lyophilized vial frozen and protected from light" },
          {
            text: "Keep reconstituted solution at 2 to 8°C",
            note: "Protect from light and heat",
          },
        ],
      },
      {
        heading: "Handling",
        items: [
          {
            text: "Maintain sterile technique during reconstitution",
            note: "For laboratory research use only",
          },
        ],
      },
    ],
  },
  {
    slug: "dsip",
    name: "DSIP",
    title: "DSIP",
    tagline: "Delta sleep-inducing peptide for sleep-cycle research.",
    category: "Compounds",
    image: "/images/hero-vials/simpletide-bpc157-10mg.png",
    heroImage: dsipHero5,
    variants: [
      { size: "5mg", price: 45, lot: "ST-DSIP-01A", purity: "99%+", testDate: "2026-03-01" },
      { size: "10mg", price: 70, lot: "ST-DSIP-01B", purity: "99%+", testDate: "2026-03-01" },
    ],
    description:
      "DSIP (delta sleep-inducing peptide) is a naturally occurring nonapeptide studied for sleep-cycle regulation and neuroendocrine signaling in research models.",
    researchNotes:
      "Reconstitute with sterile bacteriostatic water using sterile technique. For laboratory research use only.",
    storage:
      "Store lyophilized at 2–8°C, protected from light. Refrigerate after reconstitution.",
    descriptionSections: [
      {
        heading: "DSIP (Delta Sleep-Inducing Peptide)",
        items: [
          {
            text: "Naturally occurring nonapeptide (Trp-Ala-Gly-Gly-Asp-Ala-Ser-Gly-Glu)",
            note: "First identified for its link to delta-wave sleep",
          },
          {
            text: "Studied for sleep-cycle regulation and stress modulation",
            note: "Investigated for neuroendocrine and circadian signaling",
          },
          { text: "Referenced in sleep and stress-resilience research models" },
        ],
      },
      ...stdTail(true),
    ],
  },
  // --- Remaining products (png-folder vials wired; $0 placeholder pricing) ---
  ph("ara-290", "ARA-290", "Compounds", "10mg", 70),
  ph("5-amino-1mq", "5-Amino-1MQ", "Compounds", "5mg", 0),
  ph("ahk-cu", "AHK-Cu", "Compounds", "50mg", 0),
  ph("kpv", "KPV", "Compounds", "10mg", 55),
  ph("kpv-ghk-cu", "KPV + GHK-Cu", "Blends", "60mg", 0),
  {
    ...ph("trifecta", "Trifecta", "Bundles", "Stack", 140),
    tagline: "Three-peptide aesthetic and metabolic research stack.",
    subtitle: "3-Peptide Research Stack",
    bundleContents: "GHK-Cu 50mg, GLP-3 RT 10mg, MT2 10mg",
    description:
      "Trifecta is a three-peptide research stack combining GHK-Cu (50mg), GLP-3 RT (10mg), and Melanotan 2 (10mg) — assembled for studies spanning skin and tissue support, metabolic regulation, and melanocortin signaling. Each compound ships as its own high-purity lyophilized vial.",
    descriptionSections: [
      {
        heading: "What's Included",
        items: [
          { text: "GHK-Cu — 50mg vial", note: "Copper peptide studied for skin, hair, and tissue-repair research" },
          { text: "GLP-3 RT (Retatrutide) — 10mg vial", note: "Triple agonist studied for metabolism and appetite regulation" },
          { text: "Melanotan 2 — 10mg vial", note: "Melanocortin agonist studied for pigmentation research" },
        ],
      },
      {
        heading: "Research Focus",
        items: [
          { text: "Spans aesthetic, metabolic, and pigmentation pathways" },
          { text: "Designed to be evaluated together as a complementary stack" },
        ],
      },
      {
        heading: "Research Use Notes",
        items: [
          { text: "Each peptide is supplied as a separate lyophilized vial", note: "Reconstitute individually before use" },
          { text: "BAC water required for mixing (sold separately)", note: "Swirl gently, do not shake" },
        ],
      },
      {
        heading: "Storage & Handling",
        items: [
          { text: "Store lyophilized vials in the freezer", note: "Protect from light and heat" },
          { text: "Refrigerate after reconstitution; use sterile technique", note: "For laboratory research use only" },
        ],
      },
    ],
  },
  {
    ...ph("trifecta-deluxe", "Trifecta Deluxe", "Bundles", "Stack", 240),
    tagline: "Higher-strength aesthetic and metabolic research stack.",
    subtitle: "3-Peptide Research Stack",
    bundleContents: "GHK-Cu 100mg, GLP-3 RT 30mg, MT2 10mg",
    description:
      "Trifecta Deluxe is the higher-strength version of our Trifecta stack, pairing GHK-Cu (100mg), GLP-3 RT (30mg), and Melanotan 2 (10mg) for extended research across skin and tissue support, metabolic regulation, and melanocortin signaling. Each compound ships as its own high-purity lyophilized vial.",
    descriptionSections: [
      {
        heading: "What's Included",
        items: [
          { text: "GHK-Cu — 100mg vial", note: "Copper peptide studied for skin, hair, and tissue-repair research" },
          { text: "GLP-3 RT (Retatrutide) — 30mg vial", note: "Triple agonist studied for metabolism and appetite regulation" },
          { text: "Melanotan 2 — 10mg vial", note: "Melanocortin agonist studied for pigmentation research" },
        ],
      },
      {
        heading: "Research Focus",
        items: [
          { text: "Higher dosing for extended aesthetic and metabolic studies" },
          { text: "Designed to be evaluated together as a complementary stack" },
        ],
      },
      {
        heading: "Research Use Notes",
        items: [
          { text: "Each peptide is supplied as a separate lyophilized vial", note: "Reconstitute individually before use" },
          { text: "BAC water required for mixing (sold separately)", note: "Swirl gently, do not shake" },
        ],
      },
      {
        heading: "Storage & Handling",
        items: [
          { text: "Store lyophilized vials in the freezer", note: "Protect from light and heat" },
          { text: "Refrigerate after reconstitution; use sterile technique", note: "For laboratory research use only" },
        ],
      },
    ],
  },
  {
    ...ph("neuro-duo", "Neuro Duo", "Blends", "Stack", 100),
    tagline: "Two-peptide cognitive and neuro research stack.",
    subtitle: "2-Peptide Research Stack",
    bundleContents: "Selank 10mg, Semax 10mg",
    description:
      "Neuro Duo is a two-peptide research stack pairing Selank (10mg) and Semax (10mg) — assembled for nootropic, neuroprotective, and stress-response research. Each compound ships as its own high-purity lyophilized vial.",
    descriptionSections: [
      {
        heading: "What's Included",
        items: [
          { text: "Selank — 10mg vial", note: "Anxiolytic neuropeptide studied for stress and mood research" },
          { text: "Semax — 10mg vial", note: "Neuropeptide studied for cognition and neuroprotection" },
        ],
      },
      {
        heading: "Research Focus",
        items: [
          { text: "Targets cognitive, neuroprotective, and stress-response pathways" },
          { text: "Designed to be evaluated together as a complementary stack" },
        ],
      },
      {
        heading: "Research Use Notes",
        items: [
          { text: "Each peptide is supplied as a separate lyophilized vial", note: "Reconstitute individually before use" },
          { text: "BAC water required for mixing (sold separately)", note: "Swirl gently, do not shake" },
        ],
      },
      {
        heading: "Storage & Handling",
        items: [
          { text: "Store lyophilized vials in the freezer", note: "Protect from light and heat" },
          { text: "Refrigerate after reconstitution; use sterile technique", note: "For laboratory research use only" },
        ],
      },
    ],
  },
  {
    ...ph("shred-plus", "Shred+", "Blends", "Stack", 200),
    tagline: "Two-peptide metabolic and body-composition research stack.",
    subtitle: "2-Peptide Research Stack",
    bundleContents: "Tesamorelin 10mg, GLP-3 RT 20mg",
    description:
      "Shred+ is a two-peptide research stack pairing Tesamorelin (10mg) with GLP-3 RT (20mg) — assembled for studies on visceral fat, growth-hormone signaling, and metabolic regulation. Each compound ships as its own high-purity lyophilized vial.",
    descriptionSections: [
      {
        heading: "What's Included",
        items: [
          { text: "Tesamorelin — 10mg vial", note: "GHRH analog studied for visceral fat and GH signaling" },
          { text: "GLP-3 RT (Retatrutide) — 20mg vial", note: "Triple agonist studied for metabolism and appetite regulation" },
        ],
      },
      {
        heading: "Research Focus",
        items: [
          { text: "Targets body-composition and metabolic pathways" },
          { text: "Designed to be evaluated together as a complementary stack" },
        ],
      },
      {
        heading: "Research Use Notes",
        items: [
          { text: "Each peptide is supplied as a separate lyophilized vial", note: "Reconstitute individually before use" },
          { text: "BAC water required for mixing (sold separately)", note: "Swirl gently, do not shake" },
        ],
      },
      {
        heading: "Storage & Handling",
        items: [
          { text: "Store lyophilized vials in the freezer", note: "Protect from light and heat" },
          { text: "Refrigerate after reconstitution; use sterile technique", note: "For laboratory research use only" },
        ],
      },
    ],
  },
  {
    ...ph("peak-pulse", "Peak Pulse", "Blends", "Stack", 150),
    tagline: "Two-peptide growth-hormone axis research stack.",
    subtitle: "2-Peptide Research Stack",
    bundleContents: "Ipamorelin 10mg, Tesamorelin 10mg",
    description:
      "Peak Pulse is a two-peptide research stack combining Ipamorelin (10mg) and Tesamorelin (10mg) — assembled for growth-hormone secretagogue and GHRH pathway research. Each compound ships as its own high-purity lyophilized vial.",
    descriptionSections: [
      {
        heading: "What's Included",
        items: [
          { text: "Ipamorelin — 10mg vial", note: "Selective GH secretagogue studied for GH-pulse research" },
          { text: "Tesamorelin — 10mg vial", note: "GHRH analog studied for GH signaling and visceral fat" },
        ],
      },
      {
        heading: "Research Focus",
        items: [
          { text: "Targets the growth-hormone axis from two complementary angles" },
          { text: "Designed to be evaluated together as a complementary stack" },
        ],
      },
      {
        heading: "Research Use Notes",
        items: [
          { text: "Each peptide is supplied as a separate lyophilized vial", note: "Reconstitute individually before use" },
          { text: "BAC water required for mixing (sold separately)", note: "Swirl gently, do not shake" },
        ],
      },
      {
        heading: "Storage & Handling",
        items: [
          { text: "Store lyophilized vials in the freezer", note: "Protect from light and heat" },
          { text: "Refrigerate after reconstitution; use sterile technique", note: "For laboratory research use only" },
        ],
      },
    ],
  },
  {
    ...ph("metabolic-reset", "Metabolic Reset", "Blends", "Stack", 190),
    tagline: "Three-compound metabolic and mitochondrial research stack.",
    subtitle: "3-Peptide Research Stack",
    bundleContents: "GLP-3 RT 10mg, NAD+ 500mg, MOTS-c 10mg",
    description:
      "Metabolic Reset is a three-compound research stack combining GLP-3 RT (10mg), NAD+ (500mg), and MOTS-c (10mg) — assembled for studies on metabolism, cellular energy, and mitochondrial function. Each compound ships as its own high-purity lyophilized vial.",
    descriptionSections: [
      {
        heading: "What's Included",
        items: [
          { text: "GLP-3 RT (Retatrutide) — 10mg vial", note: "Triple agonist studied for metabolism and appetite regulation" },
          { text: "NAD+ — 500mg vial", note: "Coenzyme studied for cellular energy and longevity research" },
          { text: "MOTS-c — 10mg vial", note: "Mitochondrial-derived peptide studied for metabolic regulation" },
        ],
      },
      {
        heading: "Research Focus",
        items: [
          { text: "Spans metabolic, cellular-energy, and mitochondrial pathways" },
          { text: "Designed to be evaluated together as a complementary stack" },
        ],
      },
      {
        heading: "Research Use Notes",
        items: [
          { text: "Each compound is supplied as a separate lyophilized vial", note: "Reconstitute individually before use" },
          { text: "BAC water required for mixing (sold separately)", note: "Swirl gently, do not shake" },
        ],
      },
      {
        heading: "Storage & Handling",
        items: [
          { text: "Store lyophilized vials in the freezer", note: "Protect from light and heat" },
          { text: "Refrigerate after reconstitution; use sterile technique", note: "For laboratory research use only" },
        ],
      },
    ],
  },
  ph("semax", "Semax", "Compounds", "10mg", 50),
  ph("selank", "Selank", "Compounds", "10mg", 55),
  ph("ss-31", "SS-31", "Compounds", "10mg", 60),
  ph("ll-37", "LL-37", "Compounds", "10mg", 70),
  ph("bpc-157", "BPC-157", "Compounds", "10mg", 65),
  ph("tb-500", "TB-500", "Compounds", "10mg", 70),
  ph("sermorelin", "Sermorelin", "Compounds", "10mg", 65),
  ph("ipamorelin", "Ipamorelin", "Compounds", "10mg", 70),
  ph("igf1-lr3", "IGF1-LR3", "Compounds", "10mg", 85),
  ph("cagrilintide", "Cagrilintide", "Compounds", "10mg", 90),
  ph("hcg", "HCG", "Compounds", "5000iu", 65),
  ph("epithalon", "Epithalon", "Compounds", "10mg", 55),
  ph("kisspeptin", "Kisspeptin", "Compounds", "10mg", 50),
  ph("pt-141", "PT-141", "Compounds", "10mg", 60),
  ph("thymosin-alpha-1", "Thymosin Alpha-1", "Compounds", "10mg", 80),
  ph("cjc-1295-with-dac", "CJC-1295 With Dac", "Compounds"),
  ph("cjc-1295-no-dac", "CJC-1295 No Dac", "Compounds"),
  ph("aod-9604", "AOD-9604", "Compounds", "10mg", 55),
  { ...ph("glp-1-sm", "GLP-1 SM", "Compounds"), heroImage: "/images/cards/glp-1-sm.jpg" },
  { ...ph("elora", "Elora", "Compounds"), heroImage: "/images/cards/elora.jpg" },
  { ...ph("selank-semax", "Selank + Semax", "Blends", "20mg"), heroImage: "/images/cards/selank-semax.jpg" },
  { ...ph("snap-8", "Snap 8", "Compounds"), heroImage: "/images/cards/snap-8.jpg" },
  { ...ph("vip", "VIP", "Compounds"), heroImage: "/images/cards/vip.jpg" },
  { ...ph("ss-31-mots-c", "SS-31 + MOTS-c", "Blends", "40mg"), heroImage: "/images/cards/ss-31-mots-c.jpg" },
];

/**
 * Products currently sold on Simpletide — each has a square card photo at
 * public/images/cards/<slug>.jpg. Entries in ALL_PRODUCTS that aren't listed
 * here are retired and hidden everywhere (shop, product pages, search, chat bot).
 */
const ACTIVE_SLUGS = new Set([
  "glp-3-rt",
  "glp-2-tz",
  "glp-1-sm",
  "tesamorelin",
  "mots-c",
  "adamax",
  "wolverine",
  "cjc-1295-ipamorelin",
  "ipamorelin",
  "mt1",
  "melanotan-2",
  "kpv",
  "kpv-ghk-cu",
  "bac-water",
  "sermorelin",
  "kisspeptin",
  "pt-141",
  "thymosin-alpha-1",
  "epithalon",
  "bpc-157",
  "tb-500",
  "semax",
  "selank",
  "selank-semax",
  "ss-31",
  "ss-31-mots-c",
  "igf1-lr3",
  "cagrilintide",
  "elora",
  "snap-8",
  "vip",
  "ghk-cu",
  "ahk-cu",
  "nad-plus",
  "glutathione",
  "klow",
  "glow",
  "dsip",
  "ara-290",
  "5-amino-1mq",
]);

export const CATALOG: CatalogProduct[] = ALL_PRODUCTS.filter((p) => ACTIVE_SLUGS.has(p.slug)).map(
  (p) => ({ ...p, image: `/images/cards/${p.slug}.jpg`, heroImage: `/images/cards/${p.slug}.jpg` }),
);

const NAME_TO_SLUG: Record<string, string> = CATALOG.reduce((acc, p) => {
  acc[p.name.toUpperCase()] = p.slug;
  return acc;
}, {} as Record<string, string>);

// Aliases for slight name variations across pages
const ALIASES: Record<string, string> = {
  "GHK-CU": "ghk-cu",
  "WOLVERINE (BPC-157 5MG, TB-500 5MG)": "wolverine",
  "WOLVERINE": "wolverine",
  "CJC-1295 + IPAMORELIN BLEND": "cjc-1295-ipamorelin",
  "CJC-1295 + IPAMORELIN": "cjc-1295-ipamorelin",
  "MT2": "melanotan-2",
  "MELANOTAN 2": "melanotan-2",
  "GLOW (GHK-CU 50MG, TB-500 10MG, BPC-157 10MG)": "glow",
  "KLOW (GHK-CU 80MG, TB-500 10MG, BPC-157 10MG, KPV 10MG)": "klow",
};

export function slugFor(name: string): string | undefined {
  const key = name.toUpperCase();
  return ALIASES[key] ?? NAME_TO_SLUG[key];
}

/**
 * Short "what kind of peptide is this" descriptor shown under the product name
 * on cards (Peptora-style). Keyed by slug so every page/name variant resolves
 * through slugFor(). Products intentionally omitted (multi-compound stacks)
 * fall back to their category label instead.
 */
const DESCRIPTORS_BY_SLUG: Record<string, string> = {
  "glp-3-rt": "Metabolic Research Peptide",
  "glp-2-tz": "Metabolic Research Peptide",
  "tesamorelin": "Growth Hormone Peptide",
  "mots-c": "Mitochondrial Research Peptide",
  "glow": "Tissue Repair Blend",
  "klow": "Tissue Repair Blend",
  "adamax": "Nootropic Research Peptide",
  "ara-290": "Anti-Inflammatory Research Peptide",
  "wolverine": "Tissue Repair Blend",
  "bac-water": "Sterile Reconstitution Solution",
  "cjc-1295-ipamorelin": "Growth Hormone Blend",
  "nad-plus": "Cellular Longevity Coenzyme",
  "mt1": "Melanocortin Research Peptide",
  "melanotan-2": "Melanocortin Research Peptide",
  "ghk-cu": "Copper Tissue Peptide",
  "5-amino-1mq": "Metabolic Research Compound",
  "kpv": "Anti-Inflammatory Research Peptide",
  "kpv-ghk-cu": "Tissue Repair Blend",
  "dsip": "Sleep Research Peptide",
  "bpc-157": "Tissue Repair Peptide",
  "tb-500": "Tissue Repair Peptide",
  "semax": "Neurological Research Peptide",
  "selank": "Anxiolytic Research Peptide",
  "ss-31": "Mitochondrial Research Peptide",
  "ll-37": "Antimicrobial Research Peptide",
  "ipamorelin": "Growth Hormone Peptide",
  "igf1-lr3": "Growth Factor Peptide",
  "sermorelin": "Growth Hormone Peptide",
  "cagrilintide": "Metabolic Research Peptide",
  "hcg": "Reproductive Hormone Peptide",
  "epithalon": "Longevity Research Peptide",
  "kisspeptin": "Reproductive Research Peptide",
  "pt-141": "Melanocortin Research Peptide",
  "thymosin-alpha-1": "Immune Support Peptide",
  "cjc-1295-with-dac": "Growth Hormone Peptide",
  "cjc-1295-no-dac": "Growth Hormone Peptide",
  "aod-9604": "Fat Metabolism Peptide",
  "glp-1-sm": "Metabolic Research Peptide",
  "selank-semax": "Neurological Research Blend",
  "ss-31-mots-c": "Mitochondrial Research Blend",
  "trifecta": "Advanced Research Bundle",
  "trifecta-deluxe": "Advanced Research Bundle",
  "neuro-duo": "Advanced Research Bundle",
  "shred-plus": "Advanced Research Bundle",
  "metabolic-reset": "Advanced Research Bundle",
  "peak-pulse": "Advanced Research Bundle",
};

/** Returns the short peptide-type descriptor for a product name, if defined. */
export function descriptorFor(name: string): string | undefined {
  const slug = slugFor(name);
  return slug ? DESCRIPTORS_BY_SLUG[slug] : undefined;
}

/** Public SEO slug on simpletide.com (`/product/{slug}`). */
export const SEO_PRODUCT_SLUG: Record<string, string> = {
  glow: "glow-70mg",
  klow: "klow-80mg",
  wolverine: "wolverine-10mg",
};

/** Legacy indexed URLs → catalog slug. */
export const LEGACY_PRODUCT_SLUG_TO_CATALOG: Record<string, string> = {
  "glow-70mg": "glow",
  "klow-80mg": "klow",
  "wolverine-10mg": "wolverine",
  "ebac-bac-water-30ml": "bac-water",
};

export function seoProductSlug(catalogSlug: string): string {
  return SEO_PRODUCT_SLUG[catalogSlug] ?? catalogSlug;
}

export function resolveCatalogSlug(input: string): string {
  const key = input.trim().toLowerCase();
  return LEGACY_PRODUCT_SLUG_TO_CATALOG[key] ?? key;
}

export function getProductBySlug(slug: string): CatalogProduct | undefined {
  const catalogSlug = resolveCatalogSlug(slug);
  return CATALOG.find((p) => p.slug === catalogSlug);
}

/** Strip a variant suffix ("Name - 10mg", "Name — 10mg", "Name · ...") → base product name. */
export function baseProductName(name: string): string {
  return name.split(/\s+[—–-]\s+/)[0].split(/\s+·\s+/)[0].trim();
}

/**
 * Resolve the highest bundle tier satisfied by `qty` for a given cart item name.
 * Mirrors the product page: per-product tiers when defined, else the global set.
 */
export function bundleTierForQty(name: string, qty: number): BundleTier | null {
  const slug = slugFor(baseProductName(name));
  const tiers = (slug ? getProductBySlug(slug)?.bundleTiers : undefined) ?? BUNDLE_TIERS;
  return [...tiers].reverse().find((t) => qty >= t.minQty) ?? null;
}

/**
 * Given a cart item's base unit price + quantity, compute the bundle discount.
 * Single source of truth used by the cart drawer, checkout, and subtotal math.
 */
export function discountedLine(
  name: string,
  unitPrice: number,
  qty: number,
): { pct: number; unit: number; lineTotal: number; baseTotal: number; savings: number } {
  const pct = bundleTierForQty(name, qty)?.discountPct ?? 0;
  const unit = Number((unitPrice * (1 - pct / 100)).toFixed(2));
  const lineTotal = Number((unit * qty).toFixed(2));
  const baseTotal = Number((unitPrice * qty).toFixed(2));
  return { pct, unit, lineTotal, baseTotal, savings: Number((baseTotal - lineTotal).toFixed(2)) };
}
