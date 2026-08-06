import { CompanyDto } from './api';
import { Lang } from './i18n';
import { MOCK_COMPANY } from './mock-data';

function bandForScore(score: number, lang: Lang): string {
  if (score < 300) return lang === 'pt' ? 'Crítico — atenção imediata' : 'Critical — needs attention now';
  if (score < 500) return lang === 'pt' ? 'Fraco — em estruturação' : 'Weak — under construction';
  if (score < 700) return lang === 'pt' ? 'Regular — em evolução' : 'Fair — improving';
  if (score < 850) return lang === 'pt' ? 'Bom — consolidado' : 'Good — consolidated';
  return lang === 'pt' ? 'Excelente — referência' : 'Excellent — benchmark';
}

export interface CompanyView {
  nome: string;
  sectorLabel: string;
  growthScore: number;
  band: string;
  meta: string;
  revisao: string;
  nivel7m: number;
  gargaloLabel: string;
  managerName: string;
}

export function companyView(company: CompanyDto | typeof MOCK_COMPANY, lang: Lang): CompanyView {
  const isLive = 'id' in company;
  if (!isLive) {
    const c = company as typeof MOCK_COMPANY;
    return {
      nome: c.nome,
      sectorLabel: c.setor[lang],
      growthScore: c.growthScore,
      band: c.band[lang],
      meta: c.meta[lang],
      revisao: c.revisao[lang],
      nivel7m: c.nivel7m,
      gargaloLabel: c.gargalo[lang],
      managerName: c.manager.name,
    };
  }
  const c = company as CompanyDto;
  return {
    nome: c.nome,
    sectorLabel: c.setor ?? (lang === 'pt' ? 'Sua empresa' : 'Your company'),
    growthScore: c.growthScore,
    band: bandForScore(c.growthScore, lang),
    meta: lang === 'pt' ? `Meta: Score ${Math.min(1000, c.growthScore + 138)}` : `Goal: Score ${Math.min(1000, c.growthScore + 138)}`,
    revisao: lang === 'pt' ? 'Revisão em 14 dias' : 'Review in 14 days',
    nivel7m: c.nivel7m,
    gargaloLabel: c.gargalo ?? (lang === 'pt' ? 'a definir' : 'to be defined'),
    managerName: c.manager?.name ?? (lang === 'pt' ? 'a definir' : 'unassigned'),
  };
}
