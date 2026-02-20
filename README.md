# Levo Backend

> **Levo** — "Elevate + Vocab" | 언어로 나를 끌어올리다  
> Duolingo 스타일의 외국어 학습 앱 백엔드 서버

---

## 📌 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **런타임** | Node.js (v20+) |
| **프레임워크** | Express.js |
| **데이터베이스** | MongoDB (Mongoose ODM) |
| **인증** | JWT + OAuth 2.0 (Google, Apple) |
| **언어** | TypeScript |
| **API 스타일** | RESTful JSON API |
| **문서화** | Swagger (OpenAPI 3.0) |

---

## 🏗️ 아키텍처 개요

```
Client (React App)
    │
    ▼
┌─────────────────────────────────────────┐
│            API Gateway (Express)        │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ │
│  │  Auth   │ │  Rate    │ │  CORS    │ │
│  │Middleware│ │ Limiter  │ │  Setup   │ │
│  └─────────┘ └──────────┘ └──────────┘ │
├─────────────────────────────────────────┤
│              Route Layer                │
│  /api/v1/auth  /api/v1/users  ...      │
├─────────────────────────────────────────┤
│            Controller Layer             │
│  (요청 검증, 응답 포맷팅)                 │
├─────────────────────────────────────────┤
│             Service Layer               │
│  (비즈니스 로직, 게이미피케이션 규칙)       │
├─────────────────────────────────────────┤
│              Model Layer                │
│  (Mongoose Schema & Methods)           │
├─────────────────────────────────────────┤
│              MongoDB                    │
│  ┌────────┐ ┌────────┐ ┌────────────┐  │
│  │ Users  │ │Contents│ │  Progress  │  │
│  └────────┘ └────────┘ └────────────┘  │
└─────────────────────────────────────────┘
```

---

## 🌍 다국어 콘텐츠 설계 (핵심 원칙)

**모든 학습 콘텐츠는 `targetLanguage` (학습 대상 언어) 기준으로 완전히 독립적으로 동작합니다.**

### 원칙
1. **언어별 독립 콘텐츠**: 단어, 문법, 회화, 듣기, 읽기 콘텐츠는 각 `targetLanguage` 별로 별도 도큐먼트로 관리
2. **언어별 독립 진행도**: 사용자의 학습 진행도, 레슨 잠금 해제, XP 등은 언어별로 독립 추적
3. **언어 전환 가능**: 사용자가 언어를 변경하면 해당 언어의 진행 상태로 전환 (기존 진행도 보존)
4. **모든 쿼리에 언어 필터**: API 호출 시 `targetLanguage` 파라미터 또는 사용자의 현재 활성 언어 기준으로 필터링

### 예시 흐름
```
사용자 A: 영어 학습 중 → 단어장 요청
  → DB 조회: { targetLanguage: 'en', level: 'beginner' }
  → 영어 단어만 반환

사용자 A: 일본어로 변경 → 단어장 요청
  → DB 조회: { targetLanguage: 'ja', level: 'beginner' }
  → 일본어 단어만 반환 (영어 진행도는 그대로 보존)
```

---

## 📁 디렉토리 구조

```
Levo-be/
├── src/
│   ├── app.ts                    # Express 앱 설정
│   ├── server.ts                 # 서버 진입점
│   ├── config/
│   │   ├── index.ts              # 환경 변수 설정
│   │   ├── database.ts           # MongoDB 연결
│   │   └── swagger.ts            # Swagger 설정
│   ├── middleware/
│   │   ├── auth.ts               # JWT 인증 미들웨어
│   │   ├── validate.ts           # 요청 유효성 검사
│   │   ├── errorHandler.ts       # 글로벌 에러 핸들러
│   │   └── rateLimiter.ts        # API 요청 제한
│   ├── models/
│   │   ├── User.ts               # 사용자 모델
│   │   ├── UserLanguageProfile.ts# 사용자 언어별 프로필
│   │   ├── Vocabulary.ts         # 단어 콘텐츠
│   │   ├── Grammar.ts            # 문법 콘텐츠
│   │   ├── Conversation.ts       # 회화 콘텐츠
│   │   ├── Listening.ts          # 듣기 콘텐츠
│   │   ├── Reading.ts            # 읽기 콘텐츠
│   │   ├── Lesson.ts             # 레슨 구성
│   │   ├── Quiz.ts               # 퀴즈 문제
│   │   ├── UserProgress.ts       # 사용자 학습 진행도 (언어별)
│   │   ├── UserStreak.ts         # 스트릭 기록
│   │   ├── UserBadge.ts          # 뱃지 획득 기록
│   │   ├── Badge.ts              # 뱃지 정의
│   │   ├── CoinTransaction.ts    # 코인 거래 내역
│   │   └── Subscription.ts       # 프리미엄 구독
│   ├── routes/
│   │   ├── index.ts              # 라우터 통합
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── vocabulary.routes.ts
│   │   ├── grammar.routes.ts
│   │   ├── conversation.routes.ts
│   │   ├── listening.routes.ts
│   │   ├── reading.routes.ts
│   │   ├── lesson.routes.ts
│   │   ├── quiz.routes.ts
│   │   ├── review.routes.ts
│   │   ├── streak.routes.ts
│   │   ├── badge.routes.ts
│   │   ├── coin.routes.ts
│   │   ├── stats.routes.ts
│   │   └── subscription.routes.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── vocabulary.controller.ts
│   │   ├── grammar.controller.ts
│   │   ├── conversation.controller.ts
│   │   ├── listening.controller.ts
│   │   ├── reading.controller.ts
│   │   ├── lesson.controller.ts
│   │   ├── quiz.controller.ts
│   │   ├── review.controller.ts
│   │   ├── streak.controller.ts
│   │   ├── badge.controller.ts
│   │   ├── coin.controller.ts
│   │   ├── stats.controller.ts
│   │   └── subscription.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── vocabulary.service.ts
│   │   ├── grammar.service.ts
│   │   ├── conversation.service.ts
│   │   ├── listening.service.ts
│   │   ├── reading.service.ts
│   │   ├── lesson.service.ts
│   │   ├── quiz.service.ts
│   │   ├── review.service.ts       # 간격 반복 알고리즘
│   │   ├── streak.service.ts
│   │   ├── badge.service.ts
│   │   ├── coin.service.ts
│   │   ├── heart.service.ts        # 하트 소모/충전 로직
│   │   ├── stats.service.ts
│   │   └── subscription.service.ts
│   ├── utils/
│   │   ├── ApiError.ts             # 커스텀 에러 클래스
│   │   ├── ApiResponse.ts          # 표준 응답 포맷
│   │   ├── constants.ts            # 상수 정의
│   │   └── helpers.ts              # 유틸 함수
│   └── types/
│       ├── express.d.ts            # Express 타입 확장
│       └── index.ts                # 공통 타입 정의
├── tests/
│   ├── unit/
│   └── integration/
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 📊 데이터베이스 스키마 설계

### 1. User (사용자)
```
{
  _id: ObjectId,
  email: String (unique),
  name: String,
  profileImage: String,
  provider: 'google' | 'apple' | 'email',
  providerId: String,
  
  // 현재 활성 학습 언어
  activeLanguage: String,           // 'en' | 'ja' | 'zh'
  
  // 설정
  settings: {
    dailyGoalMinutes: Number,       // 5 | 10 | 15 | 20
    notificationEnabled: Boolean,
    notificationHour: Number,       // 0-23
    soundEnabled: Boolean,
    effectsEnabled: Boolean,
  },
  
  // 글로벌 (언어 무관)
  isPremium: Boolean,
  premiumExpiresAt: Date,
  coins: Number,
  
  createdAt: Date,
  updatedAt: Date,
}
```

### 2. UserLanguageProfile (사용자 언어별 프로필)
> ⭐ **핵심 모델** — 언어별 독립 진행도의 핵심
```
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  targetLanguage: String,           // 'en' | 'ja' | 'zh'
  
  level: 'beginner' | 'elementary' | 'intermediate' | 'advanced',
  xp: Number,
  userLevel: Number,                // 계산된 사용자 레벨 (Lv.1, Lv.12 등)
  
  // 하트 시스템 (언어별 독립)
  hearts: Number,                   // 현재 하트 수 (max 5)
  lastHeartLostAt: Date,            // 마지막 하트 소모 시각
  
  // 카테고리별 진행률
  vocabularyProgress: Number,       // 0-100
  grammarProgress: Number,
  conversationProgress: Number,
  listeningProgress: Number,
  readingProgress: Number,
  quizProgress: Number,
  
  // 스트릭 실드 보유 수
  streakShields: Number,
  
  createdAt: Date,
  updatedAt: Date,
}
```
**인덱스**: `{ userId: 1, targetLanguage: 1 }` (unique compound)

### 3. UserStreak (스트릭)
```
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  targetLanguage: String,
  
  currentStreak: Number,            // 현재 연속 일수
  longestStreak: Number,            // 최장 스트릭
  lastStudyDate: Date,              // 마지막 학습 날짜 (YYYY-MM-DD)
  
  // 주간 기록
  weeklyRecord: [{
    date: String,                   // 'YYYY-MM-DD'
    completed: Boolean,
    minutesStudied: Number,
  }],
  
  // 스트릭 실드 사용 이력
  shieldUsedDates: [String],        // ['2024-01-15', ...]
  
  createdAt: Date,
  updatedAt: Date,
}
```
**인덱스**: `{ userId: 1, targetLanguage: 1 }` (unique compound)

### 4. Vocabulary (단어 콘텐츠)
```
{
  _id: ObjectId,
  targetLanguage: String,           // 'en' | 'ja' | 'zh'
  
  word: String,                     // 'Apple'
  pronunciation: String,            // '[ˈæpəl]'
  meaning: String,                  // '사과' (한국어 뜻)
  partOfSpeech: String,             // '명사'
  level: String,                    // 'beginner' | 'elementary' | ...
  chapter: Number,                  // 챕터 번호
  
  exampleSentence: String,          // 'I eat an apple every day.'
  exampleTranslation: String,       // '나는 매일 사과를 먹어요.'
  audioUrl: String,                 // 발음 오디오 URL
  
  order: Number,                    // 챕터 내 정렬 순서
  createdAt: Date,
}
```
**인덱스**: `{ targetLanguage: 1, level: 1, chapter: 1 }`

### 5. Grammar (문법 콘텐츠)
```
{
  _id: ObjectId,
  targetLanguage: String,
  
  title: String,                    // '현재진행형'
  subtitle: String,                 // 'be동사 + 동사ing'
  englishTitle: String,             // 'Present Progressive'
  icon: String,                     // '🔵'
  level: String,
  order: Number,
  
  // 핵심 공식
  formula: String,                  // 'be동사 (am/is/are) + 동사원형 + ing'
  formulaExample: String,
  
  // 설명
  explanation: String,              // 마크다운 형식 설명
  
  // 예문 목록
  examples: [{
    sentence: String,
    translation: String,
    highlight: String,              // 강조할 부분
  }],
  
  // 연관 퀴즈 ID 목록
  quizIds: [ObjectId],
  
  createdAt: Date,
}
```
**인덱스**: `{ targetLanguage: 1, level: 1 }`

### 6. Conversation (회화 콘텐츠)
```
{
  _id: ObjectId,
  targetLanguage: String,
  
  title: String,                    // '공항에서'
  emoji: String,                    // '✈️'
  level: String,
  order: Number,
  
  // 대화문
  dialogs: [{
    speaker: 'A' | 'B',
    text: String,                   // 'Excuse me, where is gate 12?'
    translation: String,            // '실례합니다, 12번 게이트가 어디인가요?'
    isUserRole: Boolean,            // 사용자가 연습할 대사인지
    audioUrl: String,
  }],
  
  // 핵심 표현
  keyExpressions: [{
    expression: String,
    meaning: String,
  }],
  
  createdAt: Date,
}
```
**인덱스**: `{ targetLanguage: 1, level: 1 }`

### 7. Listening (듣기 콘텐츠)
```
{
  _id: ObjectId,
  targetLanguage: String,
  
  audioText: String,                // 'I like to read books'
  correctAnswer: String,            // 'I like to read books'
  hint: String,                     // '나는 책 읽는 것을 좋아한다'
  difficulty: String,               // 'beginner' | 'elementary' | ...
  audioUrl: String,
  order: Number,
  
  createdAt: Date,
}
```

### 8. Reading (읽기 콘텐츠)
```
{
  _id: ObjectId,
  targetLanguage: String,
  
  title: String,                    // 'My Daily Routine'
  difficulty: String,
  content: String,                  // 영문 지문
  wordCount: Number,
  
  // 관련 퀴즈
  quizzes: [{
    question: String,
    options: [String],
    correctAnswer: Number,          // 정답 인덱스
    explanation: String,
  }],
  
  order: Number,
  createdAt: Date,
}
```

### 9. Lesson (레슨)
```
{
  _id: ObjectId,
  targetLanguage: String,
  
  unitNumber: Number,               // Unit 번호
  unitTitle: String,                // 'Unit 1 - 기초 인사'
  lessonNumber: Number,             // 레슨 번호
  lessonTitle: String,              // '자기소개하기'
  
  // 레슨 내 포함 콘텐츠
  newWords: [ObjectId],             // Vocabulary refs
  grammarPoints: [ObjectId],        // Grammar refs
  
  // 레슨 퀴즈
  quizzes: [{
    type: 'multiple' | 'listening' | 'grammar' | 'reading',
    question: String,
    options: [String],
    correctAnswer: Number | String,
    explanation: String,
  }],
  
  estimatedMinutes: Number,         // 예상 소요 시간
  xpReward: Number,                 // 완료 시 XP 보상
  coinReward: Number,               // 완료 시 코인 보상
  
  // 잠금 해제 조건
  prerequisiteLessonId: ObjectId,   // 선행 레슨 (null이면 첫 레슨)
  
  order: Number,
  createdAt: Date,
}
```
**인덱스**: `{ targetLanguage: 1, unitNumber: 1, order: 1 }`

### 10. UserProgress (사용자 학습 진행도)
```
{
  _id: ObjectId,
  userId: ObjectId,
  targetLanguage: String,
  
  // 레슨 진행
  completedLessons: [ObjectId],     // 완료한 레슨 ID 목록
  currentLessonId: ObjectId,        // 현재 진행 중인 레슨
  
  // 단어 학습 상태
  vocabularyStatus: [{
    wordId: ObjectId,
    status: 'new' | 'learning' | 'completed' | 'wrong',
    correctCount: Number,
    wrongCount: Number,
    lastReviewedAt: Date,
    nextReviewAt: Date,             // 간격 반복용
  }],
  
  // 문법 학습 상태
  grammarStatus: [{
    grammarId: ObjectId,
    progress: Number,               // 0-100
    quizScore: Number,
    lastReviewedAt: Date,
    nextReviewAt: Date,
  }],
  
  // 회화 학습 상태
  conversationStatus: [{
    conversationId: ObjectId,
    completed: Boolean,
    pronunciationScore: Number,
    lastReviewedAt: Date,
  }],
  
  // 오답 노트
  wrongAnswers: [{
    type: 'vocabulary' | 'grammar' | 'listening' | 'reading' | 'quiz',
    contentId: ObjectId,
    question: String,
    userAnswer: String,
    correctAnswer: String,
    createdAt: Date,
  }],
  
  createdAt: Date,
  updatedAt: Date,
}
```
**인덱스**: `{ userId: 1, targetLanguage: 1 }` (unique compound)

### 11. Badge (뱃지 정의)
```
{
  _id: ObjectId,
  name: String,                     // '7일 챔피언'
  emoji: String,                    // '🔥'
  category: 'streak' | 'learning' | 'level' | 'special',
  condition: {
    type: String,                   // 'streak_days' | 'lessons_completed' | ...
    value: Number,                  // 7, 30, 100 등
  },
  createdAt: Date,
}
```

### 12. UserBadge (사용자 뱃지 획득)
```
{
  _id: ObjectId,
  userId: ObjectId,
  badgeId: ObjectId (ref: Badge),
  targetLanguage: String,
  achievedAt: Date,
}
```

### 13. CoinTransaction (코인 거래)
```
{
  _id: ObjectId,
  userId: ObjectId,
  
  type: 'earn' | 'spend',
  amount: Number,
  reason: 'lesson_complete' | 'ad_watch' | 'daily_check' | 'friend_invite'
        | 'heart_refill' | 'streak_shield' | 'hint_purchase' | 'profile_item'
        | 'package_purchase',
  
  balanceAfter: Number,             // 거래 후 잔액
  createdAt: Date,
}
```

### 14. Subscription (구독)
```
{
  _id: ObjectId,
  userId: ObjectId,
  
  plan: 'monthly' | 'yearly',
  status: 'active' | 'cancelled' | 'expired',
  startDate: Date,
  endDate: Date,
  
  // 결제 정보
  paymentProvider: 'apple' | 'google',
  transactionId: String,
  
  createdAt: Date,
  updatedAt: Date,
}
```

---

## 🔌 API 엔드포인트 설계

### 인증 (Auth)
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/v1/auth/google` | Google OAuth 로그인 |
| POST | `/api/v1/auth/apple` | Apple OAuth 로그인 |
| POST | `/api/v1/auth/refresh` | 토큰 갱신 |
| POST | `/api/v1/auth/logout` | 로그아웃 |

### 사용자 (User)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/users/me` | 내 프로필 조회 |
| PATCH | `/api/v1/users/me` | 프로필 수정 |
| PATCH | `/api/v1/users/me/settings` | 설정 변경 |
| PATCH | `/api/v1/users/me/language` | 활성 언어 변경 |
| POST | `/api/v1/users/me/onboarding` | 온보딩 완료 (언어+레벨+목표+알림 일괄) |

### 단어 (Vocabulary)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/vocabulary` | 단어 목록 (언어/레벨/챕터 필터) |
| GET | `/api/v1/vocabulary/:id` | 단어 상세 |
| GET | `/api/v1/vocabulary/flashcards` | 플래시카드 세트 조회 |
| POST | `/api/v1/vocabulary/:id/answer` | 플래시카드 정답/오답 기록 |

### 문법 (Grammar)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/grammar` | 문법 토픽 목록 |
| GET | `/api/v1/grammar/:id` | 문법 상세 (공식+예문) |
| GET | `/api/v1/grammar/:id/quiz` | 문법 퀴즈 문제 |
| POST | `/api/v1/grammar/:id/quiz/answer` | 퀴즈 정답 제출 |

### 회화 (Conversation)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/conversations` | 회화 상황 목록 |
| GET | `/api/v1/conversations/:id` | 대화문 상세 |
| POST | `/api/v1/conversations/:id/practice` | 발음 연습 결과 저장 |

### 듣기 (Listening)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/listening` | 듣기 문제 목록 |
| POST | `/api/v1/listening/:id/answer` | 받아쓰기 정답 제출 |

### 읽기 (Reading)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/reading` | 읽기 지문 목록 |
| GET | `/api/v1/reading/:id` | 지문 상세 + 퀴즈 |
| POST | `/api/v1/reading/:id/quiz/answer` | 독해 퀴즈 정답 제출 |

### 레슨 (Lesson)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/lessons` | 레슨 맵 (유닛별 레슨 + 잠금 상태) |
| GET | `/api/v1/lessons/:id` | 레슨 상세 (미리보기) |
| POST | `/api/v1/lessons/:id/start` | 레슨 시작 |
| POST | `/api/v1/lessons/:id/complete` | 레슨 완료 (XP/코인 지급) |

### 퀴즈 (Quiz)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/quiz/daily` | 오늘의 종합 퀴즈 |
| POST | `/api/v1/quiz/answer` | 퀴즈 정답 제출 |
| POST | `/api/v1/quiz/complete` | 퀴즈 세션 완료 |

### 복습 (Review)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/review` | 복습 대시보드 (카테고리별 현황) |
| GET | `/api/v1/review/:category` | 카테고리별 복습 항목 |
| POST | `/api/v1/review/:category/complete` | 복습 완료 기록 |

### 하트 (Heart)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/hearts` | 현재 하트 상태 |
| POST | `/api/v1/hearts/use` | 하트 소모 (오답 시) |
| POST | `/api/v1/hearts/refill` | 하트 충전 (광고/코인) |

### 스트릭 (Streak)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/streak` | 스트릭 상세 정보 |
| POST | `/api/v1/streak/shield` | 스트릭 실드 사용 |

### 뱃지 (Badge)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/badges` | 전체 뱃지 + 획득 여부 |

### 코인 (Coin)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/coins` | 보유 코인 + 거래 내역 |
| POST | `/api/v1/coins/earn` | 코인 획득 (광고/출석/초대) |
| POST | `/api/v1/coins/spend` | 코인 사용 (아이템 구매) |

### 통계 (Stats)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/stats` | 학습 통계 (기간 필터) |
| GET | `/api/v1/stats/weekly` | 주간 상세 통계 |

### 구독 (Subscription)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/subscription` | 현재 구독 상태 |
| POST | `/api/v1/subscription/subscribe` | 구독 시작 |
| POST | `/api/v1/subscription/cancel` | 구독 취소 |

---

## 🎮 게이미피케이션 규칙

### 하트 시스템
- 최대 보유: **5개**
- 소모: 퀴즈/레슨에서 오답 시 **1개 차감**
- 자동 충전: **30분마다 1개** (마지막 소모 시점 기준)
- 즉시 충전: 광고 시청 (전체) 또는 코인 사용 (1개: 20코인, 전체: 50코인)
- 프리미엄: **무제한**

### 스트릭
- 하루에 **최소 1개 학습 활동** 완료 시 스트릭 유지
- 자정(KST) 기준으로 날짜 전환
- 스트릭 실드: 하루 빠져도 스트릭 유지 (코인 100개 / 프리미엄 주 1개 지급)

### XP & 레벨
- 레슨 완료: **+120 XP**
- 플래시카드 세트 완료: **+50 XP**
- 복습 완료: **+30 XP**
- 레벨업 공식: `필요 XP = level * 100`

### 코인 획득
- 레슨 완료: **+15 코인**
- 광고 시청: **+30 코인**
- 출석 체크: **+10 코인**
- 친구 초대: **+100 코인**

---

## 🔐 인증 흐름

```
1. 클라이언트에서 Google/Apple 로그인 수행
2. OAuth 토큰을 서버로 전송 → POST /api/v1/auth/google
3. 서버에서 토큰 검증 → 사용자 조회 또는 생성
4. JWT Access Token (15분) + Refresh Token (7일) 발급
5. 이후 모든 요청에 Authorization: Bearer <accessToken> 헤더 포함
6. 만료 시 Refresh Token으로 갱신 → POST /api/v1/auth/refresh
```

---

## 🚀 실행 방법

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start
```

### 환경 변수 (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/levo
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your-google-client-id
APPLE_CLIENT_ID=your-apple-client-id
```
