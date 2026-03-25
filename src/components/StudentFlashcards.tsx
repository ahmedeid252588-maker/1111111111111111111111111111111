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
  Turtle,
  Bookmark
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Flashcard } from '../types';
import { getDirectLink } from '../constants.tsx';
import { generateSpeech, playPcmAudio, stopPcmAudio } from '../services/ttsService';
import toast from 'react-hot-toast';

interface StudentFlashcardsProps {
  language: 'german' | 'english';
  month: number;
  week: number;
  day: number;
  level: string;
  onClose: () => void;
  onComplete?: () => void;
}

const StudentFlashcards: React.FC<StudentFlashcardsProps> = ({ language, month, week, day, level, onClose, onComplete }) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const fetchFlashcards = useCallback(async () => {
    const collectionName = `flashcards_${language}`;
    try {
      setLoading(true);
      const q = query(
        collection(db, collectionName),
        where('month', '==', month),
        where('week', '==', week),
        where('day', '==', day)
      );
      const querySnapshot = await getDocs(q);
      const cards = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flashcard)).filter(doc => (doc.level || 'A1') === level);
      setFlashcards(cards);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, collectionName);
      console.error('Error fetching flashcards:', error);
      toast.error('خطأ في تحميل البطاقات');
    } finally {
      setLoading(false);
    }
  }, [month, week, day, level, language]);

  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  const playAudio = useCallback(async (url: string | undefined, text: string, speed: number = 1) => {
    // Cleanup previous audio if any
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current.load();
    }

    // Try Gemini TTS for "human-like" voice if requested or if URL is missing
    setIsLoadingAudio(true);
    try {
      const audioData = await generateSpeech(text, language);
      if (audioData) {
        setIsPlaying(true);
        await playPcmAudio(audioData, 24000, speed);
        setIsPlaying(false);
      } else if (url) {
        // Fallback to provided URL
        const directUrl = getDirectLink(url);
        const newAudio = new Audio(directUrl);
        newAudio.playbackRate = speed;
        audioRef.current = newAudio;
        newAudio.onplay = () => setIsPlaying(true);
        newAudio.onended = () => setIsPlaying(false);
        await newAudio.play();
      } else {
        toast.error('الصوت غير متاح');
      }
    } catch (err) {
      console.error('Playback failed:', err);
      setIsPlaying(false);
      toast.error('فشل تشغيل الصوت');
    } finally {
      setIsLoadingAudio(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPcmAudio();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleNext = () => {
    stopPcmAudio();
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      setIsCompleted(true);
      if (onComplete) {
        onComplete();
      }
    }
  };

  const handlePrevious = () => {
    stopPcmAudio();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const currentCard = flashcards[currentIndex];

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-md flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#4db6ac] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-bold">جاري تحميل البطاقات...</p>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-md flex items-center justify-center p-6">
        <div className="bg-white rounded-[40px] p-10 shadow-2xl text-center max-w-md w-full border-2 border-slate-100">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
            <Info size={40} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-4">لا توجد بطاقات</h3>
          <p className="text-slate-500 mb-8 font-medium">لم يتم إضافة بطاقات تعليمية لهذا اليوم بعد.</p>
          
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
          <p className="text-slate-500 mb-10 text-lg font-medium">لقد أكملت جميع بطاقات اليوم بنجاح.</p>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => {
                setCurrentIndex(0);
                setIsCompleted(false);
                setIsFlipped(false);
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
          <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-1">التقدم</span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-24 sm:w-32 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <motion.div 
                className="h-full bg-[#4db6ac]"
                initial={{ width: 0 }}
                animate={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
              />
            </div>
            <span className="text-[10px] sm:text-xs font-black text-[#4db6ac]">{currentIndex + 1} / {flashcards.length}</span>
          </div>
        </div>
        <button 
          onClick={() => setIsBookmarked(!isBookmarked)}
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white shadow-md flex items-center justify-center transition-colors ${isBookmarked ? 'text-yellow-500' : 'text-slate-300'}`}
        >
          <Bookmark size={24} fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl perspective-1000 aspect-[3/4] sm:aspect-[4/5] max-h-[70vh]">
          <motion.div
            className="relative w-full h-full transition-all duration-700 preserve-3d cursor-pointer"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {/* Front Side */}
            <div className="absolute inset-0 backface-hidden bg-white rounded-[32px] sm:rounded-[48px] shadow-[0_40px_80px_rgba(0,0,0,0.08)] border border-slate-100 p-6 sm:p-8 flex flex-col items-center justify-between gap-4 overflow-hidden">
              {/* Decorative background element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#4db6ac]/5 rounded-bl-[100px] -mr-10 -mt-10" />
              
              {currentCard.imageUrl && (currentCard.type === 'word' || currentCard.type === 'both' || !currentCard.type) && (
                <div className="w-full aspect-video rounded-[24px] sm:rounded-[40px] overflow-hidden bg-slate-50 relative group shadow-inner">
                  <img 
                    src={currentCard.imageUrl} 
                    alt={currentCard.word}
                    className="w-full h-full object-contain transition-transform duration-1000 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}

              <div className="text-center flex-1 flex flex-col justify-center gap-2 sm:gap-4 w-full relative z-10">
                <div className="space-y-1 sm:space-y-2">
                  {(currentCard.type === 'word' || currentCard.type === 'both' || !currentCard.type) && (
                    <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-800 tracking-tight drop-shadow-sm">
                      {currentCard.word}
                    </h2>
                  )}
                  {currentCard.type === 'sentence' && (
                    <div className="p-4 sm:p-6 bg-slate-50 rounded-[24px] border-2 border-dashed border-slate-200">
                      <p className="text-xl sm:text-3xl font-bold text-slate-700 leading-relaxed max-w-2xl mx-auto" dir="ltr">
                        "{currentCard.sentence}"
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-2">
                    <span className="h-px w-8 bg-slate-200" />
                    <p className="text-[#4db6ac] font-black text-[10px] sm:text-sm uppercase tracking-[0.2em]">{currentCard.section || 'Vocabulary'}</p>
                    <span className="h-px w-8 bg-slate-200" />
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-3 sm:gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    disabled={isLoadingAudio}
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudio(currentCard.audioUrl, currentCard.word, 1);
                    }}
                    className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#4db6ac] text-white flex items-center justify-center shadow-[0_10px_20px_rgba(77,182,172,0.3)] hover:shadow-[0_15px_30px_rgba(77,182,172,0.4)] transition-all ${isLoadingAudio ? 'opacity-70 cursor-wait' : ''}`}
                  >
                    {isLoadingAudio ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : isPlaying ? (
                      <Pause size={24} className="sm:w-8 sm:h-8" />
                    ) : (
                      <Volume2 size={24} className="sm:w-8 sm:h-8" />
                    )}
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudio(currentCard.audioUrl, currentCard.word, 0.6);
                    }}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors shadow-sm"
                    title="Slow speed"
                  >
                    <Turtle size={20} className="sm:w-6 sm:h-6" />
                  </motion.button>
                </div>
              </div>

              <div className="text-slate-300 font-bold text-[9px] sm:text-xs uppercase tracking-widest flex items-center gap-2 animate-pulse">
                <RotateCcw size={10} className="sm:w-3 sm:h-3" />
                انقر لرؤية الترجمة
              </div>
            </div>

            {/* Back Side */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-[#4db6ac] to-[#3d968d] rounded-[32px] sm:rounded-[48px] shadow-[0_40px_80px_rgba(77,182,172,0.3)] p-6 sm:p-8 flex flex-col items-center justify-center text-white overflow-hidden">
              {/* Decorative background elements */}
              <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-black/10 rounded-full blur-3xl" />

              <div className="text-center space-y-4 sm:space-y-6 w-full relative z-10 overflow-y-auto max-h-full py-4">
                {(currentCard.type === 'word' || currentCard.type === 'both' || !currentCard.type) && (
                  <div className="space-y-2 sm:space-y-3">
                    <span className="text-white/70 font-black text-[10px] sm:text-sm uppercase tracking-[0.3em]">الترجمة العربية</span>
                    <h3 className="text-3xl sm:text-5xl font-black text-white drop-shadow-lg">{currentCard.translation}</h3>
                  </div>
                )}

                {(currentCard.type === 'both' || currentCard.type === 'sentence') && currentCard.sentence && (
                  <div className={`pt-4 sm:pt-6 ${currentCard.type === 'both' ? 'border-t border-white/20' : ''} max-w-2xl mx-auto w-full`}>
                    <span className="text-white/70 font-black text-[10px] sm:text-sm uppercase tracking-[0.3em] block mb-2 sm:mb-4">مثال توضيحي</span>
                    <div className="bg-white/10 backdrop-blur-md rounded-[24px] p-4 sm:p-6 border border-white/20 shadow-xl mb-4 sm:mb-6">
                      <p className="text-lg sm:text-2xl font-bold text-white leading-relaxed mb-2 sm:mb-3" dir="ltr">
                        "{currentCard.sentence}"
                      </p>
                      {currentCard.sentenceTranslation && (
                        <p className="text-white/90 text-sm sm:text-xl font-medium italic">
                          {currentCard.sentenceTranslation}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex justify-center gap-3 sm:gap-4">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={isLoadingAudio}
                        onClick={(e) => {
                          e.stopPropagation();
                          playAudio(currentCard.sentenceAudioUrl || currentCard.audioUrl, currentCard.sentence || '', 1);
                        }}
                        className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-white text-[#4db6ac] font-black hover:bg-emerald-50 transition-all shadow-xl text-[12px] sm:text-base ${isLoadingAudio ? 'opacity-70' : ''}`}
                      >
                        {isLoadingAudio ? (
                          <div className="w-4 h-4 border-2 border-[#4db6ac] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Volume2 size={18} className="sm:w-5 sm:h-5" />
                        )}
                        <span>{isLoadingAudio ? 'جاري التحميل...' : 'استماع'}</span>
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          playAudio(currentCard.sentenceAudioUrl || currentCard.audioUrl, currentCard.sentence || '', 0.6);
                        }}
                        className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-white/20 text-white font-black hover:bg-white/30 transition-all shadow-xl text-[12px] sm:text-base"
                      >
                        <Turtle size={18} className="sm:w-5 sm:h-5" />
                        <span>بطيء</span>
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>

              <div className="absolute bottom-4 sm:bottom-6 text-white/50 font-bold text-[9px] sm:text-xs uppercase tracking-widest flex items-center gap-2">
                <RotateCcw size={10} className="sm:w-3 sm:h-3" />
                انقر للعودة للكلمة
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="bg-white p-6 sm:p-12 flex items-center justify-center gap-4 sm:gap-8 border-t border-slate-100 relative z-10">
        <button 
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className={`w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all ${currentIndex === 0 ? 'bg-slate-50 text-slate-200' : 'bg-white border-2 border-slate-100 text-slate-600 hover:border-[#4db6ac] hover:text-[#4db6ac] shadow-sm'}`}
        >
          <ChevronRight size={28} className="sm:w-10 sm:h-10" />
        </button>

        <button 
          onClick={handleNext}
          className="flex-1 max-w-sm h-14 sm:h-20 bg-[#4db6ac] text-white rounded-[20px] sm:rounded-[32px] font-black text-lg sm:text-2xl shadow-[0_15px_30px_rgba(77,182,172,0.3)] hover:translate-y-[-4px] active:translate-y-[2px] transition-all flex items-center justify-center gap-2 sm:gap-4"
        >
          {currentIndex === flashcards.length - 1 ? (
            <>
              <CircleCheck size={24} className="sm:w-8 sm:h-8" />
              <span>إتمام المراجعة</span>
            </>
          ) : (
            <>
              <span>الكلمة التالية</span>
              <ChevronLeft size={24} className="sm:w-8 sm:h-8" />
            </>
          )}
        </button>
      </div>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};

export default StudentFlashcards;
