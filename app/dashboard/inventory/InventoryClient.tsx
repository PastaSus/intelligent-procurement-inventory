'use client';

import { useState, useMemo } from 'react';
import { Plus, Package, AlertTriangle, Search, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { AddProductForm } from './components/AddProductForm';
import { EditProductForm } from './components/EditProductForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  quantity: number;
  reorder_point: number;
  category: string | null;
  created_at: Date;
  updated_at: Date;
}

interface InventoryClientProps {
  initialItems: InventoryItem[];
  totalCount: number;
  categories: string[];
  currentPage: number;
  pageSize: number;
}

export function InventoryClient({ initialItems, totalCount, categories, currentPage, pageSize }: InventoryClientProps) {
  const [items] = useState(initialItems);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockStatus, setStockStatus] = useState<'all' | 'low' | 'critical' | 'normal'>('all');
  const [sortBy, setSortBy] = useState<'sku' | 'name' | 'quantity' | 'category' | 'updated_at'>('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSuccess = () => {
    setIsFormOpen(false);
    setEditingItem(null);
    setTimeout(() => {
      window.location.href = '/dashboard/inventory';
    }, 300);
  };

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        item => item.sku.toLowerCase().includes(searchLower) || 
                item.name.toLowerCase().includes(searchLower)
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(item => item.category === selectedCategory);
    }

    if (stockStatus === 'low') {
      result = result.filter(item => item.quantity < item.reorder_point && item.quantity > 0);
    } else if (stockStatus === 'critical') {
      result = result.filter(item => item.quantity === 0);
    } else if (stockStatus === 'normal') {
      result = result.filter(item => item.quantity >= item.reorder_point);
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'sku':
          comparison = a.sku.localeCompare(b.sku);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
        case 'category':
          comparison = (a.category || '').localeCompare(b.category || '');
          break;
        case 'updated_at':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
        default:
          comparison = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [items, search, selectedCategory, stockStatus, sortBy, sortOrder]);

  const lowStockCount = items.filter(item => item.quantity < item.reorder_point && item.quantity > 0).length;
  const criticalCount = items.filter(item => item.quantity === 0).length;
  const totalPages = Math.ceil(totalCount / pageSize);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Inventory</h2>
          <p className="text-muted-foreground">Manage your inventory items</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by SKU or name..."
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

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 rounded-md border border-input bg-background text-sm"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={stockStatus}
          onChange={(e) => setStockStatus(e.target.value as typeof stockStatus)}
          className="px-3 py-2 rounded-md border border-input bg-background text-sm"
        >
          <option value="all">All Stock Status</option>
          <option value="low">Low Stock</option>
          <option value="critical">Critical (0)</option>
          <option value="normal">Normal</option>
        </select>
      </div>

      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Total: {totalCount} items</span>
            </div>
            <span className="text-muted-foreground">|</span>
            <span className="text-sm text-muted-foreground">Showing {filteredItems.length}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {lowStockCount > 0 && (
              <span className="flex items-center gap-1 text-yellow-700">
                <AlertTriangle className="h-4 w-4" />
                {lowStockCount} low stock
              </span>
            )}
            {criticalCount > 0 && (
              <span className="flex items-center gap-1 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                {criticalCount} critical
              </span>
            )}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No inventory items found.</p>
            <p className="text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 text-sm font-medium"><SortHeader column="sku" label="SKU" /></th>
                  <th className="text-left p-3 text-sm font-medium"><SortHeader column="name" label="Name" /></th>
                  <th className="text-left p-3 text-sm font-medium"><SortHeader column="category" label="Category" /></th>
                  <th className="text-right p-3 text-sm font-medium"><SortHeader column="quantity" label="Qty" /></th>
                  <th className="text-right p-3 text-sm font-medium">Reorder</th>
                  <th className="text-right p-3 text-sm font-medium">Status</th>
                  <th className="text-right p-3 text-sm font-medium"><SortHeader column="updated_at" label="Updated" /></th>
                  <th className="text-center p-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const isLowStock = item.quantity < item.reorder_point;
                  const isCritical = item.quantity === 0;
                  
                  return (
                    <tr key={item.id} className="border-b hover:bg-muted/30" tabIndex={0}>
                      <td className="p-3 text-sm font-mono">{item.sku}</td>
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-sm">{item.category || '-'}</td>
                      <td className="p-3 text-right text-sm font-medium">{item.quantity}</td>
                      <td className="p-3 text-right text-sm text-muted-foreground">{item.reorder_point}</td>
                      <td className="p-3 text-right">
                        {isCritical ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            CRITICAL
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            LOW
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            OK
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right text-sm text-muted-foreground">{formatDate(item.updated_at)}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => window.location.href = `/dashboard/inventory?page=${currentPage - 1}`}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => window.location.href = `/dashboard/inventory?page=${currentPage + 1}`}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {isFormOpen && (
        <AddProductForm 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={handleSuccess}
        />
      )}

      {editingItem && (
        <EditProductForm
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}