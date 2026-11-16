'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import About from '@/components/About';
import SportsCategories from '@/components/SportsCategories';
import HubSection, { HubTab } from '@/components/HubSection';
import RulesSection from '@/components/RulesSection';
import Gallery from '@/components/Gallery';
import VenueAndContact from '@/components/VenueAndContact';
import Footer from '@/components/Footer';
import AdminLoginModal from '@/components/AdminLoginModal';
import { useAdminAuth } from '@/lib/adminAuth';

export default function HomePage() {
  const [activeHubTab, setActiveHubTab] = useState<HubTab>('jadwal');
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [pendingAdminAction, setPendingAdminAction] = useState<'jadwal' | 'hasil' | 'galeri' | null>(null);
  const [adminPanel, setAdminPanel] = useState<'none' | 'jadwal' | 'hasil'>('none');
  const [galleryUploadOpen, setGalleryUploadOpen] = useState(false);
  const { isAdmin, login, logout } = useAdminAuth();

  const scrollToRules = () => {
    const el = document.getElementById('peraturan');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToHubTab = (tab: HubTab) => {
    setActiveHubTab(tab);
    const el = document.getElementById('hub-content-view');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRequestAdminLogin = (intent?: 'jadwal' | 'hasil' | 'galeri') => {
    setPendingAdminAction(intent ?? null);
    setLoginModalOpen(true);
  };

  const handleLoginSuccess = () => {
    if (pendingAdminAction === 'jadwal') {
      setAdminPanel('jadwal');
      scrollToHubTab('jadwal');
    } else if (pendingAdminAction === 'hasil') {
      setAdminPanel('hasil');
      scrollToHubTab('hasil');
    } else if (pendingAdminAction === 'galeri') {
      setGalleryUploadOpen(true);
      const el = document.getElementById('galeri');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
    setPendingAdminAction(null);
  };

  const handleLogoutAdmin = () => {
    setAdminPanel('none');
    setGalleryUploadOpen(false);
    logout();
  };

  const loginModalSubtitle =
    pendingAdminAction === 'jadwal'
      ? 'Masuk sebagai admin untuk membuka Form Input Jadwal Pertandingan.'
      : pendingAdminAction === 'hasil'
        ? 'Masuk sebagai admin untuk membuka Form Input Hasil Pertandingan.'
        : pendingAdminAction === 'galeri'
          ? 'Masuk sebagai admin untuk mengunggah foto ke Galeri.'
          : 'Masuk sebagai panitia admin untuk mengelola input jadwal, hasil pertandingan, dan galeri.';

  return (
    <div className="relative min-h-screen bg-[#070913] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navbar */}
      <Navbar 
        onOpenScheduleModal={() => scrollToHubTab('jadwal')}
        onOpenRulesModal={scrollToRules}
        isAdmin={isAdmin}
        onOpenLoginModal={() => handleRequestAdminLogin()}
        onLogoutAdmin={handleLogoutAdmin}
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero 
          onOpenSchedule={() => scrollToHubTab('jadwal')}
          onOpenResults={() => scrollToHubTab('hasil')}
        />

        {/* Section 1: Tentang Acara */}
        <About />

        {/* Section 2: Cabang Lomba */}
        <SportsCategories 
          onViewSchedule={() => scrollToHubTab('jadwal')}
        />

        {/* Section 3: Jadwal, Hasil, & Peraturan Hub */}
        <HubSection 
          activeTab={activeHubTab}
          onTabChange={setActiveHubTab}
          onOpenRules={scrollToRules}
          isAdmin={isAdmin}
          adminPanel={adminPanel}
          onAdminPanelChange={setAdminPanel}
          onRequestAdminLogin={handleRequestAdminLogin}
          onLogoutAdmin={handleLogoutAdmin}
        />

        {/* Section 4: Peraturan Pertandingan */}
        <RulesSection />

        {/* Section 5: Galeri Dokumentasi */}
        <Gallery
          isAdmin={isAdmin}
          isUploadOpen={galleryUploadOpen}
          onToggleUpload={setGalleryUploadOpen}
          onRequestAdminLogin={() => handleRequestAdminLogin('galeri')}
        />

        {/* Section 6: Gelanggang & Kontak Panitia */}
        <VenueAndContact />
      </main>

      {/* Footer */}
      <Footer />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={loginModalOpen}
        onClose={() => {
          setLoginModalOpen(false);
          setPendingAdminAction(null);
        }}
        onLogin={login}
        onSuccess={handleLoginSuccess}
        subtitle={loginModalSubtitle}
      />
    </div>
  );
}
