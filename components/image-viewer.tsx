'use client';
import { useRef, useState } from 'react';
import { Media } from '@/components/media';
import { Icon } from '@/components/icon';
import type { GalleryItem } from '@/lib/types';

export function ImageViewer({ item }: { item: GalleryItem }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [zoom, setZoom] = useState(false);
  function close() { dialog.current?.close(); document.body.style.overflow = ''; }
  return <>
    <button className="detail-image" onClick={() => { setZoom(false); dialog.current?.showModal(); document.body.style.overflow = 'hidden'; }} aria-label={`查看大图：${item.title}`}>
      <Media item={item} eager /><span className="image-hint"><Icon name="image" size={16} />点击查看大图</span>
    </button>
    <dialog ref={dialog} className="image-dialog" onClose={() => { document.body.style.overflow = ''; }} onClick={e => { if (e.target === e.currentTarget) { const box = e.currentTarget.getBoundingClientRect(); if (e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom) close(); } }} aria-label={item.title}>
      <div className="dialog-toolbar"><span>{item.title}</span><button className="icon-button" onClick={close} aria-label="关闭大图"><Icon name="close" /></button></div>
      <div className={`zoom-stage ${zoom ? 'is-zoomed' : ''}`}><Media item={item} /></div>
      <button className="button secondary" aria-pressed={zoom} onClick={() => setZoom(!zoom)}>{zoom ? '适合屏幕' : '放大查看细节'}</button>
    </dialog>
  </>;
}
