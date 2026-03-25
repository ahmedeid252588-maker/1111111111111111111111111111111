import React from 'react';
import { NeumorphicCard } from '../../components/Neumorphic';

const SubscriptionPage: React.FC = () => {
  const adminWhatsApp = "+201000000000"; // Replace with actual admin number
  const adminName = "مدير المنصة";

  return (
    <div className="p-8" dir="rtl">
      <NeumorphicCard className="p-10 max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-black text-[#4a4a4a] mb-6">طريقة الاشتراك</h1>
        <p className="text-lg text-gray-600 mb-8">
          لتفعيل اشتراكك، يرجى اتباع الخطوات التالية:
        </p>
        <div className="space-y-6 text-right">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">1</div>
            <p className="text-gray-700">قم بتحويل قيمة الاشتراك إلى رقم المحفظة أو الحساب البنكي الخاص بالمدير.</p>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">2</div>
            <p className="text-gray-700">قم بتصوير شاشة التحويل (سكرين شوت).</p>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">3</div>
            <p className="text-gray-700">تواصل مع {adminName} عبر الواتساب على الرقم: 
              <a href={`https://wa.me/${(adminWhatsApp || '').replace('+', '')}`} className="text-emerald-600 font-bold mr-2">
                {adminWhatsApp}
              </a>
            </p>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">4</div>
            <p className="text-gray-700">أرسل صورة التحويل واسم حسابك ليقوم المدير بتفعيل الاشتراك فوراً.</p>
          </div>
        </div>
      </NeumorphicCard>
    </div>
  );
};

export default SubscriptionPage;
