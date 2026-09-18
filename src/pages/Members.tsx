import { getOptimizeImageUrl } from "../lib/utils";
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useOrgStore, Member } from '../store/useOrgStore';
import { 
  Search, Plus, Download, IdCard, Trash2, 
  Users, CheckCircle2, Edit3, HeartHandshake,
  RefreshCw, AlertCircle, Printer, Clock, Check
} from 'lucide-react';
import { cn } from '../utils';
import { AddMemberPanel } from '../components/AddMemberPanel';
import { QuickGenModal } from '../components/QuickGenModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { getCurrentAdminUser } from '../lib/auth';

export function Members({ initialTab = 'all' }: { initialTab?: string }) {
  const { members, deleteMember, updateMember } = useOrgStore();
  const adminUser = getCurrentAdminUser();
  const isMasterAdmin = adminUser?.role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  
  // High level directory tabs: 'active' | 'volunteers' | 'all'
  const [directoryTab, setDirectoryTab] = useState<'active' | 'volunteers' | 'all'>(
    initialTab === 'volunteers' ? 'volunteers' : 'active'
  );

  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [idStatusFilter, setIdStatusFilter] = useState<'All' | 'Issued' | 'NeedsRegen' | 'NotIssued'>('All');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);
  const [quickGenMemberId, setQuickGenMemberId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string; isReject?: boolean }>({
    isOpen: false,
    id: '',
    name: '',
    isReject: false
  });

  useEffect(() => {
    if (initialTab === 'volunteers') {
      setDirectoryTab('volunteers');
    } else {
      setDirectoryTab('active');
    }
  }, [initialTab]);

  const activeMembersList = members.filter(m => m.status === 'Active');
  const pendingVolunteersList = members.filter(m => 
    m.status === 'Pending' || 
    Boolean(m.designation?.toLowerCase().includes('applicant'))
  );

  const totalIssued = activeMembersList.filter(m => m.idCardGenerated && !m.needsRegeneration).length;
  const totalNeedsRegen = activeMembersList.filter(m => m.idCardGenerated && m.needsRegeneration).length;
  const totalNotIssued = activeMembersList.filter(m => !m.idCardGenerated).length;

  const filteredMembers = members.filter(member => {
    // 1. Directory Tab Filter
    if (directoryTab === 'active') {
      if (member.status !== 'Active') return false;
    } else if (directoryTab === 'volunteers') {
      if (member.status !== 'Pending' && !member.designation?.toLowerCase().includes('applicant')) {
        return false;
      }
    }

    // 2. Search
    const matchesSearch = 
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.department && member.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (member.designation && member.designation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // 3. Dropdown Filters
    const matchesRole = roleFilter === 'All' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || member.status === statusFilter;

    let matchesIdStatus = true;
    if (idStatusFilter === 'Issued') {
      matchesIdStatus = Boolean(member.idCardGenerated && !member.needsRegeneration);
    } else if (idStatusFilter === 'NeedsRegen') {
      matchesIdStatus = Boolean(member.idCardGenerated && member.needsRegeneration);
    } else if (idStatusFilter === 'NotIssued') {
      matchesIdStatus = !member.idCardGenerated;
    }

    return matchesSearch && matchesRole && matchesStatus && matchesIdStatus;
  });

  const handleAcceptVolunteer = async (member: Member) => {
    await updateMember(member.id, {
      status: 'Active',
      designation: 'Active Volunteer'
    });
    setActionSuccessMessage(`${member.firstName} ${member.lastName} has been accepted and activated! Member ID assigned.`);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  const exportCSV = () => {
    const headers = ['Member ID', 'First Name', 'Last Name', 'Role', 'Designation', 'Department', 'Email', 'Phone', 'Status', 'Blood Group'];
    const rows = filteredMembers.map(m => [
      m.memberId,
      `"${m.firstName}"`,
      `"${m.lastName}"`,
      m.role || 'Member',
      `"${m.designation || ''}"`,
      `"${m.department || ''}"`,
      m.email,
      m.phone || '',
      m.status,
      m.bloodGroup || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `members_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <AddMemberPanel 
        isOpen={isAddMemberOpen} 
        onClose={() => {
          setIsAddMemberOpen(false);
          setMemberToEdit(null);
        }} 
        memberToEdit={memberToEdit}
        onSaveAndRegenerate={(memberId) => {
          setIsAddMemberOpen(false);
          setMemberToEdit(null);
          setQuickGenMemberId(memberId);
        }}
      />
      <QuickGenModal 
        isOpen={quickGenMemberId !== null} 
        onClose={() => setQuickGenMemberId(null)} 
        initialMemberId={quickGenMemberId || undefined}
      />
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.isReject ? "Reject Volunteer Application" : "Remove Member"}
        message={deleteConfirm.isReject 
          ? `Are you sure you want to reject and remove the volunteer application for ${deleteConfirm.name}?`
          : `Are you sure you want to remove member ${deleteConfirm.name}? All associated records will be removed.`}
        confirmText={deleteConfirm.isReject ? "Reject Application" : "Remove Member"}
        onConfirm={() => deleteMember(deleteConfirm.id)}
        onClose={() => setDeleteConfirm({ isOpen: false, id: '', name: '', isReject: false })}
      />
      
      {/* Page Title & Top Actions */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {directoryTab === 'volunteers' ? 'Volunteer Applications & Requests' : 'Members & Staff Directory'}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {directoryTab === 'volunteers' 
              ? 'Review pending volunteer submissions. Without acceptance, applicants do not appear in the active member directory or public team section.'
              : 'Official roster of verified staff, active volunteers, and field members for ID credential issuance.'}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:flex-none flex flex-wrap items-center gap-2.5">
          {directoryTab !== 'volunteers' && (
            <div className="hidden lg:flex items-center gap-2 border-r border-slate-200 pr-3 mr-1 text-xs">
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {totalIssued} Issued
              </span>
              {totalNeedsRegen > 0 && (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-300 px-2.5 py-1 rounded-lg font-bold animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                  {totalNeedsRegen} Re-gen Available
                </span>
              )}
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg font-medium">
                {totalNotIssued} Not Issued
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={exportCSV}
            className="inline-flex items-center justify-center rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <Download className="-ml-0.5 mr-1.5 h-4 w-4 text-slate-400" aria-hidden="true" />
            Export CSV
          </button>

          {isMasterAdmin && (
            <Link
              to="/admin/id-cards/print"
              className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200"
              title="Batch print multiple ID cards onto A4 sheets"
            >
              <Printer className="-ml-0.5 mr-1.5 h-4 w-4 text-slate-500" />
              Batch Print PDF
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              setMemberToEdit(null);
              setIsAddMemberOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-colors"
          >
            <Plus className="-ml-0.5 mr-1.5 h-4 w-4" aria-hidden="true" />
            Add Member
          </button>
        </div>
      </div>

      {/* Action Success Alert */}
      {actionSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs font-semibold shadow-xs animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Directory Tab Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setDirectoryTab('active');
              setStatusFilter('All');
            }}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all",
              directoryTab === 'active'
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>Active Members & Staff</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full">
              {activeMembersList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDirectoryTab('volunteers');
              setStatusFilter('All');
            }}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all relative",
              directoryTab === 'volunteers'
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <HeartHandshake className="w-3.5 h-3.5 text-amber-600" />
            <span>Volunteer Requests</span>
            {pendingVolunteersList.length > 0 && (
              <span className="bg-amber-500 text-white font-bold text-[10px] px-1.5 py-0.2 rounded-full animate-pulse">
                {pendingVolunteersList.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setDirectoryTab('all');
              setStatusFilter('All');
            }}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all",
              directoryTab === 'all'
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <span>All Records</span>
            <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full">
              {members.length}
            </span>
          </button>
        </div>
      </div>

      {/* Notification Banner when pending applications exist */}
      {pendingVolunteersList.length > 0 && directoryTab === 'active' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-900">
                {pendingVolunteersList.length} Volunteer Application{pendingVolunteersList.length > 1 ? 's' : ''} Awaiting Review
              </div>
              <div className="text-[11px] text-amber-700">
                Pending applicants do not appear in this active directory or the public volunteer team showcase until accepted.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDirectoryTab('volunteers')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shrink-0 shadow-xs self-start sm:self-auto cursor-pointer"
          >
            Review Applications →
          </button>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Filter bar */}
        <div className="border-b border-slate-200 p-4 sm:flex sm:items-center sm:justify-between bg-slate-50 gap-4">
          <div className="relative rounded-xl max-w-xs w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              name="search"
              id="search"
              className="block w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              placeholder="Search by name, ID, role, or dept..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="mt-3 sm:mt-0 flex flex-wrap items-center gap-3">
            {directoryTab !== 'volunteers' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">ID Status:</span>
                <select
                  value={idStatusFilter}
                  onChange={e => setIdStatusFilter(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
                >
                  <option value="All">All Cards</option>
                  <option value="Issued">Issued & Valid ({totalIssued})</option>
                  <option value="NeedsRegen">Needs Re-gen ({totalNeedsRegen})</option>
                  <option value="NotIssued">Not Issued ({totalNotIssued})</option>
                </select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Role:</span>
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="All">All Roles</option>
                <option value="Staff">Staff</option>
                <option value="Volunteer">Volunteer</option>
                <option value="Member">Member</option>
                <option value="Executive">Executive</option>
              </select>
            </div>

            {directoryTab === 'all' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Status:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            )}

            <span className="text-xs font-medium text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-md">
              {filteredMembers.length} {filteredMembers.length === 1 ? 'record' : 'records'}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full divide-y divide-slate-200 text-xs text-left">
            <thead className="bg-slate-50 sticky top-0 z-10 text-slate-500 uppercase font-bold tracking-wider text-[11px]">
              <tr>
                <th scope="col" className="py-3 pl-4 pr-2 text-left">
                  {directoryTab === 'volunteers' ? 'Applicant' : 'Member'}
                </th>
                <th scope="col" className="px-2.5 py-3 text-left">
                  Official ID #
                </th>
                <th scope="col" className="px-2.5 py-3 text-left">
                  Role & Department
                </th>
                <th scope="col" className="px-2 py-3 text-left">
                  Status
                </th>
                {isMasterAdmin && directoryTab !== 'volunteers' && (
                  <th scope="col" className="px-2.5 py-3 text-left">
                    ID Card Credential
                  </th>
                )}
                <th scope="col" className="py-3 pl-2 pr-4 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 pl-4 pr-2">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 flex-shrink-0 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border border-slate-200">
                        {member.photoUrl ? (
                          <img className="h-full w-full object-cover" src={getOptimizeImageUrl(member.photoUrl)} alt="" />
                        ) : (
                          <span className="text-slate-500 text-xs font-bold">{member.firstName?.[0]}</span>
                        )}
                      </div>
                      <div className="min-w-0 max-w-[170px] sm:max-w-[200px]">
                        <div className="font-bold text-slate-900 truncate">{member.firstName} {member.lastName}</div>
                        <div className="text-slate-500 text-[11px] font-mono truncate">{member.email || member.phone || 'No contact info'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2.5 py-3 whitespace-nowrap">
                    <span className={cn(
                      "font-mono px-2 py-0.5 rounded font-bold text-[11px]",
                      member.memberId?.startsWith('PENDING')
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-800"
                    )}>
                      {member.memberId}
                    </span>
                  </td>
                  <td className="px-2.5 py-3">
                    <div className="font-bold text-emerald-700 text-xs leading-tight">{member.role || 'Volunteer'}</div>
                    <div className="text-slate-800 font-medium text-[11px] truncate max-w-[140px]">{member.designation || 'Volunteer'}</div>
                    <div className="text-slate-400 text-[10px] truncate max-w-[140px]">{member.department || 'General Support'}</div>
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                      member.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    )}>
                      {member.status}
                    </span>
                  </td>
                  {isMasterAdmin && directoryTab !== 'volunteers' && (
                    <td className="px-2.5 py-3 whitespace-nowrap">
                      {member.status === 'Pending' ? (
                        <span className="inline-flex items-center text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                          Awaiting Approval
                        </span>
                      ) : member.idCardGenerated && !member.needsRegeneration ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold w-fit">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" /> Issued
                          </span>
                          {member.idCardGeneratedAt && (
                            <span className="text-[10px] text-slate-400 mt-0.5 pl-1">
                              {new Date(member.idCardGeneratedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      ) : member.idCardGenerated && member.needsRegeneration ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold w-fit">
                            <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" /> Info Updated
                          </span>
                          <span className="text-[10px] text-amber-700 font-semibold mt-0.5 pl-1">
                            Re-gen ready
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-semibold w-fit">
                          Not Issued
                        </span>
                      )}
                    </td>
                  )}
                  <td className="py-3 pl-2 pr-4 text-right whitespace-nowrap">
                    <div className="flex justify-end items-center gap-1.5">
                      {member.status === 'Pending' ? (
                        <>
                          <button
                            type="button"
                            className="text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center py-1.5 px-3 rounded-lg transition-colors text-xs font-bold gap-1 shadow-sm cursor-pointer"
                            title="Accept Volunteer Request and Activate as Official Member"
                            onClick={() => handleAcceptVolunteer(member)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Accept & Activate</span>
                          </button>
                          <button
                            type="button"
                            className="text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 flex items-center justify-center py-1.5 px-2.5 rounded-lg transition-colors border border-rose-200 text-xs font-bold gap-1 shadow-xs cursor-pointer"
                            title="Reject Volunteer Request"
                            onClick={() => setDeleteConfirm({ isOpen: true, id: member.id, name: `${member.firstName} ${member.lastName}`, isReject: true })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Contextual ID Action for Active members */}
                          {isMasterAdmin && (
                            <>
                              {member.idCardGenerated && !member.needsRegeneration ? (
                                <button 
                                  type="button"
                                  className="text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center py-1 px-2.5 rounded-lg transition-colors border border-emerald-200 text-xs font-semibold gap-1 shadow-xs" 
                                  title="View, Print PDF or Download Issued ID Card"
                                  onClick={() => setQuickGenMemberId(member.id)}
                                >
                                  <Printer className="h-3.5 w-3.5" />
                                  <span>Print / View</span>
                                </button>
                              ) : member.idCardGenerated && member.needsRegeneration ? (
                                <button 
                                  type="button"
                                  className="text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 flex items-center justify-center py-1 px-2.5 rounded-lg transition-colors border border-amber-300 text-xs font-semibold gap-1 shadow-xs" 
                                  title="Re-generate and Print updated ID Card"
                                  onClick={() => setQuickGenMemberId(member.id)}
                                >
                                  <RefreshCw className="h-3.5 w-3.5 text-amber-700" />
                                  <span>Re-gen & Print</span>
                                </button>
                              ) : (
                                <button 
                                  type="button"
                                  className="text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 flex items-center justify-center py-1 px-2.5 rounded-lg transition-colors border border-blue-200 text-xs font-semibold gap-1 shadow-xs" 
                                  title="Generate and Print ID Card"
                                  onClick={() => setQuickGenMemberId(member.id)}
                                >
                                  <IdCard className="h-3.5 w-3.5" />
                                  <span>Generate</span>
                                </button>
                              )}
                            </>
                          )}
                          <button 
                            type="button"
                            onClick={() => {
                              setMemberToEdit(member);
                              setIsAddMemberOpen(true);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium px-2 py-1 border border-blue-100 bg-blue-50/50"
                            title="Edit Member Information"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>

                          <button 
                            type="button"
                            onClick={() => {
                              setDeleteConfirm({
                                isOpen: true,
                                id: member.id,
                                name: `${member.firstName} ${member.lastName}`,
                                isReject: false
                              });
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Member"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                    {directoryTab === 'volunteers' 
                      ? 'No pending volunteer requests found.'
                      : 'No active members found matching your search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
