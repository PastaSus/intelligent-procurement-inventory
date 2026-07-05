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
  let onClose: ReturnType<typeof vi.fn>;
  let onSuccess: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    uuidCounter = 0;
    onClose = vi.fn();
    onSuccess = vi.fn();
    vi.mocked(createPurchaseRequest).mockResolvedValue({
      success: true,
      data: { id: 'pr-1', pr_number: 'PR-20260705-ABCD', items: [] },
    });
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
});
