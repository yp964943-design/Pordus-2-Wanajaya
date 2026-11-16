import type {Metadata} from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PORDUS 2 WANAJAYA KE-IV 2026 | Turnamen Olahraga Antar RW Cibitung',
  description: 'Portal Resmi PORDUS 2 WANAJAYA KE-IV 2026. Turnamen Olahraga Antar RW Dusun II Wanajaya Cibitung. Jadwal, Hasil Pertandingan, Peraturan, Bagan Turnamen, Klasemen Medali, & Galeri.',
  openGraph: {
    title: 'PORDUS 2 WANAJAYA KE-IV 2026 | Turnamen Olahraga Antar RW',
    description: 'Ajang pesta olahraga tahunan mempertemukan atlet dari 12 RW Dusun II Wanajaya Cibitung.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PORDUS 2 WANAJAYA KE-IV 2026',
    description: 'Turnamen Olahraga Antar RW Dusun II Wanajaya Cibitung 2026',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} font-sans dark`}>
      <body className="min-h-screen bg-[#070913] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
