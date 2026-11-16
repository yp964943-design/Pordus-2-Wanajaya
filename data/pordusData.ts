export interface SportItem {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  rulesHighlight: string[];
  system: string;
  quotaPerRW: string;
  venue: string;
  iconType: 'badminton' | 'volleyball' | 'tabletennis' | 'futsal';
}

export interface MatchTeam {
  rw: string;
  name?: string;
  logo?: string;
  score?: number;
}

export interface BadmintonDoublePartai {
  partai: number;
  label: string;
  pairA?: string;
  pairB?: string;
  scoreA: number;
  scoreB: number;
}

export interface TableTennisPartai {
  partai: number;
  label: string;
  playerA?: string;
  playerB?: string;
  scoreA: number;
  scoreB: number;
}

export interface FutsalGoalScorer {
  id: string;
  team: 'A' | 'B';
  playerName: string;
  goals: number;
  minute?: string;
}

export interface MatchItem {
  id: string;
  sport: 'Bulu Tangkis' | 'Bola Voli' | 'Tenis Meja' | 'Futsal Anak';
  category: string;
  round: string;
  teamA: MatchTeam;
  teamB: MatchTeam;
  date: string;
  time: string;
  venue: string;
  status: 'Selesai' | 'Sedang Berlangsung' | 'Segera';
  winner?: string;
  sets?: { set: number; scoreA: number; scoreB: number }[];
  badmintonDoubles?: BadmintonDoublePartai[];
  tableTennisMatches?: TableTennisPartai[];
  futsalGoalScorers?: FutsalGoalScorer[];
  isCustom?: boolean;
}

export interface RWStanding {
  rw: string;
  rwName: string;
  logo?: string;
  gold: number;
  silver: number;
  bronze: number;
  points: number;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'Bulutangkis' | 'Bola Voli' | 'Tenis Meja' | 'Futsal Anak' | 'Seremoni';
  imageUrl: string;
  caption: string;
  date: string;
  isCustom?: boolean;
}

export const RW_LOGOS: Record<string, { name: string; logo: string }> = {
  'RW 013': {
    name: 'Vila Mutiara Jaya',
    logo: '/assets/aistudio/RW_013_583b7ba0.png',
  },
  'RW 015': {
    name: 'Pesona Gading Cibitung',
    logo: '/assets/aistudio/KOMITE_OLAHRAGA_20261106_122814_0001_c16704bb.png',
  },
  'RW 016': {
    name: 'Pesona Gading Cibitung',
    logo: '/assets/aistudio/KOMITE_OLAHRAGA_20261106_122814_0002_a75017a9.png',
  },
  'RW 017': {
    name: 'Pesona Gading Cibitung',
    logo: '/assets/aistudio/KOMITE_OLAHRAGA_20261106_122814_0003_60fa63df.png',
  },
  'RW 021': {
    name: 'Griya Wanajaya Asri',
    logo: '/images/logos/rw-021.svg',
  },
  'RW 022': {
    name: 'Kirana Cibitung',
    logo: '/images/logos/rw-022.svg',
  },
  'RW 025': {
    name: 'Graha Persada',
    logo: '/images/logos/rw-025.svg',
  },
  'RW 030': {
    name: 'Golden Cibitung',
    logo: '/images/logos/rw-030.svg',
  },
};

export const SPORTS_LIST: SportItem[] = [
  {
    id: 'bulutangkis',
    name: 'Bulu Tangkis',
    category: 'Putra & Putri',
    description: 'Turnamen bulutangkis ganda beregu Putra dan Putri antar RW dengan format rally point 42 poin yang menguji kecepatan dan kekompakan tim.',
    image: '/images/badminton_action_pordus_1792865214621.jpg',
    rulesHighlight: [
      'Format beregu ganda Putra/Putri, masing-masing tim menurunkan 3 pasang pemain ganda',
      'Sistem skor rally point 42 poin tanpa deuce, pertukaran tempat pada poin 21',
      'Panitia menyediakan 2 pcs shuttlecock per partai; kelebihan dipotong dari deposit tim',
      'Wajib hadir 15 menit sebelum laga (terlambat >10 menit setelah 3x panggilan dinyatakan kalah)'
    ],
    system: 'Beregu (3 Ganda) · Rally 42 Poin',
    quotaPerRW: 'Maks. 12 atlet + 2 ofisial per kontingen',
    venue: 'SOR RW 017',
    iconType: 'badminton',
  },
  {
    id: 'bola-voli',
    name: 'Bola Voli',
    category: 'Putra & Putri',
    description: 'Ajang bola voli beregu Putra dan Putri antar RW dengan sistem rally point di SOR RW 017; Voli Putri memakai sistem bertemu tanpa babak final.',
    image: '/images/volleyball_action_pordus_1792865214031.jpg',
    rulesHighlight: [
      'Sistem rally point: Set 1 dan Set 2 hingga 25 poin, Set 3 (penentuan) hingga 15 poin',
      'Voli Putri menggunakan sistem bertemu (semua tim saling bertemu) tanpa ada babak final; juara ditentukan dari klasemen poin',
      'Pergantian pemain, rotasi, servis, dan pelanggaran mengikuti peraturan bola voli berlaku',
      'Di pinggir lapangan hanya diperbolehkan ofisial resmi dan pemain cadangan (maks. 12 atlet + 2 ofisial)'
    ],
    system: 'Rally Point · Putri: Sistem Bertemu',
    quotaPerRW: 'Maks. 12 atlet + 2 ofisial per tim',
    venue: 'SOR RW 017',
    iconType: 'volleyball',
  },
  {
    id: 'tenis-meja',
    name: 'Tenis Meja',
    category: 'Putra',
    description: 'Pertandingan tenis meja khusus Beregu Putra antar RW dengan susunan partai tunggal dan ganda serta sistem 3 kemenangan per partai.',
    image: '/images/table_tennis_pordus_1792865216315.jpg',
    rulesHighlight: [
      'Pertandingan Tenis Meja hanya mempertandingkan kategori Beregu Putra antar RW',
      'Setiap tim terdiri dari 2 pemain tunggal dan 3 pasang pemain ganda putra (tidak boleh main 2x)',
      'Susunan partai pertandingan: Ganda – Tunggal – Ganda – Tunggal – Ganda',
      'Satu gim dimainkan hingga 11 poin dengan format 3 kemenangan per partai'
    ],
    system: 'Beregu Putra (G-T-G-T-G) · 11 Poin',
    quotaPerRW: '2 Tunggal + 3 Pasang Ganda Putra (maks. 12 atlet + 2 ofisial)',
    venue: 'SOR RW 017',
    iconType: 'tabletennis',
  },
  {
    id: 'futsal-anak',
    name: 'Futsal Anak',
    category: 'Anak-Anak (U-12)',
    description: 'Kompetisi futsal kelompok usia anak antar RW menggunakan sistem bertemu tanpa ada babak final untuk menyalurkan bakat sepak bola usia dini warga Dusun II.',
    image: '/images/futsal_anak_pordus_1794727648397.jpg',
    rulesHighlight: [
      'Menggunakan sistem bertemu (setiap tim saling bertemu) tanpa ada babak final; peringkat teratas klasemen menjadi juara',
      'Usia peserta maksimal 12 tahun (dibuktikan dengan KK/Akta Kelahiran & domisili Dusun II Wanajaya)',
      'Pertandingan format 5 vs 5 (termasuk kiper) dengan durasi 2 x 10 menit (istirahat 3 menit)',
      'Wajib memakai sepatu futsal, kaos kaki panjang, dan pelindung tulang kering (shinguard)'
    ],
    system: 'Sistem Bertemu (Tanpa Babak Final)',
    quotaPerRW: '1 Tim Putra U-12 (maks. 10 pemain) per RW',
    venue: 'SOR RW 017',
    iconType: 'futsal',
  },
];

export const INITIAL_STANDINGS: RWStanding[] = [
  { rw: 'RW 013', rwName: 'Vila Mutiara Jaya', logo: RW_LOGOS['RW 013'].logo, gold: 0, silver: 0, bronze: 0, points: 0 },
  { rw: 'RW 015', rwName: 'Pesona Gading Cibitung', logo: RW_LOGOS['RW 015'].logo, gold: 0, silver: 0, bronze: 0, points: 0 },
  { rw: 'RW 016', rwName: 'Pesona Gading Cibitung', logo: RW_LOGOS['RW 016'].logo, gold: 0, silver: 0, bronze: 0, points: 0 },
  { rw: 'RW 017', rwName: 'Pesona Gading Cibitung', logo: RW_LOGOS['RW 017'].logo, gold: 0, silver: 0, bronze: 0, points: 0 },
  { rw: 'RW 021', rwName: 'Griya Wanajaya Asri', logo: RW_LOGOS['RW 021'].logo, gold: 0, silver: 0, bronze: 0, points: 0 },
  { rw: 'RW 022', rwName: 'Kirana Cibitung', logo: RW_LOGOS['RW 022'].logo, gold: 0, silver: 0, bronze: 0, points: 0 },
  { rw: 'RW 025', rwName: 'Graha Persada', logo: RW_LOGOS['RW 025'].logo, gold: 0, silver: 0, bronze: 0, points: 0 },
  { rw: 'RW 030', rwName: 'Golden Cibitung', logo: RW_LOGOS['RW 030'].logo, gold: 0, silver: 0, bronze: 0, points: 0 },
];

export const MATCHES_SCHEDULE: MatchItem[] = [
  // Minggu, 15 November 2026
  {
    id: 'm1',
    sport: 'Bola Voli',
    category: 'Putra',
    round: 'Group A',
    teamA: {
      rw: 'RW 013',
      name: RW_LOGOS['RW 013'].name,
      logo: RW_LOGOS['RW 013'].logo,
    },
    teamB: {
      rw: 'RW 016',
      name: RW_LOGOS['RW 016'].name,
      logo: RW_LOGOS['RW 016'].logo,
    },
    date: 'Minggu, 15 November 2026',
    time: '15.30 WIB',
    venue: 'SOR RW 017',
    status: 'Segera',
    sets: [
      { set: 1, scoreA: 0, scoreB: 0 },
      { set: 2, scoreA: 0, scoreB: 0 },
      { set: 3, scoreA: 0, scoreB: 0 },
    ],
  },
  {
    id: 'm2',
    sport: 'Bola Voli',
    category: 'Putra',
    round: 'Group B',
    teamA: {
      rw: 'RW 015',
      name: RW_LOGOS['RW 015'].name,
      logo: RW_LOGOS['RW 015'].logo,
    },
    teamB: {
      rw: 'RW 017',
      name: RW_LOGOS['RW 017'].name,
      logo: RW_LOGOS['RW 017'].logo,
    },
    date: 'Minggu, 15 November 2026',
    time: '16.30 WIB',
    venue: 'SOR RW 017',
    status: 'Segera',
    sets: [
      { set: 1, scoreA: 0, scoreB: 0 },
      { set: 2, scoreA: 0, scoreB: 0 },
      { set: 3, scoreA: 0, scoreB: 0 },
    ],
  },
  // Sabtu, 21 November 2026 - Bola Voli Putri (Sistem Bertemu)
  {
    id: 'm3',
    sport: 'Bola Voli',
    category: 'Putri',
    round: 'Sistem Bertemu',
    teamA: {
      rw: 'RW 017',
      name: RW_LOGOS['RW 017'].name,
      logo: RW_LOGOS['RW 017'].logo,
    },
    teamB: {
      rw: 'RW 022',
      name: RW_LOGOS['RW 022'].name,
      logo: RW_LOGOS['RW 022'].logo,
    },
    date: 'Sabtu, 21 November 2026',
    time: '15.30 WIB',
    venue: 'SOR RW 017',
    status: 'Segera',
    sets: [
      { set: 1, scoreA: 0, scoreB: 0 },
      { set: 2, scoreA: 0, scoreB: 0 },
      { set: 3, scoreA: 0, scoreB: 0 },
    ],
  },
  {
    id: 'm4',
    sport: 'Bola Voli',
    category: 'Putri',
    round: 'Sistem Bertemu',
    teamA: {
      rw: 'RW 013',
      name: RW_LOGOS['RW 013'].name,
      logo: RW_LOGOS['RW 013'].logo,
    },
    teamB: {
      rw: 'RW 015',
      name: RW_LOGOS['RW 015'].name,
      logo: RW_LOGOS['RW 015'].logo,
    },
    date: 'Sabtu, 21 November 2026',
    time: '16.30 WIB',
    venue: 'SOR RW 017',
    status: 'Segera',
    sets: [
      { set: 1, scoreA: 0, scoreB: 0 },
      { set: 2, scoreA: 0, scoreB: 0 },
      { set: 3, scoreA: 0, scoreB: 0 },
    ],
  },
  // Sabtu, 21 November 2026 - Bulu Tangkis Putri
  {
    id: 'm5',
    sport: 'Bulu Tangkis',
    category: 'Putri',
    round: 'Group A',
    teamA: {
      rw: 'RW 016',
      name: RW_LOGOS['RW 016'].name,
      logo: RW_LOGOS['RW 016'].logo,
    },
    teamB: {
      rw: 'RW 022',
      name: RW_LOGOS['RW 022'].name,
      logo: RW_LOGOS['RW 022'].logo,
    },
    date: 'Sabtu, 21 November 2026',
    time: '20.00 WIB',
    venue: 'SOR RW 017',
    status: 'Segera',
    badmintonDoubles: [
      { partai: 1, label: 'Ganda 1', pairA: '', pairB: '', scoreA: 0, scoreB: 0 },
      { partai: 2, label: 'Ganda 2', pairA: '', pairB: '', scoreA: 0, scoreB: 0 },
      { partai: 3, label: 'Ganda 3', pairA: '', pairB: '', scoreA: 0, scoreB: 0 },
    ],
  },
  {
    id: 'm6',
    sport: 'Bulu Tangkis',
    category: 'Putri',
    round: 'Group B',
    teamA: {
      rw: 'RW 013',
      name: RW_LOGOS['RW 013'].name,
      logo: RW_LOGOS['RW 013'].logo,
    },
    teamB: {
      rw: 'RW 015',
      name: RW_LOGOS['RW 015'].name,
      logo: RW_LOGOS['RW 015'].logo,
    },
    date: 'Sabtu, 21 November 2026',
    time: '20.00 WIB',
    venue: 'SOR RW 017',
    status: 'Segera',
    badmintonDoubles: [
      { partai: 1, label: 'Ganda 1', pairA: '', pairB: '', scoreA: 0, scoreB: 0 },
      { partai: 2, label: 'Ganda 2', pairA: '', pairB: '', scoreA: 0, scoreB: 0 },
      { partai: 3, label: 'Ganda 3', pairA: '', pairB: '', scoreA: 0, scoreB: 0 },
    ],
  },
  // Sabtu, 21 November 2026 - Bulu Tangkis Putra
  {
    id: 'm7',
    sport: 'Bulu Tangkis',
    category: 'Putra',
    round: 'Group B',
    teamA: {
      rw: 'RW 016',
      name: RW_LOGOS['RW 016'].name,
      logo: RW_LOGOS['RW 016'].logo,
    },
    teamB: {
      rw: 'RW 025',
      name: RW_LOGOS['RW 025'].name,
      logo: RW_LOGOS['RW 025'].logo,
    },
    date: 'Sabtu, 21 November 2026',
    time: '21.00 WIB',
    venue: 'SOR RW 017',
    status: 'Segera',
    badmintonDoubles: [
      { partai: 1, label: 'Ganda 1', pairA: '', pairB: '', scoreA: 0, scoreB: 0 },
      { partai: 2, label: 'Ganda 2', pairA: '', pairB: '', scoreA: 0, scoreB: 0 },
      { partai: 3, label: 'Ganda 3', pairA: '', pairB: '', scoreA: 0, scoreB: 0 },
    ],
  },
];

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'g1',
    title: 'Penyerahan Piala Bergilir Juara Umum',
    category: 'Seremoni',
    imageUrl: '/images/trophy_ceremony_pordus_1792865216253.jpg',
    caption: 'Momen sakral penyerahan trofi bergilir Kepala Dusun II Wanajaya kepada kontingen juara umum.',
    date: 'PORDUS Wanajaya',
  },
  {
    id: 'g2',
    title: 'Smash Tajam Partai Puncak Bulutangkis',
    category: 'Bulutangkis',
    imageUrl: '/images/badminton_action_pordus_1792865214621.jpg',
    caption: 'Aksi atlet ganda bulutangkis saat melepaskan jumping smash penentu match point di babak final.',
    date: 'GOR Dusun II Wanajaya',
  },
  {
    id: 'g3',
    title: 'Serangan Blokade Udara Bola Voli',
    category: 'Bola Voli',
    imageUrl: '/images/volleyball_action_pordus_1792865214031.jpg',
    caption: 'Duel sengit di atas net antara spiker dan dua blocker tim voli dalam tensi kompetisi tinggi.',
    date: 'SOR RW. 017',
  },
  {
    id: 'g4',
    title: 'Rally Cepat Tenis Meja Perebutan Perunggu',
    category: 'Tenis Meja',
    imageUrl: '/images/table_tennis_pordus_1792865216315.jpg',
    caption: 'Konsentrasi dan refleks kilat atlet tenis meja menyambut pukulan forehand loop top-spin.',
    date: 'Gedung Serbaguna',
  },
  {
    id: 'g5',
    title: 'Euforia Lapangan dan Gemuruh Supporter',
    category: 'Seremoni',
    imageUrl: '/images/hero_pordus_sports_1792865214551.jpg',
    caption: 'Sorak sorai warga memadati tribun menghidupkan semangat sportivitas persaudaraan.',
    date: 'Wanajaya Sports Arena',
  },
  {
    id: 'g6',
    title: 'Aksi Lincah Turnamen Futsal Anak',
    category: 'Futsal Anak',
    imageUrl: '/images/futsal_anak_pordus_1794727648397.jpg',
    caption: 'Semangat juang talenta muda U-12 antar RW menunjukkan teknik dribble dan kerja sama tim.',
    date: 'SOR RW 017',
  },
];

export const OFFICIAL_RULES_SECTIONS = [
  {
    id: 'bab-1',
    title: 'BAB I · Peraturan Umum & Persyaratan Peserta (Pasal 1–5)',
    points: [
      'Pekan Olahraga Dusun II Wanajaya dilaksanakan berdasarkan asas kebersamaan, kejujuran, kedisiplinan, keamanan, dan sportivitas bagi seluruh peserta, ofisial, pelatih, pendamping, dan wasit/juri.',
      'Peserta adalah warga/perwakilan RW yang berdomisili di wilayah RW masing-masing dengan melampirkan KTP/KK/Kartu Pelajar dan foto terbaru (atau surat domisili yang disahkan pengurus RW setempat).',
      'Jumlah peserta tiap cabang olahraga maksimal 12 atlet ditambah 2 ofisial; daftar peserta yang telah disahkan panitia menjadi dasar keikutsertaan dan tidak dapat diubah melewati batas waktu.',
      'Peserta wajib hadir sesuai jadwal, memakai pakaian dan perlengkapan sesuai cabang, menjaga fasilitas pertandingan, serta dilarang melakukan kekerasan, perundungan, provokasi, manipulasi identitas, maupun persengkongkolan.',
      'Panitia berhak menunda, menghentikan, atau memindahkan pertandingan apabila cuaca, keamanan, kesehatan, atau keadaan lain membahayakan peserta.'
    ],
  },
  {
    id: 'bab-2',
    title: 'BAB II · Ketentuan Pelaksanaan & Teknis Cabang Olahraga (Pasal 6–9)',
    points: [
      'Ketentuan Pelaksanaan (Pasal 6): Peserta wajib hadir paling lambat 15 menit sebelum pertandingan dimulai. Keterlambatan lebih dari 10 menit setelah dipanggil 3 kali oleh panitia dapat dinyatakan kalah tanpa bertanding, kecuali ada alasan yang diterima panitia.',
      'Bulu Tangkis Putra & Putri (Pasal 7): Format beregu ganda (masing-masing tim menurunkan 3 pasang ganda) menggunakan sistem rally point 42 poin tanpa deuce dengan pertukaran tempat pada poin 21. Panitia menyiapkan 2 pcs shuttlecock per partai; kelebihan pemakaian dipotong dari deposit tim.',
      'Bola Voli Putra & Putri (Pasal 8): Menggunakan sistem rally point — Set 1 dan Set 2 sampai 25 poin, sedangkan Set 3 sampai 15 poin. Khusus Bola Voli Putri menggunakan sistem bertemu penuh tanpa ada babak final; peringkat ditentukan dari poin dan selisih set/skor.',
      'Tenis Meja Beregu Putra (Pasal 9): Hanya mempertandingkan nomor Beregu Putra. Setiap tim terdiri dari 2 pemain tunggal dan 3 pasang ganda putra (pemain tidak boleh bermain 2 kali) dengan susunan partai Ganda–Tunggal–Ganda–Tunggal–Ganda, 11 poin per gim dengan 3 kemenangan per partai.',
      'Futsal Anak U-12: Menggunakan format 5 vs 5 dengan sistem bertemu penuh tanpa ada babak final; juara ditentukan langsung dari klasemen poin tertinggi.'
    ],
  },
  {
    id: 'bab-3',
    title: 'BAB III · Peringkat, Perolehan Poin, & Klasemen (Pasal 10–13)',
    points: [
      'Perolehan Poin Resmi (Pasal 11): Menang = 3 poin, Menang WO (walkover) = 3 poin, Kalah = 0 poin, dan Kalah WO (walkover) = 0 poin.',
      'Penentuan Peringkat (Pasal 12): Peringkat klasemen diurutkan berdasarkan (1) Jumlah poin tertinggi, (2) Jumlah set kemenangan tertinggi, dan (3) Jumlah skor tertinggi.',
      'Komponen Perhitungan Klasemen (Pasal 13): Main (P), Menang (W), Kalah (L), Poin (PT), Set Menang (SW), Set Kalah (SL), Selisih Set (SS), Skor Menang (GA), Skor Kalah (GF), dan Selisih Skor (GD).'
    ],
  },
  {
    id: 'bab-4',
    title: 'BAB IV · Protes & Penyelesaian Perselisihan (Pasal 14)',
    points: [
      'Protes hanya dapat diajukan oleh peserta yang bertanding atau kapten tim terdaftar kepada wasit dan/atau panitia.',
      'Protes administratif (seperti ketidaksesuaian data peserta atau dugaan pelanggaran persyaratan) wajib disampaikan sebelum pertandingan dimulai.',
      'Setiap protes harus disertai alasan yang jelas serta bukti pendukung bila tersedia; keputusan wasit mengenai kejadian faktual di lapangan wajib dihormati.',
      'Panitia membentuk tim atau menunjuk petugas khusus untuk memeriksa dan memutuskan setiap pengajuan protes.'
    ],
  },
  {
    id: 'bab-5',
    title: 'BAB V · Sanksi & Tindakan Disiplin (Pasal 15–18)',
    points: [
      'Tidak hadir tanpa alasan yang dapat diterima dikenakan sanksi kalah WO (walkover) dan denda Rp 250.000,-; terlambat hadir dikenakan peringatan atau dinyatakan kalah sesuai ketentuan keterlambatan.',
      'Protes tidak sopan, penghinaan, provokasi, atau intimidasi terhadap lawan/wasit dikenakan teguran resmi, peringatan, pengeluaran dari pertandingan, hingga skorsing.',
      'Pemalsuan identitas, penggunaan pemain tidak sah, kecurangan, atau persengkongkolan berakibat pembatalan hasil, diskualifikasi, hingga pencabutan hak pertandingan.',
      'Kekerasan fisik, ancaman serius, mengganggu laga, atau merusak fasilitas dengan sengaja berakibat penghentian laga, pengeluaran dari arena, diskualifikasi, skorsing, dan kewajiban ganti rugi.',
      'Tingkatan Sanksi (Pasal 16–18): Teguran lisan, peringatan tertulis, hukuman teknis (pengurangan poin/kehilangan servis/reli), kalah pertandingan, diskualifikasi, skorsing, dan ganti rugi. Sanksi berat wajib dicatat dalam berita acara setelah pemeriksaan fakta.'
    ],
  },
  {
    id: 'bab-6',
    title: 'BAB VI · Penghargaan & Ketentuan Penutup (Pasal 19–20)',
    points: [
      'Pemenang ditetapkan berdasarkan hasil pertandingan yang sah; Juara I, II, dan III diberikan penghargaan sesuai ketentuan panitia serta tersedia penghargaan khusus sportivitas.',
      'Hal-hal yang belum diatur dalam peraturan ini ditetapkan melalui keputusan panitia sepanjang tidak bertentangan dengan aturan cabang olahraga yang berlaku.',
      'Perubahan peraturan wajib diumumkan kepada seluruh tim sebelum diberlakukan, dan seluruh peserta dianggap memahami serta menyetujui peraturan ini setelah mengikuti pertandingan.'
    ],
  },
];
