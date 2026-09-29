import { redirect } from 'next/navigation';
import { supabaseConfig } from '@/lib/config';
import { getAdmin } from '@/lib/auth';
import { SetupNotice } from '@/components/setup-notice';
import { LoginForm } from '@/components/login-form';
export default async function LoginPage() {
  if (!supabaseConfig()) return <SetupNotice />;
  if (await getAdmin()) redirect('/admin');
  return <LoginForm />;
}
