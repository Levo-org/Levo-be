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
  // BEGINNER  (TOEIC Part 1-2 style)  — items 1-30
  // Single statements or very short exchanges.
  // Key skill: catch the main topic / basic information.
  // ═══════════════════════════════════════════════════
  {
    audioText: 'The woman is standing next to the photocopier in the office.',
    correctAnswer: 'She is standing next to the photocopier.',
    hint: 'TOEIC Part 1 사진 묘사 문제 형식이에요. 인물의 위치와 동작을 나타내는 표현을 들어보세요. "next to"는 ~옆에 라는 뜻이에요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 1,
  },
  {
    audioText: 'The packages have been stacked neatly against the warehouse wall.',
    correctAnswer: 'The packages are stacked against the wall.',
    hint: '물건의 위치와 상태를 묘사해요. "stacked"는 쌓여 있다, "neatly"는 가지런히, "against"는 ~에 기대어 라는 뜻이에요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 2,
  },
  {
    audioText: 'Man: Where should I send this report?\nWoman: Just leave it on my desk.',
    correctAnswer: 'Leave it on her desk.',
    hint: '보고서를 어디에 두어야 하는지 묻고 답하는 짧은 대화예요. 여자의 지시를 정확히 들어보세요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 3,
  },
  {
    audioText: 'Man: Has the new manager arrived yet?\nWoman: Yes, she started on Monday.',
    correctAnswer: 'Yes, she started on Monday.',
    hint: '새 매니저의 출근 여부를 확인하는 대화예요. "Yes/No" 뒤에 구체적인 날짜 정보가 따라와요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 4,
  },
  {
    audioText: "Man: Is the conference room available at two o'clock?\nWoman: I'm afraid it's already booked until three.",
    correctAnswer: "The conference room is booked until three o'clock.",
    hint: '회의실 예약 가능 여부를 묻는 대화예요. "I\'m afraid"는 유감이지만~이라는 표현이에요. 몇 시까지 예약됐는지 들어보세요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 5,
  },
  {
    audioText: 'Woman: Could you help me move these boxes to the storage room?\nMan: Sure, I\'ll be right there.',
    correctAnswer: 'He will help move the boxes.',
    hint: '도움을 요청하고 수락하는 짧은 대화예요. "I\'ll be right there"는 바로 갈게요 라는 뜻이에요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 6,
  },
  {
    audioText: 'The cafeteria on the second floor will be closed for renovations starting next week.',
    correctAnswer: 'The cafeteria will be closed for renovations.',
    hint: '공지 형식의 짧은 문장이에요. 어떤 장소가, 무슨 이유로, 언제부터 닫히는지 세 가지 정보를 들어보세요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 7,
  },
  {
    audioText: 'Man: When does the next train to the airport leave?\nWoman: In about fifteen minutes, from platform four.',
    correctAnswer: 'In about fifteen minutes, from platform four.',
    hint: '기차 출발 시간과 플랫폼을 묻는 대화예요. 숫자 두 가지(시간, 플랫폼 번호)를 놓치지 마세요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 8,
  },
  {
    audioText: 'A woman is typing on a computer keyboard in a bright office.',
    correctAnswer: 'She is typing on a keyboard.',
    hint: '인물의 구체적인 동작(typing)과 장소(office)를 묘사하는 문장이에요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 9,
  },
  {
    audioText: 'The man is adjusting his glasses while looking at some documents.',
    correctAnswer: 'The man is adjusting his glasses.',
    hint: '"adjusting"은 (안경 등을) 고쳐 쓰거나 조정하다라는 뜻이에요. 동작을 나타내는 현재진행형을 잘 들어보세요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 10,
  },
  {
    audioText: 'Several bicycles are parked in a row along the sidewalk.',
    correctAnswer: 'Bicycles are parked along the sidewalk.',
    hint: '사물의 상태와 위치를 나타내요. "in a row"는 한 줄로, "along"은 ~을 따라라는 의미예요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 11,
  },
  {
    audioText: 'Man: Do you have a pen I can borrow?\nWoman: Yes, I have one right here in my bag.',
    correctAnswer: 'She has a pen in her bag.',
    hint: '물건을 빌리는 상황이에요. "borrow"(빌리다)와 "lend"(빌려주다)의 차이를 기억하세요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 12,
  },
  {
    audioText: 'The shop assistant is handing a receipt to the customer.',
    correctAnswer: 'A receipt is being handed to a customer.',
    hint: '"handing"은 건네주다라는 동작을 나타내요. 점원과 고객 사이의 상호작용을 들어보세요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 13,
  },
  {
    audioText: 'Man: Who is leading the workshop this afternoon?\nWoman: Mr. Thompson from the marketing team.',
    correctAnswer: 'Mr. Thompson is leading the workshop.',
    hint: 'Who 질문에는 사람의 이름이나 직함으로 답하는 경우가 많아요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 14,
  },
  {
    audioText: 'A group of people is sitting around a wooden table in a cafe.',
    correctAnswer: 'People are sitting around a table.',
    hint: '"sitting around"은 ~에 둘러앉아 있다라는 뜻으로, 그룹 활동 사진 묘사에서 자주 쓰여요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 15,
  },
  {
    audioText: 'Man: Is there a pharmacy nearby?\nWoman: Yes, there is one just across the street.',
    correctAnswer: 'The pharmacy is across the street.',
    hint: '위치를 묻는 질문이에요. "nearby"(근처에)와 "across the street"(길 건너에)를 익혀두세요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 16,
  },
  {
    audioText: 'Some potted plants have been placed on the window sill.',
    correctAnswer: 'Plants are on the window sill.',
    hint: '사물의 배치를 묘사해요. "placed"는 놓여 있다, "window sill"은 창틀이라는 뜻이에요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 17,
  },
  {
    audioText: 'Woman: How do I get to the library?\nMan: Walk straight for two blocks and turn left.',
    correctAnswer: 'Go straight and turn left after two blocks.',
    hint: '길 찾기 질문(How do I get to~?)에 대한 전형적인 방향 지시 표현이에요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 18,
  },
  {
    audioText: 'The technician is repairing a laptop computer at his workbench.',
    correctAnswer: 'A technician is fixing a computer.',
    hint: '"repairing"과 "fixing"은 수리하다라는 의미의 유의어예요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 19,
  },
  {
    audioText: 'Man: Why is the elevator not working?\nWoman: It is under maintenance until four PM.',
    correctAnswer: 'The elevator is under maintenance.',
    hint: '이유를 묻는 질문(Why~?)에 대한 답변이에요. "under maintenance"는 점검 중/수리 중이라는 뜻이에요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 20,
  },
  {
    audioText: 'A woman is browsing through some books on a shelf.',
    correctAnswer: 'She is looking at some books.',
    hint: '"browsing through"는 ~을 훑어보다, 구경하다라는 뜻으로 상점이나 도서관 배경 사진에서 자주 나와요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 21,
  },
  {
    audioText: 'Man: What time is the keynote speech?\nWoman: It starts at ten thirty sharp in the main hall.',
    correctAnswer: 'The speech begins at 10:30.',
    hint: '"sharp"은 정각에라는 뜻으로 시간을 강조할 때 쓰여요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 22,
  },
  {
    audioText: 'The workers are wearing safety helmets and orange vests.',
    correctAnswer: 'The workers are wearing safety gear.',
    hint: '복장을 묘사하는 문장이에요. "safety helmets"와 "vests"를 "safety gear"로 포괄해 표현할 수 있어요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 23,
  },
  {
    audioText: 'Woman: Did you finish the data entry tasks?\nMan: Almost, I just have two more files to go.',
    correctAnswer: 'He has nearly finished the tasks.',
    hint: '"Almost"는 거의 다 했다는 뜻이에요. "to go"는 남았다라는 의미로 쓰였어요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 24,
  },
  {
    audioText: 'A fountain is spraying water into the air in the park.',
    correctAnswer: 'A fountain is operating in the park.',
    hint: '주변 경치를 묘사해요. "fountain"은 분수, "spraying"은 (물을) 뿌리다라는 뜻이에요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 25,
  },
  {
    audioText: 'Man: Can I pay by credit card?\nWoman: Of course, we accept all major cards here.',
    correctAnswer: 'Credit cards are accepted.',
    hint: '결제 수단을 확인하는 대화예요. "accept"는 수락하다, 받다라는 뜻이에요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 26,
  },
  {
    audioText: 'The bus is pulling into the station to pick up passengers.',
    correctAnswer: 'A bus is arriving at the station.',
    hint: '"pulling into"는 (차량이) 들어오다라는 표현이에요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 27,
  },
  {
    audioText: 'Woman: Whose umbrella is this?\nMan: It belongs to the guest in room 204.',
    correctAnswer: 'It is the guest\'s umbrella.',
    hint: '소유주를 묻는 질문(Whose~?)이에요. "belongs to"는 ~의 것이다라는 뜻이에요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 28,
  },
  {
    audioText: 'A man is loading some groceries into the trunk of a car.',
    correctAnswer: 'He is putting groceries in a car.',
    hint: '"loading"은 (짐을) 싣다라는 뜻이고, "groceries"는 식료품이에요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 29,
  },
  {
    audioText: 'Man: Shall we take a break for lunch?\nWoman: Good idea, let\'s go to the cafe downstairs.',
    correctAnswer: 'They will go to a cafe for a break.',
    hint: '제안(Shall we~?)과 수락하는 대화예요. 목적지(cafe downstairs)를 잘 들어보세요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 30,
  },

  // ═══════════════════════════════════════════════════
  // ELEMENTARY  (TOEIC Part 2 style)  — items 31-60
  // Question-response or 2-line dialogue exchanges.
  // Key skill: identify the correct response to a question.
  // ═══════════════════════════════════════════════════
  {
    audioText: 'Man: Where is the sales report?\nWoman: I left it on your desk this morning.',
    correctAnswer: 'It is on his desk.',
    hint: '물건 위치를 묻는 질문이에요. "I left it on your desk"에서 "it"이 무엇을 가리키는지 문맥으로 파악하세요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 31,
  },
  {
    audioText: 'Woman: When does the meeting start?\nMan: At two thirty this afternoon.',
    correctAnswer: 'At two thirty this afternoon.',
    hint: 'When 질문에는 시간·날짜로 답해요. "two thirty"는 2시 30분이에요. 오전/오후 구분도 체크하세요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 32,
  },
  {
    audioText: "Man: Who's responsible for the marketing budget?\nWoman: That would be the finance department.",
    correctAnswer: 'The finance department.',
    hint: 'Who 질문에는 사람/부서로 답해요. "That would be ~"는 ~가 담당이에요 라는 완곡한 표현이에요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 33,
  },
  {
    audioText: 'Woman: How often do you update the inventory records?\nMan: We do it at the end of every month.',
    correctAnswer: 'At the end of every month.',
    hint: 'How often 질문에는 빈도로 답해요. "every month"와 구체적인 시점 "end of"를 함께 들어보세요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 34,
  },
  {
    audioText: 'Man: Have you contacted the supplier about the delay?\nWoman: Not yet. I was going to call them this afternoon.',
    correctAnswer: 'She plans to call the supplier this afternoon.',
    hint: '"Not yet"으로 아직 안 했다는 것을 알 수 있어요. 그럼 언제 할 예정인지 뒤 문장을 들어보세요. "was going to"는 ~할 예정이었다예요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 35,
  },
  {
    audioText: 'Woman: Why is the office so quiet today?\nMan: Most of the staff are at the annual training session.',
    correctAnswer: 'The staff are at a training session.',
    hint: 'Why 질문에는 이유로 답해요. "Most of the staff"가 어디에 있는지 들어보세요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 36,
  },
  {
    audioText: "Man: Should I take the highway or the local road to the client's office?\nWoman: Take the highway — it's much faster at this time of day.",
    correctAnswer: 'Take the highway.',
    hint: '두 가지 선택지 중 하나를 고르는 질문이에요. 여자가 추천하는 이유도 함께 들어보세요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 37,
  },
  {
    audioText: 'Woman: Could you proofread this proposal before I send it to the client?\nMan: Of course. When do you need it by?\nWoman: By noon if possible.\nMan: No problem, I\'ll have it done by eleven.',
    correctAnswer: 'He will proofread it by eleven o\'clock.',
    hint: '업무 요청과 마감 시간을 정하는 대화예요. 요청받은 사람이 언제까지 완료하겠다고 했는지 들어보세요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 38,
  },
  {
    audioText: 'Man: Which printer should I use for these color brochures?\nWoman: Use the one in the graphic design department upstairs.',
    correctAnswer: 'The printer on the upper floor.',
    hint: '여러 대상 중 하나를 선택하는 Which 질문이에요. 위치 정보(upstairs)를 정확히 들어보세요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 39,
  },
  {
    audioText: 'Woman: How many people signed up for the charity run?\nMan: So far, we have about fifty participants.',
    correctAnswer: 'Around fifty people signed up.',
    hint: '수량을 묻는 How many 질문이에요. "So far"는 지금까지라는 뜻이에요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 40,
  },
  {
    audioText: 'Man: Why was the shipment returned to the warehouse?\nWoman: Because the shipping address was incorrect.',
    correctAnswer: 'The address was wrong.',
    hint: '원인과 결과를 파악하는 대화예요. "Incorrect"는 틀린, 부정확한이라는 뜻이에요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 41,
  },
  {
    audioText: 'Woman: Are we still going to the trade show next week?\nMan: Actually, it has been postponed until the following month.',
    correctAnswer: 'The trade show is postponed.',
    hint: '일정 변경 여부를 묻는 질문이에요. "Postponed"는 연기되었다라는 필수 표현이에요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 42,
  },
  {
    audioText: 'Man: Can you recommend a good place for a business lunch nearby?\nWoman: The Italian bistro around the corner is very quiet and professional.',
    correctAnswer: 'The nearby Italian bistro.',
    hint: '추천을 요청하는 상황이에요. "Around the corner"는 모퉁이를 돌면 있는(가까운)이라는 뜻이에요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 43,
  },
  {
    audioText: 'Woman: Has the IT department fixed the server issue yet?\nMan: They are still working on it, but it should be up soon.',
    correctAnswer: 'The server is not fixed yet.',
    hint: '현재 상태를 확인하는 대화예요. "Still working on it"은 여전히 작업 중이라는 뜻이에요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 44,
  },
  {
    audioText: 'Man: Do you want to review the presentation now or after the break?\nWoman: Let\'s do it now while the information is fresh in our minds.',
    correctAnswer: 'They will review it now.',
    hint: '선택 의문문이에요. 여자가 "지금" 하자고 제안한 이유(fresh in our minds)도 이해해 보세요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 45,
  },
  {
    audioText: 'Woman: Whose turn is it to lead the weekly staff meeting?\nMan: I believe it\'s Susan\'s turn this time.',
    correctAnswer: 'Susan will lead the meeting.',
    hint: '순서를 묻는 Whose turn 질문이에요. "I believe"는 (내가 알기로는) ~인 것 같다라는 표현이에요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 46,
  },
  {
    audioText: 'Man: How do I submit my travel reimbursement request?\nWoman: You need to upload your receipts to the online portal.',
    correctAnswer: 'Upload receipts to the online portal.',
    hint: '절차를 묻는 How 질문이에요. "Reimbursement"는 비용 상환, "Portal"은 입구/사이트라는 뜻이에요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 47,
  },
  {
    audioText: 'Woman: Where can I find extra batteries for the remote control?\nMan: Check the bottom drawer of the supply cabinet.',
    correctAnswer: 'In the supply cabinet drawer.',
    hint: '위치를 묻는 질문이에요. "Supply cabinet"은 비품 보관함을 의미해요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 48,
  },
  {
    audioText: 'Man: Should we hire a temporary assistant for the busy season?\nWoman: That sounds like a great idea. I\'ll talk to HR about it.',
    correctAnswer: 'She will contact HR about hiring.',
    hint: '제안과 이에 따른 후속 조치를 나타내요. "HR"은 인사과(Human Resources)의 약어예요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 49,
  },
  {
    audioText: 'Woman: How long is the flight from London to New York?\nMan: It usually takes about seven to eight hours.',
    correctAnswer: 'Between seven and eight hours.',
    hint: '기간을 묻는 How long 질문이에요. 시간 단위(hours)를 확인하세요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 50,
  },
  {
    audioText: 'Man: When is the deadline for the magazine article submission?\nWoman: It\'s by the end of business today.',
    correctAnswer: 'By the end of the day.',
    hint: '마감 기한을 묻는 질문이에요. "End of business"는 업무 종료 시각(주로 오후 5~6시)을 뜻해요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 51,
  },
  {
    audioText: 'Woman: Why aren\'t you using the new software yet?\nMan: I haven\'t received the installation code from IT.',
    correctAnswer: 'He is waiting for an installation code.',
    hint: '원인을 묻는 Why 질문이에요. 받지 못한 대상(installation code)이 무엇인지 들어보세요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 52,
  },
  {
    audioText: 'Man: Would you mind helping me with these heavy boxes?\nWoman: Not at all. Where do you want me to put them?',
    correctAnswer: 'She is willing to help.',
    hint: '"Would you mind~?"는 부탁할 때 쓰는 정중한 표현이에요. "Not at all"은 전혀 꺼리지 않는다(도와주겠다)는 긍정의 대답이에요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 53,
  },
  {
    audioText: 'Woman: How much is the entrance fee for the museum?\nMan: It\'s fifteen dollars for adults and ten for students.',
    correctAnswer: 'Adults pay fifteen dollars.',
    hint: '가격을 묻는 How much 질문이에요. 대상별 가격 차이를 들어보세요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 54,
  },
  {
    audioText: 'Man: Who did you talk to at the client company?\nWoman: I spoke with the accounts manager, Ms. Lewis.',
    correctAnswer: 'She talked to Ms. Lewis.',
    hint: '상담 대상을 확인하는 질문이에요. "Accounts manager"는 회계 부장이나 거래처 담당자를 뜻해요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 55,
  },
  {
    audioText: 'Woman: Is the company cafeteria open on weekends?\nMan: No, it\'s only open from Monday to Friday.',
    correctAnswer: 'It is closed on weekends.',
    hint: '운영 시간을 묻는 질문이에요. "Only"를 통해 주말에는 닫는다는 것을 유추할 수 있어요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 56,
  },
  {
    audioText: 'Man: What is the weather forecast for tomorrow?\nWoman: They are predicting heavy rain in the afternoon.',
    correctAnswer: 'Rain is expected tomorrow afternoon.',
    hint: '날씨 예보를 묻는 질문이에요. "Predicting"은 예측하다라는 뜻이에요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 57,
  },
  {
    audioText: 'Woman: Have you seen my car keys anywhere?\nMan: I think you left them on the kitchen counter.',
    correctAnswer: 'The keys are on the kitchen counter.',
    hint: '분실물 위치를 찾는 대화예요. "Counter"는 조리대나 카운터를 의미해요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 58,
  },
  {
    audioText: 'Man: Could you send me the agenda for tomorrow\'s board meeting?\nWoman: Sure, I\'ll email it to you in a few minutes.',
    correctAnswer: 'She will email the agenda shortly.',
    hint: '자료 요청과 전송 약속을 담은 대화예요. "Agenda"는 의제/안건이라는 뜻이에요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 59,
  },
  {
    audioText: 'Woman: Do you prefer a window seat or an aisle seat?\nMan: I\'d prefer the aisle seat, please.',
    correctAnswer: 'The man wants an aisle seat.',
    hint: '좌석 선호도를 묻는 선택 의문문이에요. "Aisle"은 통로라는 뜻으로 발음할 때 \'s\'가 묵음이에요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 60,
  },

  // ═══════════════════════════════════════════════════
  // INTERMEDIATE  (TOEIC Part 3 style)  — items 61-90
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
    order: 61,
  },
  {
    audioText:
      'Woman: Excuse me, I ordered the grilled salmon but this looks like the pasta.\nMan: I\'m so sorry about that. Let me take this back to the kitchen right away.\nWoman: Thank you. Also, could I get some more water when you have a chance?\nMan: Of course, I\'ll bring that out immediately and make sure your salmon is out shortly.\n\nQuestion: Where does this conversation most likely take place?',
    correctAnswer: 'At a restaurant.',
    hint: '대화 장소를 추론하는 문제예요. 음식 주문, 잘못된 요리, 웨이터의 반응 — 이 세 가지 단서가 장소를 알려줘요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 62,
  },
  {
    audioText:
      'Man: I heard the office lease is up for renewal next spring. Is management thinking of moving?\nWoman: Actually, yes. They\'re considering two locations downtown. One is cheaper but farther from the subway.\nMan: That would be a problem for a lot of employees. What do you think they\'ll decide?\nWoman: I\'m not sure, but there\'s a vote scheduled for next Thursday.\n\nQuestion: What will happen next Thursday?',
    correctAnswer: 'A vote on the new office location.',
    hint: '직원들의 사무실 이전에 관한 대화예요. "next Thursday"와 연결된 행동이 무엇인지 들어보세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 63,
  },
  {
    audioText:
      'Woman: Hi, I\'d like to return this jacket. I bought it last week but it\'s too small.\nMan: Do you have your receipt?\nWoman: Yes, here it is. I paid by credit card.\nMan: Great. Would you like to exchange it for a larger size, or would you prefer a refund?\nWoman: I\'ll take the exchange if you have it in medium.\n\nQuestion: What does the woman decide to do?',
    correctAnswer: 'Exchange the jacket for a medium size.',
    hint: '환불/교환 관련 대화예요. 여자의 최종 선택을 들어보세요. "refund"(환불)와 "exchange"(교환) 중 무엇을 선택했나요?',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 64,
  },
  {
    audioText:
      'Man: We\'ve had three complaints this week about the new software update.\nWoman: I know. The IT team is working on a patch, but it won\'t be ready until Friday.\nMan: Should we notify customers now or wait until the fix is available?\nWoman: I think we should send an email today to acknowledge the issue and let them know help is on the way.\n\nQuestion: What does the woman suggest doing?',
    correctAnswer: 'Send an email to customers today to acknowledge the issue.',
    hint: '문제 상황에 대한 대응 방법을 논의하는 대화예요. 여자의 제안(suggest)이 무엇인지 들어보세요. "acknowledge"는 (문제를) 인정하다예요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 65,
  },
  {
    audioText:
      'Woman: Are you coming to the product launch event on Thursday evening?\nMan: I\'d like to, but I have a flight to catch at seven. What time does it start?\nWoman: It starts at five, so you might be able to make part of it.\nMan: In that case, I\'ll try to stop by for the first hour at least.\n\nQuestion: What does the man plan to do on Thursday?',
    correctAnswer: 'Attend the first part of the event before catching his flight.',
    hint: '일정이 겹치는 상황이에요. 남자가 이벤트에 전부 참석할 수 있는지, 비행기를 언제 타야 하는지 파악하세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 66,
  },
  {
    audioText:
      'Man: The projector in Room B isn\'t working again. I have a presentation in twenty minutes.\nWoman: Room A is free until noon if you want to use that one instead.\nMan: That would be great. Can you help me move my laptop and slides over there?\nWoman: Sure, let\'s go.\n\nQuestion: What problem does the man have?',
    correctAnswer: 'The projector in Room B is not working.',
    hint: '문제 상황과 해결책을 찾는 대화예요. 남자의 첫 번째 발화에 문제가 직접적으로 제시돼요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 67,
  },
  {
    audioText:
      'Woman: I noticed your team has been working late all week. Is everything okay with the product deadline?\nMan: We\'re a bit behind schedule because one of our developers got sick. We\'re hoping to wrap up testing by Wednesday.\nWoman: Is there anything I can do to help? I could reassign a couple of people from my team temporarily.\nMan: That would actually be really helpful. Two extra people for three days would make a big difference.\n\nQuestion: Why is the man\'s team behind schedule?',
    correctAnswer: 'One of the developers got sick.',
    hint: '일정 지연 이유와 해결 방안을 묻는 대화예요. 지연 이유는 남자의 두 번째 발화에 명확히 나와요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 68,
  },
  {
    audioText:
      'Man: Welcome back! How was your trip to the Chicago conference?\nWoman: It was very productive. I met several potential suppliers for our new clothing line.\nMan: That\'s great news. Did you have a chance to talk to the reps from Orion Textiles?\nWoman: Yes, they offered us a significant discount on bulk orders. I have their catalog in my office.\n\nQuestion: What does the woman say about Orion Textiles?',
    correctAnswer: 'They offered a discount for large orders.',
    hint: '출장 결과에 대한 대화예요. 특정 업체(Orion Textiles)에 대한 구체적인 정보(discount on bulk orders)를 들어보세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 69,
  },
  {
    audioText:
      'Woman: Hi, I\'m calling to inquire about the three-bedroom apartment on Oak Street.\nMan: Oh, I\'m sorry, but that unit was just rented out yesterday morning.\nWoman: That\'s too bad. Do you have anything similar available in the same neighborhood?\nMan: We have a two-bedroom unit opening up next week, but the rent is slightly higher because it was recently renovated.\n\nQuestion: Why was the apartment on Oak Street unavailable?',
    correctAnswer: 'It was already rented to someone else.',
    hint: '부동산 관련 상담이에요. 원하는 매물이 왜 없는지(rented out), 대안은 무엇인지 파악하세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 70,
  },
  {
    audioText:
      'Man: I\'ve been trying to log into the company portal, but my password isn\'t working.\nWoman: Did you change it recently? The system requires a mandatory password update every ninety days.\nMan: I don\'t think so. Should I contact the IT help desk?\nWoman: Actually, you can reset it yourself by clicking the "forgot password" link on the home page.\n\nQuestion: What does the woman advise the man to do?',
    correctAnswer: 'Reset his password using the link on the home page.',
    hint: '기술적 문제에 대한 대화예요. 여자의 제안(Reset it yourself)을 정확히 들어보세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 71,
  },
  {
    audioText:
      'Woman: The feedback on our new mobile app has been mostly positive, but some users find the navigation confusing.\nMan: I noticed that too. Maybe we should add a short tutorial for first-time users.\nWoman: That\'s a good idea, but it might take a while to develop. For now, let\'s just simplify the main menu icons.\nMan: Okay, I\'ll ask the design team to come up with some new icons by tomorrow.\n\nQuestion: What will be done immediately to improve the app?',
    correctAnswer: 'The main menu icons will be simplified.',
    hint: '제품 개선 방안에 대한 대화예요. 여러 제안 중 "당장(For now)" 시행할 행동이 무엇인지 구분하세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 72,
  },
  {
    audioText:
      'Man: Excuse me, is this the line for the registration desk for the marketing seminar?\nWoman: Yes, but it\'s moving very slowly. I\'ve been waiting for over twenty minutes.\nMan: Oh no, I hope I don\'t miss the opening remarks at nine o\'clock.\nWoman: If you already registered online, there\'s a separate express line over by the main entrance.\n\nQuestion: What does the woman suggest the man do if he registered online?',
    correctAnswer: 'Go to the express line near the entrance.',
    hint: '세미나 등록 현장에서의 대화예요. 여자가 주는 팁(separate express line)을 들어보세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 73,
  },
  {
    audioText:
      'Woman: Mr. Harris, your car is ready to be picked up. We replaced the brake pads and changed the oil.\nMan: Thank you. Was there anything else wrong with it? I heard a strange noise in the engine last week.\nWoman: Our mechanic checked the engine and found a loose belt, which we tightened at no extra charge.\nMan: I appreciate that. I\'ll be there in half an hour to settle the bill.\n\nQuestion: What extra service was performed for free?',
    correctAnswer: 'Tightening a loose engine belt.',
    hint: '자동차 수리 관련 대화예요. 추가로(extra), 무료로(no extra charge) 제공된 서비스가 무엇인지 들어보세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 74,
  },
  {
    audioText:
      'Man: I\'m looking for a gift for my daughter. She\'s starting her first year of university next month.\nWoman: How about a high-quality laptop bag? We have several durable styles over in the luggage section.\nMan: That sounds practical. Do you have any in navy blue? It\'s her favorite color.\nWoman: Let me check our stockroom. We might have one left in that color from the recent shipment.\n\nQuestion: Why is the man buying a gift?',
    correctAnswer: 'His daughter is starting university.',
    hint: '선물 구매 상황이에요. 구매 이유와 찾고 있는 특정 옵션(navy blue)을 들어보세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 75,
  },
  {
    audioText:
      'Woman: Our guest speaker for the awards banquet just canceled due to a personal emergency.\nMan: That\'s a problem. The banquet is only two days away. Do we have a backup plan?\nWoman: Well, we could ask the CEO to give a longer speech, or we could try to find a local expert.\nMan: Let\'s see if Professor Miller from the local university is available. He\'s a very engaging speaker.\n\nQuestion: What is the main problem?',
    correctAnswer: 'A guest speaker canceled at the last minute.',
    hint: '행사 기획 중 발생한 긴급 상황이에요. 문제점과 이에 대한 남자의 제안(Professor Miller)을 파악하세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 76,
  },
  {
    audioText:
      'Man: Hi, I\'d like to sign up for a gym membership. What are your monthly rates?\nWoman: It\'s fifty dollars a month, but if you sign a one-year contract, we can reduce it to forty.\nMan: Do you offer any discounts for corporate groups? I work at the tech park across the street.\nWoman: Yes, we have a partnership with several companies there. Let me see the list of eligible businesses.\n\nQuestion: How can the man get a lower monthly rate?',
    correctAnswer: 'By signing a one-year contract or using a corporate discount.',
    hint: '체육관 등록 상담이에요. 가격 할인 조건들(contract length, corporate partnership)을 들어보세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 77,
  },
  {
    audioText:
      'Woman: I\'m worried about the budget for the annual staff picnic. Catering costs have gone up significantly since last year.\nMan: Maybe we should change the venue to a public park. That would save us the rental fee for the private club.\nWoman: That\'s a great suggestion. We can use the saved money to maintain the quality of the food.\nMan: I\'ll look into the permit requirements for the city park this afternoon.\n\nQuestion: How do the speakers plan to save money?',
    correctAnswer: 'By holding the event at a public park instead of a private club.',
    hint: '행사 예산 절감에 대한 대화예요. 장소 변경(change the venue)이 어떤 비용을 아껴주는지 들어보세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 78,
  },
  {
    audioText:
      'Man: Excuse me, I\'m looking for the history section. I can\'t seem to find any books on the Second World War.\nWoman: Those books were moved to the second floor last week during the reorganization.\nMan: Oh, I see. Is there an elevator nearby? I have a bit of trouble with stairs.\nWoman: Yes, it\'s just past the information desk on your right.\n\nQuestion: Why was the man unable to find the books he wanted?',
    correctAnswer: 'The history section was moved to a different floor.',
    hint: '도서관이나 서점에서의 대화예요. 원하는 책이 왜 제자리에 없는지(moved to the second floor) 들어보세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 79,
  },
  {
    audioText:
      'Woman: Have you heard that the city is planning to build a new shopping mall near our office?\nMan: Yes, I\'m a bit concerned about the traffic. It\'s already difficult to find parking during the rush hour.\nWoman: I agree. However, it will be very convenient to have more lunch options within walking distance.\nMan: That\'s true. I suppose there are both pros and cons to the project.\n\nQuestion: What is the man concerned about regarding the new mall?',
    correctAnswer: 'Increased traffic and lack of parking.',
    hint: '도시 개발 계획에 대한 의견 교환이에요. 남자가 걱정하는 부분(traffic, parking)을 파악하세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 80,
  },
  {
    audioText:
      'Man: Hi, this is Thomas from the maintenance department. I\'m calling to confirm the repair for the leak in the breakroom sink.\nWoman: Oh, thank goodness. It\'s been dripping all morning and getting water everywhere.\nMan: I can be there in about twenty minutes. Can you make sure the area under the sink is clear?\nWoman: Sure, I\'ll move the cleaning supplies right away so you can have full access.\n\nQuestion: What does the man ask the woman to do?',
    correctAnswer: 'Clear the space under the sink for the repair.',
    hint: '수리 작업 전 협조 요청이에요. 남자의 요청 사항(make sure the area... is clear)을 들어보세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 81,
  },
  {
    audioText:
      'Woman: I\'m really impressed with the candidate we interviewed this morning. She has a lot of experience in social media marketing.\nMan: I liked her too, but I\'m worried that her salary expectations are a bit higher than our budget.\nWoman: We might be able to offer her a performance-based bonus instead of a higher base salary.\nMan: That\'s a good compromise. Let\'s discuss this with the department head before we make an offer.\n\nQuestion: What concern does the man have about the candidate?',
    correctAnswer: 'Her salary expectations are too high for their budget.',
    hint: '채용 면접 후 평가 대화예요. 남자가 우려하는 점(salary expectations)과 여자가 제안한 타협안(bonus)을 들어보세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 82,
  },
  {
    audioText:
      'Man: Is it possible to get a later checkout time? My flight doesn\'t leave until six PM.\nWoman: Normally, checkout is at eleven AM, but we can extend it to one PM for a small fee.\nMan: That would be helpful. Can I leave my luggage at the front desk after I check out?\nWoman: Certainly. We have a secure storage room where you can leave your bags until you\'re ready to head to the airport.\n\nQuestion: What time can the man stay in his room until?',
    correctAnswer: 'One PM.',
    hint: '호텔 체크아웃 연장 요청이에요. 연장 가능한 시간(one PM)과 짐 보관 서비스에 대해 들어보세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 83,
  },
  {
    audioText:
      'Woman: The attendance at our annual gala was lower than expected this year. I wonder why.\nMan: I think it\'s because we scheduled it on the same night as the local football championship.\nWoman: You\'re right. We should have checked the local events calendar more carefully.\nMan: Next year, let\'s make sure to pick a date that doesn\'t conflict with any major sports or holidays.\n\nQuestion: Why was the gala attendance low according to the man?',
    correctAnswer: 'It conflicted with a local football championship.',
    hint: '행사 흥행 부진 원인 분석이에요. 남자가 제시한 이유(conflict with football championship)를 들어보세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 84,
  },
  {
    audioText:
      'Man: Hi, I\'m calling to see if my dry cleaning is ready for pickup. My name is Robert Chen.\nWoman: Let me check... Yes, Mr. Chen. Your suits are ready, but the stain on the silk tie couldn\'t be completely removed.\nMan: Oh, that\'s disappointing. I was hoping to wear it to a wedding this weekend.\nWoman: We did our best, but silk is very delicate. We won\'t charge you for the tie cleaning since it didn\'t come out perfect.\n\nQuestion: What is the problem with the man\'s order?',
    correctAnswer: 'A stain on a silk tie could not be removed.',
    hint: '세탁소 관련 대화예요. 어떤 품목(silk tie)에 어떤 문제(stain not removed)가 생겼는지 들어보세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 85,
  },
  {
    audioText:
      'Woman: I\'m thinking of taking a professional development course in project management. Do you know if the company will pay for it?\nMan: Yes, they usually reimburse up to eighty percent of the tuition if it\'s related to your current role.\nWoman: That\'s great. I\'ll need to get approval from my manager before I enroll, right?\nMan: Exactly. You should also check with the HR department to see which specific institutions are approved.\n\nQuestion: How much of the tuition will the company likely cover?',
    correctAnswer: 'Up to eighty percent.',
    hint: '사내 교육비 지원 제도에 대한 문의예요. 지원 범위(eighty percent)와 절차(approval, HR check)를 파악하세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 86,
  },
  {
    audioText:
      'Man: Excuse me, I\'m looking for the express bus to the airport. The sign says it leaves from Gate 5, but there\'s no bus there.\nWoman: Oh, they changed the departure gate to Gate 12 this morning due to construction work near Gate 5.\nMan: Gate 12? Is that far from here? I only have ten minutes before the bus leaves.\nWoman: It\'s at the other end of the terminal. If you hurry, you should be able to make it.\n\nQuestion: Why was the bus gate changed?',
    correctAnswer: 'Because of construction work near the original gate.',
    hint: '버스 탑승구 변경 안내예요. 변경 사유(construction work)와 새로운 게이트 번호(Gate 12)를 들어보세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 87,
  },
  {
    audioText:
      'Woman: Our sales in the European market have increased by twenty percent since we launched the localized website.\nMan: That\'s fantastic. I think we should consider doing the same for the Asian market next.\nWoman: I agree. However, we\'ll need to hire native translators for at least three different languages.\nMan: Let\'s put together a proposal for the board of directors and include a budget for the translation services.\n\nQuestion: What does the man suggest doing next?',
    correctAnswer: 'Launching a localized website for the Asian market.',
    hint: '해외 시장 전략 회의예요. 남자의 제안(same for the Asian market)과 필요한 작업(native translators)을 파악하세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 88,
  },
  {
    audioText:
      'Man: I\'m having trouble with the new office copier. Every time I try to print double-sided, it jams.\nWoman: Have you checked if you\'re using the correct paper weight? The double-sided feature requires thicker paper.\nMan: I didn\'t know that. I\'m just using the standard paper from the supply room.\nWoman: Try using the premium paper in the blue box. It should work fine with that.\n\nQuestion: What does the woman suggest is causing the copier to jam?',
    correctAnswer: 'Using paper that is too thin for double-sided printing.',
    hint: '기기 고장 원인 진단이에요. 여자가 지적한 문제(paper weight)와 해결책(premium paper)을 들어보세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 89,
  },
  {
    audioText:
      'Woman: Hi, I\'d like to book a table for six people for tomorrow night around seven PM.\nMan: Let me check our reservation book... I\'m sorry, we are fully booked at seven. We have an opening at eight thirty, though.\nWoman: Eight thirty is a bit late for us. How about lunch on Saturday instead?\nMan: We have plenty of space for lunch on Saturday. Would one PM work for you?\n\nQuestion: When did the woman finally decide to make a reservation for?',
    correctAnswer: 'Saturday at one PM.',
    hint: '식당 예약 조율 대화예요. 여러 차례의 시간 제안 끝에 최종적으로 합의된 시점(Saturday at one PM)을 파악하세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 90,
  },

  // ═══════════════════════════════════════════════════
  // ADVANCED  (TOEIC Part 4 style)  — items 91-120
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
    order: 91,
  },
  {
    audioText:
      'Good morning, team. I want to take a few minutes to update you on the Greenfield project. As of yesterday, we\'ve completed the market research phase ahead of schedule. The next step is to finalize the product specifications by the end of this month. I\'d like each department head to submit their section of the specs report no later than the twenty-fifth. If you run into any issues, please come to me directly rather than waiting for the weekly meeting. Thank you.',
    correctAnswer: 'Department heads must submit spec reports by the 25th.',
    hint: '프로젝트 업데이트 공지예요. 완료된 단계, 다음 단계, 마감일, 요청 사항을 순서대로 들어보세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 92,
  },
  {
    audioText:
      'Are you tired of spending hours searching for a parking spot downtown? Park-Easy has the solution. With our mobile app, you can reserve a guaranteed parking space at any of our forty locations across the city — up to seven days in advance. Download the app today and use promo code EASY20 for twenty percent off your first month\'s subscription. Visit park-easy dot com or search "Park-Easy" in your app store.',
    correctAnswer: 'Park-Easy app lets you reserve parking in advance; use code EASY20 for 20% off.',
    hint: '앱 서비스 광고예요. 서비스의 핵심 기능, 할인 코드, 이용 방법을 들어보세요. 숫자(40개 지점, 7일 전, 20% 할인)를 놓치지 마세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 93,
  },
  {
    audioText:
      'Welcome to the Riverside Conference Center. Before we begin today\'s symposium, I\'d like to go over a few housekeeping items. All sessions will be held in the East and West wings of the building. Lunch will be served in the Garden Atrium from twelve to one thirty. If you have any dietary requirements that weren\'t noted on your registration, please speak to one of our staff members wearing green badges. The keynote speaker this afternoon is Dr. Helen Park, who will address the future of renewable energy. We hope you enjoy today\'s program.',
    correctAnswer: 'Lunch is in the Garden Atrium; keynote is Dr. Helen Park on renewable energy.',
    hint: '학술 행사 안내 방송이에요. 세션 장소, 점심 시간·장소, 특별 요청 방법, 기조연설자와 주제를 메모하세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 94,
  },
  {
    audioText:
      'This is a message for Mr. David Kim from Horizon Financial. This is Sandra Lee calling regarding your account review scheduled for next Tuesday at ten AM. Unfortunately, our senior advisor Mr. Thompson will be out of the office that day due to a family commitment. We would like to reschedule your appointment to either Wednesday at two PM or Thursday at eleven AM. Please call us back at five five five, oh nine two zero to confirm your preference. We apologize for any inconvenience.',
    correctAnswer: 'The Tuesday appointment needs rescheduling; options are Wednesday 2PM or Thursday 11AM.',
    hint: '전화 메시지(voicemail) 형식이에요. 누가 왜 전화했는지, 기존 약속이 왜 변경되는지, 대안 시간이 언제인지 들어보세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 95,
  },
  {
    audioText:
      'Good evening. Our top story tonight: city officials have announced plans to expand the downtown metro line by six stations over the next four years. The project, estimated to cost eight hundred million dollars, will connect three currently underserved neighborhoods to the main transit hub. Construction is expected to begin in the spring of next year. Officials say the expansion will reduce peak-hour traffic congestion by up to thirty percent. More details on tonight\'s full report.',
    correctAnswer: 'The metro line will expand by 6 stations; construction starts next spring.',
    hint: '뉴스 리포트 형식이에요. 주요 뉴스의 핵심 요소: 누가(city officials), 무엇을(지하철 확장), 규모(6개 역, 8억 달러), 시기(내년 봄 착공), 효과(교통 혼잡 30% 감소)를 정리하세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 96,
  },
  {
    audioText:
      'Hello, this is an automated reminder from Oakwood Medical Center. You have an appointment with Dr. Patel scheduled for this Friday, April the fifth, at three fifteen PM. Please arrive ten minutes early to complete any necessary paperwork. If you need to cancel or reschedule, please call our office at least twenty-four hours in advance at five five five, two one four zero. We look forward to seeing you. Have a great day.',
    correctAnswer: 'Appointment with Dr. Patel: Friday April 5th at 3:15 PM; arrive 10 minutes early.',
    hint: '병원 예약 자동 알림이에요. 의사 이름, 날짜, 시간, 도착 안내, 취소 방법을 차례로 들어보세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 97,
  },
  {
    audioText:
      'Thank you for calling Brightline Internet Services. We are currently experiencing a service outage affecting customers in the Northside and Eastview districts. Our technical team is working to restore full service as quickly as possible, and we expect the issue to be resolved within the next three hours. If you are not in one of these affected areas but are still experiencing connectivity issues, please press one to speak with a customer service representative. We appreciate your patience and apologize for any disruption to your service.',
    correctAnswer: 'Outage in Northside and Eastview; expected resolution within 3 hours.',
    hint: '고객센터 자동 응답(IVR) 형식이에요. 어느 지역에 장애가 발생했는지, 언제 복구될 예정인지, 해당 지역 외 고객은 어떻게 해야 하는지 들어보세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 98,
  },
  {
    audioText:
      'Welcome to the annual City Library Book Fair. This year, we are proud to host over fifty local authors who will be giving readings and signing copies of their work throughout the weekend. The fair is located in the South Plaza and will be open from nine AM to six PM on both Saturday and Sunday. All proceeds from the snack bar and the raffle will go toward renovating the children\'s reading room. We encourage you to visit the information desk to pick up a full schedule of today\'s events. Enjoy the fair!',
    correctAnswer: 'Book fair in South Plaza; proceeds support the children\'s room.',
    hint: '지역 행사 안내예요. 행사의 목적, 장소, 운영 시간, 그리고 수익금의 사용처(children\'s reading room)를 들어보세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 99,
  },
  {
    audioText:
      'Attention all employees. As part of our commitment to sustainability, the company will be introducing a new waste management policy starting next Monday. We will be removing individual trash bins from under each desk and replacing them with centralized recycling stations located near the elevators on each floor. These stations will have separate containers for paper, plastic, and general waste. We understand this change may take some adjustment, but we believe it will significantly reduce our environmental footprint. Detailed guidelines will be sent to your email later today.',
    correctAnswer: 'New waste policy: centralized recycling stations replace individual bins.',
    hint: '사내 환경 정책 변화에 대한 공지예요. 어떤 변화(removing individual bins)가 생기는지, 그 이유(sustainability)가 무엇인지 파악하세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 100,
  },
  {
    audioText:
      'Are you looking for a way to improve your team\'s productivity and communication? Peak-Performance Consulting offers customized workshops designed specifically for small to medium-sized businesses. Our expert trainers focus on practical skills like conflict resolution, time management, and effective leadership. For a limited time, we are offering a free thirty-minute consultation for new clients who sign up through our website. Don\'t miss this opportunity to take your business to the next level. Visit peak-performance dot com to schedule your consultation today.',
    correctAnswer: 'Customized business workshops; free 30-minute consultation for new clients.',
    hint: '컨설팅 서비스 광고예요. 대상(SMEs), 교육 내용, 그리고 특별 혜택(free consultation)을 메모하세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 101,
  },
  {
    audioText:
      'Good afternoon, everyone. This is a brief announcement regarding the upcoming maintenance on the company\'s internal network. Starting this Friday at eight PM, the servers will be offline for a scheduled security upgrade. We expect the system to be fully operational again by Sunday morning at six AM. During this time, you will not be able to access your remote files or company email. We recommend that you save any urgent work to your local drive before the shutdown begins. We apologize for any inconvenience this may cause to your weekend plans.',
    correctAnswer: 'Network maintenance: servers offline Friday 8PM to Sunday 6AM.',
    hint: 'IT 부서의 시스템 점검 공지예요. 중단 시간대와 그동안 이용 불가능한 서비스(remote files, email)를 확인하세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 102,
  },
  {
    audioText:
      'This is a reminder for all residents of the Green Valley Apartment Complex. The annual safety inspection of the fire alarm system will take place tomorrow, Wednesday, between nine AM and four PM. Technicians will need to enter each apartment briefly to test the smoke detectors. Please ensure that any pets are secured during this time. You do not need to be home for the inspection, as a member of the building management will accompany the technicians. If you have any questions, please contact the management office during business hours.',
    correctAnswer: 'Fire alarm inspection tomorrow 9AM-4PM; technicians will enter units.',
    hint: '아파트 단지 공지사항이에요. 점검 내용, 일시, 그리고 입주민이 해야 할 일(secure pets)을 들어보세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 103,
  },
  {
    audioText:
      'Hello, this is a message for Sarah Jenkins from the Pearl River Boutique. I\'m calling to let you know that the dress you ordered in size six has arrived and is ready for pickup. However, we noticed a small pull in the fabric near the hem while we were unpacking it. Since it was the last one in that size, we can either offer you a fifteen percent discount if you still want it, or we can order another one from our supplier, which would take about ten days. Please give us a call at five five five, eight seven one two to let us know how you\'d like to proceed.',
    correctAnswer: 'Ordered dress arrived with a defect; choice of discount or re-order.',
    hint: '상점에서의 안내 전화예요. 제품의 상태(small pull in fabric)와 고객에게 제시된 두 가지 옵션을 파악하세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 104,
  },
  {
    audioText:
      'Welcome to the "Future of Finance" podcast. I\'m your host, Mark Stevens. In today\'s episode, we\'ll be discussing the rise of digital currencies and how they are transforming the global banking industry. Our guest is Dr. Elena Rossi, a leading economist and author of the best-selling book "The Digital Shift." We\'ll explore the benefits and risks of decentralized finance and what it means for the average consumer. Stay tuned as we dive deep into this fascinating topic after a short break from our sponsors.',
    correctAnswer: 'Podcast about digital currencies featuring guest Dr. Elena Rossi.',
    hint: '팟캐스트 도입부예요. 오늘 다룰 주제(digital currencies)와 초대 손님에 대한 정보를 들어보세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 105,
  },
  {
    audioText:
      'Attention shoppers. We have a special promotion today in our electronics department. For the next two hours, all tablet computers and accessories are twenty-five percent off. Plus, if you trade in your old device, you can receive an additional fifty-dollar credit toward your purchase. This offer is only available while supplies last, so head over to the electronics section on the third floor now to take advantage of these incredible savings. Thank you for shopping with us today.',
    correctAnswer: '25% off tablets for 2 hours; additional $50 credit for trade-ins.',
    hint: '백화점 매장 안내 방송이에요. 할인 대상(tablets), 기간(2 hours), 그리고 추가 혜택(trade-in credit)을 확인하세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 106,
  },
  {
    audioText:
      'Good morning. This is a message for the organizers of the community garden project. This is Jim from the City Parks Department. I\'m calling to confirm that your permit for the lot on Second Avenue has been approved. You can begin clearing the land as early as this Saturday. However, please note that you must install a temporary fence around the perimeter before you start any planting. I will mail the official permit documents and a list of approved plant species to your office today. Good luck with your project!',
    correctAnswer: 'Garden permit approved for Second Avenue; must install a fence first.',
    hint: '시청 담당자의 확인 전화예요. 허가된 내용(permit approved)과 착공 전 필수 조건(install a fence)을 들어보세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 107,
  },
  {
    audioText:
      'Welcome to the orientation for new volunteers at the City Food Bank. We are so grateful for your willingness to help our community. Today, we will walk you through the safety protocols for handling and sorting donations. Each of you has been assigned to a specific station — either the refrigerated section, the dry goods area, or the packaging department. After this brief introduction, your station supervisor will provide more detailed instructions on your tasks for the day. Please make sure you are wearing your name tags at all times. Let\'s get started!',
    correctAnswer: 'Volunteer orientation: safety protocols and station assignments.',
    hint: '자원봉사자 오리엔테이션이에요. 교육 내용(safety protocols)과 이후 일정(station supervisor instructions)을 파악하세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 108,
  },
  {
    audioText:
      'This is a local news update. The city council has voted to approve the construction of a new bridge connecting the North and South districts. The bridge, which will feature dedicated lanes for cyclists and pedestrians, is intended to relieve congestion on the existing Westside Bridge. The project is expected to take eighteen months to complete and will cost approximately fifty million dollars. Residents are warned to expect temporary road closures and detours in the area starting next month. Stay tuned for more updates on this developing story.',
    correctAnswer: 'New bridge approved to connect North and South districts; 18-month project.',
    hint: '지역 뉴스 리포트예요. 사업의 목적(relieve congestion), 특징(cyclist lanes), 그리고 예상 기간(18 months)을 들어보세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 109,
  },
  {
    audioText:
      'Hello, this is a message from the management of the Grand Theatre. This call is for anyone who purchased tickets for the performance of "The Midnight Waltz" scheduled for this Friday evening. Due to an unexpected illness among the cast members, the show has been rescheduled to next Friday at the same time. Your current tickets will be valid for the new date. If you are unable to attend the rescheduled performance, please contact our box office by Wednesday to request a full refund. We apologize for any disappointment this may cause.',
    correctAnswer: 'Friday show rescheduled due to cast illness; current tickets still valid.',
    hint: '공연 일정 변경 안내예요. 변경 이유(cast illness)와 새로운 일시, 그리고 환불 절차를 확인하세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 110,
  },
  {
    audioText:
      'Attention passengers at North Terminal. We are sorry to announce that the express train service to the city center is currently suspended due to a signaling fault near the Central Station. We are arranging for shuttle buses to transport passengers to the nearest metro station, where you can continue your journey. Buses will be departing from the main bus stop outside the terminal every ten minutes. We expect the train service to be restored within the next two hours. Thank you for your patience and cooperation.',
    correctAnswer: 'Train service suspended; shuttle buses available at the main bus stop.',
    hint: '교통 수단 장애 안내예요. 발생한 문제(signaling fault)와 제공되는 대체 수단(shuttle buses)의 위치를 파악하세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 111,
  },
  {
    audioText:
      'Good evening, and thank you for joining us for the opening of the "Urban Visions" photography exhibition. This collection features works from ten emerging artists who have captured the unique spirit of our city through their lenses. As you walk through the gallery, you\'ll notice that each photograph is accompanied by a short description of the location and the artist\'s inspiration. We are honored to have the mayor here tonight to officially open the exhibition. Following her remarks, we invite you to enjoy some light refreshments in the lobby. Thank you.',
    correctAnswer: 'Opening of a photography exhibition; mayor will give opening remarks.',
    hint: '전시회 개막식 안내예요. 전시 내용(Urban Visions)과 개막식 순서(mayor\'s remarks, refreshments)를 들어보세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 112,
  },
  {
    audioText:
      'This is a message for Lisa Miller from Skyline Travel. I\'m calling regarding your upcoming trip to Tokyo. We have successfully confirmed your business-class upgrade for the long-haul flight. However, we were unable to secure the specific hotel you requested in the Shinjuku district as it is fully booked for a major festival. We have reserved a similar room at a nearby hotel that is only a five-minute walk from your original choice. Please review the updated itinerary I sent to your email and let me know if these changes are acceptable. Safe travels!',
    correctAnswer: 'Flight upgrade confirmed; hotel changed due to a local festival.',
    hint: '여행사 직원의 안내 전화예요. 확정된 사항(flight upgrade)과 변경된 사항(hotel location)을 파악하세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 113,
  },
  {
    audioText:
      'Attention all gym members. We are excited to announce that we will be upgrading our cardio equipment starting tomorrow morning. This process will take three days, and during this time, the treadmill and elliptical area will be partially closed. We will be installing the latest models with integrated touchscreens and heart rate monitors. We recommend using the strength training area or joining one of our group fitness classes while the work is being completed. We are confident you will love the new machines once they are ready. Thank you for your understanding.',
    correctAnswer: 'Cardio equipment upgrade starting tomorrow; partial area closure for 3 days.',
    hint: '헬스장 시설 개선 공지예요. 공사 기간(3 days)과 해당 기간 동안 추천되는 대체 활동(group classes)을 들어보세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 114,
  },
  {
    audioText:
      'Hello, this is an automated message from the City Water Authority. We will be performing essential repairs on the main water line in your area this Thursday, from nine AM to two PM. During this period, you may experience low water pressure or a temporary loss of service. We recommend that you store enough water for your household needs before the repairs begin. Once service is restored, you may notice some slight discoloration in your water. If this happens, please run your cold water tap for a few minutes until it clears. Thank you for your cooperation.',
    correctAnswer: 'Essential water repairs on Thursday 9AM-2PM; expect low pressure.',
    hint: '수도 복구 공사 안내 방송이에요. 단수/수압 저하 시간대와 복구 후 대처 방법(run cold water tap)을 확인하세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 115,
  },
  {
    audioText:
      'Welcome to the monthly meeting of the Riverside Homeowners Association. Our main topic tonight is the proposed landscaping project for the community entrance. We have received several designs from local firms, and we\'ll be reviewing the top three choices tonight. We want to ensure that the new design is not only attractive but also drought-resistant to save on long-term maintenance costs. After the presentation, we will hold a vote to select the winning design. If you haven\'t already, please sign in at the back of the room so we can verify the quorum for the vote. Thank you.',
    correctAnswer: 'Homeowners meeting to vote on entrance landscaping design.',
    hint: '주민회 회의 안내예요. 주요 안건(landscaping)과 선정 기준(drought-resistant), 그리고 투표 절차를 파악하세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 116,
  },
  {
    audioText:
      'Are you passionate about cooking and looking to take your skills to the next level? The Culinary Arts Center is now enrolling for our advanced autumn workshops. From French pastry techniques to authentic Thai cuisine, our professional chefs will guide you through every step of the process. Each four-week course includes all ingredients and a personalized apron. Classes meet twice a week in our state-of-the-art kitchens downtown. Space is limited to twelve students per class to ensure plenty of individual attention. Visit culinary-arts dot com to view the full course catalog and reserve your spot today.',
    correctAnswer: 'Advanced cooking workshops; 4-week courses with 12 students per class.',
    hint: '요리 강좌 광고예요. 강의 구성(4-week course, twice a week)과 수강 인원 제한(12 students)을 들어보세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 117,
  },
  {
    audioText:
      'Attention staff. This is a reminder that our annual performance review cycle begins next week. All employees should schedule a one-on-one meeting with their immediate supervisor before the end of the month. Ahead of your meeting, please complete the self-assessment form available on the company intranet. This is an opportunity for you to reflect on your achievements over the past year and set professional goals for the future. If you have any questions about the process, please refer to the employee handbook or contact the HR department. Thank you for your hard work.',
    correctAnswer: 'Annual performance reviews start next week; complete self-assessment form.',
    hint: '인사 고과 시즌 공지예요. 사전에 준비해야 할 일(self-assessment form)과 일정(by the end of the month)을 확인하세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 118,
  },
  {
    audioText:
      'Hello, this is a message for David Brown from Northside Toyota. I\'m calling to inform you that the part we ordered for your vehicle\'s air conditioning system has been delayed due to a supplier issue. We now expect it to arrive next Wednesday instead of this Friday. We understand this is inconvenient, especially given the current hot weather. As a gesture of goodwill, we would like to offer you a free interior cleaning and detailing service when you bring your car in for the repair. Please call us back to reschedule your appointment for late next week. Thank you.',
    correctAnswer: 'Car part delayed; free interior cleaning offered as compensation.',
    hint: '정비소에서의 지연 안내 전화예요. 지연 원인(supplier issue)과 보상 서비스(free interior cleaning)를 파악하세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 119,
  },
  {
    audioText:
      'Good morning, everyone, and welcome to the "Healthy Living" seminar. I\'m Dr. Sarah Thompson, and I\'ll be your host for today\'s event. We have a packed schedule featuring three expert speakers who will share their insights on nutrition, mental health, and physical fitness. Between sessions, you\'ll have the chance to visit our vendor booths in the hallway, where you can sample healthy snacks and learn about local wellness resources. We will also be holding a raffle at the end of the day with some fantastic prizes, so make sure to keep your entry tickets. Let\'s get started with our first speaker!',
    correctAnswer: 'Healthy Living seminar featuring three speakers and vendor booths.',
    hint: '세미나 개회 안내예요. 프로그램 구성(three speakers)과 부대 행사(vendor booths, raffle) 정보를 들어보세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 120,
  },
];
