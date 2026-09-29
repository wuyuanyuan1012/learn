import source from './demo-data.json';
import type { Uniform } from './types';

export const demoItems = source.items as (Uniform & { asset_key: string })[];
export const demoAssets = source.assets as Record<string, { path: string; width: number; height: number }>;
