'use client';

import { ShoppingCart, Lightbulb, TrendingDown, X } from 'lucide-react';
import Link from 'next/link';

export interface ReorderSuggestion {
  id: string;
  itemName: string;
  currentStock: number;
  suggestedQuantity: number;
  reasoning: string;
  confidenceLevel: 'low' | 'medium' | 'high';
  estimatedDailyUsage?: number;
  daysOfStock?: number;
}

interface SuggestionCardsProps {
  suggestions: ReorderSuggestion[];
  onCreatePO: (suggestion: ReorderSuggestion) => void;
  onDismiss?: (suggestionId: string) => void;
}

export function SuggestionCards({ suggestions, onCreatePO, onDismiss }: SuggestionCardsProps) {
  if (suggestions.length === 0) {
    return null;
  }

  const confidenceColors = {
    low: 'bg-yellow-50 border-yellow-200',
    medium: 'bg-blue-50 border-blue-200',
    high: 'bg-green-50 border-green-200',
  };

  const confidenceBgColors = {
    low: 'bg-yellow-100 text-yellow-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-green-100 text-green-800',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-6 py-3 bg-amber-50 border border-amber-200 rounded-lg">
        <Lightbulb className="h-5 w-5 text-amber-600" />
        <p className="text-sm font-medium text-amber-900">
          AI suggests reordering {suggestions.length} item{suggestions.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className={`border rounded-lg p-4 space-y-3 ${confidenceColors[suggestion.confidenceLevel]}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{suggestion.itemName}</h4>
                <p className="text-sm text-muted-foreground">
                  Current stock: {suggestion.currentStock} units
                </p>
              </div>
              {onDismiss && (
                <button
                  onClick={() => onDismiss(suggestion.id)}
                  className="p-1 hover:bg-black/10 rounded transition-colors"
                  aria-label="Dismiss suggestion"
                  title="Dismiss this suggestion"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Suggested Quantity */}
            <div className="bg-white/50 rounded p-3 space-y-2">
              <p className="text-sm text-muted-foreground">Suggested order quantity:</p>
              <p className="text-2xl font-bold text-primary">{suggestion.suggestedQuantity} units</p>
              {suggestion.daysOfStock && (
                <p className="text-xs text-muted-foreground">
                  This would provide ~{suggestion.daysOfStock} days of stock
                </p>
              )}
            </div>

            {/* Reasoning */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Why?</p>
              <p className="text-sm text-muted-foreground">{suggestion.reasoning}</p>
            </div>

            {/* Confidence Level */}
            <div className="flex items-center justify-between pt-2 border-t border-current border-opacity-20">
              <span className={`text-xs font-semibold px-2 py-1 rounded ${confidenceBgColors[suggestion.confidenceLevel]}`}>
                {suggestion.confidenceLevel.charAt(0).toUpperCase() + suggestion.confidenceLevel.slice(1)} confidence
              </span>

              {suggestion.estimatedDailyUsage && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  ~{suggestion.estimatedDailyUsage}/day
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => onCreatePO(suggestion)}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Create PO
              </button>
              <button
                onClick={() => onDismiss?.(suggestion.id)}
                className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors text-sm font-medium"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center py-2">
        💡 You can edit quantities before creating a purchase order
      </p>
    </div>
  );
}
