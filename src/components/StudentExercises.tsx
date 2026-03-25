import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Volume2, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  CircleCheck, 
  Trophy,
  Info,
  Play,
  Pause,
  Brain,
  Check,
  CircleAlert
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Exercise, ExerciseType } from '../types';
import { getDirectLink } from '../constants.tsx';
import toast from 'react-hot-toast';

interface StudentExercisesProps {
  language: 'german' | 'english';
  month: number;
  week: number;
  day: number;
  level: string;
  onClose: () => void;
  onComplete?: (score: number, total: number) => void;
}

const StudentExercises: React.FC<StudentExercisesProps> = ({ language, month, week, day, level, onClose, onComplete }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [userAnswer, setUserAnswer] = useState<any>(null);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [shuffledRight, setShuffledRight] = useState<any[]>([]);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (exercises[currentIndex]) {
      const currentEx = exercises[currentIndex];
      if (currentEx.type === 'CONSTRUCT_WORD' || currentEx.type === 'LISTEN_CONSTRUCT_WORD') {
        const letters = currentEx.content.letters || currentEx.content.word?.split('').sort(() => Math.random() - 0.5) || [];
        setExercises(prev => {
          const newExs = [...prev];
          if (!newExs[currentIndex].content.letters) {
            newExs[currentIndex].content.letters = letters;
          }
          return newExs;
        });
      }
      if (currentEx.type === 'MATCH_WORD_TRANSLATION' || currentEx.type === 'MATCH_IMAGE_WORD') {
        const rightSide = [...(currentEx.content.pairs || [])].sort(() => Math.random() - 0.5);
        setShuffledRight(rightSide);
      }
    }
  }, [currentIndex, exercises.length]);

  useEffect(() => {
    const fetchExercises = async () => {
      const collectionName = `exercises_${language}`;
      try {
        const q = query(
          collection(db, collectionName),
          where('month', '==', month),
          where('week', '==', week),
          where('day', '==', day)
        );
        const querySnapshot = await getDocs(q);
        const exData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exercise)).filter(doc => (doc.level || 'A1') === level);
        setExercises(exData);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, collectionName);
        console.error('Error fetching exercises:', error);
        toast.error('خطأ في تحميل التمارين');
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [month, week, day, level, language]);

  const playAudio = useCallback((url: string | undefined) => {
    if (!url) return;
    const directUrl = getDirectLink(url);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current.load();
    }

    const newAudio = new Audio(directUrl);
    audioRef.current = newAudio;
    
    newAudio.onplay = () => setIsPlaying(true);
    newAudio.onended = () => setIsPlaying(false);
    newAudio.onerror = () => {
      setIsPlaying(false);
      toast.error('خطأ في تشغيل الصوت');
    };

    newAudio.play().catch(e => {
      console.error("Error playing audio:", e);
      setIsPlaying(false);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (exercises.length > 0 && currentIndex < exercises.length) {
      const currentEx = exercises[currentIndex];
      if (currentEx.type === 'CONSTRUCT_WORD' || currentEx.type === 'LISTEN_CONSTRUCT_WORD') {
        setUserAnswer([]);
      } else {
        setUserAnswer(null);
      }
      setShowFeedback(null);
      setSelectedLeft(null);
      setMatches({});
    }
  }, [currentIndex, exercises]);

  const handleNext = (finalScore?: number) => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowFeedback(null);
      setUserAnswer(null);
      setSelectedLeft(null);
      setMatches({});
    } else {
      setIsCompleted(true);
      if (onComplete) {
        onComplete(finalScore !== undefined ? finalScore : score, exercises.length);
      }
    }
  };

  const handleMatch = (leftId: string, rightId: string) => {
    const currentEx = exercises[currentIndex];
    const pair = currentEx.content.pairs?.find(p => p.id === leftId);
    
    if (pair && pair.id === rightId) {
      const newMatches = { ...matches, [leftId]: rightId };
      setMatches(newMatches);
      setSelectedLeft(null);
      
      if (Object.keys(newMatches).length === (currentEx.content.pairs?.length || 0)) {
        setScore(prev => prev + 1);
        setShowFeedback('correct');
        toast.success('أحسنت! تم التوصيل بنجاح');
        setTimeout(() => handleNext(score + 1), 1500);
      }
    } else {
      toast.error('توصيل خاطئ، حاول مرة أخرى');
      setSelectedLeft(null);
    }
  };

  const checkAnswer = (answer: any) => {
    const currentEx = exercises[currentIndex];
    let isCorrect = false;

    switch (currentEx.type) {
      case 'MATCH_WORD_TRANSLATION':
      case 'MATCH_IMAGE_WORD':
        isCorrect = answer === currentEx.content.correctAnswer;
        break;
      case 'CONSTRUCT_WORD':
      case 'LISTEN_CONSTRUCT_WORD':
        isCorrect = (Array.isArray(answer) ? answer.join('') : answer) === currentEx.content.word;
        break;
      case 'TRUE_FALSE_IMAGE':
      case 'LISTEN_TRUE_FALSE':
      case 'TRUE_FALSE':
        isCorrect = answer === currentEx.content.correctAnswer;
        break;
      case 'CHOOSE_WORD_TRANSLATION':
      case 'LISTEN_CHOOSE_IMAGE':
      case 'MULTIPLE_CHOICE':
      case 'LISTEN_CHOOSE_WORD':
        isCorrect = answer === currentEx.content.correctAnswer;
        break;
      default:
        isCorrect = answer === currentEx.content.correctAnswer;
    }

    if (isCorrect) {
      setShowFeedback('correct');
      setScore(prev => prev + 1);
      toast.success('إجابة صحيحة!');
      setTimeout(() => handleNext(score + 1), 1500);
    } else {
      setShowFeedback('incorrect');
      toast.error('إجابة خاطئة، حاول مرة أخرى');
    }
  };

  const currentEx = exercises[currentIndex];

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-md flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#4db6ac] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-bold">جاري تحميل التمارين...</p>
        </div>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-md flex items-center justify-center p-6">
        <div className="bg-white rounded-[40px] p-10 shadow-2xl text-center max-w-md w-full border-2 border-slate-100">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
            <Info size={40} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-4">لا توجد تمارين</h3>
          <p className="text-slate-500 mb-8 font-medium">لم يتم إضافة تمارين تعليمية لهذا اليوم بعد.</p>
          <button onClick={onClose} className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl shadow-lg">
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#f8fafc] flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-[40px] p-8 sm:p-12 shadow-2xl text-center max-w-md w-full border-2 border-emerald-50"
        >
          <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-500 shadow-inner">
            <Trophy size={48} />
          </div>
          <h3 className="text-3xl font-black text-slate-800 mb-4">أحسنت!</h3>
          <p className="text-slate-500 mb-2 text-lg font-medium">لقد أكملت جميع تمارين اليوم بنجاح.</p>
          <div className="flex flex-col items-center gap-2 mb-10">
            <p className="text-[#4db6ac] text-2xl font-black">النتيجة: {score} / {exercises.length}</p>
            <div className="flex items-center gap-2 bg-amber-50 px-6 py-3 rounded-[24px] border-2 border-amber-100 shadow-sm">
              <Trophy size={24} className="text-amber-500" />
              <span className="text-2xl font-black text-amber-600">+{score * 10} نقطة</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => {
                setCurrentIndex(0);
                setIsCompleted(false);
                setScore(0);
                setShowFeedback(null);
                setUserAnswer(null);
              }}
              className="py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
            >
              <RotateCcw size={20} />
              إعادة
            </button>
            <button 
              onClick={onClose}
              className="py-4 bg-[#4db6ac] text-white font-bold rounded-2xl shadow-lg shadow-[#4db6ac]/20 hover:scale-105 transition-transform"
            >
              إنهاء
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const renderExerciseContent = () => {
    switch (currentEx.type) {
      case 'CHOOSE_WORD_TRANSLATION':
      case 'LISTEN_CHOOSE_IMAGE':
      case 'MULTIPLE_CHOICE':
      case 'LISTEN_CHOOSE_WORD':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-3xl">
            {currentEx.content.options?.map((option: any, index: number) => {
              const optionId = typeof option === 'string' ? option : option.id;
              const optionText = typeof option === 'string' ? option : option.text;
              const optionImage = typeof option === 'string' ? null : option.image;
              const isCorrect = typeof option === 'string' ? option === currentEx.content.correctAnswer : option.isCorrect;

              return (
                <motion.button
                  key={optionId || index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => !showFeedback && checkAnswer(optionId)}
                  className={`p-6 sm:p-8 rounded-[32px] bg-white shadow-lg border-4 transition-all flex flex-col items-center gap-4 text-center relative overflow-hidden ${
                    showFeedback === 'correct' && (optionId === currentEx.content.correctAnswer) ? 'border-emerald-500 bg-emerald-50' :
                    showFeedback === 'incorrect' && userAnswer === optionId ? 'border-red-500 bg-red-50' :
                    'border-transparent hover:border-[#4db6ac]'
                  }`}
                >
                  {optionImage && (
                    <div className="w-full aspect-square rounded-2xl overflow-hidden mb-2">
                      <img src={optionImage} alt={optionText} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <span className="text-xl sm:text-2xl font-black text-slate-700">{optionText}</span>
                  {showFeedback === 'correct' && (optionId === currentEx.content.correctAnswer) && (
                    <div className="absolute top-2 left-2 text-emerald-500">
                      <CircleCheck size={24} />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        );

      case 'TRUE_FALSE_IMAGE':
      case 'LISTEN_TRUE_FALSE':
        return (
          <div className="flex flex-col items-center gap-8 w-full max-w-lg">
            {currentEx.content.imageUrl && (
              <div className="w-full aspect-square max-w-[300px] rounded-[40px] overflow-hidden shadow-2xl border-8 border-white">
                <img src={currentEx.content.imageUrl} alt="Exercise" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-6 w-full">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => !showFeedback && checkAnswer(true)}
                className={`p-8 rounded-[32px] bg-white shadow-xl border-4 flex flex-col items-center gap-4 transition-all ${
                  showFeedback === 'correct' && currentEx.content.correctAnswer === true ? 'border-emerald-500 bg-emerald-50 text-emerald-500' :
                  showFeedback === 'incorrect' && userAnswer === true ? 'border-red-500 bg-red-50 text-red-500' :
                  'border-transparent text-emerald-500 hover:border-emerald-500'
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Check size={40} />
                </div>
                <span className="text-2xl font-black">صح</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => !showFeedback && checkAnswer(false)}
                className={`p-8 rounded-[32px] bg-white shadow-xl border-4 flex flex-col items-center gap-4 transition-all ${
                  showFeedback === 'correct' && currentEx.content.correctAnswer === false ? 'border-emerald-500 bg-emerald-50 text-emerald-500' :
                  showFeedback === 'incorrect' && userAnswer === false ? 'border-red-500 bg-red-50 text-red-500' :
                  'border-transparent text-red-500 hover:border-red-500'
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                  <X size={40} />
                </div>
                <span className="text-2xl font-black">خطأ</span>
              </motion.button>
            </div>
          </div>
        );

      case 'CONSTRUCT_WORD':
      case 'LISTEN_CONSTRUCT_WORD':
        return (
          <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
            <div className="flex flex-wrap justify-center gap-3 min-h-[80px] p-6 bg-slate-100/50 rounded-[32px] w-full border-4 border-dashed border-slate-200 shadow-inner">
              <AnimatePresence>
                {userAnswer?.map((letter: string, i: number) => (
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    key={`${letter}-${i}`}
                    onClick={() => {
                      const newAnswer = [...userAnswer];
                      newAnswer.splice(i, 1);
                      setUserAnswer(newAnswer);
                    }}
                    className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-2xl shadow-md flex items-center justify-center text-2xl sm:text-3xl font-black text-[#4db6ac] border-2 border-transparent hover:border-red-200 hover:text-red-400 transition-all"
                  >
                    {letter}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {currentEx.content.letters?.map((letter, i) => (
                <motion.button
                  whileHover={{ scale: 1.1, y: -5 }}
                  whileTap={{ scale: 0.9 }}
                  key={i}
                  onClick={() => setUserAnswer([...(userAnswer || []), letter])}
                  className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center text-2xl sm:text-3xl font-black text-slate-700 hover:bg-[#4db6ac] hover:text-white transition-all border-2 border-slate-100"
                >
                  {letter}
                </motion.button>
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => checkAnswer(userAnswer?.join(''))}
              className="mt-4 px-16 py-5 bg-[#4db6ac] text-white font-black text-xl rounded-[24px] shadow-[0_15px_30px_rgba(77,182,172,0.3)] hover:shadow-[0_20px_40px_rgba(77,182,172,0.4)] transition-all"
            >
              تحقق من الإجابة
            </motion.button>
          </div>
        );

      case 'MATCH_WORD_TRANSLATION':
      case 'MATCH_IMAGE_WORD':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-3xl">
            <div className="space-y-4">
              {currentEx.content.pairs?.map((pair) => (
                <motion.button
                  key={pair.id}
                  whileHover={!matches[pair.id] ? { scale: 1.02 } : {}}
                  disabled={!!matches[pair.id]}
                  onClick={() => setSelectedLeft(pair.id)}
                  className={`w-full p-5 rounded-2xl shadow-md border-4 transition-all text-right font-black text-lg sm:text-xl ${
                    matches[pair.id] ? 'bg-emerald-50 border-emerald-200 text-emerald-600 opacity-60' :
                    selectedLeft === pair.id ? 'bg-[#4db6ac]/10 border-[#4db6ac] text-[#4db6ac] ring-4 ring-[#4db6ac]/20' :
                    'bg-white border-transparent hover:border-[#4db6ac] text-slate-700'
                  }`}
                >
                  {pair.left}
                </motion.button>
              ))}
            </div>
            <div className="space-y-4">
              {shuffledRight.map((pair) => (
                <motion.button
                  key={pair.id}
                  whileHover={!Object.values(matches).includes(pair.id) ? { scale: 1.02 } : {}}
                  disabled={Object.values(matches).includes(pair.id)}
                  onClick={() => selectedLeft && handleMatch(selectedLeft, pair.id)}
                  className={`w-full p-5 rounded-2xl shadow-md border-4 transition-all text-right font-black text-lg sm:text-xl flex items-center justify-between gap-4 ${
                    Object.values(matches).includes(pair.id) ? 'bg-emerald-50 border-emerald-200 text-emerald-600 opacity-60' :
                    'bg-white border-transparent hover:border-[#4db6ac] text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {pair.image && <img src={pair.image} alt="" className="w-12 h-12 object-cover rounded-xl shadow-sm" referrerPolicy="no-referrer" />}
                    <span>{pair.right}</span>
                  </div>
                  {Object.values(matches).includes(pair.id) && <CircleCheck size={24} className="text-emerald-500" />}
                </motion.button>
              ))}
            </div>
            <p className="col-span-full text-center text-slate-400 font-black text-sm uppercase tracking-widest mt-4">اختر الكلمة من اليمين وما يقابلها من اليسار</p>
          </div>
        );

      default:
        return <p>نوع التمرين غير مدعوم حالياً</p>;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#f8fafc] flex flex-col overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="p-4 sm:p-6 flex items-center justify-between bg-white/50 backdrop-blur-sm border-b border-slate-100">
        <button 
          onClick={onClose}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white shadow-md flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
        >
          <X size={24} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-1">النقاط</span>
          <div className="flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
            <Trophy size={14} className="text-amber-500" />
            <span className="text-sm font-black text-amber-600">{score * 10}</span>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-1">التقدم</span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-24 sm:w-32 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <motion.div 
                className="h-full bg-[#4db6ac]"
                initial={{ width: 0 }}
                animate={{ width: `${((currentIndex + 1) / exercises.length) * 100}%` }}
              />
            </div>
            <span className="text-[10px] sm:text-xs font-black text-[#4db6ac]">{currentIndex + 1} / {exercises.length}</span>
          </div>
        </div>
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white shadow-md flex items-center justify-center text-[#4db6ac]">
          <Brain size={24} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-4xl flex flex-col items-center gap-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl sm:text-5xl font-black text-slate-800">{currentEx.title}</h2>
            {currentEx.content.audioUrl && (
              <button
                onClick={() => playAudio(currentEx.content.audioUrl)}
                className="p-4 rounded-full bg-slate-100 text-[#4db6ac] hover:bg-slate-200 transition-colors mx-auto block"
              >
                <Volume2 size={32} />
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentEx.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full flex flex-col items-center"
            >
              {renderExerciseContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 bg-white border-t border-slate-100 flex justify-center">
        <p className="text-slate-400 font-bold text-sm">أجب على السؤال للانتقال للتالي</p>
      </div>
    </div>
  );
};

export default StudentExercises;
