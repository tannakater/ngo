import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Search, ShieldCheck, Clock, CheckCircle2, AlertCircle, 
  Download, Printer, ArrowRight, Heart, Phone, Mail, FileText,
  Share2, Copy, Check, ChevronRight, HelpCircle
} from 'lucide-react';
import { useNgoStore, Donation } from '../../store/useNgoStore';
import { useOrgStore } from '../../store/useOrgStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import { formatCurrency } from '../../utils';
import { downloadReceiptPdf, openReceiptPdfInNewTab } from '../../utils/receiptPdf';

export function TrackDonation() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { donations } = useNgoStore();
  const { organization } = useOrgStore();
  const { language, t } = useLanguageStore();

  const refParam = searchParams.get('ref') || searchParams.get('trx') || '';
  const [query, setQuery] = useState(refParam);
  const [searched, setSearched] = useState(false);
  const [matchedDonation, setMatchedDonation] = useState<Donation | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  useEffect(() => {
    if (refParam) {
      setQuery(refParam);
      handleSearch(refParam);
    }
  }, [refParam, donations]);

  const handleSearch = (searchQuery: string) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setMatchedDonation(null);
      setSearched(false);
      return;
    }

    setSearched(true);
    // Find matching donation
    const found = donations.find(d => 
      d.receiptNumber?.toLowerCase() === q ||
      d.receiptNumber?.toLowerCase().includes(q) ||
      (d.transactionId && d.transactionId.toLowerCase() === q) ||
      (d.donorPhone && d.donorPhone.replace(/\D/g, '').includes(q.replace(/\D/g, ''))) ||
      (d.donorEmail && d.donorEmail.toLowerCase() === q)
    );

    setMatchedDonation(found || null);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
    if (query.trim()) {
      setSearchParams({ ref: query.trim() });
    } else {
      setSearchParams({});
    }
  };

  const copyRef = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  const isBn = language === 'bn';

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            {isBn ? 'স্বচ্ছতা ও জবাবদিহিতা' : 'Transparency & Real-Time Tracking'}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t('track_title')}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            {t('track_subtitle')}
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
          <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('track_placeholder')}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Search className="w-4 h-4" />
              {t('track_btn')}
            </button>
          </form>

          {/* Quick Examples */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>{isBn ? 'উদাহরণ:' : 'Search by:'}</span>
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">REC-2026-XXXXXX</span>
            <span>/</span>
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">bKash/Nagad TrxID</span>
            <span>/</span>
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">017XXXXXXXX</span>
          </div>
        </div>

        {/* RESULT SECTION */}
        {searched && !matchedDonation && (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {t('track_not_found')}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {t('track_not_found_desc')}
            </p>
            <div className="pt-2">
              <Link
                to="/donate"
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
              >
                <Heart className="w-4 h-4" /> {isBn ? 'নতুন অনুদান প্রদান করতে ক্লিক করুন' : 'Make a donation here'}
              </Link>
            </div>
          </div>
        )}

        {matchedDonation && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden transition-all">
            {/* Top Bar with Status Badge */}
            <div className={`p-6 text-white ${
              matchedDonation.status === 'Completed' 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700' 
                : matchedDonation.status === 'Pending'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600'
                : 'bg-gradient-to-r from-rose-600 to-red-700'
            }`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-bold bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                      {matchedDonation.status === 'Completed' 
                        ? t('status_completed') 
                        : matchedDonation.status === 'Pending' 
                        ? t('status_pending') 
                        : t('status_failed')}
                    </span>
                    <span className="text-xs text-white/80">
                      {new Date(matchedDonation.createdAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <h2 className="text-2xl font-black tracking-tight">
                      {formatCurrency(matchedDonation.amount, matchedDonation.currency || organization.currency || 'BDT')} {matchedDonation.currency || organization.currency || 'BDT'}
                    </h2>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/20 flex items-center gap-3">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-white/70">{t('receipt_no')}</span>
                    <span className="font-mono font-bold text-sm text-white">{matchedDonation.receiptNumber}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyRef(matchedDonation.receiptNumber)}
                    className="p-1.5 hover:bg-white/20 rounded-md transition-colors text-white"
                    title="Copy receipt number"
                  >
                    {copiedReceipt ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Donor & Allocation Details */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-slate-100">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    {t('donor_name')}
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {matchedDonation.isAnonymous ? (isBn ? 'বেনামী দাতা' : 'Anonymous Donor') : matchedDonation.donorName}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    {t('payment_method')}
                  </span>
                  <span className="text-sm font-semibold text-slate-800 capitalize">
                    {matchedDonation.paymentMethod}
                    {matchedDonation.transactionId ? ` (${matchedDonation.transactionId})` : ''}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    {isBn ? 'বরাদ্দকৃত তহবিল / খাত' : 'Designated Allocation'}
                  </span>
                  <span className="text-sm font-semibold text-emerald-700">
                    {matchedDonation.campaignName || 'General Humanitarian Fund'}
                  </span>
                </div>
              </div>

              {/* 4-Step Visual Progress Stepper */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6">
                  {isBn ? 'যাচাই ও বরাদ্দকরণের অগ্রগতি (Tracking Timeline)' : 'Verification & Allocation Timeline'}
                </h4>

                <div className="relative pl-6 sm:pl-8 space-y-6 border-l-2 border-emerald-200 ml-3">
                  
                  {/* Step 1: Received */}
                  <div className="relative group">
                    <div className="absolute -left-[31px] sm:-left-[39px] top-0 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-4 ring-white shadow-xs">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-900">
                        {t('timeline_step1')}
                      </h5>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isBn ? 'সিস্টেমে অনুদান সফলভাবে নথিবদ্ধ হয়েছে।' : 'Donation record submitted to Dakseba system.'}
                      </p>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(matchedDonation.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Step 2: Verification */}
                  <div className="relative group">
                    <div className={`absolute -left-[31px] sm:-left-[39px] top-0 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white shadow-xs ${
                      matchedDonation.status === 'Completed'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-500 text-white animate-pulse'
                    }`}>
                      {matchedDonation.status === 'Completed' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-900">
                        {t('timeline_step2')}
                      </h5>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {matchedDonation.status === 'Completed' 
                          ? (isBn 
                              ? `হিসাব বিভাগ কর্তৃক ট্রানজ্যাকশন নিশ্চিত হয়েছে (${matchedDonation.approvedBy || 'Accounts Officer'})` 
                              : `Reconciled & verified by ${matchedDonation.approvedBy || 'Accounts Officer'}`)
                          : (isBn ? 'মোবাইল ব্যাংকিং/ব্যাংক স্টেটমেন্টের সাথে যাচাই করা হচ্ছে...' : 'Awaiting final reconciliation with bank/MFS statement.')}
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Receipt Issued */}
                  <div className="relative group">
                    <div className={`absolute -left-[31px] sm:-left-[39px] top-0 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white shadow-xs ${
                      matchedDonation.status === 'Completed'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-400'
                    }`}>
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h5 className={`text-sm font-bold ${matchedDonation.status === 'Completed' ? 'text-slate-900' : 'text-slate-400'}`}>
                        {t('timeline_step3')}
                      </h5>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {matchedDonation.status === 'Completed'
                          ? (isBn ? `রসিদ নং ${matchedDonation.receiptNumber} ভ্যাট ও আয়কর ছাড়যোগ্য ধারায় নিবন্ধিত।` : `Certified digital tax-deductible receipt generated: ${matchedDonation.receiptNumber}`)
                          : (isBn ? 'যাচাই সম্পন্ন হলে স্বয়ংক্রিয় রসিদ চূড়ান্ত হবে।' : 'Receipt finalizing upon payment audit.')}
                      </p>
                    </div>
                  </div>

                  {/* Step 4: Fund Allocation */}
                  <div className="relative group">
                    <div className={`absolute -left-[31px] sm:-left-[39px] top-0 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white shadow-xs ${
                      matchedDonation.status === 'Completed'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-400'
                    }`}>
                      <Heart className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h5 className={`text-sm font-bold ${matchedDonation.status === 'Completed' ? 'text-slate-900' : 'text-slate-400'}`}>
                        {t('timeline_step4')}
                      </h5>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isBn 
                          ? 'অনুদানের অর্থ সুবিধাভোগীদের খাদ্য, শিক্ষা বা চিকিৎসা সহায়তা প্রকল্পে সরাসরি নিয়োজিত।' 
                          : 'Funds allocated directly to on-ground field relief operations and programs.'}
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Notification Status Log (SMS & Email) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                  {isBn ? 'স্বয়ংক্রিয় নোটিফিকেশন ডেলিভারি লগ' : 'Automated Dispatch Log'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>SMS: <strong>{matchedDonation.donorPhone || 'Mobile on file'}</strong> ({isBn ? 'পাঠানো হয়েছে' : 'Delivered'})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Email: <strong>{matchedDonation.donorEmail || 'Email on file'}</strong> ({isBn ? 'কনফার্মেশন প্রেরিত' : 'Delivered'})</span>
                  </div>
                </div>
              </div>

              {/* Actions: Download / Print PDF */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => downloadReceiptPdf(matchedDonation, organization)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4" /> {t('download_receipt')}
                </button>
                <button
                  type="button"
                  onClick={() => openReceiptPdfInNewTab(matchedDonation, organization)}
                  className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> {t('print_receipt')}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Assistance / Transparency banner */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-sm font-bold text-slate-900">
              {t('need_help')}
            </h4>
            <p className="text-xs text-slate-500">
              {organization.phone || '01790650636'} | {organization.email || 'info@dakseba.org'}
            </p>
          </div>
          <Link
            to="/donate"
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-colors shrink-0"
          >
            {t('donate_now')}
          </Link>
        </div>

      </div>
    </div>
  );
}
