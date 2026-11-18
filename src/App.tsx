import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

const Login = lazy(() => import("./pages/Login").then((m) => ({ default: m.Login })));
const Register = lazy(() => import("./pages/Register").then((m) => ({ default: m.Register })));
const AktivasiAkun = lazy(() => import("./pages/AktivasiAkun").then((m) => ({ default: m.AktivasiAkun })));
const AttendanceDashboard = lazy(() =>
  import("./pages/AttendanceDashboard").then((m) => ({ default: m.AttendanceDashboard }))
);
const KelasList = lazy(() => import("./pages/KelasList").then((m) => ({ default: m.KelasList })));
const KelasDetail = lazy(() => import("./pages/KelasDetail").then((m) => ({ default: m.KelasDetail })));
const KelasAttendance = lazy(() =>
  import("./pages/KelasAttendance").then((m) => ({ default: m.KelasAttendance }))
);
const StudentCheckIn = lazy(() =>
  import("./pages/StudentCheckIn").then((m) => ({ default: m.StudentCheckIn }))
);
const JadwalSesi = lazy(() => import("./pages/JadwalSesi").then((m) => ({ default: m.JadwalSesi })));
const ManajemenJadwal = lazy(() =>
  import("./pages/ManajemenJadwal").then((m) => ({ default: m.ManajemenJadwal }))
);
const StatistikKelas = lazy(() =>
  import("./pages/StatistikKelas").then((m) => ({ default: m.StatistikKelas }))
);
const PengaturanKuota = lazy(() =>
  import("./pages/PengaturanKuota").then((m) => ({ default: m.PengaturanKuota }))
);

function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center satpamo-page-bg">
      <div className="w-10 h-10 rounded-full border-3 border-sky-500 border-t-transparent animate-spin" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/aktivasi" element={<AktivasiAkun />} />
            <Route path="/activate" element={<AktivasiAkun />} />
            <Route path="/check-in" element={<StudentCheckIn />} />
            <Route path="/absen" element={<StudentCheckIn />} />
            
            {/* Protected Dosen Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AttendanceDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jadwal-sesi"
              element={
                <ProtectedRoute>
                  <JadwalSesi />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jadwal"
              element={
                <ProtectedRoute>
                  <JadwalSesi />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manajemen-jadwal"
              element={
                <ProtectedRoute>
                  <ManajemenJadwal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manajemen"
              element={
                <ProtectedRoute>
                  <ManajemenJadwal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/statistik-kelas"
              element={
                <ProtectedRoute>
                  <StatistikKelas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/statistik"
              element={
                <ProtectedRoute>
                  <StatistikKelas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pengaturan-kuota"
              element={
                <ProtectedRoute>
                  <PengaturanKuota />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pengaturan"
              element={
                <ProtectedRoute>
                  <PengaturanKuota />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kelas"
              element={
                <ProtectedRoute>
                  <KelasList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kelas/:id"
              element={
                <ProtectedRoute>
                  <KelasDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kelas/:id/absen"
              element={
                <ProtectedRoute>
                  <KelasAttendance />
                </ProtectedRoute>
              }
            />

            {/* Catch-all: redirect unknown routes to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
