'use client';

import { useEffect, useState } from 'react';
import { CreatePOForm } from '@/app/dashboard/purchase-orders/components/CreatePOForm';
import { ReorderSuggestion } from '@/components/SuggestionCards';

interface AISuggestionPODialogProps {
  suggestion: ReorderSuggestion | null;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Vendor {
  id: string;
  name: string;
}

/**
 * Dialog that opens the PO creation form with pre-filled data from an AI suggestion.
 * Allows user to:
 * 1. Select a vendor for the reorder
 * 2. Review/modify the suggested quantity
 * 3. Add unit price
 * 4. Create the PO (explicit user action - no auto-creation)
 */
export function AISuggestionPODialog({ suggestion, onClose, onSuccess }: AISuggestionPODialogProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [isLoadingVendors, setIsLoadingVendors] = useState(true);
  const [vendorsError, setVendorsError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Load vendors on mount or retry
  useEffect(() => {
    const abortController = new AbortController();

    const loadVendors = async () => {
      setIsLoadingVendors(true);
      setVendorsError(null);
      try {
        const response = await fetch('/api/vendors', { signal: abortController.signal });
        if (response.ok) {
          const data = await response.json();
          setVendors(data.vendors || []);
        } else if (response.status === 401) {
          setVendorsError('Session expired. Please log in and try again.');
        } else {
          setVendorsError('Failed to load vendors. Please try again.');
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        setVendorsError('Network error while loading vendors. Please try again.');
        console.error('Failed to load vendors:', error);
      } finally {
        setIsLoadingVendors(false);
      }
    };

    if (suggestion) {
      loadVendors();
    }

    return () => abortController.abort();
  }, [suggestion, retryCount]);

  if (!suggestion) {
    return null;
  }

  const handleVendorSelect = (vendorId: string) => {
    setSelectedVendorId(vendorId);
  };

  const handleBackToVendorSelection = () => {
    setSelectedVendorId('');
  };

  // If vendors aren't loaded yet, show a vendor selector
  if (isLoadingVendors || !selectedVendorId) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-background rounded-lg shadow-lg w-full max-w-md mx-4 p-6 space-y-4">
          <h2 className="text-xl font-semibold">Select Vendor for {suggestion.itemName}</h2>

          {isLoadingVendors ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading vendors...
            </div>
          ) : vendorsError ? (
            <div className="py-8 text-center space-y-4">
              <p className="text-destructive">{vendorsError}</p>
              <button
                onClick={() => setRetryCount((c) => c + 1)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          ) : vendors.length === 0 ? (
            <div className="py-8 text-center space-y-4 text-muted-foreground">
              <p>No vendors found. Please create a vendor first.</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {vendors.map((vendor) => (
                <button
                  key={vendor.id}
                  onClick={() => handleVendorSelect(vendor.id)}
                  className="w-full p-3 border rounded-lg hover:bg-muted text-left transition-colors font-medium"
                >
                  {vendor.name}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get selected vendor name
  const selectedVendor = vendors.find((v) => v.id === selectedVendorId);
  if (!selectedVendor) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-background rounded-lg shadow-lg w-full max-w-md mx-4 p-6 space-y-4">
          <h2 className="text-xl font-semibold text-destructive">Vendor Unavailable</h2>
          <p className="text-muted-foreground">
            The selected vendor is no longer available. Please go back and choose a different vendor.
          </p>
          <div className="flex gap-2 pt-4">
            <button
              onClick={handleBackToVendorSelection}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Back to Vendor Selection
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Prepare prefilled data for the PO form
  const prefilledData = {
    vendorId: selectedVendorId,
    vendorName: selectedVendor.name,
    items: [
      {
        itemName: suggestion.itemName,
        quantity: suggestion.suggestedQuantity,
        unitPrice: 0, // User will fill this in
      },
    ],
  };

  return (
    <CreatePOForm
      onClose={onClose}
      onSuccess={onSuccess}
      onBack={handleBackToVendorSelection}
      prefilledData={prefilledData}
    />
  );
}
