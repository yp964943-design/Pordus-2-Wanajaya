'use client';

import React from 'react';
import { HeartHandshake, Award, Users2, ShieldCheck, MapPin, Sparkles } from 'lucide-react';

export default function About() {
  const pillars = [
    {
      title: 'Sportivitas & Integritas',
      description: 'Menjunjung tinggi sportivitas, kejujuran kompetisi, serta respek antaratlet dan wasit di setiap laga.',
      icon: ShieldCheck,
      gradient: 'from-cyan-500/20 to-blue-500/10',
      iconColor: 'text-cyan-400',
    },
    {
      title: 'Silaturahmi 12 RW',
      description: 'Mempererat tali persaudaraan dan kebersamaan seluruh warga masyarakat Dusun II Wanajaya Cibitung.',
      icon: Users2,
      gradient: 'from-teal-500/20 to-emerald-500/10',
      iconColor: 'text-teal-400',
    },
    {
      title: 'Bibit Unggul Olahraga',
      description: 'Mencari dan mengembangkan potensi atlet berbakat lokal menuju jenjang turnamen tingkat kecamatan & kabupaten.',
      icon: Award,
      gradient: 'from-amber-500/20 to-orange-500/10',
      iconColor: 'text-amber-400',
    },
  ];

  return (
    <section id="tentang" className="py-10 md:py-12 relative">
      {/* Background soft glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold tracking-widest text-cyan-400 uppercase">
            Membangun Sportivitas & Kebersamaan Warga Dusun II
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
            TENTANG ACARA
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-cyan-400 to-emerald-400 mx-auto mt-4 rounded-full" />
          
          {/* Exact Verbatim Text from User Attachment */}
          <div className="mt-6 glass-card rounded-3xl p-6 sm:p-8 border border-white/15 relative overflow-hidden text-left sm:text-center">
            <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal">
              <span className="font-bold text-white">PORDUS 2 WANAJAYA KE-IV</span> adalah ajang turnamen olahraga tahunan yang mempertemukan para atlet dan warga dari <span className="text-cyan-300 font-semibold">12 Rukun Warga (RW)</span> di lingkungan Dusun 2 Wanajaya. Acara ini bertujuan untuk mempererat tali silaturahmi, menumbuhkan semangat sportivitas, serta mencari bibit unggul olahraga di tingkat dusun.
            </p>
            
            <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span>Desa Wanajaya, Kecamatan Cibitung, Bekasi</span>
              </div>
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-emerald-400" />
                <span>Edisi Ke-4 · Tahun 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Gotong Royong & Pesta Rakyat</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {pillars.map((pillar) => {
            const IconComponent = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="glass-card glass-card-hover rounded-2xl p-6 sm:p-8 border border-white/15 relative flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pillar.gradient} border border-white/15 flex items-center justify-center mb-5`}>
                    <IconComponent className={`w-6 h-6 ${pillar.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center text-xs font-medium text-slate-400">
                  <span>PORDUS 2 WANAJAYA 2026</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
