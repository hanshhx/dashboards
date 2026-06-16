'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, BookMarked } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { LearnTabs } from '@/components/LearnTabs';
import { LEARN_ITEMS, type Stage } from '@/lib/learn';

const STAGE_COLOR: Record<Stage, string> = { 입문: '#16a34a', 기초: '#2563eb', 심화: '#ea580c' };

type Entry = { term: string; def: string; sources: { id: string; name: string; stage: Stage }[] };

// 모든 학습 항목의 핵심 용어를 한곳에 모은다. 같은 용어가 여러 항목에 나오면 출처를 합친다.
const GLOSSARY: Entry[] = (() => {
  const map = new Map<string, Entry>();
  for (const it of LEARN_ITEMS) {
    for (const t of it.terms ?? []) {
      const key = t.term.trim().toLowerCase();
      const src = { id: it.id, name: it.name, stage: it.level };
      const cur = map.get(key);
      if (cur) {
        if (!cur.sources.some((s) => s.id === it.id)) cur.sources.push(src);
      } else {
        map.set(key, { term: t.term.trim(), def: t.def.trim(), sources: [src] });
      }
    }
  }
  return [...map.values()].sort((a, b) => a.term.localeCompare(b.term, 'ko'));
})();

export default function GlossaryPage() {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const list = q ? GLOSSARY.filter((e) => e.term.toLowerCase().includes(q) || e.def.toLowerCase().includes(q)) : GLOSSARY;

  return (
    <Shell title="학습하기">
      <LearnTabs />

      <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-base font-semibold flex items-center gap-2"><BookMarked size={16} className="text-accent-600 dark:text-accent-500" />용어집</h2>
        <span className="text-sm text-slate-500">총 {GLOSSARY.length}개 용어</span>
      </div>
      <p className="text-xs text-slate-400 mt-1">학습 항목에 나온 핵심 용어를 모았습니다. 용어나 뜻으로 검색하고, 출처를 눌러 해당 설명으로 이동할 수 있습니다.</p>

      <div className="relative mt-3 max-w-md">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="용어·뜻 검색"
          className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-100 dark:bg-white/10 border border-slate-300 dark:border-white/15 focus:border-accent-600 outline-none text-sm" />
      </div>

      {list.length === 0 ? (
        <div className="mt-4 text-sm text-slate-400">‘{query}’에 해당하는 용어가 없습니다.</div>
      ) : (
        <dl className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.map((e) => (
            <div key={e.term} className="rounded-xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-4">
              <dt className="font-semibold text-[15px] text-slate-800 dark:text-slate-100">{e.term}</dt>
              <dd className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{e.def}</dd>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400">출처</span>
                {e.sources.map((s) => (
                  <Link key={s.id} href={`/learn?item=${s.id}`}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-medium hover:underline"
                    style={{ background: `${STAGE_COLOR[s.stage]}1a`, color: STAGE_COLOR[s.stage] }}>
                    {s.name}<ArrowRight size={11} />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </dl>
      )}
    </Shell>
  );
}
