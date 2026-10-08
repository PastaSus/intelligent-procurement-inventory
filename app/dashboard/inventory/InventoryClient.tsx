"use client";

import { useState, useMemo, useTransition } from "react";
import {
  Plus,
  Package,
  AlertTriangle,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
} from "lucide-react";
import { AddProductForm } from "./components/AddProductForm";
import { EditProductForm } from "./components/EditProductForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deleteInventoryItem } from "@/app/_actions/inventory";

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  quantity: number;
  reorder_point: number;
  component_type: string | null;
  created_at: Date;
  updated_at: Date;
}

interface InventoryClientProps {
  initialItems: InventoryItem[];
  totalCount: number;
  componentTypes: readonly string[];
  currentPage: number;
  pageSize: number;
  isAdmin: boolean;
}

function SortHeader({
  column,
  label,
  sortBy,
  sortOrder,
  onSort,
}: {
  column: "sku" | "name" | "quantity" | "component_type" | "updated_at";
  label: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (column: "sku" | "name" | "quantity" | "component_type" | "updated_at") => void;
}) {
  const isActive = sortBy === column;
  return (
    <button
      onClick={() => onSort(column)}
      className="flex items-center gap-1 hover:bg-muted/50 px-2 py-1 rounded transition-colors"
    >
      <span>{label}</span>
      {isActive &&
        (sortOrder === "asc" ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        ))}
    </button>
  );
}

export function InventoryClient({
  initialItems,
  totalCount,
  componentTypes,
  currentPage,
  pageSize,
  isAdmin,
}: InventoryClientProps) {
  const [items] = useState(initialItems);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [selectedComponentType, setSelectedComponentType] = useState("all");
  const [stockStatus, setStockStatus] = useState<
    "all" | "low" | "critical" | "normal"
  >("all");
  const [sortBy, setSortBy] = useState<
    "sku" | "name" | "quantity" | "component_type" | "updated_at"
  >("updated_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSuccess = () => {
    setIsFormOpen(false);
    setEditingItem(null);
    setTimeout(() => {
      window.location.href = "/dashboard/inventory";
    }, 300);
  };

  const handleDelete = () => {
    if (!deletingItem) return;

    const formData = new FormData();
    formData.set("id", deletingItem.id);

    startTransition(async () => {
      const result = await deleteInventoryItem(formData);
      if (result.success) {
        setDeletingItem(null);
        setTimeout(() => {
          window.location.href = "/dashboard/inventory";
        }, 300);
      } else {
        alert(result.error || "Failed to delete item");
      }
    });
  };

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.sku.toLowerCase().includes(searchLower) ||
          item.name.toLowerCase().includes(searchLower),
      );
    }

    if (selectedComponentType !== "all") {
      result = result.filter(
        (item) => item.component_type === selectedComponentType,
      );
    }

    if (stockStatus === "low") {
      result = result.filter(
        (item) => item.quantity <= item.reorder_point && item.quantity > 0,
      );
    } else if (stockStatus === "critical") {
      result = result.filter((item) => item.quantity === 0);
    } else if (stockStatus === "normal") {
      result = result.filter(        (item) => item.quantity > item.reorder_point);
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "sku":
          comparison = a.sku.localeCompare(b.sku);
          break;
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "quantity":
          comparison = a.quantity - b.quantity;
          break;
        case "component_type":
          comparison = (a.component_type || "").localeCompare(
            b.component_type || "",
          );
          break;
        case "updated_at":
          comparison =
            new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [items, search, selectedComponentType, stockStatus, sortBy, sortOrder]);

  const lowStockCount = items.filter(
    (item) => item.quantity <= item.reorder_point && item.quantity > 0,
  ).length;
  const criticalCount = items.filter((item) => item.quantity === 0).length;
  const totalPages = Math.ceil(totalCount / pageSize);

  function handleSort(column: typeof sortBy) {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  }

  function formatDate(date: Date) {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Spare Parts</h2>
          <p className="text-muted-foreground">
            Manage replacement parts inventory
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Part
          </Button>
        )}
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
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        <Select
          value={selectedComponentType}
          onValueChange={setSelectedComponentType}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Component Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Component Types</SelectItem>
            {componentTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={stockStatus}
          onValueChange={(v) => setStockStatus(v as typeof stockStatus)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Stock Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stock Status</SelectItem>
            <SelectItem value="low">Low Stock</SelectItem>
            <SelectItem value="critical">Critical (0)</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Total: {totalCount} parts</span>
            </div>
            <span className="text-muted-foreground">|</span>
            <span className="text-sm text-muted-foreground">
              Showing {filteredItems.length}
            </span>
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
            <p>No spare parts found.</p>
            <p className="text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 text-sm font-medium">
                    <SortHeader column="sku" label="SKU" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="text-left p-3 text-sm font-medium">
                    <SortHeader column="name" label="Name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="text-left p-3 text-sm font-medium">
                    <SortHeader column="component_type" label="Component" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="text-center p-3 text-sm font-medium">
                    <SortHeader column="quantity" label="Qty" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="text-center p-3 text-sm font-medium">
                    Reorder
                  </th>
                  <th className="text-center p-3 text-sm font-medium">
                    Status
                  </th>
                  <th className="text-center p-3 text-sm font-medium">
                    <SortHeader column="updated_at" label="Updated" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  {isAdmin && (
                    <th className="text-center w-[100px] p-3 text-sm font-medium">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const isLowStock = item.quantity <= item.reorder_point;
                  const isCritical = item.quantity === 0;

                  return (
                    <tr
                      key={item.id}
                      className="border-b last:border-b-0 hover:bg-muted/30"
                      tabIndex={0}
                    >
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
                      <td className="p-3 text-sm">
                        {item.component_type || "-"}
                      </td>
                      <td className="p-3 text-center text-sm font-medium">
                        {item.quantity}
                      </td>
                      <td className="p-3 text-center text-sm text-muted-foreground">
                        {item.reorder_point}
                      </td>
                      <td className="p-3 text-center">
                        {(() => {
                          const percentage =
                            item.reorder_point > 0
                              ? Math.min(
                                  (item.quantity / item.reorder_point) * 100,
                                  100,
                                )
                              : 100;

                          return isCritical ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                CRITICAL
                              </span>
                              <div className="w-16 h-1.5 bg-red-200 rounded-full mx-auto">
                                <div
                                  className="h-full bg-red-500 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          ) : isLowStock ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                LOW
                              </span>
                              <div className="w-16 h-1.5 bg-yellow-200 rounded-full mx-auto">
                                <div
                                  className="h-full bg-yellow-500 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                OK
                              </span>
                              <div className="w-16 h-1.5 bg-green-200 rounded-full mx-auto">
                                <div
                                  className="h-full bg-green-500 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="p-3 text-center text-sm text-muted-foreground">
                        {formatDate(item.updated_at)}
                      </td>
                      {isAdmin && (
                        <td className="p-3 text-center w-[100px]">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setEditingItem(item)}
                              className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeletingItem(item)}
                              className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
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
                onClick={() =>
                  (window.location.href = `/dashboard/inventory?page=${currentPage - 1}`)
                }
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  (window.location.href = `/dashboard/inventory?page=${currentPage + 1}`)
                }
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {isFormOpen && (
        <AddProductForm
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleSuccess}
          componentTypes={componentTypes}
        />
      )}

      {editingItem && (
        <EditProductForm
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSuccess={handleSuccess}
          componentTypes={componentTypes}
        />
      )}

      {deletingItem && isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg border p-6 max-w-md w-full mx-4 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold">Delete Part</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete{" "}
              <strong className="text-foreground">{deletingItem.name}</strong> (
              {deletingItem.sku})?
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeletingItem(null)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending}
              >
                {isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
