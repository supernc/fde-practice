import { StorageData } from '../types';
import { localDateKey, daysAgoKey } from './date';
import { courseChapters } from '../data/chapters';

export const DATA_CHANGED_EVENT = 'fde-data-changed';

const STORAGE_KEY = 'fde-practice-data';
const CURRENT_VERSION = 1;
const lessonIds = new Set(courseChapters.flatMap(chapter => chapter.notes.map(note => note.id)));

// 默认存储数据
const defaultData: StorageData = {
  completedLessons: [],
  courseNotes: {},
  answerRecords: [],
  wrongQuestions: [],
  favorites: [],
  examHistory: [],
  dailyStats: {},
  lastStudyDate: '',
  streakDays: 0,
  version: CURRENT_VERSION,
};

// 获取完整存储数据
function getData(): StorageData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultData);
  const parsed = JSON.parse(raw) as StorageData;
  // 版本迁移
  if (!parsed.version || parsed.version < CURRENT_VERSION) {
    return migrateData(parsed);
  }
  return parsed;
}

// 保存完整存储数据
function setData(data: StorageData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event(DATA_CHANGED_EVENT));
}

// 版本迁移
function migrateData(data: StorageData): StorageData {
  const migrated = { ...structuredClone(defaultData), ...data, version: CURRENT_VERSION };
  setData(migrated);
  return migrated;
}

// 获取指定字段
export function getField<K extends keyof StorageData>(key: K): StorageData[K] {
  return getData()[key];
}

// 更新指定字段
export function setField<K extends keyof StorageData>(key: K, value: StorageData[K]): void {
  const data = getData();
  data[key] = value;
  setData(data);
}

// 获取错题集合
export function getWrongQuestions(): Set<string> {
  return new Set(getField('wrongQuestions'));
}

// 添加错题
export function addWrongQuestion(questionId: string): void {
  const wrongs = getField('wrongQuestions');
  if (!wrongs.includes(questionId)) {
    setField('wrongQuestions', [...wrongs, questionId]);
  }
}

// Only an explicit action in the wrong-question book removes a question.
export function removeWrongQuestion(questionId: string): void {
  const wrongs = getField('wrongQuestions');
  setField('wrongQuestions', wrongs.filter(id => id !== questionId));
}

// 获取收藏集合
export function getFavorites(): Set<string> {
  return new Set(getField('favorites'));
}

// 切换收藏状态
export function toggleFavorite(questionId: string): boolean {
  const favs = getField('favorites');
  const index = favs.indexOf(questionId);
  if (index === -1) {
    setField('favorites', [...favs, questionId]);
    return true;
  } else {
    setField('favorites', favs.filter(id => id !== questionId));
    return false;
  }
}

// 获取考试历史
export function getExamHistory() {
  return getField('examHistory');
}

// 保存考试记录
export function saveExamRecord(record: StorageData['examHistory'][0], answers: StorageData['answerRecords']): void {
  const data = getData();
  if (data.examHistory.some(exam => exam.id === record.id)) return;
  data.examHistory.push(record);
  appendResults(data, answers);
  setData(data);
}

export function recordDailyAnswer(isCorrect: boolean): void {
  const data = getData();
  countDailyAnswer(data, isCorrect);
  setData(data);
}

function countDailyAnswer(data: StorageData, isCorrect: boolean): void {
  const today = localDateKey();
  const daily = data.dailyStats[today] ??= { answered: 0, correct: 0 };
  daily.answered += 1;
  if (isCorrect) daily.correct += 1;
  if (data.lastStudyDate === today) return;
  data.streakDays = data.lastStudyDate === daysAgoKey(1) ? data.streakDays + 1 : 1;
  data.lastStudyDate = today;
}

// 保存答题记录
export function saveAnswerRecord(record: StorageData['answerRecords'][0]): void {
  const records = getField('answerRecords');
  records.push(record);
  // 最多保留最近 5000 条
  if (records.length > 5000) {
    records.splice(0, records.length - 5000);
  }
  setField('answerRecords', records);
}

// 获取所有答题记录
export function getAnswerRecords() {
  return getField('answerRecords');
}

// Answering correctly never removes an existing wrong question.
export function recordAnswerResult(record: StorageData['answerRecords'][0]): void {
  const data = getData();
  appendResults(data, [record]);
  setData(data);
}

function appendResults(data: StorageData, records: StorageData['answerRecords']): void {
  data.answerRecords = [...data.answerRecords, ...records].slice(-5000);
  const wrong = new Set(data.wrongQuestions);
  for (const record of records) {
    countDailyAnswer(data, record.isCorrect);
    if (!record.isCorrect) wrong.add(record.questionId);
  }
  data.wrongQuestions = [...wrong];
}

export function restoreWrongQuestionsFromHistory(): number {
  const previous = getWrongQuestions();
  const recovered = new Set([...previous, ...getAnswerRecords().filter(r => !r.isCorrect).map(r => r.questionId)]);
  setField('wrongQuestions', [...recovered]);
  return recovered.size - previous.size;
}

// 清除所有数据
export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(NOTES_KEY);
  sessionStorage.removeItem('fde-random-session');
  sessionStorage.removeItem('fde-exam-state');
  window.dispatchEvent(new Event(DATA_CHANGED_EVENT));
}

// ======= 备注功能 =======
const NOTES_KEY = 'fde-question-notes';

export function getNotes(): Record<string, string> {
  const raw = localStorage.getItem(NOTES_KEY);
  return raw ? JSON.parse(raw) : {};
}

export function getNote(questionId: string): string {
  return getNotes()[questionId] || '';
}

export function saveNote(questionId: string, note: string): void {
  const notes = getNotes();
  if (note.trim()) {
    notes[questionId] = note.trim();
  } else {
    delete notes[questionId];
  }
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

// ======= 导出/导入功能 =======

// 导出所有数据为 JSON 字符串
export function exportData(): string {
  const data = getData();
  const exportPayload = {
    _meta: {
      app: 'fde-practice',
      exportTime: new Date().toISOString(),
      version: CURRENT_VERSION,
    },
    data,
    notes: getNotes(),
  };
  return JSON.stringify(exportPayload, null, 2);
}

// 下载数据为 JSON 文件
export function downloadData(): void {
  const json = exportData();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  a.href = url;
  a.download = `fde-backup-${timestamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// 导入数据（带智能合并去重）
export interface ImportResult {
  success: boolean;
  message: string;
  stats?: {
    answerRecords: { before: number; imported: number; after: number };
    wrongQuestions: { before: number; imported: number; after: number };
    favorites: { before: number; imported: number; after: number };
    examHistory: { before: number; imported: number; after: number };
    dailyStats: { before: number; imported: number; after: number };
  };
}

export function importData(jsonStr: string, mode: 'merge' | 'overwrite' = 'merge'): ImportResult {
  try {
    const parsed = JSON.parse(jsonStr);

    // 支持两种格式：带 _meta 的导出格式 和 直接的 StorageData 格式
    let importedData: StorageData;
    if (parsed._meta && parsed.data && parsed._meta.app === 'fde-practice') {
      importedData = parsed.data as StorageData;
    } else if (parsed.answerRecords !== undefined) {
      importedData = parsed as StorageData;
    } else {
      return { success: false, message: '无法识别的数据格式，请选择 FDE 备考学习站导出的文件' };
    }

    // 验证必要字段
    if (!Array.isArray(importedData.answerRecords) ||
        !Array.isArray(importedData.wrongQuestions) ||
        !Array.isArray(importedData.favorites)) {
      return { success: false, message: '数据格式不完整，缺少必要字段' };
    }

    const importedNotes = parsed.notes;
    if (importedNotes !== undefined && (!importedNotes || typeof importedNotes !== 'object' ||
        Array.isArray(importedNotes) || Object.values(importedNotes).some(note => typeof note !== 'string'))) {
      return { success: false, message: '备注数据格式有误，未导入任何数据' };
    }
    importedData = { ...structuredClone(defaultData), ...importedData };
    if (!Array.isArray(importedData.completedLessons) || importedData.completedLessons.some(id => !lessonIds.has(id)) ||
        !importedData.courseNotes || typeof importedData.courseNotes !== 'object' || Array.isArray(importedData.courseNotes) ||
        Object.entries(importedData.courseNotes).some(([id, note]) => !courseChapters.some(c => String(c.id) === id) ||
          typeof note !== 'string' || note.length > 16000)) {
      return { success: false, message: '课程进度或笔记格式有误，未导入任何数据' };
    }
    importedData.completedLessons = [...new Set(importedData.completedLessons)];
    if (!Array.isArray(importedData.examHistory) || !importedData.dailyStats ||
        typeof importedData.dailyStats !== 'object' || Array.isArray(importedData.dailyStats)) {
      return { success: false, message: '考试记录或每日统计格式有误，未导入任何数据' };
    }
    if (importedData.answerRecords.some(r => !r || typeof r.questionId !== 'string' ||
          !Number.isFinite(r.timestamp) || typeof r.isCorrect !== 'boolean' ||
          !Array.isArray(r.userAnswer) || r.userAnswer.some(a => typeof a !== 'string') ||
          !['exam', 'practice', 'random'].includes(r.mode)) ||
        [...importedData.wrongQuestions, ...importedData.favorites].some(id => typeof id !== 'string') ||
        importedData.examHistory.some(e => !e || typeof e.id !== 'string' || !Number.isFinite(e.startTime) ||
          !Number.isFinite(e.score) || !Number.isFinite(e.totalQuestions) || !Number.isFinite(e.correctCount) ||
          !e.answers || !e.chapterScores) ||
        Object.entries(importedData.dailyStats).some(([date, stat]) => !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
          !stat || !Number.isInteger(stat.answered) || !Number.isInteger(stat.correct) ||
          stat.correct < 0 || stat.answered < stat.correct)) {
      return { success: false, message: '学习记录格式有误，未导入任何数据' };
    }
    if (importedData.dailyGoal !== undefined && (!Number.isInteger(importedData.dailyGoal) ||
        importedData.dailyGoal < 5 || importedData.dailyGoal > 100)) delete importedData.dailyGoal;
    if (typeof importedData.autoAdvanceOnCorrect !== 'boolean') delete importedData.autoAdvanceOnCorrect;

    const restoreNotes = () => {
      // Older backups do not contain notes. Keep local notes in that case.
      if (importedNotes === undefined) return;
      const notes = mode === 'overwrite' ? importedNotes : { ...importedNotes, ...getNotes() };
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    };

    if (mode === 'overwrite') {
      // 直接覆盖
      const migrated = { ...defaultData, ...importedData, version: CURRENT_VERSION };
      setData(migrated);
      restoreNotes();
      return {
        success: true,
        message: '数据已完全覆盖导入',
        stats: {
          answerRecords: { before: 0, imported: migrated.answerRecords.length, after: migrated.answerRecords.length },
          wrongQuestions: { before: 0, imported: migrated.wrongQuestions.length, after: migrated.wrongQuestions.length },
          favorites: { before: 0, imported: migrated.favorites.length, after: migrated.favorites.length },
          examHistory: { before: 0, imported: migrated.examHistory.length, after: migrated.examHistory.length },
          dailyStats: { before: 0, imported: Object.keys(migrated.dailyStats).length, after: Object.keys(migrated.dailyStats).length },
        },
      };
    }

    // 合并模式（默认）：智能去重
    const current = getData();
    const stats = {
      answerRecords: { before: current.answerRecords.length, imported: importedData.answerRecords.length, after: 0 },
      wrongQuestions: { before: current.wrongQuestions.length, imported: importedData.wrongQuestions.length, after: 0 },
      favorites: { before: current.favorites.length, imported: importedData.favorites.length, after: 0 },
      examHistory: { before: current.examHistory.length, imported: importedData.examHistory.length, after: 0 },
      dailyStats: { before: Object.keys(current.dailyStats).length, imported: Object.keys(importedData.dailyStats || {}).length, after: 0 },
    };

    // 1. 合并答题记录（按 questionId + timestamp 去重）
    const existingRecordKeys = new Set(
      current.answerRecords.map(r => `${r.questionId}_${r.timestamp}`)
    );
    const newRecords = importedData.answerRecords.filter(r => {
      const key = `${r.questionId}_${r.timestamp}`;
      if (existingRecordKeys.has(key)) return false;
      existingRecordKeys.add(key);
      return true;
    });
    current.answerRecords = [...current.answerRecords, ...newRecords];
    // 按时间排序并限制 5000 条
    current.answerRecords.sort((a, b) => a.timestamp - b.timestamp);
    if (current.answerRecords.length > 5000) {
      current.answerRecords = current.answerRecords.slice(-5000);
    }
    stats.answerRecords.after = current.answerRecords.length;

    // 2. 合并错题（Set 去重）
    const wrongSet = new Set([...current.wrongQuestions, ...(importedData.wrongQuestions || [])]);
    current.wrongQuestions = [...wrongSet];
    stats.wrongQuestions.after = current.wrongQuestions.length;

    // 3. 合并收藏（Set 去重）
    const favSet = new Set([...current.favorites, ...(importedData.favorites || [])]);
    current.favorites = [...favSet];
    stats.favorites.after = current.favorites.length;

    // 4. 合并考试历史（按 id 去重）
    const existingExamIds = new Set(current.examHistory.map(e => e.id));
    const newExams = importedData.examHistory.filter(e => {
      if (existingExamIds.has(e.id)) return false;
      existingExamIds.add(e.id);
      return true;
    });
    current.examHistory = [...current.examHistory, ...newExams];
    current.examHistory.sort((a, b) => a.startTime - b.startTime);
    stats.examHistory.after = current.examHistory.length;

    // 5. 合并每日统计（相同日期取较大值）
    const importedDaily = importedData.dailyStats || {};
    for (const [date, importedStat] of Object.entries(importedDaily)) {
      if (!current.dailyStats[date]) {
        current.dailyStats[date] = importedStat;
      } else {
        current.dailyStats[date] = {
          answered: Math.max(current.dailyStats[date].answered, importedStat.answered),
          correct: Math.max(current.dailyStats[date].correct, importedStat.correct),
        };
      }
    }
    stats.dailyStats.after = Object.keys(current.dailyStats).length;

    // 6. 连续打卡和最近学习日期：取较新的
    if (importedData.lastStudyDate && importedData.lastStudyDate > current.lastStudyDate) {
      current.lastStudyDate = importedData.lastStudyDate;
    }
    current.streakDays = Math.max(current.streakDays, importedData.streakDays || 0);
    current.completedLessons = [...new Set([...current.completedLessons, ...importedData.completedLessons])];
    current.courseNotes = { ...importedData.courseNotes, ...current.courseNotes };

    current.version = CURRENT_VERSION;
    if (current.autoAdvanceOnCorrect === undefined && importedData.autoAdvanceOnCorrect !== undefined) {
      current.autoAdvanceOnCorrect = importedData.autoAdvanceOnCorrect;
    }
    if (current.dailyGoal === undefined && Number.isInteger(importedData.dailyGoal) &&
        importedData.dailyGoal! >= 5 && importedData.dailyGoal! <= 100) {
      current.dailyGoal = importedData.dailyGoal;
    }
    setData(current);
    restoreNotes();

    const totalNew = (stats.answerRecords.after - stats.answerRecords.before) +
                     (stats.wrongQuestions.after - stats.wrongQuestions.before) +
                     (stats.favorites.after - stats.favorites.before) +
                     (stats.examHistory.after - stats.examHistory.before);

    return {
      success: true,
      message: totalNew > 0
        ? `合并完成，新增 ${totalNew} 条数据（已自动去重）`
        : '合并完成，已保留本机已有记录和设置',
      stats,
    };
  } catch {
    return { success: false, message: '文件解析失败，请确认是有效的 JSON 文件' };
  }
}

// 获取当前数据概要（用于展示）
export function getDataSummary() {
  const data = getData();
  return {
    answerRecords: data.answerRecords.length,
    wrongQuestions: data.wrongQuestions.length,
    favorites: data.favorites.length,
    examHistory: data.examHistory.length,
    dailyStats: Object.keys(data.dailyStats).length,
    lastStudyDate: data.lastStudyDate,
    streakDays: data.streakDays,
    notes: Object.keys(getNotes()).length,
    completedLessons: data.completedLessons.length,
    courseNotes: Object.keys(data.courseNotes).length,
    hasSettings: data.dailyGoal !== undefined || data.autoAdvanceOnCorrect !== undefined,
  };
}

// 导出所有存储 API
const storageService = {
  getData,
  getField,
  setField,
  getWrongQuestions,
  addWrongQuestion,
  removeWrongQuestion,
  getFavorites,
  toggleFavorite,
  getExamHistory,
  saveExamRecord,
  recordDailyAnswer,
  saveAnswerRecord,
  getAnswerRecords,
  clearAllData,
  exportData,
  downloadData,
  importData,
  getDataSummary,
};

export default storageService;
