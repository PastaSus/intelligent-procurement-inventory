import { ReorderSuggestion } from '@/components/SuggestionCards';

/**
 * Parses AI response to extract structured reorder suggestions.
 * Looks for patterns like:
 * - "Suggest ordering X units of [Product Name]"
 * - "Item: [Name], Quantity: X, Reason: [reason]"
 * - Numbered lists with item recommendations
 */
export function parseReorderSuggestions(aiResponse: string): ReorderSuggestion[] {
  const suggestions: ReorderSuggestion[] = [];
  
  // Pattern 1: "Item: X, Quantity: Y, Reason: Z"
  const pattern1 = /(?:^|\n)[-•*]?\s*(?:Item|Product):\s*([^,\n]+),\s*(?:Suggested\s+)?(?:Order\s+)?Quantity:\s*(\d+),\s*(?:Reason|Reasoning|Why):\s*([^\n]+)/gi;
  let match;
  
  while ((match = pattern1.exec(aiResponse)) !== null) {
    const itemName = match[1].trim();
    const quantity = parseInt(match[2], 10);
    const reasoning = match[3].trim();
    
    if (itemName && quantity > 0) {
      suggestions.push({
        id: `suggestion-${Date.now()}-${suggestions.length}`,
        itemName,
        currentStock: 0, // Will be updated with actual data
        suggestedQuantity: quantity,
        reasoning,
        confidenceLevel: determineConfidence(reasoning),
      });
    }
  }

  // Pattern 2: Numbered list pattern
  if (suggestions.length === 0) {
    const numberedPattern = /^\s*\d+[\.)]\s*([^:]+):\s*(?:Order|Suggest)\s+(\d+)\s*(?:units?)?\s*(?:[–-]\s*)?(.+?)(?=^\s*\d+[\.)]\s*|$)/gim;
    
    while ((match = numberedPattern.exec(aiResponse)) !== null) {
      const itemName = match[1].trim();
      const quantity = parseInt(match[2], 10);
      const reasoning = match[3].trim();
      
      if (itemName && quantity > 0) {
        suggestions.push({
          id: `suggestion-${Date.now()}-${suggestions.length}`,
          itemName,
          currentStock: 0,
          suggestedQuantity: quantity,
          reasoning: reasoning || 'Based on inventory analysis',
          confidenceLevel: determineConfidence(reasoning),
        });
      }
    }
  }

  // Pattern 3: Simple "X units of [Product]" format
  if (suggestions.length === 0) {
    const simplePattern = /(?:reorder|order|suggest|should order)\s+(\d+)\s+(?:units?\s+(?:of|for)\s+)?([^.!?\n]+)/gi;
    
    while ((match = simplePattern.exec(aiResponse)) !== null) {
      const quantity = parseInt(match[1], 10);
      const itemName = match[2].trim();
      
      if (itemName && quantity > 0 && !itemName.toLowerCase().includes('unit')) {
        suggestions.push({
          id: `suggestion-${Date.now()}-${suggestions.length}`,
          itemName,
          currentStock: 0,
          suggestedQuantity: quantity,
          reasoning: 'Based on inventory analysis and usage patterns',
          confidenceLevel: 'medium' as const,
        });
      }
    }
  }

  return suggestions;
}

/**
 * Determines confidence level based on reasoning keywords
 */
function determineConfidence(reasoning: string): 'low' | 'medium' | 'high' {
  const lowerReason = reasoning.toLowerCase();
  
  // High confidence keywords
  if (
    lowerReason.includes('recent sales') ||
    lowerReason.includes('monthly') ||
    lowerReason.includes('data') ||
    lowerReason.includes('analysis') ||
    lowerReason.includes('pattern') ||
    lowerReason.includes('trend')
  ) {
    return 'high';
  }
  
  // Low confidence keywords
  if (
    lowerReason.includes('estimate') ||
    lowerReason.includes('suggest') ||
    lowerReason.includes('might') ||
    lowerReason.includes('possibly') ||
    lowerReason.includes('uncertain')
  ) {
    return 'low';
  }
  
  // Default to medium
  return 'medium';
}

/**
 * Checks if AI response contains reorder suggestions
 */
export function hasReorderSuggestions(aiResponse: string): boolean {
  const keywords = ['reorder', 'order', 'suggest', 'quantity', 'units', 'stock'];
  const lowerResponse = aiResponse.toLowerCase();
  
  return keywords.some(keyword => lowerResponse.includes(keyword)) &&
         /\d+\s*(?:units?)?/.test(aiResponse);
}
