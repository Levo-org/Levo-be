/**
 * English Listening Seed Data
 *
 * Sources:
 *  - TOEIC Listening & Reading official sample test (ETS, ets.org/pdfs/toeic/
 *    toeic-listening-reading-sample-test.pdf) — dialogue and monologue formats.
 *  - TOEIC Speaking official sample tasks (ets.org/toeic/about/speaking).
 *  - Difficulty mapping:
 *      beginner     = TOEIC 300–500 (Part 1 & 2 style: single statements, short responses)
 *      elementary   = TOEIC 500–650 (Part 2 style: question-response exchanges, 2-line dialogues)
 *      intermediate = TOEIC 650–800 (Part 3 style: 3-turn conversations with comprehension Qs)
 *      advanced     = TOEIC 800+   (Part 4 style: monologues — announcements, reports, ads)
 *
 * audioText   : full transcript read aloud (what the learner hears).
 * correctAnswer: key information the learner must identify.
 * hint        : Korean-language clue for the learner.
 */
export const listeningEnData = [
  // ═══════════════════════════════════════════════════
  // BEGINNER  (TOEIC Part 1-2 style)  — items 1-8
  // Single statements or very short exchanges.
  // Key skill: catch the main topic / basic information.
  // ═══════════════════════════════════════════════════
  {
    audioText:
      'The woman is standing next to the photocopier in the office.',
    correctAnswer: 'She is standing next to the photocopier.',
    hint: 'TOEIC Part 1 사진 묘사 문제 형식이에요. 인물의 위치와 동작을 나타내는 표현을 들어보세요. "next to"는 ~옆에 라는 뜻이에요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 1,
  },
  {
    audioText:
      'The packages have been stacked neatly against the warehouse wall.',
    correctAnswer: 'The packages are stacked against the wall.',
    hint: '물건의 위치와 상태를 묘사해요. "stacked"는 쌓여 있다, "neatly"는 가지런히, "against"는 ~에 기대어 라는 뜻이에요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 2,
  },
  {
    audioText:
      'Man: Where should I send this report?\nWoman: Just leave it on my desk.',
    correctAnswer: 'Leave it on her desk.',
    hint: '보고서를 어디에 두어야 하는지 묻고 답하는 짧은 대화예요. 여자의 지시를 정확히 들어보세요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 3,
  },
  {
    audioText:
      'Man: Has the new manager arrived yet?\nWoman: Yes, she started on Monday.',
    correctAnswer: 'Yes, she started on Monday.',
    hint: '새 매니저의 출근 여부를 확인하는 대화예요. "Yes/No" 뒤에 구체적인 날짜 정보가 따라와요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 4,
  },
  {
    audioText:
      'Man: Is the conference room available at two o\'clock?\nWoman: I\'m afraid it\'s already booked until three.',
    correctAnswer: 'The conference room is booked until three o\'clock.',
    hint: '회의실 예약 가능 여부를 묻는 대화예요. "I\'m afraid"는 유감이지만~이라는 표현이에요. 몇 시까지 예약됐는지 들어보세요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 5,
  },
  {
    audioText:
      'Woman: Could you help me move these boxes to the storage room?\nMan: Sure, I\'ll be right there.',
    correctAnswer: 'He will help move the boxes.',
    hint: '도움을 요청하고 수락하는 짧은 대화예요. "I\'ll be right there"는 바로 갈게요 라는 뜻이에요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 6,
  },
  {
    audioText:
      'The cafeteria on the second floor will be closed for renovations starting next week.',
    correctAnswer: 'The cafeteria will be closed for renovations.',
    hint: '공지 형식의 짧은 문장이에요. 어떤 장소가, 무슨 이유로, 언제부터 닫히는지 세 가지 정보를 들어보세요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 7,
  },
  {
    audioText:
      'Man: When does the next train to the airport leave?\nWoman: In about fifteen minutes, from platform four.',
    correctAnswer: 'In about fifteen minutes, from platform four.',
    hint: '기차 출발 시간과 플랫폼을 묻는 대화예요. 숫자 두 가지(시간, 플랫폼 번호)를 놓치지 마세요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 8,
  },

  // ═══════════════════════════════════════════════════
  // ELEMENTARY  (TOEIC Part 2 style)  — items 9-16
  // Question-response or 2-line dialogue exchanges.
  // Key skill: identify the correct response to a question.
  // ═══════════════════════════════════════════════════
  {
    audioText:
      'Man: Where is the sales report?\nWoman: I left it on your desk this morning.',
    correctAnswer: 'It is on his desk.',
    hint: '물건 위치를 묻는 질문이에요. "I left it on your desk"에서 "it"이 무엇을 가리키는지 문맥으로 파악하세요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 9,
  },
  {
    audioText:
      'Woman: When does the meeting start?\nMan: At two thirty this afternoon.',
    correctAnswer: 'At two thirty this afternoon.',
    hint: 'When 질문에는 시간·날짜로 답해요. "two thirty"는 2시 30분이에요. 오전/오후 구분도 체크하세요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 10,
  },
  {
    audioText:
      'Man: Who\'s responsible for the marketing budget?\nWoman: That would be the finance department.',
    correctAnswer: 'The finance department.',
    hint: 'Who 질문에는 사람/부서로 답해요. "That would be ~"는 ~가 담당이에요 라는 완곡한 표현이에요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 11,
  },
  {
    audioText:
      'Woman: How often do you update the inventory records?\nMan: We do it at the end of every month.',
    correctAnswer: 'At the end of every month.',
    hint: 'How often 질문에는 빈도로 답해요. "every month"와 구체적인 시점 "end of"를 함께 들어보세요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 12,
  },
  {
    audioText:
      'Man: Have you contacted the supplier about the delay?\nWoman: Not yet. I was going to call them this afternoon.',
    correctAnswer: 'She plans to call the supplier this afternoon.',
    hint: '"Not yet"으로 아직 안 했다는 것을 알 수 있어요. 그럼 언제 할 예정인지 뒤 문장을 들어보세요. "was going to"는 ~할 예정이었다예요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 13,
  },
  {
    audioText:
      'Woman: Why is the office so quiet today?\nMan: Most of the staff are at the annual training session.',
    correctAnswer: 'The staff are at a training session.',
    hint: 'Why 질문에는 이유로 답해요. "Most of the staff"가 어디에 있는지 들어보세요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 14,
  },
  {
    audioText:
      'Man: Should I take the highway or the local road to the client\'s office?\nWoman: Take the highway — it\'s much faster at this time of day.',
    correctAnswer: 'Take the highway.',
    hint: '두 가지 선택지 중 하나를 고르는 질문이에요. 여자가 추천하는 이유도 함께 들어보세요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 15,
  },
  {
    audioText:
      'Woman: Could you proofread this proposal before I send it to the client?\nMan: Of course. When do you need it by?\nWoman: By noon if possible.\nMan: No problem, I\'ll have it done by eleven.',
    correctAnswer: 'He will proofread it by eleven o\'clock.',
    hint: '업무 요청과 마감 시간을 정하는 대화예요. 요청받은 사람이 언제까지 완료하겠다고 했는지 들어보세요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 16,
  },

  // ═══════════════════════════════════════════════════
  // INTERMEDIATE  (TOEIC Part 3 style)  — items 17-24
  // Three-turn conversations between two speakers.
  // Key skill: topic, suggestion, next action.
  // ═══════════════════════════════════════════════════
  {
    audioText:
      'Man: Sarah, have you looked at the figures for last quarter? Sales are down almost fifteen percent.\nWoman: Yes, I saw that. I think it\'s mainly because we lost the Henderson account in July.\nMan: You\'re right. We need to focus on bringing in new clients. Should we discuss this at Friday\'s meeting?\nWoman: Absolutely. I\'ll prepare a short presentation on potential leads.\n\nQuestion: What are the speakers mainly discussing?',
    correctAnswer: 'A drop in quarterly sales and how to recover.',
    hint: 'Part 3 대화의 주제를 파악하는 유형이에요. 첫 번째 발화에서 주제가 거의 항상 드러나요. 숫자(15%)와 이유(Henderson account)를 함께 메모하세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 17,
  },
  {
    audioText:
      'Woman: Excuse me, I ordered the grilled salmon but this looks like the pasta.\nMan: I\'m so sorry about that. Let me take this back to the kitchen right away.\nWoman: Thank you. Also, could I get some more water when you have a chance?\nMan: Of course, I\'ll bring that out immediately and make sure your salmon is out shortly.\n\nQuestion: Where does this conversation most likely take place?',
    correctAnswer: 'At a restaurant.',
    hint: '대화 장소를 추론하는 문제예요. 음식 주문, 잘못된 요리, 웨이터의 반응 — 이 세 가지 단서가 장소를 알려줘요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 18,
  },
  {
    audioText:
      'Man: I heard the office lease is up for renewal next spring. Is management thinking of moving?\nWoman: Actually, yes. They\'re considering two locations downtown. One is cheaper but farther from the subway.\nMan: That would be a problem for a lot of employees. What do you think they\'ll decide?\nWoman: I\'m not sure, but there\'s a vote scheduled for next Thursday.\n\nQuestion: What will happen next Thursday?',
    correctAnswer: 'A vote on the new office location.',
    hint: '직원들의 사무실 이전에 관한 대화예요. "next Thursday"와 연결된 행동이 무엇인지 들어보세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 19,
  },
  {
    audioText:
      'Woman: Hi, I\'d like to return this jacket. I bought it last week but it\'s too small.\nMan: Do you have your receipt?\nWoman: Yes, here it is. I paid by credit card.\nMan: Great. Would you like to exchange it for a larger size, or would you prefer a refund?\nWoman: I\'ll take the exchange if you have it in medium.\n\nQuestion: What does the woman decide to do?',
    correctAnswer: 'Exchange the jacket for a medium size.',
    hint: '환불/교환 관련 대화예요. 여자의 최종 선택을 들어보세요. "refund"(환불)와 "exchange"(교환) 중 무엇을 선택했나요?',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 20,
  },
  {
    audioText:
      'Man: We\'ve had three complaints this week about the new software update.\nWoman: I know. The IT team is working on a patch, but it won\'t be ready until Friday.\nMan: Should we notify customers now or wait until the fix is available?\nWoman: I think we should send an email today to acknowledge the issue and let them know help is on the way.\n\nQuestion: What does the woman suggest doing?',
    correctAnswer: 'Send an email to customers today to acknowledge the issue.',
    hint: '문제 상황에 대한 대응 방법을 논의하는 대화예요. 여자의 제안(suggest)이 무엇인지 들어보세요. "acknowledge"는 (문제를) 인정하다예요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 21,
  },
  {
    audioText:
      'Woman: Are you coming to the product launch event on Thursday evening?\nMan: I\'d like to, but I have a flight to catch at seven. What time does it start?\nWoman: It starts at five, so you might be able to make part of it.\nMan: In that case, I\'ll try to stop by for the first hour at least.\n\nQuestion: What does the man plan to do on Thursday?',
    correctAnswer: 'Attend the first part of the event before catching his flight.',
    hint: '일정이 겹치는 상황이에요. 남자가 이벤트에 전부 참석할 수 있는지, 비행기를 언제 타야 하는지 파악하세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 22,
  },
  {
    audioText:
      'Man: The projector in Room B isn\'t working again. I have a presentation in twenty minutes.\nWoman: Room A is free until noon if you want to use that one instead.\nMan: That would be great. Can you help me move my laptop and slides over there?\nWoman: Sure, let\'s go.\n\nQuestion: What problem does the man have?',
    correctAnswer: 'The projector in Room B is not working.',
    hint: '문제 상황과 해결책을 찾는 대화예요. 남자의 첫 번째 발화에 문제가 직접적으로 제시돼요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 23,
  },
  {
    audioText:
      'Woman: I noticed your team has been working late all week. Is everything okay with the product deadline?\nMan: We\'re a bit behind schedule because one of our developers got sick. We\'re hoping to wrap up testing by Wednesday.\nWoman: Is there anything I can do to help? I could reassign a couple of people from my team temporarily.\nMan: That would actually be really helpful. Two extra people for three days would make a big difference.\n\nQuestion: Why is the man\'s team behind schedule?',
    correctAnswer: 'One of the developers got sick.',
    hint: '일정 지연 이유와 해결 방안을 묻는 대화예요. 지연 이유는 남자의 두 번째 발화에 명확히 나와요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 24,
  },

  // ═══════════════════════════════════════════════════
  // ADVANCED  (TOEIC Part 4 style)  — items 25-32
  // Single-speaker monologues: announcements, ads, reports.
  // Key skill: main purpose, specific details, listener action.
  // ═══════════════════════════════════════════════════
  {
    audioText:
      'Attention all passengers. Flight KA-471 to Singapore has been delayed by approximately two hours due to a technical inspection. The new scheduled departure time is nineteen forty-five. We apologize for the inconvenience. Passengers are welcome to use the lounge facilities on Level Two. Boarding will begin thirty minutes before departure. Please listen for further announcements.',
    correctAnswer: 'The flight is delayed by two hours; new departure is 19:45.',
    hint: 'Part 4 공항 안내 방송이에요. 편명, 목적지, 지연 이유, 새 출발 시각, 승객에게 주는 안내를 순서대로 메모하세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 25,
  },
  {
    audioText:
      'Good morning, team. I want to take a few minutes to update you on the Greenfield project. As of yesterday, we\'ve completed the market research phase ahead of schedule. The next step is to finalize the product specifications by the end of this month. I\'d like each department head to submit their section of the specs report no later than the twenty-fifth. If you run into any issues, please come to me directly rather than waiting for the weekly meeting. Thank you.',
    correctAnswer: 'Department heads must submit spec reports by the 25th.',
    hint: '프로젝트 업데이트 공지예요. 완료된 단계, 다음 단계, 마감일, 요청 사항을 순서대로 들어보세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 26,
  },
  {
    audioText:
      'Are you tired of spending hours searching for a parking spot downtown? Park-Easy has the solution. With our mobile app, you can reserve a guaranteed parking space at any of our forty locations across the city — up to seven days in advance. Download the app today and use promo code EASY20 for twenty percent off your first month\'s subscription. Visit park-easy dot com or search "Park-Easy" in your app store.',
    correctAnswer: 'Park-Easy app lets you reserve parking in advance; use code EASY20 for 20% off.',
    hint: '앱 서비스 광고예요. 서비스의 핵심 기능, 할인 코드, 이용 방법을 들어보세요. 숫자(40개 지점, 7일 전, 20% 할인)를 놓치지 마세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 27,
  },
  {
    audioText:
      'Welcome to the Riverside Conference Center. Before we begin today\'s symposium, I\'d like to go over a few housekeeping items. All sessions will be held in the East and West wings of the building. Lunch will be served in the Garden Atrium from twelve to one thirty. If you have any dietary requirements that weren\'t noted on your registration, please speak to one of our staff members wearing green badges. The keynote speaker this afternoon is Dr. Helen Park, who will address the future of renewable energy. We hope you enjoy today\'s program.',
    correctAnswer: 'Lunch is in the Garden Atrium; keynote is Dr. Helen Park on renewable energy.',
    hint: '학술 행사 안내 방송이에요. 세션 장소, 점심 시간·장소, 특별 요청 방법, 기조연설자와 주제를 메모하세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 28,
  },
  {
    audioText:
      'This is a message for Mr. David Kim from Horizon Financial. This is Sandra Lee calling regarding your account review scheduled for next Tuesday at ten AM. Unfortunately, our senior advisor Mr. Thompson will be out of the office that day due to a family commitment. We would like to reschedule your appointment to either Wednesday at two PM or Thursday at eleven AM. Please call us back at five five five, oh nine two zero to confirm your preference. We apologize for any inconvenience.',
    correctAnswer: 'The Tuesday appointment needs rescheduling; options are Wednesday 2PM or Thursday 11AM.',
    hint: '전화 메시지(voicemail) 형식이에요. 누가 왜 전화했는지, 기존 약속이 왜 변경되는지, 대안 시간이 언제인지 들어보세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 29,
  },
  {
    audioText:
      'Good evening. Our top story tonight: city officials have announced plans to expand the downtown metro line by six stations over the next four years. The project, estimated to cost eight hundred million dollars, will connect three currently underserved neighborhoods to the main transit hub. Construction is expected to begin in the spring of next year. Officials say the expansion will reduce peak-hour traffic congestion by up to thirty percent. More details on tonight\'s full report.',
    correctAnswer: 'The metro line will expand by 6 stations; construction starts next spring.',
    hint: '뉴스 리포트 형식이에요. 주요 뉴스의 핵심 요소: 누가(city officials), 무엇을(지하철 확장), 규모(6개 역, 8억 달러), 시기(내년 봄 착공), 효과(교통 혼잡 30% 감소)를 정리하세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 30,
  },
  {
    audioText:
      'Hello, this is an automated reminder from Oakwood Medical Center. You have an appointment with Dr. Patel scheduled for this Friday, April the fifth, at three fifteen PM. Please arrive ten minutes early to complete any necessary paperwork. If you need to cancel or reschedule, please call our office at least twenty-four hours in advance at five five five, two one four zero. We look forward to seeing you. Have a great day.',
    correctAnswer: 'Appointment with Dr. Patel: Friday April 5th at 3:15 PM; arrive 10 minutes early.',
    hint: '병원 예약 자동 알림이에요. 의사 이름, 날짜, 시간, 도착 안내, 취소 방법을 차례로 들어보세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 31,
  },
  {
    audioText:
      'Thank you for calling Brightline Internet Services. We are currently experiencing a service outage affecting customers in the Northside and Eastview districts. Our technical team is working to restore full service as quickly as possible, and we expect the issue to be resolved within the next three hours. If you are not in one of these affected areas but are still experiencing connectivity issues, please press one to speak with a customer service representative. We appreciate your patience and apologize for any disruption to your service.',
    correctAnswer: 'Outage in Northside and Eastview; expected resolution within 3 hours.',
    hint: '고객센터 자동 응답(IVR) 형식이에요. 어느 지역에 장애가 발생했는지, 언제 복구될 예정인지, 해당 지역 외 고객은 어떻게 해야 하는지 들어보세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 32,
  },
];
