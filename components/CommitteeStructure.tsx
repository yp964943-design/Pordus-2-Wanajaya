'use client';

import React from 'react';
import Image from 'next/image';
import { Award, ShieldCheck } from 'lucide-react';

interface CommitteeMember {
  id: string;
  role: string;
  name: string;
  duty: string;
  photo: string;
}

const CHAIRPERSON: CommitteeMember = {
  id: 'ketua',
  role: 'Ketua',
  name: 'Fajri',
  duty: 'Koordinator Umum & Penanggung Jawab Komite',
  photo: '/assets/aistudio/Fajri_20261120_205259_0000_84ffd970.png',
};

const COMMITTEE_MEMBERS: CommitteeMember[] = [
  {
    id: 'sekretaris',
    role: 'Sekretaris',
    name: 'Triyono',
    duty: 'Administrasi, Data Atlet & Surat Menyurat',
    photo: '/assets/aistudio/Triyono_20261120_205259_0001_93995b86.png',
  },
  {
    id: 'bendahara',
    role: 'Bendahara',
    name: 'Joko Purwanto',
    duty: 'Pengelolaan Keuangan & Transparansi Dana',
    photo: '/assets/aistudio/Joko_Purwanto_20261120_205259_0002_2805b74e.png',
  },
  {
    id: 'humas',
    role: 'Humas',
    name: 'Sugiyarso',
    duty: 'Publikasi, Dokumentasi & Komunikasi RW',
    photo: '/assets/aistudio/Sugiyarso_20261120_205259_0003_340a0335.png',
  },
  {
    id: 'sie-pertandingan',
    role: 'Sie Pertandingan',
    name: 'Yayan Permana',
    duty: 'Teknis Laga, Jadwal & Perwasitan Cabor',
    photo: '/assets/aistudio/Yayan_667e2699.png',
  },
];

export default function CommitteeStructure() {
  return (
    <section id="pengurus" className="py-8 md:py-12 relative">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="glass-card rounded-3xl border border-white/15 p-4 sm:p-10">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
              Struktur Organisasi
            </p>
            <h3 className="text-xl sm:text-3xl font-extrabold text-white mt-2 text-balance">
              Struktur Pengurus Komite Olahraga Dusun II
            </h3>
            <p className="mt-2 sm:mt-2.5 text-xs sm:text-sm text-cyan-300 font-semibold">
              Periode 2023–2026 · Dusun II Desa Wanajaya, Cibitung
            </p>
          </div>

          {/* Hierarchy Tree Layout */}
          <div className="mt-7 sm:mt-10 flex flex-col items-center">
            {/* Tier 1: Ketua */}
            <div className="w-full max-w-[260px] sm:max-w-[280px]">
              <article className="rounded-2xl bg-gradient-to-b from-cyan-500/[0.10] to-white/[0.03] border border-cyan-400/35 p-3.5 sm:p-4 shadow-xl shadow-cyan-500/10 flex flex-col items-center text-center">
                <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-slate-900 border border-white/15">
                  <Image
                    src={CHAIRPERSON.photo}
                    alt={`${CHAIRPERSON.role} Komite Olahraga Dusun II - ${CHAIRPERSON.name}`}
                    fill
                    sizes="(max-width: 640px) 240px, 280px"
                    className="object-cover object-top"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070913]/65 via-transparent to-transparent" />
                </div>

                <div className="mt-3.5 space-y-1">
                  <p className="text-[11px] font-bold tracking-widest uppercase text-cyan-300 flex items-center justify-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{CHAIRPERSON.role}</span>
                  </p>
                  <h4 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                    {CHAIRPERSON.name}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
                    {CHAIRPERSON.duty}
                  </p>
                </div>
              </article>
            </div>

            {/* Organizational Connector Lines (Desktop) */}
            <div className="hidden lg:flex flex-col items-center w-full max-w-4xl my-1" aria-hidden="true">
              <div className="w-px h-7 bg-gradient-to-b from-cyan-400/60 to-emerald-400/50" />
              <div className="w-[76%] h-px bg-gradient-to-r from-cyan-400/40 via-emerald-400/60 to-cyan-400/40" />
              <div className="w-[76%] grid grid-cols-4">
                <div className="flex justify-center">
                  <div className="w-px h-5 bg-cyan-400/45" />
                </div>
                <div className="flex justify-center">
                  <div className="w-px h-5 bg-emerald-400/45" />
                </div>
                <div className="flex justify-center">
                  <div className="w-px h-5 bg-emerald-400/45" />
                </div>
                <div className="flex justify-center">
                  <div className="w-px h-5 bg-cyan-400/45" />
                </div>
              </div>
            </div>

            {/* Mobile/Tablet Vertical Spacer */}
            <div className="lg:hidden w-px h-5 bg-gradient-to-b from-cyan-400/50 to-emerald-400/30 my-1" aria-hidden="true" />

            {/* Tier 2: Sekretaris, Bendahara, Humas, Sie Pertandingan */}
            <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {COMMITTEE_MEMBERS.map((member) => (
                <article
                  key={member.id}
                  className="rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/15 hover:border-cyan-400/35 p-3 sm:p-4 transition-all flex flex-col items-center text-center"
                >
                  <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-slate-900 border border-white/10">
                    <Image
                      src={member.photo}
                      alt={`${member.role} Komite Olahraga Dusun II - ${member.name}`}
                      fill
                      sizes="(max-width: 640px) 44vw, (max-width: 1024px) 44vw, 260px"
                      className="object-cover object-top"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#070913]/60 via-transparent to-transparent" />
                  </div>

                  <div className="mt-3 space-y-1">
                    <p className="text-[11px] font-bold tracking-wider uppercase text-emerald-300">
                      {member.role}
                    </p>
                    <h4 className="text-sm sm:text-lg font-extrabold text-white tracking-tight">
                      {member.name}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {member.duty}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-6 sm:mt-8 pt-5 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-slate-400 text-center">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Komite Olahraga Dusun II Wanajaya · Masa Bakti 2023–2026</span>
          </div>
        </div>
      </div>
    </section>
  );
}
