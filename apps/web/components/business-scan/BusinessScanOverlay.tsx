'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '@/lib/app-context';
import { api, ApiError, BusinessScanDto, ScanFileDto } from '@/lib/api';
import { BUSINESS_SCAN_STEPS, INTEGRATION_LABELS, IntegrationProvider, StepKey } from '@/lib/business-scan-schema';
import { ScanField } from './ScanField';
import { ScanUpload } from './ScanUpload';
import { ScanIntro } from './ScanIntro';
import { ScanComplete } from './ScanComplete';

type Screen = 'loading' | 'error' | 'intro' | 'wizard' | 'complete';
type DataByStep = Record<StepKey, Record<string, unknown>>;
type SkippedByStep = Record<StepKey, string[]>;

function emptyByStep<T>(fill: () => T): Record<StepKey, T> {
  const out = {} as Record<StepKey, T>;
  for (const s of BUSINESS_SCAN_STEPS) out[s.key] = fill();
  return out;
}

function computeLocalProgress(data: DataByStep, skipped: SkippedByStep, files: ScanFileDto[]): number {
  let total = 0;
  let answered = 0;
  const filesByStep = new Map<string, Set<string>>();
  for (const f of files) {
    if (!filesByStep.has(f.stepKey)) filesByStep.set(f.stepKey, new Set());
    filesByStep.get(f.stepKey)!.add(f.fieldKey);
  }
  for (const step of BUSINESS_SCAN_STEPS) {
    const d = data[step.key] ?? {};
    const sk = new Set(skipped[step.key] ?? []);
    const uploaded = filesByStep.get(step.key) ?? new Set<string>();
    total += step.fields.length + step.uploads.length;
    for (const f of step.fields) {
      if (sk.has(f.key) || (d[f.key] !== undefined && d[f.key] !== null && d[f.key] !== '')) answered += 1;
    }
    for (const u of step.uploads) {
      if (sk.has(u.key) || uploaded.has(u.key)) answered += 1;
    }
  }
  return total > 0 ? Math.round((answered / total) * 100) : 0;
}

export function BusinessScanOverlay() {
  const { lang, setBusinessScanOpen, refreshAfterBusinessScan } = useApp();
  const [screen, setScreen] = useState<Screen>('loading');
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<DataByStep>(() => emptyByStep(() => ({})));
  const [skipped, setSkipped] = useState<SkippedByStep>(() => emptyByStep(() => []));
  const [files, setFiles] = useState<ScanFileDto[]>([]);
  const [integrations, setIntegrations] = useState<BusinessScanDto['integrations']>([]);
  const [finalScore, setFinalScore] = useState<number | undefined>(undefined);
  const [completing, setCompleting] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step = BUSINESS_SCAN_STEPS[stepIndex];
  const stepFiles = useMemo(() => files.filter((f) => f.stepKey === step.key), [files, step.key]);
  const progressPct = useMemo(() => computeLocalProgress(data, skipped, files), [data, skipped, files]);

  useEffect(() => {
    let cancelled = false;
    api
      .getBusinessScan()
      .then((scan) => {
        if (cancelled) return;
        const nextData = emptyByStep(() => ({}));
        const nextSkipped = emptyByStep(() => [] as string[]);
        for (const s of scan.sections) {
          nextData[s.stepKey] = s.data ?? {};
          nextSkipped[s.stepKey] = s.skippedFields ?? [];
        }
        setData(nextData);
        setSkipped(nextSkipped);
        setFiles(scan.files);
        setIntegrations(scan.integrations);
        const idx = BUSINESS_SCAN_STEPS.findIndex((s) => s.key === scan.currentStep);
        setStepIndex(idx >= 0 ? idx : 0);
        if (scan.status === 'completed') setScreen('complete');
        else if (scan.status === 'in_progress') setScreen('wizard');
        else setScreen('intro');
      })
      .catch(() => {
        if (!cancelled) setScreen('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const scheduleSave = useCallback((stepKey: StepKey, stepData: Record<string, unknown>, stepSkipped: string[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      api.saveScanSection(stepKey, stepData, stepSkipped).catch(() => {});
    }, 700);
  }, []);

  function updateField(fieldKey: string, value: unknown) {
    setData((prev) => {
      const next = { ...prev, [step.key]: { ...prev[step.key], [fieldKey]: value } };
      scheduleSave(step.key, next[step.key], skipped[step.key]);
      return next;
    });
  }

  function toggleSkip(fieldKey: string) {
    setSkipped((prev) => {
      const cur = prev[step.key];
      const next = cur.includes(fieldKey) ? cur.filter((k) => k !== fieldKey) : [...cur, fieldKey];
      const nextAll = { ...prev, [step.key]: next };
      api.saveScanSection(step.key, data[step.key], next).catch(() => {});
      return nextAll;
    });
  }

  async function handleUpload(fieldKey: string, file: File) {
    try {
      const rec = await api.uploadScanFile(step.key, fieldKey, file);
      setFiles((prev) => [rec, ...prev]);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? lang === 'pt'
            ? 'Não foi possível enviar o arquivo.'
            : 'Could not upload the file.'
          : '';
      if (msg) alert(msg);
    }
  }

  async function handleDeleteFile(fileId: string) {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    api.deleteScanFile(fileId).catch(() => {});
  }

  async function handleConnect(provider: IntegrationProvider) {
    try {
      const rec = await api.connectScanIntegration(provider);
      setIntegrations((prev) => prev.map((i) => (i.provider === provider ? rec : i)));
    } catch {
      // best-effort — stub integration, safe to ignore a failed connect attempt here
    }
  }

  function flushSave() {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
      return api.saveScanSection(step.key, data[step.key], skipped[step.key]).catch(() => {});
    }
    return Promise.resolve();
  }

  async function goNext() {
    await flushSave();
    api.completeScanSection(step.key).catch(() => {});
    if (stepIndex < BUSINESS_SCAN_STEPS.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      setCompleting(true);
      try {
        const result = await api.completeBusinessScan();
        setFinalScore(result.growthScore);
        setScreen('complete');
        refreshAfterBusinessScan();
      } catch {
        alert(lang === 'pt' ? 'Não foi possível concluir o Business Scan agora.' : 'Could not complete the Business Scan right now.');
      } finally {
        setCompleting(false);
      }
    }
  }

  function goBack() {
    flushSave();
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  }

  async function close() {
    await flushSave();
    setBusinessScanOpen(false);
    // Refresh the hub's progress badge too — it was only accurate at boot until now.
    refreshAfterBusinessScan();
  }

  const isLast = stepIndex === BUSINESS_SCAN_STEPS.length - 1;

  return (
    <div
      className="absolute inset-0 z-[60] flex flex-col"
      style={{ background: 'radial-gradient(120% 70% at 80% -5%,#0d2a5e,#0B2149 52%,#08132C)' }}
    >
      {screen === 'loading' && (
        <div className="flex flex-1 items-center justify-center text-sm text-text-secondary">
          {lang === 'pt' ? 'Carregando…' : 'Loading…'}
        </div>
      )}

      {screen === 'error' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="text-sm text-text-secondary">
            {lang === 'pt'
              ? 'Não foi possível carregar o Business Scan agora. Verifique sua conexão.'
              : 'Could not load the Business Scan right now. Check your connection.'}
          </div>
          <button onClick={close} className="rounded-[10px] border border-white/10 bg-white/[.06] px-4 py-2 text-sm text-text">
            {lang === 'pt' ? 'Fechar' : 'Close'}
          </button>
        </div>
      )}

      {screen === 'intro' && <ScanIntro lang={lang} onStart={() => setScreen('wizard')} onClose={close} />}

      {screen === 'complete' && <ScanComplete lang={lang} growthScore={finalScore} onClose={close} />}

      {screen === 'wizard' && (
        <>
          <div className="flex-shrink-0 border-b border-white/[.07] bg-[rgba(8,19,44,.55)] p-[58px_18px_14px] backdrop-blur-[14px]">
            <div className="flex items-center gap-3">
              <button
                onClick={stepIndex === 0 ? close : goBack}
                className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[11px] border border-white/10 bg-white/[.06]"
                aria-label="back"
              >
                <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
                  <path d="M10 2L2 10l8 8" stroke="#c5d0e2" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[10px] tracking-[.14em] text-gold">
                  7MARKET BUSINESS SCAN™ · {step.n}/8
                </div>
                <div className="mt-0.5 truncate font-display text-lg font-bold text-white">
                  {lang === 'pt' ? step.titlePt : step.titleEn}
                </div>
              </div>
              <button onClick={close} className="flex-shrink-0 font-mono text-[10px] text-text-secondary underline">
                {lang === 'pt' ? 'sair' : 'exit'}
              </button>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[.07]">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg,#C99A2E,#F4D48A)' }}
              />
            </div>
            <div className="mt-1.5 font-mono text-[10.5px] text-text-secondary">
              {progressPct}% {lang === 'pt' ? 'do DNA Digital' : 'of the Digital DNA'}
            </div>
          </div>

          <div className="appscroll min-h-0 flex-1 overflow-y-auto p-[18px_18px_120px]">
            <div className="flex flex-col gap-5">
              {step.fields.map((f) => (
                <ScanField
                  key={f.key}
                  field={f}
                  value={data[step.key]?.[f.key]}
                  skipped={skipped[step.key]?.includes(f.key) ?? false}
                  lang={lang}
                  onChange={(v) => updateField(f.key, v)}
                  onToggleSkip={() => toggleSkip(f.key)}
                />
              ))}

              {step.uploads.length > 0 && (
                <div className="mt-2 flex flex-col gap-3">
                  <div className="font-display text-[14px] font-bold text-white">
                    {lang === 'pt' ? 'Documentos' : 'Documents'}
                  </div>
                  {step.uploads.map((u) => (
                    <ScanUpload
                      key={u.key}
                      upload={u}
                      lang={lang}
                      files={stepFiles.filter((f) => f.fieldKey === u.key)}
                      onUpload={(file) => handleUpload(u.key, file)}
                      onDelete={handleDeleteFile}
                    />
                  ))}
                </div>
              )}

              {step.integrations.length > 0 && (
                <div className="mt-2">
                  <div className="mb-2 font-display text-[14px] font-bold text-white">
                    {lang === 'pt' ? 'Integrações' : 'Integrations'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {step.integrations.map((provider) => {
                      const rec = integrations.find((i) => i.provider === provider);
                      const status = rec?.status ?? 'not_connected';
                      return (
                        <button
                          key={provider}
                          onClick={() => handleConnect(provider)}
                          disabled={status !== 'not_connected'}
                          className="rounded-[10px] border px-3 py-2 text-xs font-semibold disabled:opacity-70"
                          style={{
                            borderColor: status === 'connected' ? 'rgba(94,224,138,.4)' : 'rgba(143,180,255,.28)',
                            background: status === 'connected' ? 'rgba(94,224,138,.1)' : 'rgba(143,180,255,.08)',
                            color: status === 'connected' ? '#5ee08a' : '#8FB4FF',
                          }}
                        >
                          {INTEGRATION_LABELS[provider][lang]}
                          {' · '}
                          {status === 'connected'
                            ? lang === 'pt'
                              ? 'conectado'
                              : 'connected'
                            : status === 'pending'
                              ? lang === 'pt'
                                ? 'em breve'
                                : 'coming soon'
                              : lang === 'pt'
                                ? 'Conectar Sistema'
                                : 'Connect System'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-white/[.07] bg-[rgba(8,19,44,.82)] p-[14px_18px_26px] backdrop-blur-[18px]">
            <button
              onClick={goNext}
              disabled={completing}
              className="w-full rounded-[13px] p-[15px] font-display text-[16px] font-bold text-navy disabled:opacity-60"
              style={{ background: 'linear-gradient(140deg,#C99A2E,#F4D48A)' }}
            >
              {completing
                ? lang === 'pt'
                  ? 'Concluindo…'
                  : 'Finishing…'
                : isLast
                  ? lang === 'pt'
                    ? 'Concluir Business Scan'
                    : 'Complete Business Scan'
                  : lang === 'pt'
                    ? 'Próximo'
                    : 'Next'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
