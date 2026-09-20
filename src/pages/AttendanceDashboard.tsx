import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import {
  Search, Users, CheckCircle, Clock, XCircle, LogOut,
  BrainCircuit, RefreshCw, TrendingUp, AlertTriangle,
  Info, ChevronDown, ChevronUp, CalendarDays,
  Camera, MapPin, Sparkles, X, Eye
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../components/ui/table";
import {
  attendanceApi, aiApi,
  type AttendanceRecord, type AttendanceStats, type AiInsight,
} from "../lib/api";

// --- Helper: format datetime ------------------------------------------------
function formatTime(isoStr: string | null): string {
  if (!isoStr) return "--";
  return new Date(isoStr).toLocaleTimeString("id-ID", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function getDateRange(daysBack = 7): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - daysBack);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

// --- AI Insight Panel -------------------------------------------------------
function AiInsightPanel({
  insight,
  totalRecords,
  period,
}: {
  insight: AiInsight;
  totalRecords: number;
  period: { startDate: string; endDate: string };
}) {
  const [expanded, setExpanded] = useState(true);

  const iconMap = {
    warning: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
    critical: <AlertTriangle className="w-4 h-4 text-red-500" />,
    info: <Info className="w-4 h-4 text-blue-500" />,
    positive: <TrendingUp className="w-4 h-4 text-green-500" />,
  };

  const bgMap = {
    warning: "bg-yellow-50 border-yellow-200",
    critical: "bg-red-50 border-red-200",
    info: "bg-blue-50 border-blue-200",
    positive: "bg-green-50 border-green-200",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Analisis AI Gemini</CardTitle>
              <Badge variant="outline" className="text-xs text-primary border-primary/40">
                {period.startDate} - {period.endDate}
              </Badge>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          {/* Ringkasan */}
          <p className="text-sm text-gray-600 mt-2">{insight.summary}</p>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-2xl font-bold text-primary">{insight.overallRate}%</span>
            <span className="text-xs text-gray-500">tingkat kehadiran keseluruhan • {totalRecords} data dianalisis</span>
          </div>
        </CardHeader>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <CardContent className="pt-0 space-y-4">
                {/* Insights */}
                {insight.insights.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Temuan</p>
                    {insight.insights.map((item, i) => (
                      <div key={i} className={`flex gap-2 p-3 rounded-lg border text-sm ${bgMap[item.type] || bgMap.info}`}>
                        <span className="mt-0.5 shrink-0">{iconMap[item.type] || iconMap.info}</span>
                        <div>
                          <p className="font-medium text-gray-800">{item.title}</p>
                          <p className="text-gray-600 text-xs mt-0.5">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Risk Students */}
                {insight.riskStudents.count > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">
                      Mahasiswa Berisiko ({insight.riskStudents.count})
                    </p>
                    <p className="text-xs text-red-600">{insight.riskStudents.threshold}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {insight.riskStudents.anonIds.map((id) => (
                        <span key={id} className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-mono">
                          {id}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {insight.recommendations.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Rekomendasi</p>
                    <ul className="space-y-1">
                      {insight.recommendations.map((rec, i) => (
                        <li key={i} className="flex gap-2 text-sm text-gray-700">
                          <span className="text-primary font-bold shrink-0">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-xs text-gray-400 text-right">
                  Dibuat: {new Date(insight.generatedAt).toLocaleString("id-ID")}
                </p>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

// --- Modal Detail Verifikasi Foto & Lokasi -----------------------------------
function VerificationModal({
  record,
  onClose,
}: {
  record: AttendanceRecord;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm md:text-base">Detail Verifikasi Presensi</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Foto Selfie */}
          <div className="space-y-1.5 text-center">
            {record.photo ? (
              <div className="relative rounded-xl overflow-hidden max-h-64 mx-auto border-2 border-slate-200 shadow-sm bg-slate-900 inline-block">
                <img
                  src={record.photo}
                  alt={record.name}
                  className="max-h-64 object-contain mx-auto"
                />
              </div>
            ) : (
              <div className="h-40 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs">
                Tidak ada foto selfie tersimpan
              </div>
            )}
            <p className="text-xs text-slate-500 font-medium">Foto Selfie Mahasiswa saat Presensi</p>
          </div>

          {/* Mahasiswa Info */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block">Nama:</span>
              <span className="font-semibold text-slate-800">{record.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block">NIM:</span>
              <span className="font-mono font-semibold text-slate-800">{record.nim}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Program Studi:</span>
              <span className="text-slate-700">{record.jurusan} (Smtr {record.semester})</span>
            </div>
            <div>
              <span className="text-slate-400 block">Waktu Check-In:</span>
              <span className="text-slate-700 font-medium">{formatTime(record.checkIn)} WIB</span>
            </div>
          </div>

          {/* Lokasi Geofencing */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <MapPin className="w-4 h-4 text-blue-600" />
                Validasi Lokasi (Geofencing)
              </div>
              <Badge
                variant={record.isLocationValid ? "outline" : "destructive"}
                className="text-[10px]"
              >
                {record.isLocationValid ? "? Di Dalam Kampus" : "? Di Luar Kampus"}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
              <div>
                <span className="text-slate-400 block">Jarak ke Kampus:</span>
                <span className="font-semibold text-slate-800">{record.distance ?? "-"} meter</span>
              </div>
              <div>
                <span className="text-slate-400 block">Koordinat GPS:</span>
                <span className="font-mono text-slate-800">
                  {record.latitude ? `${record.latitude.toFixed(5)}, ${record.longitude?.toFixed(5)}` : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Analisis Gemini AI */}
          {record.aiVerification ? (
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Hasil Analisis Gemini AI Vision
                </div>
                <Badge
                  className={
                    record.aiVerification.verdict === "VERIFIED"
                      ? "bg-emerald-500 text-white text-[10px]"
                      : record.aiVerification.verdict === "SUSPICIOUS"
                      ? "bg-amber-500 text-white text-[10px]"
                      : record.aiVerification.verdict === "PENDING_REVIEW"
                      ? "bg-blue-600 text-white text-[10px]"
                      : "bg-red-500 text-white text-[10px]"
                  }
                >
                  {record.aiVerification.verdict}
                </Badge>
              </div>
              <p className="text-xs text-slate-700 font-medium">
                "{record.aiVerification.reason}"
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1 text-[10px]">
                <div className="bg-white/80 p-1.5 rounded border border-indigo-100">
                  <span className="text-slate-400 block">Wajah Jelas:</span>
                  <span className="font-semibold">{record.aiVerification.isFaceClear ? "Ya" : "Tidak"}</span>
                </div>
                <div className="bg-white/80 p-1.5 rounded border border-indigo-100">
                  <span className="text-slate-400 block">Deteksi Layar:</span>
                  <span className="font-semibold">{record.aiVerification.spoofDetected ? "Layar" : "Asli"}</span>
                </div>
                <div className="bg-white/80 p-1.5 rounded border border-indigo-100">
                  <span className="text-slate-400 block">Confidence:</span>
                  <span className="font-semibold">{record.aiVerification.confidence ?? "-"}%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl">
              Belum ada data analisis AI untuk record ini.
            </div>
          )}

          {record.notes && (
            <div className="text-xs text-slate-600 bg-amber-50/50 border border-amber-200/60 p-2.5 rounded-lg">
              <span className="font-semibold text-amber-800">Catatan Sistem: </span>
              {record.notes}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// --- Main Dashboard ---------------------------------------------------------
export function AttendanceDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [aiInsight, setAiInsight] = useState<{
    insight: AiInsight;
    totalRecords: number;
    period: { startDate: string; endDate: string };
  } | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [dateFilter, setDateFilter] = useState<"today" | "all">("today");

  // Modal detail
  const [selectedRecordForModal, setSelectedRecordForModal] = useState<AttendanceRecord | null>(null);

  const { logout, dosen } = useAuth();
  const navigate = useNavigate();

  // Fetch attendance data & stats
  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const recordsPromise =
        dateFilter === "all"
          ? attendanceApi.getAll({ startDate: "2020-01-01", endDate: "2030-12-31" })
          : attendanceApi.getAll();

      const [recordsRes, statsRes] = await Promise.all([
        recordsPromise,
        attendanceApi.getStats(),
      ]);
      if (recordsRes.success) setRecords(recordsRes.data || []);
      if (statsRes.success) setStats(statsRes.data || null);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoadingData(false);
    }
  }, [refreshKey, dateFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh setiap 20 detik & ketika jendela browser aktif kembali
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((k) => k + 1);
    }, 20000);
    const onFocus = () => setRefreshKey((k) => k + 1);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleAiAnalyze = async () => {
    setLoadingAi(true);
    setAiError("");
    try {
      const { startDate, endDate } = getDateRange(7);
      const res = await aiApi.analyze(startDate, endDate, "weekly");
      if (res.success && res.data) {
        setAiInsight({
          insight: res.data.analysis,
          totalRecords: res.data.totalRecords,
          period: res.data.period,
        });
      } else {
        setAiError(res.message || "Analisis AI gagal. Coba lagi.");
      }
    } catch {
      setAiError("Tidak dapat menghubungi layanan AI.");
    } finally {
      setLoadingAi(false);
    }
  };

  // Stat cards
  const statCards = [
    {
      title: "Total Mahasiswa",
      value: stats ? String(stats.total) : "-",
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      title: "Hadir Hari Ini",
      value: stats ? String(stats.present) : "-",
      icon: CheckCircle,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      title: "Terlambat",
      value: stats ? String(stats.late) : "-",
      icon: Clock,
      color: "text-yellow-500",
      bg: "bg-yellow-50",
    },
    {
      title: "Tidak Hadir",
      value: stats ? String(stats.absent + (stats.izin || 0)) : "-",
      icon: XCircle,
      color: "text-red-500",
      bg: "bg-red-50",
    },
  ];

  // Urutkan catatan kehadiran: yang paling baru (check-in / date) di urutan paling atas
  const sortedRecords = [...records].sort((a, b) => {
    const timeA = a.checkIn ? new Date(a.checkIn).getTime() : new Date(a.date).getTime();
    const timeB = b.checkIn ? new Date(b.checkIn).getTime() : new Date(b.date).getTime();
    return timeB - timeA;
  });

  // Filter client-side by search
  const filteredRecords = sortedRecords.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.nim.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 text-foreground p-6 md:p-12 font-sans">
      {/* Modal Detail Verifikasi Foto & Lokasi */}
      {selectedRecordForModal && (
        <VerificationModal
          record={selectedRecordForModal}
          onClose={() => setSelectedRecordForModal(null)}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-500 bg-clip-text text-transparent">
              Dashboard Kehadiran
            </h1>
            <p className="text-muted-foreground mt-1">
              {dosen ? `Selamat datang, ${dosen.username} • ` : ""}
              Pantau dan kelola kehadiran mahasiswa dengan verifikasi AI & Geofencing.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">


            <Button
              variant="outline"
              className="gap-2 border-gray-300 text-gray-700 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50"
              onClick={() => setRefreshKey((k) => k + 1)}
              disabled={loadingData}
            >
              <RefreshCw className={`w-4 h-4 ${loadingData ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              className="gap-2 border-primary/40 text-primary hover:bg-primary/5"
              onClick={handleAiAnalyze}
              disabled={loadingAi}
            >
              <BrainCircuit className={`w-4 h-4 ${loadingAi ? "animate-pulse" : ""}`} />
              {loadingAi ? "Menganalisis..." : "AI Analyze"}
            </Button>
            <Button
              variant="outline"
              className="gap-2 border-gray-300 text-gray-700 hover:text-red-600 hover:border-red-300 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </Button>
          </div>
        </div>

        {/* AI Error */}
        {aiError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3"
          >
            ?? {aiError}
          </motion.div>
        )}

        {/* AI Insight Panel */}
        {aiInsight && (
          <AiInsightPanel
            insight={aiInsight.insight}
            totalRecords={aiInsight.totalRecords}
            period={aiInsight.period}
          />
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="border-gray-200 hover:border-primary/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingData ? (
                    <div className="h-8 w-12 bg-gray-200 animate-pulse rounded" />
                  ) : (
                    <div className="text-2xl font-bold">{stat.value}</div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Attendance Table */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>Log Kehadiran Mahasiswa</CardTitle>
                <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-0.5 text-xs">
                  <button
                    onClick={() => setDateFilter("today")}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      dateFilter === "today"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Hari Ini
                  </button>
                  <button
                    onClick={() => setDateFilter("all")}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      dateFilter === "all"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Semua Riwayat
                  </button>
                </div>
                <Badge variant="secondary" className="text-xs font-normal">
                  {filteredRecords.length} data
                </Badge>
              </div>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari nama atau NIM mahasiswa..."
                  className="w-full bg-background border border-input rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">Foto</TableHead>
                    <TableHead>NIM</TableHead>
                    <TableHead>Nama Mahasiswa</TableHead>
                    <TableHead>Jurusan</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Lokasi GPS</TableHead>
                    <TableHead>Verifikasi AI</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((row, index) => (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.03 }}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        {/* Foto Thumbnail */}
                        <TableCell>
                          {row.photo ? (
                            <button
                              onClick={() => setSelectedRecordForModal(row)}
                              className="group relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 hover:ring-2 hover:ring-blue-500 transition-all shrink-0 bg-slate-100"
                              title="Klik untuk melihat foto & analisis AI"
                            >
                              <img src={row.photo} alt={row.name} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Eye className="w-3.5 h-3.5 text-white" />
                              </div>
                            </button>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-[10px]">
                              -
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="font-mono text-xs text-gray-500">{row.nim}</TableCell>
                        <TableCell className="font-medium text-slate-800">{row.name}</TableCell>
                        <TableCell className="text-sm text-gray-500">{row.jurusan}</TableCell>
                        
                        {/* Waktu Check In & Out */}
                        <TableCell>
                          <div className="text-xs">
                            {dateFilter === "all" && (
                              <span className="text-[11px] text-gray-500 font-medium block">
                                {new Date(row.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            )}
                            <span className="font-semibold text-slate-700">{formatTime(row.checkIn)}</span>
                            {row.checkOut && (
                              <span className="text-slate-400 block text-[11px]">- {formatTime(row.checkOut)}</span>
                            )}
                          </div>
                        </TableCell>

                        {/* Lokasi GPS Geofence */}
                        <TableCell>
                          {row.distance !== undefined && row.distance !== null ? (
                            <button
                              onClick={() => setSelectedRecordForModal(row)}
                              className="inline-flex"
                              title={`Jarak: ${row.distance}m dari kampus`}
                            >
                              <Badge
                                variant={row.isLocationValid ? "outline" : "destructive"}
                                className={`text-[11px] gap-1 py-0.5 px-2 font-normal cursor-pointer ${
                                  row.isLocationValid
                                    ? "border-emerald-300 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100"
                                    : ""
                                }`}
                              >
                                <MapPin className="w-3 h-3 shrink-0" />
                                {row.isLocationValid ? `${row.distance}m (Kampus)` : `Luar (${row.distance}m)`}
                              </Badge>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </TableCell>

                        {/* Verifikasi AI Gemini */}
                        <TableCell>
                          {row.aiVerification ? (
                            <button
                              onClick={() => setSelectedRecordForModal(row)}
                              className="inline-flex"
                              title={row.aiVerification.reason}
                            >
                              <Badge
                                className={`text-[10px] py-0.5 px-2 cursor-pointer font-medium gap-1 ${
                                  row.aiVerification.verdict === "VERIFIED"
                                    ? "bg-emerald-100 text-emerald-700 border border-emerald-300 hover:bg-emerald-200"
                                    : row.aiVerification.verdict === "SUSPICIOUS"
                                    ? "bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-200"
                                    : row.aiVerification.verdict === "REJECTED"
                                    ? "bg-red-100 text-red-700 border border-red-300 hover:bg-red-200"
                                    : "bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200"
                                }`}
                              >
                                <Sparkles className="w-3 h-3" />
                                {row.aiVerification.verdict === "VERIFIED"
                                  ? "Valid"
                                  : row.aiVerification.verdict === "SUSPICIOUS"
                                  ? "Mencurigakan"
                                  : row.aiVerification.verdict === "REJECTED"
                                  ? "Ditolak AI"
                                  : "Review"}
                              </Badge>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </TableCell>

                        {/* Status Akhir */}
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              row.status === "PRESENT"
                                ? "success"
                                : row.status === "LATE"
                                ? "warning"
                                : row.status === "IZIN"
                                ? "outline"
                                : "destructive"
                            }
                          >
                            {row.status === "PRESENT"
                              ? "Hadir"
                              : row.status === "LATE"
                              ? "Terlambat"
                              : row.status === "IZIN"
                              ? "Izin"
                              : "Absen"}
                          </Badge>
                        </TableCell>
                      </motion.tr>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        {searchTerm
                          ? `Tidak ada mahasiswa dengan nama/NIM "${searchTerm}"`
                          : dateFilter === "today"
                          ? "Belum ada data kehadiran hari ini."
                          : "Belum ada riwayat data kehadiran."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
