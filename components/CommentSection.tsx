'use client';

import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Send,
  Trash2,
} from 'lucide-react';
import { RW_LOGOS } from '@/data/pordusData';
import {
  removeComment,
  saveComment,
  TournamentComment,
  useCommentsSync,
} from '@/lib/tournamentSync';

interface CommentSectionProps {
  isAdmin: boolean;
}

const COMMENTS_PER_PAGE = 4;

const RW_OPTIONS = [...Object.keys(RW_LOGOS), 'Umum / Warga'];

function formatCommentTimestamp(ts: number): string {
  if (!ts || Number.isNaN(ts)) return 'Baru saja';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ts));
  } catch {
    return 'Baru saja';
  }
}

export default function CommentSection({ isAdmin }: CommentSectionProps) {
  const { comments, isLoading, loadError } = useCommentsSync();

  const [name, setName] = useState('');
  const [rw, setRw] = useState('RW 017');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successNote, setSuccessNote] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(comments.length / COMMENTS_PER_PAGE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const pagedComments = useMemo<TournamentComment[]>(() => {
    const start = (safePage - 1) * COMMENTS_PER_PAGE;
    return comments.slice(start, start + COMMENTS_PER_PAGE);
  }, [comments, safePage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessNote('');

    const cleanName = name.trim();
    const cleanRw = rw.trim() || 'Umum / Warga';
    const cleanMessage = message.trim();

    if (cleanName.length < 2 || cleanName.length > 80) {
      setFormError('Nama lengkap wajib diisi (minimal 2 karakter, maksimal 80 karakter).');
      return;
    }
    if (cleanMessage.length < 3 || cleanMessage.length > 500) {
      setFormError('Komentar wajib diisi (minimal 3 karakter, maksimal 500 karakter).');
      return;
    }

    setIsSubmitting(true);
    const id = `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const result = await saveComment({
      id,
      name: cleanName,
      rw: cleanRw,
      message: cleanMessage,
      createdAt: Date.now(),
    });
    setIsSubmitting(false);

    if (!result.syncedToCloud) {
      setFormError(result.errorMessage || 'Gagal mengirim komentar. Periksa koneksi Anda.');
      return;
    }

    setName('');
    setMessage('');
    setCurrentPage(1);
    setSuccessNote('Komentar Anda berhasil dikirim dan tampil untuk semua pengunjung.');
  };

  const handleDelete = async (commentId: string) => {
    if (!isAdmin) return;
    await removeComment(commentId);
  };

  return (
    <section id="komentar" className="py-10 md:py-12 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card rounded-3xl border border-white/15 p-6 sm:p-10">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-widest text-cyan-400 uppercase">
              Suara &amp; Dukungan Warga
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 text-balance">
              Komentar &amp; Dukungan Turnamen
            </h3>
            <p className="mt-2.5 text-sm text-slate-300">
              Bagikan semangat, dukungan untuk kontingen RW favorit Anda, atau masukan bagi panitia PORDUS 2 Wanajaya Ke-IV 2026.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* Form Komentar */}
            <form
              onSubmit={handleSubmit}
              className="lg:col-span-5 rounded-2xl bg-white/[0.03] border border-white/10 p-5 sm:p-6 space-y-4"
            >
              <div>
                <label
                  htmlFor="comment-name"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Nama Lengkap
                </label>
                <input
                  id="comment-name"
                  type="text"
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  required
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl glass-input text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label
                  htmlFor="comment-rw"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Kontingen / Asal RW
                </label>
                <div className="relative">
                  <select
                    id="comment-rw"
                    value={rw}
                    onChange={(e) => setRw(e.target.value)}
                    className="w-full min-h-[44px] appearance-none pl-3.5 pr-10 py-2.5 rounded-xl glass-input bg-[#0a0f24] text-sm text-white border border-white/15 focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer"
                  >
                    {RW_OPTIONS.map((opt) => (
                      <option key={opt} value={opt} className="bg-[#0a0f24] text-white">
                        {opt === 'RW 017' ? 'RW 017 (Tuan Rumah)' : opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="comment-message"
                    className="block text-xs font-semibold text-slate-300"
                  >
                    Komentar / Pesan Dukungan
                  </label>
                  <span className="text-[11px] text-slate-400 tabular-nums">
                    {message.length}/500
                  </span>
                </div>
                <textarea
                  id="comment-message"
                  rows={4}
                  maxLength={500}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tulis dukungan Anda untuk tim RW atau panitia turnamen..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-y"
                />
              </div>

              {formError && (
                <p
                  role="alert"
                  className="text-xs text-rose-300 bg-rose-500/10 border border-rose-400/25 rounded-xl px-3.5 py-2.5"
                >
                  {formError}
                </p>
              )}

              {successNote && (
                <div
                  role="status"
                  className="flex items-start gap-2 text-xs text-emerald-200 bg-emerald-500/10 border border-emerald-400/25 rounded-xl px-3.5 py-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{successNote}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 text-slate-950 font-bold text-sm hover:shadow-[0_0_24px_rgba(34,211,238,0.3)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Mengirim...' : 'Kirim Komentar'}</span>
              </button>
            </form>

            {/* Daftar Komentar Terbaru */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-base font-bold text-white">Komentar Warga</h4>
                </div>
                <span className="text-xs text-slate-400 tabular-nums">
                  {comments.length} Komentar
                </span>
              </div>

              {isLoading ? (
                <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-6 text-center text-xs text-slate-400">
                  Memuat komentar warga...
                </div>
              ) : loadError ? (
                <div className="rounded-2xl bg-rose-500/10 border border-rose-400/20 p-6 text-center text-xs text-rose-300">
                  {loadError}
                </div>
              ) : comments.length === 0 ? (
                <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-8 text-center">
                  <p className="text-sm font-semibold text-slate-200">
                    Belum ada komentar warga.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Jadilah yang pertama memberikan dukungan untuk kontingen RW Anda!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pagedComments.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 sm:p-5 transition-colors hover:border-white/20"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                          <span className="text-sm font-bold text-white">{item.name}</span>
                          <span className="text-slate-500" aria-hidden="true">·</span>
                          <span className="text-cyan-300 font-semibold">{item.rw}</span>
                          <span className="text-slate-500" aria-hidden="true">·</span>
                          <time className="text-slate-400 tabular-nums">
                            {formatCommentTimestamp(item.createdAt)}
                          </time>
                        </div>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            aria-label={`Hapus komentar dari ${item.name}`}
                            title="Hapus komentar"
                            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-400/35 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <p className="mt-2 text-sm text-slate-200 leading-relaxed whitespace-pre-line break-words">
                        {item.message}
                      </p>
                    </article>
                  ))}

                  {totalPages > 1 && (
                    <div className="pt-2 flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-400 tabular-nums">
                        Halaman {safePage} dari {totalPages}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={safePage <= 1}
                          aria-label="Komentar sebelumnya"
                          className="min-h-[40px] min-w-[40px] px-2 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-slate-200 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={safePage >= totalPages}
                          aria-label="Komentar berikutnya"
                          className="min-h-[40px] min-w-[40px] px-2 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-slate-200 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
