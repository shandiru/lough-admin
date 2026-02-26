import React, { useState, useEffect } from 'react';
import { categoryService } from '../api/categoryService';
import Sidebar from '../components/Sidebar';
import CategoryRow from '../components/Category/CategoryRow';
import CategoryForm from '../components/Category/CategoryForm';
import CategoryHeader from '../components/Category/CategoryHeader';
import toast, { Toaster } from 'react-hot-toast';
import { Loader2, LayoutGrid } from 'lucide-react';

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
      const res = await categoryService.getAll();
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
        <p className="font-black text-gray-800 text-sm">Delete this category?</p>
        <div className="flex gap-2">
          <button onClick={() => toast.dismiss(t.id)} className="flex-1 px-4 py-2 bg-gray-100 text-xs font-black uppercase text-gray-600 hover:bg-gray-200 transition-colors">Cancel</button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const deleting = toast.loading("Deleting...");
              try {
                await categoryService.delete(id);
                toast.success("Category deleted", { id: deleting });
                fetchCategories();
              } catch (err) {
                toast.error("Failed to delete", { id: deleting });
              }
            }}
            className="flex-1 px-4 py-2 bg-[#B62025] text-white rounded-xl text-xs font-black uppercase hover:bg-[#9a1a1e] transition-colors"
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
        await categoryService.update(editingId, form);
        toast.success("Category updated!", { id: loadId });
      } else {
        await categoryService.create(form);
        toast.success("Category created!", { id: loadId });
      }
      setIsModalOpen(false);
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong", { id: loadId });
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F5E6DA]">
      <Toaster position="top-center" toastOptions={{ style: { borderRadius: '16px', padding: '16px 20px' } }} />
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-20 p-4 sm:p-6 md:p-8 lg:p-12 min-w-0">
        <div className="max-w-7xl mx-auto">
          
          <CategoryHeader 
            count={categories.length} 
            loading={loading} 
            onCreateOpen={() => { setEditingId(null); setForm({ name: '', description: '', displayOrder: 0, isActive: true }); setIsModalOpen(true); }} 
          />

          <div className="bg-white/70 backdrop-blur-md rounded-[32px] shadow-2xl overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse" style={{ minWidth: '640px' }}>
                <thead className="bg-[#F5EDE4]/60 border-b border-brand-soft/20">
                  <tr>
                    {['Order', 'Category Name', 'Description', 'Status', 'Actions'].map((h, i) => (
                      <th key={h} className={`px-8 py-6 text-[10px] uppercase tracking-[3px] font-black text-gray-400 ${i === 3 ? 'text-center' : i === 4 ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100/60">
                  {loading ? (
                    <LoadingState />
                  ) : categories.length > 0 ? (
                    categories.map((cat) => (
                      <CategoryRow 
                        key={cat._id} 
                        category={cat} 
                        onEdit={(c) => { setEditingId(c._id); setForm(c); setIsModalOpen(true); }} 
                        onDelete={handleDelete} 
                      />
                    ))
                  ) : (
                    <EmptyState />
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {isModalOpen && (
        <CategoryForm form={form} setForm={setForm} onSubmit={handleFormSubmit} onClose={() => setIsModalOpen(false)} isEditing={!!editingId} />
      )}
    </div>
  );
};

// Internal Small Components to keep main clean
const LoadingState = () => (
  <tr>
    <td colSpan="5" className="py-32 text-center">
      <Loader2 className="w-10 h-10 animate-spin text-brand mx-auto mb-4" />
      <p className="font-black tracking-[4px] text-[10px] uppercase text-gray-400">Loading...</p>
    </td>
  </tr>
);

const EmptyState = () => (
  <tr>
    <td colSpan="5" className="py-24 text-center">
      <LayoutGrid className="w-10 h-10 text-brand/40 mx-auto mb-4" />
      <p className="font-black text-gray-400 uppercase tracking-[3px] text-xs">No categories yet</p>
    </td>
  </tr>
);

export default CategoryPage;