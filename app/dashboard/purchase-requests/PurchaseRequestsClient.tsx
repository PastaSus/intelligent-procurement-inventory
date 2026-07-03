'use client';

import { useState, useMemo, useTransition, useCallback } from 'react';
import { ShoppingCart, Plus, Search, X, ChevronUp, ChevronDown, Pencil, CheckCircle, XCircle, Package, Ban, Send, ExternalLink } from 'lucide-react';
import { CreateRequestForm } from './components/CreateRequestForm';
import { RejectRequestDialog } from './components/RejectRequestDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { submitPurchaseRequest, fulfillPurchaseRequest, approvePurchaseRequest } from '@/app/_actions/purchase-requests';

interface RequestItem {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: string | null;
  total: string | null;
  created_at: Date;
  updated_at: Date;
}

interface PurchaseRequest {
  id: string;
  pr_number: string;
  status: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
  updated_by: string | null;
  items: RequestItem[];
}

interface PurchaseRequestsClientProps {
  initialRequests: PurchaseRequest[];
  isAdmin: boolean;
}

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  REQUESTED: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  FULFILLED: 'bg-purple-100 text-purple-800',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || ''}`}>
      {status}
    </span>
  );
}

export function PurchaseRequestsClient({ initialRequests, isAdmin }: PurchaseRequestsClientProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'pr_number' | 'status' | 'total' | 'updated_at'>('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [rejectingRequest, setRejectingRequest] = useState<PurchaseRequest | null>(null);

  const handleSuccess = useCallback(() => {
    setIsFormOpen(false);
    window.location.reload();
  }, []);

  const handleAction = useCallback(async (action: string, request: PurchaseRequest) => {
    const formData = new FormData();
    formData.set('id', request.id);

    startTransition(async () => {
      let result;
      switch (action) {
        case 'submit':
          result = await submitPurchaseRequest(formData);
          break;
        case 'approve':
          result = await approvePurchaseRequest(formData);
          break;
        case 'fulfill':
          result = await fulfillPurchaseRequest(formData);
          break;
      }
      if (result?.success) {
        window.location.reload();
      } else {
        alert(result?.error || `Failed to ${action} request`);
      }
    });
  }, []);

  const filteredItems = useMemo(() => {
    let result = [...requests];

    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        r => r.pr_number.toLowerCase().includes(searchLower) ||
             r.items.some(item => item.item_name.toLowerCase().includes(searchLower)) ||
             (r.notes || '').toLowerCase().includes(searchLower)
      );
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'pr_number':
          comparison = a.pr_number.localeCompare(b.pr_number);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'updated_at':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [requests, statusFilter, search, sortBy, sortOrder]);

  function handleSort(column: typeof sortBy) {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  }

  function SortHeader({ column, label }: { column: typeof sortBy; label: string }) {
    const isActive = sortBy === column;
    return (
      <button
        onClick={() => handleSort(column)}
        className="flex items-center gap-1 hover:bg-muted/50 px-2 py-1 rounded transition-colors"
      >
        <span>{label}</span>
        {isActive && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
      </button>
    );
  }

  function formatDate(date: Date) {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const statuses = ['all', 'DRAFT', 'REQUESTED', 'APPROVED', 'REJECTED', 'FULFILLED'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Purchase Requests</h2>
          <p className="text-muted-foreground">Track and manage internal procurement</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Request
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by PR number or item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map(s => (
              <SelectItem key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Total: {requests.length} requests</span>
            </div>
            <span className="text-muted-foreground">|</span>
            <span className="text-sm text-muted-foreground">Showing {filteredItems.length}</span>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No purchase requests found.</p>
            <p className="text-sm">Click &quot;New Request&quot; to create one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 text-sm font-medium"><SortHeader column="pr_number" label="PR Number" /></th>
                  <th className="text-left p-3 text-sm font-medium">Items</th>
                  <th className="text-center p-3 text-sm font-medium">Qty</th>
                  <th className="text-center p-3 text-sm font-medium"><SortHeader column="status" label="Status" /></th>
                  <th className="text-right p-3 text-sm font-medium">Total</th>
                  <th className="text-center p-3 text-sm font-medium"><SortHeader column="updated_at" label="Updated" /></th>
                  <th className="text-center w-[180px] p-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((req) => {
                  const totalQty = req.items.reduce((sum, i) => sum + i.quantity, 0);
                  const totalCost = req.items.reduce((sum, i) => {
                    const price = i.unit_price ? parseFloat(i.unit_price) : 0;
                    return sum + price * i.quantity;
                  }, 0);

                  return (
                    <tr key={req.id} className="border-b last:border-b-0 hover:bg-muted/30" tabIndex={0}>
                      <td className="p-3">
                        <span className="font-mono font-medium text-sm">{req.pr_number}</span>
                        {req.notes && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px] mt-0.5">{req.notes}</p>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          {req.items.slice(0, 2).map(item => (
                            <span key={item.id} className="block truncate max-w-[200px]">{item.item_name}</span>
                          ))}
                          {req.items.length > 2 && (
                            <span className="text-xs text-muted-foreground">+{req.items.length - 2} more</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center text-sm">{totalQty}</td>
                      <td className="p-3 text-center"><StatusBadge status={req.status} /></td>
                      <td className="p-3 text-right text-sm tabular-nums">
                        {totalCost > 0 ? `$${totalCost.toFixed(2)}` : '-'}
                      </td>
                      <td className="p-3 text-center text-sm text-muted-foreground">{formatDate(req.updated_at)}</td>
                      <td className="p-3 text-center w-[180px]">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {req.status === 'DRAFT' && (
                            <button
                              onClick={() => handleAction('submit', req)}
                              disabled={isPending}
                              className="p-1.5 hover:bg-blue-100 rounded-md text-blue-700 hover:text-blue-800 transition-colors"
                              title="Submit for Approval"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          )}
                          {req.status === 'REQUESTED' && isAdmin && (
                            <>
                              <button
                                onClick={() => handleAction('approve', req)}
                                disabled={isPending}
                                className="p-1.5 hover:bg-green-100 rounded-md text-green-700 hover:text-green-800 transition-colors"
                                title="Approve"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setRejectingRequest(req)}
                                disabled={isPending}
                                className="p-1.5 hover:bg-red-100 rounded-md text-red-700 hover:text-red-800 transition-colors"
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {req.status === 'APPROVED' && (
                            <button
                              onClick={() => handleAction('fulfill', req)}
                              disabled={isPending}
                              className="p-1.5 hover:bg-purple-100 rounded-md text-purple-700 hover:text-purple-800 transition-colors"
                              title="Mark Fulfilled"
                            >
                              <Package className="h-4 w-4" />
                            </button>
                          )}
                          {(req.status === 'REJECTED' || req.status === 'FULFILLED') && (
                            <span className="text-xs text-muted-foreground italic">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isFormOpen && (
        <CreateRequestForm onClose={() => setIsFormOpen(false)} onSuccess={handleSuccess} />
      )}

      {rejectingRequest && (
        <RejectRequestDialog
          request={rejectingRequest}
          onClose={() => setRejectingRequest(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
