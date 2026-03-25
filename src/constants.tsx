
import React from 'react';
import { Sparkles, Flame, GraduationCap, Mic2, Trophy, BookOpen, Brain, Star } from 'lucide-react';
import { Achievement } from './types';

export const ACHIEVEMENTS: Achievement[] = [
  { id: 1, title: 'بداية الرحلة', icon: <Sparkles className="text-yellow-500" />, completed: false, description: 'أكمل أول 3 دروس' },
  { id: 2, title: 'مستمر في العطاء', icon: <Flame className="text-orange-500" />, completed: false, description: 'حافظ على سلسلة تعلم لمدة 3 أيام' },
  { id: 3, title: 'محترف السلسلة', icon: <Flame className="text-red-600" />, completed: false, description: 'حافظ على سلسلة تعلم لمدة 30 يوم' },
  { id: 4, title: 'مستكشف اللغة', icon: <BookOpen className="text-emerald-500" />, completed: false, description: 'افتح 10 مصادر مختلفة من المكتبة' },
  { id: 5, title: 'جامع الأوسمة', icon: <Trophy className="text-yellow-600" />, completed: false, description: 'احصل على 5000 نقطة' },
  { id: 6, title: 'خبير القواعد', icon: <GraduationCap className="text-blue-500" />, completed: false, description: 'أكمل 20 درساً في القواعد' },
  { id: 7, title: 'المتحدث المبدع', icon: <Mic2 className="text-purple-500" />, completed: false, description: 'أكمل 50 تمرين نطق' },
  { id: 8, title: 'مفكر سريع', icon: <Brain className="text-pink-500" />, completed: false, description: 'أكمل 10 اختبارات سريعة بنسبة نجاح 100%' },
  { id: 9, title: 'المستوى المتقدم', icon: <Star className="text-amber-400" />, completed: false, description: 'وصلت للمستوى B1' },
  { id: 10, title: 'سيد اللغات', icon: <Trophy className="text-purple-700" />, completed: false, description: 'أكمل جميع مستويات اللغة الحالية' },
];

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const LANGUAGES = [
  { id: 'german', name: 'الألمانية', flag: '🇩🇪' },
  { id: 'english', name: 'الإنجليزية', flag: '🇺🇸' },
];

export const WHATSAPP_NUMBER = '01007486131';
export const BASE_PRICE = 300;
export const DISCOUNTED_PRICE = 200;

export interface Flashcard {
  id?: string;
  word: string;
  translation: string;
  sentence?: string;
  sentenceTranslation?: string;
  month: number;
  week: number;
  day: number;
  type: string;
  imageUrl?: string;
  section?: string;
}

export const FLASHCARDS_DAY_1: Flashcard[] = [
  {
    word: 'vorstellen (sich/andere)',
    translation: 'يقدم ( نفسه - الآخرين )',
    sentence: 'Ich stelle dir meinen Freund vor.',
    sentenceTranslation: 'أنا أقدم لكي صديقي.',
    month: 1,
    week: 1,
    day: 1,
    type: 'both',
    imageUrl: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=800',
    section: 'التعارف'
  },
  {
    word: 'der Nachname, -n',
    translation: 'الاسم الاخير - اسم العائلة',
    sentence: 'Mein Nachname ist Morgan.',
    sentenceTranslation: 'اسم عائلتي هو مورجان.',
    month: 1,
    week: 1,
    day: 1,
    type: 'both',
    imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=80&w=800',
    section: 'التعارف'
  },
  {
    word: 'die Frau, -en',
    translation: 'المرأة - السيدة',
    sentence: 'Die Frau spricht Spanisch.',
    sentenceTranslation: 'السيدة تتحدث الإسبانية.',
    month: 1,
    week: 1,
    day: 1,
    type: 'both',
    imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=800',
    section: 'الأساسيات'
  },
  {
    word: 'an.kreuzen',
    translation: 'يضع علامة (X)',
    sentence: 'Er kreuzt die richtige Antwort an.',
    sentenceTranslation: 'هو يضع علامة على الإجابة الصحيحة.',
    month: 1,
    week: 1,
    day: 1,
    type: 'both',
    imageUrl: 'https://images.unsplash.com/photo-1568225366119-d0338dc9221b?auto=format&fit=crop&q=80&w=800',
    section: 'الأفعال'
  },
  {
    word: '(der) Iran',
    translation: 'إيران',
    sentence: 'Er kommt aus dem Iran.',
    sentenceTranslation: 'هو يأتي من إيران.',
    month: 1,
    week: 1,
    day: 1,
    type: 'both',
    imageUrl: 'https://images.unsplash.com/photo-1589802829985-817e51171b92?auto=format&fit=crop&q=80&w=800',
    section: 'البلدان'
  },
  {
    word: 'und',
    translation: 'و',
    sentence: 'Hören Sie und kreuzen Sie an.',
    sentenceTranslation: 'استمع وضع علامة. (صيغة أمر)',
    month: 1,
    week: 1,
    day: 1,
    type: 'both',
    imageUrl: 'https://images.unsplash.com/photo-1516542076529-1ea3854896f2?auto=format&fit=crop&q=80&w=800',
    section: 'الروابط'
  },
  {
    word: 'sprechen',
    translation: 'يتكلم - يتحدث',
    sentence: 'Ihr sprecht zu schnell.',
    sentenceTranslation: 'أنتم تتحدثون بسرعة كبيرة.',
    month: 1,
    week: 1,
    day: 1,
    type: 'both',
    imageUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=800',
    section: 'الأفعال'
  },
  {
    word: 'das Alphabet, -e',
    translation: '( الحروف ) الابجدية',
    sentence: 'Wie viele Buchstaben hat das Alphabet?',
    sentenceTranslation: 'كم عدد الحروف في الأبجدية؟',
    month: 1,
    week: 1,
    day: 1,
    type: 'both',
    imageUrl: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&q=80&w=800',
    section: 'الأساسيات'
  },
  {
    word: 'die Stunde, -n',
    translation: 'الساعة - الحصة الدراسية',
    sentence: 'Eine Stunde hat sechzig Minuten.',
    sentenceTranslation: 'الساعة تحتوي على ستين دقيقة.',
    month: 1,
    week: 1,
    day: 1,
    type: 'both',
    imageUrl: 'https://images.unsplash.com/photo-1495364141860-b0d03dea1e62?auto=format&fit=crop&q=80&w=800',
    section: 'الأساسيات'
  }
];

export const getDirectLink = (url: string) => {
  if (!url) return url;
  let direct = url.trim();

  // Dropbox Handling
  if (direct.includes('dropbox.com')) {
    // Standardize to direct download link
    // Replacing www.dropbox.com with dl.dropboxusercontent.com is the most reliable way
    direct = direct.replace(/www\.dropbox\.com/g, 'dl.dropboxusercontent.com');
    direct = direct.replace(/dropbox\.com/g, 'dl.dropboxusercontent.com');
    
    // Remove query parameters that might interfere with direct download
    // but keep the path intact
    if (direct.includes('?')) {
      direct = direct.split('?')[0];
    }
    return direct;
  }

  // Google Drive Handling
  if (direct.includes('drive.google.com') || direct.includes('drive.usercontent.google.com') || direct.includes('docs.google.com')) {
    let id = '';
    
    // Try to find ID in various formats
    // 1. ?id=... or &id=...
    const idParamMatch = direct.match(/[?&]id=([a-zA-Z0-9_-]{25,})/);
    // 2. /d/...
    const dPathMatch = direct.match(/\/d\/([a-zA-Z0-9_-]{25,})/);
    // 3. file/d/...
    const fileDMatch = direct.match(/file\/d\/([a-zA-Z0-9_-]{25,})/);

    id = (idParamMatch && idParamMatch[1]) || (dPathMatch && dPathMatch[1]) || (fileDMatch && fileDMatch[1]) || '';

    if (id) {
      // Using docs.google.com/uc is the most reliable way to bypass some preview layers
      return `https://docs.google.com/uc?id=${id}&export=download`;
    }
  }

  return direct;
};
