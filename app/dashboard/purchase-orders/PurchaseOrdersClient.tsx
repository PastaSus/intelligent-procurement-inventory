'use client';

import { useState, useMemo, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Search, X, Pencil, Trash2, Check, Send, Download } from 'lucide-react';
import { CreatePOForm } from './components/CreatePOForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { deletePurchaseOrder, approvePurchaseOrder, sendPurchaseOrder, exportPurchaseOrder } from '@/app/_actions/purchase-orders';
import { useToast } from '@/lib/toast-context';

interface LineItem {
  item_name: string;
  quantity: number;
  unit_price: unknown;
  total: unknown;
}

interface Vendor {
  id: string;
  name: string;
  contact_name: string | null;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  status: 'DRAFT' | 'APPROVED' | 'SENT';
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
  vendor: Vendor;
  line_items: Array<{
    item_name: string;
    quantity: number;
    unit_price: unknown;
    total: unknown;
  }>;
}

interface PurchaseOrdersClientProps {
  initialPurchaseOrders: PurchaseOrder[];
  userRole?: string;
}

interface ConfirmingPO {
  po: PurchaseOrder;
  action: 'APPROVE' | 'SEND';
}

function getStatusBadge(status: PurchaseOrder['status']) {
  switch (status) {
    case 'DRAFT':
      return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Draft</span>;
    case 'APPROVED':
      return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Approved</span>;
    case 'SENT':
      return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">Sent</span>;
    default:
      return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
  }
}

function getStatusFilterBadge(status: string, isActive: boolean) {
  const colors: Record<string, string> = {
    ALL: isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80',
    DRAFT: isActive ? 'bg-yellow-100 text-yellow-800' : 'bg-muted text-muted-foreground hover:bg-yellow-50',
    APPROVED: isActive ? 'bg-blue-100 text-blue-800' : 'bg-muted text-muted-foreground hover:bg-blue-50',
    SENT: isActive ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground hover:bg-green-50',
  };
  return colors[status] || colors.ALL;
}

function calculateGrandTotal(lineItems: LineItem[]): number {
  return lineItems.reduce((sum, item) => {
    const total = typeof item.total === 'string' ? parseFloat(item.total) : (item.total as number) || 0;
    return sum + total;
  }, 0);
}

export function PurchaseOrdersClient({ initialPurchaseOrders, userRole }: PurchaseOrdersClientProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [purchaseOrders] = useState(initialPurchaseOrders);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [deletingPO, setDeletingPO] = useState<PurchaseOrder | null>(null);
  const [confirmingPO, setConfirmingPO] = useState<ConfirmingPO | null>(null);
  const [isPending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDivElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (deletingPO || confirmingPO) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (deletingPO) setDeletingPO(null);
          if (confirmingPO) setConfirmingPO(null);
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [deletingPO, confirmingPO]);

  const handleSuccess = () => {
    setIsFormOpen(false);
    setEditingPO(null);
    router.refresh();
  };

  const handleEdit = (po: PurchaseOrder) => {
    setEditingPO(po);
    setIsFormOpen(true);
  };

  const handleApprove = (po: PurchaseOrder) => {
    setConfirmingPO({ po, action: 'APPROVE' });
  };

  const handleSend = (po: PurchaseOrder) => {
    setConfirmingPO({ po, action: 'SEND' });
  };

  const handleExport = (po: PurchaseOrder) => {
    startTransition(async () => {
      const result = await exportPurchaseOrder(po.id);
      if (result.success && result.data) {
        try {
          await navigator.clipboard.writeText(result.data.content);
          addToast('Purchase order copied to clipboard!', 'success');
        } catch {
          const blob = new Blob([result.data.content], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${result.data.poNumber}.txt`;
          a.click();
          URL.revokeObjectURL(url);
          addToast('Purchase order downloaded!', 'success');
        }
      } else {
        addToast(result.error || 'Failed to export purchase order', result.error?.includes('Draft') ? 'info' : 'error');
      }
    });
  };

  const handleConfirmAction = () => {
    if (!confirmingPO) return;

    const formData = new FormData();
    formData.set('id', confirmingPO.po.id);

    startTransition(async () => {
      const actionFn = confirmingPO.action === 'APPROVE' ? approvePurchaseOrder : sendPurchaseOrder;
      const result = await actionFn(formData);

      if (result.success) {
        addToast(`Purchase order ${confirmingPO.action === 'APPROVE' ? 'approved' : 'sent'} successfully!`, 'success');
        setConfirmingPO(null);
        router.refresh();
      } else {
        addToast(result.error || `Failed to ${confirmingPO.action.toLowerCase()} purchase order`, 'error');
      }
    });
  };

  const handleDelete = () => {
    if (!deletingPO) return;

    const formData = new FormData();
    formData.set('id', deletingPO.id);

    startTransition(async () => {
      const result = await deletePurchaseOrder(formData);
      if (result.success) {
        addToast('Purchase order deleted successfully!', 'success');
        setDeletingPO(null);
        router.refresh();
      } else {
        addToast(result.error || 'Failed to delete purchase order', 'error');
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number, total: number) => {
    let newIndex = currentIndex;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      newIndex = currentIndex < total - 1 ? currentIndex + 1 : 0;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      newIndex = currentIndex > 0 ? currentIndex - 1 : total - 1;
    } else {
      return;
    }
    const row = document.querySelector(`[data-row-index="${newIndex}"]`) as HTMLElement;
    row?.focus();
  };

  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const matchesSearch =
        !search ||
        po.po_number.toLowerCase().includes(search.toLowerCase()) ||
        po.vendor.name.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || po.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [purchaseOrders, search, statusFilter]);

  const hasFilters = search || statusFilter !== 'ALL';

  function formatDate(date: Date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Purchase Orders</h2>
          <p className="text-muted-foreground">Manage your purchase orders</p>
        </div>
        <Button onClick={() => { setEditingPO(null); setIsFormOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          New PO
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by PO number or vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            aria-label="Search purchase orders"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        <div className="flex gap-2" role="group" aria-label="Filter by status">
          {['ALL', 'DRAFT', 'APPROVED', 'SENT'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              aria-pressed={statusFilter === status}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${getStatusFilterBadge(status, statusFilter === status)}`}
            >
              {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Total: {purchaseOrders.length} orders</span>
            </div>
            <span className="text-muted-foreground">|</span>
            <span className="text-sm text-muted-foreground">Showing {filteredOrders.length}</span>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No purchase orders found.</p>
            {hasFilters ? (
              <p className="text-sm">Try adjusting your search or filter.</p>
            ) : (
              <p className="text-sm">Create your first purchase order to get started.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" role="grid" aria-label="Purchase orders table">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th scope="col" className="text-left p-3 text-sm font-medium">PO Number</th>
                  <th scope="col" className="text-left p-3 text-sm font-medium">Vendor</th>
                  <th scope="col" className="text-center p-3 text-sm font-medium">Status</th>
                  <th scope="col" className="text-right p-3 text-sm font-medium">Total</th>
                  <th scope="col" className="text-center p-3 text-sm font-medium">Created</th>
                  <th scope="col" className="text-center w-[160px] p-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((po, index) => (
                  <tr
                    key={po.id}
                    data-row-index={index}
                    className="border-b hover:bg-muted/30 focus-visible:bg-muted/50 focus-visible:outline-none"
                    tabIndex={0}
                    onKeyDown={(e) => handleKeyDown(e, index, filteredOrders.length)}
                  >
                    <td className="p-3">
                      <p className="font-medium font-mono text-sm truncate max-w-[150px]" title={po.po_number}>{po.po_number}</p>
                    </td>
                    <td className="p-3 text-sm">
                      <p className="font-medium truncate max-w-[200px]" title={po.vendor.name}>{po.vendor.name}</p>
                      {po.vendor.contact_name && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={po.vendor.contact_name}>{po.vendor.contact_name}</p>
                      )}
                    </td>
                    <td className="p-3 text-center">{getStatusBadge(po.status)}</td>
                    <td className="p-3 text-right font-medium">
                      {formatCurrency(calculateGrandTotal(po.line_items))}
                    </td>
                    <td className="p-3 text-center text-sm text-muted-foreground">
                      {formatDate(po.created_at)}
                    </td>
                    <td className="p-3 text-center w-[160px]">
                      <div className="flex items-center justify-center gap-1">
                        {po.status === 'DRAFT' && (
                          <button
                            onClick={() => handleEdit(po)}
                            className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit"
                            aria-label="Edit purchase order"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {po.status === 'DRAFT' && userRole === 'ADMIN' && (
                          <button
                            onClick={() => handleApprove(po)}
                            className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-green-600 transition-colors"
                            title="Approve"
                            aria-label="Approve purchase order"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        {po.status === 'APPROVED' && userRole === 'ADMIN' && (
                          <button
                            onClick={() => handleSend(po)}
                            className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-blue-600 transition-colors"
                            title="Send"
                            aria-label="Send purchase order"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        )}
                        {(po.status === 'APPROVED' || po.status === 'SENT') && (
                          <button
                            onClick={() => handleExport(po)}
                            className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-primary transition-colors"
                            title="Export"
                            aria-label="Export purchase order"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeletingPO(po)}
                          className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-red-600 transition-colors"
                          title="Delete"
                          aria-label="Delete purchase order"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isFormOpen && (
        <CreatePOForm
          onClose={() => { setIsFormOpen(false); setEditingPO(null); }}
          onSuccess={handleSuccess}
          editingPO={editingPO}
        />
      )}

      {deletingPO && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
          <div ref={dialogRef} className="bg-background rounded-lg border p-6 max-w-md w-full mx-4 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <h3 id="delete-dialog-title" className="text-lg font-semibold">Delete Purchase Order</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete <strong className="text-foreground">{deletingPO.po_number}</strong>?
              This action can be undone by an admin.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeletingPO(null)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending}
              >
                {isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmingPO && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
          <div ref={dialogRef} className="bg-background rounded-lg border p-6 max-w-md w-full mx-4 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-full ${confirmingPO.action === 'APPROVE' ? 'bg-green-100' : 'bg-blue-100'}`}>
                {confirmingPO.action === 'APPROVE' ? <Check className="h-5 w-5 text-green-600" /> : <Send className="h-5 w-5 text-blue-600" />}
              </div>
              <h3 id="confirm-dialog-title" className="text-lg font-semibold">
                {confirmingPO.action === 'APPROVE' ? 'Approve' : 'Send'} Purchase Order
              </h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to {confirmingPO.action === 'APPROVE' ? 'approve' : 'send'} <strong className="text-foreground">{confirmingPO.po.po_number}</strong>?
              {confirmingPO.action === 'APPROVE' ? ' Once approved, it cannot be edited.' : ' Once sent, it cannot be modified.'}
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setConfirmingPO(null)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleConfirmAction}
                disabled={isPending}
                ref={submitButtonRef}
              >
                {isPending ? 'Processing...' : confirmingPO.action === 'APPROVE' ? 'Approve' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}