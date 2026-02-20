/**
 * 일본어 회화 시드 데이터 (레벨별 8개, 총 32)
 */
export const japaneseConversations = [
  // ─── Beginner (8) ──────────────────────────────────
  {
    title: '인사 (挨拶)',
    emoji: '👋',
    level: 'beginner',
    order: 1,
    dialogs: [
      { speaker: 'A' as const, text: 'こんにちは！お元気ですか？', translation: '안녕하세요! 잘 지내세요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'はい、元気です。ありがとうございます。', translation: '네, 잘 지내요. 감사합니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: '今日はいい天気ですね。', translation: '오늘 날씨가 좋네요.', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'そうですね。気持ちがいいですね。', translation: '그러네요. 기분이 좋네요.', isUserRole: true, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: 'お元気ですか？', meaning: '잘 지내세요?' },
      { expression: 'いい天気ですね', meaning: '날씨가 좋네요' },
    ],
  },
  {
    title: '자기소개 (自己紹介)',
    emoji: '🙋',
    level: 'beginner',
    order: 2,
    dialogs: [
      { speaker: 'A' as const, text: 'はじめまして。田中と申します。', translation: '처음 뵙겠습니다. 다나카라고 합니다.', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'はじめまして。キムと申します。韓国から来ました。', translation: '처음 뵙겠습니다. 김이라고 합니다. 한국에서 왔습니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: 'お仕事は何をされていますか？', translation: '직업이 무엇인가요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: '会社員です。どうぞよろしくお願いします。', translation: '회사원입니다. 잘 부탁드립니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: 'こちらこそ、よろしくお願いします。', translation: '저야말로 잘 부탁드립니다.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: '～と申します', meaning: '~라고 합니다 (겸양어)' },
      { expression: 'どうぞよろしくお願いします', meaning: '잘 부탁드립니다' },
    ],
  },
  {
    title: '편의점에서 (コンビニで)',
    emoji: '🏪',
    level: 'beginner',
    order: 3,
    dialogs: [
      { speaker: 'A' as const, text: 'いらっしゃいませ。', translation: '어서 오세요.', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'すみません、おにぎりはどこですか？', translation: '실례합니다, 주먹밥은 어디에 있나요?', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: 'あちらの棚にございます。', translation: '저쪽 선반에 있습니다.', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'ありがとうございます。これをお願いします。', translation: '감사합니다. 이것 부탁합니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: '全部で350円になります。袋はご利用ですか？', translation: '전부 350엔입니다. 봉투는 사용하시나요?', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: '～はどこですか？', meaning: '~은/는 어디에 있나요?' },
      { expression: 'これをお願いします', meaning: '이것 부탁합니다' },
    ],
  },
  {
    title: '식당에서 (レストランで)',
    emoji: '🍽️',
    level: 'beginner',
    order: 4,
    dialogs: [
      { speaker: 'A' as const, text: 'ご注文はお決まりですか？', translation: '주문하시겠어요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'ラーメンを一つお願いします。', translation: '라멘 하나 부탁합니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: 'お飲み物はいかがですか？', translation: '음료는 어떠세요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: '水をお願いします。', translation: '물 부탁합니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: 'かしこまりました。少々お待ちください。', translation: '알겠습니다. 잠시만 기다려 주세요.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: '～をお願いします', meaning: '~을/를 부탁합니다' },
      { expression: '少々お待ちください', meaning: '잠시만 기다려 주세요' },
    ],
  },
  {
    title: '날씨 (天気)',
    emoji: '🌤️',
    level: 'beginner',
    order: 5,
    dialogs: [
      { speaker: 'A' as const, text: '今日は暑いですね。', translation: '오늘 덥네요.', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'そうですね。明日は雨が降るそうですよ。', translation: '그러네요. 내일은 비가 온다고 하더라고요.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: '本当ですか？傘を持って行かなきゃ。', translation: '정말이요? 우산을 가져가야겠다.', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: '最近、天気が変わりやすいですね。', translation: '요즘 날씨가 변하기 쉽네요.', isUserRole: true, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: '～そうです', meaning: '~라고 합니다 (전문)' },
      { expression: '～なきゃ', meaning: '~해야 해 (구어체)' },
    ],
  },
  {
    title: '쇼핑 (買い物)',
    emoji: '🛍️',
    level: 'beginner',
    order: 6,
    dialogs: [
      { speaker: 'A' as const, text: '何かお探しですか？', translation: '뭔가 찾으시는 건가요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'Tシャツを探しているんですが。', translation: '티셔츠를 찾고 있는데요.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: 'サイズはいくつですか？', translation: '사이즈가 어떻게 되세요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'Mサイズです。試着してもいいですか？', translation: 'M사이즈요. 입어봐도 될까요?', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: 'はい、試着室はあちらです。', translation: '네, 탈의실은 저쪽입니다.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: '～を探しているんですが', meaning: '~을/를 찾고 있는데요' },
      { expression: '試着してもいいですか？', meaning: '입어봐도 될까요?' },
    ],
  },
  {
    title: '길 묻기 (道を聞く)',
    emoji: '🗺️',
    level: 'beginner',
    order: 7,
    dialogs: [
      { speaker: 'A' as const, text: 'すみません、駅はどこですか？', translation: '실례합니다, 역은 어디에 있나요?', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'まっすぐ行って、二つ目の信号を右に曲がってください。', translation: '직진해서 두 번째 신호등에서 오른쪽으로 꺾어 주세요.', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: 'ここから遠いですか？', translation: '여기서 먼가요?', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'いいえ、歩いて5分ぐらいです。', translation: '아니요, 걸어서 5분 정도입니다.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: 'まっすぐ行って', meaning: '직진해서' },
      { expression: '歩いて～分ぐらい', meaning: '걸어서 ~분 정도' },
    ],
  },
  {
    title: '전화 (電話)',
    emoji: '📞',
    level: 'beginner',
    order: 8,
    dialogs: [
      { speaker: 'A' as const, text: 'もしもし、山田さんのお宅ですか？', translation: '여보세요, 야마다 씨 댁인가요?', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'はい、そうです。どちら様ですか？', translation: '네, 맞습니다. 누구시죠?', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: 'キムと申します。山田さんはいらっしゃいますか？', translation: '김이라고 합니다. 야마다 씨 계신가요?', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: '今、外出しておりますが、伝言をお伝えしましょうか？', translation: '지금 외출 중인데요, 메시지를 전해드릴까요?', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: 'では、折り返しお電話いただけますか？', translation: '그러면, 다시 전화해 주실 수 있나요?', isUserRole: true, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: 'どちら様ですか？', meaning: '누구시죠? (정중한 표현)' },
      { expression: '折り返しお電話いただけますか？', meaning: '다시 전화해 주실 수 있나요?' },
    ],
  },

  // ─── Elementary (8) ────────────────────────────────
  {
    title: '공항 (空港)',
    emoji: '✈️',
    level: 'elementary',
    order: 9,
    dialogs: [
      { speaker: 'A' as const, text: 'チェックインをお願いします。成田行きです。', translation: '체크인 부탁합니다. 나리타행입니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'パスポートを見せていただけますか？', translation: '여권을 보여주시겠어요?', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: 'はい、どうぞ。窓側の席をお願いできますか？', translation: '네, 여기요. 창가 좌석으로 부탁할 수 있나요?', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: '窓側ですね。お荷物をこちらに置いてください。', translation: '창가 쪽이요. 짐을 여기에 올려주세요.', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: '搭乗ゲートは何番ですか？', translation: '탑승 게이트는 몇 번인가요?', isUserRole: true, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: '窓側の席をお願いします', meaning: '창가 좌석으로 부탁합니다' },
      { expression: '搭乗ゲートは何番ですか？', meaning: '탑승 게이트는 몇 번인가요?' },
    ],
  },
  {
    title: '호텔 (ホテル)',
    emoji: '🏨',
    level: 'elementary',
    order: 10,
    dialogs: [
      { speaker: 'A' as const, text: 'チェックインをお願いします。予約したキムです。', translation: '체크인 부탁합니다. 예약한 김입니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'キム様ですね。シングルルームで2泊ですね。', translation: '김 님이시군요. 싱글룸으로 2박이시네요.', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: '朝食は付いていますか？', translation: '조식은 포함되어 있나요?', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'はい、7時から10時まで1階のレストランでご利用いただけます。', translation: '네, 7시부터 10시까지 1층 레스토랑에서 이용하실 수 있습니다.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: '朝食は付いていますか？', meaning: '조식은 포함되어 있나요?' },
      { expression: 'ご利用いただけます', meaning: '이용하실 수 있습니다' },
    ],
  },
  {
    title: '병원 (病院)',
    emoji: '🏥',
    level: 'elementary',
    order: 11,
    dialogs: [
      { speaker: 'A' as const, text: 'どうされましたか？', translation: '어떻게 오셨나요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: '3日前から熱があって、喉が痛いです。', translation: '3일 전부터 열이 있고, 목이 아파요.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: '口を開けてください。少し喉が赤いですね。', translation: '입을 벌려주세요. 목이 좀 빨갛네요.', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: '薬を出していただけますか？', translation: '약을 처방해 주시겠어요?', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: 'はい、3日分のお薬を出しますね。食後に飲んでください。', translation: '네, 3일분 약을 처방하겠습니다. 식후에 드세요.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: 'どうされましたか？', meaning: '어떻게 오셨나요? (증상 물을 때)' },
      { expression: '食後に飲んでください', meaning: '식후에 드세요' },
    ],
  },
  {
    title: '택시 (タクシー)',
    emoji: '🚕',
    level: 'elementary',
    order: 12,
    dialogs: [
      { speaker: 'A' as const, text: 'どちらまでですか？', translation: '어디까지 가시나요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: '東京駅までお願いします。急いでいるんですが。', translation: '도쿄역까지 부탁합니다. 급한데요.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: '分かりました。高速を使いますか？', translation: '알겠습니다. 고속도로를 이용할까요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'はい、お願いします。だいたいどのくらいかかりますか？', translation: '네, 부탁합니다. 대략 얼마나 걸리나요?', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: '20分ぐらいだと思います。', translation: '20분 정도 걸릴 것 같습니다.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: '～までお願いします', meaning: '~까지 부탁합니다' },
      { expression: 'どのくらいかかりますか？', meaning: '얼마나 걸리나요?' },
    ],
  },
  {
    title: '은행 (銀行)',
    emoji: '🏦',
    level: 'elementary',
    order: 13,
    dialogs: [
      { speaker: 'A' as const, text: '口座を開設したいのですが。', translation: '계좌를 개설하고 싶은데요.', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: '身分証明書をお持ちですか？', translation: '신분증을 가지고 계신가요?', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: 'はい、在留カードとパスポートがあります。', translation: '네, 재류카드와 여권이 있습니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'では、こちらの申込書にご記入ください。印鑑はお持ちですか？', translation: '그러면 이 신청서에 기입해 주세요. 도장은 가지고 계신가요?', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: '口座を開設したい', meaning: '계좌를 개설하고 싶다' },
      { expression: 'こちらにご記入ください', meaning: '여기에 기입해 주세요' },
    ],
  },
  {
    title: '영화관 (映画館)',
    emoji: '🎬',
    level: 'elementary',
    order: 14,
    dialogs: [
      { speaker: 'A' as const, text: '7時の回のチケットを2枚お願いします。', translation: '7시 상영 티켓 2장 부탁합니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: '席はどちらがよろしいですか？前の方と後ろの方がございます。', translation: '좌석은 어디가 좋으세요? 앞쪽과 뒤쪽이 있습니다.', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: '後ろの方でお願いします。ポップコーンセットはありますか？', translation: '뒤쪽으로 부탁합니다. 팝콘 세트는 있나요?', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'はい、Mサイズとドリンクのセットで800円です。', translation: '네, M사이즈와 음료 세트로 800엔입니다.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: '～の回のチケット', meaning: '~시 상영 티켓' },
      { expression: '後ろの方でお願いします', meaning: '뒤쪽으로 부탁합니다' },
    ],
  },
  {
    title: '도서관 (図書館)',
    emoji: '📚',
    level: 'elementary',
    order: 15,
    dialogs: [
      { speaker: 'A' as const, text: '本を借りたいんですが、利用カードはどうやって作れますか？', translation: '책을 빌리고 싶은데요, 이용카드는 어떻게 만들 수 있나요?', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: '身分証明書をお持ちいただければ、すぐにお作りできます。', translation: '신분증을 가져오시면 바로 만들어 드릴 수 있습니다.', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: '貸出期間はどのくらいですか？', translation: '대출 기간은 얼마나 되나요?', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: '2週間です。5冊まで借りられますよ。', translation: '2주일입니다. 5권까지 빌릴 수 있어요.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: '本を借りたい', meaning: '책을 빌리고 싶다' },
      { expression: '貸出期間はどのくらいですか？', meaning: '대출 기간은 얼마나 되나요?' },
    ],
  },
  {
    title: '우체국 (郵便局)',
    emoji: '📮',
    level: 'elementary',
    order: 16,
    dialogs: [
      { speaker: 'A' as const, text: '韓国に荷物を送りたいんですが。', translation: '한국에 짐을 보내고 싶은데요.', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'EMSと航空便がございます。EMSの方が早いですが、料金が高くなります。', translation: 'EMS와 항공편이 있습니다. EMS가 더 빠르지만 요금이 비쌉니다.', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: 'どのくらいで届きますか？', translation: '얼마나 걸려서 도착하나요?', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'EMSでしたら3日ほどで届きます。こちらの伝票にご記入ください。', translation: 'EMS면 3일 정도면 도착합니다. 이 전표에 기입해 주세요.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: '荷物を送りたい', meaning: '짐을 보내고 싶다' },
      { expression: 'どのくらいで届きますか？', meaning: '얼마나 걸려서 도착하나요?' },
    ],
  },

  // ─── Intermediate (8) ──────────────────────────────
  {
    title: '면접 (面接)',
    emoji: '💼',
    level: 'intermediate',
    order: 17,
    dialogs: [
      { speaker: 'A' as const, text: '本日は面接にお越しいただきありがとうございます。まず自己紹介をお願いします。', translation: '오늘 면접에 와주셔서 감사합니다. 먼저 자기소개를 부탁드립니다.', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'キムと申します。韓国のソウル大学で経営学を専攻しました。前職ではマーケティングを担当しておりました。', translation: '김이라고 합니다. 한국 서울대학교에서 경영학을 전공했습니다. 전 직장에서는 마케팅을 담당했습니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: '弊社を志望された理由を教えていただけますか？', translation: '저희 회사를 지원하신 이유를 알려주시겠어요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: '御社のグローバル展開に大変魅力を感じております。私の語学力と海外経験を活かせると考えました。', translation: '귀사의 글로벌 전개에 큰 매력을 느끼고 있습니다. 제 어학 능력과 해외 경험을 살릴 수 있다고 생각했습니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: '入社後にどのような貢献ができると思いますか？', translation: '입사 후 어떤 기여를 할 수 있다고 생각하시나요?', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: '弊社を志望された理由', meaning: '저희 회사를 지원하신 이유' },
      { expression: '～を活かせると考えました', meaning: '~을/를 살릴 수 있다고 생각했습니다' },
    ],
  },
  {
    title: '비즈니스 회의 (ビジネス会議)',
    emoji: '📊',
    level: 'intermediate',
    order: 18,
    dialogs: [
      { speaker: 'A' as const, text: 'では、今月の売上について報告をお願いします。', translation: '그러면, 이번 달 매출에 대해 보고를 부탁드립니다.', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: '今月の売上は前月比で15%増加しました。主にオンライン販売が好調でした。', translation: '이번 달 매출은 전월 대비 15% 증가했습니다. 주로 온라인 판매가 호조였습니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: 'それは素晴らしいですね。今後の課題はありますか？', translation: '그것은 훌륭하네요. 향후 과제는 있나요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: '新規顧客の獲得率をもう少し上げる必要があると考えております。', translation: '신규 고객 확보율을 좀 더 올릴 필요가 있다고 생각합니다.', isUserRole: true, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: '前月比で～%増加', meaning: '전월 대비 ~% 증가' },
      { expression: '～必要があると考えております', meaning: '~할 필요가 있다고 생각합니다' },
    ],
  },
  {
    title: '집 구하기 (部屋探し)',
    emoji: '🏠',
    level: 'intermediate',
    order: 19,
    dialogs: [
      { speaker: 'A' as const, text: 'どのような物件をお探しですか？', translation: '어떤 물건을 찾고 계신가요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: '駅から徒歩10分以内で、1LDKの物件を探しています。家賃は8万円以内が希望です。', translation: '역에서 도보 10분 이내, 1LDK 물건을 찾고 있습니다. 월세는 8만엔 이내를 희망합니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: 'ペットは飼われていますか？', translation: '반려동물은 키우시나요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'いいえ。それと、敷金と礼金はどのくらいかかりますか？', translation: '아니요. 그리고 보증금과 사례금은 얼마 정도 드나요?', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: 'こちらの物件は敷金1ヶ月、礼金1ヶ月となっております。内見をされますか？', translation: '이 물건은 보증금 1개월, 사례금 1개월입니다. 내부 견학을 하시겠어요?', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: '駅から徒歩～分以内', meaning: '역에서 도보 ~분 이내' },
      { expression: '敷金と礼金', meaning: '보증금과 사례금 (일본 부동산 용어)' },
    ],
  },
  {
    title: '불만 제기 (クレーム)',
    emoji: '😤',
    level: 'intermediate',
    order: 20,
    dialogs: [
      { speaker: 'A' as const, text: '恐れ入りますが、どのようなご用件でしょうか？', translation: '죄송하지만, 어떤 용건이신가요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: '先週購入した商品に不良品が入っていたんですが。', translation: '지난주에 구매한 상품에 불량품이 들어 있었는데요.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: '大変申し訳ございません。レシートはお持ちですか？', translation: '대단히 죄송합니다. 영수증은 가지고 계신가요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'はい、こちらです。交換か返金をお願いしたいのですが。', translation: '네, 여기 있습니다. 교환이나 환불을 부탁하고 싶은데요.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: '承知いたしました。すぐに新しい商品と交換させていただきます。', translation: '알겠습니다. 바로 새 상품으로 교환해 드리겠습니다.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: '不良品が入っていた', meaning: '불량품이 들어 있었다' },
      { expression: '交換か返金をお願いしたい', meaning: '교환이나 환불을 부탁하고 싶다' },
    ],
  },
  {
    title: '건강 상담 (健康相談)',
    emoji: '🩺',
    level: 'intermediate',
    order: 21,
    dialogs: [
      { speaker: 'A' as const, text: '最近、何かお体の調子で気になることはありますか？', translation: '최근 몸 상태로 신경 쓰이는 것이 있나요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'ストレスのせいか、最近あまり眠れなくて、疲れが取れないんです。', translation: '스트레스 때문인지 최근에 잘 못 자서 피로가 풀리지 않아요.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: '食事や運動の習慣はいかがですか？', translation: '식사나 운동 습관은 어떠세요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: '忙しくて外食が多いですし、運動もほとんどしていません。', translation: '바빠서 외식이 많고, 운동도 거의 하지 않고 있어요.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: 'まずは生活習慣の改善から始めましょう。軽い運動とバランスの良い食事を心がけてください。', translation: '우선 생활습관 개선부터 시작합시다. 가벼운 운동과 균형 잡힌 식사를 신경 써 주세요.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: '疲れが取れない', meaning: '피로가 풀리지 않는다' },
      { expression: '生活習慣の改善', meaning: '생활습관 개선' },
    ],
  },
  {
    title: '여행 계획 (旅行計画)',
    emoji: '🗾',
    level: 'intermediate',
    order: 22,
    dialogs: [
      { speaker: 'A' as const, text: '来月、京都に旅行に行こうと思っているんですが、おすすめはありますか？', translation: '다음 달에 교토로 여행 가려고 하는데, 추천할 만한 곳이 있나요?', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: '京都なら、金閣寺と伏見稲荷大社は外せませんよ。', translation: '교토라면 킨카쿠지와 후시미이나리 신사는 빼놓을 수 없어요.', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: '何日ぐらいあれば十分ですか？', translation: '며칠 정도면 충분한가요?', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: '2泊3日あれば主要な観光地は回れると思います。宿は早めに予約した方がいいですよ。', translation: '2박 3일이면 주요 관광지는 돌아볼 수 있을 거예요. 숙소는 일찍 예약하는 게 좋아요.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: '～は外せません', meaning: '~은/는 빼놓을 수 없다' },
      { expression: '早めに予約した方がいい', meaning: '일찍 예약하는 게 좋다' },
    ],
  },
  {
    title: '기술 지원 (技術サポート)',
    emoji: '💻',
    level: 'intermediate',
    order: 23,
    dialogs: [
      { speaker: 'A' as const, text: 'お電話ありがとうございます。技術サポートです。どのようなお困りごとですか？', translation: '전화 감사합니다. 기술 지원입니다. 어떤 문제인가요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'パソコンが急にフリーズして、再起動しても直らないんです。', translation: '컴퓨터가 갑자기 멈춰서 재부팅해도 고쳐지지 않아요.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: 'セーフモードで起動してみていただけますか？電源ボタンを長押ししてから、F8キーを押してください。', translation: '안전 모드로 부팅해 보시겠어요? 전원 버튼을 길게 누른 후 F8 키를 눌러주세요.', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'やってみます。もしそれでもダメな場合はどうすればいいですか？', translation: '해볼게요. 만약 그래도 안 되면 어떻게 해야 하나요?', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: 'その場合は、修理の手配をさせていただきます。', translation: '그 경우에는 수리 수배를 해드리겠습니다.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: 'フリーズして動かない', meaning: '멈춰서 움직이지 않는다' },
      { expression: '修理の手配をさせていただきます', meaning: '수리 수배를 해드리겠습니다' },
    ],
  },
  {
    title: '운동 (スポーツ)',
    emoji: '⚽',
    level: 'intermediate',
    order: 24,
    dialogs: [
      { speaker: 'A' as const, text: 'このジムに入会したいのですが、どんなプランがありますか？', translation: '이 헬스장에 가입하고 싶은데, 어떤 플랜이 있나요?', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: '月額制と都度払いがございます。月額は8,000円で使い放題です。', translation: '월정액제와 건별 결제가 있습니다. 월정액은 8,000엔으로 무제한 이용입니다.', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: 'パーソナルトレーニングも受けられますか？', translation: '개인 트레이닝도 받을 수 있나요?', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'はい、別途料金がかかりますが、週1回のコースと週2回のコースがあります。', translation: '네, 별도 요금이 들지만 주 1회 코스와 주 2회 코스가 있습니다.', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: '体験レッスンはありますか？', translation: '체험 레슨은 있나요?', isUserRole: true, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: '月額制と都度払い', meaning: '월정액제와 건별 결제' },
      { expression: '体験レッスンはありますか？', meaning: '체험 레슨은 있나요?' },
    ],
  },

  // ─── Advanced (8) ──────────────────────────────────
  {
    title: '학술 토론 (学術議論)',
    emoji: '🎓',
    level: 'advanced',
    order: 25,
    dialogs: [
      { speaker: 'A' as const, text: '今回の研究結果について、どのようにお考えですか？', translation: '이번 연구 결과에 대해 어떻게 생각하시나요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'サンプル数が限定的であるため、結論を一般化するのは時期尚早だと考えます。', translation: '표본 수가 한정적이기 때문에 결론을 일반화하는 것은 시기상조라고 생각합니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: 'ごもっともです。追加の実験データが必要ですね。先行研究との整合性についてはいかがですか？', translation: '맞는 말씀입니다. 추가 실험 데이터가 필요하네요. 선행 연구와의 정합성에 대해서는 어떠신가요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: '一部の知見は従来の理論と矛盾しますが、新たな仮説を提示できる可能性があると思います。', translation: '일부 발견은 기존 이론과 모순되지만, 새로운 가설을 제시할 수 있는 가능성이 있다고 생각합니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: '次のステップとして、対照実験の設計を進めましょう。', translation: '다음 단계로 대조 실험 설계를 진행합시다.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: '結論を一般化するのは時期尚早', meaning: '결론을 일반화하는 것은 시기상조' },
      { expression: '先行研究との整合性', meaning: '선행 연구와의 정합성' },
    ],
  },
  {
    title: '투자 상담 (投資相談)',
    emoji: '📈',
    level: 'advanced',
    order: 26,
    dialogs: [
      { speaker: 'A' as const, text: '現在のポートフォリオを拝見しましたが、リスク分散が十分ではないように見受けられます。', translation: '현재 포트폴리오를 보았는데, 리스크 분산이 충분하지 않은 것 같습니다.', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: '具体的にはどのような改善をすべきでしょうか？', translation: '구체적으로 어떤 개선을 해야 할까요?', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: '国内株式に偏りがありますので、海外資産や債券への分散投資を検討されてはいかがでしょうか。', translation: '국내 주식에 편중되어 있으므로, 해외 자산이나 채권으로의 분산 투자를 검토해 보시는 게 어떨까요.', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: '為替リスクについてはどのようにヘッジすればよいですか？', translation: '환율 리스크에 대해서는 어떻게 헤지하면 좋을까요?', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: '為替ヘッジ付きのファンドを活用する方法が一般的です。長期的な視点で見れば、為替変動はある程度相殺されます。', translation: '환율 헤지가 포함된 펀드를 활용하는 방법이 일반적입니다. 장기적인 관점에서 보면 환율 변동은 어느 정도 상쇄됩니다.', isUserRole: false, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: 'リスク分散が十分ではない', meaning: '리스크 분산이 충분하지 않다' },
      { expression: '分散投資を検討されてはいかがでしょうか', meaning: '분산 투자를 검토해 보시는 게 어떨까요' },
    ],
  },
  {
    title: '환경 토론 (環境問題)',
    emoji: '🌍',
    level: 'advanced',
    order: 27,
    dialogs: [
      { speaker: 'A' as const, text: '脱炭素社会の実現に向けて、企業はどのような役割を果たすべきだとお考えですか？', translation: '탈탄소 사회 실현을 위해 기업은 어떤 역할을 해야 한다고 생각하시나요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: '再生可能エネルギーへの転換はもちろん、サプライチェーン全体のカーボンフットプリントを削減する取り組みが不可欠です。', translation: '재생 가능 에너지로의 전환은 물론, 공급망 전체의 탄소 발자국을 줄이는 노력이 불가결합니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: '経済成長と環境保全の両立は可能だとお思いですか？', translation: '경제 성장과 환경 보전의 양립이 가능하다고 생각하시나요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'グリーンイノベーションを推進すれば、新たな産業と雇用を創出しながら環境負荷を低減できるはずです。', translation: '그린 이노베이션을 추진하면 새로운 산업과 고용을 창출하면서 환경 부하를 줄일 수 있을 것입니다.', isUserRole: true, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: '脱炭素社会の実現', meaning: '탈탄소 사회의 실현' },
      { expression: '経済成長と環境保全の両立', meaning: '경제 성장과 환경 보전의 양립' },
    ],
  },
  {
    title: '법률 상담 (法律相談)',
    emoji: '⚖️',
    level: 'advanced',
    order: 28,
    dialogs: [
      { speaker: 'A' as const, text: '賃貸契約に関してトラブルが発生したのですが、ご相談できますか？', translation: '임대 계약에 관해 문제가 발생했는데, 상담할 수 있을까요?', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'もちろんです。具体的にどのような状況でしょうか？', translation: '물론입니다. 구체적으로 어떤 상황인가요?', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: '退去時に原状回復費用として高額な請求を受けました。通常の使用による劣化も含まれているように思うのですが。', translation: '퇴거 시 원상복구 비용으로 고액 청구를 받았습니다. 통상적인 사용에 의한 노화도 포함되어 있는 것 같은데요.', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'おっしゃる通り、経年劣化や通常損耗は借主の負担にはなりません。国土交通省のガイドラインに基づいて交渉しましょう。', translation: '말씀하신 대로 경년 열화나 통상 마모는 임차인의 부담이 아닙니다. 국토교통성 가이드라인에 근거하여 협상합시다.', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: '法的手続きが必要になる可能性はありますか？', translation: '법적 절차가 필요해질 가능성이 있나요?', isUserRole: true, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: '原状回復費用', meaning: '원상복구 비용' },
      { expression: '経年劣化や通常損耗', meaning: '경년 열화나 통상 마모' },
    ],
  },
  {
    title: '외교 회의 (外交会議)',
    emoji: '🤝',
    level: 'advanced',
    order: 29,
    dialogs: [
      { speaker: 'A' as const, text: '両国間の経済連携協定の改定について、貴国の立場をお聞かせいただけますか。', translation: '양국 간 경제연계협정 개정에 대해 귀국의 입장을 들려주시겠습니까.', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: '我が国としては、関税の段階的撤廃と投資環境の整備を最優先課題と位置づけております。', translation: '저희 나라로서는 관세의 단계적 철폐와 투자 환경 정비를 최우선 과제로 자리매김하고 있습니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: '知的財産権の保護強化については、どのようにお考えですか？', translation: '지적재산권 보호 강화에 대해서는 어떻게 생각하시나요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: '相互の利益を尊重した枠組みの構築が不可欠だと認識しております。具体的な条項については実務レベルで協議を進めたいと存じます。', translation: '상호 이익을 존중한 프레임워크 구축이 불가결하다고 인식하고 있습니다. 구체적인 조항에 대해서는 실무 레벨에서 협의를 진행하고자 합니다.', isUserRole: true, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: '最優先課題と位置づけております', meaning: '최우선 과제로 자리매김하고 있습니다' },
      { expression: '実務レベルで協議を進めたい', meaning: '실무 레벨에서 협의를 진행하고 싶다' },
    ],
  },
  {
    title: '기술 발표 (技術発表)',
    emoji: '🔬',
    level: 'advanced',
    order: 30,
    dialogs: [
      { speaker: 'A' as const, text: '本日は我々の新しいAIモデルについて発表させていただきます。従来のモデルと比較して処理速度が3倍向上しました。', translation: '오늘은 저희의 새로운 AI 모델에 대해 발표하겠습니다. 기존 모델과 비교하여 처리 속도가 3배 향상되었습니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: '精度の面ではどのような改善が見られましたか？', translation: '정확도 면에서는 어떤 개선이 있었나요?', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: 'ベンチマークテストにおいて、正答率が従来の92%から97%に向上しました。特に自然言語処理のタスクで顕著な改善が見られます。', translation: '벤치마크 테스트에서 정답률이 기존 92%에서 97%로 향상되었습니다. 특히 자연어 처리 태스크에서 현저한 개선이 보입니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: 'スケーラビリティの面での課題はありませんか？', translation: '확장성 면에서의 과제는 없나요?', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: '分散処理アーキテクチャを採用しているため、水平スケーリングが容易に行えます。', translation: '분산 처리 아키텍처를 채택하고 있어 수평 스케일링이 용이하게 이루어집니다.', isUserRole: true, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: '従来のモデルと比較して', meaning: '기존 모델과 비교하여' },
      { expression: '分散処理アーキテクチャ', meaning: '분산 처리 아키텍처' },
    ],
  },
  {
    title: '철학 토론 (哲学議論)',
    emoji: '🤔',
    level: 'advanced',
    order: 31,
    dialogs: [
      { speaker: 'A' as const, text: 'AIが人間の知性を超えるシンギュラリティについて、どのような見解をお持ちですか？', translation: 'AI가 인간의 지성을 넘어서는 싱귤래리티에 대해 어떤 견해를 가지고 계신가요?', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: '技術的な達成と、真の意味での「知性」を同一視すべきではないと考えます。意識や主体性を伴わない情報処理は知性とは言い難いのではないでしょうか。', translation: '기술적 달성과 진정한 의미의 \'지성\'을 동일시해서는 안 된다고 생각합니다. 의식이나 주체성을 수반하지 않는 정보처리는 지성이라고 하기 어렵지 않을까요.', isUserRole: true, audioUrl: '' },
      { speaker: 'A' as const, text: 'では、意識とは何かという根本的な問いに立ち返る必要がありますね。', translation: '그렇다면 의식이란 무엇인가라는 근본적인 물음으로 돌아갈 필요가 있겠네요.', isUserRole: false, audioUrl: '' },
      { speaker: 'B' as const, text: 'まさにそこが哲学的議論の核心です。デカルトの「我思う、ゆえに我あり」を現代の文脈でどう解釈すべきかが問われています。', translation: '바로 그것이 철학적 논의의 핵심입니다. 데카르트의 "나는 생각한다, 고로 존재한다"를 현대의 맥락에서 어떻게 해석해야 하는가가 물어지고 있습니다.', isUserRole: true, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: '同一視すべきではない', meaning: '동일시해서는 안 된다' },
      { expression: '根本的な問いに立ち返る', meaning: '근본적인 물음으로 돌아가다' },
    ],
  },
  {
    title: '무역 협상 (貿易交渉)',
    emoji: '🌐',
    level: 'advanced',
    order: 32,
    dialogs: [
      { speaker: 'A' as const, text: '今回の取引条件について再検討していただきたい点がございます。', translation: '이번 거래 조건에 대해 재검토해 주셨으면 하는 점이 있습니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: '具体的にはどの部分でしょうか？', translation: '구체적으로 어느 부분인가요?', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: '納期と支払条件です。現行の30日以内の支払いを60日に延長していただけないでしょうか。大量発注を前提としております。', translation: '납기와 지불 조건입니다. 현행 30일 이내 지불을 60일로 연장해 주실 수 없을까요. 대량 발주를 전제로 하고 있습니다.', isUserRole: true, audioUrl: '' },
      { speaker: 'B' as const, text: '発注量によっては検討の余地がございます。最低発注数量はどの程度を想定されていますか？', translation: '발주량에 따라서는 검토의 여지가 있습니다. 최소 발주 수량은 어느 정도를 상정하고 계신가요?', isUserRole: false, audioUrl: '' },
      { speaker: 'A' as const, text: '月間5,000ユニット以上を見込んでおります。長期的なパートナーシップを構築できればと考えております。', translation: '월간 5,000유닛 이상을 예상하고 있습니다. 장기적인 파트너십을 구축할 수 있으면 좋겠다고 생각합니다.', isUserRole: true, audioUrl: '' },
    ],
    keyExpressions: [
      { expression: '検討の余地がございます', meaning: '검토의 여지가 있습니다' },
      { expression: '長期的なパートナーシップを構築', meaning: '장기적인 파트너십 구축' },
    ],
  },
];
