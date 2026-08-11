import { BadRequestException } from '@nestjs/common';
import { BusinessScanStepKey } from '@prisma/client';
import { FieldDef, getStepDef } from './business-scan-schema';

const TEXT_MAX = 500;
const TEXTAREA_MAX = 5000;

function validateField(field: FieldDef, value: unknown): unknown {
  if (value === null || value === undefined || value === '') return null;

  switch (field.type) {
    case 'text':
    case 'url':
      if (typeof value !== 'string') throw new BadRequestException(`${field.key} deve ser texto.`);
      if (value.length > TEXT_MAX) throw new BadRequestException(`${field.key} excede ${TEXT_MAX} caracteres.`);
      return value;
    case 'textarea':
      if (typeof value !== 'string') throw new BadRequestException(`${field.key} deve ser texto.`);
      if (value.length > TEXTAREA_MAX) throw new BadRequestException(`${field.key} excede ${TEXTAREA_MAX} caracteres.`);
      return value;
    case 'number':
    case 'currency': {
      const n = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(n) || n < 0) throw new BadRequestException(`${field.key} deve ser um número válido.`);
      return n;
    }
    case 'percent': {
      const n = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(n) || n < 0 || n > 100) throw new BadRequestException(`${field.key} deve ser entre 0 e 100.`);
      return n;
    }
    case 'scale': {
      const n = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(n) || n < 1 || n > 10) throw new BadRequestException(`${field.key} deve ser entre 1 e 10.`);
      return Math.round(n);
    }
    case 'boolean':
      if (typeof value !== 'boolean') throw new BadRequestException(`${field.key} deve ser verdadeiro/falso.`);
      return value;
    case 'select': {
      const valid = field.options?.some((o) => o.value === value);
      if (!valid) throw new BadRequestException(`${field.key} tem valor inválido.`);
      return value;
    }
    default:
      return value;
  }
}

/** Validates+coerces incoming section data against the step's known fields; unknown keys are dropped. */
export function validateSectionData(stepKey: BusinessScanStepKey, data: Record<string, unknown>): Record<string, unknown> {
  const step = getStepDef(stepKey);
  const fieldsByKey = new Map(step.fields.map((f) => [f.key, f]));
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data ?? {})) {
    const field = fieldsByKey.get(key);
    if (!field) continue; // unknown keys are silently dropped, not errored — keeps the API forward-compatible
    cleaned[key] = validateField(field, value);
  }
  return cleaned;
}

/** Skipped-field keys must be real fields on the step; anything else is dropped. */
export function validateSkippedFields(stepKey: BusinessScanStepKey, skipped: unknown): string[] {
  if (!Array.isArray(skipped)) return [];
  const step = getStepDef(stepKey);
  const validKeys = new Set(step.fields.map((f) => f.key));
  return skipped.filter((k): k is string => typeof k === 'string' && validKeys.has(k));
}

export const ALLOWED_UPLOAD_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/webp',
];

export const MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
