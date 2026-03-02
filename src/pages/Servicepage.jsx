import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2'; // Import SweetAlert2
import { serviceApi } from '../api/serviceApi';
import { categoryService } from "../api/categoryService";
import Sidebar from '../components/Sidebar';
import ServiceRow from '../components/service/servicerow';
import ServiceForm from '../components/service/serviceform';
import toast, { Toaster } from 'react-hot-toast';
import { Plus, Loader2, Scissors } from 'lucide-react';

const EMPTY_FORM = {
  name: '',
  category: '',
  duration: 60,
  price: 0,
  depositPercentage: 0.30,
  description: '',
  genderRestriction: 'all',
  isActive: true,
};

const ServicePage = () => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [svcRes, catRes] = await Promise.all([
        serviceApi.getAll(),
        categoryService.getAll()
      ]);
      setServices(svcRes.data);
      setCategories(catRes.data);
    } catch (err) {
      toast.error('Failed to sync data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Handle Delete with SweetAlert ──
  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "This action cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#B62025', // Your custom Red
      cancelButtonColor: '#F3F4F6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'rounded-[32px] border-none shadow-2xl',
        confirmButton: 'rounded-xl px-6 py-3 text-xs font-black uppercase tracking-widest',
        cancelButton: 'rounded-xl px-6 py-3 text-xs font-black uppercase tracking-widest text-gray-600'
      },
      buttonsStyling: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        const deleting = toast.loading('Deleting...');
        try {
          await serviceApi.delete(id);
          toast.success('Service deleted', { id: deleting });
          fetchData();
        } catch (err) {
          toast.error('Failed to delete', { id: deleting });
        }
      }
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const loadId = toast.loading(editingId ? 'Updating...' : 'Creating...');
    try {
      if (editingId) {
        await serviceApi.update(editingId, form);
        toast.success('Service updated!', { id: loadId });
      } else {
        await serviceApi.create(form);
        toast.success('Service created!', { id: loadId });
      }
      setIsModalOpen(false);
      setEditingId(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong', { id: loadId });
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEdit = (s) => {
    setEditingId(s._id);
    setForm({
      name: s.name,
      category: s.category?._id || s.category,
      duration: s.duration,
      price: s.price,
      depositPercentage: s.depositPercentage,
      description: s.description,
      genderRestriction: s.genderRestriction,
      isActive: s.isActive,
    });
    setIsModalOpen(true);
  };

  const tableHeaders = ['Service Name', 'Category', 'Duration', 'Price', 'Deposit', 'Gender', 'Status', 'Actions'];

  return (
    <div className="flex min-h-screen bg-[#F5E6DA] transition-colors duration-500">
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
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 sm:mb-12">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-brand/15 flex items-center justify-center">
                  <Scissors className="w-4 h-4 text-brand" />
                </div>
                <span className="text-[10px] font-black text-brand uppercase tracking-[3px]">Lough Skin Admin</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tighter leading-none">
                Our <span className="text-[#22B8C8]">Services</span>
              </h1>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-8 h-[2px] bg-brand rounded-full"></div>
                <span className="text-xs text-gray-400 font-medium">
                  {!loading && `${services.length} ${services.length === 1 ? 'service' : 'services'}`}
                </span>
              </div>
            </div>

            <button
              onClick={openCreate}
              className="flex items-center justify-center gap-2 bg-brand hover:bg-[#24a1ad] text-white px-7 py-4 rounded-2xl font-black transition-all shadow-xl shadow-brand/20 active:scale-95 group self-start sm:self-auto shrink-0"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              <span className="uppercase tracking-wider text-sm">Add Service</span>
            </button>
          </div>

          {/* Table Card */}
          <div className="bg-white/70 backdrop-blur-md rounded-[32px] shadow-2xl shadow-brand-soft/20 border-white overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse" style={{ minWidth: '900px' }}>
                <thead className="bg-[#F5EDE4]/60 border-b border-brand-soft/20">
                  <tr>
                    {tableHeaders.map((h, i) => (
                      <th
                        key={h}
                        className={`px-8 py-6 text-[10px] uppercase tracking-[3px] font-black text-gray-400 whitespace-nowrap ${
                          i === 5 || i === 6 ? 'text-center' : i === 7 ? 'text-right' : ''
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100/60">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="py-32 text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-brand mx-auto mb-2" />
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Loading...</span>
                      </td>
                    </tr>
                  ) : services.length > 0 ? (
                    services.map((svc) => (
                      <ServiceRow
                        key={svc._id}
                        service={svc}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="py-24 text-center text-gray-400 font-black uppercase text-xs tracking-widest">No services yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {isModalOpen && (
        <ServiceForm
          form={form}
          setForm={setForm}
          onSubmit={handleFormSubmit}
          onClose={() => { setIsModalOpen(false); setEditingId(null); }}
          isEditing={!!editingId}
          categories={categories}
        />
      )}
    </div>
  );
};

export default ServicePage;