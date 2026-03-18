import { useState, useCallback, useEffect } from 'react';
import { Plus, Search, List, Calendar, AlertTriangle, Loader2, Eye, RefreshCw } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import { serviceApi } from '../api/serviceApi';
import { staffService } from '../api/staffService';
import { getAllBookings } from '../api/bookingService';
import { STATUS_CLS } from '../components/Booking/constants';
import CreateBookingModal from '../components/Booking/CreateBookingModal';
import BookingDrawer from '../components/Booking/BookingDrawer';
import CalendarView from '../components/Booking/CalendarView';

export default function AdminBookingPage() {
  const [bookings,     setBookings]  = useState([]);
  const [services,     setServices]  = useState([]);
  const [staffList,    setStaffList] = useState([]);
  const [loading,      setLoading]   = useState(true);
  const [showModal,    setModal]     = useState(false);
  const [search,       setSearch]    = useState('');
  const [filterStatus, setFStatus]   = useState('all');
  const [filterCancel, setFCancel]   = useState(false);
  const [selected,     setSelected]  = useState(null);
  const [viewMode,     setViewMode]  = useState('list');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [bRes, sRes, stRes] = await Promise.all([
        getAllBookings(),
        serviceApi.getAll(),
        staffService.getAll(),
      ]);
      setBookings(Array.isArray(bRes) ? bRes : bRes.data || []);
      setServices(sRes.data || []);
      const stData = stRes.data || stRes || [];
      setStaffList(Array.isArray(stData) ? stData : []);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pendingCancelCount = bookings.filter(b => b.cancelRequestStatus === 'pending').length;

  const filtered = bookings.filter(b => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !b.customerName?.toLowerCase().includes(q) &&
        !b.customerEmail?.toLowerCase().includes(q) &&
        !b.bookingNumber?.toLowerCase().includes(q)
      ) return false;
    }
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
    if (filterCancel && b.cancelRequestStatus !== 'pending') return false;
    return true;
  });

  return (
    <div className="flex h-screen bg-[#F5E6DA] overflow-hidden">
      <Sidebar />
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: '12px', fontWeight: 600, fontSize: 13 } }} />

      <main className="flex-1 overflow-auto">
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Bookings</h1>
            <p className="text-xs text-gray-400 mt-0.5">{bookings.length} total · {filtered.length} shown</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-[#22B8C8] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <List size={13} /> List
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'calendar' ? 'bg-white text-[#22B8C8] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Calendar size={13} /> Calendar
              </button>
            </div>

            {pendingCancelCount > 0 && (
              <button
                onClick={() => setFCancel(c => !c)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border-2 transition-all ${
                  filterCancel
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-orange-50 text-orange-600 border-orange-200 hover:border-orange-400'
                }`}
              >
                <AlertTriangle size={13} /> {pendingCancelCount} Cancel Request{pendingCancelCount > 1 ? 's' : ''}
              </button>
            )}

            <button
              onClick={() => setModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-[#22B8C8] to-[#1a9aad] text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:-translate-y-0.5 hover:shadow-md transition-all"
            >
              <Plus size={16} /> New Booking
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {viewMode === 'calendar' ? (
            <CalendarView staffList={staffList} onSelectBooking={b => setSelected(b)} />
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search name, email, booking #..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#22B8C8] focus:ring-2 focus:ring-[#22B8C8]/10 bg-white"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={e => setFStatus(e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:border-[#22B8C8] font-medium"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no-show">No Show</option>
                </select>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 size={28} className="animate-spin text-[#22B8C8]" />
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          {['Booking #', 'Customer', 'Service', 'Staff', 'Date & Time', 'Status', 'Total', 'Paid', ''].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filtered.length === 0 ? (
                          <tr><td colSpan={9} className="text-center py-16 text-gray-400 text-sm">No bookings found</td></tr>
                        ) : filtered.map(b => {
                          const hasCancelReq = b.cancelRequestStatus === 'pending';
                          return (
                            <tr
                              key={b._id}
                              onClick={() => setSelected(b)}
                              className={`hover:bg-gray-50 transition-colors cursor-pointer ${hasCancelReq ? 'bg-orange-50/50' : ''}`}
                            >
                              <td className="px-4 py-3">
                                <p className="font-mono text-xs font-bold text-[#22B8C8]">{b.bookingNumber}</p>
                                {hasCancelReq && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full mt-1">
                                    <RefreshCw size={9} /> Cancel req
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-semibold text-gray-800">{b.customerName}</p>
                                <p className="text-xs text-gray-400">{b.customerEmail}</p>
                              </td>
                              <td className="px-4 py-3 text-gray-600">{b.service?.name || '—'}</td>
                              <td className="px-4 py-3 text-gray-600">
                                {b.staffMember?.userId
                                  ? `${b.staffMember.userId.firstName} ${b.staffMember.userId.lastName}`
                                  : '—'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <p className="text-gray-700 font-medium">{new Date(b.bookingDate).toLocaleDateString('en-GB')}</p>
                                <p className="text-xs text-gray-400">{b.bookingTime}</p>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize border ${STATUS_CLS[b.status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                  {b.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-bold text-gray-800">£{(b.totalAmount / 100).toFixed(2)}</td>
                              <td className="px-4 py-3">
                                <span className={`text-xs font-semibold ${
                                  b.paymentStatus === 'paid'     ? 'text-green-500' :
                                  b.paymentStatus === 'refunded' ? 'text-blue-500'  : 'text-amber-500'
                                }`}>
                                  {b.paymentStatus === 'paid'
                                    ? `£${(b.paidAmount / 100).toFixed(2)} paid`
                                    : b.paymentStatus}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <Eye size={15} className="text-gray-300 hover:text-[#22B8C8]" />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {showModal && (
        <CreateBookingModal
          services={services}
          onClose={() => setModal(false)}
          onCreated={b => setBookings(p => [b, ...p])}
        />
      )}
      {selected && (
        <BookingDrawer
          booking={selected}
          onClose={() => setSelected(null)}
          onUpdated={() => { setSelected(null); load(); }}
        />
      )}
    </div>
  );
}
