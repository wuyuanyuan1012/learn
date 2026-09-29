'use client';
import { createBrowserClient } from '@supabase/ssr';
import { supabaseConfig } from '@/lib/config';

export function createClient() {
  const config = supabaseConfig();
  if (!config) throw new Error('请先配置 Supabase。');
  return createBrowserClient(config.url, config.key);
}
