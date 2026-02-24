import React, { useState, useEffect } from 'react';
import axiosInstance from "../api/axiosInstance";
import Sidebar from '../components/Sidebar';
import CategoryRow from '../components/Category/CategoryRow';
import CategoryForm from '../components/Category/CategoryForm';
import toast, { Toaster } from 'react-hot-toast';
import { Plus, Loader2, LayoutGrid } from 'lucide-react';

const CategoryPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', displayOrder: 0, isActive: true });

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/categories');
      setCategories(res.data);
    } catch (err) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    toast((t) => (
      <div className="flex flex-col gap-4 p-1">
        <p className="font-black text-gray-800 dark:text-white text-sm">Delete this category?</p>
        <p className="text-xs text-gray-500">This action cannot be undone.</p>
        <div className="flex gap-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-black uppercase tracking-wider text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const deleting = toast.loading("Deleting...");
              try {
                await axiosInstance.delete(`/categories/${id}`);
                toast.success("Category deleted", { id: deleting });
                fetchCategories();
              } catch (err) {
                toast.error("Failed to delete", { id: deleting });
              }
            }}
            className="flex-1 px-4 py-2.5 bg-[#B62025] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#9a1a1e] transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    ), { duration: 10000 });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const loadId = toast.loading(editingId ? "Updating..." : "Creating...");
    try {
      if (editingId) {
        await axiosInstance.put(`/categories/${editingId}`, form);
        toast.success("Category updated!", { id: loadId });
      } else {
        await axiosInstance.post('/categories', form);
        toast.success("Category created!", { id: loadId });
      }
      setIsModalOpen(false);
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong", { id: loadId });
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', description: '', displayOrder: 0, isActive: true });
    setIsModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-[#F5E6DA] dark:bg-[#080808] transition-colors duration-500">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'white',
            color: '#111',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
            padding: '16px 20px',
            fontFamily: 'inherit',
          },
        }}
      />
      <Sidebar />

      <main className="flex-1 transition-all duration-300 ml-0 lg:ml-20 p-4 sm:p-6 md:p-8 lg:p-12 min-w-0">
        <div className="max-w-7xl mx-auto">

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 sm:mb-12">
            <div>
              {/* Eyebrow */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-brand/15 dark:bg-brand/20 flex items-center justify-center">
                  <LayoutGrid className="w-4 h-4 text-brand" />
                </div>
                <span className="text-[10px] font-black text-brand uppercase tracking-[3px]">Lough Skin Admin</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">
                Product{' '}
                <span className="text-[#B62025] dark:text-[#FF4B4B]">Categories</span>
              </h1>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-8 h-[2px] bg-brand rounded-full"></div>
                <span className="text-xs text-gray-400 font-medium">
                  {!loading && `${categories.length} ${categories.length === 1 ? 'category' : 'categories'}`}
                </span>
              </div>
            </div>

            <button
              onClick={openCreate}
              className="flex items-center justify-center gap-2 bg-brand hover:bg-[#24a1ad] text-white px-7 py-4 rounded-2xl font-black transition-all shadow-xl shadow-brand/20 active:scale-95 group self-start sm:self-auto shrink-0"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              <span className="uppercase tracking-wider text-sm">Create New</span>
            </button>
          </div>

          {/* ── Table Card ── */}
          <div className="bg-white/70 dark:bg-gray-900/40 backdrop-blur-md rounded-[32px] shadow-2xl shadow-brand-soft/20 dark:shadow-black/40 border border-white dark:border-white/5 overflow-hidden">

            {/* Mobile scroll hint — visible only on small screens */}
            <div className="flex items-center gap-2 px-6 pt-5 pb-0 sm:hidden">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">← Scroll to see all →</div>
            </div>

            {/* Scrollable wrapper — critical for mobile */}
            <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-brand-soft scrollbar-track-transparent">
              <table className="w-full text-left border-collapse" style={{ minWidth: '640px' }}>

                {/* Table Head */}
                <thead className="bg-[#F5EDE4]/60 dark:bg-black/30 border-b border-brand-soft/20 dark:border-white/5">
                  <tr>
                    {['Order', 'Category Name', 'Description', 'Status', 'Actions'].map((h, i) => (
                      <th
                        key={h}
                        className={`px-8 py-6 text-[10px] uppercase tracking-[3px] font-black text-gray-400 dark:text-gray-600 whitespace-nowrap ${i === 3 ? 'text-center' : i === 4 ? 'text-right' : ''}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-gray-100/60 dark:divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-32">
                        <div className="flex flex-col items-center justify-center gap-4 text-gray-400">
                          <Loader2 className="w-10 h-10 animate-spin text-brand" />
                          <p className="font-black tracking-[4px] text-[10px] uppercase text-gray-400">Loading...</p>
                        </div>
                      </td>
                    </tr>
                  ) : categories.length > 0 ? (
                    categories.map((cat) => (
                      <CategoryRow
                        key={cat._id}
                        category={cat}
                        onEdit={(c) => {
                          setEditingId(c._id);
                          setForm(c);
                          setIsModalOpen(true);
                        }}
                        onDelete={handleDelete}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-24 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-brand/10 dark:bg-brand/5 flex items-center justify-center">
                            <LayoutGrid className="w-7 h-7 text-brand/40" />
                          </div>
                          <div>
                            <p className="font-black text-gray-400 dark:text-gray-600 uppercase tracking-[3px] text-xs">No categories yet</p>
                            <p className="text-gray-300 dark:text-gray-700 text-xs mt-1">Click "Create New" to add your first one</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer stripe */}
            {!loading && categories.length > 0 && (
              <div className="px-8 py-4 bg-[#F5EDE4]/40 dark:bg-black/20 border-t border-brand-soft/20 dark:border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[2px]">
                  Total: {categories.length}
                </span>
                <span className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[2px]">
                  Active: {categories.filter(c => c.isActive).length}
                </span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <CategoryForm
          form={form}
          setForm={setForm}
          onSubmit={handleFormSubmit}
          onClose={() => { setIsModalOpen(false); setEditingId(null); }}
          isEditing={!!editingId}
        />
      )}
    </div>
  );
};

export default CategoryPage;