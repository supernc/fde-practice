import { AnswerRecord, ExamRecord, Question } from '../types';
import { saveExamRecord } from './storage';
import { getExamQuestions } from './questionService';
import { EXAM_PASS_SCORE, EXAM_POINTS } from '../data/exam';

// 生成一份模拟试卷
export function generateExam(): Question[] {
  return getExamQuestions();
}

// 计算考试得分
export function calculateScore(
  questions: Question[],
  answers: Record<string, string[]>
): {
  score: number;
  correctCount: number;
  chapterScores: Record<number, { correct: number; total: number }>;
} {
  let correctCount = 0;
  let totalScore = 0;
  const chapterScores: Record<number, { correct: number; total: number }> = {};

  for (const q of questions) {
    if (!chapterScores[q.chapter]) {
      chapterScores[q.chapter] = { correct: 0, total: 0 };
    }
    chapterScores[q.chapter].total += 1;

    const userAnswer = answers[q.id] || [];
    const correctAnswer = q.answer;

    if (isAnswerCorrect(userAnswer, correctAnswer, q.type)) {
      correctCount += 1;
      totalScore += EXAM_POINTS[q.type];
      chapterScores[q.chapter].correct += 1;
    }
  }

  return {
    score: Math.round(totalScore * 10) / 10,
    correctCount,
    chapterScores,
  };
}

// 判断答案是否完全正确
export function isAnswerCorrect(
  userAnswer: string[],
  correctAnswer: string[],
  type: 'single' | 'multiple'
): boolean {
  if (type === 'single') {
    return userAnswer.length === 1 && userAnswer[0] === correctAnswer[0];
  }
  // 多选题：完全一致才算对
  if (userAnswer.length !== correctAnswer.length) return false;
  const sortedUser = [...userAnswer].sort();
  const sortedCorrect = [...correctAnswer].sort();
  return sortedUser.every((val, idx) => val === sortedCorrect[idx]);
}

// 提交考试并保存记录
export function submitExam(
  questions: Question[],
  answers: Record<string, string[]>,
  startTime: number
): ExamRecord {
  const endTime = Date.now();
  const { score, correctCount, chapterScores } = calculateScore(questions, answers);

  const record: ExamRecord = {
    id: `exam-${startTime}`,
    startTime,
    endTime,
    score,
    passed: score >= EXAM_PASS_SCORE,
    totalQuestions: questions.length,
    correctCount,
    answers,
    chapterScores,
  };

  const attempted: AnswerRecord[] = questions.filter(q => answers[q.id]?.length).map(q => ({
    questionId: q.id,
    userAnswer: answers[q.id],
    isCorrect: isAnswerCorrect(answers[q.id], q.answer, q.type),
    timestamp: endTime,
    mode: 'exam',
  }));
  saveExamRecord(record, attempted);
  return record;
}

const examService = {
  generateExam,
  calculateScore,
  isAnswerCorrect,
  submitExam,
};

export default examService;
