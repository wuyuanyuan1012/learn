import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseConfig } from '@/lib/config';

export async function createClient() {
  const config = supabaseConfig();
  if (!config) throw new Error('请先配置 Supabase。');
  const cookieStore = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(values) {
        try { values.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
        catch { /* Server Components cannot set cookies; proxy.ts refreshes them. */ }
      },
    },
  });
}
