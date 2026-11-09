import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  Calendar as CalendarIcon,
  BarChart2,
  Settings,
  HelpCircle,
  LogOut,
  RotateCw,
  Plus,
  Search,
  ChevronDown,
  List,
  CalendarDays,
  Edit3,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Bell,
  X,
  CheckCircle2,
  FileText,
  BookOpen,
  CalendarCheck,
  Save,
  FileSpreadsheet,
  UploadCloud,
  Download,
  Check,
  Loader2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { kelasApi } from "../lib/api";

export interface JadwalItem {
  id: number | string;
  sesi: number;
  mataKuliah: string;
  kelas: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  ruangan: string;
  status: "ongoing" | "upcoming" | "replacement" | "completed";
  jenisPerubahan?: string;
  alasanPerubahan?: string;
  kelasId?: string;
  totalMahasiswa?: number;
}

const initialJadwalList: JadwalItem[] = [
  {
    id: 10,
    sesi: 10,
    mataKuliah: "Integrasi REST API & State Management Flutter / Kotlin",
    kelas: "T3A",
    tanggal: "15 September 2026",
    jamMulai: "08.00 WIB",
    jamSelesai: "10.30 WIB",
    ruangan: "Ruang 207",
    status: "ongoing",
    jenisPerubahan: "Perubahan jadwal reguler",
    alasanPerubahan: "Sesi berjalan normal sesuai kalender akademik.",
  },
  {
    id: 11,
    sesi: 11,
    mataKuliah: "Local Storage & SQLite / Room Database Architecture",
    kelas: "T3A",
    tanggal: "22 September 2026",
    jamMulai: "08.00 WIB",
    jamSelesai: "10.30 WIB",
    ruangan: "Ruang 305",
    status: "upcoming",
    jenisPerubahan: "Perubahan jadwal reguler",
    alasanPerubahan: "Menyesuaikan dengan jadwal narasumber.",
  },
  {
    id: 12,
    sesi: 12,
    mataKuliah: "Background Services & Firebase Cloud Messaging (FCM)",
    kelas: "T3A",
    tanggal: "29 September 2026",
    jamMulai: "08.00 WIB",
    jamSelesai: "10.30 WIB",
    ruangan: "Ruang 101",
    status: "upcoming",
    jenisPerubahan: "Perubahan jadwal reguler",
    alasanPerubahan: "Pemanfaatan Lab Cloud Computing.",
  },
  {
    id: 13,
    sesi: 13,
    mataKuliah: "Kelas Pengganti - State Management Flutter",
    kelas: "T3A",
    tanggal: "02 Oktober 2026",
    jamMulai: "13.00 WIB",
    jamSelesai: "15.30 WIB",
    ruangan: "Ruang 207",
    status: "replacement",
    jenisPerubahan: "Penjadwalan kelas pengganti",
    alasanPerubahan: "Menggantikan sesi yang tertunda libur nasional.",
  },
  {
    id: 14,
    sesi: 14,
    mataKuliah: "Persiapan Proyek Akhir & Review Desain UI/UX Native",
    kelas: "T3A",
    tanggal: "06 Oktober 2026",
    jamMulai: "08.00 WIB",
    jamSelesai: "10.30 WIB",
    ruangan: "Ruang 305",
    status: "upcoming",
    jenisPerubahan: "Perubahan jadwal reguler",
    alasanPerubahan: "Sesi persiapan evaluasi akhir semester.",
  },
];

export const ManajemenJadwal = () => {
  const navigate = useNavigate();
  const { dosen, logout } = useAuth();

  // Schedule data state
  const [jadwalList, setJadwalList] = useState<JadwalItem[]>(initialJadwalList);
  const [isLoading, setIsLoading] = useState(false);

  // Filters & Views
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("Semua Kelas");
  const [selectedStatus, setSelectedStatus] = useState("Semua Status");
  const [viewMode, setViewMode] = useState<"daftar" | "kalender">("daftar");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [editingJadwal, setEditingJadwal] = useState<JadwalItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<JadwalItem | null>(null);
  const [showBapGuideModal, setShowBapGuideModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Import Modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<any | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [sendActivationEmail, setSendActivationEmail] = useState(true);

  // Fetch real data from backend
  const fetchJadwal = async () => {
    try {
      setIsLoading(true);
      const res = await kelasApi.getAll();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: JadwalItem[] = [];
        let globalSesi = 1;

        res.data.forEach((k: any) => {
          const jadwals = k.jadwals || k.jadwal || [];
          if (jadwals.length > 0) {
            jadwals.forEach((j: any) => {
              mapped.push({
                id: j.id || `${k.id}-${globalSesi}`,
                sesi: globalSesi++,
                mataKuliah: k.nama,
                kelas: k.kode,
                tanggal: j.hari ? `${j.hari}` : "Reguler",
                jamMulai: j.jamMulai ? `${j.jamMulai} WIB` : "08:00 WIB",
                jamSelesai: j.jamSelesai ? `${j.jamSelesai} WIB` : "10:30 WIB",
                ruangan: j.ruangan || "Lab / Ruang Kelas",
                status: "upcoming",
                jenisPerubahan: "Jadwal Semester Reguler",
                alasanPerubahan: k.deskripsi || "Jadwal resmi terdaftar",
                kelasId: k.id,
                totalMahasiswa: k.totalMahasiswa || k._count?.mahasiswas || 0,
              });
            });
          } else {
            mapped.push({
              id: k.id,
              sesi: globalSesi++,
              mataKuliah: k.nama,
              kelas: k.kode,
              tanggal: "Belum Diatur",
              jamMulai: "-",
              jamSelesai: "-",
              ruangan: "Belum Ditentukan",
              status: "upcoming",
              jenisPerubahan: "Jadwal Belum Diatur",
              alasanPerubahan: k.deskripsi || "Silakan tambahkan jadwal sesi",
              kelasId: k.id,
              totalMahasiswa: k.totalMahasiswa || k._count?.mahasiswas || 0,
            });
          }
        });

        if (mapped.length > 0) {
          setJadwalList(mapped);
        }
      }
    } catch (err: any) {
      console.error("Gagal memuat jadwal dari server:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJadwal();
  }, []);

  const handleDownloadTemplate = () => {
    const csvHeader = "kode_kelas,nama_kelas,hari,jam_mulai,jam_selesai,ruangan,nim,nama_mahasiswa,jurusan,email\n";
    const sampleRows = [
      "IF101,Algoritma Pemrograman,SENIN,08:00,10:30,Lab Komputer 1,202401001,Budi Santoso,Teknik Informatika,budi@kampus.ac.id",
      "IF101,Algoritma Pemrograman,SENIN,08:00,10:30,Lab Komputer 1,202401002,Siti Aminah,Teknik Informatika,siti@kampus.ac.id",
      "IF201,Basis Data,RABU,13:00,15:30,Ruang Teori 302,202401001,Budi Santoso,Teknik Informatika,budi@kampus.ac.id",
    ].join("\n");
    const blob = new Blob([csvHeader + sampleRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "template_import_jadwal.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Template CSV berhasil diunduh!");
  };

  const handleExecuteImport = async () => {
    if (!importFile) {
      showToast("Pilih file .xlsx atau .csv terlebih dahulu!");
      return;
    }

    setIsImporting(true);
    setImportSummary(null);

    try {
      const res = await kelasApi.importFile(importFile, sendActivationEmail);
      if (res.success && res.data) {
        setImportSummary(res.data);
        showToast("Import data berhasil diproses!");
        await fetchJadwal();
      } else {
        showToast(res.message || "Import selesai dengan catatan.");
      }
    } catch (err: any) {
      showToast(err.message || "Gagal mengimpor file.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchJadwal();
    setIsRefreshing(false);
    showToast("Data jadwal perkuliahan berhasil diperbarui!");
  };

  // Edit form state
  const [editForm, setEditForm] = useState({
    mataKuliah: "",
    tanggal: "22 September 2026",
    kelas: "T3A",
    jamMulai: "08.00 WIB",
    jamSelesai: "10.30 WIB",
    ruangan: "Ruang 305",
    jenisPerubahan: "Perubahan jadwal reguler",
    alasanPerubahan: "Menyesuaikan dengan jadwal narasumber.",
  });

  // New Schedule form state
  const [newForm, setNewForm] = useState({
    mataKuliah: "Mobile Programming Advanced & CI/CD",
    kelas: "T3A",
    tanggal: "2026-10-13",
    jamMulai: "08.00 WIB",
    jamSelesai: "10.30 WIB",
    ruangan: "Ruang 207",
    status: "upcoming" as JadwalItem["status"],
    jenisPerubahan: "Perubahan jadwal reguler",
    alasanPerubahan: "",
  });

  const getInitials = (name?: string) => {
    if (!name) return "A";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const navItems = [
    { icon: <Radio className="w-4 h-4" />, label: "Live Monitoring", active: false, path: "/" },
    { icon: <CalendarIcon className="w-4 h-4" />, label: "Jadwal Sesi", active: false, path: "/jadwal-sesi" },
    { icon: <CalendarDays className="w-4 h-4" />, label: "Manajemen Jadwal", active: true, path: "/manajemen-jadwal" },
    { icon: <BarChart2 className="w-4 h-4" />, label: "Statistik Kelas", active: false, path: "/statistik-kelas" },
    { icon: <Settings className="w-4 h-4" />, label: "Pengaturan Kuota", active: false, path: "/pengaturan-kuota" },
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };


  const openEditModal = (item: JadwalItem) => {
    setEditingJadwal(item);
    setEditForm({
      mataKuliah: item.mataKuliah,
      tanggal: item.tanggal,
      kelas: item.kelas,
      jamMulai: item.jamMulai,
      jamSelesai: item.jamSelesai,
      ruangan: item.ruangan,
      jenisPerubahan: item.jenisPerubahan || "Perubahan jadwal reguler",
      alasanPerubahan: item.alasanPerubahan || "Menyesuaikan dengan jadwal narasumber.",
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJadwal) return;

    setJadwalList((prev) =>
      prev.map((item) =>
        item.id === editingJadwal.id
          ? {
              ...item,
              tanggal: editForm.tanggal,
              kelas: editForm.kelas,
              jamMulai: editForm.jamMulai,
              jamSelesai: editForm.jamSelesai,
              ruangan: editForm.ruangan,
              jenisPerubahan: editForm.jenisPerubahan,
              alasanPerubahan: editForm.alasanPerubahan,
            }
          : item
      )
    );

    setEditingJadwal(null);
    showToast(`Perubahan Sesi ${editingJadwal.sesi} berhasil disimpan & notifikasi terkirim!`);
  };

  const handleCreateJadwal = (e: React.FormEvent) => {
    e.preventDefault();
    const nextSesi = Math.max(...jadwalList.map((j) => j.sesi), 0) + 1;
    const newItem: JadwalItem = {
      id: Date.now(),
      sesi: nextSesi,
      mataKuliah: newForm.mataKuliah,
      kelas: newForm.kelas,
      tanggal: newForm.tanggal,
      jamMulai: newForm.jamMulai,
      jamSelesai: newForm.jamSelesai,
      ruangan: newForm.ruangan,
      status: newForm.status,
      jenisPerubahan: newForm.jenisPerubahan,
      alasanPerubahan: newForm.alasanPerubahan,
    };

    setJadwalList((prev) => [...prev, newItem]);
    setShowAddModal(false);
    showToast(`Jadwal baru Sesi ${nextSesi} (${newForm.mataKuliah}) berhasil ditambahkan!`);
  };

  // Filtered jadwal list
  const filteredJadwal = jadwalList.filter((item) => {
    const matchSearch =
      item.mataKuliah.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ruangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.sesi).includes(searchTerm);

    const matchKelas = selectedKelas === "Semua Kelas" || item.kelas === selectedKelas;
    
    let matchStatus = true;
    if (selectedStatus === "Sedang Berlangsung") matchStatus = item.status === "ongoing";
    else if (selectedStatus === "Akan Datang") matchStatus = item.status === "upcoming";
    else if (selectedStatus === "Kelas Pengganti") matchStatus = item.status === "replacement";
    else if (selectedStatus === "Selesai") matchStatus = item.status === "completed";

    return matchSearch && matchKelas && matchStatus;
  });

  const getStatusBadge = (status: JadwalItem["status"]) => {
    switch (status) {
      case "ongoing":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Sedang Berlangsung
          </span>
        );
      case "upcoming":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-700 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            Akan Datang
          </span>
        );
      case "replacement":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Kelas Pengganti
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Selesai
          </span>
        );
    }
  };

  return (
    <div
      className="min-h-screen flex text-slate-800 relative overflow-hidden"
      style={{
        background: "linear-gradient(145deg, #38bdf8 0%, #29b6f6 30%, #0ea5e9 70%, #0284c7 100%)",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Decorative ambient blobs */}
      <div className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 bg-white/15 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/3 w-72 h-72 bg-sky-200/20 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 w-96 h-96 bg-white/15 rounded-full blur-3xl" />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 bg-white/95 backdrop-blur-md text-slate-800 text-sm font-semibold px-4 py-3 rounded-2xl shadow-xl border border-sky-200 flex items-center gap-2.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className="w-60 shrink-0 flex flex-col py-6 px-4 gap-4 sidebar-glass z-10"
      >
        <div className="mb-2">
          <h1 className="text-3xl font-black text-yellow-300 tracking-tight leading-none drop-shadow-xs">SATPAMO</h1>
          <p className="text-sky-950 font-black text-[11px] tracking-widest mt-0.5">ADMIN</p>
        </div>

        {/* Profile Card */}
        <div className="flex items-center gap-3 bg-white/25 border border-white/40 rounded-2xl px-3 py-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-sm font-black shrink-0 shadow-xs">
            {dosen?.username ? getInitials(dosen.username) : "YK"}
          </div>
          <div className="min-w-0">
            <p className="text-slate-900 text-xs font-black leading-tight truncate">
              {dosen?.username ?? "Dr. Yurii Kharlistov, M.T."}
            </p>
            <p className="text-sky-950 text-[10px] font-bold truncate">NIP: 123456789098761</p>
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
                  ? "bg-sky-500/40 text-slate-950 font-black shadow-xs border border-white/40"
                  : "text-slate-800 hover:bg-white/20 hover:text-black font-semibold"
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
        <div className="flex flex-col gap-1 border-t border-white/25 pt-3">
          <button
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-2 text-slate-800 hover:text-black text-xs px-2 py-2 rounded-lg hover:bg-white/20 transition-all font-semibold"
          >
            <HelpCircle className="w-4 h-4" />
            Bantuan SATPAMO
          </button>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 text-xs px-2 py-2 rounded-lg hover:bg-red-500/15 transition-all font-bold"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-8 py-6 relative z-10 flex flex-col gap-5">
        {/* Top Header / Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <button onClick={() => navigate("/")} className="hover:text-slate-800 transition-colors flex items-center gap-1">
              <span>Beranda</span>
            </button>
            <span>&gt;</span>
            <span className="text-slate-800 font-bold">Manajemen Jadwal</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              title="Perbarui Data"
              className="w-9 h-9 rounded-xl bg-white/70 hover:bg-white text-slate-700 flex items-center justify-center backdrop-blur-md border border-white/80 shadow-sm transition-all active:scale-95"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing || isLoading ? "animate-spin text-sky-600" : ""}`} />
            </button>
            <div className="w-9 h-9 rounded-xl bg-sky-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              {dosen?.username ? getInitials(dosen.username) : "A"}
            </div>
          </div>
        </div>

        {/* Page Title & Action Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-sky-950 tracking-tight">Manajemen Jadwal</h1>
            <p className="text-sky-900/85 text-sm font-medium mt-0.5">
              Atur jadwal perkuliahan, sesi pengganti, dan kelola kelas terdaftar.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={() => {
                setShowImportModal(true);
                setImportSummary(null);
                setImportFile(null);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/30 hover:bg-white/45 text-sky-950 font-bold text-sm backdrop-blur-md border border-white/50 shadow-xs transition-all hover:shadow-sm active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-800" />
              <span>Import Excel / CSV</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-sm shadow-xs transition-all hover:shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Jadwalkan Kelas</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Sesi Jadwal */}
          <div
            onClick={() => {
              setSelectedStatus("Semua Status");
              showToast("Menampilkan seluruh jadwal aktif perkuliahan");
            }}
            className="glass-panel glass-card-interactive rounded-2xl p-4 shadow-sm cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-200/60 flex items-center justify-center text-sky-900 shrink-0">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sky-900/80 text-xs font-semibold">Total Sesi Jadwal</p>
                <p className="text-2xl font-black text-sky-950">{jadwalList.length}</p>
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <span className="text-sky-800 text-sm group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>

          {/* Card 2: Akan Datang */}
          <div
            onClick={() => {
              setSelectedStatus("Akan Datang");
              showToast("Filter jadwal sesi yang akan datang");
            }}
            className="glass-panel glass-card-interactive rounded-2xl p-4 shadow-sm cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-200/60 flex items-center justify-center text-sky-900 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sky-900/80 text-xs font-semibold">Sesi Akan Datang</p>
                <p className="text-2xl font-black text-sky-950">
                  {jadwalList.filter((j) => j.status === "upcoming").length}
                </p>
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <span className="text-sky-800 text-sm group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>

          {/* Card 3: Kelas Pengganti */}
          <div
            onClick={() => {
              setSelectedStatus("Kelas Pengganti");
              showToast("Menampilkan kelas pengganti");
            }}
            className="glass-panel glass-card-interactive rounded-2xl p-4 shadow-sm cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-200/60 flex items-center justify-center text-sky-900 shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sky-900/80 text-xs font-semibold">Kelas Pengganti</p>
                <p className="text-2xl font-black text-sky-950">
                  {jadwalList.filter((j) => j.status === "replacement").length}
                </p>
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <span className="text-sky-800 text-sm group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>

          {/* Card 4: Total Kelas Unik */}
          <div
            onClick={() => {
              showToast(`Total ${new Set(jadwalList.map((j) => j.kelas)).size} kelas aktif terdaftar`);
            }}
            className="glass-panel glass-card-interactive rounded-2xl p-4 shadow-sm cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-200/60 flex items-center justify-center text-emerald-900 shrink-0">
                <BookOpen className="w-5 h-5 text-emerald-800" />
              </div>
              <div>
                <p className="text-sky-900/80 text-xs font-semibold">Kelas Terdaftar</p>
                <p className="text-2xl font-black text-sky-950">
                  {new Set(jadwalList.map((j) => j.kelas)).size}
                </p>
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <span className="text-sky-800 text-sm group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        </div>

        {/* Filter and Control Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Search Box */}
            <div className="relative min-w-[260px] flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-900/60 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari mata kuliah, kelas, atau ruangan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white/40 hover:bg-white/50 focus:bg-white/70 text-sky-950 placeholder:text-sky-900/60 rounded-xl border border-white/50 text-xs font-medium outline-none focus:ring-2 focus:ring-sky-400 backdrop-blur-md transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sky-800 hover:text-sky-950"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Kelas Filter */}
            <div className="relative">
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="appearance-none pl-3.5 pr-8 py-2 bg-white/40 hover:bg-white/50 text-sky-950 rounded-xl border border-white/50 text-xs font-semibold outline-none focus:ring-2 focus:ring-sky-400 backdrop-blur-md cursor-pointer transition-all"
              >
                <option value="Semua Kelas">Semua Kelas</option>
                {Array.from(new Set(jadwalList.map((j) => j.kelas)))
                  .filter(Boolean)
                  .map((k) => (
                    <option key={k} value={k}>
                      Kelas {k}
                    </option>
                  ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-sky-900/70 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="appearance-none pl-3.5 pr-8 py-2 bg-white/40 hover:bg-white/50 text-sky-950 rounded-xl border border-white/50 text-xs font-semibold outline-none focus:ring-2 focus:ring-sky-400 backdrop-blur-md cursor-pointer transition-all"
              >
                <option value="Semua Status">Semua Status</option>
                <option value="Sedang Berlangsung">Sedang Berlangsung</option>
                <option value="Akan Datang">Akan Datang</option>
                <option value="Kelas Pengganti">Kelas Pengganti</option>
                <option value="Selesai">Selesai</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-sky-900/70 pointer-events-none" />
            </div>
          </div>

          {/* View Switcher: Daftar vs Kalender */}
          <div className="flex items-center bg-white/30 backdrop-blur-md p-1 rounded-xl border border-white/40 self-end lg:self-auto">
            <button
              onClick={() => setViewMode("daftar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "daftar"
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-sky-950 hover:bg-white/30"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Daftar</span>
            </button>
            <button
              onClick={() => setViewMode("kalender")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "kalender"
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-sky-950 hover:bg-white/30"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Kalender</span>
            </button>
          </div>
        </div>

        {/* View Mode: DAFTAR (Table) / Loading State */}
        {isLoading ? (
          <div className="glass-panel rounded-3xl p-12 flex flex-col items-center justify-center text-sky-950 gap-2.5 shadow-lg">
            <Loader2 className="w-8 h-8 animate-spin text-sky-800" />
            <p className="text-xs font-bold text-sky-950">Memuat data jadwal perkuliahan dari server...</p>
          </div>
        ) : viewMode === "daftar" ? (
          <div className="glass-panel rounded-3xl overflow-hidden flex flex-col shadow-lg">
            {/* Table Header Section */}
            <div className="px-5 py-4 border-b border-sky-200/40 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sky-950">
                <CalendarIcon className="w-4 h-4 text-sky-900" />
                <h3 className="font-extrabold text-sm tracking-tight">Daftar Jadwal Perkuliahan</h3>
              </div>
              <span className="text-xs text-sky-900/75 font-semibold">
                Menampilkan {filteredJadwal.length} sesi perkuliahan
              </span>
            </div>

            {/* Responsive Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-sky-200/40 text-sky-900/70 uppercase font-black text-[10px] tracking-wider bg-white/20">
                    <th className="py-3 px-5 w-16">Sesi</th>
                    <th className="py-3 px-5">Mata Kuliah</th>
                    <th className="py-3 px-5">Ruangan</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5 text-right w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-200/30">
                  {filteredJadwal.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sky-900/70 font-medium">
                        Tidak ada jadwal perkuliahan yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredJadwal.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-white/40 transition-colors group"
                      >
                        {/* Sesi */}
                        <td className="py-3.5 px-5 font-bold text-sky-950 text-sm">
                          {item.sesi}
                        </td>

                        {/* Mata Kuliah */}
                        <td className="py-3.5 px-5">
                          <p className="font-bold text-sky-950 text-xs">{item.mataKuliah}</p>
                          <p className="text-[11px] text-sky-900/70 mt-0.5 font-medium">
                            {item.tanggal} • {item.jamMulai} - {item.jamSelesai} ({item.kelas})
                          </p>
                        </td>

                        {/* Ruangan */}
                        <td className="py-3.5 px-5 font-semibold text-sky-900">
                          {item.ruangan}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-5">
                          {getStatusBadge(item.status)}
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-5 text-right">
                          <button
                            onClick={() => openEditModal(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white text-sky-900 border border-sky-300/80 font-bold text-xs shadow-2xs hover:shadow-xs transition-all active:scale-95"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-sky-700" />
                            <span>Ubah</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* View Mode: KALENDER */
          <div className="glass-panel rounded-3xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-sky-950 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-sky-900" />
                Kalender Perkuliahan (September - Oktober 2026)
              </h3>
              <span className="text-xs font-semibold text-sky-900/80">Semester Ganjil 2026/2027</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredJadwal.map((item) => (
                <div
                  key={item.id}
                  onClick={() => openEditModal(item)}
                  className="glass-panel glass-card-interactive rounded-xl p-3.5 shadow-sm cursor-pointer flex flex-col justify-between gap-3 group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-sky-500 text-white font-extrabold text-[10px]">
                        SESI {item.sesi}
                      </span>
                      {getStatusBadge(item.status)}
                    </div>
                    <h4 className="font-bold text-sky-950 text-xs group-hover:text-sky-700 transition-colors">
                      {item.mataKuliah}
                    </h4>
                  </div>

                  <div className="text-[11px] text-sky-900/80 space-y-1 border-t border-sky-100 pt-2 font-medium">
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-sky-700 shrink-0" />
                      <span>{item.tanggal} ({item.jamMulai} - {item.jamSelesai})</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-sky-700 shrink-0" />
                      <span>{item.ruangan} • {item.kelas}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Section: 2 Cards (Sesi Mendatang & Pengingat Regulasi BAAK) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-1">
          {/* Sesi Perkuliahan Mendatang (Col 7) */}
          <div className="lg:col-span-7 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sky-950 font-bold text-xs tracking-tight">
              <CalendarIcon className="w-3.5 h-3.5 text-sky-900" />
              <span>Sesi Perkuliahan Mendatang</span>
            </div>

            <div className="glass-panel rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {/* Big dark session badge */}
                <div className="w-14 h-14 rounded-2xl bg-sky-500 text-white font-black flex flex-col items-center justify-center shrink-0 shadow-sm">
                  <span className="text-[10px] tracking-widest text-sky-100">SESI</span>
                  <span className="text-xl leading-none">11</span>
                </div>

                {/* Details */}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-200/80 text-sky-950">
                      Mendatang (7 Hari Lagi)
                    </span>
                    <span className="text-[11px] font-semibold text-sky-900/80">
                      Senin, 22 September 2026
                    </span>
                  </div>

                  <h4 className="font-extrabold text-sky-950 text-xs sm:text-sm mt-1">
                    Local Storage & SQLite / Room Database Architecture
                  </h4>

                  <p className="text-[11px] text-sky-900/70 font-medium mt-0.5">
                    Gedung Fakultas Ilmu Komputer Universitas Brawijaya
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  const s11 = jadwalList.find((j) => j.sesi === 11) || initialJadwalList[1];
                  setShowDetailModal(s11);
                }}
                className="self-end sm:self-center px-4 py-2 rounded-xl bg-white/75 hover:bg-white text-sky-950 border border-sky-300/80 font-bold text-xs shadow-2xs hover:shadow-xs transition-all active:scale-95 shrink-0"
              >
                Lihat Detail
              </button>
            </div>
          </div>

          {/* Pengingat Regulasi BAAK (Col 5) */}
          <div className="lg:col-span-5 flex flex-col justify-end">
            <div className="glass-warning rounded-2xl p-4 shadow-sm text-amber-950 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 font-black text-xs text-amber-900 tracking-wider">
                  <Bell className="w-3.5 h-3.5 text-amber-800" />
                  <span>PENGINGAT REGULASI BAAK</span>
                </div>

                <p className="text-[11px] text-amber-900/90 leading-relaxed font-medium mt-1.5">
                  Pengisian <strong className="font-bold text-amber-950">Berita Acara Perkuliahan (BAP)</strong> wajib ditandatangani digital paling lambat <strong className="font-bold text-amber-950">H+1 (24 jam)</strong> setelah sesi berakhir agar hak presensi mahasiswa terverifikasi di portal SIM-Akademik.
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-amber-300/60 pt-2 text-[11px]">
                <span className="font-bold text-amber-900">
                  Batas Sesi 10 : <span className="font-medium">Besok, 10:30 WIB</span>
                </span>
                <button
                  onClick={() => setShowBapGuideModal(true)}
                  className="font-bold text-amber-950 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Panduan BAP</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* =========================================================================
          MODAL: Ubah Jadwal Perkuliahan (Exact Match from User's Screenshot)
      ========================================================================= */}
      <AnimatePresence>
        {editingJadwal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-950/25 backdrop-blur-[2px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-tight">
                      Ubah Jadwal Perkuliahan
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Sesi {editingJadwal.sesi} - Kelas {editForm.kelas}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-600 border border-sky-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    Akan Datang
                  </span>
                  <button
                    onClick={() => setEditingJadwal(null)}
                    className="w-7 h-7 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveEdit} className="flex-1 flex flex-col min-h-0">
                <div className="p-6 overflow-y-auto space-y-3.5 text-xs">
                  {/* Mata Kuliah (Disabled) */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Mata Kuliah</label>
                    <div className="bg-sky-50/70 border border-sky-100 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold text-xs">
                      {editForm.mataKuliah}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Terisi otomatis dan tidak dapat diubah.</p>
                  </div>

                  {/* Tanggal & Kelas (2 Columns) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Tanggal</label>
                      <div className="relative">
                        <CalendarIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={editForm.tanggal}
                          onChange={(e) => setEditForm({ ...editForm, tanggal: e.target.value })}
                          className="w-full pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                        />
                        <CalendarIcon className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Kelas</label>
                      <div className="relative">
                        <Users className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select
                          value={editForm.kelas}
                          onChange={(e) => setEditForm({ ...editForm, kelas: e.target.value })}
                          className="w-full pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 text-xs appearance-none focus:ring-2 focus:ring-sky-500 outline-none cursor-pointer"
                        >
                          <option value="T3A">T3A</option>
                          <option value="T3B">T3B</option>
                          <option value="T3C">T3C</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Jam Mulai & Jam Selesai (2 Columns) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Jam Mulai</label>
                      <div className="relative">
                        <Clock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select
                          value={editForm.jamMulai}
                          onChange={(e) => setEditForm({ ...editForm, jamMulai: e.target.value })}
                          className="w-full pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 text-xs appearance-none focus:ring-2 focus:ring-sky-500 outline-none cursor-pointer"
                        >
                          <option value="07.00 WIB">07.00 WIB</option>
                          <option value="08.00 WIB">08.00 WIB</option>
                          <option value="09.00 WIB">09.00 WIB</option>
                          <option value="10.00 WIB">10.00 WIB</option>
                          <option value="13.00 WIB">13.00 WIB</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Jam Selesai</label>
                      <div className="relative">
                        <Clock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select
                          value={editForm.jamSelesai}
                          onChange={(e) => setEditForm({ ...editForm, jamSelesai: e.target.value })}
                          className="w-full pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 text-xs appearance-none focus:ring-2 focus:ring-sky-500 outline-none cursor-pointer"
                        >
                          <option value="09.30 WIB">09.30 WIB</option>
                          <option value="10.30 WIB">10.30 WIB</option>
                          <option value="11.30 WIB">11.30 WIB</option>
                          <option value="12.30 WIB">12.30 WIB</option>
                          <option value="15.30 WIB">15.30 WIB</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Ruangan */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Ruangan</label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <select
                        value={editForm.ruangan}
                        onChange={(e) => setEditForm({ ...editForm, ruangan: e.target.value })}
                        className="w-full pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 text-xs appearance-none focus:ring-2 focus:ring-sky-500 outline-none cursor-pointer"
                      >
                        <option value="Ruang 305">Ruang 305</option>
                        <option value="Ruang 207">Ruang 207</option>
                        <option value="Ruang 101">Ruang 101</option>
                        <option value="Lab Komputer 1">Lab Komputer 1</option>
                        <option value="Lab Komputer 2">Lab Komputer 2</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Jenis Perubahan */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Jenis Perubahan</label>
                    <div className="relative">
                      <FileText className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <select
                        value={editForm.jenisPerubahan}
                        onChange={(e) => setEditForm({ ...editForm, jenisPerubahan: e.target.value })}
                        className="w-full pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 text-xs appearance-none focus:ring-2 focus:ring-sky-500 outline-none cursor-pointer"
                      >
                        <option value="Perubahan jadwal reguler">Perubahan jadwal reguler</option>
                        <option value="Penjadwalan kelas pengganti">Penjadwalan kelas pengganti</option>
                        <option value="Pindah ruangan / lab">Pindah ruangan / lab</option>
                        <option value="Sesi kuliah umum / dosen tamu">Sesi kuliah umum / dosen tamu</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Alasan Perubahan */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-700 font-semibold">Alasan Perubahan</label>
                      <span className="text-[10px] text-slate-400">
                        {editForm.alasanPerubahan.length}/200
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      maxLength={200}
                      value={editForm.alasanPerubahan}
                      onChange={(e) => setEditForm({ ...editForm, alasanPerubahan: e.target.value })}
                      placeholder="Tuliskan alasan perubahan jadwal..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:ring-2 focus:ring-sky-500 outline-none resize-none"
                    />
                  </div>

                  {/* Notifikasi Mahasiswa Alert Box */}
                  <div className="bg-sky-50/80 border border-sky-100 rounded-2xl p-3 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Bell className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-sky-950 text-xs">Notifikasi Mahasiswa</h5>
                      <p className="text-[11px] text-sky-800/80 mt-0.5 leading-relaxed">
                        Mahasiswa kelas {editForm.kelas} akan menerima informasi jadwal terbaru setelah perubahan disimpan.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Modal Pinned Footer Buttons */}
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingJadwal(null)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          MODAL: Jadwalkan Kelas Baru (+ Jadwalkan Kelas)
      ========================================================================= */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Jadwalkan Sesi Perkuliahan Baru</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Tambah kelas reguler atau sesi pengganti</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-7 h-7 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateJadwal} className="p-6 overflow-y-auto space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mata Kuliah</label>
                  <input
                    type="text"
                    required
                    value={newForm.mataKuliah}
                    onChange={(e) => setNewForm({ ...newForm, mataKuliah: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                    placeholder="Contoh: Pemrograman Mobile Lanjutan"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Tanggal</label>
                    <input
                      type="date"
                      required
                      value={newForm.tanggal}
                      onChange={(e) => setNewForm({ ...newForm, tanggal: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Kelas</label>
                    <select
                      value={newForm.kelas}
                      onChange={(e) => setNewForm({ ...newForm, kelas: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                    >
                      <option value="T3A">T3A</option>
                      <option value="T3B">T3B</option>
                      <option value="T3C">T3C</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Jam Mulai</label>
                    <select
                      value={newForm.jamMulai}
                      onChange={(e) => setNewForm({ ...newForm, jamMulai: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                    >
                      <option value="08.00 WIB">08.00 WIB</option>
                      <option value="10.00 WIB">10.00 WIB</option>
                      <option value="13.00 WIB">13.00 WIB</option>
                      <option value="15.30 WIB">15.30 WIB</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Jam Selesai</label>
                    <select
                      value={newForm.jamSelesai}
                      onChange={(e) => setNewForm({ ...newForm, jamSelesai: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                    >
                      <option value="10.30 WIB">10.30 WIB</option>
                      <option value="12.00 WIB">12.00 WIB</option>
                      <option value="15.30 WIB">15.30 WIB</option>
                      <option value="18.00 WIB">18.00 WIB</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Ruangan</label>
                    <select
                      value={newForm.ruangan}
                      onChange={(e) => setNewForm({ ...newForm, ruangan: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                    >
                      <option value="Ruang 207">Ruang 207</option>
                      <option value="Ruang 305">Ruang 305</option>
                      <option value="Ruang 101">Ruang 101</option>
                      <option value="Lab Komputer 1">Lab Komputer 1</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Tipe Jadwal</label>
                    <select
                      value={newForm.status}
                      onChange={(e) => setNewForm({ ...newForm, status: e.target.value as JadwalItem["status"] })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                    >
                      <option value="upcoming">Jadwal Reguler</option>
                      <option value="replacement">Kelas Pengganti</option>
                    </select>
                  </div>
                </div>

                {newForm.ruangan === "Ruang 207" && newForm.jamMulai === "08.00 WIB" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed">
                      <strong>Peringatan Jadwal:</strong> Ruang 207 pada jam 08.00 WIB memiliki penggunaan reguler oleh dosen lain. Pastikan telah berkoordinasi dengan BAAK.
                    </p>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Jadwalkan Kelas</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          MODAL: Lihat Detail Sesi
      ========================================================================= */}
      <AnimatePresence>
        {showDetailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden p-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-sky-500 text-white font-extrabold text-xs">
                    SESI {showDetailModal.sesi}
                  </span>
                  <span className="font-bold text-slate-800 text-sm">{showDetailModal.kelas}</span>
                </div>
                <button
                  onClick={() => setShowDetailModal(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs text-slate-700">
                <div>
                  <p className="text-slate-400 font-semibold text-[10px] uppercase">Mata Kuliah</p>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{showDetailModal.mataKuliah}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase">Waktu</p>
                    <p className="font-bold text-slate-800 mt-0.5">{showDetailModal.tanggal}</p>
                    <p className="text-[11px] text-slate-600">{showDetailModal.jamMulai} - {showDetailModal.jamSelesai}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase">Lokasi</p>
                    <p className="font-bold text-slate-800 mt-0.5">{showDetailModal.ruangan}</p>
                    <p className="text-[11px] text-slate-600">Gedung B FILKOM UB</p>
                  </div>
                </div>

                <div>
                  <p className="text-slate-400 font-semibold text-[10px] uppercase">Status Kehadiran</p>
                  <div className="mt-1">{getStatusBadge(showDetailModal.status)}</div>
                </div>

                {showDetailModal.alasanPerubahan && (
                  <div>
                    <p className="text-slate-400 font-semibold text-[10px] uppercase">Catatan Perkuliahan</p>
                    <p className="text-slate-600 mt-0.5 bg-sky-50/60 p-2.5 rounded-lg border border-sky-100 text-[11px]">
                      {showDetailModal.alasanPerubahan}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={() => {
                    const item = showDetailModal;
                    setShowDetailModal(null);
                    openEditModal(item);
                  }}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs"
                >
                  Ubah Jadwal Ini
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          MODAL: Panduan BAP (Berita Acara Perkuliahan)
      ========================================================================= */}
      <AnimatePresence>
        {showBapGuideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden p-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Panduan Regulasi BAP & Presensi BAAK</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Biro Administrasi Akademik & Kemahasiswaan</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBapGuideModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs text-slate-700 leading-relaxed">
                <div className="bg-amber-50/70 border border-amber-200/80 p-3 rounded-xl">
                  <p className="font-bold text-amber-950 text-xs">Aturan Pengesahan H+1 (24 Jam)</p>
                  <p className="text-[11px] text-amber-900/90 mt-1">
                    Setiap sesi perkuliahan yang telah selesai dilaksanakan harus divalidasi dengan tanda tangan digital BAP oleh dosen pengampu dalam jangka waktu maksimal 24 jam setelah jam selesai.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-slate-900">Konsekuensi Keterlambatan:</p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11px]">
                    <li>Hak presensi kehadiran mahasiswa tertahan di portal SIM-Akademik.</li>
                    <li>Sistem SATPAMO tidak dapat menghitung kuota kehadiran 75% secara otomatis untuk sesi tersebut.</li>
                    <li>Perlu surat pengantar pembukaan BAP susulan ke Bagian Akademik Fakultas.</li>
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setShowBapGuideModal(false)}
                  className="px-4 py-2 rounded-xl bg-sky-100 text-sky-800 border border-sky-200 font-bold text-xs hover:bg-sky-200 transition-all"
                >
                  Mengerti
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          MODAL: Import Jadwal & Mahasiswa (.xlsx / .csv)
      ========================================================================= */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden p-6"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Import Jadwal & Mahasiswa</h3>
                    <p className="text-slate-500 text-xs mt-0.5">Mendukung format file Excel (.xlsx, .xls) dan .csv</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!isImporting) {
                      setShowImportModal(false);
                      setImportFile(null);
                      setImportSummary(null);
                    }
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="py-4 space-y-4">
                {/* Download Template Banner */}
                <div className="flex items-center justify-between bg-sky-50 border border-sky-200/70 p-3.5 rounded-2xl">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-5 h-5 text-sky-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-sky-950">Gunakan Format Template</p>
                      <p className="text-[11px] text-sky-800/80 truncate">
                        Kolom: kode_kelas, nama_kelas, hari, jam_mulai, jam_selesai, ruangan, nim, nama_mahasiswa
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleDownloadTemplate}
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-sky-100 text-sky-700 text-xs font-bold border border-sky-200 shadow-2xs shrink-0 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Template</span>
                  </button>
                </div>

                {/* Dropzone */}
                {!importSummary && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) setImportFile(file);
                    }}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                      isDragOver
                        ? "border-sky-500 bg-sky-50/60"
                        : importFile
                        ? "border-emerald-400 bg-emerald-50/30"
                        : "border-slate-200 hover:border-sky-400 bg-slate-50/50"
                    }`}
                  >
                    <input
                      type="file"
                      id="excel-file-input"
                      accept=".xlsx, .xls, .csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setImportFile(file);
                      }}
                      className="hidden"
                    />

                    {importFile ? (
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 shadow-2xs">
                          <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-800">{importFile.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {(importFile.size / 1024).toFixed(1)} KB • Siap diproses
                        </p>
                        <button
                          type="button"
                          onClick={() => setImportFile(null)}
                          className="mt-3 text-xs text-rose-600 hover:underline font-semibold"
                        >
                          Ganti file lain
                        </button>
                      </div>
                    ) : (
                      <label htmlFor="excel-file-input" className="cursor-pointer block">
                        <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 mx-auto flex items-center justify-center mb-2">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-800">
                          Tarik file ke sini, atau <span className="text-sky-600 hover:underline">pilih file</span>
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Mendukung format .xlsx, .xls, dan .csv (Maksimal 10MB)</p>
                      </label>
                    )}
                  </div>
                )}

                {/* Blast Email Activation Option */}
                {!importSummary && (
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-950">
                    <input
                      id="blast-email-toggle"
                      type="checkbox"
                      checked={sendActivationEmail}
                      onChange={(e) => setSendActivationEmail(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                    />
                    <label htmlFor="blast-email-toggle" className="cursor-pointer select-none">
                      <span className="font-bold block text-blue-900">Kirim Email Aktivasi Otomatis</span>
                      <span className="text-[11px] text-blue-700/80">
                        Kirim tautan aktivasi langsung ke Gmail mahasiswa baru yang terdaftar di file.
                      </span>
                    </label>
                  </div>
                )}

                {/* Import Summary Result Banner */}
                {importSummary && (
                  <div className="space-y-3">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-950">
                      <div className="flex items-center gap-2 font-bold text-sm mb-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>Import Berhasil Diselesaikan!</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                        <div className="bg-white/80 p-2 rounded-xl border border-emerald-200">
                          <p className="text-slate-500 text-[10px]">Kelas Dibuat</p>
                          <p className="font-extrabold text-base text-slate-800">{importSummary.classesCreated}</p>
                        </div>
                        <div className="bg-white/80 p-2 rounded-xl border border-emerald-200">
                          <p className="text-slate-500 text-[10px]">Kelas Diupdate</p>
                          <p className="font-extrabold text-base text-slate-800">{importSummary.classesUpdated}</p>
                        </div>
                        <div className="bg-white/80 p-2 rounded-xl border border-emerald-200">
                          <p className="text-slate-500 text-[10px]">Jadwal Baru</p>
                          <p className="font-extrabold text-base text-slate-800">{importSummary.schedulesCreated}</p>
                        </div>
                        <div className="bg-white/80 p-2 rounded-xl border border-emerald-200">
                          <p className="text-slate-500 text-[10px]">Mhs Terdaftar</p>
                          <p className="font-extrabold text-base text-slate-800">{importSummary.studentsEnrolled}</p>
                        </div>
                        <div className="bg-white/80 p-2 rounded-xl border border-emerald-200 col-span-2 sm:col-span-1">
                          <p className="text-slate-500 text-[10px]">Email Aktivasi</p>
                          <p className="font-extrabold text-base text-blue-700">{importSummary.emailsSent || 0}</p>
                        </div>
                      </div>
                    </div>

                    {/* Conflict / Warning Section if any */}
                    {importSummary.errors && importSummary.errors.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 text-xs">
                        <div className="flex items-center gap-2 font-bold text-amber-900 mb-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Catatan / Bentrok Jadwal Terdeteksi ({importSummary.errors.length}):</span>
                        </div>
                        <div className="max-h-36 overflow-y-auto space-y-1 pl-6 text-amber-800/90 list-disc">
                          {importSummary.errors.map((err: any, idx: number) => (
                            <p key={idx} className="text-[11px] leading-relaxed">
                              • <strong>{err.kode || "Umum"}:</strong> {err.reason}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                {importSummary ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowImportModal(false);
                      setImportSummary(null);
                      setImportFile(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    Selesai & Tutup
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={isImporting}
                      onClick={() => {
                        setShowImportModal(false);
                        setImportFile(null);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      disabled={!importFile || isImporting}
                      onClick={handleExecuteImport}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs shadow-xs transition-all"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Memproses Import...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Mulai Import Data</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          MODAL: Bantuan SATPAMO
      ========================================================================= */}
      <AnimatePresence>
        {showHelpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden p-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-sky-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Bantuan Manajemen Jadwal</h3>
                </div>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-2.5 text-xs text-slate-600 leading-relaxed">
                <p>
                  Halaman <strong>Manajemen Jadwal</strong> digunakan untuk mengatur seluruh sesi perkuliahan semester berjalan, mengubah tanggal/waktu/ruangan, serta menambahkan sesi pengganti.
                </p>
                <p>
                  Mahasiswa kelas yang bersangkutan akan menerima notifikasi otomatis pada aplikasi SATPAMO Mobile saat perubahan jadwal disimpan.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
