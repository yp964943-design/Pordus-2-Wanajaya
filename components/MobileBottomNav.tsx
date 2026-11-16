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
      <div className="grid grid-cols-5 h-16 px-1">
        <button
          type="button"
          onClick={() => onSelectHubTab('jadwal')}
          className={`min-h-[44px] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer ${
            activeHubTab === 'jadwal'
              ? 'text-cyan-300'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CalendarRange className="w-4 h-4" />
          <span>Jadwal</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectHubTab('hasil')}
          className={`min-h-[44px] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer ${
            activeHubTab === 'hasil'
              ? 'text-emerald-300'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Hasil</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectHubTab('klasemen')}
          className={`min-h-[44px] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer ${
            activeHubTab === 'klasemen'
              ? 'text-amber-300'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Klasemen</span>
        </button>

        <button
          type="button"
          onClick={() => onJumpToSection('galeri')}
          className="min-h-[44px] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
        >
          <Images className="w-4 h-4" />
          <span>Galeri</span>
        </button>

        <button
          type="button"
          onClick={() => onJumpToSection('peraturan')}
          className="min-h-[44px] flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer"
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Aturan</span>
        </button>
      </div>
    </nav>
  );
}
