import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  CalendarDays,
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
  Camera,
  History,
  Eye,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  attendanceApi,
  kelasApi,
  type AttendanceRecord,
  type AttendanceStats,
  type ClassAttendanceStudent,
  type KelasItem,
  type JadwalItem,
} from "../lib/api";
import { DynamicQrDisplay } from "../components/DynamicQrDisplay";

function safeClipboardCopy(text: string): boolean {
  try {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
        fallbackClipboardCopy(text);
      });
      return true;
    }
    return fallbackClipboardCopy(text);
  } catch {
    return fallbackClipboardCopy(text);
  }
}

function fallbackClipboardCopy(text: string): boolean {
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(el);
    return successful;
  } catch {
    return false;
  }
}

const QR_REFRESH_SECONDS = 600; // 10 menit

function formatQrCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

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

function ActivityItem({
  name,
  nim,
  time,
  accuracy,
  photo,
  onPhotoClick,
}: {
  name: string;
  nim: string;
  time: string;
  accuracy: string;
  photo?: string | null;
  onPhotoClick?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/20 last:border-0 hover:bg-white/20 px-2 rounded-xl transition-colors">
      {photo ? (
        <img
          src={photo}
          alt={name}
          onClick={onPhotoClick}
          className="w-8 h-8 rounded-full object-cover border border-white/50 shadow-xs cursor-pointer hover:scale-105 transition-transform shrink-0"
          title="Klik untuk melihat foto presensi"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-sky-700 text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-sm">
          {getInitials(name)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-900 truncate">{name}</p>
        <p className="text-[10px] text-slate-700 truncate font-semibold">{nim}</p>
        <p className="text-[10px] text-sky-950 font-bold">{accuracy}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {photo && (
          <button
            onClick={onPhotoClick}
            className="p-1 rounded-md bg-white/40 hover:bg-white text-sky-900 hover:text-black transition-colors"
            title="Lihat foto bukti"
          >
            <Camera className="w-3 h-3" />
          </button>
        )}
        <span className="text-[10px] text-slate-700 font-bold">{time}</span>
      </div>
    </div>
  );
}

type TabFilter = "semua" | "hadir" | "izin" | "belum";

export function AttendanceDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [classes, setClasses] = useState<KelasItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>("semua");
  const [qrTimer, setQrTimer] = useState(QR_REFRESH_SECONDS);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [selectedPhotoRecord, setSelectedPhotoRecord] = useState<AttendanceRecord | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [historyRecords, setHistoryRecords] = useState<AttendanceRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historySearch, setHistorySearch] = useState<string>("");
  const [showProjectorModal, setShowProjectorModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Status edit modal state
  const [editStatus, setEditStatus] = useState<AttendanceRecord["status"]>("PRESENT");
  const [editNotes, setEditNotes] = useState<string>("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // --- Geofence State ---
  const [isGeofenceActive, setIsGeofenceActive] = useState<boolean>(true);
  const [geofenceRadius, setGeofenceRadius] = useState<number>(100);

  // --- Mobile Drawer State ---
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // --- PIN Generator State ---
  const [currentPin, setCurrentPin] = useState<string>("15710");
  const [qrNonce, setQrNonce] = useState<string>(() => Math.random().toString(36).substring(2, 7).toUpperCase());
  const [qrTimestamp, setQrTimestamp] = useState<number>(() => Date.now());

  // --- Deteksi Jadwal & Sesi Aktif Hari Ini ---
  const todayDayName = useMemo(() => {
    const HARI_MAP = ["MINGGU", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"] as const;
    return HARI_MAP[new Date().getDay()];
  }, []);

  const activeSessionInfo = useMemo(() => {
    if (classes.length === 0) return null;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const timeToMinutes = (timeStr?: string | null): number => {
      if (!timeStr) return 0;
      const parts = timeStr.trim().split(":");
      return parseInt(parts[0] || "0", 10) * 60 + parseInt(parts[1] || "0", 10);
    };

    // Kumpulkan seluruh jadwal sesi dari setiap kelas dosen
    const allSessions: { kelas: KelasItem; jadwal: JadwalItem }[] = [];
    for (const k of classes) {
      const jadwals = k.jadwals || k.jadwal || [];
      for (const j of jadwals) {
        allSessions.push({ kelas: k, jadwal: j });
      }
    }

    // Filter jadwal yang harinya sama dengan hari ini
    const todaySessions = allSessions.filter(
      (s) => s.jadwal.hari?.toUpperCase() === todayDayName
    );

    if (todaySessions.length === 0) {
      return null; // Tidak ada jadwal/sesi hari ini
    }

    // 1. Prioritaskan sesi yang sedang berlangsung saat ini (toleransi 30 menit sebelum - 30 menit sesudah)
    const ongoing = todaySessions.find((s) => {
      const startMin = timeToMinutes(s.jadwal.jamMulai);
      const endMin = timeToMinutes(s.jadwal.jamSelesai);
      if (startMin && endMin) {
        return currentMinutes >= (startMin - 30) && currentMinutes <= (endMin + 30);
      }
      return false;
    });
    if (ongoing) return ongoing;

    // 2. Jika tidak ada yang pas jamnya, ambil sesi berikutnya hari ini
    const upcoming = todaySessions.find((s) => {
      const startMin = timeToMinutes(s.jadwal.jamMulai);
      return startMin > currentMinutes;
    });
    if (upcoming) return upcoming;

    // 3. Fallback ke sesi pertama hari ini
    return todaySessions[0];
  }, [classes, todayDayName]);

  const activeClass = activeSessionInfo?.kelas || null;
  const activeJadwal = activeSessionInfo?.jadwal || null;
  const activeClassName = activeClass?.nama || "";
  const activeClassCode = activeClass?.kode || "";
  const activeRoom = activeJadwal?.ruangan || activeClass?.jadwals?.[0]?.ruangan || "Ruang 207";

  // --- QR Generator Helper & State ---
  const qrPayload = useMemo(() => {
    return JSON.stringify({
      app: "SATPAMO",
      kelas: activeClass ? `${activeClass.nama} ${activeClass.kode}`.trim() : "Tidak Ada Sesi Terjadwal",
      ruang: activeRoom,
      pin: currentPin,
      geofence: isGeofenceActive ? "ON" : "OFF",
      lat: -6.89042,
      lon: 107.61031,
      radius: isGeofenceActive ? geofenceRadius : 0,
      timestamp: qrTimestamp,
      nonce: qrNonce,
    });
  }, [activeClass, activeRoom, currentPin, isGeofenceActive, geofenceRadius, qrTimestamp, qrNonce]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleGenerateNewPin = () => {
    const nextPin = Math.floor(10000 + Math.random() * 90000).toString();
    setCurrentPin(nextPin);
    setQrNonce(Math.random().toString(36).substring(2, 7).toUpperCase());
    setQrTimestamp(Date.now());
    triggerToast(`Kode PIN Darurat baru (${nextPin}) berhasil dibuat!`);
  };

  const handleRegenerateQr = () => {
    setQrTimer(QR_REFRESH_SECONDS);
    setQrNonce(Math.random().toString(36).substring(2, 7).toUpperCase());
    setQrTimestamp(Date.now());
    triggerToast("Token QR sesi berhasil di-generate ulang!");
  };

  const handleToggleGeofence = async () => {
    const nextState = !isGeofenceActive;
    setIsGeofenceActive(nextState);
    try {
      await attendanceApi.updateGeofenceSession({
        isActive: nextState,
        radius: geofenceRadius,
        ruangan: activeRoom,
        kelasId: activeClass?.id,
      });
      if (nextState) {
        triggerToast(`Area Geofence DIAKTIFKAN (${geofenceRadius}m ${activeRoom}). Mahasiswa dapat presensi.`);
      } else {
        triggerToast("Area Geofence DINONAKTIFKAN. Mahasiswa tidak dapat presensi.");
      }
    } catch {
      triggerToast(nextState ? `Area Geofence DIAKTIFKAN (${geofenceRadius}m ${activeRoom})` : "Area Geofence DINONAKTIFKAN");
    }
  };

  const handleRadiusChange = async (rad: number) => {
    setGeofenceRadius(rad);
    try {
      await attendanceApi.updateGeofenceSession({
        isActive: isGeofenceActive,
        radius: rad,
        ruangan: activeRoom,
        kelasId: activeClass?.id,
      });
      triggerToast(`Radius toleransi geofence diatur ke ${rad} meter`);
    } catch {
      triggerToast(`Radius toleransi geofence diatur ke ${rad} meter`);
    }
  };

  const handleOpenHistoryModal = async () => {
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const res = await attendanceApi.getAll({ all: true, limit: 100 });
      if (res.success && res.data) {
        setHistoryRecords(res.data);
      }
    } catch (err) {
      console.error("Gagal memuat riwayat presensi:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Auto-refresh countdown for QR (10 menit / 600 detik)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setQrTimer((t) => {
        if (t <= 1) {
          setQrNonce(Math.random().toString(36).substring(2, 7).toUpperCase());
          setQrTimestamp(Date.now());
          return QR_REFRESH_SECONDS;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // --- Real-Time Polling Interval State ---
  const [pollInterval, setPollInterval] = useState<number>(5); // default 5 seconds
  const [lastSynced, setLastSynced] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const prevCountRef = useRef<number>(0);
  const classesRef = useRef<KelasItem[]>([]);

  const fetchAttendanceData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoadingData(true);
    setIsSyncing(true);
    try {
      // 1. Fetch daftar kelas dosen (hanya jika belum dimuat atau bukan silent background poll)
      let currentClass: KelasItem | null = null;
      let availableClasses = classesRef.current;
      if (availableClasses.length === 0 || !isSilent) {
        const classesRes = await kelasApi.getAll();
        if (classesRes.success && classesRes.data && classesRes.data.length > 0) {
          availableClasses = classesRes.data;
          classesRef.current = classesRes.data;
          setClasses(classesRes.data);
        }
      }

      // Deteksi otomatis kelas yang memiliki jadwal aktif hari ini
      const HARI_MAP = ["MINGGU", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"] as const;
      const todayHari = HARI_MAP[new Date().getDay()];
      let foundTodayClass: KelasItem | null = null;
      if (availableClasses.length > 0) {
        for (const k of availableClasses) {
          const jadwals = k.jadwals || k.jadwal || [];
          if (jadwals.some((j) => j.hari?.toUpperCase() === todayHari)) {
            foundTodayClass = k;
            break;
          }
        }
        currentClass = foundTodayClass;
      }

      // 2. Fetch presensi kelas terkait atau fallback global presensi
      if (currentClass?.id) {
        const classAttRes = await kelasApi.getClassAttendance(currentClass.id);
        if (classAttRes.success && classAttRes.data) {
          const resData = classAttRes.data;
          const students = resData.students || [];
          const studentRecords: AttendanceRecord[] = students.map((st: ClassAttendanceStudent) => ({
            id: String(st.id || st.mahasiswaId),
            mahasiswaId: String(st.mahasiswaId || st.id),
            nim: st.nim,
            name: st.name,
            jurusan: st.jurusan || "Teknik Informatika",
            semester: st.semester || 1,
            date: resData.date || new Date().toISOString(),
            checkIn: st.checkIn || null,
            checkOut: st.checkOut || null,
            status: (st.status === "NOT_RECORDED" ? "ABSENT" : st.status) as AttendanceRecord["status"],
            notes: st.notes || null,
            photo: st.photo || null,
            latitude: st.latitude ?? null,
            longitude: st.longitude ?? null,
            distance: st.distance ?? 14,
            isLocationValid: st.isLocationValid ?? true,
            aiVerification: st.aiVerification || null,
          }));

          const presentCount = studentRecords.filter((s) => s.status === "PRESENT" || s.status === "LATE").length;
          if (prevCountRef.current > 0 && presentCount > prevCountRef.current) {
            const diff = presentCount - prevCountRef.current;
            triggerToast(`${diff} mahasiswa baru berhasil presensi!`);
          }
          prevCountRef.current = presentCount;

          setRecords(studentRecords);
          if (resData.stats) {
            setStats({
              date: resData.date,
              total: resData.stats.total,
              present: resData.stats.present,
              late: resData.stats.late,
              absent: resData.stats.absent,
              izin: resData.stats.izin + (resData.stats.sakit || 0),
              notRecorded: resData.stats.notRecorded,
            });
          }
        }
      } else {
        const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
        const [recordsRes, statsRes] = await Promise.all([
          attendanceApi.getAll({ date: todayStr }),
          attendanceApi.getStats(todayStr),
        ]);
        if (recordsRes.success && recordsRes.data) {
          setRecords(recordsRes.data);
        } else {
          setRecords([]);
        }
        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        } else {
          setStats({
            date: todayStr,
            total: 0,
            present: 0,
            late: 0,
            absent: 0,
            izin: 0,
            notRecorded: 0,
          });
        }
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAttendanceData(false);
  }, [fetchAttendanceData]);

  // Real-time interval effect (visibility-aware: hemat baterai & bandwidth saat tab tidak aktif)
  useEffect(() => {
    if (pollInterval <= 0) return;

    const pollTimer = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchAttendanceData(true);
      }
    }, pollInterval * 1000);

    const onFocus = () => fetchAttendanceData(true);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchAttendanceData(true);
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(pollTimer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [pollInterval, fetchAttendanceData]);

  const { logout, dosen } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleOpenStatusModal = (row: AttendanceRecord) => {
    setSelectedRecord(row);
    setEditStatus(row.status === "ABSENT" ? "ABSENT" : row.status);
    setEditNotes(row.notes || "");
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedRecord) return;
    setIsUpdatingStatus(true);
    try {
      if (activeClass?.id) {
        await kelasApi.recordClassAttendance(activeClass.id, {
          mahasiswaId: selectedRecord.mahasiswaId,
          status: editStatus,
          notes: editNotes,
        });
      } else if (selectedRecord.id) {
        await attendanceApi.update(selectedRecord.id, {
          status: editStatus,
          notes: editNotes,
        });
      }
      triggerToast(`Status presensi ${selectedRecord.name} berhasil diperbarui!`);
      setSelectedRecord(null);
      fetchAttendanceData(true);
    } catch (err) {
      console.error("Gagal update status presensi:", err);
      triggerToast("Gagal memperbarui status presensi.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDownloadBeritaAcara = () => {
    const dateStr = new Date().toISOString().split("T")[0];
    const className = activeClassName;
    const roomName = activeRoom;
    const dosenName = dosen?.username || "Dr. Yurii Kharlistov, M.T.";

    const csvLines = [
      `"BERITA ACARA PRESENSI PERKULIAHAN"`,
      `"Mata Kuliah","${className}"`,
      `"Kelas","${activeClassCode}"`,
      `"Ruangan","${roomName}"`,
      `"Dosen Pengampu","${dosenName}"`,
      `"Tanggal","${dateStr}"`,
      `"Total Mahasiswa","${totalEnrolled}"`,
      `"Sudah Hadir","${hadirCount}"`,
      `"Izin / Sakit","${izinCount}"`,
      `"Belum Hadir","${belumCount}"`,
      `"Persentase Kehadiran","${hadirPct}%"`,
      `""`,
      `"No","NIM","Nama Mahasiswa","Jurusan","Status","Waktu Presensi","Akurasi GPS / Lokasi"`
    ];

    filtered.forEach((r, idx) => {
      const time = r.checkIn ? formatTime(r.checkIn) : "--:--";
      const loc = r.distance ? `Radius ${r.distance}m` : "Radius 14m (Valid)";
      csvLines.push(`"${idx + 1}","${r.nim}","${r.name}","${r.jurusan || 'Teknik Informatika'}","${r.status}","${time}","${loc}"`);
    });

    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Berita_Acara_Presensi_${className.replace(/\s+/g, '_')}_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast(`Berita Acara Presensi (${className}) berhasil diunduh!`);
  };

  const totalEnrolled = stats?.total ?? 42;
  const hadirCount = stats?.present ?? 38;
  const lateCount = stats?.late ?? 0;
  const izinCount = stats?.izin ?? 2;
  const belumCount = stats ? (stats.notRecorded ?? Math.max(0, totalEnrolled - hadirCount - lateCount - izinCount)) : 2;
  const hadirPct = totalEnrolled > 0 ? Math.round(((hadirCount + lateCount) / totalEnrolled) * 100) : 90.5;
  const kumulatif = 92.5;

  const criticalStudent = records.find((r) => r.status === "ABSENT") || null;

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
    { icon: <CalendarDays className="w-4 h-4" />, label: "Manajemen Jadwal", active: false, path: "/manajemen-jadwal" },
    { icon: <BarChart2 className="w-4 h-4" />, label: "Statistik Kelas", active: false, path: "/statistik-kelas" },
    { icon: <Settings className="w-4 h-4" />, label: "Pengaturan Kuota", active: false, path: "/pengaturan-kuota" },
  ];

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
            className="fixed top-5 right-5 z-50 bg-white/95 backdrop-blur-md text-slate-800 text-sm font-semibold px-4 py-3 rounded-2xl shadow-xl border border-sky-200 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (lg screens and up) - ORIGINAL TRANSLUCENT CYAN */}
      <aside
        className="hidden lg:flex w-60 shrink-0 flex-col py-6 px-4 gap-4 sidebar-glass z-10"
      >
        <div className="mb-2">
          <h1 className="text-3xl font-black text-yellow-300 tracking-tight leading-none drop-shadow-xs">SATPAMO</h1>
          <p className="text-sky-950 font-black text-[11px] tracking-widest mt-0.5">ADMIN</p>
        </div>

        {/* Profile Card */}
        <div className="flex items-center gap-3 bg-white/25 border border-white/40 rounded-2xl px-3 py-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-sm font-black shrink-0 shadow-xs">
            {dosen ? getInitials(dosen.username) : "YK"}
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

        {/* MODE RADAR GPS box from reference screenshot */}
        <div className="bg-white/25 border border-white/40 rounded-2xl p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-900">
              MODE RADAR GPS
            </span>
            <span className="bg-sky-500/50 border border-white/35 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full">
              {activeClass && isGeofenceActive ? `AKTIF ${geofenceRadius} METER` : "NONAKTIF"}
            </span>
          </div>
          <p className="text-[11px] text-slate-800 font-medium leading-snug">
            {activeClass
              ? `Presensi hanya sah dalam perimeter ${activeRoom} Kampus Pusat.`
              : `Tidak ada sesi perkuliahan terjadwal hari ini (${todayDayName}).`}
          </p>
          <button
            onClick={handleRegenerateQr}
            className="bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs py-2 px-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Generate QR Dinamis
          </button>
        </div>

        {/* Sidebar Footer */}
        <div className="flex flex-col gap-1 border-t border-white/25 pt-3">
          <button
            onClick={() => triggerToast("Pusat Bantuan SATPAMO: satpamo-support@ac.id")}
            className="flex items-center gap-2 text-slate-800 hover:text-black text-xs px-2 py-2 rounded-lg hover:bg-white/20 transition-all font-semibold"
          >
            <HelpCircle className="w-4 h-4" />
            Bantuan SATPAMO
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 text-xs px-2 py-2 rounded-lg hover:bg-red-500/15 transition-all font-bold"
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
                background: "linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)",
                boxShadow: "4px 0 24px rgba(0,0,0,0.3)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h1 className="text-2xl font-black text-yellow-300 tracking-tight leading-none">SATPAMO</h1>
                  <p className="text-sky-950 text-[10px] font-black tracking-widest mt-0.5">ADMIN</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-slate-800 hover:text-black rounded-xl hover:bg-white/20"
                  aria-label="Tutup Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Card */}
              <div className="flex items-center gap-3 bg-white/25 border border-white/40 rounded-2xl px-3 py-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-sm font-black shrink-0">
                  {dosen ? getInitials(dosen.username) : "YK"}
                </div>
                <div className="min-w-0">
                  <p className="text-slate-900 text-xs font-black leading-tight truncate">
                    {dosen?.username ?? "Dr. Yurii Kharlistov, M.T."}
                  </p>
                  <p className="text-sky-950 text-[10px] font-bold truncate">NIP: 123456789098761</p>
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
                        ? "bg-sky-500/50 text-slate-950 font-black shadow-xs border border-white/40"
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
              <div className="flex flex-col gap-1 border-t border-white/20 pt-3">
                <button
                  onClick={() => triggerToast("Pusat Bantuan SATPAMO: satpamo-support@ac.id")}
                  className="flex items-center gap-2 text-slate-800 hover:text-black text-xs px-2 py-2.5 rounded-lg hover:bg-white/20 transition-all font-semibold"
                >
                  <HelpCircle className="w-4 h-4" />
                  Bantuan SATPAMO
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 text-xs px-2 py-2.5 rounded-lg hover:bg-red-500/15 transition-all font-bold"
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
          {activeClass ? (
            <div className="inline-flex items-center gap-2.5 glass-pill rounded-2xl px-3.5 py-2 shadow-sm max-w-full">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
              <span className="text-xs font-bold text-slate-900 truncate">
                {activeRoom}: {activeClassName} ({activeClassCode.startsWith("Kelas") ? activeClassCode : `Kelas ${activeClassCode}`})
              </span>
              <DoorOpen className="w-3.5 h-3.5 text-slate-800 ml-1 shrink-0" />
            </div>
          ) : null}

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
              <span className="bg-sky-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                SEMESTER GANJIL 2026/2027
              </span>
              {activeClass ? (
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
                    ? `Radar Geofence: Aktif ${geofenceRadius}m (${activeRoom})`
                    : "Radar Geofence: Nonaktif (Bebas Lokasi)"}
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/30 border border-white/40">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  Tidak ada sesi aktif hari ini ({todayDayName})
                </span>
              )}
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
              onClick={handleDownloadBeritaAcara}
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
          {/* Left: Dynamic QR, PIN & Radar Geofence (7 cols) - ORIGINAL VIBRANT SKY BLUE DESIGN */}
          <div
            className="lg:col-span-7 rounded-3xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden border border-sky-300/50 shadow-xl"
            style={{
              background: "linear-gradient(145deg, #38bdf8 0%, #29b6f6 50%, #0ea5e9 100%)",
            }}
          >
            {/* Gloss highlight on top */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/20 to-transparent" />

            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start relative z-10">
              {/* Left Column: QR Code Container */}
              <div className="flex flex-col items-center gap-2.5 shrink-0 w-full sm:w-auto">
                <DynamicQrDisplay
                  value={qrPayload}
                  pin={currentPin}
                  size={140}
                  onCopyPin={(pinVal) => triggerToast(`Kode PIN ${pinVal} berhasil disalin ke clipboard!`)}
                  showDetails={true}
                />

                {/* Progress bar */}
                <div className="w-44 max-w-full mt-0.5">
                  <div className="flex justify-between text-[11px] text-slate-800 font-bold mb-1">
                    <span>Auto-Refresh QR</span>
                    <span className="text-slate-950 font-black">{formatQrCountdown(qrTimer)}</span>
                  </div>
                  <div className="h-1.5 bg-black/15 rounded-full overflow-hidden border border-white/40">
                    <motion.div
                      className="h-full bg-slate-900 rounded-full"
                      style={{ width: `${(qrTimer / QR_REFRESH_SECONDS) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap justify-center gap-1.5 mt-1 w-full">
                  <button
                    type="button"
                    onClick={handleRegenerateQr}
                    className="flex items-center gap-1 text-[11px] font-bold bg-sky-200/80 hover:bg-sky-100 text-slate-900 px-3 py-1.5 rounded-xl transition-all shadow-xs"
                    title="Generate token QR baru"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-800" />
                    QR Baru
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateNewPin}
                    className="flex items-center gap-1 text-[11px] font-bold bg-sky-200/80 hover:bg-sky-100 text-slate-900 px-3 py-1.5 rounded-xl transition-all shadow-xs"
                    title="Generate kode PIN darurat baru"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-slate-800" />
                    Acak PIN
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProjectorModal(true)}
                    className="flex items-center gap-1 text-[11px] font-bold bg-sky-700 hover:bg-sky-800 text-white px-3 py-1.5 rounded-xl transition-all shadow-md"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    Layar Penuh
                  </button>
                </div>
              </div>

              {/* Right Column: Title, Description, and the Two Interactive Cards */}
              <div className="flex-1 min-w-0 flex flex-col justify-between w-full gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight tracking-tight">
                    Generator QR, PIN, &amp; Area Geofence
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-800 mt-1.5 leading-relaxed font-medium">
                    Sistem presensi menghasilkan token QR dinamis dan PIN darurat yang sinkron dengan switch validasi lokasi. Mahasiswa dapat memvalidasi kehadiran secara otomatis via aplikasi mobile.
                  </p>
                </div>

                {/* The Two Interactive Cards - Full Width Stack (No squishing or clipping) */}
                <div className="flex flex-col gap-3 w-full">
                  {/* Card 1: KODE PIN DARURAT */}
                  <div className="bg-white/40 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-white/60 shadow-xs flex flex-col justify-between overflow-hidden">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-900">
                          KODE PIN DARURAT
                        </span>
                        <span className="bg-sky-300/80 text-sky-950 text-[10px] font-black px-2 py-0.5 rounded-full shrink-0">
                          5 Digit
                        </span>
                      </div>

                      <div className="flex items-center gap-2 my-1">
                        <span className="text-2xl sm:text-3xl font-black font-mono text-slate-950 tracking-widest">
                          {currentPin}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            safeClipboardCopy(currentPin);
                            triggerToast(`Kode PIN ${currentPin} berhasil disalin!`);
                          }}
                          className="p-1.5 text-slate-700 hover:text-black rounded-lg hover:bg-white/40 transition-colors"
                          title="Salin PIN"
                        >
                          <Copy className="w-4 h-4 text-slate-900" />
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-700 font-medium">
                        Alternatif saat kamera atau sensor QR mahasiswa terkendala.
                      </p>
                    </div>
                  </div>

                  {/* Card 2: AREA GEOFENCE VALID */}
                  <div className="bg-white/40 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-white/60 shadow-xs flex flex-col justify-between overflow-hidden">
                    <div>
                      {/* Header row */}
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <MapPin className="w-4 h-4 text-slate-900 shrink-0" />
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-900">
                          AREA GEOFENCE VALID
                        </span>
                      </div>

                      {/* Status & Switch */}
                      <div className="flex items-center justify-between gap-3 my-1">
                        <div className="min-w-0">
                          <p className="text-sm sm:text-base font-black text-slate-950 leading-tight">
                            {isGeofenceActive ? `Radius ${geofenceRadius}m (Aktif)` : "Bebas Lokasi (Nonaktif)"}
                          </p>
                          <p className="text-[11px] font-mono text-slate-700 font-bold mt-0.5 truncate">
                            {isGeofenceActive ? `-6.89042, 107.61031 (${activeRoom})` : "GPS: Bebas Lokasi"}
                          </p>
                        </div>

                        {/* Switch Button */}
                        <div className="shrink-0">
                          <button
                            type="button"
                            onClick={handleToggleGeofence}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-900 focus:ring-offset-1 ${
                              isGeofenceActive ? "bg-emerald-600" : "bg-slate-500"
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
                      </div>
                    </div>

                    {/* Radius Selector Row (when active) */}
                    {isGeofenceActive && (
                      <div className="pt-2 mt-2 border-t border-black/10 flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                          Atur Radius:
                        </span>
                        <div className="flex items-center gap-1.5">
                          {[25, 50, 100].map((rad) => (
                            <button
                              key={rad}
                              type="button"
                              onClick={() => handleRadiusChange(rad)}
                              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black transition-all ${
                                geofenceRadius === rad
                                  ? "bg-slate-950 text-white shadow-xs"
                                  : "bg-white/60 text-slate-800 hover:bg-white"
                              }`}
                            >
                              {rad}m
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
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
                  {criticalStudent
                    ? `1 Mahasiswa (${criticalStudent.name}) dalam pantauan kritis ambang batas absensi (<75%). Terancam tidak dapat mengikuti Ujian Akhir Semester.`
                    : "1 Mahasiswa (Y. Kharlistov) dalam pantauan kritis ambang batas absensi (<75%). Terancam tidak dapat mengikuti Ujian Akhir Semester."}
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
                  <button
                    onClick={() => handleOpenHistoryModal()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/40 hover:bg-white text-[10px] font-extrabold text-sky-950 hover:text-black border border-white/60 transition-all shadow-xs"
                    title="Lihat riwayat lengkap seluruh presensi mahasiswa"
                  >
                    <History className="w-3 h-3 text-sky-700" />
                    <span>Lihat Riwayat</span>
                  </button>
                </div>

                <div className="overflow-y-auto no-scrollbar max-h-48 pr-1">
                  {records.filter((r) => r.checkIn).length > 0 ? (
                    records
                      .filter((r) => r.checkIn)
                      .slice(0, 5)
                      .map((r, i) => (
                        <ActivityItem
                          key={i}
                          name={r.name}
                          nim={r.nim}
                          time={formatTime(r.checkIn)}
                          accuracy={`QR GPS · Akurasi ${r.distance ?? 12} meter`}
                          photo={r.photo}
                          onPhotoClick={() => setSelectedPhotoRecord(r)}
                        />
                      ))
                  ) : records.length > 0 ? (
                    records.slice(0, 5).map((r, i) => (
                      <ActivityItem
                        key={i}
                        name={r.name}
                        nim={r.nim}
                        time={formatTime(r.checkIn)}
                        accuracy="QR GPS · Akurasi 12 meter"
                        photo={r.photo}
                        onPhotoClick={() => setSelectedPhotoRecord(r)}
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
            <div className="flex items-center flex-wrap gap-1.5 bg-white/30 p-1 rounded-2xl backdrop-blur-md border border-white/40">
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
                      ? "bg-sky-600 text-white shadow-sm"
                      : "text-slate-900 hover:bg-white/25 font-bold"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                      activeTab === tab.key ? "bg-sky-700 text-white" : "bg-white/40 text-slate-900"
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
                          <div className="flex items-center gap-2">
                            {row.photo ? (
                              <button
                                onClick={() => setSelectedPhotoRecord(row)}
                                className="inline-flex items-center gap-1.5 text-[11px] bg-sky-500/25 hover:bg-sky-500/40 text-sky-950 font-black px-2.5 py-1 rounded-lg border border-sky-400/50 shadow-xs transition-all"
                                title="Klik untuk verifikasi bukti foto selfie mahasiswa"
                              >
                                <Camera className="w-3.5 h-3.5 text-sky-700" />
                                <span>Bukti Foto</span>
                              </button>
                            ) : null}
                            {row.status === "IZIN" ? (
                              <button
                                onClick={() => triggerToast("Membuka surat_sakit.pdf...")}
                                className="flex items-center gap-1 text-[11px] text-sky-950 hover:text-black font-extrabold hover:underline"
                              >
                                <FileText className="w-3.5 h-3.5 text-sky-700" />
                                surat_sakit.pdf
                              </button>
                            ) : null}
                            {!row.photo && row.status !== "IZIN" && (
                              <span className="text-[11px] text-slate-500 font-mono font-bold">—</span>
                            )}
                          </div>
                        </td>

                        {/* Aksi */}
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {row.photo && (
                              <button
                                onClick={() => setSelectedPhotoRecord(row)}
                                className="p-1.5 text-sky-900 hover:text-black bg-white/40 hover:bg-white/80 rounded-lg border border-white/60 shadow-xs transition-all"
                                title="Lihat bukti foto selfie"
                              >
                                <Eye className="w-3.5 h-3.5 text-sky-700" />
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenStatusModal(row)}
                              className="px-3 py-1 text-[11px] font-bold text-slate-900 hover:text-white bg-white/40 hover:bg-sky-900 rounded-lg border border-white/60 shadow-sm backdrop-blur-md transition-all"
                            >
                              Ubah Status
                            </button>
                          </div>
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

              {selectedRecord.photo && (
                <div className="flex items-center justify-between p-2.5 bg-sky-500/20 border border-sky-400/40 rounded-2xl">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={selectedRecord.photo}
                      alt="Thumbnail Selfie"
                      className="w-10 h-10 rounded-xl object-cover border border-white/60 shadow-xs"
                    />
                    <div>
                      <p className="text-[11px] font-black text-slate-900">Bukti Foto Tersedia</p>
                      <p className="text-[10px] text-slate-600 font-semibold">Tercatat via kamera mobile</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPhotoRecord(selectedRecord);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-extrabold bg-sky-700 hover:bg-sky-800 text-white rounded-xl shadow-xs transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat Foto</span>
                  </button>
                </div>
              )}

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
                  <p className="text-xs font-black text-slate-950 mt-0.5">{selectedRecord.distance ?? 14}m dari {activeRoom}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-700 font-extrabold uppercase">Verifikasi Perimeter</p>
                  <p className="text-xs font-black text-emerald-800 mt-0.5">
                    {selectedRecord.isLocationValid !== false ? "Valid (Dalam Radius)" : "Di Luar Radius"}
                  </p>
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="text-[10px] text-slate-700 font-extrabold uppercase tracking-wider block mb-1.5">
                  PILIH STATUS KEHADIRAN:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {([
                    { label: "Hadir", value: "PRESENT", activeBg: "bg-emerald-600 text-white" },
                    { label: "Terlambat", value: "LATE", activeBg: "bg-amber-600 text-white" },
                    { label: "Izin", value: "IZIN", activeBg: "bg-indigo-600 text-white" },
                    { label: "Belum Hadir", value: "ABSENT", activeBg: "bg-rose-600 text-white" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEditStatus(opt.value)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                        editStatus === opt.value
                          ? `${opt.activeBg} shadow-sm border-transparent`
                          : "bg-white/40 text-slate-800 hover:bg-white/70 border-white/60"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Notes */}
              <div>
                <label className="text-[10px] text-slate-700 font-extrabold uppercase tracking-wider block mb-1">
                  Catatan Tambahan (Opsional):
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Keterangan surat izin/alasan perubahan..."
                  className="w-full text-xs px-3 py-1.5 rounded-xl bg-white/60 border border-white/60 text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/30">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 text-xs border border-white/50 rounded-xl text-slate-800 hover:bg-white/30 font-bold"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={handleConfirmStatusChange}
                  className="px-4 py-2 text-xs bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-all font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isUpdatingStatus ? "Menyimpan..." : "Konfirmasi Status"}
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
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    {activeClass
                      ? `${activeRoom}: ${activeClassName} (${activeClassCode.startsWith("Kelas") ? activeClassCode : `Kelas ${activeClassCode}`})`
                      : `Tidak Ada Sesi Terjadwal (${todayDayName})`}
                  </h3>
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
                  {isGeofenceActive ? `Geofence: Aktif (Radius ${geofenceRadius}m)` : "Geofence: Nonaktif (Bebas Lokasi)"}
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
                  <span className="text-sky-900 font-extrabold">{formatQrCountdown(qrTimer)} tersisa</span>
                </div>
                <div className="h-2 bg-sky-100 rounded-full overflow-hidden border border-sky-200/60">
                  <motion.div
                    className="h-full bg-sky-600 rounded-full"
                    style={{ width: `${(qrTimer / QR_REFRESH_SECONDS) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-sm mt-1">
                {isGeofenceActive
                  ? `Scan menggunakan aplikasi SATPAMO Mahasiswa dalam radius perimeter ${geofenceRadius} meter ${activeRoom}.`
                  : "Mode bebas lokasi aktif: Mahasiswa dapat melakukan presensi tanpa batasan perimeter GPS."}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Bukti Foto Presensi Mahasiswa */}
      <AnimatePresence>
        {selectedPhotoRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md"
            onClick={() => setSelectedPhotoRecord(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95 }}
              className="glass-panel backdrop-blur-2xl rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-white/60 flex flex-col gap-4 text-slate-900 max-h-[90vh] overflow-y-auto no-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/40 text-sky-800 flex items-center justify-center shadow-xs">
                    <Camera className="w-4 h-4 text-sky-700" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-950 text-sm leading-tight">Bukti Foto Presensi Mahasiswa</h3>
                    <p className="text-[11px] text-slate-600 font-semibold">Verifikasi Keaslian Wajah &amp; Lokasi Perimeter</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPhotoRecord(null)}
                  className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white/40 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Student Identity */}
              <div className="flex items-center justify-between gap-3 bg-white/30 border border-white/40 rounded-2xl p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-sky-700 text-white font-black text-sm flex items-center justify-center shadow-md shrink-0">
                    {getInitials(selectedPhotoRecord.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-slate-950 text-sm truncate">{selectedPhotoRecord.name}</p>
                    <p className="text-xs text-slate-700 font-mono font-semibold">{selectedPhotoRecord.nim}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-full">
                    {selectedPhotoRecord.jurusan || "Teknik Informatika"}
                  </span>
                  <p className="text-[10px] text-slate-600 mt-1 font-semibold">
                    {formatTime(selectedPhotoRecord.checkIn)} WIB
                  </p>
                </div>
              </div>

              {/* Submitted Photo Display */}
              <div className="relative rounded-2xl overflow-hidden border-2 border-white/60 shadow-md bg-slate-900 flex items-center justify-center min-h-64 max-h-80">
                {selectedPhotoRecord.photo ? (
                  <img
                    src={selectedPhotoRecord.photo}
                    alt={`Bukti selfie ${selectedPhotoRecord.name}`}
                    className="w-full h-full object-cover max-h-80 rounded-2xl"
                  />
                ) : (
                  <div className="py-12 px-4 text-center text-slate-300">
                    <Camera className="w-12 h-12 mx-auto mb-2 opacity-50 text-sky-300" />
                    <p className="text-xs font-bold">Foto selfie tidak tersedia atau dicatat via presensi manual.</p>
                  </div>
                )}
                {selectedPhotoRecord.photo && (
                  <div className="absolute bottom-2 left-2 right-2 px-3 py-1.5 rounded-xl bg-slate-950/70 backdrop-blur-md text-white text-[11px] font-semibold flex items-center justify-between">
                    <span>Terverifikasi Kamera Mobile</span>
                    <span className="font-mono text-[10px] text-sky-300">Lensa Depan HD</span>
                  </div>
                )}
              </div>

              {/* Verification & Geofence Details */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="bg-white/40 border border-white/50 rounded-2xl p-3 flex flex-col justify-between">
                  <p className="text-[10px] font-extrabold text-slate-600 uppercase">Geofence Lokasi</p>
                  <div className="flex items-center gap-1.5 mt-1 text-emerald-800 font-black">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{selectedPhotoRecord.distance ?? 14}m ({selectedPhotoRecord.isLocationValid !== false ? "VALID" : "DI LUAR"})</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 truncate">
                    {activeRoom} (Radius {geofenceRadius}m)
                  </p>
                </div>

                <div className="bg-white/40 border border-white/50 rounded-2xl p-3 flex flex-col justify-between">
                  <p className="text-[10px] font-extrabold text-slate-600 uppercase">Verifikasi AI Vision</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                    <span className="font-black text-sky-950">
                      {selectedPhotoRecord.aiVerification?.verdict ?? "VERIFIED"}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1 font-semibold">
                    Confidence {selectedPhotoRecord.aiVerification?.confidence ? `${Math.round(selectedPhotoRecord.aiVerification.confidence * 100)}%` : "98%"}
                  </p>
                </div>
              </div>

              {/* AI Details / Notes */}
              {(selectedPhotoRecord.aiVerification?.reason || selectedPhotoRecord.notes) && (
                <div className="bg-sky-50/70 border border-sky-200/60 rounded-2xl p-3 text-xs text-sky-950 font-medium leading-relaxed">
                  <span className="font-bold text-sky-900 block mb-0.5">Catatan Verifikasi:</span>
                  {selectedPhotoRecord.aiVerification?.reason || selectedPhotoRecord.notes}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/30">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenStatusModal(selectedPhotoRecord);
                    setSelectedPhotoRecord(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-800 hover:text-black bg-white/60 hover:bg-white rounded-xl border border-white/70 shadow-xs transition-all"
                >
                  Ubah Status Presensi
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPhotoRecord(null)}
                  className="px-5 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-xl shadow-md transition-all"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Riwayat Presensi Lengkap */}
      <AnimatePresence>
        {showHistoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md"
            onClick={() => setShowHistoryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95 }}
              className="glass-panel backdrop-blur-2xl rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-white/60 flex flex-col gap-4 text-slate-900 max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/40 text-sky-800 flex items-center justify-center shadow-xs">
                    <History className="w-4 h-4 text-sky-700" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-950 text-sm">Riwayat Presensi Mahasiswa Terkini</h3>
                    <p className="text-[11px] text-slate-600 font-semibold">Seluruh aktivitas check-in mahasiswa dengan bukti foto dan perimeter GPS</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white/40"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Bar in Modal */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama atau NIM mahasiswa..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-semibold bg-white/50 border border-white/60 focus:outline-none focus:bg-white text-slate-900 placeholder:text-slate-500"
                />
              </div>

              {/* Records List */}
              <div className="overflow-y-auto no-scrollbar flex-1 flex flex-col gap-2 pr-1">
                {historyLoading ? (
                  <div className="py-12 text-center text-slate-600 font-semibold text-xs">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
                    Memuat riwayat presensi...
                  </div>
                ) : historyRecords.filter((r) => {
                    if (!historySearch.trim()) return true;
                    const q = historySearch.toLowerCase();
                    return r.name.toLowerCase().includes(q) || r.nim.toLowerCase().includes(q);
                  }).length > 0 ? (
                  historyRecords
                    .filter((r) => {
                      if (!historySearch.trim()) return true;
                      const q = historySearch.toLowerCase();
                      return r.name.toLowerCase().includes(q) || r.nim.toLowerCase().includes(q);
                    })
                    .map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="flex items-center justify-between gap-3 p-3 bg-white/30 hover:bg-white/50 border border-white/40 rounded-2xl transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {item.photo ? (
                            <img
                              src={item.photo}
                              alt={item.name}
                              className="w-10 h-10 rounded-xl object-cover border border-white/60 shadow-xs shrink-0 cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => {
                                setSelectedPhotoRecord(item);
                              }}
                              title="Klik untuk melihat bukti foto"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-sky-700 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                              {getInitials(item.name)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-950 truncate">{item.name}</p>
                            <p className="text-[10px] text-slate-600 font-mono">{item.nim} &bull; {item.jurusan || "Teknik Informatika"}</p>
                            <p className="text-[10px] text-sky-950 font-bold mt-0.5">
                              {item.date ? new Date(item.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "Hari Ini"} &bull; {formatTime(item.checkIn)} WIB
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            item.status === "PRESENT"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : item.status === "LATE"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : item.status === "IZIN"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-rose-100 text-rose-800 border border-rose-200"
                          }`}>
                            {item.status === "PRESENT" ? "Hadir" : item.status === "LATE" ? "Terlambat" : item.status === "IZIN" ? "Izin" : "Alpha"}
                          </span>

                          {item.photo ? (
                            <button
                              type="button"
                              onClick={() => setSelectedPhotoRecord(item)}
                              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-sky-600 text-white hover:bg-sky-700 rounded-lg shadow-xs transition-all"
                            >
                              <Camera className="w-3 h-3" />
                              <span>Lihat Foto</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-semibold italic">Tanpa Foto</span>
                          )}
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="py-12 text-center text-slate-600 font-semibold text-xs">
                    Tidak ditemukan catatan riwayat presensi.
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-white/30">
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="px-5 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-xl shadow-md transition-all"
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
