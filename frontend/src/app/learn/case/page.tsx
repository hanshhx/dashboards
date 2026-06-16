'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, Radar, DoorOpen, KeyRound, Terminal, Eye,
  Footprints, Database, LayoutDashboard, Lightbulb,
} from 'lucide-react';
import { Shell } from '@/components/Shell';
import { LearnTabs } from '@/components/LearnTabs';

type Phase = {
  no: number;
  Icon: typeof Radar;
  phase: string;
  title: string;
  events: string;     // 이 단계에서 주로 남는 이벤트 유형
  attacker: string;   // 공격자의 행동(없으면 빈 문자열)
  sensor: string;     // 센서·허니팟이 남기는 로그
  analyst: string;    // 분석가가 대시보드에서 보는 것
  key: string;        // 이 단계의 핵심
  link?: { href: string; label: string };
};

// 특정 실제 사건이 아니라, 데이터에서 반복 관찰되는 허니팟 공격 패턴을 하나의 흐름으로 재구성한 학습용 사례.
const STEPS: Phase[] = [
  {
    no: 1, Icon: Radar, phase: '정찰', title: '열린 서비스 훑기 (포트 스캔)',
    events: 'flow · 스캔 alert',
    attacker: '외부에서 대상 IP의 포트를 훑어 응답하는 서비스를 찾습니다. SSH(22)·Telnet(23)·SMB(445)·RDP(3389)처럼 자주 노리는 포트를 차례로 두드립니다. 예시 출발지는 문서 전용 주소 203.0.113.10으로 표기합니다(실제 IP 아님).',
    sensor: '짧은 시간에 한 출발지가 여러 목적지·여러 포트로 접속을 시도하면 flow 이벤트가 다수 쌓이고, 스캔 패턴에 맞는 시그니처가 alert로 뜹니다.',
    analyst: '개요의 이벤트 추이가 갑자기 튀고, 출발 IP 순위 상위에 한 주소가 올라옵니다. 그 IP가 여러 목적지 포트로 향하는지 보면 스캔인지 가늠할 수 있습니다.',
    key: '아직 침입이 아니라 관심 대상을 고르는 단계입니다. 여기서 눈에 띈 IP를 계속 따라가는 것이 추적의 시작입니다.',
    link: { href: '/analysis/ip', label: 'IP 분석에서 출발지 살펴보기' },
  },
  {
    no: 2, Icon: DoorOpen, phase: '접속', title: '미끼 서비스에 실제 접속',
    events: 'honeypot',
    attacker: '스캔에서 찾은 서비스에 실제로 접속합니다. 허니팟은 일부러 매력적인 서비스를 열어 두어 공격자를 끌어들입니다.',
    sensor: '허니팟 서비스로 들어온 세션이 honeypot 이벤트로 기록됩니다. 이 데이터에서 honeypot 유형이 가장 큰 비중(약 54%)을 차지하는 이유입니다.',
    analyst: '이벤트 유형 분포에서 honeypot이 큰 까닭이 여기 있습니다. 다만 honeypot 이벤트에는 Suricata 시그니처·심각도·분류가 붙지 않습니다. 엔진이 규칙으로 잡은 것이 아니라, 미끼 서비스가 상호작용을 직접 기록한 것이기 때문입니다.',
    key: 'honeypot 이벤트는 미끼와 실제로 상호작용한 흔적입니다. 시그니처가 없다고 안전한 것이 아니라, 성격이 다른 기록일 뿐입니다.',
  },
  {
    no: 3, Icon: KeyRound, phase: '자격증명', title: '로그인 무차별·사전 공격',
    events: 'honeypot',
    attacker: '로그인 단계에서 admin·root 같은 계정에 흔한 비밀번호를 반복 대입합니다. 사전 목록을 빠르게 돌리는 경우가 많습니다.',
    sensor: '허니팟이 시도된 사용자명과 비밀번호를 그대로 수집합니다. 같은 출발지에서 짧은 간격의 대량 로그인 시도가 남습니다.',
    analyst: '한 출발지에서 반복되는 로그인 흔적이 보이고, 어떤 계정·비밀번호가 자주 노려지는지 통계로 확인할 수 있습니다.',
    key: '공격자가 노리는 계정·비밀번호 패턴을 거꾸로 배워, 우리 환경의 약한 자격증명을 먼저 점검할 수 있습니다.',
  },
  {
    no: 4, Icon: Terminal, phase: '침투 후', title: '명령 실행과 페이로드 내려받기',
    events: 'honeypot · flow',
    attacker: '로그인에 성공하면(허니팟이 일부러 허용) 명령을 실행하거나, 외부에서 악성 스크립트·봇넷 바이너리를 내려받으려 합니다.',
    sensor: '허니팟이 실행된 명령과 다운로드 URL·페이로드를 기록합니다. 외부로 나가는 다운로드 시도는 flow로도 남습니다.',
    analyst: '어떤 명령을 쓰고 어떤 파일을 받으려 했는지 보면, 봇넷 가담·코인 채굴·추가 전파 같은 실제 목적을 식별하는 단서가 됩니다.',
    key: '공격의 의도가 드러나는 단계입니다. 같은 명령·같은 페이로드가 여러 IP에서 보이면 같은 캠페인일 가능성이 큽니다.',
  },
  {
    no: 5, Icon: Eye, phase: '종합', title: '분석가의 종합 판단과 대응',
    events: 'flow + honeypot + alert',
    attacker: '',
    sensor: '하나의 사건이 정찰(flow)·상호작용(honeypot)·시그니처(alert) 등 여러 유형에 흩어져 남습니다.',
    analyst: '출발 IP의 평판(반복·다수 대상이면 위험), 노린 포트·서비스, 수집된 자격증명·페이로드를 한데 모아 단순 스캔인지 실제 침해 시도인지를 판단하고 차단·관찰을 결정합니다.',
    key: '유형을 따로 보지 말고, 한 IP의 행동을 시간순으로 이어 봐야 전체 그림이 보입니다. 이것이 위협 헌팅의 기본 시선입니다.',
    link: { href: '/analysis/signature', label: '시그니처 분석으로 패턴 보기' },
  },
];

function Section({ icon, label, text }: { icon: ReactNode; label: string; text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-slate-400 shrink-0">{icon}</span>
      <div>
        <div className="text-xs font-medium text-slate-500 mb-0.5">{label}</div>
        <div className="text-sm text-slate-700 dark:text-slate-300 leading-6">{text}</div>
      </div>
    </div>
  );
}

export default function CasePage() {
  const [i, setI] = useState(0);
  const s = STEPS[i];
  const go = (n: number) => setI(Math.max(0, Math.min(STEPS.length - 1, n)));

  return (
    <Shell title="학습하기">
      <LearnTabs />

      <div className="mt-4">
        <h2 className="text-base font-semibold flex items-center gap-2"><Footprints size={16} className="text-accent-600 dark:text-accent-500" />사례 연구 — 허니팟 공격, 단계별로 따라가기</h2>
        <p className="text-xs text-slate-400 mt-1 leading-5">특정 실제 사건이 아니라, 이 대시보드 데이터에서 반복 관찰되는 허니팟 공격 패턴을 하나의 흐름으로 재구성한 학습용 사례입니다. 표기된 IP는 문서 전용 예시 주소입니다.</p>
      </div>

      {/* 단계 타임라인 */}
      <div className="mt-4 flex items-center gap-1 overflow-x-auto pb-1">
        {STEPS.map((st, idx) => {
          const on = idx === i;
          const passed = idx < i;
          return (
            <div key={st.no} className="flex items-center shrink-0">
              <button onClick={() => go(idx)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                  on ? 'border-accent-600 bg-accent-600/10 text-accent-700 dark:text-accent-400'
                     : 'border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}>
                <span className="grid place-items-center w-5 h-5 rounded-full text-[11px] font-bold text-white" style={{ background: on ? '#2563eb' : passed ? '#16a34a' : '#94a3b8' }}>{st.no}</span>
                <st.Icon size={15} />
                <span className="font-medium">{st.phase}</span>
              </button>
              {idx < STEPS.length - 1 && <ChevronRight size={14} className="text-slate-300 dark:text-white/20 mx-0.5 shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* 단계 본문 */}
      <div className="mt-4 rounded-xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-5">
        <div className="flex items-center gap-3">
          <span className="grid place-items-center w-10 h-10 rounded-lg bg-accent-600/10 text-accent-600 dark:text-accent-500 shrink-0"><s.Icon size={20} /></span>
          <div className="min-w-0">
            <div className="text-xs text-slate-400">{s.no}단계 · {s.phase}</div>
            <div className="font-semibold">{s.title}</div>
          </div>
          <span className="ml-auto text-[11px] px-2 py-1 rounded bg-slate-100 dark:bg-white/5 text-slate-500 shrink-0">이벤트: {s.events}</span>
        </div>

        <div className="mt-4 space-y-3">
          {s.attacker && <Section icon={<Footprints size={15} />} label="공격자의 행동" text={s.attacker} />}
          <Section icon={<Database size={15} />} label="센서가 남기는 로그" text={s.sensor} />
          <Section icon={<LayoutDashboard size={15} />} label="분석가가 보는 화면" text={s.analyst} />
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 px-4 py-3">
          <Lightbulb size={18} className="mt-0.5 text-amber-500 shrink-0" />
          <div>
            <div className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-0.5">이 단계의 핵심</div>
            <div className="text-sm text-slate-700 dark:text-slate-300 leading-6">{s.key}</div>
          </div>
        </div>

        {s.link && (
          <div className="mt-4">
            <Link href={s.link.href} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5">
              {s.link.label}<ChevronRight size={14} />
            </Link>
          </div>
        )}
      </div>

      {/* 이전 / 다음 */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <button onClick={() => go(i - 1)} disabled={i === 0}
          className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/5">
          <ChevronLeft size={16} />이전 단계
        </button>
        <span className="text-xs text-slate-400">{s.no} / {STEPS.length}</span>
        {i < STEPS.length - 1 ? (
          <button onClick={() => go(i + 1)}
            className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-accent-600 text-white font-medium hover:bg-accent-700">
            다음 단계<ChevronRight size={16} />
          </button>
        ) : (
          <Link href="/learn/quiz" className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-accent-600 text-white font-medium hover:bg-accent-700">
            퀴즈로 확인하기<ChevronRight size={16} />
          </Link>
        )}
      </div>
    </Shell>
  );
}
