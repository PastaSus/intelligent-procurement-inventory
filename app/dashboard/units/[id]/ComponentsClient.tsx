'use client';

import { useState, useTransition } from 'react';
import { Plus, ArrowLeft, Cpu, Wrench, AlertTriangle, Pencil, Trash2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { AddComponentForm } from './components/AddComponentForm';
import { EditComponentForm } from './components/EditComponentForm';
import { Button } from '@/components/ui/button';
import { deleteComponent, bulkAddComponents } from '@/app/_actions/components';

interface UnitInfo {
  id: string;
  unit_name: string;
  roomName: string;
}

interface Component {
  id: string;
  computer_unit_id: string;
  type: string;
  serial_number: string;
  specifications: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

interface ComponentsClientProps {
  unit: UnitInfo;
  initialComponents: Component[];
  componentTypes: readonly string[];
}

const statusStyles: Record<string, string> = {
  FUNCTIONAL: 'bg-green-100 text-green-800',
  NEEDS_REPAIR: 'bg-yellow-100 text-yellow-800',
  NEEDS_REPLACEMENT: 'bg-red-100 text-red-800',
};

const statusIcons: Record<string, React.ElementType> = {
  FUNCTIONAL: Cpu,
  NEEDS_REPAIR: Wrench,
  NEEDS_REPLACEMENT: AlertTriangle,
};

export function ComponentsClient({ unit, initialComponents, componentTypes }: ComponentsClientProps) {
  const [components, setComponents] = useState(initialComponents);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);
  const [deletingComponent, setDeletingComponent] = useState<Component | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSuccess = () => {
    setIsFormOpen(false);
    setEditingComponent(null);
    window.location.reload();
  };

  const handleDelete = () => {
    if (!deletingComponent) return;

    const formData = new FormData();
    formData.set('id', deletingComponent.id);

    startTransition(async () => {
      const result = await deleteComponent(formData);
      if (result.success) {
        setDeletingComponent(null);
        window.location.reload();
      } else {
        alert(result.error || 'Failed to delete component');
      }
    });
  };

  const handleBulkAdd = () => {
    const formData = new FormData();
    formData.set('computerUnitId', unit.id);

    startTransition(async () => {
      const result = await bulkAddComponents(formData);
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error || 'Failed to bulk add components');
      }
    });
  };

  const componentsByType = componentTypes.map(type => {
    const comp = components.find(c => c.type === type);
    return { type, component: comp || null };
  });

  const stats = {
    total: components.length,
    needsRepair: components.filter(c => c.status === 'NEEDS_REPAIR').length,
    needsReplacement: components.filter(c => c.status === 'NEEDS_REPLACEMENT').length,
  };

  const missingTypes = componentTypes.filter(
    t => !components.some(c => c.type === t)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/units"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Units
          </Link>
          <h2 className="text-3xl font-bold">{unit.unit_name}</h2>
          <p className="text-muted-foreground">{unit.roomName}</p>
        </div>
        <div className="flex items-center gap-2">
          {missingTypes.length > 0 && (
            <Button variant="outline" onClick={handleBulkAdd} disabled={isPending} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Auto-populate
            </Button>
          )}
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Component
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Components</p>
          <p className="text-2xl font-bold">{stats.total} / {componentTypes.length}</p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Functional</p>
          <p className="text-2xl font-bold text-green-600">{stats.total - stats.needsRepair - stats.needsReplacement}</p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Needs Repair</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.needsRepair}</p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Needs Replacement</p>
          <p className="text-2xl font-bold text-red-600">{stats.needsReplacement}</p>
        </div>
      </div>

      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Components</h3>
        </div>

        {components.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Cpu className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No components registered for this unit.</p>
            <p className="text-sm">Click &quot;Auto-populate&quot; to create all standard component types at once.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 text-sm font-medium">Type</th>
                  <th className="text-left p-3 text-sm font-medium">Serial Number</th>
                  <th className="text-left p-3 text-sm font-medium">Specifications</th>
                  <th className="text-center p-3 text-sm font-medium">Status</th>
                  <th className="text-center w-[100px] p-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {componentsByType.map(({ type, component }) => (
                  <tr key={type} className={`border-b last:border-b-0 hover:bg-muted/30 ${!component ? 'opacity-40' : ''}`} tabIndex={0}>
                    <td className="p-3">
                      <span className="font-medium">{type}</span>
                    </td>
                    <td className="p-3">
                      {component ? (
                        <span className="font-mono text-sm">{component.serial_number}</span>
                      ) : (
                        <span className="text-sm italic text-muted-foreground">Not registered</span>
                      )}
                    </td>
                    <td className="p-3 text-sm">
                      {component?.specifications || '-'}
                    </td>
                    <td className="p-3 text-center">
                      {component && (() => {
                        const Icon = statusIcons[component.status] || Cpu;
                        return (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusStyles[component.status] || ''}`}>
                            <Icon className="h-3 w-3" />
                            {component.status.replace(/_/g, ' ')}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-3 text-center w-[100px]">
                      {component && (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditingComponent(component)}
                            className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingComponent(component)}
                            className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-red-600 transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {missingTypes.length > 0 && (
          <div className="p-4 border-t bg-muted/20">
            <p className="text-sm text-muted-foreground">
              Missing types: {missingTypes.join(', ')}
              {' '}<button onClick={handleBulkAdd} disabled={isPending} className="text-primary hover:underline font-medium">
                Auto-populate all
              </button>
            </p>
          </div>
        )}
      </div>

      {isFormOpen && (
        <AddComponentForm
          computerUnitId={unit.id}
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleSuccess}
          componentTypes={componentTypes}
        />
      )}

      {editingComponent && (
        <EditComponentForm
          component={editingComponent}
          onClose={() => setEditingComponent(null)}
          onSuccess={handleSuccess}
          componentTypes={componentTypes}
        />
      )}

      {deletingComponent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg border p-6 max-w-md w-full mx-4 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold">Remove Component</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Permanently remove <strong className="text-foreground">{deletingComponent.type}</strong> (serial: {deletingComponent.serial_number})?
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeletingComponent(null)} disabled={isPending}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                {isPending ? 'Removing...' : 'Remove'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
