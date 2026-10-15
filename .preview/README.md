# 구현 및 검증 기록

- 원본: Figma WyyIuimjSkURA0lIAoA4FR / 2001:1148 (index).
- 프로젝트에 AGENTS.md가 없으므로 AGENT.md 및 markup-convention.md를 적용.
- 변경: index.html, css/default.css, css/token.css, css/style.css, css/responsive.css, js/main.js.
- 추가 에셋: images/hero, images/figma. Figma 원본 다운로드만 사용했으며 임의 이미지는 생성하지 않음.
- PC/TAB/M 원본 프레임과 상세 디자인, 변수 별칭, 텍스트 스타일 및 효과를 확인. 적용된 효과 없음.
- CSS 구간: 기본 PC, max-width 1200px TAB, max-width 767px M. 중간 구간 없음.
- 프로모션 카드의 h2 레이어는 섹션 제목 하위의 h3로 변환. li>a는 유효한 li > a 구조로 구현.
- 상품명과 가격은 Figma에서 반복되는 원문 그대로 유지.
- Figma 페이지네이션은 1 / 5지만 실제 슬라이드 노드는 두 개뿐이므로 동작과 표시는 1 / 2로 연결.
- 다른 상품 탭에는 제공된 데이터가 없으므로 선택 시 기존 목록의 공간만 유지. 아우터 선택 시 원래 목록 복원.
- 검색, 로그인, 장바구니, 패밀리사이트의 서비스 동작은 정의되지 않아 구현하지 않음. 목적지가 없는 링크는 # 유지.

## 브라우저 검증

Chrome에서 1920, 768, 360px 화면 확인. 비교 스크린샷은 OS 스크롤바 폭을 제외하도록 촬영.

| 너비 | 전체 높이 | 가로 넘침 |
| --- | --- | --- |
| 1920 | 3512 | 없음 |
| 768 | 5050 | 없음 |
| 360 | 3997 | 없음 |

PC 주요 영역 좌표는 원본과 일치: hero y157, categories y712, 신상 y1007, 베스트 y1546, 프로모션 y2325, footer y3092.
모바일 주요 영역 좌표와 높이도 일치. 태블릿의 소수점 폰트 계산은 1px 이내 차이가 있음.
연결된 로컬 파일 45개 존재/비어 있지 않음 확인. 모든 콘텐츠 이미지 로드 성공, JavaScript 구문 검사 통과, 런타임 예외 없음.
report.json의 canceled 이미지 요청 1건은 뷰포트 전환 시 이전 이미지 요청이 취소된 기록이며 이미지 누락이 아님.
슬라이드 이동과 탭 선택/빈 공간 유지 동작 확인.

- screen-1920.png, screen-768.png, screen-360.png: 최종 브라우저 캡처.
- report.json: 브라우저 치수와 이미지/인터랙션 검사 결과.
- inspect.cjs: 로컬 확인용 서버 (node .preview/inspect.cjs).
- check.cjs: 로컬 Chrome 검증 (서버 실행 후 node .preview/check.cjs).
- assets.cjs: 로컬 파일 연결 검사.
