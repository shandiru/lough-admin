import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import Sidebar from '../components/Sidebar';
import toast, { Toaster } from 'react-hot-toast';
import {
  Users, UserPlus, Loader2, Scissors, ToggleLeft, ToggleRight,
  Pencil, Trash2, Search, Mail, Clock, RefreshCw
} from 'lucide-react';
import StaffFormModal from '../components/Staff/StaffFormModal';
import StaffProfileModal from '../components/Staff/StaffProfileModal';

const GENDER_LABEL = { all: 'All', 'female-only': 'Female Only', 'male-only': 'Male Only' };

const StaffPage = () => {
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [viewStaff, setViewStaff] = useState(null);

  useEffect(() => {
    fetchStaff();
    fetchServices();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/staff');
      setStaff(res.data);
    } catch {
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await axiosInstance.get('/services');
      setServices(res.data);
    } catch {
      toast.error('Failed to load services');
    }
  };

  const handleToggleActive = async (id, name, isCurrentlyActive) => {
    const loadId = toast.loading('Updating...');
    try {
      const res = await axiosInstance.patch(`/staff/${id}/toggle-active`);
      setStaff(prev => prev.map(s => s._id === id ? res.data : s));
      toast.success(
        `${name} is now ${res.data.userId?.isActive ? 'Active ✓' : 'Inactive'}`,
        { id: loadId }
      );
    } catch {
      toast.error('Failed to update status', { id: loadId });
    }
  };

  const handleResendInvite = async (id, name) => {
    const loadId = toast.loading('Resending invite...');
    try {
      await axiosInstance.patch(`/staff/${id}/resend-invite`);
      toast.success(`Invite resent to ${name}!`, { id: loadId });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend invite', { id: loadId });
    }
  };

  const handleDelete = (id, name) => {
    toast(t => (
      <div className="flex flex-col gap-4 p-1">
        <p className="font-black text-gray-800 text-sm">Delete {name}?</p>
        <p className="text-xs text-gray-500">This will permanently delete the staff profile and their user account.</p>
        <div className="flex gap-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 px-4 py-2.5 bg-gray-100 text-xs font-black uppercase tracking-wider text-gray-600 hover:bg-gray-200 transition-colors rounded-lg"
          >Cancel</button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const delId = toast.loading('Deleting...');
              try {
                await axiosInstance.delete(`/staff/${id}`);
                toast.success('Staff deleted', { id: delId });
                fetchStaff();
              } catch {
                toast.error('Failed to delete', { id: delId });
              }
            }}
            className="flex-1 px-4 py-2.5 bg-[#B62025] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#9a1a1e] transition-colors"
          >Delete</button>
        </div>
      </div>
    ), { duration: 10000 });
  };

  const openEdit = (s) => {
    setEditData(s);
    setFormOpen(true);
    setViewStaff(null);
  };

  const filtered = staff.filter(s => {
    const name = `${s.userId?.firstName} ${s.userId?.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const activeCount = staff.filter(s => s.userId?.isActive).length;
  const pendingCount = staff.filter(s => !s.userId?.isActive).length;
  const onLeaveCount = staff.filter(s => s.isOnLeave).length;

  return (
    <div className="flex min-h-screen bg-[#F5E6DA] transition-colors duration-500">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'white', color: '#111', borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)', padding: '16px 20px',
          },
        }}
      />
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-20 p-4 sm:p-6 md:p-8 lg:p-12 min-w-0 transition-all duration-300">
        <div className="max-w-7xl mx-auto">

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 sm:mb-12">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-brand/15 flex items-center justify-center">
                  <Users className="w-4 h-4 text-brand" />
                </div>
                <span className="text-[10px] font-black text-brand uppercase tracking-[3px]">Lough Skin Admin</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tighter leading-none">
                Staff <span className="text-[#22B8C8]">Management</span>
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-[2px] bg-brand rounded-full" />
                  <span className="text-xs text-gray-400 font-medium">{staff.length} total</span>
                </div>
                {activeCount > 0   && <span className="text-xs text-emerald-500 font-bold">{activeCount} active</span>}
                {pendingCount > 0  && <span className="text-xs text-amber-500 font-bold">{pendingCount} pending setup</span>}
                {onLeaveCount > 0  && <span className="text-xs text-orange-400 font-bold">{onLeaveCount} on leave</span>}
              </div>
            </div>

            <button
              onClick={() => { setEditData(null); setFormOpen(true); }}
              className="flex items-center justify-center gap-2 bg-brand hover:bg-[#24a1ad] text-white px-7 py-4 rounded-2xl font-black transition-all shadow-xl shadow-brand/20 active:scale-95 group self-start sm:self-auto shrink-0"
            >
              <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span className="uppercase tracking-wider text-sm">Add Staff</span>
            </button>
          </div>

          {/* ── Search ── */}
          <div className="relative mb-8 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search staff by name..."
              className="w-full pl-11 pr-5 py-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-transparent focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none text-sm font-medium text-gray-700 placeholder:text-gray-300 transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* ── Content ── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-brand" />
              <p className="font-black tracking-[4px] text-[10px] uppercase text-gray-400">Loading Staff...</p>
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map(s => (
                <StaffCard
                  key={s._id}
                  staff={s}
                  onView={() => setViewStaff(s)}
                  onEdit={() => openEdit(s)}
                  onToggle={() => handleToggleActive(s._id, s.userId?.firstName, s.userId?.isActive)}
                  onDelete={() => handleDelete(s._id, `${s.userId?.firstName} ${s.userId?.lastName}`)}
                  onResendInvite={() => handleResendInvite(s._id, s.userId?.firstName)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center">
                <Users className="w-7 h-7 text-brand/40" />
              </div>
              <p className="font-black text-gray-400 uppercase tracking-[3px] text-xs">
                {search ? 'No staff match your search' : 'No staff yet'}
              </p>
              {!search && (
                <p className="text-gray-300 text-xs">Click "Add Staff" to create your first staff member</p>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── Modals ── */}
      {formOpen && (
        <StaffFormModal
          services={services}
          editData={editData}
          onClose={() => { setFormOpen(false); setEditData(null); }}
          onSuccess={() => { setFormOpen(false); setEditData(null); fetchStaff(); }}
        />
      )}
      {viewStaff && (
        <StaffProfileModal
          staff={viewStaff}
          onClose={() => setViewStaff(null)}
          onEdit={() => openEdit(viewStaff)}
        />
      )}
    </div>
  );
};

// ── Staff Card ──────────────────────────────────────────────────────────────
const StaffCard = ({ staff, onView, onEdit, onToggle, onDelete, onResendInvite }) => {
  const u = staff.userId || {};
  const isActive = u.isActive;
  const isPending = !isActive;
  const initials = `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className={`bg-white/70 backdrop-blur-md rounded-[28px] p-6 shadow-xl border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group ${
      isActive ? 'border-white' : 'border-dashed border-gray-200 opacity-80'
    }`}>

      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-13 h-13 w-12 h-12 rounded-2xl bg-gradient-to-br from-brand to-[#1a8f9a] flex items-center justify-center text-white font-black text-lg shadow-lg shadow-brand/25 shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-black text-gray-900 text-sm leading-tight truncate">
              {u.firstName} {u.lastName}
            </p>
            <p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">{u.email}</p>
          </div>
        </div>

        {/* Active toggle */}
        <button onClick={onToggle} title={isActive ? 'Deactivate' : 'Activate'} className="p-1 shrink-0">
          {isActive
            ? <ToggleRight className="w-7 h-7 text-emerald-500" />
            : <ToggleLeft  className="w-7 h-7 text-gray-300" />
          }
        </button>
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
          isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-500'
        }`}>
          {isActive ? 'Active' : 'Pending Setup'}
        </span>
        {staff.isOnLeave && (
          <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-orange-100 text-orange-500">
            On Leave
          </span>
        )}
        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-brand/10 text-brand">
          {GENDER_LABEL[staff.genderRestriction]}
        </span>
      </div>

      {/* Skills */}
      {staff.skills?.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Scissors className="w-3 h-3 text-gray-300" />
            <span className="text-[9px] font-black text-gray-300 uppercase tracking-[2px]">Skills</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {staff.skills.slice(0, 3).map(sk => (
              <span key={sk._id} className="text-[10px] font-semibold px-2 py-1 bg-[#F5EDE4] text-gray-600 rounded-lg">
                {sk.name}
              </span>
            ))}
            {staff.skills.length > 3 && (
              <span className="text-[10px] font-semibold px-2 py-1 bg-[#F5EDE4] text-gray-400 rounded-lg">
                +{staff.skills.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Last login / pending hint */}
      {isActive && u.lastLogin ? (
        <div className="flex items-center gap-1.5 mb-4">
          <Clock className="w-3 h-3 text-gray-200" />
          <span className="text-[10px] text-gray-300 font-medium">
            Last login: {new Date(u.lastLogin).toLocaleDateString('en-GB')}
          </span>
        </div>
      ) : isPending ? (
        <div className="flex items-center gap-1.5 mb-4">
          <Mail className="w-3 h-3 text-amber-400" />
          <span className="text-[10px] text-amber-400 font-bold">Awaiting account setup</span>
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-gray-100">
        <button onClick={onView}
          className="flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest bg-[#F5EDE4] hover:bg-brand/10 text-gray-500 hover:text-brand rounded-xl transition-colors"
        >View</button>

        <button onClick={onEdit}
          className="p-2.5 rounded-xl bg-brand/10 hover:bg-brand/20 text-brand transition-colors"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>

        {isPending && (
          <button onClick={onResendInvite}
            className="p-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-500 transition-colors"
            title="Resend invite email"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}

        <button onClick={onDelete}
          className="p-2.5 rounded-xl bg-[#B62025]/10 hover:bg-[#B62025]/20 text-[#B62025] transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default StaffPage;