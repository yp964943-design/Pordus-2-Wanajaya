'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Menu, X, Lock, LogOut, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  onOpenScheduleModal: () => void;
  onOpenRulesModal: () => void;
  isAdmin: boolean;
  onOpenLoginModal: () => void;
  onLogoutAdmin: () => void;
}

export default function Navbar({
  onOpenScheduleModal,
  onOpenRulesModal,
  isAdmin,
  onOpenLoginModal,
  onLogoutAdmin,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Beranda', href: '#beranda' },
    { label: 'Tentang', href: '#tentang' },
    { label: 'Cabang Lomba', href: '#cabang-lomba' },
    { label: 'Jadwal & Hasil', href: '#jadwal' },
    { label: 'Peraturan', href: '#peraturan' },
    { label: 'Galeri', href: '#galeri' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#070913]/80 border-b border-white/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 sm:gap-6 h-14 sm:h-16 lg:h-20">
          
          {/* Zone 1: Brand Wordmark */}
          <a 
            href="#beranda" 
            className="flex items-center gap-2.5 sm:gap-3 text-base sm:text-lg lg:text-xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 group min-h-[44px]"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white p-0.5 border border-white/25 shadow-lg shadow-cyan-500/15 group-hover:shadow-cyan-500/35 transition-all overflow-hidden shrink-0 flex items-center justify-center">
              <Image
                src="/assets/aistudio/Logo_PORDUS_2_8042f99b.png"
                alt="Logo Resmi PORDUS 2 Wanajaya"
                width={44}
                height={44}
                className="w-full h-full object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="font-extrabold tracking-tight">
              PORDUS 2 <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">WANAJAYA</span>
            </span>
          </a>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 py-1 relative group"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-200 group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* Zone 3: Admin Login (Desktop & Tablet) */}
          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            {isAdmin ? (
              <button
                type="button"
                onClick={onLogoutAdmin}
                title="Keluar dari mode admin"
                className="min-h-[44px] px-3.5 py-2.5 text-xs font-semibold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
                <LogOut className="w-3.5 h-3.5 ml-0.5 text-emerald-200" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="min-h-[44px] px-3.5 py-2.5 text-xs font-semibold text-slate-200 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Login Admin</span>
              </button>
            )}
          </div>

          {/* Mobile Action Bar: Quick Admin Trigger + Hamburger Button */}
          <div className="flex lg:hidden items-center gap-1.5 shrink-0">
            {isAdmin ? (
              <button
                type="button"
                onClick={onLogoutAdmin}
                aria-label="Keluar mode admin"
                className="sm:hidden min-h-[44px] px-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-xs font-semibold text-emerald-200 flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenLoginModal}
                aria-label="Login admin"
                className="sm:hidden min-w-[44px] min-h-[44px] px-2.5 rounded-xl bg-white/5 border border-white/15 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Admin</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl glass-card text-slate-200 hover:text-cyan-400 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden backdrop-blur-2xl bg-[#090d1f]/95 border-b border-white/10 px-4 sm:px-6 py-5 space-y-4 animate-in slide-in-from-top-4 duration-200">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-200 bg-white/[0.03] border border-white/5 hover:bg-white/10 hover:text-cyan-400 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
            {isAdmin ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogoutAdmin();
                }}
                className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/25 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Aktif · Logout</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLoginModal();
                }}
                className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-white/5 border border-white/15 text-sm font-semibold text-slate-100 hover:bg-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>Login Admin</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenRulesModal();
              }}
              className="w-full min-h-[44px] py-3 px-4 rounded-xl glass-card text-sm font-semibold text-slate-200 hover:bg-white/10 transition-colors text-center cursor-pointer"
            >
              Pedoman & Aturan Lomba
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenScheduleModal();
              }}
              className="w-full min-h-[44px] py-3 px-4 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-lg text-center cursor-pointer"
            >
              Jadwal & Hasil Pertandingan
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
