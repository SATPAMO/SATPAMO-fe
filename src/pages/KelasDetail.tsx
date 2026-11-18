import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Calendar, Users, Plus, Trash2,
  UserPlus, Search, AlertCircle, X, CheckCircle,
  RefreshCw, Clock, CheckCircle2,
  CalendarDays, Image as ImageIcon, Upload, FileSpreadsheet, Download
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "../components/ui/table";
import {
  kelasApi,
  type KelasDetail as KelasDetailType,
  type HariType,
  type EnrolledMahasiswa,
  type LatestAttendanceRecord
} from "../lib/api";

const hariOptions: HariType[] = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU", "MINGGU"];

export function KelasDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [kelas, setKelas] = useState<KelasDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Tab: "mahasiswa" | "absensi" | "jadwal"
  const [activeTab, setActiveTab] = useState<"mahasiswa" | "absensi" | "jadwal">("mahasiswa");

  // Search Mahasiswa
  const [searchMhs, setSearchMhs] = useState("");

  // Modal Tambah Mahasiswa
  const [showAddMhsModal, setShowAddMhsModal] = useState(false);
  const [addMode, setAddMode] = useState<"single" | "bulk" | "csv">("single");
  // CSV Import state
  const [csvPreview, setCsvPreview] = useState<{ nim: string; name: string; email?: string; jurusan: string; semester: number }[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvFileName, setCsvFileName] = useState<string>("");
  const [csvImportResult, setCsvImportResult] = useState<string | null>(null);
  const [inputNim, setInputNim] = useState("");
  const [bulkNims, setBulkNims] = useState("");
  const [savingMhs, setSavingMhs] = useState(false);
  const [mhsError, setMhsError] = useState<string | null>(null);
  const [mhsSuccess, setMhsSuccess] = useState<string | null>(null);

  // Modal Tambah Jadwal
  const [showAddJadwalModal, setShowAddJadwalModal] = useState(false);
  const [hari, setHari] = useState<HariType>("SENIN");
  const [jamMulai, setJamMulai] = useState("08:00");
  const [jamSelesai, setJamSelesai] = useState("10:30");
  const [ruangan, setRuangan] = useState("");
  const [savingJadwal, setSavingJadwal] = useState(false);

  // Modal Preview Foto Selfie
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; name: string; time: string } | null>(null);

  const fetchDetail = useCallback(async (isSilent = false) => {
    if (!id) return;
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await kelasApi.getById(id);
      if (res.success && res.data) {
        setKelas(res.data);
      } else {
        setError(res.message || "Gagal memuat detail kelas.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleAddSingleMhs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !inputNim.trim()) return;

    setSavingMhs(true);
    setMhsError(null);
    setMhsSuccess(null);

    try {
      const res = await kelasApi.addMahasiswa(id, { nim: inputNim.trim() });
      if (res.success) {
        setMhsSuccess(res.message || `Mahasiswa dengan NIM ${inputNim.trim()} berhasil ditambahkan!`);
        setInputNim("");
        fetchDetail(true);
      } else {
        setMhsError(res.message || "Gagal menambahkan mahasiswa.");
      }
    } catch (err: unknown) {
      setMhsError(err instanceof Error ? err.message : "Gagal menambahkan mahasiswa.");
    } finally {
      setSavingMhs(false);
    }
  };

  const handleAddBulkMhs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !bulkNims.trim()) return;

    const nims = bulkNims
      .split(/[\s,;\n]+/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (nims.length === 0) {
      setMhsError("Silakan masukkan minimal satu NIM mahasiswa.");
      return;
    }

    setSavingMhs(true);
    setMhsError(null);
    setMhsSuccess(null);

    try {
      const res = await kelasApi.addMahasiswaBulk(id, nims);
      if (res.success) {
        setMhsSuccess(
          res.message || `Berhasil mendaftarkan mahasiswa ke kelas!`
        );
        setBulkNims("");
        fetchDetail(true);
      } else {
        setMhsError(res.message || "Gagal mendaftarkan mahasiswa massal.");
      }
    } catch (err: unknown) {
      setMhsError(err instanceof Error ? err.message : "Gagal menambahkan mahasiswa massal.");
    } finally {
      setSavingMhs(false);
    }
  };

  // ── CSV Helpers ─────────────────────────────────────────────────────────────
  const handleDownloadTemplate = () => {
    const header = "nim,nama,email,jurusan,semester";
    const sample = "2021001001,Budi Santoso,budi@mhs.ac.id,Teknik Informatika,3";
    const blob = new Blob([header + "\n" + sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_mahasiswa_sama.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvFile = (file: File) => {
    setCsvError(null);
    setCsvPreview([]);
    setCsvImportResult(null);
    setCsvFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
      if (lines.length < 2) {
        setCsvError("File CSV harus memiliki header dan minimal 1 baris data.");
        return;
      }

      // Auto-detect delimiter: comma or semicolon
      const delimiter = lines[0].includes(";") ? ";" : ",";
      const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase());

      const nimIdx = headers.findIndex((h) => h === "nim");
      const namaIdx = headers.findIndex((h) => h === "nama" || h === "name");
      const emailIdx = headers.findIndex((h) => h === "email");
      const jurusanIdx = headers.findIndex((h) => h === "jurusan");
      const semesterIdx = headers.findIndex((h) => h === "semester");

      if (nimIdx === -1 || namaIdx === -1 || jurusanIdx === -1) {
        setCsvError(`Header CSV tidak valid. Diperlukan kolom: nim, nama (atau name), jurusan. Ditemukan: ${headers.join(", ")}`);
        return;
      }

      const parsed: { nim: string; name: string; email?: string; jurusan: string; semester: number }[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ""));
        const nim = cols[nimIdx] || "";
        const name = cols[namaIdx] || "";
        const jurusan = cols[jurusanIdx] || "";
        if (!nim || !name || !jurusan) continue;
        parsed.push({
          nim,
          name,
          email: emailIdx !== -1 ? cols[emailIdx] || undefined : undefined,
          jurusan,
          semester: semesterIdx !== -1 ? parseInt(cols[semesterIdx]) || 1 : 1,
        });
      }

      if (parsed.length === 0) {
        setCsvError("Tidak ada data valid yang ditemukan di file CSV.");
        return;
      }

      setCsvPreview(parsed);
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleImportCsv = async () => {
    if (!id || csvPreview.length === 0) return;
    setSavingMhs(true);
    setMhsError(null);
    setMhsSuccess(null);
    setCsvImportResult(null);
    try {
      const res = await kelasApi.importMahasiswaCsv(id, csvPreview);
      if (res.success) {
        const d = res.data;
        setCsvImportResult(`✓ Selesai! ${d?.enrolled ?? 0} mahasiswa baru terdaftar, ${d?.alreadyEnrolled ?? 0} sudah ada, ${d?.imported ?? 0} data baru diimpor.`);
        setCsvPreview([]);
        setCsvFileName("");
        fetchDetail(true);
      } else {
        setMhsError(res.message || "Gagal import CSV.");
      }
    } catch (err: unknown) {
      setMhsError(err instanceof Error ? err.message : "Gagal import CSV.");
    } finally {
      setSavingMhs(false);
    }
  };

  const handleRemoveMahasiswa = async (mahasiswaId: string, namaMhs: string) => {
    if (!id) return;
    if (!window.confirm(`Keluarkan ${namaMhs} dari kelas ini? Data master mahasiswa tetap aman.`)) {
      return;
    }

    try {
      const res = await kelasApi.removeMahasiswa(id, mahasiswaId);
      if (res.success) {
        fetchDetail(true);
      } else {
        alert(res.message || "Gagal mengeluarkan mahasiswa.");
      }
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : "Gagal"));
    }
  };

  const handleAddJadwal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSavingJadwal(true);
    try {
      const res = await kelasApi.addJadwal(id, {
        hari,
        jamMulai,
        jamSelesai,
        ruangan: ruangan.trim() || undefined,
      });

      if (res.success) {
        setShowAddJadwalModal(false);
        setRuangan("");
        fetchDetail(true);
      } else {
        alert(res.message || "Gagal menambahkan jadwal.");
      }
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : "Gagal"));
    } finally {
      setSavingJadwal(false);
    }
  };

  const handleDeleteJadwal = async (jadwalId: string | number) => {
    if (!id) return;
    if (!window.confirm("Hapus jadwal perkuliahan ini?")) return;

    try {
      const res = await kelasApi.deleteJadwal(id, jadwalId);
      if (res.success) {
        fetchDetail(true);
      } else {
        alert(res.message || "Gagal menghapus jadwal.");
      }
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : "Gagal"));
    }
  };

  const formatTanggalIndo = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const formatJam = (isoString?: string | null) => {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      }).format(d) + " WIB";
    } catch {
      return "-";
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    switch (s) {
      case "PRESENT":
      case "HADIR":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Hadir</span>;
      case "LATE":
      case "TERLAMBAT":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Terlambat</span>;
      case "IZIN":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">Izin</span>;
      case "SAKIT":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">Sakit</span>;
      case "ABSENT":
      case "ALPHA":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">Alpa</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">Belum Absen</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen text-slate-800 relative overflow-hidden satpamo-page-bg font-sans">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Memuat data kelas & absensi terkini...</p>
        </div>
      </div>
    );
  }

  if (error || !kelas) {
    return (
      <div className="min-h-screen text-slate-800 relative overflow-hidden satpamo-page-bg font-sans">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4 glass-panel rounded-3xl mt-12 p-8">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Kelas Tidak Ditemukan</h2>
          <p className="text-sm text-slate-600">{error || "Data kelas tidak tersedia."}</p>
          <Button onClick={() => navigate("/kelas")} variant="outline" className="glass-pill rounded-xl">
            Kembali ke Daftar Kelas
          </Button>
        </div>
      </div>
    );
  }

  // Mahasiswa list (handling both mahasiswa and mahasiswaList)
  const mahasiswas: EnrolledMahasiswa[] = (kelas.mahasiswa || (kelas as any).mahasiswaList || []) as EnrolledMahasiswa[];
  const jadwals = (kelas.jadwal || (kelas as any).jadwals || []) as any[];
  const latestAtt = kelas.latestAttendance;

  const filteredMahasiswas = mahasiswas.filter(
    (m) =>
      (m.name || "").toLowerCase().includes(searchMhs.toLowerCase()) ||
      (m.nim || "").toLowerCase().includes(searchMhs.toLowerCase()) ||
      (m.jurusan || "").toLowerCase().includes(searchMhs.toLowerCase())
  );

  return (
    <div className="min-h-screen text-slate-800 relative overflow-hidden satpamo-page-bg font-sans pb-20">
      {/* Decorative ambient blobs */}
      <div className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 bg-sky-200/20 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/3 w-72 h-72 bg-blue-100/30 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 w-96 h-96 bg-sky-200/20 rounded-full blur-3xl" />

      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <button
              type="button"
              onClick={() => navigate("/kelas")}
              className="hover:text-sky-600 flex items-center gap-1 font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Daftar Kelas
            </button>
            <span>/</span>
            <span className="font-semibold text-slate-800">{kelas.nama}</span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchDetail(true)}
            disabled={refreshing}
            className="text-xs h-8 gap-1.5 glass-pill rounded-xl text-slate-700 hover:text-slate-900"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-sky-600" : ""}`} />
            {refreshing ? "Menyinkronkan..." : "Perbarui Data"}
          </Button>
        </div>

        {/* Hero Header Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-3 z-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-extrabold px-3 py-1 rounded-xl bg-sky-100/70 text-sky-800 border border-sky-200/80 shadow-xs">
                {kelas.kode}
              </span>
              <span className="text-xs text-slate-600 bg-white/60 border border-white/80 px-2.5 py-1 rounded-xl font-medium">
                Dosen: <strong className="text-slate-800">{kelas.dosen?.username || `Dosen #${kelas.dosenId}`}</strong>
              </span>
              {latestAtt && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-800 border border-emerald-400/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Presensi Sesi {latestAtt.pertemuanKe}: {latestAtt.stats.present + latestAtt.stats.late}/{latestAtt.stats.total} Hadir
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {kelas.nama}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                {kelas.deskripsi || "Mata kuliah aktif semester berjalan. Kelola data mahasiswa, jadwal perkuliahan, dan catatan presensi terpadu."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 z-10">
            <Button
              onClick={() => navigate(`/kelas/${kelas.id}/absen`)}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-md shadow-sky-500/20 gap-2 h-11 px-5 font-bold rounded-2xl"
            >
              <CheckCircle className="w-5 h-5" />
              Buka / Input Absensi Kelas
            </Button>
          </div>
        </div>

        {/* Quick Highlights / Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-panel glass-card-interactive rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold text-slate-600">Mahasiswa Terdaftar</span>
              <Users className="w-4 h-4 text-sky-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{mahasiswas.length}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Dalam kelas ini</p>
          </div>

          <div className="glass-panel glass-card-interactive rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold text-slate-600">Jadwal Perkuliahan</span>
              <Calendar className="w-4 h-4 text-sky-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{jadwals.length}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Sesi per minggu</p>
          </div>

          <div className="glass-panel glass-card-interactive rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold text-slate-600">Sesi Terkini</span>
              <Clock className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">
              {latestAtt ? `Pertemuan ${latestAtt.pertemuanKe}` : "Belum Ada"}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {latestAtt ? latestAtt.date : "Mulai sesi pertama"}
            </p>
          </div>

          <div className="glass-panel glass-card-interactive rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold text-slate-600">Tingkat Hadir Sesi Terkini</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-700">
              {latestAtt && latestAtt.stats.total > 0
                ? `${Math.round(((latestAtt.stats.present + latestAtt.stats.late) / latestAtt.stats.total) * 100)}%`
                : "0%"}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {latestAtt ? `${latestAtt.stats.present} Hadir, ${latestAtt.stats.late} Telat` : "Belum ada record"}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-white/60">
          <nav className="flex space-x-6">
            <button
              onClick={() => setActiveTab("mahasiswa")}
              className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === "mahasiswa"
                  ? "border-sky-600 text-sky-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Users className="w-4 h-4 text-sky-600" />
              Mahasiswa di Kelas Ini
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-white/70 text-slate-700 font-semibold border border-white/80">
                {mahasiswas.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("absensi")}
              className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === "absensi"
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Absensi Terkini Kelas
              {latestAtt && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-emerald-500/15 text-emerald-800 font-semibold border border-emerald-400/30">
                  Sesi {latestAtt.pertemuanKe}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("jadwal")}
              className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === "jadwal"
                  ? "border-sky-600 text-sky-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Calendar className="w-4 h-4 text-sky-600" />
              Jadwal Kuliah
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-white/70 text-slate-700 font-semibold border border-white/80">
                {jadwals.length}
              </span>
            </button>
          </nav>
        </div>

        {/* TAB CONTENT: MAHASISWA DI KELAS */}
        {activeTab === "mahasiswa" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-600" />
                  Daftar Mahasiswa Terdaftar ({mahasiswas.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Data seluruh mahasiswa yang terdaftar di kelas ini dan berhak mengikuti presensi perkuliahan.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    setShowAddMhsModal(true);
                    setMhsError(null);
                    setMhsSuccess(null);
                  }}
                  className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs gap-1.5 h-8 px-3 font-semibold shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Tambah Mahasiswa
                </Button>
              </div>
            </div>

            {/* Filter Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Cari mahasiswa berdasarkan nama, NIM, atau program studi..."
                value={searchMhs}
                onChange={(e) => setSearchMhs(e.target.value)}
                className="pl-9 h-9 text-xs bg-white shadow-xs"
              />
            </div>

            {/* Table Mahasiswa */}
            <div className="glass-panel rounded-3xl shadow-xs overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/70 text-xs">
                    <TableHead className="w-12 text-center">No</TableHead>
                    <TableHead className="w-32">NIM</TableHead>
                    <TableHead>Nama Mahasiswa</TableHead>
                    <TableHead className="hidden sm:table-cell">Program Studi / Smtr</TableHead>
                    <TableHead className="text-center">Status Sesi Terkini</TableHead>
                    <TableHead className="text-center hidden md:table-cell">Total Hadir</TableHead>
                    <TableHead className="w-20 text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMahasiswas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-xs text-slate-400">
                        {searchMhs ? (
                          <span>Tidak ada mahasiswa yang cocok dengan kata kunci "<strong>{searchMhs}</strong>"</span>
                        ) : (
                          <div className="space-y-3">
                            <Users className="w-8 h-8 text-slate-300 mx-auto" />
                            <p className="font-semibold text-slate-700">Belum ada mahasiswa yang terdaftar di kelas ini.</p>
                            <p className="text-[11px] text-slate-400">Klik tombol "Tambah Mahasiswa" di atas untuk mendaftarkan mahasiswa.</p>
                            <Button
                              size="sm"
                              onClick={() => setShowAddMhsModal(true)}
                              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs gap-1.5 mt-2"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              Tambah Sekarang
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMahasiswas.map((m, idx) => (
                      <TableRow key={m.id} className="text-xs hover:bg-slate-50/60 transition-colors">
                        <TableCell className="text-center font-medium text-slate-400">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-slate-900">
                          {m.nim}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-slate-900">{m.name}</div>
                          {m.email && <div className="text-[11px] text-slate-400">{m.email}</div>}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-slate-600">
                          {m.jurusan} <span className="text-slate-400 text-[11px]">(Smtr {m.semester})</span>
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(m.latestStatus || "NOT_RECORDED")}
                        </TableCell>
                        <TableCell className="text-center hidden md:table-cell font-semibold text-slate-700">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                            {m.hadirCount || 0}x Hadir
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <button
                            onClick={() => handleRemoveMahasiswa(m.id, m.name)}
                            className="text-slate-300 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                            title="Keluarkan dari kelas"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* TAB CONTENT: ABSENSI TERKINI KELAS */}
        {activeTab === "absensi" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Absensi Terkini di Kelas Ini
                </h2>
                <p className="text-xs text-slate-500">
                  Pantau kehadiran mahasiswa pada sesi perkuliahan terbaru secara transparan dan terverifikasi.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => navigate(`/kelas/${kelas.id}/absen`)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-8 px-3 font-semibold shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Input / Kelola Absensi Sesi Ini
                </Button>
              </div>
            </div>

            {latestAtt ? (
              <div className="space-y-6">
                {/* Session Banner */}
                <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 rounded-2xl border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      Sesi Pertemuan Ke-{latestAtt.pertemuanKe}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-emerald-700" />
                      {formatTanggalIndo(latestAtt.date)}
                    </h3>
                  </div>

                  {/* Stat Pills */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-white/80 border border-slate-200 text-slate-700 text-xs font-bold">
                      Total: {latestAtt.stats.total}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100/90 border border-emerald-200 text-emerald-800 text-xs font-bold">
                      Hadir: {latestAtt.stats.present}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100/90 border border-amber-200 text-amber-800 text-xs font-bold">
                      Telat: {latestAtt.stats.late}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-100/90 border border-indigo-200 text-indigo-800 text-xs font-bold">
                      Izin/Sakit: {latestAtt.stats.izin + latestAtt.stats.sakit}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-red-100/90 border border-red-200 text-red-800 text-xs font-bold">
                      Alpa: {latestAtt.stats.absent}
                    </span>
                  </div>
                </div>

                {/* Table Roster Absensi Terkini */}
                <div className="glass-panel rounded-3xl shadow-xs overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/70 text-xs">
                        <TableHead className="w-12 text-center">No</TableHead>
                        <TableHead className="w-16 text-center">Foto</TableHead>
                        <TableHead className="w-32">NIM</TableHead>
                        <TableHead>Nama Mahasiswa</TableHead>
                        <TableHead className="w-32 text-center">Waktu Check-In</TableHead>
                        <TableHead className="w-32 text-center">Status Kehadiran</TableHead>
                        <TableHead>Catatan / Keterangan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {latestAtt.records.map((rec: LatestAttendanceRecord, idx: number) => (
                        <TableRow key={rec.mahasiswaId} className="text-xs hover:bg-slate-50/60 transition-colors">
                          <TableCell className="text-center font-medium text-slate-400">
                            {idx + 1}
                          </TableCell>

                          {/* Foto Selfie */}
                          <TableCell className="text-center">
                            {rec.photo ? (
                              <button
                                type="button"
                                onClick={() => setPreviewPhoto({ url: rec.photo!, name: rec.name, time: formatJam(rec.checkIn) })}
                                className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 hover:ring-2 hover:ring-indigo-500 transition-all inline-block"
                                title="Lihat foto selfie presensi"
                              >
                                <img
                                  src={rec.photo}
                                  alt={rec.name}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center mx-auto" title="Tanpa foto selfie">
                                <ImageIcon className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </TableCell>

                          <TableCell className="font-mono font-bold text-slate-800">
                            {rec.nim}
                          </TableCell>

                          <TableCell>
                            <span className="font-semibold text-slate-900 block">{rec.name}</span>
                            <span className="text-[11px] text-slate-400">{rec.jurusan}</span>
                          </TableCell>

                          <TableCell className="text-center font-medium text-slate-600">
                            {formatJam(rec.checkIn)}
                          </TableCell>

                          <TableCell className="text-center">
                            {getStatusBadge(rec.status)}
                          </TableCell>

                          <TableCell className="text-slate-500 text-[11px]">
                            {rec.notes || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-3xl p-12 text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-400/30">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">Belum Ada Sesi Absensi Tercatat</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Mahasiswa dapat melakukan presensi mandiri saat jadwal kelas berlangsung, atau dosen dapat membuka dan menginput lembar absensi secara manual.
                  </p>
                </div>
                <Button
                  onClick={() => navigate(`/kelas/${kelas.id}/absen`)}
                  className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold gap-2 rounded-xl shadow-md shadow-sky-500/20"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mulai / Input Absensi Pertemuan 1
                </Button>
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: JADWAL KULIAH */}
        {activeTab === "jadwal" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-600" />
                  Jadwal Perkuliahan ({jadwals.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Hari, waktu, dan ruangan pelaksanaan perkuliahan untuk kelas ini.
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => setShowAddJadwalModal(true)}
                className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs gap-1.5 h-8 px-3 font-bold rounded-xl shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Jadwal
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {jadwals.length > 0 ? (
                jadwals.map((j: any) => (
                  <div
                    key={j.id}
                    className="p-5 glass-panel glass-card-interactive rounded-3xl space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center rounded-xl px-3 py-1 text-xs font-extrabold bg-sky-100/70 text-sky-800 border border-sky-200/80 shadow-xs">
                          {j.hari}
                        </span>
                        <button
                          onClick={() => handleDeleteJadwal(j.id)}
                          className="text-slate-400 hover:text-red-500 p-1 rounded-md transition-colors"
                          title="Hapus Jadwal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-lg font-bold text-slate-900">
                        {j.jamMulai} - {j.jamSelesai} WIB
                      </div>

                      <p className="text-xs text-slate-600 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
                        Ruangan: <strong className="text-slate-800">{j.ruangan || "Belum ditentukan"}</strong>
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-12 glass-panel rounded-3xl border border-dashed border-sky-200/80 text-center space-y-3">
                  <Calendar className="w-8 h-8 text-sky-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-800">Belum ada jadwal perkuliahan</p>
                  <p className="text-xs text-slate-500">Tambahkan jadwal agar mahasiswa dapat memantau waktu kuliah dan presensi tepat waktu.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddJadwalModal(true)}
                    className="text-xs gap-1.5 mt-2 glass-pill rounded-xl"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Jadwal Sekarang
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Tambah Mahasiswa */}
        <AnimatePresence>
          {showAddMhsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-modal rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-white/80"
              >
                <div className="flex items-center justify-between p-5 border-b border-white/60 bg-white/40">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-sky-600" />
                    <h3 className="font-bold text-slate-900 text-base">Tambah Mahasiswa ke Kelas</h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddMhsModal(false);
                      setMhsError(null);
                      setMhsSuccess(null);
                    }}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {/* Mode Switcher */}
                  <div className="grid grid-cols-3 p-1 bg-white/40 border border-white/60 rounded-xl text-xs font-semibold">
                    {(["single", "bulk", "csv"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setAddMode(mode);
                          setMhsError(null);
                          setMhsSuccess(null);
                          setCsvError(null);
                          setCsvPreview([]);
                          setCsvImportResult(null);
                          setCsvFileName("");
                        }}
                        className={`py-1.5 px-1 rounded-lg transition-all flex items-center justify-center gap-1 ${
                          addMode === mode
                            ? "bg-white text-sky-800 font-bold shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {mode === "single" && "1 NIM"}
                        {mode === "bulk" && "Banyak NIM"}
                        {mode === "csv" && <><FileSpreadsheet className="w-3 h-3" />CSV</>}
                      </button>
                    ))}
                  </div>

                  {mhsError && (
                    <div className="p-3 bg-red-500/10 border border-red-400/30 text-red-700 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                      {mhsError}
                    </div>
                  )}

                  {mhsSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-400/30 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                      {mhsSuccess}
                    </div>
                  )}

                  {addMode === "single" && (
                    <form onSubmit={handleAddSingleMhs} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="nim" className="text-xs font-bold text-slate-700">
                          NIM Mahasiswa *
                        </Label>
                        <Input
                          id="nim"
                          placeholder="Masukkan NIM (contoh: 2021001001)"
                          value={inputNim}
                          onChange={(e) => setInputNim(e.target.value)}
                          required
                          className="font-mono text-sm glass-input rounded-xl"
                          autoFocus
                        />
                        <p className="text-[11px] text-slate-500">
                          Mahasiswa harus sudah terdaftar di master database kampus.
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAddMhsModal(false)}
                          className="glass-pill rounded-xl"
                        >
                          Tutup
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={savingMhs}
                          className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl font-bold shadow-md shadow-sky-500/20"
                        >
                          {savingMhs ? "Menambahkan..." : "Tambahkan"}
                        </Button>
                      </div>
                    </form>
                  )}
                  {addMode === "bulk" && (
                    <form onSubmit={handleAddBulkMhs} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="bulkNims" className="text-xs font-bold text-slate-700">
                          Daftar NIM Mahasiswa *
                        </Label>
                        <textarea
                          id="bulkNims"
                          rows={5}
                          placeholder="Masukkan daftar NIM (pisahkan dengan koma, spasi, atau baris baru):&#10;2021001001&#10;2021001002&#10;2021001003"
                          value={bulkNims}
                          onChange={(e) => setBulkNims(e.target.value)}
                          className="w-full rounded-xl border border-white/80 bg-white/70 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-xs"
                          required
                        />
                        <p className="text-[11px] text-slate-500">
                          Sistem akan memvalidasi dan mendaftarkan seluruh mahasiswa tersebut ke kelas ini.
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAddMhsModal(false)}
                          className="glass-pill rounded-xl"
                        >
                          Tutup
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={savingMhs}
                          className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl font-bold shadow-md shadow-sky-500/20"
                        >
                          {savingMhs ? "Mendaftarkan..." : "Tambahkan Massal"}
                        </Button>
                      </div>
                    </form>
                  )}
                  {addMode === "csv" && (
                    /* ── CSV Import Panel ─────────────────────────────────── */
                    <div className="space-y-4">
                      {/* Download Template */}
                      <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-slate-300 rounded-lg text-xs text-slate-600 hover:border-indigo-400 hover:text-sky-600 hover:bg-indigo-50 transition-all"
                      >
                        <Download className="w-4 h-4" />
                        Download Template CSV (Excel)
                      </button>

                      {/* Drop zone */}
                      <div
                        className="relative border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files[0];
                          if (file) handleCsvFile(file);
                        }}
                        onClick={() => document.getElementById("csv-file-input")?.click()}
                      >
                        <input
                          id="csv-file-input"
                          type="file"
                          accept=".csv,text/csv"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleCsvFile(file);
                          }}
                        />
                        <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        {csvFileName ? (
                          <p className="text-xs font-medium text-sky-600">{csvFileName}</p>
                        ) : (
                          <>
                            <p className="text-xs font-medium text-slate-600">Drag & drop file CSV di sini</p>
                            <p className="text-[11px] text-slate-400 mt-1">atau klik untuk memilih file</p>
                          </>
                        )}
                      </div>

                      {csvError && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          {csvError}
                        </div>
                      )}

                      {csvImportResult && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg">
                          {csvImportResult}
                        </div>
                      )}

                      {/* Preview table */}
                      {csvPreview.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-700">
                            Preview: {csvPreview.length} mahasiswa siap diimpor
                          </p>
                          <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg">
                            <table className="w-full text-[11px]">
                              <thead className="bg-slate-50 sticky top-0">
                                <tr>
                                  <th className="text-left py-1.5 px-2 text-slate-600 font-semibold">NIM</th>
                                  <th className="text-left py-1.5 px-2 text-slate-600 font-semibold">Nama</th>
                                  <th className="text-left py-1.5 px-2 text-slate-600 font-semibold">Jurusan</th>
                                </tr>
                              </thead>
                              <tbody>
                                {csvPreview.slice(0, 50).map((s, i) => (
                                  <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                                    <td className="py-1 px-2 font-mono text-slate-700">{s.nim}</td>
                                    <td className="py-1 px-2 text-slate-700">{s.name}</td>
                                    <td className="py-1 px-2 text-slate-500">{s.jurusan}</td>
                                  </tr>
                                ))}
                                {csvPreview.length > 50 && (
                                  <tr>
                                    <td colSpan={3} className="py-1.5 px-2 text-center text-slate-400 italic">
                                      ...dan {csvPreview.length - 50} lainnya
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAddMhsModal(false)}
                        >
                          Tutup
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={savingMhs || csvPreview.length === 0}
                          onClick={handleImportCsv}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          {savingMhs ? "Mengimpor..." : `Import ${csvPreview.length} Mahasiswa`}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal Tambah Jadwal */}
        <AnimatePresence>
          {showAddJadwalModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-modal rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-white/80"
              >
                <div className="flex items-center justify-between p-4 border-b border-white/60 bg-white/40">
                  <h3 className="font-bold text-slate-900 text-sm">Tambah Jadwal Perkuliahan</h3>
                  <button
                    onClick={() => setShowAddJadwalModal(false)}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddJadwal} className="p-5 space-y-3.5">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700">Hari</Label>
                    <select
                      value={hari}
                      onChange={(e) => setHari(e.target.value as HariType)}
                      className="w-full h-9 rounded-xl border border-white/80 bg-white/70 px-3 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-xs"
                    >
                      {hariOptions.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700">Jam Mulai</Label>
                      <Input
                        type="time"
                        value={jamMulai}
                        onChange={(e) => setJamMulai(e.target.value)}
                        className="h-9 text-xs glass-input rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700">Jam Selesai</Label>
                      <Input
                        type="time"
                        value={jamSelesai}
                        onChange={(e) => setJamSelesai(e.target.value)}
                        className="h-9 text-xs glass-input rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700">Ruangan (Opsional)</Label>
                    <Input
                      placeholder="Contoh: Lab Komputer 2"
                      value={ruangan}
                      onChange={(e) => setRuangan(e.target.value)}
                      className="h-9 text-xs glass-input rounded-xl"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/60">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddJadwalModal(false)}
                      className="glass-pill rounded-xl"
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={savingJadwal}
                      className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl font-bold shadow-md shadow-sky-500/20"
                    >
                      {savingJadwal ? "Menyimpan..." : "Simpan"}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal Preview Foto Selfie */}
        <AnimatePresence>
          {previewPhoto && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in"
              onClick={() => setPreviewPhoto(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass-modal rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-white/80"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-white/60 bg-white/40 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{previewPhoto.name}</h4>
                    <p className="text-[11px] text-slate-500">Check-in: {previewPhoto.time}</p>
                  </div>
                  <button
                    onClick={() => setPreviewPhoto(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 bg-slate-950/80 backdrop-blur-md flex items-center justify-center">
                  <img
                    src={previewPhoto.url}
                    alt={previewPhoto.name}
                    className="max-h-80 w-auto rounded-2xl object-contain shadow-md"
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}





