import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Languages, Search, Filter, ChevronRight } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { NeumorphicCard, NeumorphicInput, NeumorphicSelect } from './Neumorphic';
import { getDirectLink } from '../constants.tsx';
import toast from 'react-hot-toast';

interface VocabItem {
  id: string;
  word: string;
  translation: string;
  example: string;
  exampleTranslation: string;
  imageUrl: string;
  level: string;
  category: string;
}

export const StudentVocabulary = ({ language, onBack, level, month, week, day }: { 
  language: string,
  onBack: () => void, 
  level?: string,
  month?: number,
  week?: number,
  day?: number
}) => {
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');

  useEffect(() => {
    const collectionName = `vocabulary_${language}`;
    const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as VocabItem));
      setVocabList(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, collectionName);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [language]);

  const filteredList = vocabList.filter(item => {
    const matchesSearch = item.word.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.translation.includes(searchTerm);
    const matchesLevel = filterLevel === 'all' || (item.level || 'A1') === filterLevel;
    
    if (month && week && day) {
      const matchesUserLevel = level ? (item.level || 'A1') === level : true;
      return matchesSearch && matchesUserLevel && (item as any).month === month && (item as any).week === week && (item as any).day === day;
    }
    
    return matchesSearch && matchesLevel;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-12"
      dir="rtl"
    >
      <div className="flex items-center gap-4 mb-8 sm:mb-12">
        <button 
          onClick={onBack}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#f5f5f5] shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all shrink-0"
        >
          <ChevronRight size={20} className="sm:w-6 sm:h-6" />
        </button>
        <div>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#4a4a4a]">المفردات والجمل</h2>
          <p className="text-sm sm:text-base text-slate-400 font-bold mt-1">تعلم كلمات جديدة</p>
        </div>
      </div>

      <NeumorphicCard className="p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
          <div className="flex-1 relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="البحث عن كلمة أو ترجمة..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 sm:pl-6 py-3 sm:py-4 bg-[#f5f5f5] rounded-xl sm:rounded-2xl shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff] outline-none text-gray-700 font-bold text-sm sm:text-base"
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 font-bold">جاري تحميل المفردات...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <Languages size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-bold text-xl">لم يتم العثور على مفردات</p>
          </div>
        ) : (
          filteredList.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <NeumorphicCard className="p-4 sm:p-6 h-full flex flex-col group hover:scale-[1.02] transition-transform">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.word} className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-cover shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 shadow-inner shrink-0">
                        <Languages size={20} className="sm:w-6 sm:h-6" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-gray-800">{item.word}</h3>
                      <p className="text-sm sm:text-base text-indigo-600 font-bold">{item.translation}</p>
                    </div>
                  </div>
                  <span className="px-2 sm:px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] sm:text-xs font-black uppercase shrink-0">
                    {item.level}
                  </span>
                </div>

                {item.example && (
                  <div className="mt-2 sm:mt-4 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100 flex-1">
                    <p className="text-xs sm:text-sm font-bold text-gray-700 mb-1">{item.example}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">{item.exampleTranslation}</p>
                  </div>
                )}

                <div className="mt-4 sm:mt-6 flex items-center justify-end pt-3 sm:pt-4 border-t border-gray-100">
                  <span className="text-[10px] sm:text-xs font-bold text-gray-400 bg-gray-100 px-2 sm:px-3 py-1 rounded-full">
                    {item.category === 'general' ? 'عام' : 
                     item.category === 'verbs' ? 'أفعال' : 
                     item.category === 'nouns' ? 'أسماء' : 
                     item.category === 'adjectives' ? 'صفات' : 'جمل'}
                  </span>
                </div>
              </NeumorphicCard>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default StudentVocabulary;
