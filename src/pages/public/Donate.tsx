import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Heart, Download, Printer, ShieldCheck, Copy, Check, 
  Smartphone, Building2, CreditCard, Lock, CheckCircle2,
  Search, ExternalLink, MessageSquare, Mail, Sparkles
} from 'lucide-react';
import { useNgoStore, Donation } from '../../store/useNgoStore';
import { useOrgStore } from '../../store/useOrgStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import { formatCurrency, getCurrencySymbol } from '../../utils';
import { downloadReceiptPdf, openReceiptPdfInNewTab } from '../../utils/receiptPdf';
import { LottieSuccess } from '../../components/common/LottieSuccess';

export function Donate() {
  const [searchParams] = useSearchParams();
  const { addDonation } = useNgoStore();
  const { organization } = useOrgStore();
  const { language, t } = useLanguageStore();

  const isBn = language === 'bn';
  const amountParam = searchParams.get('amount');
  const currency = organization.currency || 'BDT';
  const currencySymbol = getCurrencySymbol(currency);
  const isBdt = currency === 'BDT';

  const defaultAmounts = isBdt 
    ? [500, 1000, 2000, 5000] 
    : [25, 50, 100, 250];

  const officialPaymentNumber = organization.phone || organization.emergencyContact || '01790650636';

  // Core Form State
  const [amount, setAmount] = useState<number>(amountParam ? Number(amountParam) : (isBdt ? 1000 : 50));
  const [customAmount, setCustomAmount] = useState<string>('');

  React.useEffect(() => {
    if (amountParam && Number(amountParam) > 0) {
      setAmount(Number(amountParam));
      setCustomAmount('');
    }
  }, [amountParam]);
  const [paymentMethod, setPaymentMethod] = useState<'mobile' | 'bank' | 'card'>('mobile');
  const [mobileProvider, setMobileProvider] = useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  
  // Method Inputs
  const [senderMobile, setSenderMobile] = useState('');
  const [trxId, setTrxId] = useState('');
  const [bankRef, setBankRef] = useState('');

  // Donor Details
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // UX Feedback
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedDonation, setSubmittedDonation] = useState<Donation | null>(null);

  const finalAmount = Number(customAmount) > 0 ? Number(customAmount) : amount;

  const copyNumber = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (finalAmount <= 0) return;

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 400));

    let txId = '';
    if (paymentMethod === 'mobile') {
      txId = trxId.trim().toUpperCase() || `MOB-${Math.floor(10000000 + Math.random() * 90000000)}`;
    } else if (paymentMethod === 'bank') {
      txId = bankRef.trim().toUpperCase() || `BNK-${Math.floor(10000000 + Math.random() * 90000000)}`;
    } else {
      txId = `CARD-${Math.floor(10000000 + Math.random() * 90000000)}`;
    }

    const now = new Date().toISOString();
    const formattedSender = senderMobile.trim() || undefined;
    const formattedEmail = donorEmail.trim();

    const newDonation: Donation = {
      id: 'don-' + Date.now(),
      receiptNumber: '',
      donorName: isAnonymous ? (isBn ? 'বেনামী দাতা' : 'Anonymous Donor') : (donorName.trim() || (isBn ? 'সম্মানিত শুভাকাঙ্ক্ষী' : 'Generous Donor')),
      donorEmail: formattedEmail,
      donorPhone: formattedSender,
      amount: finalAmount,
      currency,
      frequency: 'one-time',
      transactionId: txId,
      isAnonymous,
      campaignId: 'general',
      campaignName: 'General Humanitarian Fund',
      paymentMethod,
      status: 'Pending',
      createdAt: now,
      // Automatic SMS & Email Trigger simulation
      smsSent: true,
      smsSentAt: now,
      smsMessage: `ধন্যবাদ, ডাকসেবা ফাউন্ডেশনে আপনার ৳${finalAmount} অনুদান জমা হয়েছে। TrxID: ${txId}`,
      emailSent: !!formattedEmail,
      emailSentAt: formattedEmail ? now : undefined
    };

    const saved = await addDonation(newDonation);
    newDonation.receiptNumber = saved.receiptNumber;
    setSubmittedDonation(newDonation);
    setIsSubmitting(false);
  };

  // SUCCESS / RECEIPT SCREEN
  if (submittedDonation) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="max-w-lg mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-emerald-600 text-white p-8 text-center">
            <div className="flex justify-center mb-2">
              <LottieSuccess size={110} className="drop-shadow-md" />
            </div>
            <h1 className="text-2xl font-bold">{t('thank_you')}</h1>
            <p className="text-emerald-100 text-sm mt-1">
              {t('donation_received')}
            </p>
            <div className="mt-3 inline-block bg-white/20 text-white px-3.5 py-1 rounded-full text-xs font-mono font-medium">
              {t('receipt_no')}: {submittedDonation.receiptNumber}
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-4">
            
            {/* Automatic SMS & Email Notice */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-900">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">
                  {isBn ? 'স্বয়ংক্রিয় SMS ও Email পাঠানো হয়েছে' : 'Instant Confirmation Sent'}
                </span>
                <p className="text-emerald-700 text-[11px] mt-0.5">
                  {t('auto_sms_email_notice')}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2.5 text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">{t('amount')}</span>
                <span className="text-lg font-bold text-emerald-700">
                  {formatCurrency(submittedDonation.amount, currency)} {currency}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">{t('donor_name')}</span>
                <span className="font-semibold text-slate-800">{submittedDonation.donorName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">{t('payment_method')}</span>
                <span className="font-semibold text-slate-800">
                  {paymentMethod === 'mobile' ? `${mobileProvider} Mobile Money` : paymentMethod === 'bank' ? 'Bank Transfer' : 'Card'}
                </span>
              </div>
              {submittedDonation.transactionId && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">{t('trx_id')}</span>
                  <span className="font-mono font-bold text-slate-800">{submittedDonation.transactionId}</span>
                </div>
              )}
            </div>

            {/* Receipt Actions */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => downloadReceiptPdf(submittedDonation, organization)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" /> {t('download_receipt')}
              </button>
              <button
                type="button"
                onClick={() => openReceiptPdfInNewTab(submittedDonation, organization)}
                className="border border-slate-300 hover:bg-slate-50 text-slate-700 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" /> {t('print_receipt')}
              </button>
            </div>

            {/* Track Donation Live Button */}
            <Link
              to={`/track-donation?ref=${encodeURIComponent(submittedDonation.receiptNumber)}`}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Search className="w-4 h-4 text-emerald-400" />
              {isBn ? 'এই অনুদানের লাইভ স্ট্যাটাস ট্র্যাক করুন' : 'Track This Donation Live'}
            </Link>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setSubmittedDonation(null);
                  setCustomAmount('');
                  setTrxId('');
                  setSenderMobile('');
                }}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
              >
                {t('donate_again')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 sm:py-14 px-4">
      <div className="max-w-lg mx-auto">
        
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {t('donate_title')}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {t('donate_subtitle')}
          </p>
        </div>

        {/* Quick link to Track Donation */}
        <div className="mb-4 bg-emerald-50/80 border border-emerald-200/80 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
          <span className="text-emerald-900 font-medium">
            {isBn ? 'ইতোমধ্যে অনুদান দিয়েছেন?' : 'Already donated?'}
          </span>
          <Link
            to="/track-donation"
            className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 underline"
          >
            <Search className="w-3.5 h-3.5" />
            {t('track_donation')}
          </Link>
        </div>

        {/* Clean, Simple Single-Card Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-7 space-y-6">
          
          {/* 1. Donation Amount */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              {t('donation_amount')}
            </label>

            {/* Amount Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {defaultAmounts.map(amt => {
                const isSelected = amount === amt && !customAmount;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setAmount(amt);
                      setCustomAmount('');
                    }}
                    className={`py-2 sm:py-2.5 px-1 rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer text-center ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {currencySymbol}{amt}
                  </button>
                );
              })}
            </div>

            {/* Custom Amount */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                {currencySymbol}
              </span>
              <input
                type="number"
                min="10"
                placeholder={t('custom_amount_placeholder')}
                value={customAmount}
                onChange={e => {
                  setCustomAmount(e.target.value);
                  setAmount(0);
                }}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 2. Payment Method */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              {t('payment_method')}
            </label>

            {/* Easy Tabs */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('mobile')}
                className={`py-2 px-2 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'mobile'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-500 ring-1 ring-emerald-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('mobile_money')}</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('bank')}
                className={`py-2 px-2 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'bank'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-500 ring-1 ring-emerald-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('bank_transfer')}</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`py-2 px-2 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'card'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-500 ring-1 ring-emerald-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('card')}</span>
              </button>
            </div>

            {/* Mobile Banking Details */}
            {paymentMethod === 'mobile' && (
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3.5 space-y-3">
                {/* Select Provider */}
                <div className="flex gap-2">
                  {(['bKash', 'Nagad', 'Rocket'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setMobileProvider(p)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        mobileProvider === p
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-white text-slate-700 border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Account Number with 1-click copy */}
                <div className="bg-white rounded-lg p-2.5 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      {mobileProvider} {isBn ? 'নম্বর (Send Money করুন)' : 'Number (Send Money)'}
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {officialPaymentNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyNumber(officialPaymentNumber)}
                    className="flex items-center gap-1 text-xs font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? t('copied') : t('copy')}
                  </button>
                </div>

                {/* 2 Simple Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      {t('your_phone')}
                    </label>
                    <input
                      type="text"
                      placeholder="017XXXXXXXX"
                      value={senderMobile}
                      onChange={e => setSenderMobile(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      {t('trx_id')}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 9J8A7B6C"
                      value={trxId}
                      onChange={e => setTrxId(e.target.value.toUpperCase())}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bank Transfer Details */}
            {paymentMethod === 'bank' && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="bg-white rounded-lg p-2.5 border border-slate-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">A/C: {organization.name}</span>
                    <button
                      type="button"
                      onClick={() => copyNumber('01-9876543-01')}
                      className="text-[11px] text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      {copied ? t('copied') : t('copy')}
                    </button>
                  </div>
                  <p className="text-slate-600">A/C Number: <strong className="text-slate-800">01-9876543-01</strong> (City Bank)</p>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    {isBn ? 'ব্যাংক রেফারেন্স / চেক নং (ঐচ্ছিক)' : 'Bank Reference / Slip No. (Optional)'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. REF-1042"
                    value={bankRef}
                    onChange={e => setBankRef(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Card Details */}
            {paymentMethod === 'card' && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <input
                  type="text"
                  maxLength={19}
                  placeholder="Card Number"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="MM/YY"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="CVC"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Donor Details */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              {t('donor_info')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                placeholder={t('full_name')}
                value={donorName}
                onChange={e => setDonorName(e.target.value)}
                disabled={isAnonymous}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none disabled:opacity-50"
              />
              <input
                type="email"
                placeholder={t('email_for_receipt')}
                value={donorEmail}
                onChange={e => setDonorEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="anonCheck"
                checked={isAnonymous}
                onChange={e => setIsAnonymous(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="anonCheck" className="text-xs text-slate-600 cursor-pointer">
                {t('donate_anon')}
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || finalAmount <= 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <Heart className="w-4 h-4 fill-current" />
              {isSubmitting 
                ? t('processing') 
                : `${t('donate_button')} ${currencySymbol}${finalAmount}`}
            </button>
            
            <div className="flex items-center justify-center gap-3 mt-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" /> Secure
              </span>
              <span>&bull;</span>
              <span>Instant PDF Receipt</span>
              <span>&bull;</span>
              <span>SMS & Email Alert</span>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
