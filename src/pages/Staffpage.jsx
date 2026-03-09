import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import toast, { Toaster } from 'react-hot-toast';
import { Loader2, Users, ChevronLeft, ChevronRight } from 'lucide-react';

import { staffService } from '../api/staffService';
import { serviceApi } from '../api/serviceApi';
import Sidebar from '../components/Sidebar';
import StaffFormModal from '../components/Staff/Staffformmodal';
import StaffProfileModal from '../components/Staff/Staffprofilemodal';
import StaffCard from '../components/Staff/StaffCard';
import { StaffHeader, SearchBar } from '../components/Staff/StaffUI';

const ITEMS_PER_PAGE = 3;

const StaffPage = () => {
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [viewStaff, setViewStaff] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [staffRes, serviceRes] = await Promise.all([
        staffService.getAll(),
        serviceApi.getAll(),
      ]);
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
      text: 'This will permanently remove the staff profile and user account.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#B62025',
      cancelButtonColor: '#E5E7EB',
      confirmButtonText: 'DELETE NOW',
      cancelButtonText: 'CANCEL',
      customClass: {
        popup: 'rounded-[24px] bg-white',
        confirmButton: 'rounded-xl px-6 py-3 font-black text-xs tracking-widest',
        cancelButton: 'rounded-xl px-6 py-3 font-black text-xs tracking-widest text-gray-600',
      },
    });

    if (result.isConfirmed) {
      const delId = toast.loading('Deleting...');
      try {
        await staffService.delete(id);
        setStaff(prev => prev.filter(s => s._id !== id));
        toast.success('Staff deleted', { id: delId });
        // If deleting last item on current page, go back one page
        setCurrentPage(prev => {
          const newFiltered = staff.filter(s => s._id !== id).filter(s =>
            `${s.userId?.firstName} ${s.userId?.lastName}`.toLowerCase().includes(search.toLowerCase())
          );
          const maxPage = Math.max(1, Math.ceil(newFiltered.length / ITEMS_PER_PAGE));
          return prev > maxPage ? maxPage : prev;
        });
      } catch {
        toast.error('Delete failed', { id: delId });
      }
    }
  };

  const filtered = staff.filter(s =>
    `${s.userId?.firstName} ${s.userId?.lastName}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const goTo = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Build page number array: always show first, last, current ±1, with ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
    return Array.from(pages)
      .filter(p => p >= 1 && p <= totalPages)
      .sort((a, b) => a - b);
  };

  const pageNumbers = getPageNumbers();

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
              <p className="font-black tracking-[4px] text-[10px] uppercase text-gray-400">
                Loading Staff...
              </p>
            </div>
          ) : filtered.length > 0 ? (
            <>
              {/* Staff Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginated.map(s => (
                  <StaffCard
                    key={s._id}
                    staff={s}
                    onView={() => setViewStaff(s)}
                    onEdit={() => { setEditData(s); setFormOpen(true); }}
                    onToggle={() => handleToggleActive(s._id, s.userId?.firstName)}
                    onResendInvite={() => handleResendInvite(s._id, s.userId?.firstName)}
                    onDelete={() => handleDelete(s._id, s.userId?.firstName)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-10 px-1">
                  {/* Result count */}
                  <p className="text-[11px] font-black uppercase tracking-[3px] text-gray-400">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                    {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}{' '}
                    <span className="text-gray-300">of</span> {filtered.length} staff
                  </p>

                  {/* Page controls */}
                  <div className="flex items-center gap-1.5">
                    {/* Prev */}
                    <button
                      onClick={() => goTo(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/70 border border-white text-gray-400 hover:text-brand hover:border-brand/30 hover:bg-brand/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Page numbers */}
                    {pageNumbers.map((page, idx) => {
                      const prevPage = pageNumbers[idx - 1];
                      const showEllipsis = prevPage && page - prevPage > 1;
                      return (
                        <React.Fragment key={page}>
                          {showEllipsis && (
                            <span className="w-9 h-9 flex items-center justify-center text-[11px] font-black text-gray-300">
                              ···
                            </span>
                          )}
                          <button
                            onClick={() => goTo(page)}
                            className={`w-9 h-9 flex items-center justify-center rounded-xl text-[11px] font-black transition-all shadow-sm ${
                              page === currentPage
                                ? 'bg-brand text-white shadow-brand/25 shadow-lg scale-105'
                                : 'bg-white/70 border border-white text-gray-400 hover:text-brand hover:border-brand/30 hover:bg-brand/5'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}

                    {/* Next */}
                    <button
                      onClick={() => goTo(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/70 border border-white text-gray-400 hover:text-brand hover:border-brand/30 hover:bg-brand/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 gap-4 opacity-40">
              <Users className="w-12 h-12" />
              <p className="font-black uppercase tracking-widest text-xs">No Staff Found</p>
            </div>
          )}
        </div>
      </main>

      {formOpen && (
        <StaffFormModal
          services={services}
          editData={editData}
          onClose={() => setFormOpen(false)}
          onSuccess={() => { setFormOpen(false); loadData(); }}
        />
      )}
      {viewStaff && (
        <StaffProfileModal
          staff={viewStaff}
          onClose={() => setViewStaff(null)}
          onEdit={() => { setEditData(viewStaff); setFormOpen(true); setViewStaff(null); }}
        />
      )}
    </div>
  );
};

export default StaffPage;