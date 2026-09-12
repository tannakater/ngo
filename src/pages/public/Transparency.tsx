import React, { useState } from 'react';
import { useNgoStore } from '../../store/useNgoStore';
import { useOrgStore } from '../../store/useOrgStore';
import { 
  FileText, ShieldCheck, Download, ExternalLink, 
  PieChart, CheckCircle2, Award, Building, Eye, X
} from 'lucide-react';

export function Transparency() {
  const { documents } = useNgoStore();
  const { organization } = useOrgStore();
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  const breakdown = [
    { label: 'Direct Program Services & Relief', percentage: 92, color: 'bg-emerald-500' },
    { label: 'Monitoring, Logistics & Operations', percentage: 5, color: 'bg-blue-500' },
    { label: 'Governance & Administrative Compliance', percentage: 3, color: 'bg-slate-400' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Open Governance & Accountability
          </span>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mt-3 mb-2">
            Transparency & Financial Audits
          </h1>
          <p className="text-base sm:text-lg text-slate-600">
            We hold ourselves to the highest standards of stewardship. Access our independent financial audits, annual impact reports, and governance charters.
          </p>
        </div>

        {/* Efficiency Bento */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-bold text-slate-900">How Every Dollar is Spent</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mb-6">
                Our lean operational model ensures that 92 cents of every dollar donated directly funds frontline medical aid, clean water installations, school supplies, and food relief.
              </p>

              {/* Progress visual */}
              <div className="w-full h-4 rounded-full overflow-hidden flex mb-6 shadow-inner">
                <div style={{ width: '92%' }} className="bg-emerald-500 h-full"></div>
                <div style={{ width: '5%' }} className="bg-blue-500 h-full"></div>
                <div style={{ width: '3%' }} className="bg-slate-400 h-full"></div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {breakdown.map((b, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-3 h-3 rounded-full ${b.color}`}></span>
                      <span className="text-lg font-black text-slate-900">{b.percentage}%</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-snug">{b.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Audited by Certified Chartered Accountants
              </span>
              <span>Updated FY 2025-2026</span>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Regulatory Compliance</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                {organization.name} is fully registered with the Government NGO Affairs Bureau and authorized to receive both domestic and international humanitarian donations.
              </p>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block">Registration Authority</span>
                  <span className="font-bold text-white">NGO Affairs Bureau, Prime Minister's Office</span>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block">Official Registration Number</span>
                  <span className="font-bold font-mono text-emerald-400">{organization.registrationNumber || 'NGO-AB-2023-09412'}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Full Anti-Money Laundering & CFT Compliant
            </div>
          </div>

        </div>

        {/* Public Documents Repository */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Official Reports & Disclosures</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Download certified copies of our annual disclosures.</p>
            </div>
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl">
              {documents.length} Published Documents
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div key={doc.id} className="py-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-slate-50/50 p-3 rounded-2xl transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block mb-1">
                      {doc.category}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">{doc.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{doc.description}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-2 font-mono">
                      <span>Year: {doc.year}</span>
                      <span>&bull;</span>
                      <span>Size: {doc.fileSize}</span>
                      <span>&bull;</span>
                      <span>Published: {doc.uploadedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setSelectedDoc(doc)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Summary
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Trigger download of demo dummy text file
                      const element = document.createElement("a");
                      const file = new Blob([`Official Document: ${doc.title}\nCategory: ${doc.category}\nYear: ${doc.year}\nOrganization: ${organization.name}\nRegistration: ${organization.registrationNumber}\nStatus: Verified Official Public Record`], {type: 'text/plain'});
                      element.href = URL.createObjectURL(file);
                      element.download = `${doc.title.replace(/\s+/g, '_')}.txt`;
                      document.body.appendChild(element);
                      element.click();
                      document.body.removeChild(element);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Doc Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl border border-slate-100 relative">
            <button 
              onClick={() => setSelectedDoc(null)}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase border border-emerald-200">
              {selectedDoc.category}
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-3 mb-2">{selectedDoc.title}</h2>
            <p className="text-xs text-slate-500 mb-6 font-mono">Fiscal Year: {selectedDoc.year} &bull; File Size: {selectedDoc.fileSize}</p>
            
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-3 mb-6">
              <p className="font-semibold text-slate-900">{selectedDoc.description}</p>
              <p>This certified public report has been verified by independent external compliance auditors and submitted in accordance with the NGO Affairs Bureau statutory mandates.</p>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-mono text-[11px] text-slate-500">
                <span>Issuer: {organization.name}</span>
                <span>Verification: VALID</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const element = document.createElement("a");
                  const file = new Blob([`Official Document: ${selectedDoc.title}\nCategory: ${selectedDoc.category}\nYear: ${selectedDoc.year}\nOrganization: ${organization.name}\nRegistration: ${organization.registrationNumber}\nStatus: Verified Official Public Record`], {type: 'text/plain'});
                  element.href = URL.createObjectURL(file);
                  element.download = `${selectedDoc.title.replace(/\s+/g, '_')}.txt`;
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                }}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Download Certified Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
