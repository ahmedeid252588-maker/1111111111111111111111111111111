import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  Filter, 
  Award, 
  TrendingUp, 
  Mail, 
  Calendar,
  Shield,
  Pencil,
  Trash2,
  ChevronRight,
  UserCheck,
  UserMinus,
  X,
  Save,
  MoreVertical,
  Download,
  Ban,
  CheckCircle,
  Clock,
  Activity,
  Star,
  Zap,
  Layout,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Target,
  Languages
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, getDocs, getDoc, updateDoc, doc, deleteDoc, query, orderBy, Timestamp, where, limit, onSnapshot } from 'firebase/firestore';
import { NeumorphicCard, NeumorphicButton, NeumorphicInput, NeumorphicSelect } from '../../components/Neumorphic';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import { LEVELS } from '../../constants';
import { UserProfile } from '../../types';

const AdminUsers: React.FC<{ language: string }> = ({ language }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [stats, setStats] = useState({ total: 0, activeToday: 0, newThisWeek: 0, topPerformers: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'student'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'banned'>('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'progress' | 'activity'>('info');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  const t = {
    title: 'إدارة المستخدمين',
    subtitle: 'مراقبة وإدارة مجتمع التعلم',
    totalStudents: 'إجمالي الطلاب',
    activeToday: 'نشط اليوم',
    newThisWeek: 'جديد هذا الأسبوع',
    topPerformers: 'الأفضل أداءً',
    searchPlaceholder: 'البحث بالاسم أو البريد الإلكتروني...',
    allRoles: 'كل الأدوار',
    admin: 'مدير',
    student: 'طالب',
    allStatuses: 'كل الحالات',
    active: 'نشط',
    banned: 'محظور',
    export: 'تصدير البيانات',
    studentName: 'اسم الطالب',
    role: 'الدور',
    status: 'الحالة',
    progress: 'التقدم',
    points: 'النقاط',
    lastActive: 'آخر نشاط',
    actions: 'الإجراءات',
    edit: 'تعديل',
    view: 'عرض',
    ban: 'حظر',
    unban: 'إلغاء الحظر',
    delete: 'حذف',
    noUsers: 'لم يتم العثور على مستخدمين',
    editUser: 'تعديل بيانات المستخدم',
    viewUser: 'تفاصيل المستخدم',
    save: 'حفظ التغييرات',
    cancel: 'إلغاء',
    displayName: 'الاسم المعروض',
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    whatsapp: 'واتساب',
    age: 'العمر',
    gender: 'الجنس',
    male: 'ذكر',
    female: 'أنثى',
    language: 'اللغة',
    german: 'الألمانية',
    english: 'الإنجليزية',
    arabic: 'العربية',
    level: 'المستوى',
    streak: 'سلسلة النشاط',
    joinedAt: 'تاريخ الانضمام',
    confirmDeleteTitle: 'حذف المستخدم',
    confirmDeleteMessage: 'هل أنت متأكد أنك تريد حذف هذا المستخدم نهائياً؟',
    confirmBanTitle: 'حظر المستخدم',
    confirmBanMessage: 'هل أنت متأكد أنك تريد حظر هذا المستخدم؟',
    confirmUnbanTitle: 'إلغاء حظر المستخدم',
    confirmUnbanMessage: 'هل أنت متأكد أنك تريد إلغاء حظر هذا المستخدم؟',
    successUpdate: 'تم تحديث البيانات بنجاح',
    successDelete: 'تم حذف المستخدم بنجاح',
    successBan: 'تم حظر المستخدم',
    successUnban: 'تم إلغاء حظر المستخدم',
    errorUpdate: 'خطأ أثناء التحديث',
    errorDelete: 'خطأ أثناء الحذف',
    errorAction: 'خطأ في تنفيذ الإجراء',
    saveChanges: 'حفظ التغييرات',
    learningProgress: 'تقدم التعلم',
    accountInfo: 'معلومات الحساب',
    inactive: 'غير نشط',
    dailyMission: 'المهمة اليومية',
    completed: 'مكتمل',
    notCompleted: 'غير مكتمل',
    notProvided: 'غير متوفر',
    recentActivity: 'النشاط الأخير',
    noActivity: 'لم يتم العثور على نشاط',
    currentGoal: 'الهدف الحالي',
    continueLearning: 'الاستمرار في التعلم وإحراز التقدم',
    close: 'إغلاق',
    pointsBalance: 'رصيد النقاط',
    currentLevel: 'المستوى الحالي',
    pending: 'قيد الانتظار',
  };

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'users'));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const userData = snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
      
      // Sort client-side to include users without joinedAt field
      userData.sort((a, b) => {
        const dateA = a.joinedAt?.toDate ? a.joinedAt.toDate().getTime() : 0;
        const dateB = b.joinedAt?.toDate ? b.joinedAt.toDate().getTime() : 0;
        return dateB - dateA;
      });
      
      setUsers(userData);
      
      // Calculate Stats
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      setStats({
        total: userData.length,
        activeToday: userData.filter(u => {
          const date = u.lastActive?.toDate ? u.lastActive.toDate() : new Date(0);
          return date >= today;
        }).length,
        newThisWeek: userData.filter(u => {
          const date = u.joinedAt?.toDate ? u.joinedAt.toDate() : new Date(0);
          return date >= lastWeek;
        }).length,
        topPerformers: userData.filter(u => (u.points || 0) > 1000).length
      });
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleUpdateUser = async (uid: string, data: Partial<UserProfile>) => {
    try {
      await updateDoc(doc(db, 'users', uid), data);
      setIsEditModalOpen(false);
      toast.success(t.successUpdate);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
      toast.error(t.errorUpdate);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    setConfirmModal({
      isOpen: true,
      title: t.confirmDeleteTitle,
      message: t.confirmDeleteMessage,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await deleteDoc(doc(db, 'users', uid));
          toast.success(t.successDelete);
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `users/${uid}`);
          toast.error(t.errorDelete);
        }
      }
    });
  };

  const toggleUserSelection = (uid: string) => {
    setSelectedUsers(prev => 
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.uid));
    }
  };

  const performBulkAction = async (action: 'delete' | 'ban' | 'unban') => {
    setConfirmModal({
      isOpen: true,
      title: `إجراء جماعي: ${action}`,
      message: `هل أنت متأكد أنك تريد تنفيذ هذا الإجراء على ${selectedUsers.length} مستخدم؟`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          for (const uid of selectedUsers) {
            if (action === 'delete') await deleteDoc(doc(db, 'users', uid));
            else if (action === 'ban') await updateDoc(doc(db, 'users', uid), { status: 'banned' });
            else if (action === 'unban') await updateDoc(doc(db, 'users', uid), { status: 'active' });
          }
          toast.success('تم تنفيذ الإجراء بنجاح');
          setSelectedUsers([]);
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, 'users');
          toast.error('خطأ أثناء تنفيذ الإجراء الجماعي');
        }
      }
    });
  };

  const handleExportCSV = () => {
    const headers = [
      t.studentName, 
      t.email, 
      t.whatsapp, 
      t.age, 
      t.gender, 
      t.role, 
      t.level, 
      t.points, 
      t.streak, 
      t.progress, 
      t.status, 
      t.joinedAt, 
      t.lastActive
    ];
    const csvContent = [
      headers.join(','),
      ...filteredUsers.map(u => [
        `"${u.displayName || ''}"`,
        `"${u.email || ''}"`,
        `"${u.whatsapp || ''}"`,
        u.age || '',
        u.gender || '',
        u.role,
        u.level,
        u.points,
        u.streak,
        u.progress,
        u.status || 'active',
        u.joinedAt?.toDate ? `"${u.joinedAt.toDate().toLocaleDateString('ar-EG')}"` : 'N/A',
        u.lastActive?.toDate ? `"${u.lastActive.toDate().toLocaleDateString('ar-EG')}"` : 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = users.filter(u => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (u.displayName || '').toLowerCase().includes(searchLower) || 
                          (u.email || '').toLowerCase().includes(searchLower);
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesStatus = filterStatus === 'all' || (u.status || 'active') === filterStatus;
    const matchesLanguage = (u.language || 'german') === language;
    return matchesSearch && matchesRole && matchesStatus && matchesLanguage;
  });

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <NeumorphicCard className="p-6 flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-black text-gray-800">{value}</h3>
        </div>
      </div>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${color} text-white`}>
        <Icon size={28} />
      </div>
    </NeumorphicCard>
  );

  return (
    <div className="space-y-8 pb-20" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="text-right">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg">
              <Users size={20} />
            </div>
            <h1 className="text-3xl font-black text-gray-900">{t.title}</h1>
          </div>
          <p className="text-gray-500 font-medium">{t.subtitle}</p>
        </div>
        <div className="flex gap-3">
          <NeumorphicButton onClick={handleExportCSV} className="px-6 py-3 flex items-center gap-2 text-gray-600">
            <Download size={18} />
            {t.export}
          </NeumorphicButton>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t.totalStudents} value={stats.total} icon={Users} color="bg-blue-500" />
        <StatCard title={t.activeToday} value={stats.activeToday} icon={Activity} color="bg-emerald-500" />
        <StatCard title={t.newThisWeek} value={stats.newThisWeek} icon={Clock} color="bg-amber-500" />
        <StatCard title={t.topPerformers} value={stats.topPerformers} icon={Star} color="bg-purple-500" />
      </div>

      {/* Filters & Search */}
      <NeumorphicCard className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-[#f5f5f5] rounded-2xl shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff] outline-none text-gray-700 font-bold"
              dir="ltr"
            />
          </div>
          <div className="flex flex-wrap gap-4" dir="ltr">
            <div className="w-48">
              <NeumorphicSelect 
                icon={Shield}
                placeholder={t.role}
                value={filterRole}
                onChange={(e: any) => setFilterRole(e.target.value)}
                options={[
                  { label: t.allRoles, value: 'all' },
                  { label: t.admin, value: 'admin' },
                  { label: t.student, value: 'student' }
                ]}
              />
            </div>
            <div className="w-48">
              <NeumorphicSelect 
                icon={Activity}
                placeholder={t.status}
                value={filterStatus}
                onChange={(e: any) => setFilterStatus(e.target.value)}
                options={[
                  { label: t.allStatuses, value: 'all' },
                  { label: t.active, value: 'active' },
                  { label: t.banned, value: 'banned' }
                ]}
              />
            </div>
          </div>
        </div>
      </NeumorphicCard>

      {/* Bulk Action Toolbar */}
      <AnimatePresence>
        {selectedUsers.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 z-50"
          >
            <span className="font-bold">{selectedUsers.length} مستخدم محدد</span>
            <div className="h-6 w-px bg-gray-700"></div>
            <button onClick={() => performBulkAction('ban')} className="flex items-center gap-2 hover:text-amber-400"><Ban size={18} /> حظر</button>
            <button onClick={() => performBulkAction('unban')} className="flex items-center gap-2 hover:text-emerald-400"><CheckCircle size={18} /> إلغاء حظر</button>
            <button onClick={() => performBulkAction('delete')} className="flex items-center gap-2 hover:text-rose-400"><Trash2 size={18} /> حذف</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users Table */}
      <div className="bg-[#f5f5f5] rounded-[40px] shadow-[20px_20px_60px_#d1d1d1,-20px_-20px_60px_#ffffff] overflow-hidden border border-white/20">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-white/50 border-b border-gray-200">
                <th className="px-8 py-6">
                  <input 
                    type="checkbox" 
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-8 py-6 text-xs font-black text-gray-400 uppercase tracking-widest text-right">{t.studentName}</th>
                <th className="px-8 py-6 text-xs font-black text-gray-400 uppercase tracking-widest text-right">{t.progress}</th>
                <th className="px-8 py-6 text-xs font-black text-gray-400 uppercase tracking-widest text-right">{t.lastActive}</th>
                <th className="px-8 py-6 text-xs font-black text-gray-400 uppercase tracking-widest text-right">{t.status}</th>
                <th className="px-8 py-6 text-xs font-black text-gray-400 uppercase tracking-widest text-left">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-gray-500 font-bold">Loading...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Users size={48} className="text-gray-300" />
                      <p className="text-gray-500 font-bold text-xl">{t.noUsers}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => (
                  <motion.tr 
                    key={user.uid}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`hover:bg-white/40 transition-colors group ${selectedUsers.includes(user.uid) ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-8 py-6">
                      <input 
                        type="checkbox" 
                        checked={selectedUsers.includes(user.uid)}
                        onChange={() => toggleUserSelection(user.uid)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img 
                            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`} 
                            alt="" 
                            className="w-12 h-12 rounded-2xl object-cover shadow-md"
                          />
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${user.role === 'admin' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                        </div>
                        <div>
                          <div className="font-black text-gray-800 flex items-center gap-2">
                            {user.displayName}
                            {user.role === 'admin' && <Shield size={14} className="text-amber-500" />}
                          </div>
                          <div className="text-sm text-gray-500 font-medium">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                          <span>{t.progress}</span>
                          <span>{user.progress || 0}%</span>
                        </div>
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                            style={{ width: `${user.progress || 0}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                            <Award size={14} />
                            {user.points || 0}
                          </div>
                          <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                            <TrendingUp size={14} />
                            {t.level} {user.level || 'A1'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                          <Clock size={14} className="text-gray-400" />
                          {user.lastActive?.toDate ? user.lastActive.toDate().toLocaleDateString('ar-EG') : 'أبداً'}
                        </div>
                        <div className="text-[10px] font-black text-gray-400 uppercase">
                          {t.joinedAt}: {user.joinedAt?.toDate ? user.joinedAt.toDate().toLocaleDateString('ar-EG') : 'غير متوفر'}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        (user.status || 'active') === 'active' 
                          ? 'bg-emerald-100 text-emerald-600' 
                          : 'bg-rose-100 text-rose-600'
                      }`}>
                        {(user.status || 'active') === 'active' ? t.active : t.banned}
                      </span>
                    </td>
                    <td className={`px-8 py-6 text-left`}>
                      <div className={`flex items-center justify-start gap-2 opacity-0 group-hover:opacity-100 transition-opacity`}>
                        <button 
                          onClick={() => {
                            setSelectedUser(user);
                            setIsViewModalOpen(true);
                          }}
                          className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-blue-500 hover:scale-110 transition-all"
                          title={t.view}
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedUser(user);
                            setIsEditModalOpen(true);
                          }}
                          className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-amber-500 hover:scale-110 transition-all"
                          title={t.edit}
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.uid)}
                          className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-rose-500 hover:scale-110 transition-all"
                          title={t.delete}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      <AnimatePresence>
        {isEditModalOpen && selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md" dir="rtl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#f5f5f5] w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-200 flex items-center justify-between bg-white/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg">
                    <Pencil size={24} />
                  </div>
                  <div className="text-right">
                    <h3 className="text-2xl font-black text-gray-800">{t.editUser}</h3>
                    <p className="text-sm text-gray-500 font-bold">{t.edit}: {selectedUser.displayName}</p>
                  </div>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                  <X size={24} className="text-gray-400" />
                </button>
              </div>

              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-gray-400 uppercase mr-2">{t.name}</label>
                    <NeumorphicInput 
                      icon={Users}
                      placeholder={t.name}
                      value={selectedUser.displayName}
                      onChange={(e: any) => setSelectedUser({...selectedUser, displayName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-gray-400 uppercase mr-2">{t.email}</label>
                    <NeumorphicInput 
                      icon={Mail}
                      placeholder={t.email}
                      value={selectedUser.email}
                      onChange={(e: any) => setSelectedUser({...selectedUser, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-gray-400 uppercase mr-2">{t.role}</label>
                    <NeumorphicSelect 
                      icon={Shield}
                      placeholder={t.role}
                      value={selectedUser.role}
                      onChange={(e: any) => setSelectedUser({...selectedUser, role: e.target.value as any})}
                      options={[
                        { label: t.student, value: 'student' },
                        { label: t.admin, value: 'admin' }
                      ]}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-gray-400 uppercase mr-2">{t.status}</label>
                    <NeumorphicSelect 
                      icon={Activity}
                      placeholder={t.status}
                      value={selectedUser.status || 'active'}
                      onChange={(e: any) => setSelectedUser({...selectedUser, status: e.target.value as any})}
                      options={[
                        { label: t.active, value: 'active' },
                        { label: t.banned, value: 'banned' },
                        { label: t.pending, value: 'pending' }
                      ]}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-gray-400 uppercase mr-2">{t.whatsapp}</label>
                    <NeumorphicInput 
                      icon={Target}
                      placeholder={t.whatsapp}
                      value={selectedUser.whatsapp || ''}
                      onChange={(e: any) => setSelectedUser({...selectedUser, whatsapp: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-gray-400 uppercase mr-2">{t.age}</label>
                    <NeumorphicInput 
                      icon={Calendar}
                      placeholder={t.age}
                      value={selectedUser.age || ''}
                      onChange={(e: any) => setSelectedUser({...selectedUser, age: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-gray-400 uppercase mr-2">{t.gender}</label>
                    <NeumorphicSelect 
                      icon={Users}
                      placeholder={t.gender}
                      value={selectedUser.gender || ''}
                      onChange={(e: any) => setSelectedUser({...selectedUser, gender: e.target.value as any})}
                      options={[
                        { label: t.male, value: 'male' },
                        { label: t.female, value: 'female' }
                      ]}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-gray-400 uppercase mr-2">{t.language}</label>
                    <NeumorphicSelect 
                      icon={Languages}
                      placeholder={t.language}
                      value={selectedUser.language || ''}
                      onChange={(e: any) => setSelectedUser({...selectedUser, language: e.target.value as any})}
                      options={[
                        { label: t.german, value: 'german' },
                        { label: t.english, value: 'english' }
                      ]}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-gray-400 uppercase mr-2">الشهر الحالي</label>
                    <NeumorphicInput 
                      icon={Calendar}
                      placeholder="الشهر"
                      type="number"
                      value={(selectedUser.currentMonth || 1).toString()}
                      onChange={(e: any) => setSelectedUser({...selectedUser, currentMonth: parseInt(e.target.value) || 1})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-gray-400 uppercase mr-2">الأسبوع الحالي</label>
                    <NeumorphicInput 
                      icon={Calendar}
                      placeholder="الأسبوع"
                      type="number"
                      value={(selectedUser.currentWeek || 1).toString()}
                      onChange={(e: any) => setSelectedUser({...selectedUser, currentWeek: parseInt(e.target.value) || 1})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-gray-400 uppercase mr-2">اليوم الحالي</label>
                    <NeumorphicInput 
                      icon={Calendar}
                      placeholder="اليوم"
                      type="number"
                      value={(selectedUser.currentDay || 1).toString()}
                      onChange={(e: any) => setSelectedUser({...selectedUser, currentDay: parseInt(e.target.value) || 1})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-gray-400 uppercase mr-2">{t.pointsBalance}</label>
                    <NeumorphicInput 
                      icon={Award}
                      placeholder={t.points}
                      type="number"
                      value={selectedUser.points.toString()}
                      onChange={(e: any) => setSelectedUser({...selectedUser, points: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-gray-400 uppercase mr-2">{t.currentLevel}</label>
                    <NeumorphicSelect 
                      icon={TrendingUp}
                      placeholder={t.level}
                      value={selectedUser.level}
                      onChange={(e: any) => setSelectedUser({...selectedUser, level: e.target.value as any})}
                      options={LEVELS}
                    />
                  </div>
                  
                  {/* Subscriptions Management */}
                  <div className="col-span-1 md:col-span-2 mt-6 bg-white/50 p-6 rounded-2xl border border-gray-200">
                    <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Award size={20} className="text-blue-500" />
                      إدارة الاشتراكات (Subscriptions) - {language === 'german' ? 'الألمانية' : 'الإنجليزية'}
                    </h4>
                    
                    <div className="space-y-6">
                      {/* List of current subscriptions */}
                      <div className="flex flex-wrap gap-2 min-h-[40px] p-4 bg-gray-50 rounded-xl border border-gray-100">
                        {Object.entries((selectedUser.subscriptions?.[language as 'german' | 'english'] as Record<string, number[]>) || {}).map(([level, months]) => 
                          months.map(month => (
                            <div key={`${level}-${month}`} className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm">
                              <span>{level} - شهر {month}</span>
                              <button 
                                onClick={() => {
                                  const newSubs = { ...selectedUser.subscriptions };
                                  const langSubs = { ...(newSubs[language as 'german' | 'english'] || {}) };
                                  langSubs[level] = langSubs[level].filter(m => m !== month);
                                  if (langSubs[level].length === 0) delete langSubs[level];
                                  newSubs[language as 'german' | 'english'] = langSubs;
                                  setSelectedUser({ ...selectedUser, subscriptions: newSubs });
                                }}
                                className="text-blue-500 hover:text-red-500 transition-colors bg-white/50 rounded-full p-0.5"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))
                        )}
                        {(!selectedUser.subscriptions?.[language as 'german' | 'english'] || Object.keys(selectedUser.subscriptions[language as 'german' | 'english']!).length === 0) && (
                          <span className="text-gray-400 text-sm flex items-center h-full">لا يوجد اشتراكات نشطة لهذه اللغة</span>
                        )}
                      </div>

                      {/* Add new subscription */}
                      <div className="flex flex-wrap items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <select 
                          id="newSubLevel"
                          className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white shadow-sm font-bold text-gray-700 outline-none focus:border-blue-500"
                        >
                          {LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                        </select>
                        <select 
                          id="newSubMonth"
                          className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white shadow-sm font-bold text-gray-700 outline-none focus:border-blue-500"
                        >
                          {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>شهر {m}</option>)}
                        </select>
                        <button 
                          onClick={() => {
                            const level = (document.getElementById('newSubLevel') as HTMLSelectElement).value;
                            const newSubs = { ...(selectedUser.subscriptions || { german: {}, english: {} }) };
                            const langSubs = { ...(newSubs[language as 'german' | 'english'] || {}) };
                            langSubs[level] = [1,2,3,4,5,6,7,8,9,10,11,12];
                            newSubs[language as 'german' | 'english'] = langSubs;
                            setSelectedUser({ ...selectedUser, subscriptions: newSubs });
                          }}
                          className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-black hover:bg-emerald-600 transition-colors shadow-md flex items-center gap-2"
                        >
                          <CheckCircle size={18} />
                          إضافة كل الشهور
                        </button>
                        <button 
                          onClick={() => {
                            const level = (document.getElementById('newSubLevel') as HTMLSelectElement).value;
                            const month = parseInt((document.getElementById('newSubMonth') as HTMLSelectElement).value);
                            const newSubs = { ...(selectedUser.subscriptions || { german: {}, english: {} }) };
                            const langSubs = { ...(newSubs[language as 'german' | 'english'] || {}) };
                            if (!langSubs[level]) langSubs[level] = [];
                            if (!langSubs[level].includes(month)) {
                              langSubs[level].push(month);
                              newSubs[language as 'german' | 'english'] = langSubs;
                              setSelectedUser({ ...selectedUser, subscriptions: newSubs });
                            }
                          }}
                          className="bg-blue-500 text-white px-6 py-2.5 rounded-xl font-black hover:bg-blue-600 transition-colors shadow-md flex items-center gap-2"
                        >
                          <Award size={18} />
                          إضافة اشتراك
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`p-8 bg-white/50 border-t border-gray-200 flex justify-end gap-4`}>
                <NeumorphicButton 
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-8 py-3 text-gray-500"
                >
                  {t.cancel}
                </NeumorphicButton>
                <NeumorphicButton 
                  onClick={() => handleUpdateUser(selectedUser.uid, selectedUser)}
                  className="px-10 py-3 bg-blue-500 text-white font-black"
                >
                  <Save size={18} className="mr-2" />
                  {t.save}
                </NeumorphicButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View User Details Modal */}
      <AnimatePresence>
        {isViewModalOpen && selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md" dir="rtl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#f5f5f5] w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="relative h-48 bg-gradient-to-r from-blue-600 to-indigo-700">
                <button 
                  onClick={() => setIsViewModalOpen(false)}
                  className={`absolute top-6 left-6 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all`}
                >
                  <X size={24} />
                </button>
                <div className={`absolute -bottom-16 right-12 flex items-end gap-6`}>
                  <img 
                    src={selectedUser.photoURL || `https://ui-avatars.com/api/?name=${selectedUser.displayName}&size=128&background=random`} 
                    alt="" 
                    className="w-32 h-32 rounded-[32px] border-8 border-[#f5f5f5] shadow-xl object-cover"
                  />
                  <div className="mb-4">
                    <h3 className="text-3xl font-black text-white drop-shadow-md">{selectedUser.displayName}</h3>
                    <p className="text-blue-100 font-bold flex items-center gap-2">
                      <Mail size={16} />
                      {selectedUser.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="pt-24 px-12 flex gap-4 border-b border-gray-200">
                {[
                  { id: 'info', label: 'معلومات الحساب', icon: Shield },
                  { id: 'progress', label: 'التقدم التعليمي', icon: Award },
                  { id: 'activity', label: 'النشاط الأخير', icon: Activity }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-6 py-4 font-black flex items-center gap-2 transition-all border-b-4 ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                  >
                    <tab.icon size={18} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-12 min-h-[400px]">
                {activeTab === 'info' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <NeumorphicCard className="p-6 space-y-4">
                      <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">{t.accountInfo}</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-500">{t.role}</span>
                          <span className="text-xs font-black text-blue-600 uppercase">{selectedUser.role === 'admin' ? t.admin : t.student}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-500">{t.status}</span>
                          <span className="text-xs font-black text-emerald-600 uppercase">{(selectedUser.status || 'active') === 'active' ? t.active : t.banned}</span>
                        </div>
                        {selectedUser.whatsapp && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500">{t.whatsapp}</span>
                            <span className="text-xs font-black text-emerald-600">{selectedUser.whatsapp}</span>
                          </div>
                        )}
                        {selectedUser.age && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500">{t.age}</span>
                            <span className="text-xs font-black text-gray-700">{selectedUser.age}</span>
                          </div>
                        )}
                        {selectedUser.gender && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500">{t.gender}</span>
                            <span className="text-xs font-black text-gray-700">{selectedUser.gender === 'male' ? t.male : t.female}</span>
                          </div>
                        )}
                        {selectedUser.language && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500">{t.language}</span>
                            <span className="text-xs font-black text-blue-600">{selectedUser.language === 'german' ? t.german : t.english}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-500">{t.joinedAt}</span>
                          <span className="text-xs font-black text-gray-700">{selectedUser.joinedAt?.toDate ? selectedUser.joinedAt.toDate().toLocaleDateString('ar-EG') : t.notProvided}</span>
                        </div>
                      </div>
                    </NeumorphicCard>
                  </div>
                )}
                {activeTab === 'progress' && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center p-8 bg-white rounded-3xl shadow-sm border border-gray-100">
                      <Award className="w-10 h-10 text-amber-500 mx-auto mb-4" />
                      <div className="text-3xl font-black text-gray-800">{selectedUser.points}</div>
                      <div className="text-xs font-bold text-gray-400 uppercase">{t.points}</div>
                    </div>
                    <div className="text-center p-8 bg-white rounded-3xl shadow-sm border border-gray-100">
                      <Zap className="w-10 h-10 text-orange-500 mx-auto mb-4" />
                      <div className="text-3xl font-black text-gray-800">{selectedUser.streak}</div>
                      <div className="text-xs font-bold text-gray-400 uppercase">{t.streak}</div>
                    </div>
                    <div className="text-center p-8 bg-white rounded-3xl shadow-sm border border-gray-100">
                      <TrendingUp className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
                      <div className="text-3xl font-black text-gray-800">{selectedUser.level}</div>
                      <div className="text-xs font-bold text-gray-400 uppercase">{t.level}</div>
                    </div>
                    <div className="text-center p-8 bg-white rounded-3xl shadow-sm border border-gray-100">
                      <Layout className="w-10 h-10 text-blue-500 mx-auto mb-4" />
                      <div className="text-3xl font-black text-gray-800">{selectedUser.progress}%</div>
                      <div className="text-xs font-bold text-gray-400 uppercase">{t.progress}</div>
                    </div>
                  </div>
                )}
                {activeTab === 'activity' && (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <Activity size={64} className="mb-6 opacity-20" />
                    <p className="font-bold text-lg">{t.noActivity}</p>
                  </div>
                )}
              </div>

              <div className={`p-8 bg-white/50 border-t border-gray-200 flex justify-end gap-4`} dir="ltr">
                <NeumorphicButton 
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-10 py-3 bg-gray-800 text-white font-black"
                >
                  {t.close}
                </NeumorphicButton>
                <NeumorphicButton 
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setIsEditModalOpen(true);
                  }}
                  className="px-8 py-3 bg-white text-amber-500 font-black"
                >
                  <Pencil size={18} className="mr-2" />
                  {t.editUser}
                </NeumorphicButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Subscription Requests Modal */}
      <AnimatePresence>
      </AnimatePresence>
    </div>
  );
};

export default AdminUsers;
