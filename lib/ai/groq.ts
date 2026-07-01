import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

const GROQ_TIMEOUT_MS = 5000;

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
        WHERE deleted = false AND quantity < reorder_point AND reorder_point > 0
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

export async function callGroq(
  userMessage: string,
  context: LabContext | null | undefined,
  apiKey: string,
): Promise<string> {
  if (!context) {
    throw new Error("Failed to retrieve lab context");
  }

  const openai = new OpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey,
  });

  const prompt = buildPrompt(userMessage, context);
  const result = await Promise.race([
    openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1024,
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Groq API timeout")), GROQ_TIMEOUT_MS),
    ),
  ]);

  const choice = result.choices[0];
  if (!choice) throw new Error("No response choices returned from AI");
  if (choice.finish_reason === "content_filter") throw new Error("Response blocked by content filter");
  if (choice.finish_reason === "length") throw new Error("Response truncated due to length limit");
  if (!choice.message?.content) throw new Error("Empty response from AI");

  return choice.message.content;
}

export function validateApiKey(apiKey: string | null | undefined): apiKey is string {
  return apiKey !== null && apiKey !== undefined && apiKey.length > 0;
}
