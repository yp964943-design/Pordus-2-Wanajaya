'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowUp } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-white/10 bg-[#050711] py-8 md:py-10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-white/10">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-0.5 border border-white/25 overflow-hidden shrink-0 flex items-center justify-center">
              <Image
                src="/assets/aistudio/Logo_PORDUS_2_8042f99b.png"
                alt="Logo Resmi PORDUS 2 Wanajaya"
                width={40}
                height={40}
                className="w-full h-full object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="font-extrabold text-white tracking-tight text-lg">
              PORDUS 2 WANAJAYA KE-IV 2026
            </span>
          </div>

          {/* Clean Nav Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            <a href="#beranda" className="hover:text-cyan-300 transition-colors">Beranda</a>
            <a href="#tentang" className="hover:text-cyan-300 transition-colors">Tentang</a>
            <a href="#cabang-lomba" className="hover:text-cyan-300 transition-colors">Cabang Lomba</a>
            <a href="#jadwal" className="hover:text-cyan-300 transition-colors">Jadwal & Hasil</a>
            <a href="#peraturan" className="hover:text-cyan-300 transition-colors">Peraturan</a>
            <a href="#galeri" className="hover:text-cyan-300 transition-colors">Galeri</a>
          </nav>

          {/* Scroll to top */}
          <button
            onClick={scrollToTop}
            className="p-2.5 rounded-xl glass-card text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Kembali ke atas"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>

        {/* Legal & Village attribution */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 text-center sm:text-left">
          <p>
            © 2026 Panitia Pelaksana PORDUS 2 Wanajaya Ke-IV · Dusun II Desa Wanajaya Cibitung.
          </p>
          <p className="text-slate-400">
            Membangun Sportivitas & Kebersamaan Warga Dusun II
          </p>
        </div>

      </div>
    </footer>
  );
}
