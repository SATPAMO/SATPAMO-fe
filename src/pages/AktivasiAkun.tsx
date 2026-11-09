import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  UserCheck,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { authApi } from "../lib/api";

export function AktivasiAkun() {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get("token");
  const navigate = useNavigate();

  // Mode state: 'verify-token' (jika ada token di URL) atau 'request-link' (jika akses tanpa token)
  const [mode, setMode] = useState<"verify-token" | "request-link">(
    tokenParam ? "verify-token" : "request-link"
  );

  // --- State Request Link (Input NIM) ---
  const [nimInput, setNimInput] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [requestSuccess, setRequestSuccess] = useState<{
    nim: string;
    email: string;
    devActivationUrl?: string;
  } | null>(null);

  // --- State Token Verification ---
  const [verifying, setVerifying] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [verifiedStudent, setVerifiedStudent] = useState<{
    id: string;
    nim: string;
    name: string;
    email: string | null;
    jurusan: string;
    semester: number;
  } | null>(null);

  // --- State Password Creation ---
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activateLoading, setActivateLoading] = useState(false);
  const [activateError, setActivateError] = useState("");
  const [activationDone, setActivationDone] = useState(false);

  // Verifikasi token jika terdapat token di query URL
  useEffect(() => {
    if (!tokenParam) {
      setMode("request-link");
      return;
    }

    setMode("verify-token");
    setVerifying(true);
    setTokenError("");

    authApi
      .verifyActivationToken(tokenParam)
      .then((res) => {
        if (res.success && res.data) {
          setVerifiedStudent(res.data);
        } else {
          setTokenError(
            res.message ||
              "Tautan aktivasi tidak valid atau telah kedaluwarsa."
          );
        }
      })
      .catch((err) => {
        setTokenError(
          err?.message ||
            "Gagal memverifikasi token aktivasi. Periksa koneksi backend."
        );
      })
      .finally(() => {
        setVerifying(false);
      });
  }, [tokenParam]);

  // Handle pengiriman link aktivasi via NIM
  const handleRequestActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nimInput.trim()) {
      setRequestError("Silakan masukkan NIM Anda.");
      return;
    }

    setRequestError("");
    setRequestLoading(true);

    try {
      const res = await authApi.requestActivation(nimInput.trim());
      if (res.success && res.data) {
        setRequestSuccess({
          nim: res.data.nim,
          email: res.data.email,
          devActivationUrl: res.data.devActivationUrl,
        });
      } else {
        setRequestError(
          res.message || "Gagal memproses permintaan aktivasi akun."
        );
      }
    } catch (err: any) {
      setRequestError(
        err?.message || "Tidak dapat terhubung ke server akademik."
      );
    } finally {
      setRequestLoading(false);
    }
  };

  // Handle simpan password baru
  const handleActivateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivateError("");

    if (!tokenParam) {
      setActivateError("Token aktivasi tidak ditemukan.");
      return;
    }

    if (newPassword.length < 6) {
      setActivateError("Password minimal harus 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setActivateError("Konfirmasi password tidak cocok.");
      return;
    }

    setActivateLoading(true);

    try {
      const res = await authApi.activate(tokenParam, newPassword);
      if (res.success) {
        setActivationDone(true);
      } else {
        setActivateError(
          res.message || "Gagal mengaktifkan akun. Silakan coba kembali."
        );
      }
    } catch (err: any) {
      setActivateError(
        err?.message || "Terjadi kendala saat menghubungi server."
      );
    } finally {
      setActivateLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-lg"
      >
        {/* Header Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25 mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Sistem Absensi Mahasiswa
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Aktivasi Akun Mahasiswa Terdaftar
          </p>
        </div>

        {/* Card Kontainer Utama */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_12px_40px_rgb(0,0,0,0.06)] p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {/* 1. SUKSES AKTIVASI */}
            {activationDone ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4 space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Akun Berhasil Diaktifkan!
                  </h2>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                    Password Anda telah berhasil disimpan. Anda kini dapat login ke
                    portal dan aplikasi presensi SAMA menggunakan NIM atau Email
                    Anda.
                  </p>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={() => navigate("/login")}
                    className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                  >
                    Masuk ke Akun Sekarang
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ) : mode === "verify-token" ? (
              /* 2. MODE FORM PASSWORD (TOKEN DARI EMAIL) */
              <motion.div
                key="verify"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {verifying ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
                    <p className="text-sm text-gray-600 font-medium">
                      Memverifikasi tautan aktivasi Anda...
                    </p>
                  </div>
                ) : tokenError ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div className="text-sm leading-relaxed">
                        <p className="font-semibold">Tautan Tidak Valid</p>
                        <p className="mt-1">{tokenError}</p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 text-center">
                      Tautan aktivasi berlaku selama 24 jam. Jika sudah kedaluwarsa,
                      Anda dapat meminta tautan baru dengan NIM Anda.
                    </p>

                    <Button
                      variant="outline"
                      onClick={() => setMode("request-link")}
                      className="w-full"
                    >
                      Minta Tautan Aktivasi Baru
                    </Button>
                  </div>
                ) : verifiedStudent ? (
                  <form onSubmit={handleActivateAccount} className="space-y-5">
                    {/* Badge Info Mahasiswa */}
                    <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-xl">
                      <div className="flex items-center gap-2 text-blue-800 font-semibold text-sm mb-1">
                        <UserCheck className="w-4 h-4" />
                        Data Mahasiswa Terverifikasi
                      </div>
                      <div className="text-xs text-gray-600 space-y-0.5 mt-2">
                        <p>
                          <span className="font-medium text-gray-700">Nama:</span>{" "}
                          {verifiedStudent.name}
                        </p>
                        <p>
                          <span className="font-medium text-gray-700">NIM:</span>{" "}
                          {verifiedStudent.nim}
                        </p>
                        <p>
                          <span className="font-medium text-gray-700">Jurusan:</span>{" "}
                          {verifiedStudent.jurusan} (Sem {verifiedStudent.semester})
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-gray-900">
                        Buat Password Baru
                      </h3>
                      <p className="text-xs text-gray-500">
                        Tentukan password yang aman untuk mengakses akun perkuliahan Anda.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="new-pass" className="text-gray-700 text-sm">
                        Password Baru
                      </Label>
                      <div className="relative">
                        <Input
                          id="new-pass"
                          type={showPassword ? "text" : "password"}
                          placeholder="Minimal 6 karakter"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="confirm-pass" className="text-gray-700 text-sm">
                        Ulangi Password
                      </Label>
                      <Input
                        id="confirm-pass"
                        type={showPassword ? "text" : "password"}
                        placeholder="Ketik ulang password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>

                    {activateError && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3"
                      >
                        {activateError}
                      </motion.div>
                    )}

                    <Button
                      type="submit"
                      disabled={activateLoading}
                      className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                    >
                      {activateLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                          Menyimpan...
                        </span>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" />
                          Aktifkan Akun Saya
                        </>
                      )}
                    </Button>
                  </form>
                ) : null}
              </motion.div>
            ) : (
              /* 3. MODE MINTA TAUTAN AKTIVASI (INPUT NIM) */
              <motion.div
                key="request"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {requestSuccess ? (
                  <div className="space-y-4 py-2">
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-800">
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
                      <div className="text-sm leading-relaxed">
                        <p className="font-semibold text-emerald-900">
                          Tautan Telah Dikirim!
                        </p>
                        <p className="mt-1">
                          Kami telah mengirimkan tautan aktivasi ke email terdaftar{" "}
                          <strong className="font-semibold text-emerald-950">
                            {requestSuccess.email}
                          </strong>
                          .
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 leading-relaxed">
                      Silakan buka Gmail Anda, lalu periksa kotak masuk atau folder{" "}
                      <strong>Spam</strong>. Klik tautan di dalam email tersebut untuk
                      membuat password.
                    </p>

                    {/* Jika running mode simulasi lokal */}
                    {requestSuccess.devActivationUrl && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-2">
                        <p className="font-semibold flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" /> Mode Simulasi Lokal
                        </p>
                        <p>
                          Karena SMTP berjalan dalam mode simulasi, Anda dapat langsung
                          membuka tautan berikut:
                        </p>
                        <a
                          href={requestSuccess.devActivationUrl}
                          className="inline-flex items-center gap-1 text-blue-600 font-semibold underline break-all"
                        >
                          Buka Tautan Aktivasi Sekarang
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </div>
                    )}

                    <div className="pt-2 flex flex-col gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setRequestSuccess(null);
                          setNimInput("");
                        }}
                        className="w-full text-xs"
                      >
                        Kirim Ulang ke NIM Lain
                      </Button>
                      <Link
                        to="/login"
                        className="text-center text-xs text-gray-500 hover:text-gray-800 transition-colors"
                      >
                        Kembali ke Halaman Login
                      </Link>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleRequestActivation} className="space-y-5">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-gray-900">
                        Kirim Tautan Aktivasi ke Gmail
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Data mahasiswa yang diimpor oleh dosen melalui jadwal belum
                        memiliki password. Masukkan NIM Anda untuk mengaktifkan akun.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="nim-req" className="text-gray-700 text-sm">
                        Nomor Induk Mahasiswa (NIM)
                      </Label>
                      <Input
                        id="nim-req"
                        type="text"
                        placeholder="Contoh: 202401001"
                        value={nimInput}
                        onChange={(e) => setNimInput(e.target.value)}
                        required
                        className="focus-visible:ring-blue-500"
                      />
                    </div>

                    {requestError && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3"
                      >
                        {requestError}
                      </motion.div>
                    )}

                    <Button
                      type="submit"
                      disabled={requestLoading}
                      className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                    >
                      {requestLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                          Memproses...
                        </span>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          Kirim Tautan ke Gmail
                        </>
                      )}
                    </Button>

                    <div className="text-center pt-2">
                      <Link
                        to="/login"
                        className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                      >
                        Sudah punya password? <strong>Masuk di sini</strong>
                      </Link>
                    </div>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} SAMA Kampus — Sistem Absensi & Akademik
        </p>
      </motion.div>
    </div>
  );
}

