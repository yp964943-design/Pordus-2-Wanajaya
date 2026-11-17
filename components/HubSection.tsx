'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import {
  Search,
  Trophy,
  Clock,
  MapPin,
  Filter,
  Shield,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Award,
  PlusCircle,
  CheckCircle2,
  Trash2,
  ClipboardEdit,
  X,
  LogOut,
  Cloud
} from 'lucide-react';
import { MATCHES_SCHEDULE, INITIAL_STANDINGS, RW_LOGOS, MatchItem, RWStanding } from '@/data/pordusData';
import MatchScheduleForm from '@/components/MatchScheduleForm';
import MatchResultForm, { MatchResultPayload } from '@/components/MatchResultForm';
import {
  removeCustomMatch,
  removeMatchResult,
  saveCustomMatch,
  saveMatchResult,
  useTournamentSync,
} from '@/lib/tournamentSync';

export type HubTab = 'jadwal' | 'hasil' | 'klasemen' | 'bagan';

interface HubSectionProps {
  activeTab?: HubTab;
  onTabChange?: (tab: HubTab) => void;
  onOpenRules?: () => void;
  isAdmin: boolean;
  adminPanel: 'none' | 'jadwal' | 'hasil';
  onAdminPanelChange: (panel: 'none' | 'jadwal' | 'hasil') => void;
  onRequestAdminLogin: (intent?: 'jadwal' | 'hasil') => void;
  onLogoutAdmin: () => void;
}

interface SportStandingRow {
  rw: string;
  name: string;
  logo?: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  ga: number;
  gf: number;
  gd: number;
  points: number;
}

function getMatchSetScores(m: MatchItem): { scoreA: number; scoreB: number } {
  const rawA = m.teamA.score ?? 0;
  const rawB = m.teamB.score ?? 0;
  if (rawA > 0 || rawB > 0) {
    return { scoreA: rawA, scoreB: rawB };
  }
  if (m.sport === 'Bola Voli' && m.sets && m.sets.length > 0) {
    let winsA = 0;
    let winsB = 0;
    m.sets.forEach((s) => {
      if (s.scoreA > s.scoreB) winsA += 1;
      else if (s.scoreB > s.scoreA) winsB += 1;
    });
    return { scoreA: winsA, scoreB: winsB };
  }
  if (m.sport === 'Bulu Tangkis' && m.badmintonDoubles && m.badmintonDoubles.length > 0) {
    let winsA = 0;
    let winsB = 0;
    m.badmintonDoubles.forEach((d) => {
      if (d.scoreA > d.scoreB) winsA += 1;
      else if (d.scoreB > d.scoreA) winsB += 1;
    });
    return { scoreA: winsA, scoreB: winsB };
  }
  if (m.sport === 'Tenis Meja' && m.tableTennisMatches && m.tableTennisMatches.length > 0) {
    let winsA = 0;
    let winsB = 0;
    m.tableTennisMatches.forEach((p) => {
      if (p.scoreA > p.scoreB) winsA += 1;
      else if (p.scoreB > p.scoreA) winsB += 1;
    });
    return { scoreA: winsA, scoreB: winsB };
  }
  return { scoreA: rawA, scoreB: rawB };
}

function buildSportStandings(
  matches: MatchItem[],
  seedAllRwsWhenEmpty = false
): SportStandingRow[] {
  const map = new Map<string, SportStandingRow>();
  const ensureTeam = (team: MatchItem['teamA']) => {
    if (!map.has(team.rw)) {
      map.set(team.rw, {
        rw: team.rw,
        name: team.name || RW_LOGOS[team.rw]?.name || 'Dusun II Wanajaya',
        logo: team.logo || RW_LOGOS[team.rw]?.logo,
        played: 0,
        won: 0,
        draw: 0,
        lost: 0,
        ga: 0,
        gf: 0,
        gd: 0,
        points: 0,
      });
    }
    return map.get(team.rw)!;
  };

  if (matches.length === 0 && seedAllRwsWhenEmpty) {
    INITIAL_STANDINGS.forEach((rwItem) => {
      ensureTeam({
        rw: rwItem.rw,
        name: rwItem.rwName,
        logo: rwItem.logo,
      });
    });
  }

  matches.forEach((m) => {
    const rowA = ensureTeam(m.teamA);
    const rowB = ensureTeam(m.teamB);
    if (m.status !== 'Selesai') return;

    const { scoreA, scoreB } = getMatchSetScores(m);

    rowA.played += 1;
    rowB.played += 1;

    rowA.ga += scoreA;
    rowA.gf += scoreB;
    rowB.ga += scoreB;
    rowB.gf += scoreA;

    if (m.winner === m.teamA.rw) {
      rowA.won += 1;
      rowA.points += 3;
      rowB.lost += 1;
    } else if (m.winner === m.teamB.rw) {
      rowB.won += 1;
      rowB.points += 3;
      rowA.lost += 1;
    } else if (scoreA > scoreB) {
      rowA.won += 1;
      rowA.points += 3;
      rowB.lost += 1;
    } else if (scoreB > scoreA) {
      rowB.won += 1;
      rowB.points += 3;
      rowA.lost += 1;
    } else {
      rowA.draw += 1;
      rowB.draw += 1;
      rowA.points += 1;
      rowB.points += 1;
    }
  });

  const rows = Array.from(map.values()).map((row) => ({
    ...row,
    gd: row.ga - row.gf,
  }));

  return rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.ga - a.ga ||
      b.gd - a.gd ||
      b.won - a.won ||
      a.rw.localeCompare(b.rw)
  );
}

const KNOCKOUT_ONLY_ROUNDS = new Set(['Semi Final', 'Perebutan Juara 3', 'Final']);

function groupMatchesForStandings(
  matches: MatchItem[],
  includeCategory: boolean
): { label: string; rows: SportStandingRow[] }[] {
  const nonKnockout = matches.filter((m) => !KNOCKOUT_ONLY_ROUNDS.has(m.round));
  const source = nonKnockout.length > 0 ? nonKnockout : matches;
  if (source.length === 0) return [];

  const buckets = new Map<string, MatchItem[]>();
  source.forEach((m) => {
    const isGroupRound = m.round.toLowerCase().startsWith('group');
    let label = '';
    if (includeCategory && isGroupRound) {
      label = `${m.category} · ${m.round}`;
    } else if (includeCategory) {
      label = m.category;
    } else if (isGroupRound) {
      label = m.round;
    } else {
      label = 'Klasemen';
    }
    const existing = buckets.get(label) ?? [];
    existing.push(m);
    buckets.set(label, existing);
  });

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, groupMatches]) => ({
      label,
      rows: buildSportStandings(groupMatches),
    }));
}

function StandingsTable({
  rows,
  showDraw = false,
  accent = 'cyan',
}: {
  rows: SportStandingRow[];
  showDraw?: boolean;
  accent?: 'cyan' | 'emerald';
}) {
  const pointTextClass = accent === 'emerald' ? 'text-emerald-300' : 'text-cyan-300';
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[460px] text-left text-xs text-slate-300">
        <thead className="bg-white/5 text-[11px] uppercase text-slate-400 border-b border-white/10">
          <tr>
            <th className="px-2 sm:px-2.5 py-2.5 text-center font-semibold w-8 sm:w-9">#</th>
            <th className="px-2.5 sm:px-3 py-2.5 font-semibold">Tim RW</th>
            <th className="px-1.5 sm:px-2 py-2.5 text-center font-semibold">P</th>
            <th className="px-1.5 sm:px-2 py-2.5 text-center font-semibold">W</th>
            {showDraw && <th className="px-1.5 sm:px-2 py-2.5 text-center font-semibold">D</th>}
            <th className="px-1.5 sm:px-2 py-2.5 text-center font-semibold">L</th>
            <th className="px-1.5 sm:px-2 py-2.5 text-center font-semibold">GA</th>
            <th className="px-1.5 sm:px-2 py-2.5 text-center font-semibold">GF</th>
            <th className="px-1.5 sm:px-2 py-2.5 text-center font-semibold">GD</th>
            <th className={`px-2.5 sm:px-3 py-2.5 text-right font-semibold ${pointTextClass}`}>Poin</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 tabular-nums">
          {rows.map((row, idx) => (
            <tr key={row.rw} className="hover:bg-white/[0.03]">
              <td className="px-2.5 py-2.5 text-center font-bold text-slate-400">
                {idx + 1}
              </td>
              <td className="px-3 py-2.5 font-semibold text-white whitespace-nowrap">
                <div className="flex items-center gap-2">
                  {row.logo && (
                    <div className="w-5 h-5 rounded bg-white p-0.5 border border-white/20 shrink-0 overflow-hidden">
                      <RwLogoImage
                        src={row.logo}
                        alt={`Logo ${row.rw}`}
                        size={20}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <span>{row.rw}</span>
                  <span className="text-slate-400 font-normal hidden sm:inline">· {row.name}</span>
                </div>
              </td>
              <td className="px-2 py-2.5 text-center">{row.played}</td>
              <td className="px-2 py-2.5 text-center text-emerald-300 font-semibold">{row.won}</td>
              {showDraw && <td className="px-2 py-2.5 text-center">{row.draw}</td>}
              <td className="px-2 py-2.5 text-center">{row.lost}</td>
              <td className="px-2 py-2.5 text-center text-slate-200">{row.ga}</td>
              <td className="px-2 py-2.5 text-center text-slate-200">{row.gf}</td>
              <td
                className={`px-2 py-2.5 text-center font-semibold ${
                  row.gd > 0
                    ? 'text-emerald-300'
                    : row.gd < 0
                      ? 'text-rose-300'
                      : 'text-slate-400'
                }`}
              >
                {row.gd > 0 ? `+${row.gd}` : row.gd}
              </td>
              <td className={`px-3 py-2.5 text-right font-bold ${pointTextClass}`}>
                {row.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RwLogoImage({
  src,
  alt,
  size = 80,
  className = 'w-full h-full object-contain rounded-xl',
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  if (src.endsWith('.svg')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        className={className}
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      referrerPolicy="no-referrer"
    />
  );
}

export default function HubSection({
  activeTab: controlledTab,
  onTabChange,
  isAdmin,
  adminPanel,
  onAdminPanelChange,
  onRequestAdminLogin,
  onLogoutAdmin,
}: HubSectionProps) {
  const [internalTab, setInternalTab] = useState<HubTab>('jadwal');
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = (tab: HubTab) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  const [sportFilter, setSportFilter] = useState<string>('Semua');
  const [klasemenFilter, setKlasemenFilter] = useState<string>('Semua');
  const [dateFilter, setDateFilter] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDatePage, setCurrentDatePage] = useState<number>(1);
  const [standings] = useState<RWStanding[]>(INITIAL_STANDINGS);
  const [selectedMatchForResult, setSelectedMatchForResult] = useState<string | undefined>(undefined);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const isFormOpen = isAdmin && adminPanel === 'jadwal';
  const isResultFormOpen = isAdmin && adminPanel === 'hasil';

  const { customMatches, resultOverrides } = useTournamentSync();

  const allMatches = useMemo<MatchItem[]>(() => {
    return [...MATCHES_SCHEDULE, ...customMatches].map((match) => {
      const override = resultOverrides[match.id];
      const teamAInfo = RW_LOGOS[match.teamA.rw];
      const teamBInfo = RW_LOGOS[match.teamB.rw];
      const baseTeamA = {
        ...match.teamA,
        name: teamAInfo?.name || match.teamA.name,
        logo: teamAInfo?.logo || match.teamA.logo,
      };
      const baseTeamB = {
        ...match.teamB,
        name: teamBInfo?.name || match.teamB.name,
        logo: teamBInfo?.logo || match.teamB.logo,
      };
      if (!override) {
        return {
          ...match,
          teamA: baseTeamA,
          teamB: baseTeamB,
        };
      }
      return {
        ...match,
        status: override.status,
        winner: override.winner,
        teamA: { ...baseTeamA, score: override.scoreA },
        teamB: { ...baseTeamB, score: override.scoreB },
        sets: override.sets ?? match.sets,
        badmintonDoubles: override.badmintonDoubles ?? match.badmintonDoubles,
        tableTennisMatches: override.tableTennisMatches ?? match.tableTennisMatches,
        futsalGoalScorers: override.futsalGoalScorers ?? match.futsalGoalScorers,
      };
    });
  }, [customMatches, resultOverrides]);

  const handleAddMatch = async (newMatch: MatchItem) => {
    if (!isAdmin) {
      onRequestAdminLogin('jadwal');
      return;
    }
    const result = await saveCustomMatch(newMatch);
    const nextDates = Array.from(new Set([...allMatches, newMatch].map((m) => m.date)));
    const targetPage = Math.max(1, nextDates.indexOf(newMatch.date) + 1);
    setSportFilter('Semua');
    setDateFilter('Semua');
    setSearchQuery('');
    setCurrentDatePage(targetPage);
    setActiveTab('jadwal');
    onAdminPanelChange('none');
    const baseText = `Jadwal ${newMatch.sport} (${newMatch.teamA.rw} vs ${newMatch.teamB.rw}) pada ${newMatch.date} pukul ${newMatch.time} berhasil ditambahkan.`;
    setSuccessMessage(
      result.syncedToCloud
        ? `${baseText} Tersinkronisasi ke semua device.`
        : `${baseText} Gagal menyinkronkan ke server — periksa koneksi internet Anda.`
    );
  };

  const handleDeleteCustomMatch = async (matchId: string) => {
    if (!isAdmin) {
      onRequestAdminLogin('jadwal');
      return;
    }
    const res = await removeCustomMatch(matchId);
    if (!res.syncedToCloud) {
      setSuccessMessage('Gagal menghapus jadwal dari server. Periksa koneksi internet Anda.');
    }
  };

  const handleSaveResult = async (matchId: string, result: MatchResultPayload) => {
    if (!isAdmin) {
      onRequestAdminLogin('hasil');
      return;
    }
    const writeRes = await saveMatchResult(matchId, result);
    const targetMatch = allMatches.find((m) => m.id === matchId);
    setActiveTab('hasil');
    onAdminPanelChange('none');
    setSelectedMatchForResult(undefined);
    const baseText = targetMatch
      ? `Hasil ${targetMatch.sport} (${targetMatch.teamA.rw} ${result.scoreA} - ${result.scoreB} ${targetMatch.teamB.rw}) berhasil disimpan.`
      : 'Hasil pertandingan berhasil disimpan.';
    setSuccessMessage(
      writeRes.syncedToCloud
        ? `${baseText} Tersinkronisasi ke semua device.`
        : `${baseText} Gagal menyinkronkan ke server — periksa koneksi internet Anda.`
    );
  };

  const handleResetResult = async (matchId: string) => {
    if (!isAdmin) {
      onRequestAdminLogin('hasil');
      return;
    }
    const writeRes = await removeMatchResult(matchId);
    onAdminPanelChange('none');
    setSelectedMatchForResult(undefined);
    setSuccessMessage(
      writeRes.syncedToCloud
        ? 'Skor pertandingan dikembalikan ke kondisi awal di semua device.'
        : 'Gagal mereset skor di server — periksa koneksi internet Anda.'
    );
  };

  const openResultFormForMatch = (matchId?: string) => {
    if (!isAdmin) {
      onRequestAdminLogin('hasil');
      return;
    }
    setSelectedMatchForResult(matchId);
    onAdminPanelChange('hasil');
    setActiveTab('hasil');
    const el = document.getElementById('hub-content-view');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const uniqueDates = Array.from(new Set(allMatches.map((m) => m.date)));

  const filteredMatches = allMatches.filter((match) => {
    const matchesSport = sportFilter === 'Semua' || match.sport === sportFilter;
    const matchesDate = dateFilter === 'Semua' || match.date === dateFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      match.teamA.rw.toLowerCase().includes(query) ||
      match.teamB.rw.toLowerCase().includes(query) ||
      (match.teamA.name?.toLowerCase().includes(query) ?? false) ||
      (match.teamB.name?.toLowerCase().includes(query) ?? false) ||
      match.round.toLowerCase().includes(query) ||
      match.sport.toLowerCase().includes(query) ||
      match.category.toLowerCase().includes(query) ||
      match.venue.toLowerCase().includes(query);
    return matchesSport && matchesDate && matchesSearch;
  });

  const dateGroups = useMemo(() => {
    const map = new Map<string, MatchItem[]>();
    filteredMatches.forEach((match) => {
      const list = map.get(match.date);
      if (list) {
        list.push(match);
      } else {
        map.set(match.date, [match]);
      }
    });
    return Array.from(map.entries());
  }, [filteredMatches]);

  const totalDatePages = dateGroups.length;
  const safeDatePage =
    totalDatePages > 0 ? Math.min(Math.max(1, currentDatePage), totalDatePages) : 1;
  const activeDateGroup = totalDatePages > 0 ? dateGroups[safeDatePage - 1] : null;

  // Show 1 date per page when paginated
  const groupedMatches: Record<string, MatchItem[]> = activeDateGroup
    ? { [activeDateGroup[0]]: activeDateGroup[1] }
    : {};

  const handlePageChange = (page: number) => {
    const next = Math.min(Math.max(1, page), Math.max(1, totalDatePages));
    setCurrentDatePage(next);
    const el = document.getElementById('hub-content-view');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section id="jadwal" className="py-10 md:py-12 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold tracking-widest text-cyan-400 uppercase">
            Pusat Informasi Turnamen
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
            Jadwal, Hasil, & Peraturan
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-cyan-400 to-emerald-400 mx-auto mt-4 rounded-full" />
          <p className="mt-4 text-sm sm:text-base text-slate-300">
            Akses cepat jadwal pertandingan, papan skor hasil laga, klasemen medali RW, dan buku pedoman peraturan teknis.
          </p>
        </div>

        {/* Interactive Hub Content Area with Tabs */}
        <div id="hub-content-view" className="glass-card rounded-3xl border border-white/15 p-4 sm:p-6 md:p-8">
          
          {/* Segmented Control Filter Tabs */}
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 border-b border-white/10 pb-5 sm:pb-6 mb-6 sm:mb-8">
            <div className="grid grid-cols-2 sm:flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/5 border border-white/10 w-full xl:w-auto">
              <button
                onClick={() => setActiveTab('jadwal')}
                className={`min-h-[44px] px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'jadwal'
                    ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 shadow-md font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                Jadwal Pertandingan
              </button>
              <button
                onClick={() => setActiveTab('hasil')}
                className={`min-h-[44px] px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'hasil'
                    ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 shadow-md font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                Hasil Pertandingan
              </button>
              <button
                onClick={() => setActiveTab('klasemen')}
                className={`min-h-[44px] px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'klasemen'
                    ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 shadow-md font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                Klasemen
              </button>
              <button
                onClick={() => setActiveTab('bagan')}
                className={`min-h-[44px] px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'bagan'
                    ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 shadow-md font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                Bagan Turnamen
              </button>
            </div>

            {/* Search Input & Admin-only Input Jadwal / Input Hasil Buttons */}
            {(activeTab === 'jadwal' || activeTab === 'hasil') && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full xl:w-auto">
                <div className={`relative w-full ${isAdmin ? 'sm:w-52' : 'sm:w-64'}`}>
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari RW, cabang, atau grup..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentDatePage(1);
                    }}
                    className="w-full min-h-[44px] pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl glass-input text-slate-100 placeholder-slate-400 transition-all"
                  />
                </div>
                {isAdmin && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (activeTab !== 'jadwal') setActiveTab('jadwal');
                        onAdminPanelChange(isFormOpen ? 'none' : 'jadwal');
                      }}
                      className={`flex-1 sm:flex-none min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                        isFormOpen
                          ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40'
                          : activeTab === 'jadwal'
                            ? 'bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 text-slate-950 shadow-md hover:shadow-[0_0_20px_rgba(34,211,238,0.35)] active:scale-95'
                            : 'bg-white/10 hover:bg-white/15 text-slate-100 border border-white/15'
                      }`}
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>{isFormOpen ? 'Tutup Form' : 'Input Jadwal'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeTab !== 'hasil') setActiveTab('hasil');
                        const firstMatchForFilter =
                          sportFilter !== 'Semua'
                            ? allMatches.find((m) => m.sport === sportFilter)?.id
                            : undefined;
                        setSelectedMatchForResult(firstMatchForFilter);
                        onAdminPanelChange(isResultFormOpen ? 'none' : 'hasil');
                      }}
                      className={`flex-1 sm:flex-none min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                        isResultFormOpen
                          ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                          : activeTab === 'hasil'
                            ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 shadow-md hover:shadow-[0_0_20px_rgba(52,211,153,0.35)] active:scale-95'
                            : 'bg-white/10 hover:bg-white/15 text-slate-100 border border-white/15'
                      }`}
                    >
                      <ClipboardEdit className="w-4 h-4" />
                      <span>{isResultFormOpen ? 'Tutup Form' : 'Input Hasil'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={onLogoutAdmin}
                      title="Keluar dari akun admin"
                      className="min-h-[44px] px-3 py-2.5 rounded-xl bg-white/5 hover:bg-rose-500/15 border border-white/15 hover:border-rose-400/35 text-xs font-semibold text-slate-300 hover:text-rose-200 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* TAB 1 & TAB 2: JADWAL PERTANDINGAN / HASIL PERTANDINGAN */}
          {(activeTab === 'jadwal' || activeTab === 'hasil') && (
            <div>
              {/* Admin Mode + Real-Time Sync Banner */}
              {isAdmin && (
                <div className="mb-5 px-4 py-3 rounded-2xl border bg-cyan-500/10 border-cyan-400/25 text-cyan-200 flex items-start sm:items-center gap-2 text-xs">
                  <Cloud className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5 sm:mt-0" />
                  <span>
                    Mode Admin Aktif — setiap input jadwal & hasil langsung tersinkronisasi real-time ke semua device.
                  </span>
                </div>
              )}

              {/* Success Feedback Banner */}
              {successMessage && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/35 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <p className="text-xs sm:text-sm font-medium text-emerald-100">
                      {successMessage}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSuccessMessage('')}
                    aria-label="Tutup notifikasi"
                    className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-white/10 text-emerald-200 transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Collapsible Match Schedule Input Form (Admin Only) */}
              <AnimatePresence initial={false}>
                {isFormOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <MatchScheduleForm
                      onAddMatch={handleAddMatch}
                      onClose={() => onAdminPanelChange('none')}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Collapsible Match Result Input Form (Admin Only) */}
              <AnimatePresence initial={false}>
                {isResultFormOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <MatchResultForm
                      key={selectedMatchForResult || 'default'}
                      matches={allMatches}
                      initialMatchId={selectedMatchForResult}
                      onSaveResult={handleSaveResult}
                      onResetResult={handleResetResult}
                      hasOverride={(id) => Boolean(resultOverrides[id])}
                      onClose={() => {
                        onAdminPanelChange('none');
                        setSelectedMatchForResult(undefined);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Filters Row: Cabor Horizontal Scroll on Mobile + Tanggal Dropdown */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4 mb-6 sm:mb-8">
                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 sm:pb-0 flex-nowrap sm:flex-wrap">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5 mr-1 shrink-0">
                    <Filter className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Cabor:</span>
                  </span>
                  {['Semua', 'Bola Voli', 'Bulu Tangkis', 'Tenis Meja', 'Futsal Anak'].map((sport) => (
                    <button
                      key={sport}
                      onClick={() => {
                        setSportFilter(sport);
                        setCurrentDatePage(1);
                      }}
                      className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        sportFilter === sport
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      {sport}
                    </button>
                  ))}
                </div>

                {/* Date Dropdown Filter */}
                <div className="flex items-center gap-2.5 w-full md:w-auto">
                  <label htmlFor="date-filter-select" className="text-xs text-slate-400 flex items-center gap-1.5 whitespace-nowrap shrink-0">
                    <CalendarDays className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tanggal:</span>
                  </label>
                  <div className="relative flex-1 md:w-64">
                    <select
                      id="date-filter-select"
                      value={dateFilter}
                      onChange={(e) => {
                        setDateFilter(e.target.value);
                        setCurrentDatePage(1);
                      }}
                      className="w-full min-h-[44px] appearance-none pl-4 pr-10 py-2 text-xs sm:text-sm font-medium rounded-xl glass-input bg-[#0a0f24] text-slate-100 border border-white/15 focus:ring-2 focus:ring-cyan-400 cursor-pointer"
                    >
                      <option value="Semua" className="bg-[#0a0f24] text-white">
                        Semua Tanggal
                      </option>
                      {uniqueDates.map((d) => (
                        <option key={d} value={d} className="bg-[#0a0f24] text-white">
                          {d}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Notice Banner when viewing Hasil Pertandingan */}
              {activeTab === 'hasil' && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-white">
                        Papan Skor & Hasil Pertandingan Resmi
                      </p>
                      <p className="text-xs text-slate-300">
                        Skor akhir dan pemenang diperbarui langsung setelah pertandingan di SOR RW 017 selesai.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('klasemen')}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-emerald-300 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                  >
                    Lihat Klasemen
                  </button>
                </div>
              )}

              {/* Grouped Matches List */}
              {Object.keys(groupedMatches).length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  Tidak ada jadwal pertandingan yang cocok dengan filter tersebut.
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(groupedMatches).map(([dateHeading, matches]) => (
                    <div key={dateHeading}>
                      <div className="flex items-center gap-3 mb-4 pb-2 border-b border-white/10">
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shrink-0">
                          <CalendarDays className="w-4 h-4" />
                        </div>
                        <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                          {dateHeading}
                        </h3>
                        <span className="text-xs text-slate-400 ml-auto">
                          {matches.length} Pertandingan
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                        {matches.map((match) => (
                          <div
                            key={match.id}
                            className="p-4 sm:p-6 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/15 transition-all duration-200 flex flex-col justify-between"
                          >
                            <div className="flex items-center justify-between text-xs mb-3.5 sm:mb-4 pb-2.5 sm:pb-3 border-b border-white/10 gap-2">
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <span className="font-bold text-cyan-300">{match.sport}</span>
                                <span className="text-slate-500">·</span>
                                <span className="text-slate-200 font-semibold">{match.category}</span>
                                <span className="text-slate-500">·</span>
                                <span className="text-amber-300 font-bold">{match.round}</span>
                              </div>
                              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap shrink-0 ${
                                    match.status === 'Selesai'
                                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                      : 'bg-cyan-500/15 text-cyan-200 border-cyan-400/30'
                                  }`}
                                >
                                  {activeTab === 'hasil' && match.status === 'Segera' ? 'Belum Dimulai' : match.status}
                                </span>
                                {isAdmin && match.isCustom && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCustomMatch(match.id)}
                                    aria-label={`Hapus jadwal ${match.teamA.rw} vs ${match.teamB.rw}`}
                                    title="Hapus jadwal tambahan"
                                    className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-lg bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-400/40 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Teams with RW Logos and Score / VS */}
                            <div className="flex items-stretch justify-between gap-2 sm:gap-4 my-1.5 sm:my-2">
                              {/* Team A */}
                              <div className={`flex-1 text-center p-2.5 sm:p-4 rounded-2xl bg-white/[0.04] border flex flex-col items-center justify-center ${match.winner === match.teamA.rw ? 'border-amber-400/40 bg-amber-500/10' : 'border-white/10'}`}>
                                {match.teamA.logo ? (
                                  <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden bg-white p-1 border-2 border-white/25 shadow-lg mb-2 sm:mb-3 flex items-center justify-center">
                                    <RwLogoImage
                                      src={match.teamA.logo}
                                      alt={`Logo ${match.teamA.rw}`}
                                      size={80}
                                    />
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-white/5 border border-white/15 mb-2 sm:mb-3 flex items-center justify-center">
                                    <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
                                  </div>
                                )}
                                <p className="text-base sm:text-xl font-black text-white tracking-tight">{match.teamA.rw}</p>
                                <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                                  {match.teamA.name || 'Dusun II Wanajaya'}
                                </p>
                              </div>

                              {/* Center VS / Scoreboard */}
                              <div className="px-1 sm:px-2 flex flex-col items-center justify-center shrink-0">
                                {match.status === 'Selesai' || match.status === 'Sedang Berlangsung' ? (
                                  <div className="text-center">
                                    <div className="text-lg sm:text-2xl font-black text-white tabular-nums tracking-wider">
                                      <span className={match.winner === match.teamA.rw ? 'text-amber-400' : ''}>
                                        {match.teamA.score ?? 0}
                                      </span>
                                      <span className="mx-1 sm:mx-1.5 text-slate-500">-</span>
                                      <span className={match.winner === match.teamB.rw ? 'text-amber-400' : ''}>
                                        {match.teamB.score ?? 0}
                                      </span>
                                    </div>
                                    {match.status === 'Sedang Berlangsung' && (
                                      <span className="text-[10px] text-cyan-300 block mt-0.5">Berlangsung</span>
                                    )}
                                  </div>
                                ) : activeTab === 'hasil' ? (
                                  <div className="text-center">
                                    <div className="text-base sm:text-xl font-black text-slate-300 tabular-nums tracking-wider">
                                      0 <span className="text-slate-500">-</span> 0
                                    </div>
                                    <span className="text-[10px] text-slate-400 block mt-0.5">Sementara</span>
                                  </div>
                                ) : (
                                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-400/30 flex items-center justify-center text-xs sm:text-sm font-black text-cyan-300 tracking-wider uppercase shadow-inner">
                                    VS
                                  </div>
                                )}
                              </div>

                              {/* Team B */}
                              <div className={`flex-1 text-center p-2.5 sm:p-4 rounded-2xl bg-white/[0.04] border flex flex-col items-center justify-center ${match.winner === match.teamB.rw ? 'border-amber-400/40 bg-amber-500/10' : 'border-white/10'}`}>
                                {match.teamB.logo ? (
                                  <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden bg-white p-1 border-2 border-white/25 shadow-lg mb-2 sm:mb-3 flex items-center justify-center">
                                    <RwLogoImage
                                      src={match.teamB.logo}
                                      alt={`Logo ${match.teamB.rw}`}
                                      size={80}
                                    />
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-white/5 border border-white/15 mb-2 sm:mb-3 flex items-center justify-center">
                                    <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />
                                  </div>
                                )}
                                <p className="text-base sm:text-xl font-black text-white tracking-tight">{match.teamB.rw}</p>
                                <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                                  {match.teamB.name || 'Dusun II Wanajaya'}
                                </p>
                              </div>
                            </div>

                            {/* Set 1, Set 2, Set 3 Breakdown for Bola Voli in Hasil Pertandingan */}
                            {activeTab === 'hasil' && match.sets && match.sets.length > 0 && (
                              <div className="grid grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-white/10">
                                {match.sets.map((s) => (
                                  <div
                                    key={s.set}
                                    className="rounded-xl bg-white/[0.04] border border-white/10 py-2 px-3 text-center"
                                  >
                                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                                      Set {s.set}
                                    </span>
                                    <span className="block text-sm font-black text-white tabular-nums mt-0.5">
                                      {s.scoreA} - {s.scoreB}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Ganda 1, Ganda 2, Ganda 3 Breakdown for Bulu Tangkis */}
                            {match.sport === 'Bulu Tangkis' &&
                              match.badmintonDoubles &&
                              match.badmintonDoubles.length > 0 &&
                              (activeTab === 'hasil' ||
                                match.badmintonDoubles.some(
                                  (d) => Boolean(d.pairA?.trim() || d.pairB?.trim())
                                )) && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-white/10">
                                  {match.badmintonDoubles.map((d) => (
                                    <div
                                      key={d.partai}
                                      className="rounded-xl bg-white/[0.04] border border-white/10 py-2 px-3 text-center"
                                    >
                                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                                        {d.label}
                                      </span>
                                      {activeTab === 'hasil' && (
                                        <span className="block text-sm font-black text-white tabular-nums mt-0.5">
                                          {d.scoreA} - {d.scoreB}
                                        </span>
                                      )}
                                      {(d.pairA?.trim() || d.pairB?.trim()) && (
                                        <span className="block text-[10px] text-slate-300 mt-1 truncate">
                                          {d.pairA?.trim() || match.teamA.rw} vs{' '}
                                          {d.pairB?.trim() || match.teamB.rw}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                            {/* Ganda 1, Tunggal 1, Ganda 2, Tunggal 2, Ganda 3 Breakdown for Tenis Meja */}
                            {match.sport === 'Tenis Meja' &&
                              match.tableTennisMatches &&
                              match.tableTennisMatches.length > 0 &&
                              activeTab === 'hasil' && (
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3 pt-3 border-t border-white/10">
                                  {match.tableTennisMatches.map((p) => (
                                    <div
                                      key={p.partai}
                                      className="rounded-xl bg-white/[0.04] border border-white/10 py-2 px-2.5 text-center"
                                    >
                                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                                        {p.label}
                                      </span>
                                      <span className="block text-sm font-black text-white tabular-nums mt-0.5">
                                        {p.scoreA} - {p.scoreB}
                                      </span>
                                      {(p.playerA?.trim() || p.playerB?.trim()) && (
                                        <span className="block text-[10px] text-slate-300 mt-1 truncate">
                                          {p.playerA?.trim() || match.teamA.rw} vs{' '}
                                          {p.playerB?.trim() || match.teamB.rw}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                            {/* Goal Scorers List for Futsal Anak */}
                            {match.sport === 'Futsal Anak' &&
                              match.futsalGoalScorers &&
                              match.futsalGoalScorers.length > 0 &&
                              activeTab === 'hasil' && (
                                <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                                    Pencetak Gol
                                  </span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                    <div className="rounded-xl bg-white/[0.03] border border-white/10 p-2.5">
                                      <p className="font-bold text-white mb-1">{match.teamA.rw}</p>
                                      {match.futsalGoalScorers.filter((g) => g.team === 'A').length === 0 ? (
                                        <p className="text-slate-500">Belum ada gol</p>
                                      ) : (
                                        <ul className="space-y-0.5 text-slate-300">
                                          {match.futsalGoalScorers
                                            .filter((g) => g.team === 'A')
                                            .map((g) => (
                                              <li key={g.id}>
                                                {g.playerName} ({g.goals} gol{g.minute ? ` · ${g.minute}` : ''})
                                              </li>
                                            ))}
                                        </ul>
                                      )}
                                    </div>
                                    <div className="rounded-xl bg-white/[0.03] border border-white/10 p-2.5">
                                      <p className="font-bold text-white mb-1">{match.teamB.rw}</p>
                                      {match.futsalGoalScorers.filter((g) => g.team === 'B').length === 0 ? (
                                        <p className="text-slate-500">Belum ada gol</p>
                                      ) : (
                                        <ul className="space-y-0.5 text-slate-300">
                                          {match.futsalGoalScorers
                                            .filter((g) => g.team === 'B')
                                            .map((g) => (
                                              <li key={g.id}>
                                                {g.playerName} ({g.goals} gol{g.minute ? ` · ${g.minute}` : ''})
                                              </li>
                                            ))}
                                        </ul>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                            {/* Meta Footer (Time only, no date next to time + Quick Input Skor in Hasil tab) */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t border-white/10 text-xs text-slate-300">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                  <span className="font-semibold text-white">{match.time}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  <span className="font-semibold text-emerald-300">{match.venue}</span>
                                </div>
                              </div>
                              {activeTab === 'hasil' && isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => openResultFormForMatch(match.id)}
                                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-xs font-semibold text-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                                >
                                  <ClipboardEdit className="w-3.5 h-3.5" />
                                  <span>{match.status === 'Segera' ? 'Input Skor' : 'Edit Skor'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {totalDatePages > 1 && (
                    <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5">
                      <p className="text-xs text-slate-400 tabular-nums">
                        <span className="font-semibold text-slate-200">{safeDatePage}/{totalDatePages}</span>
                        {activeDateGroup && (
                          <>
                            {' · '}
                            <span className="text-cyan-300 font-medium">
                              {activeDateGroup[0].replace(/^[^,]+,\s*/, '')}
                            </span>
                          </>
                        )}
                      </p>
                      <nav
                        aria-label="Pagination jadwal per tanggal"
                        className="flex flex-wrap items-center gap-1"
                      >
                        <button
                          type="button"
                          onClick={() => handlePageChange(safeDatePage - 1)}
                          disabled={safeDatePage <= 1}
                          aria-label="Tanggal sebelumnya"
                          title="Tanggal sebelumnya"
                          className="min-h-[40px] min-w-[40px] px-2 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-slate-200 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        {dateGroups.map(([dateLabel], idx) => {
                          const pageNum = idx + 1;
                          const isCurrent = pageNum === safeDatePage;
                          return (
                            <button
                              key={dateLabel}
                              type="button"
                              onClick={() => handlePageChange(pageNum)}
                              aria-current={isCurrent ? 'page' : undefined}
                              aria-label={`Halaman ${pageNum}: ${dateLabel}`}
                              title={dateLabel}
                              className={`min-h-[40px] min-w-[36px] px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer tabular-nums ${
                                isCurrent
                                  ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 shadow-sm'
                                  : 'bg-white/5 hover:bg-white/15 text-slate-300 border border-white/10'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}

                        <button
                          type="button"
                          onClick={() => handlePageChange(safeDatePage + 1)}
                          disabled={safeDatePage >= totalDatePages}
                          aria-label="Tanggal berikutnya"
                          title="Tanggal berikutnya"
                          className="min-h-[40px] min-w-[40px] px-2 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-slate-200 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </nav>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* TAB 3: KLASEMEN CABOR & MEDALI RW */}
          {activeTab === 'klasemen' && (() => {
            const voliPutraMatches = allMatches.filter(
              (m) => m.sport === 'Bola Voli' && m.category === 'Putra'
            );
            const voliPutriMatches = allMatches.filter(
              (m) => m.sport === 'Bola Voli' && m.category === 'Putri'
            );
            const badmintonMatches = allMatches.filter((m) => m.sport === 'Bulu Tangkis');
            const tenisMejaMatches = allMatches.filter((m) => m.sport === 'Tenis Meja');
            const futsalAnakMatches = allMatches.filter((m) => m.sport === 'Futsal Anak');

            const voliPutraGroups = groupMatchesForStandings(voliPutraMatches, false);
            const badmintonGroups = groupMatchesForStandings(badmintonMatches, true);
            const tenisMejaGroups =
              tenisMejaMatches.length > 0
                ? groupMatchesForStandings(tenisMejaMatches, false)
                : [
                    {
                      label: 'Beregu Putra',
                      rows: buildSportStandings([], true),
                    },
                  ];
            const voliPutriRows = buildSportStandings(voliPutriMatches);
            const futsalRows =
              futsalAnakMatches.length > 0
                ? buildSportStandings(futsalAnakMatches)
                : buildSportStandings([], true);

            const klasemenFilterOptions = [
              'Semua',
              'Voli Putra',
              'Bulu Tangkis',
              'Tenis Meja',
              'Voli Putri',
              'Futsal Anak',
            ];

            const showSport = (key: string) =>
              klasemenFilter === 'Semua' || klasemenFilter === key;

            return (
              <div className="space-y-10">
                {/* Klasemen Cabang Olahraga */}
                <div className="space-y-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-bold text-white">
                        Klasemen Cabang Olahraga
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Klasemen otomatis diperbarui saat hasil pertandingan diinput (Menang 3 poin, Seri 1 poin, Kalah 0 poin).
                      </p>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1.5 sm:pb-0 flex-nowrap sm:flex-wrap">
                      {klasemenFilterOptions.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setKlasemenFilter(opt)}
                          className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                            klasemenFilter === opt
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                              : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Bola Voli Putra */}
                    {showSport('Voli Putra') && (
                      <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="text-sm sm:text-base font-bold text-cyan-300">
                            Klasemen Bola Voli Putra
                          </h5>
                          <span className="text-[11px] text-slate-400 font-semibold">
                            Fase Grup · Rally Point
                          </span>
                        </div>
                        {voliPutraGroups.length > 0 ? (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {voliPutraGroups.map((group) => (
                              <div key={group.label} className="space-y-2.5">
                                <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                                  {group.label}
                                </p>
                                <StandingsTable rows={group.rows} accent="cyan" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <StandingsTable rows={buildSportStandings([], true)} accent="cyan" />
                        )}
                      </div>
                    )}

                    {/* Bulu Tangkis */}
                    {showSport('Bulu Tangkis') && (
                      <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="text-sm sm:text-base font-bold text-cyan-300">
                            Klasemen Bulu Tangkis
                          </h5>
                          <span className="text-[11px] text-slate-400 font-semibold">
                            Beregu 3 Ganda · Rally 42 Poin
                          </span>
                        </div>
                        {badmintonGroups.length > 0 ? (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {badmintonGroups.map((group) => (
                              <div key={group.label} className="space-y-2.5">
                                <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                                  {group.label}
                                </p>
                                <StandingsTable rows={group.rows} accent="cyan" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <StandingsTable rows={buildSportStandings([], true)} accent="cyan" />
                        )}
                      </div>
                    )}

                    {/* Tenis Meja */}
                    {showSport('Tenis Meja') && (
                      <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="text-sm sm:text-base font-bold text-emerald-300">
                            Klasemen Tenis Meja
                          </h5>
                          <span className="text-[11px] text-slate-400 font-semibold">
                            Beregu Putra · 5 Partai
                          </span>
                        </div>
                        <div className={tenisMejaGroups.length > 1 ? 'grid grid-cols-1 lg:grid-cols-2 gap-5' : 'space-y-3'}>
                          {tenisMejaGroups.map((group) => (
                            <div key={group.label} className="space-y-2.5">
                              {tenisMejaGroups.length > 1 && (
                                <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                                  {group.label}
                                </p>
                              )}
                              <StandingsTable rows={group.rows} accent="emerald" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bola Voli Putri & Futsal Anak */}
                    {(showSport('Voli Putri') || showSport('Futsal Anak')) && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {showSport('Voli Putri') && (
                          <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4">
                            <div className="flex items-center justify-between gap-2">
                              <h5 className="text-sm sm:text-base font-bold text-cyan-300">
                                Klasemen Bola Voli Putri
                              </h5>
                              <span className="text-[11px] text-amber-300 font-semibold">
                                Sistem Bertemu
                              </span>
                            </div>
                            <StandingsTable rows={voliPutriRows} accent="cyan" />
                          </div>
                        )}

                        {showSport('Futsal Anak') && (
                          <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4">
                            <div className="flex items-center justify-between gap-2">
                              <h5 className="text-sm sm:text-base font-bold text-emerald-300">
                                Klasemen Futsal Anak
                              </h5>
                              <span className="text-[11px] text-amber-300 font-semibold">
                                Sistem Bertemu
                              </span>
                            </div>
                            <StandingsTable rows={futsalRows} showDraw accent="emerald" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Klasemen Medali RW */}
                <div className="pt-8 border-t border-white/10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div>
                      <h4 className="text-lg font-bold text-white">
                        Klasemen Resmi Perolehan Medali Antar RW
                      </h4>
                      <p className="text-xs text-slate-400">
                        Sistem poin: Emas (5 poin), Perak (3 poin), Perunggu (1 poin)
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-cyan-300">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>Kontingen Dusun II Wanajaya</span>
                    </div>
                  </div>

                  {/* Table Container */}
                  <div className="overflow-x-auto rounded-2xl border border-white/10">
                    <table className="w-full min-w-[540px] text-left text-sm text-slate-300">
                      <thead className="text-xs uppercase bg-white/5 text-slate-300 border-b border-white/10">
                        <tr>
                          <th className="px-3 sm:px-4 py-3.5 text-center font-bold">Peringkat</th>
                          <th className="px-3 sm:px-5 py-3.5 font-bold">Kontingen RW</th>
                          <th className="px-3 sm:px-4 py-3.5 text-center font-bold text-amber-300">🥇 Emas</th>
                          <th className="px-3 sm:px-4 py-3.5 text-center font-bold text-slate-300">🥈 Perak</th>
                          <th className="px-3 sm:px-4 py-3.5 text-center font-bold text-amber-600">🥉 Perunggu</th>
                          <th className="px-3 sm:px-5 py-3.5 text-right font-bold text-cyan-400">Total Poin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-xs sm:text-sm">
                        {standings.map((rw, index) => (
                          <tr
                            key={rw.rw}
                            className={`hover:bg-white/5 transition-colors ${
                              index === 0 ? 'bg-amber-500/[0.07]' : index === 1 ? 'bg-slate-400/[0.04]' : index === 2 ? 'bg-amber-700/[0.04]' : ''
                            }`}
                          >
                            <td className="px-4 py-3.5 text-center font-bold tabular-nums">
                              {index === 0 ? (
                                <span className="w-7 h-7 mx-auto rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center font-extrabold text-xs">
                                  1
                                </span>
                              ) : index === 1 ? (
                                <span className="w-7 h-7 mx-auto rounded-full bg-slate-400/20 text-slate-200 border border-slate-400/40 flex items-center justify-center font-extrabold text-xs">
                                  2
                                </span>
                              ) : index === 2 ? (
                                <span className="w-7 h-7 mx-auto rounded-full bg-amber-700/20 text-amber-500 border border-amber-700/40 flex items-center justify-center font-extrabold text-xs">
                                  3
                                </span>
                              ) : (
                                <span className="text-slate-400">{index + 1}</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 font-semibold text-white">
                              <div className="flex items-center gap-3">
                                {rw.logo ? (
                                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-white p-0.5 border border-white/20 shrink-0">
                                    <RwLogoImage
                                      src={rw.logo}
                                      alt={`Logo ${rw.rw}`}
                                      size={36}
                                      className="w-full h-full object-contain rounded"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                    <Shield className="w-4 h-4 text-slate-400" />
                                  </div>
                                )}
                                <div>
                                  <span>{rw.rw}</span>
                                  <span className="text-xs text-slate-400 font-normal ml-2">({rw.rwName})</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-center font-bold text-amber-300 tabular-nums">
                              {rw.gold}
                            </td>
                            <td className="px-4 py-3.5 text-center font-medium text-slate-200 tabular-nums">
                              {rw.silver}
                            </td>
                            <td className="px-4 py-3.5 text-center font-medium text-amber-500 tabular-nums">
                              {rw.bronze}
                            </td>
                            <td className="px-5 py-3.5 text-right font-black text-cyan-400 tabular-nums text-base">
                              {rw.points}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 4: BAGAN TURNAMEN */}
          {activeTab === 'bagan' && (() => {
            const voliPutriMatches = allMatches.filter(
              (m) => m.sport === 'Bola Voli' && m.category === 'Putri'
            );
            const futsalAnakMatches = allMatches.filter((m) => m.sport === 'Futsal Anak');
            const voliPutriStandings = buildSportStandings(voliPutriMatches);
            const futsalStandings = buildSportStandings(futsalAnakMatches);

            return (
              <div className="space-y-10">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-bold text-white">
                      Bagan Fase Grup & Menuju Final
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Berlaku untuk Bola Voli Putra, Bulu Tangkis, dan Tenis Meja Beregu Putra di SOR RW 017.
                    </p>
                  </div>

                  {/* Bracket Visualization */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative items-center">
                    {/* Fase Grup */}
                    <div className="space-y-4">
                      <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
                        Fase Grup (15 & 21 Nov 2026)
                      </div>
                      
                      <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5">
                        <div className="text-[11px] font-bold text-amber-300 uppercase">Bola Voli Putra · Group A · 15.30 WIB</div>
                        <div className="flex items-center justify-between text-xs font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-white p-0.5 overflow-hidden shrink-0">
                              <RwLogoImage src={RW_LOGOS['RW 013'].logo} alt="RW 013" size={24} className="w-full h-full object-contain" />
                            </div>
                            <span>RW 013 (Vila Mutiara Jaya)</span>
                          </div>
                          <span className="text-slate-400">-</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-white p-0.5 overflow-hidden shrink-0">
                              <RwLogoImage src={RW_LOGOS['RW 016'].logo} alt="RW 016" size={24} className="w-full h-full object-contain" />
                            </div>
                            <span>RW 016 (Pesona Gading Cibitung)</span>
                          </div>
                          <span className="text-slate-400">-</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5">
                        <div className="text-[11px] font-bold text-amber-300 uppercase">Bola Voli Putra · Group B · 16.30 WIB</div>
                        <div className="flex items-center justify-between text-xs font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-white p-0.5 overflow-hidden shrink-0">
                              <RwLogoImage src={RW_LOGOS['RW 015'].logo} alt="RW 015" size={24} className="w-full h-full object-contain" />
                            </div>
                            <span>RW 015 (Pesona Gading Cibitung)</span>
                          </div>
                          <span className="text-slate-400">-</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-white p-0.5 overflow-hidden shrink-0">
                              <RwLogoImage src={RW_LOGOS['RW 017'].logo} alt="RW 017" size={24} className="w-full h-full object-contain" />
                            </div>
                            <span>RW 017 (Pesona Gading Cibitung)</span>
                          </div>
                          <span className="text-slate-400">-</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5">
                        <div className="text-[11px] font-bold text-cyan-300 uppercase">Bulu Tangkis · 21 Nov 2026 · 20.00–21.00 WIB</div>
                        <div className="flex items-center justify-between text-xs font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-white p-0.5 overflow-hidden shrink-0">
                              <RwLogoImage src={RW_LOGOS['RW 022'].logo} alt="RW 022" size={24} className="w-full h-full object-contain" />
                            </div>
                            <span>RW 016 vs RW 022 (Putri A)</span>
                          </div>
                          <span className="text-slate-400">-</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-white p-0.5 overflow-hidden shrink-0">
                              <RwLogoImage src={RW_LOGOS['RW 025'].logo} alt="RW 025" size={24} className="w-full h-full object-contain" />
                            </div>
                            <span>RW 016 vs RW 025 (Putra B)</span>
                          </div>
                          <span className="text-slate-400">-</span>
                        </div>
                      </div>
                    </div>

                    {/* Semifinals */}
                    <div className="space-y-4">
                      <div className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-2">
                        Semi Final
                      </div>
                      
                      <div className="p-4 rounded-2xl bg-white/[0.06] border border-cyan-500/20 space-y-2.5">
                        <div className="flex justify-between text-xs font-bold text-slate-200">
                          <span>Juara Group A</span>
                          <span className="text-cyan-400">TBD</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Runner-up Group B</span>
                          <span>TBD</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/[0.06] border border-cyan-500/20 space-y-2.5">
                        <div className="flex justify-between text-xs font-bold text-slate-200">
                          <span>Juara Group B</span>
                          <span className="text-cyan-400">TBD</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Runner-up Group A</span>
                          <span>TBD</span>
                        </div>
                      </div>
                    </div>

                    {/* Grand Final */}
                    <div className="space-y-4">
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                        Partai Final
                      </div>
                      
                      <div className="p-5 rounded-2xl bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-400/30 space-y-4 shadow-xl">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                          <Trophy className="w-4 h-4 text-amber-400" />
                          <span>Perebutan Juara 1 & Piala Bergilir</span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm font-bold text-slate-200">
                            <span>Pemenang Semi Final 1</span>
                            <span className="tabular-nums text-amber-300">-</span>
                          </div>
                          <div className="flex justify-between text-sm font-semibold text-slate-300">
                            <span>Pemenang Semi Final 2</span>
                            <span className="tabular-nums text-amber-300">-</span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-white/10 text-[11px] text-slate-400">
                          Venue: SOR RW 017 · Dusun II Wanajaya Cibitung
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sistem Bertemu Penuh (Tanpa Babak Final) */}
                <div className="pt-8 border-t border-white/10 space-y-6">
                  <div>
                    <h4 className="text-lg font-bold text-white">
                      Sistem Bertemu Penuh (Tanpa Babak Final)
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Bola Voli Putri dan Futsal Anak (U-12) tidak mempertandingkan babak final — peringkat juara ditentukan langsung dari klasemen poin akhir.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Bola Voli Putri */}
                    <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <h5 className="text-sm font-bold text-cyan-300">
                          Bola Voli Putri · Klasemen Bertemu
                        </h5>
                        <span className="text-[11px] text-amber-300 font-semibold">Tanpa Final</span>
                      </div>

                      {voliPutriStandings.length > 0 ? (
                        <StandingsTable rows={voliPutriStandings} accent="cyan" />
                      ) : (
                        <p className="text-xs text-slate-400">
                          Belum ada jadwal pertandingan Bola Voli Putri yang tercatat.
                        </p>
                      )}
                    </div>

                    {/* Futsal Anak */}
                    <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <h5 className="text-sm font-bold text-emerald-300">
                          Futsal Anak (U-12) · Klasemen Bertemu
                        </h5>
                        <span className="text-[11px] text-amber-300 font-semibold">Tanpa Final</span>
                      </div>

                      {futsalStandings.length > 0 ? (
                        <StandingsTable rows={futsalStandings} showDraw accent="emerald" />
                      ) : (
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-slate-300 leading-relaxed">
                          Belum ada jadwal Futsal Anak yang ditambahkan. Admin dapat menambahkan jadwal pertandingan sistem bertemu melalui menu <span className="text-cyan-300 font-semibold">Input Jadwal</span>.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>

      </div>
    </section>
  );
}
