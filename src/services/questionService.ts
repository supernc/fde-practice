import { Question } from '../types';
import { getAllQuestions } from '../data';
import { getExamHistory } from './storage';
import { EXAM_DISTRIBUTION } from '../data/exam';

// 按章节获取题目
export function getQuestionsByChapter(chapter: number): Question[] {
  return getAllQuestions().filter(q => q.chapter === chapter);
}

// 按子章节获取题目
export function getQuestionsBySubChapter(subChapter: string): Question[] {
  return getAllQuestions().filter(q => q.subChapter === subChapter);
}

// 按题型获取题目
export function getQuestionsByType(type: 'single' | 'multiple'): Question[] {
  return getAllQuestions().filter(q => q.type === type);
}

// Fisher-Yates 洗牌算法
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 随机抽题（可指定数量和题型）
export function getRandomQuestions(
  count: number,
  type?: 'single' | 'multiple' | 'mixed',
  excludeIds?: Set<string>
): Question[] {
  let pool = getAllQuestions();

  if (type === 'single') {
    pool = pool.filter(q => q.type === 'single');
  } else if (type === 'multiple') {
    pool = pool.filter(q => q.type === 'multiple');
  }

  if (excludeIds && excludeIds.size > 0) {
    pool = pool.filter(q => !excludeIds.has(q.id));
  }

  const shuffled = shuffleArray(pool);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// 计算指定来源 + 题型下可抽取的题目总数（用于「全部」选项）
export function getAvailableCount(
  ids: string[] | null,
  type?: 'single' | 'multiple' | 'mixed'
): number {
  let pool = ids ? getQuestionsByIds(ids) : getAllQuestions();

  if (type === 'single') {
    pool = pool.filter(q => q.type === 'single');
  } else if (type === 'multiple') {
    pool = pool.filter(q => q.type === 'multiple');
  }

  return pool.length;
}

// 从指定 ID 集合中随机抽题（用于错题/收藏随机练习）
export function getRandomQuestionsFromIds(
  ids: string[],
  count: number,
  type?: 'single' | 'multiple' | 'mixed'
): Question[] {
  let pool = getQuestionsByIds(ids);

  if (type === 'single') {
    pool = pool.filter(q => q.type === 'single');
  } else if (type === 'multiple') {
    pool = pool.filter(q => q.type === 'multiple');
  }

  const shuffled = shuffleArray(pool);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// 按考试大纲比例抽题（模拟考试用）
export function getExamQuestions(): Question[] {
  const all = getAllQuestions().filter(q => !q.tags.includes('综合辨析'));
  const history = getExamHistory();
  const last = history[history.length - 1];
  const previous = new Set(last?.questionIds ?? Object.keys(last?.answers ?? {}));
  const examQuestions = EXAM_DISTRIBUTION.flatMap(([single, multiple], index) => {
    const pool = shuffleArray(all.filter(q => q.chapter === index + 1));
    const chosen: Question[] = [];
    const coverage = new Map<string, number>();
    const scenes = new Set<string>();
    // Select the scarcer multiple-choice items first, then balance lesson coverage.
    for (const [type, quota] of [['multiple', multiple], ['single', single]] as const) {
      for (let n = 0; n < quota; n++) {
        const sceneKey = (q: Question) => q.id.replace(/-(action|evidence)$/, '-scene');
        const rank = (q: Question) => Number(previous.has(q.id)) * 100 + (coverage.get(q.subChapter) ?? 0);
        const available = pool.filter(q => q.type === type && !scenes.has(sceneKey(q)));
        const pick = available.sort((a,b) => rank(a)-rank(b))[0];
        if (!pick) throw new Error('本章可用题数不足');
        chosen.push(pick);
        scenes.add(sceneKey(pick));
        coverage.set(pick.subChapter, (coverage.get(pick.subChapter) ?? 0) + 1);
      }
    }
    return chosen;
  });

  // 最终打乱顺序，但保持单选在前、多选在后
  const finalSingles = shuffleArray(examQuestions.filter(q => q.type === 'single'));
  const finalMultiples = shuffleArray(examQuestions.filter(q => q.type === 'multiple'));

  return [...finalSingles, ...finalMultiples];
}

// 根据 ID 获取题目
export function getQuestionById(id: string): Question | undefined {
  return getAllQuestions().find(q => q.id === id);
}

// 根据 ID 列表获取题目
export function getQuestionsByIds(ids: string[]): Question[] {
  const idSet = new Set(ids);
  return getAllQuestions().filter(q => idSet.has(q.id));
}

// 获取题库总数
export function getTotalCount(): number {
  return getAllQuestions().length;
}

// 获取各章节题目数
export function getChapterCounts(): Record<number, number> {
  const counts: Record<number, number> = {};
  getAllQuestions().forEach(q => {
    counts[q.chapter] = (counts[q.chapter] || 0) + 1;
  });
  return counts;
}

const questionService = {
  getQuestionsByChapter,
  getQuestionsBySubChapter,
  getQuestionsByType,
  getRandomQuestions,
  getRandomQuestionsFromIds,
  getAvailableCount,
  getExamQuestions,
  getQuestionById,
  getQuestionsByIds,
  getTotalCount,
  getChapterCounts,
};

export default questionService;
