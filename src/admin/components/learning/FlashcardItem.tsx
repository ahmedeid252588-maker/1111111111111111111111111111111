import React from 'react';
import { Volume2, Trash2, Pencil, File } from 'lucide-react';
import { getDirectLink } from '../../../constants.tsx';
import { NeumorphicCard } from '../../../components/Neumorphic';

interface FlashcardItemProps {
  flashcard: any;
  onDelete: (id: string) => void;
  onEdit: (flashcard: any) => void;
  language?: 'ar' | 'de' | 'en';
}

export const FlashcardItem: React.FC<FlashcardItemProps> = ({ flashcard, onDelete, onEdit, language = 'ar' }) => {
  const isRTL = language === 'ar' || language === 'de';
  
  const t = {
    ar: {
      playAudio: 'تشغيل الصوت',
      edit: 'تعديل',
      delete: 'حذف'
    },
    de: {
      playAudio: 'Audio abspielen',
      edit: 'Bearbeiten',
      delete: 'Löschen'
    },
    en: {
      playAudio: 'Play Audio',
      edit: 'Edit',
      delete: 'Delete'
    }
  }[language];

  const playAudio = () => {
    if (flashcard.audioUrl) {
      const directUrl = getDirectLink(flashcard.audioUrl);
      const audio = new Audio(directUrl);
      audio.play().catch(e => console.error("Error playing audio:", e));
    }
  };

  return (
    <NeumorphicCard className="p-4 flex items-center justify-between" onClick={() => {}}>
      <div className="flex items-center gap-4 overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
        {flashcard.imageUrl ? (
          <img src={flashcard.imageUrl} alt={flashcard.word} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-400">
            <File className="w-6 h-6" />
          </div>
        )}
        <div className="min-w-0">
          <h4 className="font-bold text-gray-900 truncate">{flashcard.word}</h4>
          <p className="text-sm text-gray-500 truncate">{flashcard.translation}</p>
          {flashcard.sentence && <p className="text-xs text-gray-400 mt-1 truncate">{flashcard.sentence}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {flashcard.audioUrl && (
          <button onClick={playAudio} className="p-2 text-blue-500 hover:text-blue-600 transition-colors" title={t.playAudio}>
            <Volume2 className="w-5 h-5" />
          </button>
        )}
        <button onClick={() => onEdit(flashcard)} className="p-2 text-emerald-500 hover:text-emerald-600 transition-colors" title={t.edit}>
          <Pencil className="w-5 h-5" />
        </button>
        <button onClick={() => onDelete(flashcard.id)} className="p-2 text-red-500 hover:text-red-600 transition-colors" title={t.delete}>
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </NeumorphicCard>
  );
};
