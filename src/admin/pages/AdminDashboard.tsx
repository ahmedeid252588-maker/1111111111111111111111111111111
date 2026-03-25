import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Library, 
  Users, 
  TrendingUp, 
  ChevronRight,
  Database,
  RefreshCw
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, getDocs, query, orderBy, limit, where, writeBatch, doc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { FLASHCARDS_DAY_1 } from '../../constants';
import ConfirmModal from '../components/ConfirmModal';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
  language: 'german' | 'english';
}

const NeumorphicCard = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <div className={`bg-[#f5f5f5] rounded-[32px] shadow-[10px_10px_20px_#d1d1d1,-10px_-10px_20px_#ffffff] border border-white/20 ${className}`}>
    {children}
  </div>
);

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, language }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalLibraryItems: 0,
    activeUsers: 0
  });

  const [systemStatus, setSystemStatus] = useState<'checking' | 'operational' | 'error'>('checking');
  const [chartData, setChartData] = useState<{name: string, users: number}[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);

  const t = {
    title: 'لوحة التحكم الرئيسية',
    subtitle: 'نظرة عامة في الوقت الفعلي على نظام التعلم',
    systemStatus: 'حالة النظام',
    operational: 'يعمل بشكل طبيعي',
    error: 'خطأ في الاتصال',
    totalUsers: 'إجمالي الطلاب',
    activeCourses: 'الدورات النشطة',
    libraryResources: 'موارد المكتبة',
    activeWeekly: 'نشط أسبوعياً',
    userGrowth: 'نمو المستخدمين',
    learningEngineer: 'مهندس التعلم',
    learningDesc: 'تصميم الدورات والوحدات والدروس',
    totalLessons: 'إجمالي الدروس',
    completionRate: 'معدل الإكمال',
    resourceVault: 'خزنة الموارد',
    resourceDesc: 'إدارة الكتب والفيديوهات والملفات',
    studentPerformance: 'أداء الطلاب',
    viewAllStudents: 'عرض جميع الطلاب',
    newUser: 'مستخدم جديد',
    level: 'المستوى',
    points: 'نقاط',
    progress: 'التقدم',
    noUsers: 'لا يوجد مستخدمون حالياً',
    migration: 'استعادة البيانات (الهجرة)',
    migrationDesc: 'نقل البيانات القديمة إلى النظام الجديد',
    seedData: 'إعداد قاعدة البيانات',
    seedDesc: 'إضافة بيانات أولية (دروس، مكتبة، فلاش كارد) لتبدأ بها',
    seeding: 'جاري الإعداد...',
    seedSuccess: 'تم إعداد قاعدة البيانات بنجاح!',
    seedError: 'حدث خطأ أثناء الإعداد',
    months: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
  };

  const seedDatabase = async () => {
    if (isSeeding) return;
    setIsSeeding(true);
    const batch = writeBatch(db);

    try {
      // 1. Seed System Settings
      const settingsRef = doc(db, 'system', 'settings');
      batch.set(settingsRef, {
        general: { appName: 'Noor Learning', maintenanceMode: false },
        security: { allowNewRegistrations: true },
        notifications: { enablePush: true },
        payment: { currency: 'EGP', whatsappNumber: '+201000000000' }
      });

      // 2. Seed Library Categories
      const categories = [
        { id: 'books', name: 'الكتب والملازم', nameEn: 'Books & Materials' },
        { id: 'videos', name: 'الفيديوهات التعليمية', nameEn: 'Educational Videos' },
        { id: 'audio', name: 'المقاطع الصوتية', nameEn: 'Audio Clips' },
        { id: 'grammar', name: 'القواعد اللغوية', nameEn: 'Grammar' },
        { id: 'vocabulary', name: 'المفردات', nameEn: 'Vocabulary' }
      ];

      categories.forEach(cat => {
        batch.set(doc(db, 'library_categories_german', cat.id), { name: cat.name, level: 'A1' });
        batch.set(doc(db, 'library_categories_english', cat.id), { name: cat.nameEn, level: 'A1' });
      });

      // 3. Seed Sample Lessons (Month 1, Week 1, Day 1-3) for BOTH languages
      const languages: ('german' | 'english')[] = ['german', 'english'];
      
      languages.forEach(lang => {
        const lessonsPath = `lessons_${lang}`;
        const flashcardsPath = `flashcards_${lang}`;
        const exercisesPath = `exercises_${lang}`;
        const libraryPath = `library_${lang}`;

        const isGerman = lang === 'german';

        // Sample Lessons
        const sampleLessons = [
          { 
            id: `lesson_${lang}_1_1_1`, 
            title: isGerman ? 'مقدمة في اللغة الألمانية' : 'Introduction to English', 
            type: 'video', 
            content: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
            month: 1, week: 1, day: 1, 
            displayMode: 'embed', duration: '10 min', points: 50,
            level: 'A1', language: lang, order: 0,
            createdAt: Timestamp.now()
          },
          { 
            id: `lesson_${lang}_1_1_2`, 
            title: isGerman ? 'الأبجدية الألمانية' : 'The English Alphabet', 
            type: 'video', 
            content: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
            month: 1, week: 1, day: 2, 
            displayMode: 'embed', duration: '15 min', points: 50,
            level: 'A1', language: lang, order: 0,
            createdAt: Timestamp.now()
          },
          { 
            id: `lesson_${lang}_1_1_3`, 
            title: isGerman ? 'الأرقام من 1 إلى 20' : 'Numbers 1 to 20', 
            type: 'video', 
            content: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
            month: 1, week: 1, day: 3, 
            displayMode: 'embed', duration: '12 min', points: 50,
            level: 'A1', language: lang, order: 0,
            createdAt: Timestamp.now()
          }
        ];

        sampleLessons.forEach(lesson => {
          batch.set(doc(db, lessonsPath, lesson.id), lesson);
        });

        // Sample Flashcards
        const sampleFlashcards = [
          {
            id: `fc_${lang}_1`,
            word: isGerman ? 'Hallo' : 'Hello',
            translation: 'مرحباً',
            sentence: isGerman ? 'Hallo, wie geht es dir?' : 'Hello, how are you?',
            sentenceTranslation: 'مرحباً، كيف حالك؟',
            month: 1, week: 1, day: 1,
            level: 'A1', language: lang, section: 'كلمات الدرس',
            createdAt: Timestamp.now()
          },
          {
            id: `fc_${lang}_2`,
            word: isGerman ? 'Danke' : 'Thank you',
            translation: 'شكراً',
            sentence: isGerman ? 'Vielen Dank für deine Hilfe.' : 'Thank you very much for your help.',
            sentenceTranslation: 'شكراً جزيلاً لمساعدتك.',
            month: 1, week: 1, day: 1,
            level: 'A1', language: lang, section: 'كلمات الدرس',
            createdAt: Timestamp.now()
          },
          {
            id: `fc_${lang}_3`,
            word: isGerman ? 'Bitte' : 'Please / You\'re welcome',
            translation: 'من فضلك / عفواً',
            sentence: isGerman ? 'Bitte schön.' : 'You are welcome.',
            sentenceTranslation: 'عفواً.',
            month: 1, week: 1, day: 2,
            level: 'A1', language: lang, section: 'كلمات الدرس',
            createdAt: Timestamp.now()
          },
          {
            id: `fc_${lang}_4`,
            word: isGerman ? 'Ja' : 'Yes',
            translation: 'نعم',
            sentence: isGerman ? 'Ja, ich komme.' : 'Yes, I am coming.',
            sentenceTranslation: 'نعم، أنا قادم.',
            month: 1, week: 1, day: 2,
            level: 'A1', language: lang, section: 'كلمات الدرس',
            createdAt: Timestamp.now()
          },
          {
            id: `fc_${lang}_5`,
            word: isGerman ? 'Nein' : 'No',
            translation: 'لا',
            sentence: isGerman ? 'Nein, danke.' : 'No, thank you.',
            sentenceTranslation: 'لا، شكراً.',
            month: 1, week: 1, day: 3,
            level: 'A1', language: lang, section: 'كلمات الدرس',
            createdAt: Timestamp.now()
          }
        ];

        sampleFlashcards.forEach(fc => {
          batch.set(doc(db, flashcardsPath, fc.id), fc);
        });

        // Sample Exercises
        const sampleExercises = [
          {
            id: `ex_${lang}_1`,
            title: isGerman ? 'تمرين التوصيل 1' : 'Matching Exercise 1',
            type: 'MATCH_WORD_TRANSLATION',
            month: 1, week: 1, day: 1,
            level: 'A1', language: lang,
            content: {
              pairs: [
                { word: isGerman ? 'Hallo' : 'Hello', translation: 'مرحباً' },
                { word: isGerman ? 'Danke' : 'Thank you', translation: 'شكراً' }
              ]
            },
            createdAt: Timestamp.now()
          },
          {
            id: `ex_${lang}_2`,
            title: isGerman ? 'تمرين اختيار من متعدد' : 'Multiple Choice Exercise',
            type: 'MULTIPLE_CHOICE',
            month: 1, week: 1, day: 2,
            level: 'A1', language: lang,
            content: {
              question: isGerman ? 'ما معنى كلمة "Ja"؟' : 'What does "Yes" mean?',
              options: ['نعم', 'لا', 'ربما', 'شكراً'],
              correctAnswer: 'نعم'
            },
            createdAt: Timestamp.now()
          }
        ];

        sampleExercises.forEach(ex => {
          batch.set(doc(db, exercisesPath, ex.id), ex);
        });

        // Sample Library Items
        const sampleLibraryItems = [
          {
            id: `lib_${lang}_1`,
            name: isGerman ? 'كتاب القواعد الأساسي' : 'Basic Grammar Book',
            category: 'books',
            subcategoryId: 'basic_grammar',
            type: 'pdf',
            url: 'https://example.com/grammar.pdf',
            displayMode: 'link',
            size: '2.5 MB',
            description: isGerman ? 'كتاب شامل لقواعد المستوى A1' : 'Comprehensive A1 grammar book',
            tags: ['grammar', 'A1', 'pdf'],
            level: 'A1', language: lang,
            createdAt: Timestamp.now()
          },
          {
            id: `lib_${lang}_2`,
            name: isGerman ? 'قاموس المصطلحات الشائعة' : 'Common Phrases Dictionary',
            category: 'vocabulary',
            subcategoryId: 'phrases',
            type: 'pdf',
            url: 'https://example.com/phrases.pdf',
            displayMode: 'link',
            size: '1.8 MB',
            description: isGerman ? 'أهم المصطلحات اليومية للمبتدئين' : 'Most important daily phrases for beginners',
            tags: ['vocabulary', 'phrases', 'A1'],
            level: 'A1', language: lang,
            createdAt: Timestamp.now()
          }
        ];

        sampleLibraryItems.forEach(item => {
          batch.set(doc(db, libraryPath, item.id), item);
        });
      });

      await batch.commit();
      toast.success(t.seedSuccess);
      // Refresh stats
      window.location.reload();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'seed_database');
      toast.error(t.seedError);
    } finally {
      setIsSeeding(false);
      setShowSeedConfirm(false);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersQuery = query(
          collection(db, 'users')
        );
        const lessonsPath = `lessons_${language}`;
        const lessonsQuery = query(
          collection(db, lessonsPath)
        );
        const libraryPath = `library_${language}`;
        const libraryQuery = query(
          collection(db, libraryPath)
        );

        const usersSnap = await getDocs(usersQuery);
        const lessonsSnap = await getDocs(lessonsQuery);
        const librarySnap = await getDocs(libraryQuery);
        
        let usersData = usersSnap.docs.map(d => d.data());
        
        // Filter by language client-side to handle missing fields
        usersData = usersData.filter(u => (u.language || 'german') === language);
        
        // Sort by joinedAt desc
        usersData.sort((a, b) => {
          const dateA = a.joinedAt?.toDate ? a.joinedAt.toDate().getTime() : 0;
          const dateB = b.joinedAt?.toDate ? b.joinedAt.toDate().getTime() : 0;
          return dateB - dateA;
        });
        
        setStats({
          totalUsers: usersData.length,
          totalCourses: lessonsSnap.size,
          totalLibraryItems: librarySnap.size,
          activeUsers: usersData.filter(u => {
            const date = u.lastActive?.toDate ? u.lastActive.toDate() : new Date(0);
            return date > new Date(Date.now() - 86400000 * 7);
          }).length
        });
        
        // Group users by month for chart
        const currentYear = new Date().getFullYear();
        const monthlyData = new Array(12).fill(0);
        
        usersData.forEach(user => {
          if (user.joinedAt?.toDate) {
            const date = user.joinedAt.toDate();
            if (date.getFullYear() === currentYear) {
              monthlyData[date.getMonth()]++;
            }
          }
        });
        
        const chartDataFormatted = t.months.map((month, index) => ({
          name: month,
          users: monthlyData[index]
        })).slice(0, new Date().getMonth() + 1); // Show up to current month
        
        setChartData(chartDataFormatted);
        setRecentUsers(usersData.slice(0, 3)); // Get top 3 recent users
        
        setSystemStatus('operational');
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'dashboard_stats');
        setSystemStatus('error');
      }
    };
    fetchStats();
  }, [language]);

  const statCards = [
    { label: t.totalUsers, value: stats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: t.activeCourses, value: stats.totalCourses, icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: t.libraryResources, value: stats.totalLibraryItems, icon: Library, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: t.activeWeekly, value: stats.activeUsers, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  const isRTL = true;

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="text-right">
          <h1 className="text-3xl font-black text-[#4a4a4a]">{t.title}</h1>
          <p className="text-slate-400 font-bold mt-1">{t.subtitle}</p>
        </div>
        
        <button
          onClick={() => setShowSeedConfirm(true)}
          disabled={isSeeding}
          className={`flex items-center gap-3 px-6 py-3 rounded-2xl bg-[#f5f5f5] shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] text-emerald-600 font-bold hover:shadow-inner transition-all disabled:opacity-50`}
        >
          {isSeeding ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
          {isSeeding ? t.seeding : t.seedData}
        </button>
      </div>

      <ConfirmModal
        isOpen={showSeedConfirm}
        onCancel={() => setShowSeedConfirm(false)}
        onConfirm={seedDatabase}
        title={t.seedData}
        message="هل أنت متأكد من رغبتك في إعداد قاعدة البيانات؟ سيتم إضافة بيانات أولية تجريبية."
        confirmText="إعداد"
        cancelText="إلغاء"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-6 rounded-3xl bg-[#f5f5f5] shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] border border-white/50"
          >
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-4`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div className="text-3xl font-black text-[#4a4a4a]">{stat.value}</div>
            <div className="text-sm font-bold text-slate-400 mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <NeumorphicCard className="p-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6">{t.userGrowth}</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </NeumorphicCard>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Learning Management */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => onNavigate('learning')}
          className="p-8 rounded-[40px] bg-[#e0e0e0] shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] cursor-pointer group relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-white shadow-inner">
                <BookOpen className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-gray-900">{t.learningEngineer}</h2>
                <p className="text-gray-600">{t.learningDesc}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/50 border border-white/20">
                <div className="text-xs font-bold text-gray-400 uppercase mb-1">{t.totalLessons}</div>
                <div className="text-xl font-bold text-gray-800">{stats.totalCourses}</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/50 border border-white/20">
                <div className="text-xs font-bold text-gray-400 uppercase mb-1">{t.completionRate}</div>
                <div className="text-xl font-bold text-gray-800">68%</div>
              </div>
            </div>
          </div>
          <ChevronRight className={`absolute left-8 rotate-180 top-1/2 -translate-y-1/2 w-8 h-8 text-gray-400 group-hover:text-emerald-500 transition-colors`} />
        </motion.div>

        {/* Library Management */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => onNavigate('library')}
          className="p-8 rounded-[40px] bg-[#e0e0e0] shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] cursor-pointer group relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="p-4 rounded-2xl bg-white shadow-inner w-fit mb-6">
              <Library className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.resourceVault}</h2>
            <p className="text-gray-600 mb-6">{t.resourceDesc}</p>
            <div className="flex -space-x-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-8 h-8 rounded-full bg-white border-2 border-[#e0e0e0] flex items-center justify-center text-[10px] font-bold text-gray-400">
                  PDF
                </div>
              ))}
            </div>
          </div>
          <ChevronRight className={`absolute left-8 rotate-180 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 group-hover:text-amber-500 transition-colors`} />
        </motion.div>
      </div>

      {/* Recent Activity / Users */}
      <div className="p-8 rounded-[40px] bg-[#e0e0e0] shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff]">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            {t.studentPerformance}
          </h2>
          <button 
            onClick={() => onNavigate('users')}
            className="px-6 py-2 rounded-xl bg-white shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] text-sm font-bold text-blue-600 hover:shadow-inner transition-all"
          >
            {t.viewAllStudents}
          </button>
        </div>
        
        <div className="space-y-4">
          {recentUsers.map((user, i) => (
            <div key={user.uid || i} className="flex items-center justify-between p-4 rounded-2xl bg-white/30 border border-white/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    user.displayName?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{user.displayName || t.newUser}</div>
                  <div className="text-xs text-gray-500">{t.level} {user.level || 'A1'} • {user.points || 0} {t.points}</div>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <div className="text-xs font-bold text-gray-400 uppercase">{t.progress}</div>
                  <div className="w-32 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${user.progress || 0}%` }} />
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-gray-400 rotate-180`} />
              </div>
            </div>
          ))}
          {recentUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">{t.noUsers}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
