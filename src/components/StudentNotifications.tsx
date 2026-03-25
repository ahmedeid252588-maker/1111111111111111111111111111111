import React, { useState, useEffect } from 'react';
import { Bell, Clock } from 'lucide-react';
import { db, handleFirestoreError, OperationType, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { NeumorphicCard } from './Neumorphic';

interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: any;
  type: string;
  readBy?: string[];
}

interface StudentNotificationsProps {
  language: 'german' | 'english';
}

const StudentNotifications: React.FC<StudentNotificationsProps> = ({ language }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const collectionName = `notifications_${language}`;
    const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(notifs);
      setLoading(false);

      // Mark unread notifications as read
      const currentUser = auth.currentUser;
      if (currentUser) {
        notifs.forEach(notif => {
          if (!notif.readBy?.includes(currentUser.uid)) {
            updateDoc(doc(db, collectionName, notif.id), {
              readBy: arrayUnion(currentUser.uid)
            }).catch(error => {
              handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${notif.id}`);
              console.error("Error marking notification as read:", error);
            });
          }
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, collectionName);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6" dir="rtl">
      {loading ? (
        <p className="text-center text-slate-500 font-bold">جاري التحميل...</p>
      ) : notifications.length === 0 ? (
        <p className="text-center text-slate-500 font-bold">لا توجد تنبيهات جديدة</p>
      ) : (
        <div className="space-y-4">
          {notifications.map(notif => (
            <NeumorphicCard key={notif.id} className="p-4 sm:p-6 flex items-start gap-3 sm:gap-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${
                notif.type === 'info' ? 'bg-blue-50 text-blue-500' :
                notif.type === 'success' ? 'bg-emerald-50 text-emerald-500' :
                notif.type === 'warning' ? 'bg-amber-50 text-amber-500' : 'bg-red-50 text-red-500'
              }`}>
                <Bell size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-[#4a4a4a] text-base sm:text-lg mb-1">{notif.title}</h4>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">{notif.message}</p>
                <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400 text-[10px] sm:text-xs mt-2 sm:mt-3 font-bold">
                  <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
                  <span>{notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleString('ar-EG') : 'غير متوفر'}</span>
                </div>
              </div>
            </NeumorphicCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentNotifications;
