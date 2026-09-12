import React, { useState } from 'react';
import { 
  Users, Briefcase, Heart, Activity, ArrowUpRight, Clock, 
  CheckCircle2, ArrowRight, Plus, Megaphone, Zap, Sparkles,
  TrendingUp, Eye, HeartHandshake
} from 'lucide-react';
import { useNgoStore, isCampaignMatch } from '../store/useNgoStore';
import { useOrgStore } from '../store/useOrgStore';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils';
import { motion } from 'motion/react';

export function Dashboard() {
  const { stats, projects, campaigns, donations, approveDonation } = useNgoStore();
  const { organization, members } = useOrgStore();

  const [approvalMessage, setApprovalMessage] = useState<string | null>(null);

  const pendingVolunteers = members.filter(m => 
    (m.role === 'Volunteer' || m.designation?.toLowerCase().includes('applicant')) && 
    (m.status === 'Pending' || m.status === 'Inactive')
  );

  const orgCurrency = organization.currency || 'USD';
  const pendingDonations = donations.filter(d => d.status === 'Pending');
  const completedFunds = donations
    .filter(d => d.status === 'Completed')
    .reduce((sum, d) => sum + d.amount, 0);

  const recentDonations = [...donations]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const handleQuickApprove = async (donationId: string) => {
    const donation = donations.find(d => d.id === donationId);
    if (!donation) return;

    const approved = await approveDonation(donationId, {
      name: 'Admin Directorate',
      role: 'Administrator'
    });

    if (approved) {
      const camp = campaigns.find(c => isCampaignMatch(c, approved.campaignId, approved.campaignName));
      const campName = camp?.name || approved.campaignName || 'Campaign';
      setApprovalMessage(`Approved ${formatCurrency(approved.amount, orgCurrency)} from ${approved.donorName}! Credited to "${campName}".`);
      setTimeout(() => setApprovalMessage(null), 6000);
    }
  };

  return (
    <motion.div className="space-y-6 max-w-7xl mx-auto" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="show">
      {/* Page Header with Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Executive Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status of fundraising campaigns, approved donations, and field operations.
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <Link 
            to="/admin/donations" 
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>Donations ({donations.length})</span>
          </Link>
          <Link 
            to="/admin/campaigns" 
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Campaign</span>
          </Link>
          <Link 
            to="/admin/people" 
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>Members</span>
          </Link>
        </div>
      </div>

      {/* Quick Approval Notification Banner */}
      {approvalMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-emerald-950 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-emerald-900">{approvalMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setApprovalMessage(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Pending Donation Alert Banner */}
      {pendingDonations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-950 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-amber-950">
                  {pendingDonations.length} Donation{pendingDonations.length > 1 ? 's' : ''} Awaiting Approval
                </h4>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-black rounded-full uppercase tracking-wider">
                  Needs Review
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                Approving automatically updates the campaign loading bar and issues an official tax receipt.
              </p>
            </div>
          </div>
          <Link
            to="/admin/donations"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shrink-0 transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Review & Approve</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Funds</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {formatCurrency(completedFunds, orgCurrency)}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1">
            <span className="text-emerald-600 font-bold">{donations.filter(d => d.status === 'Completed').length}</span> cleared gifts
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Causes</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {campaigns.filter(c => c.status === 'Active').length}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            of {campaigns.length} total campaigns
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Field Programs</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {projects.length}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            {stats.projectsCompleted} completed
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Community</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {stats.volunteers}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            Registered volunteers & staff
          </div>
        </div>
      </div>

      {/* Main Grid: Donations & Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Donations Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Contributions</h2>
              <p className="text-xs text-slate-400">Latest online and offline gifts</p>
            </div>
            <Link 
              to="/admin/donations" 
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>Manage All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3 flex-1">
            {recentDonations.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No donation records found yet.
              </div>
            ) : (
              recentDonations.map((d) => (
                <div 
                  key={d.id} 
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 truncate">{d.donorName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        d.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : d.status === 'Pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        {d.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {d.campaignName} &bull; <span className="font-mono text-slate-400">{d.receiptNumber}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-black text-xs text-slate-900">
                      {formatCurrency(d.amount, d.currency || orgCurrency)}
                    </div>
                    {d.status === 'Pending' ? (
                      <button
                        type="button"
                        onClick={() => handleQuickApprove(d.id)}
                        className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-2 py-0.5 rounded-md transition-colors cursor-pointer shadow-2xs"
                        title="1-Click Approve: Credit directly to campaign loading bar"
                      >
                        <Zap className="w-2.5 h-2.5" />
                        <span>Quick Approve</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-medium flex items-center justify-end gap-1 mt-0.5">
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

        {/* Active Campaigns Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Campaign Loading Bars</h2>
              <p className="text-xs text-slate-400">Live fundraising goals and progress</p>
            </div>
            <Link 
              to="/admin/campaigns" 
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3.5 flex-1">
            {campaigns.slice(0, 4).map(campaign => {
              const pct = Math.min(100, Math.round((campaign.currentAmount / campaign.goalAmount) * 100));
              return (
                <div key={campaign.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="font-bold text-xs text-slate-900 truncate max-w-[200px]" title={campaign.name}>
                      {campaign.name}
                    </h4>
                    <span className="text-[11px] font-black text-emerald-700 font-mono bg-emerald-100/60 px-2 py-0.5 rounded-full">
                      {pct}%
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline text-[11px] text-slate-500 mb-2">
                    <span>Raised: <strong className="text-slate-800">{formatCurrency(campaign.currentAmount, orgCurrency)}</strong></span>
                    <span>Goal: {formatCurrency(campaign.goalAmount, orgCurrency)}</span>
                  </div>

                  {/* Campaign Loading Bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
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
      </div>

      {/* Field Programs & Projects */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Active Field Programs</h2>
            <p className="text-xs text-slate-400">Operational delivery and community impact</p>
          </div>
          <Link 
            to="/admin/programs" 
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>All Programs ({projects.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {projects.slice(0, 4).map(project => (
            <div key={project.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-1.5">
                <h4 className="font-bold text-slate-900 text-xs truncate max-w-[220px]">{project.title}</h4>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {project.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2.5 truncate">{project.location}</p>
              <div className="flex items-center text-xs font-medium text-slate-600">
                <span className="text-[11px] text-slate-400 mr-2">Progress:</span>
                <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${project.progress}%` }}></div>
                </div>
                <span className="ml-2.5 font-mono text-[11px] text-slate-700 font-bold">{project.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
