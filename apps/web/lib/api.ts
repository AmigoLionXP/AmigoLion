import { IntegrationProvider, StepKey } from './business-scan-schema';

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

async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }, // no Content-Type — browser sets the multipart boundary
    body: formData,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(res.status, body || res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function downloadBusinessScanFile(fileId: string, fileName: string) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/me/business-scan/files/${fileId}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) throw new ApiError(res.status, res.statusText);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
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
  toggleChecklistItem: (stepN: number, itemIndex: number) =>
    apiFetch<{ step: MethodStepDto; unlockedStepN: number | null; growthScore: number }>(
      `/me/company/steps/${stepN}/checklist/${itemIndex}`,
      { method: 'PATCH' },
    ),
  getHealth: () => apiFetch<HealthResponseDto>('/me/company/health'),
  runAgent: (message: string, lang: 'pt' | 'en', context: Record<string, unknown> = {}) =>
    apiFetch<AgentRunDto>('/agent-runs', {
      method: 'POST',
      body: JSON.stringify({ message, lang, context }),
    }),

  // 7MARKET Business Scan™
  getBusinessScan: () => apiFetch<BusinessScanDto>('/me/business-scan'),
  saveScanSection: (stepKey: StepKey, data: Record<string, unknown>, skippedFields: string[]) =>
    apiFetch<ScanSectionDto>(`/me/business-scan/sections/${stepKey}`, {
      method: 'PATCH',
      body: JSON.stringify({ data, skippedFields }),
    }),
  completeScanSection: (stepKey: StepKey) =>
    apiFetch<ScanSectionDto>(`/me/business-scan/sections/${stepKey}/complete`, { method: 'POST' }),
  completeBusinessScan: () => apiFetch<BusinessScanDto & { growthScore: number }>('/me/business-scan/complete', { method: 'POST' }),
  connectScanIntegration: (provider: IntegrationProvider) =>
    apiFetch<ScanIntegrationDto>(`/me/business-scan/integrations/${provider}/connect`, { method: 'POST' }),
  uploadScanFile: (stepKey: StepKey, fieldKey: string, file: File) => {
    const form = new FormData();
    form.append('fieldKey', fieldKey);
    form.append('file', file);
    return apiUpload<ScanFileDto>(`/me/business-scan/sections/${stepKey}/files`, form);
  },
  deleteScanFile: (fileId: string) => apiFetch<{ deleted: boolean }>(`/me/business-scan/files/${fileId}`, { method: 'DELETE' }),
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
  startedAt?: string | null;
  completedAt?: string | null;
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

export interface HealthReportDto {
  score: number;
  band: 'critico' | 'fraco' | 'regular' | 'bom' | 'excelente';
  bandLabel: { pt: string; en: string };
  factors: {
    saudeFinanceira: number;
    previsibilidadeReceita: number;
    riscoOperacional: number;
    capacidadeCrescimento: number;
    governanca: number;
    execucaoMetodo: number;
    engajamentoTarefas: number;
  };
  trend: { deltaPct: number; direction: 'up' | 'down' | 'flat' };
  history: { score: number; createdAt: string }[];
}

export type HealthResponseDto = { gated: true; reason: string } | ({ gated: false } & HealthReportDto);

export interface AgentRunDto {
  id: string;
  output: { reply: string } | null;
  riskLevel: 'low' | 'high';
  status: string;
  note: string | null;
}

export type ScanStatus = 'not_started' | 'in_progress' | 'completed';

export interface ScanSectionDto {
  stepKey: StepKey;
  status: ScanStatus;
  data: Record<string, unknown>;
  skippedFields: string[];
  updatedAt: string;
}

export interface ScanFileDto {
  id: string;
  stepKey: StepKey;
  fieldKey: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface ScanIntegrationDto {
  provider: IntegrationProvider;
  status: 'not_connected' | 'pending' | 'connected';
  connectedAt: string | null;
}

export interface BusinessScanDto {
  id: string;
  status: ScanStatus;
  currentStep: StepKey;
  startedAt: string | null;
  completedAt: string | null;
  progressPct: number;
  sections: ScanSectionDto[];
  files: ScanFileDto[];
  integrations: ScanIntegrationDto[];
}
