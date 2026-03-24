interface ReadingQuizInput {
  question: string;
  options: string[];
  correctAnswer?: number | string;
}

interface ReadingInput {
  _id: string;
  title: string;
  content: string;
  translation?: string;
  difficulty: 'beginner' | 'elementary' | 'intermediate' | 'advanced';
  quizzes: ReadingQuizInput[];
}

interface ReadingQuestionOutput {
  question: string;
  options: string[];
  correctIndex?: number;
}

interface ReadingOutput {
  _id: string;
  title: string;
  text: string;
  translation: string;
  difficulty: 'beginner' | 'elementary' | 'intermediate' | 'advanced';
  questions: ReadingQuestionOutput[];
}

interface ListeningInput {
  _id: string;
  audioText: string;
  correctAnswer: string;
  hint?: string;
  difficulty: 'beginner' | 'elementary' | 'intermediate' | 'advanced';
}

interface ListeningOutput {
  _id: string;
  question: string;
  options: string[];
  ttsText: string;
  difficulty: 'beginner' | 'elementary' | 'intermediate' | 'advanced';
  audioUrl: null;
}

interface ConversationDialogInput {
  speaker: string;
  text: string;
  translation: string;
  isUserRole: boolean;
}

interface ConversationExpressionInput {
  expression: string;
  meaning: string;
}

interface ConversationInput {
  _id: string;
  emoji: string;
  title: string;
  level: 'beginner' | 'elementary' | 'intermediate' | 'advanced';
  dialogs: ConversationDialogInput[];
  keyExpressions: ConversationExpressionInput[];
}

interface ConversationDialogOutput {
  speaker: string;
  text: string;
  translation: string;
  isUserRole: boolean;
  isUser: boolean;
}

interface ConversationOutput {
  _id: string;
  emoji: string;
  title: string;
  level: 'beginner' | 'elementary' | 'intermediate' | 'advanced';
  description: string;
  dialogs: ConversationDialogOutput[];
  dialog: ConversationDialogOutput[];
  keyExpressions: ConversationExpressionInput[];
}

export function serializeReadingForPractice(reading: ReadingInput): ReadingOutput {
  const questions = reading.quizzes.map<ReadingQuestionOutput>((quiz) => {
    if (typeof quiz.correctAnswer === 'number') {
      return {
        question: quiz.question,
        options: quiz.options,
        correctIndex: quiz.correctAnswer,
      };
    }

    return {
      question: quiz.question,
      options: quiz.options,
    };
  });

  return {
    _id: reading._id,
    title: reading.title,
    text: reading.content,
    translation: reading.translation ?? '',
    difficulty: reading.difficulty,
    questions,
  };
}

export function serializeListeningForPractice(
  listening: ListeningInput,
  distractorOptions: string[] = [],
): ListeningOutput {
  const optionSet = new Set<string>();
  optionSet.add(listening.correctAnswer);
  for (const option of distractorOptions) {
    if (option.trim().length > 0) {
      optionSet.add(option);
    }
  }

  return {
    _id: listening._id,
    question: 'Choose what you heard.',
    options: Array.from(optionSet),
    ttsText: listening.audioText,
    difficulty: listening.difficulty,
    audioUrl: null,
  };
}

export function serializeConversationDetail(conversation: ConversationInput): ConversationOutput {
  const dialogs = conversation.dialogs.map<ConversationDialogOutput>((dialog) => ({
    speaker: dialog.speaker,
    text: dialog.text,
    translation: dialog.translation,
    isUserRole: dialog.isUserRole,
    isUser: dialog.isUserRole,
  }));

  return {
    _id: conversation._id,
    emoji: conversation.emoji,
    title: conversation.title,
    level: conversation.level,
    description: '',
    dialogs,
    dialog: dialogs,
    keyExpressions: conversation.keyExpressions,
  };
}
