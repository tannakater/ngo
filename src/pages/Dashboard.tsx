import React, { useState, useMemo } from 'react';
import { 
  Users, Briefcase, Heart, Activity, Clock, 
  CheckCircle2, ArrowRight, Plus, Megaphone, Zap,
  TrendingUp, ShieldCheck, ExternalLink, Printer,
  ChevronRight, Sparkles, Building, Filter,
  Layers, ArrowUpRight, DollarSign, Calendar
} from 'lucide-react';
import { useNgoStore, isCampaignMatch, Donation } from '../store/useNgoStore';
import { useOrgStore } from '../store/useOrgStore';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils';
import { motion } from 'motion/react';
import { AnalyticsHeroSection } from '../components/admin/AnalyticsHeroSection';

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Recently';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Recently';
  }
}

function getInitials(name: string): string {
  if (!name) return 'D';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function Dashboard() {
  const { stats, projects, campaigns, donations, approveDonation } = useNgoStore();
  const { organization, members } = useOrgStore();

  const [approvalMessage, setApprovalMessage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [donationFilter, setDonationFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const orgCurrency = organization?.currency || 'USD';

  // Pending queues
  const pendingDonations = useMemo(() => 
    donations.filter(d => d.status === 'Pending'),
    [donations]
  );

  const pendingVolunteers = useMemo(() => 
    members.filter(m => 
      (m.role === 'Volunteer' || m.designation?.toLowerCase().includes('applicant')) && 
      (m.status === 'Pending' || m.status === 'Inactive')
    ),
    [members]
  );

  // Financial calculations
  const completedFunds = useMemo(() => 
    donations
      .filter(d => d.status === 'Completed')
      .reduce((sum, d) => sum + (d.amount || 0), 0),
    [donations]
  );

  const pendingFunds = useMemo(() => 
    donations
      .filter(d => d.status === 'Pending')
      .reduce((sum, d) => sum + (d.amount || 0), 0),
    [donations]
  );

  const completedDonationsCount = useMemo(() => 
    donations.filter(d => d.status === 'Completed').length,
    [donations]
  );

  // Filtered donations for the ledger
  const filteredDonations = useMemo(() => {
    let list = [...donations].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    if (donationFilter === 'pending') {
      list = list.filter(d => d.status === 'Pending');
    } else if (donationFilter === 'completed') {
      list = list.filter(d => d.status === 'Completed');
    }

    return list.slice(0, 6);
  }, [donations, donationFilter]);

  // Campaign statistics
  const activeCampaigns = useMemo(() => 
    campaigns.filter(c => c.status === 'Active'),
    [campaigns]
  );

  const totalCampaignGoal = useMemo(() => 
    campaigns.reduce((sum, c) => sum + (c.goalAmount || 0), 0),
    [campaigns]
  );

  const totalCampaignRaised = useMemo(() => 
    campaigns.reduce((sum, c) => sum + (c.currentAmount || 0), 0),
    [campaigns]
  );

  const overallProgress = totalCampaignGoal > 0 
    ? Math.min(100, Math.round((totalCampaignRaised / totalCampaignGoal) * 100))
    : 0;

  // Active verified roster
  const activeMembersCount = useMemo(() => 
    members.filter(m => m.status === 'Active').length,
    [members]
  );

  // 1-Click Quick Approve Handler
  const handleQuickApprove = async (donationId: string) => {
    if (processingId) return;
    setProcessingId(donationId);

    try {
      const donation = donations.find(d => d.id === donationId);
      if (!donation) return;

      const approved = await approveDonation(donationId, {
        name: 'Executive Directorate',
        role: 'Administrator'
      });

      if (approved) {
        const camp = campaigns.find(c => isCampaignMatch(c, approved.campaignId, approved.campaignName));
        const campName = camp?.name || approved.campaignName || 'Campaign';
        setApprovalMessage(
          `Approved ${formatCurrency(approved.amount, orgCurrency)} from ${approved.donorName}! Official receipt credited to "${campName}".`
        );
        setTimeout(() => setApprovalMessage(null), 6000);
      }
    } catch (err) {
      console.error('Failed to quick approve donation:', err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <motion.div 
      className="space-y-6 max-w-7xl mx-auto pb-12 w-full min-w-0"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Modern Greeting & Header Banner */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Control Center</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono text-[10px] font-bold shadow-2xs">
              V44
            </span>
            <span className="text-xs text-slate-400 font-medium truncate">
              {organization?.name || 'DakSeba Foundation'}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            {getGreeting()}, Directorate
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-2xl">
            Real-time oversight of verified contributions, live humanitarian targets, and active field operations.
          </p>
        </div>

        {/* Quick Action Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 md:pt-0 shrink-0">
          <Link
            to="/admin/donations"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
          >
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>Donations</span>
            {pendingDonations.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full leading-none">
                {pendingDonations.length}
              </span>
            )}
          </Link>

          <Link
            to="/admin/campaigns"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Campaign</span>
          </Link>

          <Link
            to="/admin/people"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>Roster</span>
          </Link>

          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all"
            title="Open Public Website"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">View Site</span>
          </Link>
        </div>
      </div>

      {/* Instant Feedback Alert Toast */}
      {approvalMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-emerald-950 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-emerald-900 truncate">{approvalMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setApprovalMessage(null)}
            className="text-xs text-emerald-700 hover:text-emerald-950 font-bold px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer shrink-0 ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Priority Action Desk (Immediate Approvals) */}
      {(pendingDonations.length > 0 || pendingVolunteers.length > 0) && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-50/70 to-white border border-amber-300/80 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Pending Administrative Action ({pendingDonations.length + pendingVolunteers.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  {pendingDonations.length > 0 ? `${pendingDonations.length} donation(s) require review.` : ''}{' '}
                  {pendingVolunteers.length > 0 ? `${pendingVolunteers.length} volunteer application(s) awaiting approval.` : ''}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {pendingDonations.length > 0 && (
                <Link
                  to="/admin/donations"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-2xs"
                >
                  <span>Review All ({pendingDonations.length})</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
              {pendingVolunteers.length > 0 && (
                <Link
                  to="/admin/volunteers"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-2xs"
                >
                  <span>Volunteers ({pendingVolunteers.length})</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>

          {/* Quick Approval Strip for Pending Donations */}
          {pendingDonations.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                1-Click Verification Strip
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {pendingDonations.slice(0, 4).map((d) => (
                  <div 
                    key={d.id}
                    className="bg-white rounded-xl p-3 border border-amber-200/90 flex items-center justify-between gap-3 shadow-2xs hover:border-amber-300 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 truncate">{d.donorName}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold uppercase tracking-wider">
                          {d.paymentMethod}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {d.campaignName} &bull; <span className="font-mono text-slate-400">{d.transactionId || d.receiptNumber}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-black text-xs text-slate-900">
                        {formatCurrency(d.amount, d.currency || orgCurrency)}
                      </span>
                      <button
                        type="button"
                        disabled={processingId === d.id}
                        onClick={() => handleQuickApprove(d.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="1-Click Approve"
                      >
                        <Zap className="w-3 h-3" />
                        <span>{processingId === d.id ? '...' : 'Approve'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Primary Analytics Section matching modern target & sales dashboard design */}
      <AnalyticsHeroSection />

      {/* Organizational Operations Summary */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            Operational Summary & Roster Metrics
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Card 1: Total Cleared Funds */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-emerald-300/80 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Funds Cleared</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Heart className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {formatCurrency(completedFunds, orgCurrency)}
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span><strong className="text-emerald-700 font-bold">{completedDonationsCount}</strong> cleared gifts</span>
            <Link to="/admin/donations" className="text-emerald-600 hover:text-emerald-800 font-bold flex items-center gap-0.5">
              Ledger <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 2: Active Causes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-blue-300/80 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Campaigns</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Megaphone className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {activeCampaigns.length}
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span>{overallProgress}% of target raised</span>
            <Link to="/admin/campaigns" className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5">
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 3: Active Field Programs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-indigo-300/80 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Field Programs</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {projects.length}
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span>{stats?.projectsCompleted || 0} completed drives</span>
            <Link to="/admin/programs" className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5">
              Programs <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 4: Verified Members & Volunteers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-amber-300/80 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Verified Roster</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {activeMembersCount}
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> Cryptographic IDs
            </span>
            <Link to="/admin/people" className="text-amber-700 hover:text-amber-900 font-bold flex items-center gap-0.5">
              Roster <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
        </div>
      </div>

      {/* Main Grid: Ledger & Live Campaign Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Columns: Recent Contributions with Quick Filter */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Recent Contributions</h2>
                <p className="text-xs text-slate-400 mt-0.5">Real-time ledger of online and offline gifts</p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs">
                <button
                  type="button"
                  onClick={() => setDonationFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    donationFilter === 'all' 
                      ? 'bg-white text-slate-900 shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({donations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDonationFilter('pending')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                    donationFilter === 'pending' 
                      ? 'bg-white text-amber-900 shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Pending</span>
                  {pendingDonations.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setDonationFilter('completed')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    donationFilter === 'completed' 
                      ? 'bg-white text-emerald-900 shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cleared
                </button>
              </div>
            </div>

            {/* Donation List (Mobile Card + Desktop Row) */}
            <div className="divide-y divide-slate-100 mt-2">
              {filteredDonations.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No donation records match the selected filter.
                </div>
              ) : (
                filteredDonations.map((d) => (
                  <div key={d.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 px-2.5 rounded-xl transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Avatar Initials Badge */}
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                        {getInitials(d.donorName)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 truncate">{d.donorName}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            d.status === 'Completed'
                              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                              : d.status === 'Pending'
                              ? 'bg-amber-50 border border-amber-200 text-amber-800'
                              : 'bg-rose-50 border border-rose-200 text-rose-700'
                          }`}>
                            {d.status}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            &bull; {formatDate(d.createdAt)}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {d.campaignName} &bull; <span className="font-mono text-slate-400">{d.receiptNumber || d.transactionId}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end sm:flex-col sm:items-end gap-2 shrink-0 pt-1 sm:pt-0">
                      <div className="font-black text-sm text-slate-900">
                        {formatCurrency(d.amount, d.currency || orgCurrency)}
                      </div>
                      {d.status === 'Pending' ? (
                        <button
                          type="button"
                          disabled={processingId === d.id}
                          onClick={() => handleQuickApprove(d.id)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-2xs"
                          title="1-Click Approve"
                        >
                          <Zap className="w-2.5 h-2.5" />
                          <span>{processingId === d.id ? 'Approving...' : 'Quick Approve'}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Cleared</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Showing {filteredDonations.length} of {donations.length} entries
            </span>
            <Link
              to="/admin/donations"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
            >
              <span>Full Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right 5 Columns: Campaign Progress Bars */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Campaign Targets</h2>
                <p className="text-xs text-slate-400 mt-0.5">Live fundraising goal meters</p>
              </div>
              <Link
                to="/admin/campaigns"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                <span>Manage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3.5 mt-4">
              {campaigns.slice(0, 4).map(campaign => {
                const goal = campaign.goalAmount || 1;
                const current = campaign.currentAmount || 0;
                const pct = Math.min(100, Math.round((current / goal) * 100));

                return (
                  <div key={campaign.id} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100/90 hover:border-slate-200 transition-colors">
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <h4 className="font-bold text-xs text-slate-900 truncate" title={campaign.name}>
                        {campaign.name}
                      </h4>
                      <span className="text-[11px] font-black text-emerald-700 font-mono bg-emerald-100/60 px-2 py-0.5 rounded-full shrink-0">
                        {pct}%
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline text-[11px] text-slate-500 mb-2">
                      <span>Raised: <strong className="text-slate-800">{formatCurrency(current, orgCurrency)}</strong></span>
                      <span>Target: {formatCurrency(goal, orgCurrency)}</span>
                    </div>

                    {/* Clean Progress Meter */}
                    <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-blue-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Total Target: <strong>{formatCurrency(totalCampaignGoal, orgCurrency)}</strong>
            </span>
            <Link
              to="/admin/campaigns"
              className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1"
            >
              <span>+ Create Campaign</span>
            </Link>
          </div>
        </div>

      </div>

      {/* Operational Fast Shortcuts & Field Programs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Field Programs Summary (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Active Field Programs</h2>
              <p className="text-xs text-slate-400 mt-0.5">Operational delivery and community impact</p>
            </div>
            <Link 
              to="/admin/programs" 
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
            >
              <span>All Programs ({projects.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {projects.slice(0, 4).map(project => (
              <div key={project.id} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100/90 flex flex-col justify-between hover:border-slate-200 transition-colors">
                <div className="flex justify-between items-start mb-1.5 gap-2">
                  <h4 className="font-bold text-slate-900 text-xs truncate">{project.title}</h4>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0">
                    {project.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2.5 truncate">{project.location}</p>
                <div className="flex items-center text-xs font-medium text-slate-600">
                  <span className="text-[11px] text-slate-400 mr-2">Delivery:</span>
                  <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${project.progress || 0}%` }}></div>
                  </div>
                  <span className="ml-2.5 font-mono text-[11px] text-slate-700 font-bold">{project.progress || 0}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Operational Tools (1 Col) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">Fast Operations</h2>
              <p className="text-xs text-slate-400 mt-0.5">Direct access to mission-critical tools</p>
            </div>

            <div className="space-y-2.5">
              <Link
                to="/admin/id-cards/print"
                className="p-3 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 rounded-xl flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-800 flex items-center justify-center shrink-0">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 group-hover:text-emerald-900">Batch Print ID Cards</h5>
                    <p className="text-[10px] text-slate-400">Generate A4 print sheets with QR codes</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0" />
              </Link>

              <Link
                to="/verify"
                target="_blank"
                className="p-3 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 rounded-xl flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100/80 text-blue-800 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 group-hover:text-blue-900">Verification Portal</h5>
                    <p className="text-[10px] text-slate-400">Test live member & volunteer validation</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
              </Link>

              <Link
                to="/admin/transparency"
                className="p-3 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 rounded-xl flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100/80 text-amber-800 flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 group-hover:text-amber-900">Public Transparency</h5>
                    <p className="text-[10px] text-slate-400">Governance & public audit reports</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 shrink-0" />
              </Link>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span>Database: Firestore</span>
              <span>&bull;</span>
              <span className="font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">V44</span>
            </span>
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Synchronized
            </span>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
