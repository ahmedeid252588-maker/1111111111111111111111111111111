
import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  Users, 
  User, 
  Layers, 
  Clock, 
  CircleCheck, 
  CircleAlert,
  Search,
  Filter,
  Trash2,
  Eye
} from 'lucide-react';
import { 
  NeumorphicCard, 
  NeumorphicButton, 
  NeumorphicInput, 
  NeumorphicSelect,
  NeumorphicTextArea
} from '../../components/Neumorphic';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, onSnapshot, Timestamp, where } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../components/ConfirmModal';

interface Notification {
  id: string;
  title: string;
  message: string;
  target: string;
  type: string;
  createdAt: any;
  status: string;
}

const AdminNotifications: React.FC<{ language: string }> = ({ language }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('all');
  const [type, setType] = useState('info');
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [history, setHistory] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  
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
    title: 'إرسال التنبيهات',
    subtitle: 'تواصل مع طلابك وأرسل آخر التحديثات والأخبار',
    createNew: 'إنشاء تنبيه جديد',
    type: 'نوع التنبيه',
    target: 'الفئة المستهدفة',
    notifTitle: 'عنوان التنبيه',
    message: 'نص الرسالة',
    sendNow: 'إرسال الآن',
    sending: 'جاري الإرسال...',
    preview: 'معاينة التنبيه',
    previewTitle: 'عنوان التنبيه يظهر هنا',
    previewMessage: 'نص الرسالة سيظهر هنا للطلاب بشكل واضح...',
    now: 'الآن',
    all: 'الكل',
    students: 'الطلاب',
    admins: 'المديرين',
    premium: 'المشتركين',
    info: 'معلومات',
    success: 'نجاح',
    warning: 'تحذير',
    error: 'خطأ',
    totalNotifs: 'إجمالي التنبيهات',
    sendRate: 'معدل الإرسال',
    history: 'سجل التنبيهات المرسلة',
    search: 'بحث في السجل...',
    tableNotif: 'التنبيه',
    tableCategory: 'الفئة',
    tableDate: 'التاريخ',
    tableStatus: 'الحالة',
    tableActions: 'إجراءات',
    sent: 'تم الإرسال',
    loading: 'جاري التحميل...',
    noNotifs: 'لا توجد تنبيهات مرسلة',
    deleteTitle: 'حذف التنبيه',
    deleteMessage: 'هل أنت متأكد أنك تريد حذف هذا التنبيه من السجل؟',
    errorInput: 'يرجى إدخال العنوان ونص الرسالة',
    successSend: 'تم إرسال التنبيه بنجاح!',
    errorSend: 'فشل إرسال التنبيه',
    successDelete: 'تم حذف التنبيه بنجاح',
    errorDelete: 'فشل الحذف',
    placeholderTitle: 'أدخل عنواناً جذاباً...',
    placeholderMessage: 'اكتب تفاصيل التنبيه هنا...',
    selectType: 'اختر النوع',
    selectTarget: 'اختر الفئة المستهدفة'
  };

  useEffect(() => {
    const path = `notifications_${language}`;
    const q = query(
      collection(db, path), 
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setHistory(notifs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [language]);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error(t.errorInput);
      return;
    }

    setIsSending(true);
    try {
      const path = `notifications_${language}`;
      await addDoc(collection(db, path), {
        title,
        message,
        target,
        type,
        status: 'sent',
        createdAt: Timestamp.now(),
        readBy: [],
        language
      });
      toast.success(t.successSend);
      setTitle('');
      setMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `notifications_${language}`);
      toast.error(t.errorSend);
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: t.deleteTitle,
      message: t.deleteMessage,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await deleteDoc(doc(db, `notifications_${language}`, id));
          toast.success(t.successDelete);
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `notifications_${language}/${id}`);
          toast.error(t.errorDelete);
        }
      }
    });
  };

  const filteredHistory = history.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="text-right">
          <h2 className="text-4xl font-black text-[#4a4a4a] mb-2">{t.title}</h2>
          <p className="text-slate-400 font-bold">{t.subtitle}</p>
        </div>
        <div className="w-16 h-16 rounded-2xl bg-[#f5f5f5] shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] flex items-center justify-center text-[#4d9685]">
          <Bell size={32} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Create Notification Form */}
        <div className="lg:col-span-7">
          <NeumorphicCard className="p-10">
            <h3 className="text-2xl font-black text-[#4a4a4a] mb-8">{t.createNew}</h3>
            
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-500 ml-2">{t.type}</label>
                  <NeumorphicSelect 
                    icon={CircleAlert}
                    value={type}
                    onChange={(e: any) => setType(e.target.value)}
                    options={[
                      { label: t.info, value: 'info' },
                      { label: t.success, value: 'success' },
                      { label: t.warning, value: 'warning' },
                      { label: t.error, value: 'error' }
                    ]}
                    placeholder={t.selectType}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-500 ml-2">{t.target}</label>
                  <NeumorphicSelect 
                    icon={Users}
                    value={target}
                    onChange={(e: any) => setTarget(e.target.value)}
                    options={[
                      { label: t.all, value: 'all' },
                      { label: t.students, value: 'students' },
                      { label: t.admins, value: 'admins' },
                      { label: t.premium, value: 'premium' }
                    ]}
                    placeholder={t.selectTarget}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-500 ml-2">{t.notifTitle}</label>
                <NeumorphicInput 
                  icon={Bell}
                  placeholder={t.placeholderTitle}
                  value={title}
                  onChange={(e: any) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-500 ml-2">{t.message}</label>
                <NeumorphicTextArea 
                  placeholder={t.placeholderMessage}
                  value={message}
                  onChange={(e: any) => setMessage(e.target.value)}
                  rows={6}
                />
              </div>

              <div className="pt-4">
                <NeumorphicButton onClick={handleSend} disabled={isSending}>
                  <div className="flex items-center justify-center gap-3">
                    <Send size={20} />
                    <span>{isSending ? t.sending : t.sendNow}</span>
                  </div>
                </NeumorphicButton>
              </div>
            </div>
          </NeumorphicCard>
        </div>

        {/* Preview & Stats */}
        <div className="lg:col-span-5 space-y-10">
          <NeumorphicCard className="p-8">
            <h3 className="text-xl font-black text-[#4a4a4a] mb-6">{t.preview}</h3>
            <div className="p-6 rounded-3xl bg-white shadow-inner border border-slate-100">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  type === 'info' ? 'bg-blue-50 text-blue-500' :
                  type === 'success' ? 'bg-emerald-50 text-emerald-500' :
                  type === 'warning' ? 'bg-amber-50 text-amber-500' : 'bg-red-50 text-red-500'
                }`}>
                  <Bell size={24} />
                </div>
                <div className="text-right flex-1">
                  <h4 className="font-black text-[#4a4a4a] text-lg mb-1">{title || t.previewTitle}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">{message || t.previewMessage}</p>
                  <p className="text-[10px] text-slate-300 mt-4 font-bold uppercase">{t.now} • {target === 'all' ? t.all : t[target as keyof typeof t] || target}</p>
                </div>
              </div>
            </div>
          </NeumorphicCard>

          <div className="grid grid-cols-2 gap-6">
            <NeumorphicCard className="p-6 text-center">
              <p className="text-3xl font-black text-[#4d9685]">{history.length}</p>
              <p className="text-xs text-slate-400 font-bold mt-1">{t.totalNotifs}</p>
            </NeumorphicCard>
            <NeumorphicCard className="p-6 text-center">
              <p className="text-3xl font-black text-blue-500">100%</p>
              <p className="text-xs text-slate-400 font-bold mt-1">{t.sendRate}</p>
            </NeumorphicCard>
          </div>
        </div>
      </div>

      {/* History Table */}
      <NeumorphicCard className="p-10">
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-2xl font-black text-[#4a4a4a]">{t.history}</h3>
          <div className="flex gap-4">
            <div className="w-64">
              <NeumorphicInput 
                icon={Search} 
                placeholder={t.search} 
                value={searchTerm}
                onChange={(e: any) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-6 font-black text-slate-400 text-sm">{t.tableNotif}</th>
                <th className="pb-6 font-black text-slate-400 text-sm">{t.tableCategory}</th>
                <th className="pb-6 font-black text-slate-400 text-sm">{t.tableDate}</th>
                <th className="pb-6 font-black text-slate-400 text-sm">{t.tableStatus}</th>
                <th className="pb-6 font-black text-slate-400 text-sm">{t.tableActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500 font-bold">
                    {t.loading}
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500 font-bold">
                    {t.noNotifs}
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-6">
                      <p className="font-bold text-[#4a4a4a]">{item.title}</p>
                      <p className="text-xs text-slate-400 mt-1 truncate max-w-xs">{item.message}</p>
                    </td>
                    <td className="py-6">
                      <span className="px-3 py-1 rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                        {t[item.target as keyof typeof t] || item.target}
                      </span>
                    </td>
                    <td className="py-6 text-sm text-slate-500 font-medium">
                      {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString('ar-EG') : 'N/A'}
                    </td>
                    <td className="py-6">
                      <div className="flex items-center gap-2 text-emerald-500">
                        <CircleCheck size={14} />
                        <span className="text-xs font-bold">{t.sent}</span>
                      </div>
                    </td>
                    <td className="py-6">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </NeumorphicCard>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default AdminNotifications;
