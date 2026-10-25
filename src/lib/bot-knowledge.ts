import { CATALOG, getProductBySlug, seoProductSlug, type CatalogProduct } from "@/lib/catalog";

export type ChatMessage = { role: "user" | "assistant"; content: string };

/** Lightweight cart snapshot the client sends so the bot can answer cart questions. */
export type CartContextItem = { name: string; variant?: string; qty: number; price: number };

/** Runtime context the client attaches to each request. */
export type BotContext = {
  pathname?: string;
  /** Slug of the product page the user is currently viewing, if any. */
  productSlug?: string;
  cart?: CartContextItem[];
};

/** Structured answer: prose reply plus any product slugs to render as cards. */
export type BotAnswer = { reply: string; productSlugs: string[] };

export const SUPPORT_EMAIL = "support@simpletide.com";
export const SALES_EMAIL = "sales@simpletide.com";
export const PHONE = "(000) 000-0000";

// Tokens too generic to identify a specific product by name.
const STOP = new Set([
  "research",
  "compound",
  "compounds",
  "peptide",
  "peptides",
  "blend",
  "stack",
  "the",
  "and",
  "new",
  "best",
  "selling",
  "grade",
  "vial",
  "vials",
]);

function priceRange(p: CatalogProduct): string | null {
  const prices = p.variants.map((v) => v.price).filter((n) => n > 0);
  if (!prices.length) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? `$${min}` : `$${min}–$${max}`;
}

function lowestPrice(p: CatalogProduct): number | null {
  const prices = p.variants.map((v) => v.price).filter((n) => n > 0);
  return prices.length ? Math.min(...prices) : null;
}

/** Lightweight keyword matcher: returns the catalog products most likely referenced. */
export function findProducts(message: string): CatalogProduct[] {
  const m = " " + message.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ") + " ";
  const scored = CATALOG.map((p) => {
    const hay = `${p.name} ${p.slug.replace(/-/g, " ")} ${p.subtitle ?? ""}`
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ");
    const tokens = Array.from(new Set(hay.split(/\s+/).filter((t) => t.length >= 3 && !STOP.has(t))));
    let score = 0;
    for (const t of tokens) if (m.includes(` ${t} `)) score++;
    return { p, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map((x) => x.p);
}

const ATTRIBUTE_RE =
  /\b(size|sizes|mg|price|prices|cost|how much|purity|pure|tested|storage|store|keep|fridge|refrigerate|reconstitut|mix|bac water|bacteriostatic|stock|available|availability|spec|specs)\b/;

function isAttributeQuestion(m: string): boolean {
  return ATTRIBUTE_RE.test(m);
}

/**
 * Determine which product(s) a message is about. Falls back to the product the
 * user is currently viewing when they use a pronoun ("this", "it") or ask an
 * attribute question without naming a product.
 */
function focusProducts(message: string, context?: BotContext): CatalogProduct[] {
  const matched = findProducts(message);
  if (matched.length) return matched;

  const m = message.toLowerCase();
  const refersCurrent = /\b(this|that|it|these|those|the product|this one)\b/.test(m) || isAttributeQuestion(m);
  if (refersCurrent && context?.productSlug) {
    const p = getProductBySlug(context.productSlug);
    if (p) return [p];
  }
  return [];
}

/** Rich, detail-level description of one product (used for deep KB answers + AI grounding). */
export function productDetail(p: CatalogProduct): string {
  const sizes = p.variants
    .map((v) => `${v.size}${v.price > 0 ? ` ($${v.price})` : ""}`)
    .join(", ");
  const purity = p.variants[0]?.purity;
  const lines: string[] = [];
  lines.push(`${p.name}${p.subtitle ? ` — ${p.subtitle}` : ""}`);
  lines.push(p.description);
  if (sizes) lines.push(`Sizes: ${sizes}.`);
  if (purity) lines.push(`Purity: ${purity} (third-party lab tested).`);
  if (p.researchNotes) lines.push(`Reconstitution/handling: ${p.researchNotes}`);
  if (p.storage) lines.push(`Storage: ${p.storage}`);
  return lines.join(" ");
}

function summarizeCart(cart: CartContextItem[]): string {
  if (!cart.length) {
    return "Your cart is empty right now. You can browse everything at /products and I can help you pick.";
  }
  const lines = cart.map(
    (i) => `• ${i.name}${i.qty > 1 ? ` ×${i.qty}` : ""} — $${(i.price * i.qty).toFixed(2)}`,
  );
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  return `You have ${cart.reduce((s, i) => s + i.qty, 0)} item(s) in your cart:\n${lines.join(
    "\n",
  )}\nSubtotal: $${subtotal.toFixed(2)} (bundle discounts are applied at checkout). Ready when you are — head to /checkout.`;
}

/**
 * Rule-based answer engine used when no AI key is configured. Context-aware
 * (current page + cart) with deep per-product answers and strict
 * research-use guardrails. Returns prose plus product slugs to render as cards.
 */
export function answerLocal(message: string, context?: BotContext): BotAnswer {
  const m = message.toLowerCase();
  const has = (...words: string[]) => words.some((w) => m.includes(w));
  const out = (reply: string, products: CatalogProduct[] = []): BotAnswer => ({
    reply,
    productSlugs: Array.from(new Set(products.map((p) => p.slug))).slice(0, 3),
  });

  // Safety / medical guardrail — always first.
  if (
    has(
      "dose",
      "dosage",
      "how much should",
      "inject",
      "how to take",
      "how do i take",
      "cycle",
      "protocol for",
      "side effect",
      "consume",
      "human use",
      "for humans",
      "take it",
      "is it safe to",
    )
  ) {
    return out(
      `Our products are sold strictly for laboratory and research use only — they are not for human consumption, so I can't provide dosing, medical, or usage guidance. I can help with research specs like purity, storage, and reconstitution on each product page, or you can reach our team at ${SUPPORT_EMAIL}.`,
    );
  }

  if (/^\s*(hi|hello|hey|yo|sup|good (morning|afternoon|evening))\b/.test(m)) {
    return out(
      "Hi! I'm the Simpletide assistant. I can help with products, pricing, shipping, payments, COAs, and orders. What can I help you find?",
    );
  }

  // Cart questions.
  if (has("my cart", "in the cart", "in my cart", "cart total", "what did i add", "my basket")) {
    return out(summarizeCart(context?.cart ?? []));
  }

  // Deep, per-product answers when a product is in focus (named or current page).
  const focus = focusProducts(message, context);
  if (focus.length === 1) {
    const p = focus[0];
    const range = priceRange(p);

    if (has("size", "sizes", "mg", "how many mg", "variant", "options")) {
      const sizes = p.variants.map((v) => `${v.size}${v.price > 0 ? ` — $${v.price}` : ""}`).join("\n");
      return out(`${p.name} is available in:\n${sizes}`, [p]);
    }
    if (has("price", "prices", "cost", "how much", "pricing")) {
      const sizes = p.variants
        .filter((v) => v.price > 0)
        .map((v) => `${v.size} — $${v.price}`)
        .join("\n");
      return out(
        sizes
          ? `${p.name} pricing:\n${sizes}\nBuy multiple vials and bundle discounts (5–10%) apply automatically at checkout.`
          : `Pricing for ${p.name} is coming soon — email ${SALES_EMAIL} and we'll help.`,
        [p],
      );
    }
    if (has("purity", "pure", "tested", "lab", "coa", "certificate", "analysis")) {
      const purity = p.variants[0]?.purity ?? "99%+";
      return out(
        `${p.name} is third-party lab tested at ${purity} purity. You can view its Certificate of Analysis in our archive at /coa-archive, or email ${SUPPORT_EMAIL} for a specific lot.`,
        [p],
      );
    }
    if (has("store", "storage", "keep", "fridge", "refrigerate", "shelf")) {
      return out(`Storage for ${p.name}: ${p.storage}`, [p]);
    }
    if (has("reconstitut", "mix", "bac water", "bacteriostatic", "dissolve", "prepare")) {
      return out(`Reconstitution & handling for ${p.name}: ${p.researchNotes} (For laboratory use only.)`, [p]);
    }
    if (has("stock", "available", "availability", "in stock")) {
      return out(
        `${p.name} is available to order${range ? ` (${range})` : ""} — you can add it to your cart from its product page. If a size is ever unavailable it won't be selectable at checkout.`,
        [p],
      );
    }
    // Generic "tell me about this" → full detail + card.
    if (has("tell me about", "what is", "what's", "info", "detail", "explain", "about this") || context?.productSlug === p.slug) {
      return out(
        `${p.name}${range ? ` (${range})` : ""}: ${p.description} It's third-party lab tested${
          p.variants[0]?.purity ? ` at ${p.variants[0].purity} purity` : ""
        } and ships free in 2–3 business days. Full specs are on its page below. (For research use only.)`,
        [p],
      );
    }
  }

  // General store intents.
  if (has("ship", "shipping", "delivery", "deliver", "arrive", "how long", "tracking", "track my")) {
    return out(
      `We offer FREE shipping on every order, sent via USPS Priority with an estimated 2–3 business days in transit. A tracking number is emailed once your order ships. For a specific order, email ${SUPPORT_EMAIL} with your order number.`,
    );
  }

  if (has("pay", "payment", "card", "credit", "debit", "venmo", "checkout", "how do i buy", "purchase", "order online")) {
    return out(
      "You can check out with a credit/debit card or Venmo. Add items to your cart, go to checkout, choose your payment method, and place your order — card payments are processed securely.",
    );
  }

  if (has("discount", "bundle", "bulk", "wholesale", "save", "deal", "coupon", "promo", "cheaper", "quantity")) {
    return out(
      `We have automatic bundle pricing: buy 2 vials and save 5%, 3 vials save 7%, and 5+ vials save 10% — applied at checkout. For larger or wholesale orders, email ${SALES_EMAIL} for a custom quote.`,
    );
  }

  if (has("coa", "certificate", "lab test", "lab-test", "third party", "third-party", "purity", "tested", "analysis")) {
    return out(
      `Every batch is third-party lab tested. You can browse our full Certificate of Analysis archive on the COA page (/coa-archive). Need a specific batch? Email ${SUPPORT_EMAIL} with the lot number.`,
    );
  }

  if (has("refund", "return", "damaged", "broken", "wrong", "missing", "cancel my", "didn't arrive", "didnt arrive")) {
    return out(
      `Sorry for the trouble! Please email ${SUPPORT_EMAIL} right away with your order number (and a photo if it arrived damaged) and we'll arrange a replacement or refund as fast as possible.`,
    );
  }

  if (has("contact", "human", "agent", "representative", "speak", "talk to", "phone", "call", "email", "reach", "support team")) {
    return out(
      `You can reach our team at ${SUPPORT_EMAIL} (support) or ${SALES_EMAIL} (sales), or text/call ${PHONE} (Mon–Fri, 10am–7pm EST). We typically respond within 24 hours.`,
    );
  }

  if (has("store", "storage", "fridge", "refrigerate", "reconstitute", "reconstitution", "mix", "bac water", "bacteriostatic")) {
    return out(
      "Most compounds ship as lyophilized powder: store at 2–8°C protected from light, and refrigerate after reconstitution with bacteriostatic (BAC) water. Exact storage notes are on each product page. (Handling guidance is for laboratory use only.)",
    );
  }

  if (has("account", "log in", "login", "sign up", "signup", "register", "order history", "my orders")) {
    return out(
      `You can create an account or log in from the top of the site to keep track of your orders. To look up a specific order, you can also email ${SUPPORT_EMAIL} with your order number.`,
    );
  }

  // Recommendations / goal-based discovery.
  if (has("recommend", "suggest", "which", "what should i", "best for", "good for", "looking for", "research on", "studying", "for my")) {
    const matches = findProducts(message);
    if (matches.length) {
      return out(
        `Based on that, these may be a good fit:\n${matches
          .map((p) => `• ${p.name}${lowestPrice(p) ? ` (from $${lowestPrice(p)})` : ""}`)
          .join("\n")}\nWant details on any of them?`,
        matches,
      );
    }
    return out(
      "Happy to help you choose. Tell me a bit about your research focus (e.g. metabolic, recovery, longevity, skin/cosmetic) and I'll point you to the most relevant compounds — or browse them all at /products.",
    );
  }

  // Plain product mentions → cards.
  const products = findProducts(message);
  if (products.length === 1) {
    const top = products[0];
    const r = priceRange(top);
    return out(
      `${top.name}${r ? ` (${r})` : ""}: ${top.description} (For research use only.)`,
      [top],
    );
  }
  if (products.length > 1) {
    return out(
      `Here are a few that match:\n${products
        .map((p) => `• ${p.name}${lowestPrice(p) ? ` — from $${lowestPrice(p)}` : ""}`)
        .join("\n")}\nWant details on any one of them?`,
      products,
    );
  }

  if (has("price", "cost", "how much", "pricing")) {
    return out(
      "Pricing varies by product and vial size, with automatic bundle discounts (5–10% off) for multiple vials. Tell me which compound you're interested in and I'll give you the price, or browse them all at /products.",
    );
  }

  if (has("product", "sell", "offer", "catalog", "what do you have", "shop")) {
    return out(
      "We carry a full range of research-grade compounds — you can browse everything at /products. Tell me what you're researching and I'll point you to the most relevant options.",
    );
  }

  return out(
    `I can help with our products, pricing, shipping (free, 2–3 days), payments (card or Venmo), COAs, and orders. Could you tell me a bit more about what you're looking for? For anything else, email ${SUPPORT_EMAIL}.`,
  );
}

/** Plain-string convenience wrapper (kept for any non-card callers). */
export function localAnswer(message: string, context?: BotContext): string {
  return answerLocal(message, context).reply;
}

/** Human-readable description of the current page + cart for AI grounding. */
export function buildContextBlock(context?: BotContext): string {
  if (!context) return "";
  const parts: string[] = [];
  if (context.productSlug) {
    const p = getProductBySlug(context.productSlug);
    if (p) parts.push(`The user is currently viewing the product page for: ${p.name} (/product/${seoProductSlug(p.slug)}).`);
  } else if (context.pathname) {
    parts.push(`The user is currently on the page: ${context.pathname}.`);
  }
  if (context.cart && context.cart.length) {
    const items = context.cart
      .map((i) => `${i.name}${i.qty > 1 ? ` x${i.qty}` : ""} ($${i.price})`)
      .join("; ");
    parts.push(`The user's cart currently contains: ${items}.`);
  } else if (context.cart) {
    parts.push("The user's cart is currently empty.");
  }
  return parts.join("\n");
}

/** Full details for products relevant to the latest message (AI grounding). */
export function relevantProductDetails(message: string, context?: BotContext): string {
  const products = focusProducts(message, context);
  if (!products.length) return "";
  return "RELEVANT PRODUCT DETAILS:\n" + products.map((p) => `- ${productDetail(p)}`).join("\n");
}

/** Extract product slugs referenced as /product/<slug> or legacy /products/<slug> in AI reply text. */
export function extractProductSlugs(text: string): string[] {
  const slugs = new Set<string>();
  const re = /\/(?:product|products)\/([a-z0-9-]+)/gi;
  let mch: RegExpExecArray | null;
  while ((mch = re.exec(text))) {
    const slug = mch[1].toLowerCase();
    if (getProductBySlug(slug)) slugs.add(slug);
  }
  return Array.from(slugs).slice(0, 3);
}

/** System prompt for the AI model (used when a GEMINI_API_KEY is configured). */
export function buildSystemPrompt(): string {
  const products = CATALOG.filter((p) => p.variants.some((v) => v.price > 0))
    .map((p) => {
      const r = priceRange(p);
      return `- ${p.name}${r ? ` (${r})` : ""} [/product/${seoProductSlug(p.slug)}]: ${p.tagline}`;
    })
    .join("\n");

  return `You are the customer assistant for the Simpletide website. Be warm, concise, and genuinely helpful.

ABOUT: Simpletide sells premium, third-party lab-tested research compounds for laboratory use.

KEY FACTS:
- Shipping: FREE, USPS Priority, estimated 2–3 business days, tracking emailed.
- Payments accepted: credit/debit card and Venmo.
- Bundle discounts (applied automatically at checkout): 2 vials = 5% off, 3 vials = 7% off, 5+ vials = 10% off. Bulk/wholesale: email ${SALES_EMAIL}.
- COAs: every batch is lab tested; the full archive is at /coa-archive.
- Contact: ${SUPPORT_EMAIL} (support), ${SALES_EMAIL} (sales), phone/text ${PHONE} (Mon–Fri 10am–7pm EST). Replies within 24 hours.
- Returns/issues: email ${SUPPORT_EMAIL} with the order number.

PRODUCTS (name, price range, page link, tagline):
${products}

CRITICAL RULES:
- All products are for laboratory research use only — NOT for human consumption.
- NEVER provide medical advice, dosing, administration, cycling, or health guidance. If asked, politely decline, note research-use-only, and point to the product specs or ${SUPPORT_EMAIL}.
- Do not invent products, prices, or policies. If you're unsure, suggest emailing ${SUPPORT_EMAIL}.
- Keep answers short (2–5 sentences). When you recommend or mention a product, ALWAYS include its page link in the exact form /product/<slug> so the site can show a product card.
- Use the CURRENT CONTEXT and RELEVANT PRODUCT DETAILS below to answer about "this" product or the user's cart.`;
}
