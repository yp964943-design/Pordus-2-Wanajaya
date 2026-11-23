'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import {
  Upload,
  ImagePlus,
  X,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Plus,
} from 'lucide-react';
import { GalleryItem } from '@/data/pordusData';
import { formatDateDDMMYYYY } from '@/lib/matchDateTime';

interface GalleryUploadFormProps {
  onAddPhotos: (items: GalleryItem[]) => Promise<boolean | 'cancelled'>;
  onClose: () => void;
}

interface PendingSlide {
  tempId: string;
  fileName: string;
  previewUrl: string;
  title: string;
  caption: string;
}

const GALLERY_CATEGORIES: GalleryItem['category'][] = [
  'Bulutangkis',
  'Bola Voli',
  'Tenis Meja',
  'Futsal Anak',
  'Seremoni',
];

const MAX_RAW_FILE_BYTES = 10 * 1024 * 1024; // 10 MB per file

async function compressImageToDataUrl(file: File): Promise<string> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Gagal membaca file gambar.'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const imageEl = new window.Image();
    imageEl.onload = () => resolve(imageEl);
    imageEl.onerror = () => reject(new Error('Format gambar tidak valid atau rusak.'));
    imageEl.src = rawDataUrl;
  });

  const drawScaled = (maxDim: number, quality: number): string => {
    let targetWidth = img.naturalWidth || img.width;
    let targetHeight = img.naturalHeight || img.height;

    if (targetWidth > maxDim || targetHeight > maxDim) {
      if (targetWidth >= targetHeight) {
        targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
        targetWidth = maxDim;
      } else {
        targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
        targetHeight = maxDim;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return rawDataUrl;
    }

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    const outputMime = file.type === 'image/png' ? 'image/webp' : 'image/jpeg';
    return canvas.toDataURL(outputMime, quality);
  };

  let compressed = drawScaled(960, 0.72);
  if (compressed.length > 680_000) {
    compressed = drawScaled(720, 0.55);
  }
  if (compressed.length > 820_000) {
    compressed = drawScaled(540, 0.42);
  }
  return compressed;
}

export default function GalleryUploadForm({
  onAddPhotos,
  onClose,
}: GalleryUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [slides, setSlides] = useState<PendingSlide[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [category, setCategory] = useState<GalleryItem['category']>('Bola Voli');
  const [dateIso, setDateIso] = useState('2026-11-15');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const activeSlide = slides[activeIndex] || slides[0];

  const handleFilesSelected = async (fileList: FileList | null | undefined) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMessage('');

    const files = Array.from(fileList);
    const validFiles: File[] = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Semua file harus berupa gambar (JPG, PNG, atau WEBP).');
        return;
      }
      if (file.size > MAX_RAW_FILE_BYTES) {
        setErrorMessage(`Ukuran file "${file.name}" melebihi batas maksimal 10 MB.`);
        return;
      }
      validFiles.push(file);
    }

    setIsProcessing(true);
    try {
      const processed = await Promise.all(
        validFiles.map(async (file, idx) => {
          const previewUrl = await compressImageToDataUrl(file);
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
          return {
            tempId: `pending-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
            fileName: file.name,
            previewUrl,
            title: cleanName || `Dokumentasi PORDUS ${idx + 1}`,
            caption: '',
          };
        })
      );

      setSlides((prev) => {
        const next = [...prev, ...processed];
        if (prev.length === 0) {
          setActiveIndex(0);
        } else {
          setActiveIndex(prev.length);
        }
        return next;
      });
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal memproses gambar.'
      );
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const updateActiveSlide = (patch: Partial<PendingSlide>) => {
    if (!activeSlide) return;
    setSlides((prev) =>
      prev.map((slide) =>
        slide.tempId === activeSlide.tempId ? { ...slide, ...patch } : slide
      )
    );
  };

  const removeSlide = (tempId: string) => {
    setSlides((prev) => {
      const next = prev.filter((s) => s.tempId !== tempId);
      setActiveIndex((curr) => Math.max(0, Math.min(curr, next.length - 1)));
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (slides.length === 0) {
      setErrorMessage('Pilih atau unggah minimal 1 file foto terlebih dahulu.');
      return;
    }

    const emptyTitleIndex = slides.findIndex((s) => !s.title.trim());
    if (emptyTitleIndex !== -1) {
      setActiveIndex(emptyTitleIndex);
      setErrorMessage(`Judul foto pada slide #${emptyTitleIndex + 1} wajib diisi.`);
      return;
    }

    const trimmedDate = formatDateDDMMYYYY(dateIso) || '15/11/2026';
    const baseTime = Date.now();

    const newItems: GalleryItem[] = slides.map((s, idx) => ({
      id: `custom-gallery-${baseTime}-${idx}`,
      title: s.title.trim(),
      category,
      imageUrl: s.previewUrl,
      caption:
        s.caption.trim() ||
        'Dokumentasi resmi pertandingan PORDUS 2 Wanajaya Ke-IV 2026.',
      date: trimmedDate,
      isCustom: true,
    }));

    setIsSaving(true);
    try {
      const saved = await onAddPhotos(newItems);
      if (saved === false) {
        setErrorMessage(
          'Gagal menyimpan foto galeri ke Google Drive. Pastikan akun Google Drive terhubung.'
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mb-8 sm:mb-10 rounded-3xl bg-white/[0.04] border border-cyan-400/30 p-4 sm:p-7 shadow-xl">
      <div className="flex items-start justify-between gap-4 pb-4 sm:pb-5 mb-5 sm:mb-6 border-b border-white/10">
        <div>
          <span className="text-xs font-semibold text-cyan-400 tracking-wide">
            Dokumentasi Turnamen · Slider Galeri
          </span>
          <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mt-0.5">
            Form Upload Galeri Foto Baru
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Unggah satu atau beberapa foto sekaligus untuk ditampilkan dalam galeri slider PORDUS 2 Wanajaya.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup form upload galeri"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mb-6 p-3.5 rounded-xl bg-rose-500/15 border border-rose-400/35 flex items-center gap-2.5 text-xs sm:text-sm text-rose-200"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Dropzone & Selected Slides Thumbnail Strip */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-200">
                File Foto Slider (Bisa pilih banyak foto)
              </label>
              {slides.length > 0 && (
                <span className="text-[11px] font-semibold text-cyan-300 tabular-nums">
                  {slides.length} Foto Dipilih
                </span>
              )}
            </div>

            <input
              ref={fileInputRef}
              id="gallery-photo-file"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFilesSelected(e.target.files)}
              className="sr-only"
            />

            {!activeSlide ? (
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFilesSelected(e.dataTransfer.files);
                }}
                className={`rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[240px] ${
                  isDragging
                    ? 'border-cyan-400 bg-cyan-500/15'
                    : 'border-white/20 bg-white/[0.02] hover:border-cyan-400/50 hover:bg-white/[0.05]'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 mb-3">
                  <ImagePlus className="w-6 h-6" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-white">
                  {isProcessing ? 'Memproses gambar...' : 'Klik atau seret foto ke sini'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Pilih 1 atau lebih foto · JPG, PNG, WEBP (maks. 10 MB/foto)
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Active Slide Preview */}
                <div className="rounded-2xl border border-white/15 bg-black/40 overflow-hidden">
                  <div className="relative aspect-[16/10] w-full">
                    <Image
                      src={activeSlide.previewUrl}
                      alt={activeSlide.title || 'Pratinjau foto slider'}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 text-xs text-white">
                      <span className="font-semibold truncate">
                        Slide {activeIndex + 1} dari {slides.length}
                      </span>
                      <span className="text-[11px] text-slate-300 truncate max-w-[55%]">
                        {activeSlide.fileName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Thumbnail Strip + Add More */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {slides.map((slide, idx) => (
                    <div
                      key={slide.tempId}
                      className={`relative w-24 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer group ${
                        idx === activeIndex
                          ? 'border-cyan-400 shadow-md shadow-cyan-500/20'
                          : 'border-white/15 opacity-75 hover:opacity-100'
                      }`}
                      onClick={() => setActiveIndex(idx)}
                    >
                      <Image
                        src={slide.previewUrl}
                        alt={slide.title || `Slide ${idx + 1}`}
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSlide(slide.tempId);
                        }}
                        aria-label={`Hapus slide ${idx + 1}`}
                        className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/80 hover:bg-rose-500 text-white flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-16 rounded-xl border border-dashed border-cyan-400/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 flex flex-col items-center justify-center gap-0.5 shrink-0 cursor-pointer transition-colors"
                    title="Tambah foto slide lain"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-[11px] font-semibold">Tambah</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Metadata Inputs */}
          <div className="lg:col-span-6 space-y-4">
            <div>
              <label
                htmlFor="gallery-photo-title"
                className="block text-xs font-semibold text-slate-200 mb-2"
              >
                {slides.length > 1
                  ? `Judul Foto (Slide #${activeIndex + 1})`
                  : 'Judul Foto'}
              </label>
              <input
                id="gallery-photo-title"
                type="text"
                value={activeSlide?.title ?? ''}
                onChange={(e) => updateActiveSlide({ title: e.target.value })}
                disabled={!activeSlide}
                placeholder="Contoh: Selebrasi Kemenangan Voli Putra RW 017"
                className="w-full min-h-[44px] px-3.5 py-2.5 text-sm rounded-xl glass-input bg-[#0a0f24] text-white border border-white/15 placeholder-slate-500 focus:ring-2 focus:ring-cyan-400 disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="gallery-photo-category"
                  className="block text-xs font-semibold text-slate-200 mb-2"
                >
                  Kategori
                </label>
                <select
                  id="gallery-photo-category"
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as GalleryItem['category'])
                  }
                  className="w-full min-h-[44px] px-3.5 py-2.5 text-sm rounded-xl glass-input bg-[#0a0f24] text-white border border-white/15 focus:ring-2 focus:ring-cyan-400 cursor-pointer"
                >
                  {GALLERY_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#0a0f24] text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="gallery-photo-date"
                  className="block text-xs font-semibold text-slate-200 mb-2"
                >
                  Tanggal Pertandingan
                </label>
                <input
                  id="gallery-photo-date"
                  type="date"
                  value={dateIso}
                  onChange={(e) => setDateIso(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 text-sm rounded-xl glass-input bg-[#0a0f24] text-white border border-white/15 focus:ring-2 focus:ring-cyan-400"
                  required
                />
                {dateIso && (
                  <p className="text-[11px] text-slate-400 mt-1.5 tabular-nums">
                    Format: {formatDateDDMMYYYY(dateIso)}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="gallery-photo-caption"
                className="block text-xs font-semibold text-slate-200 mb-2"
              >
                {slides.length > 1
                  ? `Keterangan Singkat (Slide #${activeIndex + 1})`
                  : 'Keterangan Singkat'}
              </label>
              <textarea
                id="gallery-photo-caption"
                rows={3}
                value={activeSlide?.caption ?? ''}
                onChange={(e) => updateActiveSlide({ caption: e.target.value })}
                disabled={!activeSlide}
                placeholder="Ceritakan momen singkat dari foto dokumentasi ini..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input bg-[#0a0f24] text-white border border-white/15 placeholder-slate-500 focus:ring-2 focus:ring-cyan-400 resize-none disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-400 text-center sm:text-left">
            Foto yang diunggah akan langsung tampil di Slider Galeri Foto Baru.
          </p>
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isProcessing || isSaving}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 text-slate-950 font-bold text-xs shadow-lg hover:shadow-[0_0_24px_rgba(34,211,238,0.35)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-60"
            >
              {isProcessing || isSaving ? (
                <>
                  <Upload className="w-4 h-4 animate-pulse" />
                  <span>{isSaving ? 'Menyimpan...' : 'Memproses...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {slides.length > 1
                      ? `Simpan ${slides.length} Foto ke Slider`
                      : 'Simpan ke Galeri Slider'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
