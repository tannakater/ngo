import { getOptimizeImageUrl } from "../lib/utils";
import React, { useState, useRef, useEffect } from 'react';
import { useOrgStore } from '../store/useOrgStore';
import { CardRenderer } from './CardRenderer';
import { 
  X, Search, User, Layout, Eye, Download, 
  ChevronRight, ChevronLeft, CheckCircle2,
  HardDrive, Loader2, ExternalLink, Printer,
  RefreshCw, AlertCircle, Sparkles, FileText,
  FileDown, QrCode
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { cn } from '../utils';
import { uploadImage } from '../lib/storage';
import { generateIdCardPdf } from '../lib/pdfExport';
import { getMemberVerificationUrl } from '../utils/verification';

interface QuickGenModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMemberId?: string;
}

export function QuickGenModal({ isOpen, onClose, initialMemberId }: QuickGenModalProps) {
  const { members, templates, organization, updateMember } = useOrgStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(initialMemberId || null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(templates[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | 'Volunteer' | 'Staff' | 'Member'>('All');
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfLayout, setPdfLayout] = useState<'cr80' | 'single-sheet' | 'a4'>('cr80');
  const [previewScale, setPreviewScale] = useState(0.9);
  const [driveSavedUrl, setDriveSavedUrl] = useState<string | null>(null);
  
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  // Sync state when initialMemberId or isOpen changes
  useEffect(() => {
    if (isOpen) {
      if (initialMemberId) {
        setSelectedMemberId(initialMemberId);
        const mem = members.find(m => m.id === initialMemberId);
        
        // Priority 1: Use the template the card was already generated with
        if (mem?.idCardTemplateId && templates.some(t => t.id === mem.idCardTemplateId)) {
          setSelectedTemplateId(mem.idCardTemplateId);
        } 
        // Priority 2: Use the globally active template
        else if (useOrgStore.getState().activeTemplateId && templates.some(t => t.id === useOrgStore.getState().activeTemplateId)) {
          setSelectedTemplateId(useOrgStore.getState().activeTemplateId);
        }
        // Priority 3: Fallback to the first template in the list
        else if (templates[0]?.id) {
          setSelectedTemplateId(templates[0].id);
        }

        // If card was already generated, user doesn't need to re-generate from scratch; jump to preview/download!
        if (mem?.idCardGenerated) {
          setStep(3);
        } else {
          setStep(2);
        }
      } else {
        setSelectedMemberId(null);
        setStep(1);
      }
      setDriveSavedUrl(null);
    }
  }, [isOpen, initialMemberId, members, templates]);

  if (!isOpen) return null;

  const handleExport = async () => {
    if (!frontRef.current || !selectedMemberId || !selectedTemplateId) return;
    const member = members.find(m => m.id === selectedMemberId);
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!member || !template) return;

    try {
      const canvas = await html2canvas(frontRef.current, { scale: 2, useCORS: true });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${member.memberId}_${template.name.replace(/\s+/g, '_')}_front.png`;
      a.click();
      
      if (backRef.current && template.backElements.length > 0) {
        const backCanvas = await html2canvas(backRef.current, { scale: 2, useCORS: true });
        const backUrl = backCanvas.toDataURL('image/png');
        const b = document.createElement('a');
        b.href = backUrl;
        b.download = `${member.memberId}_${template.name.replace(/\s+/g, '_')}_back.png`;
        b.click();
      }

      // Mark ID card as officially generated and current
      updateMember(member.id, {
        idCardGenerated: true,
        idCardGeneratedAt: new Date().toISOString(),
        idCardTemplateId: selectedTemplateId,
        needsRegeneration: false,
      });
    } catch (err) {
      console.error('Failed to export image', err);
    }
  };

  const handleSaveToDrive = async () => {
    if (!frontRef.current || !selectedMemberId || !selectedTemplateId) return;
    const member = members.find(m => m.id === selectedMemberId);
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!member || !template) return;

    try {
      setIsSavingToDrive(true);
      setDriveSavedUrl(null);
      const canvas = await html2canvas(frontRef.current, { scale: 2, useCORS: true });
      
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'));
      if (!blob) throw new Error('Could not render card image');

      const file = new File([blob], `${member.memberId}_card_front.png`, { type: 'image/png' });
      const uploadedUrl = await uploadImage(file, `idcards/${member.memberId}_card.png`, 'idcardimg');
      setDriveSavedUrl(uploadedUrl);

      // Mark ID card as officially generated and current
      updateMember(member.id, {
        idCardGenerated: true,
        idCardGeneratedAt: new Date().toISOString(),
        idCardTemplateId: selectedTemplateId,
        needsRegeneration: false,
      });
    } catch (err: any) {
      console.error('Failed to save to Google Drive', err);
      alert(err.message || 'Failed to save to Drive. Ensure you are signed in.');
    } finally {
      setIsSavingToDrive(false);
    }
  };

  const handlePrint = async () => {
    if (!frontRef.current || !selectedMemberId || !selectedTemplateId) return;
    const member = members.find(m => m.id === selectedMemberId);
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!member || !template) return;

    try {
      setIsPrinting(true);
      const frontCanvas = await html2canvas(frontRef.current, { scale: 2, useCORS: true });
      const frontDataUrl = frontCanvas.toDataURL('image/png');

      let backDataUrl = '';
      if (backRef.current && template.backElements.length > 0) {
        const backCanvas = await html2canvas(backRef.current, { scale: 2, useCORS: true });
        backDataUrl = backCanvas.toDataURL('image/png');
      }

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>ID Card - ${member.firstName} ${member.lastName} (${member.memberId})</title>
              <style>
                @page { margin: 10mm; }
                body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; padding: 20px; background: #fff; }
                .card-img { max-width: 320px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .no-print { margin-bottom: 20px; }
                @media print {
                  .no-print { display: none; }
                  body { padding: 0; }
                  .card-img { box-shadow: none; }
                }
              </style>
            </head>
            <body>
              <div class="no-print">
                <button onclick="window.print()" style="padding: 8px 16px; background: #059669; color: #fff; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
                  Print ID Card
                </button>
              </div>
              <img class="card-img" src="${frontDataUrl}" alt="Front Card" />
              ${backDataUrl ? `<img class="card-img" src="${backDataUrl}" alt="Back Card" />` : ''}
              <script>
                window.onload = function() { window.print(); }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }

      // Mark ID card as officially generated
      updateMember(member.id, {
        idCardGenerated: true,
        idCardGeneratedAt: new Date().toISOString(),
        idCardTemplateId: selectedTemplateId,
        needsRegeneration: false,
      });
    } catch (err) {
      console.error('Print preview failed', err);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleExportPdf = async (action: 'print' | 'download', overrideLayout?: 'a4' | 'cr80' | 'single-sheet') => {
    if (!frontRef.current || !selectedMemberId || !selectedTemplateId) return;
    const member = members.find(m => m.id === selectedMemberId);
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!member || !template) return;

    try {
      setIsGeneratingPdf(true);
      await generateIdCardPdf({
        frontElement: frontRef.current,
        backElement: backRef.current,
        member,
        template,
        organization,
        options: {
          layout: overrideLayout || pdfLayout,
          action,
        },
      });

      // Mark ID card as officially generated
      updateMember(member.id, {
        idCardGenerated: true,
        idCardGeneratedAt: new Date().toISOString(),
        idCardTemplateId: selectedTemplateId,
        needsRegeneration: false,
      });
    } catch (err: any) {
      console.error('Failed to generate PDF', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const filteredMembers = members.filter(m => {
    const matchesQuery = 
      m.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.memberId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.department && m.department.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = roleFilter === 'All' || m.role === roleFilter;
    return matchesQuery && matchesRole;
  });

  const steps = [
    { num: 1, label: 'Member', icon: User },
    { num: 2, label: 'Template', icon: Layout },
    { num: 3, label: 'Preview', icon: Eye }
  ];

  const resetAndClose = () => {
    setStep(1);
    setSelectedMemberId(null);
    setSearchQuery('');
    onClose();
  };

  const selectedMember = members.find(m => m.id === selectedMemberId);
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header & Stepper */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-bold text-slate-800">Quick Generator</h2>
            <div className="h-6 w-px bg-slate-300" />
            <div className="flex items-center gap-3">
              {steps.map((s, idx) => (
                <div key={s.num} className="flex items-center gap-3">
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors",
                    step === s.num ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-600/20 ring-offset-1" : 
                    step > s.num ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                  )}>
                    {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                  </div>
                  <span className={cn(
                    "text-sm font-semibold hidden sm:block tracking-wide",
                    step >= s.num ? "text-slate-800" : "text-slate-400"
                  )}>
                    {s.label}
                  </span>
                  {idx < steps.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300 mx-1" />}
                </div>
              ))}
            </div>
          </div>
          <button onClick={resetAndClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-slate-50/50 flex flex-col relative">
          
          {/* Step 1: Select Member */}
          {step === 1 && (
            <div className="absolute inset-0 flex flex-col p-6 animate-in slide-in-from-left-4 fade-in duration-300">
              <div className="max-w-xl mx-auto w-full h-full flex flex-col">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900">Select a Member</h3>
                  <p className="text-slate-500 mt-1 text-sm">Choose whose ID card you want to generate.</p>
                </div>
                
                <div className="space-y-3 mb-4 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search by name, ID, or department..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {(['All', 'Volunteer', 'Staff', 'Member'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRoleFilter(r)}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold transition-colors whitespace-nowrap",
                          roleFilter === r
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        {r === 'All' ? 'All Personnel' : `${r}s`}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {filteredMembers.map(member => (
                    <div 
                      key={member.id}
                      onClick={() => {
                        setSelectedMemberId(member.id);
                        setStep(2);
                      }}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl cursor-pointer border transition-all duration-200",
                        selectedMemberId === member.id 
                          ? "bg-emerald-50 border-emerald-300 shadow-sm ring-1 ring-emerald-600/10" 
                          : "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md"
                      )}
                    >
                      {member.photoUrl ? (
                        <img src={getOptimizeImageUrl(member.photoUrl)} alt="" className="w-12 h-12 rounded-full object-cover bg-slate-100 ring-2 ring-white shadow-sm shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-100 ring-2 ring-white shadow-sm flex items-center justify-center shrink-0">
                          <span className="text-slate-400 text-sm font-bold">{member.firstName?.[0]}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 truncate">{member.firstName} {member.lastName}</h4>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                            member.role === 'Volunteer' ? "bg-emerald-100 text-emerald-800" :
                            member.role === 'Staff' ? "bg-blue-100 text-blue-800" :
                            "bg-slate-100 text-slate-700"
                          )}>
                            {member.role || 'Member'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <span className="font-mono text-[11px] font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{member.memberId}</span>
                          <span className="truncate">&bull; {member.designation}</span>
                          {member.department && <span className="truncate text-slate-400">({member.department})</span>}
                        </div>
                      </div>
                      <ChevronRight className={cn("w-5 h-5 transition-colors shrink-0", selectedMemberId === member.id ? "text-emerald-600" : "text-slate-300")} />
                    </div>
                  ))}
                  {filteredMembers.length === 0 && (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      No personnel records found matching "{searchQuery}"
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Select Template */}
          {step === 2 && (
            <div className="absolute inset-0 flex flex-col p-6 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="max-w-4xl mx-auto w-full h-full flex flex-col">
                <div className="text-center mb-8 shrink-0">
                  <h3 className="text-2xl font-bold text-slate-900">Choose a Template</h3>
                  <p className="text-slate-500 mt-1 text-sm">Select the design layout for {selectedMember?.firstName}'s card.</p>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                    {templates.map(tmpl => (
                      <div 
                        key={tmpl.id}
                        onClick={() => setSelectedTemplateId(tmpl.id)}
                        className={cn(
                          "group relative flex flex-col items-center gap-4 p-6 rounded-2xl cursor-pointer border-2 transition-all duration-300",
                          selectedTemplateId === tmpl.id 
                            ? "bg-blue-50/50 border-blue-500 shadow-lg shadow-blue-500/10" 
                            : "bg-white border-transparent shadow-md hover:shadow-xl hover:-translate-y-1"
                        )}
                      >
                        {selectedTemplateId === tmpl.id && (
                          <div className="absolute top-3 right-3 bg-blue-500 text-white p-1 rounded-full shadow-sm">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                        <div className="w-24 h-32 bg-slate-100 rounded-lg shadow-inner ring-1 ring-slate-200 flex items-center justify-center overflow-hidden">
                          <Layout className="w-8 h-8 text-slate-300 group-hover:text-blue-400 transition-colors" />
                        </div>
                        <div className="text-center">
                          <h4 className="font-bold text-slate-800">{tmpl.name}</h4>
                          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{tmpl.orientation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Preview & Export */}
          {step === 3 && selectedMember && selectedTemplate && (
            <div className="absolute inset-0 flex flex-col p-6 animate-in slide-in-from-right-4 fade-in duration-300 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-slate-200">
              <div className="max-w-5xl mx-auto w-full h-full flex flex-col">
                
                {/* Generation Status Banner */}
                {selectedMember.idCardGenerated && !selectedMember.needsRegeneration && (
                  <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-emerald-950 block">
                          Official ID Card Already Generated & Active
                        </span>
                        <span className="text-emerald-800 text-[11px]">
                          This card is already active and does not need to be generated again. You can download or print directly.
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setStep(2)}
                      className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline shrink-0 px-2 py-1 hover:bg-emerald-100/50 rounded-lg transition-colors"
                    >
                      Change Layout Template
                    </button>
                  </div>
                )}

                {selectedMember.idCardGenerated && selectedMember.needsRegeneration && (
                  <div className="mb-4 p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg shrink-0">
                        <RefreshCw className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-amber-950 block">
                          Profile Info Edited — Ready to Re-generate
                        </span>
                        <span className="text-amber-800 text-[11px]">
                          Admin updated member details. The preview below reflects the updated info. Click "Re-issue & Download" to update the card.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {!selectedMember.idCardGenerated && (
                  <div className="mb-4 p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-blue-950 block">
                          New ID Card Ready for Generation
                        </span>
                        <span className="text-blue-800 text-[11px]">
                          Review the official layout below. Once generated, this card will remain valid without needing re-generation unless edited.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* PDF Format & Preview Scale Bar */}
                <div className="mb-3 px-4 py-2.5 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs shrink-0">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-800">PDF Format:</span>
                    <span className="text-[11px] text-slate-500 hidden lg:inline">
                      {pdfLayout === 'cr80' 
                        ? '1 PDF file containing Front (Page 1) and Back (Page 2) at exact 5cm × 8cm' 
                        : pdfLayout === 'single-sheet'
                        ? '1 PDF page containing BOTH Front & Back side-by-side (easy print & fold)'
                        : 'Standard A4 Paper (centered 5cm × 8cm cards, no extra text or borders)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
                    {/* Layout Selector */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                      <button
                        type="button"
                        onClick={() => setPdfLayout('cr80')}
                        className={cn(
                          "px-2.5 py-1 rounded-lg font-bold transition-all text-xs whitespace-nowrap",
                          pdfLayout === 'cr80'
                            ? "bg-white text-emerald-700 shadow-xs border border-slate-200/60"
                            : "text-slate-600 hover:text-slate-900"
                        )}
                        title="1 PDF file with 2 pages: Front & Back"
                      >
                        5cm × 8cm (Both Sides)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPdfLayout('single-sheet')}
                        className={cn(
                          "px-2.5 py-1 rounded-lg font-bold transition-all text-xs whitespace-nowrap",
                          pdfLayout === 'single-sheet'
                            ? "bg-white text-emerald-700 shadow-xs border border-slate-200/60"
                            : "text-slate-600 hover:text-slate-900"
                        )}
                        title="1 Single PDF page with Front & Back side-by-side"
                      >
                        Single Sheet (1 Page)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPdfLayout('a4')}
                        className={cn(
                          "px-2.5 py-1 rounded-lg font-bold transition-all text-xs whitespace-nowrap",
                          pdfLayout === 'a4'
                            ? "bg-white text-emerald-700 shadow-xs border border-slate-200/60"
                            : "text-slate-600 hover:text-slate-900"
                        )}
                        title="Standard A4 Paper with centered cards"
                      >
                        A4 Paper
                      </button>
                    </div>

                    {/* Preview Zoom Controls */}
                    <div className="hidden sm:flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-xl border border-slate-200 text-xs text-slate-600">
                      <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Zoom</span>
                      <button
                        type="button"
                        onClick={() => setPreviewScale(0.9)}
                        className={cn("px-2 py-0.5 rounded-md font-semibold text-xs transition-all", previewScale === 0.9 ? "bg-white text-blue-700 shadow-xs" : "hover:text-slate-900")}
                      >
                        Fit
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewScale(1.05)}
                        className={cn("px-2 py-0.5 rounded-md font-semibold text-xs transition-all", previewScale === 1.05 ? "bg-white text-blue-700 shadow-xs" : "hover:text-slate-900")}
                      >
                        100%
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewScale(1.25)}
                        className={cn("px-2 py-0.5 rounded-md font-semibold text-xs transition-all", previewScale === 1.25 ? "bg-white text-blue-700 shadow-xs" : "hover:text-slate-900")}
                      >
                        125%
                      </button>
                    </div>
                  </div>
                </div>

                {/* ID Card Previews: Guaranteed Visible, Side-by-Side */}
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 flex flex-col items-center custom-scrollbar">
                  <div className="w-full flex flex-row flex-wrap sm:flex-nowrap items-start justify-center gap-6 sm:gap-10 pb-6">
                    {/* Front Card Preview */}
                    <div className="flex flex-col items-center gap-2.5 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-xs font-bold text-slate-700 tracking-wider uppercase">Front Side (5cm × 8cm)</span>
                      </div>
                      <div className="p-1 bg-white rounded-2xl shadow-xl ring-1 ring-slate-900/10">
                        <div ref={frontRef} className="rounded-xl overflow-hidden shadow-inner pointer-events-none w-max">
                          <CardRenderer 
                            template={selectedTemplate} 
                            member={selectedMember} 
                            organization={organization} 
                            side="front" 
                            scale={previewScale} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Back Card Preview */}
                    <div className="flex flex-col items-center gap-2.5 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span className="text-xs font-bold text-slate-700 tracking-wider uppercase">Back Side (5cm × 8cm)</span>
                      </div>
                      <div className="p-1 bg-white rounded-2xl shadow-xl ring-1 ring-slate-900/10">
                        <div ref={backRef} className="rounded-xl overflow-hidden shadow-inner pointer-events-none w-max">
                          <CardRenderer 
                            template={selectedTemplate} 
                            member={selectedMember} 
                            organization={organization} 
                            side="back" 
                            scale={previewScale} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QR Public Verification Indicator */}
                  <div className="mt-8 max-w-xl mx-auto bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-left shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                          <span>Unique Public Verification QR Code</span>
                          <span className="bg-emerald-200/70 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-bold uppercase">
                            Linked
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-700 mt-0.5">
                          Anyone who scans the card's QR code is routed directly to {selectedMember.firstName}'s public verification profile.
                        </p>
                      </div>
                    </div>
                    <a
                      href={getMemberVerificationUrl(selectedMember, organization)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shrink-0 shadow-xs cursor-pointer"
                    >
                      <span>Test Scan Link</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="bg-white border-t border-slate-200 p-4 flex items-center justify-between shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
          <button 
            onClick={() => setStep(step - 1 as 1 | 2)}
            disabled={step === 1}
            className="px-5 py-2.5 flex items-center gap-2 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 disabled:opacity-0 transition-all"
          >
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={resetAndClose}
              className="px-5 py-2.5 text-slate-500 font-semibold hover:text-slate-700 transition-colors"
            >
              Cancel
            </button>
            
            {step < 3 ? (
              <button 
                onClick={() => setStep(step + 1 as 2 | 3)}
                disabled={(step === 1 && !selectedMemberId) || (step === 2 && !selectedTemplateId)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none flex items-center gap-2 transition-all"
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {/* Save to Drive */}
                {driveSavedUrl ? (
                  <a
                    href={driveSavedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold rounded-xl flex items-center gap-1.5 text-xs hover:bg-emerald-100 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Saved in /idcardimg <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveToDrive}
                    disabled={isSavingToDrive}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 text-xs transition-colors border border-slate-300 disabled:opacity-50"
                    title="Upload directly to Google Drive under NGO/idcardimg"
                  >
                    {isSavingToDrive ? (
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    ) : (
                      <HardDrive className="w-4 h-4 text-emerald-600" />
                    )}
                    <span className="hidden sm:inline">{isSavingToDrive ? 'Uploading...' : 'Save to Drive'}</span>
                  </button>
                )}

                {/* Download PNG */}
                <button
                  type="button"
                  onClick={handleExport}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 text-xs transition-colors border border-slate-300"
                  title="Download Front & Back images (PNG)"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>PNG</span>
                </button>

                {/* Download PDF */}
                <button
                  type="button"
                  onClick={() => handleExportPdf('download')}
                  disabled={isGeneratingPdf}
                  className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl flex items-center gap-1.5 text-xs transition-colors border border-emerald-300 disabled:opacity-50 shadow-xs"
                  title={`Download ID Card as ${pdfLayout === 'a4' ? 'A4 Printable Sheet' : 'CR-80'} PDF`}
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  ) : (
                    <FileDown className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>Download PDF</span>
                </button>

                {/* Print PDF (Primary Action) */}
                <button
                  type="button"
                  onClick={() => handleExportPdf('print')}
                  disabled={isGeneratingPdf || isPrinting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 text-xs transition-all disabled:opacity-50"
                  title="Generate print-ready PDF and open Print Dialog"
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Printer className="w-4 h-4" />
                  )}
                  <span>Print PDF</span>
                </button>

                {selectedMember?.needsRegeneration && (
                  <button 
                    onClick={() => handleExportPdf('download')}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md shadow-amber-600/20 flex items-center gap-1.5 text-xs transition-all"
                    title="Re-issue official card with latest profile changes"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Re-issue Card</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
      `}</style>
    </div>
  );
}
