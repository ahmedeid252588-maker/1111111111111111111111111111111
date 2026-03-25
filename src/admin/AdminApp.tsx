
import React, { useState, useEffect } from 'react';
import AdminSidebar from './components/AdminSidebar';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminLearning from './pages/AdminLearning';
import AdminLibrary from './pages/AdminLibrary';
import AdminNotifications from './pages/AdminNotifications';
import AdminQuizzes from './pages/AdminQuizzes';
import AdminSettings from './pages/AdminSettings';
import AdminSubscriptions from './pages/AdminSubscriptions';
import AdminMarketers from './pages/AdminMarketers';
import AdminReferrals from './pages/AdminReferrals';

import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { UserProfile } from '../types';

const AdminApp = ({ onLogout, onToggleView }: { onLogout: () => void, onToggleView: () => void }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [adminProfile, setAdminProfile] = useState<UserProfile | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'german' | 'english'>(() => {
    return (localStorage.getItem('adminSelectedLanguage') as any) || 'german';
  });

  const adminName = auth.currentUser?.displayName || 'المدير';

  useEffect(() => {
    localStorage.setItem('adminSelectedLanguage', selectedLanguage);
  }, [selectedLanguage]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as UserProfile;
        setAdminProfile(data);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${auth.currentUser?.uid}`);
    });
    return () => unsubscribe();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminDashboard onNavigate={setActiveTab} language={selectedLanguage} />;
      case 'users':
        return <AdminUsers language={selectedLanguage} />;
      case 'subscriptions':
        return <AdminSubscriptions language={selectedLanguage} />;
      case 'marketers':
        return <AdminMarketers language={selectedLanguage} />;
      case 'referrals':
        return <AdminReferrals />;
      case 'learning':
        return <AdminLearning language={selectedLanguage} />;
      case 'library':
        return <AdminLibrary language={selectedLanguage} />;
      case 'notifications':
        return <AdminNotifications language={selectedLanguage} />;
      case 'quizzes':
        return <AdminQuizzes language={selectedLanguage} />;
      case 'settings':
        return <AdminSettings language={selectedLanguage} />;
      default:
        return <AdminDashboard onNavigate={setActiveTab} language={selectedLanguage} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#f5f5f5] overflow-hidden font-sans" dir="rtl">
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={onLogout} 
        onToggleView={onToggleView} 
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Admin Header */}
        <header className="h-24 bg-[#f5f5f5] flex items-center justify-between px-4 md:px-10 shrink-0 border-b border-white/40">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl bg-[#f5f5f5] shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] flex items-center justify-center text-[#4d9685] font-black text-lg md:text-xl">A</div>
            <div className="text-right">
              <p className="text-base md:text-lg font-black text-[#4a4a4a]">{adminName}</p>
              <p className="text-xs md:text-sm text-slate-400 font-bold">مدير النظام</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-6">
            {/* Language Selector */}
            <div className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-2xl shadow-inner ml-4">
              <button
                onClick={() => {
                  setSelectedLanguage('german');
                  if (auth.currentUser) {
                    import('firebase/firestore').then(({ updateDoc, doc }) => {
                      updateDoc(doc(db, 'users', auth.currentUser!.uid), { language: 'german' }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser?.uid}`));
                    });
                  }
                }}
                className={`px-4 py-2 rounded-xl font-bold transition-all text-sm ${
                  selectedLanguage === 'german' 
                    ? 'bg-white text-[#4d9685] shadow-[2px_2px_5px_rgba(0,0,0,0.05)]' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                الألمانية
              </button>
              <button
                onClick={() => {
                  setSelectedLanguage('english');
                  if (auth.currentUser) {
                    import('firebase/firestore').then(({ updateDoc, doc }) => {
                      updateDoc(doc(db, 'users', auth.currentUser!.uid), { language: 'english' }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser?.uid}`));
                    });
                  }
                }}
                className={`px-4 py-2 rounded-xl font-bold transition-all text-sm ${
                  selectedLanguage === 'english' 
                    ? 'bg-white text-[#4d9685] shadow-[2px_2px_5px_rgba(0,0,0,0.05)]' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                الإنجليزية
              </button>
            </div>

            <button 
              onClick={onToggleView}
              className="px-3 md:px-6 h-10 md:h-12 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] font-bold text-sm md:text-base hover:bg-blue-100 transition-all"
            >
              وضع الطالب
            </button>
            <button 
              onClick={onLogout}
              className="hidden md:flex px-6 h-12 items-center justify-center bg-red-50 text-red-500 rounded-xl shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] font-bold hover:bg-red-100 transition-all"
            >
              تسجيل الخروج
            </button>
            <button 
              onClick={() => setActiveTab('notifications')}
              className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-[#f5f5f5] rounded-xl shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] text-slate-400 hover:text-slate-600 transition-all relative"
            >
              <div className="absolute top-2 right-2 w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded-full border-2 border-[#f5f5f5]"></div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminApp;
