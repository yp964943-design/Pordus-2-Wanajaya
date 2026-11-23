'use client';

import React, { useEffect } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FolderOpen,
  HardDrive,
  Loader2,
  X,
} from 'lucide-react';
import GoogleSignInButton from '@/components/GoogleSignInButton';

export interface DriveConfirmRequest {
  title: string;
  description: string;
  targetLabel?: string;
  details?: string[];
  confirmLabel?: string;
  variant?: 'default' | 'danger';
}

interface DriveConfirmationModalProps {
  isOpen: boolean;
  request: DriveConfirmRequest | null;
  isDriveConnected: boolean;
  driveUserEmail?: string | null;
  isConnectingDrive: boolean;
  isExecuting: boolean;
  errorMessage: string;
  onConnectDrive: () => Promise<boolean>;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function DriveConfirmationModal({
  isOpen,
  request,
  isDriveConnected,
  driveUserEmail,
  isConnectingDrive,
  isExecuting,
  errorMessage,
  onConnectDrive,
  onConfirm,
  onCancel,
}: DriveConfirmationModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isExecuting && !isConnectingDrive) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isExecuting, isConnectingDrive, onCancel]);

  if (!isOpen || !request) return null;

  const isDanger = request.variant === 'danger';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drive-confirm-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExecuting && !isConnectingDrive) {
          onCancel();
        }
      }}
    >
      <div className="relative w-full sm:max-w-lg glass-card rounded-t-3xl sm:rounded-3xl border border-white/20 bg-[#0b1022] p-5 sm:p-7 shadow-2xl max-h-[92dvh] overflow-y-auto">
        <button
          type="button"
          disabled={isExecuting || isConnectingDrive}
          onClick={onCancel}
          aria-label="Tutup konfirmasi Google Drive"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 mb-4 pr-12">
          <div
            className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${
              isDanger
                ? 'bg-rose-500/15 border-rose-400/35 text-rose-300'
                : 'bg-cyan-500/15 border-cyan-400/35 text-cyan-300'
            }`}
          >
            {isDanger ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <HardDrive className="w-5 h-5" />
            )}
          </div>
          <div>
            <span
              className={`text-xs font-semibold tracking-wide ${
                isDanger ? 'text-rose-300' : 'text-cyan-400'
              }`}
            >
              Konfirmasi Penyimpanan Google Drive
            </span>
            <h3
              id="drive-confirm-title"
              className="text-lg sm:text-xl font-extrabold text-white tracking-tight mt-0.5"
            >
              {request.title}
            </h3>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-4">
          {request.description}
        </p>

        {request.targetLabel && (
          <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-2 text-xs text-slate-300">
            <FolderOpen className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate">{request.targetLabel}</span>
          </div>
        )}

        {request.details && request.details.length > 0 && (
          <ul className="mb-5 space-y-1.5 rounded-xl bg-white/[0.03] border border-white/10 p-3.5 text-xs text-slate-300">
            {request.details.map((line, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold mt-0.5">•</span>
                <span className="break-words">{line}</span>
              </li>
            ))}
          </ul>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="mb-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-400/35 flex items-start gap-2.5 text-xs text-rose-200"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {!isDriveConnected ? (
          <div className="mb-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 space-y-3">
            <p className="text-xs text-amber-100 leading-relaxed">
              Akun Google Drive belum terhubung pada sesi ini. Silakan masuk dengan Google terlebih dahulu untuk menyimpan perubahan ke Google Drive.
            </p>
            <div className="flex justify-start">
              <GoogleSignInButton
                onClick={() => {
                  void onConnectDrive();
                }}
                disabled={isConnectingDrive}
                label={isConnectingDrive ? 'Menghubungkan...' : 'Sign in with Google'}
              />
            </div>
          </div>
        ) : (
          <div className="mb-5 px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/25 flex items-center gap-2 text-xs text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">
              Google Drive terhubung{driveUserEmail ? ` (${driveUserEmail})` : ''}
            </span>
          </div>
        )}

        <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
          <button
            type="button"
            disabled={isExecuting || isConnectingDrive}
            onClick={onCancel}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={!isDriveConnected || isExecuting || isConnectingDrive}
            onClick={() => {
              void onConfirm();
            }}
            className={`min-h-[44px] px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              isDanger
                ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:shadow-[0_0_24px_rgba(244,63,94,0.35)]'
                : 'bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 text-slate-950 hover:shadow-[0_0_24px_rgba(34,211,238,0.35)]'
            }`}
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan ke Drive...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{request.confirmLabel || 'Konfirmasi & Simpan ke Drive'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
