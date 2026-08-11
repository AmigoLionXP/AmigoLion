import { redirect } from 'next/navigation';
import { getAuthedProfile } from '@/lib/auth';
import { MemberHome } from '@/components/dashboard/member/MemberHome';
import { RepHome } from '@/components/dashboard/rep/RepHome';
import { AdminHome } from '@/components/dashboard/admin/AdminHome';

export default async function DashboardIndex() {
  const profile = await getAuthedProfile();
  if (!profile) redirect('/login');
  if (profile.role === 'admin') return <AdminHome />;
  if (profile.role === 'rep') return <RepHome />;
  return <MemberHome />;
}
