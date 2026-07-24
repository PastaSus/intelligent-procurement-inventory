import Image from 'next/image';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LoginForm } from './components/LoginForm';

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-dept-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-dept-maroon/30 bg-card p-8 shadow-2xl shadow-dept-maroon/10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
              <Image
                src="/ccs-logo-upscaled.png"
                alt="Procurvin"
                width={64}
                height={64}
                className="h-16 w-16"
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Procurvin
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Intelligent Lab Asset Tracker
            </p>
          </div>
          <LoginForm />
          <div className="mt-6 text-center">
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              Forgot your password?
            </Link>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-dept-gray-400">
          &copy; {new Date().getFullYear()} Procurvin. All rights reserved.
        </p>
      </div>
    </div>
  );
}
