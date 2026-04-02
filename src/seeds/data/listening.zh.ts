// ============================================================
// HSK 기반 중국어 듣기 시드 데이터 (회화 청해 형식)
// beginner    → HSK 1   (기초 150어휘, 단답 대화)
// elementary  → HSK 2   (300어휘, 짧은 대화)
// intermediate→ HSK 3-4 (600-1200어휘, 청해 문제)
// advanced    → HSK 5-6 (뉴스·독백·성어 포함)
// ============================================================
export const listeningZhData = [
  // ═══════════════════════════════════════════════════
  // BEGINNER  (HSK 1)  — items 1-8
  // Short dialogues & monologues using ≤150 core words.
  // Format mirrors HSK 1 Part 3 (dialogue) & Part 4 (monologue).
  // ═══════════════════════════════════════════════════
  {
    audioText:
      '男：你看见我的小猫了吗？\n女：在那儿，在椅子上。\n问：小猫在哪儿？',
    correctAnswer: '椅子上',
    hint: '남자가 고양이를 찾고 있어요. 여자가 고양이 위치를 알려줍니다. "在那儿，在___上" 에서 장소를 들어보세요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 1,
  },
  {
    audioText:
      '女：我们中午去买，好吗？\n男：你看，我没钱了。\n问：男的为什么不想去买？',
    correctAnswer: '没钱',
    hint: '여자가 점심에 뭔가를 사러 가자고 제안해요. 남자의 거절 이유를 잘 들어보세요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 2,
  },
  {
    audioText:
      '男：你住在哪儿？\n女：我和妈妈都住在一零二。\n问：女的住在哪儿？',
    correctAnswer: '一零二（102号）',
    hint: '남자가 어디 사는지 물어봐요. 숫자를 잘 들어보세요. "一零二"는 방 번호예요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 3,
  },
  {
    audioText:
      '女：这个汉字怎么读？\n男：对不起，我不会。\n问：男的会不会读这个汉字？',
    correctAnswer: '不会',
    hint: '여자가 한자 읽는 법을 물어봐요. 남자가 알고 있는지 없는지 들어보세요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 4,
  },
  {
    audioText:
      '我的电脑在他的桌子上。\n问：那是谁的电脑？',
    correctAnswer: '他的（电脑）',
    hint: '전치사 "在" 앞에 있는 명사가 주인이에요. 무엇이 누구 책상 위에 있는지 들어보세요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 5,
  },
  {
    audioText:
      '今天星期四，我们明天去看电影。\n问：我们什么时候去看电影？',
    correctAnswer: '星期五（明天）',
    hint: '오늘이 무슨 요일인지 먼저 파악하고, "明天"이 어떤 날인지 계산해보세요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 6,
  },
  {
    audioText:
      '他是老师，他有五十个学生。\n问：他有多少个学生？',
    correctAnswer: '五十个',
    hint: '직업과 숫자가 나와요. "多少" 질문이므로 숫자를 정확히 들어보세요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 7,
  },
  {
    audioText:
      '男：谢谢你们！\n女：不客气。再见。\n问：女的说了什么？',
    correctAnswer: '不客气',
    hint: '감사 인사에 대한 응답을 들어보세요. "不客气"는 "천만에요"라는 뜻이에요.',
    difficulty: 'beginner',
    audioUrl: '',
    order: 8,
  },

  // ═══════════════════════════════════════════════════
  // ELEMENTARY  (HSK 2)  — items 9-16
  // Short dialogues using ≤300 core words.
  // Format mirrors HSK 2 Part 3 (dialogue + picture ID).
  // ═══════════════════════════════════════════════════
  {
    audioText:
      '男：小王，这里有几个杯子，哪个是你的？\n女：左边那个红色的是我的。\n问：小王的杯子是什么颜色的？',
    correctAnswer: '红色',
    hint: '여러 컵이 있어요. 여자는 자신의 컵 위치와 색을 말해줘요. 방향 단어(左/右)와 색깔을 함께 들어보세요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 9,
  },
  {
    audioText:
      '女：你每天怎么去公司？\n男：我骑自行车去，大概二十分钟。\n问：男的怎么去公司？',
    correctAnswer: '骑自行车',
    hint: '교통수단을 묻는 질문이에요. "骑"는 타다(자전거·말), "开"는 운전하다, "坐"는 (대중교통을) 타다예요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 10,
  },
  {
    audioText:
      '男：你最喜欢什么运动？\n女：我最喜欢游泳，你呢？\n男：我喜欢踢足球。\n问：女的最喜欢什么运动？',
    correctAnswer: '游泳',
    hint: '취미·운동을 묻고 답하는 대화예요. 남자와 여자가 각각 다른 운동을 말해요. 누가 무슨 운동을 좋아하는지 구별해 들어보세요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 11,
  },
  {
    audioText:
      '女：你去哪儿？\n男：我去超市，家里没有牛奶了。\n女：能帮我带一些苹果吗？\n男：好的。\n问：男的要去哪儿？',
    correctAnswer: '超市',
    hint: '남자가 어디 가는지, 왜 가는지 들어보세요. 여자가 부탁하는 물건도 따로 메모해두세요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 12,
  },
  {
    audioText:
      '男：今天天气怎么样？\n女：外面很冷，你出去要穿多点儿。\n问：今天天气怎么样？',
    correctAnswer: '很冷',
    hint: '날씨 표현을 묻는 질문이에요. 여자의 조언을 통해 날씨를 유추할 수 있어요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 13,
  },
  {
    audioText:
      '女：你在哪儿工作？\n男：我在一家医院工作，我是医生。\n女：那你一定很忙。\n男：是啊，但是我很喜欢这份工作。\n问：男的是做什么工作的？',
    correctAnswer: '医生',
    hint: '직업을 묻는 대화예요. 남자가 어디서 무슨 일을 하는지 들어보세요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 14,
  },
  {
    audioText:
      '男：你会说几种语言？\n女：我会说中文和英文，现在在学日文。\n问：女的正在学什么语言？',
    correctAnswer: '日文',
    hint: '여자가 할 수 있는 언어와 현재 배우는 언어가 달라요. "在学"은 지금 배우는 중이라는 뜻이에요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 15,
  },
  {
    audioText:
      '女：这件衬衫多少钱？\n男：两百八十块。\n女：能便宜一点儿吗？\n男：最多便宜二十块。\n问：最后这件衬衫多少钱？',
    correctAnswer: '两百六十块',
    hint: '가격 흥정 대화예요. 처음 가격에서 얼마를 깎았는지 계산해보세요.',
    difficulty: 'elementary',
    audioUrl: '',
    order: 16,
  },

  // ═══════════════════════════════════════════════════
  // INTERMEDIATE  (HSK 3-4)  — items 17-24
  // Multi-turn dialogues with comprehension questions.
  // Format mirrors HSK 3 Part 3 & HSK 4 Part 2.
  // ═══════════════════════════════════════════════════
  {
    audioText:
      '男：喂，请问张经理在吗？\n女：他正在开会，您半个小时以后再打，好吗？\n男：好的，谢谢。那麻烦您转告他，我们明天的会议改到下午三点了。\n女：好的，我会告诉他的。\n问：男的为什么打电话？',
    correctAnswer: '通知会议时间变更（改到下午三点）',
    hint: '전화 통화 내용이에요. 상대방이 부재중일 때 어떤 메시지를 남기는지 들어보세요. "改到"는 ~로 변경하다예요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 17,
  },
  {
    audioText:
      '女：该加油了，去机场的路上有加油站吗？\n男：有，你放心吧。而且离这儿不远，大概五分钟就到了。\n女：那好，我们走吧，不然要迟到了。\n问：他们现在要去哪儿？',
    correctAnswer: '机场',
    hint: '두 사람이 어딘가로 가는 중이에요. 중간에 어디를 들릴 예정인지, 최종 목적지가 어딘지 구별해 들어보세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 18,
  },
  {
    audioText:
      '为了让自己更健康，他每天都花一个小时去锻炼身体，不管刮风还是下雨。\n问：他为什么每天锻炼？',
    correctAnswer: '为了更健康',
    hint: '"为了" 뒤에 목적이 나와요. 날씨와 상관없이 매일 운동하는 이유를 들어보세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 19,
  },
  {
    audioText:
      '女：你最近在忙什么？\n男：我在准备下个月的考试，每天都要复习到很晚。\n女：那你要注意身体，别太累了。\n男：谢谢，我会的。\n问：男的最近在做什么？',
    correctAnswer: '准备考试（复习）',
    hint: '남자의 최근 상황을 묻는 대화예요. 구체적으로 무엇을 하고 있는지, 언제 시험인지 들어보세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 20,
  },
  {
    audioText:
      '男：听说你去年去了趟欧洲，怎么样？\n女：非常好！我去了法国、意大利和西班牙，每个地方都很漂亮，文化也很有意思。\n男：下次我也想去，你有什么建议吗？\n女：建议你提前三个月订机票，那样便宜很多。\n问：女的建议什么时候订机票？',
    correctAnswer: '提前三个月',
    hint: '여행 경험을 나누는 대화예요. 여자의 조언, 특히 항공권 예매 시기를 잘 들어보세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 21,
  },
  {
    audioText:
      '男：我想去办个信用卡，今天下午你有时间吗？陪我去一趟银行？\n女：下午三点之前我有事，三点以后可以。\n男：那我们三点半出发吧。\n问：他们什么时候去银行？',
    correctAnswer: '下午三点半',
    hint: '시간 약속을 정하는 대화예요. 여자의 가능한 시간과 최종 약속 시간을 구별해 들어보세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 22,
  },
  {
    audioText:
      '女：你平时喜欢看什么类型的电影？\n男：我比较喜欢看历史片，可以了解不同时代的文化和生活。你呢？\n女：我喜欢看喜剧，工作压力太大，需要轻松一下。\n问：女的为什么喜欢看喜剧？',
    correctAnswer: '工作压力大，需要放松',
    hint: '영화 취향을 나누는 대화예요. 남자와 여자가 각각 다른 이유를 말해요. 여자의 이유에 집중해 들어보세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 23,
  },
  {
    audioText:
      '男：这次招聘一共收到了多少份简历？\n女：大概三百份，但是符合条件的只有五十份左右。\n男：那我们先安排这五十个人来面试吧。\n女：好的，我这就发邮件通知他们。\n问：符合条件的简历有多少份？',
    correctAnswer: '五十份左右',
    hint: '채용 관련 업무 대화예요. 총 이력서 수와 조건에 맞는 이력서 수를 구별해 들어보세요.',
    difficulty: 'intermediate',
    audioUrl: '',
    order: 24,
  },

  // ═══════════════════════════════════════════════════
  // ADVANCED  (HSK 5-6)  — items 25-32
  // Complex monologues, news-style language, 成语.
  // Format mirrors HSK 5 Part 3 & HSK 6 Part 2-3.
  // ═══════════════════════════════════════════════════
  {
    audioText:
      '随着互联网的发展，越来越多的人选择在网上购物。网购不仅方便快捷，而且价格通常比实体店便宜。然而，网购也存在一些问题，比如商品质量难以保证，售后服务不到位等。因此，消费者在网购时应该选择信誉良好的商家，仔细阅读商品评价。\n问：关于网购，下面哪项说法正确？',
    correctAnswer: '网购有优点也有缺点，消费者要选择信誉好的商家',
    hint: '인터넷 쇼핑의 장단점을 설명하는 글이에요. "然而"(그러나) 뒤에 단점이 나와요. 전체 결론을 파악하세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 25,
  },
  {
    audioText:
      '女：您在这家公司工作了多久了？\n男：差不多二十年了。从一个普通员工做到现在的总经理，一路走来经历了很多。\n女：您觉得成功最重要的因素是什么？\n男：我认为是坚持。很多人遇到困难就放弃了，但只要坚持下去，就一定会看到希望。\n问：男的认为成功最重要的因素是什么？',
    correctAnswer: '坚持',
    hint: '성공 요인을 인터뷰하는 내용이에요. 남자가 경험에서 우러난 생각을 말해요. 핵심 단어를 찾아보세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 26,
  },
  {
    audioText:
      '近年来，城市化进程不断加快，越来越多的农村人口涌入城市寻求更好的发展机会。这一现象在带来劳动力的同时，也给城市基础设施和公共服务带来了巨大压力。如何合理引导人口流动，实现城乡协调发展，是当前政府面临的重要课题。\n问：这段话主要谈的是什么问题？',
    correctAnswer: '城市化进程中的人口流动问题',
    hint: '뉴스 스타일의 사회 문제 글이에요. 첫 문장에 주제가 나오는 경우가 많아요. "这一现象"이 무엇을 가리키는지 파악하세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 27,
  },
  {
    audioText:
      '男：最近公司业绩下滑，你有什么看法？\n女：我觉得主要原因是市场竞争加剧，我们的产品创新跟不上消费者需求的变化。要想扭转局面，必须加大研发投入，推出有竞争力的新产品。\n男：你的分析很到位。那在营销方面，你有什么具体建议？\n女：建议加强社交媒体营销，特别是针对年轻消费群体的内容营销。\n问：女的认为公司业绩下滑的主要原因是什么？',
    correctAnswer: '产品创新跟不上消费者需求变化（市场竞争加剧）',
    hint: '비즈니스 분석 대화예요. 여자가 실적 하락 원인을 분석하고 해결책을 제시해요. "主要原因是" 뒤를 집중해서 들어보세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 28,
  },
  {
    audioText:
      '他们去动物园了吗？不，他们没有去动物园。那天他们在森林里遇到了一只老虎，一位生物学家吓得晕了过去，另一位经济学家却一直在跑。动物学家醒来后问："你为什么一直跑？老虎比你跑得快多了。"经济学家说："我只需要跑得比你快就行了。"\n问：经济学家为什么一直在跑？',
    correctAnswer: '只需要跑得比生物学家快（不需要比老虎快）',
    hint: '짧은 유머 이야기예요. 경제학자의 논리가 핵심이에요. 왜 호랑이보다 빨리 뛸 필요가 없는지 생각해보세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 29,
  },
  {
    audioText:
      '研究表明，人类大脑在睡眠期间会对白天接收到的信息进行整理和巩固。这就是为什么学习之后充足的睡眠对记忆力至关重要。然而，现代社会中睡眠不足的问题日益严重，长期睡眠不足不仅影响记忆和认知功能，还会对身体健康造成严重危害。\n问：根据这段话，睡眠对人有什么重要作用？',
    correctAnswer: '帮助大脑整理信息、巩固记忆',
    hint: '과학 연구 내용을 설명하는 글이에요. "这就是为什么"(이것이 바로 ~한 이유다) 앞뒤가 핵심이에요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 30,
  },
  {
    audioText:
      '女：您如何看待当前人工智能对就业市场的影响？\n男：这是一把双刃剑。一方面，人工智能确实会取代一些重复性、机械性的工作；另一方面，它也会创造出新的职业和需求。历史上每一次技术革命都曾引发类似的担忧，但最终都带来了更多的就业机会。关键是我们要及时调整教育方向，培养适应未来社会的人才。\n问：男的对人工智能影响就业持什么态度？',
    correctAnswer: '辩证看待（既有负面影响也有正面影响，关键是教育调整）',
    hint: '"双刃剑"(양날의 검)는 양면성을 뜻해요. 남자가 AI에 대해 부정도 긍정도 아닌 어떤 입장을 취하는지 파악하세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 31,
  },
  {
    audioText:
      '平遥摄影节是中国最具影响力的国际摄影节之一，每年秋天在山西省平遥古城举办。摄影节汇聚了来自世界各地的摄影师，展出涵盖新闻、人文、自然等多个题材的作品。平遥古城本身作为世界文化遗产，其古朴的街道和建筑为摄影节提供了独特的背景。\n问：平遥摄影节通常在什么季节举办？',
    correctAnswer: '秋天',
    hint: '평요 사진 페스티벌에 대한 설명이에요. 개최 시기, 장소, 특징을 차례로 들어보세요. 계절 표현을 주의해서 듣세요.',
    difficulty: 'advanced',
    audioUrl: '',
    order: 32,
  },
];
