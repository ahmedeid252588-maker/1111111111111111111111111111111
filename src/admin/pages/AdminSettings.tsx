
import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Globe, 
  Shield, 
  Bell, 
  Database, 
  Mail, 
  Lock, 
  Smartphone, 
  Save, 
  RefreshCw,
  CircleAlert,
  CircleCheck,
  ChevronLeft,
  Play
} from 'lucide-react';
import { 
  NeumorphicCard, 
  NeumorphicButton, 
  NeumorphicInput, 
  NeumorphicSelect,
  NeumorphicSwitch
} from '../../components/Neumorphic';
import ConfirmModal from '../components/ConfirmModal';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const AdminSettings: React.FC<{ language: string }> = ({ language }) => {
  const [activeSection, setActiveSection] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initializingDb, setInitializingDb] = useState(false);
  const [showInitConfirm, setShowInitConfirm] = useState(false);

  const t = {
    title: 'إعدادات النظام',
    subtitle: 'التحكم في جميع جوانب المنصة وإعداداتها التقنية',
    general: 'الإعدادات العامة',
    security: 'الأمن والخصوصية',
    notifications: 'إعدادات الإشعارات',
    backup: 'النسخ الاحتياطي',
    platformName: 'اسم المنصة',
    supportEmail: 'بريد الدعم الإلكتروني',
    defaultLanguage: 'اللغة الافتراضية',
    timezone: 'المنطقة الزمنية',
    displayOptions: 'خيارات العرض',
    autoDarkMode: 'الوضع المظلم التلقائي',
    showLeaderboard: 'عرض لوحة المتصدرين للطلاب',
    enableRewards: 'تفعيل نظام النقاط والمكافآت',
    securityPolicies: 'سياسات الأمان',
    enable2FA: 'تفعيل المصادقة الثنائية (2FA)',
    forcePasswordChange: 'فرض تغيير كلمة المرور كل 90 يوماً',
    preventConcurrentLogins: 'منع تسجيل الدخول المتزامن من أجهزة متعددة',
    minPasswordLength: 'الحد الأدنى لطول كلمة المرور',
    maxFailedLogins: 'أقصى عدد لمحاولات تسجيل الدخول الفاشلة',
    loading: 'جاري تحميل الإعدادات...',
    saveSettings: 'حفظ الإعدادات',
    saving: 'جاري الحفظ...',
    cancelChanges: 'إلغاء التغييرات',
    successSave: 'تم حفظ الإعدادات بنجاح',
    errorSave: 'خطأ في حفظ الإعدادات',
    errorLoad: 'خطأ في تحميل الإعدادات',
    updateAvailable: 'تحديث متاح',
    currentVersion: 'إصدار النظام الحالي هو 2.4.0. يتوفر تحديث جديد 2.5.0 مع تحسينات أمنية.',
    updateNow: 'تحديث الآن',
    inDevelopment: 'هذا القسم قيد التطوير حالياً',
    german: 'الألمانية',
    arabic: 'العربية',
    chooseLanguage: 'اختر اللغة',
    chooseTimezone: 'اختر المنطقة الزمنية',
    initDbTitle: 'تهيئة قاعدة البيانات',
    initDbDesc: 'إنشاء الجداول الأساسية وإضافة بيانات تجريبية (لأول مرة فقط)',
    initDbBtn: 'تهيئة قاعدة البيانات الآن',
    initDbSuccess: 'تم تهيئة قاعدة البيانات بنجاح!',
    initDbError: 'حدث خطأ أثناء تهيئة قاعدة البيانات',
  };

  const [settings, setSettings] = useState({
    general: {
      platformName: 'DEUTSCH ACADEMY',
      supportEmail: 'support@example.com',
      defaultLanguage: t.german,
      timezone: 'Berlin (GMT+1)',
      autoDarkMode: true,
      showLeaderboard: true,
      enableRewards: true
    },
    security: {
      enable2FA: false,
      forcePasswordChange: false,
      preventConcurrentLogins: true,
      minPasswordLength: 8,
      maxFailedLogins: 5
    }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'system', `settings_${language}`);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setSettings(docSnap.data() as any);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `system/settings_${language}`);
        toast.error(t.errorLoad);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [language, t.errorLoad]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'system', `settings_${language}`), { ...settings, language });
      toast.success(t.successSave);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `system/settings_${language}`);
      toast.error(t.errorSave);
    } finally {
      setSaving(false);
    }
  };

  const handleInitDb = async () => {
    setInitializingDb(true);
    try {
      const isGerman = language === 'german';
      
      // Create a dummy course
      const courseRef = await addDoc(collection(db, `courses_${language}`), {
        title: isGerman ? 'كورس اللغة الألمانية للمبتدئين A1' : 'كورس اللغة الإنجليزية للمبتدئين A1',
        level: 'A1',
        status: 'active',
        description: isGerman ? 'كورس شامل لتعلم أساسيات اللغة الألمانية من الصفر.' : 'كورس شامل لتعلم أساسيات اللغة الإنجليزية من الصفر.'
      });

      // Create a dummy lesson
      await addDoc(collection(db, `lessons_${language}`), {
        title: isGerman ? 'الدرس الأول: الحروف الأبجدية' : 'الدرس الأول: الحروف الأبجدية',
        type: 'video',
        content: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        month: 1,
        week: 1,
        day: 1,
        displayMode: 'embed',
        duration: '15 دقيقة',
        points: 10,
        courseId: courseRef.id,
        language: language,
        createdAt: new Date()
      });

      // Create a dummy library item
      await addDoc(collection(db, `library_${language}`), {
        name: isGerman ? 'كتاب القواعد الأساسية' : 'كتاب القواعد الأساسية',
        category: 'books',
        type: 'PDF',
        url: 'https://example.com/book.pdf',
        description: isGerman ? 'كتاب شامل لقواعد اللغة الألمانية للمستوى A1' : 'كتاب شامل لقواعد اللغة الإنجليزية للمستوى A1',
        tags: isGerman ? ['قواعد', 'مبتدئين', 'A1'] : ['grammar', 'beginners', 'A1'],
        language: language
      });

      // Create a dummy flashcard
      await addDoc(collection(db, `flashcards_${language}`), {
        word: isGerman ? 'Hallo' : 'Hello',
        translation: 'مرحباً',
        sentence: isGerman ? 'Hallo, wie geht es dir?' : 'Hello, how are you?',
        sentenceTranslation: 'مرحباً، كيف حالك؟',
        type: 'both',
        month: 1,
        week: 1,
        day: 1,
        language: language,
        createdAt: new Date()
      });

      // Save settings to ensure system collection exists
      await setDoc(doc(db, 'system', `settings_${language}`), { ...settings, language });

      toast.success(t.initDbSuccess);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `system/init_db_${language}`);
      toast.error(t.initDbError);
    } finally {
      setInitializingDb(false);
      setShowInitConfirm(false);
    }
  };

  const updateGeneralSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      general: { ...prev.general, [key]: value }
    }));
  };

  const updateSecuritySetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      security: { ...prev.security, [key]: value }
    }));
  };

  const sections = [
    { id: 'general', label: t.general, icon: Globe },
    { id: 'security', label: t.security, icon: Shield },
    { id: 'notifications', label: t.notifications, icon: Bell },
    { id: 'backup', label: t.backup, icon: Database },
  ];

  const renderSection = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <RefreshCw size={48} className="mb-4 animate-spin opacity-50" />
          <p className="text-xl font-bold">{t.loading}</p>
        </div>
      );
    }

    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-500 ml-2">{t.platformName}</label>
                <NeumorphicInput 
                  icon={Globe} 
                  placeholder="DEUTSCH ACADEMY" 
                  value={settings.general.platformName}
                  onChange={(e: any) => updateGeneralSetting('platformName', e.target.value)}
                />
              </div>
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-500 ml-2">{t.supportEmail}</label>
                <NeumorphicInput 
                  icon={Mail} 
                  placeholder="support@example.com" 
                  value={settings.general.supportEmail}
                  onChange={(e: any) => updateGeneralSetting('supportEmail', e.target.value)}
                />
              </div>
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-500 ml-2">{t.defaultLanguage}</label>
                <NeumorphicSelect 
                  icon={Globe} 
                  options={[t.arabic, t.german]} 
                  placeholder={t.chooseLanguage} 
                  value={settings.general.defaultLanguage}
                  onChange={(e: any) => updateGeneralSetting('defaultLanguage', e.target.value)}
                />
              </div>
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-500 ml-2">{t.timezone}</label>
                <NeumorphicSelect 
                  icon={Globe} 
                  options={['Cairo (GMT+2)', 'Berlin (GMT+1)', 'London (GMT+0)']} 
                  placeholder={t.chooseTimezone} 
                  value={settings.general.timezone}
                  onChange={(e: any) => updateGeneralSetting('timezone', e.target.value)}
                />
              </div>
            </div>

            <div className={`space-y-6 pt-6 border-t border-slate-100 text-right`}>
              <h4 className="text-xl font-black text-[#4a4a4a]">{t.displayOptions}</h4>
              <div className="space-y-4">
                <NeumorphicSwitch 
                  label={t.autoDarkMode} 
                  checked={settings.general.autoDarkMode}
                  onChange={(checked) => updateGeneralSetting('autoDarkMode', checked)}
                />
                <NeumorphicSwitch 
                  label={t.showLeaderboard} 
                  checked={settings.general.showLeaderboard}
                  onChange={(checked) => updateGeneralSetting('showLeaderboard', checked)}
                />
                <NeumorphicSwitch 
                  label={t.enableRewards} 
                  checked={settings.general.enableRewards}
                  onChange={(checked) => updateGeneralSetting('enableRewards', checked)}
                />
              </div>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className={`space-y-6 text-right`}>
              <h4 className="text-xl font-black text-[#4a4a4a]">{t.securityPolicies}</h4>
              <div className="space-y-4">
                <NeumorphicSwitch 
                  label={t.enable2FA} 
                  checked={settings.security.enable2FA}
                  onChange={(checked) => updateSecuritySetting('enable2FA', checked)}
                />
                <NeumorphicSwitch 
                  label={t.forcePasswordChange} 
                  checked={settings.security.forcePasswordChange}
                  onChange={(checked) => updateSecuritySetting('forcePasswordChange', checked)}
                />
                <NeumorphicSwitch 
                  label={t.preventConcurrentLogins} 
                  checked={settings.security.preventConcurrentLogins}
                  onChange={(checked) => updateSecuritySetting('preventConcurrentLogins', checked)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6 border-t border-slate-100">
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-500 ml-2">{t.minPasswordLength}</label>
                <NeumorphicInput 
                  icon={Lock} 
                  type="number" 
                  placeholder="8" 
                  value={settings.security.minPasswordLength.toString()}
                  onChange={(e: any) => updateSecuritySetting('minPasswordLength', parseInt(e.target.value) || 8)}
                />
              </div>
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-500 ml-2">{t.maxFailedLogins}</label>
                <NeumorphicInput 
                  icon={CircleAlert} 
                  type="number" 
                  placeholder="5" 
                  value={settings.security.maxFailedLogins.toString()}
                  onChange={(e: any) => updateSecuritySetting('maxFailedLogins', parseInt(e.target.value) || 5)}
                />
              </div>
            </div>
          </div>
        );
      case 'backup':
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="space-y-6 text-right">
              <h4 className="text-xl font-black text-[#4a4a4a]">{t.initDbTitle}</h4>
              <p className="text-slate-500">{t.initDbDesc}</p>
              
              <NeumorphicCard className="p-6 bg-emerald-50/50 border border-emerald-100">
                <div className="flex items-center gap-3 text-emerald-600 mb-4">
                  <Database size={24} />
                  <h4 className="font-black">توليد الجداول الأساسية</h4>
                </div>
                <p className="text-sm text-emerald-600 mb-6 leading-relaxed">
                  سيقوم هذا الإجراء بإنشاء الجداول (Collections) الخاصة بالكورسات، الدروس، المكتبة، والبطاقات التعليمية في قاعدة بيانات Firebase الخاصة بك حتى تظهر في لوحة التحكم.
                </p>
                <div className="w-64">
                  <NeumorphicButton 
                    onClick={() => setShowInitConfirm(true)} 
                    disabled={initializingDb}
                    className="bg-emerald-500 text-white hover:bg-emerald-600"
                  >
                    <div className="flex items-center justify-center gap-2">
                      {initializingDb ? <RefreshCw className="animate-spin" size={20} /> : <Play size={20} />}
                      <span>{initializingDb ? 'جاري التهيئة...' : t.initDbBtn}</span>
                    </div>
                  </NeumorphicButton>
                </div>
              </NeumorphicCard>
            </div>

            <ConfirmModal
              isOpen={showInitConfirm}
              onCancel={() => setShowInitConfirm(false)}
              onConfirm={handleInitDb}
              title={t.initDbTitle}
              message="هل أنت متأكد من رغبتك في تهيئة قاعدة البيانات؟ سيتم إضافة بيانات تجريبية."
              confirmText="تهيئة"
              cancelText="إلغاء"
            />
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Settings size={64} className="mb-4 opacity-20" />
            <p className="text-xl font-bold">{t.inDevelopment}</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="text-right">
          <h2 className="text-4xl font-black text-[#4a4a4a] mb-2">{t.title}</h2>
          <p className="text-slate-400 font-bold">{t.subtitle}</p>
        </div>
        <div className="w-16 h-16 rounded-2xl bg-[#f5f5f5] shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] flex items-center justify-center text-[#4d9685]">
          <Settings size={32} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-3">
          <NeumorphicCard className="p-4 space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                  activeSection === section.id 
                    ? 'bg-[#f5f5f5] shadow-[inset_4px_4px_8px_#d1d1d1,inset_-2px_-2px_4px_#ffffff] text-[#4d9685]' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className={`flex items-center gap-3 flex-row-reverse`}>
                  <section.icon size={20} />
                  <span className="font-bold">{section.label}</span>
                </div>
              </button>
            ))}
          </NeumorphicCard>

          <div className="mt-10 space-y-6">
            <NeumorphicCard className="p-6 bg-blue-50/50 border border-blue-100">
              <div className="flex items-center gap-3 text-blue-600 mb-3">
                <CircleAlert size={20} />
                <h4 className="font-black">{t.updateAvailable}</h4>
              </div>
              <p className="text-xs text-blue-500 font-bold mb-4 leading-relaxed">{t.currentVersion}</p>
              <NeumorphicButton variant="secondary" className="bg-white">{t.updateNow}</NeumorphicButton>
            </NeumorphicCard>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
          <NeumorphicCard className="p-10 min-h-[600px] flex flex-col">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black text-[#4a4a4a]">
                  {sections.find(s => s.id === activeSection)?.label}
                </h3>
                <div className="flex gap-4">
                  <button className="w-12 h-12 flex items-center justify-center bg-[#f5f5f5] rounded-xl shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] text-slate-400 hover:text-blue-500 transition-all">
                    <RefreshCw size={20} />
                  </button>
                </div>
              </div>

              {renderSection()}
            </div>

            <div className="pt-10 mt-10 border-t border-slate-100 flex justify-end gap-6">
              <div className="w-48">
                <NeumorphicButton variant="secondary">{t.cancelChanges}</NeumorphicButton>
              </div>
              <div className="w-48">
                <NeumorphicButton onClick={handleSave} disabled={saving || loading}>
                  <div className="flex items-center justify-center gap-3">
                    <Save size={20} />
                    <span>{saving ? t.saving : t.saveSettings}</span>
                  </div>
                </NeumorphicButton>
              </div>
            </div>
          </NeumorphicCard>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
