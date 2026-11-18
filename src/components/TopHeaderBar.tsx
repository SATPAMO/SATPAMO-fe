import type { ReactNode } from "react";
import { DoorOpen, RefreshCw } from "lucide-react";
import { AccountAvatar } from "./AccountAvatar";

export interface TopHeaderBarProps {
  /** Location pill label. Hidden when null/undefined/empty. */
  locationLabel?: string | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  refreshTitle?: string;
  /** Optional left-side control (e.g. mobile menu) before the location pill. */
  leadingSlot?: ReactNode;
  className?: string;
}

/**
 * Shared admin top bar — identical layout on every page:
 * [location] ........................ [refresh] [avatar]
 */
export function TopHeaderBar({
  locationLabel,
  onRefresh,
  isRefreshing = false,
  refreshTitle = "Sinkronisasi Data Sekarang",
  leadingSlot,
  className = "",
}: TopHeaderBarProps) {
  const showLocation = Boolean(locationLabel?.trim());

  return (
    <div
      className={`flex items-center justify-between gap-3 w-full min-h-9 ${className}`.trim()}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {leadingSlot}
        <div className="lg:hidden flex items-center gap-2 mr-1 shrink-0">
          <div className="w-8 h-8 rounded-xl glass-panel p-0.5 border border-white/80 shadow-xs flex items-center justify-center">
            <img src="/logo-transparent.png" alt="SATPAMO Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-black text-sky-600 text-sm tracking-tight hidden sm:inline">SATPAMO</span>
        </div>
        {showLocation ? (
          <div className="inline-flex items-center gap-2.5 glass-pill rounded-2xl px-3.5 py-2 shadow-sm max-w-full min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            <span className="text-xs font-bold text-slate-900 truncate">{locationLabel}</span>
            <DoorOpen className="w-3.5 h-3.5 text-slate-800 ml-1 shrink-0" />
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl glass-pill hover:bg-white/45 text-slate-800 shadow-sm transition-all disabled:opacity-60"
            title={refreshTitle}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-sky-800" : ""}`} />
          </button>
        ) : null}
        <AccountAvatar />
      </div>
    </div>
  );
}
