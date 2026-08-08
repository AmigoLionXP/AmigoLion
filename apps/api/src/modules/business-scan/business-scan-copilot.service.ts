import { Injectable, NotFoundException } from '@nestjs/common';
import { BusinessScanStepKey } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantScopeService } from '../../common/tenant-scope.service';
import { getStepDef } from './business-scan-schema';
import { CHALLENGE_EXAMPLES, STEP_INTROS, getFieldHelp } from './copilot-content';
import { extractTextFromBuffer, suggestFieldsFromText } from './document-extraction';

const CATEGORY_LABEL: Record<string, { pt: string; en: string; actionPt: string; actionEn: string }> = {
  gestao: { pt: 'Gestão', en: 'Management', actionPt: 'fortalecer a gestão', actionEn: 'strengthening management' },
  marketing: { pt: 'Marketing', en: 'Marketing', actionPt: 'estruturar o marketing', actionEn: 'structuring marketing' },
  comercial: { pt: 'Comercial', en: 'Sales', actionPt: 'fortalecer o processo comercial', actionEn: 'strengthening the sales process' },
  financeiro: { pt: 'Financeiro', en: 'Finance', actionPt: 'organizar as finanças', actionEn: 'organising finances' },
  operacao: { pt: 'Operação', en: 'Operations', actionPt: 'estruturar a operação', actionEn: 'structuring operations' },
  tecnologia: { pt: 'Tecnologia', en: 'Technology', actionPt: 'investir em tecnologia', actionEn: 'investing in technology' },
  lideranca: { pt: 'Liderança', en: 'Leadership', actionPt: 'desenvolver a liderança', actionEn: 'developing leadership' },
};

const GOOD_PRACTICE_FIELDS: Record<string, { pt: string; en: string }> = {
  existeDre: { pt: 'DRE estruturada', en: 'Structured P&L' },
  existeFluxoCaixa: { pt: 'Controle de fluxo de caixa', en: 'Cash flow control' },
  existePlanoContas: { pt: 'Plano de contas organizado', en: 'Organised chart of accounts' },
  existeOrganograma: { pt: 'Organograma definido', en: 'Defined org chart' },
  existeCrm: { pt: 'CRM em uso', en: 'CRM in use' },
  existeErp: { pt: 'ERP em uso', en: 'ERP in use' },
  existeDashboard: { pt: 'Dashboard de indicadores', en: 'KPI dashboard' },
  googleAds: { pt: 'Presença em Google Ads', en: 'Google Ads presence' },
  metaAds: { pt: 'Presença em Meta Ads', en: 'Meta Ads presence' },
  seo: { pt: 'Estratégia de SEO', en: 'SEO strategy' },
};

@Injectable()
export class BusinessScanCopilotService {
  constructor(private prisma: PrismaService, private tenant: TenantScopeService) {}

  getStepIntro(stepKey: BusinessScanStepKey, lang: 'pt' | 'en') {
    return { message: STEP_INTROS[stepKey][lang] };
  }

  getFieldHelp(stepKey: BusinessScanStepKey, fieldKey: string, lang: 'pt' | 'en') {
    const help = getFieldHelp(stepKey, fieldKey, lang);
    if (!help) throw new NotFoundException('Campo não encontrado.');
    return help;
  }

  getChallengeExamples(lang: 'pt' | 'en') {
    return { examples: CHALLENGE_EXAMPLES.map((e) => e[lang]) };
  }

  async getMissingSummary(userId: string, companyId: string | undefined, stepKey: BusinessScanStepKey, lang: 'pt' | 'en') {
    const company = await this.tenant.requireOwnCompany(userId, companyId);
    const scan = await this.prisma.businessScan.findUnique({ where: { companyId: company.id } });
    const step = getStepDef(stepKey);
    if (!scan) return { missing: [...step.fields.map((f) => (lang === 'pt' ? f.labelPt : f.labelEn)), ...step.uploads.map((u) => (lang === 'pt' ? u.labelPt : u.labelEn))] };

    const [section, files] = await Promise.all([
      this.prisma.businessScanSection.findUnique({ where: { businessScanId_stepKey: { businessScanId: scan.id, stepKey } } }),
      this.prisma.businessScanFile.findMany({ where: { businessScanId: scan.id, stepKey } }),
    ]);
    const data = (section?.data as Record<string, unknown>) ?? {};
    const skipped = new Set(((section?.skippedFields as string[]) ?? []) as string[]);
    const uploadedKeys = new Set(files.map((f) => f.fieldKey));

    const missing: string[] = [];
    for (const f of step.fields) {
      const answered = data[f.key] !== undefined && data[f.key] !== null && data[f.key] !== '';
      if (!answered && !skipped.has(f.key)) missing.push(lang === 'pt' ? f.labelPt : f.labelEn);
    }
    for (const u of step.uploads) {
      if (!uploadedKeys.has(u.key) && !skipped.has(u.key)) missing.push(lang === 'pt' ? u.labelPt : u.labelEn);
    }
    return { missing };
  }

  /**
   * Real analysis over the company's actual answers — not canned copy. Strengths come from
   * high scale ratings and existing good practices (organizar/crescer booleans); risks from
   * low ratings and missing financial controls; opportunities from the mid-range. The
   * "priority" names the lowest-rated of the 7 Diagnosticar categories.
   */
  async getExecutiveSummary(userId: string, companyId: string | undefined, lang: 'pt' | 'en') {
    const company = await this.tenant.requireOwnCompany(userId, companyId);
    const scan = await this.prisma.businessScan.findUnique({ where: { companyId: company.id } });
    if (!scan) throw new NotFoundException('Business Scan não encontrado.');

    const sections = await this.prisma.businessScanSection.findMany({ where: { businessScanId: scan.id } });
    const byStep = new Map(sections.map((s) => [s.stepKey, s.data as Record<string, unknown>]));
    const diagnosticar = byStep.get('diagnosticar') ?? {};
    const organizar = byStep.get('organizar') ?? {};
    const crescer = byStep.get('crescer') ?? {};

    const categories = Object.keys(CATEGORY_LABEL);
    const ratings = categories
      .map((key) => ({ key, value: diagnosticar[key] }))
      .filter((r): r is { key: string; value: number } => typeof r.value === 'number');

    const strengths: string[] = [];
    const risks: string[] = [];
    const opportunities: string[] = [];

    for (const r of ratings) {
      const cat = CATEGORY_LABEL[r.key];
      if (r.value >= 8) strengths.push(cat[lang]);
      else if (r.value <= 4) risks.push(cat[lang]);
      else opportunities.push(cat[lang]);
    }

    for (const [key, label] of Object.entries(GOOD_PRACTICE_FIELDS)) {
      const value = organizar[key] ?? crescer[key];
      if (value === true) strengths.push(label[lang]);
    }
    if (organizar.existeDre === false && organizar.existeFluxoCaixa === false) {
      risks.push(lang === 'pt' ? 'Sem controle financeiro estruturado (DRE e fluxo de caixa)' : 'No structured financial control (P&L and cash flow)');
    }

    const avgMaturity = ratings.length > 0 ? Math.round((ratings.reduce((a, r) => a + r.value, 0) / ratings.length) * 10) / 10 : null;

    const lowest = ratings.slice().sort((a, b) => a.value - b.value)[0];
    const maiorDesafio = diagnosticar.maiorDesafio as string | undefined;
    const priority = lowest
      ? lang === 'pt'
        ? `Primeira prioridade recomendada: ${CATEGORY_LABEL[lowest.key].actionPt}`
        : `First recommended priority: ${CATEGORY_LABEL[lowest.key].actionEn}`
      : lang === 'pt'
        ? 'Complete o diagnóstico para receber uma prioridade recomendada.'
        : 'Complete the diagnosis to receive a recommended priority.';

    return {
      strengthsCount: strengths.length,
      opportunitiesCount: opportunities.length,
      risksCount: risks.length,
      strengths,
      opportunities,
      risks,
      avgMaturity,
      growthScore: company.growthScore,
      priority,
      maiorDesafio: maiorDesafio ?? null,
    };
  }

  /**
   * "Responder com documentos" — reads the actual text layer of the uploaded file (PDF or
   * plain text/CSV) and suggests field values via keyword/regex matching. Word, Excel and
   * scanned images are honestly reported as unsupported rather than faked.
   */
  async extractFromFile(
    userId: string,
    companyId: string | undefined,
    stepKey: BusinessScanStepKey,
    uploadFieldKey: string,
    buffer: Buffer,
    mimeType: string,
    lang: 'pt' | 'en',
  ) {
    await this.tenant.requireOwnCompany(userId, companyId);
    const extracted = await extractTextFromBuffer(buffer, mimeType);
    if (!extracted.supported || !extracted.text) {
      return { supported: false, message: lang === 'pt' ? extracted.reasonPt : extracted.reasonEn, suggestions: {} };
    }
    const suggestions = suggestFieldsFromText(stepKey, uploadFieldKey, extracted.text);
    return { supported: true, message: null, suggestions };
  }

  /**
   * "🎤 Responder por voz" — the browser does the actual speech-to-text (Web Speech API);
   * this just runs the same deterministic extraction over the transcript. Word-form numbers
   * ("quatro milhões") aren't parsed — only digit patterns are — so when a fieldKey is given
   * and nothing more specific matched it, the raw transcript becomes that field's answer,
   * which is the right behavior for open text fields like "maior desafio".
   */
  async analyzeVoiceTranscript(
    userId: string,
    companyId: string | undefined,
    stepKey: BusinessScanStepKey,
    text: string,
    fieldKey: string | undefined,
  ) {
    await this.tenant.requireOwnCompany(userId, companyId);
    const trimmed = text.trim();
    if (!trimmed) return { suggestions: {} };
    const suggestions = suggestFieldsFromText(stepKey, 'voice', trimmed);
    if (fieldKey && suggestions[fieldKey] === undefined) {
      const step = getStepDef(stepKey);
      const field = step.fields.find((f) => f.key === fieldKey);
      if (field && (field.type === 'text' || field.type === 'textarea')) {
        suggestions[fieldKey] = trimmed;
      }
    }
    return { suggestions };
  }

  /** Small server-side decision tree behind "Não sei identificar" — deterministic, not a live LLM call. */
  answerGuidedChallenge(answers: boolean[], lang: 'pt' | 'en') {
    const QUESTIONS = [
      { pt: 'Sua empresa tem conseguido atrair clientes novos o suficiente?', en: 'Has your company been attracting enough new customers?', suggestion: CHALLENGE_EXAMPLES[0] },
      { pt: 'As vendas convertem bem quando um cliente demonstra interesse?', en: 'Do sales convert well once a customer shows interest?', suggestion: CHALLENGE_EXAMPLES[1] },
      { pt: 'O caixa da empresa fecha o mês tranquilo, sem apertos?', en: 'Does cash flow close the month comfortably, without strain?', suggestion: CHALLENGE_EXAMPLES[2] },
      { pt: 'Você consegue contratar e manter as pessoas certas?', en: 'Can you hire and keep the right people?', suggestion: CHALLENGE_EXAMPLES[3] },
      { pt: 'Os processos internos funcionam sem depender só de você?', en: 'Do internal processes run without depending only on you?', suggestion: CHALLENGE_EXAMPLES[4] },
      { pt: 'O marketing gera resultado de forma previsível?', en: 'Does marketing generate results predictably?', suggestion: CHALLENGE_EXAMPLES[5] },
    ];

    for (let i = 0; i < answers.length && i < QUESTIONS.length; i++) {
      if (answers[i] === false) {
        return { done: true, suggestion: QUESTIONS[i].suggestion[lang] };
      }
    }
    if (answers.length >= QUESTIONS.length) {
      return { done: true, suggestion: CHALLENGE_EXAMPLES[6][lang] };
    }
    const next = QUESTIONS[answers.length];
    return { done: false, question: next[lang], questionIndex: answers.length };
  }
}
