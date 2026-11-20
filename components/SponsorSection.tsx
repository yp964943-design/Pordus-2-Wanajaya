'use client';

import React from 'react';
import Image from 'next/image';

interface SponsorItem {
  id: string;
  name: string;
  subtitle: string;
  logo: string;
}

const SPONSORS: SponsorItem[] = [
  {
    id: 'sni',
    name: 'PT. Standart Network Indonesia',
    subtitle: 'Mitra Infrastruktur Jaringan',
    logo: '/assets/aistudio/SNI_401f32c1.png',
  },
  {
    id: 'jalal-abdul-nasir',
    name: 'H. Jalal Abdul Nasir, Ak',
    subtitle: 'Anggota DPR RI Dapil Jabar 7',
    logo: '/assets/aistudio/IMG_20261116_092533_95ca210c.png',
  },
  {
    id: 'razanet',
    name: 'Raza.net.id',
    subtitle: 'Mitra Layanan Internet',
    logo: '/assets/aistudio/Razanet_330694f9.png',
  },
];

export default function SponsorSection() {
  return (
    <section id="sponsor" className="py-8 md:py-12 relative">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="glass-card rounded-3xl border border-white/15 p-4 sm:p-10">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-bold tracking-widest text-cyan-400 uppercase">
              Sponsor &amp; Pendukung Acara
            </p>
            <h3 className="text-xl sm:text-3xl font-extrabold text-white mt-2 text-balance">
              Didukung Oleh Mitra &amp; Sponsor Resmi
            </h3>
            <p className="mt-2 sm:mt-2.5 text-sm text-slate-300">
              Terima kasih atas dukungan dan partisipasi seluruh sponsor dalam menyukseskan PORDUS 2 Wanajaya Ke-IV 2026.
            </p>
          </div>

          <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-6">
            {SPONSORS.map((sponsor) => (
              <div
                key={sponsor.id}
                className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 sm:p-5 flex flex-col items-center gap-3 transition-colors hover:border-cyan-500/30"
              >
                <div className="w-full h-24 sm:h-32 rounded-xl bg-white p-3 sm:p-4 flex items-center justify-center overflow-hidden">
                  <div className="relative w-full h-full">
                    <Image
                      src={sponsor.logo}
                      alt={`Logo Sponsor ${sponsor.name}`}
                      fill
                      sizes="(max-width: 640px) 90vw, 320px"
                      className="object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                <div className="text-center">
                  <h4 className="text-sm font-bold text-white">{sponsor.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{sponsor.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
