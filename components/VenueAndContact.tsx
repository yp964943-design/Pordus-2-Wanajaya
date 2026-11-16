'use client';

import React, { useState } from 'react';
import { MapPin, Mail, Phone, Clock, MessageSquare, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

export default function VenueAndContact() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Siapa saja yang berhak mewakili RW pada PORDUS 2 Wanajaya KE-IV?',
      a: 'Seluruh warga yang berdomisili sah dan memiliki KTP atau Kartu Keluarga (KK) yang beralamat di wilayah RW 01 sampai dengan RW 12 Dusun II Desa Wanajaya Cibitung.',
    },
    {
      q: 'Bolehkah satu atlet mengikuti lebih dari satu cabang olahraga?',
      a: 'Demi asas pemerataan, keadilan, dan menjaga kebugaran stamina bertanding, setiap atlet hanya diperbolehkan terdaftar dan bertanding pada 1 cabang olahraga saja.',
    },
    {
      q: 'Di mana seluruh pertandingan PORDUS 2 Wanajaya KE-IV dilaksanakan?',
      a: 'Seluruh pertandingan Bola Voli dan Bulu Tangkis dipusatkan di SOR RW 017 sesuai jadwal resmi pada tanggal 15 dan 21 November 2026.',
    },
    {
      q: 'Apakah suporter warga dikenakan biaya tiket masuk?',
      a: 'PORDUS 2 Wanajaya adalah pesta olahraga rakyat tanpa pungutan biaya masuk (gratis) untuk seluruh warga dengan kewajiban menjaga ketertiban dan kebersihan arena.',
    },
  ];

  return (
    <section className="py-10 md:py-12 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          
          {/* Left: Venue & Official Contact */}
          <div className="glass-card rounded-3xl border border-white/15 p-6 sm:p-10 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold tracking-widest text-cyan-400 uppercase">
                Informasi Sekretariat & Lokasi
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                Pusat Gelanggang & Panitia Pelaksana
              </h3>
              <p className="mt-3 text-sm text-slate-300">
                Penyelenggaraan PORDUS 2 Wanajaya Ke-IV 2026 berpusat di fasilitas olahraga terpadu Dusun II Wanajaya Cibitung.
              </p>

              <div className="mt-8 space-y-5 text-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white">Gelanggang Olahraga Dusun II</h5>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                      Desa Wanajaya, Kecamatan Cibitung, Kabupaten Bekasi, Jawa Barat
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white">Email Sekretariat Panitia</h5>
                    <a 
                      href="mailto:dusun2.wanajaya@gmail.com" 
                      className="text-xs text-cyan-300 hover:underline mt-0.5 block"
                    >
                      dusun2.wanajaya@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white">Jam Layanan Sekretariat Panitia</h5>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Senin - Minggu: 08:00 - 21:00 WIB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-3 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Didukung oleh Pengurus RW 01 - RW 12 & Karang Taruna Dusun II Wanajaya</span>
            </div>
          </div>

          {/* Right: FAQ Accordion */}
          <div className="glass-card rounded-3xl border border-white/15 p-6 sm:p-10">
            <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
              Tanya Jawab Seputar Turnamen
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 mb-6">
              Pertanyaan Umum (FAQ)
            </h3>

            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 hover:bg-white/[0.04] transition-colors cursor-pointer"
                    >
                      <span className="text-sm font-bold text-white">
                        {faq.q}
                      </span>
                      <div className="shrink-0 text-slate-400">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
