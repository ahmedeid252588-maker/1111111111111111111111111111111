
import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Plus, 
  Trash2, 
  Pencil, 
  Search, 
  Filter, 
  CheckCircle, 
  X, 
  Save, 
  ChevronRight,
  List,
  CircleHelp,
  Award,
  Loader2,
  Languages
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  NeumorphicCard, 
  NeumorphicButton, 
  NeumorphicInput, 
  NeumorphicSelect,
  NeumorphicTextArea
} from '../../components/Neumorphic';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../components/ConfirmModal';

interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'matching' | 'ordering' | 'multiple-response' | 'short-answer' | 'essay' | 'classification' | 'numeric';
  options?: string[];
  correctAnswer?: string | number | string[];
  explanation?: string;
  points: number;
  level: string;
  category: string;
  isLevelExam?: boolean;
  imageUrl?: string;
  pairs?: { left: string; right: string }[];
  items?: string[];
  rubric?: string;
  categories?: string[];
  classificationItems?: { text: string; category: string }[];
  createdAt?: any;
}

const AdminQuizzes: React.FC<{ language: string }> = ({ language }) => {
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterType, setFilterType] = useState<'all' | 'level-exam' | 'regular'>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<QuizQuestion | null>(null);
  
  const bulkUpdateToLevelExams = async () => {
    const collectionName = `quizzes_${language}`;
    const loadingToast = toast.loading('جاري تحويل الاختبارات...');
    try {
      const batch = writeBatch(db);
      quizzes.forEach(quiz => {
        if (!quiz.isLevelExam) {
          const quizRef = doc(db, collectionName, quiz.id);
          batch.update(quizRef, { isLevelExam: true });
        }
      });
      await batch.commit();
      toast.success('تم تحويل جميع الاختبارات إلى امتحانات مستوى', { id: loadingToast });
    } catch (error) {
      console.error("Error bulk updating quizzes:", error);
      toast.error('فشل في تحويل الاختبارات', { id: loadingToast });
    }
  };
  
  // Form state
  const [question, setQuestion] = useState('');
  const [type, setType] = useState<'multiple-choice' | 'true-false' | 'fill-blank'>('multiple-choice');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState<string | number>('');
  const [explanation, setExplanation] = useState('');
  const [points, setPoints] = useState(10);
  const [level, setLevel] = useState('A1');
  const [category, setCategory] = useState('General');
  const [isLevelExam, setIsLevelExam] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [pairs, setPairs] = useState<{ left: string; right: string }[]>([{ left: '', right: '' }]);
  const [items, setItems] = useState<string[]>(['', '']);
  const [rubric, setRubric] = useState('');
  const [categories, setCategories] = useState<string[]>(['']);
  const [classificationItems, setClassificationItems] = useState<{ text: string; category: string }[]>([{ text: '', category: '' }]);

  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean, id: string }>({ isOpen: false, id: '' });

  useEffect(() => {
    const collectionName = `quizzes_${language}`;
    const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as QuizQuestion));
      setQuizzes(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, collectionName);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [language]);

  const resetForm = () => {
    setQuestion('');
    setType('multiple-choice');
    setOptions(['', '', '', '']);
    setCorrectAnswer('');
    setExplanation('');
    setPoints(10);
    setLevel('A1');
    setCategory('General');
    setIsLevelExam(false);
    setImageUrl('');
    setPairs([{ left: '', right: '' }]);
    setItems(['', '']);
    setRubric('');
    setCategories(['']);
    setClassificationItems([{ text: '', category: '' }]);
    setEditingQuiz(null);
  };

  const handleEdit = (quiz: QuizQuestion) => {
    setEditingQuiz(quiz);
    setQuestion(quiz.question);
    setType(quiz.type);
    setOptions(quiz.options || ['', '', '', '']);
    setCorrectAnswer(quiz.correctAnswer);
    setExplanation(quiz.explanation);
    setPoints(quiz.points);
    setLevel(quiz.level);
    setCategory(quiz.category);
    setIsLevelExam(!!quiz.isLevelExam);
    setImageUrl(quiz.imageUrl || '');
    setPairs(quiz.pairs || [{ left: '', right: '' }]);
    setItems(quiz.items || ['', '']);
    setRubric(quiz.rubric || '');
    setCategories(quiz.categories || ['']);
    setClassificationItems(quiz.classificationItems || [{ text: '', category: '' }]);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!question || !correctAnswer) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (type === 'multiple-choice' && options.some(opt => !opt)) {
      toast.error('يرجى ملء جميع الخيارات');
      return;
    }

    const collectionName = `quizzes_${language}`;
    const quizData = {
      question,
      type,
      options: type === 'multiple-choice' ? options : (type === 'true-false' ? ['صح', 'خطأ'] : []),
      correctAnswer,
      explanation,
      points: Number(points),
      level,
      category,
      isLevelExam,
      imageUrl,
      pairs,
      items,
      rubric,
      categories,
      classificationItems,
      updatedAt: serverTimestamp()
    };

    try {
      if (editingQuiz) {
        await updateDoc(doc(db, collectionName, editingQuiz.id), quizData);
        toast.success('تم تحديث السؤال بنجاح');
      } else {
        await addDoc(collection(db, collectionName), {
          ...quizData,
          createdAt: serverTimestamp()
        });
        toast.success('تم إضافة السؤال بنجاح');
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      handleFirestoreError(error, editingQuiz ? OperationType.UPDATE : OperationType.CREATE, `${collectionName}/${editingQuiz?.id || ''}`);
    }
  };

  const handleDelete = async (id: string) => {
    const collectionName = `quizzes_${language}`;
    try {
      await deleteDoc(doc(db, collectionName, id));
      toast.success('تم حذف السؤال بنجاح');
      setConfirmDelete({ isOpen: false, id: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
    }
  };

  const filteredQuizzes = quizzes.filter(q => {
    const matchesSearch = q.question.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === 'all' || (q.level || 'A1') === filterLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#4a4a4a] flex items-center gap-3">
            <BrainCircuit className="text-[#4d9685]" size={32} />
            إدارة الاختبارات القصيرة
          </h2>
          <p className="text-slate-400 font-bold mt-1">إضافة وتعديل الأسئلة والاختبارات التفاعلية</p>
        </div>
        <div className="flex items-center gap-4">
          <NeumorphicButton 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="md:w-auto px-8"
          >
            <Plus size={20} className="ml-2" />
            إضافة سؤال جديد
          </NeumorphicButton>
        </div>
      </div>

      <NeumorphicCard className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="البحث في الأسئلة..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-6 py-4 bg-[#f5f5f5] rounded-2xl shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff] outline-none text-gray-700 font-bold"
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

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-[#4d9685]" size={48} />
            <p className="text-slate-400 font-bold">جاري تحميل الأسئلة...</p>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <NeumorphicCard className="p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <CircleHelp size={40} />
            </div>
            <h3 className="text-xl font-bold text-[#4a4a4a] mb-2">لا توجد أسئلة</h3>
            <p className="text-slate-400 font-bold">ابدأ بإضافة أول سؤال للاختبارات</p>
          </NeumorphicCard>
        ) : (
          filteredQuizzes.map((quiz) => (
            <NeumorphicCard key={quiz.id} className="p-6 hover:scale-[1.01] transition-transform">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-xs font-black">{quiz.level}</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-black">{quiz.category}</span>
                    <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-black">{quiz.points} نقطة</span>
                    {quiz.isLevelExam && <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-black">امتحان مستوى</span>}
                  </div>
                  <h3 className="text-xl font-bold text-[#4a4a4a] mb-4">{quiz.question}</h3>
                  {quiz.imageUrl && (
                    <img src={quiz.imageUrl} alt="Quiz" className="w-full h-48 object-cover rounded-2xl mb-4" referrerPolicy="no-referrer" />
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {quiz.type === 'multiple-choice' && quiz.options.map((opt, i) => (
                      <div key={i} className={`p-3 rounded-xl border-2 ${opt === quiz.correctAnswer ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-500'} font-bold text-sm flex items-center gap-2`}>
                        {opt === quiz.correctAnswer && <CheckCircle size={16} />}
                        {opt}
                      </div>
                    ))}
                    {quiz.type === 'true-false' && (
                      <div className="p-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 text-emerald-700 font-bold text-sm flex items-center gap-2">
                        <CheckCircle size={16} />
                        الإجابة الصحيحة: {quiz.correctAnswer}
                      </div>
                    )}
                    {quiz.type === 'fill-blank' && (
                      <div className="p-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 text-emerald-700 font-bold text-sm flex items-center gap-2">
                        <CheckCircle size={16} />
                        الإجابة الصحيحة: {quiz.correctAnswer}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex md:flex-col gap-3 justify-center">
                  <button 
                    onClick={() => handleEdit(quiz)}
                    className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-sm hover:bg-blue-100 transition-all"
                  >
                    <Pencil size={20} />
                  </button>
                  <button 
                    onClick={() => setConfirmDelete({ isOpen: true, id: quiz.id })}
                    className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shadow-sm hover:bg-red-100 transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </NeumorphicCard>
          ))
        )}
      </div>

      {/* Quiz Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#f5f5f5] w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-white/40 flex items-center justify-between shrink-0">
                <h3 className="text-2xl font-black text-[#4a4a4a]">
                  {editingQuiz ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <NeumorphicSelect 
                    label="نوع السؤال"
                    icon={List}
                    value={type}
                    onChange={(e: any) => {
                      setType(e.target.value);
                      setCorrectAnswer('');
                    }}
                    options={[
                      { label: 'اختيار من متعدد', value: 'multiple-choice' },
                      { label: 'صح أم خطأ', value: 'true-false' },
                      { label: 'إكمال الفراغ', value: 'fill-blank' },
                      { label: 'توصيل', value: 'matching' },
                      { label: 'ترتيب', value: 'ordering' },
                      { label: 'اختيار متعدد (أكثر من إجابة)', value: 'multiple-response' },
                      { label: 'إجابة قصيرة', value: 'short-answer' },
                      { label: 'مقال', value: 'essay' },
                      { label: 'تصنيف', value: 'classification' },
                      { label: 'إجابة رقمية', value: 'numeric' }
                    ]}
                  />
                  <NeumorphicSelect 
                    label="المستوى"
                    icon={Award}
                    value={level}
                    onChange={(e: any) => setLevel(e.target.value)}
                    options={[
                      { label: 'A1', value: 'A1' },
                      { label: 'A2', value: 'A2' },
                      { label: 'B1', value: 'B1' },
                      { label: 'B2', value: 'B2' }
                    ]}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <input 
                    type="checkbox"
                    id="isLevelExam"
                    checked={isLevelExam}
                    onChange={(e) => setIsLevelExam(e.target.checked)}
                    className="w-6 h-6 accent-[#4d9685]"
                  />
                  <label htmlFor="isLevelExam" className="font-bold text-[#4a4a4a]">امتحان مستوى</label>
                </div>

                <NeumorphicInput 
                  label="رابط الصورة (اختياري)"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e: any) => setImageUrl(e.target.value)}
                />

                <NeumorphicTextArea 
                  label="السؤال"
                  placeholder="اكتب نص السؤال هنا..."
                  value={question}
                  onChange={(e: any) => setQuestion(e.target.value)}
                />

                {type === 'multiple-choice' && (
                  <div className="space-y-4">
                    <label className="block text-sm font-black text-slate-400 mr-2">الخيارات</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <input 
                            type="radio" 
                            name="correctAnswer" 
                            checked={correctAnswer === opt && opt !== ''}
                            onChange={() => setCorrectAnswer(opt)}
                            className="w-5 h-5 accent-[#4d9685]"
                          />
                          <input 
                            type="text"
                            placeholder={`الخيار ${i + 1}`}
                            value={opt}
                            onChange={(e) => {
                              const newOptions = [...options];
                              newOptions[i] = e.target.value;
                              setOptions(newOptions);
                            }}
                            className="flex-1 p-3 bg-[#f5f5f5] rounded-xl shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff] outline-none text-gray-700 font-bold text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {type === 'true-false' && (
                  <div className="space-y-4">
                    <label className="block text-sm font-black text-slate-400 mr-2">الإجابة الصحيحة</label>
                    <div className="flex gap-6">
                      {['صح', 'خطأ'].map((opt) => (
                        <label key={opt} className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="radio" 
                            name="correctAnswer" 
                            checked={correctAnswer === opt}
                            onChange={() => setCorrectAnswer(opt)}
                            className="w-5 h-5 accent-[#4d9685]"
                          />
                          <span className="font-bold text-[#4a4a4a]">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {type === 'fill-blank' && (
                  <NeumorphicInput 
                    label="الإجابة الصحيحة"
                    icon={CheckCircle}
                    placeholder="اكتب الإجابة الصحيحة هنا..."
                    value={correctAnswer as string}
                    onChange={(e: any) => setCorrectAnswer(e.target.value)}
                  />
                )}

                {type === 'matching' && (
                  <div className="space-y-4">
                    <label className="block text-sm font-black text-slate-400 mr-2">الأزواج (توصيل)</label>
                    {pairs.map((pair, i) => (
                      <div key={i} className="flex gap-2">
                        <input type="text" placeholder="اليسار" value={pair.left} onChange={e => { const newPairs = [...pairs]; newPairs[i].left = e.target.value; setPairs(newPairs); }} className="flex-1 p-3 bg-[#f5f5f5] rounded-xl shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff] outline-none text-gray-700 font-bold text-sm" />
                        <input type="text" placeholder="اليمين" value={pair.right} onChange={e => { const newPairs = [...pairs]; newPairs[i].right = e.target.value; setPairs(newPairs); }} className="flex-1 p-3 bg-[#f5f5f5] rounded-xl shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff] outline-none text-gray-700 font-bold text-sm" />
                      </div>
                    ))}
                    <button type="button" onClick={() => setPairs([...pairs, { left: '', right: '' }])} className="text-[#4d9685] font-bold text-sm">+ إضافة زوج</button>
                  </div>
                )}

                {type === 'ordering' && (
                  <div className="space-y-4">
                    <label className="block text-sm font-black text-slate-400 mr-2">العناصر (بالترتيب الصحيح)</label>
                    {items.map((item, i) => (
                      <input key={i} type="text" placeholder={`العنصر ${i + 1}`} value={item} onChange={e => { const newItems = [...items]; newItems[i] = e.target.value; setItems(newItems); }} className="w-full p-3 bg-[#f5f5f5] rounded-xl shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff] outline-none text-gray-700 font-bold text-sm" />
                    ))}
                    <button type="button" onClick={() => setItems([...items, ''])} className="text-[#4d9685] font-bold text-sm">+ إضافة عنصر</button>
                  </div>
                )}

                {type === 'multiple-response' && (
                  <div className="space-y-4">
                    <label className="block text-sm font-black text-slate-400 mr-2">الخيارات (حدد الإجابات الصحيحة)</label>
                    {options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <input type="checkbox" checked={(correctAnswer as string[] || []).includes(opt)} onChange={() => { const newAns = (correctAnswer as string[] || []).includes(opt) ? (correctAnswer as string[]).filter(a => a !== opt) : [...(correctAnswer as string[] || []), opt]; setCorrectAnswer(newAns); }} className="w-5 h-5 accent-[#4d9685]" />
                        <input type="text" placeholder={`الخيار ${i + 1}`} value={opt} onChange={e => { const newOptions = [...options]; newOptions[i] = e.target.value; setOptions(newOptions); }} className="flex-1 p-3 bg-[#f5f5f5] rounded-xl shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff] outline-none text-gray-700 font-bold text-sm" />
                      </div>
                    ))}
                  </div>
                )}

                {type === 'short-answer' && (
                  <NeumorphicInput label="الإجابة الصحيحة" placeholder="اكتب الإجابة..." value={correctAnswer as string} onChange={(e: any) => setCorrectAnswer(e.target.value)} />
                )}

                {type === 'essay' && (
                  <NeumorphicTextArea label="نموذج الإجابة / المعايير" placeholder="اكتب معايير التصحيح..." value={rubric} onChange={(e: any) => setRubric(e.target.value)} />
                )}

                {type === 'classification' && (
                  <div className="space-y-4">
                    <label className="block text-sm font-black text-slate-400 mr-2">التصنيفات</label>
                    <input type="text" placeholder="التصنيفات (مفصولة بفاصلة)" value={categories.join(',')} onChange={e => setCategories(e.target.value.split(','))} className="w-full p-3 bg-[#f5f5f5] rounded-xl shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff] outline-none text-gray-700 font-bold text-sm" />
                    <label className="block text-sm font-black text-slate-400 mr-2">العناصر</label>
                    {classificationItems.map((item, i) => (
                      <div key={i} className="flex gap-2">
                        <input type="text" placeholder="نص العنصر" value={item.text} onChange={e => { const newItems = [...classificationItems]; newItems[i].text = e.target.value; setClassificationItems(newItems); }} className="flex-1 p-3 bg-[#f5f5f5] rounded-xl shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff] outline-none text-gray-700 font-bold text-sm" />
                        <input type="text" placeholder="التصنيف" value={item.category} onChange={e => { const newItems = [...classificationItems]; newItems[i].category = e.target.value; setClassificationItems(newItems); }} className="flex-1 p-3 bg-[#f5f5f5] rounded-xl shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff] outline-none text-gray-700 font-bold text-sm" />
                      </div>
                    ))}
                    <button type="button" onClick={() => setClassificationItems([...classificationItems, { text: '', category: '' }])} className="text-[#4d9685] font-bold text-sm">+ إضافة عنصر</button>
                  </div>
                )}

                {type === 'numeric' && (
                  <NeumorphicInput label="الإجابة الصحيحة (رقم)" type="number" value={correctAnswer as number} onChange={(e: any) => setCorrectAnswer(Number(e.target.value))} />
                )}

                <NeumorphicTextArea 
                  label="شرح الإجابة (اختياري)"
                  placeholder="اشرح لماذا هذه الإجابة صحيحة..."
                  value={explanation}
                  onChange={(e: any) => setExplanation(e.target.value)}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <NeumorphicInput 
                    label="النقاط"
                    icon={Award}
                    type="number"
                    value={points}
                    onChange={(e: any) => setPoints(e.target.value)}
                  />
                  <NeumorphicInput 
                    label="التصنيف"
                    icon={List}
                    placeholder="مثال: قواعد، مفردات..."
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-8 border-t border-white/40 flex gap-4 shrink-0">
                <NeumorphicButton onClick={handleSave} className="flex-1">
                  <Save size={20} className="ml-2" />
                  حفظ السؤال
                </NeumorphicButton>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-14 rounded-2xl bg-white shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] text-slate-400 font-bold hover:text-slate-600 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={confirmDelete.isOpen}
        title="حذف السؤال"
        message="هل أنت متأكد من حذف هذا السؤال؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={() => handleDelete(confirmDelete.id)}
        onCancel={() => setConfirmDelete({ isOpen: false, id: '' })}
      />
    </div>
  );
};

export default AdminQuizzes;
