import Link from 'next/link';
import { ResetPasswordForm } from './components/reset-password-form';

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dept-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="rounded-xl border border-destructive/20 bg-card p-8 text-center shadow-2xl">
            <h1 className="text-2xl font-bold text-destructive">Invalid Link</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This password reset link is missing or invalid.
            </p>
            <Link
              href="/forgot-password"
              className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
            >
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-dept-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-dept-maroon/30 bg-card p-8 shadow-2xl shadow-dept-maroon/10">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-dept-maroon to-dept-crimson shadow-lg">
              <span className="text-2xl font-bold text-dept-gold">P</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Reset Password
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your new password below.
            </p>
          </div>
          <ResetPasswordForm token={token} />
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Remember your password?{' '}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
