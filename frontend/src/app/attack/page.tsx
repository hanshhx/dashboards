'use client';

import { useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { Skeleton, fmt } from '@/components/ui';
import { useAttackMatrix } from '@/lib/api';

export default function AttackPage() {
  const { data, isLoading, isError } = useAttackMatrix();
  const [sel, setSel] = useState<string | null>(null);

  const allCounts = data?.tactics.flatMap((t) => t.categories.map((c) => c.count)) ?? [];
  const max = Math.max(1, ...allCounts);
  const heat = (n: number) => {
    const r = Math.min(1, n / max);
    return { background: `rgba(239,68,68,${0.14 + 0.78 * r})`, color: r > 0.45 ? '#fff' : undefined };
  };
  const covered = data?.tactics.filter((t) => t.count > 0).length ?? 0;
  const selected = data?.tactics.find((t) => t.tactic === sel);

  return (
    <Shell title="MITRE ATT&CK 매트릭스" requireRole="STAFF">
      <div className="rounded-2xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl grid place-items-center text-white" style={{ background: 'linear-gradient(135deg,#7c5cff,#ef4444)' }}>
            <LayoutGrid size={20} />
          </div>
          <div>
            <div className="font-semibold">탐지된 공격의 ATT&CK 전술 커버리지</div>
            <div className="text-xs text-slate-400">Suricata 분류(category) → MITRE ATT&CK 14개 전술 매핑 · 색이 진할수록 탐지 多</div>
          </div>
        </div>
        <div className="ml-auto flex gap-6 text-center">
          <div>
            <div className="text-xs text-slate-500">전술 커버리지</div>
            <div className="text-xl font-bold mt-0.5">{covered}<span className="text-slate-400 text-sm"> / 14</span></div>
          </div>
          <div>
            <div className="text-xs text-slate-500">매핑된 alert</div>
            <div className="text-xl font-bold mt-0.5" style={{ color: '#ef4444' }}>{fmt(data?.mapped)}</div>
          </div>
        </div>
      </div>

      {isLoading && <div className="mt-4"><Skeleton h="h-72" /></div>}
      {isError && <div className="mt-4 text-red-500 text-sm">불러오지 못했습니다.</div>}

      {data && (
        <>
          <div className="mt-4 overflow-x-auto pb-2">
            <div className="flex gap-2 min-w-max">
              {data.tactics.map((t) => (
                <button key={t.id} onClick={() => setSel(t.tactic === sel ? null : t.tactic)}
                  className={`w-44 shrink-0 text-left rounded-lg overflow-hidden border ${t.tactic === sel ? 'border-violet-500 ring-2 ring-violet-500/30' : 'border-slate-200 dark:border-white/10'} ${t.count > 0 ? '' : 'opacity-50'}`}>
                  <div className="px-2.5 py-2 bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                    <div className="text-xs font-semibold truncate">{t.ko}</div>
                    <div className="text-[10px] text-slate-400 truncate">{t.tactic}</div>
                    <div className="text-sm font-bold mt-0.5">{fmt(t.count)}</div>
                  </div>
                  <div className="p-1.5 space-y-1 min-h-[64px]">
                    {t.categories.length === 0 && <div className="text-[10px] text-slate-300 dark:text-white/20 text-center py-4">탐지 없음</div>}
                    {t.categories.slice(0, 6).map((c, i) => (
                      <div key={i} className="rounded px-1.5 py-1 text-[10px] leading-tight" style={heat(c.count)} title={`${c.key}: ${c.count}`}>
                        <div className="truncate font-medium">{c.key}</div>
                        <div className="text-right tabular-nums opacity-90">{fmt(c.count)}</div>
                      </div>
                    ))}
                    {t.categories.length > 6 && <div className="text-[10px] text-slate-400 text-center">+{t.categories.length - 6}개</div>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selected && (
            <div className="mt-2 rounded-2xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-4">
              <div className="font-semibold mb-3">{selected.ko} <span className="text-slate-400 font-normal text-sm">{selected.tactic} · {fmt(selected.count)}건</span></div>
              {selected.categories.length === 0 ? (
                <div className="text-sm text-slate-400">이 전술에 매핑된 탐지가 없습니다.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selected.categories.map((c, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 dark:bg-white/[.04] px-3 py-2 text-sm">
                      <span className="truncate" title={c.key ?? ''}>{c.key}</span>
                      <span className="font-medium tabular-nums">{fmt(c.count)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {data.unmappedCategories.length > 0 && (
            <div className="mt-4 text-xs text-slate-400">
              <b>미분류 category {data.unmappedCategories.length}종</b> ({fmt(data.unmapped)}건): {data.unmappedCategories.map((c) => c.key).join(', ')}
              <span className="block mt-0.5">→ 이 목록을 알려주시면 매핑 규칙에 추가해 매트릭스에 반영할게요.</span>
            </div>
          )}
        </>
      )}
    </Shell>
  );
}
