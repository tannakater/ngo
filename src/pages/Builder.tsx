import { getOptimizeImageUrl } from "../lib/utils";
import React, { useState, useRef, useEffect } from 'react';
import { useOrgStore } from '../store/useOrgStore';
import { Rnd } from 'react-rnd';
import { cn } from '../utils';
import { 
  Type, Image as ImageIcon, QrCode, CreditCard, Save, 
  Download, Copy, Trash2, Undo, Redo, Layout, Smartphone,
  Square, Barcode
} from 'lucide-react';
import { CardElement } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function Builder() {
  const { templates, activeTemplateId, updateTemplate, organization } = useOrgStore();
  
  const template = templates.find(t => t.id === activeTemplateId) || templates[0];
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  if (!template) return <div>No template found</div>;

  const elements = activeSide === 'front' ? template.frontElements : template.backElements;

  const updateElements = (newElements: CardElement[]) => {
    updateTemplate(template.id, {
      [activeSide === 'front' ? 'frontElements' : 'backElements']: newElements
    });
  };

  const addElement = (type: CardElement['type']) => {
    const newElement: CardElement = {
      id: uuidv4(),
      type,
      x: template.width / 4,
      y: template.height / 4,
      width: type === 'text' ? 40 : 20,
      height: type === 'text' ? 10 : 20,
      z: elements.length,
      content: type === 'text' ? 'Double click to edit' : undefined,
      fontSize: 3.5,
      fontFamily: 'sans-serif',
      color: '#000000',
    };
    updateElements([...elements, newElement]);
    setSelectedElementId(newElement.id);
  };

  const updateElement = (id: string, updates: Partial<CardElement>) => {
    updateElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const deleteElement = (id: string) => {
    updateElements(elements.filter(el => el.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedElementId && (e.key === 'Delete' || e.key === 'Backspace')) {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }
        deleteElement(selectedElementId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, elements]);

  // The actual size in pixels to display (scale up mm to px for editing)
  // Let's use 1mm = 4px for base rendering, then apply zoom
  const MM_TO_PX = 4;
  const canvasWidth = template.width * MM_TO_PX;
  const canvasHeight = template.height * MM_TO_PX;

  const renderElementContent = (el: CardElement) => {
    switch (el.type) {
      case 'text':
        return (
          <div 
            className="w-full h-full flex flex-col" 
            style={{ 
              color: el.color, 
              fontSize: `${(el.fontSize || 3.5) * MM_TO_PX}px`,
              fontFamily: el.fontFamily,
              fontWeight: el.fontWeight,
              justifyContent: 'center',
              alignItems: el.textAlign === 'center' ? 'center' : el.textAlign === 'right' ? 'flex-end' : 'flex-start',
              textAlign: el.textAlign,
              whiteSpace: 'pre-wrap'
            }}
          >
            {el.content}
          </div>
        );
      case 'image':
        return (
          <div 
            className="w-full h-full bg-slate-200 border-2 border-dashed border-slate-400 flex items-center justify-center overflow-hidden"
            style={{ borderRadius: `${el.borderRadius || 0}px` }}
          >
            {el.src ? (
              <img src={getOptimizeImageUrl(el.src)} alt="" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="text-slate-400 w-1/2 h-1/2" />
            )}
          </div>
        );
      case 'qr':
        return (
          <div className="w-full h-full bg-white border border-slate-300 p-1 flex items-center justify-center">
             <QrCode className="text-slate-800 w-full h-full" />
          </div>
        );
      case 'barcode':
        return (
          <div className="w-full h-full bg-white border border-slate-300 p-1 flex items-center justify-center font-mono text-[10px] flex-col overflow-hidden">
             <div className="w-full h-3/4 bg-slate-800" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, #1e293b 2px, #1e293b 4px)' }}></div>
             <span className="mt-1">BARCODE</span>
          </div>
        );
      case 'shape':
        return (
          <div className="w-full h-full" style={{ backgroundColor: el.backgroundColor, borderRadius: `${el.borderRadius || 0}px` }} />
        );
      default:
        return null;
    }
  };

  const selectedElement = elements.find(el => el.id === selectedElementId);

  return (
    <div className="h-full flex flex-col bg-slate-100 -m-4 sm:-m-6 lg:-m-8">
      {/* Builder Topbar */}
      <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Layout className="w-4 h-4 text-blue-600" />
            {template.name}
          </h2>
          <div className="h-6 w-px bg-slate-200"></div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveSide('front')}
              className={cn("px-3 py-1 text-sm font-medium rounded-md", activeSide === 'front' ? "bg-white shadow-sm text-blue-600" : "text-slate-600 hover:text-slate-900")}
            >
              Front Side
            </button>
            <button
              onClick={() => setActiveSide('back')}
              className={cn("px-3 py-1 text-sm font-medium rounded-md", activeSide === 'back' ? "bg-white shadow-sm text-blue-600" : "text-slate-600 hover:text-slate-900")}
            >
              Back Side
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-md" title="Undo">
            <Undo className="w-4 h-4" />
          </button>
          <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-md" title="Redo">
            <Redo className="w-4 h-4" />
          </button>
          <div className="h-6 w-px bg-slate-200 mx-1"></div>
          <button className="inline-flex items-center justify-center rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
            <Download className="w-4 h-4 mr-1.5" />
            Preview
          </button>
          <button className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
            <Save className="w-4 h-4 mr-1.5" />
            Save
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <div className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-4 gap-4 shrink-0 z-10 shadow-sm">
          <button onClick={() => addElement('text')} className="p-3 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors" title="Add Text">
            <Type className="w-6 h-6" />
          </button>
          <button onClick={() => addElement('image')} className="p-3 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors" title="Add Image/Photo">
            <ImageIcon className="w-6 h-6" />
          </button>
          <button onClick={() => addElement('qr')} className="p-3 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors" title="Add QR Code">
            <QrCode className="w-6 h-6" />
          </button>
          <button onClick={() => addElement('barcode')} className="p-3 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors" title="Add Barcode">
            <Barcode className="w-6 h-6" />
          </button>
          <button onClick={() => addElement('shape')} className="p-3 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors" title="Add Shape">
            <Square className="w-6 h-6" />
          </button>
          <button className="p-3 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors" title="Background Settings">
            <CreditCard className="w-6 h-6" />
          </button>
        </div>

        {/* Canvas Area */}
        <div 
          className="flex-1 overflow-auto flex items-center justify-center bg-slate-100 p-8 relative"
          onClick={() => setSelectedElementId(null)}
        >
          {/* Grid background pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          
          <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-white rounded-lg shadow-sm border border-slate-200 p-1 z-20">
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-1 hover:bg-slate-100 rounded text-slate-600">-</button>
            <span className="text-xs font-medium w-12 text-center text-slate-600">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-1 hover:bg-slate-100 rounded text-slate-600">+</button>
          </div>

          <div 
            ref={canvasRef}
            className="relative bg-white shadow-2xl transition-transform origin-center overflow-hidden ring-1 ring-slate-900/5"
            style={{ 
              width: canvasWidth, 
              height: canvasHeight,
              transform: `scale(${zoom})`,
              backgroundColor: template.backgroundColor || '#ffffff',
              backgroundImage: template.backgroundUrl ? `url(${template.backgroundUrl})` : 'none',
              backgroundSize: 'cover'
            }}
          >
            {/* Rulers / Bleed marks could go here */}

            {elements.map((el) => (
              <Rnd
                key={el.id}
                bounds="parent"
                size={{ width: el.width * MM_TO_PX, height: el.height * MM_TO_PX }}
                position={{ x: el.x * MM_TO_PX, y: el.y * MM_TO_PX }}
                onDragStop={(e, d) => {
                  updateElement(el.id, { x: d.x / MM_TO_PX, y: d.y / MM_TO_PX });
                }}
                onResizeStop={(e, direction, ref, delta, position) => {
                  updateElement(el.id, {
                    width: parseFloat(ref.style.width) / MM_TO_PX,
                    height: parseFloat(ref.style.height) / MM_TO_PX,
                    ...position && { x: position.x / MM_TO_PX, y: position.y / MM_TO_PX }
                  });
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedElementId(el.id);
                }}
                className={cn(
                  "group relative cursor-move",
                  selectedElementId === el.id ? "ring-2 ring-blue-500 ring-offset-1 z-50" : `z-[${el.z}] hover:ring-1 hover:ring-blue-400/50`
                )}
                dragHandleClassName="drag-handle"
              >
                <div className="w-full h-full drag-handle relative">
                   {renderElementContent(el)}
                   {selectedElementId === el.id && (
                     <div className="absolute -top-3 -right-3 flex gap-1 bg-white shadow-md rounded-md p-1 border border-slate-200 z-50">
                       <button onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }} className="text-red-500 hover:bg-red-50 p-1 rounded">
                         <Trash2 className="w-3 h-3" />
                       </button>
                     </div>
                   )}
                </div>
              </Rnd>
            ))}
          </div>
        </div>

        {/* Right Properties Panel */}
        <div className="w-72 bg-white border-l border-slate-200 flex flex-col shrink-0 z-10 shadow-sm overflow-y-auto">
          <div className="p-4 border-b border-slate-200 font-medium text-slate-800 flex items-center justify-between">
            <span>Properties</span>
            {selectedElement && (
              <button
                type="button"
                onClick={() => deleteElement(selectedElement.id)}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-md flex items-center gap-1 transition-colors font-semibold"
                title="Delete selected element"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            )}
          </div>
          {selectedElement ? (
            <div className="p-4 space-y-4">
              {selectedElement.type === 'text' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Content</label>
                    <textarea 
                      className="w-full border-slate-300 rounded-md shadow-sm text-sm p-2 border focus:ring-blue-500 focus:border-blue-500 font-mono text-xs"
                      rows={3}
                      value={selectedElement.content}
                      onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                      placeholder="Enter text or {{tag}}"
                    />
                    <div className="mt-2">
                      <p className="text-[10px] text-slate-500 mb-1">Click to add data fields:</p>
                      <div className="flex flex-wrap gap-1">
                        {['{{firstName}}', '{{lastName}}', '{{designation}}', '{{memberId}}', '{{department}}', '{{phone}}'].map(tag => (
                          <button
                            key={tag}
                            onClick={() => updateElement(selectedElement.id, { content: (selectedElement.content + ' ' + tag).trim() })}
                            className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Font Size (mm)</label>
                    <input 
                      type="number" step="0.1"
                      className="w-full border-slate-300 rounded-md shadow-sm text-sm p-1.5 border focus:ring-blue-500 focus:border-blue-500"
                      value={selectedElement.fontSize || 3.5}
                      onChange={(e) => updateElement(selectedElement.id, { fontSize: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Color</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        className="h-8 w-8 rounded border border-slate-300 cursor-pointer"
                        value={selectedElement.color || '#000000'}
                        onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                      />
                      <input 
                        type="text" 
                        className="flex-1 border-slate-300 rounded-md shadow-sm text-sm p-1.5 border focus:ring-blue-500 focus:border-blue-500 uppercase"
                        value={selectedElement.color || '#000000'}
                        onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}
              
              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Position & Size</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">X (mm)</label>
                    <input type="number" step="0.1" value={selectedElement.x.toFixed(1)} onChange={(e) => updateElement(selectedElement.id, { x: parseFloat(e.target.value) })} className="w-full border-slate-300 rounded-md shadow-sm text-sm p-1.5 border" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Y (mm)</label>
                    <input type="number" step="0.1" value={selectedElement.y.toFixed(1)} onChange={(e) => updateElement(selectedElement.id, { y: parseFloat(e.target.value) })} className="w-full border-slate-300 rounded-md shadow-sm text-sm p-1.5 border" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">W (mm)</label>
                    <input type="number" step="0.1" value={selectedElement.width.toFixed(1)} onChange={(e) => updateElement(selectedElement.id, { width: parseFloat(e.target.value) })} className="w-full border-slate-300 rounded-md shadow-sm text-sm p-1.5 border" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">H (mm)</label>
                    <input type="number" step="0.1" value={selectedElement.height.toFixed(1)} onChange={(e) => updateElement(selectedElement.id, { height: parseFloat(e.target.value) })} className="w-full border-slate-300 rounded-md shadow-sm text-sm p-1.5 border" />
                  </div>
                </div>
              </div>

              {(selectedElement.type === 'shape' || selectedElement.type === 'image' || selectedElement.type === 'text') && (
                <div className="pt-4 border-t border-slate-200">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Styling</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Background Color</label>
                      <div className="flex gap-2">
                        <input type="color" className="h-8 w-8 rounded border border-slate-300 cursor-pointer" value={selectedElement.backgroundColor || '#transparent'} onChange={(e) => updateElement(selectedElement.id, { backgroundColor: e.target.value })} />
                        <input type="text" className="flex-1 border-slate-300 rounded-md shadow-sm text-sm p-1.5 border uppercase" value={selectedElement.backgroundColor || ''} onChange={(e) => updateElement(selectedElement.id, { backgroundColor: e.target.value })} placeholder="transparent" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Border Radius (mm)</label>
                      <input type="number" step="0.5" className="w-full border-slate-300 rounded-md shadow-sm text-sm p-1.5 border" value={selectedElement.borderRadius || 0} onChange={(e) => updateElement(selectedElement.id, { borderRadius: parseFloat(e.target.value) })} />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => deleteElement(selectedElement.id)}
                  className="w-full py-2 px-3 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove from Card
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-slate-500">
              <Smartphone className="w-8 h-8 mx-auto text-slate-300 mb-3" />
              Select an element to edit its properties
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
