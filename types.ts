import { ComponentType } from 'react';

export enum AppView {
  CLASSES = 'classes',
  TUTOR = 'tutor',
  GAMES = 'games',
  DAILY_CHALLENGE = 'daily_challenge',
}

export enum TutorMode {
  LESSON = 'Lesson',
  REVIEW = 'Review',
  CHALLENGE = 'Challenge',
  PRACTICE = 'Practice',
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface MathTopic {
  name: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}

export interface QuizProblem {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface QuizData {
  questions: QuizProblem[];
  userAnswers: (number | null)[];
  state: 'active' | 'submitted';
  score?: number;
  feedback?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
  quiz?: QuizData;
}

export interface MentalMathProblem {
    type: 'sprint';
    num1: number;
    num2: number;
    operator: '+' | '-' | '×';
    answer: number;
}

export interface AlgebraProblem {
    type: 'algebra';
    equation: string;
    answer: number;
}

export interface NumberSequenceProblem {
    type: 'sequence';
    sequence: (number | string)[]; // e.g., [2, 4, '?', 8, 10]
    answer: number;
}

export interface GeometryProblem {
    type: 'geometry';
    // Fix: Use `ComponentType` which is already imported, instead of `React.FC` which was causing a namespace error.
    shapeComponent: ComponentType<{ className?: string }>;
    question: string;
    options: string[];
    answer: string;
}

export interface FractionProblem {
    type: 'fraction';
    fraction1: { n: number; d: number };
    fraction2: { n: number; d: number };
    questionText: string;
    answer: '>' | '<' | '=';
}

export type GameProblem = MentalMathProblem | AlgebraProblem | NumberSequenceProblem | GeometryProblem | FractionProblem;

export interface ReminderSettings {
  day: string; // e.g., 'Monday'
  time: string; // e.g., '17:00'
  isEnabled: boolean;
}

// --- Daily Challenge Types ---
export interface DailyChallengeProblem {
    problem: GameProblem;
    difficulty: Difficulty;
}

export interface LeaderboardEntry {
    name: string;
    score: number;
    time: number; // in milliseconds
}

// --- Spaced Repetition System (SRS) Types ---
export interface SRSTopicData {
    strength: number; // 0-5 (0: new, 5: mastered)
    lastReviewed: number; // timestamp
    nextReview: number; // timestamp
}