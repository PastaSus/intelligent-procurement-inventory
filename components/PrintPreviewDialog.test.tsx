import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrintPreviewDialog } from '@/components/PrintPreviewDialog';
import { exportNodeAsPdf, type DocumentExtension } from '@/lib/print-export';

const toastMocks = vi.hoisted(() => ({ addToast: vi.fn() }));

vi.mock('@/lib/toast-context', () => ({
  useToast: () => ({ addToast: toastMocks.addToast }),
}));

vi.mock('@/lib/print-export', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/print-export')>();
  return {
    ...actual,
    exportNodeAsPdf: vi.fn(),
  };
});

const fileName = (extension: DocumentExtension) => `procurvin-test.${extension}`;

function renderDialog(overrides: { canExport?: boolean; onClose?: () => void } = {}) {
  return render(
    <PrintPreviewDialog
      title="Print Preview — Test"
      fileName={fileName}
      onClose={overrides.onClose ?? (() => {})}
      canExport={overrides.canExport}
    >
      <p>Preview content</p>
    </PrintPreviewDialog>,
  );
}

describe('PrintPreviewDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(exportNodeAsPdf).mockResolvedValue(undefined);
    window.print = vi.fn();
  });

  it('renders the title and all action buttons', () => {
    renderDialog();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Print Preview — Test' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download print preview — test as pdf/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /as image/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^print$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('exports the visible paper node as a PDF', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: /download print preview — test as pdf/i }));

    expect(exportNodeAsPdf).toHaveBeenCalledTimes(1);
    const [node, filename] = vi.mocked(exportNodeAsPdf).mock.calls[0];
    expect((node as HTMLElement).className).toContain('pr-print-letter');
    expect(node).toHaveTextContent('Preview content');
    expect(filename).toBe('procurvin-test.pdf');
  });

  it('calls window.print when the Print button is clicked', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: /^print$/i }));
    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it('shows a preparing state and disables the download while exporting', async () => {
    const user = userEvent.setup();
    let finishExport: (() => void) | undefined;
    vi.mocked(exportNodeAsPdf).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishExport = resolve;
        }),
    );
    renderDialog();

    const pdfButton = screen.getByRole('button', { name: /download print preview — test as pdf/i });

    await user.click(pdfButton);

    expect(await screen.findByText('Preparing…')).toBeInTheDocument();
    expect(pdfButton).toBeDisabled();
    expect(screen.getByRole('button', { name: /close/i })).toBeDisabled();

    finishExport?.();

    await waitFor(() => expect(pdfButton).toHaveTextContent('Download PDF'));
    expect(pdfButton).toBeEnabled();
    expect(screen.getByRole('button', { name: /close/i })).toBeEnabled();
  });

  it('shows the failure toast and re-enables downloads when an export fails', async () => {
    const user = userEvent.setup();
    vi.mocked(exportNodeAsPdf).mockRejectedValue(new Error('render failed'));
    renderDialog();

    const pdfButton = screen.getByRole('button', { name: /download print preview — test as pdf/i });
    await user.click(pdfButton);

    await waitFor(() =>
      expect(toastMocks.addToast).toHaveBeenCalledWith(
        'Could not generate the file. Please try again.',
        'error',
      ),
    );
    expect(pdfButton).toBeEnabled();
  });

  it('calls onClose when the Close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderDialog({ onClose });

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderDialog({ onClose });

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn();
    renderDialog({ onClose });

    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('disables downloads when canExport is false', () => {
    renderDialog({ canExport: false });

    expect(screen.getByRole('button', { name: /download print preview — test as pdf/i })).toBeDisabled();
  });
});
