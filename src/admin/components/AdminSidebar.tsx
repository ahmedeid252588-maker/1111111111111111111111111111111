
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Bell, 
  Settings, 
  LogOut,
  ChevronRight,
  Menu,
  X,
  FileText,
  Calendar,
  ClipboardList,
  Newspaper,
  Home,
  Languages,
  BrainCircuit,
  RefreshCw,
  CreditCard,
  Briefcase
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onToggleView: () => void;
}

const AdminSidebar = ({ activeTab, setActiveTab, onLogout, onToggleView }: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const t = {
    users: 'إدارة المستخدمين',
    overview: 'نظرة عامة',
    learning: 'إدارة التعلم',
    library: 'إدارة المكتبة',
    notifications: 'إرسال إشعارات',
    quizzes: 'إدارة الاختبارات',
    settings: 'إعدادات النظام',
    backToApp: 'العودة للتطبيق',
    logout: 'تسجيل الخروج',
  };

  const menuItems = [
    { id: 'overview', label: t.overview, icon: LayoutDashboard },
    { id: 'users', label: t.users, icon: Users },
    { id: 'subscriptions', label: 'طلبات الاشتراك', icon: CreditCard },
    { id: 'marketers', label: 'المسوقين', icon: Briefcase },
    { id: 'referrals', label: 'دعوات المستخدمين', icon: Users },
    { id: 'learning', label: t.learning, icon: GraduationCap },
    { id: 'quizzes', label: t.quizzes, icon: BrainCircuit },
    { id: 'library', label: t.library, icon: BookOpen },
    { id: 'notifications', label: t.notifications, icon: Bell },
    { id: 'settings', label: t.settings, icon: Settings },
  ];

  const isRTL = true;

  return (
    <div className={`bg-[#f5f5f5] h-screen transition-all duration-300 flex flex-col ${isRTL ? 'border-l' : 'border-r'} border-white/40 z-50 ${isOpen ? 'w-72 absolute md:relative' : 'w-0 md:w-24 overflow-hidden'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="p-8 flex items-center justify-between">
        {isOpen && (
          <h1 className="text-2xl font-black text-[#4a4a4a] tracking-tighter">
            <>لوحة <span className="text-[#ff9a9a]">التحكم</span></>
          </h1>
        )}
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="w-10 h-10 flex items-center justify-center bg-[#f5f5f5] rounded-xl shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] text-slate-400 hover:text-slate-600 transition-all shrink-0"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center p-4 rounded-[20px] transition-all ${
              activeTab === item.id 
                ? 'bg-[#f5f5f5] shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff] text-[#4d9685]' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <item.icon size={24} className={activeTab === item.id ? 'text-[#4d9685]' : ''} />
            {isOpen && <span className={`${isRTL ? 'mr-4' : 'ml-4'} font-bold text-lg`}>{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-6 space-y-4">
        <button 
          onClick={onToggleView}
          className="w-full flex items-center p-4 bg-[#f5f5f5] rounded-[20px] shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] text-emerald-500 hover:scale-[1.02] transition-all"
        >
          <Home size={24} />
          {isOpen && <span className={`${isRTL ? 'mr-4' : 'ml-4'} font-bold`}>{t.backToApp}</span>}
        </button>
        <button 
          onClick={onLogout}
          className="w-full flex items-center p-4 bg-[#f5f5f5] rounded-[20px] shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] text-red-400 hover:scale-[1.02] transition-all"
        >
          <LogOut size={24} />
          {isOpen && <span className={`${isRTL ? 'mr-4' : 'ml-4'} font-bold`}>{t.logout}</span>}
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
