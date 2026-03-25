import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Link as LinkIcon, Loader2, BookOpen, Clock, Award } from 'lucide-react';
import { NeumorphicInput, NeumorphicSelect, NeumorphicTextArea, NeumorphicButton } from '../../../components/Neumorphic';

interface LessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  formData: any;
  setFormData: (data: any) => void;
  title: string;
  isSaving?: boolean;
  language?: 'ar' | 'de' | 'en';
}

export const LessonModal: React.FC<LessonModalProps> = ({ isOpen, onClose, onSave, formData, setFormData, title, isSaving, language = 'ar' }) => {
  const isRTL = language === 'ar' || language === 'de';
  
  const t = {
    ar: {
      lessonTitle: 'عنوان الدرس',
      lessonTitlePlaceholder: 'مثال: مقدمة في المتغيرات',
      contentType: 'نوع المحتوى',
      video: 'فيديو (يوتيوب/درايف/مباشر)',
      file: 'ملف (PDF/Doc/درايف)',
      text: 'نص / مقال',
      task: 'مهمة / واجب',
      month: 'الشهر',
      week: 'الأسبوع',
      day: 'اليوم',
      lessonContent: 'محتوى الدرس',
      embed: 'تضمين (عرض في التطبيق)',
      link: 'رابط (فتح في نافذة جديدة)',
      contentPlaceholderText: 'اكتب محتوى الدرس هنا...',
      contentPlaceholderLink: 'ضع الرابط هنا أو ارفع ملفاً',
      driveWarning: 'تم اكتشاف رابط جوجل درايف. تأكد من أن إعدادات المشاركة هي "أي شخص لديه الرابط".',
      duration: 'المدة (مثال: 15 دقيقة)',
      points: 'نقاط المكافأة',
      save: 'حفظ الدرس'
    },
    de: {
      lessonTitle: 'Lektionstitel',
      lessonTitlePlaceholder: 'z.B. Einführung in Variablen',
      contentType: 'Inhaltstyp',
      video: 'Video (YouTube/Drive/Direkt)',
      file: 'Datei (PDF/Doc/Drive)',
      text: 'Text / Artikel',
      task: 'Aufgabe / Hausaufgabe',
      month: 'Monat',
      week: 'Woche',
      day: 'Tag',
      lessonContent: 'Lektionsinhalt',
      embed: 'Einbetten (In der App anzeigen)',
      link: 'Link (In neuem Fenster öffnen)',
      contentPlaceholderText: 'Schreiben Sie den Lektionsinhalt hier...',
      contentPlaceholderLink: 'Link hier einfügen oder Datei hochladen',
      driveWarning: 'Google Drive Link erkannt. Stellen Sie sicher, dass die Freigabe auf "Jeder mit dem Link" eingestellt ist.',
      duration: 'Dauer (z.B. 15 Minuten)',
      points: 'Bonuspunkte',
      save: 'Lektion speichern'
    },
    en: {
      lessonTitle: 'Lesson Title',
      lessonTitlePlaceholder: 'e.g., Introduction to Variables',
      contentType: 'Content Type',
      video: 'Video (YouTube/Drive/Direct)',
      file: 'File (PDF/Doc/Drive)',
      text: 'Text / Article',
      task: 'Task / Homework',
      month: 'Month',
      week: 'Week',
      day: 'Day',
      lessonContent: 'Lesson Content',
      embed: 'Embed (Show in App)',
      link: 'Link (Open in New Window)',
      contentPlaceholderText: 'Write lesson content here...',
      contentPlaceholderLink: 'Paste link here or upload a file',
      driveWarning: 'Google Drive link detected. Ensure sharing is set to "Anyone with the link".',
      duration: 'Duration (e.g., 15 minutes)',
      points: 'Bonus Points',
      save: 'Save Lesson'
    }
  }[language];

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
                <NeumorphicInput 
                  placeholder={t.lessonTitlePlaceholder}
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  icon={BookOpen}
                />
                <NeumorphicSelect 
                  options={[
                    { label: t.video, value: 'video' },
                    { label: t.file, value: 'file' },
                    { label: t.text, value: 'text' },
                    { label: t.task, value: 'task' }
                  ]}
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                />
              </div>

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

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-gray-500">{t.lessonContent}</label>
                  {(formData.type === 'video' || formData.type === 'file') && (
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-400 cursor-pointer">
                        <input 
                          type="radio" 
                          name="displayMode" 
                          checked={formData.displayMode === 'embed'} 
                          onChange={() => setFormData({...formData, displayMode: 'embed'})}
                        />
                        {t.embed}
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-400 cursor-pointer">
                        <input 
                          type="radio" 
                          name="displayMode" 
                          checked={formData.displayMode === 'link'} 
                          onChange={() => setFormData({...formData, displayMode: 'link'})}
                        />
                        {t.link}
                      </label>
                    </div>
                  )}
                </div>

                <NeumorphicTextArea 
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  placeholder={formData.type === 'text' ? t.contentPlaceholderText : t.contentPlaceholderLink}
                />
                
                {formData.content?.includes('drive.google.com') && (
                  <p className="mt-2 text-[10px] text-amber-600 font-bold flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" />
                    {t.driveWarning}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <NeumorphicInput 
                  placeholder={t.duration}
                  value={formData.duration}
                  onChange={e => setFormData({...formData, duration: e.target.value})}
                  icon={Clock}
                />
                <NeumorphicInput 
                  placeholder={t.points}
                  type="number"
                  value={formData.points.toString()}
                  onChange={e => setFormData({...formData, points: parseInt(e.target.value) || 0})}
                  icon={Award}
                />
              </div>

              <NeumorphicButton 
                onClick={onSave}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {t.save}
              </NeumorphicButton>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
