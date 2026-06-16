// 학습 콘텐츠 공용 타입·상수. 단계별 콘텐츠 파일(learn/intro·basic·advanced)과 lib/learn.ts 가 공유.
// 단계(STAGE): 입문 → 기초 → 심화. 이전 단계 시험(20문제 중 80%)을 통과해야 다음 단계가 열림.

export type Stage = '입문' | '기초' | '심화';
export const STAGES: Stage[] = ['입문', '기초', '심화'];
export const STAGE_DESC: Record<Stage, string> = {
  입문: '네트워크·로그를 읽기 위한 기본기 — 용어·통신·이벤트·위험도',
  기초: '대시보드 사용법과 흔한 탐지(스캔·평판 차단·정책 위반)',
  심화: '실제 공격(CVE)·정보성 판단·위협 헌팅까지',
};

export type ArtKey =
  | 'intro-soc' | 'intro-terms'
  | 'stun-intro' | 'stun-flow' | 'stun-decision'
  | 'ssh-scan' | 'sqli' | 'trojan' | 'cleartext'
  | 'ov-layout' | 'ov-severity' | 'ev-flow' | 'ev-export'
  | 'ip-profile' | 'sig-profile' | 'cross'
  | 'intro-handshake' | 'intro-eventtypes' | 'intro-layers' | 'intro-tcpudp' | 'intro-dns' | 'intro-perms' | 'intro-etclass'
  | 'syn-scan' | 'proto-donut'
  | 'cmd-injection' | 'dos-amp' | 'attempt-success' | 'mitre' | 'hunt-flow';

export type Group = '시작하기' | '대시보드 화면' | '탐지 시그니처';
export const GROUPS: Group[] = ['시작하기', '대시보드 화면', '탐지 시그니처'];

export interface LearnBlock { art?: ArtKey; text: string; }
export interface Term { term: string; def: string; }

export interface LearnItem {
  id: string;
  group: Group;
  order: number;
  level: Stage;
  name: string;
  tag?: string;
  riskKey?: '1' | '2' | '3' | '4';
  count?: number;
  objective: string;
  deepLink?: { href: string; label: string; staff?: boolean };
  practice?: string[];
  terms?: Term[];
  summary: string[];
  blocks: LearnBlock[];
}

export interface QuizQ {
  stage: Stage;
  level: '쉬움' | '보통' | '어려움';
  q: string;
  opts: string[];
  ans: number;
  exp: string;        // 짧은 정답 이유
  detail?: string;    // 자세한 해설 (있으면 exp 대신 이걸 보여 줌)
  relatedId?: string;
  scenario?: boolean;
}
