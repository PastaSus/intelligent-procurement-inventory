import { vi } from 'vitest';
import React from 'react';

export const useToast = vi.fn().mockReturnValue({ addToast: vi.fn() });
export const ToastProvider = ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children);
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';
export interface Toast { id: string; message: string; variant: ToastVariant; duration?: number; }
