export const EXAM_DURATION_SECONDS = 120 * 60;
export const EXAM_PASS_SCORE = 70;
export const EXAM_POINTS = { single: 1.5, multiple: 2 } as const;

// Each pair gives the single-choice and multiple-choice quotas for the scored chapters.
export const EXAM_DISTRIBUTION = [
  [5, 2], [3, 2], [4, 2], [4, 2], [4, 2],
  [4, 2], [4, 2], [3, 3], [4, 2], [5, 1],
] as const;

export const EXAM_SINGLE_COUNT = EXAM_DISTRIBUTION.reduce((sum, [single]) => sum + single, 0);
export const EXAM_MULTIPLE_COUNT = EXAM_DISTRIBUTION.reduce((sum, [, multiple]) => sum + multiple, 0);
export const EXAM_QUESTION_COUNT = EXAM_SINGLE_COUNT + EXAM_MULTIPLE_COUNT;
