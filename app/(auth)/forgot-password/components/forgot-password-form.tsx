'use client';

import { useState, useTransition } from 'react';
import { requestPasswordReset } from '@/app/_actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/lib/toast-context';
import { Mail, Loader2, CheckCircle2 } from 'lucide-react';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await requestPasswordReset(email) as { success: boolean; resetUrl?: string; error?: string };

      if (result.success) {
        setSubmitted(true);
        setResetUrl(result.resetUrl ?? null);
        setEmail('');
        addToast('Reset link sent! Check your email.', 'success');
      } else {
        addToast(result.error || 'Failed to send reset link', 'error');
      }
    });
  };

  if (submitted) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800">
              Check your email
            </p>
            <p className="mt-1 text-sm text-green-700">
              If an account exists with that email, you&apos;ll receive a password reset link shortly.
            </p>
            {resetUrl && (
              <div className="mt-3 rounded border border-green-300 bg-green-100 px-3 py-2">
                <p className="text-xs font-medium text-green-700">Dev mode — quick link:</p>
                <a href={resetUrl} className="text-sm font-medium text-accent hover:underline break-all">
                  {resetUrl}
                </a>
              </div>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setSubmitted(false)}
        >
          Try a different email
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
            className="pl-10"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full" size="lg">
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sending...
          </>
        ) : (
          'Send Reset Link'
        )}
      </Button>
    </form>
  );
}
