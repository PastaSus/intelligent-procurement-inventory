import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const GEMINI_TIMEOUT_MS = 8000;
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
const GROQ_TIMEOUT_MS = 8000;

interface LabContext {
  totalRooms: number;
  totalUnits: number;
  totalComponents: number;
  needsRepair: number;
  needsReplacement: number;
  lowStockParts: Array<{
    name: string;
    sku: string;
    quantity: number;
    reorderPoint: number;
  }>;
}

export async function getLabContext(): Promise<LabContext> {
  const [rooms, units, components, repairCount, replaceCount, lowStock] =
    await Promise.all([
      prisma.laboratoryRoom.count({ where: { deleted: false } }),
      prisma.computerUnit.count({ where: { deleted: false } }),
      prisma.computerComponent.count(),
      prisma.computerComponent.count({ where: { status: "NEEDS_REPAIR" } }),
      prisma.computerComponent.count({ where: { status: "NEEDS_REPLACEMENT" } }),
      prisma.$queryRaw<
        Array<{ name: string; sku: string; quantity: number; reorder_point: number }>
      >`
        SELECT name, sku, quantity, reorder_point
        FROM "InventoryItem"
        WHERE deleted = false AND quantity <= reorder_point AND reorder_point > 0
        ORDER BY quantity ASC
        LIMIT 10
      `,
    ]);

  return {
    totalRooms: rooms,
    totalUnits: units,
    totalComponents: components,
    needsRepair: repairCount,
    needsReplacement: replaceCount,
    lowStockParts: lowStock.map((item) => ({
      name: item.name,
      sku: item.sku,
      quantity: Number(item.quantity),
      reorderPoint: Number(item.reorder_point),
    })),
  };
}

export function buildPrompt(userMessage: string, context: LabContext): string {
  const lowStockList =
    context.lowStockParts.length > 0
      ? context.lowStockParts
          .map(
            (item) =>
              `- ${item.name} (SKU: ${item.sku}): ${item.quantity} units (reorder point: ${item.reorderPoint})`,
          )
          .join("\n")
      : "All spare parts are adequately stocked";

  return `You are an AI assistant for a laboratory computer asset management system.
You help users understand their lab hardware inventory and provide insights.

CURRENT LAB STATUS:
- Total laboratory rooms: ${context.totalRooms}
- Total computer units: ${context.totalUnits}
- Total hardware components tracked: ${context.totalComponents}
- Components needing repair: ${context.needsRepair}
- Components needing replacement: ${context.needsReplacement}

LOW STOCK SPARE PARTS:
${lowStockList}

User question: ${userMessage}

Provide a helpful, accurate response based on the data above. Keep responses concise and actionable.`;
}

export async function callGemini(
  prompt: string,
  apiKey: string,
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const result = await Promise.race([
    ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini API timeout")), GEMINI_TIMEOUT_MS),
    ),
  ]);

  const finishReason = result.candidates?.[0]?.finishReason;
  const blockedReasons: string[] = [
    "SAFETY",
    "RECITATION",
    "LANGUAGE",
    "BLOCKLIST",
    "PROHIBITED_CONTENT",
    "SPII",
    "IMAGE_SAFETY",
    "IMAGE_PROHIBITED_CONTENT",
  ];
  if (finishReason && blockedReasons.includes(finishReason)) {
    throw new Error("Response blocked by content filter");
  }
  if (finishReason === "MAX_TOKENS") {
    throw new Error("Response truncated due to length limit");
  }

  const text = result.text;
  if (!text) throw new Error("Empty response from AI");

  return text;
}

interface GroqChatResponse {
  choices?: Array<{
    message?: { content?: string | null };
    finish_reason?: string;
  }>;
}

export async function callGroq(prompt: string, apiKey: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1024,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Groq API error ${response.status}: ${body.slice(0, 200)}`);
    }

    const data = (await response.json()) as GroqChatResponse;
    const choice = data.choices?.[0];

    if (choice?.finish_reason === "content_filter") {
      throw new Error("Response blocked by content filter");
    }
    if (choice?.finish_reason === "length") {
      throw new Error("Response truncated due to length limit");
    }
    if (!choice?.message?.content) {
      throw new Error("Empty response from AI");
    }

    return choice.message.content;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Groq API timeout");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export interface AiApiKeys {
  gemini?: string | null;
  groq?: string | null;
}

export async function callAi(
  userMessage: string,
  context: LabContext | null | undefined,
  keys: AiApiKeys,
): Promise<string> {
  if (!context) {
    throw new Error("Failed to retrieve lab context");
  }

  const prompt = buildPrompt(userMessage, context);
  const errors: string[] = [];

  if (validateApiKey(keys.gemini)) {
    try {
      return await callGemini(prompt, keys.gemini);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Gemini: ${message}`);
      console.warn(`Gemini request failed; trying fallback. ${message}`);
    }
  }

  if (validateApiKey(keys.groq)) {
    try {
      return await callGroq(prompt, keys.groq);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Groq: ${message}`);
    }
  }

  if (errors.length === 0) {
    throw new Error("No AI provider configured");
  }

  throw new Error(errors.join(" | "));
}

export function validateApiKey(apiKey: string | null | undefined): apiKey is string {
  return apiKey !== null && apiKey !== undefined && apiKey.length > 0;
}
