import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Phone, CheckCircle, Loader2, Copy, Tag, ChevronLeft, AlertCircle, Clock } from 'lucide-react';
import { NeumorphicCard } from './Neumorphic';
import { WHATSAPP_NUMBER, BASE_PRICE, DISCOUNTED_PRICE } from '../constants';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { UserProfile } from '../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: string;
  month: number;
  isLibrary?: boolean;
  user: UserProfile | null;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, level, month, isLibrary, user }) => {
  const adminWhatsApp = WHATSAPP_NUMBER;
  const [step, setStep] = useState(1);
  const [senderNumber, setSenderNumber] = useState('');
  const [marketerCode, setMarketerCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [pendingRequest, setPendingRequest] = useState(false);
  const [checkingPending, setCheckingPending] = useState(true);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSenderNumber('');
      setMarketerCode('');
      setDiscountApplied(false);
      setPendingRequest(false);
      setCheckingPending(true);
      
      const checkPending = async () => {
        if (!user) return;
        try {
          const q = query(
            collection(db, 'subscription_requests'),
            where('userId', '==', user.uid),
            where('level', '==', level),
            where('month', '==', month),
            where('status', '==', 'pending')
          );
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            setPendingRequest(true);
          }
        } catch (error) {
          console.error("Error checking pending requests:", error);
        } finally {
          setCheckingPending(false);
        }
      };
      
      checkPending();
    }
  }, [isOpen, user, level, month]);

  const handleCopy = () => {
    navigator.clipboard.writeText(adminWhatsApp);
    setCopied(true);
    toast.success("تم نسخ الرقم بنجاح");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleValidateCoupon = async () => {
    if (!marketerCode.trim()) {
      setStep(2); // Proceed without discount
      return;
    }

    setIsValidating(true);
    try {
      // Check marketers first
      const qMarketer = query(collection(db, 'marketers'), where('code', '==', marketerCode.trim()));
      const snapshotMarketer = await getDocs(qMarketer);
      
      if (!snapshotMarketer.empty) {
        setDiscountApplied(true);
        toast.success("تم تطبيق كود الخصم بنجاح!");
        setStep(2);
        return;
      }

      // Check users (referral codes)
      const qUser = query(collection(db, 'users'), where('referralCode', '==', marketerCode.trim()));
      const snapshotUser = await getDocs(qUser);

      if (!snapshotUser.empty) {
        const referredUser = snapshotUser.docs[0].data() as UserProfile;
        if (referredUser.uid === user?.uid) {
           toast.error("لا يمكنك استخدام كود الدعوة الخاص بك");
           setIsValidating(false);
           return;
        }
        setDiscountApplied(true);
        toast.success("تم تطبيق كود الخصم بنجاح!");
        setStep(2);
        return;
      }

      toast.error("كود الخصم غير صحيح أو غير موجود");
    } catch (error) {
      console.error("Error validating coupon:", error);
      toast.error("حدث خطأ أثناء التحقق من الكود");
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("يرجى تسجيل الدخول أولاً");
      return;
    }
    if (!senderNumber) {
      toast.error("يرجى إدخال رقم الهاتف الذي قمت بالتحويل منه");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'subscription_requests'), {
        userId: user.uid,
        userName: user.displayName,
        userEmail: user.email,
        userWhatsapp: user.whatsapp || '',
        level,
        month,
        language: user.language || 'german',
        senderNumber,
        marketerCode: marketerCode.trim(),
        status: 'pending',
        createdAt: Timestamp.now()
      });

      setPendingRequest(true);
      toast.success("تم إرسال طلب الاشتراك بنجاح. سيتم التفعيل بعد المراجعة.");
    } catch (error) {
      console.error("Error submitting subscription request:", error);
      toast.error("حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const finalPrice = discountApplied ? DISCOUNTED_PRICE : BASE_PRICE;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" dir="rtl" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <NeumorphicCard className="p-4 sm:p-8 relative overflow-hidden max-h-[90vh] overflow-y-auto">
              <button 
                type="button"
                onClick={onClose} 
                className="absolute top-2 left-2 p-2 bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 rounded-full transition-colors z-50"
              >
                <X className="w-5 h-5" />
              </button>

              {checkingPending ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                  <p className="text-gray-500 font-bold">جاري التحقق من حالة الاشتراك...</p>
                </div>
              ) : pendingRequest ? (
                <div className="flex flex-col items-center text-center py-8 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 shadow-inner mb-2">
                    <Clock className="w-10 h-10" />
                  </div>
                  <h2 className="text-xl font-black text-gray-800">طلبك قيد المراجعة</h2>
                  <p className="text-gray-600 font-bold leading-relaxed text-sm">
                    لقد قمت بإرسال طلب تفعيل لهذا المستوى مسبقاً.
                    <br />
                    يرجى الانتظار حتى يقوم فريقنا بمراجعة التحويل وتفعيل اشتراكك.
                  </p>
                  <button 
                    onClick={onClose}
                    className="mt-4 px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    حسناً، فهمت
                  </button>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex flex-col items-center text-center mb-6 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500 mb-2 shadow-inner">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-black text-gray-800 mb-1">تفعيل الاشتراك</h2>
                    <p className="text-gray-600 font-bold text-xs">
                      {isLibrary 
                        ? "صفحة المكتبة مدفوعة وتتطلب اشتراكاً فعالاً" 
                        : `هذا المحتوى يتطلب اشتراكاً في المستوى ${level} لشهر ${month}`}
                    </p>
                    
                    {/* Progress Steps */}
                    <div className="flex items-center justify-center gap-1 mt-4 w-full max-w-xs">
                      <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
                      <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
                      <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
                    </div>
                  </div>

                  {/* Step 1: Coupon & Price */}
                  {step === 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 text-right">
                      <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
                        <p className="text-emerald-800 font-bold mb-1 text-sm">قيمة الاشتراك الأساسية</p>
                        <div className="text-2xl font-black text-emerald-600">{BASE_PRICE} <span className="text-sm">جنيه</span></div>
                      </div>

                      <div>
                        <label className="block text-gray-700 font-bold mb-1 text-xs pr-1">كود الخصم أو الدعوة (إن وجد):</label>
                        <div className="relative">
                          <Tag className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input 
                            type="text" 
                            value={marketerCode}
                            onChange={(e) => setMarketerCode(e.target.value)}
                            placeholder="أدخل الكود للحصول على الخصم"
                            className="w-full h-12 pr-10 pl-3 bg-gray-50 rounded-lg border-2 border-transparent focus:border-emerald-500 outline-none transition-all font-bold text-sm"
                          />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 pr-1">إذا كان لديك كود خصم، أدخله هنا لتحصل على الاشتراك بسعر {DISCOUNTED_PRICE} جنيه فقط!</p>
                      </div>

                      <button 
                        onClick={handleValidateCoupon}
                        disabled={isValidating}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
                      >
                        {isValidating ? <Loader2 className="w-5 h-5 animate-spin" /> : (marketerCode.trim() ? "تطبيق الكود والمتابعة" : "المتابعة بدون كود")}
                        {!isValidating && <ChevronLeft className="w-4 h-4" />}
                      </button>
                    </motion.div>
                  )}

                  {/* Step 2: Transfer Instructions */}
                  {step === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 text-right">
                      <div className="bg-slate-800 p-4 rounded-xl shadow-lg space-y-3 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-full"></div>
                        
                        <div className="text-center mb-4">
                          <p className="text-slate-300 font-bold text-xs mb-1">المبلغ المطلوب تحويله الآن:</p>
                          <div className="text-3xl font-black text-white">{finalPrice} <span className="text-sm text-slate-400">جنيه</span></div>
                          {discountApplied && (
                            <div className="inline-block mt-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30">
                              تم تطبيق الخصم بنجاح 🎉
                            </div>
                          )}
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                          <p className="text-slate-700 font-bold text-[10px] mb-2 text-center">قم بتحويل المبلغ عبر فودافون كاش إلى الرقم التالي:</p>
                          <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-slate-200 shadow-inner">
                            <button 
                              type="button"
                              onClick={handleCopy}
                              className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1 shadow-md"
                            >
                              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              <span className="text-[10px] font-bold">{copied ? 'تم النسخ' : 'نسخ'}</span>
                            </button>
                            <p className="text-emerald-400 font-black text-xl tracking-widest" dir="ltr">{adminWhatsApp}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => setStep(1)}
                          className="px-3 py-3 rounded-lg bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-colors"
                        >
                          رجوع
                        </button>
                        <button 
                          onClick={() => setStep(3)}
                          className="flex-1 flex items-center justify-center gap-1 py-3 rounded-lg bg-emerald-600 text-white font-bold text-sm shadow-lg hover:bg-emerald-700 transition-all"
                        >
                          تم التحويل، الخطوة التالية
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Confirm Transfer */}
                  {step === 3 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 text-right">
                      <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex gap-2 items-start">
                        <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-blue-800 text-[11px] font-bold leading-relaxed">
                          الخطوة الأخيرة: لتأكيد اشتراكك، يرجى إدخال رقم الموبايل الذي قمت بإرسال مبلغ {finalPrice} جنيه منه.
                        </p>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label className="block text-gray-700 font-bold mb-1 text-xs pr-1">رقم الهاتف المحول منه:</label>
                          <div className="relative">
                            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input 
                              type="tel" 
                              value={senderNumber}
                              onChange={(e) => setSenderNumber(e.target.value)}
                              placeholder="مثال: 01000000000"
                              className="w-full h-12 pr-10 pl-3 bg-gray-50 rounded-lg border-2 border-transparent focus:border-emerald-500 outline-none transition-all font-bold text-sm"
                              required
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={() => setStep(2)}
                            className="px-3 py-3 rounded-lg bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-colors"
                          >
                            رجوع
                          </button>
                          <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 flex items-center justify-center gap-1 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                جاري الإرسال...
                              </>
                            ) : (
                              "إرسال طلب التفعيل"
                            )}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  <div className="text-center mt-4">
                    <a 
                      href={`https://wa.me/2${adminWhatsApp}?text=أواجه مشكلة في تفعيل الاشتراك`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 font-bold text-[10px] hover:underline"
                    >
                      تواجه مشكلة؟ تواصل مع الدعم عبر الواتساب
                    </a>
                  </div>
                </>
              )}
            </NeumorphicCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

