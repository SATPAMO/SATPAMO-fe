import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Search,
  LogOut,
  RefreshCw,
  AlertTriangle,
  MapPin,
  X,
  Radio,
  Calendar,
  BarChart2,
  Settings,
  HelpCircle,
  ChevronRight,
  QrCode,
  Wifi,
  Download,
  MoreVertical,
  FileText,
  CheckCircle2,
  Clock3,
  AlertCircle,
  TrendingUp,
  Users,
  Projector,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  attendanceApi,
  type AttendanceRecord,
  type AttendanceStats,
} from "../lib/api";

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

function QrCodeDisplay({ pin }: { pin: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative bg-white rounded-xl p-3 shadow-inner border border-sky-200">
        <svg
          width="140"
          height="140"
          viewBox="0 0 21 21"
          className="block"
          style={{ imageRendering: "pixelated" }}
        >
          <rect x="0" y="0" width="7" height="7" fill="#1e3a5f" rx="0.5" />
          <rect x="1" y="1" width="5" height="5" fill="white" rx="0.3" />
          <rect x="2" y="2" width="3" height="3" fill="#1e3a5f" rx="0.2" />
          <rect x="14" y="0" width="7" height="7" fill="#1e3a5f" rx="0.5" />
          <rect x="15" y="1" width="5" height="5" fill="white" rx="0.3" />
          <rect x="16" y="2" width="3" height="3" fill="#1e3a5f" rx="0.2" />
          <rect x="0" y="14" width="7" height="7" fill="#1e3a5f" rx="0.5" />
          <rect x="1" y="15" width="5" height="5" fill="white" rx="0.3" />
          <rect x="2" y="16" width="3" height="3" fill="#1e3a5f" rx="0.2" />
          {[
            [8, 0], [10, 0], [12, 0], [8, 2], [9, 2], [11, 2], [13, 2], [8, 4], [10, 4], [12, 4],
            [8, 6], [9, 6], [13, 6], [0, 8], [2, 8], [4, 8], [6, 8], [8, 8], [10, 8], [12, 8], [14, 8], [16, 8], [18, 8], [20, 8],
            [1, 9], [3, 9], [7, 9], [9, 9], [11, 9], [13, 9], [15, 9], [17, 9], [19, 9],
            [0, 10], [4, 10], [6, 10], [8, 10], [10, 10], [12, 10], [16, 10], [18, 10], [20, 10],
            [1, 11], [3, 11], [5, 11], [7, 11], [9, 11], [11, 11], [13, 11], [15, 11], [17, 11], [19, 11],
            [0, 12], [2, 12], [6, 12], [8, 12], [10, 12], [12, 12], [14, 12], [16, 12], [20, 12],
            [8, 14], [10, 14], [12, 14], [14, 14], [16, 14], [18, 14], [20, 14],
            [9, 15], [11, 15], [13, 15], [17, 15], [19, 15],
            [8, 16], [10, 16], [14, 16], [16, 16], [18, 16], [20, 16],
            [9, 17], [11, 17], [13, 17], [15, 17], [17, 17], [19, 17],
            [8, 18], [12, 18], [14, 18], [16, 18], [20, 18],
            [9, 19], [11, 19], [13, 19], [15, 19], [17, 19], [19, 19],
            [8, 20], [10, 20], [12, 20], [14, 20], [16, 20], [18, 20], [20, 20],
          ].map(([cx, cy], i) => (
            <rect key={i} x={cx} y={cy} width="1" height="1" fill="#1e3a5f" />
          ))}
        </svg>
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-sky-400 pointer-events-none"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
      <div className="text-center">
        <p className="text-xs text-sky-600 font-semibold">KODE PIN DARURAT</p>
        <p className="text-2xl font-black text-sky-700 tracking-widest">{pin}</p>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  sub2?: string;
  icon: React.ReactNode;
  iconBg: string;
  valueColor?: string;
  badge?: React.ReactNode;
}

function StatCard({ title, value, subtitle, sub2, icon, iconBg, valueColor, badge }: StatCardProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/60 shadow-sm flex flex-col gap-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide leading-tight">
          {title}
        </span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>
      <div className={`text-3xl font-black ${valueColor ?? "text-slate-800"}`}>{value}</div>
      {subtitle && <p className="text-[11px] text-slate-500 leading-tight">{subtitle}</p>}
      {sub2 && <p className="text-[11px] text-slate-400 leading-tight">{sub2}</p>}
      {badge}
    </div>
  );
}

function ActivityItem({ name, nim, time, accuracy }: {
  name: string; nim: string; time: string; accuracy: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-sky-100/60 last:border-0">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
        {getInitials(name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-700 truncate">{name}</p>
        <p className="text-[10px] text-slate-400 truncate">{nim}</p>
        <p className="text-[10px] text-sky-600">{accuracy}</p>
      </div>
      <span className="text-[10px] text-slate-400 shrink-0">{time}</span>
    </div>
  );
}

type TabFilter = "semua" | "hadir" | "izin" | "belum";

export function AttendanceDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<TabFilter>("semua");
  const [qrTimer, setQrTimer] = useState(15);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const { logout, dosen } = useAuth();
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setQrTimer((t) => (t <= 1 ? 15 : t - 1));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [recordsRes, statsRes] = await Promise.all([
        attendanceApi.getAll(),
        attendanceApi.getStats(),
      ]);
      if (recordsRes.success) setRecords(recordsRes.data || []);
      if (statsRes.success) setStats(statsRes.data || null);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoadingData(false);
    }
  }, [refreshKey]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => setRefreshKey((k) => k + 1), 20000);
    const onFocus = () => setRefreshKey((k) => k + 1);
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(interval); window.removeEventListener("focus", onFocus); };
  }, []);

  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  const totalEnrolled = stats?.total ?? 42;
  const hadirCount = stats?.present ?? 38;
  const lateCount = stats?.late ?? 0;
  const izinCount = stats?.izin ?? 3;
  const belumCount = Math.max(0, totalEnrolled - hadirCount - lateCount - izinCount);
  const hadirPct = totalEnrolled > 0 ? Math.round(((hadirCount + lateCount) / totalEnrolled) * 100) : 90;
  const kumulatif = 94.7;

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
    { icon: <Calendar className="w-4 h-4" />, label: "Jadwal Sesi", path: "/kelas" },
    { icon: <BarChart2 className="w-4 h-4" />, label: "Statistik Kelas", path: "/kelas" },
    { icon: <Settings className="w-4 h-4" />, label: "Pengaturan Kelas", path: "/kelas" },
  ];

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "linear-gradient(135deg,#38bdf8 0%,#0ea5e9 30%,#0284c7 60%,#60d8f7 100%)" }}
    >
      {/* Sidebar */}
      <aside
        className="w-56 shrink-0 flex flex-col py-6 px-4 gap-4"
        style={{ background: "linear-gradient(180deg,#1e6fa8 0%,#155e86 60%,#0c4a6e 100%)", boxShadow: "4px 0 24px rgba(0,0,0,0.18)" }}
      >
        <div className="mb-2">
          <h1 className="text-3xl font-black text-yellow-400 tracking-tight leading-none">SATPAMO</h1>
          <p className="text-sky-300 text-xs font-semibold tracking-widest mt-0.5">ADMIN</p>
        </div>
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
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${item.active
                  ? "bg-sky-400/30 text-white border border-sky-400/40"
                  : "text-sky-200 hover:bg-white/10 hover:text-white"
                }`}
            >
              {item.icon}
              {item.label}
              {item.active && <span className="ml-auto w-2 h-2 rounded-full bg-sky-300 animate-pulse" />}
            </button>
          ))}
          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sky-200 text-[11px] font-semibold uppercase tracking-wide">Mode Radar GPS</span>
              <span className="text-[10px] text-green-300 bg-green-900/40 px-2 py-0.5 rounded-full font-semibold">Aktif 50m</span>
            </div>
            <p className="text-sky-300 text-[10px] leading-tight">
              Presensi hanya sah dalam perimeter Ruang 207 Kampus Pusat
            </p>
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-sky-400 hover:bg-sky-300 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md"
            >
              <QrCode className="w-4 h-4" />
              Generate QR Dinamis
            </button>
          </div>
        </nav>
        <div className="flex flex-col gap-1 border-t border-white/10 pt-3">
          <button className="flex items-center gap-2 text-sky-300 hover:text-white text-xs px-2 py-1.5 rounded-lg hover:bg-white/10 transition-all">
            <HelpCircle className="w-4 h-4" />
            Bantuan SATPAMO
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 text-xs px-2 py-1.5 rounded-lg hover:bg-red-500/10 transition-all font-semibold"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto flex flex-col gap-4 p-5">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2.5 shadow-sm border border-white/60">
            <Wifi className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-xs font-black text-slate-800 leading-none">Ruang 207:</p>
              <p className="text-xs font-semibold text-sky-600">Pemrograman Mobile (Kelas T3A)</p>
            </div>
            <button className="ml-1 text-slate-400 hover:text-slate-600 transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              disabled={loadingData}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-2.5 shadow-sm border border-white/60 text-slate-500 hover:text-sky-600 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loadingData ? "animate-spin" : ""}`} />
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-sm font-black shadow-md">
              {dosen ? getInitials(dosen.username) : "YK"}
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-md">
            DASBOARD PRESENSI REAL-TIME
          </h2>
          <button className="flex items-center gap-2 bg-sky-100/80 backdrop-blur-sm text-sky-800 text-xs font-semibold px-4 py-2 rounded-xl border border-sky-200 hover:bg-sky-200 transition-all shadow-sm">
            <Download className="w-3.5 h-3.5" />
            Unduh berita acara presensi
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-5 gap-3">
          <StatCard
            title="Total Terdaftar"
            value={loadingData ? "—" : totalEnrolled}
            subtitle="Mahasiswa"
            sub2="100% Terverifikasi KRS"
            icon={<Users className="w-4 h-4 text-blue-500" />}
            iconBg="bg-blue-100"
          />
          <StatCard
            title="Sudah Hadir"
            value={loadingData ? "—" : hadirCount}
            subtitle={`${hadirPct}% · Mahasiswa`}
            sub2="Terakhir masuk: 2 menit yang lalu"
            icon={<CheckCircle2 className="w-4 h-4 text-green-500" />}
            iconBg="bg-green-100"
            valueColor="text-green-600"
          />
          <StatCard
            title="Izin / Sakit"
            value={loadingData ? "—" : izinCount}
            subtitle="Berkas Unggah"
            sub2="Memerlukan verifikasi"
            icon={<FileText className="w-4 h-4 text-orange-500" />}
            iconBg="bg-orange-100"
            valueColor="text-orange-500"
          />
          <StatCard
            title="Belum Presensi"
            value={loadingData ? "—" : belumCount}
            subtitle="Mahasiswa"
            badge={
              <div className="flex items-center gap-1 mt-0.5">
                <AlertTriangle className="w-3 h-3 text-red-500" />
                <span className="text-[10px] text-red-500 font-semibold">Batas sisa 43 menit</span>
              </div>
            }
            icon={<AlertCircle className="w-4 h-4 text-red-500" />}
            iconBg="bg-red-100"
            valueColor="text-red-500"
          />
          <StatCard
            title="Kumulatif SMT"
            value={`${kumulatif}%`}
            subtitle="Target min. 75%"
            badge={
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                <span className="text-[10px] text-green-600 font-semibold">Aman</span>
              </div>
            }
            icon={<TrendingUp className="w-4 h-4 text-purple-500" />}
            iconBg="bg-purple-100"
            valueColor="text-purple-600"
          />
        </div>

        {/* QR + Warning + Activity */}
        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-3 bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/60 shadow-sm">
            <div className="flex gap-6 items-start">
              <div className="flex flex-col items-center gap-2">
                <QrCodeDisplay pin="15710" />
                <div className="w-full mt-1">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Auto-Refresh</span>
                    <span className="text-sky-600 font-bold">{qrTimer}s</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full"
                      style={{ width: `${(qrTimer / 15) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-1">
                  <button className="flex items-center gap-1.5 text-[10px] border border-slate-200 text-slate-500 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all">
                    <RotateCcw className="w-3 h-3" />
                    Reset token sesi
                  </button>
                  <button className="flex items-center gap-1.5 text-[10px] bg-sky-500 text-white px-3 py-1.5 rounded-lg hover:bg-sky-600 transition-all">
                    <Projector className="w-3 h-3" />
                    Proyeksikan ke layar dosen
                  </button>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black text-slate-800 leading-tight">
                  QR-Code Dinamis<br />
                  <span className="text-sky-600">Presensi Berjalan</span>
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Setiap QR berganti otomatis setiap 15 detik dan dienkripsi dengan koordinat satelit GPS ruang 207 Gedung B. Mahasiswa yang berada di luar radius 50 meter tidak dapat melakukan validasi.
                </p>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-sky-50 rounded-xl p-3 border border-sky-100">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Kode Pin Darurat</p>
                    <p className="text-2xl font-black text-sky-600 tracking-widest mt-0.5">15710</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Gunakan ketika kamera ponsel bermasalah</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Area Geofence Valid</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <p className="text-sm font-black text-green-700">Radius 50m</p>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">-6.890423.107,<br />61031(Ruang 207)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-2 flex flex-col gap-3">
            <div className="bg-red-50/90 backdrop-blur-sm rounded-2xl p-4 border border-red-200 shadow-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-red-700">Peringatan Kuota Kehadiran</p>
                  <p className="text-[11px] text-red-600 mt-1 leading-relaxed">
                    1 Mahasiswa (Y. Kharlistov) dalam pantauan kritis ambang batas absensi (&lt;75%). Risiko tidak dapat mengikuti Ujian Akhir Semester
                  </p>
                </div>
              </div>
            </div>
            <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/60 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-700">Live Activity Feed</span>
                </div>
                <span className="text-[10px] text-slate-400">Real-time update</span>
              </div>
              <div className="overflow-y-auto max-h-44 pr-1">
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
                  ["Yurii Kharlistov", "Yurii Kharlistov", "Yurii Kharlistov"].map((name, i) => (
                    <ActivityItem
                      key={i}
                      name={name}
                      nim="yuriikharlistov@student.ub.ac.id"
                      time={`10:52:${String(i * 10).padStart(2, "0")} ●`}
                      accuracy="QR GPS · Akurasi 12 meter"
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === tab.key
                      ? "bg-sky-500 text-white shadow-md"
                      : "text-slate-500 hover:bg-sky-50 hover:text-sky-700"
                    }`}
                >
                  {tab.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari NIM atau nama..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-52 text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-300 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-[2fr_1.5fr_1fr_1.5fr_1.5fr_1fr_1fr] px-4 py-2 bg-slate-50/80 border-b border-slate-100">
            {["Mahasiswa", "NIM", "Waktu Presensi", "Metode & Akurasi GPS", "Status Kehadiran", "Bukti/lampiran", "Aksi"].map((h) => (
              <span key={h} className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{h}</span>
            ))}
          </div>

          <div className="divide-y divide-slate-50">
            <AnimatePresence>
              {loadingData ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-slate-100 animate-pulse rounded w-1/3" />
                      <div className="h-2 bg-slate-100 animate-pulse rounded w-1/4" />
                    </div>
                  </div>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((row, i) => (
                  <motion.div
                    key={row.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    className="grid grid-cols-[2fr_1.5fr_1fr_1.5fr_1.5fr_1fr_1fr] px-4 py-3 items-center hover:bg-sky-50/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                        {getInitials(row.name)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{row.name}</p>
                        <p className="text-[10px] text-sky-600">Kehadiran {hadirPct}% (30 sesi)</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-slate-500">{row.nim}</span>
                    <div>
                      <p className="text-xs font-bold text-slate-700">
                        {formatTime(row.checkIn)} WIB
                      </p>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                      <div>
                        {row.status === "IZIN" ? (
                          <>
                            <p className="text-[11px] font-semibold text-slate-600">Portal Mandiri Mahasiswa</p>
                            <p className="text-[10px] text-slate-400">Klinik kampus medika</p>
                          </>
                        ) : (
                          <>
                            <p className="text-[11px] font-semibold text-slate-600">QR+ Geolocation</p>
                            <p className="text-[10px] text-slate-400">Radius {row.distance ?? 14}m dari R.207</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      {row.status === "PRESENT" || row.status === "LATE" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-green-100 text-green-700 font-semibold px-3 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Hadir tepat waktu
                        </span>
                      ) : row.status === "IZIN" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-orange-100 text-orange-700 font-semibold px-3 py-1 rounded-full">
                          <Clock3 className="w-3 h-3" />
                          Sakit (Menunggu Validasi)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-red-100 text-red-700 font-semibold px-3 py-1 rounded-full">
                          <X className="w-3 h-3" />
                          Belum Hadir
                        </span>
                      )}
                    </div>
                    <div>
                      {row.status === "IZIN" ? (
                        <span className="flex items-center gap-1 text-[10px] text-sky-600 font-semibold">
                          <FileText className="w-3.5 h-3.5" />
                          surat_sakit.pdf
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-300">—</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedRecord(row)}
                        className="text-[10px] font-semibold text-slate-500 hover:text-sky-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-sky-300 hover:bg-sky-50 transition-all"
                      >
                        Ubah Status
                      </button>
                      <button className="text-slate-400 hover:text-slate-600 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-16 text-center text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">
                    {searchTerm ? `Tidak ada mahasiswa "${searchTerm}"` : "Belum ada data presensi"}
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedRecord(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">Detail Presensi</h3>
                <button onClick={() => setSelectedRecord(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-black">
                    {getInitials(selectedRecord.name)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{selectedRecord.name}</p>
                    <p className="text-sm text-slate-500">{selectedRecord.nim}</p>
                    <p className="text-xs text-slate-400">{selectedRecord.jurusan}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-3">
                  <div>
                    <p className="text-xs text-slate-400">Waktu Check-in</p>
                    <p className="text-sm font-bold text-slate-700">{formatTime(selectedRecord.checkIn)} WIB</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Status</p>
                    <p className="text-sm font-bold text-slate-700">{selectedRecord.status}</p>
                  </div>
                  {selectedRecord.distance != null && (
                    <div>
                      <p className="text-xs text-slate-400">Jarak GPS</p>
                      <p className="text-sm font-bold text-slate-700">{selectedRecord.distance}m dari kampus</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-slate-400">Lokasi Valid</p>
                    <p className={`text-sm font-bold ${selectedRecord.isLocationValid ? "text-green-600" : "text-red-500"}`}>
                      {selectedRecord.isLocationValid ? "Di dalam kampus" : "Di luar kampus"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Tutup
                </button>
                <button className="px-4 py-2 text-sm bg-sky-500 text-white rounded-xl hover:bg-sky-600 transition-all font-semibold flex items-center gap-2">
                  <ChevronRight className="w-4 h-4" />
                  Ubah Status
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
