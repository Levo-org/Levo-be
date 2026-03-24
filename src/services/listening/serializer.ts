import type { IListening } from '@/models/Listening';

export interface ListeningPracticeDto {
  _id: string;
  question: string;
  options: string[];
  ttsText: string;
  difficulty: string;
  audioUrl: null;
}

export function serializeListeningPractice(
  listening: Pick<IListening, '_id' | 'audioText' | 'correctAnswer' | 'difficulty'>,
  distractors: string[],
): ListeningPracticeDto {
  const set = new Set<string>();
  set.add(listening.correctAnswer);
  for (const item of distractors) {
    if (item && item.trim().length > 0) {
      set.add(item.trim());
    }
  }

  return {
    _id: listening._id.toString(),
    question: 'Choose what you heard.',
    options: Array.from(set),
    ttsText: listening.audioText,
    difficulty: listening.difficulty,
    audioUrl: null,
  };
}
