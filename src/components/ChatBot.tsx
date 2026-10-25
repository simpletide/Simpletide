import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { MessageCircle, X, Send, Sparkles, Plus, Check } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";
import { askBot } from "@/lib/api/chat.functions";
import type { BotContext, ChatMessage } from "@/lib/bot-knowledge";
import { getProductBySlug, seoProductSlug, type CatalogProduct } from "@/lib/catalog";
import { useCart } from "@/lib/cart-context";

type BotMessage = ChatMessage & { productSlugs?: string[] };

const STORAGE_KEY = "simpletide_chat_v1";

const GREETING: BotMessage = {
  role: "assistant",
  content:
    "Hi! I'm the Simpletide assistant. Ask me about products, pricing, shipping, payments, or COAs.",
};

const DEFAULT_SUGGESTIONS = [
  "What products do you offer?",
  "How long does shipping take?",
  "What payment methods do you accept?",
  "Do you provide COAs?",
];

const PRODUCT_SUGGESTIONS = [
  "Tell me about this product",
  "What sizes does it come in?",
  "How should I store it?",
  "Is it third-party lab tested?",
];

// Turn internal paths (/product/x, /coa-archive) and emails into clickable links.
function renderRich(text: string): ReactNode[] {
  const parts = text.split(/(\/product\/[a-z0-9-]+|\/products\/[a-z0-9-]+|\/coa-archive|\/checkout|\/products|[\w.+-]+@[\w-]+\.[\w.-]+)/gi);
  return parts.map((part, i) => {
    if (/^\/(product\/[a-z0-9-]+|products(\/[a-z0-9-]+)?|coa-archive|checkout)$/i.test(part)) {
      return (
        <a key={i} href={part} className="font-semibold text-[#8b5cf6] underline underline-offset-2 hover:text-[#a78bfa]">
          {part}
        </a>
      );
    }
    if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(part)) {
      return (
        <a key={i} href={`mailto:${part}`} className="font-semibold text-[#8b5cf6] underline underline-offset-2 hover:text-[#a78bfa]">
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function ProductCard({ product }: { product: CatalogProduct }) {
  const { addItem, openCart } = useCart();
  const [added, setAdded] = useState(false);
  const variant = product.variants.find((v) => v.price > 0) ?? product.variants[0];
  const buyable = variant?.price > 0;

  const handleAdd = () => {
    if (!buyable) return;
    addItem({
      id: `chatbot-${product.slug}--${variant.size}`,
      name: `${product.name} — ${variant.size}`,
      tag: product.category,
      price: variant.price,
      variant: variant.size,
    });
    setAdded(true);
    openCart();
    window.setTimeout(() => setAdded(false), 1600);
  };

  const productPath = `/product/${seoProductSlug(product.slug)}`;

  return (
    <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
      <a href={productPath} className="shrink-0">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-14 w-14 rounded-lg border border-slate-100 bg-slate-50 object-contain"
        />
      </a>
      <div className="min-w-0 flex-1">
        <a
          href={productPath}
          className="block truncate text-[13px] font-semibold text-slate-800 hover:text-[#8b5cf6]"
        >
          {product.name}
        </a>
        <p className="text-[12px] text-slate-500">
          {buyable ? `from $${Math.min(...product.variants.filter((v) => v.price > 0).map((v) => v.price))}` : "Coming soon"}
        </p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <a
            href={productPath}
            className="rounded-full border border-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors hover:border-[#a78bfa] hover:text-[#8b5cf6]"
          >
            View
          </a>
          {buyable && (
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] px-2.5 py-1 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              {added ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              {added ? "Added" : "Add to cart"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<BotMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { items } = useCart();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const productSlug = useMemo(() => {
    const m = pathname.match(/^\/(?:product|products)\/([a-z0-9-]+)$/i);
    return m && getProductBySlug(m[1]) ? m[1] : undefined;
  }, [pathname]);

  // Load saved conversation (survives reloads).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as BotMessage[];
        if (Array.isArray(saved) && saved.length) setMessages(saved);
      }
    } catch {}
    setHydrated(true);
  }, []);

  // Persist conversation.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {}
  }, [messages, hydrated]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    const next: BotMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);

    const context: BotContext = {
      pathname,
      productSlug,
      cart: items.map((i) => ({ name: i.name, variant: i.variant, qty: i.qty, price: i.price })),
    };

    try {
      const res = await askBot({
        data: {
          messages: next.slice(-20).map(({ role, content }) => ({ role, content })),
          context,
        },
      });
      setMessages((m) => [...m, { role: "assistant", content: res.reply, productSlugs: res.productSlugs }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Sorry, I had trouble responding. Please email support@simpletide.com and our team will help right away.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([GREETING]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const showSuggestions = messages.length <= 1 && !loading;
  const suggestions = productSlug ? PRODUCT_SUGGESTIONS : DEFAULT_SUGGESTIONS;

  return (
    <>
      {/* Launcher bubble */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open chat assistant"}
        className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] text-white shadow-[0_8px_28px_rgba(167,139,250,0.45)] transition-transform duration-200 hover:scale-105 active:scale-95"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-[60] flex h-[min(560px,72vh)] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.22)] font-sans">
          {/* Header */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] px-4 py-3.5 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight">Simpletide Assistant</p>
              <p className="text-[11px] leading-tight text-white/75">Typically replies instantly</p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              {messages.length > 1 && (
                <button
                  type="button"
                  onClick={clearChat}
                  className="rounded-full px-2 py-1 text-[11px] font-medium text-white/80 transition-colors hover:bg-white/15 hover:text-white"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-full p-1 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-3.5 py-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-br-sm bg-[#a78bfa] text-white"
                      : "rounded-bl-sm border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {msg.role === "assistant" ? renderRich(msg.content) : msg.content}
                </div>
                {msg.role === "assistant" && msg.productSlugs && msg.productSlugs.length > 0 && (
                  <div className="w-[92%] max-w-[300px]">
                    {msg.productSlugs
                      .map((slug) => getProductBySlug(slug))
                      .filter((p): p is CatalogProduct => Boolean(p))
                      .map((p) => (
                        <ProductCard key={p.slug} product={p} />
                      ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                </div>
              </div>
            )}

            {showSuggestions && (
              <div className="space-y-2 pt-1">
                {suggestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-left text-[13px] font-medium text-slate-700 transition-colors hover:border-[#a78bfa]/50 hover:bg-[#a78bfa]/[0.04]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-center gap-2 border-t border-slate-200 bg-white px-3 py-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              className="min-w-0 flex-1 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-[#a78bfa] focus:outline-none focus:ring-2 focus:ring-[#a78bfa]/25"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          <p className="bg-white pb-2 text-center text-[10px] text-slate-400">
            For research use only · Not medical advice
          </p>
        </div>
      )}
    </>
  );
}
