## 🎹 프로젝트 정의서: 피아노 독학용 실시간 피드백 앱

### **1. 프로젝트 개요**

* **목표:** 사용자가 업로드한 MusicXML 악보와 실시간 피아노 연주를 비교하여, 틀린 음표를 악보 위에 즉각적으로(빨간색/초록색) 표시하는 아이패드 앱 개발.
* **핵심 철학:** 서버 없이 아이패드 기기 자체(On-device)에서 모든 오디오 분석을 처리하며, 완전 무료 오픈소스 라이브러리만 사용함.

### **2. 기술 스택 (Tech Stack)**

* **Framework:** Next.js (App Router 추천)
* **Language:** TypeScript
* **Audio Analysis:** Web Audio API + `Pitchy` (라이브러리)
* **Music Rendering:** `OpenSheetMusicDisplay (OSMD)`
* **Platform:** iOS/iPadOS (SwiftUI `WebView`를 통해 래핑)
* **Development Tool:** Google Antigravity (Coding Agent), Mac mini (Build), iPad (Test)

### **3. 시스템 아키텍처 및 요구사항**

1. **악보 렌더링:** 사용자가 MusicXML 파일을 선택하면 OSMD를 통해 웹 화면에 악보를 렌더링함.
2. **실시간 피치 트래킹:** * 브라우저의 마이크 권한을 획득하여 실시간 오디오 스트림 분석.
* `Pitchy`를 사용하여 현재 주파수()를 추출하고 이를 음계( 등)로 변환.


3. **비교 로직 (Score-to-Audio Alignment):**
* 현재 악보에서 연주되어야 할 음표(Target Note)의 위치를 추적.
* 실시간 인식된 음과 악보의 음이 일치하면 다음 음표로 커서 이동 및 초록색 하이라이트.
* 틀릴 경우 해당 음표를 빨간색으로 변경하고 피드백 제공.


4. **On-device 환경:** 별도의 백엔드 없이 클라이언트 사이드에서 모든 로직 수행.

### **4. 단계별 구현 지침 (Instructions)**

* **Phase 1:** Next.js 프로젝트 초기 설정 및 마이크 입력 주파수 시각화 대시보드 구축.
* **Phase 2:** MusicXML 파일을 로드하여 화면에 렌더링하는 OSMD 컴포넌트 구현.
* **Phase 3:** 주파수 데이터를 음계 데이터로 맵핑하고, 악보의 음표 객체(Note Object)와 실시간 대조하는 싱크 엔진 개발.
* **Phase 4:** SwiftUI `WebView`를 사용하여 아이패드 전체 화면 앱으로 빌드 및 권한(마이크) 설정.