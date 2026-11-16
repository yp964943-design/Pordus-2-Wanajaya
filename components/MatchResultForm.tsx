'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Shield,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  X,
  PlusCircle,
  Trash2,
} from 'lucide-react';
import {
  BadmintonDoublePartai,
  FutsalGoalScorer,
  MatchItem,
  TableTennisPartai,
} from '@/data/pordusData';

export interface MatchResultPayload {
  status: MatchItem['status'];
  scoreA: number;
  scoreB: number;
  winner?: string;
  sets?: { set: number; scoreA: number; scoreB: number }[];
  badmintonDoubles?: BadmintonDoublePartai[];
  tableTennisMatches?: TableTennisPartai[];
  futsalGoalScorers?: FutsalGoalScorer[];
}

interface MatchResultFormProps {
  matches: MatchItem[];
  initialMatchId?: string;
  onSaveResult: (matchId: string, result: MatchResultPayload) => void;
  onResetResult?: (matchId: string) => void;
  hasOverride?: (matchId: string) => boolean;
  onClose: () => void;
}

function TeamLogoBox({ logo, rw }: { logo?: string; rw: string }) {
  if (!logo) {
    return (
      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/15 flex items-center justify-center shrink-0">
        <Shield className="w-6 h-6 text-cyan-400" />
      </div>
    );
  }
  return (
    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white p-0.5 border border-white/25 shrink-0 flex items-center justify-center">
      {logo.endsWith('.svg') ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt={`Logo ${rw}`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain rounded-lg"
        />
      ) : (
        <Image
          src={logo}
          alt={`Logo ${rw}`}
          width={48}
          height={48}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain rounded-lg"
        />
      )}
    </div>
  );
}

const DEFAULT_SETS = [
  { set: 1, scoreA: 0, scoreB: 0 },
  { set: 2, scoreA: 0, scoreB: 0 },
  { set: 3, scoreA: 0, scoreB: 0 },
];

const DEFAULT_BADMINTON_DOUBLES: BadmintonDoublePartai[] = [
  { partai: 1, label: 'Ganda 1', pairA: '', pairB: '', scoreA: 0, scoreB: 0 },
  { partai: 2, label: 'Ganda 2', pairA: '', pairB: '', scoreA: 0, scoreB: 0 },
  { partai: 3, label: 'Ganda 3', pairA: '', pairB: '', scoreA: 0, scoreB: 0 },
];

const DEFAULT_TABLE_TENNIS_MATCHES: TableTennisPartai[] = [
  { partai: 1, label: 'Ganda 1', playerA: '', playerB: '', scoreA: 0, scoreB: 0 },
  { partai: 2, label: 'Tunggal 1', playerA: '', playerB: '', scoreA: 0, scoreB: 0 },
  { partai: 3, label: 'Ganda 2', playerA: '', playerB: '', scoreA: 0, scoreB: 0 },
  { partai: 4, label: 'Tunggal 2', playerA: '', playerB: '', scoreA: 0, scoreB: 0 },
  { partai: 5, label: 'Ganda 3', playerA: '', playerB: '', scoreA: 0, scoreB: 0 },
];

export default function MatchResultForm({
  matches,
  initialMatchId,
  onSaveResult,
  onResetResult,
  hasOverride,
  onClose,
}: MatchResultFormProps) {
  const startingMatch =
    matches.find((m) => m.id === initialMatchId) || matches[0];

  const [selectedMatchId, setSelectedMatchId] = useState<string>(
    startingMatch?.id || ''
  );
  const [status, setStatus] = useState<MatchItem['status']>(
    startingMatch?.status === 'Segera' ? 'Selesai' : startingMatch?.status || 'Selesai'
  );
  const [scoreA, setScoreA] = useState<string>(
    String(startingMatch?.teamA.score ?? 0)
  );
  const [scoreB, setScoreB] = useState<string>(
    String(startingMatch?.teamB.score ?? 0)
  );
  const [sets, setSets] = useState<{ set: number; scoreA: number; scoreB: number }[]>(
    startingMatch?.sets && startingMatch.sets.length > 0
      ? startingMatch.sets.map((s) => ({ ...s }))
      : DEFAULT_SETS.map((s) => ({ ...s }))
  );
  const [badmintonDoubles, setBadmintonDoubles] = useState<BadmintonDoublePartai[]>(
    startingMatch?.badmintonDoubles && startingMatch.badmintonDoubles.length > 0
      ? startingMatch.badmintonDoubles.map((d) => ({ ...d }))
      : DEFAULT_BADMINTON_DOUBLES.map((d) => ({ ...d }))
  );
  const [tableTennisMatches, setTableTennisMatches] = useState<TableTennisPartai[]>(
    startingMatch?.tableTennisMatches && startingMatch.tableTennisMatches.length > 0
      ? startingMatch.tableTennisMatches.map((p) => ({ ...p }))
      : DEFAULT_TABLE_TENNIS_MATCHES.map((p) => ({ ...p }))
  );
  const [futsalGoalScorers, setFutsalGoalScorers] = useState<FutsalGoalScorer[]>(
    startingMatch?.futsalGoalScorers && startingMatch.futsalGoalScorers.length > 0
      ? startingMatch.futsalGoalScorers.map((g) => ({ ...g }))
      : []
  );
  const [winnerMode, setWinnerMode] = useState<'auto' | 'teamA' | 'teamB' | 'draw'>(() => {
    if (!startingMatch?.winner) return 'auto';
    if (startingMatch.winner === startingMatch.teamA.rw) return 'teamA';
    if (startingMatch.winner === startingMatch.teamB.rw) return 'teamB';
    return 'auto';
  });
  const [errorMessage, setErrorMessage] = useState<string>('');

  const selectedMatch = matches.find((m) => m.id === selectedMatchId) || startingMatch;
  const isVolleyball = selectedMatch?.sport === 'Bola Voli';
  const isBadminton = selectedMatch?.sport === 'Bulu Tangkis';
  const isTableTennis = selectedMatch?.sport === 'Tenis Meja';
  const isFutsal = selectedMatch?.sport === 'Futsal Anak';

  const handleSelectMatch = (nextId: string) => {
    setSelectedMatchId(nextId);
    setErrorMessage('');
    const nextMatch = matches.find((m) => m.id === nextId);
    if (!nextMatch) return;
    setStatus(nextMatch.status === 'Segera' ? 'Selesai' : nextMatch.status);
    setScoreA(String(nextMatch.teamA.score ?? 0));
    setScoreB(String(nextMatch.teamB.score ?? 0));
    setSets(
      nextMatch.sets && nextMatch.sets.length > 0
        ? nextMatch.sets.map((s) => ({ ...s }))
        : DEFAULT_SETS.map((s) => ({ ...s }))
    );
    setBadmintonDoubles(
      nextMatch.badmintonDoubles && nextMatch.badmintonDoubles.length > 0
        ? nextMatch.badmintonDoubles.map((d) => ({ ...d }))
        : DEFAULT_BADMINTON_DOUBLES.map((d) => ({ ...d }))
    );
    setTableTennisMatches(
      nextMatch.tableTennisMatches && nextMatch.tableTennisMatches.length > 0
        ? nextMatch.tableTennisMatches.map((p) => ({ ...p }))
        : DEFAULT_TABLE_TENNIS_MATCHES.map((p) => ({ ...p }))
    );
    setFutsalGoalScorers(
      nextMatch.futsalGoalScorers && nextMatch.futsalGoalScorers.length > 0
        ? nextMatch.futsalGoalScorers.map((g) => ({ ...g }))
        : []
    );
    if (nextMatch.winner === nextMatch.teamA.rw) setWinnerMode('teamA');
    else if (nextMatch.winner === nextMatch.teamB.rw) setWinnerMode('teamB');
    else setWinnerMode('auto');
  };

  const handleSetScoreChange = (
    setNumber: number,
    side: 'scoreA' | 'scoreB',
    rawValue: string
  ) => {
    const numeric = Math.max(0, Number.parseInt(rawValue || '0', 10) || 0);
    const updatedSets = sets.map((s) =>
      s.set === setNumber ? { ...s, [side]: numeric } : s
    );
    setSets(updatedSets);

    // Automatically tally set wins into total match score when sets have non-zero scores
    let winsA = 0;
    let winsB = 0;
    updatedSets.forEach((s) => {
      if (s.scoreA > s.scoreB) winsA += 1;
      else if (s.scoreB > s.scoreA) winsB += 1;
    });
    if (winsA > 0 || winsB > 0) {
      setScoreA(String(winsA));
      setScoreB(String(winsB));
    }
  };

  const handleBadmintonScoreChange = (
    partaiNumber: number,
    side: 'scoreA' | 'scoreB',
    rawValue: string
  ) => {
    const numeric = Math.max(0, Math.min(42, Number.parseInt(rawValue || '0', 10) || 0));
    const updatedDoubles = badmintonDoubles.map((d) =>
      d.partai === partaiNumber ? { ...d, [side]: numeric } : d
    );
    setBadmintonDoubles(updatedDoubles);

    let winsA = 0;
    let winsB = 0;
    updatedDoubles.forEach((d) => {
      if (d.scoreA > d.scoreB) winsA += 1;
      else if (d.scoreB > d.scoreA) winsB += 1;
    });
    setScoreA(String(winsA));
    setScoreB(String(winsB));
  };

  const handleBadmintonPairChange = (
    partaiNumber: number,
    side: 'pairA' | 'pairB',
    value: string
  ) => {
    setBadmintonDoubles((prev) =>
      prev.map((d) => (d.partai === partaiNumber ? { ...d, [side]: value } : d))
    );
  };

  const handleTableTennisScoreChange = (
    partaiNumber: number,
    side: 'scoreA' | 'scoreB',
    rawValue: string
  ) => {
    const numeric = Math.max(0, Number.parseInt(rawValue || '0', 10) || 0);
    const updatedMatches = tableTennisMatches.map((p) =>
      p.partai === partaiNumber ? { ...p, [side]: numeric } : p
    );
    setTableTennisMatches(updatedMatches);

    let winsA = 0;
    let winsB = 0;
    updatedMatches.forEach((p) => {
      if (p.scoreA > p.scoreB) winsA += 1;
      else if (p.scoreB > p.scoreA) winsB += 1;
    });
    setScoreA(String(winsA));
    setScoreB(String(winsB));
  };

  const handleTableTennisPlayerChange = (
    partaiNumber: number,
    side: 'playerA' | 'playerB',
    value: string
  ) => {
    setTableTennisMatches((prev) =>
      prev.map((p) => (p.partai === partaiNumber ? { ...p, [side]: value } : p))
    );
  };

  const syncFutsalTotalsFromScorers = (nextScorers: FutsalGoalScorer[]) => {
    if (nextScorers.length === 0) return;
    let totalA = 0;
    let totalB = 0;
    nextScorers.forEach((g) => {
      const count = Math.max(0, g.goals || 0);
      if (g.team === 'A') totalA += count;
      else totalB += count;
    });
    setScoreA(String(totalA));
    setScoreB(String(totalB));
  };

  const handleAddGoalScorer = () => {
    const nextScorers: FutsalGoalScorer[] = [
      ...futsalGoalScorers,
      {
        id: `scorer-${Date.now()}-${futsalGoalScorers.length + 1}`,
        team: 'A',
        playerName: '',
        goals: 1,
        minute: '',
      },
    ];
    setFutsalGoalScorers(nextScorers);
    syncFutsalTotalsFromScorers(nextScorers);
  };

  const handleUpdateGoalScorer = (
    id: string,
    patch: Partial<FutsalGoalScorer>
  ) => {
    const nextScorers = futsalGoalScorers.map((g) =>
      g.id === id ? { ...g, ...patch } : g
    );
    setFutsalGoalScorers(nextScorers);
    syncFutsalTotalsFromScorers(nextScorers);
  };

  const handleRemoveGoalScorer = (id: string) => {
    const nextScorers = futsalGoalScorers.filter((g) => g.id !== id);
    setFutsalGoalScorers(nextScorers);
    if (nextScorers.length > 0) {
      syncFutsalTotalsFromScorers(nextScorers);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedMatch) {
      setErrorMessage('Pilih pertandingan terlebih dahulu.');
      return;
    }

    const parsedA = Number.parseInt(scoreA, 10);
    const parsedB = Number.parseInt(scoreB, 10);

    if (Number.isNaN(parsedA) || Number.isNaN(parsedB) || parsedA < 0 || parsedB < 0) {
      setErrorMessage('Skor pertandingan harus berupa angka 0 atau lebih.');
      return;
    }

    if (isFutsal && futsalGoalScorers.some((g) => !g.playerName.trim())) {
      setErrorMessage('Isi nama pemain pada setiap baris pencetak gol atau hapus baris yang kosong.');
      return;
    }

    let resolvedWinner: string | undefined;
    if (winnerMode === 'teamA') {
      resolvedWinner = selectedMatch.teamA.rw;
    } else if (winnerMode === 'teamB') {
      resolvedWinner = selectedMatch.teamB.rw;
    } else if (winnerMode === 'draw') {
      resolvedWinner = undefined;
    } else if (status === 'Selesai') {
      if (parsedA > parsedB) resolvedWinner = selectedMatch.teamA.rw;
      else if (parsedB > parsedA) resolvedWinner = selectedMatch.teamB.rw;
    }

    onSaveResult(selectedMatch.id, {
      status,
      scoreA: parsedA,
      scoreB: parsedB,
      winner: resolvedWinner,
      ...(isVolleyball ? { sets } : {}),
      ...(isBadminton
        ? {
            badmintonDoubles: badmintonDoubles.map((d) => ({
              ...d,
              pairA: d.pairA?.trim() || '',
              pairB: d.pairB?.trim() || '',
            })),
          }
        : {}),
      ...(isTableTennis
        ? {
            tableTennisMatches: tableTennisMatches.map((p) => ({
              ...p,
              playerA: p.playerA?.trim() || '',
              playerB: p.playerB?.trim() || '',
            })),
          }
        : {}),
      ...(isFutsal
        ? {
            futsalGoalScorers: futsalGoalScorers.map((g) => ({
              ...g,
              playerName: g.playerName.trim(),
              goals: Math.max(1, g.goals || 1),
              minute: g.minute?.trim() || '',
            })),
          }
        : {}),
    });
  };

  if (!selectedMatch) {
    return null;
  }

  return (
    <div className="mb-8 rounded-2xl bg-white/[0.04] border border-emerald-400/30 p-5 sm:p-7 shadow-xl">
      <div className="flex items-start justify-between gap-4 pb-5 mb-6 border-b border-white/10">
        <div>
          <span className="text-xs font-semibold text-emerald-400 tracking-wide">
            Pembaruan Papan Skor Resmi
          </span>
          <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mt-0.5">
            Input Hasil Pertandingan
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Pilih laga dari jadwal lalu masukkan skor akhir beserta rincian Ganda 1–3 (Bulu Tangkis), 5 partai Tenis Meja, Set 1–3 (Bola Voli), atau pencetak gol (Futsal Anak).
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup form input hasil"
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
        {/* Match Selector + Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <label htmlFor="result-match-select" className="block text-xs font-semibold text-slate-200 mb-2">
              Pilih Pertandingan
            </label>
            <select
              id="result-match-select"
              value={selectedMatch.id}
              onChange={(e) => handleSelectMatch(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input bg-[#0a0f24] text-white border border-white/15 focus:ring-2 focus:ring-emerald-400 cursor-pointer"
            >
              {matches.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#0a0f24] text-white">
                  {m.sport} ({m.category}) · {m.round} — {m.teamA.rw} vs {m.teamB.rw} ({m.date}, {m.time})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="result-status-select" className="block text-xs font-semibold text-slate-200 mb-2">
              Status Pertandingan
            </label>
            <select
              id="result-status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as MatchItem['status'])}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input bg-[#0a0f24] text-white border border-white/15 focus:ring-2 focus:ring-emerald-400 cursor-pointer"
            >
              <option value="Selesai" className="bg-[#0a0f24] text-white">
                Selesai
              </option>
              <option value="Sedang Berlangsung" className="bg-[#0a0f24] text-white">
                Sedang Berlangsung
              </option>
              <option value="Segera" className="bg-[#0a0f24] text-white">
                Segera (Belum Dimulai)
              </option>
            </select>
          </div>
        </div>

        {/* Main Scoreboard Input */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
            {/* Team A */}
            <div className="flex items-center gap-3 w-full md:flex-1">
              <TeamLogoBox logo={selectedMatch.teamA.logo} rw={selectedMatch.teamA.rw} />
              <div className="min-w-0 flex-1">
                <p className="text-sm sm:text-base font-black text-white truncate">
                  {selectedMatch.teamA.rw}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {selectedMatch.teamA.name || 'Dusun II Wanajaya'}
                </p>
              </div>
              <div className="w-24 shrink-0">
                <label htmlFor="result-score-a" className="block text-[11px] font-medium text-slate-400 mb-1 text-center">
                  {isVolleyball
                    ? 'Set Menang'
                    : isBadminton || isTableTennis
                      ? 'Partai Menang'
                      : isFutsal
                        ? 'Gol Tim A'
                        : 'Skor Tim A'}
                </label>
                <input
                  id="result-score-a"
                  type="number"
                  min={0}
                  value={scoreA}
                  onChange={(e) => setScoreA(e.target.value)}
                  className="w-full px-3 py-2 text-center text-lg font-black rounded-xl glass-input bg-[#0a0f24] text-white border border-white/15 focus:ring-2 focus:ring-emerald-400 tabular-nums"
                  required
                />
              </div>
            </div>

            <span className="text-sm font-black text-slate-500 uppercase tracking-widest shrink-0">
              VS
            </span>

            {/* Team B */}
            <div className="flex items-center gap-3 w-full md:flex-1 md:flex-row-reverse">
              <TeamLogoBox logo={selectedMatch.teamB.logo} rw={selectedMatch.teamB.rw} />
              <div className="min-w-0 flex-1 md:text-right">
                <p className="text-sm sm:text-base font-black text-white truncate">
                  {selectedMatch.teamB.rw}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {selectedMatch.teamB.name || 'Dusun II Wanajaya'}
                </p>
              </div>
              <div className="w-24 shrink-0">
                <label htmlFor="result-score-b" className="block text-[11px] font-medium text-slate-400 mb-1 text-center">
                  {isVolleyball
                    ? 'Set Menang'
                    : isBadminton || isTableTennis
                      ? 'Partai Menang'
                      : isFutsal
                        ? 'Gol Tim B'
                        : 'Skor Tim B'}
                </label>
                <input
                  id="result-score-b"
                  type="number"
                  min={0}
                  value={scoreB}
                  onChange={(e) => setScoreB(e.target.value)}
                  className="w-full px-3 py-2 text-center text-lg font-black rounded-xl glass-input bg-[#0a0f24] text-white border border-white/15 focus:ring-2 focus:ring-emerald-400 tabular-nums"
                  required
                />
              </div>
            </div>
          </div>

          {/* Bulu Tangkis Ganda 1, Ganda 2, Ganda 3 Inputs */}
          {isBadminton && (
            <div className="mt-5 pt-5 border-t border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
                <p className="text-xs font-semibold text-cyan-300">
                  Input Bulu Tangkis: Ganda 1, Ganda 2, dan Ganda 3
                </p>
                <span className="text-[11px] text-slate-400">
                  Rally Point 42 Poin · Skor partai menang terhitung otomatis
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {badmintonDoubles.map((d) => {
                  const winnerText =
                    d.scoreA > d.scoreB
                      ? selectedMatch.teamA.rw
                      : d.scoreB > d.scoreA
                        ? selectedMatch.teamB.rw
                        : null;
                  return (
                    <div
                      key={d.partai}
                      className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-white">{d.label}</p>
                        {winnerText && (
                          <span className="text-[10px] font-semibold text-amber-300">
                            Unggul: {winnerText}
                          </span>
                        )}
                      </div>

                      {/* Optional Pair Names */}
                      <div className="space-y-2">
                        <div>
                          <label
                            htmlFor={`badminton-${d.partai}-pair-a`}
                            className="block text-[10px] text-slate-400 mb-1"
                          >
                            Pasangan {selectedMatch.teamA.rw} (Opsional)
                          </label>
                          <input
                            id={`badminton-${d.partai}-pair-a`}
                            type="text"
                            value={d.pairA || ''}
                            onChange={(e) =>
                              handleBadmintonPairChange(d.partai, 'pairA', e.target.value)
                            }
                            placeholder={`Nama ${d.label} ${selectedMatch.teamA.rw}`}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg glass-input bg-[#0a0f24] text-white border border-white/15 placeholder-slate-500 focus:ring-2 focus:ring-cyan-400"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`badminton-${d.partai}-pair-b`}
                            className="block text-[10px] text-slate-400 mb-1"
                          >
                            Pasangan {selectedMatch.teamB.rw} (Opsional)
                          </label>
                          <input
                            id={`badminton-${d.partai}-pair-b`}
                            type="text"
                            value={d.pairB || ''}
                            onChange={(e) =>
                              handleBadmintonPairChange(d.partai, 'pairB', e.target.value)
                            }
                            placeholder={`Nama ${d.label} ${selectedMatch.teamB.rw}`}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg glass-input bg-[#0a0f24] text-white border border-white/15 placeholder-slate-500 focus:ring-2 focus:ring-cyan-400"
                          />
                        </div>
                      </div>

                      {/* Score Inputs */}
                      <div className="pt-2 border-t border-white/10">
                        <p className="text-[10px] text-slate-400 text-center mb-1.5">
                          Skor {d.label} ({selectedMatch.teamA.rw} vs {selectedMatch.teamB.rw})
                        </p>
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={42}
                            aria-label={`Skor ${d.label} ${selectedMatch.teamA.rw}`}
                            value={d.scoreA}
                            onChange={(e) =>
                              handleBadmintonScoreChange(d.partai, 'scoreA', e.target.value)
                            }
                            className="w-16 px-2 py-1.5 text-center text-sm font-bold rounded-lg glass-input bg-[#0a0f24] text-white border border-white/15 focus:ring-2 focus:ring-cyan-400 tabular-nums"
                          />
                          <span className="text-slate-500 font-bold">-</span>
                          <input
                            type="number"
                            min={0}
                            max={42}
                            aria-label={`Skor ${d.label} ${selectedMatch.teamB.rw}`}
                            value={d.scoreB}
                            onChange={(e) =>
                              handleBadmintonScoreChange(d.partai, 'scoreB', e.target.value)
                            }
                            className="w-16 px-2 py-1.5 text-center text-sm font-bold rounded-lg glass-input bg-[#0a0f24] text-white border border-white/15 focus:ring-2 focus:ring-cyan-400 tabular-nums"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Volleyball Set 1, Set 2, Set 3 Breakdown Inputs */}
          {isVolleyball && (
            <div className="mt-5 pt-5 border-t border-white/10">
              <p className="text-xs font-semibold text-cyan-300 mb-3">
                Rincian Skor Per Set (Bola Voli)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {sets.map((s) => (
                  <div
                    key={s.set}
                    className="p-3 rounded-xl bg-white/[0.03] border border-white/10"
                  >
                    <p className="text-xs font-bold text-slate-200 mb-2 text-center">
                      Set {s.set}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="number"
                        min={0}
                        aria-label={`Skor Set ${s.set} ${selectedMatch.teamA.rw}`}
                        value={s.scoreA}
                        onChange={(e) =>
                          handleSetScoreChange(s.set, 'scoreA', e.target.value)
                        }
                        className="w-16 px-2 py-1.5 text-center text-sm font-bold rounded-lg glass-input bg-[#0a0f24] text-white border border-white/15 focus:ring-2 focus:ring-cyan-400 tabular-nums"
                      />
                      <span className="text-slate-500 font-bold">-</span>
                      <input
                        type="number"
                        min={0}
                        aria-label={`Skor Set ${s.set} ${selectedMatch.teamB.rw}`}
                        value={s.scoreB}
                        onChange={(e) =>
                          handleSetScoreChange(s.set, 'scoreB', e.target.value)
                        }
                        className="w-16 px-2 py-1.5 text-center text-sm font-bold rounded-lg glass-input bg-[#0a0f24] text-white border border-white/15 focus:ring-2 focus:ring-cyan-400 tabular-nums"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tenis Meja: Ganda 1, Tunggal 1, Ganda 2, Tunggal 2, Ganda 3 */}
          {isTableTennis && (
            <div className="mt-5 pt-5 border-t border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
                <p className="text-xs font-semibold text-cyan-300">
                  Input Hasil Tenis Meja: Ganda 1, Tunggal 1, Ganda 2, Tunggal 2, dan Ganda 3
                </p>
                <span className="text-[11px] text-slate-400">
                  Beregu Putra · Partai menang terhitung otomatis
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {tableTennisMatches.map((p) => {
                  const winnerText =
                    p.scoreA > p.scoreB
                      ? selectedMatch.teamA.rw
                      : p.scoreB > p.scoreA
                        ? selectedMatch.teamB.rw
                        : null;
                  const isSingle = p.label.startsWith('Tunggal');
                  return (
                    <div
                      key={p.partai}
                      className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-white">
                          Partai {p.partai} · {p.label}
                        </p>
                        {winnerText && (
                          <span className="text-[10px] font-semibold text-amber-300">
                            Unggul: {winnerText}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label
                            htmlFor={`tt-${p.partai}-player-a`}
                            className="block text-[10px] text-slate-400 mb-1"
                          >
                            {isSingle ? 'Pemain' : 'Pasangan'} {selectedMatch.teamA.rw} (Opsional)
                          </label>
                          <input
                            id={`tt-${p.partai}-player-a`}
                            type="text"
                            value={p.playerA || ''}
                            onChange={(e) =>
                              handleTableTennisPlayerChange(p.partai, 'playerA', e.target.value)
                            }
                            placeholder={`Nama ${p.label} ${selectedMatch.teamA.rw}`}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg glass-input bg-[#0a0f24] text-white border border-white/15 placeholder-slate-500 focus:ring-2 focus:ring-cyan-400"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`tt-${p.partai}-player-b`}
                            className="block text-[10px] text-slate-400 mb-1"
                          >
                            {isSingle ? 'Pemain' : 'Pasangan'} {selectedMatch.teamB.rw} (Opsional)
                          </label>
                          <input
                            id={`tt-${p.partai}-player-b`}
                            type="text"
                            value={p.playerB || ''}
                            onChange={(e) =>
                              handleTableTennisPlayerChange(p.partai, 'playerB', e.target.value)
                            }
                            placeholder={`Nama ${p.label} ${selectedMatch.teamB.rw}`}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg glass-input bg-[#0a0f24] text-white border border-white/15 placeholder-slate-500 focus:ring-2 focus:ring-cyan-400"
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/10">
                        <p className="text-[10px] text-slate-400 text-center mb-1.5">
                          Skor Gim {p.label} ({selectedMatch.teamA.rw} vs {selectedMatch.teamB.rw})
                        </p>
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number"
                            min={0}
                            aria-label={`Skor ${p.label} ${selectedMatch.teamA.rw}`}
                            value={p.scoreA}
                            onChange={(e) =>
                              handleTableTennisScoreChange(p.partai, 'scoreA', e.target.value)
                            }
                            className="w-16 px-2 py-1.5 text-center text-sm font-bold rounded-lg glass-input bg-[#0a0f24] text-white border border-white/15 focus:ring-2 focus:ring-cyan-400 tabular-nums"
                          />
                          <span className="text-slate-500 font-bold">-</span>
                          <input
                            type="number"
                            min={0}
                            aria-label={`Skor ${p.label} ${selectedMatch.teamB.rw}`}
                            value={p.scoreB}
                            onChange={(e) =>
                              handleTableTennisScoreChange(p.partai, 'scoreB', e.target.value)
                            }
                            className="w-16 px-2 py-1.5 text-center text-sm font-bold rounded-lg glass-input bg-[#0a0f24] text-white border border-white/15 focus:ring-2 focus:ring-cyan-400 tabular-nums"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Futsal Anak: Input Pencetak Gol */}
          {isFutsal && (
            <div className="mt-5 pt-5 border-t border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <p className="text-xs font-semibold text-emerald-300">
                    Input Pencetak Gol (Futsal Anak U-12)
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tambahkan nama pencetak gol tiap tim; total gol otomatis dihitung ke papan skor utama.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddGoalScorer}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/35 text-xs font-bold text-emerald-200 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Tambah Pencetak Gol</span>
                </button>
              </div>

              {futsalGoalScorers.length === 0 ? (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-dashed border-white/15 text-center text-xs text-slate-400">
                  Belum ada pencetak gol ditambahkan. Klik <span className="text-emerald-300 font-semibold">Tambah Pencetak Gol</span> untuk mencatat pencetak gol.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {futsalGoalScorers.map((scorer, idx) => (
                    <div
                      key={scorer.id}
                      className="p-3 rounded-xl bg-white/[0.03] border border-white/10 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end"
                    >
                      <div className="sm:col-span-3">
                        <label
                          htmlFor={`futsal-team-${scorer.id}`}
                          className="block text-[10px] text-slate-400 mb-1"
                        >
                          Tim #{idx + 1}
                        </label>
                        <select
                          id={`futsal-team-${scorer.id}`}
                          value={scorer.team}
                          onChange={(e) =>
                            handleUpdateGoalScorer(scorer.id, {
                              team: e.target.value as 'A' | 'B',
                            })
                          }
                          className="w-full px-2.5 py-2 text-xs rounded-lg glass-input bg-[#0a0f24] text-white border border-white/15 focus:ring-2 focus:ring-emerald-400 cursor-pointer"
                        >
                          <option value="A" className="bg-[#0a0f24] text-white">
                            {selectedMatch.teamA.rw}
                          </option>
                          <option value="B" className="bg-[#0a0f24] text-white">
                            {selectedMatch.teamB.rw}
                          </option>
                        </select>
                      </div>

                      <div className="sm:col-span-4">
                        <label
                          htmlFor={`futsal-name-${scorer.id}`}
                          className="block text-[10px] text-slate-400 mb-1"
                        >
                          Nama Pemain Pencetak Gol
                        </label>
                        <input
                          id={`futsal-name-${scorer.id}`}
                          type="text"
                          value={scorer.playerName}
                          onChange={(e) =>
                            handleUpdateGoalScorer(scorer.id, {
                              playerName: e.target.value,
                            })
                          }
                          placeholder="Contoh: Rafa (No. 9)"
                          className="w-full px-2.5 py-2 text-xs rounded-lg glass-input bg-[#0a0f24] text-white border border-white/15 placeholder-slate-500 focus:ring-2 focus:ring-emerald-400"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label
                          htmlFor={`futsal-goals-${scorer.id}`}
                          className="block text-[10px] text-slate-400 mb-1"
                        >
                          Jumlah Gol
                        </label>
                        <input
                          id={`futsal-goals-${scorer.id}`}
                          type="number"
                          min={1}
                          value={scorer.goals}
                          onChange={(e) =>
                            handleUpdateGoalScorer(scorer.id, {
                              goals: Math.max(1, Number.parseInt(e.target.value || '1', 10) || 1),
                            })
                          }
                          className="w-full px-2.5 py-2 text-center text-xs font-bold rounded-lg glass-input bg-[#0a0f24] text-white border border-white/15 focus:ring-2 focus:ring-emerald-400 tabular-nums"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label
                          htmlFor={`futsal-minute-${scorer.id}`}
                          className="block text-[10px] text-slate-400 mb-1"
                        >
                          Menit (Opsional)
                        </label>
                        <input
                          id={`futsal-minute-${scorer.id}`}
                          type="text"
                          value={scorer.minute || ''}
                          onChange={(e) =>
                            handleUpdateGoalScorer(scorer.id, {
                              minute: e.target.value,
                            })
                          }
                          placeholder="4', 12'"
                          className="w-full px-2.5 py-2 text-xs rounded-lg glass-input bg-[#0a0f24] text-white border border-white/15 placeholder-slate-500 focus:ring-2 focus:ring-emerald-400"
                        />
                      </div>

                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveGoalScorer(scorer.id)}
                          aria-label={`Hapus pencetak gol ${scorer.playerName || idx + 1}`}
                          title="Hapus pencetak gol"
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-400/40 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Winner Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <label htmlFor="result-winner-select" className="block text-xs font-semibold text-slate-200 mb-2">
              Penentuan Pemenang
            </label>
            <select
              id="result-winner-select"
              value={winnerMode}
              onChange={(e) =>
                setWinnerMode(e.target.value as 'auto' | 'teamA' | 'teamB' | 'draw')
              }
              className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input bg-[#0a0f24] text-white border border-white/15 focus:ring-2 focus:ring-emerald-400 cursor-pointer"
            >
              <option value="auto" className="bg-[#0a0f24] text-white">
                Otomatis dari Skor Tertinggi
              </option>
              <option value="teamA" className="bg-[#0a0f24] text-white">
                Menang: {selectedMatch.teamA.rw} ({selectedMatch.teamA.name})
              </option>
              <option value="teamB" className="bg-[#0a0f24] text-white">
                Menang: {selectedMatch.teamB.rw} ({selectedMatch.teamB.name})
              </option>
              <option value="draw" className="bg-[#0a0f24] text-white">
                Seri / Belum Ditentukan
              </option>
            </select>
          </div>

          <div className="flex flex-col-reverse sm:flex-row flex-wrap items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
            {hasOverride?.(selectedMatch.id) && onResetResult && (
              <button
                type="button"
                onClick={() => onResetResult(selectedMatch.id)}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-400/35 text-xs font-semibold text-slate-300 hover:text-rose-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Skor</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-bold text-xs shadow-lg hover:shadow-[0_0_24px_rgba(52,211,153,0.35)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Hasil</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
