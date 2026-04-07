import mongoose from 'mongoose';
import { connectDatabase } from '@/config/database';
import Vocabulary from '@/models/Vocabulary';

const MULTI_MEANING_WORDS: Record<string, string[]> = {
  like:    ['좋아하다', '~처럼, ~같이'],
  take:    ['가져가다', '(시간이) 걸리다', '복용하다'],
  show:    ['보여주다', '쇼, 공연', '나타나다'],
  kind:    ['친절한', '종류, 유형'],
  love:    ['사랑하다', '사랑, 애정'],
  fish:    ['생선, 물고기', '낚시하다'],
  drink:   ['마시다', '음료, 술'],
  name:    ['이름', '이름 짓다'],
  meet:    ['만나다', '충족시키다'],
  have:    ['가지다', '먹다', '~해야 하다'],
  round:   ['둥근', '한 바퀴, 라운드'],
  flat:    ['평평한', '타이어 펑크', '아파트 (영국)'],
  short:   ['짧은', '키가 작은'],
  go:      ['가다', '어울리다', '되다'],
  come:    ['오다', '출신이다'],
  speak:   ['말하다', '연설하다'],
  time:    ['시간', '횟수, 번', '시간을 재다'],
  help:    ['돕다', '도움'],
  know:    ['알다', '경험하다, 느끼다'],
  tell:    ['말하다', '알려주다', '구별하다'],
  give:    ['주다', '기증하다', '양보하다'],
  ask:     ['묻다', '요청하다', '부탁하다'],
  day:     ['날, 하루', '낮'],
  light:   ['빛, 불빛', '밝은', '가벼운'],
  long:    ['긴', '그리워하다'],
  right:   ['오른쪽', '옳은, 맞는', '권리'],
  well:    ['잘', '우물', '건강한'],
  mean:    ['의미하다', '못된, 심술궂은', '평균'],
  back:    ['뒤, 등', '돌아가다', '지지하다'],
  run:     ['달리다', '운영하다', '작동하다'],
  play:    ['놀다', '연주하다', '연극'],
  cool:    ['시원한', '멋진', '식히다'],
  free:    ['자유로운', '무료의', '해방시키다'],
  live:    ['살다', '생방송의', '살아있는'],
  report:  ['보고서', '보고하다', '성적표'],
  book:    ['책', '예약하다'],
  order:   ['주문하다', '순서', '명령하다'],
  check:   ['확인하다', '수표', '체크 무늬'],
  work:    ['일하다', '작동하다', '작품'],
  plan:    ['계획', '계획하다', '도면'],
  change:  ['바꾸다', '변화', '잔돈'],
  mind:    ['마음', '신경 쓰다', '정신'],
  point:   ['가리키다', '점수', '요점'],
  match:   ['경기', '어울리다', '성냥'],
  note:    ['메모', '주목하다', '지폐'],
  figure:  ['숫자', '인물', '이해하다'],
  matter:  ['문제', '중요하다', '물질'],
  watch:   ['보다', '시계', '주의하다'],
  train:   ['기차', '훈련하다', '연습시키다'],
  park:    ['공원', '주차하다'],
  state:   ['상태', '주(州)', '말하다'],
  rock:    ['바위, 돌', '흔들다', '록 음악'],
  date:    ['날짜', '데이트하다', '대추야자'],
  fire:    ['불, 화재', '해고하다', '발사하다'],
  board:   ['게시판', '탑승하다', '이사회'],
  press:   ['누르다', '언론', '다림질하다'],
  charge:  ['요금', '충전하다', '책임지다'],
  bar:     ['술집', '막대', '막다'],
  letter:  ['편지', '글자, 알파벳'],
  address: ['주소', '연설하다', '다루다'],
  post:    ['우편', '게시하다', '직위'],
  deal:    ['거래', '다루다', '많은 양'],
  present: ['선물', '현재', '발표하다', '참석한'],
  fair:    ['공정한', '박람회', '상당한'],
  bank:    ['은행', '제방', '의지하다'],
  cover:   ['덮다', '표지', '다루다'],
  record:  ['기록', '음반', '기록하다'],
  head:    ['머리', '이끌다', '향하다'],
  draw:    ['그리다', '끌어당기다', '무승부'],
  hold:    ['잡다', '개최하다', '대기하다'],
  set:     ['설정하다', '세트', '굳다'],
  turn:    ['돌리다', '차례', '변하다'],
  fall:    ['떨어지다', '가을', '하락'],
  stand:   ['서다', '견디다', '판매대'],
  step:    ['걸음', '단계', '밟다'],
  drive:   ['운전하다', '드라이브', '충동'],
  spring:  ['봄', '용수철', '뛰어오르다'],
  stick:   ['막대기', '붙이다', '고수하다'],
  follow:  ['따르다', '이해하다', '팔로우하다'],
  scale:   ['규모', '저울', '음계'],
  suit:    ['정장', '소송', '어울리다'],
  fine:    ['벌금', '좋은', '미세한'],
  miss:    ['그리워하다', '놓치다', '미스'],
  row:     ['줄, 행', '노를 젓다', '말다툼'],
  capital:  ['자본, 자금', '수도', '대문자'],
  credit:   ['신용', '학점', '공로'],
  interest: ['흥미, 관심', '이자', '이익'],
  balance:  ['균형', '잔액', '저울질하다'],
  stock:    ['주식', '재고', '육수'],
  rate:     ['비율', '속도', '평가하다'],
  account:  ['계좌', '설명하다', '계정'],
  issue:    ['문제', '발행하다', '이슈'],
  project:  ['프로젝트', '예상하다', '투사하다'],
  position: ['위치', '직위', '입장'],
  contract: ['계약', '계약하다', '수축하다'],
  transfer: ['이체', '이동하다', '전학'],
  track:    ['추적하다', '경로', '트랙'],
  lead:     ['이끌다', '납', '주연'],
  process:  ['과정', '처리하다', '공정'],
  conduct:   ['행동', '수행하다', '지휘하다'],
  draft:     ['초안', '징병', '초안을 작성하다'],
  objective: ['목표', '객관적인', '목적어'],
  channel:   ['채널', '수로', '유도하다'],
  commission: ['수수료', '위원회', '의뢰하다'],
  brief:     ['간략한', '브리핑하다', '속옷'],
  compound:  ['화합물', '복합적인', '가중시키다'],
};

async function migrate(): Promise<void> {
  console.log('\n🔄 meanings 마이그레이션 시작...');
  await connectDatabase();

  let updatedCount = 0;
  let skippedCount = 0;

  for (const [word, meanings] of Object.entries(MULTI_MEANING_WORDS)) {
    const result = await Vocabulary.updateMany(
      {
        word,
        targetLanguage: 'en',
        $or: [
          { meanings: { $exists: false } },
          { meanings: { $size: 0 } },
        ],
      },
      {
        $set: { meanings },
      },
    );

    if (result.modifiedCount > 0) {
      console.log(`  ✅ "${word}" → ${result.modifiedCount}개 업데이트 (뜻: ${meanings.join(' / ')})`);
      updatedCount += result.modifiedCount;
    } else {
      skippedCount++;
    }
  }

  console.log(`\n📊 결과:`);
  console.log(`   업데이트: ${updatedCount}개 문서`);
  console.log(`   스킵: ${skippedCount}개 단어 (이미 meanings 있거나 DB에 없음)`);

  await mongoose.disconnect();
  console.log('  👋 MongoDB 연결 해제\n');
}

migrate().catch((err) => {
  console.error('❌ 마이그레이션 실패:', err);
  process.exit(1);
});
