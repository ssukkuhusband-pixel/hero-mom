# QA 리포트

## 테스트 환경
- Node.js: v25.5.0
- npm: 11.8.0
- Next.js: 16.1.6 (Turbopack)
- React: 19.2.3
- Tailwind CSS: v4
- OS: macOS (Darwin 25.3.0)

## 빌드 결과
- npm install: PASS (의존성 정상 설치)
- npm run build: PASS (컴파일 에러 없음, ~1.9초)
- npm run dev: PASS (335ms 내 시작, HTTP 200 응답 확인)

## 동작 테스트 결과

| 항목 | 결과 | 비고 |
|------|------|------|
| 게임 시작 | PASS | GameProvider 초기화, 2초 틱 인터벌 정상 |
| 아들 AI 행동 결정 | PASS | 배고픔/HP 기반 의사결정 트리 정상 |
| 아들 출발 → 모험 전환 | PASS (수정 후) | 버그 #1 수정으로 DEPARTING → startAdventure 정상 연결 |
| 모험 진행 (편지, 전투) | PASS | 시간 기반 진행, 편지 생성, 전투 결과 누적 |
| 모험 귀환 모달 | PASS (수정 후) | 버그 #2 수정으로 귀환 시 보상/전투 요약 정상 표시 |
| 대장간 제작 | PASS | 레시피 확인, 재료 소비, 장비 생성 |
| 대장간 강화 | PASS | 강화석/골드 소비, 성공/실패 분기, LOAD_STATE 활용 |
| 대장간 가챠 | PASS | 특수 광석 소비, 등급 확률 적용 |
| 주방 요리 | PASS | 재료 소비, 음식 생성 |
| 연금술 양조 | PASS | 잠금 해제 조건 확인, 포션 생성 |
| 농장 심기/수확 | PASS | 씨앗 소비, 실시간 성장 진행, 수확 보상 |
| 가구 배치 (식탁/포션/책/장비) | PASS | 인벤토리 → 가구 이동, 슬롯 제한 |
| 인벤토리 모달 | PASS | 5탭 정상 표시, 장비 상세 |
| 레벨업/해금 | PASS | EXP 누적, 연금술/강화/가챠 해금 조건 |
| 화면 전환 (하단 내비) | PASS | 5개 탭 전환, 잠금 탭 비활성화 |
| localStorage 저장/불러오기 | PASS | 상태 자동 저장, 새로고침 시 복구 |
| 토스트 알림 | PASS | 제작/강화/요리 완료 시 피드백 |
| 콘솔 에러 | PASS | Critical/Warning 에러 없음 |

## 발견된 버그 및 수정

| # | 버그 설명 | 심각도 | 수정 시도 | 결과 | 수정 내용 |
|---|----------|--------|----------|------|----------|
| 1 | DEPARTING 완료 후 모험 시작 불가 - processSonTick이 actionTimer=0 도달 시 currentAction을 IDLE로 리셋하여 processTick의 DEPARTING 감지 로직이 작동하지 않음 | High | 1/3 | 해결 | `sonAI.ts`: DEPARTING 액션 타이머 완료 시 IDLE 리셋을 건너뛰고 early return하여, 다음 틱에서 processTick이 DEPARTING+timer=0을 감지하고 startAdventure를 호출하도록 수정 |
| 2 | ReturnModal에 모험 결과 미표시 - completeAdventure가 adventure를 null로 설정한 후 ReturnModal이 열리므로, 모달이 읽는 adventure 데이터가 없음 | High | 1/3 | 해결 | `types.ts`: AdventureResult 인터페이스 추가, GameState에 lastAdventureResult 필드 추가. `adventure.ts`: completeAdventure에서 adventure를 null로 설정하기 전에 결과를 lastAdventureResult에 저장. `ReturnModal.tsx`: adventure 대신 lastAdventureResult에서 데이터 읽기. `constants.ts`: INITIAL_GAME_STATE에 lastAdventureResult: null 추가 |
| 3 | 장비대 하이라이트 조건 오류 - HomePage에서 장비대의 highlight가 `activeFurniture === 'door'`로 잘못 설정됨 | Low | 1/3 | 해결 | `HomePage.tsx`: 장비대의 highlight를 `false`로 변경 (아들이 장비대와 직접 상호작용하는 액션이 없으므로) |

## 추가 발견 사항 (수정 불필요)

| # | 항목 | 설명 | 판단 |
|---|------|------|------|
| 1 | 과도한 structuredClone | processTick → processSonTick/startAdventure → processAdventureTick 각 단계에서 중복 클로닝 발생 (최대 3회/틱) | 성능 이슈. 프로토타입 단계에서는 무시 가능 |
| 2 | sonAI READING 시 inventory.books에서 중복 제거 시도 | placeBook에서 이미 inventory.books에서 제거했으므로 findIndex가 항상 -1 반환 | 동작에 영향 없는 데드코드 |
| 3 | INITIAL_GAME_STATE의 lastTickAt: Date.now() | 모듈 로드 시점 타임스탬프가 저장되나, 첫 틱에서 즉시 갱신됨 | 실질적 영향 없음 |
| 4 | require() 사용 (sonAI.ts checkLevelUp/checkUnlocks) | 순환 의존성 방지를 위한 동적 require. Next.js 번들러에서 정상 동작 | 빌드/런타임 문제 없음 확인 |

## QA 체크리스트

### 빌드
- [x] npm install 성공
- [x] npm run build 성공 (에러 없음)
- [x] npm run dev 정상 실행

### 핵심 동작
- [x] 게임 시작 가능
- [x] 코어 루프 한 사이클 완료 가능 (아들 행동 → 출발 → 모험 → 귀환)
- [x] 승리/패배 조건 동작 (모험 성공/실패, HP 0 시 보상 50% 감소)
- [x] 화면 전환 정상 (집/대장간/주방/연금술/농장)

### UI/UX
- [x] 모든 버튼/인터랙션 반응
- [x] 레이아웃 깨짐 없음 (480px 모바일 뷰 기준)
- [x] 이미지/에셋 정상 로딩 (CSS/이모지 기반 폴백 사용)

### 콘솔
- [x] Critical 에러 없음
- [x] Warning 최소화

## 최종 판정
- [x] 프로토타입 정상 동작 확인
- 잔여 이슈: 없음 (모든 발견 버그 수정 완료)
- 비고: 2건의 High 심각도 버그 (모험 출발 불가, 귀환 모달 빈 데이터)를 수정하여 코어 루프의 핵심 사이클이 정상 작동하도록 함
