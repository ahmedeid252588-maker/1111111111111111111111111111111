import React from 'react';
import { motion } from 'motion/react';
import { Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  level: string;
  status: 'active' | 'draft' | 'archived';
  description?: string;
}

interface CourseCardProps {
  course: Course;
  onEdit: (course: Course) => void;
  onDelete: (id: string) => void;
  onManage: (course: Course) => void;
  language?: 'ar' | 'de' | 'en';
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onEdit, onDelete, onManage, language = 'ar' }) => {
  const isRTL = language === 'ar' || language === 'de';
  
  const t = {
    ar: {
      active: 'نشط',
      draft: 'مسودة',
      archived: 'مؤرشف',
      level: 'مستوى',
      Beginner: 'مبتدئ',
      Intermediate: 'متوسط',
      Advanced: 'متقدم',
      Expert: 'خبير',
      manage: 'إدارة المنهج'
    },
    de: {
      active: 'Aktiv',
      draft: 'Entwurf',
      archived: 'Archiviert',
      level: 'Niveau',
      Beginner: 'Anfänger',
      Intermediate: 'Mittelstufe',
      Advanced: 'Fortgeschritten',
      Expert: 'Experte',
      manage: 'Lehrplan verwalten'
    },
    en: {
      active: 'Active',
      draft: 'Draft',
      archived: 'Archived',
      level: 'Level',
      Beginner: 'Beginner',
      Intermediate: 'Intermediate',
      Advanced: 'Advanced',
      Expert: 'Expert',
      manage: 'Manage Curriculum'
    }
  }[language];

  return (
    <motion.div
      layoutId={course.id}
      className="p-6 rounded-[32px] bg-[#e0e0e0] shadow-[12px_12px_24px_#bebebe,-12px_-12px_24px_#ffffff] border border-white/20 group"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          course.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
        }`}>
          {t[course.status] || course.status}
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(course)} className="p-2 rounded-lg bg-white shadow-sm text-blue-500 hover:text-blue-700">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(course.id)} className="p-2 rounded-lg bg-white shadow-sm text-red-500 hover:text-red-700">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-1">{course.title}</h3>
      <p className="text-sm text-gray-500 mb-6">{t.level} {t[course.level] || course.level}</p>
      
      <button 
        onClick={() => onManage(course)}
        className="w-full py-3 rounded-xl bg-white shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] text-sm font-bold text-gray-700 hover:shadow-inner flex items-center justify-center gap-2"
      >
        {t.manage}
        {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
    </motion.div>
  );
};
