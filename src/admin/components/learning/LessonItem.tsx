import React from 'react';
import { motion } from 'motion/react';
import { Pencil, Trash2, Video, FileText, Type, CircleCheck, Clock, Award, Eye, GripVertical, PlayCircle, File } from 'lucide-react';

interface Lesson {
  id: string;
  level: string;
  title: string;
  type: 'video' | 'file' | 'text' | 'task';
  content: string;
  month: number;
  week: number;
  day: number;
  displayMode?: 'link' | 'embed';
  duration?: string;
  points?: number;
}

interface LessonItemProps {
  lesson: Lesson;
  onEdit: (lesson: Lesson) => void;
  onDelete: (id: string) => void;
  onPreview?: (lesson: Lesson) => void;
  dragHandleProps?: any;
  language?: 'ar' | 'de' | 'en';
}

export const LessonItem: React.FC<LessonItemProps> = ({ lesson, onEdit, onDelete, onPreview, dragHandleProps, language = 'ar' }) => {
  const isRTL = language === 'ar' || language === 'de';
  
  const t = {
    ar: {
      duration: 'دقائق',
      points: 'نقطة',
      embed: 'مضمن',
      preview: 'معاينة',
      edit: 'تعديل',
      delete: 'حذف'
    },
    de: {
      duration: 'Minuten',
      points: 'Punkte',
      embed: 'Eingebettet',
      preview: 'Vorschau',
      edit: 'Bearbeiten',
      delete: 'Löschen'
    },
    en: {
      duration: 'minutes',
      points: 'points',
      embed: 'Embedded',
      preview: 'Preview',
      edit: 'Edit',
      delete: 'Delete'
    }
  }[language];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-6 rounded-3xl bg-white shadow-[8px_8px_16px_#d1d1d1,-8px_-8px_16px_#ffffff] flex items-center justify-between group mb-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex items-center gap-6">
        <div 
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <GripVertical className="w-5 h-5" />
        </div>
        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center shadow-inner">
          {lesson.type === 'video' && <PlayCircle className="w-6 h-6 text-blue-500" />}
          {lesson.type === 'file' && <File className="w-6 h-6 text-emerald-500" />}
          {lesson.type === 'text' && <Type className="w-6 h-6 text-amber-500" />}
          {lesson.type === 'task' && <CircleCheck className="w-6 h-6 text-purple-500" />}
        </div>
        <div>
          <h4 className="text-lg font-bold text-gray-900">{lesson.title}</h4>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{lesson.duration || `5 ${t.duration}`}</span>
            <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" />{lesson.points || 10} {t.points}</span>
            {lesson.displayMode === 'embed' && (
              <span className="flex items-center gap-1 text-blue-500">
                <Eye className="w-3.5 h-3.5" /> {t.embed}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {onPreview && (
          <button 
            onClick={() => onPreview(lesson)}
            className="p-3 rounded-xl bg-white shadow-sm text-amber-500 hover:bg-amber-50 transition-colors"
            title={t.preview}
          >
            <Eye className="w-5 h-5" />
          </button>
        )}
        <button 
          onClick={() => onEdit(lesson)}
          className="p-3 rounded-xl bg-white shadow-sm text-blue-500 hover:bg-blue-50 transition-colors"
          title={t.edit}
        >
          <Pencil className="w-5 h-5" />
        </button>
        <button 
          onClick={() => onDelete(lesson.id)}
          className="p-3 rounded-xl bg-white shadow-sm text-red-500 hover:bg-red-50 transition-colors"
          title={t.delete}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};
