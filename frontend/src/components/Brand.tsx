import { ShieldCheck } from 'lucide-react';

// 로고 + 제품명. 사이드바/로그인/가입에서 공유(중복 제거).
// 이름을 바꾸려면 아래 'Packet Board' 한 곳만 수정.
export function Brand({ size = 'md', subtitle }: { size?: 'md' | 'lg'; subtitle?: string }) {
  const box = size === 'lg' ? 'w-10 h-10 rounded-xl' : 'w-8 h-8 rounded-lg';
  const icon = size === 'lg' ? 22 : 18;
  return (
    <div className="flex items-center gap-2">
      <div className={`${box} grid place-items-center bg-accent-600 text-white`}>
        <ShieldCheck size={icon} />
      </div>
      <div>
        <div className={`font-bold leading-tight ${size === 'lg' ? 'text-xl' : ''}`}>Packet Board</div>
        {subtitle && <div className="text-[11px] text-slate-400">{subtitle}</div>}
      </div>
    </div>
  );
}
