import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LoginForm } from './components/LoginForm';

export default async function LoginPage() {
  // Check if user already logged in → redirect to dashboard
  const session = await getSession();
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
