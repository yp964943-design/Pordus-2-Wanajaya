'use client';

import React from 'react';
import { MapPin, Mail, Clock, ShieldCheck } from 'lucide-react';

export default function VenueAndContact() {
  return (
    <section className="py-10 md:py-12 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card rounded-3xl border border-white/15 p-6 sm:p-10">
          <div className="max-w-2xl">
            <span className="text-xs font-bold tracking-widest text-cyan-400 uppercase">
              Informasi Sekretariat & Lokasi
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              Pusat Gelanggang & Panitia Pelaksana
            </h3>
            <p className="mt-3 text-sm text-slate-300">
              Penyelenggaraan PORDUS 2 Wanajaya Ke-IV 2026 berpusat di fasilitas olahraga terpadu Dusun II Wanajaya Cibitung.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 text-sm">
            <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-bold text-white">Gelanggang Olahraga Dusun II</h5>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Desa Wanajaya, Kecamatan Cibitung, Kabupaten Bekasi, Jawa Barat
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h5 className="font-bold text-white">Email Sekretariat Panitia</h5>
                <a
                  href="mailto:dusun2.wanajaya@gmail.com"
                  className="text-xs text-cyan-300 hover:underline mt-1 block break-all"
                >
                  dusun2.wanajaya@gmail.com
                </a>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-bold text-white">Jam Layanan Sekretariat Panitia</h5>
                <p className="text-xs text-slate-300 mt-1">
                  Senin - Minggu: 08:00 - 21:00 WIB
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-3 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Didukung oleh Pengurus RW 01 - RW 12 & Karang Taruna Dusun II Wanajaya</span>
          </div>
        </div>
      </div>
    </section>
  );
}
