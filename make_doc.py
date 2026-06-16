# -*- coding: utf-8 -*-
"""
Suricata 대시보드 - 새 데이터 이관 작업 기록을 .docx(한글에서 바로 열림)로 생성.
외부 라이브러리 없이 표준 라이브러리(zipfile)만 사용해 OOXML(docx)을 직접 만든다.
"""
import zipfile, os

# ──────────────────────────────────────────────────────────────────────────
# 문서 본문 (간단한 표기로 작성 → 아래에서 docx 문단으로 변환)
#   # 제목 / ## 큰제목 / ### 소제목 / - 목록 / ` 명령어줄 / --- 구분선 / 빈줄 = 간격
# ──────────────────────────────────────────────────────────────────────────
DOC = r"""
# Suricata 보안 로그 대시보드 — 새 데이터 이관(移管) 작업 전체 기록

작성일: 2026-06-15
대상: Suricata IDS 보안 로그 SOC 대시보드
서버: vm120(데이터베이스 서버) · vm121(애플리케이션 서버)
공개 주소: https://logdataset.jsycure.com

---

## 0. 이 문서는 무엇인가요?

이 문서는 "새로 수집한 Suricata 보안 로그(2025년 3~4월) 약 35만 건을, 웹 대시보드에서 볼 수 있도록 데이터베이스에 집어넣는" 작업의 처음부터 끝까지를 순서대로 정리한 기록입니다.

중간에 막혔던 문제와 그 원인, 그리고 어떻게 해결했는지, 실제로 입력한 명령어까지 전부 담았습니다. IT를 잘 모르는 사람도 따라 읽을 수 있도록, 용어부터 쉽게 풀어 설명합니다.

중요: 실제 보안 로그의 "내용"은 외부(작업 보조 AI 포함)에 공개하지 않았습니다. 이 문서에는 데이터의 양·형식·처리 방법만 들어 있고, 로그 본문이나 비밀번호 같은 민감정보는 들어 있지 않습니다.

---

## 1. 먼저 알아둘 용어 (아주 쉽게)

- 서버(VM): 인터넷에 항상 켜져 있는 "남의 자리 컴퓨터"라고 생각하면 됩니다. 우리는 두 대를 사용합니다.
- vm120: 데이터를 보관하는 컴퓨터(= 데이터베이스 서버). 주소 100.104.123.97, 접속 계정 reo1478.
- vm121: 웹사이트(화면)를 돌리는 컴퓨터(= 애플리케이션 서버). 주소 100.125.102.119, 접속 계정 common.
- PostgreSQL: 자료를 표(table) 형태로 저장하는 데이터베이스 프로그램. 우리 로그는 suricata_db 라는 데이터베이스 안의 suricata_logs 라는 표에 저장됩니다.
- 백엔드(Backend): 데이터베이스에서 자료를 꺼내 가공해 주는 "주방" 같은 프로그램. 여기서는 sentinel-api 라는 이름으로 vm121에서 항상 돌아갑니다.
- 프론트엔드(Frontend): 사람이 눈으로 보는 "화면". Vercel이라는 서비스에 올라가 있고, 주소는 logdataset.jsycure.com 입니다.
- JSON: 자료를 적는 텍스트 형식. 새로 받은 데이터는 이 JSON 파일 묶음이었습니다.
- 적재(Load): JSON 파일 안의 내용을 데이터베이스 표 안으로 "집어넣는" 일.
- COPY: PostgreSQL에서 대량의 자료를 한 번에 빠르게 표에 넣는 명령.

---

## 2. 작업 목표 (왜 이 일을 했나)

원래 대시보드에는 기존 데이터 10,911건(2026년 5월치)만 들어 있었습니다. 여기에 새로 만든 2025년 3~4월 보안 로그(대용량)를 추가해서, 실제 데이터가 풍부한 대시보드를 만드는 것이 목표였습니다.

핵심 원칙(작업 내내 지킨 것):
- 기존 10,911건은 절대 삭제하지 않는다. (반드시 보존)
- 실제 데이터 내용과 비밀번호는 외부에 공개하지 않는다.

---

## 3. 큰 그림 (최종 구조)

처음에는 "새 데이터를 vm121로 복사해서 거기 데이터베이스에 넣자"고 생각했습니다. 하지만 논의 끝에 역할을 분명히 나누기로 했습니다.

- vm120 = 데이터를 적재·저장하는 서버 (데이터베이스 본진)
- vm121 = 화면과 백엔드를 돌리는 서버 (앱)
- vm121의 백엔드가 vm120의 데이터베이스에 "원격으로 접속"해서 자료를 읽어온다. (마치 백엔드와 프론트엔드가 분리되어 연결되듯)

그래서 최종 흐름은 이렇게 됩니다:

vm120(PostgreSQL, 35만 건) → vm121 백엔드(sentinel-api)가 원격 접속해서 읽음 → Vercel 화면(logdataset.jsycure.com)에 표시

---

## 4. 1단계 — 새 데이터를 찾기

새 데이터는 데이터베이스가 아니라 "JSON 파일" 형태로, 그것도 다른 사람 계정(jsyeom01)의 홈 폴더에 들어 있었습니다.

- 위치: /home/jsyeom01/json_output/
- 총 용량: 4.9GB, 파일 177개
- 큰 날짜별 파일: Part1~6, Part10, Part11 (각각 46MB ~ 939MB) — 2025-03-24 ~ 04-03 기간의 Suricata 로그
- 작은 조각 파일: Part12~220-attack1.json (각 2~8MB) — 공격 트래픽 조각
- convert_summary.txt (14KB): 변환 기록 메모

이 파일들은 jsyeom01 소유라서, 우리 계정(reo1478)으로는 그냥 못 읽고 sudo(관리자 권한)가 필요했습니다. 이 점이 뒤에서 한 번 문제를 일으킵니다(4-1 참고).

### 4-1. 파일 목록이 안 펼쳐졌던 문제

처음에 적재 반복문을 이렇게 돌렸더니 실패했습니다.

` for f in /home/jsyeom01/json_output/Part*.json; do ... done

원인: 별표(Part*.json)를 펼치는 일은 "내 셸(reo1478)"이 먼저 합니다. 그런데 그 폴더는 jsyeom01 소유라 reo1478가 목록을 못 읽어서, 별표가 안 펼쳐지고 글자 그대로 넘어가 "그런 파일 없음" 오류가 났습니다.

해결: 목록을 관리자(sudo)인 find가 뽑게 했습니다. 그러면 권한 문제 없이 177개가 제대로 나옵니다.

` sudo find /home/jsyeom01/json_output -maxdepth 1 -name 'Part*.json' | wc -l

---

## 5. 2단계 — 구조 결정 (vm120에 적재 + vm121이 원격 연결)

데이터를 vm121로 통째로 옮기는 대신, vm120에 그대로 적재하고 vm121이 원격으로 읽기로 했습니다. 이유:
- 데이터 원본이 vm120에 있으니, 그 자리에서 넣는 게 빠르고 안전.
- 역할 분리(저장은 vm120, 앱은 vm121)가 깔끔.

---

## 6. 3단계 — 디스크 공간 확보 (LVM 확장)

적재를 하려니 vm120의 디스크 여유가 2GB밖에 없었습니다. 새 디스크를 사는 대신, 이미 서버 안에서 "놀고 있던 공간"을 기존 디스크에 합쳐서 늘렸습니다(LVM 확장).

- lvextend 로 남는 공간을 전부 기존 영역에 붙이고
- resize2fs 로 실제 파일시스템 크기를 키움
- 결과: 약 30GB로 확장(기존 사용 영역 + 놀던 영역을 합침), 작업에 충분한 여유 확보

` sudo lvextend -l +100%FREE /dev/매핑경로
` sudo resize2fs /dev/매핑경로

메모리(RAM)는 올리지 않아도 됐습니다. 적재 방식을 "한 건씩 흘려보내는 방식(아래 7단계)"으로 했기 때문에 메모리를 거의 쓰지 않습니다.

---

## 7. 4단계 — 데이터 변환 (convert.py)

받은 JSON은 우리 표(suricata_logs) 구조와 형식이 달라서, 그대로는 못 넣습니다. 그래서 변환 스크립트(vm120의 /home/reo1478/convert.py)를 만들어, JSON을 표에 맞는 형태로 바꿔 출력하게 했습니다.

convert.py가 하는 일(쉽게):
- (1) 대용량 안전 처리: 큰 파일(수백 MB~939MB)을 통째로 메모리에 올리면 서버가 죽습니다. 그래서 ijson 이라는 방식으로 "한 건씩 조금씩 흘려보내며" 처리합니다. 덕분에 메모리를 거의 안 씁니다.
- (2) 구조 변환: 받은 JSON은 alert.severity 처럼 점(.)으로 이어 붙인 납작한 형태였는데, 우리 표가 기대하는 중첩 구조(예: alert 안에 severity)로 바꿔 줍니다.
- (3) 시각 변환: "Mar 29, 2025 @ 23:59:55.050" 같은 사람용 표기를, 컴퓨터 표준 형식(ISO, 한국시간 +0900)으로 바꿉니다.
- (4) 깨짐 방지: 데이터베이스가 거부하는 특수 문자(널 문자, \x00)를 제거합니다.
- (5) 빈 값 정리: "-" 나 빈칸은 "값 없음(NULL)"으로 처리합니다.
- (6) 최종적으로 8개 항목(시각, 종류, 출발지IP, 출발지포트, 목적지IP, 목적지포트, 프로토콜, 원본JSON)을 탭으로 구분해 출력 → 이걸 COPY로 표에 넣습니다.

---

## 8. 5단계 — vm120 데이터베이스에 적재

### 8-1. 시범 적재로 먼저 검증

먼저 파일 1개만 넣어 보고 잘 되는지 확인했습니다. 결과: 시각 누락 0건, 정상. 변환과 적재 방식이 옳다는 걸 확인했습니다.

### 8-2. 전체 적재 (177개 파일)

시범분(2025년)만 지우고(기존 2026년 데이터는 연도 기준으로 보존), 전체를 한 번에 넣었습니다.

` sudo -u postgres psql -d suricata_db -c "DELETE FROM suricata_logs WHERE timestamp LIKE '2025-%';"

` sudo -v
` cd /tmp
` sudo find /home/jsyeom01/json_output -maxdepth 1 -name 'Part*.json' | sort | while IFS= read -r f; do
`   echo ">>> $(basename "$f")"
`   sudo python3 /home/reo1478/convert.py "$f" | sudo -u postgres psql -d suricata_db -c "COPY suricata_logs(timestamp,event_type,src_ip,src_port,dest_ip,dest_port,proto,payload_json) FROM STDIN"
` done

### 8-3. 적재 결과 (성공)

` SELECT count(*) FILTER (WHERE timestamp LIKE '2025-%') AS new_2025,
`        count(*) FILTER (WHERE timestamp LIKE '2026-%') AS old_2026,
`        count(*) FILTER (WHERE timestamp IS NULL)       AS ts_null,
`        count(*) AS total
` FROM suricata_logs;

결과:
- new_2025(새 데이터) = 346,708 건
- old_2026(기존 데이터) = 10,911 건  → 그대로 보존됨
- ts_null(시각 누락) = 0 건
- total(합계) = 357,619 건

### 8-4. 다만, 파일 2개는 원본이 잘려 있었음

Part5 와 Part6 파일은 적재 중 "premature EOF(파일이 중간에서 끊김)" 오류가 났습니다.
- Part5: 40,753건 (형제 파일들이 4~5만 건이라 거의 다 들어감)
- Part6: 3,772건 (원래 4만 건대로 보이는데 약 4만 건이 빠짐)

이건 우리 변환 잘못이 아니라, 원본 JSON 파일 자체가 만들어질 때 중간에서 잘려 있었기 때문입니다(파일을 뽑아낸 쪽의 export가 끊긴 것). convert.py는 읽을 수 있는 데까지 정상 적재한 뒤 멈춘 것입니다.

조치 방향: 35만 건이면 대시보드용으로 충분하므로 그대로 진행하기로 했습니다. 나중에 Part6의 온전한 파일을 다시 받으면, 그 파일 하나만 같은 방식으로 추가 적재하면 됩니다.

---

## 9. 6단계 — 두 서버 연결 (vm120 DB ↔ vm121 백엔드)

이제 vm121의 백엔드가 vm120의 데이터베이스를 원격으로 읽도록 연결했습니다. 작업은 두 군데서 나눠서 합니다.

### 9-1. vm120에서 — 외부 접속 허용 + 읽기전용 계정

- 읽기전용 계정 dashboard_user 의 비밀번호 설정과 읽기 권한 부여 (이 계정은 이미 있어서 새로 만들지 않고 비번만 맞춤)
- vm121(100.125.102.119)만 접속 허용하는 규칙 추가(pg_hba.conf)
- 외부 접속을 받도록 설정(listen_addresses) 후 재시작

` sudo -u postgres psql -d suricata_db -c "ALTER ROLE dashboard_user PASSWORD '영문숫자비번';"
` sudo -u postgres psql -d suricata_db -c "GRANT CONNECT ON DATABASE suricata_db TO dashboard_user;"
` sudo -u postgres psql -d suricata_db -c "GRANT USAGE ON SCHEMA public TO dashboard_user;"
` sudo -u postgres psql -d suricata_db -c "GRANT SELECT ON ALL TABLES IN SCHEMA public TO dashboard_user;"

` echo "host    suricata_db    dashboard_user    100.125.102.119/32    scram-sha-256" | sudo tee -a "$(sudo -u postgres psql -tAc 'SHOW hba_file;')"
` sudo -u postgres psql -c "ALTER SYSTEM SET listen_addresses = '*';"
` sudo systemctl restart postgresql
` sudo ss -tlnp | grep 5432

확인: ss 결과에 0.0.0.0:5432 가 보이면 외부 접속이 열린 것입니다.

### 9-2. vm121에서 — 연결 테스트

백엔드를 건드리기 전에, vm121에서 직접 vm120 데이터베이스에 붙어 보았습니다.

` psql -h 100.104.123.97 -U dashboard_user -d suricata_db -c "SELECT count(*) FROM suricata_logs;"

결과로 357619 가 나와, 원격 연결이 정상임을 확인했습니다.

### 9-3. vm121에서 — 백엔드가 vm120을 보도록 설정

백엔드 설정 파일(.env)에서 데이터베이스 주소를 vm121 자기 자신(localhost)에서 vm120(100.104.123.97)으로 바꾸고 재시작했습니다.

- 파일 위치: /home/common/dashboards/backend/.env
- DB_HOST=localhost  →  DB_HOST=100.104.123.97
- 재시작: sudo systemctl restart sentinel-api

---

## 10. 7단계 — 도중에 터진 문제들과 해결

### 문제 1) .env 비밀번호의 특수문자 때문에 백엔드가 죽음 (웹 502)

증상: 웹에서 로그인하려니 502 Bad Gateway. 백엔드가 계속 죽고 재시작을 반복(재시작 카운터 44).

원인: 백엔드는 시작할 때 설정 파일 .env 를 셸(bash)이 읽습니다(source). 그런데 새로 넣은 비밀번호에 특수문자(백틱 ` 같은 것)가 들어가서 .env 읽기가 통째로 깨졌습니다. 그 바람에 JWT_SECRET 같은 다른 설정값까지 전부 안 읽혀서, 백엔드가 아예 못 떴습니다.

로그에 남은 핵심 메시지:
- .env: line 1: unexpected EOF while looking for matching ` (백틱 짝이 안 맞음)
- JWT_SECRET 환경변수가 비었거나 너무 짧습니다 (위 때문에 설정이 안 읽힘)

해결: 비밀번호를 영문+숫자만(특수문자 없이)으로 바꾸고, 명령으로 안전하게 교체한 뒤, .env가 정상인지 먼저 검사하고 재시작했습니다.

` sed -i 's#^DB_PASSWORD=.*#DB_PASSWORD=영문숫자비번#' .env
` bash -c 'set -a; source .env; set +a; echo SOURCE_OK'
` sudo systemctl restart sentinel-api

SOURCE_OK 가 떠서 .env가 정상임을 확인했고, 백엔드가 정상 기동(active running)했습니다.

교훈: .env 에는 따옴표·특수문자·앞뒤 공백을 넣지 말 것. 비밀번호는 영문+숫자로.

### 문제 2) 로그인은 되는데 데이터가 전부 500 에러

증상: 로그인은 성공(관리자 권한 토큰 발급됨). 그런데 개요·통계 등 데이터 화면이 전부 500 Internal Server Error.

원인 분석(백엔드 코드 확인): 백엔드는 데이터베이스를 두 개 씁니다.
- suricata_db (로그 데이터, 읽기전용) — 이쪽 연결이 실패
- dashboard_app (회원/로그인 정보) — 이쪽은 정상이라 로그인은 됐던 것

그리고 500 난 것 중 "대상 포트 Top"이나 "주요 통신 IP" 같은 쿼리는 복잡한 계산이 전혀 없는 가장 단순한 조회인데도 실패했습니다. 즉 데이터 형식 문제가 아니라, vm120의 로그 데이터베이스에 "접속 자체(비밀번호 인증)"가 안 되는 상태였습니다.

진짜 원인: vm121의 .env에 적은 새 비밀번호와, vm120의 dashboard_user 실제 비밀번호가 서로 달랐습니다(한쪽만 바꿔서 어긋남).

### 해결) 양쪽 비밀번호를 똑같이 맞추기

vm120과 vm121 양쪽에 동일한 영문+숫자 비밀번호를 다시 설정했습니다.

` (vm120) sudo -u postgres psql -d suricata_db -c "ALTER ROLE dashboard_user PASSWORD '같은영문숫자비번';"
` (vm121) sed -i 's/^DB_PASSWORD=.*/DB_PASSWORD=같은영문숫자비번/' ~/dashboards/backend/.env
` (vm121) sudo systemctl restart sentinel-api

그리고 백엔드가 실제로 쓰는 비밀번호로 직접 접속이 되는지 확인했습니다(.env 값을 그대로 사용).

` PGPASSWORD=$(grep '^DB_PASSWORD=' ~/dashboards/backend/.env | cut -d= -f2-) psql -h 100.104.123.97 -U dashboard_user -d suricata_db -c "SELECT count(*) FROM suricata_logs;"

이 명령에서 357619 가 나오면 자격증명이 정상이고, 웹사이트의 "총 이벤트"도 357,619 로 표시됩니다.

---

## 11. 현재 상태와 남은 일

- vm120 데이터베이스: 새 데이터 적재 완료(총 357,619건, 기존 10,911건 보존).
- vm120 ↔ vm121: 원격 연결 설정 및 직접 접속 테스트(357619) 완료.
- 마지막 마무리: 양쪽 비밀번호를 동일하게 맞추고 백엔드 재시작 → 웹에서 "총 이벤트 357,619" 확인.
- 추후(선택): 원본이 잘렸던 Part6(약 4만 건)를 온전한 파일로 다시 받으면 그 파일만 추가 적재.

---

## 12. 전체 명령어 모음 (그대로 복붙용 런북)

### A. vm120 — 적재
` # (시범분만 삭제, 기존 2026년 보존)
` sudo -u postgres psql -d suricata_db -c "DELETE FROM suricata_logs WHERE timestamp LIKE '2025-%';"
` # (전체 적재: 177개 파일)
` sudo -v
` cd /tmp
` sudo find /home/jsyeom01/json_output -maxdepth 1 -name 'Part*.json' | sort | while IFS= read -r f; do
`   echo ">>> $(basename "$f")"
`   sudo python3 /home/reo1478/convert.py "$f" | sudo -u postgres psql -d suricata_db -c "COPY suricata_logs(timestamp,event_type,src_ip,src_port,dest_ip,dest_port,proto,payload_json) FROM STDIN"
` done
` # (검증)
` sudo -u postgres psql -d suricata_db -c "SELECT count(*) FILTER (WHERE timestamp LIKE '2025-%') new_2025, count(*) FILTER (WHERE timestamp LIKE '2026-%') old_2026, count(*) FILTER (WHERE timestamp IS NULL) ts_null, count(*) total FROM suricata_logs;"

### B. vm120 — 외부 접속 허용 + 계정
` sudo -u postgres psql -d suricata_db -c "ALTER ROLE dashboard_user PASSWORD '영문숫자비번';"
` sudo -u postgres psql -d suricata_db -c "GRANT CONNECT ON DATABASE suricata_db TO dashboard_user;"
` sudo -u postgres psql -d suricata_db -c "GRANT USAGE ON SCHEMA public TO dashboard_user;"
` sudo -u postgres psql -d suricata_db -c "GRANT SELECT ON ALL TABLES IN SCHEMA public TO dashboard_user;"
` echo "host    suricata_db    dashboard_user    100.125.102.119/32    scram-sha-256" | sudo tee -a "$(sudo -u postgres psql -tAc 'SHOW hba_file;')"
` sudo -u postgres psql -c "ALTER SYSTEM SET listen_addresses = '*';"
` sudo systemctl restart postgresql
` sudo ss -tlnp | grep 5432

### C. vm121 — 연결 테스트 + 백엔드 전환
` psql -h 100.104.123.97 -U dashboard_user -d suricata_db -c "SELECT count(*) FROM suricata_logs;"
` cd /home/common/dashboards/backend
` cp .env .env.bak
` sed -i 's#^DB_HOST=.*#DB_HOST=100.104.123.97#' .env
` sed -i 's#^DB_PASSWORD=.*#DB_PASSWORD=영문숫자비번#' .env
` bash -c 'set -a; source .env; set +a; echo SOURCE_OK'
` sudo systemctl restart sentinel-api
` PGPASSWORD=$(grep '^DB_PASSWORD=' .env | cut -d= -f2-) psql -h 100.104.123.97 -U dashboard_user -d suricata_db -c "SELECT count(*) FROM suricata_logs;"

### D. 문제 생기면 (백엔드 로그 보기 / 원복)
` systemctl status sentinel-api --no-pager
` sudo journalctl -u sentinel-api -n 50 --no-pager
` # (.env 되돌리기)
` cd ~/dashboards/backend && cp .env.bak .env && sudo systemctl restart sentinel-api

---

## 13. 자주 나온 에러와 그 의미

- 502 Bad Gateway: Vercel(화면)이 백엔드에 못 닿음 = 백엔드가 죽었거나 통로가 끊김. 보통 .env 문제로 백엔드가 안 떠서 발생.
- 500 Internal Server Error: 백엔드는 살아 있는데, 자료를 꺼내다가 안에서 터짐. 여기서는 vm120 데이터베이스 비밀번호 불일치가 원인.
- premature EOF: JSON 파일이 중간에서 끊겨 있음(원본 파일 자체의 문제).
- unexpected EOF while looking for matching `: .env에 특수문자가 들어가 설정 읽기가 깨짐.
- password authentication failed: 비밀번호 불일치.
- could not change directory to ...: psql이 현재 폴더에 못 들어가서 뜨는 무해한 경고(무시 가능).

---

## 14. 꼭 지킬 주의사항

- 실제 데이터 내용·데이터베이스 비밀번호·API 키는 외부에 절대 공유하지 않는다.
- 기존 데이터는 삭제하지 않는다(연도 기준으로 새 것만 다루기).
- .env 파일에는 따옴표·특수문자·앞뒤 공백을 넣지 않는다. 비밀번호는 영문+숫자.
- vm120과 vm121의 dashboard_user 비밀번호는 항상 동일해야 한다.
- 큰 파일은 한 건씩 흘려보내는 방식(ijson)으로 처리해 메모리 고갈을 피한다.

---

## 15. 작업 일지 (날짜별)

### 2026-06-15 — 데이터 이관·서버 전환·대시보드 보강
- 새 데이터 357,619건을 vm120 데이터베이스에 적재(기존 10,911건 보존). T-Pot 허니팟 데이터.
- 서버 구조 전환: vm120=데이터베이스 서버, vm121=애플리케이션 서버. vm121 백엔드가 vm120 DB에 원격 접속하도록 변경(pg_hba·listen_addresses·dashboard_user·.env의 DB_HOST).
- 장애 해결: .env 비밀번호의 특수문자 때문에 백엔드가 기동 실패(502 Bad Gateway)하던 문제를, 영문+숫자 비밀번호와 vm120·vm121 양쪽 동기화로 해결.
- 포트 복구: 새 데이터의 목적지 포트가 비어 있던 것을 payload_json의 flow.dest_port에서 backfill하여 281,445행·고유 포트 33,167개 복구. 프로토콜(proto) 일부도 보강.
- 차트 수정: 이벤트 추이의 누적 영역이 끊겨 보이던 버그(유형값 0 채움 + 상위 8개 표시), 위험도 분포 범례를 1·2·3에서 높음·중간·낮음으로, 프로토콜 도넛의 빈 값을 unknown으로 정리.
- 학습하기 개편 시작: 단계 잠금제(입문 → 기초 → 심화, 시험 20문제 중 80% 이상 통과 시 다음 단계 해금), 입문 18개 학습 항목 + 문제 57개(상세 해설 포함), 퀴즈 연습/시험 모드, 문제별 오답노트(자동 저장), 이론을 끝까지 읽으면 자동 완료 표시, 콘텐츠 파일 모듈화.

### 2026-06-16 — 기초 콘텐츠·검증 규칙·작업 기록
- 기초 학습 항목 24개(이론) 작성. 구성: 화면·운영 8개, 정찰 5개(SSH 스캔·NMAP -sS·RDP 스캔·Nmap User-Agent·스캔 분류), 평판·정책 3개, SURICATA 엔진 이벤트 1개, 분류 읽기 2개(classtype 개념·모호한 분류), 주요 서비스 5개(SIP·Telnet/FTP·SMB·VNC·프로토콜 비중 읽기).
- 기초 문제 24개(4지선다·상세 해설) 작성하고 시험 모드 작동을 확인(이후 100문제로 보강 예정).
- 보기 수 규칙 적용 시작: 입문 3지선다 · 기초 4지선다 · 심화 5지선다.
- 품질 검증 체계 도입: 변경할 때마다 구조 점검(스크립트)·빌드·문체(이모지와 AI 특유 말투 제거)를 3회 이상 교차 검증. 사실 검증 과정에서 분류 항목의 오해 소지 표기 1건을 수정.
- 이 작업 일지를 본 문서에 추가.

### 이후 진행 예정
- 기초 문제 24개 → 100개, 심화 32개 항목 + 문제 100개(5지선다), 입문 문제 57개 → 100개.
- 백엔드 기능: 서버 채점, 진도·오답노트 동기화, 학습 분석 대시보드, 실제 데이터 기반 동적 문제(프론트엔드 완료 후 일괄 적용).
- 학습 화면 개선: 오답노트 모아보기, 다음/이전 항목 이동, 용어집, 사례 연구(워크스루) 등.

---

(문서 끝) — 이 파일은 한글(HWP)에서 바로 열 수 있으며, 한글에서 "다른 이름으로 저장 → 한글 문서(.hwp)"로도 변환할 수 있습니다.
"""

# ──────────────────────────────────────────────────────────────────────────
# docx 생성기 (표준 라이브러리만 사용)
# ──────────────────────────────────────────────────────────────────────────
W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

def para(text, *, size=20, bold=False, color=None, font='맑은 고딕',
         shade=None, before=0, after=80, indent=0):
    rpr = ['<w:rFonts w:ascii="%s" w:eastAsia="%s" w:hAnsi="%s"/>' % (font, font, font)]
    if bold:
        rpr.append('<w:b/>')
    if color:
        rpr.append('<w:color w:val="%s"/>' % color)
    rpr.append('<w:sz w:val="%d"/><w:szCs w:val="%d"/>' % (size, size))
    ppr = ['<w:spacing w:before="%d" w:after="%d"/>' % (before, after)]
    if indent:
        ppr.append('<w:ind w:left="%d"/>' % indent)
    if shade:
        ppr.append('<w:shd w:val="clear" w:color="auto" w:fill="%s"/>' % shade)
    return ('<w:p><w:pPr>%s</w:pPr><w:r><w:rPr>%s</w:rPr>'
            '<w:t xml:space="preserve">%s</w:t></w:r></w:p>'
            % (''.join(ppr), ''.join(rpr), esc(text)))

def blank():
    return '<w:p><w:pPr><w:spacing w:before="0" w:after="40"/></w:pPr></w:p>'

paras = []
for raw in DOC.split('\n'):
    line = raw.rstrip()
    if line == '':
        paras.append(blank())
    elif line.startswith('### '):
        paras.append(para(line[4:], size=24, bold=True, color='2563EB', before=180, after=80))
    elif line.startswith('## '):
        paras.append(para(line[3:], size=28, bold=True, color='1F3864', before=240, after=100))
    elif line.startswith('# '):
        paras.append(para(line[2:], size=36, bold=True, color='1F3864', before=80, after=160))
    elif line.startswith('- '):
        paras.append(para('•  ' + line[2:], size=20, after=40, indent=300))
    elif line.startswith('` '):
        paras.append(para(line[2:], size=18, font='Consolas', shade='F2F2F2',
                          after=0, indent=200))
    elif line.strip() == '---':
        paras.append('<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" '
                     'w:space="1" w:color="BBBBBB"/></w:pBdr></w:pPr></w:p>')
    else:
        paras.append(para(line, size=20, after=80))

sectpr = ('<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
          '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" '
          'w:header="709" w:footer="709" w:gutter="0"/></w:sectPr>')

document_xml = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    '<w:document xmlns:w="%s"><w:body>%s%s</w:body></w:document>'
    % (W, ''.join(paras), sectpr)
)

content_types = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    '<Default Extension="xml" ContentType="application/xml"/>'
    '<Override PartName="/word/document.xml" '
    'ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
    '</Types>'
)

rels = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rId1" '
    'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" '
    'Target="word/document.xml"/></Relationships>'
)

out = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                   'Suricata_데이터이관_작업기록.docx')
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('[Content_Types].xml', content_types)
    z.writestr('_rels/.rels', rels)
    z.writestr('word/document.xml', document_xml)

print('OK:', out)
print('size:', os.path.getsize(out), 'bytes')
