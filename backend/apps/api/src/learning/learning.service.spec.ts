import { LearningItemType } from '@prisma/client';
import { LearningService } from './learning.service';

describe('LearningService pronunciation evaluation', () => {
  const service = new LearningService({} as never, {} as never);
  const serviceAccess = service as never as {
    evaluateAnswer: Function;
    buildEnglishWordSummaries: Function;
    buildTaskOverview: Function;
  };

  test('returns encouraging feedback for a strong pronunciation self-rating', () => {
    const result = serviceAccess.evaluateAnswer(
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
    const result = serviceAccess.evaluateAnswer(
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
    const result = serviceAccess.evaluateAnswer(
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

  test('buildEnglishWordSummaries groups mastered and review information by word', () => {
    const result = serviceAccess.buildEnglishWordSummaries([
      {
        wordId: 'word-1',
        itemType: LearningItemType.WORD_MEANING,
        promptJson: {
          word: 'apple',
          phonetic: '/ˈæp.əl/',
        },
        correctAnswerJson: {
          selected: '苹果',
        },
        resultJson: {
          isCorrect: true,
        },
      },
      {
        wordId: 'word-1',
        itemType: LearningItemType.WORD_SPELLING,
        promptJson: {
          meaningZh: '苹果',
          phonetic: '/ˈæp.əl/',
        },
        correctAnswerJson: {
          text: 'apple',
        },
        resultJson: {
          isCorrect: true,
        },
      },
      {
        wordId: 'word-1',
        itemType: LearningItemType.WORD_PRONUNCIATION,
        promptJson: {
          word: 'apple',
          phonetic: '/ˈæp.əl/',
        },
        correctAnswerJson: {
          completed: true,
        },
        resultJson: {
          isCorrect: false,
        },
      },
    ]);

    expect(result).toEqual([
      {
        word: 'apple',
        meaningZh: '苹果',
        phonetic: '/ˈæp.əl/',
        incorrectItems: ['WORD_PRONUNCIATION'],
      },
    ]);
  });

  test('buildTaskOverview summarizes english word task content', () => {
    const result = serviceAccess.buildTaskOverview(
      'today english practice',
      {
        mode: 'word_learning',
        dueWords: 2,
        newWords: 1,
        coachHint: 'review due words first, then unlock new ones',
      },
    );

    expect(result).toEqual({
      summary: 'today english practice',
      focusSummary: 'review 2 due words and add 1 new words',
      coachHint: 'review due words first, then unlock new ones',
    });
  });
});
