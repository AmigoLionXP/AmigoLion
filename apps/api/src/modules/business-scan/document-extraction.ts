import { BusinessScanStepKey } from '@prisma/client';

export interface ExtractedText {
  supported: boolean;
  text: string | null;
  reasonPt?: string;
  reasonEn?: string;
}

const TEXT_MIME_TYPES = new Set(['text/plain', 'text/csv']);

/**
 * Only formats with a real, reliable text layer are extracted. Scanned images, DOCX
 * and XLSX are reported as unsupported rather than faked — OCR/Office parsing needs
 * services this environment doesn't have.
 */
export async function extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<ExtractedText> {
  if (mimeType === 'application/pdf') {
    try {
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      await parser.destroy();
      const text = (result.text ?? '').trim();
      if (!text) {
        return {
          supported: false,
          text: null,
          reasonPt: 'Este PDF não tem uma camada de texto (provavelmente é uma digitalização/imagem). Leitura de documentos escaneados ainda não está disponível — em breve.',
          reasonEn: 'This PDF has no text layer (likely a scanned image). Reading scanned documents isn\'t available yet — coming soon.',
        };
      }
      return { supported: true, text };
    } catch {
      return {
        supported: false,
        text: null,
        reasonPt: 'Não foi possível ler o conteúdo deste PDF.',
        reasonEn: 'Could not read this PDF\'s content.',
      };
    }
  }

  if (TEXT_MIME_TYPES.has(mimeType)) {
    return { supported: true, text: buffer.toString('utf-8') };
  }

  return {
    supported: false,
    text: null,
    reasonPt: 'Leitura automática ainda não está disponível para este tipo de arquivo (Word, Excel ou imagem). O arquivo foi salvo normalmente — os campos podem ser preenchidos manualmente. Em breve.',
    reasonEn: 'Automatic reading isn\'t available yet for this file type (Word, Excel or image). The file was saved normally — fields can be filled in manually. Coming soon.',
  };
}

type Kind = 'currency' | 'percent' | 'integer' | 'year';

interface FieldExtractor {
  keywords: string[];
  kind: Kind;
}

const FIELD_EXTRACTORS: Partial<Record<string, FieldExtractor>> = {
  'diagnosticar.faturamentoAnual': {
    keywords: ['faturamento bruto anual', 'faturamento anual', 'receita bruta total', 'receita bruta', 'receita total', 'faturamento'],
    kind: 'currency',
  },
  'diagnosticar.quantidadeClientes': { keywords: ['número de clientes', 'numero de clientes', 'base de clientes', 'clientes ativos'], kind: 'integer' },
  'qualificar.ticketMedio': { keywords: ['ticket médio', 'ticket medio'], kind: 'currency' },
  'qualificar.margem': { keywords: ['margem líquida', 'margem liquida', 'margem de lucro', 'margem bruta', 'margem'], kind: 'percent' },
  'crescer.cac': { keywords: ['cac', 'custo de aquisição de cliente', 'custo de aquisicao de cliente'], kind: 'currency' },
  'crescer.conversao': { keywords: ['taxa de conversão', 'taxa de conversao', 'conversão'], kind: 'percent' },
  'crescer.numeroLeads': { keywords: ['número de leads', 'numero de leads', 'leads gerados'], kind: 'integer' },
  'identificacao.numeroFuncionarios': { keywords: ['número de funcionários', 'numero de funcionarios', 'colaboradores', 'funcionários', 'funcionarios'], kind: 'integer' },
  'identificacao.numeroSocios': { keywords: ['número de sócios', 'numero de socios', 'sócios', 'socios'], kind: 'integer' },
  'identificacao.anoFundacao': { keywords: ['fundada em', 'fundação em', 'constituída em', 'desde'], kind: 'year' },
};

/** Booleans that a document's mere presence/upload slot already answers honestly — no text analysis needed. */
const UPLOAD_IMPLIES_BOOLEAN: Partial<Record<string, Partial<Record<string, string>>>> = {
  organizar: { dre: 'existeDre', fluxoCaixa: 'existeFluxoCaixa', kpis: 'existeDashboard' },
};

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function parseCurrencyToken(token: string): number | null {
  const cleaned = token.replace(/r\$\s?/i, '').trim();
  const normalized = cleaned.replace(/\./g, '').replace(',', '.');
  const value = parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

function parsePercentToken(token: string): number | null {
  const cleaned = token.replace('%', '').trim().replace(',', '.');
  const value = parseFloat(cleaned);
  return Number.isFinite(value) ? value : null;
}

function parseIntToken(token: string): number | null {
  const value = parseInt(token.replace(/\D/g, ''), 10);
  return Number.isFinite(value) ? value : null;
}

const TOKEN_PATTERNS: Record<Kind, RegExp> = {
  currency: /r\$\s?\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?/i,
  percent: /\d{1,3}(?:,\d{1,2})?\s?%/,
  integer: /\d{1,6}/,
  year: /(19|20)\d{2}/,
};

function findValueNearKeyword(normalizedText: string, keywords: string[], kind: Kind): number | null {
  for (const keyword of keywords) {
    const idx = normalizedText.indexOf(keyword);
    if (idx === -1) continue;
    const window = normalizedText.slice(idx, idx + keyword.length + 60);
    const match = window.match(TOKEN_PATTERNS[kind]);
    if (!match) continue;
    if (kind === 'currency') return parseCurrencyToken(match[0]);
    if (kind === 'percent') return parsePercentToken(match[0]);
    if (kind === 'year') return parseIntToken(match[0]);
    return parseIntToken(match[0]);
  }
  return null;
}

const CNPJ_REGEX = /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/;

/**
 * Real, deterministic keyword/regex extraction over a document's actual text — not a
 * simulated AI response. Only fields with a confident match are suggested; everything
 * else is left for the user to fill in.
 */
export function suggestFieldsFromText(
  stepKey: BusinessScanStepKey,
  uploadFieldKey: string,
  text: string,
): Record<string, string | number | boolean> {
  const normalized = normalize(text);
  const suggestions: Record<string, string | number | boolean> = {};

  for (const [path, extractor] of Object.entries(FIELD_EXTRACTORS)) {
    const [step, field] = path.split('.');
    if (step !== stepKey || !extractor) continue;
    const value = findValueNearKeyword(normalized, extractor.keywords, extractor.kind);
    if (value !== null) suggestions[field] = value;
  }

  if (stepKey === 'identificacao') {
    const cnpjMatch = text.match(CNPJ_REGEX);
    if (cnpjMatch) suggestions.documento = cnpjMatch[0];
  }

  const boolField = UPLOAD_IMPLIES_BOOLEAN[stepKey]?.[uploadFieldKey];
  if (boolField) suggestions[boolField] = true;

  return suggestions;
}
