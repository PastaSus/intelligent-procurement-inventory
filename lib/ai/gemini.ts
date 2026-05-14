import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";

const GEMINI_TIMEOUT_MS = 5000;

interface InventoryContext {
  totalItems: number;
  lowStockItems: Array<{
    name: string;
    sku: string;
    quantity: number;
    reorderPoint: number;
  }>;
  recentPOs: Array<{
    poNumber: string;
    status: string;
    vendorName: string;
    createdAt: string;
  }>;
  vendors: Array<{
    name: string;
    email: string | null;
    phone: string | null;
  }>;
}

export async function getInventoryContext(): Promise<InventoryContext> {
  const [totalCountResult, lowStockItems, recentPOs, vendors] =
    await Promise.all([
      prisma.$queryRaw<
        [{ count: bigint }]
      >`SELECT COUNT(*) as count FROM "InventoryItem" WHERE deleted = false`,
      prisma.$queryRaw<
        Array<{
          name: string;
          sku: string;
          quantity: number;
          reorder_point: number;
        }>
      >`
      SELECT name, sku, quantity, reorder_point 
      FROM "InventoryItem" 
      WHERE deleted = false AND quantity < reorder_point AND reorder_point > 0
      ORDER BY quantity ASC
      LIMIT 10
    `,
      prisma.$queryRaw<
        Array<{
          po_number: string;
          status: string;
          name: string;
          created_at: Date;
        }>
      >`
      SELECT po.po_number, po.status, v.name, po.created_at
      FROM "PurchaseOrder" po
      JOIN "Vendor" v ON po.vendor_id = v.id
      WHERE po.deleted = false
      ORDER BY po.created_at DESC
      LIMIT 5
    `,
      prisma.$queryRaw<
        Array<{
          name: string;
          email: string | null;
          phone: string | null;
        }>
      >`
      SELECT name, email, phone 
      FROM "Vendor" 
      WHERE deleted = false
      ORDER BY name ASC
      LIMIT 10
    `,
    ]);

  return {
    totalItems: Number(totalCountResult[0]?.count || 0),
    lowStockItems: lowStockItems.map((item) => ({
      name: item.name,
      sku: item.sku,
      quantity: Number(item.quantity),
      reorderPoint: Number(item.reorder_point),
    })),
    recentPOs: recentPOs.map((po) => ({
      poNumber: po.po_number,
      status: po.status,
      vendorName: po.name,
      createdAt: po.created_at.toISOString(),
    })),
    vendors: vendors.map((v) => ({
      name: v.name,
      email: v.email,
      phone: v.phone,
    })),
  };
}

export function buildPrompt(
  userMessage: string,
  context: InventoryContext,
): string {
  const lowStockList =
    context.lowStockItems.length > 0
      ? context.lowStockItems
          .map(
            (item) =>
              `- ${item.name} (SKU: ${item.sku}): ${item.quantity} units (reorder point: ${item.reorderPoint})`,
          )
          .join("\n")
      : "No items currently at low stock";

  const recentPOList =
    context.recentPOs.length > 0
      ? context.recentPOs
          .map(
            (po) =>
              `- ${po.poNumber} (${po.status}) - Vendor: ${po.vendorName} - Created: ${po.createdAt}`,
          )
          .join("\n")
      : "No recent purchase orders";

  const vendorList =
    context.vendors.length > 0
      ? context.vendors
          .map((v) => `- ${v.name}${v.email ? ` (${v.email})` : ""}`)
          .join("\n")
      : "No vendors available";

  return `You are an AI assistant for an intelligent procurement and inventory management system. 
You help users understand their inventory data and provide insights.

CURRENT INVENTORY DATA:
- Total inventory items: ${context.totalItems}
- Low stock items (below reorder point):
${lowStockList}

RECENT PURCHASE ORDERS:
${recentPOList}

AVAILABLE VENDORS:
${vendorList}

User question: ${userMessage}

Provide a helpful, accurate response based on the data above. If you don't have enough information to answer the question, say so. Keep responses concise and actionable.`;
}

export async function callGemini(
  userMessage: string,
  context: InventoryContext,
  apiKey: string,
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  const prompt = buildPrompt(userMessage, context);

  const result = await Promise.race([
    ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    }),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Gemini API timeout")),
        GEMINI_TIMEOUT_MS,
      ),
    ),
  ]);

  return result.text || "";
}

export function validateApiKey(
  apiKey: string | null | undefined,
): apiKey is string {
  return apiKey !== null && apiKey !== undefined && apiKey.length > 0;
}
