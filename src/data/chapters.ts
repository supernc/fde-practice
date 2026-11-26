import { ChapterInfo } from '../types';
import course from './course.json';

export const courseChapters = course.chapters;
export const totalLessons = courseChapters.reduce((total, c) => total + c.notes.length, 0);

export const chapters: ChapterInfo[] = courseChapters.map(c => ({
  id: c.id,
  name: c.title,
  description: c.summary,
  weight: c.weight ?? 0,
  wikiUrl: c.url,
  subChapters: c.notes.map(n => ({ id: n.id, name: n.title, wikiUrl: c.url })),
}));

export default chapters;
