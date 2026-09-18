import { getOptimizeImageUrl } from "../lib/utils";
import React, { useState, useRef } from 'react';
import { useOrgStore } from '../store/useOrgStore';
import { CardRenderer } from '../components/CardRenderer';
import { Download, FileDown, Save, RefreshCw, Zap, User, Settings2, UploadCloud, Loader2, CheckCircle2, AlertCircle, QrCode, ExternalLink } from 'lucide-react';
import html2canvas from 'html2canvas';
import { uploadImage } from '../lib/storage';
import { generateIdCardPdf } from '../lib/pdfExport';
import { getMemberVerificationUrl } from '../utils/verification';

export function Generator() {
  const { organization, templates, activeTemplateId, addMember, customFields, userId } = useOrgStore();
  const [selectedTemplateId, setSelectedTemplateId] = useState(activeTemplateId || templates[0]?.id);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3500);
  };
  
  const template = templates.find(t => t.id === selectedTemplateId) || templates[0];
  
  const [formData, setFormData] = useState({
    memberId: '',
    firstName: '',
    lastName: '',
    designation: '',
    department: '',
    phone: '',
    email: '',
    bloodGroup: '',
    dateOfBirth: '',
    joiningDate: '',
    address: '',
    emergencyContact: '',
    photoUrl: '', // Allow user to upload or paste a real URL
    holding: '',
    village: '',
    ward: '',
    postOffice: '',
    thana: '',
    district: '',
  });

  const [customData, setCustomData] = useState<Record<string, string>>({});

  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  const previewMember = {
    id: 'preview',
    ...formData,
    status: 'Active' as const,
    customFields: customData,
  };

  const handleSaveData = () => {
    addMember({
      ...formData,
      status: 'Active',
      customFields: customData,
    });
    showFeedback('Member data saved successfully to the directory!');
  };

  const handleDownload = async () => {
    if (!frontRef.current) return;
    try {
      const canvas = await html2canvas(frontRef.current, { scale: 3, useCORS: true, logging: false });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formData.memberId}_front.png`;
      a.click();
      
      if (backRef.current && template.backElements.length > 0) {
        const backCanvas = await html2canvas(backRef.current, { scale: 3, useCORS: true, logging: false });
        const backUrl = backCanvas.toDataURL('image/png');
        const b = document.createElement('a');
        b.href = backUrl;
        b.download = `${formData.memberId}_back.png`;
        b.click();
      }
    } catch (err) {
      console.error('Failed to export image', err);
    }
  };

  const handleDownloadPdf = async () => {
    if (!frontRef.current) return;
    try {
      await generateIdCardPdf({
        frontElement: frontRef.current,
        backElement: backRef.current,
        member: previewMember as any,
        template,
        organization,
        options: { layout: 'cr80', action: 'download' },
      });
      showFeedback('PDF exported (Front & Back included)!');
    } catch (err) {
      console.error('Failed to export PDF', err);
      showFeedback('Failed to generate PDF.', 'error');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    try {
      setIsUploading(true);
      const ext = file.name.split('.').pop() || 'png';
      const path = `members/${userId}/${Date.now()}_photo.${ext}`;
      const url = await uploadImage(file, path, 'idcardimg');
      setFormData(prev => ({ ...prev, photoUrl: url }));
      showFeedback('Photo uploaded successfully!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      showFeedback('Failed to upload photo.', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    setFormData({
      memberId: '',
      firstName: '',
      lastName: '',
      designation: '',
      department: '',
      phone: '',
      email: '',
      bloodGroup: '',
      dateOfBirth: '',
      joiningDate: '',
      address: '',
      emergencyContact: '',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop',
      holding: '',
      village: '',
      ward: '',
      postOffice: '',
      thana: '',
      district: '',
    });
    setCustomData({});
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-0 -m-4 sm:-m-6 lg:-m-8 bg-slate-950 text-slate-300">
      
      {/* Left Form Panel */}
      <div className="w-full md:w-1/3 lg:w-[420px] bg-slate-900/50 backdrop-blur-xl border-r border-slate-800/60 flex flex-col h-full shrink-0 shadow-2xl z-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
        
        <div className="p-6 border-b border-slate-800/60 bg-slate-900/40 flex items-center justify-between shrink-0 relative z-10">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              Quick Generator
            </h2>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">Live Data Entry</p>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={selectedTemplateId} 
              onChange={e => setSelectedTemplateId(e.target.value)}
              className="bg-slate-800/80 border-slate-700/50 text-white text-xs rounded-lg shadow-sm py-2 pl-3 pr-8 focus:ring-emerald-500/50 focus:border-emerald-500/50 backdrop-blur-md transition-all hover:bg-slate-800 appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
            >
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar relative z-10">
          {feedback && (
            <div
              className={`p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-semibold ${
                feedback.type === 'error'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-800/80'
                  : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
              }`}
            >
              {feedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}
          
          {/* Core Fields Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <User className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">Identity Information</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Core Member Details</p>
              </div>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-2 ml-1">Student / Member ID <span className="text-emerald-500">*</span></label>
                <input type="text" value={formData.memberId} onChange={e => setFormData({...formData, memberId: e.target.value})} className="w-full bg-slate-900 border border-slate-700/50 rounded-xl text-sm text-white p-3.5 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner placeholder-slate-600 font-medium" placeholder="e.g. ACME-001" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-2 ml-1">First Name <span className="text-emerald-500">*</span></label>
                  <input type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-slate-900 border border-slate-700/50 rounded-xl text-sm text-white p-3.5 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner placeholder-slate-600 font-medium" placeholder="First Name" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-2 ml-1">Last Name</label>
                  <input type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-slate-900 border border-slate-700/50 rounded-xl text-sm text-white p-3.5 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner placeholder-slate-600 font-medium" placeholder="Last Name" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-2 ml-1">Profile Photo</label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded border border-slate-700/50 overflow-hidden bg-slate-900 shrink-0 flex items-center justify-center">
                    {formData.photoUrl ? (
                      <img src={getOptimizeImageUrl(formData.photoUrl)} className="w-full h-full object-cover" alt="Profile" />
                    ) : (
                      <User className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
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
                    className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded-xl text-sm text-white p-3 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 font-medium"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <UploadCloud className="w-4 h-4 text-emerald-400" />}
                    {isUploading ? 'Uploading...' : 'Upload Photo'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-2 ml-1">Designation</label>
                  <input type="text" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} className="w-full bg-slate-900 border border-slate-700/50 rounded-xl text-sm text-white p-3.5 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner placeholder-slate-600 font-medium" placeholder="e.g. Director" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-2 ml-1">Blood Group</label>
                  <select value={formData.bloodGroup} onChange={e => setFormData({...formData, bloodGroup: e.target.value})} className="w-full bg-slate-900 border border-slate-700/50 rounded-xl text-sm text-white p-3.5 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner font-medium appearance-none">
                    <option value="">Select</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-2 ml-1">Department / Course</label>
                <input type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full bg-slate-900 border border-slate-700/50 rounded-xl text-sm text-white p-3.5 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner placeholder-slate-600 font-medium" placeholder="e.g. IT Department" />
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-2 ml-1">Contact Number</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-900 border border-slate-700/50 rounded-xl text-sm text-white p-3.5 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner placeholder-slate-600 font-medium" placeholder="+880 1..." />
              </div>
            </div>
          </div>

        </div>

        <div className="p-5 bg-slate-900/60 border-t border-slate-800/60 grid grid-cols-2 gap-4 shrink-0 relative z-10 backdrop-blur-xl">
          <button onClick={handleReset} className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold tracking-wide transition-all border border-slate-700/50 shadow-sm">
            <RefreshCw className="w-4 h-4" /> Reset
          </button>
          <button onClick={handleSaveData} className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl text-sm font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-500/50">
            <Save className="w-4 h-4" /> Save Data
          </button>
        </div>
      </div>

      {/* Right Live Preview Panel */}
      <div className="flex-1 overflow-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black flex flex-col items-center justify-start p-8 lg:p-12 relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
        
        <div className="w-full max-w-4xl flex items-center justify-between mb-12 relative z-10">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 tracking-wider uppercase drop-shadow-sm">
              Template <span className="text-white">{template.name}</span>
            </h1>
            <p className="text-xs font-bold text-emerald-500 mt-2 uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Synchronization
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={handleDownload} className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold tracking-wide transition-all shadow-lg backdrop-blur-md border border-white/10 hover:border-white/20">
              <Download className="w-4 h-4" /> Export PNG
            </button>
            <button onClick={handleDownloadPdf} className="flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold tracking-wide transition-all shadow-lg shadow-emerald-600/20">
              <FileDown className="w-4 h-4" /> 1 PDF (Both Sides)
            </button>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row items-center xl:items-start justify-center gap-10 w-full max-w-5xl transition-all relative z-10">
          
          {/* Front Side */}
          <div className="flex flex-col items-center gap-4 group">
            <span className="text-xs font-black text-slate-400 tracking-[0.2em] uppercase">Front Layout</span>
            <div className="p-1 bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-2xl rounded-[1.5rem] shadow-2xl ring-1 ring-white/10 transition-transform duration-500 hover:scale-[1.02]">
              <div ref={frontRef} className="rounded-[1.25rem] overflow-hidden shadow-2xl pointer-events-none ring-1 ring-black/5 w-max">
                <CardRenderer 
                  template={template} 
                  member={previewMember as any} 
                  organization={organization} 
                  side="front" 
                  scale={typeof window !== 'undefined' && window.innerWidth < 640 ? 1 : 1.5} 
                />
              </div>
            </div>
          </div>

          {/* Back Side */}
          <div className="flex flex-col items-center gap-6 group">
            <span className="text-xs font-black text-slate-400 tracking-[0.2em] uppercase">Back Layout</span>
            <div className="p-1 bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-2xl rounded-[1.5rem] shadow-2xl ring-1 ring-white/10 transition-transform duration-500 hover:scale-[1.02]">
              <div ref={backRef} className="rounded-[1.25rem] overflow-hidden shadow-2xl pointer-events-none ring-1 ring-black/5 w-max">
                <CardRenderer 
                  template={template} 
                  member={previewMember as any} 
                  organization={organization} 
                  side="back" 
                  scale={typeof window !== 'undefined' && window.innerWidth < 640 ? 1 : 1.5} 
                />
              </div>
            </div>
          </div>

        </div>

        {/* QR Verification Status Bar */}
        <div className="mt-10 w-full max-w-3xl bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md relative z-10">
          <div className="flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Direct Public Verification QR Code</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  Active
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 truncate max-w-md mt-0.5">
                {getMemberVerificationUrl(previewMember as any, organization)}
              </div>
            </div>
          </div>

          <a
            href={getMemberVerificationUrl(previewMember as any, organization)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
          >
            <span>Test QR Link</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
