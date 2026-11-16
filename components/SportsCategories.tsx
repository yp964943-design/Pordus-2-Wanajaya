'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ArrowRight, Trophy, Info, X, CheckCircle2, MapPin } from 'lucide-react';
import { SPORTS_LIST, SportItem } from '@/data/pordusData';

interface SportsCategoriesProps {
  onViewSchedule: () => void;
}

export default function SportsCategories({ onViewSchedule }: SportsCategoriesProps) {
  const [selectedSport, setSelectedSport] = useState<SportItem | null>(null);

  return (
    <section id="cabang-lomba" className="py-10 md:py-12 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header verbatim from PDF */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
            Cabang Olahraga Yang Dipertandingkan
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
            CABANG LOMBA
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-emerald-400 to-cyan-400 mx-auto mt-4 rounded-full" />
          <p className="mt-4 text-sm sm:text-base text-slate-300">
            Empat cabang olahraga utama yang memperebutkan medali dan supremasi bergengsi antar RW Dusun II Wanajaya.
          </p>
        </div>

        {/* 4 Sports Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
          {SPORTS_LIST.map((sport) => (
            <div
              key={sport.id}
              className="group glass-card glass-card-hover rounded-3xl overflow-hidden border border-white/15 flex flex-col justify-between"
            >
              <div>
                {/* Visual Image container with Glass Border */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900">
                  <Image
                    src={sport.image}
                    alt={`Cabang Olahraga ${sport.name} PORDUS Wanajaya`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070913] via-transparent to-black/30" />
                  
                  {/* Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black/60 backdrop-blur-md text-cyan-300 border border-white/20">
                      {sport.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-2xl font-black text-white tracking-tight flex items-center justify-between">
                    <span>{sport.name}</span>
                    <span className="text-xs font-normal text-slate-400">{sport.category}</span>
                  </h3>
                  <p className="mt-3 text-sm text-slate-300 line-clamp-2 leading-relaxed">
                    {sport.description}
                  </p>

                  <div className="mt-4 pt-4 border-t border-white/10 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">Sistem: {sport.system}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{sport.venue}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 pt-0 flex items-center gap-3">
                <button
                  onClick={() => setSelectedSport(sport)}
                  className="flex-1 py-2.5 px-4 rounded-xl glass-card text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 border border-white/15 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Detail & Aturan</span>
                </button>
                <button
                  onClick={onViewSchedule}
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 text-xs font-bold hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] active:scale-95 transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <span>Jadwal</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Sport Detail Modal */}
      {selectedSport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl glass-card rounded-3xl border border-white/20 p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => setSelectedSport(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {selectedSport.category}
              </span>
              <span className="text-xs text-slate-400">PORDUS 2 WANAJAYA KE-IV 2026</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Cabang Olahraga {selectedSport.name}
            </h3>

            <div className="mt-4 relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950">
              <Image
                src={selectedSport.image}
                alt={selectedSport.name}
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <p className="mt-4 text-sm text-slate-200 leading-relaxed">
              {selectedSport.description}
            </p>

            {/* Quick Spec list */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-slate-400 block font-medium">Format Pertandingan</span>
                <span className="text-white font-semibold text-sm mt-0.5 block">{selectedSport.system}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-slate-400 block font-medium">Kuota Tim per RW</span>
                <span className="text-white font-semibold text-sm mt-0.5 block">{selectedSport.quotaPerRW}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 sm:col-span-2">
                <span className="text-slate-400 block font-medium">Lokasi Venue Laga</span>
                <span className="text-white font-semibold text-sm mt-0.5 block">{selectedSport.venue}</span>
              </div>
            </div>

            {/* Rules Highlights */}
            <div className="mt-6">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Poin Regulasi Utama</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {selectedSport.rulesHighlight.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-end gap-3">
              <button
                onClick={() => setSelectedSport(null)}
                className="px-5 py-2.5 rounded-xl bg-white/10 text-xs font-semibold text-slate-200 hover:bg-white/15 transition-all"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  setSelectedSport(null);
                  onViewSchedule();
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 text-xs font-bold hover:shadow-lg transition-all"
              >
                Lihat Jadwal {selectedSport.name}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
