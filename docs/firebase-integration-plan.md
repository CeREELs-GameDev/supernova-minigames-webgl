# Supernova Minigames — Firebase 연동 설계

## 프로젝트 개요

Supernova Minigames는 AI 채팅앱과 연동되는 WebGL 미니게임 플랫폼이다.

- **Unity 프로젝트** (`supernova-minigames`) — 미니게임 개발 및 WebGL 빌드
- **WebGL 랜딩페이지** (`supernova-minigames-webgl`) — 게임 선택 및 실행
- **Firebase 프로젝트** (`supernova-minigames`) — Analytics, Firestore

---

## 접속 경로

### 경로 A: AI 채팅앱 (WebView)
- 앱에서 랜딩페이지를 WebView로 표시하거나, 게임을 직접 실행
- 앱이 유저 정보(ID, 닉네임 등)를 전달
- 리더보드 읽기/쓰기 모두 가능

### 경로 B: 직접 접속 (GitHub Pages)
- URL을 통해 직접 랜딩페이지에 접속
- 유저 식별 불가 (익명)
- 리더보드 조회만 가능, 등록 불가

---

## 시스템 구조

```
┌─────────────────────────────────────────────────────────────┐
│                      AI 채팅앱                               │
│  ┌─────────────┐                                            │
│  │  유저 정보   │──── userId, nickname 등 전달 ─────┐       │
│  └─────────────┘                                    │       │
└─────────────────────────────────────────────────────│───────┘
                                                      │
                                                      ▼
                              ┌──────────────────────────────┐
     GitHub Pages URL ──────► │   WebGL 랜딩페이지            │
     (익명 접속)               │   (index.html)               │
                              │                              │
                              │   ┌────────┐  ┌────────┐    │
                              │   │Game 01 │  │Game 02 │... │
                              │   │(Unity  │  │(Unity  │    │
                              │   │ WebGL) │  │ WebGL) │    │
                              │   └───┬────┘  └────────┘    │
                              └───────│─────────────────────┘
                                      │
                          ┌───────────┴───────────┐
                          ▼                       ▼
                ┌──────────────────┐   ┌──────────────────┐
                │ Firebase         │   │ Firebase         │
                │ Analytics        │   │ Firestore        │
                │                  │   │                  │
                │ - 접속 경로 구분  │   │ - 리더보드       │
                │ - 게임 시작/완료  │   │   (앱 유저만 쓰기)│
                │ - 플레이 시간     │   │ - 게임 통계      │
                │ - 점수 분포      │   │   (익명 집계)     │
                │ - 기기/지역 정보  │   │                  │
                └──────────────────┘   └──────────────────┘
```

---

## Analytics 수집 항목

### 자동 수집 (SDK 기본)
| 항목 | 설명 |
|------|------|
| page_view | 페이지 방문 |
| session_start | 세션 시작 |
| user_engagement | 사용자 참여 시간 |
| 기기/브라우저/OS | 접속 환경 |
| 지역 | 접속 국가/도시 |

### 커스텀 이벤트
| 이벤트 | 파라미터 | 설명 |
|--------|----------|------|
| `game_start` | game_id, source(app/web) | 게임 시작 |
| `game_complete` | game_id, score, play_time | 게임 완료 |
| `game_abandon` | game_id, play_time | 중도 이탈 |
| `leaderboard_view` | game_id | 리더보드 조회 |

---

## Firestore 데이터 구조

```
firestore-root/
│
├── leaderboards/
│   └── {gameId}/                    # 예: "game01"
│       └── scores/                  # 서브컬렉션
│           └── {docId}
│               ├── userId: string
│               ├── nickname: string
│               ├── score: number
│               ├── playTime: number  # 초 단위
│               └── createdAt: timestamp
│
└── gameStats/
    └── {gameId}/                    # 예: "game01"
        ├── totalPlays: number
        └── avgScore: number
```

---

## Firestore 보안 규칙 (초기)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 리더보드: 누구나 읽기, 쓰기는 닫음 (앱 인증 방식 확정 후 열기)
    match /leaderboards/{gameId}/scores/{scoreId} {
      allow read: if true;
      allow write: if false;  // TODO: 앱 인증 확정 후 수정
    }

    // 게임 통계: 누구나 읽기, 쓰기는 서버만
    match /gameStats/{gameId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

---

## 미정 사항 (앱 개발자 논의 필요)

| 항목 | 상태 | 비고 |
|------|------|------|
| 유저 정보 전달 방식 | 미정 | URL 파라미터 / postMessage / JWT 등 |
| 인증 방식 | 미정 | Firebase Auth 토큰 / 커스텀 토큰 등 |
| Unity ↔ JS 점수 전송 | 미정 | WebGL에서 JS 함수 호출로 Firestore에 쓰기 |
| 리더보드 쓰기 권한 조건 | 미정 | 인증 방식에 따라 보안 규칙 변경 |

---

## 즉시 진행 가능한 작업

1. ✅ Firebase Web SDK 연동 (Analytics + Firestore)
2. ✅ Analytics 기본 수집 + 접속 경로 구분 이벤트
3. ✅ Firestore 구조 생성 + 리더보드 읽기 기능
4. ✅ Firestore 보안 규칙 (읽기만 허용)
