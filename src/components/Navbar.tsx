import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, BookOpen, ClipboardList, Smartphone } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-black shadow-md shadow-indigo-200 text-base tracking-wider">
              S
            </div>
            <div>
              <span className="font-bold text-slate-900 text-lg tracking-tight block leading-tight">
                SAMA
              </span>
              <span className="text-[10px] font-medium text-slate-400 block -mt-0.5">
                Presensi & Kelas
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
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
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
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
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-indigo-600 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-200 bg-slate-50 hover:bg-indigo-50/50 transition-all font-medium"
          >
            <Smartphone className="w-3.5 h-3.5 text-slate-500" />
            Portal Presensi Mhs ↗
          </Link>

          {dosen && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                {dosen.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden lg:block text-left">
                <span className="block text-xs font-semibold text-slate-800 leading-tight">
                  {dosen.username}
                </span>
                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-slate-200 text-slate-500">
                  {dosen.role}
                </Badge>
              </div>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-xs text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
