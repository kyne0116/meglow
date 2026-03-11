import { Injectable, NotFoundException } from '@nestjs/common';
import { EnglishWord, K12Stage } from '@prisma/client';
import { PrismaService } from '../persistence/prisma/prisma.service';

const ENGLISH_WORD_SEEDS: Array<{
  value: string;
  phonetic: string;
  meaningZh: string;
  exampleSentence: string;
  imageHint: string;
  difficultyLevel: number;
  k12Stage: K12Stage;
}> = [
  { value: 'apple', phonetic: '/ˈæp.əl/', meaningZh: '苹果', exampleSentence: 'I eat an apple after school.', imageHint: 'a red apple in a lunch box', difficultyLevel: 1, k12Stage: K12Stage.LOWER_PRIMARY },
  { value: 'banana', phonetic: '/bəˈnæn.ə/', meaningZh: '香蕉', exampleSentence: 'The monkey likes a banana.', imageHint: 'a yellow banana on a desk', difficultyLevel: 1, k12Stage: K12Stage.LOWER_PRIMARY },
  { value: 'animal', phonetic: '/ˈæn.ɪ.məl/', meaningZh: '动物', exampleSentence: 'The panda is a cute animal.', imageHint: 'different animals in a park', difficultyLevel: 1, k12Stage: K12Stage.LOWER_PRIMARY },
  { value: 'teacher', phonetic: '/ˈtiː.tʃər/', meaningZh: '老师', exampleSentence: 'Our teacher smiles in class.', imageHint: 'a teacher writing on a board', difficultyLevel: 1, k12Stage: K12Stage.LOWER_PRIMARY },
  { value: 'library', phonetic: '/ˈlaɪ.brer.i/', meaningZh: '图书馆', exampleSentence: 'We read quietly in the library.', imageHint: 'children reading in a library', difficultyLevel: 2, k12Stage: K12Stage.MIDDLE_PRIMARY },
  { value: 'homework', phonetic: '/ˈhəʊm.wɜːk/', meaningZh: '家庭作业', exampleSentence: 'I finish my homework before dinner.', imageHint: 'a workbook and a pencil', difficultyLevel: 2, k12Stage: K12Stage.MIDDLE_PRIMARY },
  { value: 'journey', phonetic: '/ˈdʒɜː.ni/', meaningZh: '旅程', exampleSentence: 'The train journey is exciting.', imageHint: 'a family on a train trip', difficultyLevel: 2, k12Stage: K12Stage.MIDDLE_PRIMARY },
  { value: 'festival', phonetic: '/ˈfes.tɪ.vəl/', meaningZh: '节日', exampleSentence: 'The school holds a spring festival.', imageHint: 'children at a school festival', difficultyLevel: 2, k12Stage: K12Stage.MIDDLE_PRIMARY },
  { value: 'science', phonetic: '/ˈsaɪ.əns/', meaningZh: '科学', exampleSentence: 'Science helps us understand the world.', imageHint: 'a classroom science experiment', difficultyLevel: 3, k12Stage: K12Stage.UPPER_PRIMARY },
  { value: 'protect', phonetic: '/prəˈtekt/', meaningZh: '保护', exampleSentence: 'We should protect the earth together.', imageHint: 'children protecting trees', difficultyLevel: 3, k12Stage: K12Stage.UPPER_PRIMARY },
  { value: 'culture', phonetic: '/ˈkʌl.tʃər/', meaningZh: '文化', exampleSentence: 'Food is part of local culture.', imageHint: 'traditional food and clothes', difficultyLevel: 3, k12Stage: K12Stage.UPPER_PRIMARY },
  { value: 'invent', phonetic: '/ɪnˈvent/', meaningZh: '发明', exampleSentence: 'People invent tools to solve problems.', imageHint: 'a child building a simple robot', difficultyLevel: 3, k12Stage: K12Stage.UPPER_PRIMARY },
  { value: 'challenge', phonetic: '/ˈtʃæl.ɪndʒ/', meaningZh: '挑战', exampleSentence: 'Learning English is a fun challenge.', imageHint: 'a student climbing steps', difficultyLevel: 4, k12Stage: K12Stage.JUNIOR_HIGH },
  { value: 'achieve', phonetic: '/əˈtʃiːv/', meaningZh: '实现', exampleSentence: 'Practice helps us achieve our goals.', imageHint: 'a trophy and study plan', difficultyLevel: 4, k12Stage: K12Stage.JUNIOR_HIGH },
  { value: 'confident', phonetic: '/ˈkɒn.fɪ.dənt/', meaningZh: '自信的', exampleSentence: 'She feels confident when speaking English.', imageHint: 'a student giving a speech', difficultyLevel: 4, k12Stage: K12Stage.JUNIOR_HIGH },
  { value: 'discover', phonetic: '/dɪˈskʌv.ər/', meaningZh: '发现', exampleSentence: 'Scientists discover new ideas every day.', imageHint: 'a student looking through a telescope', difficultyLevel: 4, k12Stage: K12Stage.JUNIOR_HIGH },
];

export interface EnglishWordRecord {
  id: string;
  value: string;
  phonetic: string | null;
  meaningZh: string;
  exampleSentence: string | null;
  imageHint: string | null;
  difficultyLevel: number;
  k12Stage: 'LOWER_PRIMARY' | 'MIDDLE_PRIMARY' | 'UPPER_PRIMARY' | 'JUNIOR_HIGH';
}

export interface RecommendedWord extends EnglishWordRecord {
  kind: 'NEW' | 'REVIEW';
}

@Injectable()
export class ContentService {
  constructor(private readonly prismaService: PrismaService) {}

  async listEnglishWords(filters?: { k12Stage?: K12Stage; keyword?: string; limit?: number }): Promise<EnglishWordRecord[]> {
    await this.ensureEnglishWordSeeds();
    const words = await this.prismaService.englishWord.findMany({
      where: {
        ...(filters?.k12Stage ? { k12Stage: filters.k12Stage } : {}),
        ...(filters?.keyword
          ? { OR: [{ value: { contains: filters.keyword, mode: 'insensitive' } }, { meaningZh: { contains: filters.keyword, mode: 'insensitive' } }] }
          : {}),
      },
      orderBy: [{ k12Stage: 'asc' }, { difficultyLevel: 'asc' }, { value: 'asc' }],
      take: filters?.limit ?? 20,
    });
    return words.map((word) => this.toWordRecord(word));
  }

  async getEnglishWord(wordId: string): Promise<EnglishWordRecord> {
    await this.ensureEnglishWordSeeds();
    const word = await this.prismaService.englishWord.findUnique({ where: { id: wordId } });
    if (!word) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'word not found', details: {} });
    }
    return this.toWordRecord(word);
  }

  async ensureEnglishWordSeeds(): Promise<void> {
    const existingWords = await this.prismaService.englishWord.findMany({ select: { value: true, k12Stage: true } });
    const existingKeys = new Set(existingWords.map((word) => `${word.value}:${word.k12Stage}`));
    const missingWords = ENGLISH_WORD_SEEDS.filter((word) => !existingKeys.has(`${word.value}:${word.k12Stage}`));
    if (missingWords.length === 0) {
      return;
    }
    await this.prismaService.englishWord.createMany({ data: missingWords });
  }

  async recommendWordsForChild(childId: string, targetCount: number): Promise<RecommendedWord[]> {
    await this.ensureEnglishWordSeeds();
    const child = await this.prismaService.child.findUnique({ where: { id: childId }, select: { id: true, k12Stage: true } });
    if (!child) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'child not found', details: {} });
    }

    const wordCount = Math.max(1, targetCount);
    const dueProgresses = await this.prismaService.childWordProgress.findMany({
      where: { childId, OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: new Date() } }] },
      include: { word: true },
      orderBy: [{ nextReviewAt: 'asc' }, { updatedAt: 'asc' }],
      take: wordCount,
    });

    const recommendedWords: RecommendedWord[] = dueProgresses.map((progress) => ({ ...this.toWordRecord(progress.word), kind: 'REVIEW' }));
    const selectedWordIds = new Set(recommendedWords.map((word) => word.id));

    const primaryCandidates = await this.prismaService.englishWord.findMany({
      where: {
        k12Stage: child.k12Stage,
        id: { notIn: Array.from(selectedWordIds) },
        wordProgresses: { none: { childId } },
      },
      orderBy: [{ difficultyLevel: 'asc' }, { value: 'asc' }],
      take: wordCount,
    });

    for (const word of primaryCandidates) {
      if (recommendedWords.length >= wordCount) {
        break;
      }
      selectedWordIds.add(word.id);
      recommendedWords.push({ ...this.toWordRecord(word), kind: 'NEW' });
    }

    if (recommendedWords.length < wordCount) {
      const fallbackCandidates = await this.prismaService.englishWord.findMany({
        where: {
          id: { notIn: Array.from(selectedWordIds) },
          wordProgresses: { none: { childId } },
        },
        orderBy: [{ difficultyLevel: 'asc' }, { value: 'asc' }],
        take: wordCount - recommendedWords.length,
      });

      for (const word of fallbackCandidates) {
        recommendedWords.push({ ...this.toWordRecord(word), kind: 'NEW' });
      }
    }

    return recommendedWords.slice(0, wordCount);
  }

  async resolveTaskWords(childId: string, references: Array<{ id?: string; value?: string }> | undefined, fallbackCount: number): Promise<RecommendedWord[]> {
    await this.ensureEnglishWordSeeds();
    if (!references || references.length === 0) {
      return this.recommendWordsForChild(childId, fallbackCount);
    }

    const ids = references.map((reference) => reference.id).filter((value): value is string => Boolean(value));
    const values = references.map((reference) => reference.value?.trim()).filter((value): value is string => Boolean(value));
    const words = await this.prismaService.englishWord.findMany({
      where: {
        OR: [
          ...(ids.length > 0 ? [{ id: { in: ids } }] : []),
          ...(values.length > 0 ? [{ value: { in: values } }] : []),
        ],
      },
      orderBy: [{ difficultyLevel: 'asc' }, { value: 'asc' }],
    });

    const wordsByKey = new Map<string, EnglishWord>();
    for (const word of words) {
      wordsByKey.set(word.id, word);
      wordsByKey.set(word.value.toLowerCase(), word);
    }

    const resolvedWords: RecommendedWord[] = [];
    const selectedWordIds = new Set<string>();
    for (const reference of references) {
      const key = reference.id ?? reference.value?.toLowerCase() ?? '';
      const word = wordsByKey.get(key);
      if (!word || selectedWordIds.has(word.id)) {
        continue;
      }
      selectedWordIds.add(word.id);
      resolvedWords.push({ ...this.toWordRecord(word), kind: 'NEW' });
    }

    return resolvedWords.length > 0 ? resolvedWords : this.recommendWordsForChild(childId, fallbackCount);
  }

  async getMeaningOptions(wordId: string, k12Stage: K12Stage): Promise<string[]> {
    await this.ensureEnglishWordSeeds();
    const targetWord = await this.prismaService.englishWord.findUnique({ where: { id: wordId }, select: { meaningZh: true } });
    if (!targetWord) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'word not found', details: {} });
    }

    const distractors = await this.prismaService.englishWord.findMany({
      where: { k12Stage, id: { not: wordId } },
      select: { meaningZh: true },
      orderBy: { value: 'asc' },
      take: 6,
    });

    const options = [targetWord.meaningZh];
    const uniqueMeanings = new Set(options);
    for (const distractor of distractors) {
      if (uniqueMeanings.has(distractor.meaningZh)) {
        continue;
      }
      uniqueMeanings.add(distractor.meaningZh);
      options.push(distractor.meaningZh);
      if (options.length === 4) {
        break;
      }
    }

    return options.sort((left, right) => left.localeCompare(right, 'zh-CN'));
  }

  private toWordRecord(word: EnglishWord): EnglishWordRecord {
    return {
      id: word.id,
      value: word.value,
      phonetic: word.phonetic,
      meaningZh: word.meaningZh,
      exampleSentence: word.exampleSentence,
      imageHint: word.imageHint,
      difficultyLevel: word.difficultyLevel,
      k12Stage: word.k12Stage,
    };
  }
}
