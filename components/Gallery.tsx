'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import {
  Maximize2,
  X,
  Upload,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  CalendarDays,
  ChevronDown,
  Pencil,
  Filter,
  Images,
} from 'lucide-react';
import { GALLERY_ITEMS, GalleryItem } from '@/data/pordusData';
import GalleryUploadForm from '@/components/GalleryUploadForm';
import GalleryEditModal from '@/components/GalleryEditModal';
import {
  removeGalleryItem,
  saveGalleryItems,
  updateGalleryItem,
  useGallerySync,
} from '@/lib/tournamentSync';

interface GalleryProps {
  isAdmin: boolean;
  isUploadOpen: boolean;
  onToggleUpload: (open: boolean) => void;
  onRequestAdminLogin: () => void;
}

export default function Gallery({
  isAdmin,
  isUploadOpen,
  onToggleUpload,
  onRequestAdminLogin,
}: GalleryProps) {
  const [filter, setFilter] = useState<string>('Semua');
  const [dateFilter, setDateFilter] = useState<string>('Semua');
  const [slideIndex, setSlideIndex] = useState<number>(0);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const touchStartXRef = useRef<number | null>(null);

  const { customItems, defaultOverrides } = useGallerySync();

  const allItems = useMemo<GalleryItem[]>(() => {
    const mergedDefaults = GALLERY_ITEMS.map(
      (item) => defaultOverrides[item.id] ?? item
    );
    return [...customItems, ...mergedDefaults];
  }, [customItems, defaultOverrides]);

  const uniqueDates = useMemo(() => {
    return Array.from(new Set(allItems.map((item) => item.date)));
  }, [allItems]);

  const { groupedAlbums, orderedItems } = useMemo(() => {
    const matched = allItems.filter((item) => {
      const matchesSport =
        filter === 'Semua'
          ? true
          : filter === 'Foto Baru'
            ? Boolean(item.isCustom)
            : item.category === filter;
      const matchesDate = dateFilter === 'Semua' || item.date === dateFilter;
      return matchesSport && matchesDate;
    });

    const albumMap = new Map<
      string,
      { key: string; category: string; date: string; items: GalleryItem[]; startIndex: number }
    >();

    matched.forEach((item) => {
      const normalizedCategory = item.category.trim();
      const normalizedDate = item.date.trim();
      const key = `${normalizedCategory}::${normalizedDate}`;
      const existing = albumMap.get(key);
      if (existing) {
        existing.items.push(item);
      } else {
        albumMap.set(key, {
          key,
          category: normalizedCategory,
          date: normalizedDate,
          items: [item],
          startIndex: 0,
        });
      }
    });

    const albums: {
      key: string;
      category: string;
      date: string;
      items: GalleryItem[];
      startIndex: number;
    }[] = [];
    const flattened: GalleryItem[] = [];

    albumMap.forEach((album) => {
      albums.push({
        ...album,
        startIndex: flattened.length,
      });
      flattened.push(...album.items);
    });

    return { groupedAlbums: albums, orderedItems: flattened };
  }, [allItems, filter, dateFilter]);

  const GROUPS_PER_PAGE = 5;
  const [currentAlbumPage, setCurrentAlbumPage] = useState<number>(1);

  const isFilteredView = filter !== 'Semua' || dateFilter !== 'Semua';
  const totalAlbumPages = isFilteredView
    ? 1
    : Math.max(1, Math.ceil(groupedAlbums.length / GROUPS_PER_PAGE));
  const safeAlbumPage = isFilteredView
    ? 1
    : Math.min(Math.max(1, currentAlbumPage), totalAlbumPages);

  const visibleAlbums = useMemo(() => {
    if (isFilteredView) return groupedAlbums;
    const start = (safeAlbumPage - 1) * GROUPS_PER_PAGE;
    return groupedAlbums.slice(start, start + GROUPS_PER_PAGE);
  }, [groupedAlbums, isFilteredView, safeAlbumPage]);

  const visibleSlideIndices = useMemo(() => {
    const indices: number[] = [];
    visibleAlbums.forEach((album) => {
      for (let i = 0; i < album.items.length; i += 1) {
        indices.push(album.startIndex + i);
      }
    });
    return indices;
  }, [visibleAlbums]);

  const itemCount = orderedItems.length;
  const safeIndex = itemCount > 0 ? ((slideIndex % itemCount) + itemCount) % itemCount : 0;
  const activeSlideItem = itemCount > 0 ? orderedItems[safeIndex] : null;
  const lightboxIndex = activePhotoId
    ? orderedItems.findIndex((item) => item.id === activePhotoId)
    : -1;
  const activeLightboxPhoto =
    lightboxIndex >= 0 ? orderedItems[lightboxIndex] : null;

  const isEditingModalOpen = editingItem !== null;

  useEffect(() => {
    if (
      !isAutoPlaying ||
      visibleSlideIndices.length <= 1 ||
      activePhotoId ||
      isEditingModalOpen
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      setSlideDirection(1);
      setSlideIndex((prev) => {
        const currentPos = visibleSlideIndices.indexOf(prev);
        if (currentPos < 0) return visibleSlideIndices[0];
        return visibleSlideIndices[(currentPos + 1) % visibleSlideIndices.length];
      });
    }, 4500);
    return () => window.clearInterval(timer);
  }, [isAutoPlaying, visibleSlideIndices, activePhotoId, isEditingModalOpen]);

  useEffect(() => {
    if (!activePhotoId || isEditingModalOpen || itemCount === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePhotoId(null);
      } else if (e.key === 'ArrowRight') {
        setActivePhotoId((currId) => {
          const idx = orderedItems.findIndex((item) => item.id === currId);
          if (idx < 0) return currId;
          return orderedItems[(idx + 1) % itemCount].id;
        });
      } else if (e.key === 'ArrowLeft') {
        setActivePhotoId((currId) => {
          const idx = orderedItems.findIndex((item) => item.id === currId);
          if (idx < 0) return currId;
          return orderedItems[(idx - 1 + itemCount) % itemCount].id;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhotoId, isEditingModalOpen, itemCount, orderedItems]);

  const syncPageForGlobalIndex = (targetIdx: number) => {
    if (isFilteredView || groupedAlbums.length === 0) return;
    const albumIdx = groupedAlbums.findIndex(
      (album) =>
        targetIdx >= album.startIndex &&
        targetIdx < album.startIndex + album.items.length
    );
    if (albumIdx >= 0) {
      setCurrentAlbumPage(Math.floor(albumIdx / GROUPS_PER_PAGE) + 1);
    }
  };

  const goToNextSlide = () => {
    if (itemCount <= 1) return;
    const nextIdx = (safeIndex + 1) % itemCount;
    setSlideDirection(1);
    setSlideIndex(nextIdx);
    syncPageForGlobalIndex(nextIdx);
  };

  const goToPrevSlide = () => {
    if (itemCount <= 1) return;
    const prevIdx = (safeIndex - 1 + itemCount) % itemCount;
    setSlideDirection(-1);
    setSlideIndex(prevIdx);
    syncPageForGlobalIndex(prevIdx);
  };

  const handleSelectSlide = (targetIdx: number) => {
    setSlideDirection(targetIdx >= safeIndex ? 1 : -1);
    setSlideIndex(targetIdx);
    syncPageForGlobalIndex(targetIdx);
  };

  const handleAlbumPageChange = (nextPage: number) => {
    const clamped = Math.min(Math.max(1, nextPage), totalAlbumPages);
    setCurrentAlbumPage(clamped);
    const firstAlbumOnPage = groupedAlbums[(clamped - 1) * GROUPS_PER_PAGE];
    if (firstAlbumOnPage) {
      setSlideDirection(clamped >= safeAlbumPage ? 1 : -1);
      setSlideIndex(firstAlbumOnPage.startIndex);
    }
  };

  const handleFilterChange = (nextFilter: string) => {
    setFilter(nextFilter);
    setCurrentAlbumPage(1);
    setSlideDirection(1);
    setSlideIndex(0);
  };

  const handleDateFilterChange = (nextDate: string) => {
    setDateFilter(nextDate);
    setCurrentAlbumPage(1);
    setSlideDirection(1);
    setSlideIndex(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (
    e: React.TouchEvent,
    onSwipeLeft: () => void,
    onSwipeRight: () => void
  ) => {
    if (touchStartXRef.current === null) return;
    const endX = e.changedTouches[0]?.clientX;
    if (typeof endX !== 'number') {
      touchStartXRef.current = null;
      return;
    }
    const delta = endX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (Math.abs(delta) < 45) return;
    if (delta < 0) {
      onSwipeLeft();
    } else {
      onSwipeRight();
    }
  };

  const handleAddPhotos = async (newItems: GalleryItem[]): Promise<boolean> => {
    if (!isAdmin) {
      onRequestAdminLogin?.();
      return false;
    }
    const result = await saveGalleryItems(newItems);
    if (!result.syncedToCloud) {
      setSuccessMessage('Gagal mengunggah foto ke server. Periksa koneksi internet Anda dan coba lagi.');
      return false;
    }
    setFilter('Foto Baru');
    setDateFilter('Semua');
    setSlideDirection(1);
    setSlideIndex(0);
    onToggleUpload(false);
    const label =
      newItems.length > 1
        ? `${newItems.length} foto baru berhasil diunggah ke Galeri Slider.`
        : `Foto "${newItems[0]?.title}" berhasil diunggah ke Galeri Slider.`;
    setSuccessMessage(`${label} Tersinkronisasi ke semua device.`);
    return true;
  };

  const handleDeleteCustomPhoto = async (id: string) => {
    if (!isAdmin) {
      onRequestAdminLogin();
      return;
    }
    const remainingCount = customItems.filter((item) => item.id !== id).length;
    await removeGalleryItem(id);
    if (activePhotoId === id) {
      setActivePhotoId(null);
    }
    if (filter === 'Foto Baru' && remainingCount === 0) {
      setFilter('Semua');
    }
    setSlideIndex(0);
  };

  const handleOpenEditPhoto = (item: GalleryItem) => {
    if (!isAdmin) {
      onRequestAdminLogin();
      return;
    }
    setEditingItem(item);
  };

  const handleSaveEditedPhoto = async (patch: {
    title: string;
    category: GalleryItem['category'];
    caption: string;
    date: string;
  }): Promise<boolean> => {
    if (!isAdmin || !editingItem) {
      onRequestAdminLogin();
      return false;
    }
    const result = await updateGalleryItem(editingItem, patch);
    if (!result.syncedToCloud) {
      return false;
    }
    setSuccessMessage(
      `Keterangan foto "${patch.title}" berhasil diperbarui. Tersinkronisasi ke semua device.`
    );
    setEditingItem(null);
    return true;
  };

  const handleSelectPhotoFromDropdown = (selectedId: string) => {
    if (!selectedId) return;
    const idx = orderedItems.findIndex((item) => item.id === selectedId);
    if (idx < 0) return;
    handleSelectSlide(idx);
  };

  const filterCategories = [
    'Semua',
    ...(customItems.length > 0 ? ['Foto Baru'] : []),
    'Bulutangkis',
    'Bola Voli',
    'Tenis Meja',
    'Futsal Anak',
    'Seremoni',
  ];

  return (
    <section id="galeri" className="py-8 md:py-12 relative">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-7 sm:mb-10">
          <span className="text-xs font-bold tracking-widest text-cyan-400 uppercase">
            Momen Kebersamaan & Dokumentasi Laga
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
            GALERI
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-cyan-400 to-emerald-400 mx-auto mt-3.5 sm:mt-4 rounded-full" />
          <p className="mt-3.5 sm:mt-4 text-sm sm:text-base text-slate-300">
            Rekaman aksi heroik, perjuangan atlet, gemuruh supporter warga, dan selebrasi juara turnamen PORDUS 2 Wanajaya.
          </p>
        </div>

        {/* Dropdown Controls (Kategori, Tanggal, Pilih Foto) + Upload Galeri CTA */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-5 sm:mb-8">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
            {/* Category Filter Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="gallery-category-select"
                className="text-xs text-slate-400 flex items-center gap-1.5 whitespace-nowrap"
              >
                <Filter className="w-3.5 h-3.5 text-cyan-400" />
                <span>Kategori Galeri:</span>
              </label>
              <div className="relative">
                <select
                  id="gallery-category-select"
                  value={filter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="w-full min-h-[44px] appearance-none pl-4 pr-10 py-2 text-xs sm:text-sm font-medium rounded-xl glass-input bg-[#0a0f24] text-slate-100 border border-white/15 focus:ring-2 focus:ring-cyan-400 cursor-pointer"
                >
                  {filterCategories.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#0a0f24] text-white">
                      {cat === 'Semua'
                        ? 'Semua Kategori'
                        : cat === 'Foto Baru'
                          ? `Foto Baru (${customItems.length})`
                          : cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Date Filter Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="gallery-date-select"
                className="text-xs text-slate-400 flex items-center gap-1.5 whitespace-nowrap"
              >
                <CalendarDays className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tanggal:</span>
              </label>
              <div className="relative">
                <select
                  id="gallery-date-select"
                  value={dateFilter}
                  onChange={(e) => handleDateFilterChange(e.target.value)}
                  className="w-full min-h-[44px] appearance-none pl-4 pr-10 py-2 text-xs sm:text-sm font-medium rounded-xl glass-input bg-[#0a0f24] text-slate-100 border border-white/15 focus:ring-2 focus:ring-cyan-400 cursor-pointer"
                >
                  <option value="Semua" className="bg-[#0a0f24] text-white">
                    Semua Tanggal
                  </option>
                  {uniqueDates.map((d) => (
                    <option key={d} value={d} className="bg-[#0a0f24] text-white">
                      {d}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Direct Photo Selector Dropdown */}
            <div className="flex flex-col gap-1.5 col-span-2 lg:col-span-1">
              <label
                htmlFor="gallery-photo-select"
                className="text-xs text-slate-400 flex items-center gap-1.5 whitespace-nowrap"
              >
                <Images className="w-3.5 h-3.5 text-sky-400" />
                <span>Pilih Foto:</span>
              </label>
              <div className="relative">
                <select
                  id="gallery-photo-select"
                  value={itemCount > 0 && activeSlideItem ? activeSlideItem.id : ''}
                  disabled={itemCount === 0}
                  onChange={(e) => handleSelectPhotoFromDropdown(e.target.value)}
                  className="w-full min-h-[44px] appearance-none pl-4 pr-10 py-2 text-xs sm:text-sm font-medium rounded-xl glass-input bg-[#0a0f24] text-slate-100 border border-white/15 focus:ring-2 focus:ring-cyan-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {itemCount === 0 ? (
                    <option value="" className="bg-[#0a0f24] text-slate-400">
                      Tidak ada foto tersedia
                    </option>
                  ) : (
                    <>
                      {groupedAlbums.map((album) => (
                        <optgroup
                          key={album.key}
                          label={`${album.category} · ${album.date} (${album.items.length} Foto)`}
                          className="bg-[#0a0f24] text-cyan-300 font-bold"
                        >
                          {album.items.map((item, localIdx) => {
                            const globalIdx = album.startIndex + localIdx;
                            return (
                              <option
                                key={item.id}
                                value={item.id}
                                className="bg-[#0a0f24] text-white font-normal"
                              >
                                {String(globalIdx + 1).padStart(2, '0')} · {item.title}
                              </option>
                            );
                          })}
                        </optgroup>
                      ))}
                    </>
                  )}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <p className="text-xs text-slate-400 tabular-nums">
              Menampilkan <span className="font-semibold text-slate-200">{itemCount}</span> foto dokumentasi
            </p>

            {isAdmin && (
              <div className="flex flex-wrap items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onToggleUpload(!isUploadOpen)}
                  className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                    isUploadOpen
                      ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40'
                      : 'bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 text-slate-950 shadow-md hover:shadow-[0_0_20px_rgba(34,211,238,0.35)] active:scale-95'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>{isUploadOpen ? 'Tutup Form Upload' : 'Upload Galeri'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Success Feedback Banner */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/35 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-xs sm:text-sm font-medium text-emerald-100">
                {successMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage('')}
              aria-label="Tutup notifikasi"
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-white/10 text-emerald-200 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Collapsible Gallery Upload Form (Admin Only) */}
        <AnimatePresence initial={false}>
          {isAdmin && isUploadOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <GalleryUploadForm
                onAddPhotos={handleAddPhotos}
                onClose={() => onToggleUpload(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {itemCount === 0 ? (
          <div className="glass-card rounded-3xl border border-white/15 p-10 text-center text-sm text-slate-400">
            Belum ada foto untuk kombinasi cabang olahraga dan tanggal tersebut.
          </div>
        ) : activeSlideItem ? (
          /* SLIDER VIEW */
          <div className="space-y-5">
            {/* Main Stage Slider with Mobile Touch Swipe */}
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={(e) => handleTouchEnd(e, goToNextSlide, goToPrevSlide)}
              className="relative glass-card rounded-3xl overflow-hidden border border-white/15 bg-black/50 touch-pan-y"
            >
              <div className="relative aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/10] w-full overflow-hidden">
                <AnimatePresence mode="wait" custom={slideDirection}>
                  <motion.div
                    key={activeSlideItem.id}
                    custom={slideDirection}
                    initial={{ opacity: 0, x: slideDirection * 48 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -slideDirection * 48 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => setActivePhotoId(activeSlideItem.id)}
                    className="absolute inset-0 cursor-pointer"
                  >
                    <Image
                      src={activeSlideItem.imageUrl}
                      alt={activeSlideItem.title}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#070913]/65 sm:from-[#070913]/95 via-transparent sm:via-[#070913]/40 to-black/25" />
                  </motion.div>
                </AnimatePresence>

                {/* Top Control Bar on Slide */}
                <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 z-10 flex items-center justify-between gap-2 sm:gap-3 pointer-events-none">
                  <div className="min-h-[40px] flex items-center gap-2 text-xs font-semibold text-slate-200 bg-black/55 backdrop-blur-md px-3 sm:px-3.5 py-2 rounded-xl border border-white/15 pointer-events-auto tabular-nums">
                    <span className="text-cyan-300 font-bold">
                      {String(safeIndex + 1).padStart(2, '0')}
                    </span>
                    <span className="text-slate-500">/</span>
                    <span>{String(itemCount).padStart(2, '0')}</span>
                    {activeSlideItem.isCustom && (
                      <>
                        <span className="text-slate-500" aria-hidden="true">·</span>
                        <span className="text-emerald-300 font-semibold">Foto Baru</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
                    {itemCount > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAutoPlaying((prev) => !prev);
                        }}
                        aria-label={isAutoPlaying ? 'Jeda slider otomatis' : 'Putar slider otomatis'}
                        title={isAutoPlaying ? 'Jeda slider' : 'Putar otomatis'}
                        className="w-11 h-11 rounded-xl bg-black/55 hover:bg-black/80 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                      >
                        {isAutoPlaying ? (
                          <Pause className="w-4 h-4 text-cyan-300" />
                        ) : (
                          <Play className="w-4 h-4 text-emerald-300" />
                        )}
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditPhoto(activeSlideItem);
                        }}
                        aria-label={`Edit keterangan foto ${activeSlideItem.title}`}
                        title="Edit keterangan foto"
                        className="min-h-[44px] px-3 sm:px-3.5 rounded-xl bg-black/55 hover:bg-cyan-500/80 hover:text-slate-950 backdrop-blur-md border border-white/20 flex items-center justify-center gap-1.5 text-xs font-semibold text-white transition-colors cursor-pointer"
                      >
                        <Pencil className="w-4 h-4 shrink-0" />
                        <span className="hidden sm:inline">Edit Keterangan</span>
                      </button>
                    )}

                    {isAdmin && activeSlideItem.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDeleteCustomPhoto(activeSlideItem.id);
                        }}
                        aria-label={`Hapus foto ${activeSlideItem.title}`}
                        title="Hapus foto unggahan"
                        className="w-11 h-11 rounded-xl bg-black/55 hover:bg-rose-500/80 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhotoId(activeSlideItem.id);
                      }}
                      aria-label="Perbesar foto"
                      title="Lihat layar penuh"
                      className="w-11 h-11 rounded-xl bg-black/55 hover:bg-black/80 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Prev / Next Navigation Buttons */}
                {itemCount > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        goToPrevSlide();
                      }}
                      aria-label="Foto sebelumnya"
                      className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/60 hover:bg-cyan-500 hover:text-slate-950 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer shadow-lg"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        goToNextSlide();
                      }}
                      aria-label="Foto berikutnya"
                      className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/60 hover:bg-cyan-500 hover:text-slate-950 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer shadow-lg"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Desktop & Tablet Caption Overlay */}
                <div className="hidden sm:block absolute bottom-7 left-8 right-8 z-10 pointer-events-none">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-cyan-300 font-semibold mb-1.5">
                    <span>{activeSlideItem.category}</span>
                    <span className="text-slate-400" aria-hidden="true">·</span>
                    <span className="text-slate-300 font-normal">{activeSlideItem.date}</span>
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight max-w-3xl">
                    {activeSlideItem.title}
                  </h3>
                  <p className="text-sm text-slate-200 mt-1.5 max-w-2xl line-clamp-2">
                    {activeSlideItem.caption}
                  </p>
                </div>
              </div>

              {/* Mobile Caption Block Below Image (keeps mobile stage clean and unobstructed) */}
              <div className="sm:hidden p-4 bg-[#080d1e]/95 border-t border-white/10">
                <div className="flex flex-wrap items-center gap-2 text-xs text-cyan-300 font-semibold mb-1">
                  <span>{activeSlideItem.category}</span>
                  <span className="text-slate-500" aria-hidden="true">·</span>
                  <span className="text-slate-300 font-normal">{activeSlideItem.date}</span>
                </div>
                <h3 className="text-base font-extrabold text-white tracking-tight leading-snug">
                  {activeSlideItem.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {activeSlideItem.caption}
                </p>
              </div>
            </div>

            {/* Combined Photos Grouped by Cabor & Tanggal (Paginated 5 groups/page unless filtered) */}
            {visibleAlbums.length > 0 && (
              <div className="space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Images className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Foto Digabungkan per Cabor & Tanggal</span>
                  </h4>
                  <span className="text-[11px] sm:text-xs text-slate-400 tabular-nums">
                    {isFilteredView || totalAlbumPages <= 1
                      ? `${groupedAlbums.length} Kelompok · ${itemCount} Foto`
                      : `Menampilkan ${visibleAlbums.length} dari ${groupedAlbums.length} Kelompok · ${itemCount} Foto`}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {visibleAlbums.map((album) => {
                    const isActiveAlbum =
                      activeSlideItem.category.trim() === album.category &&
                      activeSlideItem.date.trim() === album.date;
                    return (
                      <div
                        key={album.key}
                        className={`rounded-2xl border p-3 sm:p-4 transition-all ${
                          isActiveAlbum
                            ? 'bg-cyan-500/[0.08] border-cyan-400/45 shadow-lg shadow-cyan-500/10'
                            : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectSlide(album.startIndex)}
                          className="w-full flex items-center justify-between gap-2 mb-3 text-left cursor-pointer group"
                        >
                          <div className="min-w-0 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span
                              className={`text-xs sm:text-sm font-extrabold ${
                                isActiveAlbum
                                  ? 'text-cyan-300'
                                  : 'text-white group-hover:text-cyan-200'
                              }`}
                            >
                              {album.category}
                            </span>
                            <span className="text-slate-500" aria-hidden="true">·</span>
                            <span className="text-xs text-slate-300 flex items-center gap-1">
                              <CalendarDays className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{album.date}</span>
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-semibold text-cyan-300 tabular-nums shrink-0">
                            {album.items.length} Foto
                          </span>
                        </button>

                        <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                          {album.items.map((item, localIdx) => {
                            const globalIdx = album.startIndex + localIdx;
                            const isActive = globalIdx === safeIndex;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelectSlide(globalIdx)}
                                aria-label={`Pilih foto ${item.title} (${album.category} · ${album.date})`}
                                className={`relative w-28 sm:w-32 aspect-[16/10] rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer text-left ${
                                  isActive
                                    ? 'border-cyan-400 shadow-md shadow-cyan-500/25 scale-[1.02]'
                                    : 'border-white/15 opacity-75 hover:opacity-100 hover:border-white/35'
                                }`}
                              >
                                <Image
                                  src={item.imageUrl}
                                  alt={item.title}
                                  fill
                                  className="object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                                <div className="absolute bottom-1.5 left-2 right-2">
                                  <p className="text-[11px] font-semibold text-white truncate">
                                    {item.title}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!isFilteredView && totalAlbumPages > 1 && (
                  <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5">
                    <p className="text-xs text-slate-400 tabular-nums">
                      Halaman <span className="font-semibold text-slate-200">{safeAlbumPage}/{totalAlbumPages}</span>
                      {' · '}
                      <span>5 kelompok per halaman</span>
                    </p>
                    <nav
                      aria-label="Pagination kelompok galeri slider"
                      className="flex flex-wrap items-center gap-1"
                    >
                      <button
                        type="button"
                        onClick={() => handleAlbumPageChange(safeAlbumPage - 1)}
                        disabled={safeAlbumPage <= 1}
                        aria-label="Halaman sebelumnya"
                        title="Halaman sebelumnya"
                        className="min-h-[44px] min-w-[44px] sm:min-h-[40px] sm:min-w-[40px] px-2 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-slate-200 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {Array.from({ length: totalAlbumPages }, (_, idx) => {
                        const pageNum = idx + 1;
                        const isCurrent = pageNum === safeAlbumPage;
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => handleAlbumPageChange(pageNum)}
                            aria-current={isCurrent ? 'page' : undefined}
                            aria-label={`Halaman ${pageNum}`}
                            className={`min-h-[44px] min-w-[40px] sm:min-h-[40px] sm:min-w-[36px] px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer tabular-nums ${
                              isCurrent
                                ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 shadow-sm'
                                : 'bg-white/5 hover:bg-white/15 text-slate-300 border border-white/10'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => handleAlbumPageChange(safeAlbumPage + 1)}
                        disabled={safeAlbumPage >= totalAlbumPages}
                        aria-label="Halaman berikutnya"
                        title="Halaman berikutnya"
                        className="min-h-[44px] min-w-[44px] sm:min-h-[40px] sm:min-w-[40px] px-2 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-slate-200 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </nav>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}

      </div>

      {/* Lightbox Modal with Prev / Next Slider Controls & Touch Swipe */}
      {activeLightboxPhoto && (
        <div
          onClick={() => setActivePhotoId(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl glass-card rounded-3xl border border-white/20 p-2.5 sm:p-6 overflow-hidden max-h-[94dvh] overflow-y-auto"
          >
            <button
              type="button"
              onClick={() => setActivePhotoId(null)}
              aria-label="Tutup tampilan foto"
              className="absolute top-3.5 right-3.5 sm:top-6 sm:right-6 z-20 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-black/65 hover:bg-black/90 text-white transition-colors border border-white/20 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={(e) =>
                handleTouchEnd(
                  e,
                  () => {
                    if (itemCount <= 1) return;
                    const nextIdx = (lightboxIndex + 1) % itemCount;
                    setActivePhotoId(orderedItems[nextIdx].id);
                  },
                  () => {
                    if (itemCount <= 1) return;
                    const prevIdx = (lightboxIndex - 1 + itemCount) % itemCount;
                    setActivePhotoId(orderedItems[prevIdx].id);
                  }
                )
              }
              className="relative aspect-[4/3] sm:aspect-video w-full rounded-2xl overflow-hidden bg-black touch-pan-y"
            >
              <Image
                src={activeLightboxPhoto.imageUrl}
                alt={activeLightboxPhoto.title}
                fill
                className="object-contain"
                referrerPolicy="no-referrer"
              />

              {itemCount > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const prevIdx = (lightboxIndex - 1 + itemCount) % itemCount;
                      setActivePhotoId(orderedItems[prevIdx].id);
                    }}
                    aria-label="Foto sebelumnya"
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/65 hover:bg-cyan-500 hover:text-slate-950 border border-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextIdx = (lightboxIndex + 1) % itemCount;
                      setActivePhotoId(orderedItems[nextIdx].id);
                    }}
                    aria-label="Foto berikutnya"
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/65 hover:bg-cyan-500 hover:text-slate-950 border border-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            <div className="p-3.5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-cyan-300">
                    {activeLightboxPhoto.category}
                  </span>
                  <span className="text-slate-500" aria-hidden="true">·</span>
                  <span className="text-slate-400">{activeLightboxPhoto.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleOpenEditPhoto(activeLightboxPhoto)}
                      className="min-h-[44px] sm:min-h-[38px] px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/35 text-xs font-semibold text-cyan-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit Keterangan</span>
                    </button>
                  )}
                  <span className="text-slate-400 tabular-nums">
                    {lightboxIndex + 1} / {itemCount}
                  </span>
                </div>
              </div>
              <h3 className="text-lg sm:text-2xl font-bold text-white">
                {activeLightboxPhoto.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                {activeLightboxPhoto.caption}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Admin Edit Gallery Modal */}
      {isAdmin && editingItem && (
        <GalleryEditModal
          item={editingItem}
          onSave={handleSaveEditedPhoto}
          onClose={() => setEditingItem(null)}
        />
      )}
    </section>
  );
}
