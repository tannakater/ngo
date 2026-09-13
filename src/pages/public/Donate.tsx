import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Heart, CheckCircle, CreditCard, Banknote, ShieldCheck, Download, 
  ArrowLeft, Building2, Calendar, Sparkles, User, Lock, Printer, 
  Info, ChevronRight, Check
} from 'lucide-react';
import { useNgoStore, Donation } from '../../store/useNgoStore';
import { useOrgStore } from '../../store/useOrgStore';
import { formatCurrency, getCurrencySymbol } from '../../utils';
import { downloadReceiptPdf, openReceiptPdfInNewTab } from '../../utils/receiptPdf';

export function Donate() {
  const [searchParams] = useSearchParams();
  const { campaigns, addDonation } = useNgoStore();
  const { organization } = useOrgStore();

  const activeCampaigns = campaigns.filter(c => c.status === 'Active');
  
  const campaignParam = searchParams.get('campaign');
  const amountParam = searchParams.get('amount');

  const currency = organization.currency || 'USD';
  const currencySymbol = getCurrencySymbol(currency);

  const isBdt = currency === 'BDT';
  const defaultAmounts = isBdt 
    ? [500, 1000, 2500, 5000, 10000, 25000] 
    : [25, 50, 100, 250, 500, 1000];

  const defaultImpacts: Record<number, string> = isBdt ? {
    500: 'Emergency nutrition pack for 1 child',
    1000: 'Clean water & hygiene sanitation kit',
    2500: 'Doctor consultation & urgent medicines',
    5000: 'Warm winter blankets for 5 families',
    10000: '1 Month full child scholarship & books',
    25000: 'Community water tube-well share'
  } : {
    25: 'Emergency ration kit for a family',
    50: 'Clean water filter & hygiene supplies',
    100: 'Medical checkup & prescription drugs',
    250: 'School supplies for 10 children',
    500: 'Shelter repair & winterization pack',
    1000: 'Community solar borehole share'
  };

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [frequency, setFrequency] = useState<'one-time' | 'monthly'>('one-time');

  const [formData, setFormData] = useState({
    amount: amountParam ? Number(amountParam) : (isBdt ? 2500 : 50),
    customAmount: '',
    campaignId: campaignParam || activeCampaigns[0]?.id || '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    isAnonymous: false,
    hasDedication: false,
    dedication: '',
    paymentMethod: 'card' as 'card' | 'mobile' | 'bank',
    // Payment specific
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    cardHolder: '',
    senderMobile: '',
    mobileProvider: 'bKash' as 'bKash' | 'Nagad' | 'Rocket',
    trxId: '',
    bankDepositRef: '',
  });

  const availableCampaigns = campaigns.filter(c => c.status === 'Active' || c.id === formData.campaignId);

  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (campaignParam) {
      setFormData(prev => ({ ...prev, campaignId: campaignParam }));
    }
  }, [campaignParam]);

  const finalAmount = Number(formData.customAmount) || formData.amount;
  const selectedCamp = campaigns.find(c => 
    (formData.campaignId && c.id === formData.campaignId) || 
    (formData.campaignId && c.name && c.name.toLowerCase() === formData.campaignId.toLowerCase())
  );

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (finalAmount <= 0) return;
    setStep(2);
  };

  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.email) return;
    setStep(3);
  };

  const handleConfirmDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate safe processing delay
    await new Promise(r => setTimeout(r, 600));

    let txId = '';
    if (formData.paymentMethod === 'mobile') {
      txId = formData.trxId || `TXN-MOB-${Math.floor(10000000 + Math.random() * 90000000)}`;
    } else if (formData.paymentMethod === 'bank') {
      txId = formData.bankDepositRef || `BNK-${Math.floor(10000000 + Math.random() * 90000000)}`;
    } else {
      txId = `CARD-${Math.floor(10000000 + Math.random() * 90000000)}`;
    }

    const newDonationObj: Donation = {
      id: 'don-' + Date.now(),
      receiptNumber: '',
      donorName: formData.isAnonymous 
        ? 'Anonymous Donor' 
        : `${formData.firstName} ${formData.lastName}`.trim(),
      donorEmail: formData.email,
      donorPhone: formData.phone || undefined,
      amount: finalAmount,
      currency,
      frequency,
      transactionId: txId,
      isAnonymous: formData.isAnonymous,
      dedication: formData.hasDedication ? formData.dedication : undefined,
      campaignId: selectedCamp ? selectedCamp.id : (formData.campaignId || 'general'),
      campaignName: selectedCamp ? selectedCamp.name : 'General Humanitarian Fund',
      paymentMethod: formData.paymentMethod,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    const createdDonation = await addDonation(newDonationObj);
    const generatedReceipt = createdDonation.receiptNumber;
    newDonationObj.receiptNumber = generatedReceipt;
    setReceiptNumber(generatedReceipt);
    setIsProcessing(false);
    setStep(4);
  };

  const getActiveDonation = (): Donation => {
    return {
      id: 'don-' + Date.now(),
      receiptNumber: receiptNumber || `REC-${Math.floor(100000 + Math.random() * 900000)}`,
      donorName: formData.isAnonymous 
        ? 'Anonymous Donor' 
        : `${formData.firstName} ${formData.lastName}`.trim(),
      donorEmail: formData.email,
      donorPhone: formData.phone || undefined,
      amount: finalAmount,
      currency,
      frequency,
      transactionId: formData.trxId || formData.bankDepositRef || 'AUTHORIZED-TXN',
      isAnonymous: formData.isAnonymous,
      dedication: formData.hasDedication ? formData.dedication : undefined,
      campaignId: formData.campaignId || 'general',
      campaignName: selectedCamp?.name || 'General Humanitarian Fund',
      paymentMethod: formData.paymentMethod,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
  };

  const downloadReceipt = () => {
    const donation = getActiveDonation();
    downloadReceiptPdf(donation, organization);
  };

  const handlePrint = () => {
    const donation = getActiveDonation();
    openReceiptPdfInNewTab(donation, organization);
  };

  // Step 4: Receipt View
  if (step === 4) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            {/* Header Ribbon */}
            <div className="bg-emerald-700 px-8 py-8 text-white text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-white/10">
                <CheckCircle className="w-9 h-9 text-white" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest bg-amber-400 text-slate-900 px-3 py-1 rounded-full border border-amber-300 shadow-sm">
                Awaiting Admin Verification
              </span>
              <h1 className="text-3xl font-extrabold mt-3">Thank You for Your Generosity!</h1>
              <p className="text-emerald-100 text-sm mt-1">
                Your pledge of <span className="font-bold text-white">{formatCurrency(finalAmount, currency)} {currency}</span> has been securely submitted.
              </p>
            </div>

            {/* Email Dispatch Notice */}
            <div className="bg-amber-50 border-b border-amber-200 px-6 py-4 flex items-start gap-3 text-amber-900 text-xs">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Official Receipt via Gmail:</strong> When our administrators review and approve your contribution, your certified charitable tax receipt will be sent directly to your Gmail: <strong className="text-amber-950 underline">{formData.email}</strong>.
              </div>
            </div>

            {/* Receipt Details Card */}
            <div className="p-8 sm:p-10 space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Receipt Reference Number:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm bg-white px-2.5 py-1 rounded-md border border-slate-200">
                    {receiptNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Verification Status:</span>
                  <span className="font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full text-[11px]">
                    Pending Admin Approval
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Donor Name:</span>
                  <span className="font-semibold text-slate-900">
                    {formData.isAnonymous ? 'Anonymous Donor' : `${formData.firstName} ${formData.lastName}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Recipient Gmail / Email:</span>
                  <span className="font-semibold text-slate-900">{formData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Designated Cause:</span>
                  <span className="font-semibold text-emerald-700">
                    {selectedCamp?.name || 'General Humanitarian Fund'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Schedule:</span>
                  <span className="font-semibold uppercase text-slate-900">
                    {frequency === 'monthly' ? 'Monthly Sustaining Gift' : 'One-Time Contribution'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Payment Gateway:</span>
                  <span className="font-semibold uppercase text-slate-900">
                    {formData.paymentMethod === 'mobile' ? `${formData.mobileProvider} Mobile Money` : formData.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-200 text-sm font-bold">
                  <span className="text-slate-900">Total Cleared Contribution:</span>
                  <span className="text-emerald-600 text-base">{formatCurrency(finalAmount, currency)} {currency}</span>
                </div>
              </div>

              {formData.hasDedication && formData.dedication && (
                <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/60 text-xs text-emerald-900">
                  <span className="font-bold block mb-1">Dedication / Tribute Note:</span>
                  <p className="italic">"{formData.dedication}"</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={downloadReceipt}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Download className="w-4 h-4" /> Download Official PDF Receipt
                </button>
                <button 
                  type="button" 
                  onClick={handlePrint}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-5 py-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" /> View / Print PDF Certificate
                </button>
              </div>

              <div className="text-center pt-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setStep(1);
                    setFormData(prev => ({ 
                      ...prev, 
                      firstName: '', 
                      lastName: '', 
                      email: '', 
                      phone: '', 
                      customAmount: '',
                      trxId: '',
                      bankDepositRef: '',
                      hasDedication: false,
                      dedication: ''
                    }));
                  }} 
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
                >
                  Make Another Contribution &rarr;
                </button>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="bg-slate-100 px-8 py-4 border-t border-slate-200 text-center text-[11px] text-slate-500">
              {organization.name} &bull; Reg: {organization.registrationNumber} &bull; 100% Tax-Deductible
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-emerald-100/80 text-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-bold mb-3 border border-emerald-200">
            <Heart className="w-3.5 h-3.5 fill-current text-emerald-600" />
            Verified Non-Profit Humanitarian Giving
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
            Invest in Sustainable Hope & Relief
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            100% transparent, audited aid. Every contribution empowers communities with food rations, healthcare, clean water, and emergency rescue.
          </p>
        </div>

        {/* Wizard Container */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Column: NGO Impact Overview */}
          <div className="md:w-5/12 bg-slate-900 text-white p-8 sm:p-10 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                {organization.logoUrl ? (
                  <img src={organization.logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-white/10 p-1" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center font-black text-white">
                    {organization.shortName?.[0] || 'G'}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-sm leading-snug">{organization.name}</h3>
                  <p className="text-[11px] text-slate-400">Reg: {organization.registrationNumber}</p>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-5 space-y-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Zero Aid Leakage Policy</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                      Over 92% of every contribution is directly deployed to frontline field missions with audited transparency reports.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Instant Tax Deductibility</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                      Get an automated, verifiable tax certificate and receipt immediately upon confirmation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">256-Bit Encrypted Security</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                      End-to-end data encryption protects your personal information and transactions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Live Impact Preview */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 block">
                  Your Current Selection
                </span>
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-black text-white">
                    {formatCurrency(finalAmount, currency)}
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    {frequency}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Allocated to: <span className="text-emerald-300 font-semibold">{selectedCamp?.name || 'General Humanitarian Fund'}</span>
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Currency: <strong className="text-white">{currency} ({currencySymbol})</strong></span>
              <span>Hotline: <strong className="text-white">{organization.emergencyContact || organization.phone}</strong></span>
            </div>
          </div>

          {/* Right Column: Step-by-Step Interactive Form */}
          <div className="md:w-7/12 p-8 sm:p-10">
            
            {/* Step Progress Indicators */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${step >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  1
                </span>
                <span className={`text-xs font-bold ${step === 1 ? 'text-slate-900' : 'text-slate-400'}`}>Amount</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${step >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  2
                </span>
                <span className={`text-xs font-bold ${step === 2 ? 'text-slate-900' : 'text-slate-400'}`}>Donor Details</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${step >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  3
                </span>
                <span className={`text-xs font-bold ${step === 3 ? 'text-slate-900' : 'text-slate-400'}`}>Payment</span>
              </div>
            </div>

            {/* STEP 1: AMOUNT & FREQUENCY */}
            {step === 1 && (
              <form onSubmit={handleStep1Next} className="space-y-6">
                {/* Frequency Toggle */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Gift Frequency
                  </label>
                  <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setFrequency('one-time')}
                      className={`py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                        frequency === 'one-time'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Heart className="w-3.5 h-3.5 text-emerald-600" /> One-Time Gift
                    </button>
                    <button
                      type="button"
                      onClick={() => setFrequency('monthly')}
                      className={`py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                        frequency === 'monthly'
                          ? 'bg-white text-emerald-700 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Monthly Supporter
                    </button>
                  </div>
                  {frequency === 'monthly' && (
                    <p className="text-[11px] text-emerald-700 font-semibold mt-1.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Monthly donors provide predictable resources for rapid crisis mobilization.
                    </p>
                  )}
                </div>

                {/* Campaign Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Designated Appeal / Fund
                  </label>
                  <select 
                    value={formData.campaignId} 
                    onChange={e => setFormData({...formData, campaignId: e.target.value})} 
                    className="w-full border-slate-200 rounded-xl p-3 border focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50 text-xs font-semibold text-slate-800"
                  >
                    <option value="">General Humanitarian Fund (Deploy Where Needed Most)</option>
                    {availableCampaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Amount Presets */}
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Select Contribution Amount ({currency})
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">Standard currency: {currency}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 mb-3">
                    {defaultAmounts.map(amt => {
                      const isSelected = formData.amount === amt && !formData.customAmount;
                      return (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setFormData({...formData, amount: amt, customAmount: ''})}
                          className={`p-3 rounded-2xl font-extrabold text-sm border transition-all text-center flex flex-col items-center justify-center ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25 ring-2 ring-emerald-600/20'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:text-emerald-700'
                          }`}
                        >
                          <span>{formatCurrency(amt, currency)}</span>
                          <span className={`text-[9px] font-normal leading-tight mt-1 line-clamp-1 ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                            {defaultImpacts[amt] || 'Direct Aid'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Amount */}
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                      {currencySymbol}
                    </span>
                    <input 
                      type="number" 
                      min="1"
                      placeholder="Or enter a custom gift amount..." 
                      value={formData.customAmount}
                      onChange={e => setFormData({...formData, customAmount: e.target.value, amount: 0})}
                      className="w-full border-slate-200 rounded-xl p-3.5 pl-9 border focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50 text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-emerald-600/20 flex justify-center items-center gap-2 text-xs"
                >
                  Continue to Donor Details &rarr;
                </button>
              </form>
            )}

            {/* STEP 2: DONOR DETAILS & PREFERENCES */}
            {step === 2 && (
              <form onSubmit={handleStep2Next} className="space-y-5">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h2 className="text-sm font-bold text-slate-900">Your Contact & Receipt Information</h2>
                  <button 
                    type="button" 
                    onClick={() => setStep(1)} 
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back ({formatCurrency(finalAmount, currency)})
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">First Name *</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. Arafat"
                      value={formData.firstName} 
                      onChange={e => setFormData({...formData, firstName: e.target.value})} 
                      className="w-full border-slate-200 rounded-xl p-3 border focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50 text-xs" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Last Name *</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. Hossain"
                      value={formData.lastName} 
                      onChange={e => setFormData({...formData, lastName: e.target.value})} 
                      className="w-full border-slate-200 rounded-xl p-3 border focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50 text-xs" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Official Email for Tax Receipt *</label>
                    <input 
                      required 
                      type="email" 
                      placeholder="e.g. arafat@example.com"
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      className="w-full border-slate-200 rounded-xl p-3 border focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50 text-xs" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone (Optional)</label>
                    <input 
                      type="tel" 
                      placeholder="+880 1711-..."
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                      className="w-full border-slate-200 rounded-xl p-3 border focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50 text-xs" 
                    />
                  </div>
                </div>

                {/* Donor Preferences */}
                <div className="pt-2 space-y-3">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
                    <input 
                      type="checkbox"
                      checked={formData.isAnonymous}
                      onChange={e => setFormData({ ...formData, isAnonymous: e.target.checked })}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Make my gift anonymous on public donor rolls & campaigns</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
                    <input 
                      type="checkbox"
                      checked={formData.hasDedication}
                      onChange={e => setFormData({ ...formData, hasDedication: e.target.checked })}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Dedicate this donation in honor or in memory of someone</span>
                  </label>

                  {formData.hasDedication && (
                    <input 
                      type="text"
                      placeholder="In memory of / Dedicated to..."
                      value={formData.dedication}
                      onChange={e => setFormData({ ...formData, dedication: e.target.value })}
                      className="w-full border-slate-200 rounded-xl p-3 border focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50 text-xs mt-1"
                    />
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setStep(1)}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-all text-xs"
                  >
                    &larr; Back
                  </button>
                  <button 
                    type="submit" 
                    className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-emerald-600/20 text-xs"
                  >
                    Proceed to Payment &rarr;
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: PAYMENT GATEWAY & VERIFICATION */}
            {step === 3 && (
              <form onSubmit={handleConfirmDonation} className="space-y-6">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Select Payment Method</h2>
                    <p className="text-[11px] text-slate-400">Total: <strong className="text-emerald-600">{formatCurrency(finalAmount, currency)} {currency}</strong></p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setStep(2)} 
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                </div>

                {/* Gateway Tabs */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: 'card' })}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                      formData.paymentMethod === 'card'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-xs">Credit Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: 'mobile' })}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                      formData.paymentMethod === 'mobile'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Banknote className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-xs">Mobile Money</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: 'bank' })}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                      formData.paymentMethod === 'bank'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-xs">Bank Wire</span>
                  </button>
                </div>

                {/* Dynamic Payment Details based on selection */}
                {formData.paymentMethod === 'card' && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                      <span>Card Details</span>
                      <div className="flex gap-1.5 text-[10px] text-slate-500 font-mono">
                        <span className="bg-white px-1.5 py-0.5 rounded border">VISA</span>
                        <span className="bg-white px-1.5 py-0.5 rounded border">MC</span>
                        <span className="bg-white px-1.5 py-0.5 rounded border">AMEX</span>
                      </div>
                    </div>

                    <div>
                      <input 
                        type="text" 
                        placeholder="Cardholder Name"
                        value={formData.cardHolder}
                        onChange={e => setFormData({ ...formData, cardHolder: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <input 
                        type="text" 
                        maxLength={19}
                        placeholder="Card Number (0000 0000 0000 0000)"
                        value={formData.cardNumber}
                        onChange={e => setFormData({ ...formData, cardNumber: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        type="text" 
                        maxLength={5}
                        placeholder="MM / YY"
                        value={formData.cardExpiry}
                        onChange={e => setFormData({ ...formData, cardExpiry: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <input 
                        type="text" 
                        maxLength={4}
                        placeholder="CVC / CVV"
                        value={formData.cardCvc}
                        onChange={e => setFormData({ ...formData, cardCvc: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {formData.paymentMethod === 'mobile' && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex gap-2">
                      {(['bKash', 'Nagad', 'Rocket'] as const).map(provider => (
                        <button
                          key={provider}
                          type="button"
                          onClick={() => setFormData({ ...formData, mobileProvider: provider })}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${
                            formData.mobileProvider === provider
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          {provider}
                        </button>
                      ))}
                    </div>

                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-emerald-600" />
                        Send {formData.mobileProvider} payment to NGO Merchant/Personal Number:
                      </p>
                      <p className="font-mono font-bold text-sm text-emerald-800">
                        {organization.phone || '+880 1711-002233'}
                      </p>
                      <p className="text-[10px] text-emerald-700">
                        After completing the transaction in your {formData.mobileProvider} app, enter your Sender Mobile Number and Transaction ID (TrxID) below:
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        type="text" 
                        placeholder="Your Sender Mobile No."
                        value={formData.senderMobile}
                        onChange={e => setFormData({ ...formData, senderMobile: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <input 
                        type="text" 
                        placeholder="Transaction ID (TrxID)"
                        value={formData.trxId}
                        onChange={e => setFormData({ ...formData, trxId: e.target.value.toUpperCase() })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {formData.paymentMethod === 'bank' && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 text-slate-700">
                      <p className="font-bold text-slate-900">Official NGO Bank Account Details:</p>
                      <p><strong>Bank:</strong> Standard Chartered / City Bank</p>
                      <p><strong>Account Name:</strong> {organization.name}</p>
                      <p><strong>Account No:</strong> 01-9876543-01</p>
                      <p><strong>Branch & Routing:</strong> Banani Branch, Dhaka (Routing: 115260123)</p>
                      <p><strong>Swift Code:</strong> SCBLBDDX</p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Deposit Slip / Wire Transfer Reference Number *
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. WIRE-8849102"
                        value={formData.bankDepositRef}
                        onChange={e => setFormData({ ...formData, bankDepositRef: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isProcessing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-600/25 flex justify-center items-center gap-2 text-xs disabled:opacity-50 cursor-pointer"
                >
                  <Heart className="w-4 h-4 fill-current" />
                  {isProcessing 
                    ? 'Recording & Verifying Transaction...' 
                    : `Confirm & Allocate ${formatCurrency(finalAmount, currency)} ${currency}`}
                </button>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
