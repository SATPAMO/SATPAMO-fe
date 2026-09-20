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
