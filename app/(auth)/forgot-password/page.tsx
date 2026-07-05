import Link from 'next/link';
import { ForgotPasswordForm } from './components/forgot-password-form';

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-dept-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-dept-maroon/30 bg-card p-8 shadow-2xl shadow-dept-maroon/10">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-dept-maroon to-dept-crimson shadow-lg">
              <span className="text-2xl font-bold text-dept-gold">P</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Forgot Password
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>
          <ForgotPasswordForm />
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
