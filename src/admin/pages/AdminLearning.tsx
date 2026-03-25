import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flashcard, Exercise, ExerciseType } from '../../types';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
const DraggableAny = Draggable as any;
import toast from 'react-hot-toast';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Pencil, 
  ChevronRight, 
  ChevronLeft,
  Video,
  FileText,
  Link as LinkIcon,
  Type,
  CircleCheck,
  X,
  Save,
  Layers,
  Calendar,
  Clock,
  ExternalLink,
  Eye,
  Award,
  Loader2,
  Brain,
  Volume2,
  Folder,
  File,
  PlayCircle,
  RotateCcw,
  Languages,
  BrainCircuit,
  Edit2
} from 'lucide-react';
import { CourseCard } from '../components/learning/CourseCard';
import { LessonItem } from '../components/learning/LessonItem';
import { LessonModal } from '../components/learning/LessonModal';
import { FlashcardModal } from '../components/learning/FlashcardModal';
import { FlashcardItem } from '../components/learning/FlashcardItem';
import { ExerciseModal } from '../components/learning/ExerciseModal';
import { ExerciseItem } from '../components/learning/ExerciseItem';
import { ConfirmModal } from '../components/ConfirmModal';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';

interface Lesson {
  id: string;
  level: string;
  title: string;
  type: 'video' | 'file' | 'text' | 'task';
  content: string;
  month: number;
  week: number;
  day: number;
  order: number;
  displayMode?: 'link' | 'embed';
  duration?: string;
  points?: number;
  language: 'german' | 'english';
}

const AdminLearning: React.FC<{ language: string }> = ({ language }) => {
  const [view, setView] = useState<'levels' | 'months' | 'weeks' | 'days' | 'content'>(() => {
    return (localStorage.getItem('adminLearningView') as any) || 'levels';
  });
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [vocabulary, setVocabulary] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    const saved = localStorage.getItem('adminLearningMonth');
    return saved ? parseInt(saved) : 1;
  });
  const [selectedWeek, setSelectedWeek] = useState<number>(() => {
    const saved = localStorage.getItem('adminLearningWeek');
    return saved ? parseInt(saved) : 1;
  });
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const saved = localStorage.getItem('adminLearningDay');
    return saved ? parseInt(saved) : 1;
  });
  const [selectedLevel, setSelectedLevel] = useState<string>(() => {
    return localStorage.getItem('adminLearningLevel') || 'A1';
  });

  useEffect(() => {
    localStorage.setItem('adminLearningView', view);
    localStorage.setItem('adminLearningMonth', selectedMonth.toString());
    localStorage.setItem('adminLearningWeek', selectedWeek.toString());
    localStorage.setItem('adminLearningDay', selectedDay.toString());
    localStorage.setItem('adminLearningLevel', selectedLevel);
  }, [view, selectedMonth, selectedWeek, selectedDay, selectedLevel]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Modal states
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null);
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [isPreviewExerciseModalOpen, setIsPreviewExerciseModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editingFlashcard, setEditingFlashcard] = useState<any | null>(null);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);
  
  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [lessonForm, setLessonForm] = useState({
    title: '',
    type: 'video' as const,
    content: '',
    month: 1,
    week: 1,
    day: 1,
    displayMode: 'embed' as const,
    duration: '',
    points: 10
  });

  const t = {
    title: 'إدارة المحتوى التعليمي',
    subtitle: 'تنظيم الدروس والبطاقات التعليمية والتمارين',
    levels: 'المستويات',
    months: 'الشهور',
    weeks: 'الأسابيع',
    days: 'الأيام',
    content: 'المحتوى',
    level: 'المستوى',
    month: 'الشهر',
    week: 'الأسبوع',
    day: 'اليوم',
    lessons: 'الدروس',
    flashcards: 'البطاقات التعليمية',
    exercises: 'التمارين',
    addLesson: 'إضافة درس',
    addFlashcard: 'إضافة بطاقة',
    addExercise: 'إضافة تمرين',
    saveOrder: 'حفظ الترتيب',
    preview: 'معاينة',
    edit: 'تعديل',
    delete: 'حذف',
    loading: 'جاري التحميل...',
    arabic: 'العربية',
    noContent: 'لا يوجد محتوى لهذا اليوم',
    back: 'رجوع',
    confirmDeleteTitle: 'تأكيد الحذف',
    confirmDeleteMessage: 'هل أنت متأكد أنك تريد حذف هذا العنصر؟',
    successDelete: 'تم الحذف بنجاح',
    errorDelete: 'فشل الحذف',
    successSave: 'تم الحفظ بنجاح',
    errorSave: 'فشل الحفظ',
    titleLevels: 'إدارة المنهج: المستويات',
    titleMonths: `المستوى ${selectedLevel}: الشهور`,
    titleWeeks: `الشهر ${selectedMonth}: الأسابيع`,
    titleDays: `الأسبوع ${selectedWeek}: الأيام`,
    titleContent: `اليوم ${selectedDay}: المحتوى`,
    subtitleLevels: 'تنظيم المنهج حسب المستويات',
    subtitleMonths: 'تنظيم المنهج حسب الشهور',
    subtitleWeeks: 'تنظيم الدروس حسب الأسابيع',
    subtitleDays: 'اختر يوماً لإضافة محتوى',
    subtitleContent: 'إدارة الدروس والمهام لهذا اليوم',
    addContent: 'إضافة محتوى',
    manageMonths: 'إدارة شهور المستوى',
    manageWeeks: 'إدارة أسابيع الشهر',
    manageDays: 'إدارة أيام الأسبوع',
    deleteFlashcardTitle: 'حذف البطاقة',
    deleteFlashcardMessage: 'هل أنت متأكد أنك تريد حذف هذه البطاقة؟',
    deleteSuccess: 'تم حذف البطاقة',
    editLesson: 'تعديل الدرس',
    addLessonNew: 'إضافة درس جديد',
    lessonTitleRequired: 'عنوان الدرس مطلوب',
    lessonContentRequired: 'محتوى الدرس مطلوب',
    wordRequired: 'الكلمة مطلوبة',
    translationRequired: 'الترجمة مطلوبة',
    sentenceRequired: 'الجملة مطلوبة',
    flashcardUpdateSuccess: 'تم تحديث البطاقة بنجاح',
    flashcardAddSuccess: 'تم إضافة البطاقة بنجاح',
    flashcardSaveError: 'فشل حفظ البطاقة',
    exerciseTitleRequired: 'عنوان التمرين مطلوب',
    exerciseUpdateSuccess: 'تم تحديث التمرين بنجاح',
    exerciseAddSuccess: 'تم إضافة التمرين بنجاح',
    exerciseSaveError: 'فشل حفظ التمرين',
    deleteExerciseTitle: 'حذف التمرين',
    deleteExerciseMessage: 'هل أنت متأكد أنك تريد حذف هذا التمرين؟',
    deleteExerciseSuccess: 'تم حذف التمرين',
    deleteExerciseError: 'فشل حذف التمرين',
    lessonWords: 'كلمات الدرس',
    lessonsCount: 'عدد الدروس',
    flashcardsCount: 'عدد البطاقات',
    exercisesCount: 'عدد التمارين',
    quizzesCount: 'عدد الاختبارات',
    vocabularyCount: 'عدد المفردات',
    editFlashcard: 'تعديل البطاقة',
    addFlashcardNew: 'إضافة بطاقة جديدة',
    editExercise: 'تعديل التمرين',
    addExerciseNew: 'إضافة تمرين جديد',
    previewLessonTitle: 'معاينة الدرس',
    zoom: 'تكبير',
    learningTask: 'مهمة تعليمية',
    closePreview: 'إغلاق المعاينة',
    previewExerciseTitle: 'معاينة التمرين',
    exerciseType: 'نوع التمرين',
    matchWordTranslation: 'توصيل الكلمة بالترجمة',
    matchImageWord: 'توصيل الصورة بالكلمة',
    constructWord: 'تكوين الكلمة',
    trueFalseImage: 'صح/خطأ (صورة)',
    listenConstructWord: 'استماع وتكوين الكلمة',
    listenChooseImage: 'استماع واختيار الصورة',
    chooseWordTranslation: 'اختيار الترجمة الصحيحة',
    listenTrueFalse: 'استماع وصح/خطأ',
    true: 'صح',
    false: 'خطأ',
    reorderLessonsSuccess: 'تم حفظ ترتيب الدروس',
    reorderFlashcardsSuccess: 'تم حفظ ترتيب البطاقات',
    reorderExercisesSuccess: 'تم حفظ ترتيب التمارين',
    reorderError: 'خطأ في حفظ الترتيب',
    addMonth: 'إضافة شهر جديد',
    addWeek: 'إضافة أسبوع جديد',
    addDay: 'إضافة يوم',
    noQuizzes: 'لا توجد اختبارات لهذا اليوم',
    noVocabulary: 'لا توجد مفردات لهذا اليوم',
    goToQuizzes: 'يرجى الانتقال إلى قسم الاختبارات للتعديل',
  };

  const [flashcardForm, setFlashcardForm] = useState({
    word: '',
    translation: '',
    sentence: '',
    sentenceTranslation: '',
    imageUrl: '',
    audioUrl: '',
    sentenceAudioUrl: '',
    month: 1,
    week: 1,
    day: 1,
    type: 'both' as 'word' | 'sentence' | 'both',
    section: t.lessonWords
  });

  const [exerciseForm, setExerciseForm] = useState({
    type: 'MATCH_WORD_TRANSLATION' as ExerciseType,
    title: '',
    month: 1,
    week: 1,
    day: 1,
    content: {
      pairs: [],
      options: [],
      letters: [],
      word: '',
      translation: '',
      imageUrl: '',
      audioUrl: '',
      correctAnswer: true
    }
  });

  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [allFlashcards, setAllFlashcards] = useState<any[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<any[]>([]);
  const [allVocabulary, setAllVocabulary] = useState<any[]>([]);

  useEffect(() => {
    if (!selectedLevel) return;

    const lessonsPath = `lessons_${language}`;
    const qLessons = query(collection(db, lessonsPath));
    const unsubscribeLessons = onSnapshot(qLessons, (snapshot) => {
      setAllLessons(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Lesson)).filter(d => (d.level || 'A1') === selectedLevel));
    });

    const flashcardsPath = `flashcards_${language}`;
    const qFlashcards = query(collection(db, flashcardsPath));
    const unsubscribeFlashcards = onSnapshot(qFlashcards, (snapshot) => {
      setAllFlashcards(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any)).filter(d => (d.level || 'A1') === selectedLevel));
    });

    const exercisesPath = `exercises_${language}`;
    const qExercises = query(collection(db, exercisesPath));
    const unsubscribeExercises = onSnapshot(qExercises, (snapshot) => {
      setAllExercises(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Exercise)).filter(d => (d.level || 'A1') === selectedLevel));
    });

    const quizzesPath = `quizzes_${language}`;
    const qQuizzes = query(collection(db, quizzesPath));
    const unsubscribeQuizzes = onSnapshot(qQuizzes, (snapshot) => {
      setAllQuizzes(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    });

    const vocabularyPath = `vocabulary_${language}`;
    const qVocabulary = query(collection(db, vocabularyPath));
    const unsubscribeVocabulary = onSnapshot(qVocabulary, (snapshot) => {
      setAllVocabulary(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any)).filter(d => (d.level || 'A1') === selectedLevel));
    });

    return () => {
      unsubscribeLessons();
      unsubscribeFlashcards();
      unsubscribeExercises();
      unsubscribeQuizzes();
      unsubscribeVocabulary();
    };
  }, [selectedLevel, language]);

  useEffect(() => {
    if (!selectedMonth || !selectedWeek || !selectedLevel) return;

    setIsLoading(true);
    const lessonsPath = `lessons_${language}`;
    const q = query(
      collection(db, lessonsPath),
      where('month', '==', selectedMonth)
    );
    
    // Remove orderBy to avoid composite index requirement
    const unsubscribeLessons = onSnapshot(q, (snapshot) => {
      const lessonsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Lesson))
        .filter(doc => doc.week === selectedWeek && (doc.level || 'A1') === selectedLevel);
      // Sort client-side
      lessonsData.sort((a, b) => {
        if (a.day !== b.day) return (a.day || 0) - (b.day || 0);
        return (a.order || 0) - (b.order || 0);
      });
      setLessons(lessonsData);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, lessonsPath);
      toast.error('Failed to load lessons');
      setIsLoading(false);
    });

    const flashcardsPath = `flashcards_${language}`;
    const qFlashcards = query(
      collection(db, flashcardsPath), 
      where('month', '==', selectedMonth)
    );
    const unsubscribeFlashcards = onSnapshot(qFlashcards, (snapshot) => {
      const flashcardsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Flashcard))
        .filter(doc => doc.week === selectedWeek && doc.day === selectedDay && (doc.level || 'A1') === selectedLevel);
      setFlashcards(flashcardsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, flashcardsPath);
      toast.error('Failed to load flashcards');
    });

    const exercisesPath = `exercises_${language}`;
    const qExercises = query(
      collection(db, exercisesPath),
      where('month', '==', selectedMonth)
    );
    const unsubscribeExercises = onSnapshot(qExercises, (snapshot) => {
      const exercisesData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Exercise))
        .filter(doc => doc.week === selectedWeek && doc.day === selectedDay && (doc.level || 'A1') === selectedLevel);
      setExercises(exercisesData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, exercisesPath);
      toast.error('Failed to load exercises');
    });

    const quizzesPath = `quizzes_${language}`;
    const qQuizzes = query(
      collection(db, quizzesPath),
      where('month', '==', selectedMonth)
    );
    const unsubscribeQuizzes = onSnapshot(qQuizzes, (snapshot) => {
      const quizzesData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any))
        .filter(doc => doc.week === selectedWeek && doc.day === selectedDay && (doc.level || 'A1') === selectedLevel);
      setQuizzes(quizzesData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, quizzesPath);
    });

    const vocabularyPath = `vocabulary_${language}`;
    const qVocabulary = query(
      collection(db, vocabularyPath),
      where('month', '==', selectedMonth)
    );
    const unsubscribeVocabulary = onSnapshot(qVocabulary, (snapshot) => {
      const vocabularyData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any))
        .filter(doc => doc.week === selectedWeek && doc.day === selectedDay && (doc.level || 'A1') === selectedLevel);
      setVocabulary(vocabularyData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, vocabularyPath);
    });

    return () => {
      unsubscribeLessons();
      unsubscribeFlashcards();
      unsubscribeExercises();
      unsubscribeQuizzes();
      unsubscribeVocabulary();
    };
  }, [selectedMonth, selectedWeek, selectedDay, selectedLevel, language]);

  const handleSaveLesson = async () => {
    if (!lessonForm.title.trim()) {
      toast.error(t.lessonTitleRequired);
      return;
    }
    if (!lessonForm.content.trim()) {
      toast.error(t.lessonContentRequired);
      return;
    }

    setIsSaving(true);
    try {
      const path = `lessons_${language}`;
      const lessonDataToSave = {
        ...lessonForm,
        points: parseInt(lessonForm.points as any) || 0
      };
      
      if (editingLesson) {
        await updateDoc(doc(db, path, editingLesson.id), lessonDataToSave);
        toast.success('Lesson updated successfully');
      } else {
        // Find max order for the current day
        const dayLessons = lessons.filter(l => l.month === lessonForm.month && l.week === lessonForm.week && l.day === lessonForm.day);
        const maxOrder = dayLessons.length > 0 ? Math.max(...dayLessons.map(l => l.order || 0)) : 0;
        
        await addDoc(collection(db, path), { 
          ...lessonDataToSave, 
          level: selectedLevel,
          language: language,
          order: maxOrder + 1, 
          createdAt: serverTimestamp() 
        });
        toast.success('Lesson added successfully');
      }
      setIsLessonModalOpen(false);
      setEditingLesson(null);
    } catch (error) {
      console.error("Error saving lesson:", error);
      handleFirestoreError(error, editingLesson ? OperationType.UPDATE : OperationType.CREATE, `lessons_${language}`);
      toast.error('Failed to save lesson');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFlashcard = async () => {
    const { type, word, translation, sentence } = flashcardForm;

    if (type === 'word' || type === 'both') {
      if (!word.trim()) {
        toast.error(t.wordRequired);
        return;
      }
      if (!translation.trim()) {
        toast.error(t.translationRequired);
        return;
      }
    }
    
    if (type === 'sentence' || type === 'both') {
      if (!sentence.trim()) {
        toast.error(t.sentenceRequired);
        return;
      }
    }

    setIsSaving(true);
    try {
      const path = `flashcards_${language}`;
      if (editingFlashcard) {
        await updateDoc(doc(db, path, editingFlashcard.id), {
          ...flashcardForm,
          month: flashcardForm.month,
          week: flashcardForm.week,
          day: flashcardForm.day
        });
        toast.success(t.flashcardUpdateSuccess);
      } else {
        await addDoc(collection(db, path), {
          ...flashcardForm,
          month: flashcardForm.month,
          week: flashcardForm.week,
          day: flashcardForm.day,
          level: selectedLevel,
          language: language,
          createdAt: serverTimestamp()
        });
        toast.success(t.flashcardAddSuccess);
      }
      setIsFlashcardModalOpen(false);
      setEditingFlashcard(null);
      setFlashcardForm({ 
        word: '', 
        translation: '', 
        sentence: '', 
        sentenceTranslation: '',
        imageUrl: '', 
        audioUrl: '', 
        sentenceAudioUrl: '',
        month: selectedMonth, 
        week: selectedWeek, 
        day: selectedDay,
        type: 'word',
        section: t.lessonWords
      });
    } catch (error) {
      handleFirestoreError(error, editingFlashcard ? OperationType.UPDATE : OperationType.CREATE, `flashcards_${language}`);
      toast.error(t.flashcardSaveError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditFlashcard = (flashcard: any) => {
    setEditingFlashcard(flashcard);
    setFlashcardForm({
      word: flashcard.word || '',
      translation: flashcard.translation || '',
      sentence: flashcard.sentence || '',
      sentenceTranslation: flashcard.sentenceTranslation || '',
      imageUrl: flashcard.imageUrl || '',
      audioUrl: flashcard.audioUrl || '',
      sentenceAudioUrl: flashcard.sentenceAudioUrl || '',
      section: flashcard.section || t.lessonWords,
      month: flashcard.month || selectedMonth,
      week: flashcard.week || selectedWeek,
      day: flashcard.day || selectedDay,
      type: flashcard.type || 'both'
    });
    setIsFlashcardModalOpen(true);
  };

  const handleSaveExercise = async () => {
    if (!exerciseForm.title.trim()) {
      toast.error(t.exerciseTitleRequired);
      return;
    }
    setIsSaving(true);
    try {
      const path = `exercises_${language}`;
      if (editingExercise) {
        await updateDoc(doc(db, path, editingExercise.id), {
          ...exerciseForm,
          updatedAt: serverTimestamp()
        });
        toast.success(t.exerciseUpdateSuccess);
      } else {
        await addDoc(collection(db, path), {
          ...exerciseForm,
          level: selectedLevel,
          language: language,
          createdAt: serverTimestamp()
        });
        toast.success(t.exerciseAddSuccess);
      }
      setIsExerciseModalOpen(false);
      setEditingExercise(null);
    } catch (error) {
      handleFirestoreError(error, editingExercise ? OperationType.UPDATE : OperationType.CREATE, `exercises_${language}`);
      toast.error(t.exerciseSaveError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditExercise = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setExerciseForm({
      type: exercise.type,
      title: exercise.title,
      month: exercise.month,
      week: exercise.week,
      day: exercise.day,
      content: exercise.content
    });
    setIsExerciseModalOpen(true);
  };

  const handleDeleteExercise = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: t.deleteExerciseTitle,
      message: t.deleteExerciseMessage,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const path = `exercises_${language}`;
          await deleteDoc(doc(db, path, id));
          toast.success(t.deleteExerciseSuccess);
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `exercises_${language}/${id}`);
          toast.error(t.deleteExerciseError);
        }
      }
    });
  };

  const handleDeleteLesson = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Lesson',
      message: 'Are you sure you want to delete this lesson? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setIsLoading(true);
        try {
          const path = `lessons_${language}`;
          await deleteDoc(doc(db, path, id));
          toast.success('Lesson deleted successfully');
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `lessons_${language}/${id}`);
          toast.error('Failed to delete lesson');
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    const droppableId = result.destination.droppableId;

    if (sourceIndex === destinationIndex) return;

    if (droppableId === 'lessons-list') {
      const dayLessons = lessons.filter(l => l.month === selectedMonth && l.week === selectedWeek && l.day === selectedDay);
      const reorderedLessons = [...dayLessons];
      const [removed] = reorderedLessons.splice(sourceIndex, 1);
      reorderedLessons.splice(destinationIndex, 0, removed);

      const updatedLessons = lessons.map(l => {
        const reorderedLesson = reorderedLessons.find(rl => rl.id === l.id);
        if (reorderedLesson) {
          return { ...l, order: reorderedLessons.indexOf(reorderedLesson) };
        }
        return l;
      });
      setLessons(updatedLessons);

      try {
        const lessonsPath = `lessons_${language}`;
        const batch = writeBatch(db);
        reorderedLessons.forEach((lesson, index) => {
          const lessonRef = doc(db, lessonsPath, lesson.id);
          batch.update(lessonRef, { order: index });
        });
        await batch.commit();
        toast.success(t.reorderLessonsSuccess);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `lessons_${language} (batch reorder)`);
        toast.error(t.reorderError);
      }
    } else if (droppableId === 'flashcards-list') {
      // Logic for flashcards
      const dayFlashcards = flashcards.filter(f => f.month === selectedMonth && f.week === selectedWeek && f.day === selectedDay);
      const reorderedFlashcards = [...dayFlashcards];
      const [removed] = reorderedFlashcards.splice(sourceIndex, 1);
      reorderedFlashcards.splice(destinationIndex, 0, removed);

      const updatedFlashcards = flashcards.map(f => {
        const reorderedFlashcard = reorderedFlashcards.find(rf => rf.id === f.id);
        if (reorderedFlashcard) {
          return { ...f, order: reorderedFlashcards.indexOf(reorderedFlashcard) };
        }
        return f;
      });
      setFlashcards(updatedFlashcards);

      try {
        const flashcardsPath = `flashcards_${language}`;
        const batch = writeBatch(db);
        reorderedFlashcards.forEach((flashcard, index) => {
          const flashcardRef = doc(db, flashcardsPath, flashcard.id);
          batch.update(flashcardRef, { order: index });
        });
        await batch.commit();
        toast.success(t.reorderFlashcardsSuccess);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `flashcards_${language} (batch reorder)`);
        toast.error(t.reorderError);
      }
    } else if (droppableId === 'exercises-list') {
      // Logic for exercises
      const dayExercises = exercises.filter(e => e.month === selectedMonth && e.week === selectedWeek && e.day === selectedDay);
      const reorderedExercises = [...dayExercises];
      const [removed] = reorderedExercises.splice(sourceIndex, 1);
      reorderedExercises.splice(destinationIndex, 0, removed);

      const updatedExercises = exercises.map(e => {
        const reorderedExercise = reorderedExercises.find(re => re.id === e.id);
        if (reorderedExercise) {
          return { ...e, order: reorderedExercises.indexOf(reorderedExercise) };
        }
        return e;
      });
      setExercises(updatedExercises);

      try {
        const exercisesPath = `exercises_${language}`;
        const batch = writeBatch(db);
        reorderedExercises.forEach((exercise, index) => {
          const exerciseRef = doc(db, exercisesPath, exercise.id);
          batch.update(exerciseRef, { order: index });
        });
        await batch.commit();
        toast.success(t.reorderExercisesSuccess);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `exercises_${language} (batch reorder)`);
        toast.error(t.reorderError);
      }
    }
  };

  const filteredLessons = lessons.filter(l => l.month === selectedMonth && l.week === selectedWeek);

  return (
    <div className="space-y-8 pb-20" dir="rtl">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {view !== 'levels' && (
            <button 
              onClick={() => {
                if (view === 'months') setView('levels');
                else if (view === 'weeks') setView('months');
                else if (view === 'days') setView('weeks');
                else if (view === 'content') setView('days');
              }}
              className="p-3 rounded-2xl bg-white shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] hover:shadow-inner transition-all"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
          )}
          <div className="text-right">
            <h1 className="text-3xl font-bold text-gray-900">
              {view === 'levels' && t.titleLevels}
              {view === 'months' && t.titleMonths}
              {view === 'weeks' && t.titleWeeks}
              {view === 'days' && t.titleDays}
              {view === 'content' && t.titleContent}
            </h1>
            <p className="text-gray-500">
              {view === 'levels' && t.subtitleLevels}
              {view === 'months' && t.subtitleMonths}
              {view === 'weeks' && t.subtitleWeeks}
              {view === 'days' && t.subtitleDays}
              {view === 'content' && t.subtitleContent}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Language selector removed - handled globally in AdminApp */}
          {view !== 'levels' && (
            <div className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-2xl shadow-inner">
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => (
                <button
                  key={level}
                  onClick={() => {
                    setSelectedLevel(level);
                    setView('months');
                  }}
                  className={`px-4 py-2 rounded-xl font-bold transition-all ${
                    selectedLevel === level 
                      ? 'bg-white text-[#4d9685] shadow-[2px_2px_5px_rgba(0,0,0,0.05)]' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          )}
          {view === 'content' && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setExerciseForm({
                    type: 'MATCH_WORD_TRANSLATION',
                    title: '',
                    month: selectedMonth,
                    week: selectedWeek,
                    day: selectedDay,
                    content: { pairs: [], options: [], letters: [], word: '', translation: '', imageUrl: '', audioUrl: '', correctAnswer: true }
                  });
                  setEditingExercise(null);
                  setIsExerciseModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-purple-500 text-white font-bold shadow-[4px_4px_12px_rgba(168,85,247,0.4)] hover:bg-purple-600 transition-all"
              >
                <Brain className="w-5 h-5" />
                {t.addExercise}
              </button>
              <button 
                onClick={() => {
                  setFlashcardForm({ 
                    ...flashcardForm, 
                    word: '', 
                    translation: '', 
                    sentence: '', 
                    sentenceTranslation: '',
                    imageUrl: '', 
                    audioUrl: '', 
                    sentenceAudioUrl: '',
                    month: selectedMonth, 
                    week: selectedWeek, 
                    day: selectedDay,
                    type: 'both',
                    section: t.lessonWords
                  });
                  setIsFlashcardModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-blue-500 text-white font-bold shadow-[4px_4px_12px_rgba(59,130,246,0.4)] hover:bg-blue-600 transition-all"
              >
                <Type className="w-5 h-5" />
                {t.addFlashcard}
              </button>
              <button 
                onClick={() => {
                  setEditingLesson(null);
                  setLessonForm({ ...lessonForm, title: '', content: '', month: selectedMonth, week: selectedWeek, day: selectedDay });
                  setIsLessonModalOpen(true);
                }}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 text-white font-bold shadow-[4px_4px_12px_rgba(16,185,129,0.4)] hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
                {isLoading ? t.loading : t.addContent}
              </button>
            </div>
          )}
        </div>
      </div>

      {view === 'levels' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(level => {
              return (
                <button
                  key={level}
                  onClick={() => { setSelectedLevel(level); setView('months'); }}
                  className="p-10 rounded-[40px] bg-[#e0e0e0] shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] hover:shadow-inner transition-all flex flex-col items-center justify-center gap-4 group relative"
                >
                  <div className="w-20 h-20 rounded-3xl bg-white shadow-md flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                    <Award size={40} />
                  </div>
                  <span className="text-2xl font-black text-gray-800">{t.level} {level}</span>
                  <span className="text-gray-500 font-bold">{t.manageMonths}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">امتحانات المستوى</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {allQuizzes.filter(q => q.isLevelExam).map(quiz => (
                <div key={quiz.id} className="p-6 rounded-3xl bg-[#f5f5f5] shadow-md border border-white/50">
                  <h3 className="text-lg font-bold text-gray-800">{quiz.question}</h3>
                  <p className="text-sm text-gray-500 mt-2">المستوى: {quiz.level}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {view === 'months' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ 
            length: Math.max(12, ...allLessons.map(l => l.month || 0),
                             ...allFlashcards.map(f => f.month || 0),
                             ...allExercises.map(e => e.month || 0),
                             ...allQuizzes.map(q => q.month || 0),
                             ...allVocabulary.map(v => v.month || 0)) 
          }, (_, i) => i + 1).map(m => {
            const monthLessonsCount = allLessons.filter(l => l.month === m).length;
            const monthFlashcardsCount = allFlashcards.filter(f => f.month === m).length;
            const monthExercisesCount = allExercises.filter(e => e.month === m).length;
            const monthQuizzesCount = allQuizzes.filter(q => q.month === m).length;
            const monthVocabularyCount = allVocabulary.filter(v => v.month === m).length;
            return (
              <button
                key={m}
                onClick={() => { setSelectedMonth(m); setView('weeks'); }}
                className="p-10 rounded-[40px] bg-[#e0e0e0] shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] hover:shadow-inner transition-all flex flex-col items-center justify-center gap-4 group relative"
              >
                <div className="w-20 h-20 rounded-3xl bg-white shadow-md flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                  <Folder size={40} />
                </div>
                <span className="text-2xl font-black text-gray-800">{t.month} {m}</span>
                <span className="text-gray-500 font-bold">{t.manageWeeks}</span>
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  {monthLessonsCount > 0 && (
                    <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">
                      <Video size={10} />
                      {monthLessonsCount}
                    </div>
                  )}
                  {monthFlashcardsCount > 0 && (
                    <div className="flex items-center gap-1 bg-blue-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">
                      <Type size={10} />
                      {monthFlashcardsCount}
                    </div>
                  )}
                  {monthExercisesCount > 0 && (
                    <div className="flex items-center gap-1 bg-purple-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">
                      <Brain size={10} />
                      {monthExercisesCount}
                    </div>
                  )}
                  {monthQuizzesCount > 0 && (
                    <div className="flex items-center gap-1 bg-rose-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">
                      <Award size={10} />
                      {monthQuizzesCount}
                    </div>
                  )}
                  {monthVocabularyCount > 0 && (
                    <div className="flex items-center gap-1 bg-indigo-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">
                      <Languages size={10} />
                      {monthVocabularyCount}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {view === 'weeks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {Array.from({ 
            length: Math.max(4, ...allLessons.filter(l => l.month === selectedMonth).map(l => l.week || 0),
                             ...allFlashcards.filter(f => f.month === selectedMonth).map(f => f.week || 0),
                             ...allExercises.filter(e => e.month === selectedMonth).map(e => e.week || 0),
                             ...allQuizzes.filter(q => q.month === selectedMonth).map(q => q.week || 0),
                             ...allVocabulary.filter(v => v.month === selectedMonth).map(v => v.week || 0)) 
          }, (_, i) => i + 1).map(w => {
            const weekLessonsCount = allLessons.filter(l => l.month === selectedMonth && l.week === w).length;
            const weekFlashcardsCount = allFlashcards.filter(f => f.month === selectedMonth && f.week === w).length;
            const weekExercisesCount = allExercises.filter(e => e.month === selectedMonth && e.week === w).length;
            const weekQuizzesCount = allQuizzes.filter(q => q.month === selectedMonth && q.week === w).length;
            const weekVocabularyCount = allVocabulary.filter(v => v.month === selectedMonth && v.week === w).length;
            return (
              <button
                key={w}
                onClick={() => { setSelectedWeek(w); setView('days'); }}
                className="p-10 rounded-[40px] bg-[#e0e0e0] shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] hover:shadow-inner transition-all flex flex-col items-center justify-center gap-4 group relative"
              >
                <div className="w-20 h-20 rounded-3xl bg-white shadow-md flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                  <Layers size={40} />
                </div>
                <span className="text-2xl font-black text-gray-800">{t.week} {w}</span>
                <span className="text-gray-500 font-bold">{t.manageDays}</span>
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  {weekLessonsCount > 0 && (
                    <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">
                      <Video size={10} />
                      {weekLessonsCount}
                    </div>
                  )}
                  {weekFlashcardsCount > 0 && (
                    <div className="flex items-center gap-1 bg-blue-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">
                      <Type size={10} />
                      {weekFlashcardsCount}
                    </div>
                  )}
                  {weekExercisesCount > 0 && (
                    <div className="flex items-center gap-1 bg-purple-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">
                      <Brain size={10} />
                      {weekExercisesCount}
                    </div>
                  )}
                  {weekQuizzesCount > 0 && (
                    <div className="flex items-center gap-1 bg-rose-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">
                      <Award size={10} />
                      {weekQuizzesCount}
                    </div>
                  )}
                  {weekVocabularyCount > 0 && (
                    <div className="flex items-center gap-1 bg-indigo-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">
                      <Languages size={10} />
                      {weekVocabularyCount}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {view === 'days' && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
          {Array.from({ 
            length: Math.max(7, ...allLessons
              .filter(l => l.month === selectedMonth && l.week === selectedWeek)
              .map(l => l.day || 0),
              ...allFlashcards.filter(f => f.month === selectedMonth && f.week === selectedWeek).map(f => f.day || 0),
              ...allExercises.filter(e => e.month === selectedMonth && e.week === selectedWeek).map(e => e.day || 0),
              ...allQuizzes.filter(q => q.month === selectedMonth && q.week === selectedWeek).map(q => q.day || 0),
              ...allVocabulary.filter(v => v.month === selectedMonth && v.week === selectedWeek).map(v => v.day || 0)) 
          }, (_, i) => i + 1).map(d => {
            const dayLessonsCount = allLessons.filter(l => l.month === selectedMonth && l.week === selectedWeek && l.day === d).length;
            const dayFlashcardsCount = allFlashcards.filter(f => f.month === selectedMonth && f.week === selectedWeek && f.day === d).length;
            const dayExercisesCount = allExercises.filter(e => e.month === selectedMonth && e.week === selectedWeek && e.day === d).length;
            const dayQuizzesCount = allQuizzes.filter(q => q.month === selectedMonth && q.week === selectedWeek && q.day === d).length;
            const dayVocabularyCount = allVocabulary.filter(v => v.month === selectedMonth && v.week === selectedWeek && v.day === d).length;
            return (
              <button
                key={d}
                onClick={() => { setSelectedDay(d); setView('content'); }}
                className="p-8 rounded-[30px] bg-[#e0e0e0] shadow-[10px_10px_30px_#bebebe,-10px_-10px_30px_#ffffff] hover:shadow-inner transition-all flex flex-col items-center justify-center gap-3 group relative"
              >
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                  <Clock size={28} />
                </div>
                <span className="text-xl font-black text-gray-800">{t.day} {d}</span>
                <div className="absolute -top-2 -right-2 flex flex-col gap-1">
                  {dayLessonsCount > 0 && (
                    <span className="w-8 h-8 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center shadow-lg border-2 border-white" title={t.lessonsCount}>
                      {dayLessonsCount}
                    </span>
                  )}
                  {dayFlashcardsCount > 0 && (
                    <span className="w-8 h-8 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center shadow-lg border-2 border-white" title={t.flashcardsCount}>
                      {dayFlashcardsCount}
                    </span>
                  )}
                  {dayExercisesCount > 0 && (
                    <span className="w-8 h-8 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center shadow-lg border-2 border-white" title={t.exercisesCount}>
                      {dayExercisesCount}
                    </span>
                  )}
                  {dayQuizzesCount > 0 && (
                    <span className="w-8 h-8 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center shadow-lg border-2 border-white" title={t.quizzesCount}>
                      {dayQuizzesCount}
                    </span>
                  )}
                  {dayVocabularyCount > 0 && (
                    <span className="w-8 h-8 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center shadow-lg border-2 border-white" title={t.vocabularyCount}>
                      {dayVocabularyCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {view === 'content' && (
        <div className="space-y-12">
          <DragDropContext onDragEnd={handleDragEnd}>
          {/* Lessons Section */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">{t.lessons}</h3>
              <Droppable droppableId="lessons-list">
                {(provided) => (
                  <div 
                    {...provided.droppableProps} 
                    ref={provided.innerRef}
                    className="space-y-4"
                  >
                    {lessons
                      .filter(l => l.month === selectedMonth && l.week === selectedWeek && l.day === selectedDay)
                      .map((lesson, index) => (
                        // @ts-ignore
                        <Draggable key={lesson.id} draggableId={lesson.id} index={index}>
                          {(provided: any, snapshot: any) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              style={{
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.8 : 1,
                              }}
                            >
                              <LessonItem
                                lesson={lesson}
                                dragHandleProps={provided.dragHandleProps}
                                onEdit={(l) => {
                                  setEditingLesson(l);
                                  setLessonForm({
                                    title: l.title,
                                    type: l.type,
                                    content: l.content,
                                    month: l.month,
                                    week: l.week,
                                    day: l.day,
                                    displayMode: l.displayMode || 'embed',
                                    duration: l.duration || '',
                                    points: l.points || 10
                                  });
                                  setIsLessonModalOpen(true);
                                }}
                                onPreview={(l) => {
                                  setPreviewLesson(l);
                                  setIsPreviewModalOpen(true);
                                }}
                                onDelete={handleDeleteLesson}
                              />
                            </div>
                          )}
                                                </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
          </div>

          {/* Flashcards Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">{t.flashcards}</h3>
            </div>
            <Droppable droppableId="flashcards-list">
              {(provided) => (
                <div 
                  {...provided.droppableProps} 
                  ref={provided.innerRef}
                  className="space-y-4"
                >
                  {Array.from(new Set(flashcards.filter(f => f.month === selectedMonth && f.week === selectedWeek && f.day === selectedDay).map(f => f.section || t.lessonWords))).map(section => {
                    const sectionFlashcards = flashcards.filter(f => (f.section === section || (!f.section && section === t.lessonWords)) && f.month === selectedMonth && f.week === selectedWeek && f.day === selectedDay);
                    if (sectionFlashcards.length === 0) return null;
                    return (
                      <div key={section} className="space-y-4">
                        <h4 className="font-bold text-gray-700">{section}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {sectionFlashcards.map((f, index) => (
                            <DraggableAny key={f.id} draggableId={f.id} index={index}>
                              {(provided: any, snapshot: any) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{
                                    ...provided.draggableProps.style,
                                    opacity: snapshot.isDragging ? 0.8 : 1,
                                  }}
                                >
                                  <FlashcardItem 
                                    flashcard={f} 
                                    onEdit={handleEditFlashcard}
                                    onDelete={async (id) => {
                                      setConfirmModal({
                                        isOpen: true,
                                        title: t.deleteFlashcardTitle,
                                        message: t.deleteFlashcardMessage,
                                        onConfirm: async () => {
                                          setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                          const path = `flashcards_${language}`;
                                          await deleteDoc(doc(db, path, id));
                                          toast.success(t.deleteSuccess);
                                        }
                                      });
                                    }} 
                                  />
                                </div>
                              )}
                            </DraggableAny>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* Exercises Section */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">{t.exercises}</h3>
            <Droppable droppableId="exercises-list">
              {(provided) => (
                <div 
                  {...provided.droppableProps} 
                  ref={provided.innerRef}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {exercises
                    .filter(e => e.month === selectedMonth && e.week === selectedWeek && e.day === selectedDay)
                    .map((e, index) => (
                      <DraggableAny key={e.id} draggableId={e.id} index={index}>
                        {(provided: any, snapshot: any) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.8 : 1,
                            }}
                          >
                            <ExerciseItem 
                              exercise={e} 
                              onEdit={handleEditExercise}
                              onPreview={(ex) => {
                                setPreviewExercise(ex);
                                setIsPreviewExerciseModalOpen(true);
                              }}
                              onDelete={handleDeleteExercise}
                            />
                          </div>
                        )}
                      </DraggableAny>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* Quizzes Section */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">{t.quizzesCount.split(':')[0]}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allQuizzes
                .filter(q => q.month === selectedMonth && q.week === selectedWeek && q.day === selectedDay)
                .map((q) => (
                  <div key={q.id} className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                        <BrainCircuit size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 line-clamp-1">{q.question}</h4>
                        <p className="text-xs text-gray-400">{q.level} • {q.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          // Navigate to Quizzes tab or open modal
                          toast(t.goToQuizzes, { icon: 'ℹ️' });
                        }}
                        className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              {allQuizzes.filter(q => q.month === selectedMonth && q.week === selectedWeek && q.day === selectedDay).length === 0 && (
                <div className="col-span-full py-8 text-center border-2 border-dashed border-gray-200 rounded-2xl text-gray-400">
                  {t.noQuizzes}
                </div>
              )}
            </div>
          </div>

          {/* Vocabulary Section */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">{t.vocabularyCount.split(':')[0]}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allVocabulary
                .filter(v => v.month === selectedMonth && v.week === selectedWeek && v.day === selectedDay)
                .map((v) => (
                  <div key={v.id} className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center gap-3">
                    {v.imageUrl ? (
                      <img src={v.imageUrl} alt={v.word} className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <Languages size={20} />
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-gray-800">{v.word}</h4>
                      <p className="text-xs text-indigo-600 font-bold">{v.translation}</p>
                    </div>
                  </div>
                ))}
              {allVocabulary.filter(v => v.month === selectedMonth && v.week === selectedWeek && v.day === selectedDay).length === 0 && (
                <div className="col-span-full py-8 text-center border-2 border-dashed border-gray-200 rounded-2xl text-gray-400">
                  {t.noVocabulary}
                </div>
              )}
            </div>
          </div>
        </DragDropContext>
      </div>
    )}

      {/* Course Modal - REMOVED as per user request */}

      {/* Lesson Modal */}
      <LessonModal
        isOpen={isLessonModalOpen}
        onClose={() => setIsLessonModalOpen(false)}
        onSave={handleSaveLesson}
        formData={lessonForm}
        setFormData={setLessonForm}
        title={editingLesson ? t.editLesson : t.addLesson}
        isSaving={isSaving}
      />

      <FlashcardModal
        isOpen={isFlashcardModalOpen}
        onClose={() => {
          setIsFlashcardModalOpen(false);
          setEditingFlashcard(null);
        }}
        onSave={handleSaveFlashcard}
        formData={flashcardForm}
        setFormData={setFlashcardForm}
        title={editingFlashcard ? t.editFlashcard : t.addFlashcardNew}
        isSaving={isSaving}
      />

      <ExerciseModal
        isOpen={isExerciseModalOpen}
        onClose={() => {
          setIsExerciseModalOpen(false);
          setEditingExercise(null);
        }}
        onSave={handleSaveExercise}
        formData={exerciseForm}
        setFormData={setExerciseForm}
        title={editingExercise ? t.editExercise : t.addExerciseNew}
        isSaving={isSaving}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Preview Modal */}
      <AnimatePresence>
        {isPreviewModalOpen && previewLesson && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-4xl bg-white rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b flex items-center justify-between bg-gray-50">
                <h3 className="text-xl font-bold text-gray-900">{t.previewLessonTitle}: {previewLesson.title}</h3>
                <button 
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-gray-200 text-gray-500 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8">
                {previewLesson.type === 'video' && (
                  <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-lg relative group">
                    {previewLesson.content.includes('youtube.com') || previewLesson.content.includes('youtu.be') ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${previewLesson.content.split('v=')[1]?.split('&')[0] || previewLesson.content.split('/').pop()}`}
                        className="w-full h-full"
                        allowFullScreen
                      />
                    ) : (
                      <video 
                        src={previewLesson.content} 
                        controls 
                        className="w-full h-full" 
                        controlsList="nodownload"
                      />
                    )}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          const videoElement = document.querySelector('video') || document.querySelector('iframe');
                          if (videoElement) {
                            videoElement.requestFullscreen();
                          }
                        }}
                        className="p-2 bg-white/80 rounded-full hover:bg-white"
                        title={t.zoom}
                      >
                        <ExternalLink className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
                {previewLesson.type === 'file' && (
                  <div className="h-[600px] rounded-2xl overflow-hidden border shadow-inner">
                    <iframe src={previewLesson.content} className="w-full h-full" />
                  </div>
                )}
                {previewLesson.type === 'text' && (
                  <div className="prose prose-lg max-w-none bg-gray-50 p-8 rounded-2xl shadow-inner whitespace-pre-wrap font-medium text-gray-700 leading-relaxed">
                    {previewLesson.content}
                  </div>
                )}
                {previewLesson.type === 'task' && (
                  <div className="bg-purple-50 p-8 rounded-2xl border-2 border-dashed border-purple-200 text-center">
                    <CircleCheck className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                    <h4 className="text-2xl font-bold text-purple-900 mb-2">{t.learningTask}</h4>
                    <p className="text-purple-700 text-lg">{previewLesson.content}</p>
                  </div>
                )}
              </div>
              <div className="p-6 bg-gray-50 border-t flex justify-end">
                <button 
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="px-8 py-3 rounded-2xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors"
                >
                  {t.closePreview}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Exercise Preview Modal */}
      <AnimatePresence>
        {isPreviewExerciseModalOpen && previewExercise && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-2xl bg-white rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b flex items-center justify-between bg-gray-50">
                <h3 className="text-xl font-bold text-gray-900">{t.previewExerciseTitle}: {previewExercise.title}</h3>
                <button 
                  onClick={() => setIsPreviewExerciseModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-gray-200 text-gray-500 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8">
                <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
                      <Brain size={20} />
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block">{t.exerciseType}</span>
                      <span className="font-bold text-gray-900">
                        {previewExercise.type === 'MATCH_WORD_TRANSLATION' && t.matchWordTranslation}
                        {previewExercise.type === 'MATCH_IMAGE_WORD' && t.matchImageWord}
                        {previewExercise.type === 'CONSTRUCT_WORD' && t.constructWord}
                        {previewExercise.type === 'TRUE_FALSE_IMAGE' && t.trueFalseImage}
                        {previewExercise.type === 'LISTEN_CONSTRUCT_WORD' && t.listenConstructWord}
                        {previewExercise.type === 'LISTEN_CHOOSE_IMAGE' && t.listenChooseImage}
                        {previewExercise.type === 'CHOOSE_WORD_TRANSLATION' && t.chooseWordTranslation}
                        {previewExercise.type === 'LISTEN_TRUE_FALSE' && t.listenTrueFalse}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {(previewExercise.type === 'MATCH_WORD_TRANSLATION' || previewExercise.type === 'MATCH_IMAGE_WORD') && (
                    <div className="grid grid-cols-2 gap-4">
                      {previewExercise.content.pairs?.map((pair: any, idx: number) => (
                        <React.Fragment key={idx}>
                          <div className="p-4 rounded-2xl bg-white border-2 border-dashed border-gray-200 text-center font-bold flex flex-col items-center gap-2">
                            {pair.left}
                          </div>
                          <div className="p-4 rounded-2xl bg-white border-2 border-dashed border-gray-200 text-center font-bold flex flex-col items-center gap-2">
                            {pair.image && <img src={pair.image} alt="" className="w-12 h-12 object-cover rounded-lg" referrerPolicy="no-referrer" />}
                            {pair.right}
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  )}

                  {(previewExercise.type === 'CONSTRUCT_WORD' || previewExercise.type === 'LISTEN_CONSTRUCT_WORD') && (
                    <div className="space-y-6 text-center">
                      {previewExercise.type === 'LISTEN_CONSTRUCT_WORD' && (
                        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner mb-4">
                          <Volume2 size={32} />
                        </div>
                      )}
                      <div className="flex justify-center gap-2">
                        {previewExercise.content.word?.split('').map((_: string, idx: number) => (
                          <div key={idx} className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-300 bg-white" />
                        ))}
                      </div>
                      <div className="flex flex-wrap justify-center gap-2">
                        {previewExercise.content.word?.split('').sort(() => Math.random() - 0.5).map((char: string, idx: number) => (
                          <div key={idx} className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold text-lg border border-gray-100">
                            {char}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(previewExercise.type === 'TRUE_FALSE_IMAGE' || previewExercise.type === 'LISTEN_TRUE_FALSE') && (
                    <div className="space-y-6 text-center">
                      {previewExercise.type === 'LISTEN_TRUE_FALSE' && (
                        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner mb-4">
                          <Volume2 size={32} />
                        </div>
                      )}
                      {previewExercise.content.imageUrl && (
                        <img src={previewExercise.content.imageUrl} alt="" className="max-w-xs mx-auto rounded-2xl shadow-md mb-4" referrerPolicy="no-referrer" />
                      )}
                      <p className="text-2xl font-bold text-gray-900">{previewExercise.content.word}</p>
                      <div className="flex gap-4 justify-center pt-4">
                        <div className={`px-8 py-4 rounded-2xl border-2 font-bold ${previewExercise.content.correctAnswer === true ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-gray-400 border-gray-100'}`}>{t.true}</div>
                        <div className={`px-8 py-4 rounded-2xl border-2 font-bold ${previewExercise.content.correctAnswer === false ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-400 border-gray-100'}`}>{t.false}</div>
                      </div>
                    </div>
                  )}

                  {(previewExercise.type === 'LISTEN_CHOOSE_IMAGE' || previewExercise.type === 'CHOOSE_WORD_TRANSLATION') && (
                    <div className="space-y-6">
                      {previewExercise.type === 'LISTEN_CHOOSE_IMAGE' && (
                        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner mb-4">
                          <Volume2 size={32} />
                        </div>
                      )}
                      {previewExercise.type === 'CHOOSE_WORD_TRANSLATION' && (
                        <p className="text-2xl font-bold text-gray-900 text-center mb-4">{previewExercise.content.word}</p>
                      )}
                      <div className="grid grid-cols-1 gap-3">
                        {previewExercise.content.options?.map((opt: any, idx: number) => (
                          <div key={idx} className={`p-4 rounded-2xl bg-white border-2 font-bold text-center flex items-center justify-center gap-4 ${opt.isCorrect ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100'}`}>
                            {opt.image && <img src={opt.image} alt="" className="w-12 h-12 object-cover rounded-lg" referrerPolicy="no-referrer" />}
                            {opt.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 bg-gray-50 border-t flex justify-end">
                <button 
                  onClick={() => setIsPreviewExerciseModalOpen(false)}
                  className="px-8 py-3 rounded-2xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors"
                >
                  {t.closePreview}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminLearning;
