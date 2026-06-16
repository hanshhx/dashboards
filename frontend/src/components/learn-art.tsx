// 학습 페이지용 설명 그림(SVG). 사진 대신 직접 그린 다이어그램.
// 색은 글자색(currentColor)을 상속하므로 라이트/다크 모두에서 자연스럽게 보인다.
// 강조/위험 색만 명시한다. (브랜드 블루 #2563eb)
import type { ReactNode } from 'react';
import type { ArtKey } from '@/lib/learn';

type Tone = 'base' | 'accent' | 'danger' | 'warn' | 'ok';
const TONE: Record<Tone, { c: string }> = {
  base: { c: 'currentColor' },
  accent: { c: '#2563eb' },
  danger: { c: '#dc2626' },
  warn: { c: '#ea580c' },
  ok: { c: '#16a34a' },
};

function Box({
  x, y, w, h, label, sub, tone = 'base', fs = 12,
}: { x: number; y: number; w: number; h: number; label: string; sub?: string; tone?: Tone; fs?: number }) {
  const c = TONE[tone].c;
  const cx = x + w / 2;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10}
        fill={c} fillOpacity={tone === 'base' ? 0.04 : 0.1}
        stroke={c} strokeOpacity={tone === 'base' ? 0.25 : 0.6} />
      <text x={cx} y={sub ? y + h / 2 - 6 : y + h / 2} textAnchor="middle" dominantBaseline="middle"
        fontSize={fs} fontWeight={500} fill={c}>{label}</text>
      {sub && (
        <text x={cx} y={y + h / 2 + 11} textAnchor="middle" dominantBaseline="middle"
          fontSize={10.5} fill={c} opacity={0.7}>{sub}</text>
      )}
    </g>
  );
}

function Arrow({
  from, to, label, tone = 'base', dash,
}: { from: [number, number]; to: [number, number]; label?: string; tone?: Tone; dash?: boolean }) {
  const c = TONE[tone].c;
  const [x1, y1] = from, [x2, y2] = to;
  const a = Math.atan2(y2 - y1, x2 - x1), h = 6;
  const p1 = `${x2 - h * Math.cos(a - 0.5)},${y2 - h * Math.sin(a - 0.5)}`;
  const p2 = `${x2 - h * Math.cos(a + 0.5)},${y2 - h * Math.sin(a + 0.5)}`;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={1.5}
        strokeOpacity={0.8} strokeDasharray={dash ? '4 3' : undefined} />
      <polygon points={`${x2},${y2} ${p1} ${p2}`} fill={c} fillOpacity={0.8} />
      {label && (
        <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 5} textAnchor="middle"
          fontSize={10.5} fill={c} opacity={0.85}>{label}</text>
      )}
    </g>
  );
}

function Svg({ vb, children }: { vb: string; children: ReactNode }) {
  return (
    <svg viewBox={vb} width="100%" xmlns="http://www.w3.org/2000/svg"
      style={{ maxHeight: 240, display: 'block' }} role="img">
      {children}
    </svg>
  );
}

function IntroArt() {
  return (
    <Svg vb="0 0 480 150">
      <Box x={16} y={48} w={120} h={50} label="화상회의·통화" sub="Google Meet 등" />
      <Arrow from={[136, 73]} to={[196, 73]} />
      <Box x={196} y={48} w={120} h={50} label="STUN 트래픽" sub="3478·5349 포트" tone="accent" />
      <Arrow from={[316, 73]} to={[372, 73]} />
      <Box x={372} y={48} w={96} h={50} label="보안 센서" sub="Suricata 기록" />
      <Box x={140} y={112} w={200} h={28} label="‘ET INFO’ = 참고용 (공격 아님)" tone="ok" fs={11} />
    </Svg>
  );
}

function FlowArt() {
  return (
    <Svg vb="0 0 480 160">
      <Box x={20} y={36} w={120} h={42} label="내 기기" sub="192.168.0.21 (사설)" />
      <Box x={20} y={86} w={120} h={30} label="공유기(NAT)" fs={11} />
      <Box x={340} y={36} w={120} h={42} label="STUN 서버" />
      <Arrow from={[140, 50]} to={[340, 50]} label="① Binding Request — 내 주소?" tone="accent" dash />
      <Arrow from={[340, 66]} to={[140, 66]} label="② 응답: 203.0.113.5:54021" tone="accent" />
      <Box x={20} y={126} w={440} h={28} label="이 ‘반사 주소(공인 IP·포트)’를 상대에게 알려 직접 연결에 씁니다" tone="accent" fs={11} />
    </Svg>
  );
}

function DecisionArt() {
  return (
    <Svg vb="0 0 480 150">
      <Box x={16} y={53} w={110} h={44} label="STUN 탐지" tone="accent" />
      <Arrow from={[126, 66]} to={[232, 40]} label="정상(화상회의)" tone="ok" />
      <Box x={232} y={24} w={232} h={38} label="꺼도 됨 · 억제(suppress)" tone="ok" />
      <Arrow from={[126, 86]} to={[232, 116]} label="서버 구간 대량" tone="warn" />
      <Box x={232} y={100} w={232} h={38} label="확인: 출발지·빈도 점검" tone="warn" />
    </Svg>
  );
}

function SshScanArt() {
  return (
    <Svg vb="0 0 480 160">
      <Box x={16} y={58} w={120} h={44} label="외부 IP" sub="공격자" tone="danger" />
      <Box x={344} y={16} w={120} h={32} label="호스트 A : 22" fs={11} />
      <Box x={344} y={62} w={120} h={32} label="호스트 B : 22" fs={11} />
      <Box x={344} y={108} w={120} h={32} label="호스트 C : 22" fs={11} />
      <Arrow from={[136, 70]} to={[344, 34]} tone="danger" dash />
      <Arrow from={[136, 80]} to={[344, 78]} label="포트 22 열렸나?" tone="danger" dash />
      <Arrow from={[136, 90]} to={[344, 122]} tone="danger" dash />
    </Svg>
  );
}

function SqliArt() {
  return (
    <Svg vb="0 0 480 150">
      <Box x={16} y={46} w={184} h={52} label="입력칸 (로그인·검색)" sub="' OR '1'='1" tone="danger" />
      <Arrow from={[200, 72]} to={[306, 72]} label="명령 주입" tone="danger" />
      <g>
        <ellipse cx={388} cy={52} rx={56} ry={11} fill="#dc2626" fillOpacity={0.1} stroke="#dc2626" strokeOpacity={0.6} />
        <path d="M332,52 v44 a56,11 0 0 0 112,0 v-44" fill="#dc2626" fillOpacity={0.1} stroke="#dc2626" strokeOpacity={0.6} />
        <text x={388} y={82} textAnchor="middle" fontSize={12} fontWeight={500} fill="#dc2626">데이터베이스</text>
      </g>
      <Box x={16} y={112} w={448} h={28} label="성공하면 회원정보·비밀번호가 통째로 유출" tone="danger" fs={11} />
    </Svg>
  );
}

function TrojanArt() {
  return (
    <Svg vb="0 0 480 150">
      <Box x={16} y={50} w={140} h={46} label="감염된 PC" sub="내부" tone="danger" />
      <Arrow from={[156, 73]} to={[328, 73]} label="체크인: ‘나 준비됐다’ (주기 반복)" tone="danger" dash />
      <Box x={328} y={50} w={136} h={46} label="공격자 서버(C2)" tone="danger" />
      <Box x={16} y={112} w={448} h={28} label="이미 내부 감염이라는 강한 신호 → PC 분리·점검" tone="danger" fs={11} />
    </Svg>
  );
}

function CleartextArt() {
  return (
    <Svg vb="0 0 480 150">
      <Box x={16} y={36} w={110} h={42} label="PC" />
      <Arrow from={[126, 57]} to={[352, 57]} label="아이디 / 비밀번호 (평문)" tone="danger" />
      <Box x={352} y={36} w={112} h={42} label="서버" />
      <Arrow from={[240, 86]} to={[240, 78]} tone="danger" dash />
      <Box x={200} y={86} w={80} h={24} label="도청 가능" tone="danger" fs={10.5} />
      <Box x={16} y={118} w={448} h={26} label="암호화된 연결(HTTPS·SSH)로 바꿔야 안전" tone="ok" fs={11} />
    </Svg>
  );
}

function OvLayoutArt() {
  return (
    <Svg vb="0 0 480 170">
      <Box x={16} y={16} w={104} h={32} label="총 이벤트" fs={11} />
      <Box x={128} y={16} w={104} h={32} label="경보" tone="danger" fs={11} />
      <Box x={240} y={16} w={104} h={32} label="출발지 IP" fs={11} />
      <Box x={352} y={16} w={112} h={32} label="유형 수" fs={11} />
      <Box x={16} y={58} w={214} h={48} label="추이·위험도·프로토콜" sub="그래프" tone="accent" fs={11} />
      <Box x={242} y={58} w={222} h={48} label="시그니처·포트·IP 순위" fs={11} />
      <Box x={16} y={116} w={448} h={40} label="경보 모니터링" sub="위험순·최근순 정렬 + 위험도 필터" fs={11} />
    </Svg>
  );
}

function OvSeverityArt() {
  const rows = [
    { l: '높음', c: '#dc2626', w: 342 },
    { l: '중간', c: '#ea580c', w: 209 },
    { l: '낮음', c: '#ca8a04', w: 114 },
    { l: '정보', c: '#64748b', w: 46 },
  ];
  return (
    <Svg vb="0 0 480 150">
      {rows.map((r, i) => {
        const y = 22 + i * 32;
        return (
          <g key={i}>
            <text x={16} y={y + 13} fontSize={12} fontWeight={500} fill={r.c}>{r.l}</text>
            <rect x={70} y={y} width={388} height={18} rx={4} fill="currentColor" fillOpacity={0.06} />
            <rect x={70} y={y} width={r.w} height={18} rx={4} fill={r.c} fillOpacity={0.85} />
          </g>
        );
      })}
    </Svg>
  );
}

function EvFlowArt() {
  return (
    <Svg vb="0 0 480 120">
      <Box x={16} y={22} w={200} h={28} label="통합 검색 (부분 일치)" fs={11} />
      <Box x={16} y={58} w={200} h={44} label="IP 정확 · 유형 · 기간 필터" tone="accent" fs={11} />
      <Arrow from={[216, 70]} to={[300, 70]} label="좁히기" tone="accent" />
      <Box x={300} y={44} w={164} h={52} label="원하는 로그만" sub="건수 즉시 갱신" fs={11} />
    </Svg>
  );
}

function EvExportArt() {
  return (
    <Svg vb="0 0 480 120">
      <Box x={16} y={40} w={130} h={42} label="필터 결과" fs={11} />
      <Arrow from={[146, 54]} to={[244, 40]} />
      <Box x={244} y={22} w={86} h={28} label="CSV" tone="ok" fs={11} />
      <Arrow from={[146, 70]} to={[244, 84]} />
      <Box x={244} y={72} w={86} h={28} label="JSON" tone="ok" fs={11} />
      <Box x={354} y={40} w={110} h={42} label="원문은 관리자만" tone="warn" fs={11} />
    </Svg>
  );
}

function IpProfileArt() {
  return (
    <Svg vb="0 0 480 140">
      <Box x={16} y={50} w={116} h={44} label="IP 한 개" tone="accent" />
      <Arrow from={[132, 64]} to={[196, 38]} />
      <Box x={196} y={20} w={150} h={30} label="공격 시도 / 피격" tone="danger" fs={11} />
      <Arrow from={[132, 72]} to={[196, 74]} />
      <Box x={196} y={60} w={150} h={30} label="위험도 분포" fs={11} />
      <Arrow from={[132, 80]} to={[196, 110]} />
      <Box x={196} y={98} w={150} h={30} label="시그니처·포트·시간선" fs={11} />
    </Svg>
  );
}

function SigProfileArt() {
  return (
    <Svg vb="0 0 480 140">
      <Box x={16} y={50} w={132} h={44} label="규칙(시그니처) 한 개" tone="accent" fs={11} />
      <Arrow from={[148, 64]} to={[206, 38]} />
      <Box x={206} y={20} w={150} h={30} label="총 건수 · 위험도" fs={11} />
      <Arrow from={[148, 72]} to={[206, 74]} />
      <Box x={206} y={60} w={150} h={30} label="유발 IP Top" tone="danger" fs={11} />
      <Arrow from={[148, 80]} to={[206, 110]} />
      <Box x={206} y={98} w={150} h={30} label="포트 · 시간선" fs={11} />
    </Svg>
  );
}

function CrossArt() {
  return (
    <Svg vb="0 0 480 130">
      <Box x={36} y={48} w={170} h={46} label="IP 분석" tone="accent" />
      <Box x={274} y={48} w={170} h={46} label="시그니처 분석" tone="accent" />
      <Arrow from={[206, 62]} to={[274, 62]} label="시그니처 클릭" />
      <Arrow from={[274, 82]} to={[206, 82]} label="출발지 IP 클릭" />
    </Svg>
  );
}

function IntroSocArt() {
  return (
    <Svg vb="0 0 480 150">
      <Box x={16} y={40} w={90} h={44} label="보안 센서" sub="Suricata" fs={11} />
      <Arrow from={[106, 62]} to={[120, 62]} />
      <Box x={120} y={40} w={84} h={44} label="저장" sub="DB" fs={11} />
      <Arrow from={[204, 62]} to={[218, 62]} />
      <Box x={218} y={40} w={84} h={44} label="서버" sub="가공" fs={11} />
      <Arrow from={[302, 62]} to={[316, 62]} />
      <Box x={316} y={40} w={92} h={44} label="화면" sub="대시보드" tone="accent" fs={11} />
      <Box x={16} y={104} w={448} h={30} label="사용자: 일반 · 관계자 · 관리자 (등급별 열람 범위)" fs={11} />
    </Svg>
  );
}

function IntroTermsArt() {
  return (
    <Svg vb="0 0 480 140">
      <Box x={16} y={30} w={210} h={42} label="IP = 건물 주소" sub="203.0.113.5" tone="accent" fs={12} />
      <Box x={16} y={84} w={210} h={42} label="포트 = 그 건물의 호실" sub="웹 80·443, SSH 22" fs={11} />
      <Box x={254} y={30} w={210} h={42} label="프로토콜 = 대화 언어" sub="HTTP·DNS·TLS" fs={11} />
      <Box x={254} y={84} w={210} h={42} label="NAT = 공동 현관" sub="집 여러 개 → 공인주소 1개" fs={11} />
    </Svg>
  );
}

function HandshakeArt() {
  return (
    <Svg vb="0 0 480 168">
      <Box x={24} y={14} w={130} h={34} label="출발지(src)" tone="accent" fs={11} />
      <Box x={326} y={14} w={130} h={34} label="목적지(dst)" fs={11} />
      <line x1={89} y1={48} x2={89} y2={150} stroke="currentColor" strokeOpacity={0.18} />
      <line x1={391} y1={48} x2={391} y2={150} stroke="currentColor" strokeOpacity={0.18} />
      <Arrow from={[89, 70]} to={[391, 82]} label="① SYN — 연결하자" tone="accent" />
      <Arrow from={[391, 100]} to={[89, 112]} label="② SYN-ACK — 좋다" />
      <Arrow from={[89, 130]} to={[391, 142]} label="③ ACK — 시작" tone="accent" />
    </Svg>
  );
}

function EventTypesArt() {
  return (
    <Svg vb="0 0 480 158">
      <Box x={16} y={18} w={224} h={46} label="alert — 규칙에 걸린 경보" sub="시그니처·위험도 있음" tone="danger" fs={11} />
      <Box x={248} y={18} w={216} h={46} label="anomaly — 형식 이상" sub="프로토콜이 비정상" tone="warn" fs={11} />
      <Box x={16} y={72} w={224} h={46} label="flow — 연결 요약" sub="주고받은 양" tone="accent" fs={11} />
      <Box x={248} y={72} w={216} h={46} label="honeypot — 미끼 상호작용" sub="가장 많음 · 약 54%" tone="ok" fs={11} />
      <Box x={16} y={126} w={448} h={26} label="유형마다 담는 정보가 다릅니다. honeypot엔 시그니처·위험도가 없습니다" fs={11} />
    </Svg>
  );
}

function LayersArt() {
  return (
    <Svg vb="0 0 480 152">
      <Box x={70} y={14} w={340} h={36} label="L7 응용 — HTTP · DNS · TLS" sub="무슨 앱인가" tone="accent" fs={11} />
      <Box x={70} y={58} w={340} h={36} label="L4 전송 — 포트 · TCP / UDP" sub="어느 서비스인가" fs={11} />
      <Box x={70} y={102} w={340} h={36} label="L3 네트워크 — IP 주소" sub="누구에서 누구로" fs={11} />
    </Svg>
  );
}

function TcpUdpArt() {
  return (
    <Svg vb="0 0 480 156">
      <Box x={20} y={16} w={210} h={46} label="TCP — 등기우편" sub="확인·순서 보장" tone="accent" fs={11} />
      <Box x={250} y={16} w={210} h={46} label="UDP — 엽서" sub="빠르지만 보장 없음" tone="warn" fs={11} />
      <Box x={20} y={70} w={210} h={32} label="이체 · 파일 전송 · 웹" fs={10.5} />
      <Box x={250} y={70} w={210} h={32} label="영상통화 · DNS · 게임" fs={10.5} />
      <Box x={20} y={110} w={440} h={28} label="정확성이 중요하면 TCP, 속도가 중요하면 UDP" fs={11} />
    </Svg>
  );
}

function DnsArt() {
  return (
    <Svg vb="0 0 480 138">
      <Box x={16} y={48} w={150} h={44} label="도메인 이름" sub="example.com" tone="accent" fs={11} />
      <Arrow from={[166, 70]} to={[212, 70]} />
      <Box x={212} y={48} w={118} h={44} label="DNS 서버" sub="전화번호부" fs={11} />
      <Arrow from={[330, 70]} to={[376, 70]} />
      <Box x={376} y={48} w={88} h={44} label="IP 주소" sub="203.0.113.5" fs={11} />
      <Box x={16} y={104} w={448} h={26} label="감염 PC도 명령서버(C2) 주소를 DNS로 찾습니다 — 낯선 질의는 단서" tone="danger" fs={11} />
    </Svg>
  );
}

function PermsArt() {
  return (
    <Svg vb="0 0 480 156">
      <rect x={20} y={12} width={440} height={132} rx={10} fill="#2563eb" fillOpacity={0.06} stroke="#2563eb" strokeOpacity={0.5} />
      <text x={38} y={30} fontSize={11} fontWeight={600} fill="#2563eb">관리자 — 로그 원문(payload)까지 전부</text>
      <rect x={46} y={40} width={388} height={96} rx={9} fill="currentColor" fillOpacity={0.04} stroke="currentColor" strokeOpacity={0.3} />
      <text x={64} y={58} fontSize={11} fontWeight={600} fill="currentColor">관계자 — 로그 탐색 · IP · 시그니처 분석</text>
      <rect x={72} y={68} width={336} height={60} rx={8} fill="currentColor" fillOpacity={0.06} stroke="currentColor" strokeOpacity={0.35} />
      <text x={90} y={86} fontSize={11} fontWeight={600} fill="currentColor">일반 — 개요(요약)</text>
      <text x={90} y={106} fontSize={10.5} fill="currentColor" opacity={0.65}>바깥 등급일수록 더 넓게 봅니다</text>
    </Svg>
  );
}

function EtClassArt() {
  const rows: { p: string; m: string; tone: Tone }[] = [
    { p: 'ET SCAN', m: '정찰 — 포트 훑기', tone: 'warn' },
    { p: 'ET DROP', m: '평판 나쁜 출발지 — 차단 권고', tone: 'danger' },
    { p: 'ET MALWARE', m: '악성코드 — C2 · 트로이목마', tone: 'danger' },
    { p: 'ET POLICY', m: '정책 위반 — 평문 로그인 등', tone: 'warn' },
    { p: 'ET INFO', m: '정보성 — 참고(공격 아님)', tone: 'ok' },
    { p: 'SURICATA', m: '엔진 자체 이벤트 — 형식 점검', tone: 'base' },
  ];
  return (
    <Svg vb="0 0 480 178">
      {rows.map((r, i) => {
        const y = 10 + i * 28;
        return (
          <g key={i}>
            <Box x={16} y={y} w={146} h={22} label={r.p} tone={r.tone} fs={10.5} />
            <text x={176} y={y + 15} fontSize={11} fill="currentColor" opacity={0.85}>{r.m}</text>
          </g>
        );
      })}
    </Svg>
  );
}

function SynScanArt() {
  return (
    <Svg vb="0 0 480 168">
      <Box x={24} y={14} w={130} h={34} label="스캐너" sub="공격자" tone="danger" fs={11} />
      <Box x={326} y={14} w={130} h={34} label="대상 : 포트" fs={11} />
      <line x1={89} y1={48} x2={89} y2={150} stroke="currentColor" strokeOpacity={0.18} />
      <line x1={391} y1={48} x2={391} y2={150} stroke="currentColor" strokeOpacity={0.18} />
      <Arrow from={[89, 70]} to={[391, 82]} label="① SYN" tone="danger" />
      <Arrow from={[391, 100]} to={[89, 112]} label="② SYN-ACK = 열림" tone="ok" />
      <Arrow from={[89, 130]} to={[391, 142]} label="③ RST — 연결은 안 맺음(스텔스)" tone="danger" dash />
    </Svg>
  );
}

function ProtoDonutArt() {
  const C = 2 * Math.PI * 44;
  return (
    <Svg vb="0 0 480 158">
      <g transform="translate(96,80)">
        <circle r={44} fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={22} />
        <g transform="rotate(-90)">
          <circle r={44} fill="none" stroke="#2563eb" strokeOpacity={0.85} strokeWidth={22} strokeDasharray={`${C * 0.58} ${C}`} />
          <circle r={44} fill="none" stroke="#94a3b8" strokeOpacity={0.8} strokeWidth={22} strokeDasharray={`${C * 0.28} ${C}`} strokeDashoffset={-C * 0.58} />
          <circle r={44} fill="none" stroke="#ea580c" strokeOpacity={0.8} strokeWidth={22} strokeDasharray={`${C * 0.14} ${C}`} strokeDashoffset={-C * 0.86} />
        </g>
      </g>
      <rect x={186} y={28} width={12} height={12} rx={3} fill="#2563eb" fillOpacity={0.85} />
      <text x={206} y={38} fontSize={11} fill="currentColor" opacity={0.85}>알려진 프로토콜 (TCP·UDP·HTTP·DNS…)</text>
      <rect x={186} y={64} width={12} height={12} rx={3} fill="#94a3b8" fillOpacity={0.85} />
      <text x={206} y={74} fontSize={11} fill="currentColor" opacity={0.85}>unknown — 앱 종류를 못 정함</text>
      <rect x={186} y={100} width={12} height={12} rx={3} fill="#ea580c" fillOpacity={0.85} />
      <text x={206} y={110} fontSize={11} fill="currentColor" opacity={0.85}>failed — 분석 실패</text>
    </Svg>
  );
}

function CmdInjectionArt() {
  return (
    <Svg vb="0 0 480 150">
      <Box x={16} y={46} w={190} h={52} label="입력칸 (URL·폼)" sub="; cat /etc/passwd" tone="danger" fs={11} />
      <Arrow from={[206, 72]} to={[300, 72]} label="명령 끼워넣기" tone="danger" />
      <Box x={300} y={46} w={164} h={52} label="서버 OS 셸" sub="의도치 않은 명령 실행" tone="danger" fs={11} />
      <Box x={16} y={112} w={448} h={28} label="SQL 주입이 DB를 노린다면, 명령 주입은 서버 운영체제를 직접 노립니다" fs={11} />
    </Svg>
  );
}

function DosAmpArt() {
  return (
    <Svg vb="0 0 480 150">
      <Box x={14} y={40} w={120} h={44} label="공격자" sub="출발지=피해자로 위조" tone="danger" fs={10.5} />
      <Arrow from={[134, 62]} to={[196, 62]} label="작은 질의" tone="warn" />
      <Box x={196} y={40} w={110} h={44} label="증폭 서버" sub="DNS · NTP" fs={11} />
      <Arrow from={[306, 62]} to={[368, 62]} label="큰 응답" tone="danger" />
      <Box x={368} y={40} w={98} h={44} label="피해자" sub="대량 수신" tone="danger" fs={11} />
      <Box x={14} y={104} w={452} h={28} label="작은 요청이 큰 응답으로 ‘증폭’되어, 위조된 출발지(피해자)에게 쏟아집니다" tone="danger" fs={11} />
    </Svg>
  );
}

function AttemptSuccessArt() {
  return (
    <Svg vb="0 0 480 150">
      <Box x={16} y={53} w={120} h={44} label="시도 발생" sub="로그인·익스플로잇" tone="warn" fs={11} />
      <Arrow from={[136, 66]} to={[238, 40]} label="실패·차단" tone="ok" />
      <Box x={238} y={22} w={226} h={38} label="Attempted — 시도(실패)" tone="ok" fs={11} />
      <Arrow from={[136, 84]} to={[238, 116]} label="성공 응답·세션 성립" tone="danger" />
      <Box x={238} y={100} w={226} h={38} label="Successful — 성공(침해)" tone="danger" fs={11} />
    </Svg>
  );
}

function MitreArt() {
  const steps = ['정찰', '침투', '실행', '지속', '이동', '목적'];
  return (
    <Svg vb="0 0 480 128">
      {steps.map((s, i) => {
        const w = 72, gap = 6, x = 8 + i * (w + gap);
        return (
          <g key={i}>
            <Box x={x} y={48} w={w} h={40} label={s} tone={i === steps.length - 1 ? 'danger' : 'accent'} fs={12} />
            {i < steps.length - 1 && <Arrow from={[x + w, 68]} to={[x + w + gap, 68]} />}
          </g>
        );
      })}
      <Box x={8} y={98} w={444} h={24} label="공격은 단계로 이어집니다. 어느 단계의 신호인지 알면 다음을 막을 수 있습니다" fs={11} />
    </Svg>
  );
}

function HuntFlowArt() {
  return (
    <Svg vb="0 0 480 138">
      <Box x={16} y={48} w={120} h={44} label="추이 봉우리" sub="언제" tone="accent" fs={11} />
      <Arrow from={[136, 70]} to={[182, 70]} />
      <Box x={182} y={48} w={120} h={44} label="IP 분석" sub="누가" tone="accent" fs={11} />
      <Box x={348} y={48} w={116} h={44} label="시그니처 분석" sub="무엇을" tone="accent" fs={11} />
      <Arrow from={[302, 60]} to={[348, 60]} label="시그니처" />
      <Arrow from={[348, 80]} to={[302, 80]} label="IP" />
      <Box x={16} y={104} w={448} h={26} label="시각 → IP ↔ 시그니처를 오가며 꼬리를 물고 추적" fs={11} />
    </Svg>
  );
}

const MAP: Record<ArtKey, () => JSX.Element> = {
  'intro-soc': IntroSocArt,
  'intro-terms': IntroTermsArt,
  'stun-intro': IntroArt,
  'stun-flow': FlowArt,
  'stun-decision': DecisionArt,
  'ssh-scan': SshScanArt,
  'sqli': SqliArt,
  'trojan': TrojanArt,
  'cleartext': CleartextArt,
  'ov-layout': OvLayoutArt,
  'ov-severity': OvSeverityArt,
  'ev-flow': EvFlowArt,
  'ev-export': EvExportArt,
  'ip-profile': IpProfileArt,
  'sig-profile': SigProfileArt,
  'cross': CrossArt,
  'intro-handshake': HandshakeArt,
  'intro-eventtypes': EventTypesArt,
  'intro-layers': LayersArt,
  'intro-tcpudp': TcpUdpArt,
  'intro-dns': DnsArt,
  'intro-perms': PermsArt,
  'intro-etclass': EtClassArt,
  'syn-scan': SynScanArt,
  'proto-donut': ProtoDonutArt,
  'cmd-injection': CmdInjectionArt,
  'dos-amp': DosAmpArt,
  'attempt-success': AttemptSuccessArt,
  'mitre': MitreArt,
  'hunt-flow': HuntFlowArt,
};

export const ART_CAPTION: Record<ArtKey, string> = {
  'intro-soc': '탐지 로그가 센서 → 저장 → 서버 → 화면으로 흘러 대시보드가 됩니다.',
  'intro-terms': 'IP·포트·프로토콜·NAT를 건물·우편에 빗대어 익혀 둡니다.',
  'stun-intro': '화상회의 같은 정상 통신이 STUN 트래픽을 만들고, 센서가 그것을 ‘정보성’으로 기록합니다.',
  'stun-flow': '기기가 STUN 서버에 물어 ‘바깥에서 보이는 자기 주소’를 받아오는 과정.',
  'stun-decision': '정상이면 끄거나 억제, 비정상 정황이면 출발지·빈도를 확인합니다.',
  'ssh-scan': '한 외부 IP가 여러 대상의 22번 포트가 열렸는지 훑어보는 정찰.',
  'sqli': '입력칸에 조작 명령을 끼워 넣어 데이터베이스를 노리는 공격.',
  'trojan': '감염된 PC가 공격자 서버에 주기적으로 보내는 신호.',
  'cleartext': '비밀번호가 평문으로 흘러 중간에서 그대로 보일 수 있는 상태.',
  'ov-layout': '개요는 위에서 아래로 ‘KPI 숫자 → 그래프·순위 → 개별 경보’ 순으로 봅니다.',
  'ov-severity': '경보 위험도는 높음(가장 심각)·중간·낮음·정보 4단계. 색이 진할수록 위험합니다.',
  'ev-flow': '통합 검색과 정확한 필터로 원하는 로그만 추려, 결과 건수가 바로 갱신됩니다.',
  'ev-export': '추린 결과는 CSV·JSON으로 내보내고, 원문(payload)은 관리자만 볼 수 있습니다.',
  'ip-profile': '주소 하나의 공격 시도·피격·위험도·유발 규칙·포트·시간선을 한 장에.',
  'sig-profile': '규칙 하나가 어디서·어디를·언제 얼마나 잡았는지 한 장에.',
  'cross': '규칙 ↔ IP를 클릭으로 오가며 꼬리에 꼬리를 무는 추적.',
  'intro-handshake': '모든 통신은 출발지 → 목적지. TCP는 SYN·SYN-ACK·ACK 3단계 인사로 연결을 엽니다.',
  'intro-eventtypes': 'alert·anomaly·flow·honeypot — 유형마다 담는 정보가 다릅니다.',
  'intro-layers': 'L3(IP)·L4(포트·TCP/UDP)·L7(HTTP·DNS·TLS)로 역할이 나뉩니다.',
  'intro-tcpudp': 'TCP는 확인·순서를 보장하는 등기우편, UDP는 빠른 엽서입니다.',
  'intro-dns': '도메인 이름을 DNS가 IP로 바꿔 줍니다. 낯선 질의는 감염 단서가 됩니다.',
  'intro-perms': '일반(개요)·관계자(로그·분석)·관리자(원문) 순으로 열람 범위가 넓어집니다.',
  'intro-etclass': '시그니처 이름 앞 분류(ET SCAN·DROP·MALWARE·POLICY·INFO)로 성격을 가늠합니다.',
  'syn-scan': 'SYN만 보내 열림만 확인하고 연결은 맺지 않는 SYN 스텔스 스캔.',
  'proto-donut': '프로토콜 비중 도넛. unknown·failed는 공격이 아니라 판별 상태입니다(비율은 예시).',
  'cmd-injection': 'SQL 주입이 DB를 노린다면, 명령 주입은 서버 운영체제를 직접 노립니다.',
  'dos-amp': '작은 요청이 큰 응답으로 증폭되어, 위조된 출발지(피해자)에게 쏟아집니다.',
  'attempt-success': '응답으로 시도(Attempted)와 성공(Successful)을 가릅니다.',
  'mitre': '공격을 정찰·침투·실행·지속·이동·목적 단계로 나눠 봅니다.',
  'hunt-flow': '추이에서 IP·시그니처로 오가며 꼬리를 물고 추적합니다.',
};

export function LearnArt({ art, className }: { art: ArtKey; className?: string }) {
  const C = MAP[art];
  return (
    <div className={className ?? 'text-slate-500 dark:text-slate-400'}>
      <C />
    </div>
  );
}
