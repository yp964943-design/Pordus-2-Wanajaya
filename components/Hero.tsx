'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

interface HeroProps {
  onOpenSchedule: () => void;
  onOpenResults: () => void;
}

export default function Hero({ onOpenSchedule, onOpenResults }: HeroProps) {
  return (
    <section id="beranda" className="relative pt-5 pb-8 md:pt-10 md:pb-12 overflow-hidden">
      {/* Ambient Glassmorphic Background Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[900px] h-[350px] md:h-[500px] bg-gradient-to-tr from-cyan-600/20 via-teal-500/15 to-emerald-500/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-600/15 rounded-full blur-[90px] pointer-events-none -z-10" />
      <div className="absolute top-40 right-10 w-80 h-80 bg-emerald-600/15 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Trust Marker / Official PORDUS Logo */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-white p-1.5 border border-white/25 shadow-xl shadow-cyan-500/15 mb-3.5 sm:mb-4 overflow-hidden flex items-center justify-center">
            <Image
              src="/assets/aistudio/logo_panitia_0d0b11fa"
              alt="Logo Panitia PORDUS 2 Wanajaya Ke-IV 2026"
              width={96}
              height={96}
              priority
              className="w-full h-full object-contain rounded-xl"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-card border border-white/15 text-[11px] sm:text-xs font-semibold text-cyan-300 shadow-sm backdrop-blur-md mb-3">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            <span>PORDUS II KE-IV · DESA WANAJAYA CIBITUNG</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-3xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl [text-wrap:balance]">
            PORDUS 2 <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">WANAJAYA</span>
            <span className="block text-2xl sm:text-5xl lg:text-6xl mt-1.5 sm:mt-2 tracking-normal font-black text-slate-100">
              KE-IV
            </span>
          </h1>

          <p className="mt-3 sm:mt-4 text-sm sm:text-xl text-slate-300 max-w-2xl font-normal leading-relaxed">
            Turnamen Olahraga Antar RW Dusun II Wanajaya 2026
          </p>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mt-1">
            Membangun Sportivitas, Solidaritas, & Kebersamaan Warga Dusun II
          </p>

          {/* Dual Action CTA Buttons (Full-width stacked on narrow mobile) */}
          <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-5 w-full sm:w-auto max-w-md sm:max-w-none">
            <button
              onClick={onOpenSchedule}
              className="w-full sm:w-auto min-h-[48px] px-6 sm:px-7 py-3.5 rounded-2xl glass-card text-white font-semibold text-sm sm:text-base hover:bg-white/10 hover:border-white/30 border border-white/15 shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer group whitespace-nowrap shrink-0"
            >
              <span>Jadwal Pertandingan</span>
              <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onOpenResults}
              className="w-full sm:w-auto min-h-[48px] px-6 sm:px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 font-bold text-sm sm:text-base hover:shadow-[0_0_30px_rgba(52,211,153,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer group whitespace-nowrap shrink-0"
            >
              <span>Hasil Pertandingan</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Dynamic Visual Banner with Responsive KPI Bar */}
        <div className="mt-6 sm:mt-8 relative rounded-3xl overflow-hidden glass-card border border-white/15 p-2 sm:p-3 shadow-2xl">
          <div className="relative aspect-[3/2] w-full rounded-2xl overflow-hidden bg-[#070913]">
            <Image
              src="/assets/aistudio/IMG-20261019-WA0009_157e53c5.jpg"
              alt="Banner Resmi PORDUS II Ke-4 Desa Wanajaya - H Jalal Cup 2026"
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-contain object-center"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Glass Stats Bar: Cleanly stacked below poster so full event poster remains unobstructed */}
          <div className="mt-2.5 sm:mt-3">
            <div className="backdrop-blur-xl bg-[#070913]/85 border border-white/15 rounded-2xl p-3.5 sm:p-5 md:p-6 shadow-2xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-5 md:gap-6 md:divide-x divide-white/10">
                <div className="md:px-3 text-center md:text-left">
                  <p className="text-[11px] sm:text-xs text-cyan-300 font-medium tracking-wider uppercase">Wilayah Dusun</p>
                  <p className="text-lg sm:text-2xl font-black text-white mt-0.5 sm:mt-1 tabular-nums">12 RW</p>
                  <p className="text-[11px] text-slate-400">Dusun II Desa Wanajaya</p>
                </div>
                <div className="md:px-3 text-center md:text-left">
                  <p className="text-[11px] sm:text-xs text-teal-300 font-medium tracking-wider uppercase">Cabang Lomba</p>
                  <p className="text-lg sm:text-2xl font-black text-white mt-0.5 sm:mt-1">4 Cabor</p>
                  <p className="text-[11px] text-slate-400">Voli · Bulu Tangkis · Tenis Meja · Futsal</p>
                </div>
                <div className="md:px-3 text-center md:text-left">
                  <p className="text-[11px] sm:text-xs text-emerald-300 font-medium tracking-wider uppercase">Partisipan</p>
                  <p className="text-lg sm:text-2xl font-black text-white mt-0.5 sm:mt-1 tabular-nums">200+ Atlet</p>
                  <p className="text-[11px] text-slate-400">Warga Lokal Terdaftar</p>
                </div>
                <div className="md:px-3 text-center md:text-left">
                  <p className="text-[11px] sm:text-xs text-amber-300 font-medium tracking-wider uppercase">Gelar Kehormatan</p>
                  <p className="text-lg sm:text-2xl font-black text-white mt-0.5 sm:mt-1">Piala Bergilir</p>
                  <p className="text-[11px] text-slate-400">Juara Umum Dusun II</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
