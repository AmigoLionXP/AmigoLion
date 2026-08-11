import { redirect } from 'next/navigation';
import { getAuthedProfile } from '@/lib/auth';
import { DashboardShell } from '@/components/DashboardShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getAuthedProfile();
  if (!profile) redirect('/login');

  return (
    <DashboardShell role={profile.role} fullName={profile.fullName}>
      {children}
    </DashboardShell>
  );
}
