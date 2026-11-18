import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, GraduationCap, BookOpen, Info, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { authApi } from "../lib/api";

type RoleTab = "mahasiswa" | "dosen";

export function Register() {
  const [tab, setTab] = useState<RoleTab>("mahasiswa");

  // Mahasiswa fields
  const [nim, setNim] = useState("");
  const [fullName, setFullName] = useState("");
  const [mhsEmail, setMhsEmail] = useState("");
  const [mhsPassword, setMhsPassword] = useState("");
  const [showMhsPass, setShowMhsPass] = useState(false);

  // Dosen fields
  const [username, setUsername] = useState("");
  const [dosenEmail, setDosenEmail] = useState("");
  const [dosenPassword, setDosenPassword] = useState("");
  const [showDosenPass, setShowDosenPass] = useState(false);

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmitMahasiswa = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.registerMahasiswa({
        nim: nim.trim(),
        name: fullName.trim(),
        email: mhsEmail.trim() || undefined,
        password: mhsPassword,
      });
      if (res.success) {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(res.message || "Aktivasi gagal. Coba lagi.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDosen = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.register(username, dosenEmail, dosenPassword);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 2000);
      } else {
        const firstError = (res as any).errors?.[0]?.msg;
        setError(firstError || res.message || "Pendaftaran gagal. Coba lagi.");
      }
    } catch {
      setError("Tidak dapat terhubung ke server. Pastikan backend berjalan.");
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: RoleTab; label: string; icon: React.ReactNode }[] = [
    { id: "mahasiswa", label: "Mahasiswa", icon: <GraduationCap className="w-4 h-4" /> },
    { id: "dosen", label: "Dosen", icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen text-slate-800 relative overflow-hidden satpamo-page-bg flex items-center justify-center p-4">
      {/* Decorative ambient blobs */}
      <div className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 bg-sky-200/20 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/3 w-72 h-72 bg-blue-100/30 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 w-96 h-96 bg-sky-200/20 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Branding */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl glass-panel p-2 border border-white/80 shadow-lg shadow-sky-500/15 mb-3"
          >
            <img
              src="/logo-transparent.png"
              alt="SATPAMO Logo"
              className="w-full h-full object-contain drop-shadow-md"
            />
          </motion.div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Buat Akun</h1>
          <p className="text-sm text-slate-600 mt-1 font-medium">SATPAMO &bull; Pilih peran Anda untuk melanjutkan</p>
        </div>

        {/* Card */}
        <div className="auth-card-glass rounded-3xl p-8">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="w-14 h-14 bg-emerald-100/80 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <p className="font-bold text-slate-900 text-lg">
                {tab === "mahasiswa" ? "Akun berhasil diaktivasi!" : "Pendaftaran berhasil!"}
              </p>
              <p className="text-sm text-slate-600 mt-1 font-medium">Mengarahkan ke halaman login...</p>
            </motion.div>
          ) : (
            <>
              {/* Tab switcher */}
              <div className="flex gap-1.5 p-1.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-2xl mb-6 shadow-xs">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTab(t.id); setError(""); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-bold transition-all ${
                      tab === t.id
                        ? "bg-white/90 text-sky-700 shadow-sm border border-white/90"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/30"
                    }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {tab === "mahasiswa" ? (
                  <motion.form
                    key="mahasiswa"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleSubmitMahasiswa}
                    className="space-y-4"
                  >
                    {/* Info alert */}
                    <div className="flex gap-2 glass-panel border-sky-300/40 rounded-2xl p-3 text-xs text-sky-900 font-medium">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-sky-700" />
                      <span>
                        Data Anda diverifikasi dengan database akademik kampus. NIM dan Nama lengkap
                        harus sesuai dengan data yang telah diimpor oleh dosen/admin.
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="mhs-nim" className="text-slate-700 font-semibold text-xs">NIM</Label>
                      <Input
                        id="mhs-nim"
                        type="text"
                        placeholder="Contoh: 2021001001"
                        value={nim}
                        onChange={(e) => setNim(e.target.value)}
                        required
                        className="glass-input rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="mhs-name" className="text-slate-700 font-semibold text-xs">Nama Lengkap</Label>
                      <Input
                        id="mhs-name"
                        type="text"
                        placeholder="Sesuai data resmi (case-insensitive)"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="text-sm glass-input rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="mhs-email" className="text-slate-700 font-semibold text-xs">
                        Email <span className="text-slate-400 font-normal">(opsional)</span>
                      </Label>
                      <Input
                        id="mhs-email"
                        type="email"
                        placeholder="email@mahasiswa.ac.id"
                        value={mhsEmail}
                        onChange={(e) => setMhsEmail(e.target.value)}
                        className="text-sm glass-input rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="mhs-password" className="text-slate-700 font-semibold text-xs">Password Baru</Label>
                      <div className="relative">
                        <Input
                          id="mhs-password"
                          type={showMhsPass ? "text" : "password"}
                          placeholder="Minimal 6 karakter"
                          value={mhsPassword}
                          onChange={(e) => setMhsPassword(e.target.value)}
                          required
                          className="glass-input rounded-xl pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowMhsPass(!showMhsPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showMhsPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-rose-700 glass-warning rounded-xl px-3 py-2 font-medium"
                      >
                        {error}
                      </motion.p>
                    )}

                    <Button
                      type="submit"
                      className="w-full gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-md shadow-sky-500/20 rounded-xl font-bold py-2.5"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Mengaktivasi...
                        </span>
                      ) : (
                        <>
                          <GraduationCap className="w-4 h-4" />
                          Aktivasi Akun Mahasiswa
                        </>
                      )}
                    </Button>
                  </motion.form>
                ) : (
                  <motion.form
                    key="dosen"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleSubmitDosen}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="dosen-username" className="text-slate-700 font-semibold text-xs">Username</Label>
                      <Input
                        id="dosen-username"
                        type="text"
                        placeholder="Pilih username (min. 3 karakter)"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="glass-input rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="dosen-email" className="text-slate-700 font-semibold text-xs">Email</Label>
                      <Input
                        id="dosen-email"
                        type="email"
                        placeholder="Masukkan email Anda"
                        value={dosenEmail}
                        onChange={(e) => setDosenEmail(e.target.value)}
                        required
                        className="glass-input rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="dosen-password" className="text-slate-700 font-semibold text-xs">Password</Label>
                      <div className="relative">
                        <Input
                          id="dosen-password"
                          type={showDosenPass ? "text" : "password"}
                          placeholder="Buat password (min. 6 karakter)"
                          value={dosenPassword}
                          onChange={(e) => setDosenPassword(e.target.value)}
                          required
                          className="glass-input rounded-xl pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowDosenPass(!showDosenPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showDosenPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-rose-700 glass-warning rounded-xl px-3 py-2 font-medium"
                      >
                        {error}
                      </motion.p>
                    )}

                    <Button
                      type="submit"
                      className="w-full gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-md shadow-sky-500/20 rounded-xl font-bold py-2.5"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Mendaftarkan...
                        </span>
                      ) : (
                        <>
                          <BookOpen className="w-4 h-4" />
                          Daftar sebagai Dosen
                        </>
                      )}
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>
            </>
          )}

          {!success && (
            <p className="text-center text-sm text-slate-600 mt-6 font-medium">
              Sudah punya akun?{" "}
              <Link to="/login" className="text-sky-600 font-bold hover:underline">
                Masuk
              </Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
