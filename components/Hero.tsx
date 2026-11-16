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
    <section id="beranda" className="relative pt-8 pb-10 md:pt-10 md:pb-12 overflow-hidden">
      {/* Ambient Glassmorphic Background Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[900px] h-[350px] md:h-[500px] bg-gradient-to-tr from-cyan-600/20 via-teal-500/15 to-emerald-500/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-600/15 rounded-full blur-[90px] pointer-events-none -z-10" />
      <div className="absolute top-40 right-10 w-80 h-80 bg-emerald-600/15 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Trust Marker / Official PORDUS Logo */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-1.5 border border-white/25 shadow-xl shadow-cyan-500/15 mb-4 overflow-hidden flex items-center justify-center">
            <Image
              src="/assets/aistudio/Logo_PORDUS_2_8042f99b.png"
              alt="Logo Resmi PORDUS 2 Wanajaya"
              width={96}
              height={96}
              priority
              className="w-full h-full object-contain rounded-xl"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border border-white/15 text-xs font-semibold text-cyan-300 shadow-sm backdrop-blur-md mb-3">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>PORDUS II KE-IV · DESA WANAJAYA CIBITUNG</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl [text-wrap:balance]">
            PORDUS 2 <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">WANAJAYA</span>
            <span className="block text-3xl sm:text-5xl lg:text-6xl mt-2 tracking-normal font-black text-slate-100">
              KE-IV
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-xl text-slate-300 max-w-2xl font-normal leading-relaxed">
            Turnamen Olahraga Antar RW Dusun II Wanajaya 2026
          </p>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mt-1">
            Membangun Sportivitas, Solidaritas, & Kebersamaan Warga Dusun II
          </p>

          {/* Dual Action CTA Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-5">
            <button
              onClick={onOpenSchedule}
              className="px-7 py-3.5 rounded-2xl glass-card text-white font-semibold text-sm sm:text-base hover:bg-white/10 hover:border-white/30 border border-white/15 shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer group whitespace-nowrap shrink-0"
            >
              <span>Jadwal Pertandingan</span>
              <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onOpenResults}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 font-bold text-sm sm:text-base hover:shadow-[0_0_30px_rgba(52,211,153,0.4)] active:scale-95 transition-all flex items-center gap-2 cursor-pointer group whitespace-nowrap shrink-0"
            >
              <span>Hasil Pertandingan</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Dynamic Visual Banner with Glass Overlays */}
        <div className="mt-8 relative rounded-3xl overflow-hidden glass-card border border-white/15 p-2 sm:p-3 shadow-2xl">
          <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full rounded-2xl overflow-hidden">
            <Image
              src="/images/hero_pordus_sports_1792865214551.jpg"
              alt="Turnamen Olahraga PORDUS 2 Wanajaya Cibitung 2026"
              fill
              priority
              className="object-cover object-center scale-105 hover:scale-100 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            {/* Scrim Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#070913] via-[#070913]/40 to-transparent" />
            
            {/* Floating Glass Stats Bar */}
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
              <div className="backdrop-blur-xl bg-[#070913]/80 border border-white/15 rounded-2xl p-4 sm:p-6 shadow-2xl">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
                  <div className="pt-2 sm:pt-0 sm:px-3 text-center sm:text-left">
                    <p className="text-xs text-cyan-300 font-medium tracking-wider uppercase">Wilayah Dusun</p>
                    <p className="text-xl sm:text-2xl font-black text-white mt-1 tabular-nums">12 RW</p>
                    <p className="text-[11px] text-slate-400">Dusun II Desa Wanajaya</p>
                  </div>
                  <div className="pt-2 sm:pt-0 sm:px-3 text-center sm:text-left">
                    <p className="text-xs text-teal-300 font-medium tracking-wider uppercase">Cabang Lomba</p>
                    <p className="text-xl sm:text-2xl font-black text-white mt-1">4 Cabor</p>
                    <p className="text-[11px] text-slate-400">Voli · Bulu Tangkis · Tenis Meja · Futsal Anak</p>
                  </div>
                  <div className="pt-2 sm:pt-0 sm:px-3 text-center sm:text-left">
                    <p className="text-xs text-emerald-300 font-medium tracking-wider uppercase">Partisipan</p>
                    <p className="text-xl sm:text-2xl font-black text-white mt-1 tabular-nums">200+ Atlet</p>
                    <p className="text-[11px] text-slate-400">Warga Lokal Terdaftar</p>
                  </div>
                  <div className="pt-2 sm:pt-0 sm:px-3 text-center sm:text-left">
                    <p className="text-xs text-amber-300 font-medium tracking-wider uppercase">Gelar Kehormatan</p>
                    <p className="text-xl sm:text-2xl font-black text-white mt-1">Piala Bergilir</p>
                    <p className="text-[11px] text-slate-400">Juara Umum Dusun II</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
