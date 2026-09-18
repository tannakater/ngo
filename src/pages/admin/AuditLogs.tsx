import React, { useEffect, useState, useMemo } from 'react';
import { useAuditStore, AuditLog, AuditCategory, AuditAction } from '../../store/useAuditStore';
import { 
  Activity, 
  Search, 
  Filter, 
  Download, 
  FileSpreadsheet, 
  FileCode, 
  RefreshCw, 
  ShieldCheck, 
  Heart, 
  Users, 
  UserCheck, 
  Settings, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  X, 
  Copy, 
  Check, 
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export function AuditLogs() {
  const { logs, isLoading, syncLogs, exportLogsToCSV, exportLogsToJSON } = useAuditStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [actionFilter, setActionFilter] = useState<string>('All');
  const [timeFilter, setTimeFilter] = useState<string>('all'); // 'all' | 'today' | '7days' | '30days'
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    syncLogs();
  }, [syncLogs]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    syncLogs();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter logs based on search, category, action, and time range
  const filteredLogs = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    return logs.filter(log => {
      // Search match
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch = !query || 
        log.details.toLowerCase().includes(query) ||
        log.performedBy.toLowerCase().includes(query) ||
        log.performedByEmail.toLowerCase().includes(query) ||
        (log.entity && log.entity.toLowerCase().includes(query)) ||
        (log.entityId && log.entityId.toLowerCase().includes(query)) ||
        (log.action && log.action.toLowerCase().includes(query));

      // Category match
      const matchesCategory = categoryFilter === 'All' || log.category === categoryFilter;

      // Action match
      const matchesAction = actionFilter === 'All' || log.action === actionFilter;

      // Time match
      const logTime = new Date(log.timestamp).getTime();
      let matchesTime = true;
      if (timeFilter === 'today') {
        matchesTime = logTime >= startOfToday;
      } else if (timeFilter === '7days') {
        matchesTime = logTime >= sevenDaysAgo;
      } else if (timeFilter === '30days') {
        matchesTime = logTime >= thirtyDaysAgo;
      }

      return matchesSearch && matchesCategory && matchesAction && matchesTime;
    });
  }, [logs, searchTerm, categoryFilter, actionFilter, timeFilter]);

  // Derived KPI Stats
  const stats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const todayCount = logs.filter(l => new Date(l.timestamp).getTime() >= startOfToday).length;
    const financialAudits = logs.filter(l => l.category === 'Donations' || l.action === 'Approved').length;
    const memberActions = logs.filter(l => l.category === 'Members' || l.category === 'Volunteers').length;
    const securityEvents = logs.filter(l => l.category === 'Security' || l.severity === 'warning' || l.severity === 'critical').length;

    return {
      total: logs.length,
      today: todayCount,
      financial: financialAudits,
      members: memberActions,
      security: securityEvents
    };
  }, [logs]);

  const categories: (AuditCategory | 'All')[] = [
    'All',
    'Donations',
    'Campaigns',
    'Programs',
    'Members',
    'Volunteers',
    'Security',
    'Settings',
    'Content',
    'ID Cards'
  ];

  const actions: (AuditAction | 'All')[] = [
    'All',
    'Created',
    'Updated',
    'Deleted',
    'Approved',
    'Rejected',
    'Security',
    'Exported'
  ];

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'Created':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Approved':
      case 'Verified':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Updated':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Deleted':
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Security':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Exported':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Donations':
        return <Heart className="w-3.5 h-3.5 text-rose-500" />;
      case 'Campaigns':
        return <Sparkles className="w-3.5 h-3.5 text-amber-500" />;
      case 'Programs':
        return <Layers className="w-3.5 h-3.5 text-blue-500" />;
      case 'Members':
        return <Users className="w-3.5 h-3.5 text-emerald-500" />;
      case 'Volunteers':
        return <UserCheck className="w-3.5 h-3.5 text-teal-500" />;
      case 'Security':
        return <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />;
      case 'Settings':
        return <Settings className="w-3.5 h-3.5 text-slate-500" />;
      case 'Content':
        return <FileText className="w-3.5 h-3.5 text-indigo-500" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const hasActiveFilters = searchTerm !== '' || categoryFilter !== 'All' || actionFilter !== 'All' || timeFilter !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('All');
    setActionFilter('All');
    setTimeFilter('all');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Export Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Security & Audit Trail</h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Institutional record log of all administrative actions, financial verifications, and member changes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Refresh logs from cloud"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => exportLogsToCSV(filteredLogs)}
            disabled={filteredLogs.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={() => exportLogsToJSON(filteredLogs)}
            disabled={filteredLogs.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-600" />
            Export JSON
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Events</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.total}</span>
            <span className="text-[11px] text-slate-400 font-medium">Recorded</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Today's Actions</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.today}</span>
            <span className="text-[11px] text-blue-600 font-medium">Past 24h</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Financial & Audits</span>
            <Heart className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.financial}</span>
            <span className="text-[11px] text-emerald-600 font-medium">Verified</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Security & Staff</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.security + stats.members}</span>
            <span className="text-[11px] text-slate-500 font-medium">Tracked</span>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col">
        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by action, details, actor name, email, or entity ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
            />
            {searchTerm && (
              <button 
                type="button" 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters Group */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={`cat-${c}`} value={c}>{c === 'All' ? 'All Categories' : c}</option>
                ))}
              </select>
            </div>

            {/* Action Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                {actions.map((a) => (
                  <option key={`act-${a}`} value={a}>{a === 'All' ? 'All Actions' : a}</option>
                ))}
              </select>
            </div>

            {/* Time Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="today">Today (24h)</option>
                <option value="7days">Past 7 Days</option>
                <option value="30days">Past 30 Days</option>
              </select>
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Showing Count Banner */}
        <div className="px-6 py-2 bg-slate-100/60 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
          <div>
            Showing <strong className="text-slate-800">{filteredLogs.length}</strong> of <strong className="text-slate-800">{logs.length}</strong> total audit records
          </div>
          {filteredLogs.length > 0 && (
            <div className="text-[11px] text-slate-400 hidden sm:block">
              Click any record to inspect complete verification payload
            </div>
          )}
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Timestamp & Activity</th>
                <th className="px-6 py-3.5">Action & Category</th>
                <th className="px-6 py-3.5">Entity & ID</th>
                <th className="px-6 py-3.5">Event Details</th>
                <th className="px-6 py-3.5">Actor / Admin</th>
                <th className="px-4 py-3.5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length > 0 ? (
                filteredLogs.map(log => {
                  let relativeTime = '';
                  try {
                    relativeTime = formatDistanceToNow(new Date(log.timestamp), { addSuffix: true });
                  } catch {
                    relativeTime = log.timestamp;
                  }

                  return (
                    <tr 
                      key={log.id} 
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Timestamp */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">
                            {format(new Date(log.timestamp), 'MMM d, yyyy')}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-300" />
                            {format(new Date(log.timestamp), 'HH:mm:ss')} • {relativeTime}
                          </span>
                        </div>
                      </td>

                      {/* Action & Category */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${getActionBadge(log.action)}`}>
                            {log.action}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                            {getCategoryIcon(log.category)}
                            {log.category}
                          </span>
                        </div>
                      </td>

                      {/* Entity & Ref ID */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-slate-800 font-bold">{log.entity}</span>
                          {log.entityId ? (
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(log.entityId!, log.id);
                              }}
                              className="text-[10px] font-mono text-slate-400 hover:text-emerald-600 flex items-center gap-1 cursor-pointer"
                              title="Click to copy ID"
                            >
                              {log.entityId.slice(0, 16)}...
                              {copiedId === log.id ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5 opacity-60" />}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-300">N/A</span>
                          )}
                        </div>
                      </td>

                      {/* Details */}
                      <td className="px-6 py-4 max-w-sm truncate" title={log.details}>
                        <span className="text-slate-700 font-medium">
                          {log.details}
                        </span>
                      </td>

                      {/* Performed By */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
                            {log.performedBy ? log.performedBy.charAt(0).toUpperCase() : 'A'}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-slate-900 font-bold leading-tight">{log.performedBy}</span>
                            <span className="text-slate-400 text-[10px]">{log.performedByEmail}</span>
                          </div>
                        </div>
                      </td>

                      {/* Action Chevron */}
                      <td className="px-4 py-4 text-right">
                        <button 
                          type="button"
                          className="p-1.5 text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Inspect Event"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="max-w-xs mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <Activity className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 mb-1">No Audit Logs Found</h3>
                      <p className="text-xs text-slate-500 mb-4">
                        {hasActiveFilters 
                          ? 'No activity records match your filter criteria. Try resetting the filters.'
                          : 'No administrative actions have been recorded yet.'}
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Inspection Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-2xl">
                  {getCategoryIcon(selectedLog.category)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Audit Record Details</h3>
                  <p className="text-xs text-slate-500 font-mono">Event ID: {selectedLog.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Top Banner Tag */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${getActionBadge(selectedLog.action)}`}>
                  Action: {selectedLog.action}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  Category: {selectedLog.category}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  <Clock className="w-3 h-3" />
                  {format(new Date(selectedLog.timestamp), 'PPpp')}
                </span>
              </div>

              {/* Event Details Narrative */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Event Summary</div>
                <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                  {selectedLog.details}
                </div>
              </div>

              {/* Details Key-Value Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white border border-slate-200 rounded-xl p-3.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Entity</div>
                  <div className="font-bold text-slate-800">{selectedLog.entity}</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Entity ID</div>
                  <div className="font-mono text-slate-700 truncate" title={selectedLog.entityId || 'N/A'}>
                    {selectedLog.entityId || 'N/A'}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Performed By</div>
                  <div className="font-bold text-slate-800">{selectedLog.performedBy}</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Actor Email</div>
                  <div className="font-medium text-slate-600 truncate" title={selectedLog.performedByEmail}>
                    {selectedLog.performedByEmail}
                  </div>
                </div>
              </div>

              {/* Structured Metadata (if available) */}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-emerald-600" />
                    Structured Payload Metadata
                  </div>
                  <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 text-xs font-mono overflow-x-auto max-h-48 border border-slate-800">
                    <pre>{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleCopy(JSON.stringify(selectedLog, null, 2), selectedLog.id)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {copiedId === selectedLog.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Copied JSON
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    Copy JSON
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
