import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  answerLocal,
  buildContextBlock,
  buildSystemPrompt,
  extractProductSlugs,
  relevantProductDetails,
  type BotContext,
  type ChatMessage,
} from "@/lib/bot-knowledge";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

const ContextSchema = z
  .object({
    pathname: z.string().max(300).optional(),
    productSlug: z.string().max(120).optional(),
    cart: z
      .array(
        z.object({
          name: z.string().max(200),
          variant: z.string().max(60).optional(),
          qty: z.number().int().min(1).max(999),
          price: z.number().min(0).max(1_000_000),
        }),
      )
      .max(50)
      .optional(),
  })
  .optional();

/**
 * AI assistant endpoint. Runs server-side so the API key is never exposed.
 * If GEMINI_API_KEY is configured it uses Google Gemini for full conversational
 * answers (grounded with the current page + cart context); otherwise it falls
 * back to the built-in knowledge base so the bot always responds.
 *
 * Returns prose plus any product slugs the client should render as cards.
 */
export const askBot = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      messages: z.array(MessageSchema).min(1).max(40),
      context: ContextSchema,
    }),
  )
  .handler(
    async ({ data }): Promise<{ reply: string; productSlugs: string[]; source: "ai" | "kb" }> => {
      const { messages, context } = data;
      const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

      const apiKey =
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_GENAI_API_KEY ||
        process.env.GOOGLE_API_KEY;

      if (apiKey) {
        try {
          const reply = await askGemini(apiKey, messages, context);
          if (reply) return { reply, productSlugs: extractProductSlugs(reply), source: "ai" };
        } catch (err) {
          console.error("[askBot] Gemini error, falling back to knowledge base:", err);
        }
      }

      const ans = answerLocal(lastUser, context);
      return { reply: ans.reply, productSlugs: ans.productSlugs, source: "kb" };
    },
  );

async function askGemini(
  apiKey: string,
  messages: ChatMessage[],
  context?: BotContext,
): Promise<string> {
  // gemini-2.5-flash: current stable Flash model (GA). gemini-1.5-flash was
  // retired in 2025. Override with GEMINI_MODEL to try newer ones (e.g.
  // gemini-3-flash-preview) without a code change.
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const grounding = [buildContextBlock(context), relevantProductDetails(lastUser, context)]
    .filter(Boolean)
    .join("\n\n");

  const systemText = grounding
    ? `${buildSystemPrompt()}\n\nCURRENT CONTEXT:\n${grounding}`
    : buildSystemPrompt();

  const contents = messages.slice(-12).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body = {
    systemInstruction: { parts: [{ text: systemText }] },
    contents,
    generationConfig: { temperature: 0.5, maxOutputTokens: 800 },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text =
    json?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  return text.trim();
}
