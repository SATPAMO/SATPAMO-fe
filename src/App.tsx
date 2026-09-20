import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { AttendanceDashboard } from "./pages/AttendanceDashboard";
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
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AttendanceDashboard />
              </ProtectedRoute>
            }
          />
          {/* Catch-all: redirect unknown routes to dashboard (ProtectedRoute will handle auth) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
