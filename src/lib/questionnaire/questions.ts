export type QuestionField = 'likes' | 'dislikes' | 'jokes' | 'moods' | 'dreams' | 'events' | 'gifts' | 'trips';

export interface Question {
  id: string;
  prompt: string;
  field: QuestionField;
}

export const QUESTIONS: readonly Question[] = [
  { id: 'favourite-things', prompt: 'What are some of your partner\'s favourite things?', field: 'likes' },
  { id: 'small-joys', prompt: 'What are the small joys they find in everyday life?', field: 'likes' },
  { id: 'pet-peeves', prompt: 'What are some of their biggest pet peeves?', field: 'dislikes' },
  { id: 'stress-signals', prompt: 'How can you tell when they are feeling stressed?', field: 'moods' },
  { id: 'comfort-response', prompt: 'How do they like to be comforted when they are down?', field: 'moods' },
  { id: 'running-joke', prompt: 'What is a running joke that only the two of you understand?', field: 'jokes' },
  { id: 'best-gift', prompt: 'What is the best gift they have ever received?', field: 'gifts' },
  { id: 'gift-misses', prompt: 'What is a gift that was a total miss?', field: 'gifts' },
  { id: 'dream-trip', prompt: 'If you could go anywhere, what would be your dream trip?', field: 'trips' },
  { id: 'someday-dream', prompt: 'What is a dream they hope to achieve someday?', field: 'dreams' },
  { id: 'proudest-moment', prompt: 'What is a moment they were incredibly proud of?', field: 'events' },
  { id: 'hard-year', prompt: 'What was a particularly challenging year for them?', field: 'events' },
] as const satisfies readonly Question[];