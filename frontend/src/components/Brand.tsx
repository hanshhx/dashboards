// 로고 — 사이드바/헤더·가입 화면에서 공유. 실제 SVG 로고(public/logo-packet-board.svg) 사용.
// 로고 색이 고정(짙은 네이비)이라 다크 배경에서 안 보이는 것을 막기 위해 다크모드에선 흰색으로 표시.
export function Brand({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const h = size === 'lg' ? 'h-9' : size === 'sm' ? 'h-6' : 'h-7';
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-packet-board.svg"
      alt="Packet Board — 네트워크 보안 로그"
      className={`${h} w-auto dark:brightness-0 dark:invert ${className}`}
    />
  );
}
