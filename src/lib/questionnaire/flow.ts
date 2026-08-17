import { QUESTIONS, type Question } from '@/lib/questionnaire/questions';

/**
 * Returns the first question in QUESTIONS whose id is not in answeredIds.
 * Returns null when every question has been answered.
 * 
 * @param answeredIds - An array of IDs representing questions that have already been answered.
 * @returns The next Question to be answered, or null if the questionnaire is complete.
 */
export function nextQuestion(answeredIds: string[]): Question | null {
  const next = QUESTIONS.find((q) => !answeredIds.includes(q.id));
  return next ?? null;
}