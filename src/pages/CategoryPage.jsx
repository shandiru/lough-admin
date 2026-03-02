import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { categoryService } from '../api/categoryService';
import Sidebar from '../components/Sidebar';
import CategoryForm from '../components/Category/CategoryForm';
import CategoryHeader from '../components/Category/CategoryHeader';
import CategoryTable from '../components/Category/CategoryTable';
import toast, { Toaster } from 'react-hot-toast';

const MySwal = withReactContent(Swal);

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

  // ── SweetAlert2 Delete Confirmation ──
  const handleDelete = async (id) => {
    MySwal.fire({
      title: <span className="text-2xl font-black uppercase tracking-tighter text-gray-900">Are you sure?</span>,
      html: <p className="text-gray-500 text-sm">This category and its associations will be permanently removed.</p>,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#B62025', // Your Brand Red
      cancelButtonColor: '#f3f4f6',
      confirmButtonText: 'YES, DELETE IT',
      cancelButtonText: 'CANCEL',
      buttonsStyling: false,
      customClass: {
        confirmButton: 'px-8 py-3 bg-[#B62025] text-white rounded-2xl font-black text-xs tracking-widest hover:bg-[#9a1a1e] transition-all ml-3 shadow-lg shadow-red-200',
        cancelButton: 'px-8 py-3 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs tracking-widest hover:bg-gray-200 transition-all',
        popup: 'rounded-[32px] p-10 border-none shadow-2xl',
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        const deleting = toast.loading("Deleting...");
        try {
          await categoryService.delete(id);
          toast.success("Category deleted successfully", { id: deleting });
          fetchCategories();
        } catch (err) {
          toast.error("Failed to delete", { id: deleting });
        }
      }
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const loadId = toast.loading(editingId ? "Updating..." : "Creating...");
    try {
      if (editingId) {
        await categoryService.update(editingId, form);
        toast.success("Updated!", { id: loadId });
      } else {
        await categoryService.create(form);
        toast.success("Created!", { id: loadId });
      }
      setIsModalOpen(false);
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error", { id: loadId });
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F5E6DA]">
      <Toaster position="top-center" reverseOrder={false} />
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-20 p-4 sm:p-6 md:p-8 lg:p-12 min-w-0">
        <div className="max-w-7xl mx-auto">
          
          <CategoryHeader 
            count={categories.length} 
            loading={loading} 
            onCreateOpen={() => { 
              setEditingId(null); 
              setForm({ name: '', description: '', displayOrder: 0, isActive: true }); 
              setIsModalOpen(true); 
            }} 
          />

          <CategoryTable 
            categories={categories} 
            loading={loading} 
            onEdit={(c) => { 
              setEditingId(c._id); 
              setForm(c); 
              setIsModalOpen(true); 
            }} 
            onDelete={handleDelete} 
          />
          
        </div>
      </main>

      {isModalOpen && (
        <CategoryForm 
            form={form} 
            setForm={setForm} 
            onSubmit={handleFormSubmit} 
            onClose={() => setIsModalOpen(false)} 
            isEditing={!!editingId} 
        />
      )}
    </div>
  );
};

export default CategoryPage;