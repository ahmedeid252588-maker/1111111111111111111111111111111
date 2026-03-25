
export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR';

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
  photoURL?: string;
  createdAt: any;
}

export type ContentType = 'VIDEO' | 'FILE' | 'LINK' | 'TEXT' | 'QUIZ' | 'IMAGE' | 'DRIVE';

export interface ContentBlock {
  id: string;
  title: string;
  type: ContentType;
  data: string; // URL, HTML text, or JSON for Quiz
  order: number;
}

export interface Course {
  id: string;
  title: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  price: number;
  description: string;
  thumbnail: string;
  instructorId: string;
  createdAt: any;
  updatedAt: any;
}

export interface Lecture {
  id: string;
  courseId: string;
  title: string;
  description: string;
  contentBlocks: ContentBlock[];
  order: number;
}
