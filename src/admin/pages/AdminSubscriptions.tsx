
import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, deleteDoc, getDoc, arrayUnion, Timestamp, getDocs, where, increment } from 'firebase/firestore';
import { SubscriptionRequest, UserProfile } from '../../types';
import { NeumorphicCard, NeumorphicButton } from '../../components/Neumorphic';
import { Check, X, ExternalLink, Phone, User, Calendar, CreditCard, Clock, Search, Filter, Tag, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { BASE_PRICE, DISCOUNTED_PRICE } from '../../constants';

const AdminSubscriptions = ({ language }: { language: 'german' | 'english' }) => {
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    const q = query(collection(db, 'subscription_requests'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionRequest));
      setRequests(reqs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'subscription_requests');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleApprove = async (request: SubscriptionRequest) => {
    try {
      // 1. Update user's subscriptions
      const userRef = doc(db, 'users', request.userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        toast.error("المستخدم غير موجود");
        return;
      }

      const userData = userDoc.data() as UserProfile;
      const currentSubs = userData.subscriptions || {};
      const langSubs = currentSubs[request.language] || {};
      const levelMonths = langSubs[request.level] || [];

      if (!levelMonths.includes(request.month)) {
        levelMonths.push(request.month);
      }

      await updateDoc(userRef, {
        [`subscriptions.${request.language}.${request.level}`]: levelMonths
      });

      // 2. Update request status
      await updateDoc(doc(db, 'subscription_requests', request.id), {
        status: 'approved'
      });

      // 3. Check if marketerCode is a user referral code and increment count
      if (request.marketerCode) {
        const qUser = query(collection(db, 'users'), where('referralCode', '==', request.marketerCode));
        const snapshotUser = await getDocs(qUser);
        if (!snapshotUser.empty) {
          const referringUserDoc = snapshotUser.docs[0];
          await updateDoc(doc(db, 'users', referringUserDoc.id), {
            referralsCount: increment(1)
          });
        }
      }

      toast.success("تم تفعيل الاشتراك بنجاح");
    } catch (error) {
      console.error("Error approving subscription:", error);
      toast.error("حدث خطأ أثناء التفعيل");
    }
  };

  const handleReject = async (requestId: string) => {
    if (!window.confirm("هل أنت متأكد من رفض هذا الطلب؟")) return;
    try {
      await updateDoc(doc(db, 'subscription_requests', requestId), {
        status: 'rejected'
      });
      toast.success("تم رفض الطلب");
    } catch (error) {
      console.error("Error rejecting subscription:", error);
      toast.error("حدث خطأ أثناء الرفض");
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الطلب نهائياً؟")) return;
    try {
      await deleteDoc(doc(db, 'subscription_requests', requestId));
      toast.success("تم حذف الطلب");
    } catch (error) {
      console.error("Error deleting request:", error);
      toast.error("حدث خطأ أثناء الحذف");
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      req.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.senderNumber.includes(searchTerm) ||
      (req.marketerCode && req.marketerCode.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStatus === 'all' || req.status === filterStatus;
    const matchesLanguage = req.language === language;
    
    return matchesSearch && matchesFilter && matchesLanguage;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4d9685]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#4a4a4a]">طلبات الاشتراك</h2>
          <p className="text-slate-400 font-bold">إدارة وتفعيل اشتراكات الطلاب اليدوية</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="بحث بالاسم أو الرقم أو الكود..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 pr-12 pl-4 bg-white rounded-2xl shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05)] border-none outline-none font-bold text-slate-600 w-64"
            />
          </div>

          <div className="flex items-center bg-white rounded-2xl p-1 shadow-sm">
            {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                  filterStatus === status 
                    ? 'bg-[#4d9685] text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {status === 'pending' ? 'معلق' : status === 'approved' ? 'مقبول' : status === 'rejected' ? 'مرفوض' : 'الكل'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredRequests.length === 0 ? (
          <NeumorphicCard className="p-12 text-center">
            <CreditCard className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold text-xl">لا توجد طلبات اشتراك حالياً</p>
          </NeumorphicCard>
        ) : (
          filteredRequests.map((request) => (
            <NeumorphicCard key={request.id} className="p-6 overflow-hidden">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Request Details */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-black text-[#4a4a4a] flex items-center gap-2">
                        <User className="w-5 h-5 text-[#4d9685]" />
                        {request.userName}
                      </h3>
                      <p className="text-slate-400 font-bold text-sm">{request.userEmail}</p>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full font-black text-xs ${
                      request.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                      request.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {request.status === 'pending' ? 'قيد المراجعة' : 
                       request.status === 'approved' ? 'تم التفعيل' : 'مرفوض'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-[10px] text-slate-400 font-bold mb-1">رقم المحول</p>
                      <p className="text-sm font-black text-slate-700 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-blue-400" />
                        <span dir="ltr">{request.senderNumber}</span>
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-[10px] text-slate-400 font-bold mb-1">المستوى والشهر</p>
                      <p className="text-sm font-black text-slate-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-400" />
                        {request.level} - شهر {request.month}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-[10px] text-slate-400 font-bold mb-1">كود المسوق</p>
                      <p className="text-sm font-black text-slate-700 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-amber-400" />
                        {request.marketerCode || <span className="text-gray-400 font-normal">لا يوجد</span>}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-[10px] text-slate-400 font-bold mb-1">المبلغ المتوقع</p>
                      <p className="text-sm font-black text-slate-700 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                        {request.marketerCode ? DISCOUNTED_PRICE : BASE_PRICE} جنيه
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-[10px] text-slate-400 font-bold mb-1">تاريخ الطلب</p>
                      <p className="text-sm font-black text-slate-700 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-400" />
                        {request.createdAt?.toDate().toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    {request.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleApprove(request)}
                          className="flex-1 h-12 rounded-xl bg-emerald-500 text-white font-black shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                        >
                          <Check className="w-5 h-5" />
                          تفعيل الاشتراك
                        </button>
                        <button 
                          onClick={() => handleReject(request.id)}
                          className="flex-1 h-12 rounded-xl bg-white border-2 border-red-100 text-red-500 font-black hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                        >
                          <X className="w-5 h-5" />
                          رفض الطلب
                        </button>
                      </>
                    )}
                      <button 
                        onClick={() => handleDelete(request.id)}
                        className="h-12 px-6 rounded-xl bg-gray-100 text-gray-400 font-black hover:bg-red-50 hover:text-red-500 transition-all"
                      >
                        حذف السجل
                      </button>
                    <a 
                      href={`https://wa.me/2${(request.userWhatsapp || '').replace('+', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-12 px-6 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-all"
                      title="تواصل واتساب"
                    >
                      <Phone className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            </NeumorphicCard>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminSubscriptions;

