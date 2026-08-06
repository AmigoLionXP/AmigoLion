const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const TOKEN_KEY = '7market_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(res.status, body || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    apiFetch<{ accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getCompany: () => apiFetch<CompanyDto>('/me/company'),
  getSteps: () => apiFetch<StepsResponseDto>('/me/company/steps'),
  getTasks: () => apiFetch<TaskDto[]>('/tasks'),
  toggleTask: (id: string, done: boolean) =>
    apiFetch<TaskDto>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ done }) }),
  runAgent: (message: string, lang: 'pt' | 'en', context: Record<string, unknown> = {}) =>
    apiFetch<AgentRunDto>('/agent-runs', {
      method: 'POST',
      body: JSON.stringify({ message, lang, context }),
    }),
};

export interface CompanyDto {
  id: string;
  nome: string;
  setor: string | null;
  growthScore: number;
  nivel7m: number;
  diagnosticStatus: 'partial' | 'complete' | null;
  gargalo: string | null;
  subscription: { plano: string; valorMensal: string; status: string; startedAt: string } | null;
  manager: { id: string; name: string | null; nivel: number } | null;
}

export interface MethodStepDto {
  n: number;
  code: string;
  verbPt: string;
  verbEn: string;
  specialistRolePt: string;
  specialistRoleEn: string;
  pct: number;
  status: 'done' | 'doing' | 'next' | 'locked';
  specialistName: string | null;
  deadlinePt: string | null;
  deadlineEn: string | null;
  checklist: { txtPt: string; txtEn: string; done: boolean }[];
}

export interface StepsResponseDto {
  gated: boolean;
  reason?: string;
  steps: MethodStepDto[];
}

export interface TaskDto {
  id: string;
  titlePt: string;
  titleEn: string;
  priority: 'high' | 'medium';
  prazoPt: string;
  prazoEn: string;
  tempo: string | null;
  impactoPt: string | null;
  impactoEn: string | null;
  specialist: string | null;
  done: boolean;
}

export interface AgentRunDto {
  id: string;
  output: { reply: string } | null;
  riskLevel: 'low' | 'high';
  status: string;
  note: string | null;
}
