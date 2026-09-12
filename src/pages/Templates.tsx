import React, { useState } from 'react';
import { useOrgStore } from '../store/useOrgStore';
import { cn } from '../utils';
import { Layout, Check, Copy, Trash2, Plus, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ConfirmModal } from '../components/ConfirmModal';

export function Templates() {
  const { templates, activeTemplateId, setActiveTemplate, addTemplate, deleteTemplate, duplicateTemplate } = useOrgStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });

  const [newTemplateData, setNewTemplateData] = useState({
    name: 'New Custom Template',
    orientation: 'portrait' as 'portrait' | 'landscape',
    backgroundColor: '#ffffff',
  });

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const isPortrait = newTemplateData.orientation === 'portrait';
    const width = isPortrait ? 50 : 80;
    const height = isPortrait ? 80 : 50;

    addTemplate({
      name: newTemplateData.name,
      width,
      height,
      orientation: newTemplateData.orientation,
      backgroundColor: newTemplateData.backgroundColor,
      frontElements: [
        {
          id: 'title-el',
          type: 'text',
          x: width * 0.1,
          y: 8,
          width: width * 0.8,
          height: 8,
          z: 1,
          content: 'ORGANIZATION ID CARD',
          fontSize: 3.5,
          fontFamily: 'sans-serif',
          fontWeight: 'bold',
          color: '#1e293b',
          textAlign: 'center'
        },
        {
          id: 'photo-placeholder',
          type: 'image',
          x: (width - 24) / 2,
          y: 20,
          width: 24,
          height: 28,
          z: 1,
          borderRadius: 4
        },
        {
          id: 'name-field',
          type: 'text',
          x: width * 0.1,
          y: 52,
          width: width * 0.8,
          height: 6,
          z: 2,
          content: '{{firstName}} {{lastName}}',
          fontSize: 3.5,
          fontFamily: 'sans-serif',
          fontWeight: 'bold',
          color: '#0f172a',
          textAlign: 'center'
        },
        {
          id: 'role-field',
          type: 'text',
          x: width * 0.1,
          y: 58,
          width: width * 0.8,
          height: 5,
          z: 2,
          content: '{{designation}}',
          fontSize: 2.8,
          fontFamily: 'sans-serif',
          color: '#059669',
          textAlign: 'center'
        },
        {
          id: 'id-field',
          type: 'text',
          x: width * 0.1,
          y: 64,
          width: width * 0.8,
          height: 4,
          z: 2,
          content: 'ID: {{memberId}}',
          fontSize: 2.5,
          fontFamily: 'monospace',
          color: '#64748b',
          textAlign: 'center'
        },
        {
          id: 'qr-el',
          type: 'qr',
          x: (width - 12) / 2,
          y: 70,
          width: 12,
          height: 12,
          z: 2,
          qrData: 'https://ghf-ngo.org/verify/{{memberId}}'
        }
      ],
      backElements: [
        {
          id: 'back-text-1',
          type: 'text',
          x: width * 0.08,
          y: 10,
          width: width * 0.84,
          height: 10,
          z: 1,
          content: 'Emergency Contact: {{emergencyContact}}',
          fontSize: 2.5,
          fontFamily: 'sans-serif',
          color: '#334155'
        }
      ]
    });

    setIsCreateModalOpen(false);
    setNewTemplateData({
      name: 'New Custom Template',
      orientation: 'portrait',
      backgroundColor: '#ffffff'
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Template"
        message={`Are you sure you want to delete "${deleteConfirm.name}"? This template will no longer be available for ID badge generation.`}
        confirmText="Delete Template"
        onConfirm={() => deleteTemplate(deleteConfirm.id)}
        onClose={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
      />

      {/* New Template Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create New ID Card Template</h3>
              <button 
                type="button" 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateTemplate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Template Name *</label>
                <input
                  type="text"
                  required
                  value={newTemplateData.name}
                  onChange={e => setNewTemplateData({ ...newTemplateData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Orientation</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewTemplateData({ ...newTemplateData, orientation: 'portrait' })}
                    className={cn(
                      "p-3 rounded-xl border text-center text-xs font-semibold flex flex-col items-center gap-2 transition-all",
                      newTemplateData.orientation === 'portrait' 
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    )}
                  >
                    <div className="w-6 h-9 border-2 border-current rounded" />
                    Portrait (54 x 85.6 mm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTemplateData({ ...newTemplateData, orientation: 'landscape' })}
                    className={cn(
                      "p-3 rounded-xl border text-center text-xs font-semibold flex flex-col items-center gap-2 transition-all",
                      newTemplateData.orientation === 'landscape' 
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    )}
                  >
                    <div className="w-9 h-6 border-2 border-current rounded" />
                    Landscape (85.6 x 54 mm)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Card Background Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newTemplateData.backgroundColor}
                    onChange={e => setNewTemplateData({ ...newTemplateData, backgroundColor: e.target.value })}
                    className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={newTemplateData.backgroundColor}
                    onChange={e => setNewTemplateData({ ...newTemplateData, backgroundColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-500 shadow-sm"
                >
                  Create & Design
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">ID Card Templates</h1>
          <p className="mt-1 text-xs text-slate-500">
            Manage your organization's ID card designs. The active template will be used for new cards.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-colors"
          >
            <Plus className="-ml-0.5 mr-1.5 h-4 w-4" aria-hidden="true" />
            New Template
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {templates.map((template) => {
          const isActive = template.id === activeTemplateId;
          
          return (
            <div 
              key={template.id}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md",
                isActive ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-200"
              )}
            >
              {isActive && (
                <div className="absolute -top-2.5 -right-2.5 bg-emerald-600 text-white p-1 rounded-full shadow-md">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
              
              <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-100 p-6 mb-4 h-48 overflow-hidden relative">
                <div 
                  className="shadow-md rounded-md border border-slate-200 flex flex-col items-center justify-center text-[10px] text-slate-400 font-medium p-2 text-center"
                  style={{ 
                    width: `${template.width * 1.5}px`, 
                    height: `${template.height * 1.5}px`,
                    backgroundColor: template.backgroundColor || '#fff',
                    backgroundImage: template.backgroundUrl ? `url(${template.backgroundUrl})` : 'none',
                    backgroundSize: 'cover'
                  }}
                >
                  <Layout className="w-5 h-5 opacity-30 mb-1" />
                  <span className="opacity-60 text-[9px] line-clamp-1">{template.name}</span>
                </div>
              </div>
              
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{template.name}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                      {template.width} x {template.height} mm ({template.orientation})
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => setActiveTemplate(template.id)}
                    className={cn(
                      "flex-1 justify-center rounded-xl px-3 py-1.5 text-xs font-bold shadow-sm border transition-colors",
                      isActive 
                        ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                        : "bg-white text-slate-800 border-slate-300 hover:bg-slate-50"
                    )}
                    disabled={isActive}
                  >
                    {isActive ? 'Active Template' : 'Set Active'}
                  </button>
                  <Link
                    to="/admin/people"
                    className="inline-flex justify-center rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-sm"
                  >
                    Issue Cards
                  </Link>
                  <button 
                    onClick={() => duplicateTemplate(template.id)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors" 
                    title="Duplicate Template"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {templates.length > 1 && (
                    <button 
                      onClick={() => setDeleteConfirm({ isOpen: true, id: template.id, name: template.name })}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" 
                      title="Delete Template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
