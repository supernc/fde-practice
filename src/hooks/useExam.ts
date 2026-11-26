import { useState, useCallback, useRef } from 'react';
import { ExamRecord, ExamState } from '../types';
import { generateExam, submitExam } from '../services/examService';
import { EXAM_QUESTION_COUNT } from '../data/exam';

const EXAM_STATE_KEY = 'fde-exam-state';
const idleState = (): ExamState => ({
    status: 'idle',
    questions: [],
    currentIndex: 0,
    answers: {},
    markedQuestions: new Set(),
    startTime: null,
  });

function restoreExam(): ExamState {
  try {
    const saved = sessionStorage.getItem(EXAM_STATE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.status === 'ongoing' && Array.isArray(parsed.questions) && parsed.questions.length === EXAM_QUESTION_COUNT &&
          Number.isFinite(parsed.startTime) && Number.isInteger(parsed.currentIndex) &&
          parsed.currentIndex >= 0 && parsed.currentIndex < parsed.questions.length && parsed.answers && Array.isArray(parsed.markedQuestions)) {
        return { ...parsed, markedQuestions: new Set(parsed.markedQuestions) };
      }
    }
  } catch {
    // An unusable session does not prevent starting a new exam.
  }
  return idleState();
}

export default function useExam() {
  const [state, setState] = useState(restoreExam);
  const [examResult, setExamResult] = useState<ExamRecord | null>(null);
  const submitted = useRef(false);

  // 保存考试状态到 sessionStorage
  const saveState = useCallback((newState: ExamState) => {
    const toSave = {
      ...newState,
      markedQuestions: Array.from(newState.markedQuestions),
    };
    sessionStorage.setItem(EXAM_STATE_KEY, JSON.stringify(toSave));
  }, []);

  // 开始考试
  const startExam = useCallback(() => {
    const questions = generateExam();
    const newState: ExamState = {
      status: 'ongoing',
      questions,
      currentIndex: 0,
      answers: {},
      markedQuestions: new Set(),
      startTime: Date.now(),
    };
    submitted.current = false;
    setState(newState);
    saveState(newState);
    setExamResult(null);
  }, [saveState]);

  // 作答
  const answerQuestion = useCallback((questionId: string, answer: string[]) => {
    setState(prev => {
      const newState = {
        ...prev,
        answers: { ...prev.answers, [questionId]: answer },
      };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  // 标记题目
  const toggleMark = useCallback(() => {
    setState(prev => {
      const newMarked = new Set(prev.markedQuestions);
      if (newMarked.has(prev.currentIndex)) {
        newMarked.delete(prev.currentIndex);
      } else {
        newMarked.add(prev.currentIndex);
      }
      const newState = { ...prev, markedQuestions: newMarked };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  // 导航
  const goToQuestion = useCallback((index: number) => {
    setState(prev => {
      const newState = { ...prev, currentIndex: index };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  const goNext = useCallback(() => {
    setState(prev => {
      if (prev.currentIndex >= prev.questions.length - 1) return prev;
      const newState = { ...prev, currentIndex: prev.currentIndex + 1 };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  const goPrev = useCallback(() => {
    setState(prev => {
      if (prev.currentIndex <= 0) return prev;
      const newState = { ...prev, currentIndex: prev.currentIndex - 1 };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  // 交卷
  const submitExamAction = useCallback(() => {
    if (!state.startTime || state.status !== 'ongoing' || submitted.current) return;
    const record = submitExam(state.questions, state.answers, state.startTime);
    submitted.current = true;
    setExamResult(record);

    setState(prev => ({ ...prev, status: 'submitted' }));
    sessionStorage.removeItem(EXAM_STATE_KEY);
  }, [state]);

  // 重新考试
  const retryExam = useCallback(() => {
    startExam();
  }, [startExam]);

  // 当前题目
  const currentQuestion = state.questions[state.currentIndex];
  const answeredCount = Object.keys(state.answers).filter(
    id => state.answers[id] && state.answers[id].length > 0
  ).length;

  return {
    state,
    examResult,
    currentQuestion,
    answeredCount,
    startExam,
    answerQuestion,
    toggleMark,
    goToQuestion,
    goNext,
    goPrev,
    submitExam: submitExamAction,
    retryExam,
  };
}
