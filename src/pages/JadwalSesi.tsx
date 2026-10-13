import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  Calendar as CalendarIcon,
  BarChart2,
  Settings,
  HelpCircle,
  LogOut,
  RefreshCw,
  Download,
  Plus,
  DoorOpen,
  ChevronLeft,
  ChevronRight,
  Bell,
  ArrowRight,
  Upload,
  Square,
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquare,
  LayoutList,
  LayoutGrid,
  X,
  FileCheck
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface SessionItem {
  id: number;
  sessionNumber: string;
  relativeTime: string;
  dateStr: string;
  title: string;
  location: string;
  status: "ongoing" | "upcoming" | "completed";
  timeRange?: string;
  room?: string;
  stats?: {
    present: number;
    total: number;
    percentage: number;
    absent: number;
  };
  materials?: {
    name: string;
    type: "pdf" | "zip" | "ppt";
    size?: string;
  }[];
}

const initialUpcomingSessions: SessionItem[] = [
  {
    id: 11,
    sessionNumber: "11",
    relativeTime: "Mendatang (7 Hari Lagi)",
    dateStr: "Senin, 22 September 2026",
    title: "Local Storage & SQLite / Room Database Architecture",
    location: "Gedung Fakultas Ilmu Komputer Universitas Brawijaya",
    status: "upcoming",
    timeRange: "08.00 - 11.30 WIB",
    room: "Ruang 207, Gedung B",
  },
  {
    id: 12,
    sessionNumber: "12",
    relativeTime: "Mendatang (14 Hari Lagi)",
    dateStr: "Senin, 29 September 2026",
    title: "Background Services & Firebase Cloud Messaging (FCM)",
    location: "Gedung Fakultas Ilmu Komputer Universitas Brawijaya",
    status: "upcoming",
    timeRange: "08.00 - 11.30 WIB",
    room: "Ruang 207, Gedung B",
  },
  {
    id: 13,
    sessionNumber: "13",
    relativeTime: "Mendatang (21 Hari Lagi)",
    dateStr: "Senin, 6 Oktober 2026",
    title: "Persiapan Proyek Akhir & Review Desain UI/UX Native",
    location: "Gedung Fakultas Ilmu Komputer Universitas Brawijaya",
    status: "upcoming",
    timeRange: "08.00 - 11.30 WIB",
    room: "Ruang 207, Gedung B",
  },
  {
    id: 14,
    sessionNumber: "14-15",
    relativeTime: "Mendatang (28 Hari Lagi)",
    dateStr: "Senin, 13 Oktober 2026",
    title: "Persiapan Proyek Akhir & Review Desain UI/UX Native",
    location: "Gedung Fakultas Ilmu Komputer Universitas Brawijaya",
    status: "upcoming",
    timeRange: "08.00 - 11.30 WIB",
    room: "Ruang 207, Gedung B",
  },
  {
    id: 16,
    sessionNumber: "16",
    relativeTime: "Mendatang (35 Hari Lagi)",
    dateStr: "Senin, 20 Oktober 2026",
    title: "Persiapan Proyek Akhir & Review Desain UI/UX Native",
    location: "Gedung Fakultas Ilmu Komputer Universitas Brawijaya",
    status: "upcoming",
    timeRange: "08.00 - 11.30 WIB",
    room: "Ruang 207, Gedung B",
  },
];

export function JadwalSesi() {
  const navigate = useNavigate();
  const { dosen, logout } = useAuth();

  // State
  const [filterTab, setFilterTab] = useState<"semua" | "hariIni" | "akanDatang">("semua");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<SessionItem | null>(null);
  const [showCloseSessionModal, setShowCloseSessionModal] = useState(false);
  const [showBapModal, setShowBapModal] = useState(false);

  // New session form
  const [newSesi, setNewSesi] = useState({
    sessionNumber: "17",
    title: "",
    dateStr: "2026-10-27",
    timeRange: "08.00 - 11.30 WIB",
    room: "Ruang 207, Gedung B",
    isReplacement: false,
  });

  const [upcomingSessions, setUpcomingSessions] = useState<SessionItem[]>(initialUpcomingSessions);
  const [activeSessionEnded, setActiveSessionEnded] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return "YK";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const navItems = [
    { icon: <Radio className="w-4 h-4" />, label: "Live Monitoring", active: false, path: "/" },
    { icon: <CalendarIcon className="w-4 h-4" />, label: "Jadwal Sesi", active: true, path: "/jadwal-sesi" },
    { icon: <BarChart2 className="w-4 h-4" />, label: "Statistik Kelas", active: false, path: "/statistik-kelas" },
    { icon: <Settings className="w-4 h-4" />, label: "Pengaturan Kuota", active: false, path: "/pengaturan-kuota" },
  ];

  const handleSyncSiakad = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncToast("Sinkronisasi SIAKAD Berhasil! Data 16 sesi dan RPS telah terbarui.");
      setTimeout(() => setSyncToast(null), 4000);
    }, 1200);
  };

  const handleDownloadRps = () => {
    setSyncToast("Mengunduh Silabus_dan_RPS_Pemrograman_Mobile_A.pdf...");
    setTimeout(() => setSyncToast(null), 3000);
  };

  const handleAddSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSesi.title.trim()) return;

    const newItem: SessionItem = {
      id: Date.now(),
      sessionNumber: newSesi.sessionNumber,
      relativeTime: newSesi.isReplacement ? "Kelas Pengganti" : "Mendatang",
      dateStr: newSesi.dateStr,
      title: newSesi.title,
      location: "Gedung Fakultas Ilmu Komputer Universitas Brawijaya",
      status: "upcoming",
      timeRange: newSesi.timeRange,
      room: newSesi.room,
    };

    setUpcomingSessions((prev) => [...prev, newItem]);
    setShowScheduleModal(false);
    setSyncToast(`Sesi ${newSesi.sessionNumber} berhasil ditambahkan!`);
    setTimeout(() => setSyncToast(null), 3500);
    setNewSesi({
      sessionNumber: String(Number(newSesi.sessionNumber) + 1 || 18),
      title: "",
      dateStr: "2026-11-03",
      timeRange: "08.00 - 11.30 WIB",
      room: "Ruang 207, Gedung B",
      isReplacement: false,
    });
  };

  // Filtered upcoming
  const displayedUpcoming = upcomingSessions.filter(() => {
    if (filterTab === "hariIni") return false; // Upcoming are not today
    return true;
  });

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
        {syncToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 bg-sky-900/90 backdrop-blur-md text-white text-sm font-semibold px-4 py-3 rounded-2xl shadow-xl border border-sky-400/40 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncToast}</span>
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
            onClick={() => setShowBapModal(true)}
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
      <main className="flex-1 overflow-y-auto px-7 py-5 flex flex-col gap-5">
        {/* Top Header Pill & User Avatar */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2.5 bg-white/70 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/70 shadow-sm">
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

        {/* Breadcrumb, Title & Top Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1.5 opacity-90">
              <span>Beranda</span>
              <span>&gt;</span>
              <span>Teknik Informatika</span>
              <span>&gt;</span>
              <span>Pemrograman Mobile A</span>
              <span>&gt;</span>
              <span className="text-sky-900 font-bold">Jadwal Sesi</span>
            </p>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Jadwal Sesi Perkuliahan
            </h2>
            <p className="text-xs text-slate-700 mt-0.5">
              Kelola 16 pertemuan semester, sesi pengganti, RPS dan agenda perkuliahan aktif.
            </p>
          </div>

          {/* 3 Top Action Buttons */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={handleSyncSiakad}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/60 hover:bg-white/80 backdrop-blur-sm text-sky-800 border border-white/70 shadow-sm transition-all flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-700 ${isSyncing ? "animate-spin" : ""}`} />
              Sinkronisasi SIAKAD
            </button>

            <button
              onClick={handleDownloadRps}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/60 hover:bg-white/80 backdrop-blur-sm text-sky-800 border border-white/70 shadow-sm transition-all flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5 text-sky-700" />
              Unduh Silabus & RPS
            </button>

            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Jadwalkan sesi/ Kelas pengganti
            </button>
          </div>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Pertemuan Semester */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white/70 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-wider text-slate-600 uppercase">
                PERTEMUAN SEMESTER
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-900 leading-none">16</span>
                <span className="text-xs font-semibold text-slate-600">Sesi Total</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              <span className="bg-sky-100/90 text-sky-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                10 Selesai
              </span>
              <span className="bg-emerald-100/90 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                1 Hari ini
              </span>
              <span className="bg-sky-100/90 text-sky-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                5 Sisa sesi
              </span>
            </div>
          </div>

          {/* Card 2: Progress RPS & Materi */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white/70 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-wider text-slate-600 uppercase">
                PROGRESS RPS & MATERI
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-900 leading-none">62.5%</span>
                <span className="text-[10px] font-bold text-emerald-600">+6.2%</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-400 to-sky-600 h-1.5 rounded-full"
                  style={{ width: "62.5%" }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Rata-Rata Kehadiran */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white/70 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-wider text-slate-600 uppercase">
                RATA-RATA KEHADIRAN
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-900 leading-none">92.5%</span>
                <span className="text-[10px] font-bold text-slate-500">Target &gt;80%</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-600 mt-3 truncate font-medium">
              Memenuhi batas akreditasi prodi
            </p>
          </div>

          {/* Card 4: Minggu Perkuliahan */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white/70 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-wider text-slate-600 uppercase">
                MINGGU PERKULIAHAN
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-900 leading-none">M-10</span>
                <span className="text-[10px] font-semibold text-slate-600">Periode Pra-UAS</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-600 mt-3 truncate font-medium">
              Sisa 6 pekan sebelum evaluasi akhir
            </p>
          </div>
        </div>

        {/* Filter Pills & View Mode Bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-white/40 p-1 rounded-2xl backdrop-blur-sm border border-white/50">
            <button
              onClick={() => setFilterTab("semua")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterTab === "semua"
                  ? "bg-sky-800 text-white shadow-sm"
                  : "text-slate-700 hover:bg-white/30"
              }`}
            >
              <span>Semua sesi</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                filterTab === "semua" ? "bg-sky-950 text-white" : "bg-white/60 text-slate-700"
              }`}>
                16
              </span>
            </button>

            <button
              onClick={() => setFilterTab("hariIni")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterTab === "hariIni"
                  ? "bg-sky-800 text-white shadow-sm"
                  : "text-slate-700 hover:bg-white/30"
              }`}
            >
              <span>Hari ini</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                filterTab === "hariIni" ? "bg-sky-950 text-white" : "bg-white/60 text-slate-700"
              }`}>
                1
              </span>
            </button>

            <button
              onClick={() => setFilterTab("akanDatang")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterTab === "akanDatang"
                  ? "bg-sky-800 text-white shadow-sm"
                  : "text-slate-700 hover:bg-white/30"
              }`}
            >
              <span>Akan datang</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                filterTab === "akanDatang" ? "bg-sky-950 text-white" : "bg-white/60 text-slate-700"
              }`}>
                5
              </span>
            </button>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-white/40 p-1 rounded-xl backdrop-blur-sm border border-white/50">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg text-slate-700 transition-all ${
                viewMode === "list" ? "bg-white/80 shadow-sm text-sky-800" : "hover:bg-white/30"
              }`}
              title="Tampilan List"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-slate-700 transition-all ${
                viewMode === "grid" ? "bg-white/80 shadow-sm text-sky-800" : "hover:bg-white/30"
              }`}
              title="Tampilan Grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2-Column Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column (approx 7.2 cols / 60-65%) */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            {/* Active Session Card (Sesi 10) - hidden if filter is akanDatang */}
            {filterTab !== "akanDatang" && (
              <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-white/85 shadow-md flex flex-col gap-4">
                {/* Header row with Badge Sesi 10 & Session status info */}
                <div className="flex items-start gap-4">
                  <div className="w-13 h-13 rounded-2xl bg-sky-600 text-white flex flex-col items-center justify-center shrink-0 shadow-md">
                    <span className="text-[10px] font-semibold tracking-wider uppercase leading-none opacity-90">
                      Sesi
                    </span>
                    <span className="text-xl font-black leading-none mt-1">10</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 text-[11px] text-slate-600 mb-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        {activeSessionEnded ? "Sesi Selesai" : "Sedang Berlangsung"}
                      </span>
                      <span>08.00 - 11.30 WIB</span>
                      <span>•</span>
                      <span>Pertemuan ke-10</span>
                      <span>•</span>
                      <span>Ruang 207, Gedung B</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      Integrasi REST API & State Management Flutter / Kotlin
                    </h3>
                  </div>
                </div>

                {/* Sub sections: Presensi Masuk & Materi / Starter Kode */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-200/60">
                  {/* Presensi Masuk */}
                  <div className="bg-sky-50/70 rounded-2xl p-3 border border-sky-100 flex flex-col justify-between">
                    <p className="text-[11px] font-bold text-slate-600">Presensi Masuk</p>
                    <div className="flex items-baseline gap-2 my-1">
                      <span className="text-2xl font-black text-slate-900">38</span>
                      <span className="text-xs font-semibold text-slate-500">/ 42 Mahasiswa</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-100 text-emerald-800 font-black text-[10px] px-2 py-0.5 rounded-full">
                        90.5%
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        4 Belum Absen
                      </span>
                    </div>
                  </div>

                  {/* Materi & Starter Kode Perkuliahan */}
                  <div className="bg-sky-50/70 rounded-2xl p-3 border border-sky-100 flex flex-col justify-between">
                    <p className="text-[11px] font-bold text-slate-600">
                      Materi & Starter Kode Perkuliahan :
                    </p>
                    <div className="flex flex-col gap-1.5 mt-1.5">
                      <a
                        href="#download-pdf"
                        onClick={(e) => {
                          e.preventDefault();
                          setSyncToast("Mengunduh PPT_Modul_10_REST_API.pdf...");
                        }}
                        className="flex items-center gap-2 text-xs text-sky-800 hover:text-sky-950 font-semibold truncate hover:underline"
                      >
                        <span className="bg-red-500 text-white text-[9px] font-black px-1 py-0.2 rounded">
                          PPT
                        </span>
                        <span className="truncate">PPT_Modul_10_REST_API.pdf</span>
                      </a>
                      <a
                        href="#download-zip"
                        onClick={(e) => {
                          e.preventDefault();
                          setSyncToast("Mengunduh Starter_Code_Repo.zip...");
                        }}
                        className="flex items-center gap-2 text-xs text-sky-800 hover:text-sky-950 font-semibold truncate hover:underline"
                      >
                        <span className="bg-amber-500 text-white text-[9px] font-black px-1 py-0.2 rounded">
                          ZIP
                        </span>
                        <span className="truncate">Starter_Code_Repo.zip</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Session Action Buttons */}
                <div className="flex items-center flex-wrap gap-2.5 pt-2">
                  <button
                    onClick={() => navigate("/")}
                    className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    Masuk live monitoring presensi
                  </button>

                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-white/70 hover:bg-white text-sky-800 border border-sky-200 font-bold text-xs shadow-sm transition-all flex items-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5 text-sky-600" />
                    Unggah Materi / Tugas
                  </button>

                  <button
                    onClick={() => setShowCloseSessionModal(true)}
                    className="px-3.5 py-2.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs transition-all flex items-center gap-1.5 ml-auto"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    Tutup sesi kuliah
                  </button>
                </div>
              </div>
            )}

            {/* Upcoming Sessions Section ("Sesi Perkuliahan Mendatang") */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-slate-800" />
                  <h3 className="text-base font-bold text-slate-900">
                    Sesi Perkuliahan Mendatang
                  </h3>
                </div>
                <span className="text-xs font-semibold text-slate-700">
                  Semester Ganjil 2025/2026
                </span>
              </div>

              {/* Sessions List */}
              <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-3" : "flex flex-col gap-2.5"}>
                {displayedUpcoming.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white/75 hover:bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-white/75 shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-sky-700 text-white flex flex-col items-center justify-center shrink-0 shadow-sm">
                        <span className="text-[9px] font-semibold tracking-wider uppercase leading-none opacity-90">
                          Sesi
                        </span>
                        <span className="text-sm font-black leading-none mt-1">
                          {item.sessionNumber}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center flex-wrap gap-2 text-[11px] mb-1">
                          <span className="bg-sky-100/90 text-sky-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            {item.relativeTime}
                          </span>
                          <span className="text-slate-600 font-medium">
                            {item.dateStr}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                          {item.location}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowDetailModal(item)}
                      className="px-3.5 py-1.5 rounded-xl bg-white/70 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/80 text-xs font-bold transition-all shrink-0 self-end md:self-center"
                    >
                      Lihat Detail
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (approx 4 cols / 35-40%) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Calendar Card Widget */}
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-4 border border-white/85 shadow-md">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-slate-800" />
                  <span className="text-xs font-black tracking-wider uppercase text-slate-900">
                    SEPTEMBER 2026
                  </span>
                </div>
                <div className="flex items-center gap-1 text-slate-600">
                  <button className="p-1 hover:bg-slate-100 rounded-lg transition-all">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button className="p-1 hover:bg-slate-100 rounded-lg transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Calendar Day Headers */}
              <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-700 mb-2">
                <span>Min</span>
                <span>Sen</span>
                <span>Sel</span>
                <span>Rab</span>
                <span>Kam</span>
                <span>Jum</span>
                <span>Sab</span>
              </div>

              {/* Calendar Grid (September 2026) */}
              <div className="grid grid-cols-7 text-center text-xs font-semibold gap-y-1.5 text-slate-700">
                <span className="text-slate-400 py-1">31</span>
                <span className="py-1">1</span>
                <span className="py-1">2</span>
                <span className="py-1">3</span>
                <span className="py-1">4</span>
                <span className="py-1">5</span>
                <span className="py-1">6</span>

                <span className="py-1">7</span>
                <span className="py-1">8</span>
                <span className="py-1">9</span>
                <span className="py-1">10</span>
                <span className="py-1">11</span>
                <span className="py-1">12</span>
                <span className="py-1">13</span>

                <span className="py-1">14</span>
                {/* 15: Hari ini (Blue pill) */}
                <span className="py-1">
                  <span className="inline-flex w-7 h-7 rounded-lg bg-sky-500 text-white font-bold items-center justify-center shadow-sm">
                    15
                  </span>
                </span>
                <span className="py-1">16</span>
                <span className="py-1">17</span>
                {/* 18: Kelas Pengganti (Yellow pill) */}
                <span className="py-1">
                  <span className="inline-flex w-7 h-7 rounded-lg bg-amber-400 text-slate-900 font-bold items-center justify-center shadow-sm">
                    18
                  </span>
                </span>
                <span className="py-1">19</span>
                <span className="py-1">20</span>

                <span className="py-1">21</span>
                <span className="py-1">22</span>
                <span className="py-1">23</span>
                <span className="py-1">24</span>
                <span className="py-1">25</span>
                <span className="py-1">26</span>
                <span className="py-1">27</span>

                <span className="py-1">28</span>
                <span className="py-1">29</span>
                <span className="py-1">30</span>
                <span className="text-slate-400 py-1">1</span>
                <span className="text-slate-400 py-1">2</span>
                <span className="text-slate-400 py-1">3</span>
                <span className="text-slate-400 py-1">4</span>
              </div>

              {/* Calendar Legend */}
              <div className="flex items-center justify-center gap-4 mt-3 pt-2.5 border-t border-slate-200/60 text-[10px] font-semibold text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  <span>Hari ini</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Kelas pengganti</span>
                </div>
              </div>
            </div>

            {/* Pengingat Regulasi BAAK Card */}
            <div className="bg-sky-100/85 backdrop-blur-md rounded-2xl p-3.5 border border-sky-200/80 shadow-sm flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sky-950 font-black text-xs tracking-wider uppercase">
                <Bell className="w-3.5 h-3.5 text-sky-700" />
                <span>PENGINGAT REGULASI BAAK</span>
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                Pengisian <strong className="text-slate-900 font-bold">Berita Acara Perkuliahan (BAP)</strong> wajib ditandatangani digital paling lambat H+1 (24 Jam) setelah sesi berakhir agar hak presensi mahasiswa terverifikasi di portal SIM-Akademik.
              </p>
              <div className="flex items-center justify-between text-[10px] pt-1 border-t border-sky-200/60">
                <span className="text-slate-600 font-semibold">
                  Batas Sesi 10 : Besok, 10:30 WIB
                </span>
                <button
                  onClick={() => setShowBapModal(true)}
                  className="text-sky-800 hover:text-sky-950 font-bold flex items-center gap-1 hover:underline"
                >
                  Panduan BAP <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Detail Kelas Hari Ini Card */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-white/85 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900">Detail Kelas Hari Ini</h4>
                <span className="text-[10px] font-semibold text-slate-500">
                  Senin, 15 September 2026
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {/* Item 1: Kelas T3B */}
                <div className="bg-sky-50/70 hover:bg-sky-50 rounded-xl p-2.5 border border-sky-100/80 flex items-center gap-3 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex flex-col items-center justify-center shrink-0">
                    <span className="text-[7px] font-bold uppercase leading-none opacity-90">Sesi</span>
                    <span className="text-xs font-black leading-none mt-0.5">10</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900">Kelas T3B</p>
                      <span className="text-[10px] font-semibold text-slate-500">10.20 - 12.00</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Ruang 305 • 3 SKS • Gedung A</p>
                  </div>
                </div>

                {/* Item 2: Kelas T3C */}
                <div className="bg-sky-50/70 hover:bg-sky-50 rounded-xl p-2.5 border border-sky-100/80 flex items-center gap-3 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex flex-col items-center justify-center shrink-0">
                    <span className="text-[7px] font-bold uppercase leading-none opacity-90">Sesi</span>
                    <span className="text-xs font-black leading-none mt-0.5">10</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900">Kelas T3C</p>
                      <span className="text-[10px] font-semibold text-slate-500">13.00 - 15.30</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Ruang 101 • 3 SKS • Gedung A</p>
                  </div>
                </div>

                {/* Item 3: Kelas T3D */}
                <div className="bg-sky-50/70 hover:bg-sky-50 rounded-xl p-2.5 border border-sky-100/80 flex items-center gap-3 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex flex-col items-center justify-center shrink-0">
                    <span className="text-[7px] font-bold uppercase leading-none opacity-90">Sesi</span>
                    <span className="text-xs font-black leading-none mt-0.5">10</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900">Kelas T3D</p>
                      <span className="text-[10px] font-semibold text-slate-500">15.30 - 16.50</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Ruang 701 • 3 SKS • Gedung A</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Asisten Dosen (TA) Card */}
            <div className="bg-white/75 backdrop-blur-md rounded-2xl p-3 border border-white/80 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-sky-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                  {dosen ? getInitials(dosen.username) : "YK"}
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 leading-tight">
                    Asisten Dosen (TA)
                  </p>
                  <p className="text-xs font-bold text-slate-900 leading-tight mt-0.5">
                    {dosen?.username ?? "Yurii Kharlistov, M.T."}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    NIP: 123456789098761
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSyncToast("Menghubungkan pesan dengan Asisten Dosen...")}
                className="w-8 h-8 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center shadow-sm transition-all"
                title="Kirim pesan ke Asisten Dosen"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modal: Jadwalkan Sesi / Kelas Pengganti */}
      <AnimatePresence>
        {showScheduleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 flex flex-col gap-4 text-slate-800"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Jadwalkan Sesi / Kelas Pengganti</h3>
                    <p className="text-[11px] text-slate-500">Mata Kuliah Pemrograman Mobile A</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddSessionSubmit} className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Pertemuan Ke-
                    </label>
                    <input
                      type="text"
                      value={newSesi.sessionNumber}
                      onChange={(e) => setNewSesi({ ...newSesi, sessionNumber: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Jenis Pertemuan
                    </label>
                    <select
                      value={newSesi.isReplacement ? "pengganti" : "reguler"}
                      onChange={(e) =>
                        setNewSesi({ ...newSesi, isReplacement: e.target.value === "pengganti" })
                      }
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="reguler">Sesi Reguler</option>
                      <option value="pengganti">Kelas Pengganti</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Judul Materi / Agenda Sesi
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Testing & Deployment Flutter App"
                    value={newSesi.title}
                    onChange={(e) => setNewSesi({ ...newSesi, title: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Tanggal
                    </label>
                    <input
                      type="date"
                      value={newSesi.dateStr}
                      onChange={(e) => setNewSesi({ ...newSesi, dateStr: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Jam Kuliah
                    </label>
                    <input
                      type="text"
                      value={newSesi.timeRange}
                      onChange={(e) => setNewSesi({ ...newSesi, timeRange: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Ruangan & Gedung
                  </label>
                  <input
                    type="text"
                    value={newSesi.room}
                    onChange={(e) => setNewSesi({ ...newSesi, room: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 text-xs border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs bg-sky-500 text-white rounded-xl hover:bg-sky-600 font-bold transition-all shadow-md"
                  >
                    Simpan Sesi
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Unggah Materi / Tugas */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 flex flex-col gap-4 text-slate-800"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Unggah Materi / Starter Code</h3>
                    <p className="text-[11px] text-slate-500">Sesi 10: Integrasi REST API</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="border-2 border-dashed border-sky-200 rounded-2xl p-6 text-center hover:bg-sky-50/50 transition-all cursor-pointer">
                <Upload className="w-8 h-8 text-sky-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">
                  Tarik file ke sini atau <span className="text-sky-600 underline">pilih dari komputer</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Mendukung file PDF, PPTX, ZIP, RAR hingga 50 MB
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSyncToast("Materi perkuliahan berhasil diunggah!");
                    setTimeout(() => setSyncToast(null), 3000);
                  }}
                  className="px-4 py-2 text-xs bg-sky-500 text-white rounded-xl hover:bg-sky-600 font-bold transition-all shadow-md"
                >
                  Unggah Sekarang
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Lihat Detail Sesi */}
      <AnimatePresence>
        {showDetailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 flex flex-col gap-4 text-slate-800"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex flex-col items-center justify-center font-black">
                    <span className="text-[9px] uppercase leading-none opacity-90">Sesi</span>
                    <span className="text-sm">{showDetailModal.sessionNumber}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{showDetailModal.title}</h3>
                    <p className="text-[11px] text-slate-500">{showDetailModal.relativeTime}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <CalendarIcon className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>{showDetailModal.dateStr}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>{showDetailModal.timeRange ?? "08.00 - 11.30 WIB"}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>{showDetailModal.room ?? "Ruang 207, Gedung B"}</span>
                </div>
                <div className="bg-sky-50 p-3 rounded-2xl border border-sky-100">
                  <p className="text-[11px] font-bold text-sky-900 mb-1">Capaian Pembelajaran (RPS):</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Mahasiswa mampu memahami konsep arsitektur state management dan integrasi modul RESTful API secara modular dan asynchronous.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowDetailModal(null)}
                  className="px-4 py-2 text-xs border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(null);
                    setShowUploadModal(true);
                  }}
                  className="px-4 py-2 text-xs bg-sky-500 text-white rounded-xl hover:bg-sky-600 font-bold transition-all shadow-md"
                >
                  Kelola Materi Sesi
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Tutup Sesi Kuliah Confirmation */}
      <AnimatePresence>
        {showCloseSessionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 flex flex-col gap-4 text-slate-800"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <Square className="w-6 h-6 fill-current" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-slate-900 text-base">Tutup Sesi Perkuliahan?</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Presensi Sesi 10 akan difinalisasi. Mahasiswa yang belum presensi akan ditandai Alpha dan Berita Acara (BAP) siap ditandatangani.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCloseSessionModal(false)}
                  className="flex-1 py-2.5 text-xs border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    setActiveSessionEnded(true);
                    setShowCloseSessionModal(false);
                    setSyncToast("Sesi 10 berhasil ditutup. Silakan tandatangani BAP.");
                    setTimeout(() => setSyncToast(null), 3500);
                  }}
                  className="flex-1 py-2.5 text-xs bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold transition-all shadow-md"
                >
                  Ya, Tutup Sesi
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Panduan BAP */}
      <AnimatePresence>
        {showBapModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 flex flex-col gap-4 text-slate-800"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Panduan Regulasi BAP BAAK</h3>
                    <p className="text-[11px] text-slate-500">Standar Operasional Presensi Dosen</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBapModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
                <p>
                  1. Setiap dosen pengampu diwajibkan menutup sesi presensi maksimal 30 menit setelah jam perkuliahan selesai.
                </p>
                <p>
                  2. BAP yang telah terbit wajib ditandatangani secara elektronik (e-Sign) melalui menu SIM-Akademik sebelum batas waktu H+1.
                </p>
                <p>
                  3. Presensi mahasiswa yang valid akan langsung disinkronkan ke rekapitulasi kehadiran semester.
                </p>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowBapModal(false)}
                  className="px-4 py-2 text-xs bg-sky-500 text-white rounded-xl hover:bg-sky-600 font-bold transition-all"
                >
                  Mengerti
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
