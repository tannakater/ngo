import { getOptimizeImageUrl } from "../lib/utils";
import React, { useRef, useState, useEffect } from 'react';
import { X, UploadCloud, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useOrgStore, Member } from '../store/useOrgStore';
import { uploadImage } from '../lib/storage';

interface AddMemberPanelProps {
  isOpen: boolean;
  onClose: () => void;
  memberToEdit?: Member | null;
  onSaveAndRegenerate?: (memberId: string) => void;
}

export function AddMemberPanel({ isOpen, onClose, memberToEdit, onSaveAndRegenerate }: AddMemberPanelProps) {
  const { addMember, updateMember, customFields, userId } = useOrgStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: 'Member' as 'Member' | 'Volunteer' | 'Staff',
    designation: '',
    department: '',
    phone: '',
    email: '',
    bloodGroup: '',
    dateOfBirth: '',
    joiningDate: '',
    address: '',
    emergencyContact: '',
    status: 'Active' as 'Active' | 'Inactive' | 'Pending',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=256&h=256&fit=crop',
  });

  const [customData, setCustomData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (memberToEdit) {
      setFormData({
        firstName: memberToEdit.firstName || '',
        lastName: memberToEdit.lastName || '',
        role: memberToEdit.role || 'Member',
        designation: memberToEdit.designation || '',
        department: memberToEdit.department || '',
        phone: memberToEdit.phone || '',
        email: memberToEdit.email || '',
        bloodGroup: memberToEdit.bloodGroup || '',
        dateOfBirth: memberToEdit.dateOfBirth || '',
        joiningDate: memberToEdit.joiningDate || '',
        address: memberToEdit.address || '',
        emergencyContact: memberToEdit.emergencyContact || '',
        status: (memberToEdit.status as any) || 'Active',
        photoUrl: memberToEdit.photoUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=256&h=256&fit=crop',
      });
      setCustomData(memberToEdit.customFields || {});
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        role: 'Member',
        designation: '',
        department: '',
        phone: '',
        email: '',
        bloodGroup: '',
        dateOfBirth: '',
        joiningDate: new Date().toISOString().split('T')[0],
        address: '',
        emergencyContact: '',
        status: 'Active',
        photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=256&h=256&fit=crop',
      });
      setCustomData({});
    }
  }, [memberToEdit, isOpen]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const ext = file.name.split('.').pop() || 'png';
      const path = `members/${userId || 'local'}/${Date.now()}_photo.${ext}`;
      const url = await uploadImage(file, path, 'idcardimg');
      setFormData(prev => ({ ...prev, photoUrl: url }));
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) return;

    if (memberToEdit) {
      updateMember(memberToEdit.id, {
        ...formData,
        customFields: customData,
        // When admin edits info of someone with an issued card, flag for re-generation
        needsRegeneration: memberToEdit.idCardGenerated ? true : false,
      });
    } else {
      addMember({
        ...formData,
        customFields: customData,
      });
    }
    onClose();
  };

  const handleSaveAndRegenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) return;

    if (memberToEdit) {
      updateMember(memberToEdit.id, {
        ...formData,
        customFields: customData,
        idCardGenerated: true,
        idCardGeneratedAt: new Date().toISOString(),
        needsRegeneration: false,
      });
      onClose();
      if (onSaveAndRegenerate) {
        onSaveAndRegenerate(memberToEdit.id);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white shadow-2xl w-full max-w-md h-full flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {memberToEdit ? 'Edit Member Profile' : 'Add New Member'}
            </h3>
            {memberToEdit && (
              <p className="text-xs text-slate-500 font-mono font-bold">{memberToEdit.memberId}</p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Active Card Notification */}
          {memberToEdit?.idCardGenerated && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-amber-900">ID Card Already Issued</span>
                <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                  This member already has an issued ID card. Saving changes will automatically update their credentials and enable <strong>Re-generate ID Card</strong> so you can re-issue their updated card.
                </p>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-4 mb-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="relative">
              {formData.photoUrl ? (
                <img src={getOptimizeImageUrl(formData.photoUrl)} alt="Member Photo" className="w-16 h-16 rounded-full object-cover ring-2 ring-emerald-500/30" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-200 ring-2 ring-slate-100 flex items-center justify-center text-slate-400 font-bold text-lg">
                  {formData.firstName?.[0] || 'M'}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Profile Photo</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 flex items-center gap-1.5 disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                {isUploading ? 'Uploading...' : 'Upload Photo'}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Role *</label>
              <select
                required
                className="w-full border border-slate-200 rounded-xl shadow-sm text-xs p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value as any })}
              >
                <option value="Member">Member</option>
                <option value="Volunteer">Volunteer</option>
                <option value="Staff">Staff</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Status</label>
              <select
                className="w-full border border-slate-200 rounded-xl shadow-sm text-xs p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">First Name *</label>
              <input 
                required 
                type="text" 
                value={formData.firstName} 
                onChange={e => setFormData({...formData, firstName: e.target.value})} 
                className="w-full border border-slate-200 rounded-xl shadow-sm text-xs p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Last Name *</label>
              <input 
                required 
                type="text" 
                value={formData.lastName} 
                onChange={e => setFormData({...formData, lastName: e.target.value})} 
                className="w-full border border-slate-200 rounded-xl shadow-sm text-xs p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Designation *</label>
              <input 
                required 
                type="text" 
                placeholder="e.g. Lead Coordinator"
                value={formData.designation} 
                onChange={e => setFormData({...formData, designation: e.target.value})} 
                className="w-full border border-slate-200 rounded-xl shadow-sm text-xs p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Department</label>
              <input 
                type="text" 
                placeholder="e.g. Field Operations"
                value={formData.department} 
                onChange={e => setFormData({...formData, department: e.target.value})} 
                className="w-full border border-slate-200 rounded-xl shadow-sm text-xs p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Email Address</label>
            <input 
              type="email" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              className="w-full border border-slate-200 rounded-xl shadow-sm text-xs p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Phone Number</label>
            <input 
              type="tel" 
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
              className="w-full border border-slate-200 rounded-xl shadow-sm text-xs p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Blood Group</label>
              <select
                className="w-full border border-slate-200 rounded-xl shadow-sm text-xs p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
                value={formData.bloodGroup} 
                onChange={e => setFormData({...formData, bloodGroup: e.target.value})}
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Date of Birth</label>
              <input 
                type="date" 
                value={formData.dateOfBirth} 
                onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} 
                className="w-full border border-slate-200 rounded-xl shadow-sm text-xs p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Joining Date</label>
              <input 
                type="date" 
                value={formData.joiningDate} 
                onChange={e => setFormData({...formData, joiningDate: e.target.value})} 
                className="w-full border border-slate-200 rounded-xl shadow-sm text-xs p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Emergency Contact</label>
              <input 
                type="tel" 
                placeholder="Relative / Phone"
                value={formData.emergencyContact} 
                onChange={e => setFormData({...formData, emergencyContact: e.target.value})} 
                className="w-full border border-slate-200 rounded-xl shadow-sm text-xs p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Home Address</label>
            <textarea 
              value={formData.address} 
              onChange={e => setFormData({...formData, address: e.target.value})} 
              rows={2} 
              className="w-full border border-slate-200 rounded-xl shadow-sm text-xs p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
            />
          </div>

          {/* Render inputs for any globally defined custom fields that the organization uses */}
          {customFields.length > 0 && (
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase">Organization Custom Fields</h4>
              {customFields.map(field => (
                <div key={field.id}>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">{field.name}</label>
                  <input 
                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                    required={field.required}
                    value={customData[field.id] || ''} 
                    onChange={e => setCustomData({...customData, [field.id]: e.target.value})} 
                    className="w-full border border-slate-200 rounded-xl shadow-sm text-xs p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
                  />
                </div>
              ))}
            </div>
          )}
        </form>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-2.5 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl shadow-sm hover:bg-slate-50 transition-colors w-full sm:w-auto"
          >
            Cancel
          </button>
          
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {memberToEdit?.idCardGenerated && onSaveAndRegenerate && (
              <button 
                type="button"
                onClick={handleSaveAndRegenerate}
                className="px-4 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                title="Save updated profile and open newly updated ID card"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                <span>Save & Re-generate ID</span>
              </button>
            )}
            <button 
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl shadow-sm hover:bg-emerald-500 transition-colors"
            >
              {memberToEdit ? 'Save Changes' : 'Add Member'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
