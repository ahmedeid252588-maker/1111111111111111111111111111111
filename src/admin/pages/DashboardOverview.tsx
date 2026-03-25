
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  DollarSign, 
  CheckCircle, 
  Clock 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const data = [
  { name: 'السبت', users: 400, revenue: 2400 },
  { name: 'الأحد', users: 300, revenue: 1398 },
  { name: 'الاثنين', users: 200, revenue: 9800 },
  { name: 'الثلاثاء', users: 278, revenue: 3908 },
  { name: 'الأربعاء', users: 189, revenue: 4800 },
  { name: 'الخميس', users: 239, revenue: 3800 },
  { name: 'الجمعة', users: 349, revenue: 4300 },
];

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <div className="bg-[#f5f5f5] p-8 rounded-[32px] shadow-[10px_10px_20px_#d1d1d1,-10px_-10px_20px_#ffffff] border border-white/20">
    <div className="flex items-center justify-between mb-6">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] ${color}`}>
        <Icon size={28} className="text-white" />
      </div>
      {trend && (
        <span className={`text-sm font-black px-3 py-1 rounded-full ${trend > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider">{title}</h3>
    <p className="text-3xl font-black text-[#4a4a4a] mt-2">{value}</p>
  </div>
);

const DashboardOverview: React.FC<{ language: 'german' | 'english' | 'arabic' }> = ({ language }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    totalLessons: 0,
    totalExercises: 0,
    totalRevenue: 0,
    completionRate: 85
  });

  const t = {
    title: 'لوحة التحكم',
    subtitle: 'مرحباً بك مرة أخرى في نظام الإدارة',
    export: 'تصدير',
    refresh: 'تحديث',
    totalStudents: 'إجمالي الطلاب',
    activeToday: 'نشط اليوم',
    totalLessons: 'إجمالي الدروس',
    totalExercises: 'إجمالي التمارين',
    totalRevenue: 'إجمالي الإيرادات (تقديري)',
    completionRate: 'معدل الإكمال',
    studentActivity: 'نشاط الطلاب',
    salesGrowth: 'نمو التعلم',
    days: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']
  };

  const chartData = [
    { name: t.days[0], users: 400, progress: 2400 },
    { name: t.days[1], users: 300, progress: 1398 },
    { name: t.days[2], users: 200, progress: 9800 },
    { name: t.days[3], users: 278, progress: 3908 },
    { name: t.days[4], users: 189, progress: 4800 },
    { name: t.days[5], users: 239, progress: 3800 },
    { name: t.days[6], users: 349, progress: 4300 },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const allUsers = usersSnap.docs.map(doc => doc.data());
        
        // Calculate active today
        const today = new Date().toISOString().split('T')[0];
        const activeTodayCount = allUsers.filter(u => u.lastActive?.split('T')[0] === today).length;

        // Calculate estimated revenue (assuming each month sub is $10 for example)
        let revenue = 0;
        allUsers.forEach(u => {
          const subs = u.subscriptions || {};
          Object.values(subs).forEach((months: any) => {
            revenue += (months.length * 10);
          });
        });

        let lessonsSize = 0;
        let exercisesSize = 0;
        
        if (language === 'arabic') {
          const [germanLessons, englishLessons, germanExercises, englishExercises] = await Promise.all([
            getDocs(collection(db, 'lessons_german')),
            getDocs(collection(db, 'lessons_english')),
            getDocs(collection(db, 'exercises_german')),
            getDocs(collection(db, 'exercises_english'))
          ]);
          lessonsSize = germanLessons.size + englishLessons.size;
          exercisesSize = germanExercises.size + englishExercises.size;
        } else {
          const [lessonsSnap, exercisesSnap] = await Promise.all([
            getDocs(collection(db, `lessons_${language}`)),
            getDocs(collection(db, `exercises_${language}`))
          ]);
          lessonsSize = lessonsSnap.size;
          exercisesSize = exercisesSnap.size;
        }
        
        setStats({
          totalUsers: usersSnap.size,
          activeToday: activeTodayCount,
          totalLessons: lessonsSize,
          totalExercises: exercisesSize,
          totalRevenue: revenue,
          completionRate: 85 // Placeholder for now
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'dashboard_stats');
      }
    };

    fetchStats();
  }, [language]);

  return (
    <div className="space-y-10" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-[#4a4a4a]">{t.title}</h2>
          <p className="text-slate-400 font-bold mt-1">{t.subtitle}</p>
        </div>
        <div className="flex gap-4">
          <button className="h-14 px-8 bg-[#f5f5f5] rounded-2xl shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff] text-slate-600 font-bold hover:scale-[1.02] transition-all">{t.export}</button>
          <button 
            onClick={() => window.location.reload()}
            className="h-14 px-8 bg-[#ff9a9a] text-white rounded-2xl shadow-[6px_6px_12px_#ff9a9a]/20 font-bold hover:scale-[1.02] transition-all"
          >
            {t.refresh}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard title={t.totalStudents} value={stats.totalUsers.toLocaleString()} icon={Users} trend={12} color="bg-blue-400" />
        <StatCard title={t.activeToday} value={stats.activeToday.toLocaleString()} icon={Clock} trend={5} color="bg-emerald-400" />
        <StatCard title={t.totalRevenue} value={`$${stats.totalRevenue.toLocaleString()}`} icon={DollarSign} trend={20} color="bg-amber-400" />
        <StatCard title={t.completionRate} value={`${stats.completionRate}%`} icon={CheckCircle} trend={-2} color="bg-purple-400" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-[#f5f5f5] p-8 rounded-[40px] shadow-[12px_12px_24px_#d1d1d1,-12px_-12px_24px_#ffffff] border border-white/20">
          <h3 className="text-xl font-black text-[#4a4a4a] mb-8">{t.studentActivity}</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12, fontWeight: 'bold'}} />
                <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '10px 10px 20px #d1d1d1', backgroundColor: '#f5f5f5'}} />
                <Area type="monotone" dataKey="users" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#f5f5f5] p-8 rounded-[40px] shadow-[12px_12px_24px_#d1d1d1,-12px_-12px_24px_#ffffff] border border-white/20">
          <h3 className="text-xl font-black text-[#4a4a4a] mb-8">{t.salesGrowth}</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12, fontWeight: 'bold'}} />
                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '10px 10px 20px #d1d1d1', backgroundColor: '#f5f5f5'}} />
                <Bar dataKey="progress" fill="#3b82f6" radius={[12, 12, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
