import { LearningItemType } from '@prisma/client';
import { LearningService } from './learning.service';

describe('LearningService pronunciation evaluation', () => {
  const service = new LearningService({} as never, {} as never);

  test('returns encouraging feedback for a strong pronunciation self-rating', () => {
    const result = (service as never as { evaluateAnswer: Function }).evaluateAnswer(
      {
        itemType: LearningItemType.WORD_PRONUNCIATION,
        correctAnswerJson: {},
        promptJson: {},
      },
      {
        completed: true,
        selfRating: 'GOOD',
      },
    );

    expect(result).toEqual({
      isCorrect: true,
      score: 100,
      feedback: 'pronunciation felt smooth and clear',
      guidance: 'keep the pace steady and move to the next word',
      encouragement: 'excellent speaking practice',
    });
  });

  test('returns practice guidance for a weak pronunciation self-rating', () => {
    const result = (service as never as { evaluateAnswer: Function }).evaluateAnswer(
      {
        itemType: LearningItemType.WORD_PRONUNCIATION,
        correctAnswerJson: {},
        promptJson: {},
      },
      {
        completed: true,
        selfRating: 'NEEDS_PRACTICE',
      },
    );

    expect(result).toEqual({
      isCorrect: false,
      score: 60,
      feedback: 'the word still needs another careful read',
      guidance: 'slow down, follow the phonetic hint, and read it aloud again',
      encouragement: 'one more round will make it smoother',
    });
  });

  test('keeps backward compatibility for legacy pronunciation submissions', () => {
    const result = (service as never as { evaluateAnswer: Function }).evaluateAnswer(
      {
        itemType: LearningItemType.WORD_PRONUNCIATION,
        correctAnswerJson: {},
        promptJson: {},
      },
      {
        completed: true,
      },
    );

    expect(result).toEqual({
      isCorrect: true,
      score: 100,
      feedback: 'pronunciation practice completed',
      guidance: 'continue to the next word after reading clearly',
      encouragement: 'good speaking practice',
    });
  });
});
