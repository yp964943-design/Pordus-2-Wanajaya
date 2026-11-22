'use client';

import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  CornerDownRight,
  MessageSquare,
  Reply,
  Send,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { RW_LOGOS } from '@/data/pordusData';
import CompactPagination from '@/components/CompactPagination';
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
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return 'Baru saja';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} · ${hours}.${minutes}`;
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

  // Reply state
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyTargetName, setReplyTargetName] = useState('');
  const [replyName, setReplyName] = useState('');
  const [replyRw, setReplyRw] = useState('RW 017');
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState('');

  // Admin moderation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [moderationNotice, setModerationNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const { topLevelComments, repliesByParent, totalReplies } = useMemo(() => {
    const commentIds = new Set(comments.map((c) => c.id));
    const parents: TournamentComment[] = [];
    const replyMap = new Map<string, TournamentComment[]>();
    let replyCount = 0;

    comments.forEach((c) => {
      if (c.parentId && commentIds.has(c.parentId)) {
        const list = replyMap.get(c.parentId) ?? [];
        list.push(c);
        replyMap.set(c.parentId, list);
        replyCount += 1;
      } else if (!c.parentId) {
        parents.push(c);
      }
    });

    // Sort replies oldest-first so threads read naturally top-to-bottom
    replyMap.forEach((list, key) => {
      replyMap.set(
        key,
        [...list].sort((a, b) => a.createdAt - b.createdAt)
      );
    });

    return {
      topLevelComments: parents,
      repliesByParent: replyMap,
      totalReplies: replyCount,
    };
  }, [comments]);

  const totalPages = Math.max(1, Math.ceil(topLevelComments.length / COMMENTS_PER_PAGE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const pagedComments = useMemo<TournamentComment[]>(() => {
    const start = (safePage - 1) * COMMENTS_PER_PAGE;
    return topLevelComments.slice(start, start + COMMENTS_PER_PAGE);
  }, [topLevelComments, safePage]);

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

  const openReplyForm = (parentId: string, recipientName: string) => {
    if (replyingToId === parentId && replyTargetName === recipientName) {
      setReplyingToId(null);
      setReplyTargetName('');
      setReplyError('');
      return;
    }
    setReplyingToId(parentId);
    setReplyTargetName(recipientName);
    setReplyError('');
    setReplyMessage(recipientName ? `@${recipientName} ` : '');
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    setReplyError('');

    const cleanName = replyName.trim();
    const cleanRw = replyRw.trim() || 'Umum / Warga';
    const cleanMessage = replyMessage.trim();

    if (cleanName.length < 2 || cleanName.length > 80) {
      setReplyError('Nama lengkap wajib diisi (minimal 2 karakter).');
      return;
    }
    if (cleanMessage.length < 3 || cleanMessage.length > 500) {
      setReplyError('Balasan wajib diisi (minimal 3 karakter, maksimal 500 karakter).');
      return;
    }

    setIsSubmittingReply(true);
    const id = `rpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const result = await saveComment({
      id,
      parentId,
      name: cleanName,
      rw: cleanRw,
      message: cleanMessage,
      createdAt: Date.now(),
    });
    setIsSubmittingReply(false);

    if (!result.syncedToCloud) {
      setReplyError(result.errorMessage || 'Gagal mengirim balasan. Periksa koneksi Anda.');
      return;
    }

    setReplyName('');
    setReplyMessage('');
    setReplyingToId(null);
    setReplyTargetName('');
  };

  const handleDelete = async (commentId: string) => {
    if (!isAdmin) return;
    setDeletingId(commentId);
    setModerationNotice(null);
    const childReplies = repliesByParent.get(commentId) ?? [];
    const results = await Promise.all([
      removeComment(commentId),
      ...childReplies.map((r) => removeComment(r.id)),
    ]);
    setDeletingId(null);
    setConfirmDeleteId(null);

    const failed = results.find((r) => !r.syncedToCloud);
    if (failed) {
      setModerationNotice({
        type: 'error',
        text: failed.errorMessage || 'Gagal menghapus komentar. Periksa koneksi Anda.',
      });
      return;
    }

    setModerationNotice({
      type: 'success',
      text: 'Komentar yang tidak sesuai berhasil dihapus oleh admin.',
    });
  };

  return (
    <section id="komentar" className="py-8 md:py-12 relative">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="glass-card rounded-3xl border border-white/15 p-4 sm:p-10">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-widest text-cyan-400 uppercase">
              Suara &amp; Dukungan Warga
            </p>
            <h3 className="text-xl sm:text-3xl font-extrabold text-white mt-2 text-balance">
              Komentar &amp; Dukungan Turnamen
            </h3>
            <p className="mt-2 sm:mt-2.5 text-sm text-slate-300">
              Bagikan semangat, dukungan untuk kontingen RW favorit Anda, atau masukan bagi panitia PORDUS 2 Wanajaya Ke-IV 2026.
            </p>
          </div>

          <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* Form Komentar */}
            <form
              onSubmit={handleSubmit}
              className="lg:col-span-5 rounded-2xl bg-white/[0.03] border border-white/10 p-4 sm:p-6 space-y-4"
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
                  {topLevelComments.length} Komentar
                  {totalReplies > 0 ? ` · ${totalReplies} Balasan` : ''}
                </span>
              </div>

              {isAdmin && (
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/25 px-3.5 py-2.5 flex items-center gap-2 text-xs text-emerald-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Mode Moderasi Admin aktif — admin dapat menghapus komentar atau balasan yang tidak sesuai.
                  </span>
                </div>
              )}

              {moderationNotice && (
                <div
                  role="status"
                  className={`rounded-xl px-3.5 py-2.5 text-xs flex items-center justify-between gap-2 border ${
                    moderationNotice.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-400/25 text-emerald-200'
                      : 'bg-rose-500/10 border-rose-400/25 text-rose-300'
                  }`}
                >
                  <span>{moderationNotice.text}</span>
                  <button
                    type="button"
                    onClick={() => setModerationNotice(null)}
                    aria-label="Tutup pemberitahuan"
                    className="min-w-[28px] min-h-[28px] flex items-center justify-center rounded-md hover:bg-white/10 cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {isLoading ? (
                <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-6 text-center text-xs text-slate-400">
                  Memuat komentar warga...
                </div>
              ) : loadError ? (
                <div className="rounded-2xl bg-rose-500/10 border border-rose-400/20 p-6 text-center text-xs text-rose-300">
                  {loadError}
                </div>
              ) : topLevelComments.length === 0 ? (
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
                  {pagedComments.map((item) => {
                    const replies = repliesByParent.get(item.id) ?? [];
                    const isReplyingHere = replyingToId === item.id;

                    return (
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

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => openReplyForm(item.id, item.name)}
                              className={`min-h-[44px] sm:min-h-[38px] px-3 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                                isReplyingHere
                                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/35'
                                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10'
                              }`}
                            >
                              <Reply className="w-3.5 h-3.5" />
                              <span>Balas</span>
                            </button>

                            {isAdmin &&
                              (confirmDeleteId === item.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={deletingId === item.id}
                                    onClick={() => handleDelete(item.id)}
                                    className="min-h-[44px] sm:min-h-[38px] px-2.5 rounded-lg bg-rose-500/25 hover:bg-rose-500/35 border border-rose-400/40 text-xs font-bold text-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                                  >
                                    {deletingId === item.id ? 'Menghapus...' : 'Hapus'}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={deletingId === item.id}
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="min-h-[44px] sm:min-h-[38px] px-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                                  >
                                    Batal
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(item.id)}
                                  aria-label={`Hapus komentar dari ${item.name}`}
                                  title="Hapus komentar yang tidak sesuai"
                                  className="min-w-[44px] min-h-[44px] sm:min-w-[38px] sm:min-h-[38px] flex items-center justify-center rounded-lg bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-400/35 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ))}
                          </div>
                        </div>

                        <p className="mt-2 text-sm text-slate-200 leading-relaxed whitespace-pre-line break-words">
                          {item.message}
                        </p>

                        {/* Replies List */}
                        {replies.length > 0 && (
                          <div className="mt-3.5 pl-2.5 sm:pl-5 space-y-2.5">
                            {replies.map((reply) => (
                              <div
                                key={reply.id}
                                className="rounded-xl bg-white/[0.02] border border-white/10 p-3 sm:p-3.5"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                                    <CornerDownRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                    <span className="font-bold text-white">{reply.name}</span>
                                    <span className="text-slate-500" aria-hidden="true">·</span>
                                    <span className="text-cyan-300 font-semibold">{reply.rw}</span>
                                    <span className="text-slate-500" aria-hidden="true">·</span>
                                    <time className="text-slate-400 tabular-nums">
                                      {formatCommentTimestamp(reply.createdAt)}
                                    </time>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => openReplyForm(item.id, reply.name)}
                                      aria-label={`Balas ${reply.name}`}
                                      title={`Balas ${reply.name}`}
                                      className="min-h-[44px] sm:min-h-[32px] px-2.5 sm:px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs sm:text-[11px] font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                                    >
                                      Balas
                                    </button>
                                    {isAdmin &&
                                      (confirmDeleteId === reply.id ? (
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            disabled={deletingId === reply.id}
                                            onClick={() => handleDelete(reply.id)}
                                            className="min-h-[44px] sm:min-h-[32px] px-2.5 sm:px-2 rounded-lg bg-rose-500/25 hover:bg-rose-500/35 border border-rose-400/40 text-xs sm:text-[11px] font-bold text-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                                          >
                                            {deletingId === reply.id ? '...' : 'Hapus'}
                                          </button>
                                          <button
                                            type="button"
                                            disabled={deletingId === reply.id}
                                            onClick={() => setConfirmDeleteId(null)}
                                            className="min-h-[44px] sm:min-h-[32px] px-2.5 sm:px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs sm:text-[11px] font-semibold text-slate-300 transition-colors cursor-pointer"
                                          >
                                            Batal
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => setConfirmDeleteId(reply.id)}
                                          aria-label={`Hapus balasan dari ${reply.name}`}
                                          title="Hapus balasan yang tidak sesuai"
                                          className="min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center rounded-lg bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-400/35 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                                        </button>
                                      ))}
                                  </div>
                                </div>

                                <p className="mt-1.5 pl-4 sm:pl-5 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line break-words">
                                  {reply.message}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Inline Reply Form */}
                        {isReplyingHere && (
                          <form
                            onSubmit={(e) => handleReplySubmit(e, item.id)}
                            className="mt-3.5 pl-2.5 sm:pl-5"
                          >
                            <div className="rounded-xl bg-[#0a0f24]/80 border border-cyan-400/30 p-3.5 sm:p-4 space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                                  <CornerDownRight className="w-3.5 h-3.5" />
                                  <span>Membalas {replyTargetName}</span>
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingToId(null);
                                    setReplyTargetName('');
                                    setReplyError('');
                                  }}
                                  aria-label="Tutup form balasan"
                                  className="min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                                >
                                  <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <input
                                  type="text"
                                  maxLength={80}
                                  value={replyName}
                                  onChange={(e) => setReplyName(e.target.value)}
                                  placeholder="Nama Anda"
                                  required
                                  className="w-full min-h-[44px] px-3 py-2 rounded-lg glass-input text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                />
                                <div className="relative">
                                  <select
                                    value={replyRw}
                                    onChange={(e) => setReplyRw(e.target.value)}
                                    aria-label="Asal RW pembalas"
                                    className="w-full min-h-[44px] appearance-none pl-3 pr-8 py-2 rounded-lg glass-input bg-[#070b1a] text-xs sm:text-sm text-white border border-white/15 focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer"
                                  >
                                    {RW_OPTIONS.map((opt) => (
                                      <option key={opt} value={opt} className="bg-[#0a0f24] text-white">
                                        {opt === 'RW 017' ? 'RW 017 (Tuan Rumah)' : opt}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-end mb-1">
                                  <span className="text-[11px] text-slate-400 tabular-nums">
                                    {replyMessage.length}/500
                                  </span>
                                </div>
                                <textarea
                                  rows={2}
                                  maxLength={500}
                                  value={replyMessage}
                                  onChange={(e) => setReplyMessage(e.target.value)}
                                  placeholder="Tulis balasan komentar Anda..."
                                  required
                                  className="w-full px-3 py-2 rounded-lg glass-input text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-y"
                                />
                              </div>

                              {replyError && (
                                <p role="alert" className="text-xs text-rose-300">
                                  {replyError}
                                </p>
                              )}

                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingToId(null);
                                    setReplyTargetName('');
                                    setReplyError('');
                                  }}
                                  className="min-h-[44px] sm:min-h-[38px] px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 cursor-pointer transition-colors"
                                >
                                  Batal
                                </button>
                                <button
                                  type="submit"
                                  disabled={isSubmittingReply}
                                  className="min-h-[44px] sm:min-h-[38px] px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>{isSubmittingReply ? 'Mengirim...' : 'Kirim Balasan'}</span>
                                </button>
                              </div>
                            </div>
                          </form>
                        )}
                      </article>
                    );
                  })}

                  <CompactPagination
                    currentPage={safePage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    ariaLabel="Pagination komentar warga"
                    prevAriaLabel="Komentar sebelumnya"
                    nextAriaLabel="Komentar selanjutnya"
                    info={
                      <>
                        Halaman <span className="font-semibold text-slate-200">{safePage}</span> dari{' '}
                        <span className="font-semibold text-slate-200">{totalPages}</span>
                      </>
                    }
                    className="mt-2"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
