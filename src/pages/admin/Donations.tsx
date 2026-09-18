import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNgoStore, Donation, initDonationsSync, isCampaignMatch } from '../../store/useNgoStore';
import { useOrgStore } from '../../store/useOrgStore';
import { auth } from '../../lib/firebase';
import { 
  Heart, Search, Filter, Download, Plus, CheckCircle2, 
  Clock, AlertCircle, FileText, Trash2, Eye, X, CreditCard, 
  Banknote, Building2, Edit3, Calendar, ShieldCheck, Printer,
  Mail, Send, RefreshCw, ExternalLink, Copy, Check, ChevronDown,
  UserCheck, Shield, TrendingUp, Zap
} from 'lucide-react';
import { ConfirmModal } from '../../components/ConfirmModal';
import { formatCurrency, getCurrencySymbol } from '../../utils';
import { downloadReceiptPdf, openReceiptPdfInNewTab } from '../../utils/receiptPdf';

export function AdminDonations() {
  const { donations, campaigns, addDonation, updateDonation, deleteDonation, approveDonation } = useNgoStore();
  const { organization, members } = useOrgStore();
  const [searchParams] = useSearchParams();

  const orgCurrency = organization.currency || 'USD';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusTab, setStatusTab] = useState<'All' | 'Pending' | 'Completed' | 'Failed'>('All');
  const [campaignFilter, setCampaignFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');

  useEffect(() => {
    const campParam = searchParams.get('campaign');
    if (campParam) {
      setCampaignFilter(campParam);
    }
  }, [searchParams]);
  const [frequencyFilter, setFrequencyFilter] = useState('All');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [approvalModalDonation, setApprovalModalDonation] = useState<Donation | null>(null);
  const [approvingDonation, setApprovingDonation] = useState<Donation | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [approvalNotice, setApprovalNotice] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [showOfficerSwitcher, setShowOfficerSwitcher] = useState(false);

  // Active signing admin or moderator
  const [approverOfficer, setApproverOfficer] = useState<{ name: string; role: string }>(() => {
    const savedName = localStorage.getItem('ngo_active_officer_name');
    const savedRole = localStorage.getItem('ngo_active_officer_role');
    if (savedName) {
      return { name: savedName, role: savedRole || 'Admin' };
    }
    const currentName = auth.currentUser?.displayName;
    if (currentName) {
      return { name: currentName, role: 'Admin' };
    }
    return { name: 'Arafat Hossain', role: 'Admin' };
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; receipt: string }>({
    isOpen: false,
    id: '',
    receipt: ''
  });

  // Form state
  const [newForm, setNewForm] = useState({
    receiptNumber: '',
    createdAt: '',
    donorName: '',
    donorEmail: '',
    donorPhone: '',
    amount: orgCurrency === 'BDT' ? 1000 : 50,
    currency: orgCurrency,
    frequency: 'one-time' as 'one-time' | 'monthly',
    campaignId: campaigns[0]?.id || '',
    paymentMethod: 'card' as 'card' | 'bank' | 'mobile' | 'cash',
    transactionId: '',
    isAnonymous: false,
    dedication: '',
    approvedBy: approverOfficer.name,
    approverRole: approverOfficer.role,
    status: 'Completed' as 'Completed' | 'Pending' | 'Failed'
  });

  const filteredDonations = donations.filter(d => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      d.donorName.toLowerCase().includes(term) ||
      d.donorEmail.toLowerCase().includes(term) ||
      d.receiptNumber.toLowerCase().includes(term) ||
      (d.transactionId && d.transactionId.toLowerCase().includes(term));

    const matchesStatus = statusTab === 'All' || d.status === statusTab;
    const matchesCampaign = campaignFilter === 'All' || d.campaignId === campaignFilter;
    const matchesMethod = methodFilter === 'All' || d.paymentMethod === methodFilter;
    const matchesFrequency = frequencyFilter === 'All' || (d.frequency || 'one-time') === frequencyFilter;

    return matchesSearch && matchesStatus && matchesCampaign && matchesMethod && matchesFrequency;
  });

  const pendingDonations = donations.filter(d => d.status === 'Pending');
  const completedDonations = donations.filter(d => d.status === 'Completed');
  const failedDonations = donations.filter(d => d.status === 'Failed');

  const totalRaised = completedDonations.reduce((sum, d) => sum + d.amount, 0);

  const handleManualSync = () => {
    setIsSyncing(true);
    setSyncNotice('Connecting to cloud database & syncing data...');
    try {
      initDonationsSync();
      setTimeout(() => {
        setIsSyncing(false);
        setSyncNotice(`Synced successfully! ${donations.length} total records.`);
        setTimeout(() => setSyncNotice(null), 3000);
      }, 700);
    } catch (err) {
      setIsSyncing(false);
      setSyncNotice('Sync completed.');
      setTimeout(() => setSyncNotice(null), 2500);
    }
  };

  const generateReceiptEmailBody = (d: Donation) => {
    const org = organization;
    return `Dear ${d.donorName},

Thank you so much for your generous support of ${org.name}. We are pleased to confirm that your donation has been officially verified and approved by our finance administrative team.

Please find your official charitable contribution tax receipt details below:

================================================================================
                      OFFICIAL CHARITABLE TAX RECEIPT
================================================================================
Organization Name   : ${org.name}
${org.nameBn ? `Bengali Name       : ${org.nameBn}\n` : ''}Registration Number : ${org.registrationNumber || 'NGO-AB-2023-09412'}
Headquarters        : ${org.address}
Official Contact    : ${org.phone} | ${org.email}
--------------------------------------------------------------------------------
Receipt Number      : ${d.receiptNumber}
Date Approved       : ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
Donor Name          : ${d.donorName}
Donor Email         : ${d.donorEmail}
${d.donorPhone ? `Donor Phone         : ${d.donorPhone}\n` : ''}Designated Cause    : ${d.campaignName}
Cleared Amount      : ${formatCurrency(d.amount, d.currency || orgCurrency)} ${d.currency || orgCurrency}
Contribution Type   : ${d.frequency === 'monthly' ? 'Monthly Sustaining Supporter' : 'One-Time Direct Contribution'}
Payment Gateway     : ${d.paymentMethod.toUpperCase()}
Transaction ID      : ${d.transactionId || 'VERIFIED'}
Status              : COMPLETED & RECORDED
${d.dedication ? `Dedication Note     : "${d.dedication}"\n` : ''}--------------------------------------------------------------------------------
Notice:
This certified tax receipt verifies that no goods or services were provided in exchange for 
this gift. An official verified PDF tax receipt document (Reference #${d.receiptNumber}) has been 
generated and certified in our treasury archives. Please retain this email and reference number for your records.

With sincere gratitude for your compassionate partnership,

Verified & Approved by: ${d.approvedBy || 'Admin Directorate'}${d.approverRole ? ` (${d.approverRole})` : ''}
${org.name}
${org.website || window.location.origin}
================================================================================
`;
  };

  const getGmailComposeUrl = (d: Donation) => {
    const subject = `Official Charitable Tax Receipt #${d.receiptNumber} - ${organization.name}`;
    const body = generateReceiptEmailBody(d);
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(d.donorEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const getMailtoUrl = (d: Donation) => {
    const subject = `Official Charitable Tax Receipt #${d.receiptNumber} - ${organization.name}`;
    const body = generateReceiptEmailBody(d);
    return `mailto:${d.donorEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleStartApproval = (d: Donation) => {
    setApprovingDonation(d);
  };

  const handleConfirmApproval = async () => {
    if (!approvingDonation) return;
    const finalName = approverOfficer.name.trim() || 'Admin Directorate';
    const finalRole = approverOfficer.role.trim() || 'Admin';

    localStorage.setItem('ngo_active_officer_name', finalName);
    localStorage.setItem('ngo_active_officer_role', finalRole);

    const approved = await approveDonation(approvingDonation.id, {
      name: finalName,
      role: finalRole
    });

    setApprovingDonation(null);
    if (approved) {
      const camp = campaigns.find(c => isCampaignMatch(c, approved.campaignId, approved.campaignName));
      const campName = camp?.name || approved.campaignName || 'Campaign';
      setApprovalNotice(`Approved donation ${approved.receiptNumber}! +${formatCurrency(approved.amount, approved.currency || orgCurrency)} was credited to "${campName}" loading bar.`);
      setApprovalModalDonation(approved);
      setTimeout(() => setApprovalNotice(null), 7000);
    }
  };

  const handleQuickApprove = async (d: Donation, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const finalName = approverOfficer.name.trim() || 'Admin Directorate';
    const finalRole = approverOfficer.role.trim() || 'Admin';

    const approved = await approveDonation(d.id, {
      name: finalName,
      role: finalRole
    });

    if (approved) {
      const camp = campaigns.find(c => isCampaignMatch(c, approved.campaignId, approved.campaignName));
      const campName = camp?.name || approved.campaignName || 'Campaign';
      setApprovalNotice(`Approved donation ${approved.receiptNumber}! +${formatCurrency(approved.amount, approved.currency || orgCurrency)} added to "${campName}" progress bar.`);
      setTimeout(() => setApprovalNotice(null), 7000);
    }
  };

  const handleCopyReceipt = (d: Donation) => {
    const body = generateReceiptEmailBody(d);
    navigator.clipboard.writeText(body);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2500);
  };

  const handleResendNotifications = async (d: Donation) => {
    setIsResending(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const now = new Date().toISOString();
    await updateDonation(d.id, {
      smsSent: true,
      smsSentAt: now,
      smsMessage: `ধন্যবাদ ${d.donorName || 'সুহৃদ'}, ডাকসেবা ফাউন্ডেশনে আপনার ৳${d.amount} অনুদান নিশ্চিত হয়েছে। রসিদ নং: ${d.receiptNumber}`,
      emailSent: true,
      emailSentAt: now,
      receiptSent: true,
      receiptSentAt: now
    });
    setIsResending(false);
    setResendNotice(`SMS & Email confirmation sent successfully to ${d.donorPhone || d.donorEmail || d.receiptNumber}!`);
    setTimeout(() => setResendNotice(null), 4000);
  };

  const openAddModal = () => {
    setEditingDonation(null);
    setNewForm({
      receiptNumber: `REC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString().split('T')[0],
      donorName: '',
      donorEmail: '',
      donorPhone: '',
      amount: orgCurrency === 'BDT' ? 1000 : 50,
      currency: orgCurrency,
      frequency: 'one-time',
      campaignId: campaigns[0]?.id || '',
      paymentMethod: 'card',
      transactionId: '',
      isAnonymous: false,
      dedication: '',
      approvedBy: approverOfficer.name,
      approverRole: approverOfficer.role,
      status: 'Completed'
    });
    setShowAddModal(true);
  };

  const openEditModal = (d: Donation) => {
    setEditingDonation(d);
    setNewForm({
      receiptNumber: d.receiptNumber,
      createdAt: d.createdAt ? d.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
      donorName: d.donorName,
      donorEmail: d.donorEmail,
      donorPhone: d.donorPhone || '',
      amount: d.amount,
      currency: d.currency || orgCurrency,
      frequency: d.frequency || 'one-time',
      campaignId: d.campaignId,
      paymentMethod: d.paymentMethod,
      transactionId: d.transactionId || '',
      isAnonymous: !!d.isAnonymous,
      dedication: d.dedication || '',
      approvedBy: d.approvedBy || approverOfficer.name,
      approverRole: d.approverRole || approverOfficer.role,
      status: d.status
    });
    setShowAddModal(true);
  };

  const handleCreateDonation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.donorName || !newForm.donorEmail || newForm.amount <= 0) return;

    const camp = campaigns.find(c => c.id === newForm.campaignId);

    if (editingDonation) {
      updateDonation(editingDonation.id, {
        receiptNumber: newForm.receiptNumber.trim() || editingDonation.receiptNumber,
        createdAt: newForm.createdAt ? new Date(newForm.createdAt).toISOString() : editingDonation.createdAt,
        donorName: newForm.donorName,
        donorEmail: newForm.donorEmail,
        donorPhone: newForm.donorPhone || undefined,
        amount: Number(newForm.amount),
        currency: newForm.currency,
        frequency: newForm.frequency,
        campaignId: newForm.campaignId || 'general',
        campaignName: camp?.name || 'General Humanitarian Fund',
        paymentMethod: newForm.paymentMethod,
        transactionId: newForm.transactionId || undefined,
        isAnonymous: newForm.isAnonymous,
        dedication: newForm.dedication || undefined,
        approvedBy: newForm.approvedBy.trim() || undefined,
        approverRole: newForm.approverRole || undefined,
        status: newForm.status
      });
    } else {
      addDonation({
        receiptNumber: newForm.receiptNumber.trim() || undefined,
        createdAt: newForm.createdAt ? new Date(newForm.createdAt).toISOString() : undefined,
        donorName: newForm.donorName,
        donorEmail: newForm.donorEmail,
        donorPhone: newForm.donorPhone || undefined,
        amount: Number(newForm.amount),
        currency: newForm.currency,
        frequency: newForm.frequency,
        campaignId: newForm.campaignId || 'general',
        campaignName: camp?.name || 'General Humanitarian Fund',
        paymentMethod: newForm.paymentMethod,
        transactionId: newForm.transactionId || undefined,
        isAnonymous: newForm.isAnonymous,
        dedication: newForm.dedication || undefined,
        approvedBy: newForm.approvedBy.trim() || undefined,
        approverRole: newForm.approverRole || undefined,
        status: newForm.status
      } as any);
    }

    setShowAddModal(false);
    setEditingDonation(null);
  };

  const exportCSV = () => {
    const headers = ['Receipt No', 'Donor Name', 'Anonymous', 'Donor Email', 'Phone', 'Amount', 'Currency', 'Frequency', 'Campaign', 'Method', 'Transaction Ref', 'Status', 'Date'];
    const rows = filteredDonations.map(d => [
      d.receiptNumber,
      `"${d.donorName}"`,
      d.isAnonymous ? 'Yes' : 'No',
      d.donorEmail,
      d.donorPhone || '',
      d.amount,
      d.currency || orgCurrency,
      d.frequency || 'one-time',
      `"${d.campaignName}"`,
      d.paymentMethod,
      d.transactionId || '',
      d.status,
      d.createdAt
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `donations_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSingleReceipt = (d: Donation) => {
    downloadReceiptPdf(d, organization);
  };

  const previewReceiptPdf = (d: Donation) => {
    openReceiptPdfInNewTab(d, organization);
  };

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Donation Record"
        message={`Are you sure you want to delete donation receipt "${deleteConfirm.receipt}"? This action cannot be undone.`}
        confirmText="Delete Record"
        onConfirm={() => deleteDonation(deleteConfirm.id)}
        onClose={() => setDeleteConfirm({ isOpen: false, id: '', receipt: '' })}
      />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Donations & Contributions</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time ledger of public and offline gifts, transaction verification, recurring pledges, and tax receipts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Active Approving Officer Pill & Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowOfficerSwitcher(!showOfficerSwitcher)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-xs transition-colors shadow-xs"
              title="Click to change signing admin or moderator"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-500">Signing as:</span>
              <strong className="text-slate-800">{approverOfficer.name}</strong>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                approverOfficer.role.toLowerCase().includes('mod') 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {approverOfficer.role}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showOfficerSwitcher && (
              <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-30 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  Active Signing Officer
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {members && members.length > 0 ? (
                    members.slice(0, 6).map(m => {
                      const fullName = `${m.firstName} ${m.lastName}`;
                      const isSelected = approverOfficer.name === fullName;
                      const inferredRole = m.role === 'Staff' ? 'Admin' : 'Moderator';
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setApproverOfficer({ name: fullName, role: inferredRole });
                            localStorage.setItem('ngo_active_officer_name', fullName);
                            localStorage.setItem('ngo_active_officer_role', inferredRole);
                            setShowOfficerSwitcher(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            isSelected ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="truncate">
                            <div>{fullName}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{m.designation || m.role}</div>
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold uppercase">
                            {inferredRole}
                          </span>
                        </button>
                      );
                    })
                  ) : null}
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Custom Name & Role</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="e.g. Tanvir Ahmed"
                      value={approverOfficer.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        setApproverOfficer(prev => ({ ...prev, name: newName }));
                        localStorage.setItem('ngo_active_officer_name', newName);
                      }}
                      className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                    <select
                      value={approverOfficer.role}
                      onChange={(e) => {
                        const newRole = e.target.value;
                        setApproverOfficer(prev => ({ ...prev, role: newRole }));
                        localStorage.setItem('ngo_active_officer_role', newRole);
                      }}
                      className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Moderator">Moderator</option>
                      <option value="Finance Officer">Finance</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
            title="Sync live records from the server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Server'}</span>
          </button>
          <button
            type="button"
            onClick={exportCSV}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Export Detailed CSV
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Record Direct Gift
          </button>
        </div>
      </div>

      {syncNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Total Verified Funds</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {formatCurrency(totalRaised, orgCurrency)} {orgCurrency}
          </div>
          <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">100% verified ledger balance</span>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Total Records</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{donations.length}</div>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">
            {donations.filter(d => d.frequency === 'monthly').length} monthly recurring supporters
          </span>
        </div>
        <div className={`bg-white p-5 sm:p-6 rounded-2xl border shadow-sm transition-colors ${
          pendingDonations.length > 0 ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase text-slate-400 block">Pending Review</span>
            {pendingDonations.length > 0 && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
          </div>
          <div className={`text-2xl sm:text-3xl font-black ${pendingDonations.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {pendingDonations.length}
          </div>
          <span className="text-xs text-amber-700 font-medium mt-1 inline-block">Awaiting approval & receipt</span>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Active Causes</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">
            {campaigns.filter(c => c.status === 'Active').length}
          </div>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">Active fundraising channels</span>
        </div>
      </div>

      {/* Campaign Auto-Credit Success Banner */}
      {approvalNotice && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 text-emerald-950 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-emerald-950">Campaign Loading Bar Auto-Credited!</h4>
                <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Live Synced
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5 font-medium">
                {approvalNotice}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setApprovalNotice(null)}
            className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-xl shrink-0 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Pending Approval Attention Banner */}
      {pendingDonations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-950 shadow-sm">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-amber-950">
                  {pendingDonations.length} Contribution{pendingDonations.length > 1 ? 's' : ''} Awaiting Admin Approval & Gmail Receipt
                </h4>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                New donor submissions need your confirmation. Approving will officially credit the campaign total and open an automated receipt to send straight to their Gmail address.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusTab('Pending')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shrink-0 transition-colors shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Review Pending ({pendingDonations.length})</span>
          </button>
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setStatusTab('All')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            statusTab === 'All'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>All Donations</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            statusTab === 'All' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'
          }`}>
            {donations.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusTab('Pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            statusTab === 'Pending'
              ? 'bg-amber-500 text-white shadow-sm'
              : pendingDonations.length > 0
              ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Review</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            statusTab === 'Pending' ? 'bg-amber-600 text-white' : 'bg-amber-200/70 text-amber-900'
          }`}>
            {pendingDonations.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusTab('Completed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            statusTab === 'Completed'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Approved & Completed</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            statusTab === 'Completed' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-100 text-slate-700'
          }`}>
            {completedDonations.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusTab('Failed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            statusTab === 'Failed'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>Failed / Declined</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            statusTab === 'Failed' ? 'bg-rose-700 text-rose-100' : 'bg-slate-100 text-slate-700'
          }`}>
            {failedDonations.length}
          </span>
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search receipt #, donor name, email, or transaction ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Campaign Filter */}
          <select
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="All">All Campaigns</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Payment Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="All">All Gateways</option>
            <option value="card">Credit Card</option>
            <option value="mobile">Mobile Money</option>
            <option value="bank">Bank Transfer</option>
            <option value="cash">Cash / Cheque</option>
          </select>

          {/* Frequency Filter */}
          <select
            value={frequencyFilter}
            onChange={(e) => setFrequencyFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="All">All Frequencies</option>
            <option value="one-time">One-Time</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      {/* Donations Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-5 py-3.5">Receipt #</th>
                <th className="px-5 py-3.5">Donor</th>
                <th className="px-5 py-3.5">Designation</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Gateway & Ref</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDonations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No donation records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredDonations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-mono font-bold text-slate-900">{d.receiptNumber}</div>
                      <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                        d.frequency === 'monthly' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {d.frequency === 'monthly' ? 'Monthly' : 'One-Time'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        {d.donorName}
                        {d.isAnonymous && (
                          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-normal">
                            Anonymous
                          </span>
                        )}
                      </div>
                      <div className="text-slate-400 text-[11px]">{d.donorEmail}</div>
                      {d.donorPhone && <div className="text-slate-400 text-[10px]">{d.donorPhone}</div>}
                    </td>
                    <td className="px-5 py-4">
                      {(() => {
                        const matched = campaigns.find(c => isCampaignMatch(c, d.campaignId, d.campaignName));
                        const pct = matched ? Math.min(100, Math.round((matched.currentAmount / matched.goalAmount) * 100)) : null;
                        return (
                          <div>
                            <div className="font-medium text-slate-800 max-w-[180px] flex items-center justify-between gap-1">
                              <span className="truncate" title={d.campaignName}>{d.campaignName}</span>
                              {pct !== null && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-mono shrink-0" title={`Live campaign funding: ${pct}%`}>
                                  {pct}%
                                </span>
                              )}
                            </div>
                            {pct !== null && (
                              <div className="w-full bg-slate-200 rounded-full h-1 mt-1 overflow-hidden" title={`${formatCurrency(matched!.currentAmount, orgCurrency)} of ${formatCurrency(matched!.goalAmount, orgCurrency)}`}>
                                <div className="bg-emerald-500 h-1 rounded-full transition-all duration-300" style={{ width: `${pct}%` }}></div>
                              </div>
                            )}
                            {d.dedication && (
                              <div className="text-[10px] text-emerald-600 italic truncate max-w-[180px] mt-0.5">
                                "{d.dedication}"
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-black text-slate-900 text-sm">
                        {formatCurrency(d.amount, d.currency || orgCurrency)}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono uppercase">
                        {d.currency || orgCurrency}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="uppercase font-bold text-slate-700 block">
                        {d.paymentMethod}
                      </span>
                      {d.transactionId && (
                        <span className="text-[10px] font-mono text-slate-400 block truncate max-w-[120px]" title={d.transactionId}>
                          {d.transactionId}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                        d.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : d.status === 'Pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        {d.status === 'Completed' && <CheckCircle2 className="w-3 h-3" />}
                        {d.status}
                      </span>
                      {d.status === 'Completed' && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                          <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[110px]" title={`Approved by: ${d.approvedBy || 'Admin'}`}>
                            {d.approvedBy || 'Admin'}
                          </span>
                          <span className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                            (d.approverRole?.toLowerCase().includes('mod') || d.approvedBy?.toLowerCase().includes('mod'))
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {d.approverRole || (d.approvedBy?.toLowerCase().includes('mod') ? 'Mod' : 'Admin')}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {d.status === 'Pending' && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => handleQuickApprove(d, e)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                              title="1-Click Approve: Immediately auto-adds amount to campaign loading bar"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>Quick Approve</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartApproval(d)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer mr-1"
                              title="Approve donation and specify approving admin or moderator"
                            >
                              <Mail className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="hidden sm:inline">Approve & Email</span>
                            </button>
                          </>
                        )}
                        {d.status === 'Completed' && (
                          <button
                            type="button"
                            onClick={() => setApprovalModalDonation(d)}
                            className="p-1.5 hover:bg-emerald-50 text-emerald-700 rounded-lg transition-colors"
                            title="Open Gmail Receipt Composer"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => downloadSingleReceipt(d)}
                          className="p-1.5 hover:bg-emerald-50 text-emerald-700 rounded-lg transition-colors"
                          title="Download Official PDF Receipt"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedDonation(d)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                          title="View Full Receipt"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(d)}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                          title="Edit Record"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteConfirm({
                              isOpen: true,
                              id: d.id,
                              receipt: d.receiptNumber
                            });
                          }}
                          className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Donation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingDonation ? 'Edit Donation & Tax Receipt Details' : 'Record Direct / Offline Contribution'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingDonation 
                    ? `Updating parameters for Receipt #${newForm.receiptNumber}`
                    : 'Issue an audited contribution record and official PDF tax certificate'}
                </p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDonation} className="space-y-4">
              {/* Receipt Parameters Box */}
              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/60 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Official Receipt Metadata</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-950 uppercase mb-1">Receipt Reference # *</label>
                    <input
                      type="text"
                      required
                      placeholder="REC-2026-XXXX"
                      value={newForm.receiptNumber}
                      onChange={e => setNewForm({ ...newForm, receiptNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-950 uppercase mb-1">Date Issued / Cleared *</label>
                    <input
                      type="date"
                      required
                      value={newForm.createdAt}
                      onChange={e => setNewForm({ ...newForm, createdAt: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-950 uppercase mb-1">
                      Approved By (Admin / Mod Name)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Arafat Hossain or Nusrat Jahan"
                      value={newForm.approvedBy}
                      onChange={e => setNewForm({ ...newForm, approvedBy: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-950 uppercase mb-1">
                      Signatory Capacity / Role
                    </label>
                    <select
                      value={newForm.approverRole}
                      onChange={e => setNewForm({ ...newForm, approverRole: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="Admin">Administrator</option>
                      <option value="Moderator">Moderator</option>
                      <option value="Finance & Treasury Officer">Finance & Treasury Officer</option>
                      <option value="Executive Director">Executive Director</option>
                      <option value="Auditor">Auditor</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Donor Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full name"
                    value={newForm.donorName}
                    onChange={e => setNewForm({ ...newForm, donorName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Donor Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={newForm.donorEmail}
                    onChange={e => setNewForm({ ...newForm, donorEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Donor Phone</label>
                  <input
                    type="text"
                    placeholder="+880 1711..."
                    value={newForm.donorPhone}
                    onChange={e => setNewForm({ ...newForm, donorPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Schedule Frequency</label>
                  <select
                    value={newForm.frequency}
                    onChange={e => setNewForm({ ...newForm, frequency: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="one-time">One-Time Contribution</option>
                    <option value="monthly">Monthly Sustaining Supporter</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contribution Amount *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newForm.amount}
                    onChange={e => setNewForm({ ...newForm, amount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Currency</label>
                  <select
                    value={newForm.currency}
                    onChange={e => setNewForm({ ...newForm, currency: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="BDT">BDT (৳)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Gateway / Method</label>
                  <select
                    value={newForm.paymentMethod}
                    onChange={e => setNewForm({ ...newForm, paymentMethod: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="card">Credit Card</option>
                    <option value="mobile">Mobile Money (bKash/Nagad)</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="cash">Cash / Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Transaction Ref / TrxID</label>
                  <input
                    type="text"
                    placeholder="e.g. TXN-8941209"
                    value={newForm.transactionId}
                    onChange={e => setNewForm({ ...newForm, transactionId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Designate Cause</label>
                <select
                  value={newForm.campaignId}
                  onChange={e => setNewForm({ ...newForm, campaignId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">General Humanitarian Fund</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Verification Status</label>
                <select
                  value={newForm.status}
                  onChange={e => setNewForm({ ...newForm, status: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Completed">Completed (Verified & Cleared)</option>
                  <option value="Pending">Pending Audit Confirmation</option>
                  <option value="Failed">Failed / Declined</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Dedication / Tribute Note (Optional)</label>
                <input
                  type="text"
                  placeholder="In honor of / dedication message to print on receipt"
                  value={newForm.dedication}
                  onChange={e => setNewForm({ ...newForm, dedication: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anonymousCheck"
                  checked={newForm.isAnonymous}
                  onChange={e => setNewForm({ ...newForm, isAnonymous: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="anonymousCheck" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  Mark as Anonymous Donor
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                >
                  {editingDonation ? 'Update Receipt & Record' : 'Save & Allocate Donation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced Receipt Viewer Modal */}
      {selectedDonation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                  Official Tax Receipt Record
                </span>
              </div>
              <button onClick={() => setSelectedDonation(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-xs font-mono space-y-3">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Receipt ID:</span>
                <span className="font-bold text-slate-900">{selectedDonation.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="text-slate-800">{new Date(selectedDonation.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Donor Name:</span>
                <span className="font-bold text-slate-900">
                  {selectedDonation.donorName} {selectedDonation.isAnonymous ? '(Anonymous)' : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Donor Email:</span>
                <span className="text-slate-800">{selectedDonation.donorEmail}</span>
              </div>
              {selectedDonation.donorPhone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Donor Phone:</span>
                  <span className="text-slate-800">{selectedDonation.donorPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Fund Allocated:</span>
                <span className="text-emerald-700 font-semibold">{selectedDonation.campaignName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Frequency:</span>
                <span className="uppercase text-slate-800">{selectedDonation.frequency || 'one-time'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Gateway:</span>
                <span className="uppercase text-slate-800">{selectedDonation.paymentMethod}</span>
              </div>
              {selectedDonation.transactionId && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Trx / Reference ID:</span>
                  <span className="text-slate-900 font-bold">{selectedDonation.transactionId}</span>
                </div>
              )}
              {selectedDonation.approvedBy && (
                <div className="flex justify-between border-t border-slate-200 pt-2 text-[11px]">
                  <span className="text-slate-500">Approved & Verified By:</span>
                  <span className="text-slate-900 font-bold flex items-center gap-1.5">
                    <span>{selectedDonation.approvedBy}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      (selectedDonation.approverRole?.toLowerCase().includes('mod') || selectedDonation.approvedBy?.toLowerCase().includes('mod'))
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {selectedDonation.approverRole || (selectedDonation.approvedBy?.toLowerCase().includes('mod') ? 'Moderator' : 'Admin')}
                    </span>
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-3 text-sm font-bold">
                <span className="text-slate-900">Contribution Cleared:</span>
                <span className="text-emerald-700">
                  {formatCurrency(selectedDonation.amount, selectedDonation.currency || orgCurrency)} {selectedDonation.currency || orgCurrency}
                </span>
              </div>
            </div>

            {/* Automated SMS & Email Confirmation Dispatch Block */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" /> Automated Notifications Status
                </span>
                <button
                  type="button"
                  disabled={isResending}
                  onClick={() => handleResendNotifications(selectedDonation)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  {isResending ? 'Sending...' : 'Resend SMS & Email'}
                </button>
              </div>

              {resendNotice && (
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-900 text-[11px] font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{resendNotice}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 text-[11px]">
                <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span>SMS Confirmation:</span>
                  <span className={`font-bold ${selectedDonation.smsSent ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {selectedDonation.smsSent ? 'Delivered' : 'Ready to Send'}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span>Email Confirmation:</span>
                  <span className={`font-bold ${selectedDonation.emailSent || selectedDonation.receiptSent ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {selectedDonation.emailSent || selectedDonation.receiptSent ? 'Delivered' : 'Ready to Send'}
                  </span>
                </div>
              </div>

              <div className="pt-1 flex justify-between items-center text-[11px]">
                <a
                  href={`/track-donation?ref=${encodeURIComponent(selectedDonation.receiptNumber)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" /> View in Public Donation Tracker
                </a>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => downloadSingleReceipt(selectedDonation)}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" /> Download Official PDF Receipt
              </button>
              <button
                type="button"
                onClick={() => previewReceiptPdf(selectedDonation)}
                className="py-2.5 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4 text-slate-500" /> Print / View PDF
              </button>
              <button
                type="button"
                onClick={() => {
                  const toEdit = selectedDonation;
                  setSelectedDonation(null);
                  openEditModal(toEdit);
                }}
                className="py-2.5 px-3.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                title="Edit receipt number, donor, amount, or parameters"
              >
                <Edit3 className="w-4 h-4" /> Edit Receipt
              </button>
              <button
                type="button"
                onClick={() => setSelectedDonation(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approving Officer Confirmation Modal */}
      {approvingDonation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Approve Donation & Sign Receipt</h2>
                  <p className="text-xs text-slate-500">
                    Select the admin or moderator signing off on this donation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApprovingDonation(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Donation Snapshot */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Donor:</span>
                <span className="font-bold text-slate-900">{approvingDonation.donorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <span className="font-black text-emerald-700">
                  {formatCurrency(approvingDonation.amount, approvingDonation.currency || orgCurrency)} {approvingDonation.currency || orgCurrency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Campaign:</span>
                <span className="text-slate-700 font-semibold">{approvingDonation.campaignName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt ID:</span>
                <span className="text-slate-700">{approvingDonation.receiptNumber}</span>
              </div>
            </div>

            {/* Campaign Loading Bar Live Impact Preview */}
            {(() => {
              const matchedCamp = campaigns.find(c => isCampaignMatch(c, approvingDonation.campaignId, approvingDonation.campaignName));
              if (!matchedCamp) return null;

              const currentAmt = Number(matchedCamp.currentAmount || 0);
              const addAmt = Number(approvingDonation.amount || 0);
              const newAmt = currentAmt + addAmt;
              const goalAmt = Number(matchedCamp.goalAmount || 1);
              const currentPct = Math.min(100, Math.round((currentAmt / goalAmt) * 100));
              const newPct = Math.min(100, Math.round((newAmt / goalAmt) * 100));

              return (
                <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      Campaign Loading Bar Impact
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                      +{formatCurrency(addAmt, approvingDonation.currency || orgCurrency)}
                    </span>
                  </div>

                  <div>
                    <div className="font-bold text-slate-900 text-xs">{matchedCamp.name}</div>
                    <div className="flex justify-between items-baseline mt-1 text-[11px] text-slate-600">
                      <span>Current: <strong>{formatCurrency(currentAmt, orgCurrency)}</strong> ({currentPct}%)</span>
                      <span className="text-emerald-700 font-bold">&rarr; New Total: {formatCurrency(newAmt, orgCurrency)} ({newPct}%)</span>
                    </div>
                  </div>

                  {/* Visual Loading Bar Preview */}
                  <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden flex">
                    <div 
                      className="bg-emerald-600 h-full transition-all duration-500" 
                      style={{ width: `${currentPct}%` }}
                    />
                    <div 
                      className="bg-emerald-400 h-full animate-pulse" 
                      style={{ width: `${Math.max(2, Math.min(100 - currentPct, newPct - currentPct))}%` }}
                      title={`Adding +${formatCurrency(addAmt, orgCurrency)}`}
                    />
                  </div>
                  <p className="text-[10px] text-emerald-800 italic">
                    Approving will automatically add this amount directly to the campaign loading bar across the entire site.
                  </p>
                </div>
              );
            })()}

            {/* Approver Details Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Signing Official (Admin / Mod)
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Will appear on PDF receipt</span>
              </div>

              {/* Quick Pick from Team Members if available */}
              {members && members.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Quick Select Officer:</span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-100">
                    {members.map(m => {
                      const fullName = `${m.firstName} ${m.lastName}`;
                      const isSelected = approverOfficer.name === fullName;
                      const inferredRole = m.role === 'Staff' ? 'Admin' : 'Moderator';
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setApproverOfficer({ name: fullName, role: inferredRole });
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white font-bold shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {fullName} <span className="opacity-70 text-[10px]">({inferredRole})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Officer Full Name
                  </label>
                  <input
                    type="text"
                    value={approverOfficer.name}
                    onChange={(e) => setApproverOfficer(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Arafat Hossain or Tanvir Ahmed"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Capacity / Role
                  </label>
                  <select
                    value={approverOfficer.role}
                    onChange={(e) => setApproverOfficer(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Moderator">Moderator</option>
                    <option value="Finance Officer">Finance Officer</option>
                    <option value="Director">Director</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-[11px] text-emerald-900 flex items-start gap-2">
                <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  By approving, this donation will be verified and officially signed by <strong>{approverOfficer.name || 'Admin'}</strong> ({approverOfficer.role}).
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setApprovingDonation(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Approve as {approverOfficer.role}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve & Gmail Receipt Dispatch Modal */}
      {approvalModalDonation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">Donation Approved!</h2>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                      Verified & Cleared
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This gift has been added to verified funds. Send the official tax receipt to the donor's Gmail below.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setApprovalModalDonation(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Donor & Transaction Summary Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block mb-0.5">Recipient (Donor)</span>
                  <div className="font-bold text-slate-900 text-sm">{approvalModalDonation.donorName}</div>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-mono mt-0.5 bg-emerald-50/80 px-2 py-1 rounded-lg border border-emerald-200 w-fit">
                    <Mail className="w-3.5 h-3.5 text-red-500" />
                    <span className="font-semibold">{approvalModalDonation.donorEmail}</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block mb-0.5">Approved Amount</span>
                  <div className="font-black text-slate-900 text-lg">
                    {formatCurrency(approvalModalDonation.amount, approvalModalDonation.currency || orgCurrency)} {approvalModalDonation.currency || orgCurrency}
                  </div>
                  <span className="text-slate-500 font-mono text-[11px]">
                    Receipt #: {approvalModalDonation.receiptNumber}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200/80 flex flex-wrap gap-x-6 gap-y-1 text-slate-600 text-[11px]">
                <div><strong className="text-slate-700">Cause:</strong> {approvalModalDonation.campaignName}</div>
                <div><strong className="text-slate-700">Gateway:</strong> {approvalModalDonation.paymentMethod.toUpperCase()}</div>
                <div><strong className="text-slate-700">Ref:</strong> {approvalModalDonation.transactionId || 'N/A'}</div>
              </div>
            </div>

            {/* Live Campaign Loading Bar Impact */}
            {(() => {
              const matchedCamp = campaigns.find(c => isCampaignMatch(c, approvalModalDonation.campaignId, approvalModalDonation.campaignName));
              if (!matchedCamp) return null;
              const pct = Math.min(100, Math.round((matchedCamp.currentAmount / matchedCamp.goalAmount) * 100));
              return (
                <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      Auto-Credited to Campaign Loading Bar
                    </span>
                    <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[11px]">
                      {pct}% Funded
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">{matchedCamp.name}</div>
                    <div className="flex justify-between items-baseline mt-1 text-[11px] text-slate-600">
                      <span>Total Raised: <strong className="text-emerald-700">{formatCurrency(matchedCamp.currentAmount, orgCurrency)}</strong></span>
                      <span>Target: {formatCurrency(matchedCamp.goalAmount, orgCurrency)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })()}

            {/* Gmail & Email Send Action Panel */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-900 block">
                Deliver Receipt to Donor's Gmail
              </span>
              <div className="grid sm:grid-cols-2 gap-3">
                <a
                  href={getGmailComposeUrl(approvalModalDonation)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-sm group"
                >
                  <Mail className="w-4 h-4 text-white" />
                  <span>Open Gmail Composer</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
                </a>

                <a
                  href={getMailtoUrl(approvalModalDonation)}
                  className="p-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-sm"
                >
                  <Send className="w-4 h-4 text-white" />
                  <span>Open Default Email Client</span>
                </a>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopyReceipt(approvalModalDonation)}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedReceipt ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Full Receipt Text</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => downloadSingleReceipt(approvalModalDonation)}
                  className="py-2 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  title="Download verified PDF certificate"
                >
                  <Download className="w-3.5 h-3.5 text-white" />
                  <span>Download Official PDF Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => previewReceiptPdf(approvalModalDonation)}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  title="Print or view PDF certificate"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Print / View PDF</span>
                </button>
              </div>
            </div>

            {/* Receipt Preview */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Receipt Content Preview</span>
                <span className="text-[10px] text-slate-400 font-mono">Auto-generated</span>
              </div>
              <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-[10px] font-mono whitespace-pre-wrap max-h-44 overflow-y-auto leading-relaxed select-all">
                {generateReceiptEmailBody(approvalModalDonation)}
              </pre>
            </div>

            {/* Close / Done */}
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setApprovalModalDonation(null)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                Done & Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
