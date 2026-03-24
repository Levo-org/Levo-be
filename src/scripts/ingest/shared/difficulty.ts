import { LEVELS } from '@/utils/constants';

type Level = (typeof LEVELS)[number];

interface RankedCandidate<T> {
  item: T;
  score: number;
}

export function scoreEnglishLemma(lemma: string, frequency?: number): number {
  const cleaned = lemma.trim().toLowerCase();
  const lengthPenalty = Math.max(0, cleaned.length - 4) * 0.4;
  const frequencyBoost = typeof frequency === 'number' && frequency > 0 ? Math.log10(frequency) : 0;

  return frequencyBoost - lengthPenalty;
}

export function assignQuartileLevels<T>(candidates: RankedCandidate<T>[]): Array<{ item: T; level: Level }> {
  if (candidates.length === 0) {
    return [];
  }

  const sorted = [...candidates].sort((a, b) => b.score - a.score);

  return sorted.map(({ item }, index) => {
    const ratio = (index + 1) / sorted.length;

    if (ratio <= 0.25) {
      return { item, level: 'beginner' };
    }
    if (ratio <= 0.5) {
      return { item, level: 'elementary' };
    }
    if (ratio <= 0.75) {
      return { item, level: 'intermediate' };
    }

    return { item, level: 'advanced' };
  });
}
