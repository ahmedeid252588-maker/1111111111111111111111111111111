import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { Marketer, SubscriptionRequest } from '../../types';
import { Plus, Trash2, Edit2, Search, DollarSign, Users, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { DISCOUNTED_PRICE } from '../../constants';

const AdminMarketers = ({ language }: { language: 'german' | 'english' }) => {
  const [marketers, setMarketers] = useState<Marketer[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMarketer, setEditingMarketer] = useState<Marketer | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    code: '',
    commissionType: 'fixed' as 'fixed' | 'percentage',
    commissionValue: 50,
  });

  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [selectedMarketer, setSelectedMarketer] = useState<Marketer | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'marketers'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const marketersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Marketer[];
      setMarketers(marketersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'marketers');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Fetch approved subscriptions to calculate stats
    const q = query(collection(db, 'subscription_requests'), where('status', '==', 'approved'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SubscriptionRequest[];
      setSubscriptions(subsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'subscription_requests');
    });

    return () => unsubscribe();
  }, []);

  const handleOpenModal = (marketer?: Marketer) => {
    if (marketer) {
      setEditingMarketer(marketer);
      setFormData({
        name: marketer.name,
        phone: marketer.phone,
        code: marketer.code,
        commissionType: marketer.commissionType,
        commissionValue: marketer.commissionValue,
      });
    } else {
      setEditingMarketer(null);
      setFormData({
        name: '',
        phone: '',
        code: '',
        commissionType: 'fixed',
        commissionValue: 50,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      toast.error('يرجى إدخال اسم المسوق والكود');
      return;
    }

    try {
      if (editingMarketer) {
        await updateDoc(doc(db, 'marketers', editingMarketer.id), {
          ...formData,
        });
        toast.success('تم تحديث بيانات المسوق بنجاح');
      } else {
        await addDoc(collection(db, 'marketers'), {
          ...formData,
          paidAmount: 0,
          createdAt: serverTimestamp(),
        });
        toast.success('تمت إضافة المسوق بنجاح');
      }
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, editingMarketer ? OperationType.UPDATE : OperationType.CREATE, 'marketers');
      toast.error('حدث خطأ أثناء حفظ البيانات');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المسوق؟')) {
      try {
        await deleteDoc(doc(db, 'marketers', id));
        toast.success('تم حذف المسوق بنجاح');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `marketers/${id}`);
        toast.error('حدث خطأ أثناء الحذف');
      }
    }
  };

  const handleOpenPayout = (marketer: Marketer) => {
    setSelectedMarketer(marketer);
    setPayoutAmount(0);
    setIsPayoutModalOpen(true);
  };

  const handlePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMarketer || payoutAmount <= 0) return;

    try {
      await updateDoc(doc(db, 'marketers', selectedMarketer.id), {
        paidAmount: selectedMarketer.paidAmount + payoutAmount
      });
      toast.success('تم تسجيل الدفعة بنجاح');
      setIsPayoutModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `marketers/${selectedMarketer.id}`);
      toast.error('حدث خطأ أثناء تسجيل الدفعة');
    }
  };

  const getMarketerStats = (code: string, commissionType: string, commissionValue: number) => {
    const marketerSubs = subscriptions.filter(sub => sub.marketerCode === code);
    const count = marketerSubs.length;
    
    let totalEarned = 0;
    if (commissionType === 'fixed') {
      totalEarned = count * commissionValue;
    } else {
      // Use DISCOUNTED_PRICE for percentage calculation
      totalEarned = count * (DISCOUNTED_PRICE * (commissionValue / 100));
    }

    return { count, totalEarned };
  };

  const filteredMarketers = marketers.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.phone.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4d9685] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#4a4a4a] mb-2">نظام المسوقين والعمولات</h1>
          <p className="text-gray-500">إدارة أكواد الخصم، تتبع الاشتراكات، وحساب العمولات.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-[#4d9685] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#3d7a6c] transition-colors shadow-lg shadow-[#4d9685]/20"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة مسوق جديد</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ابحث باسم المسوق، رقم الهاتف، أو كود الخصم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pr-12 pl-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-[#4d9685] outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredMarketers.map((marketer) => {
          const stats = getMarketerStats(marketer.code, marketer.commissionType, marketer.commissionValue);
          const remaining = stats.totalEarned - marketer.paidAmount;

          return (
            <div key={marketer.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-800">{marketer.name}</h3>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-bold rounded-full">
                    {marketer.code}
                  </span>
                </div>
                <div className="text-gray-500 text-sm mb-4 flex items-center gap-4">
                  <span>📞 {marketer.phone || 'لا يوجد رقم'}</span>
                  <span>💰 العمولة: {marketer.commissionType === 'fixed' ? `${marketer.commissionValue} جنيه` : `${marketer.commissionValue}%`}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="text-gray-500 text-xs font-bold mb-1">الاشتراكات الناجحة</div>
                    <div className="text-2xl font-black text-gray-800">{stats.count}</div>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                    <div className="text-emerald-600 text-xs font-bold mb-1">إجمالي الأرباح</div>
                    <div className="text-2xl font-black text-emerald-700">{stats.totalEarned} <span className="text-sm">ج</span></div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <div className="text-blue-600 text-xs font-bold mb-1">تم الدفع</div>
                    <div className="text-2xl font-black text-blue-700">{marketer.paidAmount} <span className="text-sm">ج</span></div>
                  </div>
                  <div className={`p-4 rounded-xl border ${remaining > 0 ? 'bg-orange-50 border-orange-100' : 'bg-gray-50 border-gray-100'}`}>
                    <div className={`${remaining > 0 ? 'text-orange-600' : 'text-gray-500'} text-xs font-bold mb-1`}>المتبقي (مستحق)</div>
                    <div className={`text-2xl font-black ${remaining > 0 ? 'text-orange-700' : 'text-gray-800'}`}>{remaining} <span className="text-sm">ج</span></div>
                  </div>
                </div>
              </div>

              <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
                <button
                  onClick={() => handleOpenPayout(marketer)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>تسجيل دفعة</span>
                </button>
                <button
                  onClick={() => handleOpenModal(marketer)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>تعديل</span>
                </button>
                <button
                  onClick={() => handleDelete(marketer.id)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl font-bold hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredMarketers.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-500">لا يوجد مسوقين</h3>
            <p className="text-gray-400 mt-2">قم بإضافة مسوقين جدد للبدء في تتبع العمولات.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Marketer Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingMarketer ? 'تعديل بيانات المسوق' : 'إضافة مسوق جديد'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">اسم المسوق</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 text-base rounded-xl border border-gray-300 focus:border-[#4d9685] focus:ring-2 focus:ring-[#4d9685]/20 outline-none"
                    placeholder="مثال: أحمد محمد"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">رقم الهاتف (اختياري)</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 text-base rounded-xl border border-gray-300 focus:border-[#4d9685] focus:ring-2 focus:ring-[#4d9685]/20 outline-none"
                    placeholder="مثال: 01000000000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">كود الخصم / الدعوة</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-4 py-3 text-base rounded-xl border border-gray-300 focus:border-[#4d9685] focus:ring-2 focus:ring-[#4d9685]/20 outline-none font-bold text-emerald-600"
                    placeholder="مثال: AHMED50"
                  />
                  <p className="text-xs text-gray-500 mt-1">هذا هو الكود الذي سيستخدمه الطلاب للحصول على الخصم.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">نوع العمولة</label>
                    <select
                      value={formData.commissionType}
                      onChange={(e) => setFormData({ ...formData, commissionType: e.target.value as 'fixed' | 'percentage' })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-[#4d9685] focus:ring-2 focus:ring-[#4d9685]/20 outline-none"
                    >
                      <option value="fixed">مبلغ ثابت</option>
                      <option value="percentage">نسبة مئوية (%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">قيمة العمولة</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.commissionValue}
                      onChange={(e) => setFormData({ ...formData, commissionValue: Number(e.target.value) })}
                      className="w-full px-4 py-3 text-base rounded-xl border border-gray-300 focus:border-[#4d9685] focus:ring-2 focus:ring-[#4d9685]/20 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-[#4d9685] text-white py-3 rounded-xl font-bold hover:bg-[#3d7a6c] transition-colors"
                  >
                    حفظ البيانات
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payout Modal */}
      <AnimatePresence>
        {isPayoutModalOpen && selectedMarketer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsPayoutModalOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-50">
                <h2 className="text-xl font-bold text-blue-800">تسجيل دفعة للمسوق</h2>
                <button onClick={() => setIsPayoutModalOpen(false)} className="text-blue-400 hover:text-blue-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handlePayout} className="p-6 space-y-4">
                <div className="text-center mb-4">
                  <p className="text-gray-500 text-sm">المسوق</p>
                  <p className="font-bold text-lg">{selectedMarketer.name}</p>
                  <p className="text-sm text-orange-600 font-bold mt-1">
                    المستحق: {getMarketerStats(selectedMarketer.code, selectedMarketer.commissionType, selectedMarketer.commissionValue).totalEarned - selectedMarketer.paidAmount} جنيه
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">المبلغ المدفوع (جنيه)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={payoutAmount || ''}
                    onChange={(e) => setPayoutAmount(Number(e.target.value))}
                    className="w-full px-4 py-4 text-lg rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-center font-bold"
                    placeholder="0"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                  >
                    تأكيد الدفع
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminMarketers;
