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
      <div className="min-h-screen bg-slate-50 font-sans">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-400">
          Memuat lembar absensi kelas...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Gagal Memuat Absensi</h2>
          <p className="text-sm text-slate-500">{error || "Data tidak ditemukan."}</p>
          <Button onClick={() => navigate("/kelas")} variant="outline">
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
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button type="button" onClick={() => navigate("/kelas")} className="hover:text-indigo-600">
            Daftar Kelas
          </button>
          <span>/</span>
          <button type="button" onClick={() => navigate(`/kelas/${id}`)} className="hover:underline">
            {data.kelas.nama}
          </button>
          <span>/</span>
          <span className="font-semibold text-slate-800">Lembar Absensi</span>
        </div>

        {/* Header Title & Actions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                {data.kelas.kode}
              </span>
              <span className="text-xs text-slate-500">
                Pertemuan Ke-{pertemuanKe} • {date}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Absensi Kelas: {data.kelas.nama}
            </h1>
            <p className="text-xs text-slate-500">
              Tandai kehadiran mahasiswa dan klik tombol "Simpan Absensi" di bawah.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllPresent}
              className="text-xs text-slate-700 border-slate-300 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 gap-1.5"
            >
              <Check className="w-3.5 h-3.5" /> Tandai Semua Hadir
            </Button>
            <Button
              onClick={handleSaveAttendance}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 text-xs gap-1.5 h-9 px-4 font-semibold"
            >
              <Save className="w-4 h-4" />
              {saving ? "Menyimpan..." : "Simpan Absensi"}
            </Button>
          </div>
        </div>

        {/* Feedback Success */}
        {saveMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2.5 font-medium animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {saveMessage}
          </div>
        )}

        {/* Filter Controls & Stats Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Selector Pertemuan */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Pertemuan:</span>
                <select
                  value={pertemuanKe}
                  onChange={(e) => setPertemuanKe(parseInt(e.target.value, 10))}
                  className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
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
                <span className="text-xs font-semibold text-slate-700">Tanggal:</span>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-8 text-xs w-36"
                />
              </div>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold">
                Total: {currentStats.total}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-semibold">
                Hadir: {currentStats.present}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-semibold">
                Terlambat: {currentStats.late}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-semibold">
                Sakit: {currentStats.sakit}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 font-semibold">
                Izin: {currentStats.izin}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-red-100 text-red-800 font-semibold">
                Alpa: {currentStats.absent}
              </span>
            </div>
          </div>
        </div>

        {/* Table Roster Absensi */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70 text-xs">
                <TableHead className="w-12 text-center">No</TableHead>
                <TableHead className="w-32">NIM</TableHead>
                <TableHead>Nama Mahasiswa</TableHead>
                <TableHead className="w-80 text-center">Status Kehadiran</TableHead>
                <TableHead>Catatan / Keterangan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-xs text-slate-400">
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
                    <TableRow key={st.nim} className="text-xs hover:bg-slate-50/50">
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
                                className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all ${
                                  isSelected
                                    ? opt.activeClass
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
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
                          className="h-8 text-xs bg-slate-50/50"
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
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 text-white backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl flex items-center gap-6 border border-slate-700/50">
          <div className="text-xs text-slate-300 hidden sm:block">
            Pertemuan <strong>{pertemuanKe}</strong> • {currentStats.present} Hadir, {currentStats.late} Telat, {currentStats.absent} Alpa
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/kelas/${id}`)}
              className="text-xs text-slate-300 border-slate-700 hover:bg-slate-800"
            >
              Kembali
            </Button>
            <Button
              size="sm"
              onClick={handleSaveAttendance}
              disabled={saving}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs gap-1.5"
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
