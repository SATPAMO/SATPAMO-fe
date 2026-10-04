/**
 * api.ts - Centralized API client untuk sama-fe
 * Semua request ke backend disalurkan melalui sini.
 * JWT token otomatis disertakan dari localStorage.
 */

const BASE_URL = "/api";

// --- Types ------------------------------------------------------------------

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: { msg: string; path: string }[];
  verification?: {
    location: {
      distance: number;
      isValid: boolean;
      campusLat: number;
      campusLon: number;
      maxRadius: number;
    };
    ai: {
      verdict: "VERIFIED" | "SUSPICIOUS" | "REJECTED" | "PENDING_REVIEW";
      isRealPerson: boolean;
      isFaceClear: boolean;
      spoofDetected: boolean;
      confidence: number;
      environment: string;
      reason: string;
    };
  };
}

export interface DosenUser {
  id: string;
  username: string;
  email: string;
  role: "ADMIN" | "DOSEN";
  createdAt: string;
}

export interface MahasiswaSimple {
  id: string;
  nim: string;
  name: string;
  jurusan: string;
  semester: number;
}

export interface AiVerificationResult {
  verdict: "VERIFIED" | "SUSPICIOUS" | "REJECTED" | "PENDING_REVIEW";
  isRealPerson: boolean;
  isFaceClear: boolean;
  spoofDetected: boolean;
  confidence: number;
  environment: string;
  reason: string;
}

export interface AttendanceRecord {
  id: string;
  mahasiswaId: string;
  nim: string;
  name: string;
  jurusan: string;
  semester: number;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: "PRESENT" | "LATE" | "ABSENT" | "IZIN";
  notes: string | null;
  photo?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distance?: number | null;
  isLocationValid?: boolean;
  aiVerification?: AiVerificationResult | null;
}

export interface AttendanceStats {
  date: string;
  total: number;
  present: number;
  late: number;
  absent: number;
  izin: number;
  notRecorded: number;
}

export interface AiInsight {
  summary: string;
  overallRate: number;
  insights: {
    type: "warning" | "info" | "critical" | "positive";
    title: string;
    description: string;
  }[];
  recommendations: string[];
  riskStudents: {
    count: number;
    threshold: string;
    anonIds: string[];
  };
  generatedAt: string;
}

// --- Core fetch wrapper ------------------------------------------------------

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem("sama_token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data: ApiResponse<T> = await response.json();

  if (response.status === 401) {
    localStorage.removeItem("sama_token");
    localStorage.removeItem("sama_user");
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }

  return data;
}

// --- Auth API ----------------------------------------------------------------

export const authApi = {
  login: (email: string, password: string) =>
    request<{ dosen: DosenUser; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (username: string, email: string, password: string) =>
    request<{ dosen: DosenUser; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    }),

  registerMahasiswa: (data: { nim: string; name: string; email?: string; password: string }) =>
    request<{ mahasiswa: any; token: string }>('/auth/register-mahasiswa', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => request<{ dosen: DosenUser }>("/auth/me"),
};

function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "" && v !== "undefined"
  );
  if (entries.length === 0) return "";
  return "?" + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

// --- Attendance API ----------------------------------------------------------

export const attendanceApi = {
  getAll: (params?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    search?: string;
  }) => {
    return request<AttendanceRecord[]>(`/attendance${buildQueryString(params)}`);
  },

  getStats: (date?: string) => {
    const qs = date && date !== "undefined" ? `?date=${date}` : "";
    return request<AttendanceStats>(`/attendance/stats${qs}`);
  },

  checkIn: (data: {
    mahasiswaId: string;
    photo: string;
    latitude: number;
    longitude: number;
    notes?: string;
  }) =>
    request<AttendanceRecord>("/attendance/check-in", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  create: (data: {
    mahasiswaId: string;
    date: string;
    status: string;
    checkIn?: string;
    checkOut?: string;
    notes?: string;
  }) =>
    request<AttendanceRecord>("/attendance", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<AttendanceRecord>) =>
    request<AttendanceRecord>(`/attendance/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// --- Mahasiswa API -----------------------------------------------------------

export const mahasiswaApi = {
  getPublicList: () =>
    request<MahasiswaSimple[]>("/mahasiswa/public"),

  importCsv: (students: { nim: string; name: string; email?: string; jurusan: string; semester: number }[]) =>
    request<{ inserted: number; updated: number; errors: any[] }>('/mahasiswa/import-csv', {
      method: 'POST',
      body: JSON.stringify({ students }),
    }),

  getAll: (params?: { search?: string; jurusan?: string; semester?: string }) => {
    return request<MahasiswaSimple[]>(`/mahasiswa${buildQueryString(params)}`);
  },
};

// --- AI API ------------------------------------------------------------------

export const aiApi = {
  analyze: (startDate: string, endDate: string, reportType = "weekly") =>
    request<{
      analysis: AiInsight;
      period: { startDate: string; endDate: string };
      totalRecords: number;
    }>("/ai/analyze", {
      method: "POST",
      body: JSON.stringify({ startDate, endDate, reportType }),
    }),

  dailySummary: (date?: string) =>
    request<{ date: string; stats: AttendanceStats; summary: string }>(
      "/ai/summary",
      { method: "POST", body: JSON.stringify({ date }) }
    ),
};


export type HariType = "SENIN" | "SELASA" | "RABU" | "KAMIS" | "JUMAT" | "SABTU" | "MINGGU";

export interface JadwalItem {
  id: string | number;
  kelasId?: string;
  hari: HariType;
  jamMulai: string;
  jamSelesai: string;
  ruangan?: string | null;
  isActive?: boolean;
}

export interface KelasItem {
  id: string;
  dosenId: string;
  kode: string;
  nama: string;
  deskripsi?: string | null;
  semester?: string;
  tahunAjaran?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
  jadwal?: JadwalItem[];
  jadwals?: JadwalItem[];
  dosen?: {
    id: string;
    username: string;
    email: string;
  };
  totalMahasiswa?: number;
  totalPresensi?: number;
  _count?: {
    mahasiswas?: number;
    attendances?: number;
    mahasiswa?: number;
    jadwal?: number;
    presensi?: number;
  };
}

export interface EnrolledMahasiswa {
  id: string;
  nim: string;
  name: string;
  email?: string | null;
  jurusan: string;
  semester: number;
  enrolledAt: string;
  hadirCount?: number;
  latestStatus?: string;
  attendanceStats?: {
    present: number;
    late: number;
    absent: number;
    izin: number;
    sakit: number;
    total: number;
  };
}

export interface LatestAttendanceRecord {
  id?: string | null;
  mahasiswaId: string;
  nim: string;
  name: string;
  jurusan: string;
  semester: number;
  attendanceId: string | null;
  status: string;
  checkIn: string | null;
  photo: string | null;
  notes: string | null;
  isLocationValid?: boolean;
  pertemuanKe?: number;
}

export interface LatestAttendanceData {
  date: string;
  pertemuanKe: number;
  stats: {
    total: number;
    present: number;
    late: number;
    absent: number;
    izin: number;
    sakit: number;
    notRecorded: number;
  };
  records: LatestAttendanceRecord[];
}

export interface KelasDetail extends KelasItem {
  mahasiswa: EnrolledMahasiswa[];
  mahasiswaList?: EnrolledMahasiswa[];
  jadwal: JadwalItem[];
  jadwals: JadwalItem[];
  totalMahasiswa: number;
  totalPresensi: number;
  latestAttendance?: LatestAttendanceData | null;
}

export interface ClassAttendanceStudent {
  id?: string | number;
  mahasiswaId?: string;
  nim: string;
  name: string;
  jurusan?: string;
  semester?: number;
  time?: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status: string;
  photo?: string | null;
  notes?: string | null;
  location?: { lat: number; lng: number };
  latitude?: number | null;
  longitude?: number | null;
  distance?: number | null;
  isLocationValid?: boolean;
  verification?: any;
  pertemuanKe?: number;
}

export interface ClassAttendanceResponse {
  date: string;
  kelas: KelasItem;
  jadwal?: JadwalItem | null;
  pertemuanKe: number;
  stats?: {
    total: number;
    present: number;
    late: number;
    absent: number;
    izin: number;
    sakit: number;
    notRecorded: number;
  };
  students: ClassAttendanceStudent[];
  data?: ClassAttendanceStudent[];
}

export const kelasApi = {
  getAll: async () => request<KelasItem[]>("/kelas"),
  getById: async (id: number | string) => request<KelasDetail>(`/kelas/${id}`),
  create: async (data: any) => request<KelasItem>("/kelas", { method: "POST", body: JSON.stringify(data) }),
  update: async (id: number | string, data: any) => request<KelasItem>(`/kelas/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: async (id: number | string) => request(`/kelas/${id}`, { method: "DELETE" }),
  
  // Jadwal
  addJadwal: async (kelasId: number | string, data: any) => request(`/kelas/${kelasId}/jadwal`, { method: "POST", body: JSON.stringify(data) }),
  deleteJadwal: async (kelasId: number | string, jadwalId: number | string) => request(`/kelas/${kelasId}/jadwal/${jadwalId}`, { method: "DELETE" }),
  
  // Mahasiswa
  addMahasiswa: async (kelasId: number | string, data: { nim: string; name?: string; mahasiswaId?: string }) => 
    request(`/kelas/${kelasId}/mahasiswa`, { method: "POST", body: JSON.stringify(data) }),
  
  addMahasiswaBulk: async (kelasId: number | string, nims: string[]) =>
    request<{ totalAdded: number; added: any[]; alreadyEnrolled: any[]; notFound: string[] }>(`/kelas/${kelasId}/mahasiswa/bulk`, {
      method: "POST",
      body: JSON.stringify({ nims }),
    }),

  removeMahasiswa: async (kelasId: number | string, mahasiswaIdOrNim: string) => 
    request(`/kelas/${kelasId}/mahasiswa/${mahasiswaIdOrNim}`, { method: "DELETE" }),
  
  // Kehadiran (Attendance)
  getClassAttendance: async (kelasId: number | string, params?: { date?: string; pertemuanKe?: number; jadwalId?: number }) => {
    const qs = new URLSearchParams();
    if (params?.date) qs.set("date", params.date);
    if (params?.pertemuanKe) qs.set("pertemuanKe", String(params.pertemuanKe));
    if (params?.jadwalId) qs.set("jadwalId", String(params.jadwalId));
    return request<ClassAttendanceResponse>(`/kelas/${kelasId}/attendance${qs.toString() ? "?" + qs.toString() : ""}`);
  },
  
  importMahasiswaCsv: async (kelasId: number | string, students: { nim: string; name: string; email?: string; jurusan: string; semester: number }[]) =>
    request<{ imported: number; updated: number; enrolled: number; alreadyEnrolled: number; errors: any[] }>(`/kelas/${kelasId}/mahasiswa/import-csv`, {
      method: 'POST',
      body: JSON.stringify({ students }),
    }),

  recordClassAttendance: async (kelasId: number | string, data: {
    date?: string;
    pertemuanKe?: number;
    records?: { mahasiswaId?: string; nim?: string; status: string; notes?: string }[];
    mahasiswaId?: string;
    status?: string;
    notes?: string;
  }) => 
    request(`/kelas/${kelasId}/attendance`, { method: "POST", body: JSON.stringify(data) }),
};



