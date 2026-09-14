import { getOptimizeImageUrl } from "../lib/utils";
import React, { useState, useRef } from 'react';
import { useOrgStore } from '../store/useOrgStore';
import { CheckSquare, Square, Printer, Download, X, Loader2 } from 'lucide-react';
import { cn } from '../utils';
import { CardRenderer } from '../components/CardRenderer';
import { toPng, toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';

type ExportFormat = 'pdf' | 'png' | 'jpg';
type ExportQuality = 'web' | 'high' | 'print';

export function PrintCenter() {
  const { members, templates, activeTemplateId, organization } = useOrgStore();
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const template = templates.find(t => t.id === activeTemplateId) || templates[0];
  const printRef = useRef<HTMLDivElement>(null);
  
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [exportQuality, setExportQuality] = useState<ExportQuality>('high');
  const [isExporting, setIsExporting] = useState(false);

  const toggleMember = (id: string) => {
    const next = new Set(selectedMemberIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedMemberIds(next);
  };

  const selectAll = () => {
    if (selectedMemberIds.size === members.length) {
      setSelectedMemberIds(new Set());
    } else {
      setSelectedMemberIds(new Set(members.map(m => m.id)));
    }
  };

  const handleExport = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    
    try {
      const scaleMap = {
        web: 2,
        high: 4,
        print: 6
      };
      
      const pixelRatio = scaleMap[exportQuality];
      const exportOptions = {
        pixelRatio,
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      };
      
      if (exportFormat === 'pdf') {
        const imgData = await toJpeg(printRef.current, exportOptions);
        
        // Calculate dimensions manually or use a standard A4 assumption
        // Since we are capturing the whole PrintCenter layout (which is styled as A4)
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        const pdfWidth = 210; // A4 width in mm
        // Calculate height based on A4 ratio to maintain aspect ratio perfectly
        const pdfHeight = 297; 
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${organization.shortName}-ID-Cards.pdf`);
      } else {
        const mimeType = exportFormat === 'png' ? 'image/png' : 'image/jpeg';
        const imgData = exportFormat === 'png' 
          ? await toPng(printRef.current, exportOptions)
          : await toJpeg(printRef.current, exportOptions);
        
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `${organization.shortName}-ID-Cards.${exportFormat}`;
        link.click();
      }
      
      setIsExportModalOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-7.5rem)] min-h-[600px] flex flex-col relative">
      {/* Export Panel */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm">
          <div className="bg-white shadow-2xl w-full max-w-md h-full flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <h3 className="text-lg font-semibold text-slate-900">Export Settings</h3>
              <button 
                onClick={() => !isExporting && setIsExportModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-8 flex-1 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-4">File Format</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['pdf', 'png', 'jpg'] as ExportFormat[]).map(format => (
                    <button
                      key={format}
                      onClick={() => setExportFormat(format)}
                      className={cn(
                        "py-3 px-3 text-sm font-medium rounded-xl border transition-all duration-200 uppercase",
                        exportFormat === format 
                          ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600/20 shadow-sm" 
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 shadow-sm"
                      )}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-4">Export Quality</label>
                <div className="space-y-3">
                  {[
                    { id: 'web', label: 'Web (Standard)', desc: 'Faster generation, smaller file size' },
                    { id: 'high', label: 'High Resolution', desc: 'Crisp images, good for digital sharing' },
                    { id: 'print', label: 'Print Quality (300dpi)', desc: 'Best quality for physical printing' },
                  ].map(quality => (
                    <button
                      key={quality.id}
                      onClick={() => setExportQuality(quality.id as ExportQuality)}
                      className={cn(
                        "w-full flex flex-col text-left py-4 px-5 rounded-xl border transition-all duration-200",
                        exportQuality === quality.id 
                          ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600/20 shadow-sm" 
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-sm"
                      )}
                    >
                      <span className={cn(
                        "text-sm font-semibold",
                        exportQuality === quality.id ? "text-blue-900" : "text-slate-900"
                      )}>
                        {quality.label}
                      </span>
                      <span className={cn(
                        "text-xs mt-1",
                        exportQuality === quality.id ? "text-blue-700" : "text-slate-500"
                      )}>
                        {quality.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setIsExportModalOpen(false)}
                disabled={isExporting}
                className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleExport}
                disabled={isExporting}
                className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-500 disabled:opacity-50 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export {exportFormat.toUpperCase()}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="sm:flex sm:items-center sm:justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Print Center</h1>
          <p className="mt-1 text-sm text-slate-500">
            Generate and export printable ID cards for selected members.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:flex-none flex space-x-3">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            disabled={selectedMemberIds.size === 0}
            onClick={() => window.print()}
          >
            <Printer className="-ml-0.5 mr-1.5 h-5 w-5 text-slate-400" aria-hidden="true" />
            Print Sheet
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
            disabled={selectedMemberIds.size === 0}
            onClick={() => setIsExportModalOpen(true)}
          >
            <Download className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Export
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-6 overflow-hidden">
        {/* Selection Sidebar */}
        <div className="w-80 flex flex-col bg-white rounded-xl shadow-sm ring-1 ring-slate-200 overflow-hidden shrink-0">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-medium text-slate-900">Select Members</h3>
            <button 
              onClick={selectAll}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {selectedMemberIds.size === members.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            {members.map(member => (
              <div 
                key={member.id}
                onClick={() => toggleMember(member.id)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors mb-1",
                  selectedMemberIds.has(member.id) ? "bg-blue-50" : "hover:bg-slate-50"
                )}
              >
                <CheckSquare className={cn("w-5 h-5 shrink-0", selectedMemberIds.has(member.id) ? "text-blue-600" : "hidden")} />
                {!selectedMemberIds.has(member.id) && <Square className="w-5 h-5 text-slate-300 shrink-0" />}
                <div className="flex items-center gap-3 min-w-0">
                  {member.photoUrl ? (
                    <img src={getOptimizeImageUrl(member.photoUrl)} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 bg-slate-200" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0 flex items-center justify-center">
                      <span className="text-slate-400 text-xs font-medium">{member.firstName?.[0]}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{member.firstName} {member.lastName}</p>
                    <p className="text-xs text-slate-500 truncate">{member.memberId}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 min-h-0 bg-slate-200 rounded-xl overflow-auto p-8 relative flex flex-col items-center custom-scrollbar">
          {selectedMemberIds.size === 0 ? (
            <div className="m-auto text-center">
              <Printer className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900">No members selected</h3>
              <p className="text-slate-500 max-w-sm mt-1">Select one or more members from the sidebar to generate their ID cards.</p>
            </div>
          ) : (
            <div 
              className="bg-white max-w-[210mm] w-full p-[10mm] flex flex-wrap gap-4 print:m-0 print:p-0"
              style={{ minHeight: '297mm', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
            >
              <div ref={printRef} className="w-full flex flex-wrap gap-4">
                {/* This mimics an A4 sheet layout for printing */}
                {Array.from(selectedMemberIds).map(id => {
                  const member = members.find(m => m.id === id);
                  if (!member) return null;
                  
                  return (
                    <div key={id} className="flex gap-4 border border-slate-300 border-dashed p-2 print:border-none print:p-0 page-break-inside-avoid bg-white">
                      <CardRenderer template={template} member={member} organization={organization} side="front" scale={1} />
                      <CardRenderer template={template} member={member} organization={organization} side="back" scale={1} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
