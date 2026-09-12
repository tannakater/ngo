import React, { useState, useEffect } from 'react';
import { useOrgStore } from '../../store/useOrgStore';
import { useNgoStore } from '../../store/useNgoStore';
import { 
  Settings, Save, TrendingUp, CheckCircle2, RotateCcw, Download, 
  ShieldCheck, Globe2, CreditCard, Hash, AlertTriangle,
  Building2, Palette, Phone, Mail, MapPin, Loader2
} from 'lucide-react';
import { ConfirmModal } from '../../components/ConfirmModal';

export function AdminSettings() {
  const { organization, updateOrganization, members } = useOrgStore();
  const { projects, campaigns, donations, stats, updateStats } = useNgoStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: organization.name || 'Global Hope Foundation',
    nameBn: organization.nameBn || '',
    shortName: organization.shortName || 'GHF',
    tagline: organization.tagline || '',
    registrationNumber: organization.registrationNumber || 'NGO-AB-2023-09412',
    currency: organization.currency || 'USD',
    emergencyContact: organization.emergencyContact || '+880 1711-998877',
    primaryColor: organization.primaryColor || '#064e3b',
    secondaryColor: organization.secondaryColor || '#059669',
    noticeText: (organization.noticeText && !/[\u0980-\u09FF]/.test(organization.noticeText))
      ? organization.noticeText 
      : 'If found, please return this card to the organization office or contact support.',
    phone: organization.phone || '',
    email: organization.email || '',
    website: organization.website || '',
    address: organization.address || '',
    facebook: organization.facebook || '',
    mission: organization.mission || '',
    vision: organization.vision || '',
    statsPeopleHelped: stats.peopleHelped || '',
    statsVolunteers: stats.volunteers || '',
    statsProjectsCompleted: stats.projectsCompleted || '',
    statsFundsRaised: stats.fundsRaised || '',
  });

  useEffect(() => {
    setFormData({
      name: organization.name || 'Global Hope Foundation',
      nameBn: organization.nameBn || '',
      shortName: organization.shortName || 'GHF',
      tagline: organization.tagline || '',
      registrationNumber: organization.registrationNumber || 'NGO-AB-2023-09412',
      currency: organization.currency || 'USD',
      emergencyContact: organization.emergencyContact || '+880 1711-998877',
      primaryColor: organization.primaryColor || '#064e3b',
      secondaryColor: organization.secondaryColor || '#059669',
      noticeText: (organization.noticeText && !/[\u0980-\u09FF]/.test(organization.noticeText))
        ? organization.noticeText 
        : 'If found, please return this card to the organization office or contact support.',
      phone: organization.phone || '',
      email: organization.email || '',
      website: organization.website || '',
      address: organization.address || '',
      facebook: organization.facebook || '',
      mission: organization.mission || '',
      vision: organization.vision || '',
      statsPeopleHelped: stats.peopleHelped || '',
      statsVolunteers: stats.volunteers || '',
      statsProjectsCompleted: stats.projectsCompleted || '',
      statsFundsRaised: stats.fundsRaised || '',
    });
  }, [organization, stats]);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateOrganization({
        name: formData.name,
        nameBn: formData.nameBn,
        shortName: formData.shortName,
        tagline: formData.tagline,
        registrationNumber: formData.registrationNumber,
        currency: formData.currency,
        emergencyContact: formData.emergencyContact,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        noticeText: formData.noticeText,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        address: formData.address,
        facebook: formData.facebook,
        mission: formData.mission,
        vision: formData.vision,
      });

      updateStats({
        peopleHelped: formData.statsPeopleHelped,
        volunteers: formData.statsVolunteers,
        projectsCompleted: formData.statsProjectsCompleted,
        fundsRaised: formData.statsFundsRaised,
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to update organization settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const exportBackupJSON = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      organization,
      members,
      projects,
      campaigns,
      donations
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ngo_system_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleResetData = () => {
    localStorage.removeItem('idforge_org_storage_v1');
    localStorage.removeItem('ngo_state_storage_v1');
    window.location.reload();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Reset System to Defaults"
        message="Are you sure you want to reset all data back to system initial defaults? Any unsaved local edits will be re-initialized."
        confirmText="Reset Everything"
        onConfirm={handleResetData}
        onClose={() => setShowResetConfirm(false)}
      />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System & Governance Settings</h1>
          <p className="text-xs text-slate-500 mt-1">Configure global organization identity, ID card prefixes, currency, regulatory numbers, and automated backups.</p>
        </div>
        {savedSuccess && (
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 self-start sm:self-auto shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Settings Saved to Cloud & Storage
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Organization Identity */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Organization Identity</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Organization Name (English) *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Organization Name (Bengali)
              </label>
              <input
                type="text"
                value={formData.nameBn}
                onChange={e => setFormData({ ...formData, nameBn: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Tagline (Header & Hero Intro)
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Our Mission (Displayed on About Us page)
                </label>
                <span className="text-[10px] text-slate-400">Public /about page</span>
              </div>
              <textarea
                rows={3}
                value={formData.mission}
                onChange={e => setFormData({ ...formData, mission: e.target.value })}
                placeholder="Describe your organization's core mission and purpose..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-y"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Our Vision (Displayed on About Us page)
                </label>
                <span className="text-[10px] text-slate-400">Public /about page</span>
              </div>
              <textarea
                rows={3}
                value={formData.vision}
                onChange={e => setFormData({ ...formData, vision: e.target.value })}
                placeholder="Describe your organization's long-term vision and aspirations..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-y"
              />
            </div>
          </div>
        </div>

        {/* ID Card & Serial Configuration */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <Hash className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">ID Credential Generation & Registration</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Member ID Prefix *
              </label>
              <input
                type="text"
                required
                value={formData.shortName}
                onChange={e => setFormData({ ...formData, shortName: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">Generates IDs like: <span className="font-mono font-bold text-emerald-600">{formData.shortName || 'GHF'}-000042</span></p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Official Registration Number *
              </label>
              <input
                type="text"
                required
                value={formData.registrationNumber}
                onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">Printed on verifiable ID cards, badges, and receipts.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Lost Card Return Notice (Back of ID Card)
            </label>
            <input
              type="text"
              value={formData.noticeText}
              onChange={e => setFormData({ ...formData, noticeText: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Currency & Emergency Hotlines */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Operations, Currency & Hotlines</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Standard Operational Currency
              </label>
              <select
                value={formData.currency}
                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="BDT">BDT (৳) - Bangladeshi Taka</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                24/7 Field Emergency Contact
              </label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Public Impact Stats */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Public Impact Stats</h2>
          </div>
          <p className="text-xs text-slate-500">
            These numbers appear on your public landing page to show your organization's impact.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                People Helped
              </label>
              <input
                type="text"
                value={formData.statsPeopleHelped}
                onChange={e => setFormData({ ...formData, statsPeopleHelped: e.target.value })}
                placeholder="e.g. 52,400+"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Active Volunteers
              </label>
              <input
                type="text"
                value={formData.statsVolunteers}
                onChange={e => setFormData({ ...formData, statsVolunteers: e.target.value })}
                placeholder="e.g. 1,250+"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Projects Completed
              </label>
              <input
                type="text"
                value={formData.statsProjectsCompleted}
                onChange={e => setFormData({ ...formData, statsProjectsCompleted: e.target.value })}
                placeholder="e.g. 48"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Funds Raised
              </label>
              <input
                type="text"
                value={formData.statsFundsRaised}
                onChange={e => setFormData({ ...formData, statsFundsRaised: e.target.value })}
                placeholder="e.g. $2.65M"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Contact & Location Details */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <Globe2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Headquarters & Online Presence</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Official Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Office Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Website URL
              </label>
              <input
                type="text"
                value={formData.website}
                onChange={e => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Facebook / Social Link
              </label>
              <input
                type="text"
                value={formData.facebook}
                onChange={e => setFormData({ ...formData, facebook: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Headquarters Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Brand Colors */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <Palette className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Brand & Theme Colors</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Primary Brand Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5 bg-white"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Secondary Brand Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={e => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5 bg-white"
                />
                <input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={e => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-7 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving Changes...' : 'Save System Settings'}
          </button>
        </div>
      </form>

      {/* Data Management & Backup Bento */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold">Data Sovereignty & Local Backups</h2>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Export a complete, unencrypted JSON snapshot of your organization database, including all registered members, donations, ID templates, and causes.
        </p>

        <div className="flex flex-wrap gap-4 pt-2">
          <button
            type="button"
            onClick={exportBackupJSON}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> Download Complete JSON Snapshot
          </button>
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-5 py-2.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Reset to Initial Defaults
          </button>
        </div>
      </div>

    </div>
  );
}
