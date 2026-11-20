'use client';

import React, { useState } from 'react';
import Navbar, { AdminMenuAction } from '@/components/Navbar';
import Hero from '@/components/Hero';
import About from '@/components/About';
import SportsCategories from '@/components/SportsCategories';
import HubSection, { HubTab } from '@/components/HubSection';
import RulesSection from '@/components/RulesSection';
import Gallery from '@/components/Gallery';
import VenueAndContact from '@/components/VenueAndContact';
import CommentSection from '@/components/CommentSection';
import CommitteeStructure from '@/components/CommitteeStructure';
import SponsorSection from '@/components/SponsorSection';
import Footer from '@/components/Footer';
import AdminLoginModal from '@/components/AdminLoginModal';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useAdminAuth } from '@/lib/adminAuth';

export default function HomePage() {
  const [activeHubTab, setActiveHubTab] = useState<HubTab>('jadwal');
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [pendingAdminAction, setPendingAdminAction] = useState<AdminMenuAction | null>(null);
  const [adminPanel, setAdminPanel] = useState<'none' | 'jadwal' | 'edit-jadwal' | 'hasil'>('none');
  const [galleryUploadOpen, setGalleryUploadOpen] = useState(false);
  const { isAdmin, login, logout } = useAdminAuth();

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToRules = () => {
    scrollToSection('peraturan');
  };

  const scrollToHubTab = (tab: HubTab) => {
    setActiveHubTab(tab);
    scrollToSection('hub-content-view');
  };

  const handleRequestAdminLogin = (intent?: AdminMenuAction) => {
    setPendingAdminAction(intent ?? null);
    setLoginModalOpen(true);
  };

  const handleOpenAdminAction = (action: AdminMenuAction) => {
    if (action === 'jadwal') {
      setAdminPanel('jadwal');
      scrollToHubTab('jadwal');
    } else if (action === 'edit-jadwal') {
      setAdminPanel('edit-jadwal');
      scrollToHubTab('jadwal');
    } else if (action === 'hasil') {
      setAdminPanel('hasil');
      scrollToHubTab('hasil');
    } else if (action === 'galeri') {
      setGalleryUploadOpen(true);
      scrollToSection('galeri');
    }
  };

  const handleLoginSuccess = () => {
    if (pendingAdminAction) {
      handleOpenAdminAction(pendingAdminAction);
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
      : pendingAdminAction === 'edit-jadwal'
        ? 'Masuk sebagai admin untuk mengedit Jadwal Pertandingan.'
        : pendingAdminAction === 'hasil'
          ? 'Masuk sebagai admin untuk membuka Form Input Hasil Pertandingan.'
          : pendingAdminAction === 'galeri'
            ? 'Masuk sebagai admin untuk mengunggah foto ke Galeri.'
            : 'Masuk sebagai panitia admin untuk mengelola input & edit jadwal, hasil pertandingan, dan galeri.';

  return (
    <div className="relative min-h-screen bg-[#070913] text-slate-100 flex flex-col pb-20 md:pb-0 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navbar */}
      <Navbar 
        onOpenScheduleModal={() => scrollToHubTab('jadwal')}
        onOpenRulesModal={scrollToRules}
        isAdmin={isAdmin}
        onOpenLoginModal={() => handleRequestAdminLogin()}
        onOpenAdminAction={handleOpenAdminAction}
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

        {/* Section 7: Komentar & Dukungan Warga */}
        <CommentSection isAdmin={isAdmin} />

        {/* Section 8: Struktur Pengurus Komite Olahraga Dusun II */}
        <CommitteeStructure />

        {/* Section 9: Sponsor Resmi */}
        <SponsorSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Thumb-Zone Navigation */}
      <MobileBottomNav
        activeHubTab={activeHubTab}
        onSelectHubTab={scrollToHubTab}
        onJumpToSection={scrollToSection}
      />

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
