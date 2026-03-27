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

  const normalizedAudioText = (listening.audioText || '').trim();
  const fallbackSpeechText = (listening.correctAnswer || '').trim();

  return {
    _id: listening._id.toString(),
    question: 'Choose what you heard.',
    options: Array.from(set),
    ttsText: normalizedAudioText || fallbackSpeechText,
    difficulty: listening.difficulty,
    audioUrl: null,
  };
}
