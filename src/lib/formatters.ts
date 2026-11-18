/** Initials for circular account avatar (matches Live Monitoring). */
export function getInitials(name?: string | null): string {
  if (!name?.trim()) return "YK";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Location pill text: "Ruang X: Nama Kelas (Kelas KODE)" */
export function formatLocationLabel(
  room?: string | null,
  className?: string | null,
  classCode?: string | null
): string | null {
  if (!className && !room) return null;
  const roomPart = room?.trim() || "Ruang";
  const namePart = className?.trim() || "Kelas";
  const code = classCode?.trim();
  if (!code) return `${roomPart}: ${namePart}`;
  const codePart = code.startsWith("Kelas") ? code : `Kelas ${code}`;
  return `${roomPart}: ${namePart} (${codePart})`;
}
