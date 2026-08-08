'use client';

import { useEffect, useRef, useState } from 'react';
import { Lang } from '@/lib/i18n';
import { api, ApiError, BusinessScanDto, CopilotFieldHelpDto, ScanFileDto } from '@/lib/api';
import { FieldDef, INTEGRATION_LABELS, IntegrationProvider, StepDef } from '@/lib/business-scan-schema';

type Screen = 'menu' | 'field' | 'guided' | 'voice' | 'docs' | 'missing';

interface Props {
  lang: Lang;
  step: StepDef;
  stepFiles: ScanFileDto[];
  integrations: BusinessScanDto['integrations'];
  focusField: FieldDef | null;
  onConsumeFocusField: () => void;
  onApplySuggestions: (patch: Record<string, unknown>) => void;
  onConnectIntegration: (provider: IntegrationProvider) => void;
  onUploadedFile: (file: ScanFileDto) => void;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const cardBase = 'rounded-[14px] border border-white/10 bg-white/[.04] p-3.5';
const actionBtn =
  'flex items-center gap-2 rounded-[11px] border border-white/[.12] bg-white/[.06] px-3.5 py-2.5 text-left text-[13px] font-semibold text-text';
const goldBtn =
  'w-full rounded-[12px] p-3 text-center font-display text-[14px] font-bold text-navy';
const goldBtnStyle = { background: 'linear-gradient(140deg,#C99A2E,#F4D48A)' };

export function CopilotPanel({
  lang,
  step,
  stepFiles,
  integrations,
  focusField,
  onConsumeFocusField,
  onApplySuggestions,
  onConnectIntegration,
  onUploadedFile,
  open,
  onOpenChange,
}: Props) {
  const [screen, setScreen] = useState<Screen>('menu');
  const [introMsg, setIntroMsg] = useState<string | null>(null);
  const [fieldHelp, setFieldHelp] = useState<CopilotFieldHelpDto | null>(null);
  const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null);

  const [guidedQuestion, setGuidedQuestion] = useState<string | null>(null);
  const [guidedSuggestion, setGuidedSuggestion] = useState<string | null>(null);
  const [guidedAnswers, setGuidedAnswers] = useState<boolean[]>([]);
  const [guidedBusy, setGuidedBusy] = useState(false);

  const [docsUploadKey, setDocsUploadKey] = useState<string | null>(null);
  const [docsBusy, setDocsBusy] = useState(false);
  const [docsMessage, setDocsMessage] = useState<string | null>(null);
  const [docsSuggestions, setDocsSuggestions] = useState<Record<string, string | number | boolean> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'processing' | 'unsupported'>('idle');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceSuggestions, setVoiceSuggestions] = useState<Record<string, string | number | boolean> | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const [missing, setMissing] = useState<string[] | null>(null);
  const [missingBusy, setMissingBusy] = useState(false);

  const t = (pt: string, en: string) => (lang === 'pt' ? pt : en);

  useEffect(() => {
    if (!open) return;
    setIntroMsg(null);
    api
      .getCopilotIntro(step.key, lang)
      .then((r) => setIntroMsg(r.message))
      .catch(() => setIntroMsg(null));
  }, [open, step.key, lang]);

  useEffect(() => {
    if (!focusField || !open) return;
    setActiveFieldKey(focusField.key);
    setScreen('field');
    setFieldHelp(null);
    setGuidedQuestion(null);
    setGuidedSuggestion(null);
    setGuidedAnswers([]);
    api
      .getCopilotFieldHelp(step.key, focusField.key, lang)
      .then(setFieldHelp)
      .catch(() => setFieldHelp(null));
  }, [focusField, open, step.key, lang]);

  function backToMenu() {
    setScreen('menu');
    onConsumeFocusField();
  }

  function startGuidedChallenge() {
    setScreen('guided');
    setGuidedAnswers([]);
    setGuidedSuggestion(null);
    setGuidedBusy(true);
    api
      .postGuidedChallenge([], lang)
      .then((r) => {
        if (!r.done) setGuidedQuestion(r.question);
      })
      .finally(() => setGuidedBusy(false));
  }

  function answerGuided(value: boolean) {
    const next = [...guidedAnswers, value];
    setGuidedAnswers(next);
    setGuidedBusy(true);
    api
      .postGuidedChallenge(next, lang)
      .then((r) => {
        if (r.done) {
          setGuidedSuggestion(r.suggestion);
          setGuidedQuestion(null);
        } else {
          setGuidedQuestion(r.question);
        }
      })
      .finally(() => setGuidedBusy(false));
  }

  function applyGuidedSuggestion() {
    if (guidedSuggestion && activeFieldKey) onApplySuggestions({ [activeFieldKey]: guidedSuggestion });
    setScreen('field');
  }

  function openDocs() {
    setScreen('docs');
    setDocsUploadKey(step.uploads[0]?.key ?? null);
    setDocsMessage(null);
    setDocsSuggestions(null);
  }

  async function handleDocFile(file: File | undefined) {
    if (!file || !docsUploadKey) return;
    setDocsBusy(true);
    setDocsMessage(null);
    setDocsSuggestions(null);
    try {
      const result = await api.extractScanFile(step.key, docsUploadKey, file, lang);
      onUploadedFile(result.file);
      if (result.supported) {
        if (Object.keys(result.suggestions).length > 0) {
          setDocsSuggestions(result.suggestions);
        } else {
          setDocsMessage(t('Documento salvo. Não encontramos valores reconhecíveis para preencher automaticamente — os campos continuam disponíveis para preenchimento manual.', 'Document saved. We could not find recognizable values to auto-fill — fields are still available to fill in manually.'));
        }
      } else {
        setDocsMessage(result.message);
      }
    } catch (err) {
      setDocsMessage(err instanceof ApiError ? t('Não foi possível enviar o arquivo.', 'Could not upload the file.') : t('Erro inesperado.', 'Unexpected error.'));
    } finally {
      setDocsBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function applyDocSuggestions() {
    if (docsSuggestions) onApplySuggestions(docsSuggestions);
    setDocsSuggestions(null);
    setDocsMessage(t('Campos preenchidos com os dados do documento.', 'Fields filled in from the document.'));
  }

  function openVoice() {
    setScreen('voice');
    setVoiceTranscript('');
    setVoiceSuggestions(null);
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setVoiceState('unsupported');
      return;
    }
    setVoiceState('idle');
  }

  function startListening() {
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setVoiceState('unsupported');
      return;
    }
    const recognition = new Recognition();
    recognition.lang = lang === 'pt' ? 'pt-BR' : 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event: any) => {
      let text = '';
      for (let i = 0; i < event.results.length; i++) text += event.results[i][0].transcript;
      setVoiceTranscript(text);
    };
    recognition.onerror = () => setVoiceState('idle');
    recognition.onend = () => setVoiceState((s) => (s === 'listening' ? 'idle' : s));
    recognitionRef.current = recognition;
    setVoiceState('listening');
    recognition.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setVoiceState('processing');
    const text = voiceTranscript.trim();
    if (!text) {
      setVoiceState('idle');
      return;
    }
    api
      .postVoiceTranscript(step.key, text, activeFieldKey ?? undefined)
      .then((r) => setVoiceSuggestions(r.suggestions))
      .finally(() => setVoiceState('idle'));
  }

  function applyVoiceSuggestions() {
    if (voiceSuggestions) onApplySuggestions(voiceSuggestions);
    setVoiceSuggestions(null);
    setVoiceTranscript('');
  }

  function openMissing() {
    setScreen('missing');
    setMissingBusy(true);
    api
      .getCopilotMissing(step.key, lang)
      .then((r) => setMissing(r.missing))
      .finally(() => setMissingBusy(false));
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className="fixed bottom-[128px] right-4 z-[75] flex items-center gap-2 rounded-full border border-gold/30 bg-[rgba(20,32,64,.92)] px-4 py-3 text-[12.5px] font-semibold text-gold shadow-[0_8px_24px_rgba(0,0,0,.35)] backdrop-blur-md desktop:bottom-8 desktop:right-8"
      >
        <span className="text-base">🤖</span>
        <span className="hidden desktop:inline">{t('Guia 7M Copilot™.AI', '7M Copilot™.AI Guide')}</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center desktop:items-stretch desktop:justify-end">
      <button
        type="button"
        aria-label="close"
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 bg-black/40"
      />
      <div
        className="relative flex max-h-[78vh] w-full flex-col rounded-t-2xl border-t border-white/10 bg-[#0c1c3e] desktop:h-full desktop:max-h-none desktop:w-[380px] desktop:rounded-none desktop:border-l desktop:border-t-0"
        style={{ boxShadow: '-8px 0 32px rgba(0,0,0,.35)' }}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-white/[.08] p-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <span className="font-display text-[14px] font-bold text-white">{t('Guia 7M Copilot™.AI', '7M Copilot™.AI Guide')}</span>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} className="text-text-secondary" aria-label="close">
            ✕
          </button>
        </div>

        <div className="appscroll min-h-0 flex-1 overflow-y-auto p-4">
          {screen === 'menu' && (
            <div className="flex flex-col gap-3">
              {introMsg && (
                <div className={cardBase}>
                  <div className="text-[13px] leading-[1.55] text-text-tertiary">{introMsg}</div>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <button type="button" className={actionBtn} onClick={openDocs}>
                  📄 {t('Tenho esse documento', 'I have this document')}
                </button>
                <button type="button" className={actionBtn} onClick={openVoice}>
                  🎤 {t('Responder por voz', 'Answer by voice')}
                </button>
                {step.integrations.length > 0 && (
                  <div className={cardBase}>
                    <div className="mb-2 text-[12px] font-semibold text-text-tertiary">
                      🔗 {t('Conectar sistema', 'Connect a system')}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {step.integrations.map((p) => {
                        const rec = integrations.find((i) => i.provider === p);
                        const status = rec?.status ?? 'not_connected';
                        return (
                          <button
                            key={p}
                            type="button"
                            disabled={status !== 'not_connected'}
                            onClick={() => onConnectIntegration(p)}
                            className="rounded-lg border border-ai-blue/25 bg-ai-blue/10 px-2.5 py-1.5 text-[11px] font-semibold text-ai-blue disabled:opacity-60"
                          >
                            {INTEGRATION_LABELS[p][lang]} {status !== 'not_connected' ? `· ${t('em breve', 'soon')}` : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <button type="button" className={actionBtn} onClick={openMissing}>
                  ✅ {t('Ver o que falta nesta etapa', "See what's missing in this step")}
                </button>
              </div>
            </div>
          )}

          {screen === 'field' && (
            <div className="flex flex-col gap-3">
              <button type="button" onClick={backToMenu} className="self-start font-mono text-[10.5px] text-text-secondary underline">
                ← {t('voltar', 'back')}
              </button>
              {fieldHelp ? (
                <>
                  <div className={cardBase}>
                    <div className="mb-1.5 font-display text-[13px] font-bold text-white">{fieldHelp.label}</div>
                    <div className="text-[13px] leading-[1.55] text-text-tertiary">{fieldHelp.help}</div>
                    {fieldHelp.examples.length > 0 && (
                      <div className="mt-3 flex flex-col gap-1.5">
                        <div className="text-[11px] font-semibold text-text-secondary">{t('Exemplos', 'Examples')}</div>
                        {fieldHelp.examples.map((ex) => (
                          <button
                            key={ex}
                            type="button"
                            onClick={() => activeFieldKey && onApplySuggestions({ [activeFieldKey]: ex })}
                            className="rounded-lg border border-white/10 bg-white/[.04] px-2.5 py-1.5 text-left text-[12px] text-text-tertiary"
                          >
                            {ex}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {step.key === 'diagnosticar' && activeFieldKey === 'maiorDesafio' && (
                    <button type="button" className={actionBtn} onClick={startGuidedChallenge}>
                      🤔 {t('Não sei identificar', "I can't tell")}
                    </button>
                  )}
                  <button type="button" className={actionBtn} onClick={openDocs}>
                    📎 {t('Enviar documento', 'Send document')}
                  </button>
                  <button type="button" className={actionBtn} onClick={openVoice}>
                    🎤 {t('Responder por voz', 'Answer by voice')}
                  </button>
                  {step.integrations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {step.integrations.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => onConnectIntegration(p)}
                          className="rounded-lg border border-ai-blue/25 bg-ai-blue/10 px-2.5 py-1.5 text-[11px] font-semibold text-ai-blue"
                        >
                          🔗 {t('Conectar', 'Connect')} {INTEGRATION_LABELS[p][lang]}
                        </button>
                      ))}
                    </div>
                  )}
                  <button type="button" onClick={() => onOpenChange(false)} className={actionBtn}>
                    ✍️ {t('Vou responder manualmente', "I'll answer manually")}
                  </button>
                </>
              ) : (
                <div className="text-[12px] text-text-secondary">{t('Carregando…', 'Loading…')}</div>
              )}
            </div>
          )}

          {screen === 'guided' && (
            <div className="flex flex-col gap-3">
              <button type="button" onClick={() => setScreen('field')} className="self-start font-mono text-[10.5px] text-text-secondary underline">
                ← {t('voltar', 'back')}
              </button>
              {guidedBusy && <div className="text-[12px] text-text-secondary">{t('Pensando…', 'Thinking…')}</div>}
              {!guidedBusy && guidedQuestion && (
                <div className={cardBase}>
                  <div className="mb-3 text-[13px] leading-[1.5] text-text-tertiary">{guidedQuestion}</div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => answerGuided(true)} className="flex-1 rounded-[10px] border border-white/10 bg-white/[.06] py-2 text-sm font-semibold text-text">
                      {t('Sim', 'Yes')}
                    </button>
                    <button type="button" onClick={() => answerGuided(false)} className="flex-1 rounded-[10px] border border-white/10 bg-white/[.06] py-2 text-sm font-semibold text-text">
                      {t('Não', 'No')}
                    </button>
                  </div>
                </div>
              )}
              {!guidedBusy && guidedSuggestion && (
                <div className={cardBase}>
                  <div className="mb-3 text-[13px] leading-[1.5] text-text-tertiary">
                    {t('Pelo que você descreveu, talvez o maior desafio seja:', 'From what you described, the biggest challenge might be:')}
                  </div>
                  <div className="mb-3 rounded-lg border border-gold/25 bg-gold/[.08] px-3 py-2 text-[13px] font-semibold text-gold">
                    {guidedSuggestion}
                  </div>
                  <button type="button" onClick={applyGuidedSuggestion} className={goldBtn} style={goldBtnStyle}>
                    {t('Usar esta resposta', 'Use this answer')}
                  </button>
                </div>
              )}
            </div>
          )}

          {screen === 'docs' && (
            <div className="flex flex-col gap-3">
              <button type="button" onClick={backToMenu} className="self-start font-mono text-[10.5px] text-text-secondary underline">
                ← {t('voltar', 'back')}
              </button>
              <div className="text-[12px] text-text-secondary">
                {t('Escolha o tipo de documento e envie o arquivo — a IA tenta ler e preencher os campos correspondentes.', 'Pick the document type and send the file — the AI tries to read it and fill the matching fields.')}
              </div>
              {step.uploads.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {step.uploads.map((u) => (
                    <button
                      key={u.key}
                      type="button"
                      onClick={() => setDocsUploadKey(u.key)}
                      className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold"
                      style={{
                        background: docsUploadKey === u.key ? 'rgba(201,154,46,.16)' : 'rgba(255,255,255,.05)',
                        color: docsUploadKey === u.key ? '#F4D48A' : '#cdd9ef',
                        border: `1px solid ${docsUploadKey === u.key ? 'rgba(201,154,46,.4)' : 'rgba(255,255,255,.1)'}`,
                      }}
                    >
                      {lang === 'pt' ? u.labelPt : u.labelEn}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-[12px] text-text-secondary">{t('Esta etapa não tem documentos previstos.', 'This step has no expected documents.')}</div>
              )}
              {step.uploads.length > 0 && (
                <>
                  <button
                    type="button"
                    disabled={docsBusy || !docsUploadKey}
                    onClick={() => fileInputRef.current?.click()}
                    className={actionBtn + ' justify-center disabled:opacity-50'}
                  >
                    {docsBusy ? t('Lendo documento…', 'Reading document…') : `📎 ${t('Escolher arquivo', 'Choose file')}`}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*"
                    className="hidden"
                    onChange={(e) => handleDocFile(e.target.files?.[0])}
                  />
                </>
              )}
              {docsMessage && <div className={`${cardBase} text-[12.5px] leading-[1.5] text-text-tertiary`}>{docsMessage}</div>}
              {docsSuggestions && Object.keys(docsSuggestions).length > 0 && (
                <div className={cardBase}>
                  <div className="mb-2 text-[12px] font-semibold text-text-tertiary">
                    {t('Encontramos estes valores no documento:', 'We found these values in the document:')}
                  </div>
                  <div className="mb-3 flex flex-col gap-1">
                    {Object.entries(docsSuggestions).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-[12px] text-text-tertiary">
                        <span className="text-text-secondary">{k}</span>
                        <span className="font-semibold text-white">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={applyDocSuggestions} className={goldBtn} style={goldBtnStyle}>
                    {t('Preencher campos automaticamente', 'Auto-fill fields')}
                  </button>
                </div>
              )}
            </div>
          )}

          {screen === 'voice' && (
            <div className="flex flex-col gap-3">
              <button type="button" onClick={backToMenu} className="self-start font-mono text-[10.5px] text-text-secondary underline">
                ← {t('voltar', 'back')}
              </button>
              {voiceState === 'unsupported' ? (
                <div className={`${cardBase} text-[12.5px] leading-[1.5] text-text-tertiary`}>
                  {t('Seu navegador não suporta reconhecimento de voz. Tente pelo Chrome no computador ou Android.', "Your browser doesn't support speech recognition. Try Chrome on desktop or Android.")}
                </div>
              ) : (
                <>
                  <div className="text-[12px] text-text-secondary">
                    {t('Fale livremente sobre a empresa — a IA organiza e preenche os campos correspondentes.', 'Speak freely about the company — the AI organizes it and fills the matching fields.')}
                  </div>
                  <button
                    type="button"
                    onClick={voiceState === 'listening' ? stopListening : startListening}
                    disabled={voiceState === 'processing'}
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-2xl disabled:opacity-60"
                    style={{
                      background: voiceState === 'listening' ? 'linear-gradient(140deg,#e05e5e,#f4948a)' : 'linear-gradient(140deg,#C99A2E,#F4D48A)',
                    }}
                  >
                    🎤
                  </button>
                  <div className="text-center text-[11px] text-text-secondary">
                    {voiceState === 'listening'
                      ? t('Ouvindo… toque para parar', 'Listening… tap to stop')
                      : voiceState === 'processing'
                        ? t('Processando…', 'Processing…')
                        : t('Toque para falar', 'Tap to speak')}
                  </div>
                  {voiceTranscript && <div className={`${cardBase} text-[12.5px] italic text-text-tertiary`}>“{voiceTranscript}”</div>}
                  {voiceSuggestions && Object.keys(voiceSuggestions).length > 0 && (
                    <div className={cardBase}>
                      <div className="mb-2 text-[12px] font-semibold text-text-tertiary">
                        {t('Entendemos isto:', 'We understood this:')}
                      </div>
                      <div className="mb-3 flex flex-col gap-1">
                        {Object.entries(voiceSuggestions).map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-2 text-[12px] text-text-tertiary">
                            <span className="flex-shrink-0 text-text-secondary">{k}</span>
                            <span className="truncate text-right font-semibold text-white">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={applyVoiceSuggestions} className={goldBtn} style={goldBtnStyle}>
                        {t('Preencher campos', 'Fill in fields')}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {screen === 'missing' && (
            <div className="flex flex-col gap-3">
              <button type="button" onClick={backToMenu} className="self-start font-mono text-[10.5px] text-text-secondary underline">
                ← {t('voltar', 'back')}
              </button>
              {missingBusy && <div className="text-[12px] text-text-secondary">{t('Verificando…', 'Checking…')}</div>}
              {!missingBusy && missing && missing.length === 0 && (
                <div className={`${cardBase} text-[12.5px] text-text-tertiary`}>
                  {t('Tudo certo por aqui — nenhuma informação pendente nesta etapa.', "All set — nothing pending in this step.")}
                </div>
              )}
              {!missingBusy && missing && missing.length > 0 && (
                <div className={cardBase}>
                  <div className="mb-2 text-[12px] font-semibold text-text-tertiary">
                    {t('Ainda faltam:', 'Still missing:')}
                  </div>
                  <div className="flex flex-col gap-1">
                    {missing.map((m) => (
                      <div key={m} className="text-[12.5px] text-text-tertiary">• {m}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
