import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, where, getDocs, increment } from 'firebase/firestore';
import { UserProfile } from '../../types';
import { NeumorphicCard } from '../../components/Neumorphic';
import { Search, Users, Gift, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'motion/react';

const AdminReferrals = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // We want to fetch users who have at least one referral
    const q = query(collection(db, 'users'), where('referralsCount', '>', 0));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      // Sort in memory since we can't easily order by a different field when using where('>', 0) without a composite index
      usersData.sort((a, b) => (b.referralsCount || 0) - (a.referralsCount || 0));
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGrantFreeMonth = async (user: UserProfile) => {
    const pendingReferrals = (user.referralsCount || 0) - (user.usedReferralsCount || 0);
    if (pendingReferrals < 4) {
      toast.error("لم يكمل المستخدم 4 دعوات بعد");
      return;
    }

    if (!window.confirm(`هل أنت متأكد من منح شهر مجاني للمستخدم ${user.displayName}؟ سيتم خصم 4 دعوات من رصيده.`)) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        usedReferralsCount: increment(4)
      });
      toast.success("تم منح الشهر المجاني بنجاح وخصم 4 دعوات");
    } catch (error) {
      console.error("Error granting free month:", error);
      toast.error("حدث خطأ أثناء منح الشهر المجاني");
    }
  };

  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.referralCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h2 className="text-3xl font-black text-[#4a4a4a]">دعوات المستخدمين</h2>
          <p className="text-slate-400 font-bold">متابعة دعوات المستخدمين ومنح المكافآت</p>
        </div>

        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="بحث بالاسم، الإيميل، أو الكود..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-14 pr-12 pl-4 text-base bg-white rounded-2xl shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05)] border border-gray-300 outline-none font-bold text-slate-600 w-full md:w-80"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredUsers.length === 0 ? (
          <NeumorphicCard className="p-12 text-center">
            <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold text-xl">لا يوجد مستخدمين لديهم دعوات حالياً</p>
          </NeumorphicCard>
        ) : (
          filteredUsers.map((user) => {
            const totalReferrals = user.referralsCount || 0;
            const usedReferrals = user.usedReferralsCount || 0;
            const pendingReferrals = totalReferrals - usedReferrals;
            const canGrantFreeMonth = pendingReferrals >= 4;

            return (
              <NeumorphicCard key={user.uid} className="p-6 overflow-hidden">
                <div className="flex flex-col lg:flex-row gap-8 items-center justify-between">
                  {/* User Details */}
                  <div className="flex-1 space-y-4 w-full">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-black text-[#4a4a4a] flex items-center gap-2">
                          <Users className="w-5 h-5 text-[#4d9685]" />
                          {user.displayName}
                        </h3>
                        <p className="text-slate-400 font-bold text-sm">{user.email}</p>
                      </div>
                      <div className="bg-gray-100 px-4 py-2 rounded-xl border border-gray-200 text-center">
                        <p className="text-[10px] text-slate-500 font-bold mb-1">كود الدعوة</p>
                        <p className="font-black text-slate-800 tracking-widest" dir="ltr">{user.referralCode || 'لا يوجد'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
                        <p className="text-xs text-emerald-600 font-bold mb-1">إجمالي الدعوات الناجحة</p>
                        <p className="text-2xl font-black text-emerald-700">{totalReferrals}</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                        <p className="text-xs text-blue-600 font-bold mb-1">الدعوات المستخدمة (مكافآت)</p>
                        <p className="text-2xl font-black text-blue-700">{usedReferrals}</p>
                      </div>
                      <div className={`p-4 rounded-xl border text-center ${canGrantFreeMonth ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                        <p className={`text-xs font-bold mb-1 ${canGrantFreeMonth ? 'text-amber-600' : 'text-gray-500'}`}>الدعوات المتبقية (غير مستخدمة)</p>
                        <p className={`text-2xl font-black ${canGrantFreeMonth ? 'text-amber-700' : 'text-gray-700'}`}>{pendingReferrals}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 w-full lg:w-auto min-w-[200px]">
                    <button
                      onClick={() => handleGrantFreeMonth(user)}
                      disabled={!canGrantFreeMonth}
                      className={`flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold transition-all shadow-sm ${
                        canGrantFreeMonth 
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-white hover:shadow-md hover:-translate-y-1' 
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Gift className="w-5 h-5" />
                      منح شهر مجاني
                    </button>
                    {canGrantFreeMonth && (
                      <p className="text-[10px] text-amber-600 font-bold text-center">
                        المستخدم أكمل 4 دعوات ويستحق المكافأة
                      </p>
                    )}
                  </div>
                </div>
              </NeumorphicCard>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminReferrals;
