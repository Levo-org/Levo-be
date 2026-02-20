/**
 * 영어 회화 시드 데이터 (레벨별 8개, 총 32)
 */
export const englishConversations = [
  // ─── Beginner (8) ──────────────────────────────────
  {
    title: '인사하기',
    emoji: '👋',
    level: 'beginner',
    order: 1,
    dialogs: [
      { speaker: 'A' as const, text: 'Hello! How are you?', translation: '안녕하세요! 어떻게 지내세요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: "I'm fine, thank you. And you?", translation: '잘 지내요, 감사해요. 당신은요?', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: "I'm great! Nice to meet you.", translation: '잘 지내요! 만나서 반가워요.', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'Nice to meet you too!', translation: '저도 만나서 반가워요!', isUserRole: true, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: 'How are you?', meaning: '어떻게 지내세요?' },
      { expression: 'Nice to meet you', meaning: '만나서 반가워요' },
    ],
  },
  {
    title: '자기소개',
    emoji: '🙋',
    level: 'beginner',
    order: 2,
    dialogs: [
      { speaker: 'A' as const, text: "Hi, I'm Sarah. What's your name?", translation: '안녕, 나는 사라야. 이름이 뭐야?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: "My name is Min. I'm from Korea.", translation: '제 이름은 민이에요. 한국에서 왔어요.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: "Oh, nice! I'm from the United States.", translation: '오, 멋져! 나는 미국에서 왔어.', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'How old are you?', translation: '몇 살이에요?', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: "I'm 25 years old.", translation: '나는 25살이야.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: "What's your name?", meaning: '이름이 뭐예요?' },
      { expression: "I'm from ~", meaning: '~에서 왔어요' },
    ],
  },
  {
    title: '카페에서',
    emoji: '☕',
    level: 'beginner',
    order: 3,
    dialogs: [
      { speaker: 'A' as const, text: 'Welcome! What would you like?', translation: '어서오세요! 무엇을 드릴까요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'Can I have a coffee, please?', translation: '커피 한 잔 주세요.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: 'Sure! Hot or iced?', translation: '네! 뜨거운 걸로 드릴까요, 차가운 걸로 드릴까요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'Iced, please. How much is it?', translation: '아이스로 주세요. 얼마예요?', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: "It's $4.50.", translation: '4달러 50센트입니다.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: 'Can I have ~?', meaning: '~ 주세요' },
      { expression: 'How much is it?', meaning: '얼마예요?' },
    ],
  },
  {
    title: '식당에서 주문',
    emoji: '🍽️',
    level: 'beginner',
    order: 4,
    dialogs: [
      { speaker: 'A' as const, text: 'Are you ready to order?', translation: '주문하시겠어요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'Yes, I would like a hamburger, please.', translation: '네, 햄버거 하나 주세요.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: 'Would you like anything to drink?', translation: '음료는 뭘로 하시겠어요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'Orange juice, please.', translation: '오렌지 주스 주세요.', isUserRole: true, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: 'I would like ~', meaning: '~를 원합니다' },
      { expression: 'Are you ready to order?', meaning: '주문하시겠어요?' },
    ],
  },
  {
    title: '날씨 이야기',
    emoji: '🌤️',
    level: 'beginner',
    order: 5,
    dialogs: [
      { speaker: 'A' as const, text: "It's a beautiful day today!", translation: '오늘 날씨가 정말 좋다!', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'Yes, it is! Do you want to go for a walk?', translation: '그러게! 산책 갈래?', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: 'Sure! Let me get my jacket.', translation: '좋아! 재킷 가져올게.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: "It's a beautiful day", meaning: '좋은 날씨야' },
      { expression: 'Do you want to ~?', meaning: '~할래?' },
    ],
  },
  {
    title: '쇼핑하기',
    emoji: '🛍️',
    level: 'beginner',
    order: 6,
    dialogs: [
      { speaker: 'A' as const, text: 'Can I help you?', translation: '도와드릴까요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: "I'm looking for a T-shirt.", translation: '티셔츠를 찾고 있어요.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: 'What size do you need?', translation: '어떤 사이즈가 필요하세요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'Medium, please. Can I try it on?', translation: '미디엄이요. 입어봐도 될까요?', isUserRole: true, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: "I'm looking for ~", meaning: '~를 찾고 있어요' },
      { expression: 'Can I try it on?', meaning: '입어봐도 될까요?' },
    ],
  },
  {
    title: '길 묻기',
    emoji: '🗺️',
    level: 'beginner',
    order: 7,
    dialogs: [
      { speaker: 'A' as const, text: 'Excuse me, where is the subway station?', translation: '실례합니다, 지하철역이 어디예요?', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'Go straight and turn left at the corner.', translation: '직진해서 모퉁이에서 왼쪽으로 도세요.', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: 'Is it far from here?', translation: '여기서 먼가요?', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: "No, it's about 5 minutes on foot.", translation: '아니요, 걸어서 약 5분이에요.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: 'Excuse me, where is ~?', meaning: '실례합니다, ~가 어디예요?' },
      { expression: 'Go straight and turn left/right', meaning: '직진해서 왼쪽/오른쪽으로 도세요' },
    ],
  },
  {
    title: '전화 통화',
    emoji: '📞',
    level: 'beginner',
    order: 8,
    dialogs: [
      { speaker: 'A' as const, text: 'Hello?', translation: '여보세요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'Hi, this is Min. Is Tom there?', translation: '안녕하세요, 민이에요. 톰 있나요?', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: "Sorry, he's not here right now.", translation: '죄송해요, 지금 없어요.', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'Can you tell him to call me back?', translation: '다시 전화해 달라고 전해주세요.', isUserRole: true, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: 'This is ~', meaning: '(전화) ~입니다' },
      { expression: 'Can you tell him to ~?', meaning: '~해달라고 전해주세요' },
    ],
  },

  // ─── Elementary (8) ────────────────────────────────
  {
    title: '공항에서',
    emoji: '✈️',
    level: 'elementary',
    order: 9,
    dialogs: [
      { speaker: 'A' as const, text: 'Excuse me, where is gate 12?', translation: '실례합니다, 12번 게이트가 어디예요?', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: "It's on the second floor, turn left.", translation: '2층에 있고, 왼쪽으로 가세요.', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: 'Thank you! How long until boarding?', translation: '감사합니다! 탑승까지 얼마나 남았나요?', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'About 30 minutes. You still have time.', translation: '약 30분이요. 아직 시간이 있어요.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: 'How long until ~?', meaning: '~까지 얼마나 남았나요?' },
      { expression: 'You still have time', meaning: '아직 시간이 있어요' },
    ],
  },
  {
    title: '호텔 체크인',
    emoji: '🏨',
    level: 'elementary',
    order: 10,
    dialogs: [
      { speaker: 'A' as const, text: 'Good evening. I have a reservation under Kim.', translation: '안녕하세요. 김으로 예약했어요.', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'Let me check. Yes, a double room for two nights.', translation: '확인해 볼게요. 네, 2박 더블룸이요.', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: 'Is breakfast included?', translation: '조식 포함인가요?', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'Yes, breakfast is served from 7 to 10 AM.', translation: '네, 조식은 오전 7시부터 10시까지입니다.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: 'I have a reservation under ~', meaning: '~로 예약했습니다' },
      { expression: 'Is ~ included?', meaning: '~ 포함인가요?' },
    ],
  },
  {
    title: '병원 예약',
    emoji: '🏥',
    level: 'elementary',
    order: 11,
    dialogs: [
      { speaker: 'A' as const, text: "I'd like to make an appointment.", translation: '예약하고 싶습니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'What seems to be the problem?', translation: '어디가 불편하세요?', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: "I've had a headache for three days.", translation: '3일째 두통이 있어요.', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'Can you come in tomorrow at 2 PM?', translation: '내일 오후 2시에 오실 수 있나요?', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: "I'd like to make an appointment", meaning: '예약하고 싶습니다' },
      { expression: "I've had ~ for ~", meaning: '~동안 ~가 있었어요' },
    ],
  },
  {
    title: '택시 타기',
    emoji: '🚕',
    level: 'elementary',
    order: 12,
    dialogs: [
      { speaker: 'A' as const, text: 'Where to?', translation: '어디로 가시겠어요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'Seoul Station, please. How long will it take?', translation: '서울역이요. 얼마나 걸리나요?', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: 'About 20 minutes with traffic.', translation: '교통 상황에 따라 약 20분이요.', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'Can you take the fastest route?', translation: '가장 빠른 길로 가주세요.', isUserRole: true, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: 'How long will it take?', meaning: '얼마나 걸리나요?' },
      { expression: 'Can you take the fastest route?', meaning: '가장 빠른 길로 가주세요' },
    ],
  },
  {
    title: '은행에서',
    emoji: '🏦',
    level: 'elementary',
    order: 13,
    dialogs: [
      { speaker: 'A' as const, text: "I'd like to open a bank account.", translation: '은행 계좌를 개설하고 싶습니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'Do you have your ID with you?', translation: '신분증을 가져오셨나요?', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: 'Yes, here is my passport.', translation: '네, 여기 여권입니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: "Great. Please fill out this form.", translation: '좋습니다. 이 서류를 작성해 주세요.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: "I'd like to open a bank account", meaning: '계좌를 개설하고 싶습니다' },
      { expression: 'Please fill out this form', meaning: '이 서류를 작성해 주세요' },
    ],
  },
  {
    title: '영화관에서',
    emoji: '🎬',
    level: 'elementary',
    order: 14,
    dialogs: [
      { speaker: 'A' as const, text: 'Two tickets for the 7 PM show, please.', translation: '7시 상영 2장 주세요.', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'Would you like regular or premium seats?', translation: '일반석이요 프리미엄석이요?', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: 'Regular is fine. Do you have any snack combos?', translation: '일반석이요. 스낵 콤보 있나요?', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: "Yes, popcorn and drink combo is $8.", translation: '네, 팝콘 음료 콤보 8달러입니다.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: 'Two tickets for ~', meaning: '~ 2장 주세요' },
      { expression: 'Do you have any ~?', meaning: '~ 있나요?' },
    ],
  },
  {
    title: '도서관에서',
    emoji: '📚',
    level: 'elementary',
    order: 15,
    dialogs: [
      { speaker: 'A' as const, text: 'How can I borrow books?', translation: '책을 어떻게 대출하나요?', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'You need a library card. Would you like to apply?', translation: '도서관 카드가 필요합니다. 신청하시겠어요?', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: 'Yes, please. How many books can I borrow at once?', translation: '네. 한 번에 몇 권 빌릴 수 있나요?', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'Up to 5 books for 2 weeks.', translation: '최대 5권까지 2주간 대출 가능합니다.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: 'How can I ~?', meaning: '어떻게 ~할 수 있나요?' },
      { expression: 'How many ~ can I ~?', meaning: '몇 개 ~할 수 있나요?' },
    ],
  },
  {
    title: '우체국에서',
    emoji: '📮',
    level: 'elementary',
    order: 16,
    dialogs: [
      { speaker: 'A' as const, text: 'I want to send this package to Korea.', translation: '이 소포를 한국으로 보내고 싶어요.', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'How would you like to send it? Express or standard?', translation: '어떻게 보내시겠어요? 특급 아니면 일반?', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: 'Standard, please. How long does it take?', translation: '일반이요. 얼마나 걸려요?', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'About 7 to 10 business days.', translation: '영업일 기준 7~10일 정도요.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: 'I want to send this to ~', meaning: '이것을 ~에 보내고 싶어요' },
      { expression: '~ business days', meaning: '영업일 기준 ~일' },
    ],
  },

  // ─── Intermediate (8) ──────────────────────────────
  {
    title: '면접 상황',
    emoji: '💼',
    level: 'intermediate',
    order: 17,
    dialogs: [
      { speaker: 'A' as const, text: 'Tell me about yourself and your experience.', translation: '자기소개와 경험에 대해 말씀해 주세요.', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: "I've worked in marketing for 3 years and I specialize in digital campaigns.", translation: '마케팅 분야에서 3년간 근무했고, 디지털 캠페인을 전문으로 합니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: 'What would you say is your greatest strength?', translation: '가장 큰 강점이 뭐라고 생각하세요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: "I'm highly adaptable and I work well under pressure.", translation: '적응력이 뛰어나고 압박 상황에서도 잘 일합니다.', isUserRole: true, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: "I've worked in ~ for ~", meaning: '~분야에서 ~간 일했습니다' },
      { expression: 'I work well under pressure', meaning: '압박 속에서 잘 일합니다' },
    ],
  },
  {
    title: '비즈니스 미팅',
    emoji: '📊',
    level: 'intermediate',
    order: 18,
    dialogs: [
      { speaker: 'A' as const, text: "Let's go over the quarterly results.", translation: '분기 실적을 검토해 봅시다.', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'Revenue increased by 15% compared to last quarter.', translation: '매출이 전분기 대비 15% 증가했습니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: "That's impressive. What drove the growth?", translation: '인상적이네요. 성장의 원인은 무엇인가요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'Primarily our new product launch and expanded marketing efforts.', translation: '주로 신제품 출시와 마케팅 확대 덕분입니다.', isUserRole: true, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: '~ increased by ~%', meaning: '~가 ~% 증가했다' },
      { expression: "Let's go over ~", meaning: '~를 검토해 봅시다' },
    ],
  },
  {
    title: '집 구하기',
    emoji: '🏠',
    level: 'intermediate',
    order: 19,
    dialogs: [
      { speaker: 'A' as const, text: "I'm looking for a two-bedroom apartment near downtown.", translation: '시내 근처 투룸 아파트를 찾고 있습니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'I have a few listings. What is your budget range?', translation: '몇 개 매물이 있어요. 예산 범위가 어떻게 되세요?', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: 'Around $1,500 per month. Are utilities included?', translation: '월 1,500달러 정도요. 공과금 포함인가요?', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'Water is included, but electricity and gas are separate.', translation: '수도는 포함이고, 전기와 가스는 별도입니다.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: 'What is your budget range?', meaning: '예산 범위가 어떻게 되세요?' },
      { expression: 'Are utilities included?', meaning: '공과금 포함인가요?' },
    ],
  },
  {
    title: '불만 제기',
    emoji: '😤',
    level: 'intermediate',
    order: 20,
    dialogs: [
      { speaker: 'A' as const, text: "I'd like to make a complaint about my order.", translation: '주문에 대해 불만을 제기하고 싶습니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: "I'm sorry to hear that. What seems to be the issue?", translation: '죄송합니다. 무엇이 문제인가요?', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: "The product I received is damaged. I'd like a refund.", translation: '받은 제품이 손상되었어요. 환불 받고 싶습니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: "Of course. I'll process the refund right away.", translation: '물론이요. 바로 환불 처리해 드리겠습니다.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: "I'd like to make a complaint", meaning: '불만을 제기하고 싶습니다' },
      { expression: "I'd like a refund", meaning: '환불 받고 싶습니다' },
    ],
  },
  {
    title: '건강 상담',
    emoji: '⚕️',
    level: 'intermediate',
    order: 21,
    dialogs: [
      { speaker: 'A' as const, text: "I've been having trouble sleeping lately.", translation: '최근에 잠을 잘 못 자고 있어요.', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'How long has this been going on?', translation: '얼마나 오래됐나요?', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: 'About two weeks. I also feel stressed at work.', translation: '약 2주 정도요. 직장에서 스트레스도 받고 있어요.', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'I recommend reducing screen time before bed and trying some relaxation techniques.', translation: '취침 전 스크린 시간을 줄이고 이완 기법을 시도해 보세요.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: "I've been having trouble ~ing", meaning: '~하는 데 어려움을 겪고 있어요' },
      { expression: 'How long has this been going on?', meaning: '얼마나 오래됐나요?' },
    ],
  },
  {
    title: '여행 계획',
    emoji: '🗓️',
    level: 'intermediate',
    order: 22,
    dialogs: [
      { speaker: 'A' as const, text: "I'm planning a trip to Japan next month.", translation: '다음 달 일본 여행을 계획하고 있어요.', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'Have you booked your flights and accommodation yet?', translation: '항공편과 숙소는 예약하셨나요?', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: "I've booked the flights, but I'm still comparing hotels.", translation: '항공편은 예약했는데, 아직 호텔을 비교 중이에요.', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'I highly recommend staying in Shinjuku area. It is very convenient.', translation: '신주쿠 지역 숙박을 강력 추천해요. 매우 편리해요.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: "I'm planning a trip to ~", meaning: '~로 여행을 계획 중이에요' },
      { expression: 'I highly recommend ~', meaning: '~를 강력 추천합니다' },
    ],
  },
  {
    title: '기술 지원 전화',
    emoji: '💻',
    level: 'intermediate',
    order: 23,
    dialogs: [
      { speaker: 'A' as const, text: 'My laptop keeps freezing and crashing.', translation: '노트북이 계속 멈추고 다운됩니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'Have you tried restarting it? When did this start?', translation: '재시작 해보셨나요? 언제부터 그랬나요?', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: 'Since the last software update. Restarting didn\'t help.', translation: '마지막 소프트웨어 업데이트 이후요. 재시작해도 안됐어요.', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'I\'ll guide you through rolling back the update.', translation: '업데이트 롤백 방법을 안내해 드리겠습니다.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: '~ keeps ~ing', meaning: '~가 계속 ~해요' },
      { expression: "I'll guide you through ~", meaning: '~를 안내해 드리겠습니다' },
    ],
  },
  {
    title: '운동 친구와 대화',
    emoji: '🏋️',
    level: 'intermediate',
    order: 24,
    dialogs: [
      { speaker: 'A' as const, text: "I've been trying to get in better shape recently.", translation: '최근 몸을 더 만들려고 노력하고 있어.', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: "That's great! What kind of exercise have you been doing?", translation: '멋지다! 어떤 운동을 하고 있어?', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: 'Mostly running and some weight training. Any tips?', translation: '주로 달리기와 약간의 웨이트. 팁 있어?', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'Consistency is key. Try to work out at least three times a week.', translation: '꾸준함이 핵심이야. 일주일에 최소 세 번은 운동해.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: "I've been trying to ~", meaning: '~하려고 노력하고 있어요' },
      { expression: 'Consistency is key', meaning: '꾸준함이 핵심이다' },
    ],
  },

  // ─── Advanced (8) ──────────────────────────────────
  {
    title: '학술 토론',
    emoji: '🎓',
    level: 'advanced',
    order: 25,
    dialogs: [
      { speaker: 'A' as const, text: 'The implications of this research are far-reaching.', translation: '이 연구의 함의는 광범위합니다.', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'I agree, but the methodology has some limitations we should address.', translation: '동의하지만, 방법론에 몇 가지 한계가 있어 다뤄야 합니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: 'Could you elaborate on which limitations concern you most?', translation: '어떤 한계가 가장 우려되는지 자세히 말씀해 주시겠어요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'Primarily the sample size and potential selection bias in the data collection.', translation: '주로 표본 크기와 데이터 수집에서의 잠재적 선택 편향입니다.', isUserRole: true, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: 'The implications are far-reaching', meaning: '함의가 광범위하다' },
      { expression: 'Could you elaborate on ~?', meaning: '~에 대해 자세히 말씀해 주시겠어요?' },
    ],
  },
  {
    title: '투자 상담',
    emoji: '📈',
    level: 'advanced',
    order: 26,
    dialogs: [
      { speaker: 'A' as const, text: "I'd like to diversify my portfolio. What do you recommend?", translation: '포트폴리오를 다각화하고 싶습니다. 무엇을 추천하세요?', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'Given the current market volatility, I\'d suggest a balanced mix of equities and bonds.', translation: '현재 시장 변동성을 감안하면, 주식과 채권의 균형 잡힌 조합을 제안합니다.', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: 'What about emerging market funds? Are they too risky?', translation: '신흥시장 펀드는 어때요? 너무 위험한가요?', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'They carry higher risk but also offer significant growth potential in the long term.', translation: '위험은 높지만 장기적으로 상당한 성장 잠재력이 있습니다.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: 'diversify my portfolio', meaning: '포트폴리오를 다각화하다' },
      { expression: 'market volatility', meaning: '시장 변동성' },
    ],
  },
  {
    title: '환경 토론',
    emoji: '🌍',
    level: 'advanced',
    order: 27,
    dialogs: [
      { speaker: 'A' as const, text: 'The carbon footprint of our industry is unsustainable.', translation: '우리 산업의 탄소 발자국은 지속 불가능합니다.', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'Absolutely. We need to transition to renewable energy sources within the decade.', translation: '맞습니다. 10년 내에 재생 에너지원으로 전환해야 합니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: 'But the economic implications of such a rapid transition concern many stakeholders.', translation: '하지만 그런 급격한 전환의 경제적 함의가 많은 이해관계자를 우려시킵니다.', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'The cost of inaction far outweighs the cost of transition.', translation: '행동하지 않는 비용이 전환 비용보다 훨씬 큽니다.', isUserRole: true, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: 'carbon footprint', meaning: '탄소 발자국' },
      { expression: 'The cost of inaction outweighs ~', meaning: '비행동의 비용이 ~보다 크다' },
    ],
  },
  {
    title: '법률 상담',
    emoji: '⚖️',
    level: 'advanced',
    order: 28,
    dialogs: [
      { speaker: 'A' as const, text: "I'm considering filing a patent for my invention.", translation: '발명품에 대해 특허 출원을 고려하고 있습니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: "We'll need to conduct a thorough prior art search first.", translation: '먼저 철저한 선행기술 조사를 해야 합니다.', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: 'How long does the entire patent application process typically take?', translation: '특허 출원 전체 과정이 보통 얼마나 걸리나요?', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'It varies, but expect anywhere from 18 months to 3 years.', translation: '경우에 따라 다르지만, 18개월에서 3년 정도 예상하세요.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: 'filing a patent', meaning: '특허 출원' },
      { expression: 'prior art search', meaning: '선행기술 조사' },
    ],
  },
  {
    title: '외교 회의',
    emoji: '🌐',
    level: 'advanced',
    order: 29,
    dialogs: [
      { speaker: 'A' as const, text: 'Our delegation proposes a multilateral approach to this issue.', translation: '저희 대표단은 이 문제에 대한 다자간 접근을 제안합니다.', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'We appreciate the proposal, but we have reservations about certain clauses.', translation: '제안에 감사하지만, 특정 조항에 대한 유보가 있습니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: 'We are open to amendments. Which clauses need further negotiation?', translation: '수정에 열려 있습니다. 어떤 조항이 추가 협상이 필요한가요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'Articles 3 and 7 require more equitable terms for developing nations.', translation: '3조와 7조는 개발도상국에 더 공평한 조건이 필요합니다.', isUserRole: true, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: 'multilateral approach', meaning: '다자간 접근' },
      { expression: 'We have reservations about ~', meaning: '~에 대한 유보가 있습니다' },
    ],
  },
  {
    title: '기술 컨퍼런스 발표',
    emoji: '🎤',
    level: 'advanced',
    order: 30,
    dialogs: [
      { speaker: 'A' as const, text: 'Our AI model achieves state-of-the-art performance on multiple benchmarks.', translation: '우리 AI 모델은 다수 벤치마크에서 최첨단 성능을 달성합니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'How does it handle edge cases and adversarial inputs?', translation: '엣지 케이스와 적대적 입력은 어떻게 처리하나요?', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: 'We incorporated robust training techniques to mitigate those vulnerabilities.', translation: '이러한 취약성을 완화하기 위해 강건한 훈련 기법을 적용했습니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'Impressive. Could you share the ablation study results?', translation: '인상적이네요. 절제 연구 결과를 공유해 주시겠어요?', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: 'state-of-the-art performance', meaning: '최첨단 성능' },
      { expression: 'ablation study', meaning: '절제 연구' },
    ],
  },
  {
    title: '철학적 대화',
    emoji: '🤔',
    level: 'advanced',
    order: 31,
    dialogs: [
      { speaker: 'A' as const, text: 'Do you think consciousness can be fully explained by neuroscience?', translation: '의식이 신경과학으로 완전히 설명될 수 있다고 생각해?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'I believe there is an explanatory gap between neural correlates and subjective experience.', translation: '신경 상관물과 주관적 경험 사이에 설명적 간극이 있다고 생각해.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: 'So you lean towards dualism?', translation: '이원론 쪽인 거야?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'Not necessarily. I think it is more of an epistemological limitation than an ontological one.', translation: '꼭 그렇진 않아. 존재론적이라기보다 인식론적 한계에 가깝다고 봐.', isUserRole: true, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: 'explanatory gap', meaning: '설명적 간극' },
      { expression: 'lean towards ~', meaning: '~쪽으로 기울다' },
    ],
  },
  {
    title: '국제 무역 협상',
    emoji: '🤝',
    level: 'advanced',
    order: 32,
    dialogs: [
      { speaker: 'A' as const, text: 'We propose reducing tariffs on agricultural products by 25%.', translation: '농산물 관세를 25% 인하할 것을 제안합니다.', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'That would disproportionately affect our domestic farmers.', translation: '그것은 우리 국내 농가에 불균형적인 영향을 줄 것입니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: 'We could implement a gradual phase-out over five years with subsidies.', translation: '보조금과 함께 5년에 걸쳐 점진적으로 폐지할 수 있습니다.', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'That is more palatable. Let us draft a preliminary agreement.', translation: '그것이 더 수용 가능합니다. 예비 합의문 초안을 작성합시다.', isUserRole: true, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: 'reducing tariffs', meaning: '관세 인하' },
      { expression: 'gradual phase-out', meaning: '점진적 폐지' },
    ],
  },
];
