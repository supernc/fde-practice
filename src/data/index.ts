import { Question } from '../types';
import questionData from './questions.json';

const allQuestions = questionData as Question[];

export function getAllQuestions(): Question[] {
  return allQuestions;
}

export function getQuestionsByChapter(chapter: number): Question[] {
  return allQuestions.filter(q => q.chapter === chapter);
}

export function getQuestionsBySubChapter(subChapter: string): Question[] {
  return allQuestions.filter(q => q.subChapter === subChapter);
}

export function getQuestionById(id: string): Question | undefined {
  return allQuestions.find(q => q.id === id);
}
