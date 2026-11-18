import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, BookOpen, ClipboardList, Smartphone } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { AccountAvatar } from "./AccountAvatar";

export function Navbar() {
  const { dosen, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const navItems = [
    { label: "Riwayat Presensi", path: "/", icon: ClipboardList },
    { label: "Manajemen Kelas", path: "/kelas", icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/60 bg-white/50 backdrop-blur-xl shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl glass-panel p-1 border border-white/80 shadow-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <img
                src="/logo-transparent.png"
                alt="SATPAMO Logo"
                className="w-full h-full object-contain drop-shadow-sm"
              />
            </div>
            <div>
              <span className="font-black text-sky-600 text-xl tracking-tight block leading-none drop-shadow-xs">
                SATPAMO
              </span>
              <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block mt-1">
                Presensi &amp; Kelas
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-white/85 text-sky-800 shadow-sm border border-white/90"
                      : "text-slate-600 hover:text-slate-950 hover:bg-white/40"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-sky-600" : "text-slate-400"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          <Link
            to="/check-in"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-sky-800 hover:text-sky-950 px-3 py-1.5 rounded-xl border border-white/70 bg-white/50 hover:bg-white/80 transition-all font-semibold shadow-xs backdrop-blur-md"
          >
            <Smartphone className="w-3.5 h-3.5 text-sky-600" />
            Portal Presensi Mhs ↗
          </Link>

          {dosen && (
            <div className="flex items-center gap-2 pl-2 border-l border-white/60">
              <AccountAvatar />
              <div className="hidden lg:block text-left">
                <span className="block text-xs font-bold text-slate-800 leading-tight">
                  {dosen.username}
                </span>
                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-sky-200/60 bg-sky-50/50 text-sky-700 font-semibold">
                  {dosen.role}
                </Badge>
              </div>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-xs text-slate-600 hover:text-red-600 hover:border-red-200/60 hover:bg-red-50/50 rounded-xl gap-1.5 glass-pill"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
