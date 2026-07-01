import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import DashboardHeader from './components/DashboardHeader';
import { Sidebar, BottomNavigation } from '@/components/navigation';
import { ChatBubble } from '@/components/ChatBubble';

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
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader user={session} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 container mx-auto py-6 px-4 pb-20 md:pb-6">
          {children}
        </main>
      </div>
      <BottomNavigation />
      <div className="md:hidden">
        <ChatBubble />
      </div>
    </div>
  );
}