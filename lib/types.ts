export type Season = 'autumn' | 'winter' | 'summer' | 'other';
export type Crop = { x: number; y: number; width: number; height: number };
export type Uniform = {
  id: string;
  title: string;
  description: string;
  season: Season;
  status: 'draft' | 'published';
  image_path: string;
  image_width: number;
  image_height: number;
  image_crop: Crop | null;
  created_at: string;
  updated_at: string;
};
export type GalleryItem = Uniform & { image_url: string };
export const seasonNames: Record<Season, string> = {
  autumn: '春秋装', winter: '冬装', summer: '夏装', other: '其他',
};
export const PAGE_SIZE = 6;
export const ADMIN_PAGE_SIZE = 10;
export const BUCKET = 'uniform-images';
