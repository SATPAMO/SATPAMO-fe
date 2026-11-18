import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Save, AlertCircle, Check } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "../components/ui/table";
import {
  kelasApi,
  type ClassAttendanceResponse
} from "../lib/api";

type StatusType = "hadir" | "izin" | "sakit" | "alpha" | "belum_hadir" | "PRESENT" | "LATE" | "ABSENT" | "IZIN" | "SAKIT" | "NOT_RECORDED";

const statusOptions: { label: string; value: StatusType; color: string; activeClass: string }[] = [
  { label: "Hadir", value: "PRESENT", color: "text-emerald-700", activeClass: "bg-emerald-500 text-white border-emerald-500 shadow-sm" },
  { label: "Terlambat", value: "LATE", color: "text-amber-700", activeClass: "bg-amber-500 text-white border-amber-500 shadow-sm" },
  { label: "Izin", value: "IZIN", color: "text-indigo-700", activeClass: "bg-indigo-500 text-white border-indigo-500 shadow-sm" },
  { label: "Sakit", value: "SAKIT", color: "text-blue-700", activeClass: "bg-blue-500 text-white border-blue-500 shadow-sm" },
  { label: "Alpa", value: "ABSENT", color: "text-red-700", activeClass: "bg-red-500 text-white border-red-500 shadow-sm" },
];

export function KelasAttendance() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<ClassAttendanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter pertemuan / tanggal
  const [pertemuanKe, setPertemuanKe] = useState<number>(1);
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);

  // State draft absensi di form
  const [attendanceState, setAttendanceState] = useState<
    Record<string, { status: StatusType; notes: string }>
  >({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const fetchAttendance = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setSaveMessage(null);

    try {
      const res = await kelasApi.getClassAttendance(id, {
        jadwalId: 1,
        date,
      });

      if (res.success && res.data) {
        setData(res.data);

        // Sync ke local state
        const initialMap: Record<string, { status: StatusType; notes: string }> = {};
        res.data.students.forEach((st) => {
          initialMap[st.nim] = {
            status: st.status as StatusType,
            notes: "",
          };
        });
        setAttendanceState(initialMap);
      } else {
        setError(res.message || "Gagal memuat data absensi kelas.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }, [id, pertemuanKe, date]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleStatusChange = (nim: string, status: StatusType) => {
    setAttendanceState((prev) => ({
      ...prev,
      [nim]: {
        ...prev[nim],
        status,
      },
    }));
  };

  const handleNotesChange = (nim: string, notes: string) => {
    setAttendanceState((prev) => ({
      ...prev,
      [nim]: {
        ...prev[nim],
        notes,
      },
    }));
  };

  const handleMarkAllPresent = () => {
    if (!data) return;
    const updated: Record<string, { status: StatusType; notes: string }> = {};
    data.students.forEach((st) => {
      updated[st.nim] = {
        status: "PRESENT",
        notes: attendanceState[st.nim]?.notes || "",
      };
    });
    setAttendanceState(updated);
  };

  const handleSaveAttendance = async () => {
    if (!id || !data) return;
    setSaving(true);
    setSaveMessage(null);

    try {
      const recordsToSave = Object.entries(attendanceState).map(([mhsId, val]) => ({
        mahasiswaId: mhsId,
        status: val.status === "NOT_RECORDED" ? "ABSENT" : val.status,
        notes: val.notes || undefined,
      }));

      const res = await kelasApi.recordClassAttendance(id, {
        pertemuanKe,
        date,
        records: recordsToSave,
      });

      if (res.success) {
        setSaveMessage("Catatan absensi kelas berhasil disimpan ke database!");
        fetchAttendance();
      } else {
        alert(res.message || "Gagal menyimpan absensi.");
      }
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : "Gagal menyimpan absensi"));
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen text-slate-800 relative overflow-hidden satpamo-page-bg font-sans">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-500 font-semibold">
          Memuat lembar absensi kelas...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen text-slate-800 relative overflow-hidden satpamo-page-bg font-sans">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4 glass-panel rounded-3xl mt-12 p-8">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Gagal Memuat Absensi</h2>
          <p className="text-sm text-slate-600">{error || "Data tidak ditemukan."}</p>
          <Button onClick={() => navigate("/kelas")} variant="outline" className="glass-pill rounded-xl">
            Kembali ke Kelas
          </Button>
        </div>
      </div>
    );
  }

  // Hitung statistik langsung dari state aktif
  const currentStats = {
    total: data.students.length,
    present: Object.values(attendanceState).filter((s) => s.status === "PRESENT").length,
    late: Object.values(attendanceState).filter((s) => s.status === "LATE").length,
    izin: Object.values(attendanceState).filter((s) => s.status === "IZIN").length,
    sakit: Object.values(attendanceState).filter((s) => s.status === "SAKIT").length,
    absent: Object.values(attendanceState).filter((s) => s.status === "ABSENT").length,
    notRecorded: Object.values(attendanceState).filter((s) => s.status === "NOT_RECORDED").length,
  };

  return (
    <div className="min-h-screen text-slate-800 relative overflow-hidden satpamo-page-bg font-sans pb-20">
      {/* Decorative ambient blobs */}
      <div className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 bg-sky-200/20 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/3 w-72 h-72 bg-blue-100/30 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 w-96 h-96 bg-sky-200/20 rounded-full blur-3xl" />

      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 relative z-10">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button type="button" onClick={() => navigate("/kelas")} className="hover:text-sky-600 font-medium">
            Daftar Kelas
          </button>
          <span>/</span>
          <button type="button" onClick={() => navigate(`/kelas/${id}`)} className="hover:underline font-medium">
            {data.kelas.nama}
          </button>
          <span>/</span>
          <span className="font-semibold text-slate-800">Lembar Absensi</span>
        </div>

        {/* Header Title & Actions */}
        <div className="glass-panel rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-xl bg-sky-100/70 text-sky-800 border border-sky-200/80 shadow-xs">
                {data.kelas.kode}
              </span>
              <span className="text-xs text-slate-600 font-medium">
                Pertemuan Ke-{pertemuanKe} • {date}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Absensi Kelas: {data.kelas.nama}
            </h1>
            <p className="text-xs text-slate-600">
              Tandai kehadiran mahasiswa dan klik tombol "Simpan Absensi" di bawah.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllPresent}
              className="text-xs text-slate-700 glass-pill hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 gap-1.5 rounded-xl"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600" /> Tandai Semua Hadir
            </Button>
            <Button
              onClick={handleSaveAttendance}
              disabled={saving}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-md shadow-sky-500/20 text-xs gap-1.5 h-9 px-4 font-bold rounded-xl"
            >
              <Save className="w-4 h-4" />
              {saving ? "Menyimpan..." : "Simpan Absensi"}
            </Button>
          </div>
        </div>

        {/* Feedback Success */}
        {saveMessage && (
          <div className="p-4 glass-panel border-emerald-400/40 text-emerald-800 text-xs rounded-2xl flex items-center gap-2.5 font-bold animate-fade-in shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {saveMessage}
          </div>
        )}

        {/* Filter Controls & Stats Bar */}
        <div className="glass-panel rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Selector Pertemuan */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Pertemuan:</span>
                <select
                  value={pertemuanKe}
                  onChange={(e) => setPertemuanKe(parseInt(e.target.value, 10))}
                  className="h-8 rounded-xl border border-white/80 bg-white/70 px-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-xs"
                >
                  {Array.from({ length: 16 }, (_, i) => i + 1).map((p) => (
                    <option key={p} value={p}>
                      Pertemuan {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Tanggal:</span>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-8 text-xs w-36 glass-input rounded-xl"
                />
              </div>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-xl bg-white/60 text-slate-700 font-semibold border border-white/80 shadow-xs">
                Total: {currentStats.total}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-800 font-semibold border border-emerald-400/30">
                Hadir: {currentStats.present}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-800 font-semibold border border-amber-400/30">
                Terlambat: {currentStats.late}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-sky-500/15 text-sky-800 font-semibold border border-sky-400/30">
                Sakit: {currentStats.sakit}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-blue-500/15 text-blue-800 font-semibold border border-blue-400/30">
                Izin: {currentStats.izin}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-rose-500/15 text-rose-800 font-semibold border border-rose-400/30">
                Alpa: {currentStats.absent}
              </span>
            </div>
          </div>
        </div>

        {/* Table Roster Absensi */}
        <div className="glass-panel rounded-3xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="glass-table-head text-xs border-b border-white/60">
                <TableHead className="w-12 text-center text-slate-700 font-bold">No</TableHead>
                <TableHead className="w-32 text-slate-700 font-bold">NIM</TableHead>
                <TableHead className="text-slate-700 font-bold">Nama Mahasiswa</TableHead>
                <TableHead className="w-80 text-center text-slate-700 font-bold">Status Kehadiran</TableHead>
                <TableHead className="text-slate-700 font-bold">Catatan / Keterangan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-xs text-slate-500 font-medium">
                    Tidak ada mahasiswa terdaftar di kelas ini.
                  </TableCell>
                </TableRow>
              ) : (
                data.students.map((st, idx) => {
                  const currentItem = attendanceState[st.nim] || {
                    status: "NOT_RECORDED",
                    notes: "",
                  };

                  return (
                    <TableRow key={st.nim} className="text-xs hover:bg-white/40 transition-colors border-b border-white/40">
                      <TableCell className="text-center font-medium text-slate-400">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-mono font-semibold text-slate-800">
                        {st.nim}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-slate-900 block">{st.name}</span>
                        <span className="text-[11px] text-slate-400">
                          
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          {statusOptions.map((opt) => {
                            const isSelected = currentItem.status === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleStatusChange(st.nim, opt.value)}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                                  isSelected
                                    ? opt.activeClass
                                    : "bg-white/70 text-slate-700 border-white/80 hover:bg-white shadow-xs"
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Catatan izin, sakit, dsb..."
                          value={currentItem.notes}
                          onChange={(e) => handleNotesChange(st.nim, e.target.value)}
                          className="h-8 text-xs glass-input rounded-xl"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Floating Bottom Bar Simpan */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 bg-slate-900/80 text-white backdrop-blur-xl px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 border border-white/20">
          <div className="text-xs text-slate-200 hidden sm:block">
            Pertemuan <strong>{pertemuanKe}</strong> • {currentStats.present} Hadir, {currentStats.late} Telat, {currentStats.absent} Alpa
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/kelas/${id}`)}
              className="text-xs text-white border-white/20 bg-white/10 hover:bg-white/20 rounded-xl"
            >
              Kembali
            </Button>
            <Button
              size="sm"
              onClick={handleSaveAttendance}
              disabled={saving}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs gap-1.5 rounded-xl shadow-md shadow-emerald-500/20"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Menyimpan..." : "Simpan Sekarang"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
