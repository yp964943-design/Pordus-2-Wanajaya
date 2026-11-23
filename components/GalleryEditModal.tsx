'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { AlertCircle, CheckCircle2, Pencil, X } from 'lucide-react';
import { GalleryItem } from '@/data/pordusData';
import { formatDateDDMMYYYY } from '@/lib/matchDateTime';

interface GalleryEditModalProps {
  item: GalleryItem;
  onSave: (patch: {
    title: string;
    category: GalleryItem['category'];
    caption: string;
    date: string;
  }) => Promise<boolean>;
  onClose: () => void;
}

const GALLERY_CATEGORIES: GalleryItem['category'][] = [
  'Bulutangkis',
  'Bola Voli',
  'Tenis Meja',
  'Futsal Anak',
  'Seremoni',
];

export default function GalleryEditModal({
  item,
  onSave,
  onClose,
}: GalleryEditModalProps) {
  const [title, setTitle] = useState(item.title);
  const [category, setCategory] = useState<GalleryItem['category']>(item.category);
  const [date, setDate] = useState(formatDateDDMMYYYY(item.date));
  const [caption, setCaption] = useState(item.caption);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSaving, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedTitle = title.trim();
    const trimmedDate = date.trim();
    const trimmedCaption = caption.trim();

    if (!trimmedTitle) {
      setErrorMessage('Judul foto wajib diisi.');
      return;
    }
    if (!trimmedDate) {
      setErrorMessage('Tanggal pertandingan wajib diisi.');
      return;
    }

    const formattedDate = formatDateDDMMYYYY(trimmedDate);
    setIsSaving(true);
    try {
      const ok = await onSave({
        title: trimmedTitle.slice(0, 160),
        category,
        date: formattedDate.slice(0, 80),
        caption: trimmedCaption.slice(0, 500),
      });
      if (!ok) {
        setErrorMessage('Gagal menyimpan perubahan keterangan foto ke server. Coba lagi.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      onClick={() => {
        if (!isSaving) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-gallery-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-2xl glass-card rounded-t-3xl sm:rounded-3xl border border-cyan-400/30 bg-[#0b1022] p-4 sm:p-7 shadow-2xl max-h-[92dvh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 mb-5 border-b border-white/10">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-cyan-400 tracking-wide">
                Menu Admin · Galeri Dokumentasi
              </span>
              <h3
                id="edit-gallery-modal-title"
                className="text-lg sm:text-xl font-extrabold text-white tracking-tight mt-0.5"
              >
                Edit Keterangan Foto Galeri
              </h3>
            </div>
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            aria-label="Tutup menu edit keterangan foto"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Photo Preview Strip */}
        <div className="mb-5 flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
          <div className="relative w-24 sm:w-28 aspect-[16/10] rounded-xl overflow-hidden shrink-0 border border-white/15 bg-black">
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-cyan-300">
              {item.isCustom ? 'Foto Unggahan Admin' : 'Foto Dokumentasi Utama'}
            </p>
            <p className="text-xs sm:text-sm font-bold text-white truncate mt-0.5">
              {item.title}
            </p>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {item.category} · {formatDateDDMMYYYY(item.date)}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-400/35 flex items-center gap-2.5 text-xs sm:text-sm text-rose-200"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="edit-gallery-title"
              className="block text-xs font-semibold text-slate-200 mb-2"
            >
              Judul Foto
            </label>
            <input
              id="edit-gallery-title"
              type="text"
              value={title}
              maxLength={160}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Duel Sengit Babak Penyisihan Bola Voli"
              className="w-full min-h-[44px] px-3.5 py-2.5 text-sm rounded-xl glass-input bg-[#070b1a] text-white border border-white/15 placeholder-slate-500 focus:ring-2 focus:ring-cyan-400"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="edit-gallery-category"
                className="block text-xs font-semibold text-slate-200 mb-2"
              >
                Kategori
              </label>
              <select
                id="edit-gallery-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as GalleryItem['category'])}
                className="w-full min-h-[44px] px-3.5 py-2.5 text-sm rounded-xl glass-input bg-[#070b1a] text-white border border-white/15 focus:ring-2 focus:ring-cyan-400 cursor-pointer"
              >
                {GALLERY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#070b1a] text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="edit-gallery-date"
                className="block text-xs font-semibold text-slate-200 mb-2"
              >
                Tanggal Kegiatan
              </label>
              <input
                id="edit-gallery-date"
                type="text"
                value={date}
                maxLength={80}
                onChange={(e) => setDate(e.target.value)}
                placeholder="Contoh: 15/11/2026"
                className="w-full min-h-[44px] px-3.5 py-2.5 text-sm rounded-xl glass-input bg-[#070b1a] text-white border border-white/15 placeholder-slate-500 focus:ring-2 focus:ring-cyan-400"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="edit-gallery-caption"
                className="block text-xs font-semibold text-slate-200"
              >
                Keterangan Foto
              </label>
              <span className="text-[11px] text-slate-400 tabular-nums">
                {caption.length}/500
              </span>
            </div>
            <textarea
              id="edit-gallery-caption"
              rows={4}
              value={caption}
              maxLength={500}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Tulis keterangan lengkap mengenai momen foto ini..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input bg-[#070b1a] text-white border border-white/15 placeholder-slate-500 focus:ring-2 focus:ring-cyan-400 resize-none"
            />
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 text-slate-950 font-bold text-xs shadow-lg hover:shadow-[0_0_24px_rgba(34,211,238,0.35)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-60"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
