import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Plus, Calendar, Users, CheckCircle,
  Trash2, ChevronRight, RefreshCw, AlertCircle, X
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { kelasApi, type KelasItem, type HariType } from "../lib/api";

const hariOptions: HariType[] = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];

export function KelasList() {
  const [kelasList, setKelasList] = useState<KelasItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Create
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [kode, setKode] = useState("");
  const [nama, setNama] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [hari, setHari] = useState<HariType>("SENIN");
  const [jamMulai, setJamMulai] = useState("08:00");
  const [jamSelesai, setJamSelesai] = useState("10:30");
  const [ruangan, setRuangan] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const navigate = useNavigate();

  const fetchKelas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await kelasApi.getAll();
      if (res.success && res.data) {
        setKelasList(res.data);
      } else {
        setError(res.message || "Gagal memuat daftar kelas.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKelas();
  }, [fetchKelas]);

  const handleCreateKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kode.trim() || !nama.trim()) {
      setFormError("Kode dan Nama Kelas wajib diisi.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const res = await kelasApi.create({
        kode: kode.trim().toUpperCase(),
        nama: nama.trim(),
        deskripsi: deskripsi.trim() || undefined,
        jadwals: [
          {
            hari,
            jamMulai,
            jamSelesai,
            ruangan: ruangan.trim() || undefined,
          },
        ],
      });
      if (res.success && res.data) {
        setShowCreateModal(false);
        setKode("");
        setNama("");
        setDeskripsi("");
        setRuangan("");
        fetchKelas();
      } else {
        setFormError(res.message || "Gagal membuat kelas.");
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKelas = async (id: string, namaKelas: string) => {
    if (!window.confirm(`Yakin ingin menghapus kelas "${namaKelas}"? Seluruh data presensi dan mahasiswa pada kelas ini akan ikut terhapus.`)) {
      return;
    }
    try {
      const res = await kelasApi.delete(id);
      if (res.success) {
        fetchKelas();
      } else {
        alert(res.message || "Gagal menghapus kelas");
      }
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : "Gagal menghapus kelas"));
    }
  };

  return (
    <div className="min-h-screen text-slate-800 relative overflow-hidden satpamo-page-bg font-sans">
      {/* Decorative ambient blobs */}
      <div className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 bg-sky-200/20 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/3 w-72 h-72 bg-blue-100/30 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 w-96 h-96 bg-sky-200/20 rounded-full blur-3xl" />

      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-600 shadow-xs">
                <BookOpen className="w-5 h-5" />
              </div>
              Manajemen Kelas Perkuliahan
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Kelola kelas, jadwal mengajar, daftar mahasiswa, dan input absensi per pertemuan.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchKelas}
              disabled={loading}
              className="gap-1.5 glass-pill text-slate-700 hover:text-slate-900 rounded-xl"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-sky-600" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-md shadow-sky-500/20 rounded-xl font-bold"
            >
              <Plus className="w-4 h-4" />
              Buat Kelas Baru
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl glass-warning text-red-700 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Classes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 rounded-3xl bg-white/40 backdrop-blur-md border border-white/60 animate-pulse" />
            ))}
          </div>
        ) : kelasList.length === 0 ? (
          <div className="text-center py-16 px-4 glass-panel rounded-3xl shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-sky-100/80 text-sky-600 border border-sky-200/70 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Belum ada kelas perkuliahan</h3>
            <p className="text-sm text-slate-600 max-w-sm mx-auto mt-1 mb-6">
              Mulai buat kelas mata kuliah pertama Anda untuk mengatur jadwal dan absensi mahasiswa.
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white gap-2 rounded-xl font-bold shadow-md shadow-sky-500/20"
            >
              <Plus className="w-4 h-4" /> Buat Kelas Pertama
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kelasList.map((k) => (
              <motion.div
                key={k.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel glass-card-interactive rounded-3xl flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5 space-y-4">
                  {/* Top Bar: Code & Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-sky-100/70 text-sky-800 border border-sky-200/80 shadow-xs">
                      {k.kode}
                    </span>
                    <button
                      onClick={() => handleDeleteKelas(k.id, k.nama)}
                      className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-white/40 transition-colors"
                      title="Hapus Kelas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Class Name & Description */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-sky-600 transition-colors line-clamp-1">
                      {k.nama}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {"Tidak ada deskripsi mata kuliah."}
                    </p>
                  </div>

                  {/* Jadwal Pills */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Jadwal Perkuliahan
                    </span>
                    {k.jadwal && k.jadwal.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {k.jadwal.map((j) => (
                          <span
                            key={j.id}
                            className="inline-flex items-center gap-1.5 text-xs bg-white/60 text-slate-700 px-2.5 py-1 rounded-xl border border-white/80 font-medium shadow-xs"
                          >
                            <Calendar className="w-3 h-3 text-sky-600" />
                            {j.hari} {j.jamMulai}-{j.jamSelesai}
                            {j.ruangan && (
                              <span className="text-slate-500 font-normal">({j.ruangan})</span>
                            )}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Belum ada jadwal</span>
                    )}
                  </div>
                </div>

                {/* Card Footer: Stats & Buttons */}
                <div className="border-t border-white/50 bg-white/40 p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1" title="Mahasiswa terdaftar">
                      <Users className="w-3.5 h-3.5 text-sky-600" />
                      <strong className="text-slate-900">{(k._count?.mahasiswa ?? 0)}</strong> mhs
                    </span>
                    <span className="flex items-center gap-1" title="Catatan presensi">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <strong className="text-slate-900">{(k._count?.presensi ?? 0)}</strong> sesi
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/kelas/${k.id}`)}
                      className="text-xs h-8 px-2.5 glass-pill border-white/70 hover:border-sky-300 text-slate-700 hover:text-sky-700 rounded-xl"
                    >
                      Kelola
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/kelas/${k.id}/absen`)}
                      className="text-xs h-8 px-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl gap-1 shadow-sm font-semibold"
                    >
                      Absen
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Modal Buat Kelas Baru */}
        <AnimatePresence>
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-modal rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-white/80"
              >
                <div className="flex items-center justify-between p-5 border-b border-white/60 bg-white/40">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-sky-600" />
                    <h3 className="font-bold text-slate-900 text-base">Buat Kelas Perkuliahan Baru</h3>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-white/40"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateKelas} className="p-6 space-y-4">
                  {formError && (
                    <div className="p-3 glass-warning text-red-700 text-xs rounded-xl">
                      {formError}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5 col-span-1">
                      <Label htmlFor="kode" className="text-xs font-semibold text-slate-700">
                        Kode Kelas *
                      </Label>
                      <Input
                        id="kode"
                        placeholder="Contoh: TIF-301"
                        value={kode}
                        onChange={(e) => setKode(e.target.value.toUpperCase())}
                        required
                        className="font-mono text-sm glass-input rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <Label htmlFor="nama" className="text-xs font-semibold text-slate-700">
                        Nama Mata Kuliah *
                      </Label>
                      <Input
                        id="nama"
                        placeholder="Contoh: Pemrograman Web Lanjut"
                        value={nama}
                        onChange={(e) => setNama(e.target.value)}
                        required
                        className="text-sm glass-input rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="deskripsi" className="text-xs font-semibold text-slate-700">
                      Deskripsi Mata Kuliah (Opsional)
                    </Label>
                    <Input
                      id="deskripsi"
                      placeholder="Ringkasan silabus atau materi kelas..."
                      value={deskripsi}
                      onChange={(e) => setDeskripsi(e.target.value)}
                      className="text-sm glass-input rounded-xl"
                    />
                  </div>

                  <div className="pt-2 border-t border-white/60">
                    <span className="text-xs font-bold text-slate-800 block mb-2">
                      Jadwal Perkuliahan Awal
                    </span>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-slate-500">Hari</Label>
                        <select
                          value={hari}
                          onChange={(e) => setHari(e.target.value as HariType)}
                          className="w-full h-9 rounded-xl border border-white/80 bg-white/60 px-3 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-400"
                        >
                          {hariOptions.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] text-slate-500">Jam Mulai</Label>
                        <Input
                          type="time"
                          value={jamMulai}
                          onChange={(e) => setJamMulai(e.target.value)}
                          className="h-9 text-xs glass-input rounded-xl"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] text-slate-500">Jam Selesai</Label>
                        <Input
                          type="time"
                          value={jamSelesai}
                          onChange={(e) => setJamSelesai(e.target.value)}
                          className="h-9 text-xs glass-input rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="mt-2.5">
                      <Label className="text-[11px] text-slate-500">Ruangan (Opsional)</Label>
                      <Input
                        placeholder="Contoh: Lab Komputer 1 / Gedung B 203"
                        value={ruangan}
                        onChange={(e) => setRuangan(e.target.value)}
                        className="h-9 text-xs mt-1 glass-input rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/60">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateModal(false)}
                      disabled={saving}
                      className="glass-pill rounded-xl"
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      disabled={saving}
                      className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl shadow-md shadow-sky-500/20 font-bold"
                    >
                      {saving ? "Menyimpan..." : "Simpan Kelas"}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
