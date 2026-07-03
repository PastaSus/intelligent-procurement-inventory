'use client';

import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { useToast } from '@/lib/toast-context';

const variantStyles = {
  success: 'bg-muted/20 border-[#a9a9a9] text-foreground',
  error: 'bg-destructive/10 border-destructive text-destructive',
  warning: 'bg-[#402020]/10 border-[#402020] text-[#402020]',
  info: 'bg-muted/20 border-muted text-muted-foreground',
};

const iconStyles = {
  success: 'text-foreground',
  error: 'text-destructive',
  warning: 'text-[#402020]',
  info: 'text-muted-foreground',
};

const icons = {
  success: <CheckCircle className="h-5 w-5" />,
  error: <AlertCircle className="h-5 w-5" />,
  warning: <AlertCircle className="h-5 w-5" />,
  info: <Info className="h-5 w-5" />,
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-lg border
            shadow-lg pointer-events-auto animate-slide-in
            ${variantStyles[toast.variant]}
          `}
        >
          <div className={iconStyles[toast.variant]}>{icons[toast.variant]}</div>
          <p className="flex-1 text-sm font-medium">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-current opacity-50 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
