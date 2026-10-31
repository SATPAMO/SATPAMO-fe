import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Search,
  LogOut,
  RefreshCw,
  AlertTriangle,
  MapPin,
  X,
  Menu,
  Radio,
  Calendar,
  BarChart2,
  Settings,
  HelpCircle,
  Download,
  FileText,
  CheckCircle2,
  Clock3,
  TrendingUp,
  Users,
  Projector,
  RotateCcw,
  DoorOpen,
  Maximize2,
  Shuffle,
  Copy,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  attendanceApi,
  type AttendanceRecord,
  type AttendanceStats,
} from "../lib/api";
import { DynamicQrDisplay } from "../components/DynamicQrDisplay";

function formatTime(isoStr: string | null): string {
  if (!isoStr) return "--:--";
  return new Date(isoStr).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function ActivityItem({ name, nim, time, accuracy }: {
  name: string; nim: string; time: string; accuracy: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/20 last:border-0 hover:bg-white/20 px-2 rounded-xl transition-colors">
      <div className="w-8 h-8 rounded-full bg-sky-700 text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-sm">
        {getInitials(name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-900 truncate">{name}</p>
        <p className="text-[10px] text-slate-700 truncate font-semibold">{nim}</p>
        <p className="text-[10px] text-sky-950 font-bold">{accuracy}</p>
      </div>
      <span className="text-[10px] text-slate-700 font-bold shrink-0">{time}</span>
    </div>
  );
}

type TabFilter = "semua" | "hadir" | "izin" | "belum";

export function AttendanceDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>("semua");
  const [qrTimer, setQrTimer] = useState(15);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [showProjectorModal, setShowProjectorModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- Geofence State ---
  const [isGeofenceActive, setIsGeofenceActive] = useState<boolean>(true);
  const [geofenceRadius, setGeofenceRadius] = useState<number>(50);

  // --- Mobile Drawer State ---
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // --- PIN Generator State ---
  const [currentPin, setCurrentPin] = useState<string>("15710");

  // --- QR Generator Helper & State ---
  const buildPayload = useCallback((pinVal: string, geoActive: boolean, radiusVal = 50) => {
    return JSON.stringify({
      app: "SATPAMO",
      kelas: "Pemrograman Mobile T3A",
      ruang: "207",
      pin: pinVal,
      geofence: geoActive ? "ON" : "OFF",
      lat: -6.89042,
      lon: 107.61031,
      radius: geoActive ? radiusVal : 0,
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(2, 7).toUpperCase(),
    });
  }, []);

  const [qrPayload, setQrPayload] = useState<string>(() => buildPayload("15710", true, 50));

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleGenerateNewPin = () => {
    const nextPin = Math.floor(10000 + Math.random() * 90000).toString();
    setCurrentPin(nextPin);
    setQrPayload(buildPayload(nextPin, isGeofenceActive, geofenceRadius));
    triggerToast(`Kode PIN Darurat baru (${nextPin}) berhasil dibuat!`);
  };

  const handleRegenerateQr = () => {
    setQrTimer(15);
    setQrPayload(buildPayload(currentPin, isGeofenceActive, geofenceRadius));
    triggerToast("Token QR sesi berhasil di-generate ulang!");
  };

  const handleToggleGeofence = () => {
    const nextState = !isGeofenceActive;
    setIsGeofenceActive(nextState);
    setQrPayload(buildPayload(currentPin, nextState, geofenceRadius));
    if (nextState) {
      triggerToast(`Area Geofence DIAKTIFKAN (Radius ${geofenceRadius}m Ruang 207)`);
    } else {
      triggerToast("Area Geofence DINONAKTIFKAN (Mode Bebas Lokasi)");
    }
  };

  const handleRadiusChange = (rad: number) => {
    setGeofenceRadius(rad);
    setQrPayload(buildPayload(currentPin, isGeofenceActive, rad));
    triggerToast(`Radius toleransi geofence diatur ke ${rad} meter`);
  };

  // Auto-refresh countdown for QR
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setQrTimer((t) => {
        if (t <= 1) {
          setQrPayload(buildPayload(currentPin, isGeofenceActive, geofenceRadius));
          return 15;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentPin, isGeofenceActive, geofenceRadius, buildPayload]);

  // --- Real-Time Polling Interval State ---
  const [pollInterval, setPollInterval] = useState<number>(5); // default 5 seconds
  const [lastSynced, setLastSynced] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const prevCountRef = useRef<number>(0);

  const fetchAttendanceData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoadingData(true);
    setIsSyncing(true);
    try {
      const [recordsRes, statsRes] = await Promise.all([
        attendanceApi.getAll(),
        attendanceApi.getStats(),
      ]);
      if (recordsRes.success && recordsRes.data) {
        if (prevCountRef.current > 0 && recordsRes.data.length > prevCountRef.current) {
          const diff = recordsRes.data.length - prevCountRef.current;
          triggerToast(`${diff} mahasiswa baru berhasil presensi!`);
        }
        prevCountRef.current = recordsRes.data.length;
        setRecords(recordsRes.data);
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
      setLastSynced(new Date());
    } catch (err) {
      console.error("Interval polling error:", err);
    } finally {
      setLoadingData(false);
      setIsSyncing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAttendanceData(false);
  }, [fetchAttendanceData]);

  // Real-time interval effect
  useEffect(() => {
    if (pollInterval <= 0) return;

    const pollTimer = setInterval(() => {
      fetchAttendanceData(true);
    }, pollInterval * 1000);

    const onFocus = () => fetchAttendanceData(true);
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(pollTimer);
      window.removeEventListener("focus", onFocus);
    };
  }, [pollInterval, fetchAttendanceData]);

  const { logout, dosen } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const totalEnrolled = stats?.total ?? 42;
  const hadirCount = stats?.present ?? 38;
  const lateCount = stats?.late ?? 0;
  const izinCount = stats?.izin ?? 2;
  const belumCount = Math.max(0, totalEnrolled - hadirCount - lateCount - izinCount);
  const hadirPct = totalEnrolled > 0 ? Math.round(((hadirCount + lateCount) / totalEnrolled) * 100) : 90.5;
  const kumulatif = 92.5;

  const sorted = [...records].sort((a, b) => {
    const tA = a.checkIn ? new Date(a.checkIn).getTime() : 0;
    const tB = b.checkIn ? new Date(b.checkIn).getTime() : 0;
    return tB - tA;
  });

  const tabFiltered = sorted.filter((r) => {
    if (activeTab === "hadir") return r.status === "PRESENT" || r.status === "LATE";
    if (activeTab === "izin") return r.status === "IZIN";
    if (activeTab === "belum") return r.status === "ABSENT";
    return true;
  });

  const filtered = tabFiltered.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.nim.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navItems = [
    { icon: <Radio className="w-4 h-4" />, label: "Live Monitoring", active: true, path: "/" },
    { icon: <Calendar className="w-4 h-4" />, label: "Jadwal Sesi", active: false, path: "/jadwal-sesi" },
    { icon: <BarChart2 className="w-4 h-4" />, label: "Statistik Kelas", active: false, path: "/statistik-kelas" },
    { icon: <Settings className="w-4 h-4" />, label: "Pengaturan Kuota", active: false, path: "/pengaturan-kuota" },
  ];

  return (
    <div
      className="min-h-screen flex text-slate-800 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 30%, #0284c7 60%, #38bdf8 100%)",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Decorative ambient blurred spots for deep glassmorphism light refraction */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 bg-cyan-200/35 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 left-1/4 w-80 h-80 bg-blue-300/30 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-1/3 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl" />
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

      {/* Desktop Sidebar (lg screens and up) */}
      <aside
        className="hidden lg:flex w-60 shrink-0 flex-col py-6 px-4 gap-4"
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
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-300 hover:text-red-200 text-xs px-2 py-2 rounded-lg hover:bg-red-500/10 transition-all font-semibold"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Mobile Drawer (screens < lg) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Drawer Content */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-72 max-w-[85vw] h-full flex flex-col py-6 px-4 gap-4 z-10"
              style={{
                background: "linear-gradient(180deg, #1e6fa8 0%, #155e86 60%, #0c4a6e 100%)",
                boxShadow: "4px 0 24px rgba(0,0,0,0.3)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h1 className="text-2xl font-black text-yellow-400 tracking-tight leading-none">SATPAMO</h1>
                  <p className="text-sky-300 text-[10px] font-semibold tracking-widest mt-0.5">ADMIN DOSEN</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-sky-100 hover:text-white rounded-xl hover:bg-white/10"
                  aria-label="Tutup Menu"
                >
                  <X className="w-5 h-5" />
                </button>
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
              <nav className="flex flex-col gap-1.5 flex-1 mt-2 overflow-y-auto">
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate(item.path);
                    }}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
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
                  className="flex items-center gap-2 text-sky-200 hover:text-white text-xs px-2 py-2.5 rounded-lg hover:bg-white/10 transition-all font-medium"
                >
                  <HelpCircle className="w-4 h-4" />
                  Bantuan SATPAMO
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-300 hover:text-red-200 text-xs px-2 py-2.5 rounded-lg hover:bg-red-500/10 transition-all font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar px-3.5 py-4 sm:px-6 sm:py-5 lg:px-7 flex flex-col gap-4 sm:gap-5 w-full min-w-0">
        {/* Mobile Top App Bar (Screens < lg) */}
        <div className="flex items-center justify-between lg:hidden glass-pill px-3.5 py-2 rounded-2xl shadow-sm border border-white/40">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 text-slate-800 hover:text-black rounded-xl hover:bg-white/40 transition-colors"
              aria-label="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <span className="text-xs font-black text-slate-900 tracking-tight leading-none block">SATPAMO</span>
              <p className="text-[10px] text-slate-700 font-semibold leading-none mt-0.5">Live Monitoring</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchAttendanceData(false)}
              disabled={isSyncing}
              className="p-1.5 rounded-xl glass-pill text-slate-800 hover:bg-white/40 transition-all"
              title="Sinkronisasi Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-sky-800" : ""}`} />
            </button>
            <div className="w-7 h-7 rounded-full bg-sky-600 border border-sky-300 flex items-center justify-center text-white text-[10px] font-black shadow-xs">
              {dosen ? getInitials(dosen.username) : "YK"}
            </div>
          </div>
        </div>

        {/* Top Header Pill & Real-time Sync Controller */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2.5 glass-pill rounded-2xl px-3.5 py-2 shadow-sm max-w-full">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            <span className="text-xs font-bold text-slate-900 truncate">
              Ruang 207: Pemrograman Mobile (Kelas T3A)
            </span>
            <DoorOpen className="w-3.5 h-3.5 text-slate-800 ml-1 shrink-0" />
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Real-time interval controller */}
            <div className="flex items-center gap-2 glass-pill px-3 py-1.5 rounded-2xl shadow-sm border border-white/40">
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    pollInterval > 0 ? "bg-emerald-500 animate-ping" : "bg-amber-400"
                  }`}
                />
                <span className="text-[11px] font-bold text-slate-800 whitespace-nowrap">
                  {pollInterval > 0 ? `Live Sync (${pollInterval}s)` : "Sync Dijeda"}
                </span>
              </span>

              {/* Interval Options */}
              <div className="flex items-center gap-1 bg-black/10 p-0.5 rounded-xl border border-white/20 text-[10px]">
                {[
                  { sec: 3, label: "3s" },
                  { sec: 5, label: "5s" },
                  { sec: 10, label: "10s" },
                  { sec: 0, label: "Jeda" },
                ].map((item) => (
                  <button
                    key={item.sec}
                    type="button"
                    onClick={() => {
                      setPollInterval(item.sec);
                      triggerToast(
                        item.sec > 0
                          ? `Interval update real-time diatur ke ${item.sec} detik`
                          : "Interval update real-time dijeda"
                      );
                    }}
                    className={`px-1.5 py-0.5 rounded-lg font-bold transition-all ${
                      pollInterval === item.sec
                        ? "bg-sky-900 text-white shadow-xs"
                        : "text-slate-700 hover:bg-white/40"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <span className="text-[10px] text-slate-600 font-semibold hidden md:inline">
                Update: {lastSynced.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </div>

            <button
              onClick={() => fetchAttendanceData(false)}
              disabled={isSyncing}
              className="p-2 rounded-xl glass-pill hover:bg-white/45 text-slate-800 shadow-sm transition-all"
              title="Sinkronisasi Data Sekarang"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-sky-800" : ""}`} />
            </button>

            <div className="w-9 h-9 rounded-full bg-sky-600 border border-sky-300 flex items-center justify-center text-white text-xs font-black shadow-sm">
              {dosen ? getInitials(dosen.username) : "YK"}
            </div>
          </div>
        </div>

        {/* Title, Badge Info & Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center flex-wrap gap-2.5 mb-1">
              <span className="bg-sky-950 text-sky-200 text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                SEMESTER GANJIL 2026/2027
              </span>
              <span
                className={`text-[11px] font-bold flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border transition-all ${
                  isGeofenceActive
                    ? "text-emerald-950 bg-emerald-200/50 border-emerald-400/40"
                    : "text-amber-950 bg-amber-200/50 border-amber-400/40"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isGeofenceActive ? "bg-emerald-600 animate-pulse" : "bg-amber-600"
                  }`}
                />
                {isGeofenceActive
                  ? "Radar Geofence: Aktif 50m (Ruang 207 Lab Mobile)"
                  : "Radar Geofence: Nonaktif (Bebas Lokasi)"}
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Live Monitoring Presensi Kelas
            </h2>
            <p className="text-xs text-slate-700 mt-0.5">
              Pantau kehadiran mahasiswa secara real-time melalui integrasi radar GPS perimeter & deteksi biometrik.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => setShowProjectorModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold glass-pill hover:bg-white/45 text-sky-950 shadow-sm transition-all flex items-center gap-2"
            >
              <Projector className="w-3.5 h-3.5 text-sky-800" />
              Mode Proyektor Layar Dosen
            </button>

            <button
              onClick={() => triggerToast("Mengunduh Berita_Acara_Presensi_Sesi10.pdf...")}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-md transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh Berita Acara Presensi
            </button>
          </div>
        </div>

        {/* 5 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Card 1: Total Terdaftar */}
          <div className="glass-panel glass-card-interactive rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-700 mb-1">
                <p className="text-[10px] font-extrabold tracking-wider uppercase text-slate-700">TOTAL TERDAFTAR</p>
                <div className="w-6 h-6 rounded-lg glass-inner text-sky-800 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900 leading-none">
                  {loadingData ? "—" : totalEnrolled}
                </span>
                <span className="text-xs font-bold text-slate-700">Mahasiswa</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-600 mt-3 font-semibold">100% Terverifikasi KRS</p>
          </div>

          {/* Card 2: Sudah Hadir */}
          <div className="glass-panel glass-card-interactive rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-700 mb-1">
                <p className="text-[10px] font-extrabold tracking-wider uppercase text-slate-700">SUDAH HADIR</p>
                <div className="w-6 h-6 rounded-lg glass-inner text-emerald-800 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900 leading-none">
                  {loadingData ? "—" : hadirCount}
                </span>
                <span className="text-[11px] font-extrabold text-emerald-800">
                  ({hadirPct}%)
                </span>
              </div>
            </div>
            <p className="text-[10px] text-slate-600 mt-3 font-semibold">Terakhir masuk: 2 menit yang lalu</p>
          </div>

          {/* Card 3: Izin / Sakit */}
          <div className="glass-panel glass-card-interactive rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-700 mb-1">
                <p className="text-[10px] font-extrabold tracking-wider uppercase text-slate-700">IZIN / SAKIT</p>
                <div className="w-6 h-6 rounded-lg glass-inner text-amber-800 flex items-center justify-center">
                  <Clock3 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900 leading-none">
                  {loadingData ? "—" : izinCount}
                </span>
                <span className="text-xs font-bold text-slate-700">Berkas</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-600 mt-3 font-semibold">Memerlukan verifikasi dosen</p>
          </div>

          {/* Card 4: Belum Presensi */}
          <div className="glass-panel glass-card-interactive rounded-2xl p-4 flex flex-col justify-between border-rose-300/40">
            <div>
              <div className="flex items-center justify-between text-rose-700 mb-1">
                <p className="text-[10px] font-extrabold tracking-wider uppercase text-rose-800">BELUM PRESENSI</p>
                <div className="w-6 h-6 rounded-lg bg-rose-500/20 border border-rose-400/40 text-rose-800 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-rose-700 leading-none">
                  {loadingData ? "—" : belumCount}
                </span>
                <span className="text-xs font-bold text-rose-800">Mahasiswa</span>
              </div>
            </div>
            <p className="text-[10px] text-rose-800 font-semibold mt-3 leading-snug">
              Batas sesi tersisa 43 menit
            </p>
          </div>

          {/* Card 5: Kumulatif SMT */}
          <div className="glass-panel glass-card-interactive rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-700 mb-1">
                <p className="text-[10px] font-extrabold tracking-wider uppercase text-slate-700">KUMULATIF SMT</p>
                <div className="w-6 h-6 rounded-lg glass-inner text-sky-800 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900 leading-none">{kumulatif}%</span>
                <span className="text-[11px] font-extrabold text-emerald-800">Aman</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-600 mt-3 font-semibold">Target min. 75% BAAK Terpenuhi</p>
          </div>
        </div>

        {/* Middle Section: QR Code & Radar + Warning & Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left: Dynamic QR & Radar Geofence (7 cols) */}
          <div className="lg:col-span-7 glass-panel rounded-3xl p-5 sm:p-6 flex flex-col justify-between">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              {/* QR Code Container (Left on md+, Centered on mobile) */}
              <div className="flex flex-col items-center gap-2.5 shrink-0 w-full sm:w-auto">
                <DynamicQrDisplay
                  value={qrPayload}
                  pin={currentPin}
                  size={135}
                  onCopyPin={(pinVal) => triggerToast(`Kode PIN ${pinVal} berhasil disalin ke clipboard!`)}
                  showDetails={true}
                />

                {/* Progress bar */}
                <div className="w-40 max-w-full mt-0.5">
                  <div className="flex justify-between text-[10px] text-slate-700 font-bold mb-1">
                    <span>Auto-Refresh QR</span>
                    <span className="text-sky-950 font-black">{qrTimer}s</span>
                  </div>
                  <div className="h-1.5 bg-black/15 rounded-full overflow-hidden border border-white/30">
                    <motion.div
                      className="h-full bg-gradient-to-r from-sky-400 to-sky-600 rounded-full"
                      style={{ width: `${(qrTimer / 15) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-1.5 mt-1 w-full">
                  <button
                    type="button"
                    onClick={handleRegenerateQr}
                    className="flex items-center gap-1 text-[10px] font-bold glass-pill text-slate-800 px-2.5 py-1.5 rounded-xl hover:bg-white/45 transition-all shadow-sm"
                    title="Generate token QR baru"
                  >
                    <RotateCcw className="w-3 h-3 text-sky-800" />
                    QR Baru
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateNewPin}
                    className="flex items-center gap-1 text-[10px] font-bold glass-pill text-slate-800 px-2.5 py-1.5 rounded-xl hover:bg-white/45 transition-all shadow-sm"
                    title="Generate kode PIN darurat baru"
                  >
                    <Shuffle className="w-3 h-3 text-sky-800" />
                    Acak PIN
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProjectorModal(true)}
                    className="flex items-center gap-1 text-[10px] font-bold bg-sky-600 hover:bg-sky-700 text-white px-2.5 py-1.5 rounded-xl transition-all shadow-md"
                  >
                    <Maximize2 className="w-3 h-3" />
                    Layar Penuh
                  </button>
                </div>
              </div>

              {/* Information Side (Geofence & Session Controls - Full Width of remaining space) */}
              <div className="flex-1 min-w-0 flex flex-col justify-between w-full gap-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    Kontrol Geofence &amp; Keamanan Sesi
                  </h3>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed font-medium">
                    Token QR dinamis dan PIN darurat terhubung langsung dengan batas perimeter satelit Ruang 207 Lab Mobile.
                  </p>
                </div>

                {/* Main Geofence Card */}
                <div
                  className={`glass-inner rounded-2xl p-4 transition-all flex flex-col justify-between gap-3 border ${
                    isGeofenceActive
                      ? "border-emerald-300/70 bg-emerald-50/25"
                      : "border-amber-300/70 bg-amber-50/25"
                  }`}
                >
                  {/* Card Header with Switch */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isGeofenceActive ? "bg-emerald-500/20 text-emerald-800" : "bg-amber-500/20 text-amber-800"
                        }`}
                      >
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-700 truncate">
                          AREA GEOFENCE KAMPUS
                        </p>
                        <p
                          className={`text-xs font-black truncate ${
                            isGeofenceActive ? "text-emerald-950" : "text-amber-950"
                          }`}
                        >
                          {isGeofenceActive ? `Perimeter Aktif (${geofenceRadius}m)` : "Bebas Lokasi (Nonaktif)"}
                        </p>
                      </div>
                    </div>

                    {/* Interactive Switch with Clear Tap Area */}
                    <button
                      type="button"
                      onClick={handleToggleGeofence}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-600 focus:ring-offset-1 ${
                        isGeofenceActive ? "bg-emerald-600" : "bg-slate-400"
                      }`}
                      role="switch"
                      aria-checked={isGeofenceActive}
                      title={isGeofenceActive ? "Klik untuk mematikan area geofence" : "Klik untuk menyalakan area geofence"}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          isGeofenceActive ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Geofence Details */}
                  <div className="space-y-1 text-xs">
                    <p className="text-slate-700 font-medium">
                      {isGeofenceActive
                        ? `Validasi radius ${geofenceRadius} meter dari titik pusat Lab 207 Gedung B.`
                        : "Validasi koordinat GPS dilewati. Mahasiswa dapat presensi dari mana saja (mode online)."}
                    </p>
                    <p className="text-[11px] font-mono font-semibold text-slate-800">
                      {isGeofenceActive ? "Koordinat: -6.89042, 107.61031 (Toleransi 15m)" : "GPS Perimeter: Bypass"}
                    </p>
                  </div>

                  {/* Radius Options (when active) */}
                  {isGeofenceActive && (
                    <div className="pt-2 border-t border-black/5 flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                        Atur Radius:
                      </span>
                      <div className="flex items-center gap-1.5">
                        {[25, 50, 100].map((rad) => (
                          <button
                            key={rad}
                            type="button"
                            onClick={() => handleRadiusChange(rad)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                              geofenceRadius === rad
                                ? "bg-emerald-700 text-white shadow-xs"
                                : "bg-white/60 text-slate-700 hover:bg-white"
                            }`}
                          >
                            {rad}m
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Card Footer Status */}
                  <div className="pt-2 border-t border-black/5 flex items-center justify-between text-[10px]">
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full ${
                        isGeofenceActive
                          ? "bg-emerald-200/80 text-emerald-950"
                          : "bg-amber-200/80 text-amber-950"
                      }`}
                    >
                      {isGeofenceActive ? "Geofence ON" : "Geofence OFF"}
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleGeofence}
                      className="font-bold text-sky-900 hover:text-black hover:underline"
                    >
                      {isGeofenceActive ? "Nonaktifkan Geofence" : "Aktifkan Geofence"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Warning Card & Live Activity Feed (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Warning Card */}
            <div className="glass-warning rounded-2xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-700 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black text-rose-950">Peringatan Kuota Kehadiran</p>
                <p className="text-[11px] text-rose-900 mt-0.5 leading-relaxed font-semibold">
                  1 Mahasiswa (Y. Kharlistov) dalam pantauan kritis ambang batas absensi (&lt;75%). Terancam tidak dapat mengikuti Ujian Akhir Semester.
                </p>
              </div>
            </div>

            {/* Live Activity Feed */}
            <div className="flex-1 glass-panel rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/25">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <h4 className="text-xs font-black text-slate-900">Live Activity Feed</h4>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600">Real-time update</span>
                </div>

                <div className="overflow-y-auto no-scrollbar max-h-48 pr-1">
                  {records.slice(0, 5).length > 0 ? (
                    records.slice(0, 5).map((r, i) => (
                      <ActivityItem
                        key={i}
                        name={r.name}
                        nim={r.nim}
                        time={formatTime(r.checkIn)}
                        accuracy="QR GPS · Akurasi 12 meter"
                      />
                    ))
                  ) : (
                    ["Yurii Kharlistov", "Muhammad Farhan", "Siti Aisyah"].map((name, i) => (
                      <ActivityItem
                        key={i}
                        name={name}
                        nim="253140707111000"
                        time={`10:52:${String(i * 10).padStart(2, "0")}`}
                        accuracy="QR GPS · Terverifikasi 14m"
                      />
                    ))
                  )}
                </div>
              </div>

              <div className="pt-2 text-right">
                <button
                  onClick={() => navigate("/statistik-kelas")}
                  className="text-[10px] font-bold text-sky-950 hover:text-black hover:underline"
                >
                  Lihat Analisis Statistik Lengkap &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Attendance Table */}
        <div className="glass-panel rounded-3xl overflow-hidden flex flex-col">
          {/* Table Header Filter & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-white/25">
            <div className="flex items-center flex-wrap gap-1.5 bg-black/10 p-1 rounded-2xl backdrop-blur-md border border-white/30">
              {(
                [
                  { key: "semua", label: "Semua Mahasiswa", count: totalEnrolled },
                  { key: "hadir", label: "Hadir", count: hadirCount },
                  { key: "izin", label: "Izin/Sakit", count: izinCount },
                  { key: "belum", label: "Belum Presensi", count: belumCount },
                ] as { key: TabFilter; label: string; count: number }[]
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === tab.key
                      ? "bg-sky-900/90 text-white shadow-md border border-sky-400/40"
                      : "text-slate-800 hover:bg-white/25 font-bold"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                      activeTab === tab.key ? "bg-sky-950 text-white" : "bg-white/50 text-slate-800"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
              <input
                type="text"
                placeholder="Cari NIM atau nama mahasiswa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 text-xs pl-9 pr-4 py-2 rounded-xl border border-white/50 bg-white/40 focus:bg-white/70 focus:outline-none focus:ring-2 focus:ring-sky-600 placeholder:text-slate-600 text-slate-900 font-medium shadow-sm backdrop-blur-md transition-all"
              />
            </div>
          </div>

          {/* Table Columns */}
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/30 glass-table-head text-slate-800 font-extrabold text-[11px]">
                  <th className="py-3.5 px-4">Mahasiswa</th>
                  <th className="py-3.5 px-4">NIM</th>
                  <th className="py-3.5 px-4">Waktu Presensi</th>
                  <th className="py-3.5 px-4">Metode & Akurasi GPS</th>
                  <th className="py-3.5 px-4">Status Kehadiran</th>
                  <th className="py-3.5 px-4">Bukti/Lampiran</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/15 font-medium">
                <AnimatePresence>
                  {loadingData ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={7} className="py-3.5 px-4">
                          <div className="h-4 bg-white/30 rounded w-full" />
                        </td>
                      </tr>
                    ))
                  ) : filtered.length > 0 ? (
                    filtered.map((row) => (
                      <tr key={row.id} className="hover:bg-white/25 transition-colors">
                        {/* Mahasiswa */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-sky-700 text-white text-xs font-black flex items-center justify-center shrink-0 shadow-sm">
                              {getInitials(row.name)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-950">{row.name}</p>
                              <p className="text-[10px] text-sky-950 font-bold">
                                Kehadiran {hadirPct}% (10 sesi)
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* NIM */}
                        <td className="py-3 px-4 text-slate-800 font-mono text-[11px] font-semibold">
                          {row.nim}
                        </td>

                        {/* Waktu Presensi */}
                        <td className="py-3 px-4 text-slate-950 font-black text-xs">
                          {formatTime(row.checkIn)} WIB
                        </td>

                        {/* Metode & Akurasi GPS */}
                        <td className="py-3 px-4">
                          <div className="flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-sky-700 shrink-0 mt-0.5" />
                            <div>
                              {row.status === "IZIN" ? (
                                <>
                                  <p className="text-[11px] font-bold text-slate-900">Portal Mandiri Mahasiswa</p>
                                  <p className="text-[10px] text-slate-700 font-semibold">Klinik Kampus Medika</p>
                                </>
                              ) : (
                                <>
                                  <p className="text-[11px] font-bold text-slate-900">QR+ Geolocation</p>
                                  <p className="text-[10px] text-slate-700 font-mono font-semibold">Radius {row.distance ?? 14}m dari Lab 207</p>
                                </>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Status Kehadiran */}
                        <td className="py-3 px-4">
                          {row.status === "PRESENT" || row.status === "LATE" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-950 border border-emerald-400/50 font-extrabold px-2.5 py-1 rounded-full backdrop-blur-sm">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              Hadir tepat waktu
                            </span>
                          ) : row.status === "IZIN" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-950 border border-amber-400/50 font-extrabold px-2.5 py-1 rounded-full backdrop-blur-sm">
                              <Clock3 className="w-3 h-3 text-amber-700" />
                              Sakit (Menunggu Validasi)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-rose-500/20 text-rose-950 border border-rose-400/50 font-extrabold px-2.5 py-1 rounded-full backdrop-blur-sm">
                              <X className="w-3 h-3 text-rose-700" />
                              Belum Hadir
                            </span>
                          )}
                        </td>

                        {/* Bukti/Lampiran */}
                        <td className="py-3 px-4">
                          {row.status === "IZIN" ? (
                            <button
                              onClick={() => triggerToast("Membuka surat_sakit.pdf...")}
                              className="flex items-center gap-1 text-[11px] text-sky-950 hover:text-black font-extrabold hover:underline"
                            >
                              <FileText className="w-3.5 h-3.5 text-sky-700" />
                              surat_sakit.pdf
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-mono font-bold">—</span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedRecord(row)}
                            className="px-3 py-1 text-[11px] font-bold text-slate-900 hover:text-white bg-white/40 hover:bg-sky-900 rounded-lg border border-white/60 shadow-sm backdrop-blur-md transition-all"
                          >
                            Ubah Status
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-700 font-bold">
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-700" />
                        <p className="text-xs font-bold text-slate-800">
                          {searchTerm ? `Tidak ada mahasiswa "${searchTerm}"` : "Belum ada rekaman presensi"}
                        </p>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Detail & Ubah Status Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md"
            onClick={() => setSelectedRecord(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95 }}
              className="glass-panel backdrop-blur-2xl rounded-3xl max-w-md w-full p-6 shadow-2xl border border-white/60 flex flex-col gap-4 text-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/30">
                <h3 className="font-bold text-slate-900 text-sm">Detail &amp; Verifikasi Presensi</h3>
                <button onClick={() => setSelectedRecord(null)} className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white/30">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-sky-700 text-white font-black text-sm flex items-center justify-center shadow-md">
                  {getInitials(selectedRecord.name)}
                </div>
                <div>
                  <p className="font-bold text-slate-950 text-sm">{selectedRecord.name}</p>
                  <p className="text-xs text-slate-700 font-mono font-semibold">{selectedRecord.nim}</p>
                  <p className="text-[11px] text-sky-950 font-bold">{selectedRecord.jurusan || "Teknik Informatika"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 glass-inner rounded-2xl p-3.5">
                <div>
                  <p className="text-[10px] text-slate-700 font-extrabold uppercase">Waktu Check-in</p>
                  <p className="text-xs font-black text-slate-950 mt-0.5">{formatTime(selectedRecord.checkIn)} WIB</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-700 font-extrabold uppercase">Status Saat Ini</p>
                  <p className="text-xs font-black text-slate-950 mt-0.5">{selectedRecord.status}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-700 font-extrabold uppercase">Jarak Radar GPS</p>
                  <p className="text-xs font-black text-slate-950 mt-0.5">{selectedRecord.distance ?? 14}m dari Ruang 207</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-700 font-extrabold uppercase">Verifikasi Perimeter</p>
                  <p className="text-xs font-black text-emerald-800 mt-0.5">Valid (Dalam Radius)</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/30">
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 text-xs border border-white/50 rounded-xl text-slate-800 hover:bg-white/30 font-bold"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    triggerToast(`Status presensi ${selectedRecord.name} berhasil diperbarui!`);
                    setSelectedRecord(null);
                  }}
                  className="px-4 py-2 text-xs bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-all font-bold shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Konfirmasi Status
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Projector Fullscreen Modal */}
      <AnimatePresence>
        {showProjectorModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl"
            onClick={() => setShowProjectorModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="glass-panel backdrop-blur-2xl rounded-3xl max-w-lg w-full p-8 shadow-2xl flex flex-col items-center gap-4 text-center border border-white/60"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between w-full">
                <div className="text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-100/60 px-2 py-0.5 rounded-full border border-sky-300/40">
                    MODE LAYAR PROYEKTOR DOSEN
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-1">Ruang 207: Pemrograman Mobile A</h3>
                </div>
                <button onClick={() => setShowProjectorModal(false)} className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-white/30">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="my-2 p-6 glass-inner rounded-3xl shadow-inner flex flex-col items-center">
                <DynamicQrDisplay
                  value={qrPayload}
                  pin={currentPin}
                  size={200}
                  onCopyPin={(p) => triggerToast(`Kode PIN ${p} berhasil disalin!`)}
                />
              </div>

              <div className="flex items-center flex-wrap justify-center gap-2">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    isGeofenceActive
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-amber-100 text-amber-800 border-amber-300"
                  }`}
                >
                  {isGeofenceActive ? "Geofence: Aktif (Radius 50m)" : "Geofence: Nonaktif (Bebas Lokasi)"}
                </span>
                <button
                  type="button"
                  onClick={handleGenerateNewPin}
                  className="text-xs font-bold text-sky-800 hover:text-sky-950 flex items-center gap-1 bg-white/70 px-2.5 py-1 rounded-xl shadow-xs"
                >
                  <Shuffle className="w-3 h-3" />
                  Acak PIN
                </button>
                <button
                  type="button"
                  onClick={handleRegenerateQr}
                  className="text-xs font-bold text-sky-800 hover:text-sky-950 flex items-center gap-1 bg-white/70 px-2.5 py-1 rounded-xl shadow-xs"
                >
                  <RotateCcw className="w-3 h-3" />
                  QR Baru
                </button>
              </div>

              <div className="w-full max-w-xs">
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Auto-Refresh Token</span>
                  <span className="text-sky-900 font-extrabold">{qrTimer} detik tersisa</span>
                </div>
                <div className="h-2 bg-black/15 rounded-full overflow-hidden border border-white/30">
                  <motion.div
                    className="h-full bg-sky-600 rounded-full"
                    style={{ width: `${(qrTimer / 15) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-sm mt-1">
                {isGeofenceActive
                  ? "Scan menggunakan aplikasi SATPAMO Mahasiswa dalam radius perimeter 50 meter Lab 207 Gedung B."
                  : "Mode bebas lokasi aktif: Mahasiswa dapat melakukan presensi tanpa batasan perimeter GPS."}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
