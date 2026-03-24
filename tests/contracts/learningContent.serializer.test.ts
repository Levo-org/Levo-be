import {
  serializeReadingForPractice,
  serializeListeningForPractice,
  serializeConversationDetail,
} from '@/serializers/learningContent.serializer';

describe('learningContent.serializer contract', () => {
  it('maps reading content/quizzes to FE-friendly text/questions shape', () => {
    const reading = serializeReadingForPractice({
      _id: 'reading-1',
      title: 'Morning Routine',
      content: 'I wake up early.',
      translation: '나는 일찍 일어난다.',
      difficulty: 'beginner',
      quizzes: [
        {
          question: 'When does the speaker wake up?',
          options: ['Late', 'Early'],
          correctAnswer: 1,
        },
      ],
    });

    expect(reading).toEqual({
      _id: 'reading-1',
      title: 'Morning Routine',
      text: 'I wake up early.',
      translation: '나는 일찍 일어난다.',
      difficulty: 'beginner',
      questions: [
        {
          question: 'When does the speaker wake up?',
          options: ['Late', 'Early'],
          correctIndex: 1,
        },
      ],
    });
  });

  it('maps listening to question/options/ttsText shape with deterministic answer inclusion', () => {
    const listening = serializeListeningForPractice(
      {
        _id: 'listening-1',
        audioText: 'I like apples.',
        correctAnswer: 'I like apples.',
        hint: 'fruit',
        difficulty: 'beginner',
      },
      ['I love bananas.', 'I drink water.', 'I like apples.'],
    );

    expect(listening).toEqual({
      _id: 'listening-1',
      question: 'Choose what you heard.',
      options: ['I like apples.', 'I love bananas.', 'I drink water.'],
      ttsText: 'I like apples.',
      difficulty: 'beginner',
      audioUrl: null,
    });
  });

  it('maps conversation detail to dialogs + compatibility alias fields', () => {
    const conversation = serializeConversationDetail({
      _id: 'conversation-1',
      emoji: '💬',
      title: 'At the cafe',
      level: 'elementary',
      dialogs: [
        {
          speaker: 'A',
          text: 'Can I get a coffee?',
          translation: '커피 한 잔 주세요?',
          isUserRole: true,
        },
      ],
      keyExpressions: [
        {
          expression: 'Can I get ...?',
          meaning: '...을(를) 주세요?',
        },
      ],
    });

    expect(conversation).toEqual({
      _id: 'conversation-1',
      emoji: '💬',
      title: 'At the cafe',
      level: 'elementary',
      description: '',
      dialogs: [
        {
          speaker: 'A',
          text: 'Can I get a coffee?',
          translation: '커피 한 잔 주세요?',
          isUserRole: true,
          isUser: true,
        },
      ],
      dialog: [
        {
          speaker: 'A',
          text: 'Can I get a coffee?',
          translation: '커피 한 잔 주세요?',
          isUserRole: true,
          isUser: true,
        },
      ],
      keyExpressions: [
        {
          expression: 'Can I get ...?',
          meaning: '...을(를) 주세요?',
        },
      ],
    });
  });
});
