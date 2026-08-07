'use client';

import { useRef, useState } from 'react';
import { Lang } from '@/lib/i18n';
import { UploadDef } from '@/lib/business-scan-schema';
import { ScanFileDto, downloadBusinessScanFile } from '@/lib/api';

interface Props {
  upload: UploadDef;
  files: ScanFileDto[];
  lang: Lang;
  onUpload: (file: File) => Promise<void>;
  onDelete: (fileId: string) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ScanUpload({ upload, files, lang, onUpload, onDelete }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const label = lang === 'pt' ? upload.labelPt : upload.labelEn;

  async function handleFile(f: File | undefined) {
    if (!f) return;
    setBusy(true);
    try {
      await onUpload(f);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="rounded-[12px] border border-dashed border-white/[.14] bg-white/[.02] p-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-text-tertiary">{label}</div>
          <div className="mt-0.5 text-[10.5px] text-text-secondary">PDF · Word · Excel · CSV · {lang === 'pt' ? 'Imagem' : 'Image'}</div>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="flex-shrink-0 rounded-[10px] border border-white/[.12] bg-white/[.06] px-3 py-2 text-xs font-semibold text-text disabled:opacity-50"
        >
          {busy ? (lang === 'pt' ? 'Enviando…' : 'Uploading…') : lang === 'pt' ? 'Enviar' : 'Upload'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-2.5 flex flex-col gap-1.5">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-2 rounded-[9px] bg-white/[.04] px-2.5 py-2">
              <span className="text-sm">📄</span>
              <button
                type="button"
                onClick={() => downloadBusinessScanFile(f.id, f.fileName)}
                className="min-w-0 flex-1 truncate text-left text-[12px] text-text underline decoration-dotted underline-offset-2"
                title={f.fileName}
              >
                {f.fileName}
              </button>
              <span className="flex-shrink-0 font-mono text-[10px] text-text-secondary">{formatSize(f.size)}</span>
              <button
                type="button"
                onClick={() => onDelete(f.id)}
                className="flex-shrink-0 text-text-secondary"
                aria-label="remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
