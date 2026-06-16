'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, ListChecks, NotebookPen, BookMarked, Footprints } from 'lucide-react';

// 두 학습 페이지(설명/퀴즈) 공통 상단 탭
export function LearnTabs() {
  const path = usePathname();
  const tab = (href: string, label: string, Icon: typeof GraduationCap) => {
    const on = path === href;
    return (
      <Link href={href}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium ${
          on ? 'bg-accent-600 text-white'
             : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10'
        }`}>
        <Icon size={16} />{label}
      </Link>
    );
  };
  return (
    <div className="flex gap-2">
      {tab('/learn', '학습', GraduationCap)}
      {tab('/learn/quiz', '퀴즈', ListChecks)}
      {tab('/learn/review', '복습·오답노트', NotebookPen)}
      {tab('/learn/glossary', '용어집', BookMarked)}
      {tab('/learn/case', '사례 연구', Footprints)}
    </div>
  );
}
