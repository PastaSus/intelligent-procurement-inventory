'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/lib/toast-context';

const FALLBACK_FILENAME = `procurvin-backup-${new Date().toISOString().slice(0, 10)}.json`;

function filenameFromDisposition(disposition: string | null): string {
  const match = disposition ? /filename="([^"]+)"/.exec(disposition) : null;
  return match?.[1] ?? FALLBACK_FILENAME;
}

export function DataBackupCard() {
  const [isPending, setIsPending] = useState(false);
  const { addToast } = useToast();

  async function handleDownload() {
    setIsPending(true);

    try {
      const response = await fetch('/api/backup', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(
          response.status === 403
            ? 'Only administrators can download backups'
            : 'Failed to generate backup',
        );
      }

      const blob = await response.blob();
      const filename = filenameFromDisposition(response.headers.get('content-disposition'));
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);

      addToast('Backup downloaded', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to download backup', 'error');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section
      aria-labelledby="data-backup-title"
      className="rounded-lg border bg-card p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h3 id="data-backup-title" className="text-lg font-semibold">
            Data Backup
          </h3>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Download a complete copy of all lab records as a single JSON file. The file
            contains all lab records including user password hashes and software license
            keys, so it must be kept private.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleDownload}
          disabled={isPending}
          className="shrink-0 gap-2"
          aria-label="Download data backup"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="size-4" aria-hidden="true" />
          )}
          {isPending ? 'Preparing...' : 'Download Backup'}
        </Button>
      </div>
    </section>
  );
}
