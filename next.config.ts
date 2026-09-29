import type { NextConfig } from 'next';

const config: NextConfig = {
  poweredByHeader: false,
  // Vercel's Supabase integration prefixes variables with the store name.
  // Only these two public values may be included in browser bundles.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.WYY_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_WYY_SUPABASE_PUBLISHABLE_KEY || process.env.WYY_SUPABASE_ANON_KEY || '',
  },
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    }];
  },
};
export default config;
