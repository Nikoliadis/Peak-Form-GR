import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';

export default function AthleteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
