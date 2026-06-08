'use client';

import { useEffect, useMemo } from 'react';
import { X, Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { useEventPayload } from '@/lib/api';
import { downloadBlob } from '@/lib/download';

/** 중첩 JSON → "key,value" 평탄화 (CSV용) */
function flatten(obj: unknown, prefix = '', out: Record<string, string> = {}) {
  if (obj === null || obj === undefined) {
    out[prefix || '(root)'] = '';
  } else if (Array.isArray(obj)) {
    if (obj.length === 0) out[prefix] = '[]';
    else obj.forEach((v, i) => flatten(v, prefix ? `${prefix}[${i}]` : `[${i}]`, out));
  } else if (typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) out[prefix] = '{}';
    else entries.forEach(([k, v]) => flatten(v, prefix ? `${prefix}.${k}` : k, out));
  } else {
    out[prefix] = String(obj);
  }
  return out;
}

const csvCell = (s: string) => `"${s.replace(/"/g, '""')}"`;

export function PayloadModal({ id, onClose }: { id: number | null; onClose: () => void }) {
  const { data, isLoading, isError } = useEventPayload(id);

  // ESC 닫기
  useEffect(() => {
    if (id == null) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [id, onClose]);

  const pretty = useMemo(() => {
    if (!data?.payloadJson) return '';
    try {
      return JSON.stringify(JSON.parse(data.payloadJson), null, 2);
    } catch {
      return data.payloadJson; // JSON 파싱 실패 시 원문 그대로
    }
  }, [data]);

  if (id == null) return null;

  const onDownloadJson = () => downloadBlob(`event-${id}.json`, pretty || '{}', 'application/json');
  const onDownloadCsv = () => {
    let rows: [string, string][] = [];
    try {
      rows = Object.entries(flatten(JSON.parse(data!.payloadJson))) as [string, string][];
    } catch {
      rows = [['payload', data?.payloadJson ?? '']];
    }
    const csv = ['key,value', ...rows.map(([k, v]) => `${csvCell(k)},${csvCell(v)}`)].join('\r\n');
    downloadBlob(`event-${id}.csv`, '﻿' + csv, 'text/csv;charset=utf-8'); // BOM: 엑셀 한글
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-200 dark:border-white/10">
          <FileJson size={18} className="text-accent-600 dark:text-accent-500" />
          <h3 className="font-semibold">원문 로그 <span className="text-slate-400 font-normal">#{id}</span></h3>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={onDownloadJson} disabled={!pretty}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-40">
              <Download size={14} /> JSON
            </button>
            <button onClick={onDownloadCsv} disabled={!data}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-40">
              <FileSpreadsheet size={14} /> CSV
            </button>
            <button onClick={onClose}
              className="w-8 h-8 grid place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/10">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-auto">
          {isLoading && <div className="py-10 text-center text-slate-400">불러오는 중</div>}
          {isError && <div className="py-10 text-center text-red-500">원문을 불러오지 못했습니다.</div>}
          {data && (
            <pre className="text-xs leading-relaxed font-mono whitespace-pre-wrap break-all text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-black/30 rounded-lg p-4">
              {pretty}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
