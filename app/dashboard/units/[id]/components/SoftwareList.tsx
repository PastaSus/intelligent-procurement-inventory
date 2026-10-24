'use client';

import { useState } from 'react';
import { MonitorSmartphone, Pencil, Trash2, Eye, EyeOff, Copy, Check } from 'lucide-react';

export interface SoftwareItem {
  id: string;
  name: string;
  version: string | null;
  license_key: string | null;
  license_type: string;
  install_date: Date | null;
}

interface SoftwareListProps {
  software: SoftwareItem[];
  onEdit: (app: SoftwareItem) => void;
  onRemove: (app: SoftwareItem) => void;
  isAdmin?: boolean;
}

const licenseStyles: Record<string, string> = {
  FREE: 'bg-green-100 text-green-800',
  COMMERCIAL: 'bg-blue-100 text-blue-800',
  OPEN_SOURCE: 'bg-purple-100 text-purple-800',
  EDUCATIONAL: 'bg-yellow-100 text-yellow-800',
  NONE: 'bg-gray-100 text-gray-800',
};

function LicenseKeyCell({ licenseKey, canReveal }: { licenseKey: string | null; canReveal: boolean }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!licenseKey) {
    return <span className="text-muted-foreground">-</span>;
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(licenseKey as string);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be denied; leave the value visible instead.
      setRevealed(true);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-xs">{revealed ? licenseKey : '••••••••'}</span>
      {canReveal && (
        <>
          <button
            onClick={() => setRevealed((value) => !value)}
            className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
            title={revealed ? 'Hide license key' : 'Show license key'}
            aria-label={revealed ? 'Hide license key' : 'Show license key'}
          >
            {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => { void handleCopy(); }}
            className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
            title="Copy license key"
            aria-label="Copy license key"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </>
      )}
    </div>
  );
}

function formatDate(date: Date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return 'N/A';
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 0) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function SoftwareList({ software, onEdit, onRemove, isAdmin = true }: SoftwareListProps) {
  if (software.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <MonitorSmartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No software recorded.</p>
        <p className="text-sm">Click &quot;Add Software&quot; to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3 text-sm font-medium">Name</th>
            <th className="text-left p-3 text-sm font-medium">Version</th>
            <th className="text-left p-3 text-sm font-medium">License Key</th>
            <th className="text-left p-3 text-sm font-medium">License Type</th>
            <th className="text-left p-3 text-sm font-medium">Install Date</th>
            <th className="text-center w-[100px] p-3 text-sm font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {software.map(app => (
            <tr key={app.id} className="border-b last:border-b-0 hover:bg-muted/30" tabIndex={0}>
              <td className="p-3">
                <span className="font-medium">{app.name}</span>
              </td>
              <td className="p-3 text-sm">
                {app.version || '-'}
              </td>
              <td className="p-3">
                <LicenseKeyCell licenseKey={app.license_key} canReveal={isAdmin} />
              </td>
              <td className="p-3">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${licenseStyles[app.license_type] || licenseStyles.NONE}`}>
                  {app.license_type.replace(/_/g, ' ')}
                </span>
              </td>
              <td className="p-3 text-sm text-muted-foreground">
                {app.install_date ? formatDate(app.install_date) : 'N/A'}
              </td>
              <td className="p-3 text-center w-[100px]">
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => onEdit(app)}
                    className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => onRemove(app)}
                      className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-red-600 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
