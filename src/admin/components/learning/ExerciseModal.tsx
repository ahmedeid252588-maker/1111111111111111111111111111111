import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { ExerciseType } from '../../../types';
import { NeumorphicButton, NeumorphicInput, NeumorphicSelect } from '../../../components/Neumorphic';

interface ExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  formData: any;
  setFormData: (data: any) => void;
  title: string;
  isSaving?: boolean;
  language?: 'ar' | 'de' | 'en';
}

export const ExerciseModal: React.FC<ExerciseModalProps> = ({ isOpen, onClose, onSave, formData, setFormData, title, isSaving, language = 'ar' }) => {
  const isRTL = language === 'ar' || language === 'de';
  
  const t = {
    ar: {
      exerciseType: 'نوع التدريب',
      exerciseTitle: 'عنوان التدريب',
      exerciseTitlePlaceholder: 'مثال: وصل كل كلمة بمعناها الصحيح',
      pairs: 'الأزواج',
      left: 'اليسار',
      right: 'اليمين',
      uploadImage: 'رفع صورة',
      correctWord: 'الكلمة الصحيحة',
      audio: 'الصوت',
      uploadAudio: 'رفع صوت',
      wordText: 'الكلمة/النص',
      correctAnswer: 'الإجابة الصحيحة',
      true: 'صح',
      false: 'خطأ',
      image: 'الصورة',
      requiredWord: 'الكلمة/الترجمة المطلوبة',
      options: 'الخيارات',
      text: 'النص',
      uploadImageOptional: 'رفع صورة (اختياري)',
      isCorrect: 'صحيحة',
      month: 'الشهر',
      week: 'الأسبوع',
      day: 'اليوم',
      save: 'حفظ التدريب',
      types: {
        MATCH_WORD_TRANSLATION: 'توصيل كلمة بالترجمة',
        CONSTRUCT_WORD: 'تكوين كلمة من حروف',
        MATCH_IMAGE_WORD: 'توصيل صورة بالكلمة',
        TRUE_FALSE_IMAGE: 'صح أم خطأ (صورة)',
        LISTEN_CONSTRUCT_WORD: 'استماع وتكوين كلمة',
        LISTEN_CHOOSE_IMAGE: 'استماع واختيار صورة',
        CHOOSE_WORD_TRANSLATION: 'اختيار الكلمة الصحيحة',
        LISTEN_TRUE_FALSE: 'استماع وصح أم خطأ',
      }
    },
    de: {
      exerciseType: 'Übungstyp',
      exerciseTitle: 'Übungstitel',
      exerciseTitlePlaceholder: 'z.B. Verbinde jedes Wort mit seiner richtigen Bedeutung',
      pairs: 'Paare',
      left: 'Links',
      right: 'Rechts',
      uploadImage: 'Bild hochladen',
      correctWord: 'Richtiges Wort',
      audio: 'Audio',
      uploadAudio: 'Audio hochladen',
      wordText: 'Wort/Text',
      correctAnswer: 'Richtige Antwort',
      true: 'Richtig',
      false: 'Falsch',
      image: 'Bild',
      requiredWord: 'Erforderliches Wort/Übersetzung',
      options: 'Optionen',
      text: 'Text',
      uploadImageOptional: 'Bild hochladen (optional)',
      isCorrect: 'Richtig',
      month: 'Monat',
      week: 'Woche',
      day: 'Tag',
      save: 'Übung speichern',
      types: {
        MATCH_WORD_TRANSLATION: 'Wort-Übersetzung-Zuordnung',
        CONSTRUCT_WORD: 'Wort aus Buchstaben bilden',
        MATCH_IMAGE_WORD: 'Bild-Wort-Zuordnung',
        TRUE_FALSE_IMAGE: 'Richtig/Falsch (Bild)',
        LISTEN_CONSTRUCT_WORD: 'Hören und Wort bilden',
        LISTEN_CHOOSE_IMAGE: 'Hören und Bild wählen',
        CHOOSE_WORD_TRANSLATION: 'Richtige Wortübersetzung wählen',
        LISTEN_TRUE_FALSE: 'Hören und Richtig/Falsch',
      }
    },
    en: {
      exerciseType: 'Exercise Type',
      exerciseTitle: 'Exercise Title',
      exerciseTitlePlaceholder: 'e.g., Match each word with its correct meaning',
      pairs: 'Pairs',
      left: 'Left',
      right: 'Right',
      uploadImage: 'Upload Image',
      correctWord: 'Correct Word',
      audio: 'Audio',
      uploadAudio: 'Upload Audio',
      wordText: 'Word/Text',
      correctAnswer: 'Correct Answer',
      true: 'True',
      false: 'False',
      image: 'Image',
      requiredWord: 'Required Word/Translation',
      options: 'Options',
      text: 'Text',
      uploadImageOptional: 'Upload Image (optional)',
      isCorrect: 'Correct',
      month: 'Month',
      week: 'Week',
      day: 'Day',
      save: 'Save Exercise',
      types: {
        MATCH_WORD_TRANSLATION: 'Match Word to Translation',
        CONSTRUCT_WORD: 'Construct Word from Letters',
        MATCH_IMAGE_WORD: 'Match Image to Word',
        TRUE_FALSE_IMAGE: 'True/False (Image)',
        LISTEN_CONSTRUCT_WORD: 'Listen and Construct Word',
        LISTEN_CHOOSE_IMAGE: 'Listen and Choose Image',
        CHOOSE_WORD_TRANSLATION: 'Choose Correct Word Translation',
        LISTEN_TRUE_FALSE: 'Listen and True/False',
      }
    }
  }[language];

  const exerciseTypes: { label: string; value: string }[] = [
    { value: 'MATCH_WORD_TRANSLATION', label: t.types.MATCH_WORD_TRANSLATION },
    { value: 'CONSTRUCT_WORD', label: t.types.CONSTRUCT_WORD },
    { value: 'MATCH_IMAGE_WORD', label: t.types.MATCH_IMAGE_WORD },
    { value: 'TRUE_FALSE_IMAGE', label: t.types.TRUE_FALSE_IMAGE },
    { value: 'LISTEN_CONSTRUCT_WORD', label: t.types.LISTEN_CONSTRUCT_WORD },
    { value: 'LISTEN_CHOOSE_IMAGE', label: t.types.LISTEN_CHOOSE_IMAGE },
    { value: 'CHOOSE_WORD_TRANSLATION', label: t.types.CHOOSE_WORD_TRANSLATION },
    { value: 'LISTEN_TRUE_FALSE', label: t.types.LISTEN_TRUE_FALSE },
  ];

  const addPair = () => {
    const newPairs = [...(formData.content?.pairs || []), { id: Date.now().toString(), left: '', right: '', image: '' }];
    setFormData({ ...formData, content: { ...formData.content, pairs: newPairs } });
  };

  const removePair = (id: string) => {
    const newPairs = formData.content.pairs.filter((p: any) => p.id !== id);
    setFormData({ ...formData, content: { ...formData.content, pairs: newPairs } });
  };

  const updatePair = (id: string, field: string, value: string) => {
    const newPairs = formData.content.pairs.map((p: any) => p.id === id ? { ...p, [field]: value } : p);
    setFormData({ ...formData, content: { ...formData.content, pairs: newPairs } });
  };

  const addOption = () => {
    const newOptions = [...(formData.content?.options || []), { id: Date.now().toString(), text: '', image: '', isCorrect: false }];
    setFormData({ ...formData, content: { ...formData.content, options: newOptions } });
  };

  const removeOption = (id: string) => {
    const newOptions = formData.content.options.filter((o: any) => o.id !== id);
    setFormData({ ...formData, content: { ...formData.content, options: newOptions } });
  };

  const updateOption = (id: string, field: string, value: any) => {
    const newOptions = formData.content.options.map((o: any) => {
      if (field === 'isCorrect' && value === true) {
        return { ...o, isCorrect: o.id === id };
      }
      return o.id === id ? { ...o, [field]: value } : o;
    });
    setFormData({ ...formData, content: { ...formData.content, options: newOptions } });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="w-full max-w-3xl bg-[#e0e0e0] rounded-[40px] p-8 shadow-2xl my-8 relative"
          >
            <button onClick={onClose} className={`absolute top-6 ${isRTL ? 'left-6' : 'right-6'} p-2 text-gray-400 hover:text-gray-600`}>
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-8">{title}</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <NeumorphicSelect 
                  options={exerciseTypes}
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  placeholder={t.exerciseType}
                />
                <NeumorphicInput 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder={t.exerciseTitlePlaceholder}
                />
              </div>

              {/* Dynamic content based on type */}
              <div className="bg-white/50 p-6 rounded-3xl space-y-4">
                {(formData.type === 'MATCH_WORD_TRANSLATION' || formData.type === 'MATCH_IMAGE_WORD') && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-700">{t.pairs}</h3>
                      <button onClick={addPair} className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors">
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    {formData.content?.pairs?.map((pair: any) => (
                      <div key={pair.id} className="grid grid-cols-12 gap-2 items-center">
                        <input 
                          type="text" 
                          placeholder={t.left} 
                          value={pair.left} 
                          onChange={e => updatePair(pair.id, 'left', e.target.value)}
                          className="col-span-3 px-4 py-2 rounded-xl bg-white shadow-inner border-none"
                        />
                        <input 
                          type="text" 
                          placeholder={t.right} 
                          value={pair.right} 
                          onChange={e => updatePair(pair.id, 'right', e.target.value)}
                          className="col-span-3 px-4 py-2 rounded-xl bg-white shadow-inner border-none"
                        />
                        {formData.type === 'MATCH_IMAGE_WORD' && (
                          <div className="col-span-5">
                            <input 
                              type="text" 
                              placeholder={t.image} 
                              value={pair.image} 
                              onChange={e => updatePair(pair.id, 'image', e.target.value)}
                              className="w-full px-4 py-2 rounded-xl bg-white shadow-inner border-none text-xs"
                            />
                          </div>
                        )}
                        <button onClick={() => removePair(pair.id)} className="col-span-1 text-red-500 hover:text-red-600">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {(formData.type === 'CONSTRUCT_WORD' || formData.type === 'LISTEN_CONSTRUCT_WORD') && (
                  <div className="grid grid-cols-2 gap-4">
                    <NeumorphicInput 
                      value={formData.content?.word || ''} 
                      onChange={e => setFormData({...formData, content: {...formData.content, word: e.target.value}})}
                      placeholder={t.correctWord}
                    />
                    {formData.type === 'LISTEN_CONSTRUCT_WORD' && (
                      <NeumorphicInput 
                        value={formData.content?.audioUrl || ''} 
                        onChange={e => setFormData({...formData, content: {...formData.content, audioUrl: e.target.value}})}
                        placeholder={t.audio}
                      />
                    )}
                  </div>
                )}

                {(formData.type === 'TRUE_FALSE_IMAGE' || formData.type === 'LISTEN_TRUE_FALSE') && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <NeumorphicInput 
                        value={formData.content?.word || ''} 
                        onChange={e => setFormData({...formData, content: {...formData.content, word: e.target.value}})}
                        placeholder={t.wordText}
                      />
                      <NeumorphicSelect 
                        options={[{label: t.true, value: 'true'}, {label: t.false, value: 'false'}]}
                        value={formData.content?.correctAnswer?.toString() || 'true'}
                        onChange={e => setFormData({...formData, content: {...formData.content, correctAnswer: e.target.value === 'true'}})}
                        placeholder={t.correctAnswer}
                      />
                    </div>
                    {formData.type === 'TRUE_FALSE_IMAGE' && (
                      <NeumorphicInput 
                        value={formData.content?.imageUrl || ''} 
                        onChange={e => setFormData({...formData, content: {...formData.content, imageUrl: e.target.value}})}
                        placeholder={t.image}
                      />
                    )}
                    {formData.type === 'LISTEN_TRUE_FALSE' && (
                      <NeumorphicInput 
                        value={formData.content?.audioUrl || ''} 
                        onChange={e => setFormData({...formData, content: {...formData.content, audioUrl: e.target.value}})}
                        placeholder={t.audio}
                      />
                    )}
                  </div>
                )}

                {(formData.type === 'LISTEN_CHOOSE_IMAGE' || formData.type === 'CHOOSE_WORD_TRANSLATION') && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <NeumorphicInput 
                        value={formData.type === 'LISTEN_CHOOSE_IMAGE' ? (formData.content?.audioUrl || '') : (formData.content?.word || '')} 
                        onChange={e => setFormData({...formData, content: {...formData.content, [formData.type === 'LISTEN_CHOOSE_IMAGE' ? 'audioUrl' : 'word']: e.target.value}})}
                        placeholder={formData.type === 'LISTEN_CHOOSE_IMAGE' ? t.audio : t.requiredWord}
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-700">{t.options}</h3>
                        <button onClick={addOption} className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors">
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                      {formData.content?.options?.map((option: any) => (
                        <div key={option.id} className="grid grid-cols-12 gap-2 items-center">
                          <input 
                            type="text" 
                            placeholder={t.text} 
                            value={option.text} 
                            onChange={e => updateOption(option.id, 'text', e.target.value)}
                            className="col-span-3 px-4 py-2 rounded-xl bg-white shadow-inner border-none"
                          />
                          <div className="col-span-6">
                            <input 
                              type="text" 
                              placeholder={t.image} 
                              value={option.image || ''} 
                              onChange={e => updateOption(option.id, 'image', e.target.value)}
                              className="w-full px-4 py-2 rounded-xl bg-white shadow-inner border-none text-xs"
                            />
                          </div>
                          <div className="col-span-2 flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              checked={option.isCorrect} 
                              onChange={e => updateOption(option.id, 'isCorrect', e.target.checked)}
                              className="w-5 h-5 text-emerald-500 rounded focus:ring-emerald-500"
                            />
                            <span className="text-xs font-bold">{t.isCorrect}</span>
                          </div>
                          <button onClick={() => removeOption(option.id)} className="col-span-1 text-red-500 hover:text-red-600">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <NeumorphicInput 
                  type="number"
                  value={formData.month?.toString() || '1'}
                  onChange={e => setFormData({...formData, month: parseInt(e.target.value) || 1})}
                  placeholder={t.month}
                />
                <NeumorphicInput 
                  type="number"
                  value={formData.week?.toString() || '1'}
                  onChange={e => setFormData({...formData, week: parseInt(e.target.value) || 1})}
                  placeholder={t.week}
                />
                <NeumorphicInput 
                  type="number"
                  value={formData.day?.toString() || '1'}
                  onChange={e => setFormData({...formData, day: parseInt(e.target.value) || 1})}
                  placeholder={t.day}
                />
              </div>

              <NeumorphicButton 
                onClick={onSave}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="animate-spin" /> : <Save className="w-5 h-5" />}
                {t.save}
              </NeumorphicButton>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
