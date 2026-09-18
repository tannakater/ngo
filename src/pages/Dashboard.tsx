import React, { useState, useMemo } from 'react';
import { 
  Users, Briefcase, Heart, Activity, Clock, 
  CheckCircle2, ArrowRight, Plus, Megaphone, Zap,
  ShieldCheck, ExternalLink, Printer, ChevronRight,
  Sparkles, Filter, Layers, DollarSign, Calendar
} from 'lucide-react';
import { useNgoStore, isCampaignMatch, Donation } from '../store/useNgoStore';
import { useOrgStore } from '../store/useOrgStore';
import { APP_VERSION } from '../config/version';
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

    return list.slice(0, 5);
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
        setTimeout(() => setApprovalMessage(null), 5000);
      }
    } catch (err) {
      console.error('Failed to quick approve donation:', err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <motion.div 
      className="space-y-6 max-w-7xl mx-auto pb-10 w-full min-w-0"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Clean Modern Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Control Center</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono text-[10px] font-bold shadow-2xs">
              {APP_VERSION}
            </span>
            <span className="text-xs text-slate-400 font-medium truncate">
              {organization?.name || 'DakSeba Foundation'}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            {getGreeting()}, Directorate
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time oversight of verified contributions, live humanitarian targets, and active field operations.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            to="/admin/donations"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
          >
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>Donations</span>
            {pendingDonations.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full leading-none">
                {pendingDonations.length}
              </span>
            )}
          </Link>

          <Link
            to="/admin/campaigns"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Campaign</span>
          </Link>

          <Link
            to="/admin/people"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>Roster</span>
          </Link>

          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all"
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
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
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

      {/* Priority Action Bar (Only shown when pending items exist) */}
      {(pendingDonations.length > 0 || pendingVolunteers.length > 0) && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-50/70 to-white border border-amber-300/80 rounded-2xl p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/60">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Pending Approvals ({pendingDonations.length + pendingVolunteers.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  {pendingDonations.length > 0 ? `${pendingDonations.length} donation(s) waiting for clearance.` : ''}{' '}
                  {pendingVolunteers.length > 0 ? `${pendingVolunteers.length} volunteer application(s).` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {pendingDonations.length > 0 && (
                <Link
                  to="/admin/donations"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-2xs"
                >
                  <span>Review ({pendingDonations.length})</span>
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

          {/* 1-Click Verification Strip */}
          {pendingDonations.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {pendingDonations.slice(0, 2).map((d) => (
                  <div 
                    key={d.id}
                    className="bg-white rounded-xl p-2.5 border border-amber-200/90 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 truncate">{d.donorName}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold uppercase">
                          {d.paymentMethod}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
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

      {/* Main Analytics Engine (Donors, Contributions, Target Progress & Monthly Trend) */}
      <AnalyticsHeroSection />

      {/* Two-Column Streamlined Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (7 cols): Clean Activity & Recent Contributions */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Recent Contributions</h2>
                <p className="text-xs text-slate-400">Live verified donation ledger</p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs self-start sm:self-auto">
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

            {/* Donation Rows */}
            <div className="divide-y divide-slate-100 mt-1">
              {filteredDonations.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  No donation records match the selected filter.
                </div>
              ) : (
                filteredDonations.map((d) => (
                  <div key={d.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/70 px-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                        {getInitials(d.donorName)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 truncate">{d.donorName}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider ${
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

                    <div className="flex items-center justify-between sm:justify-end sm:flex-col sm:items-end gap-1.5 shrink-0">
                      <div className="font-black text-xs sm:text-sm text-slate-900">
                        {formatCurrency(d.amount, d.currency || orgCurrency)}
                      </div>
                      {d.status === 'Pending' ? (
                        <button
                          type="button"
                          disabled={processingId === d.id}
                          onClick={() => handleQuickApprove(d.id)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 px-2 py-0.5 rounded-md transition-colors cursor-pointer shadow-2xs"
                        >
                          <Zap className="w-2.5 h-2.5" />
                          <span>Approve</span>
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

          <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Showing {filteredDonations.length} of {donations.length} gifts
            </span>
            <Link
              to="/admin/donations"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
            >
              <span>View Full Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Column (5 cols): Active Campaigns & Fast Shortcuts */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Active Campaigns Meter */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Active Causes</h2>
                <p className="text-xs text-slate-400">Fundraising targets & progress</p>
              </div>
              <Link
                to="/admin/campaigns"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                <span>Manage</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3 mt-3.5">
              {campaigns.slice(0, 3).map(campaign => {
                const goal = campaign.goalAmount || 1;
                const current = campaign.currentAmount || 0;
                const pct = Math.min(100, Math.round((current / goal) * 100));

                return (
                  <div key={campaign.id} className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <h4 className="font-bold text-xs text-slate-900 truncate" title={campaign.name}>
                        {campaign.name}
                      </h4>
                      <span className="text-[10px] font-black text-emerald-700 font-mono bg-emerald-100/70 px-1.5 py-0.2 rounded shrink-0">
                        {pct}%
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline text-[11px] text-slate-500 mb-1.5">
                      <span>Raised: <strong className="text-slate-800">{formatCurrency(current, orgCurrency)}</strong></span>
                      <span>Target: {formatCurrency(goal, orgCurrency)}</span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-blue-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Mission Shortcuts */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Essential Tools
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to="/admin/id-cards/print"
                className="p-3 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 rounded-xl flex flex-col justify-between group transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mb-2">
                  <Printer className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900 group-hover:text-emerald-900">Print ID Cards</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">A4 Batch sheets</p>
                </div>
              </Link>

              <Link
                to="/verify"
                target="_blank"
                className="p-3 bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-300 rounded-xl flex flex-col justify-between group transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900 group-hover:text-blue-900">Verify Portal</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">Public validator</p>
                </div>
              </Link>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span>Database: Firestore</span>
                <span>&bull;</span>
                <span className="font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">{APP_VERSION}</span>
              </span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Live
              </span>
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
}
