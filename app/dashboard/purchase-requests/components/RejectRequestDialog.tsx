'use client';

import { useState, useTransition } from 'react';
import { rejectPurchaseRequest } from '@/app/_actions/purchase-requests';
import { Button } from '@/components/ui/button';
import { useToast } from '@/lib/toast-context';
import { X, XCircle } from 'lucide-react';

interface PurchaseRequest {
  id: string;
  pr_number: string;
}

interface RejectRequestDialogProps {
  request: PurchaseRequest;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RejectRequestDialog({ request, onClose, onSuccess }: RejectRequestDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  const [reason, setReason] = useState('');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!reason.trim()) {
      addToast('Rejection reason is required', 'error');
      return;
    }

    const formData = new FormData();
    formData.set('id', request.id);
    formData.set('reason', reason.trim());

    startTransition(async () => {
      const result = await rejectPurchaseRequest(formData);
      if (!result.success) {
        addToast(result.error || 'Failed to reject request', 'error');
      } else {
        addToast(`Request ${request.pr_number} rejected`, 'success');
        if (onSuccess) onSuccess();
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold">Reject Request</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-muted-foreground mb-4">
          Rejecting <strong className="text-foreground">{request.pr_number}</strong>. Provide a reason for the rejection.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reason" className="block text-sm font-medium mb-1">Reason <span className="text-destructive">*</span></label>
            <textarea
              id="reason"
              name="reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this request is being rejected..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              required
              disabled={isPending}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
            <Button type="submit" variant="destructive" disabled={isPending || !reason.trim()}>
              {isPending ? 'Rejecting...' : 'Reject Request'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
