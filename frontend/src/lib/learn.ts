// 학습 콘텐츠 집계 진입점. 타입·상수는 learn-types, 콘텐츠는 단계별 파일(learn/intro·basic·advanced)에서.
// 컴포넌트는 기존처럼 '@/lib/learn' 에서 LEARN_ITEMS·QUIZ·STAGES·타입을 가져온다.

export * from './learn-types';

import type { LearnItem, QuizQ } from './learn-types';
import { INTRO_ITEMS, INTRO_QUIZ } from './learn/intro';
import { BASIC_ITEMS, BASIC_QUIZ } from './learn/basic';
import { ADVANCED_ITEMS, ADVANCED_QUIZ } from './learn/advanced';

export const LEARN_ITEMS: LearnItem[] = [...INTRO_ITEMS, ...BASIC_ITEMS, ...ADVANCED_ITEMS];
export const QUIZ: QuizQ[] = [...INTRO_QUIZ, ...BASIC_QUIZ, ...ADVANCED_QUIZ];
