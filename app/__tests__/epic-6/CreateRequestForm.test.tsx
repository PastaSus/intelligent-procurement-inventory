import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateRequestForm } from '@/app/dashboard/purchase-requests/components/CreateRequestForm';
import { createPurchaseRequest } from '@/app/_actions/purchase-requests';

vi.mock('@/lib/toast-context');
vi.mock('@/app/_actions/purchase-requests', () => ({ createPurchaseRequest: vi.fn() }));

let uuidCounter = 0;
vi.spyOn(crypto, 'randomUUID').mockImplementation(() => {
  uuidCounter++;
  return `uuid-${uuidCounter}`;
});

describe('CreateRequestForm', () => {
  let onClose: any;
  let onSuccess: any;

  beforeEach(() => {
    vi.clearAllMocks();
    uuidCounter = 0;
    onClose = vi.fn();
    onSuccess = vi.fn();
    vi.mocked(createPurchaseRequest).mockResolvedValue({
      success: true,
      data: { id: 'pr-1', pr_number: 'PR-20260705-ABCD', items: [] },
    } as any);
  });

  it('renders form with initial line item', () => {
    render(<CreateRequestForm onClose={onClose} onSuccess={onSuccess} />);

    expect(screen.getByText('New Purchase Request')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Item name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create & save/i })).toBeInTheDocument();
  });

  it('can add and remove line items', async () => {
    const user = userEvent.setup();
    render(<CreateRequestForm onClose={onClose} onSuccess={onSuccess} />);

    const addButton = screen.getByRole('button', { name: /add item/i });
    await user.click(addButton);

    const itemInputs = screen.getAllByPlaceholderText('Item name');
    expect(itemInputs.length).toBe(2);

    const removeButtons = screen.getAllByTitle('Remove item');
    await user.click(removeButtons[0]);

    const itemInputsAfter = screen.getAllByPlaceholderText('Item name');
    expect(itemInputsAfter.length).toBe(1);
  });

  it('shows error when submitting with empty items', async () => {
    render(<CreateRequestForm onClose={onClose} onSuccess={onSuccess} />);

    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(screen.getByText(/at least one line item/i)).toBeInTheDocument();
    });
  });

  it('submits successfully with valid items', async () => {
    const user = userEvent.setup();
    render(<CreateRequestForm onClose={onClose} onSuccess={onSuccess} />);

    const itemInput = screen.getByPlaceholderText('Item name');
    await user.type(itemInput, 'Mouse');

    const qtyInput = screen.getByDisplayValue('1');
    await user.clear(qtyInput);
    await user.type(qtyInput, '10');

    await user.click(screen.getByRole('button', { name: /create & save/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('shows error from server on failure', async () => {
    vi.mocked(createPurchaseRequest).mockResolvedValue({ success: false, error: 'Invalid items' });

    const user = userEvent.setup();
    render(<CreateRequestForm onClose={onClose} onSuccess={onSuccess} />);

    const itemInput = screen.getByPlaceholderText('Item name');
    await user.type(itemInput, 'Mouse');
    await user.type(screen.getByDisplayValue('1'), '10');
    await user.click(screen.getByRole('button', { name: /create & save/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid items')).toBeInTheDocument();
    });
  });

  it('allows entering notes', async () => {
    const user = userEvent.setup();
    render(<CreateRequestForm onClose={onClose} onSuccess={onSuccess} />);

    const notesTextarea = screen.getByPlaceholderText(/reason for request/i);
    await user.type(notesTextarea, 'Urgent restock');

    expect(notesTextarea).toHaveValue('Urgent restock');
  });

  it('selecting a stock part snapshots its name and submits its id', async () => {
    const user = userEvent.setup();
    const stockParts = [{ id: 'inv-1', sku: 'MS-LOGI-M90', name: 'Logitech M90 Mouse', quantity: 8 }];
    render(<CreateRequestForm onClose={onClose} onSuccess={onSuccess} stockParts={stockParts} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: /MS-LOGI-M90.*Logitech M90 Mouse/i }));

    const nameInput = screen.getByPlaceholderText('Item name');
    expect(nameInput).toHaveValue('Logitech M90 Mouse');
    expect(nameInput).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /create & save/i }));

    await waitFor(() => {
      expect(createPurchaseRequest).toHaveBeenCalledTimes(1);
    });
    const fd = vi.mocked(createPurchaseRequest).mock.calls[0][0] as FormData;
    const items = JSON.parse(fd.get('items') as string);
    expect(items[0]).toMatchObject({ itemName: 'Logitech M90 Mouse', inventoryItemId: 'inv-1' });
  });

  it('custom items submit free-text names without a stock id', async () => {
    const user = userEvent.setup();
    const stockParts = [{ id: 'inv-1', sku: 'MS-LOGI-M90', name: 'Logitech M90 Mouse', quantity: 8 }];
    render(<CreateRequestForm onClose={onClose} onSuccess={onSuccess} stockParts={stockParts} />);

    await user.type(screen.getByPlaceholderText('Item name'), 'Special cable');
    await user.click(screen.getByRole('button', { name: /create & save/i }));

    await waitFor(() => {
      expect(createPurchaseRequest).toHaveBeenCalledTimes(1);
    });
    const fd = vi.mocked(createPurchaseRequest).mock.calls[0][0] as FormData;
    const items = JSON.parse(fd.get('items') as string);
    expect(items[0].itemName).toBe('Special cable');
    expect(items[0].inventoryItemId).toBeUndefined();
  });
});
