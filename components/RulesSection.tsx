'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Download,
  AlertCircle,
  FileCheck,
  Clock,
  Trophy,
  Users,
} from 'lucide-react';
import { OFFICIAL_RULES_SECTIONS } from '@/data/pordusData';

export default function RulesSection() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'bab-1': true,
    'bab-2': true,
    'bab-3': false,
    'bab-4': false,
    'bab-5': false,
    'bab-6': false,
  });

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const allExpanded = OFFICIAL_RULES_SECTIONS.every((s) => openSections[s.id]);

  const toggleAll = () => {
    const nextState = !allExpanded;
    const updated: Record<string, boolean> = {};
    OFFICIAL_RULES_SECTIONS.forEach((s) => {
      updated[s.id] = nextState;
    });
    setOpenSections(updated);
  };

  return (
    <section id="peraturan" className="py-10 md:py-12 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
            Ringkasan Panduan Teknis & Regulasi Resmi
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
            PERATURAN PERTANDINGAN
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-emerald-400 to-cyan-400 mx-auto mt-4 rounded-full" />
          <p className="mt-4 text-sm sm:text-base text-slate-300">
            Intisari BAB I–VI (Pasal 1–20) Panduan Teknis dan Peraturan Pertandingan Komite Olahraga Dusun II Wanajaya.
          </p>
        </div>

        {/* Quick Requirement & Official PDF Download Callout */}
        <div className="glass-card rounded-2xl p-6 border border-emerald-500/25 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                Dokumen Resmi Panduan Teknis PORDUS II Wanajaya
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Meliputi syarat domisili RW (KTP/KK/Kartu Pelajar), teknis cabor, klasemen poin, tata cara protes, dan sanksi disiplin.
              </p>
            </div>
          </div>

          <a
            href="/assets/aistudio/Peraturan_dan_petunjuk_teknis_PORDUS_II_Wanajaya_dda23dce.pdf"
            download="Panduan_Teknis_dan_Peraturan_PORDUS_II_Wanajaya.pdf"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 text-xs font-bold shadow-md hover:shadow-[0_0_20px_rgba(34,211,238,0.35)] active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Juknis Lengkap (PDF)</span>
          </a>
        </div>

        {/* 3 Key Highlights Strip from the PDF */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="glass-card rounded-2xl p-4 border border-white/10 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-300 shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Kuota & Identitas</p>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Maks. 12 atlet + 2 ofisial per cabor dengan KTP/KK/Kartu Pelajar atau surat domisili RW.
              </p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-white/10 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-300 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Kehadiran & Denda WO</p>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Hadir maks. 15 mnt sebelum laga; tidak hadir tanpa alasan sah kena WO & denda Rp 250.000,-.
              </p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-white/10 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-300 shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Poin & Peringkat</p>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Menang / Menang WO = 3 poin, Kalah = 0 poin; urut poin, set menang, lalu skor tertinggi.
              </p>
            </div>
          </div>
        </div>

        {/* Expand/Collapse All Bar */}
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs text-slate-400">
            {OFFICIAL_RULES_SECTIONS.length} Bab · 20 Pasal Resmi
          </span>
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition-colors cursor-pointer"
          >
            {allExpanded ? 'Tutup Semua Bab' : 'Buka Semua Bab'}
          </button>
        </div>

        {/* Expandable Accordion of Rules */}
        <div className="space-y-3.5">
          {OFFICIAL_RULES_SECTIONS.map((section) => {
            const isOpen = openSections[section.id];
            return (
              <div
                key={section.id}
                className="glass-card rounded-2xl border border-white/10 overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  <span className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {section.title}
                  </span>
                  <div className="p-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 shrink-0">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="p-5 sm:p-6 pt-0 border-t border-white/5">
                    <ul className="space-y-3 text-sm text-slate-300 mt-4">
                      {section.points.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="w-5 h-5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Official Attribution / Disclaimer */}
        <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 text-xs text-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <span>
            Disahkan oleh Komite Olahraga Dusun II Wanajaya (Ketua: Fajri · Sie Pertandingan: Yayan Permana). Melalui Olah Raga, Jalin Tali Silaturahmi.
          </span>
        </div>

      </div>
    </section>
  );
}
