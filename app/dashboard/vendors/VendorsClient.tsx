'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Building2, Search, X, Pencil, Trash2 } from 'lucide-react';
import { AddVendorForm } from './components/AddVendorForm';
import { EditVendorForm } from './components/EditVendorForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { deleteVendor } from '@/app/_actions/vendor';

interface Vendor {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: Date;
  updated_at: Date;
}

interface VendorsClientProps {
  initialVendors: Vendor[];
}

export function VendorsClient({ initialVendors }: VendorsClientProps) {
  const router = useRouter();
  const [vendors, setVendors] = useState(initialVendors);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');

  useEffect(() => {
    setVendors(initialVendors);
  }, [initialVendors]);

  const handleSuccess = () => {
    setIsFormOpen(false);
    setEditingVendor(null);
    router.refresh();
  };

  const handleDelete = () => {
    if (!deletingVendor) return;
    
    const formData = new FormData();
    formData.set('id', deletingVendor.id);

    startTransition(async () => {
      const result = await deleteVendor(formData);
      if (result.success) {
        setDeletingVendor(null);
        router.refresh();
      } else {
        alert(result.error || 'Failed to delete vendor');
      }
    });
  };

  const filteredVendors = useMemo(() => {
    if (!search) return vendors;
    
    const searchLower = search.toLowerCase();
    return vendors.filter(
      vendor => 
        vendor.name.toLowerCase().includes(searchLower) ||
        vendor.contact_name?.toLowerCase().includes(searchLower) ||
        vendor.email?.toLowerCase().includes(searchLower)
    );
  }, [vendors, search]);

  function formatDate(date: Date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Vendors</h2>
          <p className="text-muted-foreground">Manage your vendor records</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Vendor
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, contact, or email..."
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
      </div>

      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Total: {vendors.length} vendors</span>
            </div>
            <span className="text-muted-foreground">|</span>
            <span className="text-sm text-muted-foreground">Showing {filteredVendors.length}</span>
          </div>
        </div>

        {filteredVendors.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No vendors found.</p>
            <p className="text-sm">Try adjusting your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 text-sm font-medium">Vendor Name</th>
                  <th className="text-left p-3 text-sm font-medium">Contact</th>
                  <th className="text-left p-3 text-sm font-medium">Email</th>
                  <th className="text-left p-3 text-sm font-medium">Phone</th>
                  <th className="text-center p-3 text-sm font-medium">Updated</th>
                  <th className="text-center w-[100px] p-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="border-b hover:bg-muted/30" tabIndex={0}>
                    <td className="p-3">
                      <p className="font-medium">{vendor.name}</p>
                      {vendor.address && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {vendor.address}
                        </p>
                      )}
                    </td>
                    <td className="p-3 text-sm">{vendor.contact_name || '-'}</td>
                    <td className="p-3 text-sm">{vendor.email || '-'}</td>
                    <td className="p-3 text-sm">{vendor.phone || '-'}</td>
                    <td className="p-3 text-center text-sm text-muted-foreground">
                      {formatDate(vendor.updated_at)}
                    </td>
                    <td className="p-3 text-center w-[100px]">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditingVendor(vendor)}
                          className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingVendor(vendor)}
                          className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-red-600 transition-colors"
                          title="Delete"
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
        <AddVendorForm 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={handleSuccess}
        />
      )}

      {editingVendor && (
        <EditVendorForm
          vendor={editingVendor}
          onClose={() => setEditingVendor(null)}
          onSuccess={handleSuccess}
        />
      )}

      {deletingVendor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg border p-6 max-w-md w-full mx-4 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold">Delete Vendor</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete <strong className="text-foreground">{deletingVendor.name}</strong>? 
              This action can be undone by an admin.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeletingVendor(null)}
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
    </div>
  );
}