import type { GalleryItem } from '@/lib/types';

export function Media({ item, className = '', eager = false }: { item: GalleryItem; className?: string; eager?: boolean }) {
  const crop = item.image_crop;
  if (crop) return <svg className={`uniform-media ${className}`} role="img" aria-label={item.title} viewBox={`${crop.x} ${crop.y} ${crop.width} ${crop.height}`} width={crop.width} height={crop.height}>
    <image href={item.image_url} width={item.image_width} height={item.image_height} />
  </svg>;
  return <img className={`uniform-media ${className}`} src={item.image_url} alt={item.title} width={item.image_width} height={item.image_height} loading={eager ? 'eager' : 'lazy'} decoding="async" />;
}
