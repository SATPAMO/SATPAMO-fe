import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  Calendar,
  BarChart2,
  Settings,
  HelpCircle,
  LogOut,
  DoorOpen,
  ChevronDown,
  Download,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Mail,
  FileCheck,
  Send,
  Star,
  Award,
  CheckCircle2,
  X,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface AtRiskStudent {
  id: string;
  name: string;
  nim: string;
  attendanceSession: string;
  alphaInfo: string;
  percentage: number;
  riskStatus: "kritis" | "waspada" | "aman";
  riskLabel: string;
}

const mockAtRiskStudents: AtRiskStudent[] = [
  {
    id: "1",
    name: "Yurii Kharlistov",
    nim: "253140707111000",
    attendanceSession: "7/10 Sesi",
    alphaInfo: "3 Alpha",
    percentage: 70.0,
    riskStatus: "kritis",
    riskLabel: "Kritis (Wajib Konseling / Tugas)",
  },
  {
    id: "2",
    name: "Yurii Kharlistov",
    nim: "253140707111000",
    attendanceSession: "7.5/10 Sesi",
    alphaInfo: "1 Sakit, 2 Telat",
    percentage: 75.0,
    riskStatus: "waspada",
    riskLabel: "Waspada (Batas Minimal)",
  },
  {
    id: "3",
    name: "Yurii Kharlistov",
    nim: "253140707111000",
    attendanceSession: "8/10 Sesi",
    alphaInfo: "2 Sakit Resmi",
    percentage: 80.0,
    riskStatus: "aman",
    riskLabel: "Cukup Aman",
  },
];

export function StatistikKelas() {
  const navigate = useNavigate();
  const { dosen, logout } = useAuth();

  // State
  const [selectedFilter, setSelectedFilter] = useState("Sesi 1 s/d 10 (Kumulatif)");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [showWarningBaakModal, setShowWarningBaakModal] = useState(false);
  const [showSp1Modal, setShowSp1Modal] = useState<AtRiskStudent | null>(null);
  const [showDispensasiModal, setShowDispensasiModal] = useState<AtRiskStudent | null>(null);
  const [showBapModal, setShowBapModal] = useState(false);
  const [showSendBaakModal, setShowSendBaakModal] = useState(false);
  const [showGuidanceModal, setShowGuidanceModal] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return "YK";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const navItems = [
    { icon: <Radio className="w-4 h-4" />, label: "Live Monitoring", active: false, path: "/" },
    { icon: <Calendar className="w-4 h-4" />, label: "Jadwal Sesi", active: false, path: "/jadwal-sesi" },
    { icon: <BarChart2 className="w-4 h-4" />, label: "Statistik Kelas", active: true, path: "/statistik-kelas" },
    { icon: <Settings className="w-4 h-4" />, label: "Pengaturan Kuota", active: false, path: "/pengaturan-kuota" },
  ];

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const trendData = [
    { session: "S1", rate: 100, isUts: false },
    { session: "S2", rate: 97.6, isUts: false },
    { session: "S3", rate: 97.6, isUts: false },
    { session: "S4", rate: 97.6, isUts: false },
    { session: "S5", rate: 97.6, isUts: false },
    { session: "S6", rate: 97.6, isUts: false },
    { session: "S7", rate: 97.6, isUts: false },
    { session: "S8", rate: 100, isUts: true },
    { session: "S9", rate: 97.6, isUts: false },
    { session: "S10", rate: 97.6, isUts: false },
  ];

  return (
    <div
      className="min-h-screen flex text-slate-800"
      style={{
        background: "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 30%, #0284c7 60%, #60d8f7 100%)",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 bg-sky-900/90 backdrop-blur-md text-white text-sm font-semibold px-4 py-3 rounded-2xl shadow-xl border border-sky-400/40 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className="w-60 shrink-0 flex flex-col py-6 px-4 gap-4"
        style={{
          background: "linear-gradient(180deg, #1e6fa8 0%, #155e86 60%, #0c4a6e 100%)",
          boxShadow: "4px 0 24px rgba(0,0,0,0.18)",
        }}
      >
        <div className="mb-2">
          <h1 className="text-3xl font-black text-yellow-400 tracking-tight leading-none">SATPAMO</h1>
          <p className="text-sky-300 text-xs font-semibold tracking-widest mt-0.5">ADMIN</p>
        </div>

        {/* Profile Card */}
        <div className="flex items-center gap-3 bg-white/10 rounded-2xl px-3 py-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-300 to-blue-500 flex items-center justify-center text-white text-sm font-black shrink-0">
            {dosen ? getInitials(dosen.username) : "YK"}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-bold leading-tight truncate">
              {dosen?.username ?? "Dr. Yurii Kharlistov, M.T."}
            </p>
            <p className="text-sky-300 text-[10px] truncate">NIP: 123456789098761</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1.5 flex-1 mt-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                item.active
                  ? "bg-sky-400/35 text-white shadow-sm border border-sky-300/40"
                  : "text-sky-100 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.active && (
                <span className="w-2.5 h-2.5 rounded-full bg-sky-950 ring-2 ring-sky-300 shrink-0" />
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="flex flex-col gap-1 border-t border-white/10 pt-3">
          <button
            onClick={() => triggerToast("Pusat Bantuan SATPAMO: satpamo-support@ac.id")}
            className="flex items-center gap-2 text-sky-200 hover:text-white text-xs px-2 py-2 rounded-lg hover:bg-white/10 transition-all font-medium"
          >
            <HelpCircle className="w-4 h-4" />
            Bantuan SATPAMO
          </button>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="flex items-center gap-2 text-red-300 hover:text-red-200 text-xs px-2 py-2 rounded-lg hover:bg-red-500/10 transition-all font-semibold"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar px-7 py-5 flex flex-col gap-5 relative">
        {/* Ambient light spots for glass refraction */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-300/35 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-24 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/3 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Pill & User Avatar */}
        <div className="flex items-center justify-between relative z-10">
          <div className="inline-flex items-center gap-2.5 glass-panel rounded-2xl px-4 py-2 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            <span className="text-xs font-semibold text-slate-800">
              Ruang 207: Pemrograman Mobile (Kelas T3A)
            </span>
            <DoorOpen className="w-3.5 h-3.5 text-slate-700 ml-1" />
          </div>

          <div className="w-9 h-9 rounded-full bg-sky-600 border border-sky-300 flex items-center justify-center text-white text-xs font-black shadow-sm">
            {dosen ? getInitials(dosen.username) : "YK"}
          </div>
        </div>

        {/* Top Info Bar & Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 relative z-10">
          {/* Left Info Badges */}
          <div className="flex items-center flex-wrap gap-2.5">
            <span className="bg-sky-950 text-sky-200 text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
              SEMESTER GANJIL 2025/2026
            </span>
            <span className="text-slate-800 text-[11px] font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Sinkronisasi BAAK: Hari ini, 09:40 WIB
            </span>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center flex-wrap gap-2.5 relative">
            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold glass-pill hover:bg-white/60 text-slate-800 hover:text-slate-950 shadow-xs transition-all flex items-center gap-1.5"
              >
                <span>{selectedFilter}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
              </button>

              {showFilterDropdown && (
                <div className="absolute right-0 mt-1.5 w-60 glass-panel backdrop-blur-2xl rounded-2xl shadow-xl border border-white/60 py-1.5 z-40 text-xs">
                  {[
                    "Sesi 1 s/d 10 (Kumulatif)",
                    "Sesi 1 s/d 5 (Pra-UTS)",
                    "Sesi 6 s/d 10 (Pasca-UTS)",
                    "Hanya Mahasiswa At-Risk",
                  ].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedFilter(option);
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 hover:bg-white/40 font-medium transition-colors ${
                        selectedFilter === option ? "text-sky-900 font-bold bg-white/30" : "text-slate-700"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Download Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold glass-pill hover:bg-white/60 text-slate-800 hover:text-slate-950 shadow-xs transition-all flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-slate-700" />
                <span>Unduh Laporan</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
              </button>

              {showDownloadDropdown && (
                <div className="absolute right-0 mt-1.5 w-52 glass-panel backdrop-blur-2xl rounded-2xl shadow-xl border border-white/60 py-1.5 z-40 text-xs">
                  <button
                    onClick={() => {
                      setShowDownloadDropdown(false);
                      triggerToast("Mengunduh Laporan_Statistik_Kelas_PDF.pdf...");
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-white/40 font-medium text-slate-800 flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5 text-rose-500" />
                    Format PDF (BAAK Ready)
                  </button>
                  <button
                    onClick={() => {
                      setShowDownloadDropdown(false);
                      triggerToast("Mengunduh Rekapitulasi_Presensi_Excel.xlsx...");
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-white/40 font-medium text-slate-800 flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    Format Excel (.xlsx)
                  </button>
                </div>
              )}
            </div>

            {/* Kirim Peringatan BAAK button */}
            <button
              onClick={() => setShowWarningBaakModal(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-900 shadow-md transition-all flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-slate-900" />
              <span>Kirim Peringatan BAAK</span>
            </button>
          </div>
        </div>

        {/* Page Title & Subtitle */}
        <div className="relative z-10">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Statistik & Evaluasi Presensi Kelas
          </h2>
          <p className="text-xs text-slate-700 mt-0.5 max-w-4xl">
            Analisis tren kehadiran 10 sesi perkuliahan. Korelasi presensi vs performa praktikum. Dan deteksi dini mahasiswa at-risk (Ambang batas ujian BAAK 75%).
          </p>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 relative z-10">
          {/* Card 1: Rata-Rata Kehadiran */}
          <div className="glass-panel glass-card-interactive rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-wider text-slate-600 uppercase">
                RATA-RATA KEHADIRAN
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-900 leading-none">92.5%</span>
                <span className="text-[10px] font-bold text-emerald-700">+2.4%</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-3 text-[10px] text-slate-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Target prodi &gt;80% terlampaui</span>
            </div>
          </div>

          {/* Card 2: Kehadiran Tepat Waktu */}
          <div className="glass-panel glass-card-interactive rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-wider text-slate-600 uppercase">
                KEHADIRAN TEPAT WAKTU
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-900 leading-none">88.5%</span>
                <span className="text-xs font-semibold text-slate-600">dari 42 Mahasiswa</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-600 mt-3 font-medium">
              Toleransi 15 menit pertama kuliah
            </p>
          </div>

          {/* Card 3: Total Pengajuan Izin */}
          <div className="glass-panel glass-card-interactive rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-wider text-slate-600 uppercase">
                TOTAL PENGAJUAN IZIN
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-900 leading-none">14</span>
                <span className="text-xs font-semibold text-slate-600">Berkas</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              <span className="bg-sky-500/20 text-sky-900 border border-sky-400/30 text-[10px] font-bold px-2 py-0.5 rounded-md">
                12 Disetujui
              </span>
              <span className="bg-rose-500/15 text-rose-800 border border-rose-300/30 text-[10px] font-bold px-2 py-0.5 rounded-md">
                2 Perlu Direview
              </span>
            </div>
          </div>

          {/* Card 4: Mahasiswa At-Risk */}
          <div className="glass-panel glass-card-interactive rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-wider text-rose-700 uppercase">
                MAHASISWA AT-RISK
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-rose-600 leading-none">2</span>
                <span className="text-xs font-bold text-rose-600">Mahasiswa</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] mt-3">
              <span className="text-slate-600 font-medium">Ambang kuota BAAK &lt;75%</span>
              <span className="text-rose-700 font-bold">Tindakan Cepat</span>
            </div>
          </div>
        </div>

        {/* Charts & Distribution Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch relative z-10">
          {/* Left: Tren Kehadiran Kumulatif (8 cols) */}
          <div className="lg:col-span-8 glass-panel rounded-3xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-sky-700" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Tren Kehadiran Kumulatif (Sesi 1 s/d 10)
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Batas minimum syarat mengikuti Ujian Akhir Semester (UAS) adalah 75% Kehadiran
                  </p>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-600 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    <span>Hadir Nyata</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-rose-500" />
                    <span className="text-rose-600">Batas 75% BAAK</span>
                  </div>
                </div>
              </div>

              {/* Bar Chart Container */}
              <div className="relative pt-6 pb-2">
                {/* 75% Threshold Red Dashed Line */}
                <div className="absolute left-0 right-0 top-[28%] z-10 flex items-center pointer-events-none">
                  <div className="w-full border-b border-dashed border-rose-500/80" />
                </div>

                {/* Bars */}
                <div className="grid grid-cols-10 gap-2 sm:gap-3 items-end h-44 px-2">
                  {trendData.map((d) => (
                    <div key={d.session} className="flex flex-col items-center h-full justify-end group">
                      <span className="text-[9px] font-bold text-slate-600 mb-1 group-hover:text-slate-900 transition-colors">
                        {d.rate}%
                      </span>
                      <div
                        className="w-full max-w-[32px] rounded-t-xl transition-all shadow-sm"
                        style={{
                          height: `${d.rate * 0.9}%`,
                          background: d.isUts
                            ? "linear-gradient(180deg, #facc15 0%, #eab308 100%)"
                            : "linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)",
                        }}
                      />
                      <span className="text-[10px] font-bold text-slate-600 mt-2">
                        {d.session}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 mt-2 border-t border-slate-300/40 text-[10px]">
              <span className="text-slate-600 italic">
                *S8 adalah Evaluasi Tengah Semester (UTS Praktikum Mandiri)
              </span>
              <button
                onClick={() => triggerToast("Menampilkan detail rincian log kehadiran...")}
                className="text-sky-800 hover:text-sky-950 font-bold hover:underline self-start sm:self-auto"
              >
                Lihat rincian log sesi terpilih &rarr;
              </button>
            </div>
          </div>

          {/* Right: Distribusi Kehadiran (4 cols) */}
          <div className="lg:col-span-4 glass-panel rounded-3xl p-5 shadow-lg flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-slate-900">Distribusi Kehadiran</h3>
                <span className="bg-sky-500/20 text-sky-900 border border-sky-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  42 Mahasiswa
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mb-4">
                Akumulasi status validasi presensi otomatis SATPAMO
              </p>

              {/* Progress Breakdown Bars */}
              <div className="flex flex-col gap-3">
                {/* 1. Hadir Tepat Waktu */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <span className="w-2 h-2 rounded-full bg-sky-500" />
                      Hadir Tepat Waktu
                    </span>
                    <span className="text-slate-900 font-bold">78.0% <span className="text-[10px] text-slate-500 font-normal">(33)</span></span>
                  </div>
                  <div className="w-full bg-white/40 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: "78%" }} />
                  </div>
                </div>

                {/* 2. Terlambat (<15 min) */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Terlambat (&lt;15 min)
                    </span>
                    <span className="text-slate-900 font-bold">14.5% <span className="text-[10px] text-slate-500 font-normal">(6)</span></span>
                  </div>
                  <div className="w-full bg-white/40 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: "14.5%" }} />
                  </div>
                </div>

                {/* 3. Izin/Sakit Terverifikasi */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <span className="w-2 h-2 rounded-full bg-sky-950" />
                      Izin/Sakit Terverifikasi
                    </span>
                    <span className="text-slate-900 font-bold">4.8% <span className="text-[10px] text-slate-500 font-normal">(2)</span></span>
                  </div>
                  <div className="w-full bg-white/40 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-sky-950 h-1.5 rounded-full" style={{ width: "4.8%" }} />
                  </div>
                </div>

                {/* 4. Tanpa Keterangan */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Tanpa Keterangan
                    </span>
                    <span className="text-slate-900 font-bold">2.7% <span className="text-[10px] text-slate-500 font-normal">(1)</span></span>
                  </div>
                  <div className="w-full bg-white/40 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: "2.7%" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Card: 99.1% Kepatuhan Geolokasi */}
            <div className="glass-inner rounded-2xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-800 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  99.1% Kepatuhan Geolokasi
                </p>
                <p className="text-[10px] text-slate-600 mt-0.5 leading-tight">
                  Terverifikasi GPS radius 25 meter & beacon ruang 207
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Deteksi Dini Mahasiswa Beresiko (Early Warning System BAAK) */}
        <div className="glass-panel rounded-3xl p-5 shadow-lg flex flex-col gap-4 relative z-10">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-700 border border-rose-300/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Deteksi Dini Mahasiswa Beresiko (Early Warning System BAAK)
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Mahasiswa berikut terancam tidak memenuhi syarat minimal 75% kehadiran untuk mengikuti Ujian Akhir Semester (UAS)
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto no-scrollbar rounded-2xl border border-white/40">
            <table className="w-full text-left text-xs">
              <thead className="glass-table-head text-slate-700 font-bold text-[11px]">
                <tr className="border-b border-white/40">
                  <th className="py-2.5 px-3">Mahasiswa</th>
                  <th className="py-2.5 px-3">NIM</th>
                  <th className="py-2.5 px-3">Kehadiran Sesi</th>
                  <th className="py-2.5 px-3">Persentase</th>
                  <th className="py-2.5 px-3">Status Resiko</th>
                  <th className="py-2.5 px-3 text-right">Aksi Rekomendasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20 font-medium">
                {mockAtRiskStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-white/30 transition-colors">
                    {/* Mahasiswa */}
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {st.name}
                    </td>

                    {/* NIM */}
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                      {st.nim}
                    </td>

                    {/* Kehadiran Sesi */}
                    <td className="py-3 px-3">
                      <span className="text-slate-900 font-bold">{st.attendanceSession}</span>{" "}
                      <span
                        className={
                          st.riskStatus === "kritis"
                            ? "text-rose-700 font-bold"
                            : st.riskStatus === "waspada"
                            ? "text-amber-700 font-bold"
                            : "text-slate-600 font-semibold"
                        }
                      >
                        ({st.alphaInfo})
                      </span>
                    </td>

                    {/* Persentase */}
                    <td className="py-3 px-3">
                      <span
                        className={`text-base font-black ${
                          st.percentage < 75
                            ? "text-rose-600"
                            : st.percentage === 75
                            ? "text-amber-600"
                            : "text-slate-900"
                        }`}
                      >
                        {st.percentage.toFixed(1)}%
                      </span>
                    </td>

                    {/* Status Resiko */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          st.riskStatus === "kritis"
                            ? "bg-rose-500/15 text-rose-800 border border-rose-300/30"
                            : st.riskStatus === "waspada"
                            ? "bg-amber-500/15 text-amber-800 border border-amber-300/30"
                            : "bg-sky-500/15 text-sky-900 border border-sky-300/30"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            st.riskStatus === "kritis"
                              ? "bg-rose-600"
                              : st.riskStatus === "waspada"
                              ? "bg-amber-500"
                              : "bg-sky-600"
                          }`}
                        />
                        {st.riskLabel}
                      </span>
                    </td>

                    {/* Aksi Rekomendasi */}
                    <td className="py-3 px-3 text-right">
                      {st.riskStatus === "kritis" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setShowDispensasiModal(st)}
                            className="px-2.5 py-1 text-[11px] font-bold glass-pill hover:bg-white/60 text-slate-800 shadow-xs transition-all"
                          >
                            Beri Dispensasi
                          </button>
                          <button
                            onClick={() => setShowSp1Modal(st)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm transition-all flex items-center gap-1"
                          >
                            <Mail className="w-3 h-3" />
                            Kirim SP-1
                          </button>
                        </div>
                      ) : st.riskStatus === "waspada" ? (
                        <button
                          onClick={() => {
                            triggerToast(`Email peringatan terkirim ke ${st.name} (${st.nim})`);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold glass-pill hover:bg-white/60 text-slate-800 shadow-xs transition-all flex items-center gap-1 ml-auto"
                        >
                          <Mail className="w-3 h-3 text-slate-600" />
                          Kirim Peringatan Email
                        </button>
                      ) : (
                        <button
                          onClick={() => triggerToast("Membuka berkas surat izin resmi...")}
                          className="text-[11px] font-bold text-sky-900 hover:text-sky-950 hover:underline"
                        >
                          Lihat surat izin &rarr;
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Section: AI Insights & 100% Attendance Club */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch relative z-10">
          {/* Left: BAAK ACADEMIC INTELIGENCE INSIGHTS (8 cols) */}
          <div className="lg:col-span-8 glass-panel border-amber-300/40 bg-amber-500/10 rounded-3xl p-5 shadow-lg flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-bold shadow-xs">
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <span className="text-xs font-black tracking-wider uppercase text-amber-950">
                  BAAK ACADEMIC INTELIGENCE INSIGHTS
                </span>
              </div>

              <h3 className="text-base font-black text-slate-900 leading-snug">
                Presensi &gt;90% Berkorelasi Langsung Dengan Peningkatan Nilai Praktikum Mahasiswa Sebesar +28%
              </h3>

              <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                Mahasiswa dengan presensi diatas 90% memiliki rata-rata nilai tugas praktikum <strong className="text-slate-900">84.6/100</strong>, sedangkan mahasiswa di bawah kuota 80% rata-ratanya hanya <strong className="text-slate-900">66.2/100</strong>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-amber-300/30">
              <div className="flex items-center gap-3 text-[11px] text-slate-700 font-semibold">
                <span className="flex items-center gap-1 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Dataset 42 Mahasiswa Valid
                </span>
                <span>•</span>
                <span>Confidence Score 94.8%</span>
              </div>

              <button
                onClick={() => setShowGuidanceModal(true)}
                className="px-4 py-2 rounded-xl glass-pill hover:bg-white/60 text-sky-950 font-bold text-xs shadow-xs transition-all self-start sm:self-auto"
              >
                Terapkan Rekomendasi Bimbingan
              </button>
            </div>
          </div>

          {/* Right: 100% Attendance Club (4 cols) */}
          <div className="lg:col-span-4 glass-panel rounded-3xl p-5 shadow-lg flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-black text-slate-900">100% Attendance Club</h3>
                </div>
                <span className="bg-sky-500/20 text-sky-900 border border-sky-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  18 Mahasiswa
                </span>
              </div>

              <p className="text-[11px] text-slate-600 mb-3">
                18 Mahasiswa tidak pernah terlambat maupun alpha selama 10 sesi berturut-turut.
              </p>

              {/* Stacked Avatars */}
              <div className="flex items-center -space-x-2 mb-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-600 to-sky-700 text-white border-2 border-white text-[10px] font-black flex items-center justify-center shadow-xs"
                  >
                    YK
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full bg-sky-800 text-white border-2 border-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  +14
                </div>
              </div>
            </div>

            {/* Action Links */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-300/40">
              <button
                onClick={() => setShowBapModal(true)}
                className="w-full text-left py-2 px-3 rounded-xl text-xs font-bold text-sky-950 hover:text-sky-900 glass-inner hover:bg-white/40 flex items-center justify-between transition-all"
              >
                <span className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-sky-700" />
                  Cetak BAP Kuliah Siakad
                </span>
                <span className="text-slate-500">&gt;</span>
              </button>

              <button
                onClick={() => setShowSendBaakModal(true)}
                className="w-full text-left py-2 px-3 rounded-xl text-xs font-bold text-sky-950 hover:text-sky-900 glass-inner hover:bg-white/40 flex items-center justify-between transition-all"
              >
                <span className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-sky-700" />
                  Kirim Berita Acara ke BAAK
                </span>
                <span className="text-slate-500">&gt;</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modal: Peringatan BAAK */}
      <AnimatePresence>
        {showWarningBaakModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel backdrop-blur-2xl rounded-3xl p-6 w-full max-w-md shadow-2xl border border-white/60 flex flex-col gap-4 text-slate-800"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-300/40">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Kirim Laporan Peringatan BAAK</h3>
                    <p className="text-[11px] text-slate-600">Notifikasi Otomatis ke Biro Akademik</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWarningBaakModal(false)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-white/40"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-700 leading-relaxed">
                Sistem akan mengirimkan daftar mahasiswa dengan kehadiran di bawah ambang batas BAAK (75%) untuk diterbitkan surat teguran akademik resmi melalui portal BAAK.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-300/40">
                <button
                  onClick={() => setShowWarningBaakModal(false)}
                  className="px-4 py-2 text-xs glass-pill rounded-xl text-slate-700 hover:bg-white/60 font-semibold"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    setShowWarningBaakModal(false);
                    triggerToast("Laporan Peringatan telah diteruskan ke portal BAAK!");
                  }}
                  className="px-4 py-2 text-xs bg-amber-400 text-slate-900 rounded-xl hover:bg-amber-300 font-bold transition-all shadow-md"
                >
                  Kirim Sekarang
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Kirim SP-1 */}
      <AnimatePresence>
        {showSp1Modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel backdrop-blur-2xl rounded-3xl p-6 w-full max-w-md shadow-2xl border border-white/60 flex flex-col gap-4 text-slate-800"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-300/40">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-700 flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Penerbitan Surat Peringatan (SP-1)</h3>
                    <p className="text-[11px] text-slate-600">{showSp1Modal.name} - {showSp1Modal.nim}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSp1Modal(null)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-white/40"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                Mahasiswa telah mencapai <strong>3 kali Alpha berturut-turut</strong> (kehadiran 70.0%). SP-1 akan dikirimkan ke email mahasiswa serta Dosen Pembimbing Akademik (DPA).
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-300/40">
                <button
                  onClick={() => setShowSp1Modal(null)}
                  className="px-4 py-2 text-xs glass-pill rounded-xl text-slate-700 hover:bg-white/60 font-semibold"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    triggerToast(`Surat Peringatan 1 (SP-1) berhasil dikirimkan ke ${showSp1Modal.name}`);
                    setShowSp1Modal(null);
                  }}
                  className="px-4 py-2 text-xs bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-bold transition-all shadow-md"
                >
                  Kirim SP-1
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Beri Dispensasi */}
      <AnimatePresence>
        {showDispensasiModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel backdrop-blur-2xl rounded-3xl p-6 w-full max-w-md shadow-2xl border border-white/60 flex flex-col gap-4 text-slate-800"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-300/40">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Pemberian Dispensasi / Tugas Tambahan</h3>
                  <p className="text-[11px] text-slate-600">{showDispensasiModal.name} ({showDispensasiModal.nim})</p>
                </div>
                <button
                  onClick={() => setShowDispensasiModal(null)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-white/40"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Alasan Dispensasi / Bentuk Tugas Pengganti
                </label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Mengikuti lomba resmi universitas / penyelesaian modul praktikum ekstra..."
                  className="w-full text-xs px-3 py-2 bg-white/60 border border-white/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-300/40">
                <button
                  onClick={() => setShowDispensasiModal(null)}
                  className="px-4 py-2 text-xs glass-pill rounded-xl text-slate-700 hover:bg-white/60 font-semibold"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    triggerToast(`Dispensasi disetujui untuk ${showDispensasiModal.name}`);
                    setShowDispensasiModal(null);
                  }}
                  className="px-4 py-2 text-xs bg-sky-500 text-white rounded-xl hover:bg-sky-600 font-bold transition-all shadow-md"
                >
                  Simpan Dispensasi
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Cetak BAP Kuliah Siakad */}
      <AnimatePresence>
        {showBapModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel backdrop-blur-2xl rounded-3xl p-6 w-full max-w-md shadow-2xl border border-white/60 flex flex-col gap-4 text-slate-800"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-300/40">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-800 flex items-center justify-center">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Cetak BAP Perkuliahan SIAKAD</h3>
                    <p className="text-[11px] text-slate-600">10 Sesi Kumulatif Terverifikasi</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBapModal(false)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-white/40"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-700 space-y-2">
                <p>Dokumen Berita Acara Perkuliahan (BAP) siap dicetak dengan tanda tangan digital dosen pengampu.</p>
                <div className="p-3 glass-inner rounded-xl">
                  <p className="font-bold text-slate-900">Status Verifikasi:</p>
                  <p className="text-[11px] text-emerald-800 font-semibold mt-0.5">✓ 10/10 Sesi telah divalidasi sistem</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-300/40">
                <button
                  onClick={() => setShowBapModal(false)}
                  className="px-4 py-2 text-xs glass-pill rounded-xl text-slate-700 hover:bg-white/60 font-semibold"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    setShowBapModal(false);
                    triggerToast("BAP_Perkuliahan_SIAKAD.pdf siap dicetak!");
                  }}
                  className="px-4 py-2 text-xs bg-sky-500 text-white rounded-xl hover:bg-sky-600 font-bold transition-all shadow-md"
                >
                  Cetak Dokumen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Kirim Berita Acara ke BAAK */}
      <AnimatePresence>
        {showSendBaakModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel backdrop-blur-2xl rounded-3xl p-6 w-full max-w-md shadow-2xl border border-white/60 flex flex-col gap-4 text-slate-800"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-300/40">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-800 flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Kirim Berita Acara ke BAAK</h3>
                    <p className="text-[11px] text-slate-600">Transmisi API Portal Akademik</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSendBaakModal(false)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-white/40"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                Kirimkan rekapitulasi presensi 10 sesi ini langsung ke server BAAK Universitas untuk validasi syarat ujian akhir mahasiswa.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-300/40">
                <button
                  onClick={() => setShowSendBaakModal(false)}
                  className="px-4 py-2 text-xs glass-pill rounded-xl text-slate-700 hover:bg-white/60 font-semibold"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    setShowSendBaakModal(false);
                    triggerToast("Berita Acara berhasil dikirimkan ke server BAAK!");
                  }}
                  className="px-4 py-2 text-xs bg-sky-500 text-white rounded-xl hover:bg-sky-600 font-bold transition-all shadow-md"
                >
                  Kirim ke BAAK
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Terapkan Rekomendasi Bimbingan */}
      <AnimatePresence>
        {showGuidanceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel backdrop-blur-2xl rounded-3xl p-6 w-full max-w-md shadow-2xl border border-white/60 flex flex-col gap-4 text-slate-800"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-300/40">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center">
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Rekomendasi Bimbingan Akademik AI</h3>
                    <p className="text-[11px] text-slate-600">Berdasarkan Korelasi Nilai & Presensi</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGuidanceModal(false)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-white/40"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-700 space-y-2.5 leading-relaxed">
                <p>1. Jadwalkan sesi asistensi tambahan bagi 2 mahasiswa at-risk sebelum pertemuan ke-12.</p>
                <p>2. Berikan review kode interaktif pada modul praktikum API agar mahasiswa tertinggal dapat mengejar nilai.</p>
                <p>3. Monitor kehadiran sesi 11 untuk memastikan tingkat kehadiran kembali &gt;90%.</p>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-300/40">
                <button
                  onClick={() => {
                    setShowGuidanceModal(false);
                    triggerToast("Rekomendasi bimbingan diaktifkan ke kalender dosen!");
                  }}
                  className="px-4 py-2 text-xs bg-sky-500 text-white rounded-xl hover:bg-sky-600 font-bold transition-all shadow-md"
                >
                  Terapkan Rekomendasi
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
