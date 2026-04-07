import mongoose from 'mongoose';
import { connectDatabase } from '@/config/database';
import Vocabulary from '@/models/Vocabulary';

interface MeaningExample {
  meaning: string;
  exampleSentence: string;
  exampleTranslation: string;
}

const REAL_MEANING_EXAMPLES: Record<string, MeaningExample[]> = {
  ask: [
    { meaning: '묻다', exampleSentence: 'Can I ask you a question?', exampleTranslation: '질문 하나 해도 될까요?' },
    { meaning: '요청하다', exampleSentence: 'She asked for more time.', exampleTranslation: '그녀는 시간을 더 달라고 요청했다.' },
    { meaning: '부탁하다', exampleSentence: 'I asked him to carry my bag.', exampleTranslation: '나는 그에게 내 가방을 들어 달라고 부탁했다.' },
  ],
  back: [
    { meaning: '뒤, 등', exampleSentence: 'My back hurts after work.', exampleTranslation: '일하고 나니 등이 아프다.' },
    { meaning: '돌아가다', exampleSentence: 'We went back to the hotel.', exampleTranslation: '우리는 호텔로 돌아갔다.' },
    { meaning: '지지하다', exampleSentence: 'Local voters backed the new policy.', exampleTranslation: '지역 유권자들은 새 정책을 지지했다.' },
  ],
  balance: [
    { meaning: '균형', exampleSentence: 'The gymnast kept her balance.', exampleTranslation: '체조 선수는 균형을 유지했다.' },
    { meaning: '잔액', exampleSentence: 'Check your account balance first.', exampleTranslation: '먼저 계좌 잔액을 확인해라.' },
    { meaning: '저울질하다', exampleSentence: 'We must balance speed and quality.', exampleTranslation: '우리는 속도와 품질을 저울질해야 한다.' },
  ],
  bank: [
    { meaning: '은행', exampleSentence: 'I need to go to the bank.', exampleTranslation: '나는 은행에 가야 한다.' },
    { meaning: '제방', exampleSentence: 'They sat on the river bank.', exampleTranslation: '그들은 강 제방에 앉았다.' },
    { meaning: '의지하다', exampleSentence: 'You can bank on her support.', exampleTranslation: '그녀의 지원을 믿어도 된다.' },
  ],
  book: [
    { meaning: '책', exampleSentence: 'This book is easy to read.', exampleTranslation: '이 책은 읽기 쉽다.' },
    { meaning: '예약하다', exampleSentence: 'I booked a table for two.', exampleTranslation: '나는 2인용 테이블을 예약했다.' },
  ],
  capital: [
    { meaning: '자본, 자금', exampleSentence: 'The company raised enough capital.', exampleTranslation: '그 회사는 충분한 자본을 조달했다.' },
    { meaning: '수도', exampleSentence: 'Seoul is the capital of Korea.', exampleTranslation: '서울은 한국의 수도다.' },
    { meaning: '대문자', exampleSentence: 'Write your name in capital letters.', exampleTranslation: '이름을 대문자로 써라.' },
  ],
  change: [
    { meaning: '바꾸다', exampleSentence: 'Can you change this shirt?', exampleTranslation: '이 셔츠를 바꿔 주실 수 있나요?' },
    { meaning: '변화', exampleSentence: 'There was a big change in weather.', exampleTranslation: '날씨에 큰 변화가 있었다.' },
    { meaning: '잔돈', exampleSentence: 'Do you have any change for ten dollars?', exampleTranslation: '10달러를 잔돈으로 바꿔 주실 수 있나요?' },
  ],
  channel: [
    { meaning: '채널', exampleSentence: 'I watched the news channel.', exampleTranslation: '나는 뉴스 채널을 봤다.' },
    { meaning: '수로', exampleSentence: 'Ships passed through the channel.', exampleTranslation: '배들이 수로를 통과했다.' },
    { meaning: '유도하다', exampleSentence: 'We should channel our energy into study.', exampleTranslation: '우리는 에너지를 공부에 쏟아야 한다.' },
  ],
  come: [
    { meaning: '오다', exampleSentence: 'Please come early tomorrow.', exampleTranslation: '내일 일찍 와 주세요.' },
    { meaning: '출신이다', exampleSentence: 'She comes from Busan.', exampleTranslation: '그녀는 부산 출신이다.' },
  ],
  commission: [
    { meaning: '수수료', exampleSentence: 'The agent earns a commission.', exampleTranslation: '그 중개인은 수수료를 받는다.' },
    { meaning: '위원회', exampleSentence: 'The commission released its report.', exampleTranslation: '위원회가 보고서를 발표했다.' },
    { meaning: '의뢰하다', exampleSentence: 'The city commissioned a new statue.', exampleTranslation: '시는 새 동상 제작을 의뢰했다.' },
  ],
  contract: [
    { meaning: '계약', exampleSentence: 'We signed a two-year contract.', exampleTranslation: '우리는 2년 계약을 맺었다.' },
    { meaning: '계약하다', exampleSentence: 'They contracted a local builder.', exampleTranslation: '그들은 지역 건설업자와 계약했다.' },
    { meaning: '수축하다', exampleSentence: 'Metal contracts in cold weather.', exampleTranslation: '금속은 추운 날씨에 수축한다.' },
  ],
  cool: [
    { meaning: '시원한', exampleSentence: 'The evening air is cool.', exampleTranslation: '저녁 공기가 시원하다.' },
    { meaning: '멋진', exampleSentence: 'Your new jacket looks cool.', exampleTranslation: '네 새 재킷 멋지다.' },
    { meaning: '식히다', exampleSentence: 'Let the soup cool for a minute.', exampleTranslation: '수프를 잠깐 식혀라.' },
  ],
  credit: [
    { meaning: '신용', exampleSentence: 'Good credit helps you get a loan.', exampleTranslation: '좋은 신용은 대출에 도움이 된다.' },
    { meaning: '학점', exampleSentence: 'I got three credits this semester.', exampleTranslation: '이번 학기에 3학점을 받았다.' },
    { meaning: '공로', exampleSentence: 'She received credit for the idea.', exampleTranslation: '그 아이디어의 공로는 그녀에게 돌아갔다.' },
  ],
  day: [
    { meaning: '날, 하루', exampleSentence: 'I had a busy day.', exampleTranslation: '나는 바쁜 하루를 보냈다.' },
    { meaning: '낮', exampleSentence: 'It is hot during the day.', exampleTranslation: '낮에는 덥다.' },
  ],
  draw: [
    { meaning: '그리다', exampleSentence: 'My daughter likes to draw animals.', exampleTranslation: '내 딸은 동물 그리기를 좋아한다.' },
    { meaning: '끌어당기다', exampleSentence: 'Bright lights draw many insects.', exampleTranslation: '밝은 불빛은 곤충을 많이 끌어당긴다.' },
    { meaning: '무승부', exampleSentence: 'The game ended in a draw.', exampleTranslation: '경기는 무승부로 끝났다.' },
  ],
  drink: [
    { meaning: '마시다', exampleSentence: 'I drink water every morning.', exampleTranslation: '나는 매일 아침 물을 마신다.' },
    { meaning: '음료, 술', exampleSentence: 'This bar serves soft drinks and beer.', exampleTranslation: '이 바에서는 음료와 맥주를 판다.' },
  ],
  drive: [
    { meaning: '운전하다', exampleSentence: 'I drive to work every day.', exampleTranslation: '나는 매일 운전해서 출근한다.' },
    { meaning: '드라이브', exampleSentence: 'We went for a drive by the sea.', exampleTranslation: '우리는 바닷가로 드라이브를 갔다.' },
    { meaning: '충동', exampleSentence: 'He has a strong drive to succeed.', exampleTranslation: '그는 성공하려는 강한 충동이 있다.' },
  ],
  fish: [
    { meaning: '생선, 물고기', exampleSentence: 'We bought fresh fish at the market.', exampleTranslation: '우리는 시장에서 신선한 생선을 샀다.' },
    { meaning: '낚시하다', exampleSentence: 'They fish in the river on weekends.', exampleTranslation: '그들은 주말마다 강에서 낚시한다.' },
  ],
  flat: [
    { meaning: '평평한', exampleSentence: 'The road here is flat.', exampleTranslation: '여기 길은 평평하다.' },
    { meaning: '타이어 펑크', exampleSentence: 'I got a flat on the highway.', exampleTranslation: '고속도로에서 타이어가 펑크 났다.' },
    { meaning: '아파트 (영국)', exampleSentence: 'She rents a small flat in London.', exampleTranslation: '그녀는 런던에서 작은 아파트를 빌려 산다.' },
  ],
  follow: [
    { meaning: '따르다', exampleSentence: 'Please follow me.', exampleTranslation: '저를 따라오세요.' },
    { meaning: '이해하다', exampleSentence: 'Sorry, I do not follow your point.', exampleTranslation: '미안하지만 네 요점을 이해하지 못하겠어.' },
    { meaning: '팔로우하다', exampleSentence: 'I follow that singer on social media.', exampleTranslation: '나는 소셜 미디어에서 그 가수를 팔로우한다.' },
  ],
  free: [
    { meaning: '자유로운', exampleSentence: 'Everyone should be free to choose.', exampleTranslation: '모든 사람은 자유롭게 선택할 수 있어야 한다.' },
    { meaning: '무료의', exampleSentence: 'Breakfast is free at this hotel.', exampleTranslation: '이 호텔은 아침 식사가 무료다.' },
    { meaning: '해방시키다', exampleSentence: 'The firefighters freed the trapped dog.', exampleTranslation: '소방관들이 갇힌 개를 구해 냈다.' },
  ],
  give: [
    { meaning: '주다', exampleSentence: 'Please give me your phone number.', exampleTranslation: '전화번호를 알려 주세요.' },
    { meaning: '기증하다', exampleSentence: 'They gave clothes to charity.', exampleTranslation: '그들은 옷을 자선단체에 기증했다.' },
    { meaning: '양보하다', exampleSentence: 'I gave my seat to an elderly man.', exampleTranslation: '나는 노인에게 자리를 양보했다.' },
  ],
  go: [
    { meaning: '가다', exampleSentence: 'I go to school by bus.', exampleTranslation: '나는 버스로 학교에 간다.' },
    { meaning: '어울리다', exampleSentence: 'This sauce goes well with pasta.', exampleTranslation: '이 소스는 파스타와 잘 어울린다.' },
    { meaning: '되다', exampleSentence: 'The milk went bad overnight.', exampleTranslation: '우유가 하룻밤 사이에 상했다.' },
  ],
  have: [
    { meaning: '가지다', exampleSentence: 'I have two brothers.', exampleTranslation: '나는 형제가 두 명 있다.' },
    { meaning: '먹다', exampleSentence: 'We had noodles for lunch.', exampleTranslation: '우리는 점심으로 국수를 먹었다.' },
    { meaning: '~해야 하다', exampleSentence: 'I have to finish this report today.', exampleTranslation: '나는 오늘 이 보고서를 끝내야 한다.' },
  ],
  head: [
    { meaning: '머리', exampleSentence: 'He hit his head on the door.', exampleTranslation: '그는 문에 머리를 부딪혔다.' },
    { meaning: '이끌다', exampleSentence: 'She heads the marketing team.', exampleTranslation: '그녀는 마케팅 팀을 이끈다.' },
    { meaning: '향하다', exampleSentence: 'We headed home after dinner.', exampleTranslation: '우리는 저녁 후 집으로 향했다.' },
  ],
  help: [
    { meaning: '돕다', exampleSentence: 'Can you help me with this box?', exampleTranslation: '이 상자 좀 도와줄 수 있니?' },
    { meaning: '도움', exampleSentence: 'Your advice was a big help.', exampleTranslation: '네 조언은 큰 도움이 되었다.' },
  ],
  interest: [
    { meaning: '흥미, 관심', exampleSentence: 'History is my main interest.', exampleTranslation: '역사는 내 주요 관심사다.' },
    { meaning: '이자', exampleSentence: 'The bank pays monthly interest.', exampleTranslation: '은행은 매달 이자를 지급한다.' },
    { meaning: '이익', exampleSentence: 'They own a 20% interest in the company.', exampleTranslation: '그들은 그 회사 지분 20%를 보유하고 있다.' },
  ],
  kind: [
    { meaning: '친절한', exampleSentence: 'She was very kind to us.', exampleTranslation: '그녀는 우리에게 매우 친절했다.' },
    { meaning: '종류, 유형', exampleSentence: 'What kind of music do you like?', exampleTranslation: '어떤 종류의 음악을 좋아하나요?' },
  ],
  know: [
    { meaning: '알다', exampleSentence: 'I know the answer.', exampleTranslation: '나는 답을 안다.' },
    { meaning: '경험하다, 느끼다', exampleSentence: 'I know how hard this is.', exampleTranslation: '이게 얼마나 힘든지 나는 안다.' },
  ],
  lead: [
    { meaning: '이끌다', exampleSentence: 'She will lead the project.', exampleTranslation: '그녀가 프로젝트를 이끌 것이다.' },
    { meaning: '납', exampleSentence: 'This pipe is made of lead.', exampleTranslation: '이 파이프는 납으로 만들어졌다.' },
    { meaning: '주연', exampleSentence: 'He played the lead in the musical.', exampleTranslation: '그는 그 뮤지컬에서 주연을 맡았다.' },
  ],
  light: [
    { meaning: '빛, 불빛', exampleSentence: 'Turn on the light, please.', exampleTranslation: '불 좀 켜 주세요.' },
    { meaning: '밝은', exampleSentence: 'She wore a light blue dress.', exampleTranslation: '그녀는 밝은 파란색 드레스를 입었다.' },
    { meaning: '가벼운', exampleSentence: 'This bag is light and easy to carry.', exampleTranslation: '이 가방은 가벼워서 들기 쉽다.' },
  ],
  like: [
    { meaning: '좋아하다', exampleSentence: 'I like spicy food.', exampleTranslation: '나는 매운 음식을 좋아한다.' },
    { meaning: '~처럼, ~같이', exampleSentence: 'He runs like the wind.', exampleTranslation: '그는 바람처럼 달린다.' },
  ],
  long: [
    { meaning: '긴', exampleSentence: 'It is a long bridge.', exampleTranslation: '그것은 긴 다리다.' },
    { meaning: '그리워하다', exampleSentence: 'I long for my hometown.', exampleTranslation: '나는 고향을 그리워한다.' },
  ],
  love: [
    { meaning: '사랑하다', exampleSentence: 'I love my family.', exampleTranslation: '나는 가족을 사랑한다.' },
    { meaning: '사랑, 애정', exampleSentence: 'Her love for music is clear.', exampleTranslation: '음악에 대한 그녀의 애정은 분명하다.' },
  ],
  match: [
    { meaning: '경기', exampleSentence: 'We watched a football match.', exampleTranslation: '우리는 축구 경기를 봤다.' },
    { meaning: '어울리다', exampleSentence: 'These shoes match your coat.', exampleTranslation: '이 신발은 네 코트와 잘 어울린다.' },
    { meaning: '성냥', exampleSentence: 'Do you have a match?', exampleTranslation: '성냥 있나요?' },
  ],
  meet: [
    { meaning: '만나다', exampleSentence: 'Let us meet after class.', exampleTranslation: '수업 후에 만나자.' },
    { meaning: '충족시키다', exampleSentence: 'This product meets safety standards.', exampleTranslation: '이 제품은 안전 기준을 충족한다.' },
  ],
  name: [
    { meaning: '이름', exampleSentence: 'My name is Mina.', exampleTranslation: '내 이름은 미나다.' },
    { meaning: '이름 짓다', exampleSentence: 'They named the baby Juno.', exampleTranslation: '그들은 아기의 이름을 주노라고 지었다.' },
  ],
  objective: [
    { meaning: '목표', exampleSentence: 'Our main objective is customer trust.', exampleTranslation: '우리의 주요 목표는 고객 신뢰다.' },
    { meaning: '객관적인', exampleSentence: 'Try to stay objective in this discussion.', exampleTranslation: '이 토론에서는 객관적으로 유지해라.' },
    { meaning: '목적어', exampleSentence: 'In some languages, the objective case marks the object.', exampleTranslation: '일부 언어에서는 목적격이 목적어를 표시한다.' },
  ],
  order: [
    { meaning: '주문하다', exampleSentence: 'I would like to order a coffee.', exampleTranslation: '커피 한 잔 주문할게요.' },
    { meaning: '순서', exampleSentence: 'Please put the files in order.', exampleTranslation: '파일을 순서대로 정리해 주세요.' },
    { meaning: '명령하다', exampleSentence: 'The captain ordered the team to stop.', exampleTranslation: '주장은 팀에 멈추라고 명령했다.' },
  ],
  park: [
    { meaning: '공원', exampleSentence: 'We had lunch in the park.', exampleTranslation: '우리는 공원에서 점심을 먹었다.' },
    { meaning: '주차하다', exampleSentence: 'You cannot park here.', exampleTranslation: '여기에는 주차할 수 없다.' },
  ],
  play: [
    { meaning: '놀다', exampleSentence: 'Children play in the yard.', exampleTranslation: '아이들은 마당에서 논다.' },
    { meaning: '연주하다', exampleSentence: 'She plays the piano well.', exampleTranslation: '그녀는 피아노를 잘 연주한다.' },
    { meaning: '연극', exampleSentence: 'The school will stage a play tonight.', exampleTranslation: '학교에서 오늘 밤 연극을 올린다.' },
  ],
  position: [
    { meaning: '위치', exampleSentence: 'What is your current position on the map?', exampleTranslation: '지도에서 현재 위치가 어디인가요?' },
    { meaning: '직위', exampleSentence: 'He got a manager position.', exampleTranslation: '그는 관리자 직위를 얻었다.' },
    { meaning: '입장', exampleSentence: 'What is your position on this issue?', exampleTranslation: '이 문제에 대한 당신의 입장은 무엇인가요?' },
  ],
  post: [
    { meaning: '우편', exampleSentence: 'I sent the package by post.', exampleTranslation: '나는 소포를 우편으로 보냈다.' },
    { meaning: '게시하다', exampleSentence: 'She posted a photo online.', exampleTranslation: '그녀는 온라인에 사진을 게시했다.' },
    { meaning: '직위', exampleSentence: 'He accepted a post at the embassy.', exampleTranslation: '그는 대사관 직위를 수락했다.' },
  ],
  press: [
    { meaning: '누르다', exampleSentence: 'Press this button to start.', exampleTranslation: '시작하려면 이 버튼을 누르세요.' },
    { meaning: '언론', exampleSentence: 'The press covered the event live.', exampleTranslation: '언론이 그 행사를 생중계로 다뤘다.' },
    { meaning: '다림질하다', exampleSentence: 'I pressed my shirt this morning.', exampleTranslation: '오늘 아침 셔츠를 다림질했다.' },
  ],
  project: [
    { meaning: '프로젝트', exampleSentence: 'This project will take three months.', exampleTranslation: '이 프로젝트는 3개월 걸릴 것이다.' },
    { meaning: '예상하다', exampleSentence: 'Experts project higher sales next year.', exampleTranslation: '전문가들은 내년 매출 증가를 예상한다.' },
    { meaning: '투사하다', exampleSentence: 'The lamp projects a clear image.', exampleTranslation: '그 램프는 선명한 이미지를 투사한다.' },
  ],
  record: [
    { meaning: '기록', exampleSentence: 'She broke the world record.', exampleTranslation: '그녀는 세계 기록을 깼다.' },
    { meaning: '음반', exampleSentence: 'I bought an old jazz record.', exampleTranslation: '나는 오래된 재즈 음반을 샀다.' },
    { meaning: '기록하다', exampleSentence: 'Please record the meeting.', exampleTranslation: '회의 내용을 기록해 주세요.' },
  ],
  report: [
    { meaning: '보고서', exampleSentence: 'I submitted the weekly report.', exampleTranslation: '나는 주간 보고서를 제출했다.' },
    { meaning: '보고하다', exampleSentence: 'Please report any errors immediately.', exampleTranslation: '오류가 있으면 즉시 보고해 주세요.' },
    { meaning: '성적표', exampleSentence: 'My report came out last Friday.', exampleTranslation: '내 성적표가 지난 금요일에 나왔다.' },
  ],
  right: [
    { meaning: '오른쪽', exampleSentence: 'Turn right at the corner.', exampleTranslation: '모퉁이에서 오른쪽으로 도세요.' },
    { meaning: '옳은, 맞는', exampleSentence: 'You are right about that.', exampleTranslation: '그 점에 대해서는 네가 맞다.' },
    { meaning: '권리', exampleSentence: 'Everyone has the right to vote.', exampleTranslation: '모든 사람은 투표할 권리가 있다.' },
  ],
  round: [
    { meaning: '둥근', exampleSentence: 'The table is round.', exampleTranslation: '그 테이블은 둥글다.' },
    { meaning: '한 바퀴, 라운드', exampleSentence: 'Let us play another round.', exampleTranslation: '한 라운드 더 하자.' },
  ],
  run: [
    { meaning: '달리다', exampleSentence: 'I run every morning.', exampleTranslation: '나는 매일 아침 달린다.' },
    { meaning: '운영하다', exampleSentence: 'They run a small cafe.', exampleTranslation: '그들은 작은 카페를 운영한다.' },
    { meaning: '작동하다', exampleSentence: 'This app runs smoothly.', exampleTranslation: '이 앱은 매끄럽게 작동한다.' },
  ],
  short: [
    { meaning: '짧은', exampleSentence: 'The movie is short but fun.', exampleTranslation: '그 영화는 짧지만 재미있다.' },
    { meaning: '키가 작은', exampleSentence: 'He is short but very fast.', exampleTranslation: '그는 키가 작지만 매우 빠르다.' },
  ],
  show: [
    { meaning: '보여주다', exampleSentence: 'Please show me your ticket.', exampleTranslation: '티켓을 보여 주세요.' },
    { meaning: '쇼, 공연', exampleSentence: 'We watched a comedy show.', exampleTranslation: '우리는 코미디 쇼를 봤다.' },
    { meaning: '나타나다', exampleSentence: 'Her name showed up on the list.', exampleTranslation: '목록에 그녀의 이름이 나타났다.' },
  ],
  speak: [
    { meaning: '말하다', exampleSentence: 'She speaks English and Japanese.', exampleTranslation: '그녀는 영어와 일본어를 말한다.' },
    { meaning: '연설하다', exampleSentence: 'The mayor will speak at noon.', exampleTranslation: '시장이 정오에 연설할 예정이다.' },
  ],
  spring: [
    { meaning: '봄', exampleSentence: 'Flowers bloom in spring.', exampleTranslation: '봄에는 꽃이 핀다.' },
    { meaning: '용수철', exampleSentence: 'The toy has a small spring inside.', exampleTranslation: '그 장난감 안에는 작은 용수철이 있다.' },
    { meaning: '뛰어오르다', exampleSentence: 'The deer can spring over fences.', exampleTranslation: '사슴은 울타리를 뛰어넘을 수 있다.' },
  ],
  stock: [
    { meaning: '주식', exampleSentence: 'She bought tech stock.', exampleTranslation: '그녀는 기술주를 샀다.' },
    { meaning: '재고', exampleSentence: 'We are out of stock.', exampleTranslation: '재고가 다 떨어졌다.' },
    { meaning: '육수', exampleSentence: 'Add chicken stock to the soup.', exampleTranslation: '수프에 닭 육수를 넣어라.' },
  ],
  take: [
    { meaning: '가져가다', exampleSentence: 'Please take your umbrella.', exampleTranslation: '우산 챙겨 가세요.' },
    { meaning: '(시간이) 걸리다', exampleSentence: 'It takes about an hour to get there.', exampleTranslation: '거기까지 가는 데 한 시간쯤 걸린다.' },
    { meaning: '복용하다', exampleSentence: 'Take this medicine after meals.', exampleTranslation: '이 약은 식후에 복용하세요.' },
  ],
  tell: [
    { meaning: '말하다', exampleSentence: 'Tell me the truth.', exampleTranslation: '진실을 말해 줘.' },
    { meaning: '알려주다', exampleSentence: 'Please tell me the way.', exampleTranslation: '길을 알려 주세요.' },
    { meaning: '구별하다', exampleSentence: 'I cannot tell the twins apart.', exampleTranslation: '나는 쌍둥이를 구별하지 못하겠다.' },
  ],
  time: [
    { meaning: '시간', exampleSentence: 'We do not have much time.', exampleTranslation: '우리에게 시간이 많지 않다.' },
    { meaning: '횟수, 번', exampleSentence: 'This is my third time here.', exampleTranslation: '여기 온 게 이번이 세 번째다.' },
    { meaning: '시간을 재다', exampleSentence: 'Please time me for one minute.', exampleTranslation: '1분 동안 시간 좀 재줘.' },
  ],
  train: [
    { meaning: '기차', exampleSentence: 'The train arrived on time.', exampleTranslation: '기차가 정시에 도착했다.' },
    { meaning: '훈련하다', exampleSentence: 'Coaches train athletes daily.', exampleTranslation: '코치들은 선수들을 매일 훈련시킨다.' },
    { meaning: '연습시키다', exampleSentence: 'We train new staff every month.', exampleTranslation: '우리는 매달 신입 직원을 교육한다.' },
  ],
  transfer: [
    { meaning: '이체', exampleSentence: 'I made a bank transfer this morning.', exampleTranslation: '오늘 아침 은행 이체를 했다.' },
    { meaning: '이동하다', exampleSentence: 'Please transfer this file to my laptop.', exampleTranslation: '이 파일을 내 노트북으로 옮겨 주세요.' },
    { meaning: '전학', exampleSentence: 'She transferred to another school.', exampleTranslation: '그녀는 다른 학교로 전학 갔다.' },
  ],
  watch: [
    { meaning: '보다', exampleSentence: 'We watched a movie together.', exampleTranslation: '우리는 함께 영화를 봤다.' },
    { meaning: '시계', exampleSentence: 'He checked his watch.', exampleTranslation: '그는 시계를 확인했다.' },
    { meaning: '주의하다', exampleSentence: 'Watch your step on the stairs.', exampleTranslation: '계단에서 발밑을 조심해라.' },
  ],
};

function buildMeaningExamples(word: string, meanings: string[]): MeaningExample[] {
  const examples = REAL_MEANING_EXAMPLES[word];
  if (!examples) return [];

  const byMeaning = new Map(examples.map((item) => [item.meaning, item]));
  return meanings
    .map((meaning) => byMeaning.get(meaning))
    .filter((item): item is MeaningExample => !!item);
}

async function migrate(): Promise<void> {
  console.log('\n🔄 meaningExamples 마이그레이션 시작...');
  await connectDatabase();

  const candidates = await Vocabulary.find({
    targetLanguage: 'en',
    meanings: { $exists: true, $not: { $size: 0 } },
  });

  let updatedCount = 0;
  let skippedCount = 0;

  for (const vocab of candidates) {
    const meanings = Array.isArray(vocab.meanings)
      ? vocab.meanings.filter((meaning): meaning is string => typeof meaning === 'string' && meaning.trim().length > 0)
      : [];

    if (meanings.length === 0) {
      continue;
    }

    const meaningExamples = buildMeaningExamples(vocab.word, meanings);

    if (meaningExamples.length === 0) {
      skippedCount += 1;
      continue;
    }

    vocab.meaningExamples = meaningExamples;
    await vocab.save();
    updatedCount += 1;
    console.log(`  ✅ ${vocab.word} (${meaningExamples.length}개 예문)`);
  }

  console.log('\n📊 결과:');
  console.log(`   업데이트: ${updatedCount}개 문서`);
  console.log(`   스킵: ${skippedCount}개 문서 (매핑 없음)`);

  await mongoose.disconnect();
  console.log('  👋 MongoDB 연결 해제\n');
}

migrate().catch((err) => {
  console.error('❌ 마이그레이션 실패:', err);
  process.exit(1);
});
