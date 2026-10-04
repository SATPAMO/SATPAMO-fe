import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, UserPlus, GraduationCap, BookOpen, Info, CheckCircle2 } from "lucide-react";
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
    } catch (err: any) {
      setError(err?.message || "Tidak dapat terhubung ke server.");
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Branding */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4"
          >
            <UserPlus className="w-8 h-8 text-primary" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900">Buat Akun</h1>
          <p className="text-sm text-gray-500 mt-1">Pilih peran Anda untuk melanjutkan</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-8">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <p className="font-semibold text-gray-900">
                {tab === "mahasiswa" ? "Akun berhasil diaktivasi!" : "Pendaftaran berhasil!"}
              </p>
              <p className="text-sm text-gray-500 mt-1">Mengarahkan ke halaman login...</p>
            </motion.div>
          ) : (
            <>
              {/* Tab switcher */}
              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTab(t.id); setError(""); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      tab === t.id
                        ? "bg-white text-primary shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
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
                    <div className="flex gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>
                        Data Anda diverifikasi dengan database akademik kampus. NIM dan Nama lengkap
                        harus sesuai dengan data yang telah diimpor oleh dosen/admin.
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="mhs-nim" className="text-gray-700">NIM</Label>
                      <Input
                        id="mhs-nim"
                        type="text"
                        placeholder="Contoh: 2021001001"
                        value={nim}
                        onChange={(e) => setNim(e.target.value)}
                        required
                        className="border-gray-300 focus-visible:ring-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="mhs-name" className="text-gray-700">Nama Lengkap</Label>
                      <Input
                        id="mhs-name"
                        type="text"
                        placeholder="Sesuai data resmi (case-insensitive)"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="border-gray-300 focus-visible:ring-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="mhs-email" className="text-gray-700">
                        Email <span className="text-gray-400 font-normal">(opsional)</span>
                      </Label>
                      <Input
                        id="mhs-email"
                        type="email"
                        placeholder="email@mahasiswa.ac.id"
                        value={mhsEmail}
                        onChange={(e) => setMhsEmail(e.target.value)}
                        className="border-gray-300 focus-visible:ring-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="mhs-password" className="text-gray-700">Password Baru</Label>
                      <div className="relative">
                        <Input
                          id="mhs-password"
                          type={showMhsPass ? "text" : "password"}
                          placeholder="Minimal 6 karakter"
                          value={mhsPassword}
                          onChange={(e) => setMhsPassword(e.target.value)}
                          required
                          className="border-gray-300 focus-visible:ring-primary pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowMhsPass(!showMhsPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showMhsPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-md px-3 py-2"
                      >
                        {error}
                      </motion.p>
                    )}

                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full gap-2 shadow-lg shadow-primary/20"
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
                      <Label htmlFor="dosen-username" className="text-gray-700">Username</Label>
                      <Input
                        id="dosen-username"
                        type="text"
                        placeholder="Pilih username (min. 3 karakter)"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="border-gray-300 focus-visible:ring-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="dosen-email" className="text-gray-700">Email</Label>
                      <Input
                        id="dosen-email"
                        type="email"
                        placeholder="Masukkan email Anda"
                        value={dosenEmail}
                        onChange={(e) => setDosenEmail(e.target.value)}
                        required
                        className="border-gray-300 focus-visible:ring-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="dosen-password" className="text-gray-700">Password</Label>
                      <div className="relative">
                        <Input
                          id="dosen-password"
                          type={showDosenPass ? "text" : "password"}
                          placeholder="Buat password (min. 6 karakter)"
                          value={dosenPassword}
                          onChange={(e) => setDosenPassword(e.target.value)}
                          required
                          className="border-gray-300 focus-visible:ring-primary pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowDosenPass(!showDosenPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showDosenPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-md px-3 py-2"
                      >
                        {error}
                      </motion.p>
                    )}

                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full gap-2 shadow-lg shadow-primary/20"
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
            <p className="text-center text-sm text-gray-500 mt-6">
              Sudah punya akun?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Masuk
              </Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
