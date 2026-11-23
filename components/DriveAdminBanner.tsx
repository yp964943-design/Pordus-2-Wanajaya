'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  DatabaseBackup,
  ExternalLink,
  HardDrive,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { useDriveSync } from '@/components/DriveSyncProvider';

interface DriveAdminBannerProps {
  contextLabel: string;
}

export default function DriveAdminBanner({ contextLabel }: DriveAdminBannerProps) {
  const {
    isDriveConnected,
    driveUserEmail,
    driveFolderUrl,
    isConnectingDrive,
    isRefreshingDrive,
    driveStatusError,
    connectGoogleDrive,
    disconnectGoogleDrive,
    refreshFromDrive,
    migrateLegacyDataWithConfirm,
  } = useDriveSync();

  const [migrationMessage, setMigrationMessage] = useState('');

  const handleMigrate = async () => {
    setMigrationMessage('');
    const res = await migrateLegacyDataWithConfirm();
    if (res.cancelled) return;
    if (res.syncedToCloud) {
      setMigrationMessage(
        'Data jadwal, hasil, dan galeri lama berhasil dimigrasikan ke Google Drive.'
      );
    }
  };

  return (
    <div
      className={`mb-5 px-4 py-3.5 rounded-2xl border space-y-2.5 ${
        isDriveConnected
          ? 'bg-cyan-500/10 border-cyan-400/25 text-cyan-100'
          : 'bg-amber-500/10 border-amber-400/30 text-amber-100'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5 text-xs">
          {isDriveConnected ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
          ) : (
            <HardDrive className="w-4 h-4 text-amber-300 shrink-0 mt-0.5 sm:mt-0" />
          )}
          <div className="space-y-0.5">
            <p className="font-bold text-white">
              {isDriveConnected
                ? `Google Drive Terhubung${driveUserEmail ? ` · ${driveUserEmail}` : ''}`
                : 'Mode Admin Aktif — Hubungkan Google Drive'}
            </p>
            <p className="text-slate-300 leading-relaxed">
              {isDriveConnected
                ? `Semua ${contextLabel} disimpan di folder Google Drive "PORDUS 2 Wanajaya - Admin Data" (file pordus2_admin_data.json).`
                : `Semua ${contextLabel} disimpan ke Google Drive. Klik Sign in with Google untuk menghubungkan Google Drive panitia.`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!isDriveConnected ? (
            <GoogleSignInButton
              onClick={() => {
                void connectGoogleDrive();
              }}
              disabled={isConnectingDrive}
              label={isConnectingDrive ? 'Menghubungkan...' : 'Sign in with Google'}
            />
          ) : (
            <>
              {driveFolderUrl && (
                <a
                  href={driveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[40px] px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Buka Folder Drive</span>
                </a>
              )}
              <button
                type="button"
                disabled={isRefreshingDrive}
                onClick={() => {
                  void refreshFromDrive();
                }}
                className="min-h-[40px] px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-cyan-300 ${
                    isRefreshingDrive ? 'animate-spin' : ''
                  }`}
                />
                <span>Refresh</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleMigrate();
                }}
                className="min-h-[40px] px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-xs font-semibold text-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <DatabaseBackup className="w-3.5 h-3.5" />
                <span>Migrasi Data Lama</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  void disconnectGoogleDrive();
                }}
                className="min-h-[40px] px-3 py-2 rounded-xl bg-white/5 hover:bg-rose-500/15 border border-white/15 hover:border-rose-400/35 text-xs font-semibold text-slate-300 hover:text-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Putuskan Drive</span>
              </button>
            </>
          )}
        </div>
      </div>

      {driveStatusError && (
        <div
          role="alert"
          className="px-3 py-2 rounded-xl bg-rose-500/15 border border-rose-400/30 flex items-center gap-2 text-xs text-rose-200"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{driveStatusError}</span>
        </div>
      )}

      {migrationMessage && (
        <div
          role="status"
          className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center gap-2 text-xs text-emerald-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{migrationMessage}</span>
        </div>
      )}
    </div>
  );
}
