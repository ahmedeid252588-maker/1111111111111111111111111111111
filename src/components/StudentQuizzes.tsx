import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BrainCircuit, Search, Filter, ChevronRight, CheckCircle, List, Pencil, CircleHelp } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { NeumorphicCard, NeumorphicButton, NeumorphicInput, NeumorphicSelect } from './Neumorphic';
import toast from 'react-hot-toast';

interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank';
  options: string[];
  correctAnswer: string | number;
  explanation: string;
  points: number;
  level: string;
  category: string;
}

export const StudentQuizzes = ({ language, onBack, addPoints, level, month, week, day }: { 
  language: string,
  onBack: () => void, 
  addPoints: (pts: number) => void, 
  level?: string,
  month?: number,
  week?: number,
  day?: number
}) => {
  const [questionsList, setQuestionsList] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  
  const [activeQuestion, setActiveQuestion] = useState<QuizQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState<string | number>('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    const collectionName = `quizzes_${language}`;
    const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as QuizQuestion));
      setQuestionsList(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, collectionName);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [language]);

  const handleStartQuiz = (question: QuizQuestion) => {
    setActiveQuestion(question);
    setUserAnswer('');
    setIsAnswered(false);
    setIsCorrect(false);
  };

  const handleSubmitAnswer = () => {
    if (!activeQuestion) return;
    
    if (userAnswer === '') {
      toast.error('يرجى اختيار إجابة');
      return;
    }

    let correct = false;
    if (activeQuestion.type === 'multiple-choice' || activeQuestion.type === 'true-false') {
      correct = userAnswer === activeQuestion.correctAnswer;
    } else if (activeQuestion.type === 'fill-blank') {
      correct = (userAnswer as string).trim().toLowerCase() === (activeQuestion.correctAnswer as string).trim().toLowerCase();
    }

    setIsCorrect(correct);
    setIsAnswered(true);

    if (correct) {
      toast.success('إجابة صحيحة! أحسنت');
      addPoints(activeQuestion.points);
    } else {
      toast.error('إجابة خاطئة، حاول مرة أخرى');
    }
  };

  const filteredList = questionsList.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === 'all' || (item.level || 'A1') === filterLevel;
    
    if (month && week && day) {
      // If opened from learning page, filter by the specific day and the user's level
      const matchesUserLevel = level ? (item.level || 'A1') === level : true;
      return matchesSearch && matchesUserLevel && item.month === month && item.week === week && item.day === day;
    }
    
    return matchesSearch && matchesLevel;
  });

  if (activeQuestion) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full max-w-4xl px-4 sm:px-6 py-6 sm:py-12"
        dir="rtl"
      >
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-12">
          <button 
            onClick={() => setActiveQuestion(null)}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#f5f5f5] shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all shrink-0"
          >
            <ChevronRight size={20} className="sm:w-6 sm:h-6" />
          </button>
          <div>
            <h2 className="text-xl sm:text-3xl font-bold text-[#4a4a4a]">السؤال</h2>
            <p className="text-xs sm:text-base text-slate-400 font-bold mt-1">
              {activeQuestion.type === 'multiple-choice' ? 'اختيار من متعدد' : activeQuestion.type === 'true-false' ? 'صح أم خطأ' : 'أكمل الفراغ'}
            </p>
          </div>
        </div>

        <NeumorphicCard className="p-4 sm:p-8 md:p-12">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-100 text-purple-700 rounded-xl text-[10px] sm:text-sm font-black uppercase">
              المستوى {activeQuestion.level}
            </span>
            <div className="flex items-center gap-1.5 sm:gap-2 text-amber-500 font-black text-xs sm:text-base">
              <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-amber-100 flex items-center justify-center">
                {activeQuestion.points}
              </span>
              نقطة
            </div>
          </div>

          <h3 className="text-lg sm:text-2xl md:text-3xl font-black text-gray-800 mb-6 sm:mb-10 leading-relaxed">
            {activeQuestion.question}
          </h3>

          <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-10">
            {activeQuestion.type === 'multiple-choice' && activeQuestion.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => !isAnswered && setUserAnswer(idx)}
                disabled={isAnswered}
                className={`w-full p-4 sm:p-6 text-right rounded-xl sm:rounded-2xl border-2 transition-all font-bold text-sm sm:text-lg ${
                  userAnswer === idx 
                    ? 'border-purple-500 bg-purple-50 text-purple-700' 
                    : 'border-transparent bg-gray-50 text-gray-700 hover:bg-gray-100'
                } ${
                  isAnswered && idx === activeQuestion.correctAnswer 
                    ? '!border-emerald-500 !bg-emerald-50 !text-emerald-700' 
                    : ''
                } ${
                  isAnswered && userAnswer === idx && idx !== activeQuestion.correctAnswer 
                    ? '!border-rose-500 !bg-rose-50 !text-rose-700' 
                    : ''
                }`}
              >
                {opt}
              </button>
            ))}

            {activeQuestion.type === 'true-false' && (
              <div className="flex gap-3 sm:gap-4">
                <button
                  onClick={() => !isAnswered && setUserAnswer(true)}
                  disabled={isAnswered}
                  className={`flex-1 p-4 sm:p-6 text-center rounded-xl sm:rounded-2xl border-2 transition-all font-bold text-base sm:text-xl ${
                    userAnswer === true 
                      ? 'border-purple-500 bg-purple-50 text-purple-700' 
                      : 'border-transparent bg-gray-50 text-gray-700 hover:bg-gray-100'
                  } ${
                    isAnswered && activeQuestion.correctAnswer === true 
                      ? '!border-emerald-500 !bg-emerald-50 !text-emerald-700' 
                      : ''
                  } ${
                    isAnswered && userAnswer === true && activeQuestion.correctAnswer !== true 
                      ? '!border-rose-500 !bg-rose-50 !text-rose-700' 
                      : ''
                  }`}
                >
                  صح
                </button>
                <button
                  onClick={() => !isAnswered && setUserAnswer(false)}
                  disabled={isAnswered}
                  className={`flex-1 p-4 sm:p-6 text-center rounded-xl sm:rounded-2xl border-2 transition-all font-bold text-base sm:text-xl ${
                    userAnswer === false 
                      ? 'border-purple-500 bg-purple-50 text-purple-700' 
                      : 'border-transparent bg-gray-50 text-gray-700 hover:bg-gray-100'
                  } ${
                    isAnswered && activeQuestion.correctAnswer === false 
                      ? '!border-emerald-500 !bg-emerald-50 !text-emerald-700' 
                      : ''
                  } ${
                    isAnswered && userAnswer === false && activeQuestion.correctAnswer !== false 
                      ? '!border-rose-500 !bg-rose-50 !text-rose-700' 
                      : ''
                  }`}
                >
                  خطأ
                </button>
              </div>
            )}

            {activeQuestion.type === 'fill-blank' && (
              <div className="space-y-3 sm:space-y-4">
                <input
                  type="text"
                  placeholder="اكتب إجابتك هنا..."
                  value={userAnswer as string}
                  onChange={(e) => !isAnswered && setUserAnswer(e.target.value)}
                  disabled={isAnswered}
                  className={`w-full p-4 sm:p-6 bg-gray-50 rounded-xl sm:rounded-2xl border-2 outline-none text-right font-bold text-base sm:text-xl transition-all ${
                    isAnswered 
                      ? isCorrect 
                        ? 'border-emerald-500 text-emerald-700 bg-emerald-50' 
                        : 'border-rose-500 text-rose-700 bg-rose-50'
                      : 'border-transparent focus:border-purple-500'
                  }`}
                  dir="rtl"
                />
                {isAnswered && !isCorrect && (
                  <div className="p-3 sm:p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 font-bold text-sm sm:text-base">
                    الإجابة الصحيحة: {activeQuestion.correctAnswer}
                  </div>
                )}
              </div>
            )}
          </div>

          {isAnswered && activeQuestion.explanation && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 sm:mb-10 p-4 sm:p-6 bg-blue-50 rounded-xl sm:rounded-2xl border border-blue-100"
            >
              <h4 className="flex items-center gap-2 text-blue-800 font-black mb-2 text-sm sm:text-base">
                <CircleHelp size={18} className="sm:w-5 sm:h-5" />
                شرح الإجابة
              </h4>
              <p className="text-blue-700 font-medium leading-relaxed text-xs sm:text-base">
                {activeQuestion.explanation}
              </p>
            </motion.div>
          )}

          <div className="flex justify-end gap-3 sm:gap-4">
            {!isAnswered ? (
              <NeumorphicButton 
                onClick={handleSubmitAnswer}
                className="px-6 sm:px-10 py-3 sm:py-4 bg-purple-500 text-white font-black text-sm sm:text-lg w-full sm:w-auto"
              >
                تأكيد الإجابة
              </NeumorphicButton>
            ) : (
              <NeumorphicButton 
                onClick={() => setActiveQuestion(null)}
                className="px-6 sm:px-10 py-3 sm:py-4 bg-gray-800 text-white font-black text-sm sm:text-lg w-full sm:w-auto"
              >
                العودة للتمارين
              </NeumorphicButton>
            )}
          </div>
        </NeumorphicCard>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-12"
      dir="rtl"
    >
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-12">
        <button 
          onClick={onBack}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#f5f5f5] shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all shrink-0"
        >
          <ChevronRight size={20} className="sm:w-6 sm:h-6" />
        </button>
        <div>
          <h2 className="text-xl sm:text-4xl font-bold text-[#4a4a4a]">التمارين والاختبارات</h2>
          <p className="text-xs sm:text-base text-slate-400 font-bold mt-1">اختبر معلوماتك وتدرب يومياً</p>
        </div>
      </div>

      <NeumorphicCard className="p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
          <div className="flex-1 relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input 
              type="text"
              placeholder="البحث في الأسئلة..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pr-10 sm:pr-12 pl-4 sm:pl-6 py-3 sm:py-4 bg-[#f5f5f5] rounded-xl sm:rounded-2xl shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff] outline-none text-gray-700 font-bold text-sm sm:text-base"
            />
          </div>
          <div className="w-full md:w-48">
            <NeumorphicSelect 
              icon={Filter}
              placeholder="المستوى"
              value={filterLevel}
              onChange={(e: any) => setFilterLevel(e.target.value)}
              options={[
                { label: 'الكل', value: 'all' },
                { label: 'A1', value: 'A1' },
                { label: 'A2', value: 'A2' },
                { label: 'B1', value: 'B1' },
                { label: 'B2', value: 'B2' }
              ]}
            />
          </div>
        </div>
      </NeumorphicCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {loading ? (
          <div className="col-span-full py-12 sm:py-20 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 font-bold text-sm sm:text-base">جاري تحميل الأسئلة...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="col-span-full py-12 sm:py-20 text-center">
            <BrainCircuit size={48} className="text-gray-300 mx-auto mb-4 w-10 h-10 sm:w-12 sm:h-12" />
            <p className="text-gray-500 font-bold text-lg sm:text-xl">لم يتم العثور على أسئلة</p>
          </div>
        ) : (
          filteredList.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <NeumorphicCard 
                className="p-4 sm:p-6 h-full flex flex-col cursor-pointer hover:scale-[1.02] transition-transform group"
                onClick={() => handleStartQuiz(item)}
              >
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 shadow-inner shrink-0">
                    {item.type === 'multiple-choice' && <List size={20} className="sm:w-6 sm:h-6" />}
                    {item.type === 'true-false' && <CheckCircle size={20} className="sm:w-6 sm:h-6" />}
                    {item.type === 'fill-blank' && <Pencil size={20} className="sm:w-6 sm:h-6" />}
                  </div>
                  <span className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] sm:text-xs font-black uppercase">
                    {item.category === 'grammar' ? 'قواعد' : 
                     item.category === 'vocabulary' ? 'مفردات' : 
                     item.category === 'reading' ? 'قراءة' : 'استماع'}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-gray-800 line-clamp-3 mb-3 sm:mb-4 flex-1">
                  {item.question}
                </h3>

                <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-100 mt-auto">
                  <span className="text-xs sm:text-sm font-bold text-gray-500">
                    المستوى {item.level}
                  </span>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-amber-500">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-100 flex items-center justify-center">
                      {item.points}
                    </span>
                    نقطة
                  </div>
                </div>
              </NeumorphicCard>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default StudentQuizzes;
