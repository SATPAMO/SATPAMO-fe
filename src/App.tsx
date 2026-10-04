import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { AttendanceDashboard } from "./pages/AttendanceDashboard";
import { KelasList } from "./pages/KelasList";
import { KelasDetail } from "./pages/KelasDetail";
import { KelasAttendance } from "./pages/KelasAttendance";
import { StudentCheckIn } from "./pages/StudentCheckIn";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
