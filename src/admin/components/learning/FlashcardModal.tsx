import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Loader2, Image as ImageIcon, Volume2, Type } from 'lucide-react';
import { NeumorphicInput, NeumorphicSelect, NeumorphicButton } from '../../../components/Neumorphic';

interface FlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  formData: any;
  setFormData: (data: any) => void;
  title: string;
  isSaving?: boolean;
  language?: 'ar' | 'de' | 'en';
}

export const FlashcardModal: React.FC<FlashcardModalProps> = ({ isOpen, onClose, onSave, formData, setFormData, title, isSaving, language = 'ar' }) => {
  const isRTL = language === 'ar' || language === 'de';
  
  const t = {
    ar: {
      section: 'القسم',
      cardType: 'نوع البطاقة',
      wordOnly: 'كلمة فقط',
      sentenceOnly: 'جملة فقط',
      both: 'كلمة وجملة',
      word: 'الكلمة',
      wordPlaceholder: 'مثال: Apfel',
      translation: 'الترجمة',
      translationPlaceholder: 'مثال: تفاحة',
      sentence: 'الجملة (مثال)',
      sentencePlaceholder: 'مثال: Ich esse einen Apfel.',
      sentenceTranslation: 'ترجمة الجملة',
      sentenceTranslationPlaceholder: 'مثال: أنا آكل تفاحة.',
      image: 'الصورة',
      imagePlaceholder: 'ضع رابط الصورة هنا',
      wordAudio: 'صوت الكلمة',
      audioPlaceholder: 'ضع رابط الصوت هنا',
      sentenceAudio: 'صوت الجملة',
      sentenceAudioPlaceholder: 'ضع رابط صوت الجملة هنا',
      month: 'الشهر',
      week: 'الأسبوع',
      day: 'اليوم',
      save: 'حفظ البطاقة',
      sections: ['كلمات الدرس', 'كلمات جديدة', 'التحيات', 'الأساسيات', 'التعارف', 'الأفعال', 'البلدان', 'الروابط', 'أخرى']
    },
    de: {
      section: 'Bereich',
      cardType: 'Kartentyp',
      wordOnly: 'Nur Wort',
      sentenceOnly: 'Nur Satz',
      both: 'Wort und Satz',
      word: 'Wort',
      wordPlaceholder: 'z.B. Apfel',
      translation: 'Übersetzung',
      translationPlaceholder: 'z.B. تفاحة',
      sentence: 'Satz (Beispiel)',
      sentencePlaceholder: 'z.B. Ich esse einen Apfel.',
      sentenceTranslation: 'Satzübersetzung',
      sentenceTranslationPlaceholder: 'z.B. أنا آكل تفاحة.',
      image: 'Bild',
      imagePlaceholder: 'Bild-Link hier einfügen',
      wordAudio: 'Wort-Audio',
      audioPlaceholder: 'Audio-Link hier einfügen',
      sentenceAudio: 'Satz-Audio',
      sentenceAudioPlaceholder: 'Satz-Audio-Link hier einfügen',
      month: 'Monat',
      week: 'Woche',
      day: 'Tag',
      save: 'Karte speichern',
      sections: ['Lektionswörter', 'Neue Wörter', 'Grüße', 'Grundlagen', 'Kennenlernen', 'Verben', 'Länder', 'Konnektoren', 'Andere']
    },
    en: {
      section: 'Section',
      cardType: 'Card Type',
      wordOnly: 'Word Only',
      sentenceOnly: 'Sentence Only',
      both: 'Word and Sentence',
      word: 'Word',
      wordPlaceholder: 'e.g., Apfel',
      translation: 'Translation',
      translationPlaceholder: 'e.g., Apple',
      sentence: 'Sentence (Example)',
      sentencePlaceholder: 'e.g., Ich esse einen Apfel.',
      sentenceTranslation: 'Sentence Translation',
      sentenceTranslationPlaceholder: 'e.g., I am eating an apple.',
      image: 'Image',
      imagePlaceholder: 'paste image link here',
      wordAudio: 'Word Audio',
      audioPlaceholder: 'paste audio link here',
      sentenceAudio: 'Sentence Audio',
      sentenceAudioPlaceholder: 'paste sentence audio link here',
      month: 'Month',
      week: 'Week',
      day: 'Day',
      save: 'Save Card',
      sections: ['Lesson Words', 'New Words', 'Greetings', 'Basics', 'Introductions', 'Verbs', 'Countries', 'Connectors', 'Others']
    }
  }[language];

  const sections = t.sections;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="w-full max-w-2xl bg-[#f5f5f5] rounded-[40px] p-8 shadow-2xl my-8 relative"
          >
            <button onClick={onClose} className={`absolute top-6 ${isRTL ? 'left-6' : 'right-6'} p-2 text-gray-400 hover:text-gray-600`}>
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-8">{title}</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <NeumorphicSelect 
                  options={sections}
                  value={formData.section || sections[0]}
                  onChange={e => setFormData({...formData, section: e.target.value})}
                  placeholder={t.section}
                />
                <NeumorphicSelect 
                  options={[
                    { label: t.wordOnly, value: 'word' },
                    { label: t.sentenceOnly, value: 'sentence' },
                    { label: t.both, value: 'both' }
                  ]}
                  value={formData.type || 'both'}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  placeholder={t.cardType}
                />
              </div>

              {(formData.type === 'word' || formData.type === 'both' || !formData.type) && (
                <div className="grid grid-cols-2 gap-4">
                  <NeumorphicInput 
                    placeholder={t.wordPlaceholder}
                    value={formData.word}
                    onChange={e => setFormData({...formData, word: e.target.value})}
                    icon={Type}
                  />
                  <NeumorphicInput 
                    placeholder={t.translationPlaceholder}
                    value={formData.translation}
                    onChange={e => setFormData({...formData, translation: e.target.value})}
                    icon={Type}
                  />
                </div>
              )}

              {(formData.type === 'sentence' || formData.type === 'both') && (
                <div className="grid grid-cols-2 gap-4">
                  <NeumorphicInput 
                    placeholder={t.sentencePlaceholder}
                    value={formData.sentence}
                    onChange={e => setFormData({...formData, sentence: e.target.value})}
                    icon={Type}
                  />
                  <NeumorphicInput 
                    placeholder={t.sentenceTranslationPlaceholder}
                    value={formData.sentenceTranslation || ''}
                    onChange={e => setFormData({...formData, sentenceTranslation: e.target.value})}
                    icon={Type}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <NeumorphicInput 
                  placeholder={t.imagePlaceholder}
                  value={formData.imageUrl}
                  onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                  icon={ImageIcon}
                />
                <NeumorphicInput 
                  placeholder={t.audioPlaceholder}
                  value={formData.audioUrl}
                  onChange={e => setFormData({...formData, audioUrl: e.target.value})}
                  icon={Volume2}
                />
              </div>

              <NeumorphicInput 
                placeholder={t.sentenceAudioPlaceholder}
                value={formData.sentenceAudioUrl || ''}
                onChange={e => setFormData({...formData, sentenceAudioUrl: e.target.value})}
                icon={Volume2}
              />

              <div className="grid grid-cols-3 gap-4">
                <NeumorphicInput 
                  placeholder={t.month}
                  type="number"
                  value={formData.month.toString()}
                  onChange={e => setFormData({...formData, month: parseInt(e.target.value) || 1})}
                />
                <NeumorphicInput 
                  placeholder={t.week}
                  type="number"
                  value={formData.week.toString()}
                  onChange={e => setFormData({...formData, week: parseInt(e.target.value) || 1})}
                />
                <NeumorphicInput 
                  placeholder={t.day}
                  type="number"
                  value={formData.day.toString()}
                  onChange={e => setFormData({...formData, day: parseInt(e.target.value) || 1})}
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
