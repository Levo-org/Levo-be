# Levo Backend — API 상세 명세

> 모든 API는 `/api/v1` 접두사 사용  
> 인증 필요 API는 🔒 표시  
> 모든 콘텐츠 API는 사용자의 `activeLanguage` 기반으로 필터링됨

---

## 📌 공통 사항

### 표준 응답 형식
```json
// 성공
{
  "success": true,
  "data": { ... },
  "message": "조회 성공"
}

// 에러
{
  "success": false,
  "error": {
    "code": "HEARTS_DEPLETED",
    "message": "하트가 부족합니다."
  }
}

// 페이지네이션
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### 공통 에러 코드
| 코드 | HTTP | 설명 |
|------|------|------|
| `UNAUTHORIZED` | 401 | 인증 토큰 없음/만료 |
| `FORBIDDEN` | 403 | 권한 없음 |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `VALIDATION_ERROR` | 400 | 요청 데이터 유효성 실패 |
| `HEARTS_DEPLETED` | 400 | 하트 0개 상태에서 학습 시도 |
| `LESSON_LOCKED` | 403 | 잠긴 레슨 접근 시도 |
| `INSUFFICIENT_COINS` | 400 | 코인 부족 |
| `ALREADY_PREMIUM` | 400 | 이미 프리미엄 구독 중 |

### 인증 헤더
```
Authorization: Bearer <accessToken>
```

---

## 1. 인증 (Auth)

### POST `/auth/google`
Google OAuth 로그인/회원가입

**Request**
```json
{
  "idToken": "google-oauth-id-token"
}
```

**Response** `200`
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "email": "user@gmail.com",
      "name": "홍길동",
      "profileImage": "https://...",
      "isNewUser": true
    },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ...",
      "expiresIn": 900
    }
  }
}
```

### POST `/auth/apple`
Apple OAuth 로그인/회원가입 (형식 동일)

### POST `/auth/refresh`
**Request**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response** `200`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "expiresIn": 900
  }
}
```

### POST `/auth/logout` 🔒
**Response** `200`
```json
{
  "success": true,
  "message": "로그아웃 완료"
}
```

---

## 2. 사용자 (User)

### GET `/users/me` 🔒
내 프로필 + 현재 언어 프로필 조회

**Response** `200`
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "email": "user@gmail.com",
      "name": "영어 학습자",
      "profileImage": "https://...",
      "activeLanguage": "en",
      "isPremium": false,
      "coins": 350,
      "settings": {
        "dailyGoalMinutes": 10,
        "notificationEnabled": true,
        "notificationHour": 7,
        "soundEnabled": true,
        "effectsEnabled": true
      }
    },
    "languageProfile": {
      "targetLanguage": "en",
      "level": "elementary",
      "xp": 1240,
      "userLevel": 12,
      "hearts": 5,
      "vocabularyProgress": 65,
      "grammarProgress": 40,
      "conversationProgress": 30,
      "listeningProgress": 55,
      "readingProgress": 45,
      "quizProgress": 70
    }
  }
}
```

### PATCH `/users/me` 🔒
프로필 수정

**Request**
```json
{
  "name": "새 닉네임",
  "profileImage": "https://..."
}
```

### PATCH `/users/me/settings` 🔒
설정 변경

**Request**
```json
{
  "dailyGoalMinutes": 15,
  "notificationEnabled": true,
  "notificationHour": 8,
  "soundEnabled": false,
  "effectsEnabled": true
}
```

### PATCH `/users/me/language` 🔒
활성 언어 변경

**Request**
```json
{
  "targetLanguage": "ja"
}
```

**Response** `200` — 해당 언어의 프로필 반환 (없으면 새로 생성)
```json
{
  "success": true,
  "data": {
    "activeLanguage": "ja",
    "languageProfile": {
      "targetLanguage": "ja",
      "level": "beginner",
      "xp": 0,
      "userLevel": 1,
      "hearts": 5,
      "vocabularyProgress": 0,
      "grammarProgress": 0,
      "conversationProgress": 0,
      "listeningProgress": 0,
      "readingProgress": 0,
      "quizProgress": 0
    },
    "isNew": true
  }
}
```

### POST `/users/me/onboarding` 🔒
온보딩 완료 (일괄 처리)

**Request**
```json
{
  "targetLanguage": "en",
  "level": "elementary",
  "dailyGoalMinutes": 10,
  "notificationEnabled": true,
  "notificationHour": 7
}
```

**Response** `201`
```json
{
  "success": true,
  "data": {
    "user": { "..." },
    "languageProfile": { "..." }
  },
  "message": "온보딩 완료! 학습을 시작하세요."
}
```

---

## 3. 단어 (Vocabulary)

### GET `/vocabulary` 🔒
단어 목록 조회 (사용자 활성 언어 기준)

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `status` | string | ❌ | `all`, `learning`, `completed`, `wrong` |
| `chapter` | number | ❌ | 챕터 번호 |
| `page` | number | ❌ | 기본 1 |
| `limit` | number | ❌ | 기본 20 |

**Response** `200`
```json
{
  "success": true,
  "data": {
    "words": [
      {
        "_id": "...",
        "word": "Apple",
        "pronunciation": "[ˈæpəl]",
        "meaning": "사과",
        "partOfSpeech": "명사",
        "level": "beginner",
        "chapter": 1,
        "status": "completed",
        "correctCount": 5,
        "wrongCount": 1
      }
    ],
    "tabs": {
      "all": 30,
      "learning": 12,
      "completed": 15,
      "wrong": 3
    }
  },
  "pagination": { "..." }
}
```

### GET `/vocabulary/flashcards` 🔒
플래시카드 세트 조회 (학습 중인 단어 우선)

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `count` | number | ❌ | 카드 수 (기본 30) |

**Response** `200`
```json
{
  "success": true,
  "data": {
    "cards": [
      {
        "_id": "...",
        "word": "Apple",
        "pronunciation": "[ˈæpəl]",
        "meaning": "🍎 사과",
        "partOfSpeech": "명사 · 기초",
        "exampleSentence": "I eat an apple every day.",
        "exampleTranslation": "나는 매일 사과를 먹어요.",
        "audioUrl": "https://..."
      }
    ],
    "total": 30
  }
}
```

### POST `/vocabulary/:id/answer` 🔒
플래시카드 정답/오답 기록

**Request**
```json
{
  "correct": true
}
```

**Response** `200`
```json
{
  "success": true,
  "data": {
    "wordId": "...",
    "status": "completed",
    "correctCount": 6,
    "wrongCount": 1,
    "xpEarned": 5
  }
}
```

---

## 4. 문법 (Grammar)

### GET `/grammar` 🔒
**Query Parameters**: `level` (선택)

**Response** `200`
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "icon": "🟢",
      "title": "현재형",
      "subtitle": "Simple Present",
      "level": "beginner",
      "progress": 100,
      "status": "completed",
      "locked": false
    }
  ]
}
```

### GET `/grammar/:id` 🔒
**Response** `200` — 핵심 공식 + 예문 + 설명 전체

### GET `/grammar/:id/quiz` 🔒
**Response** `200` — 해당 문법의 퀴즈 문제 목록

### POST `/grammar/:id/quiz/answer` 🔒
**Request**
```json
{
  "quizIndex": 0,
  "selectedAnswer": 1
}
```

**Response** `200`
```json
{
  "success": true,
  "data": {
    "correct": true,
    "correctAnswer": 1,
    "explanation": "주어가 3인칭 단수(She)이므로 \"has\"를 사용합니다.",
    "heartsRemaining": 5,
    "xpEarned": 10
  }
}
```

---

## 5. 회화 (Conversation)

### GET `/conversations` 🔒
상황별 회화 목록

### GET `/conversations/:id` 🔒
대화문 상세

### POST `/conversations/:id/practice` 🔒
발음 연습 결과 저장

**Request**
```json
{
  "dialogIndex": 0,
  "pronunciationScore": 85
}
```

---

## 6. 듣기 (Listening)

### GET `/listening` 🔒
듣기 문제 목록

### POST `/listening/:id/answer` 🔒
**Request**
```json
{
  "answer": "I like to read books"
}
```

**Response** `200`
```json
{
  "success": true,
  "data": {
    "correct": true,
    "correctAnswer": "I like to read books",
    "heartsRemaining": 5,
    "xpEarned": 10
  }
}
```

---

## 7. 읽기 (Reading)

### GET `/reading` 🔒
읽기 지문 목록

### GET `/reading/:id` 🔒
지문 + 퀴즈 상세

### POST `/reading/:id/quiz/answer` 🔒
**Request**
```json
{
  "quizIndex": 0,
  "selectedAnswer": 1
}
```

---

## 8. 레슨 (Lesson)

### GET `/lessons` 🔒
레슨 맵 (유닛별 + 잠금 상태)

**Response** `200`
```json
{
  "success": true,
  "data": {
    "units": [
      {
        "unitNumber": 1,
        "unitTitle": "Unit 1 - 기초 인사",
        "lessons": [
          { "_id": "...", "name": "인사하기", "status": "completed" },
          { "_id": "...", "name": "자기소개", "status": "completed" },
          { "_id": "...", "name": "가족 말하기", "status": "current" },
          { "_id": "...", "name": "직업 표현", "status": "locked" }
        ]
      }
    ]
  }
}
```

### GET `/lessons/:id` 🔒
레슨 미리보기 (새 단어 수, 문법 포인트, 퀴즈 수, 예상 시간)

### POST `/lessons/:id/start` 🔒
레슨 시작 (하트 체크)

### POST `/lessons/:id/complete` 🔒
레슨 완료

**Request**
```json
{
  "score": 80,
  "correctCount": 4,
  "totalQuestions": 5,
  "timeSpentSeconds": 320
}
```

**Response** `200`
```json
{
  "success": true,
  "data": {
    "xpEarned": 120,
    "coinsEarned": 15,
    "streakUpdated": true,
    "currentStreak": 24,
    "newBadges": [],
    "nextLessonUnlocked": true
  }
}
```

---

## 9. 퀴즈 (Quiz)

### GET `/quiz/daily` 🔒
오늘의 종합 퀴즈 (단어+문법+읽기 혼합)

### POST `/quiz/answer` 🔒
개별 문제 정답 제출

### POST `/quiz/complete` 🔒
퀴즈 세션 완료

---

## 10. 복습 (Review)

### GET `/review` 🔒
복습 대시보드

**Response** `200`
```json
{
  "success": true,
  "data": {
    "totalReviewItems": 28,
    "categories": [
      {
        "id": "vocabulary",
        "name": "단어장",
        "emoji": "📖",
        "count": 12,
        "lastReview": "2시간 전",
        "nextReview": "지금 최적!",
        "priority": "urgent",
        "accuracy": 65
      }
    ]
  }
}
```

### GET `/review/:category` 🔒
카테고리별 복습 항목

### POST `/review/:category/complete` 🔒
복습 완료 기록 (다음 복습 시간 계산)

---

## 11. 하트 (Heart)

### GET `/hearts` 🔒
**Response** `200`
```json
{
  "success": true,
  "data": {
    "currentHearts": 3,
    "maxHearts": 5,
    "timeUntilNextRefill": "12분 30초",
    "timeUntilFullRefill": "1시간 42분 30초",
    "isPremium": false
  }
}
```

### POST `/hearts/use` 🔒
하트 1개 소모

### POST `/hearts/refill` 🔒
하트 충전

**Request**
```json
{
  "method": "ad" | "coin_single" | "coin_full"
}
```

---

## 12. 스트릭 (Streak)

### GET `/streak` 🔒
**Response** `200`
```json
{
  "success": true,
  "data": {
    "currentStreak": 23,
    "longestStreak": 45,
    "todayCompleted": true,
    "weeklyRecord": [
      { "date": "2026-02-14", "day": "월", "completed": true, "minutes": 15 },
      { "date": "2026-02-15", "day": "화", "completed": true, "minutes": 20 },
      { "..." : "..." }
    ],
    "streakShields": 2,
    "nextMilestone": { "target": 30, "remaining": 7 },
    "isInDanger": false,
    "hoursUntilReset": 14
  }
}
```

### POST `/streak/shield` 🔒
스트릭 실드 사용

---

## 13. 뱃지 (Badge)

### GET `/badges` 🔒
**Query Parameters**: `category` (선택: `all`, `streak`, `learning`, `level`, `special`)

**Response** `200`
```json
{
  "success": true,
  "data": {
    "achievedCount": 3,
    "totalCount": 9,
    "badges": [
      {
        "_id": "...",
        "emoji": "🔥",
        "name": "7일 챔피언",
        "category": "streak",
        "achieved": true,
        "achievedAt": "2024-01-10T..."
      },
      {
        "_id": "...",
        "emoji": "🔥",
        "name": "30일 챔피언",
        "category": "streak",
        "achieved": false,
        "condition": "30일 연속 학습"
      }
    ]
  }
}
```

---

## 14. 코인 (Coin)

### GET `/coins` 🔒
보유 코인 + 최근 거래 내역

### POST `/coins/earn` 🔒
**Request**
```json
{
  "reason": "ad_watch" | "daily_check" | "friend_invite"
}
```

### POST `/coins/spend` 🔒
**Request**
```json
{
  "item": "heart_single" | "heart_full" | "streak_shield" | "hint_5" | "profile_border",
  "quantity": 1
}
```

---

## 15. 통계 (Stats)

### GET `/stats` 🔒
**Query Parameters**: `period` (`week` | `month` | `all`)

**Response** `200`
```json
{
  "success": true,
  "data": {
    "summary": {
      "currentStreak": 23,
      "totalStudyHours": 48,
      "completedLessons": 142,
      "dailyGoalRate": 85
    },
    "weeklyChart": [
      { "day": "월", "minutes": 15 },
      { "day": "화", "minutes": 20 }
    ],
    "categoryBreakdown": [
      { "name": "단어", "percentage": 30, "color": "#58CC02" },
      { "name": "문법", "percentage": 25, "color": "#1CB0F6" }
    ]
  }
}
```

---

## 16. 구독 (Subscription)

### GET `/subscription` 🔒
현재 구독 상태

### POST `/subscription/subscribe` 🔒
**Request**
```json
{
  "plan": "monthly" | "yearly",
  "receipt": "purchase-receipt-data",
  "platform": "apple" | "google"
}
```

### POST `/subscription/cancel` 🔒
구독 취소

---

## 🏠 홈 화면 집계 API

### GET `/home` 🔒
홈 화면에 필요한 모든 데이터를 한번에 반환

**Response** `200`
```json
{
  "success": true,
  "data": {
    "greeting": "안녕하세요! 오늘도 함께 공부해요 😊",
    "hearts": {
      "current": 5,
      "max": 5,
      "timeUntilRefill": null
    },
    "todayLesson": {
      "progress": 60,
      "completed": 3,
      "total": 5,
      "nextLessonId": "..."
    },
    "streak": {
      "current": 23,
      "isInDanger": false,
      "weeklyRecord": [ ... ]
    },
    "categories": [
      { "id": "vocabulary", "label": "단어장", "progress": 65 },
      { "id": "grammar", "label": "문법", "progress": 40 },
      { "id": "conversation", "label": "회화", "progress": 30 },
      { "id": "listening", "label": "듣기", "progress": 55 },
      { "id": "reading", "label": "읽기", "progress": 45 },
      { "id": "quiz", "label": "퀴즈", "progress": 70 }
    ],
    "state": "normal" | "low-hearts" | "streak-danger"
  }
}
```
