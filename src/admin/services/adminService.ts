
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../firebase';

export const AdminService = {
  // Generic helper to get real-time updates for any collection
  subscribeToCollection: (collectionName: string, callback: (data: any[]) => void) => {
    const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(data);
    });
  },

  // Users Management
  async getAllUsers(language: 'german' | 'english') {
    const q = query(collection(db, 'users'), where('language', '==', language));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async updateUserRole(uid: string, role: string) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { role, updatedAt: Timestamp.now() });
  },

  // Courses Management
  async createCourse(courseData: any, language: 'german' | 'english') {
    const path = `courses_${language}`;
    const newCourseRef = doc(collection(db, path));
    await setDoc(newCourseRef, {
      ...courseData,
      id: newCourseRef.id,
      language,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return newCourseRef.id;
  },

  // Media Engine: Convert Drive links to embeddable
  processMediaUrl: (url: string, type: string) => {
    if (type === 'DRIVE' || url.includes('drive.google.com')) {
      const fileId = url.match(/\/d\/(.+?)\//)?.[1] || url.match(/id=(.+?)(&|$)/)?.[1];
      return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : url;
    }
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.match(/(?:v=|\/embed\/|youtu\.be\/)([^&?#]+)/)?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }
    return url;
  }
};
