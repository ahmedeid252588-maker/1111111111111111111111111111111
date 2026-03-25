import React from 'react';
import { User, Mail, Phone, Calendar, LogOut, ChevronRight } from 'lucide-react';
import { UserProfile } from '../types';
import { NeumorphicCard } from './Neumorphic';

interface SettingsProps {
  user: UserProfile | null;
  onLogout: () => void;
  onBack: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ user, onLogout, onBack }) => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200">
          <ChevronRight className="rotate-180" />
        </button>
        <h2 className="text-2xl font-bold">الإعدادات</h2>
      </div>

      <NeumorphicCard className="p-6 space-y-4">
        <h3 className="text-lg font-bold">معلومات الحساب</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <User className="text-gray-400" />
            <span>{user?.displayName}</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="text-gray-400" />
            <span>{user?.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="text-gray-400" />
            <span>{user?.whatsapp}</span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="text-gray-400" />
            <span>العمر: {user?.age}</span>
          </div>
        </div>
      </NeumorphicCard>

      <button 
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 p-4 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-200"
      >
        <LogOut size={20} />
        تسجيل الخروج
      </button>
    </div>
  );
};
