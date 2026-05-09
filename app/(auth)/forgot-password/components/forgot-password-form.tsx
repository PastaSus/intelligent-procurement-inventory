'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/app/_actions/auth';
import { useToast } from '@/lib/toast-context';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await requestPasswordReset(email);

      if (result.success) {
        setSubmitted(true);
        setEmail('');
        addToast('Reset link sent! Check your email.', 'success');
      } else {
        addToast(result.error || 'Failed to send reset link', 'error');
      }
    });
  };

  if (submitted) {
    return (
      <div className="text-center space-y-4">
        <div className="rounded-lg bg-green-50 p-4">
          <p className="text-sm text-green-800">
            If an account exists with that email, you'll receive a password reset link shortly.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Didn't receive an email?{' '}
          <button
            onClick={() => setSubmitted(false)}
            className="font-medium text-primary hover:underline"
          >
            Try again
          </button>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          placeholder="you@example.com"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Sending...' : 'Send Reset Link'}
      </button>
    </form>
  );
}
