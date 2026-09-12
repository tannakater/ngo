import React, { useState } from 'react';
import { useOrgStore } from '../../store/useOrgStore';
import { Heart, UploadCloud, Loader2, CheckCircle } from 'lucide-react';
import { uploadImage } from '../../lib/storage';

export function Volunteer() {
  const { addMember, userId } = useOrgStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: 'General Support',
    address: '',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=256&h=256&fit=crop'
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      const ext = file.name.split('.').pop() || 'png';
      const path = `volunteer_intake/${Date.now()}_photo.${ext}`;
      const url = await uploadImage(file, path, 'idcardimg');
      setFormData(prev => ({ ...prev, photoUrl: url }));
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate network delay
    await new Promise(r => setTimeout(r, 1000));
    
    addMember({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      department: formData.department,
      address: formData.address,
      photoUrl: formData.photoUrl,
      role: 'Volunteer',
      designation: 'Volunteer Applicant',
      status: 'Pending', // Pending approval by admin
      bloodGroup: '',
      dateOfBirth: '',
      joiningDate: new Date().toISOString().split('T')[0],
      emergencyContact: '',
      customFields: {}
    });
    
    setIsSubmitting(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="max-w-3xl mx-auto py-24 px-4 sm:px-6 text-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Application Submitted!</h1>
        <p className="text-lg text-slate-600 mb-8">
          Thank you for applying to be a volunteer. Our team will review your application and contact you soon.
        </p>
        <button onClick={() => setSuccess(false)} className="bg-emerald-600 text-white px-8 py-3 rounded-full font-bold">
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Heart className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Become a Volunteer</h1>
          <p className="text-lg text-slate-600">Join our community of changemakers and help us make a real impact on the world.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 sm:p-12">
            
            <div className="mb-8 flex flex-col items-center">
              <div className="relative mb-4">
                <img src={formData.photoUrl} alt="Preview" className="w-24 h-24 rounded-full object-cover ring-4 ring-emerald-50" />
              </div>
              <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-2">
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                {isUploading ? 'Uploading...' : 'Upload Profile Photo'}
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isUploading} />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
                <input required type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full border-slate-300 rounded-xl shadow-sm p-3 border focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 focus:bg-white transition-colors" placeholder="John" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
                <input required type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full border-slate-300 rounded-xl shadow-sm p-3 border focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 focus:bg-white transition-colors" placeholder="Doe" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border-slate-300 rounded-xl shadow-sm p-3 border focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 focus:bg-white transition-colors" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border-slate-300 rounded-xl shadow-sm p-3 border focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 focus:bg-white transition-colors" placeholder="+1 (555) 000-0000" />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Area of Interest</label>
              <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full border-slate-300 rounded-xl shadow-sm p-3 border focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 focus:bg-white transition-colors">
                <option value="General Support">General Support</option>
                <option value="Medical & Health">Medical & Health</option>
                <option value="Education">Education</option>
                <option value="Field Operations">Field Operations</option>
                <option value="Fundraising">Fundraising</option>
              </select>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Address / Location</label>
              <textarea required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} rows={3} className="w-full border-slate-300 rounded-xl shadow-sm p-3 border focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 focus:bg-white transition-colors" placeholder="City, Country..."></textarea>
            </div>

            <button type="submit" disabled={isSubmitting || isUploading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-70">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
