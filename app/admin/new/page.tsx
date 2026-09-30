import { supabaseConfig } from '@/lib/config';
import { requireAdmin } from '@/lib/auth';
import { SetupNotice } from '@/components/setup-notice';
import { LessonForm } from '@/components/lesson-form';
export default async function NewLessonPage() {
  if (!supabaseConfig()) return <SetupNotice />;
  await requireAdmin(); return <LessonForm />;
}
