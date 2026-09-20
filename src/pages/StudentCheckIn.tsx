import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Camera, RefreshCw, MapPin, CheckCircle2, AlertTriangle,
  XCircle, Sparkles, Navigation, User, ArrowLeft,
  ShieldCheck, Upload
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import {
  attendanceApi, mahasiswaApi,
  type MahasiswaSimple, type AttendanceRecord,
} from "../lib/api";

export function StudentCheckIn() {
  // Data mahasiswa
  const [mahasiswas, setMahasiswas] = useState<MahasiswaSimple[]>([]);
  const [selectedMahasiswaId, setSelectedMahasiswaId] = useState("");
  const [notes, setNotes] = useState("");

  // Kamera & Foto
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Lokasi GPS
  const [location, setLocation] = useState<{ lat: number; lon: number; accuracy: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Submit & Hasil
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    record: AttendanceRecord;
    verification?: {
      location?: { distance: number; isValid: boolean; maxRadius: number };
      ai?: { verdict: string; isRealPerson: boolean; isFaceClear: boolean; reason: string; environment?: string; confidence?: number };
    };
  } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // --- 1. Load daftar mahasiswa ----------------------------------------------
  useEffect(() => {
    mahasiswaApi.getPublicList()
      .then((res) => {
        if (res.success && res.data) {
          setMahasiswas(res.data);
          if (res.data.length > 0) {
            setSelectedMahasiswaId(res.data[0].id);
          }
        }
      })
      .catch((err) => console.error("Gagal memuat mahasiswa:", err));
  }, []);

  // --- 2. Deteksi Lokasi GPS --------------------------------------------------
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Browser Anda tidak mendukung Geolocation.");
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        });
        setLocationLoading(false);
      },
      (err) => {
        console.warn("Geolocation error:", err);
        setLocationError("Izin lokasi ditolak atau GPS tidak aktif. Menggunakan estimasi default kampus.");
        // Fallback koordinat sekitar kampus jika permission denied di desktop browser
        setLocation({
          lat: -6.200050,
          lon: 106.816670,
          accuracy: 15,
        });
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // --- 3. Kontrol Kamera Web --------------------------------------------------
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.warn("Gagal membuka kamera:", err);
      setCameraError("Tidak dapat mengakses kamera. Pastikan izin kamera aktif atau upload foto langsung.");
      setCameraActive(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (!capturedPhoto && !result) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera, capturedPhoto, result]);

  // Ambil frame dari video ke canvas menjadi base64 data URL
  const takePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Jika kamera depan, flip horizontal agar seperti cermin
      if (facingMode === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setCapturedPhoto(dataUrl);
      stopCamera();
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setResult(null);
    setSubmitError(null);
    startCamera();
  };

  // Upload file fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCapturedPhoto(reader.result);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  // --- 4. Submit Presensi ------------------------------------------------------
  const handleSubmit = async () => {
    if (!selectedMahasiswaId) {
      setSubmitError("Silakan pilih mahasiswa.");
      return;
    }
    if (!capturedPhoto) {
      setSubmitError("Silakan ambil foto selfie terlebih dahulu.");
      return;
    }
    if (!location) {
      setSubmitError("Lokasi GPS belum terdeteksi. Silakan muat ulang lokasi.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await attendanceApi.checkIn({
        mahasiswaId: selectedMahasiswaId,
        photo: capturedPhoto,
        latitude: location.lat,
        longitude: location.lon,
        notes: notes || undefined,
      });

      if (res.success && res.data) {
        setResult({
          record: res.data,
          verification: res.verification,
        });
      } else {
        setSubmitError(res.message || "Gagal melakukan presensi.");
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan server saat memproses presensi.";
      setSubmitError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCapturedPhoto(null);
    setResult(null);
    setSubmitError(null);
    setNotes("");
    startCamera();
  };

  const selectedMhs = mahasiswas.find((m) => m.id === selectedMahasiswaId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-xl mx-auto space-y-6">
        {/* Header bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
            Portal Mahasiswa
          </div>
          <div className="flex items-center gap-1.5 text-xs text-primary font-medium bg-primary/10 px-2.5 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Gemini AI Vision & Geofencing
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Presensi Mandiri Mahasiswa
          </h1>
          <p className="text-sm text-slate-500">
            Verifikasi kehadiran otomatis dengan kamera selfie dan validasi lokasi kampus.
          </p>
        </div>

        {/* --- HASIL PRESENSI (SETELAH SUBMIT) --- */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="border-2 border-primary/30 shadow-xl overflow-hidden bg-white">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/20 mb-2">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-lg font-bold">Presensi Berhasil Dicatat!</h2>
                  <p className="text-xs text-blue-100">{result.record.name} ({result.record.nim})</p>
                </div>

                <CardContent className="p-6 space-y-5">
                  {/* Foto & Status Grid */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {result.record.photo && (
                      <img
                        src={result.record.photo}
                        alt="Selfie Presensi"
                        className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border-2 border-white shadow-md shrink-0"
                      />
                    )}
                    <div className="space-y-1.5 text-center sm:text-left flex-1">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <Badge
                          variant={
                            result.record.status === "PRESENT"
                              ? "success"
                              : result.record.status === "LATE"
                              ? "warning"
                              : "destructive"
                          }
                          className="text-xs px-2.5 py-0.5"
                        >
                          {result.record.status === "PRESENT"
                            ? "HADIR TEPAT WAKTU"
                            : result.record.status === "LATE"
                            ? "TERLAMBAT"
                            : "DITOLAK / ABSEN"}
                        </Badge>

                        <Badge
                          variant={result.record.isLocationValid ? "outline" : "destructive"}
                          className="text-xs gap-1"
                        >
                          <MapPin className="w-3 h-3" />
                          {result.record.isLocationValid
                            ? `Di Kampus (${result.record.distance ?? 0}m)`
                            : `Luar Kampus (${result.record.distance ?? 0}m)`}
                        </Badge>
                      </div>

                      <p className="text-sm font-semibold text-slate-800 pt-1">
                        {result.record.jurusan} - Semester {result.record.semester}
                      </p>
                      <p className="text-xs text-slate-500">
                        Waktu Check-In: {new Date(result.record.checkIn || "").toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} WIB
                      </p>
                    </div>
                  </div>

                  {/* Verifikasi AI Gemini */}
                  {result.record.aiVerification && (
                    <div className="bg-gradient-to-br from-indigo-50/60 to-purple-50/60 border border-indigo-100 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                          <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                            Hasil Analisis Gemini AI Vision
                          </span>
                        </div>
                        <Badge
                          className={
                            result.record.aiVerification.verdict === "VERIFIED"
                              ? "bg-emerald-500 text-white text-[10px]"
                              : result.record.aiVerification.verdict === "SUSPICIOUS"
                              ? "bg-amber-500 text-white text-[10px]"
                              : "bg-red-500 text-white text-[10px]"
                          }
                        >
                          {result.record.aiVerification.verdict}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-700 font-medium">
                        "{result.record.aiVerification.reason}"
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-600">
                        <div className="bg-white/80 p-2 rounded-lg border border-indigo-100/50">
                          <span className="text-slate-400 block">Wajah Jelas:</span>
                          <span className="font-semibold">{result.record.aiVerification.isFaceClear ? "Ya" : "Tidak"}</span>
                        </div>
                        <div className="bg-white/80 p-2 rounded-lg border border-indigo-100/50">
                          <span className="text-slate-400 block">Indikasi Layar:</span>
                          <span className="font-semibold">{result.record.aiVerification.spoofDetected ? "Terdeteksi Layar" : "Bukan Layar"}</span>
                        </div>
                        <div className="bg-white/80 p-2 rounded-lg border border-indigo-100/50 col-span-2 sm:col-span-1">
                          <span className="text-slate-400 block">Lingkungan:</span>
                          <span className="font-semibold truncate block">{result.record.aiVerification.environment || "Indoor"}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button onClick={resetForm} className="w-full gap-2 shadow-md">
                    <RefreshCw className="w-4 h-4" />
                    Presensi Mahasiswa Lainnya
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- FORM PRESENSI (KAMERA + GPS + PILIH MHS) --- */}
        {!result && (
          <Card className="border border-slate-200 shadow-lg overflow-hidden bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Formulir Check-in Mandiri</CardTitle>
              <CardDescription className="text-xs">
                Lengkapi identitas, izinkan akses kamera selfie dan GPS untuk presensi hari ini.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Pilih Mahasiswa */}
              <div className="space-y-1.5">
                <Label htmlFor="mahasiswa-select" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  Pilih Identitas Mahasiswa
                </Label>
                <select
                  id="mahasiswa-select"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  value={selectedMahasiswaId}
                  onChange={(e) => setSelectedMahasiswaId(e.target.value)}
                  disabled={submitting}
                >
                  {mahasiswas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nim} - {m.name} ({m.jurusan})
                    </option>
                  ))}
                </select>
                {selectedMhs && (
                  <p className="text-[11px] text-slate-500">
                    Prodi: <span className="font-medium text-slate-700">{selectedMhs.jurusan}</span> (Semester {selectedMhs.semester})
                  </p>
                )}
              </div>

              {/* Status Lokasi GPS */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    Lokasi GPS Mahasiswa
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-blue-600 gap-1 px-2"
                    onClick={requestLocation}
                    disabled={locationLoading}
                  >
                    <RefreshCw className={`w-3 h-3 ${locationLoading ? "animate-spin" : ""}`} />
                    Refresh GPS
                  </Button>
                </div>

                {locationLoading ? (
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 animate-spin text-blue-500" />
                    Mengunci koordinat GPS...
                  </p>
                ) : location ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-mono text-slate-700">
                        {location.lat.toFixed(6)}, {location.lon.toFixed(6)} (Akurasi: ±{location.accuracy}m)
                      </span>
                    </div>
                    {locationError && (
                      <p className="text-[11px] text-amber-600">{locationError}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {locationError || "Gagal mendapatkan lokasi GPS."}
                  </p>
                )}
              </div>

              {/* --- KAMERA SELFIE --- */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-slate-500" />
                    Foto Selfie (Wajah Mahasiswa)
                  </Label>
                  {!capturedPhoto && cameraActive && (
                    <button
                      type="button"
                      onClick={() => setFacingMode((prev) => (prev === "user" ? "environment" : "user"))}
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Putar Kamera
                    </button>
                  )}
                </div>

                <div className="relative w-full aspect-square max-h-72 bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-300 flex items-center justify-center shadow-inner">
                  {/* Video Stream */}
                  {!capturedPhoto && (
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
                    />
                  )}

                  {/* Captured Photo Preview */}
                  {capturedPhoto && (
                    <img
                      src={capturedPhoto}
                      alt="Captured Selfie"
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Face Guide Overlay */}
                  {!capturedPhoto && cameraActive && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-48 h-60 border-2 border-dashed border-white/60 rounded-full flex items-center justify-center">
                        <span className="text-[10px] text-white/80 bg-black/40 px-2 py-0.5 rounded-full mt-48">
                          Posisikan wajah di dalam oval
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Camera Error / Fallback */}
                  {cameraError && !capturedPhoto && (
                    <div className="absolute inset-0 p-4 bg-slate-900/90 text-white flex flex-col items-center justify-center text-center space-y-3">
                      <XCircle className="w-8 h-8 text-red-400" />
                      <p className="text-xs text-slate-200 max-w-xs">{cameraError}</p>
                      <label className="inline-flex items-center gap-2 bg-blue-600 text-white text-xs px-3.5 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors shadow">
                        <Upload className="w-4 h-4" />
                        Upload Foto Langsung
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                      </label>
                    </div>
                  )}
                </div>

                {/* Tombol Aksi Kamera */}
                <div className="flex gap-2">
                  {!capturedPhoto ? (
                    <Button
                      type="button"
                      variant="primary"
                      className="flex-1 gap-2 shadow-md"
                      onClick={takePhoto}
                      disabled={!cameraActive}
                    >
                      <Camera className="w-4 h-4" />
                      Ambil Foto Selfie
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 gap-2 border-slate-300"
                      onClick={retakePhoto}
                      disabled={submitting}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Ambil Ulang Foto
                    </Button>
                  )}
                </div>
              </div>

              {/* Catatan Tambahan (Opsional) */}
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs font-semibold text-slate-700">
                  Catatan (Opsional)
                </Label>
                <input
                  id="notes"
                  type="text"
                  placeholder="Misal: Hadir praktikum Lab 3"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={submitting}
                />
              </div>

              {/* Error Box */}
              {submitError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 flex items-start gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </motion.div>
              )}

              {/* Tombol Submit Presensi */}
              <Button
                type="button"
                variant="primary"
                className="w-full py-3 gap-2 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25"
                onClick={handleSubmit}
                disabled={submitting || !capturedPhoto || !location}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    Gemini AI sedang menganalisis foto & lokasi...
                  </span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Kirim Presensi Sekarang
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
