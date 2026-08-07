'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, ApiError, CompanyDto, HealthReportDto, MethodStepDto, TaskDto, clearToken, getToken, setToken } from './api';
import { Lang } from './i18n';
import {
  MOCK_CHAT_INTRO,
  MOCK_CHIPS,
  MOCK_COMPANY,
  MOCK_STEPS,
  MOCK_TASKS,
} from './mock-data';

export type Tab = 'home' | 'painel' | 'metodo' | 'ai' | 'ceo';

export interface ChatMessage {
  role: 'ai' | 'user';
  pt: string;
  en: string;
}

interface AppContextValue {
  lang: Lang;
  toggleLang: () => void;

  tab: Tab;
  setTab: (t: Tab) => void;
  openStep: number | null;
  setOpenStep: (n: number | null) => void;
  more: boolean;
  setMore: (v: boolean) => void;
  screen: string | null;
  setScreen: (s: string | null) => void;

  authReady: boolean;
  authenticated: boolean;

  company: CompanyDto | typeof MOCK_COMPANY;
  companyIsLive: boolean;

  steps: MethodStepDto[];
  stepsGated: boolean;

  tasks: TaskDto[];
  toggleTask: (id: string) => void;

  toggleChecklistItem: (stepN: number, itemIndex: number) => void;

  health: HealthReportDto | null;

  chat: ChatMessage[];
  chatChips: typeof MOCK_CHIPS;
  sendChat: (text: string) => void;
  chatBusy: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

const DEMO_EMAIL = 'demo@7market.com';
const DEMO_PASSWORD = 'demo1234';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('pt');
  const [tab, setTab] = useState<Tab>('home');
  const [openStep, setOpenStep] = useState<number | null>(null);
  const [more, setMore] = useState(false);
  const [screen, setScreen] = useState<string | null>(null);

  const [authReady, setAuthReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const [company, setCompany] = useState<CompanyDto | typeof MOCK_COMPANY>(MOCK_COMPANY);
  const [companyIsLive, setCompanyIsLive] = useState(false);
  const [steps, setSteps] = useState<MethodStepDto[]>(MOCK_STEPS);
  const [stepsGated, setStepsGated] = useState(false);
  const [tasks, setTasks] = useState<TaskDto[]>(MOCK_TASKS);
  const [health, setHealth] = useState<HealthReportDto | null>(null);

  const [chat, setChat] = useState<ChatMessage[]>([{ role: 'ai', pt: MOCK_CHAT_INTRO.pt, en: MOCK_CHAT_INTRO.en }]);
  const [chatBusy, setChatBusy] = useState(false);

  // Silent demo login so the recreated screens show real data from the API
  // whenever it's reachable; falls back to bundled mock data otherwise.
  useEffect(() => {
    let cancelled = false;
    async function boot() {
      const existing = getToken();
      if (!existing) {
        try {
          const { accessToken } = await api.login(DEMO_EMAIL, DEMO_PASSWORD);
          if (cancelled) return;
          setToken(accessToken);
          setAuthenticated(true);
        } catch {
          if (!cancelled) setAuthenticated(false);
        }
      } else {
        setAuthenticated(true);
      }
      if (!cancelled) setAuthReady(true);
    }
    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authReady || !authenticated) return;
    let cancelled = false;

    api
      .getCompany()
      .then((c) => {
        if (!cancelled) {
          setCompany(c);
          setCompanyIsLive(true);
        }
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          clearToken();
          setAuthenticated(false);
        }
      });

    api
      .getSteps()
      .then((res) => {
        if (cancelled) return;
        setStepsGated(res.gated);
        if (!res.gated && res.steps.length) setSteps(res.steps);
      })
      .catch(() => {});

    api
      .getTasks()
      .then((list) => {
        if (!cancelled && list.length) setTasks(list);
      })
      .catch(() => {});

    api
      .getHealth()
      .then((res) => {
        if (!cancelled && !res.gated) setHealth(res);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [authReady, authenticated]);

  const toggleLang = useCallback(() => setLang((l) => (l === 'pt' ? 'en' : 'pt')), []);

  const toggleTask = useCallback(
    (id: string) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
      if (companyIsLive) {
        const task = tasks.find((t) => t.id === id);
        if (task) api.toggleTask(id, !task.done).catch(() => {});
      }
    },
    [companyIsLive, tasks],
  );

  // 7M Engine: toggling a checklist item recomputes step %/status server-side
  // and can auto-unlock the next step — always trust the server's response
  // over an optimistic guess once it's live.
  const toggleChecklistItem = useCallback(
    (stepN: number, itemIndex: number) => {
      setSteps((prev) =>
        prev.map((s) =>
          s.n === stepN
            ? { ...s, checklist: s.checklist.map((c, i) => (i === itemIndex ? { ...c, done: !c.done } : c)) }
            : s,
        ),
      );
      if (!companyIsLive) return;
      api
        .toggleChecklistItem(stepN, itemIndex)
        .then(({ step, unlockedStepN, growthScore }) => {
          setSteps((prev) =>
            prev.map((s) => {
              if (s.n === step.n) return step;
              if (unlockedStepN !== null && s.n === unlockedStepN) {
                return { ...s, status: 'next', deadlinePt: 'pronto p/ iniciar', deadlineEn: 'ready to start' };
              }
              return s;
            }),
          );
          // Business Health Engine: execution just moved, so the score/CEO cockpit should too.
          setCompany((prev) => ('id' in prev ? { ...prev, growthScore } : prev));
          api
            .getHealth()
            .then((res) => !res.gated && setHealth(res))
            .catch(() => {});
        })
        .catch(() => {});
    },
    [companyIsLive],
  );

  const sendChat = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setChat((prev) => [...prev, { role: 'user', pt: text, en: text }]);
      setChatBusy(true);
      try {
        if (companyIsLive) {
          const run = await api.runAgent(text, lang);
          const reply = run.output?.reply ?? '…';
          setChat((prev) => [...prev, { role: 'ai', pt: reply, en: reply }]);
        } else {
          const chip = MOCK_CHIPS.find((c) => c.question.pt === text || c.question.en === text);
          const reply = chip
            ? chip.question
            : { pt: 'Estou correlacionando isso com o seu Growth Score e o seu Método 7M.', en: 'I am correlating this with your Growth Score and your 7M Method.' };
          await new Promise((r) => setTimeout(r, 350));
          setChat((prev) => [...prev, { role: 'ai', pt: reply.pt, en: reply.en }]);
        }
      } finally {
        setChatBusy(false);
      }
    },
    [companyIsLive, lang],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      lang,
      toggleLang,
      tab,
      setTab,
      openStep,
      setOpenStep,
      more,
      setMore,
      screen,
      setScreen,
      authReady,
      authenticated,
      company,
      companyIsLive,
      steps,
      stepsGated,
      tasks,
      toggleTask,
      toggleChecklistItem,
      health,
      chat,
      chatChips: MOCK_CHIPS,
      sendChat,
      chatBusy,
    }),
    [lang, toggleLang, tab, openStep, more, screen, authReady, authenticated, company, companyIsLive, steps, stepsGated, tasks, toggleTask, toggleChecklistItem, health, chat, sendChat, chatBusy],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
