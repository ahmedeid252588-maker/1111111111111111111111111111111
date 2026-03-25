import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TriangleAlert, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  language?: 'ar' | 'de' | 'en';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  isDestructive = true,
  language = 'ar',
}) => {
  const isRTL = language === 'ar' || language === 'de';
  
  const t = {
    ar: {
      confirm: 'تأكيد',
      cancel: 'إلغاء',
    },
    de: {
      confirm: 'Bestätigen',
      cancel: 'Abbrechen',
    },
    en: {
      confirm: 'Confirm',
      cancel: 'Cancel',
    }
  }[language];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" dir={isRTL ? 'rtl' : 'ltr'}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl relative overflow-hidden"
          >
            <button
              onClick={onCancel}
              className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4 mb-6">
              <div className={`p-3 rounded-2xl ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                <TriangleAlert className="w-6 h-6" />
              </div>
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{message}</p>
              </div>
            </div>

            <div className={`flex items-center ${isRTL ? 'justify-end' : 'justify-start'} gap-3 pt-4 border-t border-gray-100`}>
              <button
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                {cancelText || t.cancel}
              </button>
              <button
                onClick={onConfirm}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-md hover:shadow-lg ${
                  isDestructive
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                    : 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20'
                }`}
              >
                {confirmText || t.confirm}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
