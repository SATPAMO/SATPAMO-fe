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
  RotateCcw,
  Check,
  ShieldCheck,
  Clock,
  MapPin,
  AlertTriangle,
  Lock,
  Sliders,
  CheckCircle2,
  Compass,
  X,
  Smartphone,
  PhoneCall,
  History,
  FileCheck
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function PengaturanKuota() {
  const navigate = useNavigate();
  const { dosen, logout } = useAuth();

  // State
  const [minAttendancePercent, setMinAttendancePercent] = useState<number>(75);
  const [conversionPolicy, setConversionPolicy] = useState<"2x_alpha" | "bertahap">("2x_alpha");
  const [toleranceMinutes, setToleranceMinutes] = useState<number>(15);
  const [notifyCritical, setNotifyCritical] = useState<boolean>(true);
  const [notifyWaliBaak, setNotifyWaliBaak] = useState<boolean>(true);
  const [scannerRadius, setScannerRadius] = useState<number>(50);
  const [qrInterval, setQrInterval] = useState<number>(15);
  const [deviceFingerprinting, setDeviceFingerprinting] = useState<boolean>(true);

  // Modals & Toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [showCalibrationModal, setShowCalibrationModal] = useState<boolean>(false);
  const [showHelpdeskModal, setShowHelpdeskModal] = useState<boolean>(false);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);

  const getInitials = (name?: string) => {
    if (!name) return "YK";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const navItems = [
    { icon: <Radio className="w-4 h-4" />, label: "Live Monitoring", active: false, path: "/" },
    { icon: <Calendar className="w-4 h-4" />, label: "Jadwal Sesi", active: false, path: "/jadwal-sesi" },
    { icon: <BarChart2 className="w-4 h-4" />, label: "Statistik Kelas", active: false, path: "/statistik-kelas" },
    { icon: <Settings className="w-4 h-4" />, label: "Pengaturan Kuota", active: true, path: "/pengaturan-kuota" },
  ];

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSave = () => {
    triggerToast("Perubahan pengaturan kuota & batas presensi berhasil disimpan!");
  };

  const handleResetToDefault = () => {
    setMinAttendancePercent(75);
    setConversionPolicy("2x_alpha");
    setToleranceMinutes(15);
    setNotifyCritical(true);
    setNotifyWaliBaak(true);
    setScannerRadius(50);
    setQrInterval(15);
    setDeviceFingerprinting(true);
    setShowResetModal(false);
    triggerToast("Pengaturan telah di-reset ke standar default regulasi BAAK!");
  };

  const handleCalibrate = () => {
    setIsCalibrating(true);
    setTimeout(() => {
      setIsCalibrating(false);
      setShowCalibrationModal(false);
      triggerToast("Koordinat GPS Lab Mobile Ruang 207 berhasil dikalibrasi ulang (-6.89042, 107.61031)!");
    }, 1500);
  };

  // Dynamic simulation calculations
  const atRiskCount = minAttendancePercent <= 70 ? 1 : minAttendancePercent <= 75 ? 2 : minAttendancePercent <= 80 ? 5 : 8;

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
            onClick={() => setShowHelpdeskModal(true)}
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

        {/* Page Title & Top Actions Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Pengaturan Kuota & Batas Ambang Presensi
              </h2>
              <span className="bg-sky-950 text-sky-200 text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                Semester Ganjil 2026/2027
              </span>
            </div>
            <p className="text-xs text-slate-700 mt-0.5">
              Atur batas minimum kehadiran, toleransi keterlambatan, dan ambang risiko untuk 42 mahasiswa di Ruang 207 Kelas T3A.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowResetModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold glass-pill hover:bg-white/60 text-slate-800 hover:text-slate-950 shadow-xs transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              Reset ke default BAAK
            </button>

            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white shadow-md transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-white" />
              Simpan Perubahan
            </button>
          </div>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 relative z-10">
          {/* Card 1: AMBANG BATAS UJIAN */}
          <div className="glass-panel glass-card-interactive rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-600">
                <p className="text-[10px] font-bold tracking-wider uppercase">
                  AMBANG BATAS UJIAN
                </p>
                <div className="w-5 h-5 rounded-md bg-sky-500/20 text-sky-800 flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-900 leading-none">
                  {minAttendancePercent.toFixed(1)}%
                </span>
                <span className="text-xs font-bold text-sky-900">Regulasi BAAK</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-600 mt-3 leading-snug">
              Standar regulasi BAAK kampus - Mahasiswa &lt;{minAttendancePercent}% dilarang mengikuti Ujian Akhir Semester
            </p>
          </div>

          {/* Card 2: TOLERANSI KETERLAMBATAN */}
          <div className="glass-panel glass-card-interactive rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-600">
                <p className="text-[10px] font-bold tracking-wider uppercase">
                  TOLERANSI KETERLAMBATAN
                </p>
                <div className="w-5 h-5 rounded-md bg-sky-500/20 text-sky-800 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-900 leading-none">
                  {toleranceMinutes}
                </span>
                <span className="text-xs font-bold text-slate-600">Menit</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-600 mt-3 leading-snug">
              0-{toleranceMinutes}m Hadir tepat, 16-30m terhitung 0.5x, dan &gt;30m terhitung Alpha otomatis di BAAK
            </p>
          </div>

          {/* Card 3: RADIUS GEOFENCE VALID */}
          <div className="glass-panel glass-card-interactive rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-600">
                <p className="text-[10px] font-bold tracking-wider uppercase">
                  RADIUS GEOFENCE VALID
                </p>
                <div className="w-5 h-5 rounded-md bg-sky-500/20 text-sky-800 flex items-center justify-center">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-900 leading-none">
                  {scannerRadius}
                </span>
                <span className="text-xs font-bold text-slate-600">Meter</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-600 mt-3 leading-snug">
              GPS radius perimeter Gedung B dikombinasikan dengan BLE Beacon Lab Komputer
            </p>
          </div>

          {/* Card 4: MAKSIMAL ALPHA */}
          <div className="glass-panel glass-card-interactive rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-rose-700">
                <p className="text-[10px] font-bold tracking-wider uppercase">
                  MAKSIMAL ALPHA
                </p>
                <div className="w-5 h-5 rounded-md bg-rose-500/15 text-rose-700 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-rose-600 leading-none">4</span>
                <span className="text-xs font-bold text-rose-600">Sesi Perkuliahan</span>
              </div>
            </div>
            <p className="text-[10px] text-rose-700 font-medium mt-3 leading-snug">
              Peringatan : Saat ini terdapat 2 mahasiswa telah mendekati batas kritis ketidakhadiran
            </p>
          </div>
        </div>

        {/* 2 Column Main Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start relative z-10">
          {/* Left Column (8 cols / 65%) */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            {/* Box 1: Parameter Kuota & Keterlambatan */}
            <div className="glass-panel rounded-3xl p-5 shadow-lg flex flex-col gap-5">
              {/* Box Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-800 flex items-center justify-center shrink-0">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 leading-snug">
                      Parameter Kuota & Keterlambatan
                    </h3>
                    <p className="text-[11px] text-slate-600">
                      Aturan batas minimum kelayakan ujian serta mekanisme akumulasi keterlambatan
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-900 border border-sky-400/30 text-[10px] font-bold">
                  <Lock className="w-3 h-3 text-sky-700" />
                  <span>Sinkronisasi BAAK</span>
                </div>
              </div>

              {/* Slider Box: Batas Minimum Kehadiran Mahasiswa Untuk UAS */}
              <div className="glass-inner rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">
                        Batas Minimum Kehadiran Mahasiswa Untuk UAS
                      </h4>
                      <span className="bg-amber-300 text-slate-900 text-[9px] font-bold px-2 py-0.5 rounded-full">
                        Standar Akreditasi
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Persentase minimal kehadiran fisik/daring yang diakui dari total 16 sesi perkuliahan
                    </p>
                  </div>

                  <span className="text-2xl font-black text-sky-900 leading-none">
                    {minAttendancePercent}%
                  </span>
                </div>

                {/* Slider bar with stops */}
                <div className="pt-2 pb-1">
                  <input
                    type="range"
                    min="60"
                    max="90"
                    step="5"
                    value={minAttendancePercent}
                    onChange={(e) => setMinAttendancePercent(Number(e.target.value))}
                    className="w-full accent-sky-600 h-2 bg-white/50 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-semibold text-slate-600 mt-1">
                    <span
                      onClick={() => setMinAttendancePercent(60)}
                      className={`cursor-pointer ${minAttendancePercent === 60 ? "text-sky-900 font-bold" : ""}`}
                    >
                      60% (Minimal BAAK)
                    </span>
                    <span
                      onClick={() => setMinAttendancePercent(75)}
                      className={`cursor-pointer ${minAttendancePercent === 75 ? "text-sky-900 font-bold" : ""}`}
                    >
                      75% (Rekomendasi Prodi)
                    </span>
                    <span
                      onClick={() => setMinAttendancePercent(85)}
                      className={`cursor-pointer ${minAttendancePercent === 85 ? "text-sky-900 font-bold" : ""}`}
                    >
                      85% (Kelas Khusus)
                    </span>
                    <span
                      onClick={() => setMinAttendancePercent(90)}
                      className={`cursor-pointer ${minAttendancePercent === 90 ? "text-sky-900 font-bold" : ""}`}
                    >
                      90% (Strict)
                    </span>
                  </div>
                </div>
              </div>

              {/* Kebijakan Konversi Keterlambatan */}
              <div className="flex flex-col gap-2.5">
                <h4 className="text-xs font-bold text-slate-900">
                  Kebijakan Konversi Keterlambatan
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Option 1 */}
                  <label
                    onClick={() => setConversionPolicy("2x_alpha")}
                    className={`rounded-2xl p-3.5 border transition-all cursor-pointer flex items-start gap-3 ${
                      conversionPolicy === "2x_alpha"
                        ? "glass-inner border-sky-400/60 bg-sky-500/15 shadow-xs"
                        : "glass-pill hover:bg-white/40 text-slate-700"
                    }`}
                  >
                    <div className="mt-0.5">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        conversionPolicy === "2x_alpha" ? "border-sky-600 bg-sky-600" : "border-slate-400"
                      }`}>
                        {conversionPolicy === "2x_alpha" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">2x Terlambat = 1x Alpha</p>
                      <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                        Akumulasi dua kali keterlambatan di atas 15 menit langsung memotong kuota 1 sesi hadir.
                      </p>
                    </div>
                  </label>

                  {/* Option 2 */}
                  <label
                    onClick={() => setConversionPolicy("bertahap")}
                    className={`rounded-2xl p-3.5 border transition-all cursor-pointer flex items-start gap-3 ${
                      conversionPolicy === "bertahap"
                        ? "glass-inner border-sky-400/60 bg-sky-500/15 shadow-xs"
                        : "glass-pill hover:bg-white/40 text-slate-700"
                    }`}
                  >
                    <div className="mt-0.5">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        conversionPolicy === "bertahap" ? "border-sky-600 bg-sky-600" : "border-slate-400"
                      }`}>
                        {conversionPolicy === "bertahap" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Potongan Bertahap (0.5x)</p>
                      <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                        Setiap keterlambatan dihitung 50% poin kehadiran tanpa langsung mengubah status menjadi alpha
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Toleransi Menit Menuju Terlambat Dropdown */}
              <div className="flex items-center justify-between p-3 rounded-2xl glass-inner">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-sky-700" />
                  <span className="text-xs font-bold text-slate-800">
                    Toleransi Menit Menuju Terlambat
                  </span>
                </div>
                <select
                  value={toleranceMinutes}
                  onChange={(e) => setToleranceMinutes(Number(e.target.value))}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/80 bg-white/70 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 cursor-pointer"
                >
                  <option value={10}>10 Menit</option>
                  <option value={15}>15 Menit (Default)</option>
                  <option value={20}>20 Menit</option>
                  <option value={30}>30 Menit</option>
                </select>
              </div>

              {/* Batas Pengajuan Surat Dokter & Dispensasi */}
              <div className="flex flex-col gap-2.5 pt-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <div className="w-4 h-4 rounded bg-sky-600 text-white flex items-center justify-center text-[10px]">
                    +
                  </div>
                  <span>Batas Pengajuan Surat Dokter & Dispensasi</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="glass-inner rounded-2xl p-3 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-900 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Maksimal Pengajuan H-3</p>
                      <p className="text-[10px] text-slate-600 mt-0.5 leading-relaxed">
                        Batas akhir upload bukti sakit/izin adalah 72 jam terhitung sejak sesi perkuliahan berakhir.
                      </p>
                    </div>
                  </div>

                  <div className="glass-inner rounded-2xl p-3 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-900 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Maksimal Pengajuan H-3</p>
                      <p className="text-[10px] text-slate-600 mt-0.5 leading-relaxed">
                        Batas akhir upload bukti sakit/izin adalah 72 jam terhitung sejak sesi perkuliahan berakhir.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sistem Notifikasi Peringatan Dini (Early Warning) */}
              <div className="flex flex-col gap-3 pt-2 border-t border-slate-300/40">
                <h4 className="text-xs font-bold text-slate-900">
                  Sistem Notifikasi Peringatan Dini (Early Warning)
                </h4>

                <div className="flex items-center justify-between gap-4 p-3 rounded-2xl glass-inner">
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Peringatan Kritis Mahasiswa (Sisa 1x Alpha)
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      Kirim email & whatsApp blast otomatis ke mahasiswa saat absensi tersisa 1 sesi sebelum tidak bisa ikut UAS.
                    </p>
                  </div>
                  <button
                    onClick={() => setNotifyCritical(!notifyCritical)}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                      notifyCritical ? "bg-sky-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                        notifyCritical ? "right-1" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4 p-3 rounded-2xl glass-inner">
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Tembusan ke Dosen Wali & BAAK
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      Jika mahasiswa tidak hadir 3 sesi berturut - turut tanpa surat izin resmi yang valid
                    </p>
                  </div>
                  <button
                    onClick={() => setNotifyWaliBaak(!notifyWaliBaak)}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                      notifyWaliBaak ? "bg-sky-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                        notifyWaliBaak ? "right-1" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Box 2: Keamanan Geofencing & Anti-Titip Absen */}
            <div className="glass-panel rounded-3xl p-5 shadow-lg flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-800 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 leading-snug">
                      Keamanan Geofencing & Anti-Titip Absen
                    </h3>
                    <p className="text-[11px] text-slate-600">
                      Verifikasi koordinat presensi dan perlindungan spoofing perangkat
                    </p>
                  </div>
                </div>

                <span className="bg-amber-300 text-slate-900 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                  Shield level 3
                </span>
              </div>

              {/* Sub grid: Titik Koordinat & Radius Scanner */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Titik Koordinat */}
                <div className="glass-inner rounded-2xl p-3.5 flex flex-col justify-between">
                  <p className="text-[10px] font-bold text-slate-600 tracking-wider uppercase">
                    TITIK KOORDINAT RUANG KELAS
                  </p>
                  <div className="flex items-start gap-2.5 my-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-800 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Lat -6.89042, Long 107.61031
                      </p>
                      <p className="text-[10px] text-slate-600">
                        Ruang 207 Gedung B (Lab Mobile)
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCalibrationModal(true)}
                    className="text-[10px] font-bold text-sky-800 hover:text-sky-950 flex items-center gap-1 self-start hover:underline mt-1"
                  >
                    <Compass className="w-3 h-3" />
                    Kalibrasi Ulang GPS
                  </button>
                </div>

                {/* Radius Toleransi Scanner */}
                <div className="glass-inner rounded-2xl p-3.5 flex flex-col justify-between">
                  <p className="text-[10px] font-bold text-slate-600 tracking-wider uppercase">
                    RADIUS TOLERANSI SCANNER
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 my-2">
                    {[25, 50, 100].map((r) => (
                      <button
                        key={r}
                        onClick={() => setScannerRadius(r)}
                        className={`py-1.5 px-2 rounded-xl text-center text-xs font-bold transition-all ${
                          scannerRadius === r
                            ? "bg-sky-500 text-white shadow-sm"
                            : "glass-pill hover:bg-white/60 text-slate-800"
                        }`}
                      >
                        <div>{r} Meter</div>
                        {scannerRadius === r && (
                          <div className="text-[8px] font-normal opacity-90 leading-none mt-0.5">
                            (Aktif)
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-600 leading-snug">
                    Disarankan 50m untuk mencakup seluruh sudut Lab 207 & koridor luar
                  </p>
                </div>
              </div>

              {/* Rotasi Token QR & Device Fingerprinting */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                {/* Rotasi Token QR */}
                <div className="p-3.5 rounded-2xl glass-inner flex flex-col justify-between">
                  <p className="text-[11px] font-bold text-slate-900 mb-2">
                    Rotasi Token QR Dinamis
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { sec: 10, label: "Ultra Safe" },
                      { sec: 15, label: "Rekomendasi" },
                      { sec: 30, label: "Koneksi Lemah" },
                    ].map((item) => (
                      <button
                        key={item.sec}
                        onClick={() => setQrInterval(item.sec)}
                        className={`py-1.5 px-2 rounded-xl text-center transition-all ${
                          qrInterval === item.sec
                            ? "bg-sky-500 text-white shadow-sm"
                            : "glass-pill hover:bg-white/60 text-slate-800"
                        }`}
                      >
                        <p className="text-xs font-bold leading-tight">{item.sec} Detik</p>
                        <p className={`text-[8px] leading-tight ${qrInterval === item.sec ? "opacity-90" : "text-slate-500"}`}>
                          {item.label}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Device Fingerprinting */}
                <div className="p-3.5 rounded-2xl glass-inner flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Device Fingerprinting
                    </p>
                    <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                      Blokir 1 smartphone melakukan scan untuk &gt;1 mahasiswa dalam sesi yang sama
                    </p>
                  </div>
                  <button
                    onClick={() => setDeviceFingerprinting(!deviceFingerprinting)}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                      deviceFingerprinting ? "bg-sky-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                        deviceFingerprinting ? "right-1" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (4 cols / 35%) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Box 1: Simulasi Dampak Regulasi */}
            <div className="glass-panel rounded-3xl p-5 shadow-lg flex flex-col gap-4">
              <h3 className="text-sm font-black text-slate-900">
                Simulasi Dampak Regulasi
              </h3>

              {/* Skenario Batas Saat Ini */}
              <div className="glass-inner rounded-2xl p-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Batas saat ini ({minAttendancePercent}%)
                  </span>
                  <span className="text-xs font-black text-rose-600">
                    {atRiskCount} Mahasiswa Terancam
                  </span>
                </div>
                <div className="w-full bg-white/40 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-rose-500 h-1.5 rounded-full"
                    style={{ width: `${(atRiskCount / 42) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  Mahasiswa: Yurii Kharlistov (73.3%), Yurii Kharlistov (71.0%)
                </p>
              </div>

              {/* Skenario Jika Dinaikkan 80% */}
              <div className="glass-panel border-rose-300/40 bg-rose-500/10 rounded-2xl p-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Jika dinaikkan 80%
                  </span>
                  <span className="text-xs font-black text-rose-600">
                    5 Mahasiswa
                  </span>
                </div>
                <p className="text-[10px] text-slate-700 leading-snug">
                  Tambahan 3 mahasiswa akan gugur syarat keikutsertaan Ujian Akhir Semester
                </p>
              </div>

              {/* Info rekomendasi */}
              <div className="flex items-center gap-2 text-[11px] text-slate-700 font-semibold pt-1">
                <CheckCircle2 className="w-4 h-4 text-sky-700 shrink-0" />
                <span>Rekomendasi BAAK: Pertahankan 75.0%</span>
              </div>
            </div>

            {/* Box 2: Audit Trail Terakhir */}
            <div className="glass-panel rounded-3xl p-5 shadow-lg flex flex-col gap-3.5">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-black text-slate-900">
                  Audit Trail Terakhir
                </h3>
              </div>

              <div className="flex flex-col gap-3">
                {/* Audit Item 1 */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-sky-500/20 text-sky-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      Ubah Toleransi: 10m &gt; 15m
                    </p>
                    <p className="text-[10px] text-slate-600 mt-0.5 leading-tight">
                      Dr. Ir Yurii Kharlistov, M.T. • 12 Mei 2026 • 09:14 WIB
                    </p>
                  </div>
                </div>

                {/* Audit Item 2 */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-sky-500/20 text-sky-800 flex items-center justify-center shrink-0 mt-0.5">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      Sinkronisasi Jadwal BAAK
                    </p>
                    <p className="text-[10px] text-slate-600 mt-0.5 leading-tight">
                      Dr. Ir Yurii Kharlistov, M.T. • 12 Mei 2026 • 09:14 WIB
                    </p>
                  </div>
                </div>

                {/* Audit Item 3 */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-sky-500/20 text-sky-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Smartphone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      Aktivasi Multi-Device Fingerprint
                    </p>
                    <p className="text-[10px] text-slate-600 mt-0.5 leading-tight">
                      12 Mei 2026 • 09:14 WIB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Box 3: Regulasi Akademik */}
            <div className="glass-panel rounded-3xl p-5 shadow-lg flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-black text-slate-900">
                  Regulasi Akademik
                </h3>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                Pedoman Standar Operasional Prosedur (SOP) Absensi & Ketentuan Kehadiran Mahasiswa No. 044/BAAK/2024
              </p>

              {/* Download pdf */}
              <a
                href="#download-pedoman"
                onClick={(e) => {
                  e.preventDefault();
                  triggerToast("Mengunduh Pedoman_Presensi_2024.pdf (2.4 MB)...");
                }}
                className="glass-inner hover:bg-white/40 rounded-xl p-2.5 flex items-center gap-2.5 transition-all text-xs font-bold text-slate-800"
              >
                <div className="w-6 h-6 rounded bg-rose-500 text-white flex items-center justify-center text-[9px] font-black shrink-0 shadow-xs">
                  PDF
                </div>
                <div className="min-w-0 flex-1 truncate">
                  <p className="truncate text-xs">Pedoman_Presensi_2024.pdf</p>
                  <p className="text-[10px] text-slate-500 font-normal">PDF 2.4 MB</p>
                </div>
              </a>

              <button
                onClick={() => setShowHelpdeskModal(true)}
                className="glass-pill hover:bg-white/60 w-full py-2 px-3 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-700" />
                Hubungi Helpdesk Akademik
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modal: Reset ke Default BAAK */}
      <AnimatePresence>
        {showResetModal && (
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
              className="glass-panel backdrop-blur-2xl rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-white/60 flex flex-col gap-4 text-slate-800"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center mx-auto border border-amber-300/30">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-slate-900 text-base">Reset Pengaturan ke Default?</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Semua konfigurasi kuota, radius geofence, dan toleransi keterlambatan akan dikembalikan ke standar baku BAAK (75% kuota, 15m toleransi, 50m radius).
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 py-2 text-xs glass-pill rounded-xl text-slate-700 hover:bg-white/60 font-semibold"
                >
                  Batal
                </button>
                <button
                  onClick={handleResetToDefault}
                  className="flex-1 py-2 text-xs bg-sky-600 text-white rounded-xl hover:bg-sky-700 font-bold transition-all shadow-md"
                >
                  Ya, Reset
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Kalibrasi Ulang GPS */}
      <AnimatePresence>
        {showCalibrationModal && (
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
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Kalibrasi Titik Koordinat GPS</h3>
                    <p className="text-[11px] text-slate-600">Ruang 207 Gedung B (Lab Mobile)</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCalibrationModal(false)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-white/40"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 glass-inner rounded-2xl text-xs flex flex-col gap-2">
                <p className="font-bold text-slate-900">Koordinat Saat Ini:</p>
                <div className="flex items-center justify-between bg-white/60 p-2.5 rounded-xl border border-white/80 font-mono text-[11px] text-slate-800">
                  <span>Latitude: -6.89042</span>
                  <span>Longitude: 107.61031</span>
                </div>
                <p className="text-[10px] text-slate-600">
                  Pastikan perangkat Anda berada di tengah ruangan laboratorium saat menekan kalibrasi untuk akurasi tertinggi.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-300/40">
                <button
                  onClick={() => setShowCalibrationModal(false)}
                  className="px-4 py-2 text-xs glass-pill rounded-xl text-slate-700 hover:bg-white/60 font-semibold"
                >
                  Batal
                </button>
                <button
                  onClick={handleCalibrate}
                  disabled={isCalibrating}
                  className="px-4 py-2 text-xs bg-sky-500 text-white rounded-xl hover:bg-sky-600 font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  {isCalibrating && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {isCalibrating ? "Mengambil Sinyal GPS..." : "Perbarui Koordinat Sekarang"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Helpdesk Akademik */}
      <AnimatePresence>
        {showHelpdeskModal && (
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
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Helpdesk Akademik & BAAK</h3>
                    <p className="text-[11px] text-slate-600">Layanan Bantuan Khusus Dosen</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHelpdeskModal(false)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-white/40"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-700 space-y-2.5">
                <p>
                  Untuk permohonan perubahan kuota khusus di luar kewenangan fakultas atau pembatalan status alpha mahasiswa yang keliru, hubungi:
                </p>
                <div className="p-3 glass-inner rounded-xl space-y-1 text-slate-800 font-medium">
                  <p>📞 Hotline BAAK: (0341) 551-611 ext 204</p>
                  <p>✉️ Email: baak-presensi@ub.ac.id</p>
                  <p>🏢 Lokasi: Gedung Rektorat Lt. 2 Sayap Timur</p>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-300/40">
                <button
                  onClick={() => setShowHelpdeskModal(false)}
                  className="px-4 py-2 text-xs bg-sky-500 text-white rounded-xl hover:bg-sky-600 font-bold transition-all shadow-md"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
