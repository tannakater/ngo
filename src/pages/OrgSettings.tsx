import React, { useRef, useState, useEffect } from 'react';
import { useOrgStore } from '../store/useOrgStore';
import { Building2, Save, UploadCloud, Loader2, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';
import { uploadImage } from '../lib/storage';

export function OrgSettings() {
  const { organization, updateOrganization, userId } = useOrgStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({ ...organization });

  useEffect(() => {
    setFormData({ ...organization });
  }, [organization]);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateOrganization(formData);
      showFeedback('Organization settings saved successfully!');
    } catch (error) {
      console.error('Failed to save organization settings:', error);
      showFeedback('Failed to save settings. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetForm = () => {
    setFormData({ ...organization });
    showFeedback('Changes reverted to saved values.');
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const ext = file.name.split('.').pop() || 'png';
      const path = `organizations/${userId || 'default'}/logo.${ext}`;
      const url = await uploadImage(file, path, 'branding');
      setFormData(prev => ({ ...prev, logoUrl: url }));
      await updateOrganization({ logoUrl: url });
      showFeedback('Organization logo updated!');
    } catch (error) {
      console.error('Error uploading logo:', error);
      showFeedback('Failed to upload logo.', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Organization Settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure your organization's primary details, contact info, and branding assets.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold ${
            feedback.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8 divide-y divide-slate-200">

        <div className="space-y-6 sm:space-y-5">
          <div className="bg-white shadow-sm ring-1 ring-slate-200 rounded-xl p-6 sm:p-8">
            <h2 className="text-base font-semibold leading-7 text-slate-900 flex items-center gap-2 mb-6">
              <Building2 className="w-5 h-5 text-emerald-600" />
              General Information
            </h2>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium leading-6 text-slate-900">
                  Organization Name (English) *
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    required
                    name="name"
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="nameBn" className="block text-sm font-medium leading-6 text-slate-900">
                  Organization Name (Bengali)
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="nameBn"
                    id="nameBn"
                    value={formData.nameBn || ''}
                    onChange={(e) => setFormData({ ...formData, nameBn: e.target.value })}
                    className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="shortName" className="block text-sm font-medium leading-6 text-slate-900">
                  Short Name / ID Prefix *
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    required
                    name="shortName"
                    id="shortName"
                    value={formData.shortName || ''}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value.toUpperCase() })}
                    className="block w-full rounded-md border-0 py-1.5 text-slate-900 font-mono uppercase shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="registrationNumber" className="block text-sm font-medium leading-6 text-slate-900">
                  Registration Number
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="registrationNumber"
                    id="registrationNumber"
                    value={formData.registrationNumber || ''}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    placeholder="NGO-AB-2023-09412"
                    className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="currency" className="block text-sm font-medium leading-6 text-slate-900">
                  Operational Currency
                </label>
                <div className="mt-2">
                  <select
                    id="currency"
                    value={formData.currency || 'USD'}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                  >
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="BDT">BDT (৳) - Bangladeshi Taka</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="tagline" className="block text-sm font-medium leading-6 text-slate-900">
                  Tagline / Motto
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="tagline"
                    id="tagline"
                    value={formData.tagline || ''}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label className="block text-sm font-medium leading-6 text-slate-900">
                  Organization Logo
                </label>
                <div className="mt-2 flex items-center gap-x-5">
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Logo"
                      className="h-16 w-16 rounded-lg object-contain bg-slate-50 ring-1 ring-slate-200"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-emerald-50 ring-1 ring-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xl">
                      {formData.name?.[0] || 'O'}
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" /> : <UploadCloud className="w-4 h-4 text-slate-500" />}
                    {isUploading ? 'Uploading...' : 'Change Logo'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm ring-1 ring-slate-200 rounded-xl p-6 sm:p-8 mt-6">
            <h2 className="text-base font-semibold leading-7 text-slate-900 mb-6">
              Contact & Location Details
            </h2>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <label htmlFor="address" className="block text-sm font-medium leading-6 text-slate-900">
                  Headquarters Address
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="address"
                    id="address"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="phone" className="block text-sm font-medium leading-6 text-slate-900">
                  Phone Number
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="phone"
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="emergencyContact" className="block text-sm font-medium leading-6 text-slate-900">
                  24/7 Field Emergency Contact
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="emergencyContact"
                    id="emergencyContact"
                    value={formData.emergencyContact || ''}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="email" className="block text-sm font-medium leading-6 text-slate-900">
                  Official Email Address
                </label>
                <div className="mt-2">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="website" className="block text-sm font-medium leading-6 text-slate-900">
                  Official Website
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="website"
                    id="website"
                    value={formData.website || ''}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="qrVerificationUrl" className="block text-sm font-medium leading-6 text-slate-900">
                  QR Code Base Verification URL
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="qrVerificationUrl"
                    id="qrVerificationUrl"
                    value={formData.qrVerificationUrl || ''}
                    onChange={(e) => setFormData({ ...formData, qrVerificationUrl: e.target.value })}
                    placeholder="https://example.com/verify?id={{memberId}}"
                    className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Use <code className="bg-slate-100 px-1 rounded">{"{{memberId}}"}</code> to dynamically inject the user's ID.
                  </p>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="facebook" className="block text-sm font-medium leading-6 text-slate-900">
                  Facebook / Social Link
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="facebook"
                    id="facebook"
                    value={formData.facebook || ''}
                    onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                    className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="noticeText" className="block text-sm font-medium leading-6 text-slate-900">
                  Found Card Notice Text (Printed on back of ID Cards)
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="noticeText"
                    id="noticeText"
                    value={formData.noticeText || ''}
                    onChange={(e) => setFormData({ ...formData, noticeText: e.target.value })}
                    placeholder="If found, please return this card to the organization office or contact support."
                    className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 flex items-center justify-between gap-x-3">
          <button
            type="button"
            onClick={handleResetForm}
            className="rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            Revert Changes
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50 transition-colors"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
