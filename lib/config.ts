export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('your-project') || key === 'your-publishable-key') return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.hostname !== '127.0.0.1' && parsed.hostname !== 'localhost') return null;
  } catch { return null; }
  return { url, key };
}
