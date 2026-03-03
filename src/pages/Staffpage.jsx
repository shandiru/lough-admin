import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import toast, { Toaster } from 'react-hot-toast';
import { Loader2, Users } from 'lucide-react';

import { staffService } from '../api/staffService';
import  {serviceApi} from '../api/serviceApi'
import Sidebar from '../components/Sidebar';
import StaffFormModal from '../components/Staff/Staffformmodal';
import StaffProfileModal from '../components/Staff/Staffprofilemodal';
import StaffCard from '../components/Staff/StaffCard';
import { StaffHeader, SearchBar } from '../components/Staff/StaffUI';

const StaffPage = () => {
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [viewStaff, setViewStaff] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [staffRes, serviceRes] = await Promise.all([staffService.getAll(), serviceApi. getAll()]);
      setStaff(staffRes.data);
      setServices(serviceRes.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id, name) => {
    const loadId = toast.loading('Updating...');
    try {
      const res = await staffService.toggleActive(id);
      setStaff(prev => prev.map(s => s._id === id ? res.data : s));
      toast.success(`${name} status updated`, { id: loadId });
    } catch {
      toast.error('Update failed', { id: loadId });
    }
  };

  const handleResendInvite = async (id, name) => {
    const loadId = toast.loading('Resending...');
    try {
      await staffService.resendInvite(id);
      toast.success(`Invite sent to ${name}`, { id: loadId });
    } catch {
      toast.error('Failed to resend', { id: loadId });
    }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: `<span class="text-gray-800">Delete ${name}?</span>`,
      text: "This will permanently remove the staff profile and user account.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#B62025',
      cancelButtonColor: '#E5E7EB',
      confirmButtonText: 'DELETE NOW',
      cancelButtonText: 'CANCEL',
      customClass: {
        popup: 'rounded-[24px] bg-white',
        confirmButton: 'rounded-xl px-6 py-3 font-black text-xs tracking-widest',
        cancelButton: 'rounded-xl px-6 py-3 font-black text-xs tracking-widest text-gray-600'
      }
    });

    if (result.isConfirmed) {
      const delId = toast.loading('Deleting...');
      try {
        await staffService.delete(id);
        setStaff(prev => prev.filter(s => s._id !== id));
        toast.success('Staff deleted', { id: delId });
      } catch {
        toast.error('Delete failed', { id: delId });
      }
    }
  };

  const filtered = staff.filter(s => `${s.userId?.firstName} ${s.userId?.lastName}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex min-h-screen bg-[#F5E6DA]">
      <Toaster position="top-center" />
      <Sidebar />
      <main className="flex-1 ml-0 lg:ml-20 p-4 sm:p-6 md:p-8 lg:p-12 min-w-0">
        <div className="max-w-7xl mx-auto">
          <StaffHeader 
            count={staff.length}
            active={staff.filter(s => s.userId?.isActive).length}
            pending={staff.filter(s => !s.userId?.isActive).length}
            onAdd={() => { setEditData(null); setFormOpen(true); }}
          />
          <SearchBar value={search} onChange={setSearch} />

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-brand" />
              <p className="font-black tracking-[4px] text-[10px] uppercase text-gray-400">Loading Staff...</p>
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map(s => (
                <StaffCard key={s._id} staff={s} 
                  onView={() => setViewStaff(s)} 
                  onEdit={() => { setEditData(s); setFormOpen(true); }} 
                  onToggle={() => handleToggleActive(s._id, s.userId?.firstName)}
                  onResendInvite={() => handleResendInvite(s._id, s.userId?.firstName)}
                  onDelete={() => handleDelete(s._id, s.userId?.firstName)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 gap-4 opacity-40">
              <Users className="w-12 h-12" />
              <p className="font-black uppercase tracking-widest text-xs">No Staff Found</p>
            </div>
          )}
        </div>
      </main>

      {formOpen && (
        <StaffFormModal services={services} editData={editData} 
          onClose={() => setFormOpen(false)} 
          onSuccess={() => { setFormOpen(false); loadData(); }} 
        />
      )}
      {viewStaff && <StaffProfileModal staff={viewStaff} onClose={() => setViewStaff(null)} onEdit={() => { setEditData(viewStaff); setFormOpen(true); setViewStaff(null); }} />}
    </div>
  );
};

export default StaffPage;