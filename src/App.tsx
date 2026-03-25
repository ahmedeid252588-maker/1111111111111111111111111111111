/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Component, ReactNode, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  ChevronLeft,
  Heart,
  Phone,
  Calendar,
  Layers,
  Home,
  LayoutDashboard,
  BookOpen,
  UserCircle,
  Trophy,
  Flame,
  GraduationCap,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Play,
  FileText,
  CircleCheck,
  Target,
  Brain,
  Mic2,
  TrendingUp,
  Sparkles,
  Star,
  CircleAlert,
  Folder,
  Bell,
  Languages,
  BrainCircuit,
  MessageCircle,
  Timer,
  Settings as SettingsIcon,
  CreditCard,
  Copy,
  Users
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { 
  auth, 
  db, 
  signInWithEmail,
  signUpWithEmail,
  logOut, 
  resetPassword,
  handleFirestoreError,
  OperationType
} from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot, updateDoc, increment, query, collection, orderBy, limit, getDocFromServer, setDoc, Timestamp, where } from 'firebase/firestore';
import { UserProfile, Screen, Achievement } from './types';
import { ACHIEVEMENTS, LEVELS, WHATSAPP_NUMBER, LANGUAGES, BASE_PRICE, DISCOUNTED_PRICE } from './constants';
import { 
  NeumorphicCard, 
  NeumorphicButton, 
  NeumorphicInput, 
  NeumorphicSelect 
} from './components/Neumorphic';
import AdminApp from './admin/AdminApp';
import StudentNotifications from './components/StudentNotifications';
import { StudentQuizzes } from './components/StudentQuizzes';
import { StudentVocabulary } from './components/StudentVocabulary';
import StudentFlashcards from './components/StudentFlashcards';
import StudentExercises from './components/StudentExercises';
import { MediaViewer } from './components/MediaViewer';
import { Settings as SettingsComponent } from './components/Settings';
import { SubscriptionModal } from './components/SubscriptionModal';
import { ErrorBoundary } from './components/ErrorBoundary';

const BackButton = ({ onClick }: { onClick: () => void }) => (
  <div className="absolute top-8 left-8 z-50">
    <button 
      onClick={onClick}
      className="w-12 h-12 flex items-center justify-center bg-[#f5f5f5] rounded-full shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] text-slate-600 active:scale-90 transition-transform hover:text-[#4d9685]"
    >
      <ChevronLeft size={24} />
    </button>
  </div>
);

const FolderCard = ({ children, onClick, className = '', isLocked = false, color = 'emerald' }: { children: React.ReactNode, onClick?: () => void, className?: string, isLocked?: boolean, color?: 'emerald' | 'blue' | 'indigo' | 'purple' | 'orange' | 'red' }) => {
  const colorClasses = {
    emerald: { tab: 'bg-emerald-500', bg: 'bg-emerald-50/80', border: 'border-emerald-100' },
    blue: { tab: 'bg-blue-500', bg: 'bg-blue-50/80', border: 'border-blue-100' },
    indigo: { tab: 'bg-indigo-500', bg: 'bg-indigo-50/80', border: 'border-indigo-100' },
    purple: { tab: 'bg-purple-500', bg: 'bg-purple-50/80', border: 'border-purple-100' },
    orange: { tab: 'bg-orange-500', bg: 'bg-orange-50/80', border: 'border-orange-100' },
    red: { tab: 'bg-red-500', bg: 'bg-red-50/80', border: 'border-red-100' }
  };

  const colors = colorClasses[color] || colorClasses.emerald;

  return (
    <motion.div 
      whileHover={!isLocked && onClick ? { y: -8, scale: 1.02 } : {}}
      whileTap={!isLocked && onClick ? { scale: 0.98 } : {}}
      className={`relative group ${className} ${isLocked ? 'opacity-75 grayscale-[0.5] cursor-not-allowed' : 'cursor-pointer'}`} 
      onClick={!isLocked ? onClick : undefined}
    >
      {/* Folder Tab */}
      <div className={`absolute -top-4 right-6 w-24 h-10 rounded-t-xl transform -skew-x-12 transition-all z-0 ${isLocked ? 'bg-slate-300' : `${colors.tab} shadow-sm group-hover:-translate-y-1`}`} />
      
      <div className={`relative z-10 overflow-hidden rounded-[32px] p-2 border-2 ${isLocked ? 'border-slate-200 bg-slate-50' : `${colors.border} ${colors.bg}`} shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]`}>
        {/* Decorative background pattern */}
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
          <div className="absolute top-4 right-4"><Folder size={120} /></div>
        </div>

        {isLocked && (
          <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] z-20 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/80 shadow-lg flex items-center justify-center text-slate-400">
              <Lock size={24} />
            </div>
          </div>
        )}
        <div className="relative z-10">
          {children}
        </div>
        
        {/* Bottom indicator */}
        {!isLocked && <div className={`absolute bottom-0 left-0 right-0 h-1.5 ${colors.tab} opacity-20`} />}
      </div>
    </motion.div>
  );
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [isMobile, setIsMobile] = useState(false);
  const [contentType, setContentType] = useState<'video' | 'file' | 'text' | 'task'>('video');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Dynamic Content State
  const [libraryItems, setLibraryItems] = useState<any[]>([]);
  const [libraryCategories, setLibraryCategories] = useState<any[]>([]);
  const [librarySubcategories, setLibrarySubcategories] = useState<any[]>([]);
  const [selectedLibraryCategory, setSelectedLibraryCategory] = useState<any>(null);
  const [selectedLibrarySubcategory, setSelectedLibrarySubcategory] = useState<any>(null);
  const [selectedLibraryLevel, setSelectedLibraryLevel] = useState<string>('A1');
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [currentLessons, setCurrentLessons] = useState<any[]>([]);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [showExercises, setShowExercises] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [subscriptionModal, setSubscriptionModal] = useState<{isOpen: boolean, level: string, month: number, isLibrary?: boolean}>({ isOpen: false, level: 'A1', month: 1 });

  // Functional Stats State
  const [userStats, setUserStats] = useState({
    points: 0,
    streak: 0,
    progress: 0,
    level: 'A1',
    dailyMissionCompleted: false,
    currentMonth: 1,
    currentWeek: 1,
    currentDay: 1,
    completedQuizzes: [] as string[]
  });
  const [systemSettings, setSystemSettings] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'system', 'settings');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSystemSettings(docSnap.data());
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'system/settings');
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, [user]);

  // Use a ref to store the profile listener unsubscribe function
  const unsubProfileRef = React.useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clean up previous profile listener if any
      if (unsubProfileRef.current) {
        unsubProfileRef.current();
        unsubProfileRef.current = null;
      }

      if (firebaseUser) {
        // Optimistic user state to avoid waiting for Firestore
        const isAdmin = firebaseUser.uid === 'uH6571aYLJNzMpvX3YER3jHXlpf2' || firebaseUser.uid === 'bSyY7AaRKbcEkyoLbiwVGmnEJ4C2' || firebaseUser.email === 'ahmedeid252588@gmail.com' || firebaseUser.email === 'almansa2026@gmail.com';
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'مستخدم',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || '',
          role: isAdmin ? 'admin' : 'student',
          level: 'A1',
          points: 0,
          streak: 0,
          progress: 0,
          lastActive: Timestamp.now(),
          joinedAt: Timestamp.now(),
          dailyMissionCompleted: false
        });
        setLoading(false);

        // Subscribe to user profile in Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        unsubProfileRef.current = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            
            const isAdmin = firebaseUser.uid === 'uH6571aYLJNzMpvX3YER3jHXlpf2' || firebaseUser.uid === 'bSyY7AaRKbcEkyoLbiwVGmnEJ4C2' || firebaseUser.email === 'ahmedeid252588@gmail.com' || firebaseUser.email === 'almansa2026@gmail.com';
            if (isAdmin && data.role !== 'admin') {
              updateDoc(userRef, { role: 'admin' }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`));
              data.role = 'admin';
            }

            // Generate referral code if it doesn't exist
            const updates: any = {};
            if (!data.referralCode) {
              const code = `REF-${firebaseUser.uid.substring(0, 6).toUpperCase()}`;
              updates.referralCode = code;
              data.referralCode = code;
            }
            if (data.referralsCount === undefined) {
              updates.referralsCount = 0;
              data.referralsCount = 0;
            }
            if (data.usedReferralsCount === undefined) {
              updates.usedReferralsCount = 0;
              data.usedReferralsCount = 0;
            }

            if (Object.keys(updates).length > 0) {
              updateDoc(userRef, updates).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`));
            }

            setUser(data);
            
            // Handle Daily Mission Reset and Streak
            const lastActive = data.lastActive?.toDate() || new Date(0);
            const today = new Date();
            const isSameDay = lastActive.getDate() === today.getDate() &&
                             lastActive.getMonth() === today.getMonth() &&
                             lastActive.getFullYear() === today.getFullYear();
            
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const isYesterday = lastActive.getDate() === yesterday.getDate() &&
                               lastActive.getMonth() === yesterday.getMonth() &&
                               lastActive.getFullYear() === yesterday.getFullYear();

            if (!isSameDay) {
              const updates: any = {
                lastActive: Timestamp.now(),
                dailyMissionCompleted: false
              };
              
              if (isYesterday) {
                updates.streak = increment(1);
              } else if (lastActive.getTime() > 0) {
                // Streak broken if not active yesterday (and not first time)
                updates.streak = 1;
              } else {
                updates.streak = 1;
              }
              
              updateDoc(userRef, updates).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`));
            }

            setUserStats({
              points: data.points,
              streak: data.streak,
              progress: data.progress,
              level: data.level,
              dailyMissionCompleted: data.dailyMissionCompleted,
              currentMonth: data.currentMonth || 1,
              currentWeek: data.currentWeek || 1,
              currentDay: data.currentDay || 1,
              completedQuizzes: data.completedQuizzes || []
            });
          } else {
            // If user document doesn't exist, create it
            const isAdmin = firebaseUser.uid === 'uH6571aYLJNzMpvX3YER3jHXlpf2' || firebaseUser.uid === 'bSyY7AaRKbcEkyoLbiwVGmnEJ4C2' || firebaseUser.email === 'ahmedeid252588@gmail.com' || firebaseUser.email === 'almansa2026@gmail.com';
            
            const newUser: UserProfile = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'مستخدم جديد',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || '',
              role: isAdmin ? 'admin' : 'student',
              level: 'A1',
              points: 0,
              streak: 0,
              progress: 0,
              lastActive: Timestamp.now(),
              joinedAt: Timestamp.now(),
              dailyMissionCompleted: false,
              completedQuizzes: [],
              language: selectedLanguage || 'german',
              subscriptions: {
                german: {},
                english: {}
              }
            };
            
            setUser(newUser); // Optimistic update
            
            setDoc(userRef, newUser).catch(error => {
              handleFirestoreError(error, OperationType.CREATE, `users/${firebaseUser.uid}`);
            });
          }
          setLoading(false);
        }, (error) => {
          setLoading(false);
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        });
      } else {
        setUser(null);
        setLoading(false);
        if (screen === 'welcome' || screen === 'splash') {
          setScreen('splash');
          const timer = setTimeout(() => {
            setScreen('welcome');
          }, 2000);
          return () => clearTimeout(timer);
        }
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfileRef.current) {
        unsubProfileRef.current();
      }
    };
  }, []);

  // Handle screen transitions after login/signup
  useEffect(() => {
    if (user && (screen === 'welcome' || screen === 'splash' || screen === 'login' || screen === 'signup')) {
      if (user.role === 'admin') {
        setScreen('admin-dashboard');
      } else {
        setScreen('home');
      }
    }
  }, [user, screen]);

  // Fetch Library Data
  useEffect(() => {
    if (!user) return;
    
    const level = selectedLibraryLevel || user.level || 'A1';
    const lang = user.language || 'german';
    
    const unsubItems = onSnapshot(query(collection(db, `library_${lang}`), orderBy('name')), (snapshot) => {
      setLibraryItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((doc: any) => (doc.level || 'A1') === level));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `library_${lang}`);
    });

    const unsubCategories = onSnapshot(query(collection(db, `library_categories_${lang}`), orderBy('name')), (snapshot) => {
      setLibraryCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((doc: any) => (doc.level || 'A1') === level));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `library_categories_${lang}`);
    });

    const unsubSubcategories = onSnapshot(query(collection(db, `library_subcategories_${lang}`), orderBy('name')), (snapshot) => {
      setLibrarySubcategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((doc: any) => (doc.level || 'A1') === level));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `library_subcategories_${lang}`);
    });

    return () => {
      unsubItems();
      unsubCategories();
      unsubSubcategories();
    };
  }, [user, selectedLibraryLevel]);

  const [lessonsStructure, setLessonsStructure] = useState<any>({ months: new Set(), weeks: {}, days: {} });
  const [flashcardsStructure, setFlashcardsStructure] = useState<any>({ months: new Set(), weeks: {}, days: {} });
  const [exercisesStructure, setExercisesStructure] = useState<any>({ months: new Set(), weeks: {}, days: {} });
  const [quizzesStructure, setQuizzesStructure] = useState<any>({ months: new Set(), weeks: {}, days: {} });
  const [vocabularyStructure, setVocabularyStructure] = useState<any>({ months: new Set(), weeks: {}, days: {} });

  const [lessonsLevels, setLessonsLevels] = useState<Set<string>>(new Set());
  const [flashcardsLevels, setFlashcardsLevels] = useState<Set<string>>(new Set());
  const [exercisesLevels, setExercisesLevels] = useState<Set<string>>(new Set());
  const [quizzesLevels, setQuizzesLevels] = useState<Set<string>>(new Set());
  const [vocabularyLevels, setVocabularyLevels] = useState<Set<string>>(new Set());

  const availableLevels = useMemo(() => {
    const levels = new Set<string>([...lessonsLevels, ...flashcardsLevels, ...exercisesLevels, ...quizzesLevels, ...vocabularyLevels]);
    return Array.from(levels);
  }, [lessonsLevels, flashcardsLevels, exercisesLevels, quizzesLevels, vocabularyLevels]);

  const availableStructure = useMemo(() => {
    const months = new Set<number>([
      ...lessonsStructure.months, 
      ...flashcardsStructure.months, 
      ...exercisesStructure.months,
      ...quizzesStructure.months,
      ...vocabularyStructure.months
    ]);
    const weeks: {[key: number]: Set<number>} = {};
    const days: {[key: string]: Set<number>} = {};

    [lessonsStructure, flashcardsStructure, exercisesStructure, quizzesStructure, vocabularyStructure].forEach(s => {
      Object.entries(s.weeks).forEach(([m, wSet]: [string, any]) => {
        const month = Number(m);
        if (!weeks[month]) weeks[month] = new Set();
        wSet.forEach((w: number) => weeks[month].add(w));
      });
      Object.entries(s.days).forEach(([key, dSet]: [string, any]) => {
        if (!days[key]) days[key] = new Set();
        dSet.forEach((d: number) => days[key].add(d));
      });
    });

    return {
      months: Array.from(months).sort((a, b) => a - b),
      weeks: Object.fromEntries(
        Object.entries(weeks).map(([m, wSet]) => [m, Array.from(wSet).sort((a, b) => a - b)])
      ),
      days: Object.fromEntries(
        Object.entries(days).map(([key, dSet]) => [key, Array.from(dSet).sort((a, b) => a - b)])
      )
    };
  }, [lessonsStructure, flashcardsStructure, exercisesStructure, quizzesStructure, vocabularyStructure]);

  const initialNotificationsLoaded = React.useRef(false);

  // Fetch Available Structure
  useEffect(() => {
    if (!user) return;

    const lang = user.language || 'german';
    const unsubNotifications = onSnapshot(
      query(collection(db, `notifications_${lang}`), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        const unreadCount = notifications.filter((n: any) => !n.readBy?.includes(user.uid)).length;
        setUnreadNotificationsCount(unreadCount);

        if (initialNotificationsLoaded.current) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const notif = change.doc.data();
              if (!notif.readBy?.includes(user.uid)) {
                toast.success(`تنبيه جديد: ${notif.title}`, {
                  icon: '🔔',
                  duration: 5000,
                });
              }
            }
          });
        }
        initialNotificationsLoaded.current = true;
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `notifications_${lang}`);
      }
    );

    const collectionsList = [
      { name: 'lessons', setter: setLessonsStructure, levelSetter: setLessonsLevels },
      { name: 'flashcards', setter: setFlashcardsStructure, levelSetter: setFlashcardsLevels },
      { name: 'exercises', setter: setExercisesStructure, levelSetter: setExercisesLevels },
      { name: 'quizzes', setter: setQuizzesStructure, levelSetter: setQuizzesLevels },
      { name: 'vocabulary', setter: setVocabularyStructure, levelSetter: setVocabularyLevels }
    ];

    const unsubscribes = collectionsList.map(({ name, setter, levelSetter }) => {
      const collectionName = `${name}_${lang}`;
      const q = query(collection(db, collectionName));
      return onSnapshot(q, (snapshot) => {
        const structure = { months: new Set(), weeks: {}, days: {} };
        const levels = new Set<string>();
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const m = Number(data.month);
          const w = Number(data.week);
          const d = Number(data.day);
          const l = data.level || 'A1';
          
          levels.add(l);

          if (l === (user.level || 'A1')) {
            if (m && w && d) {
              structure.months.add(m);
              if (!structure.weeks[m]) structure.weeks[m] = new Set();
              structure.weeks[m].add(w);
              const dayKey = `${m}-${w}`;
              if (!structure.days[dayKey]) structure.days[dayKey] = new Set();
              structure.days[dayKey].add(d);
            }
          }
        });
        setter(structure);
        levelSetter(levels);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, collectionName);
      });
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
      unsubNotifications();
    };
  }, [user, user?.level]);

  // Fetch Lessons when month/week/day changes
  useEffect(() => {
    if (!user) return;
    if (selectedMonth && selectedWeek && selectedDay) {
      const level = user.level || 'A1';
      const lang = user.language || 'german';
      const lessonsRef = collection(db, `lessons_${lang}`);
      const q = query(
        lessonsRef, 
        where('month', '==', selectedMonth)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const lessonsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).filter((doc: any) => doc.week === selectedWeek && doc.day === selectedDay && (doc.level || 'A1') === level);
        // Sort client-side to avoid composite index requirement
        lessonsData.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        setCurrentLessons(lessonsData);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `lessons_${lang}`);
      });
      return () => unsubscribe();
    }
  }, [selectedMonth, selectedWeek, selectedDay, user, user?.level]);

  const [email, setEmail] = useState('');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [selectedLanguage, setSelectedLanguage] = useState<'german' | 'english'>('german');

  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }
    setIsAuthLoading(true);
    try {
      const user = await signInWithEmail(email, password);
      toast.success("تم تسجيل الدخول بنجاح");
    } catch (error: any) {
      console.error("Login failed", error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        toast.error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      } else {
        toast.error("فشل تسجيل الدخول: حدث خطأ غير متوقع");
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!displayName || !email || !password || !confirmPassword || !whatsapp || !age) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }
    if (password.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    setIsAuthLoading(true);
    try {
      await signUpWithEmail(email, password, displayName, whatsapp, age, gender, selectedLanguage);
      toast.success("تم إنشاء الحساب بنجاح");
      setScreen('home');
    } catch (error: any) {
      console.error("Signup failed", error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error("البريد الإلكتروني مستخدم بالفعل");
      } else if (error.code === 'auth/invalid-email') {
        toast.error("البريد الإلكتروني غير صالح");
      } else if (error.message) {
        toast.error(`فشل إنشاء الحساب: ${error.message}`);
      } else {
        toast.error("فشل إنشاء الحساب: حدث خطأ غير متوقع");
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      setScreen('login');
      toast.success("تم تسجيل الخروج بنجاح");
    } catch (error) {
      console.error("Logout failed", error);
      toast.error("فشل تسجيل الخروج");
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      toast.error("يرجى إدخال البريد الإلكتروني");
      return;
    }
    setIsAuthLoading(true);
    try {
      await resetPassword(forgotPasswordEmail);
      toast.success("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني");
      setScreen('login');
    } catch (error: any) {
      console.error("Password reset failed", error);
      toast.error("فشل إرسال رابط إعادة تعيين كلمة المرور");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleAddPoints = async (amount: number) => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      try {
        await updateDoc(userRef, {
          points: increment(amount)
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  const completeDailyMission = async () => {
    if (user && !userStats.dailyMissionCompleted) {
      const userRef = doc(db, 'users', user.uid);
      try {
        await updateDoc(userRef, {
          points: increment(50),
          dailyMissionCompleted: true
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  const updateProgress = async (month: number, week: number, day: number) => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      try {
        await updateDoc(userRef, {
          currentMonth: month,
          currentWeek: week,
          currentDay: day
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  const handleQuizCompletion = async (score: number, total: number) => {
    if (!user) return;
    
    const quizId = `${selectedMonth}-${selectedWeek}-${selectedDay}`;
    const completedQuizzes = userStats.completedQuizzes || [];
    let pointsEarned = 0;

    try {
      if (!completedQuizzes.includes(quizId)) {
        // Award points based on score (10 points per correct answer)
        pointsEarned = score * 10;
        await handleAddPoints(pointsEarned);
        
        // Add quiz to completed list
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          completedQuizzes: [...completedQuizzes, quizId]
        });
      }
      
      // Check if daily mission should be completed
      if (!userStats.dailyMissionCompleted && score > 0) {
        await completeDailyMission();
      }

      // Logic to unlock the next day
      const currentDays = availableStructure.days[`${selectedMonth}-${selectedWeek}`] || [];
      const currentDayIndex = currentDays.indexOf(selectedDay);
      
      let nextMonth = selectedMonth;
      let nextWeek = selectedWeek;
      let nextDay = selectedDay;

      if (currentDayIndex < currentDays.length - 1) {
        nextDay = currentDays[currentDayIndex + 1];
      } else {
        const currentWeeks = availableStructure.weeks[selectedMonth] || [];
        const currentWeekIndex = currentWeeks.indexOf(selectedWeek);
        
        if (currentWeekIndex < currentWeeks.length - 1) {
          nextWeek = currentWeeks[currentWeekIndex + 1];
          const nextWeekDays = availableStructure.days[`${selectedMonth}-${nextWeek}`] || [];
          if (nextWeekDays.length > 0) {
            nextDay = nextWeekDays[0];
          }
        } else {
          const currentMonths = availableStructure.months || [];
          const currentMonthIndex = currentMonths.indexOf(selectedMonth);
          
          if (currentMonthIndex < currentMonths.length - 1) {
            nextMonth = currentMonths[currentMonthIndex + 1];
            const nextMonthWeeks = availableStructure.weeks[nextMonth] || [];
            if (nextMonthWeeks.length > 0) {
              nextWeek = nextMonthWeeks[0];
              const nextWeekDays = availableStructure.days[`${nextMonth}-${nextWeek}`] || [];
              if (nextWeekDays.length > 0) {
                nextDay = nextWeekDays[0];
              }
            }
          }
        }
      }

      // Update progress to the next day
      await updateProgress(nextMonth, nextWeek, nextDay);
      toast.success(`أحسنت! حصلت على ${pointsEarned} نقطة وتم فتح اليوم التالي.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [dynamicAchievements, setDynamicAchievements] = useState<Achievement[]>(ACHIEVEMENTS);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users'), orderBy('points', 'desc'), limit(200));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filteredUsers = allUsers.filter((u: any) => (u.language || 'german') === (user.language || 'german'));
      
      const lbData = filteredUsers.slice(0, 50).map((u: any, index) => ({
        name: u.displayName || 'مستخدم جديد',
        points: u.points || 0,
        rank: index + 1,
        me: u.id === auth.currentUser?.uid
      }));
      setLeaderboard(lbData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    const updatedAchievements = ACHIEVEMENTS.map(ach => {
      let completed = false;
      switch (ach.id) {
        case 1: completed = (userStats.progress > 10); break; // Started journey
        case 2: completed = (userStats.streak >= 3); break; // 3 day streak
        case 3: completed = (userStats.streak >= 30); break; // 30 day streak
        case 4: completed = (userStats.progress > 50); break; // Explored a lot
        case 5: completed = (userStats.points >= 5000); break; // 5000 points
        case 6: completed = (userStats.points >= 1000); break; // Grammar expert (proxy)
        case 7: completed = (userStats.points >= 2000); break; // Speaker (proxy)
        case 8: completed = (userStats.completedQuizzes?.length || 0) >= 10; break; // 10 quizzes
        case 9: completed = (userStats.level === 'B1' || userStats.level === 'B2' || userStats.level === 'C1' || userStats.level === 'C2'); break;
        case 10: completed = (userStats.level === 'C2'); break;
      }
      return { ...ach, completed };
    });
    
    setDynamicAchievements(updatedAchievements);
  }, [user, userStats]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const screenVariants = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 }
  };

  const handleContentAccess = (month: number, week: number, day: number | null, action: () => void) => {
    if (user?.role === 'admin') {
      action();
      return;
    }

    // Check subscription first
    const level = user?.level || 'A1';
    const lang = user?.language || 'german';
    const userSubs = user?.subscriptions?.[lang as 'german' | 'english'] || {};
    const hasSubscription = userSubs[level] && userSubs[level].includes(month);

    if (!hasSubscription) {
      setSubscriptionModal({ isOpen: true, level, month });
      return;
    }

    // Check progression lock
    const userMonth = user?.currentMonth || 1;
    const userWeek = user?.currentWeek || 1;
    const userDay = user?.currentDay || 1;

    if (month > userMonth) {
      toast.error('يجب إنهاء اختبارات الشهر السابق أولاً');
      return;
    }
    if (month === userMonth && week > userWeek) {
      toast.error('يجب إنهاء اختبارات الأسبوع السابق أولاً');
      return;
    }
    if (month === userMonth && week === userWeek && day !== null && day > userDay) {
      toast.error('يجب إنهاء اختبار اليوم السابق أولاً');
      return;
    }

    action();
  };

  const checkContentAccess = (month: number, week: number, day: number, action: () => void) => {
    if (!user) {
      toast.error("يرجى تسجيل الدخول للوصول إلى هذا المحتوى");
      return;
    }

    if (user.role === 'admin') {
      action();
      return;
    }

    const level = user.level || 'A1';
    const lang = user.language || 'german';
    const userSubs = user.subscriptions?.[lang as 'german' | 'english'] || {};
    const hasSubscription = userSubs[level] && userSubs[level].includes(month);

    if (hasSubscription) {
      action();
    } else {
      setSubscriptionModal({ isOpen: true, level, month });
    }
  };

  const checkLibraryAccess = (action: () => void) => {
    if (!user) {
      toast.error("يرجى تسجيل الدخول للوصول إلى المكتبة");
      return;
    }

    if (user.role === 'admin') {
      action();
      return;
    }

    const lang = user.language || 'german';
    const userSubs = user.subscriptions?.[lang as 'german' | 'english'] as Record<string, number[]> || {};
    const hasAnySubscription = Object.values(userSubs).some(months => months.length > 0);

    if (hasAnySubscription) {
      action();
    } else {
      setSubscriptionModal({ isOpen: true, level: user.level || 'A1', month: 1, isLibrary: true });
    }
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    let embedUrl = url;
    if (url.includes('drive.google.com')) {
      embedUrl = url.replace('/view', '/preview').replace('/edit', '/preview');
      if (!embedUrl.includes('rm=minimal')) {
        embedUrl += (embedUrl.includes('?') ? '&' : '?') + 'rm=minimal';
      }
    } else if (url.includes('youtube.com/watch?v=')) {
      try {
        const videoId = new URL(url).searchParams.get('v');
        if (videoId) {
          embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?modestbranding=1&rel=0&showinfo=0&fs=0&iv_load_policy=3&disablekb=1&controls=1`;
        }
      } catch (e) {
        embedUrl = url.replace('watch?v=', 'embed/');
      }
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1].split('?')[0];
      embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?modestbranding=1&rel=0&showinfo=0&fs=0&iv_load_policy=3&disablekb=1&controls=1`;
    }
    return embedUrl;
  };

  const NavItem = ({ id, icon: Icon, label, active }: { id: Screen, icon: any, label: string, active: boolean }) => (
    <button 
      onClick={() => {
        setScreen(id);
      }}
      className="flex flex-col items-center gap-1 transition-all"
    >
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${active ? 'shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff] text-[#4d9685]' : 'text-slate-400'}`}>
        <Icon size={28} />
      </div>
      <span className={`text-sm font-bold ${active ? 'text-[#4d9685]' : 'text-slate-400'}`}>{label}</span>
    </button>
  );

  const BottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 h-24 bg-[#f5f5f5]/80 backdrop-blur-md flex items-center justify-around px-6 border-t border-slate-200 z-50" dir="rtl">
      <NavItem id="home" icon={Home} label="الرئيسية" active={screen === 'home'} />
      <NavItem id="learning" icon={GraduationCap} label="التعلم" active={['learning', 'learning-week', 'learning-day', 'learning-content'].includes(screen)} />
      <NavItem id="library" icon={BookOpen} label="المكتبة" active={['library', 'library-category', 'library-subcategory', 'library-item'].includes(screen)} />
      <NavItem id="profile" icon={UserCircle} label="حسابي" active={screen === 'profile'} />
    </div>
  );


  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#f5f5f5]">
        <div className="w-20 h-20 rounded-full border-4 border-[#4d9685] border-t-transparent animate-spin" />
      </div>
    );
  }

  const isAuthScreen = ['welcome', 'login', 'signup', 'forgot-password', 'splash'].includes(screen) || screen.startsWith('signup-step');
  const isAdminDashboard = screen === 'admin-dashboard';

  return (
    <div id="app-capture-root" className="min-h-screen bg-[#f5f5f5] flex flex-col items-center font-sans select-none overflow-x-hidden relative">
      <Toaster position="top-center" />
      <SubscriptionModal 
        isOpen={subscriptionModal.isOpen} 
        onClose={() => setSubscriptionModal(prev => ({ ...prev, isOpen: false }))} 
        level={subscriptionModal.level} 
        month={subscriptionModal.month} 
        isLibrary={subscriptionModal.isLibrary}
        user={user}
      />
      
      <div className={`w-full ${isAdminDashboard ? 'max-w-full' : (isMobile ? 'max-w-full' : 'max-w-6xl')} relative flex-1 flex flex-col items-center ${!isAuthScreen && !isAdminDashboard ? 'pb-24' : ''}`}>
        
        <AnimatePresence mode="wait">
          {screen === 'splash' && (
            <motion.div 
              key="splash"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#f5f5f5] z-[100] flex items-center justify-center"
            >
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <Heart className="text-[#ff9a9a] fill-[#ff9a9a]" size={100} />
              </motion.div>
            </motion.div>
          )}

          {screen === 'welcome' && (
            <motion.div 
              key="welcome"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="w-full max-w-md flex flex-col items-center text-center my-auto px-4"
            >
              <div className="flex items-center justify-center mb-8 md:mb-10 relative w-full">
                <div className="relative inline-block">
                  <h1 className="text-5xl sm:text-6xl md:text-7xl font-serif tracking-widest text-[#4a4a4a] font-bold z-10 relative">NOOR</h1>
                  <div className="absolute -bottom-6 -right-6 sm:-right-8 md:-bottom-8 md:-right-10 animate-heartbeat z-0">
                    <Heart className="text-[#ff9a9a] fill-[#ff9a9a] w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />
                  </div>
                </div>
              </div>
              
              <h2 className="text-xl md:text-2xl text-slate-500 font-bold mb-3" dir="rtl">إتقان اللغات بسهولة</h2>
              <p className="text-base md:text-lg text-slate-400 mb-10 md:mb-16" dir="rtl">"تعلم لغة جديدة يفتح لك أبواباً لعالم جديد"</p>
              
              <div className="w-full space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <div className="w-full"><NeumorphicButton variant="secondary" onClick={() => setScreen('login')}>تسجيل الدخول</NeumorphicButton></div>
                  <div className="w-full"><NeumorphicButton variant="secondary" onClick={() => setScreen('signup-step-1')}>إنشاء حساب</NeumorphicButton></div>
                </div>
              </div>
            </motion.div>
          )}

          {screen === 'login' && (
            <motion.div 
              key="login"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="w-full max-w-md flex flex-col items-center px-4 my-auto"
            >
              <BackButton onClick={() => setScreen('welcome')} />
              <h2 className="text-4xl md:text-5xl font-bold text-[#4a4a4a] mb-10 md:mb-16 mt-12">أهلاً بعودتك</h2>
              
              <NeumorphicInput icon={Mail} placeholder="البريد الإلكتروني" value={email} onChange={(e: any) => setEmail(e.target.value)} />
              <NeumorphicInput icon={Lock} placeholder="كلمة المرور" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} />
              
              <button 
                onClick={() => setScreen('forgot-password')}
                className="w-full text-right text-slate-400 text-base mb-16 hover:text-slate-600 transition-colors px-2"
                dir="rtl"
              >
                نسيت كلمة المرور؟
              </button>
              
              <div className="w-full px-2">
                <NeumorphicButton onClick={handleLogin} disabled={isAuthLoading}>
                  {isAuthLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                </NeumorphicButton>
              </div>

              <div className="mt-8 w-full px-2">
                <button 
                  onClick={() => window.open(`https://wa.me/2${WHATSAPP_NUMBER}?text=أهلاً، أريد التواصل مع الإدارة بخصوص حسابي`)}
                  className="w-full flex items-center justify-center gap-2 py-4 text-emerald-600 font-bold hover:text-emerald-700 transition-colors"
                >
                  <Phone size={20} />
                  التواصل مع الإدارة عبر واتساب
                </button>
              </div>
            </motion.div>
          )}

          {screen === 'signup-step-1' && (
            <motion.div 
              key="signup-step-1"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="w-full max-w-md flex flex-col items-center px-4 my-auto"
            >
              <BackButton onClick={() => setScreen('welcome')} />
              <div className="w-24 h-24 rounded-full bg-[#f5f5f5] shadow-[8px_8px_16px_#d1d1d1,-8px_-8px_16px_#ffffff] flex items-center justify-center text-[#4d9685] mb-8">
                <Languages size={48} />
              </div>
              <h2 className="text-3xl font-bold text-[#4a4a4a] mb-8">اختر اللغة التي تريد تعلمها</h2>
              <div className="w-full space-y-6">
                {LANGUAGES.map(lang => (
                  <NeumorphicCard 
                    key={lang.id}
                    className={`p-6 cursor-pointer transition-all ${selectedLanguage === lang.id ? 'border-2 border-[#4d9685] bg-emerald-50/50' : ''}`}
                    onClick={() => setSelectedLanguage(lang.id as any)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#f5f5f5] shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] flex items-center justify-center text-2xl">
                          {lang.flag}
                        </div>
                        <span className="text-xl font-bold text-slate-700">{lang.name}</span>
                      </div>
                      {selectedLanguage === lang.id && <CircleCheck className="text-[#4d9685]" />}
                    </div>
                  </NeumorphicCard>
                ))}
              </div>
              <div className="mt-12 w-full">
                <NeumorphicButton onClick={() => setScreen('signup-step-2')}>المتابعة</NeumorphicButton>
              </div>
            </motion.div>
          )}

          {screen === 'signup-step-2' && (
            <motion.div 
              key="signup-step-2"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="w-full max-w-md flex flex-col items-center px-4 my-auto"
            >
              <BackButton onClick={() => setScreen('signup-step-1')} />
              <div className="w-24 h-24 rounded-full bg-[#f5f5f5] shadow-[8px_8px_16px_#d1d1d1,-8px_-8px_16px_#ffffff] flex items-center justify-center text-[#4d9685] mb-8">
                <User size={48} />
              </div>
              <h2 className="text-3xl font-bold text-[#4a4a4a] mb-8">ما هو اسمك؟</h2>
              <NeumorphicInput icon={User} placeholder="الاسم الكامل" value={displayName} onChange={(e: any) => setDisplayName(e.target.value)} />
              <div className="mt-12 w-full">
                <NeumorphicButton onClick={() => {
                  if (!displayName) return toast.error("يرجى إدخال اسمك");
                  setScreen('signup-step-3');
                }}>المتابعة</NeumorphicButton>
              </div>
            </motion.div>
          )}

          {screen === 'signup-step-3' && (
            <motion.div 
              key="signup-step-3"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="w-full max-w-md flex flex-col items-center px-4 my-auto"
            >
              <BackButton onClick={() => setScreen('signup-step-2')} />
              <div className="w-24 h-24 rounded-full bg-[#f5f5f5] shadow-[8px_8px_16px_#d1d1d1,-8px_-8px_16px_#ffffff] flex items-center justify-center text-[#4d9685] mb-8">
                <Phone size={48} />
              </div>
              <h2 className="text-3xl font-bold text-[#4a4a4a] mb-8">رقم الواتساب</h2>
              <NeumorphicInput icon={Phone} placeholder="رقم الواتساب" type="tel" value={whatsapp} onChange={(e: any) => setWhatsapp(e.target.value)} />
              <div className="mt-12 w-full">
                <NeumorphicButton onClick={() => {
                  if (!whatsapp) return toast.error("يرجى إدخال رقم الواتساب");
                  setScreen('signup-step-4');
                }}>المتابعة</NeumorphicButton>
              </div>
            </motion.div>
          )}

          {screen === 'signup-step-4' && (
            <motion.div 
              key="signup-step-4"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="w-full max-w-md flex flex-col items-center px-4 my-auto"
            >
              <BackButton onClick={() => setScreen('signup-step-3')} />
              <div className="w-24 h-24 rounded-full bg-[#f5f5f5] shadow-[8px_8px_16px_#d1d1d1,-8px_-8px_16px_#ffffff] flex items-center justify-center text-[#4d9685] mb-8">
                <Calendar size={48} />
              </div>
              <h2 className="text-3xl font-bold text-[#4a4a4a] mb-8">كم عمرك؟</h2>
              <NeumorphicInput icon={Calendar} placeholder="السن" type="number" value={age} onChange={(e: any) => setAge(e.target.value)} />
              <div className="mt-12 w-full">
                <NeumorphicButton onClick={() => {
                  if (!age) return toast.error("يرجى إدخال السن");
                  setScreen('signup-step-5');
                }}>المتابعة</NeumorphicButton>
              </div>
            </motion.div>
          )}

          {screen === 'signup-step-5' && (
            <motion.div 
              key="signup-step-5"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="w-full max-w-md flex flex-col items-center px-4 my-auto"
            >
              <BackButton onClick={() => setScreen('signup-step-4')} />
              <div className="w-24 h-24 rounded-full bg-[#f5f5f5] shadow-[8px_8px_16px_#d1d1d1,-8px_-8px_16px_#ffffff] flex items-center justify-center text-[#4d9685] mb-8">
                <UserCircle size={48} />
              </div>
              <h2 className="text-3xl font-bold text-[#4a4a4a] mb-8">اختر النوع</h2>
              <div className="w-full space-y-4">
                <NeumorphicCard 
                  className={`p-6 cursor-pointer transition-all ${gender === 'male' ? 'border-2 border-[#4d9685] bg-emerald-50/50' : ''}`}
                  onClick={() => setGender('male')}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-slate-700">ذكر</span>
                    {gender === 'male' && <CircleCheck className="text-[#4d9685]" />}
                  </div>
                </NeumorphicCard>
                <NeumorphicCard 
                  className={`p-6 cursor-pointer transition-all ${gender === 'female' ? 'border-2 border-[#4d9685] bg-emerald-50/50' : ''}`}
                  onClick={() => setGender('female')}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-slate-700">أنثى</span>
                    {gender === 'female' && <CircleCheck className="text-[#4d9685]" />}
                  </div>
                </NeumorphicCard>
              </div>
              <div className="mt-12 w-full">
                <NeumorphicButton onClick={() => {
                  if (!gender) return toast.error("يرجى اختيار النوع");
                  setScreen('signup-step-6');
                }}>المتابعة</NeumorphicButton>
              </div>
            </motion.div>
          )}

          {screen === 'signup-step-6' && (
            <motion.div 
              key="signup-step-6"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="w-full max-w-md flex flex-col items-center px-4 my-auto"
            >
              <BackButton onClick={() => setScreen('signup-step-5')} />
              <div className="w-24 h-24 rounded-full bg-[#f5f5f5] shadow-[8px_8px_16px_#d1d1d1,-8px_-8px_16px_#ffffff] flex items-center justify-center text-[#4d9685] mb-8">
                <Mail size={48} />
              </div>
              <h2 className="text-3xl font-bold text-[#4a4a4a] mb-8">البريد الإلكتروني</h2>
              <NeumorphicInput icon={Mail} placeholder="البريد الإلكتروني" value={email} onChange={(e: any) => setEmail(e.target.value)} />
              <div className="mt-12 w-full">
                <NeumorphicButton onClick={() => {
                  if (!email) return toast.error("يرجى إدخال بريدك الإلكتروني");
                  setScreen('signup-step-7');
                }}>المتابعة</NeumorphicButton>
              </div>
            </motion.div>
          )}

          {screen === 'signup-step-7' && (
            <motion.div 
              key="signup-step-7"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="w-full max-w-md flex flex-col items-center px-4 my-auto"
            >
              <BackButton onClick={() => setScreen('signup-step-6')} />
              <div className="w-24 h-24 rounded-full bg-[#f5f5f5] shadow-[8px_8px_16px_#d1d1d1,-8px_-8px_16px_#ffffff] flex items-center justify-center text-[#4d9685] mb-8">
                <Lock size={48} />
              </div>
              <h2 className="text-3xl font-bold text-[#4a4a4a] mb-8">كلمة المرور</h2>
              <NeumorphicInput icon={Lock} placeholder="كلمة المرور" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} />
              <NeumorphicInput icon={ShieldCheck} placeholder="تأكيد كلمة المرور" type="password" value={confirmPassword} onChange={(e: any) => setConfirmPassword(e.target.value)} />
              <div className="mt-12 w-full">
                <NeumorphicButton onClick={handleSignup} disabled={isAuthLoading}>
                  {isAuthLoading ? 'جاري إنشاء الحساب...' : 'إتمام التسجيل'}
                </NeumorphicButton>
              </div>
            </motion.div>
          )}

          {screen === 'forgot-password' && (
            <motion.div 
              key="forgot-password"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="w-full max-w-md flex flex-col items-center px-4 text-center my-auto"
            >
              <BackButton onClick={() => setScreen('login')} />
              <h2 className="text-5xl font-bold text-[#4a4a4a] mb-6 mt-12">استعادة كلمة المرور</h2>
              <p className="text-slate-400 mb-16 text-lg px-4" dir="rtl">أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.</p>
              
              <NeumorphicInput icon={Mail} placeholder="البريد الإلكتروني" value={forgotPasswordEmail} onChange={(e: any) => setForgotPasswordEmail(e.target.value)} />
              
              <div className="mt-10 w-full px-2">
                <NeumorphicButton onClick={handleForgotPassword} disabled={isAuthLoading}>
                  {isAuthLoading ? 'جاري الإرسال...' : 'إرسال الرابط'}
                </NeumorphicButton>
              </div>
            </motion.div>
          )}

          {screen === 'home' && (
            <motion.div 
              key="home"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-12"
            >
              <div className="flex flex-row justify-between items-center mb-8 sm:mb-12 gap-4">
                <div className="text-right w-full md:w-auto">
                  <p className="text-xs sm:text-sm text-slate-400 font-bold mb-1">مرحباً بعودتك</p>
                  <h2 className="text-2xl sm:text-4xl font-bold text-[#4a4a4a]">{user?.displayName || 'المستخدم'}</h2>
                </div>
                <div className="flex items-center gap-3">
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => {
                        const newLang = user.language === 'german' ? 'english' : 'german';
                        updateDoc(doc(db, 'users', user.uid), { language: newLang }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`));
                      }}
                      className="px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl bg-[#f5f5f5] shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] text-[#4a4a4a] hover:text-[#4d9685] transition-colors font-bold text-xs sm:text-sm flex items-center gap-2"
                    >
                      <Languages size={16} />
                      {user.language === 'german' ? 'الألمانية' : 'الإنجليزية'}
                    </button>
                  )}
                  <button 
                    onClick={() => setScreen('notifications')}
                    className="relative p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[#f5f5f5] shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] text-[#4a4a4a] hover:text-[#4d9685] transition-colors"
                  >
                    <Bell size={20} className="sm:w-6 sm:h-6" />
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute top-2 right-2 sm:top-3 sm:right-3 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full border-2 border-[#f5f5f5]"></span>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                {/* Progress Card */}
                <div className="lg:col-span-12">
                  <NeumorphicCard 
                    className="cursor-pointer hover:scale-[1.01] transition-transform p-6 sm:p-8" 
                    onClick={() => setScreen('learning')}
                  >
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="w-20 h-20 rounded-[32px] bg-emerald-50 shadow-inner flex items-center justify-center text-[#4d9685]">
                        <ChevronRight size={32} className="rotate-180" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-[#4d9685] mb-1">متابعة التعلم</h3>
                        <p className="text-sm text-slate-400 font-bold">{user?.level || 'A1'} - الشهر {userStats.currentMonth} - الأسبوع {userStats.currentWeek} - اليوم {userStats.currentDay}</p>
                      </div>
                    </div>
                  </NeumorphicCard>
                </div>

                {/* New Sections: Vocabulary and Quizzes */}
                {/* Removed Vocabulary and Quizzes sections as requested */}

                {/* Stats */}
                <div className="lg:col-span-4 space-y-6 sm:space-y-8">
                  <NeumorphicCard className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <Flame className="text-orange-500 fill-orange-500 sm:w-6 sm:h-6" size={20} />
                      <h3 className="text-lg sm:text-xl font-bold text-[#4a4a4a]">سلسلة التعلم</h3>
                    </div>
                    <div className="flex justify-between items-end h-20 sm:h-24 gap-1 sm:gap-2">
                      {[
                        { day: 'س', active: true, height: 'h-10 sm:h-12' },
                        { day: 'ح', active: true, height: 'h-12 sm:h-16' },
                        { day: 'ن', active: true, height: 'h-16 sm:h-20' },
                        { day: 'ث', active: true, height: 'h-12 sm:h-14' },
                        { day: 'ر', active: true, height: 'h-14 sm:h-18' },
                        { day: 'خ', active: true, height: 'h-18 sm:h-22' },
                        { day: 'ج', active: false, height: 'h-6 sm:h-8' },
                      ].map((d, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 sm:gap-2 flex-1">
                          <div className={`w-full ${d.height} rounded-t-lg sm:rounded-t-xl transition-all ${d.active ? 'bg-gradient-to-t from-orange-400 to-orange-300 shadow-[2px_2px_4px_#d1d1d1]' : 'bg-slate-200'}`} />
                          <span className={`text-[8px] sm:text-[10px] font-bold ${d.active ? 'text-orange-500' : 'text-slate-400'}`}>{d.day}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-center">
                      <span className="text-xl sm:text-2xl font-black text-orange-500">{userStats.streak}</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-400 mr-1 sm:mr-2">يوم متتالي!</span>
                    </div>
                  </NeumorphicCard>

                  <NeumorphicCard className="mb-4 p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <Heart className="text-[#ff9a9a] fill-[#ff9a9a] sm:w-6 sm:h-6" size={20} />
                      <h3 className="text-lg sm:text-xl font-bold text-[#4a4a4a]">آخر الإنجازات</h3>
                    </div>
                    <div className="flex justify-around items-center">
                      {ACHIEVEMENTS.slice(0, 3).map(ach => (
                        <div key={ach.id} className={`flex flex-col items-center gap-1 sm:gap-2 ${ach.completed ? '' : 'opacity-40 grayscale'}`}>
                          <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                            {ach.icon}
                          </div>
                          <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 text-center">{ach.title}</span>
                        </div>
                      ))}
                    </div>
                  </NeumorphicCard>

                  <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    <NeumorphicCard className="flex flex-col items-center justify-center gap-1 sm:gap-2 text-center p-3 sm:p-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#f5f5f5] shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] flex items-center justify-center text-blue-500">
                        <Layers size={20} className="sm:w-6 sm:h-6" />
                      </div>
                      <span className="text-sm sm:text-lg font-bold text-[#4a4a4a]">{userStats.level} - {userStats.progress}%</span>
                      <span className="text-[10px] sm:text-xs text-slate-400 font-bold">التقدم</span>
                    </NeumorphicCard>
                    <NeumorphicCard className="flex flex-col items-center justify-center gap-1 sm:gap-2 text-center p-3 sm:p-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#f5f5f5] shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] flex items-center justify-center text-green-500">
                        <TrendingUp size={20} className="sm:w-6 sm:h-6" />
                      </div>
                      <span className="text-sm sm:text-lg font-bold text-[#4a4a4a]">ممتاز</span>
                      <span className="text-[10px] sm:text-xs text-slate-400 font-bold">المستوى</span>
                    </NeumorphicCard>
                  </div>
                </div>

                {/* Leaderboard */}
                <div className="lg:col-span-8">
                  <NeumorphicCard className="h-full p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <button 
                        onClick={() => setScreen('leaderboard-full')}
                        className="text-xs font-bold text-[#4d9685] hover:underline"
                      >
                        عرض الكل
                      </button>
                      <div className="flex items-center gap-2">
                        <Trophy className="text-yellow-500 sm:w-6 sm:h-6" size={20} />
                        <h3 className="text-lg sm:text-xl font-bold text-[#4a4a4a]">لوحة الصدارة</h3>
                      </div>
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                      {leaderboard.slice(0, 5).map((user) => (
                        <div key={user.name} className={`flex items-center justify-between p-2 sm:p-3 rounded-xl sm:rounded-2xl ${user.me ? 'bg-slate-200/50 shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff]' : ''}`}>
                          <span className="text-sm sm:text-base text-slate-600 font-bold">{user.points} نقطة</span>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-sm sm:text-base text-slate-700 font-bold">{user.name}</span>
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] sm:text-xs font-bold text-slate-500 shadow-[2px_2px_4px_#d1d1d1,-2px_-2px_4px_#ffffff]">
                              {user.rank}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </NeumorphicCard>
                </div>
              </div>
            </motion.div>
          )}

          {screen === 'profile' && (
            <motion.div 
              key="profile"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-4xl px-4 sm:px-6 py-6 sm:py-12 flex flex-col items-center pb-32"
            >
              <div className="relative mb-4 sm:mb-6">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-[#f5f5f5] shadow-[8px_8px_16px_#d1d1d1,-8px_-8px_16px_#ffffff] flex items-center justify-center text-slate-300">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <UserCircle size={60} className="sm:w-20 sm:h-20" />
                  )}
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-[#4a4a4a] mb-1">{user?.displayName || 'المستخدم'}</h2>
              <div className="flex flex-col items-center gap-1 mb-8 sm:mb-10">
                <p className="text-sm sm:text-base text-slate-400 font-bold">طالب | المستوى {user?.level || 'A1'} | {user?.language === 'german' ? 'الألمانية' : 'الإنجليزية'}</p>
              </div>

              <div className="w-full space-y-4 sm:space-y-6">
                {/* Referral Section */}
                <NeumorphicCard className="p-6">
                  <div className="flex items-center gap-3 mb-4 justify-end">
                    <div className="text-right">
                      <h3 className="text-xl font-black text-gray-800">برنامج الدعوات والمكافآت</h3>
                      <p className="text-sm text-gray-500 font-bold">ادعُ أصدقائك واحصل على اشتراكات مجانية!</p>
                    </div>
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                  
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 mb-6 text-right">
                    <p className="text-emerald-800 font-bold text-sm leading-relaxed">
                      شارك كود الدعوة الخاص بك مع أصدقائك. 
                      <br/>- صديقك سيحصل على <strong>خصم 100 جنيه</strong> عند استخدامه للكود.
                      <br/>- عندما يشترك <strong>4 أصدقاء</strong> باستخدام الكود الخاص بك، ستحصل أنت على <strong>شهر مجاناً!</strong>
                    </p>
                  </div>

                  <div className="mb-6 text-right">
                    <label className="block text-gray-700 font-bold mb-2 text-sm">كود الدعوة الخاص بك:</label>
                    <div className="flex items-center justify-between bg-gray-100 p-3 rounded-xl border border-gray-200">
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(user?.referralCode || '');
                          toast.success('تم نسخ كود الدعوة');
                        }}
                        className="p-2 bg-white hover:bg-gray-50 text-emerald-600 rounded-lg transition-colors shadow-sm flex items-center gap-2 border border-gray-200"
                      >
                        <Copy className="w-5 h-5" />
                        <span className="text-sm font-bold">نسخ</span>
                      </button>
                      <p className="text-gray-800 font-black text-xl tracking-widest" dir="ltr">{user?.referralCode || 'جاري الإنشاء...'}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-emerald-600 font-black text-lg">
                        {((user?.referralsCount || 0) - (user?.usedReferralsCount || 0))} / 4
                      </span>
                      <label className="block text-gray-700 font-bold text-sm">تقدمك نحو الشهر المجاني:</label>
                    </div>
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex justify-end">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                        style={{ width: `${Math.min(100, (((user?.referralsCount || 0) - (user?.usedReferralsCount || 0)) / 4) * 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 font-bold">
                      يتم احتساب الدعوة فقط بعد أن يقوم صديقك بالدفع وتفعيل اشتراكه من قبل الإدارة.
                    </p>
                  </div>
                </NeumorphicCard>

                {user?.role === 'admin' && (
                  <>
                    <NeumorphicCard 
                      className="flex items-center justify-between p-4 sm:p-6 cursor-pointer bg-gradient-to-r from-[#4d9685] to-[#3d7a6c] text-white hover:shadow-lg transition-all transform hover:-translate-y-1 group"
                      onClick={() => setScreen('admin-dashboard')}
                    >
                      <div className="flex items-center gap-2 text-white/70 group-hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                        <span className="text-xs font-bold">إدارة التطبيق</span>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="text-right">
                          <span className="block text-base sm:text-lg font-black leading-tight">لوحة التحكم</span>
                          <span className="text-[10px] sm:text-xs text-white/70 font-bold">إدارة المستخدمين والمحتوى</span>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                          <ShieldCheck size={20} className="sm:w-6 sm:h-6" />
                        </div>
                      </div>
                    </NeumorphicCard>

                    <NeumorphicCard 
                      className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-blue-50 transition-colors"
                      onClick={() => {
                        const newLang = user.language === 'german' ? 'english' : 'german';
                        updateDoc(doc(db, 'users', user.uid), { language: newLang }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`));
                      }}
                    >
                      <div className="flex items-center gap-2 text-blue-500 font-bold">
                        <Languages size={20} />
                        <span>تبديل اللغة</span>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4">
                        <span className="text-base sm:text-lg font-bold text-slate-700">لغة التطبيق: {user.language === 'german' ? 'الألمانية' : 'الإنجليزية'}</span>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-[2px_2px_4px_#d1d1d1,-2px_-2px_4px_#ffffff]">
                          <Languages size={16} className="sm:w-5 sm:h-5" />
                        </div>
                      </div>
                    </NeumorphicCard>
                  </>
                )}

                <NeumorphicCard 
                  className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-emerald-50 transition-colors"
                  onClick={() => setScreen('subscriptions')}
                >
                  <ChevronLeft size={20} className="text-slate-300" />
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="text-base sm:text-lg font-bold text-slate-700">الاشتراكات</span>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-[#4d9685] shadow-[2px_2px_4px_#d1d1d1,-2px_-2px_4px_#ffffff]">
                      <CreditCard size={16} className="sm:w-5 sm:h-5" />
                    </div>
                  </div>
                </NeumorphicCard>

                <NeumorphicCard className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-red-50 transition-colors" onClick={handleLogout}>
                  <div />
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="text-base sm:text-lg font-bold text-red-400">تسجيل الخروج</span>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-400 shadow-[2px_2px_4px_#d1d1d1,-2px_-2px_4px_#ffffff]">
                      <LogOut size={16} className="sm:w-5 sm:h-5" />
                    </div>
                  </div>
                </NeumorphicCard>
              </div>
            </motion.div>
          )}

          {screen === 'settings' && (
            <motion.div 
              key="settings"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-4xl px-4 sm:px-6 py-6 sm:py-12 flex flex-col items-center pb-32"
            >
              <SettingsComponent user={user} onLogout={handleLogout} onBack={() => setScreen('profile')} />
            </motion.div>
          )}

          {screen === 'level-selection' && (
            <motion.div 
              key="level-selection"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-4xl px-4 sm:px-6 py-6 sm:py-12"
            >
              <div className="flex items-center justify-between mb-8 sm:mb-12">
                <BackButton onClick={() => setScreen('learning')} />
                <div className="text-right w-full">
                  <h2 className="text-2xl sm:text-4xl font-bold text-[#4a4a4a]">اختر المستوى</h2>
                  <p className="text-sm sm:text-base text-slate-400 font-bold">اختر المستوى الذي ترغب في دراسته</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-8">
                {LEVELS.filter(level => availableLevels.includes(level) || user?.level === level).map((level) => (
                  <NeumorphicCard 
                    key={level}
                    className={`p-6 sm:p-10 cursor-pointer transition-all hover:scale-105 flex flex-col items-center justify-center gap-4 ${user?.level === level ? 'bg-[#4d9685]/5 border-2 border-[#4d9685]/20' : ''}`}
                    onClick={async () => {
                      if (user) {
                        try {
                          await updateDoc(doc(db, 'users', user.uid), { level });
                          setScreen('learning');
                          toast.success(`تم تغيير المستوى إلى ${level}`);
                        } catch (error) {
                          handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
                          console.error("Error updating level:", error);
                          toast.error("فشل في تغيير المستوى");
                        }
                      }
                    }}
                  >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${user?.level === level ? 'bg-[#4d9685] text-white' : 'bg-white text-[#4d9685] shadow-inner'}`}>
                      <span className="text-2xl font-bold">{level}</span>
                    </div>
                    <span className={`font-bold ${user?.level === level ? 'text-[#4d9685]' : 'text-slate-600'}`}>المستوى {level}</span>
                  </NeumorphicCard>
                ))}
              </div>
            </motion.div>
          )}

          {screen === 'learning' && (
            <motion.div 
              key="learning"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-4xl px-4 sm:px-6 py-6 sm:py-12"
            >
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <BackButton onClick={() => setScreen('home')} />
                <div className="text-right w-full flex flex-col items-start">
                  <button 
                    onClick={() => setScreen('level-selection')}
                    className="flex items-center gap-2 group"
                  >
                    <div className="p-2 rounded-xl bg-white shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] text-[#4d9685] group-hover:scale-110 transition-transform">
                      <Layers size={20} />
                    </div>
                    <div className="text-right">
                      <h2 className="text-2xl sm:text-4xl font-bold text-[#4a4a4a]">{user?.level || 'A1'}</h2>
                      <p className="text-sm sm:text-base text-slate-400 font-bold">المستوى الحالي: {user?.level || 'A1'}</p>
                    </div>
                  </button>
                </div>
              </div>

              <NeumorphicCard className="mb-8 sm:mb-12 p-4 sm:p-6">
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <span className="text-[#4d9685] font-bold text-sm sm:text-base">{userStats.progress}% مكتمل</span>
                  <span className="text-slate-500 font-bold text-sm sm:text-base">إجمالي التقدم في المستوى</span>
                </div>
                <div className="h-3 sm:h-4 w-full bg-slate-200 rounded-full overflow-hidden shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff]">
                  <div className="h-full bg-gradient-to-r from-[#4d9685] to-[#66b2a2] transition-all duration-1000" style={{ width: `${userStats.progress}%` }} />
                </div>
              </NeumorphicCard>

              <h3 className="text-xl sm:text-2xl font-bold text-[#4a4a4a] mb-6 text-right">المنهج الدراسي</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
                {availableStructure.months.length === 0 ? (
                  <p className="col-span-full text-center text-slate-400 font-bold py-12">لا توجد أشهر متاحة حالياً</p>
                ) : (
                  availableStructure.months.map(month => {
                    const lang = user?.language || 'german';
                    const userSubs = user?.subscriptions?.[lang as 'german' | 'english'] || {};
                    const hasSub = (userSubs[user?.level || 'A1'] || []).includes(Number(month));
                    const monthLocked = user?.role !== 'admin' && (!hasSub || Number(month) > (user?.currentMonth || 1));
                    return (
                      <div key={month} className="pt-4 relative">
                        <NeumorphicCard 
                          className={`cursor-pointer hover:scale-[1.02] transition-transform p-6 sm:p-8 ${monthLocked ? 'opacity-70 grayscale' : ''}`}
                          onClick={() => {
                            handleContentAccess(Number(month), 1, null, () => {
                              setSelectedMonth(Number(month));
                              setScreen('learning-week');
                            });
                          }}
                        >
                          {monthLocked && (
                            <div className="absolute top-8 right-8 text-slate-400">
                              <Lock size={24} />
                            </div>
                          )}
                          <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-20 h-20 rounded-[32px] bg-emerald-50 shadow-inner flex items-center justify-center text-[#4db6ac]">
                              <Folder size={32} />
                            </div>
                            <div>
                              <h3 className="text-xl sm:text-2xl font-bold text-[#4a4a4a]">الشهر {month}</h3>
                              <p className="text-sm text-slate-400 font-bold">{availableStructure.weeks[month]?.length || 0} أسابيع</p>
                            </div>
                          </div>
                        </NeumorphicCard>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {screen === 'learning-week' && (
            <motion.div 
              key="learning-week"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-4xl px-4 sm:px-6 py-6 sm:py-12"
            >
              <div className="flex items-center justify-between mb-8 sm:mb-12">
                <BackButton onClick={() => setScreen('learning')} />
                <div className="text-right w-full">
                  <h2 className="text-2xl sm:text-4xl font-bold text-[#4a4a4a]">الشهر {selectedMonth}</h2>
                  <p className="text-sm sm:text-base text-slate-400 font-bold">اختر الأسبوع</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
                {(availableStructure.weeks[selectedMonth] || []).map(week => {
                  const lang = user?.language || 'german';
                  const userSubs = user?.subscriptions?.[lang as 'german' | 'english'] || {};
                  const hasSub = (userSubs[user?.level || 'A1'] || []).includes(selectedMonth);
                  const weekLocked = !hasSub;
                  return (
                    <div key={week} className="pt-4 relative">
                      <NeumorphicCard 
                        className={`cursor-pointer hover:scale-[1.02] transition-transform p-6 sm:p-8 ${weekLocked ? 'opacity-70 grayscale' : ''}`}
                        onClick={() => {
                          handleContentAccess(selectedMonth, week, null, () => {
                            setSelectedWeek(week);
                            setScreen('learning-day-select');
                          });
                        }}
                      >
                        {weekLocked && (
                          <div className="absolute top-8 right-8 text-slate-400">
                            <Lock size={24} />
                          </div>
                        )}
                        <div className="flex flex-col items-center text-center gap-4">
                          <div className="w-20 h-20 rounded-[32px] bg-blue-50 shadow-inner flex items-center justify-center text-blue-500">
                            <Folder size={32} />
                          </div>
                          <div>
                            <h3 className="text-xl sm:text-2xl font-bold text-[#4a4a4a]">الأسبوع {week}</h3>
                            <p className="text-sm text-slate-400 font-bold">محتوى تعليمي</p>
                          </div>
                        </div>
                      </NeumorphicCard>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {screen === 'learning-day-select' && (
            <motion.div 
              key="learning-day-select"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-4xl px-4 sm:px-6 py-6 sm:py-12"
            >
              <div className="flex items-center justify-between mb-8 sm:mb-12">
                <BackButton onClick={() => setScreen('learning-week')} />
                <div className="text-right w-full">
                  <h2 className="text-2xl sm:text-4xl font-bold text-[#4a4a4a]">الأسبوع {selectedWeek}</h2>
                  <p className="text-sm sm:text-base text-slate-400 font-bold">اختر اليوم</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
                {(availableStructure.days[`${selectedMonth}-${selectedWeek}`] || []).map(day => {
                  const lang = user?.language || 'german';
                  const userSubs = user?.subscriptions?.[lang as 'german' | 'english'] || {};
                  const hasSub = (userSubs[user?.level || 'A1'] || []).includes(selectedMonth);
                  const dayLocked = user?.role !== 'admin' && (!hasSub || selectedMonth > (user?.currentMonth || 1) || (selectedMonth === (user?.currentMonth || 1) && selectedWeek > (user?.currentWeek || 1)) || (selectedMonth === (user?.currentMonth || 1) && selectedWeek === (user?.currentWeek || 1) && day > (user?.currentDay || 1)));
                  return (
                    <div key={day} className="pt-4 relative">
                      <NeumorphicCard 
                        className={`cursor-pointer hover:scale-[1.02] transition-transform p-6 sm:p-8 ${dayLocked ? 'opacity-70 grayscale' : ''}`}
                        onClick={() => {
                          handleContentAccess(selectedMonth, selectedWeek, day, () => {
                            setSelectedDay(day);
                            setScreen('learning-day');
                          });
                        }}
                      >
                        {dayLocked && (
                          <div className="absolute top-8 right-8 text-slate-400">
                            <Lock size={24} />
                          </div>
                        )}
                        <div className="flex flex-col items-center text-center gap-4">
                          <div className="w-20 h-20 rounded-[32px] bg-indigo-50 shadow-inner flex items-center justify-center text-indigo-500">
                            <Folder size={32} />
                          </div>
                          <div>
                            <h3 className="text-xl sm:text-2xl font-bold text-[#4a4a4a]">اليوم {day}</h3>
                            <p className="text-sm text-slate-400 font-bold">محتوى اليوم</p>
                          </div>
                        </div>
                      </NeumorphicCard>
                    </div>
                  );
                })}
                {(!availableStructure.days[`${selectedMonth}-${selectedWeek}`] || availableStructure.days[`${selectedMonth}-${selectedWeek}`].length === 0) && (
                  <p className="col-span-full text-center text-slate-400 font-bold py-12">لا يوجد محتوى متاح لهذا الأسبوع حالياً</p>
                )}
              </div>
            </motion.div>
          )}

          {screen === 'learning-day' && (
            <motion.div 
              key="learning-day"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-4xl px-4 sm:px-6 py-6 sm:py-12"
            >
              <div className="flex items-center justify-between mb-8 sm:mb-12">
                <BackButton onClick={() => setScreen('learning-day-select')} />
                <div className="text-right w-full">
                  <h2 className="text-2xl sm:text-4xl font-bold text-[#4a4a4a]">اليوم {selectedDay}</h2>
                  <p className="text-sm sm:text-base text-slate-400 font-bold">اختر المحتوى للبدء</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {currentLessons.length > 0 ? (
                  currentLessons.map((lesson: any) => (
                    <div key={lesson.id} className="pt-4">
                      <NeumorphicCard 
                        className="cursor-pointer hover:scale-[1.02] transition-transform p-6 sm:p-8"
                        onClick={() => { 
                          checkContentAccess(selectedMonth, selectedWeek, selectedDay, () => {
                            setActiveLesson(lesson);
                            setIframeLoaded(false);
                            setContentType(lesson.type); 
                            setScreen('learning-content'); 
                          });
                        }}
                      >
                        <div className="flex flex-col items-center text-center gap-4">
                          <div className={`w-20 h-20 rounded-[32px] shadow-inner flex items-center justify-center ${
                            lesson.type === 'video' ? 'bg-red-50 text-red-500' :
                            lesson.type === 'file' ? 'bg-blue-50 text-blue-500' :
                            lesson.type === 'text' ? 'bg-purple-50 text-purple-500' :
                            'bg-orange-50 text-orange-500'
                          }`}>
                            {lesson.type === 'video' && <Play size={32} fill="currentColor" />}
                            {lesson.type === 'file' && <FileText size={32} />}
                            {lesson.type === 'text' && <BookOpen size={32} />}
                            {lesson.type === 'task' && <Target size={32} />}
                          </div>
                          <div>
                            <h3 className="text-lg sm:text-xl font-bold text-[#4a4a4a]">{lesson.title}</h3>
                            <p className="text-xs sm:text-sm text-slate-400 font-bold uppercase">
                              {lesson.type === 'video' ? `فيديو الشرح` :
                               lesson.type === 'file' ? `ملف: ${lesson.size || 'PDF'}` :
                               lesson.type === 'text' ? 'قراءة سريعة' :
                               'مهمة تطبيقية'}
                            </p>
                          </div>
                        </div>
                      </NeumorphicCard>
                    </div>
                  ))
                ) : null}

                {/* Flashcards Card */}
                {flashcardsStructure.days[`${selectedMonth}-${selectedWeek}`]?.has(selectedDay) && (
                  <div className="pt-4">
                    <NeumorphicCard 
                      className="cursor-pointer hover:scale-[1.02] transition-transform p-6 sm:p-8"
                      onClick={() => {
                        checkContentAccess(selectedMonth, selectedWeek, selectedDay, () => {
                          setShowFlashcards(true);
                        });
                      }}
                    >
                      <div className="flex flex-col items-center text-center gap-4">
                        <div className="w-20 h-20 rounded-[32px] bg-orange-50 shadow-inner flex items-center justify-center text-orange-500">
                          <BrainCircuit size={32} />
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold text-[#4a4a4a]">مراجعة الكلمات</h3>
                          <p className="text-xs sm:text-sm text-slate-400 font-bold">تدرب على المفردات</p>
                        </div>
                      </div>
                    </NeumorphicCard>
                  </div>
                )}

                {/* Exercises Card */}
                {exercisesStructure.days[`${selectedMonth}-${selectedWeek}`]?.has(selectedDay) && (
                  <div className="pt-4">
                    <NeumorphicCard 
                      className="cursor-pointer hover:scale-[1.02] transition-transform p-6 sm:p-8"
                      onClick={() => {
                        checkContentAccess(selectedMonth, selectedWeek, selectedDay, () => {
                          setShowExercises(true);
                        });
                      }}
                    >
                      <div className="flex flex-col items-center text-center gap-4">
                        <div className="w-20 h-20 rounded-[32px] bg-purple-50 shadow-inner flex items-center justify-center text-purple-500">
                          <Brain size={32} />
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold text-[#4a4a4a]">اختبر معلوماتك</h3>
                          <p className="text-xs sm:text-sm text-slate-400 font-bold">تمارين تفاعلية</p>
                        </div>
                      </div>
                    </NeumorphicCard>
                  </div>
                )}

                {/* Quizzes Card */}
                {quizzesStructure.days[`${selectedMonth}-${selectedWeek}`]?.has(selectedDay) && (
                  <div className="pt-4">
                    <NeumorphicCard 
                      className="cursor-pointer hover:scale-[1.02] transition-transform p-6 sm:p-8"
                      onClick={() => {
                        checkContentAccess(selectedMonth, selectedWeek, selectedDay, () => {
                          setScreen('quizzes');
                        });
                      }}
                    >
                      <div className="flex flex-col items-center text-center gap-4">
                        <div className="w-20 h-20 rounded-[32px] bg-rose-50 shadow-inner flex items-center justify-center text-rose-500">
                          <BrainCircuit size={32} />
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold text-[#4a4a4a]">اختبارات قصيرة</h3>
                          <p className="text-xs sm:text-sm text-slate-400 font-bold">قيم مستواك</p>
                        </div>
                      </div>
                    </NeumorphicCard>
                  </div>
                )}

                {/* Vocabulary Card */}
                {vocabularyStructure.days[`${selectedMonth}-${selectedWeek}`]?.has(selectedDay) && (
                  <div className="pt-4">
                    <NeumorphicCard 
                      className="cursor-pointer hover:scale-[1.02] transition-transform p-6 sm:p-8"
                      onClick={() => {
                        checkContentAccess(selectedMonth, selectedWeek, selectedDay, () => {
                          setScreen('vocabulary');
                        });
                      }}
                    >
                      <div className="flex flex-col items-center text-center gap-4">
                        <div className="w-20 h-20 rounded-[32px] bg-blue-50 shadow-inner flex items-center justify-center text-blue-500">
                          <Languages size={32} />
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold text-[#4a4a4a]">المفردات</h3>
                          <p className="text-xs sm:text-sm text-slate-400 font-bold">كلمات اليوم</p>
                        </div>
                      </div>
                    </NeumorphicCard>
                  </div>
                )}

                {currentLessons.length === 0 && 
                 !flashcardsStructure.days[`${selectedMonth}-${selectedWeek}`]?.has(selectedDay) && 
                 !exercisesStructure.days[`${selectedMonth}-${selectedWeek}`]?.has(selectedDay) && 
                 !quizzesStructure.days[`${selectedMonth}-${selectedWeek}`]?.has(selectedDay) && 
                 !vocabularyStructure.days[`${selectedMonth}-${selectedWeek}`]?.has(selectedDay) && (
                  <div className="col-span-full text-center py-12">
                    <p className="text-slate-400 font-bold text-xl">لا توجد دروس مضافة لهذا اليوم بعد.</p>
                  </div>
                )}
              </div>

              <AnimatePresence>
                {showFlashcards && (
                  <StudentFlashcards 
                    month={selectedMonth} 
                    week={selectedWeek} 
                    day={selectedDay} 
                    level={user?.level || 'A1'}
                    onClose={() => setShowFlashcards(false)}
                    language={user?.language || 'german'}
                  />
                )}
                {showExercises && (
                  <StudentExercises 
                    month={selectedMonth} 
                    week={selectedWeek} 
                    day={selectedDay} 
                    level={user?.level || 'A1'}
                    onClose={() => setShowExercises(false)}
                    onComplete={handleQuizCompletion}
                    language={user?.language || 'german'}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {screen === 'learning-content' && (
            <motion.div 
              key="learning-content"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-[95%] xl:max-w-7xl px-4 sm:px-6 py-6 sm:py-12 flex-1 flex flex-col justify-center"
            >
              <div className="flex items-center justify-between mb-8 sm:mb-12">
                <BackButton onClick={() => setScreen('learning-day')} />
                <div className="text-right w-full">
                  <h2 className="text-2xl sm:text-4xl font-bold text-[#4a4a4a]">{activeLesson?.title || 'عرض المحتوى'}</h2>
                  <p className="text-sm sm:text-base text-slate-400 font-bold">
                    {activeLesson?.type === 'video' && 'فيديو الشرح'}
                    {activeLesson?.type === 'file' && 'ملف الدرس'}
                    {activeLesson?.type === 'text' && 'نص الدرس'}
                    {activeLesson?.type === 'task' && 'مهمة تطبيقية'}
                  </p>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                {activeLesson?.type === 'video' && (
                  <div className="w-[calc(100%+2rem)] -mx-4 sm:w-full sm:mx-0 aspect-video overflow-hidden bg-black mb-8 sm:mb-12 relative shadow-2xl rounded-none sm:rounded-3xl">
                    {activeLesson.displayMode === 'embed' ? (
                      <MediaViewer url={getEmbedUrl(activeLesson.content)} type="video" title={activeLesson.title} />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white gap-4 p-4 text-center">
                        <Play size={48} className="sm:w-16 sm:h-16" />
                        <p className="font-bold text-lg sm:text-xl">{activeLesson.title}</p>
                        <a 
                          href={activeLesson.content} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-6 py-2 sm:px-8 sm:py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-all text-sm sm:text-base"
                        >
                          شاهد الفيديو خارج التطبيق
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {activeLesson?.type === 'file' && (
                  <div className="w-[calc(100%+2rem)] -mx-4 sm:w-full sm:mx-0 h-[85vh] sm:h-[85vh] flex flex-col items-center justify-center bg-white mb-8 sm:mb-12 overflow-hidden relative shadow-xl rounded-none sm:rounded-3xl">
                    {activeLesson.displayMode === 'embed' && activeLesson.content.includes('drive.google.com') ? (
                      <div className="relative w-full h-full">
                        <MediaViewer url={getEmbedUrl(activeLesson.content)} type="file" title={activeLesson.title} />
                      </div>
                    ) : (
                      <div className="p-8 flex flex-col items-center text-center">
                        <FileText size={80} className="text-slate-200 mb-6 sm:w-[100px] sm:h-[100px]" />
                        <p className="text-slate-400 font-bold text-lg sm:text-xl">{activeLesson.title}</p>
                        <div className="mt-8 w-48">
                          <a 
                            href={activeLesson.content} 
                            target="_blank" 
                            rel="noreferrer"
                            className="w-full block"
                          >
                            <NeumorphicButton variant="secondary">تحميل الملف</NeumorphicButton>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeLesson?.type === 'text' && (
                  <NeumorphicCard className="w-full p-6 sm:p-10 mb-8 sm:mb-12 bg-white text-right shadow-lg">
                    <h3 className="text-xl sm:text-2xl font-bold text-[#4a4a4a] mb-6">{activeLesson.title}</h3>
                    <div className="space-y-4 text-slate-600 text-base sm:text-lg leading-relaxed font-medium whitespace-pre-wrap">
                      {activeLesson.content}
                    </div>
                  </NeumorphicCard>
                )}

                {activeLesson?.type === 'task' && (
                  <NeumorphicCard className="w-full p-6 sm:p-10 mb-8 sm:mb-12 bg-white text-right shadow-lg">
                    <h3 className="text-xl sm:text-2xl font-bold text-[#4a4a4a] mb-6 sm:mb-8">{activeLesson.title}</h3>
                    <div className="space-y-4 text-slate-600 text-base sm:text-lg mb-6 sm:mb-8">
                      {activeLesson.content}
                    </div>
                    <div className="space-y-6">
                      <textarea 
                        placeholder="اكتب إجابتك هنا..."
                        className="w-full p-4 sm:p-6 bg-slate-50 rounded-2xl sm:rounded-3xl shadow-inner border-none outline-none text-right font-bold min-h-[150px]"
                        dir="rtl"
                      />
                    </div>
                  </NeumorphicCard>
                )}
              </div>
            </motion.div>
          )}

          {screen === 'library' && (
            <motion.div 
              key="library"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-12"
            >
              <div className="flex flex-col mb-8 sm:mb-12 gap-6 sm:gap-8">
                <div className="flex items-center justify-between">
                  <div className="text-right w-full">
                    <h2 className="text-2xl sm:text-4xl font-bold text-[#4a4a4a]">المكتبة التعليمية</h2>
                    <p className="text-sm sm:text-base text-slate-400 font-bold">تصفح المصادر التعليمية حسب المستوى</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4">
                  {LEVELS.filter(level => availableLevels.includes(level) || user?.level === level).map((level) => (
                    <button
                      key={level}
                      onClick={() => setSelectedLibraryLevel(level)}
                      className={`px-6 py-3 rounded-2xl font-bold transition-all ${
                        selectedLibraryLevel === level 
                          ? 'bg-[#4d9685] text-white shadow-lg scale-105' 
                          : 'bg-white text-slate-400 shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] hover:text-[#4d9685]'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>

                <div className="w-full md:w-96 self-end">
                  <div className="relative">
                    <div className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Target size={20} className="sm:w-[22px] sm:h-[22px] rotate-45" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="ابحث عن قسم..." 
                      dir="rtl"
                      className="w-full h-12 sm:h-16 pr-12 sm:pr-14 pl-4 sm:pl-6 bg-[#f5f5f5] rounded-xl sm:rounded-[24px] shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff] outline-none text-slate-600 placeholder:text-slate-400 font-medium text-base sm:text-lg border-none focus:ring-2 focus:ring-[#4d9685]/10 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {libraryCategories.length === 0 ? (
                  <p className="col-span-full text-center text-slate-400 font-bold py-12">لا توجد أقسام حالياً</p>
                ) : (
                  libraryCategories.map((category) => {
                    const lang = user?.language || 'german';
                    const userSubs = user?.subscriptions?.[lang as 'german' | 'english'] as Record<string, number[]> || {};
                    const hasAnySubscription = Object.values(userSubs).some(months => months.length > 0);
                    const isLocked = user?.role !== 'admin' && !hasAnySubscription;
                    return (
                      <div key={category.id} className="pt-4 relative">
                        <NeumorphicCard 
                          className={`cursor-pointer hover:scale-[1.02] transition-transform p-6 sm:p-8 ${isLocked ? 'opacity-70 grayscale' : ''}`}
                          onClick={() => {
                            checkLibraryAccess(() => {
                              setSelectedLibraryCategory(category);
                              setScreen('library-category');
                            });
                          }}
                        >
                          {isLocked && (
                            <div className="absolute top-8 right-8 text-slate-400">
                              <Lock size={24} />
                            </div>
                          )}
                          <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-20 h-20 rounded-[32px] bg-blue-50 shadow-inner flex items-center justify-center text-blue-500">
                              <Folder size={32} />
                            </div>
                            <div>
                              <h3 className="text-lg sm:text-2xl font-bold text-[#4a4a4a]">{category.name}</h3>
                              <p className="text-xs sm:text-sm text-slate-400 font-bold">{category.description || 'قسم في المكتبة'}</p>
                            </div>
                          </div>
                        </NeumorphicCard>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {screen === 'library-category' && (
            <motion.div 
              key="library-category"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-4xl px-4 sm:px-6 py-6 sm:py-12"
            >
              <div className="flex items-center justify-between mb-8 sm:mb-12">
                <BackButton onClick={() => setScreen('library')} />
                <div className="text-right w-full pr-4">
                  <h2 className="text-2xl sm:text-4xl font-bold text-[#4a4a4a]">{selectedLibraryCategory?.name}</h2>
                  <p className="text-sm sm:text-base text-slate-400 font-bold">{selectedLibraryCategory?.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {librarySubcategories.filter(sub => sub.categoryId === selectedLibraryCategory?.id).length === 0 ? (
                  <p className="col-span-full text-center text-slate-400 font-bold py-12">لا توجد أقسام فرعية حالياً</p>
                ) : (
                  librarySubcategories.filter(sub => sub.categoryId === selectedLibraryCategory?.id).map((sub) => (
                    <div key={sub.id} className="pt-4">
                      <NeumorphicCard 
                        className="cursor-pointer hover:scale-[1.02] transition-transform p-6 sm:p-8"
                        onClick={() => {
                          setSelectedLibrarySubcategory(sub);
                          setScreen('library-subcategory');
                        }}
                      >
                        <div className="flex flex-col items-center text-center gap-4">
                          <div className="w-20 h-20 rounded-[32px] bg-slate-50 shadow-inner flex items-center justify-center text-slate-400">
                            <Folder size={32} />
                          </div>
                          <div>
                            <h3 className="text-lg sm:text-2xl font-bold text-[#4a4a4a]">{sub.name}</h3>
                            <p className="text-xs sm:text-sm text-slate-400 font-bold">{libraryItems.filter(item => item.subcategoryId === sub.id).length} عناصر</p>
                          </div>
                        </div>
                      </NeumorphicCard>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {screen === 'library-subcategory' && (
            <motion.div 
              key="library-subcategory"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-12"
            >
              <div className="flex items-center justify-between mb-8 sm:mb-12">
                <BackButton onClick={() => setScreen('library-category')} />
                <div className="text-right w-full pr-4">
                  <h2 className="text-2xl sm:text-4xl font-bold text-[#4a4a4a]">{selectedLibrarySubcategory?.name}</h2>
                  <p className="text-sm sm:text-base text-slate-400 font-bold">{selectedLibraryCategory?.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {libraryItems.filter(item => item.subcategoryId === selectedLibrarySubcategory?.id).length === 0 ? (
                  <p className="col-span-full text-center text-slate-400 font-bold py-12">لا توجد عناصر حالياً</p>
                ) : (
                  libraryItems.filter(item => item.subcategoryId === selectedLibrarySubcategory?.id).map((item) => (
                    <NeumorphicCard 
                      key={item.id} 
                      className="cursor-pointer hover:scale-[1.02] transition-transform p-4 sm:p-6" 
                      onClick={() => {
                        checkLibraryAccess(() => {
                          if (item.displayMode === 'embed') {
                            setActiveLesson(item);
                            setIframeLoaded(false);
                            setScreen('library-item');
                          } else {
                            window.open(item.url, '_blank');
                          }
                        });
                      }}
                    >
                      <div className="flex flex-col items-center text-center gap-3 sm:gap-4">
                        <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[32px] shadow-inner flex items-center justify-center ${
                          item.category === 'books' ? 'bg-blue-50 text-blue-500' : 
                          item.category === 'videos' ? 'bg-red-50 text-red-500' : 'bg-purple-50 text-purple-500'
                        }`}>
                          {item.category === 'books' ? <BookOpen size={32} className="sm:w-10 sm:h-10" /> : 
                           item.category === 'videos' ? <Play size={32} className="sm:w-10 sm:h-10" /> : <Mic2 size={32} className="sm:w-10 sm:h-10" />}
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-[#4a4a4a]">{item.name}</h3>
                        <p className="text-xs sm:text-sm text-slate-400 font-bold uppercase">{item.type} • {item.size || 'N/A'}</p>
                      </div>
                    </NeumorphicCard>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {screen === 'library-item' && (
            <motion.div 
              key="library-item"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-[95%] xl:max-w-7xl px-4 sm:px-6 py-6 sm:py-12 flex-1 flex flex-col justify-center"
            >
              <div className="flex items-center justify-between mb-8 sm:mb-12">
                <BackButton onClick={() => setScreen('library-subcategory')} />
                <div className="text-right w-full pr-4">
                  <h2 className="text-2xl sm:text-4xl font-bold text-[#4a4a4a]">{activeLesson?.name || 'عرض الملف'}</h2>
                  <p className="text-sm sm:text-base text-slate-400 font-bold">{activeLesson?.type || 'ملف'}</p>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <div className={`w-[calc(100%+2rem)] -mx-4 sm:w-full sm:mx-0 ${activeLesson?.category === 'videos' ? 'aspect-video bg-black' : 'h-[85vh] sm:h-[85vh] bg-white'} flex flex-col items-center justify-center mb-8 sm:mb-12 overflow-hidden relative shadow-2xl rounded-none sm:rounded-3xl`}>
                  {activeLesson?.url ? (
                    <div className="relative w-full h-full">
                      {!iframeLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-0">
                          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                      <iframe 
                        src={getEmbedUrl(activeLesson.url)}
                        className={`absolute top-0 left-0 w-full h-full border-0 z-10 transition-opacity duration-300 ${iframeLoaded ? 'opacity-100' : 'opacity-0'}`}
                        allowFullScreen
                        sandbox="allow-scripts allow-same-origin allow-presentation"
                        onLoad={() => setIframeLoaded(true)}
                      />
                      {/* Overlays to prevent clicking YouTube title/channel link and YouTube logo */}
                      {(activeLesson.url.includes('youtube.com') || activeLesson.url.includes('youtu.be')) && (
                        <>
                          <div className="absolute top-0 left-0 w-full h-16 bg-transparent z-20"></div>
                          <div className="absolute bottom-0 right-0 w-32 h-16 bg-transparent z-20"></div>
                        </>
                      )}
                      {/* Overlay to prevent clicking Drive pop-out button and top bar */}
                      {activeLesson.url.includes('drive.google.com') && (
                        <div className="absolute top-0 left-0 w-full h-16 bg-transparent z-20"></div>
                      )}
                    </div>
                  ) : (
                    <>
                      <FileText size={80} className="sm:w-[120px] sm:h-[120px] text-slate-200 mb-6 sm:mb-8" />
                      <p className="text-slate-400 font-bold text-lg sm:text-xl">جاري تحميل الملف...</p>
                    </>
                  )}
                </div>

                {activeLesson?.url && activeLesson.displayMode !== 'embed' && (
                  <div className="flex justify-center">
                    <div className="w-full sm:w-64">
                      <NeumorphicButton onClick={() => window.open(activeLesson.url, '_blank')}>تحميل الملف</NeumorphicButton>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}



          {screen === 'subscriptions' && (
            <motion.div 
              key="subscriptions"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-4xl px-4 sm:px-6 py-6 sm:py-12"
            >
              <div className="flex items-center justify-between mb-8 sm:mb-12">
                <BackButton onClick={() => setScreen('profile')} />
                <div className="text-right w-full pr-4">
                  <h2 className="text-2xl sm:text-4xl font-bold text-[#4a4a4a]">الاشتراكات</h2>
                  <p className="text-sm sm:text-base text-slate-400 font-bold">إدارة اشتراكاتك في الدورات التعليمية</p>
                </div>
              </div>

              <div className="space-y-8">
                <NeumorphicCard className="p-6 sm:p-10 bg-gradient-to-br from-[#4d9685] to-[#3d7a6c] text-white relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-black/10 rounded-full blur-3xl"></div>
                  
                  <div className="relative z-10 text-right">
                    <div className="inline-block px-4 py-1 bg-white/20 rounded-full text-xs font-black uppercase tracking-widest mb-4">عرض خاص</div>
                    <div className="flex items-center justify-end gap-4 mb-2">
                      <h3 className="text-2xl sm:text-3xl font-black">{BASE_PRICE} جنيه</h3>
                    </div>
                    <p className="text-emerald-50/80 font-bold mb-8">
                      سعر الاشتراك الشهري لأي مستوى متاح.
                      <br />
                      <span className="text-white font-black bg-emerald-600/50 px-2 py-1 rounded-lg mt-2 inline-block">
                        احصل عليه بـ {DISCOUNTED_PRICE} جنيه فقط عند استخدام كود دعوة!
                      </span>
                    </p>
                    
                    <div className="flex flex-col sm:flex-row-reverse items-center gap-4">
                      <button 
                        onClick={() => setSubscriptionModal({ isOpen: true, level: user?.level || 'A1', month: 1 })}
                        className="w-full sm:w-auto px-8 py-4 bg-white text-[#4d9685] rounded-2xl font-black text-lg shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-3"
                      >
                        <MessageCircle size={24} />
                        اشترك
                      </button>
                      <div className="text-center sm:text-right">
                        <p className="text-xs text-emerald-50/60 font-bold">للاستفسار عن طرق الدفع المتاحة</p>
                      </div>
                    </div>
                  </div>
                </NeumorphicCard>

                <div className="grid grid-cols-1 gap-6">
                  <h3 className="text-xl font-bold text-[#4a4a4a] text-right px-2">خطة المنهج والاشتراكات ({user?.level || 'A1'})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(() => {
                      const availableMonths = Array.from(new Set([
                        ...Array.from(lessonsStructure.months as Set<number>),
                        ...Array.from(flashcardsStructure.months as Set<number>),
                        ...Array.from(exercisesStructure.months as Set<number>),
                        ...Array.from(quizzesStructure.months as Set<number>),
                        ...Array.from(vocabularyStructure.months as Set<number>)
                      ])).sort((a, b) => a - b);

                      if (availableMonths.length === 0) {
                        return (
                          <div className="col-span-full text-center py-8">
                            <p className="text-slate-400 font-bold text-lg">لا توجد محتويات متاحة لهذا المستوى بعد.</p>
                          </div>
                        );
                      }

                      return availableMonths.map(m => {
                        const lang = user?.language || 'german';
                        const userSubs = user?.subscriptions?.[lang as 'german' | 'english'] || {};
                        const isSubscribed = (userSubs[user?.level || 'A1'] || []).includes(m);
                        
                        return (
                          <NeumorphicCard key={m} className={`p-6 text-right flex flex-col justify-between ${isSubscribed ? 'bg-white' : 'bg-slate-50/50 opacity-80'}`}>
                            <div className="flex items-center justify-between mb-4">
                              {isSubscribed ? (
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg font-black text-[10px] flex items-center gap-1">
                                  <CircleCheck size={12} />
                                  مشترك
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-lg font-black text-[10px]">غير مشترك</span>
                              )}
                              <h4 className="text-lg font-black text-[#4a4a4a]">الشهر {m}</h4>
                            </div>
                            
                            {!isSubscribed && (
                              <button 
                                onClick={() => setSubscriptionModal({ isOpen: true, level: user?.level || 'A1', month: m })}
                                className="mt-4 w-full py-2 bg-[#4d9685] text-white rounded-xl font-bold text-sm shadow-md hover:scale-105 transition-transform"
                              >
                                اشترك الآن
                              </button>
                            )}
                          </NeumorphicCard>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {screen === 'leaderboard-full' && (
            <motion.div 
              key="leaderboard-full"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-4xl px-4 sm:px-6 py-6 sm:py-12"
            >
              <div className="flex items-center justify-between mb-8 sm:mb-12">
                <BackButton onClick={() => setScreen('home')} />
                <div className="text-right w-full pr-4">
                  <h2 className="text-2xl sm:text-4xl font-bold text-[#4a4a4a]">لوحة الصدارة الكاملة</h2>
                  <p className="text-sm sm:text-base text-slate-400 font-bold">تعرف على ترتيبك بين الطلاب</p>
                </div>
              </div>

              <div className="space-y-4">
                {leaderboard.map((user, index) => (
                  <NeumorphicCard 
                    key={index} 
                    className={`p-4 sm:p-6 flex items-center justify-between transition-all ${user.me ? 'border-2 border-[#4d9685] bg-emerald-50/30' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-lg sm:text-xl font-black text-[#4d9685]">{user.points}</span>
                        <span className="text-[10px] sm:text-xs text-slate-400 font-bold mr-1">نقطة</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="text-right">
                        <h4 className="text-base sm:text-lg font-bold text-slate-700">{user.name}</h4>
                        {user.me && <span className="text-[10px] font-black text-[#4d9685] uppercase">أنت</span>}
                      </div>
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-black text-lg sm:text-xl shadow-sm ${
                        index === 0 ? 'bg-yellow-100 text-yellow-600' : 
                        index === 1 ? 'bg-slate-100 text-slate-500' : 
                        index === 2 ? 'bg-orange-100 text-orange-600' : 
                        'bg-white text-slate-400'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                  </NeumorphicCard>
                ))}
              </div>
            </motion.div>
          )}

          {screen === 'achievements' && (
            <motion.div 
              key="achievements"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-4xl px-4 sm:px-6 py-6 sm:py-12"
            >
              <div className="flex items-center justify-between mb-8 sm:mb-12">
                <BackButton onClick={() => setScreen('profile')} />
                <div className="text-right w-full pr-4">
                  <h2 className="text-2xl sm:text-4xl font-bold text-[#4a4a4a]">إنجازاتي</h2>
                  <p className="text-sm sm:text-base text-slate-400 font-bold">تتبع تقدمك وافتح أوسمة جديدة</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {dynamicAchievements.map(ach => (
                  <NeumorphicCard key={ach.id} className={`p-4 sm:p-6 text-right transition-all ${ach.completed ? 'bg-white' : 'opacity-60'}`}>
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm ${ach.completed ? 'bg-slate-50' : 'bg-slate-100 grayscale'}`}>
                        {React.cloneElement(ach.icon as React.ReactElement, { className: "w-5 h-5 sm:w-8 sm:h-8" })}
                      </div>
                      {ach.completed ? (
                        <div className="bg-emerald-100 text-emerald-600 px-2 sm:px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          <CircleCheck size={12} />
                          مكتمل
                        </div>
                      ) : (
                        <div className="bg-slate-100 text-slate-400 px-2 sm:px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                          قيد التنفيذ
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-[#4a4a4a] mb-1 sm:mb-2">{ach.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">{ach.description}</p>
                    
                    {!ach.completed && (
                      <div className="mt-4 sm:mt-6 h-1.5 sm:h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-300 w-1/3" />
                      </div>
                    )}
                  </NeumorphicCard>
                ))}
              </div>
            </motion.div>
          )}

          {screen === 'notifications' && (
            <motion.div 
              key="notifications"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-4xl px-4 sm:px-6 py-6 sm:py-12"
            >
              <div className="flex items-center justify-between mb-8 sm:mb-12">
                <BackButton onClick={() => setScreen('home')} />
                <div className="text-right w-full pr-4">
                  <h2 className="text-2xl sm:text-4xl font-bold text-[#4a4a4a]">التنبيهات</h2>
                </div>
              </div>
              <StudentNotifications language={user?.language || 'german'} />
            </motion.div>
          )}

          {screen === 'quizzes' && (
            <StudentQuizzes 
              language={user?.language || 'german'} 
              level={user?.level || 'A1'}
              onBack={() => setScreen('learning-day')} 
              addPoints={handleAddPoints}
              month={selectedMonth}
              week={selectedWeek}
              day={selectedDay}
            />
          )}

          {screen === 'vocabulary' && (
            <StudentVocabulary 
              language={user?.language || 'german'} 
              level={user?.level || 'A1'}
              onBack={() => setScreen('learning-day')} 
              month={selectedMonth}
              week={selectedWeek}
              day={selectedDay}
            />
          )}


          {screen === 'admin-dashboard' && (
            <motion.div 
              key="admin-dashboard"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full h-screen"
            >
              <AdminApp onLogout={handleLogout} onToggleView={() => setScreen('home')} />
            </motion.div>
          )}
        </AnimatePresence>

        {!isAuthScreen && !isAdminDashboard && <BottomNav />}
      </div>
    </div>
  );
}
