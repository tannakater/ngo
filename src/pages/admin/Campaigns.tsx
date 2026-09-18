import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNgoStore, Campaign, isCampaignMatch } from '../../store/useNgoStore';
import { useOrgStore } from '../../store/useOrgStore';
import { uploadFile } from '../../lib/storage';
import { 
  Megaphone, Plus, Filter, Search, Edit3, Trash2, 
  X, DollarSign, Upload, Users, Flame, Clock, Heart, ArrowUpRight, CheckCircle2
} from 'lucide-react';
import { ConfirmModal } from '../../components/ConfirmModal';
import { formatCurrency } from '../../utils';

export function AdminCampaigns() {
  const { campaigns, donations, addCampaign, updateCampaign, deleteCampaign } = useNgoStore();
  const { organization } = useOrgStore();
  const orgCurrency = organization.currency || 'USD';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [uploading, setUploading] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });

  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollLeft = 0;
    }
  }, [searchTerm, statusFilter]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    goalAmount: 50000,
    currentAmount: 0,
    coverImage: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&q=80',
    category: 'Disaster Relief',
    status: 'Active' as 'Active' | 'Completed' | 'Paused'
  });

  const handleOpenCreate = () => {
    setEditingCampaign(null);
    setFormData({
      name: '',
      description: '',
      goalAmount: 50000,
      currentAmount: 0,
      coverImage: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&q=80',
      category: 'Disaster Relief',
      status: 'Active'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (c: Campaign) => {
    setEditingCampaign(c);
    setFormData({
      name: c.name,
      description: c.description,
      goalAmount: c.goalAmount,
      currentAmount: c.currentAmount,
      coverImage: c.coverImage,
      category: c.category || 'General Appeal',
      status: c.status
    });
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Stores into NGO/campaignimg according to Drive hierarchy!
      const url = await uploadFile(file, 'campaignimg');
      setFormData(prev => ({ ...prev, coverImage: url }));
    } catch (err) {
      console.error('Failed to upload campaign cover image', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.goalAmount <= 0) return;

    if (editingCampaign) {
      updateCampaign(editingCampaign.id, formData);
    } else {
      addCampaign(formData);
    }

    setShowModal(false);
  };

  const filteredCampaigns = campaigns.filter(c => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (c.name || '').toLowerCase().includes(term) ||
                          (c.description || '').toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Campaign"
        message={`Are you sure you want to delete "${deleteConfirm.name}"? All associated campaign links and progress will be removed.`}
        confirmText="Delete Campaign"
        onConfirm={() => deleteCampaign(deleteConfirm.id)}
        onClose={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
      />
      
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Fundraising Campaigns</h1>
          <p className="mt-1 text-xs text-slate-500">Launch emergency appeals, track donor contributions, and manage cause targets.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button 
            type="button" 
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-colors gap-1.5"
          >
            <Plus className="h-4 w-4" />
            New Campaign
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Search & Filters */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 bg-slate-50 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search campaigns..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Paused">Paused</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div ref={tableContainerRef} className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 sticky top-0 z-20 text-slate-500 uppercase font-bold tracking-wider text-[11px]">
              <tr>
                <th scope="col" className="py-3.5 pl-4 sm:pl-6 pr-3 text-left sticky left-0 bg-slate-50 z-30 shadow-[1px_0_0_0_#e2e8f0]">
                  Campaign Name
                </th>
                <th scope="col" className="px-3 py-3.5 text-left whitespace-nowrap">Goal Amount</th>
                <th scope="col" className="px-3 py-3.5 text-left whitespace-nowrap">Raised So Far</th>
                <th scope="col" className="px-3 py-3.5 text-left whitespace-nowrap">Progress</th>
                <th scope="col" className="px-3 py-3.5 text-left whitespace-nowrap">Status</th>
                <th scope="col" className="py-3.5 pl-3 pr-4 sm:pr-6 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No campaigns found matching filter.
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((c) => {
                  const pct = Math.min(100, Math.round((c.currentAmount / c.goalAmount) * 100));
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="py-3.5 pl-4 sm:pl-6 pr-3 sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-10 shadow-[1px_0_0_0_#e2e8f0] min-w-0 max-w-[260px] sm:max-w-xs md:max-w-sm">
                        <div className="flex items-center min-w-0">
                          <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-100">
                            <img className="h-10 w-10 object-cover" src={c.coverImage} alt={c.name} />
                          </div>
                          <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                            <div className="font-bold text-slate-900 truncate" title={c.name}>{c.name}</div>
                            <div className="text-slate-500 text-[11px] truncate" title={c.description}>{c.description}</div>
                            {(() => {
                              const pending = donations.filter(d => d.status === 'Pending' && isCampaignMatch(c, d.campaignId, d.campaignName));
                              if (pending.length === 0) return null;
                              const pendingTotal = pending.reduce((sum, d) => sum + Number(d.amount || 0), 0);
                              return (
                                <Link 
                                  to={`/admin/donations?campaign=${c.id}`}
                                  className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/90 hover:bg-amber-200 px-2 py-0.5 rounded-full transition-colors"
                                  title="Approve pending donations to auto-credit this campaign loading bar"
                                >
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>{pending.length} pending ({formatCurrency(pendingTotal, orgCurrency)}) &rarr; Approve</span>
                                </Link>
                              );
                            })()}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-slate-700 font-bold whitespace-nowrap">{formatCurrency(c.goalAmount, orgCurrency)}</td>
                      <td className="px-3 py-3.5 text-emerald-700 font-black whitespace-nowrap">
                        <div>{formatCurrency(c.currentAmount, orgCurrency)}</div>
                        <div className="text-[10px] font-normal text-slate-400">{c.donorsCount || 0} donors</div>
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 sm:w-20 bg-slate-200 rounded-full h-2 overflow-hidden shrink-0">
                            <div 
                              className={`h-2 rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-blue-500' : 'bg-emerald-500'}`} 
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                          <span className="text-[11px] font-bold text-slate-700">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          c.status === 'Active' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 pl-3 pr-4 sm:pr-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {c.status !== 'Completed' && (
                            <button
                              type="button"
                              onClick={() => updateCampaign(c.id, { status: 'Completed' })}
                              className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                              title="Mark as Completed"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          <Link
                            to={`/admin/donations?campaign=${c.id}`}
                            className="p-1.5 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-lg transition-colors"
                            title="View Campaign Donations & Approvals"
                          >
                            <Heart className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteConfirm({
                                isOpen: true,
                                id: c.id,
                                name: c.name
                              });
                            }}
                            className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Campaign Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Winter Clothing Drive"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Goal ({orgCurrency}) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.goalAmount}
                    onChange={e => setFormData({ ...formData, goalAmount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Paused">Paused</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Short Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain the urgency, beneficiaries, and impact..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                ></textarea>
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cover Photo (Uploads to Drive /NGO/campaignimg)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                {uploading && <p className="text-xs text-emerald-600 mt-1 font-medium">Uploading to Drive...</p>}
                {formData.coverImage && (
                  <div className="mt-2 h-24 w-full rounded-xl overflow-hidden border border-slate-200">
                    <img src={formData.coverImage} alt="Cover Preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {editingCampaign ? 'Save Changes' : 'Launch Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
