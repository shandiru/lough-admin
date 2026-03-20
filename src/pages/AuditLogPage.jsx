import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import { auditLogService } from '../api/auditLogService';
import {
  ShieldCheck, Search, RefreshCw, ChevronLeft, ChevronRight,
  X, Filter, Clock, User, Tag, FileText, AlertCircle, Loader2,
  ChevronsLeft, ChevronsRight, Info, ChevronDown, ChevronUp,
} from 'lucide-react';

// ── Colour mapping for entity badges ─────────────────────────────────────────
const ENTITY_COLORS = {
  booking:  'bg-blue-100 text-blue-700',
  staff:    'bg-purple-100 text-purple-700',
  leave:    'bg-orange-100 text-orange-700',
  service:  'bg-teal-100 text-teal-700',
  category: 'bg-yellow-100 text-yellow-700',
  auth:     'bg-green-100 text-green-700',
  profile:  'bg-pink-100 text-pink-700',
  payment:  'bg-red-100 text-red-700',
};

// ── Colour mapping for action verbs ──────────────────────────────────────────
const actionColor = (action = '') => {
  const a = action.toLowerCase();
  if (a.includes('delet') || a.includes('cancel') || a.includes('reject')) return 'text-red-600';
  if (a.includes('creat') || a.includes('approv') || a.includes('activ'))  return 'text-green-600';
  if (a.includes('updat') || a.includes('edit')   || a.includes('resend')) return 'text-blue-600';
  if (a.includes('login') || a.includes('invite') || a.includes('verif'))  return 'text-purple-600';
  return 'text-gray-600';
};

const ENTITIES = ['booking', 'staff', 'leave', 'service', 'category', 'auth', 'profile', 'payment'];
const LIMITS   = [25, 50, 100];

// ── Small JSON preview ────────────────────────────────────────────────────────
function JsonPreview({ data }) {
  if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) return null;
  return (
    <pre className="bg-gray-50 border border-gray-200 rounded-lg text-xs p-3 overflow-x-auto max-h-40 text-gray-700 mt-2">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

// ── Detail drawer for a single log ───────────────────────────────────────────
function LogDetailDrawer({ log, onClose }) {
  if (!log) return null;
  const entity  = log.entity || '';
  const badgeCls = ENTITY_COLORS[entity] || 'bg-gray-100 text-gray-600';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-[#F5E6DA]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#22B8C8]" />
            <span className="font-bold text-gray-800">Audit Log Detail</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/10 text-gray-500">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Action + Entity */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeCls}`}>
              {entity}
            </span>
            <span className={`text-sm font-bold ${actionColor(log.action)}`}>{log.action}</span>
          </div>

          {/* Description */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-700 leading-relaxed">{log.description}</p>
          </div>

          {/* Meta row */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-gray-400 font-semibold mb-1 flex items-center gap-1"><User size={11} /> Performed By</p>
              <p className="font-bold text-gray-800">{log.performedByName || 'System'}</p>
              <p className="text-gray-400 capitalize">{log.performedByRole}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-gray-400 font-semibold mb-1 flex items-center gap-1"><Clock size={11} /> Timestamp</p>
              <p className="font-bold text-gray-800">
                {new Date(log.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-gray-400">
                {new Date(log.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Entity ID */}
          {log.entityId && (
            <div className="text-xs">
              <p className="text-gray-400 font-semibold mb-1 flex items-center gap-1"><Tag size={11} /> Entity ID</p>
              <p className="font-mono text-gray-700 bg-gray-100 rounded px-2 py-1 break-all">{log.entityId}</p>
            </div>
          )}

          {/* IP */}
          {log.ip && (
            <div className="text-xs">
              <p className="text-gray-400 font-semibold mb-1">IP Address</p>
              <p className="font-mono text-gray-700">{log.ip}</p>
            </div>
          )}

          {/* Before / After */}
          {log.before && (
            <div>
              <p className="text-xs text-gray-400 font-semibold mb-1 flex items-center gap-1"><FileText size={11} /> Before</p>
              <JsonPreview data={log.before} />
            </div>
          )}
          {log.after && (
            <div>
              <p className="text-xs text-gray-400 font-semibold mb-1 flex items-center gap-1"><FileText size={11} /> After</p>
              <JsonPreview data={log.after} />
            </div>
          )}
          {log.meta && (
            <div>
              <p className="text-xs text-gray-400 font-semibold mb-1">Meta</p>
              <JsonPreview data={log.meta} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Single log row ────────────────────────────────────────────────────────────
function LogRow({ log, onClick }) {
  const entity   = log.entity || '';
  const badgeCls = ENTITY_COLORS[entity] || 'bg-gray-100 text-gray-600';

  return (
    <div
      onClick={() => onClick(log)}
      className="group flex items-start gap-3 px-4 py-3.5 border-b border-gray-50 hover:bg-[#F5E6DA]/40 cursor-pointer transition-colors"
    >
      {/* Entity badge */}
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 shrink-0 capitalize ${badgeCls}`}>
        {entity}
      </span>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-bold ${actionColor(log.action)} mb-0.5`}>{log.action}</p>
        <p className="text-sm text-gray-700 truncate">{log.description}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          by <span className="font-semibold text-gray-500">{log.performedByName || 'System'}</span>
          <span className="mx-1 text-gray-300">·</span>
          <span className="capitalize">{log.performedByRole}</span>
        </p>
      </div>

      {/* Time */}
      <div className="text-right shrink-0">
        <p className="text-xs font-semibold text-gray-500">
          {new Date(log.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
        </p>
        <p className="text-[11px] text-gray-400">
          {new Date(log.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      <ChevronRight size={14} className="text-gray-300 group-hover:text-[#22B8C8] transition-colors mt-1 shrink-0" />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AuditLogPage() {
  const [logs,        setLogs]        = useState([]);
  const [total,       setTotal]       = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [actions,     setActions]     = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [page,   setPage]   = useState(1);
  const [limit,  setLimit]  = useState(50);
  const [search, setSearch] = useState('');
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');
  const [from,   setFrom]   = useState('');
  const [to,     setTo]     = useState('');

  // Applied (search is applied on submit)
  const [appliedSearch, setAppliedSearch] = useState('');

  const fetchLogs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const params = { page, limit };
      if (appliedSearch) params.search = appliedSearch;
      if (entity) params.entity = entity;
      if (action) params.action = action;
      if (from)   params.from   = from;
      if (to)     params.to     = to;

      const res  = await auditLogService.getLogs(params);
      const data = res.data;
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, limit, appliedSearch, entity, action, from, to]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    auditLogService.getDistinctActions()
      .then(r => setActions(r.data || []))
      .catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(search);
  };

  const clearFilters = () => {
    setSearch('');
    setAppliedSearch('');
    setEntity('');
    setAction('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  const hasFilters = entity || action || from || to || appliedSearch;

  const filterSelect = 'w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#22B8C8]/30 text-gray-700';

  return (
    <div className="flex h-screen bg-[#F5E6DA] overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-auto">

        {/* ── Top Bar ─────────────────────────────────────────────────────── */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#22B8C8]/10 flex items-center justify-center">
              <ShieldCheck size={18} className="text-[#22B8C8]" />
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900">Audit Logs</h1>
              <p className="text-xs text-gray-400">Full system activity trail — {total.toLocaleString()} records</p>
            </div>
          </div>
          <button
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
            className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[#22B8C8] px-3 py-2 rounded-xl hover:bg-[#22B8C8]/10 transition-all"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">

          {/* ── Search + Filter row ────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search descriptions, actions, performer names…"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22B8C8]/30 text-gray-700"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#22B8C8] text-white text-sm font-bold rounded-xl hover:bg-[#1aa3b2] transition-colors"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-xl border transition-colors ${
                  showFilters || hasFilters
                    ? 'bg-[#22B8C8]/10 text-[#22B8C8] border-[#22B8C8]/30'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Filter size={13} />
                Filters
                {hasFilters && (
                  <span className="bg-[#22B8C8] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {[entity, action, from, to, appliedSearch].filter(Boolean).length}
                  </span>
                )}
                {showFilters ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </form>

            {/* ── Expanded filters ─────────────────────────────────────────── */}
            {showFilters && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Entity</label>
                  <select value={entity} onChange={e => { setEntity(e.target.value); setPage(1); }} className={filterSelect}>
                    <option value="">All Entities</option>
                    {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Action</label>
                  <select value={action} onChange={e => { setAction(e.target.value); setPage(1); }} className={filterSelect}>
                    <option value="">All Actions</option>
                    {actions.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">From</label>
                  <input
                    type="date" value={from}
                    onChange={e => { setFrom(e.target.value); setPage(1); }}
                    className={filterSelect}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">To</label>
                  <input
                    type="date" value={to}
                    onChange={e => { setTo(e.target.value); setPage(1); }}
                    className={filterSelect}
                  />
                </div>

                {hasFilters && (
                  <div className="col-span-2 md:col-span-4 flex justify-end">
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <X size={12} /> Clear all filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Log list ─────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Table header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-gray-50/50">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                {loading ? 'Loading…' : `${total.toLocaleString()} total · page ${page} of ${totalPages}`}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Per page:</span>
                <select
                  value={limit}
                  onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none text-gray-600"
                >
                  {LIMITS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            {/* Rows */}
            {loading ? (
              <div className="flex items-center justify-center py-20 text-gray-400">
                <Loader2 size={24} className="animate-spin text-[#22B8C8]" />
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-2">
                <AlertCircle size={32} className="text-gray-200" />
                <p className="font-semibold text-sm">No audit logs found</p>
                {hasFilters && <p className="text-xs">Try adjusting your filters</p>}
              </div>
            ) : (
              <div>
                {logs.map(log => (
                  <LogRow key={log._id} log={log} onClick={setSelectedLog} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 px-4 py-4 border-t border-gray-50">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30"
                >
                  <ChevronsLeft size={15} />
                </button>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30"
                >
                  <ChevronLeft size={15} />
                </button>

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce((acc, p, i, arr) => {
                    if (i > 0 && p - arr[i - 1] > 1) acc.push('…');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '…' ? (
                      <span key={`ellipsis-${i}`} className="text-gray-400 text-xs px-1">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                          p === page
                            ? 'bg-[#22B8C8] text-white shadow'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )
                }

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30"
                >
                  <ChevronRight size={15} />
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30"
                >
                  <ChevronsRight size={15} />
                </button>
              </div>
            )}
          </div>

          {/* ── Legend ──────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info size={13} className="text-gray-400" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Entity Legend</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {ENTITIES.map(e => (
                <span key={e} className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${ENTITY_COLORS[e]}`}>
                  {e}
                </span>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* ── Detail drawer ────────────────────────────────────────────────────── */}
      {selectedLog && (
        <LogDetailDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}
