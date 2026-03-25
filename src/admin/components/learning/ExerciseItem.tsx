import React from 'react';
import { motion } from 'motion/react';
import { Brain, Pencil, Trash2, Eye, Volume2, Image as ImageIcon, Type, Puzzle } from 'lucide-react';
import { Exercise } from '../../../types';
import { NeumorphicCard } from '../../../components/Neumorphic';

interface ExerciseItemProps {
  exercise: Exercise;
  onEdit: (exercise: Exercise) => void;
  onDelete: (id: string) => void;
  onPreview: (exercise: Exercise) => void;
  language?: 'ar' | 'de' | 'en';
}

export const ExerciseItem: React.FC<ExerciseItemProps> = ({ exercise, onEdit, onDelete, onPreview, language = 'ar' }) => {
  const isRTL = language === 'ar' || language === 'de';
  
  const t = {
    ar: {
      preview: 'معاينة',
      edit: 'تعديل',
      delete: 'حذف',
      MATCH_WORD_TRANSLATION: 'توصيل كلمة بالترجمة',
      CONSTRUCT_WORD: 'تكوين كلمة',
      MATCH_IMAGE_WORD: 'توصيل صورة بالكلمة',
      TRUE_FALSE_IMAGE: 'صح أم خطأ (صورة)',
      LISTEN_CONSTRUCT_WORD: 'استماع وتكوين كلمة',
      LISTEN_CHOOSE_IMAGE: 'استماع واختيار صورة',
      CHOOSE_WORD_TRANSLATION: 'اختيار الكلمة الصحيحة',
      LISTEN_TRUE_FALSE: 'استماع وصح أم خطأ'
    },
    de: {
      preview: 'Vorschau',
      edit: 'Bearbeiten',
      delete: 'Löschen',
      MATCH_WORD_TRANSLATION: 'Wort-Übersetzung zuordnen',
      CONSTRUCT_WORD: 'Wort bilden',
      MATCH_IMAGE_WORD: 'Bild-Wort zuordnen',
      TRUE_FALSE_IMAGE: 'Richtig/Falsch (Bild)',
      LISTEN_CONSTRUCT_WORD: 'Hören und Wort bilden',
      LISTEN_CHOOSE_IMAGE: 'Hören und Bild wählen',
      CHOOSE_WORD_TRANSLATION: 'Richtiges Wort wählen',
      LISTEN_TRUE_FALSE: 'Hören und Richtig/Falsch'
    },
    en: {
      preview: 'Preview',
      edit: 'Edit',
      delete: 'Delete',
      MATCH_WORD_TRANSLATION: 'Match Word to Translation',
      CONSTRUCT_WORD: 'Construct Word',
      MATCH_IMAGE_WORD: 'Match Image to Word',
      TRUE_FALSE_IMAGE: 'True/False (Image)',
      LISTEN_CONSTRUCT_WORD: 'Listen and Construct Word',
      LISTEN_CHOOSE_IMAGE: 'Listen and Choose Image',
      CHOOSE_WORD_TRANSLATION: 'Choose Correct Word',
      LISTEN_TRUE_FALSE: 'Listen and True/False'
    }
  }[language];

  const getExerciseIcon = (type: string) => {
    switch (type) {
      case 'MATCH_WORD_TRANSLATION': return <Type className="w-6 h-6" />;
      case 'CONSTRUCT_WORD': return <Puzzle className="w-6 h-6" />;
      case 'MATCH_IMAGE_WORD': return <ImageIcon className="w-6 h-6" />;
      case 'TRUE_FALSE_IMAGE': return <ImageIcon className="w-6 h-6" />;
      case 'LISTEN_CONSTRUCT_WORD': return <Volume2 className="w-6 h-6" />;
      case 'LISTEN_CHOOSE_IMAGE': return <Volume2 className="w-6 h-6" />;
      case 'CHOOSE_WORD_TRANSLATION': return <Type className="w-6 h-6" />;
      case 'LISTEN_TRUE_FALSE': return <Volume2 className="w-6 h-6" />;
      default: return <Brain className="w-6 h-6" />;
    }
  };

  const getTypeName = (type: string) => {
    return (t as any)[type] || type;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <NeumorphicCard className="flex items-center justify-between group" onClick={() => {}}>
        <div className="flex items-center gap-4" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center text-purple-500">
            {getExerciseIcon(exercise.type)}
          </div>
          <div>
            <h3 className="font-bold text-gray-800">{exercise.title}</h3>
            <p className="text-xs text-gray-500 font-bold">{getTypeName(exercise.type)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onPreview(exercise)}
            className="p-2 rounded-xl bg-white shadow-sm text-blue-500 hover:scale-110 transition-transform"
            title={t.preview}
          >
            <Eye className="w-5 h-5" />
          </button>
          <button 
            onClick={() => onEdit(exercise)}
            className="p-2 rounded-xl bg-white shadow-sm text-emerald-500 hover:scale-110 transition-transform"
            title={t.edit}
          >
            <Pencil className="w-5 h-5" />
          </button>
          <button 
            onClick={() => onDelete(exercise.id)}
            className="p-2 rounded-xl bg-white shadow-sm text-red-500 hover:scale-110 transition-transform"
            title={t.delete}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </NeumorphicCard>
    </motion.div>
  );
};
