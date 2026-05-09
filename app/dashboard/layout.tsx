import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import DashboardHeader from './components/DashboardHeader';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session} />
      <main className="container mx-auto py-6 px-4">
        {children}
      </main>
    </div>
  );
}