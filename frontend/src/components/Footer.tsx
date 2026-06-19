// 화면 하단 푸터 — 'Powered by JSYCURE' 로고. 다크모드에선 흰색으로 표시.
export function Footer() {
  return (
    <footer className="shrink-0 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0b0c14] py-4 px-6 flex items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/powered-by-jsycure.svg"
        alt="Powered by JSYCURE"
        className="h-5 w-auto opacity-80 dark:brightness-0 dark:invert"
      />
    </footer>
  );
}
