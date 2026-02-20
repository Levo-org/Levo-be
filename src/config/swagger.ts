import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Levo API',
      version: '1.0.0',
      description: 'Levo - 어휘 학습 앱 백엔드 API 문서\n\n모든 학습 콘텐츠는 사용자의 활성 언어(activeLanguage)를 기준으로 필터링됩니다.',
      contact: {
        name: 'Levo Team',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT 인증 토큰을 입력하세요',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
        TargetLanguage: {
          type: 'string',
          enum: ['en', 'ja', 'zh'],
          description: '학습 대상 언어 (en: 영어, ja: 일본어, zh: 중국어)',
        },
        Level: {
          type: 'string',
          enum: ['beginner', 'elementary', 'intermediate', 'advanced'],
          description: '난이도',
        },
      },
    },
    tags: [
      { name: 'Auth', description: '인증 (로그인/회원가입)' },
      { name: 'User', description: '사용자 프로필 & 설정' },
      { name: 'Vocabulary', description: '단어장 & 플래시카드' },
      { name: 'Grammar', description: '문법 학습' },
      { name: 'Conversation', description: '회화 연습' },
      { name: 'Listening', description: '듣기 연습' },
      { name: 'Reading', description: '읽기 연습' },
      { name: 'Lesson', description: '레슨 시스템' },
      { name: 'Quiz', description: '종합 퀴즈' },
      { name: 'Review', description: '복습 시스템' },
      { name: 'Heart', description: '하트 시스템' },
      { name: 'Streak', description: '스트릭' },
      { name: 'Badge', description: '뱃지' },
      { name: 'Coin', description: '코인 상점' },
      { name: 'Stats', description: '학습 통계' },
      { name: 'Subscription', description: '프리미엄 구독' },
      { name: 'Home', description: '홈 화면 집계' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
