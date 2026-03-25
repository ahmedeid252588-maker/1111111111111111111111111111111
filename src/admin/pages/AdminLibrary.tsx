import React, { useState, useEffect } from 'react';
import { BookOpen, Play, Mic2, Download, Plus, Pencil, Trash2, X, Save, ExternalLink, Eye, Search, Filter, Folder, ChevronRight, Upload } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, updateDoc, orderBy, where, getDocs } from 'firebase/firestore';
import { ConfirmModal } from '../components/ConfirmModal';
import toast from 'react-hot-toast';

const AdminLibrary: React.FC<{ language: string }> = ({ language }) => {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  
  const [view, setView] = useState<'categories' | 'subcategories' | 'items'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<any>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>(() => {
    return localStorage.getItem('adminLibraryLevel') || 'A1';
  });
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    localStorage.setItem('adminLibraryLevel', selectedLevel);
  }, [selectedLevel]);
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

  const [form, setForm] = useState({
    name: '',
    category: 'books',
    subcategoryId: '',
    type: 'pdf',
    url: '',
    displayMode: 'link',
    size: '',
    description: '',
    tags: [] as string[]
  });

  const t = {
    library: "المكتبة",
    addMainCategory: "إضافة فئة رئيسية",
    internalSections: "الأقسام الداخلية",
    addInternalSection: "إضافة قسم داخلي",
    addNewFile: "إضافة ملف جديد",
    editFile: "تعديل الملف",
    fileName: "اسم الملف",
    fileNamePlaceholder: "مثال: ملخص الدرس الأول",
    category: "الفئة",
    books: "الكتب والكتيبات",
    videos: "الفيديوهات",
    audio: "الصوتيات",
    other: "أخرى",
    type: "النوع",
    urlContent: "الرابط",
    urlPlaceholder: "أدخل الرابط هنا...",
    size: "الحجم (اختياري)",
    sizePlaceholder: "مثال: 2.5 ميجابايت",
    displayMode: "وضع العرض",
    link: "رابط",
    embed: "مضمن",
    description: "وصف الملف (اختياري)",
    descriptionPlaceholder: "اكتب وصفاً قصيراً للملف...",
    tags: "الوسوم",
    tagsPlaceholder: "أضف وسماً واضغط Enter...",
    saveFile: "حفظ الملف",
    add: "إضافة",
    edit: "تعديل",
    mainCategory: "الفئة الرئيسية",
    internalSection: "القسم الداخلي",
    name: "الاسم",
    namePlaceholder: "أدخل الاسم...",
    save: "حفظ",
    deleteFile: "حذف الملف",
    deleteFileConfirm: "هل أنت متأكد أنك تريد حذف هذا الملف؟",
    deleteCategory: "حذف الفئة",
    deleteCategoryConfirm: "هل أنت متأكد أنك تريد حذف هذه الفئة؟ سيتم حذف كل ما بداخلها.",
    deleteSubcategory: "حذف القسم الداخلي",
    deleteSubcategoryConfirm: "هل أنت متأكد أنك تريد حذف هذا القسم الداخلي؟",
    selectSubcategoryFirst: "يرجى اختيار قسم داخلي أولاً",
    loading: "جاري التحميل..."
  };

  useEffect(() => {
    const path = `library_${language}`;
    const q = query(
      collection(db, path), 
      orderBy('name')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const libraryData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter((doc: any) => (doc.level || 'A1') === selectedLevel);
      setItems(libraryData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return () => unsubscribe();
  }, [language, selectedLevel]);

  useEffect(() => {
    const path = `library_categories_${language}`;
    const q = query(
      collection(db, path), 
      orderBy('name')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const categoriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter((doc: any) => (doc.level || 'A1') === selectedLevel);
      setCategories(categoriesData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return () => unsubscribe();
  }, [language, selectedLevel]);

  useEffect(() => {
    if (selectedCategory) {
      const path = `library_subcategories_${language}`;
      const q = query(
        collection(db, path), 
        orderBy('name')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const subcategoriesData = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((sub: any) => sub.categoryId === selectedCategory.id && (sub.level || 'A1') === selectedLevel);
        setSubcategories(subcategoriesData);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      });
      return () => unsubscribe();
    } else {
      setSubcategories([]);
    }
  }, [selectedCategory, language, selectedLevel]);

  const handleSave = async () => {
    try {
      const path = `library_${language}`;
      if (editingId) {
        await updateDoc(doc(db, path, editingId), { ...form, language: language, level: selectedLevel });
      } else {
        if (!selectedSubcategory) {
          toast.error(t.selectSubcategoryFirst);
          return;
        }
        await addDoc(collection(db, path), { ...form, subcategoryId: selectedSubcategory.id, language: language, level: selectedLevel });
      }
      setShowModal(false);
      setForm({ name: '', category: 'books', subcategoryId: '', type: 'pdf', url: '', displayMode: 'link', size: '', description: '', tags: [] });
      setEditingId(null);
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, `library_${language}/${editingId || ''}`);
    }
  };

  const [categoryModal, setCategoryModal] = useState<{
    isOpen: boolean;
    type: 'category' | 'subcategory';
    mode: 'add' | 'edit';
    id?: string;
    name: string;
  }>({
    isOpen: false,
    type: 'category',
    mode: 'add',
    name: ''
  });

  const handleSaveCategory = async () => {
    try {
      if (categoryModal.type === 'category') {
        const path = `library_categories_${language}`;
        if (categoryModal.mode === 'add') {
          await addDoc(collection(db, path), { name: categoryModal.name, language: language, level: selectedLevel });
        } else if (categoryModal.mode === 'edit' && categoryModal.id) {
          await updateDoc(doc(db, path, categoryModal.id), { name: categoryModal.name, language: language, level: selectedLevel });
        }
      } else {
        const path = `library_subcategories_${language}`;
        if (categoryModal.mode === 'add' && selectedCategory) {
          await addDoc(collection(db, path), { name: categoryModal.name, categoryId: selectedCategory.id, language: language, level: selectedLevel });
        } else if (categoryModal.mode === 'edit' && categoryModal.id) {
          await updateDoc(doc(db, path, categoryModal.id), { name: categoryModal.name, language: language, level: selectedLevel });
        }
      }
      setCategoryModal({ ...categoryModal, isOpen: false, name: '' });
    } catch (error) {
      const path = categoryModal.type === 'category' ? `library_categories_${language}` : `library_subcategories_${language}`;
      handleFirestoreError(error, categoryModal.mode === 'edit' ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: t.deleteFile,
      message: t.deleteFileConfirm,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await deleteDoc(doc(db, `library_${language}`, id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `library_${language}/${id}`);
        }
      }
    });
  };

  const handleAddCategory = () => {
    setCategoryModal({ isOpen: true, type: 'category', mode: 'add', name: '' });
  };

  const handleEditCategory = (id: string, currentName: string) => {
    setCategoryModal({ isOpen: true, type: 'category', mode: 'edit', id, name: currentName });
  };

  const handleDeleteCategory = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: t.deleteCategory,
      message: t.deleteCategoryConfirm,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await deleteDoc(doc(db, `library_categories_${language}`, id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `library_categories_${language}/${id}`);
        }
      }
    });
  };

  const handleAddSubcategory = () => {
    if (!selectedCategory) return;
    setCategoryModal({ isOpen: true, type: 'subcategory', mode: 'add', name: '' });
  };

  const handleEditSubcategory = (id: string, currentName: string) => {
    setCategoryModal({ isOpen: true, type: 'subcategory', mode: 'edit', id, name: currentName });
  };

  const handleDeleteSubcategory = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: t.deleteSubcategory,
      message: t.deleteSubcategoryConfirm,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await deleteDoc(doc(db, `library_subcategories_${language}`, id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `library_subcategories_${language}/${id}`);
        }
      }
    });
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubcategory = selectedSubcategory ? item.subcategoryId === selectedSubcategory.id : true;
    return matchesSearch && matchesSubcategory;
  });

  const Breadcrumbs = () => (
    <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
      <button onClick={() => { setView('categories'); setSelectedCategory(null); setSelectedSubcategory(null); }}>{t.library}</button>
      {selectedCategory && (
        <>
          <ChevronRight size={16} />
          <button onClick={() => { setView('subcategories'); setSelectedSubcategory(null); }}>{selectedCategory.name}</button>
        </>
      )}
      {selectedSubcategory && (
        <>
          <ChevronRight size={16} />
          <span className="text-[#ff9a9a]">{selectedSubcategory.name}</span>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-8 pb-20" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="text-right">
          <h1 className="text-3xl font-bold text-gray-900">
            {t.library} - {selectedLevel}
          </h1>
          <Breadcrumbs />
        </div>
        <div className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-2xl shadow-inner">
          {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                selectedLevel === level 
                  ? 'bg-white text-[#ff9a9a] shadow-[2px_2px_5px_rgba(0,0,0,0.05)]' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
      
      {view === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.id} className={`bg-[#f5f5f5] p-6 rounded-[32px] shadow-[10px_10px_20px_#d1d1d1,-10px_-10px_20px_#ffffff] border border-white/20 flex items-center justify-between cursor-pointer ${selectedCategory?.id === category.id ? 'ring-2 ring-[#ff9a9a]' : ''}`}
              onClick={() => { setSelectedCategory(category); setView('subcategories'); }}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff]">
                  <Folder size={28} />
                </div>
                <h4 className="text-xl font-black text-[#4a4a4a]">{category.name}</h4>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleEditCategory(category.id, category.name); }}
                  className="w-10 h-10 flex items-center justify-center bg-[#f5f5f5] rounded-xl shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] text-blue-500 hover:scale-105 transition-all"
                >
                  <Pencil size={18} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.id); }}
                  className="w-10 h-10 flex items-center justify-center bg-[#f5f5f5] rounded-xl shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] text-red-500 hover:scale-105 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          <button 
            onClick={handleAddCategory}
            className="bg-[#f5f5f5] p-6 rounded-[32px] shadow-[10px_10px_20px_#d1d1d1,-10px_-10px_20px_#ffffff] border border-white/20 flex items-center justify-center gap-4 text-slate-400 hover:text-[#ff9a9a] transition-all"
          >
            <Plus size={28} />
            <span className="text-xl font-black">{t.addMainCategory}</span>
          </button>
        </div>
      )}

      {view === 'subcategories' && (
        <div className="space-y-4">
          <h3 className="text-2xl font-black text-[#4a4a4a]">{t.internalSections}</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {subcategories.map((sub) => (
              <div key={sub.id} className="bg-[#f5f5f5] p-4 rounded-2xl shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] flex items-center justify-between cursor-pointer"
                onClick={() => { setSelectedSubcategory(sub); setView('items'); }}
              >
                <span className="font-bold text-slate-600">{sub.name}</span>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); handleEditSubcategory(sub.id, sub.name); }} className="text-blue-500"><Pencil size={16} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteSubcategory(sub.id); }} className="text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            <button onClick={handleAddSubcategory} className="bg-[#f5f5f5] p-4 rounded-2xl shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] flex items-center justify-center gap-2 text-slate-400 hover:text-[#ff9a9a]">
              <Plus size={20} />
              {t.addInternalSection}
            </button>
          </div>
        </div>
      )}

      {view === 'items' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-[#f5f5f5] p-6 rounded-[32px] shadow-[10px_10px_20px_#d1d1d1,-10px_-10px_20px_#ffffff] border border-white/20 flex flex-col justify-between">
              <div className="text-left">
                <h4 className="text-xl font-black text-[#4a4a4a] mb-2">{item.name}</h4>
                <p className="text-sm text-slate-500 mb-4">{item.description}</p>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-2">
                  <button onClick={() => { setEditingId(item.id); setForm({ ...item, tags: item.tags || [] }); setShowModal(true); }} className="p-2 text-slate-400 hover:text-[#ff9a9a]"><Pencil size={18} /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                </div>
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-[#4d9685]"><Download size={18} /></a>
              </div>
            </div>
          ))}
          <button 
            onClick={() => { setForm({ ...form, subcategoryId: selectedSubcategory.id }); setShowModal(true); }}
            className="bg-[#f5f5f5] p-6 rounded-[32px] shadow-[10px_10px_20px_#d1d1d1,-10px_-10px_20px_#ffffff] border border-white/20 flex flex-col items-center justify-center gap-4 text-slate-400 hover:text-[#ff9a9a] transition-all min-h-[200px]"
          >
            <Plus size={48} />
            <span className="text-xl font-black">{t.addNewFile}</span>
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm">
          <div className="bg-[#f5f5f5] w-full max-w-xl rounded-[40px] shadow-2xl p-8 space-y-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-[#4a4a4a]">
                {editingId ? t.editFile : t.addNewFile}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2 text-left">
                <label className="text-sm font-bold text-slate-500 ml-2">{t.fileName}</label>
                <input 
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full h-14 px-6 bg-[#f5f5f5] rounded-2xl shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff] outline-none text-slate-600 font-bold"
                  placeholder={t.fileNamePlaceholder}
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 text-left">
                  <label className="text-sm font-bold text-slate-500 ml-2">{t.category}</label>
                  <select 
                    value={form.category}
                    onChange={e => setForm({...form, category: e.target.value})}
                    className="w-full h-14 px-6 bg-[#f5f5f5] rounded-2xl shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff] outline-none text-slate-600 font-bold appearance-none"
                  >
                    <option value="books">{t.books}</option>
                    <option value="videos">{t.videos}</option>
                    <option value="audio">{t.audio}</option>
                    <option value="other">{t.other}</option>
                  </select>
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-sm font-bold text-slate-500 ml-2">{t.type}</label>
                  <select 
                    value={form.type}
                    onChange={e => setForm({...form, type: e.target.value})}
                    className="w-full h-14 px-6 bg-[#f5f5f5] rounded-2xl shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff] outline-none text-slate-600 font-bold appearance-none"
                  >
                    <option value="pdf">PDF</option>
                    <option value="video">Video</option>
                    <option value="link">Link</option>
                    <option value="drive">Google Drive</option>
                    <option value="telegram">Telegram</option>
                    <option value="youtube">YouTube</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 text-left">
                <div className="flex justify-between items-center px-2">
                  <label className="text-sm font-bold text-slate-500">{t.urlContent}</label>
                </div>
                <input 
                  value={form.url}
                  onChange={e => setForm({...form, url: e.target.value})}
                  className="w-full h-14 px-6 bg-[#f5f5f5] rounded-2xl shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff] outline-none text-slate-600 font-bold"
                  placeholder={t.urlPlaceholder}
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 text-left">
                  <label className="text-sm font-bold text-slate-500 ml-2">{t.size}</label>
                  <input 
                    value={form.size}
                    onChange={e => setForm({...form, size: e.target.value})}
                    className="w-full h-14 px-6 bg-[#f5f5f5] rounded-2xl shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff] outline-none text-slate-600 font-bold"
                    placeholder={t.sizePlaceholder}
                  />
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-sm font-bold text-slate-500 ml-2">{t.displayMode}</label>
                  <div className="flex gap-2 h-14">
                    <button 
                      onClick={() => setForm({...form, displayMode: 'link'})}
                      className={`flex-1 rounded-2xl font-bold text-sm transition-all ${
                        form.displayMode === 'link' 
                          ? 'bg-white shadow-inner text-[#ff9a9a]' 
                          : 'bg-[#f5f5f5] shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] text-slate-400'
                      }`}
                    >
                      {t.link}
                    </button>
                    <button 
                      onClick={() => setForm({...form, displayMode: 'embed'})}
                      className={`flex-1 rounded-2xl font-bold text-sm transition-all ${
                        form.displayMode === 'embed' 
                          ? 'bg-white shadow-inner text-[#ff9a9a]' 
                          : 'bg-[#f5f5f5] shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] text-slate-400'
                      }`}
                    >
                      {t.embed}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-sm font-bold text-slate-500 ml-2">{t.description}</label>
                <textarea 
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full p-6 bg-[#f5f5f5] rounded-3xl shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff] outline-none text-slate-600 font-bold min-h-[100px]"
                  placeholder={t.descriptionPlaceholder}
                  dir="ltr"
                />
              </div>

              <div className="space-y-2 text-left">
                <label className="text-sm font-bold text-slate-500 ml-2">{t.tags}</label>
                <div className="w-full min-h-[56px] p-2 bg-[#f5f5f5] rounded-2xl shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff] flex flex-wrap gap-2 items-center">
                  {form.tags.map((tag, index) => (
                    <span key={index} className="bg-white px-3 py-1 rounded-full text-sm font-bold text-slate-600 shadow-sm flex items-center gap-1 border border-slate-100">
                      {tag}
                      <button 
                        onClick={() => setForm({...form, tags: form.tags.filter((_, i) => i !== index)})}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                  <input 
                    type="text"
                    className="flex-1 min-w-[120px] h-10 px-4 bg-transparent outline-none text-slate-600 font-bold"
                    placeholder={t.tagsPlaceholder}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        const newTag = e.currentTarget.value.trim();
                        if (newTag && !form.tags.includes(newTag)) {
                          setForm({...form, tags: [...form.tags, newTag]});
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleSave}
              className="w-full h-16 bg-[#ff9a9a] text-white rounded-2xl shadow-lg shadow-[#ff9a9a]/20 font-black text-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
            >
              <Save size={20} />
              {t.saveFile}
            </button>
          </div>
        </div>
      )}
      {categoryModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#f5f5f5] w-full max-w-md rounded-[40px] shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] border border-white/50 p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-[#4a4a4a]">
                {categoryModal.mode === 'add' ? t.add : t.edit} {categoryModal.type === 'category' ? t.mainCategory : t.internalSection}
              </h3>
              <button 
                onClick={() => setCategoryModal({ ...categoryModal, isOpen: false })}
                className="w-10 h-10 flex items-center justify-center bg-[#f5f5f5] rounded-xl shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] text-slate-400 hover:text-red-500 transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2 text-left">
                <label className="text-sm font-bold text-slate-500 ml-2">{t.name}</label>
                <input 
                  type="text"
                  value={categoryModal.name}
                  onChange={e => setCategoryModal({ ...categoryModal, name: e.target.value })}
                  className="w-full h-14 px-6 bg-[#f5f5f5] rounded-2xl shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff] outline-none text-slate-600 font-bold"
                  placeholder={t.namePlaceholder}
                  dir="ltr"
                  autoFocus
                />
              </div>
              <button 
                onClick={handleSaveCategory}
                disabled={!categoryModal.name.trim()}
                className="w-full h-14 bg-[#ff9a9a] text-white rounded-2xl shadow-lg shadow-[#ff9a9a]/20 font-black text-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} />
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

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

export default AdminLibrary;
