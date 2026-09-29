import { z } from 'zod';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const mimeExtensions: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
};
export function validateImage(file: { size: number; type: string }) {
  if (!mimeExtensions[file.type]) return '请选择 JPG、PNG 或 WebP 图片。';
  if (!file.size || file.size > MAX_IMAGE_BYTES) return '图片不能为空，且不能超过 5 MB。';
  return null;
}
export const uniformSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().min(1, '请输入款式名称。').max(80, '名称不能超过 80 个字。'),
  description: z.string().trim().min(1, '请输入款式介绍。').max(3000, '介绍不能超过 3000 个字。'),
  season: z.enum(['autumn', 'winter', 'summer', 'other']),
  status: z.enum(['draft', 'published']),
  image_path: z.string().max(250).regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/, '图片路径无效。'),
  image_width: z.number().int().min(1).max(20000),
  image_height: z.number().int().min(1).max(20000),
});
export type UniformInput = z.infer<typeof uniformSchema>;
export function pageNumber(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d+$/.test(raw)) return 1;
  return Math.min(100000, Math.max(1, Number(raw)));
}
export function seasonFilter(value: string | string[] | undefined) {
  return z.enum(['autumn', 'winter', 'summer', 'other']).safeParse(value).data;
}
