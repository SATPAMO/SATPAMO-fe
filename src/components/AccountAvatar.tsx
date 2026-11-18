import { useAuth } from "../context/AuthContext";
import { getInitials } from "../lib/formatters";

/** Solid sky avatar — same color on every page (header + sidebar). */
export const ACCOUNT_AVATAR_CLASS =
  "rounded-full bg-sky-600 border border-sky-300 flex items-center justify-center text-white font-black shadow-sm shrink-0";

export function AccountAvatar({
  size = "md",
  name,
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  /** Override name for initials; defaults to logged-in dosen. */
  name?: string | null;
  className?: string;
}) {
  const { dosen } = useAuth();
  const initials = getInitials(name ?? dosen?.username);
  const sizeClass =
    size === "sm"
      ? "w-7 h-7 text-[10px]"
      : size === "lg"
        ? "w-10 h-10 text-sm"
        : "w-9 h-9 text-xs";

  return (
    <div className={`${ACCOUNT_AVATAR_CLASS} ${sizeClass} ${className}`.trim()}>
      {initials}
    </div>
  );
}
