'use client';

import React from 'react';
import { CalendarRange, Award, Trophy, Images, FileCheck2 } from 'lucide-react';
import type { HubTab } from '@/components/HubSection';

interface MobileBottomNavProps {
  activeHubTab: HubTab;
  onSelectHubTab: (tab: HubTab) => void;
  onJumpToSection: (sectionId: string) => void;
}

export default function MobileBottomNav({
  activeHubTab,
  onSelectHubTab,
  onJumpToSection,
}: MobileBottomNavProps) {
  return (
    <nav
      aria-label="Navigasi cepat mobile"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#070913]/95 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.45)]"
    >
      <div className="grid grid-cols-5 h-[58px] px-1">
        <button
          type="button"
          onClick={() => onSelectHubTab('jadwal')}
          className={`relative min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-all active:scale-95 cursor-pointer ${
            activeHubTab === 'jadwal'
              ? 'text-cyan-300'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {activeHubTab === 'jadwal' && (
            <span className="absolute top-0 inset-x-3 h-0.5 rounded-full bg-cyan-400" />
          )}
          <CalendarRange className="w-4 h-4" />
          <span>Jadwal</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectHubTab('hasil')}
          className={`relative min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-all active:scale-95 cursor-pointer ${
            activeHubTab === 'hasil'
              ? 'text-emerald-300'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {activeHubTab === 'hasil' && (
            <span className="absolute top-0 inset-x-3 h-0.5 rounded-full bg-emerald-400" />
          )}
          <Award className="w-4 h-4" />
          <span>Hasil</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectHubTab('klasemen')}
          className={`relative min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-all active:scale-95 cursor-pointer ${
            activeHubTab === 'klasemen'
              ? 'text-amber-300'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {activeHubTab === 'klasemen' && (
            <span className="absolute top-0 inset-x-3 h-0.5 rounded-full bg-amber-400" />
          )}
          <Trophy className="w-4 h-4" />
          <span>Klasemen</span>
        </button>

        <button
          type="button"
          onClick={() => onJumpToSection('galeri')}
          className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-slate-400 hover:text-cyan-300 transition-all active:scale-95 cursor-pointer"
        >
          <Images className="w-4 h-4" />
          <span>Galeri</span>
        </button>

        <button
          type="button"
          onClick={() => onJumpToSection('peraturan')}
          className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-slate-400 hover:text-emerald-300 transition-all active:scale-95 cursor-pointer"
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Aturan</span>
        </button>
      </div>
    </nav>
  );
}
