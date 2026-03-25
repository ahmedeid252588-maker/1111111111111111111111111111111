
import React from 'react';
import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: 'admin' | 'student';
  level: string;
  points: number;
  streak: number;
  progress: number;
  lastActive: Timestamp;
  joinedAt: Timestamp;
  dailyMissionCompleted: boolean;
  status?: 'active' | 'banned' | 'pending';
  currentMonth?: number;
  currentWeek?: number;
  currentDay?: number;
  whatsapp?: string;
  age?: string;
  gender?: 'male' | 'female';
  completedQuizzes?: string[];
  language?: 'german' | 'english' | 'arabic';
  subscriptions?: {
    german?: { [level: string]: number[] };
    english?: { [level: string]: number[] };
  };
  referralCode?: string;
  referralsCount?: number;
  usedReferralsCount?: number;
}

export type Screen = 'splash' | 'welcome' | 'login' | 'signup' | 'forgot-password' | 'home' | 'learning' | 'learning-plans' | 'learning-conversation-lesson' | 'library' | 'profile' | 'settings' | 'learning-week' | 'learning-day' | 'learning-day-select' | 'learning-content' | 'library-category' | 'library-subcategory' | 'library-item' | 'achievements' | 'admin-dashboard' | 'notifications' | 'vocabulary-student' | 'quizzes-student' | 'signup-step-1' | 'signup-step-2' | 'signup-step-3' | 'signup-step-4' | 'signup-step-5' | 'level-selection' | 'leaderboard-full';

export interface Achievement {
  id: number;
  title: string;
  icon: React.ReactNode;
  completed: boolean;
  description: string;
}

export interface Flashcard {
  id: string;
  level?: string;
  type: 'word' | 'sentence' | 'both';
  word: string;
  translation: string;
  sentence: string;
  sentenceTranslation?: string;
  imageUrl: string;
  section: string;
  month: number;
  week: number;
  day: number;
  createdAt: Timestamp;
  language: 'german' | 'english';
}

export type ExerciseType = 
  | 'MATCH_WORD_TRANSLATION' 
  | 'CONSTRUCT_WORD' 
  | 'MATCH_IMAGE_WORD' 
  | 'TRUE_FALSE_IMAGE' 
  | 'CHOOSE_WORD_TRANSLATION'
  | 'LISTEN_CONSTRUCT_WORD'
  | 'LISTEN_CHOOSE_IMAGE'
  | 'LISTEN_TRUE_FALSE';

export interface Exercise {
  id: string;
  level?: string;
  type: ExerciseType;
  title: string;
  month: number;
  week: number;
  day: number;
  createdAt: Timestamp;
  language: 'german' | 'english';
  content: {
    word?: string;
    translation?: string;
    imageUrl?: string;
    pairs?: { id: string; left: string; right: string; image?: string }[];
    options?: { id: string; text: string; image?: string; isCorrect: boolean }[];
    letters?: string[];
    correctAnswer?: string | boolean;
  };
}

export interface SubscriptionRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userWhatsapp: string;
  level: string;
  month: number;
  language: 'german' | 'english';
  senderNumber: string;
  marketerCode?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
}

export interface Marketer {
  id: string;
  name: string;
  phone: string;
  code: string;
  commissionType: 'fixed' | 'percentage';
  commissionValue: number;
  paidAmount: number;
  createdAt: Timestamp;
}
