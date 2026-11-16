'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  CalendarDays,
  Clock,
  MapPin,
  PlusCircle,
  Shield,
  AlertCircle,
  X,
} from 'lucide-react';
import { BadmintonDoublePartai, MatchItem, RW_LOGOS } from '@/data/pordusData';

interface MatchScheduleFormProps {
  onAddMatch: (match: MatchItem) => void;
  onClose: () => void;
}

const SPORTS_OPTIONS: MatchItem['sport'][] = [
  'Bola Voli',
  'Bulu Tangkis',
  'Tenis Meja',
  'Futsal Anak',
];

const ROUND_ROBIN_ROUNDS = [
  'Sistem Bertemu',
  'Putaran 1',
  'Putaran 2',
  'Putaran 3',
];

const KNOCKOUT_ROUNDS = [
  'Group A',
  'Group B',
  'Group C',
  'Group D',
  'Penyisihan',
  'Perempat Final',
  'Semi Final',
  'Perebutan Juara 3',
  'Final',
];

function getCategoryOptionsForSport(sport: MatchItem['sport']): string[] {
  switch (sport) {
    case 'Tenis Meja':
      return ['Beregu Putra'];
    case 'Futsal Anak':
      return ['Anak-Anak (U-12)'];
    case 'Bola Voli':
      return ['Putra', 'Putri'];
    case 'Bulu Tangkis':
    default:
      return ['Putra', 'Putri', 'Ganda Putra', 'Ganda Putri', 'Ganda Campuran', 'Campuran'];
  }
}

function isRoundRobinSport(sport: MatchItem['sport'], category: string): boolean {
  return sport === 'Futsal Anak' || (sport === 'Bola Voli' && category === 'Putri');
}

const RW_KEYS = Object.keys(RW_LOGOS);

function formatIndonesianDate(isoDate: string): string {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  const dateObj = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(dateObj);
}

function formatWibTime(time24: string): string {
  if (!time24) return '';
  return `${time24.replace(':', '.')} WIB`;
}

function TeamLogoPreview({ rw }: { rw: string }) {
  const info = RW_LOGOS[rw];
  if (!info?.logo) {
    return (
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/15 flex items-center justify-center shrink-0">
        <Shield className="w-5 h-5 text-cyan-400" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-xl overflow-hidden bg-white p-0.5 border border-white/20 shrink-0 flex items-center justify-center">
      {info.logo.endsWith('.svg') ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={info.logo}
          alt={`Logo ${rw}`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain rounded-lg"
        />
      ) : (
        <Image
          src={info.logo}
          alt={`Logo ${rw}`}
          width={40}
          height={40}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain rounded-lg"
        />
      )}
    </div>
  );
}

export default function MatchScheduleForm({ onAddMatch, onClose }: MatchScheduleFormProps) {
  const [sport, setSport] = useState<MatchItem['sport']>('Bola Voli');
  const [category, setCategory] = useState<string>('Putra');
  const [round, setRound] = useState<string>('Group A');
  const [teamARw, setTeamARw] = useState<string>(RW_KEYS[0] ?? 'RW 013');
  const [teamBRw, setTeamBRw] = useState<string>(RW_KEYS[1] ?? 'RW 015');
  const [dateIso, setDateIso] = useState<string>('2026-11-22');
  const [time24, setTime24] = useState<string>('15:30');
  const [venue, setVenue] = useState<string>('SOR RW 017');
  const [status, setStatus] = useState<MatchItem['status']>('Segera');
  const [badmintonPairs, setBadmintonPairs] = useState<BadmintonDoublePartai[]>([
    { partai: 1, label: 'Ganda 1', pairA: '', pairB: '', scoreA: 0, scoreB: 0 },
    { partai: 2, label: 'Ganda 2', pairA: '', pairB: '', scoreA: 0, scoreB: 0 },
    { partai: 3, label: 'Ganda 3', pairA: '', pairB: '', scoreA: 0, scoreB: 0 },
  ]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const availableCategories = getCategoryOptionsForSport(sport);
  const usesRoundRobin = isRoundRobinSport(sport, category);
  const availableRounds = usesRoundRobin ? ROUND_ROBIN_ROUNDS : KNOCKOUT_ROUNDS;

  const handlePairChange = (partai: number, field: 'pairA' | 'pairB', value: string) => {
    setBadmintonPairs((prev) =>
      prev.map((item) => (item.partai === partai ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!teamARw || !teamBRw) {
      setErrorMessage('Pilih kedua kontingen RW yang akan bertanding.');
      return;
    }

    if (teamARw === teamBRw) {
      setErrorMessage('Kontingen RW A dan RW B tidak boleh sama.');
      return;
    }

    if (!dateIso) {
      setErrorMessage('Tanggal pertandingan wajib diisi.');
      return;
    }

    if (!time24) {
      setErrorMessage('Jam pertandingan wajib diisi.');
      return;
    }

    const trimmedVenue = venue.trim();
    if (!trimmedVenue) {
      setErrorMessage('Lokasi pertandingan wajib diisi.');
      return;
    }

    const teamAInfo = RW_LOGOS[teamARw];
    const teamBInfo = RW_LOGOS[teamBRw];

    const newMatch: MatchItem = {
      id: `custom-${Date.now()}`,
      sport,
      category,
      round,
      teamA: {
        rw: teamARw,
        name: teamAInfo?.name || 'Dusun II Wanajaya',
        logo: teamAInfo?.logo,
      },
      teamB: {
        rw: teamBRw,
        name: teamBInfo?.name || 'Dusun II Wanajaya',
        logo: teamBInfo?.logo,
      },
      date: formatIndonesianDate(dateIso),
      time: formatWibTime(time24),
      venue: trimmedVenue,
      status,
      isCustom: true,
      ...(sport === 'Bola Voli'
        ? {
            sets: [
              { set: 1, scoreA: 0, scoreB: 0 },
              { set: 2, scoreA: 0, scoreB: 0 },
              { set: 3, scoreA: 0, scoreB: 0 },
            ],
          }
        : {}),
      ...(sport === 'Bulu Tangkis'
        ? {
            badmintonDoubles: badmintonPairs.map((item) => ({
              ...item,
              pairA: item.pairA?.trim() || '',
              pairB: item.pairB?.trim() || '',
            })),
          }
        : {}),
      ...(sport === 'Tenis Meja'
        ? {
            tableTennisMatches: [
              { partai: 1, label: 'Ganda 1', playerA: '', playerB: '', scoreA: 0, scoreB: 0 },
              { partai: 2, label: 'Tunggal 1', playerA: '', playerB: '', scoreA: 0, scoreB: 0 },
              { partai: 3, label: 'Ganda 2', playerA: '', playerB: '', scoreA: 0, scoreB: 0 },
              { partai: 4, label: 'Tunggal 2', playerA: '', playerB: '', scoreA: 0, scoreB: 0 },
              { partai: 5, label: 'Ganda 3', playerA: '', playerB: '', scoreA: 0, scoreB: 0 },
            ],
          }
        : {}),
      ...(sport === 'Futsal Anak'
        ? {
            futsalGoalScorers: [],
          }
        : {}),
    };

    onAddMatch(newMatch);
  };

  return (
    <div className="mb-8 rounded-2xl bg-white/[0.04] border border-cyan-400/30 p-5 sm:p-7 shadow-xl">
      <div className="flex items-start justify-between gap-4 pb-5 mb-6 border-b border-white/10">
        <div>
          <span className="text-xs font-semibold text-cyan-400 tracking-wide">
            Formulir Jadwal Baru
          </span>
          <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mt-0.5">
            Input Jadwal Pertandingan
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Lengkapi cabang olahraga, kontingen RW, waktu, dan gelanggang pertandingan.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup form input jadwal"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mb-6 p-3.5 rounded-xl bg-rose-500/15 border border-rose-400/35 flex items-center gap-2.5 text-xs sm:text-sm text-rose-200"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row 1: Cabang Olahraga, Kategori, Babak/Grup */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="match-sport" className="block text-xs font-semibold text-slate-200 mb-2">
              Cabang Olahraga
            </label>
            <select
              id="match-sport"
              value={sport}
              onChange={(e) => {
                const nextSport = e.target.value as MatchItem['sport'];
                const nextCategories = getCategoryOptionsForSport(nextSport);
                const nextCategory = nextCategories.includes(category)
                  ? category
                  : nextCategories[0];
                setSport(nextSport);
                setCategory(nextCategory);
                const nextUsesRoundRobin = isRoundRobinSport(nextSport, nextCategory);
                const nextRounds = nextUsesRoundRobin ? ROUND_ROBIN_ROUNDS : KNOCKOUT_ROUNDS;
                if (!nextRounds.includes(round)) {
                  setRound(nextRounds[0]);
                }
              }}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input bg-[#0a0f24] text-white border border-white/15 focus:ring-2 focus:ring-cyan-400 cursor-pointer"
            >
              {SPORTS_OPTIONS.map((item) => (
                <option key={item} value={item} className="bg-[#0a0f24] text-white">
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="match-category" className="block text-xs font-semibold text-slate-200 mb-2">
              Kategori Nomor
            </label>
            <select
              id="match-category"
              value={category}
              onChange={(e) => {
                const nextCategory = e.target.value;
                setCategory(nextCategory);
                const nextUsesRoundRobin = isRoundRobinSport(sport, nextCategory);
                const nextRounds = nextUsesRoundRobin ? ROUND_ROBIN_ROUNDS : KNOCKOUT_ROUNDS;
                if (!nextRounds.includes(round)) {
                  setRound(nextRounds[0]);
                }
              }}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input bg-[#0a0f24] text-white border border-white/15 focus:ring-2 focus:ring-cyan-400 cursor-pointer"
            >
              {availableCategories.map((item) => (
                <option key={item} value={item} className="bg-[#0a0f24] text-white">
                  {item}
                </option>
              ))}
            </select>
            {sport === 'Tenis Meja' && (
              <p className="text-[11px] text-cyan-300/90 mt-1.5">
                Khusus kategori Beregu Putra.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="match-round" className="block text-xs font-semibold text-slate-200 mb-2">
              {usesRoundRobin ? 'Sistem / Putaran' : 'Grup / Babak'}
            </label>
            <select
              id="match-round"
              value={round}
              onChange={(e) => setRound(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input bg-[#0a0f24] text-white border border-white/15 focus:ring-2 focus:ring-cyan-400 cursor-pointer"
            >
              {availableRounds.map((item) => (
                <option key={item} value={item} className="bg-[#0a0f24] text-white">
                  {item}
                </option>
              ))}
            </select>
            {usesRoundRobin && (
              <p className="text-[11px] text-amber-300/90 mt-1.5">
                Sistem bertemu penuh (tanpa babak final).
              </p>
            )}
          </div>
        </div>

        {/* Row 2: Kontingen RW A vs Kontingen RW B */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="match-team-a" className="block text-xs font-semibold text-slate-200 mb-2">
              Kontingen Tim A
            </label>
            <div className="flex items-center gap-3">
              <TeamLogoPreview rw={teamARw} />
              <select
                id="match-team-a"
                value={teamARw}
                onChange={(e) => setTeamARw(e.target.value)}
                className="flex-1 px-3.5 py-2.5 text-sm rounded-xl glass-input bg-[#0a0f24] text-white border border-white/15 focus:ring-2 focus:ring-cyan-400 cursor-pointer"
              >
                {RW_KEYS.map((rwKey) => (
                  <option key={rwKey} value={rwKey} className="bg-[#0a0f24] text-white">
                    {rwKey} · {RW_LOGOS[rwKey].name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="match-team-b" className="block text-xs font-semibold text-slate-200 mb-2">
              Kontingen Tim B (Lawan)
            </label>
            <div className="flex items-center gap-3">
              <TeamLogoPreview rw={teamBRw} />
              <select
                id="match-team-b"
                value={teamBRw}
                onChange={(e) => setTeamBRw(e.target.value)}
                className="flex-1 px-3.5 py-2.5 text-sm rounded-xl glass-input bg-[#0a0f24] text-white border border-white/15 focus:ring-2 focus:ring-cyan-400 cursor-pointer"
              >
                {RW_KEYS.map((rwKey) => (
                  <option key={rwKey} value={rwKey} className="bg-[#0a0f24] text-white">
                    {rwKey} · {RW_LOGOS[rwKey].name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Row 3: Tanggal, Jam, Lokasi, Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="match-date" className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 mb-2">
              <CalendarDays className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tanggal</span>
            </label>
            <input
              id="match-date"
              type="date"
              value={dateIso}
              onChange={(e) => setDateIso(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input bg-[#0a0f24] text-white border border-white/15 focus:ring-2 focus:ring-cyan-400 tabular-nums"
              required
            />
            {dateIso && (
              <p className="text-[11px] text-slate-400 mt-1.5">
                {formatIndonesianDate(dateIso)}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="match-time" className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 mb-2">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Jam (WIB)</span>
            </label>
            <input
              id="match-time"
              type="time"
              value={time24}
              onChange={(e) => setTime24(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input bg-[#0a0f24] text-white border border-white/15 focus:ring-2 focus:ring-cyan-400 tabular-nums"
              required
            />
            {time24 && (
              <p className="text-[11px] text-slate-400 mt-1.5 tabular-nums">
                Tampilan: {formatWibTime(time24)}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="match-venue" className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 mb-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Lokasi</span>
            </label>
            <input
              id="match-venue"
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="SOR RW 017"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input bg-[#0a0f24] text-white border border-white/15 placeholder-slate-500 focus:ring-2 focus:ring-cyan-400"
              required
            />
          </div>

          <div>
            <label htmlFor="match-status" className="block text-xs font-semibold text-slate-200 mb-2">
              Status Laga
            </label>
            <select
              id="match-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as MatchItem['status'])}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input bg-[#0a0f24] text-white border border-white/15 focus:ring-2 focus:ring-cyan-400 cursor-pointer"
            >
              <option value="Segera" className="bg-[#0a0f24] text-white">
                Segera
              </option>
              <option value="Sedang Berlangsung" className="bg-[#0a0f24] text-white">
                Sedang Berlangsung
              </option>
              <option value="Selesai" className="bg-[#0a0f24] text-white">
                Selesai
              </option>
            </select>
          </div>
        </div>

        {/* Optional Lineup for Bulu Tangkis Ganda 1, Ganda 2, Ganda 3 */}
        {sport === 'Bulu Tangkis' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-cyan-400/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <p className="text-xs font-bold text-cyan-300">
                Susunan Pasangan Bulu Tangkis (Ganda 1, Ganda 2, dan Ganda 3)
              </p>
              <span className="text-[11px] text-slate-400">
                Opsional · Skor diisi di form Input Hasil
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {badmintonPairs.map((item) => (
                <div
                  key={item.partai}
                  className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2.5"
                >
                  <p className="text-xs font-bold text-white text-center">{item.label}</p>
                  <div>
                    <label
                      htmlFor={`sched-ganda-${item.partai}-a`}
                      className="block text-[11px] text-slate-400 mb-1"
                    >
                      Pasangan {teamARw}
                    </label>
                    <input
                      id={`sched-ganda-${item.partai}-a`}
                      type="text"
                      value={item.pairA || ''}
                      onChange={(e) => handlePairChange(item.partai, 'pairA', e.target.value)}
                      placeholder={`Nama ${item.label} ${teamARw}`}
                      className="w-full px-3 py-2 text-xs rounded-lg glass-input bg-[#0a0f24] text-white border border-white/15 placeholder-slate-500 focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`sched-ganda-${item.partai}-b`}
                      className="block text-[11px] text-slate-400 mb-1"
                    >
                      Pasangan {teamBRw}
                    </label>
                    <input
                      id={`sched-ganda-${item.partai}-b`}
                      type="text"
                      value={item.pairB || ''}
                      onChange={(e) => handlePairChange(item.partai, 'pairB', e.target.value)}
                      placeholder={`Nama ${item.label} ${teamBRw}`}
                      className="w-full px-3 py-2 text-xs rounded-lg glass-input bg-[#0a0f24] text-white border border-white/15 placeholder-slate-500 focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            {sport === 'Bola Voli'
              ? 'Skor Set 1, Set 2, dan Set 3 otomatis disiapkan pada tab Hasil Pertandingan.'
              : sport === 'Bulu Tangkis'
                ? 'Partai Ganda 1, Ganda 2, dan Ganda 3 otomatis disiapkan untuk input skor hasil.'
                : sport === 'Tenis Meja'
                  ? 'Partai Ganda 1, Tunggal 1, Ganda 2, Tunggal 2, dan Ganda 3 otomatis disiapkan pada Input Hasil.'
                  : sport === 'Futsal Anak'
                    ? 'Form pencetak gol dan skor akhir otomatis disiapkan pada Input Hasil.'
                    : 'Jadwal baru akan langsung tampil pada daftar jadwal dan filter tanggal.'}
          </p>
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 text-slate-950 font-bold text-xs shadow-lg hover:shadow-[0_0_24px_rgba(34,211,238,0.35)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Simpan Jadwal</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
