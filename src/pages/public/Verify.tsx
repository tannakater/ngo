import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useOrgStore } from '../../store/useOrgStore';
import { useNgoStore } from '../../store/useNgoStore';
import { 
  ShieldCheck, ShieldAlert, Search, CheckCircle2, 
  Building2, Calendar, Phone, Mail, UserCheck, QrCode, AlertCircle, Copy, Check,
  Receipt, Download, Printer, Award, FileText, Camera, RefreshCw, ExternalLink,
  Shield, CheckCheck, Share2
} from 'lucide-react';
import { formatCurrency } from '../../utils';
import { downloadReceiptPdf, openReceiptPdfInNewTab } from '../../utils/receiptPdf';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { getMemberVerificationUrl } from '../../utils/verification';

export function Verify() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { members, organization } = useOrgStore();
  const { volunteers, donations } = useNgoStore();

  const getParamQuery = () => {
    return searchParams.get('receipt') || 
           searchParams.get('id') || 
           searchParams.get('memberId') || 
           searchParams.get('code') || 
           '';
  };

  const [idInput, setIdInput] = useState(getParamQuery());
  const [searchedId, setSearchedId] = useState<string | null>(getParamQuery() || null);
  const [copied, setCopied] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Database states
  const [isSearchingDb, setIsSearchingDb] = useState(false);
  const [dbMember, setDbMember] = useState<any>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);

  // Preserve case for exact matches in Firestore
  const parseQueryValue = (raw: string | null): string => {
    if (!raw) return '';
    let val = raw.trim();
    if (val.includes('id=')) {
      const match = val.match(/[?&]id=([^&]+)/);
      if (match) val = decodeURIComponent(match[1]);
    } else if (val.includes('receipt=')) {
      const match = val.match(/[?&]receipt=([^&]+)/);
      if (match) val = decodeURIComponent(match[1]);
    } else if (val.includes('memberId=')) {
      const match = val.match(/[?&]memberId=([^&]+)/);
      if (match) val = decodeURIComponent(match[1]);
    }
    return val.trim();
  };

  const exactQuery = parseQueryValue(searchedId);
  const cleanQuery = exactQuery.toLowerCase();

  useEffect(() => {
    const q = getParamQuery();
    if (q) {
      setIdInput(q);
      setSearchedId(q);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!exactQuery) {
      setDbMember(null);
      return;
    }

    const searchFirestore = async () => {
      setIsSearchingDb(true);
      try {
        const { collection, getDocs, query, where, limit } = await import('firebase/firestore');
        const { db } = await import('../../lib/firebase');
        
        let foundData: any = null;
        let foundType: 'member' | 'volunteer' | 'donation' | null = null;
        const uppercaseQuery = exactQuery.toUpperCase();

        // 1. Search Members (Iterate through users to avoid collectionGroup index error)
        const usersSnap = await getDocs(collection(db, 'users'));
        for (const userDoc of usersSnap.docs) {
          const membersRef = collection(db, 'users', userDoc.id, 'members');
          
          // Exact match
          const q1 = query(membersRef, where('memberId', '==', exactQuery), limit(1));
          const snap1 = await getDocs(q1);
          if (!snap1.empty) {
            foundData = { ...snap1.docs[0].data(), id: snap1.docs[0].id };
            foundType = 'member';
            break;
          }
          
          // Uppercase match
          if (uppercaseQuery !== exactQuery) {
            const q2 = query(membersRef, where('memberId', '==', uppercaseQuery), limit(1));
            const snap2 = await getDocs(q2);
            if (!snap2.empty) {
              foundData = { ...snap2.docs[0].data(), id: snap2.docs[0].id };
              foundType = 'member';
              break;
            }
          }
        }

        // 2. Search Volunteers
        if (!foundData) {
          const vq1 = query(collection(db, 'volunteers'), where('volunteerId', '==', exactQuery), limit(1));
          const vsnap1 = await getDocs(vq1);
          if (!vsnap1.empty) {
            foundData = { ...vsnap1.docs[0].data(), id: vsnap1.docs[0].id };
            foundType = 'volunteer';
          } else if (uppercaseQuery !== exactQuery) {
            const vq2 = query(collection(db, 'volunteers'), where('volunteerId', '==', uppercaseQuery), limit(1));
            const vsnap2 = await getDocs(vq2);
            if (!vsnap2.empty) {
              foundData = { ...vsnap2.docs[0].data(), id: vsnap2.docs[0].id };
              foundType = 'volunteer';
            }
          }
        }

        // 3. Search Donations
        if (!foundData) {
          const dq1 = query(collection(db, 'donations'), where('receiptNumber', '==', exactQuery), limit(1));
          const dsnap1 = await getDocs(dq1);
          if (!dsnap1.empty) {
            foundData = { ...dsnap1.docs[0].data(), id: dsnap1.docs[0].id };
            foundType = 'donation';
          } else if (uppercaseQuery !== exactQuery) {
            const dq2 = query(collection(db, 'donations'), where('receiptNumber', '==', uppercaseQuery), limit(1));
            const dsnap2 = await getDocs(dq2);
            if (!dsnap2.empty) {
              foundData = { ...dsnap2.docs[0].data(), id: dsnap2.docs[0].id };
              foundType = 'donation';
            }
          }
        }

        // 4. Search Public Volunteers
        if (!foundData) {
          const pvq1 = query(collection(db, 'public_volunteers'), where('memberId', '==', exactQuery), limit(1));
          const pvsnap1 = await getDocs(pvq1);
          if (!pvsnap1.empty) {
            foundData = { ...pvsnap1.docs[0].data(), id: pvsnap1.docs[0].id };
            foundType = 'member';
          } else if (uppercaseQuery !== exactQuery) {
            const pvq2 = query(collection(db, 'public_volunteers'), where('memberId', '==', uppercaseQuery), limit(1));
            const pvsnap2 = await getDocs(pvq2);
            if (!pvsnap2.empty) {
              foundData = { ...pvsnap2.docs[0].data(), id: pvsnap2.docs[0].id };
              foundType = 'member';
            }
          }
        }

        if (foundData) {
          setDbMember({ ...foundData, _type: foundType });
        } else {
          setDbMember(null);
        }
        setDbError(null);

      } catch (err: any) {
        console.warn('Firestore member search failed:', err);
        setDbError(err.message || 'Unknown error occurred');
      } finally {
        setIsSearchingDb(false);
      }
    };

    searchFirestore();
  }, [exactQuery]);

  // Map from local state or dbMember depending on what was found
  const foundDonation = (dbMember?._type === 'donation' ? dbMember : null) || donations.find(d => 
    d.receiptNumber.toLowerCase() === cleanQuery || 
    (d.transactionId && d.transactionId.toLowerCase() === cleanQuery) ||
    cleanQuery.includes(d.receiptNumber.toLowerCase())
  );

  const foundMember = (dbMember?._type === 'member' ? dbMember : null) || (!foundDonation ? members.find(m => 
    (m.memberId && m.memberId.toLowerCase() === cleanQuery) || 
    (m.id && m.id.toLowerCase() === cleanQuery) ||
    (m.memberId && cleanQuery.includes(m.memberId.toLowerCase()))
  ) : null);

  const foundVolunteer = (dbMember?._type === 'volunteer' ? dbMember : null) || ((!foundDonation && !foundMember) ? volunteers.find(v => 
    (v.volunteerId && v.volunteerId.toLowerCase() === cleanQuery) || 
    (v.id && v.id.toLowerCase() === cleanQuery) ||
    (v.volunteerId && cleanQuery.includes(v.volunteerId.toLowerCase()))
  ) : null);

  const isVerified = Boolean(foundDonation || foundMember || foundVolunteer);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idInput.trim()) return;
    const parsed = parseQueryValue(idInput.trim());
    setSearchedId(parsed);
    setSearchParams({ id: parsed });
  };

  // Stop camera stream safely
  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(t => t.stop());
      cameraStreamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  // Start camera stream for live QR scanning
  const startCamera = async () => {
    setCameraError(null);
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Check if native BarcodeDetector API is supported
      if ('BarcodeDetector' in window) {
        // @ts-ignore
        const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
        scanIntervalRef.current = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const rawUrl = barcodes[0].rawValue;
                stopCamera();
                const extracted = parseQueryValue(rawUrl);
                setIdInput(extracted);
                setSearchedId(extracted);
                setSearchParams({ id: extracted });
              }
            } catch (err) {
              // Ignore frame-level detection slips
            }
          }
        }, 300);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access denied or unavailable. You can enter the ID code manually below.');
      setIsCameraActive(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const copyUrl = () => {
    if (!searchedId) return;
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const verificationTimestamp = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Top Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm ring-8 ring-emerald-50">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Official Security & Trust Portal
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3 mb-2">
            Verify NGO Member & Volunteer ID
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Ensure authenticity of field staff, volunteers, and officers representing {organization.name}. Enter the ID printed on the physical or digital card.
          </p>
        </div>

        {/* Search & Camera Scanner Box */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <QrCode className="w-4 h-4 text-emerald-600" /> Verify ID Card or Tax Receipt
            </h2>
            <button
              type="button"
              onClick={() => {
                if (isCameraActive) {
                  stopCamera();
                } else {
                  startCamera();
                }
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isCameraActive 
                  ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' 
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <Camera className="w-4 h-4" />
              {isCameraActive ? 'Close Camera' : 'Scan Card with Camera'}
            </button>
          </div>

          {/* Live Camera Scanner Viewfinder */}
          {isCameraActive && (
            <div className="mb-6 p-4 bg-slate-900 rounded-2xl flex flex-col items-center relative overflow-hidden animate-in fade-in duration-200">
              <div className="relative w-full max-w-sm aspect-video sm:aspect-square bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                <video 
                  ref={videoRef} 
                  className="w-full h-full object-cover" 
                  autoPlay 
                  playsInline 
                  muted 
                />
                {/* Target Frame / Crosshair */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-emerald-400/80 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                    <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400"></div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400"></div>
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400"></div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400"></div>
                    {/* Animated scanning beam */}
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse top-1/2 -translate-y-1/2"></div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-3 text-center">
                Align the ID card's QR code within the frame to automatically verify.
              </p>
            </div>
          )}

          {cameraError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter ID number (e.g. GHF-000001) or paste scanned link..."
                value={idInput}
                onChange={(e) => setIdInput(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold uppercase tracking-wider focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="py-3.5 px-7 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" /> Verify Credential
            </button>
          </form>
        </div>

        {/* Verification Result */}
        {searchedId && (
          <div>
            {foundDonation ? (
              /* Verified Donation Tax Receipt Record */
              <div className="bg-white rounded-3xl border border-emerald-200 shadow-xl overflow-hidden relative">
                {/* Official Status Banner */}
                <div className="bg-emerald-700 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                    <span className="text-sm font-bold uppercase tracking-wider">Officially Verified Tax Receipt</span>
                  </div>
                  <span className="text-xs bg-emerald-800 px-3 py-1 rounded-full font-mono font-semibold">
                    RECEIPT: {foundDonation.receiptNumber}
                  </span>
                </div>

                <div className="p-6 sm:p-10 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block mb-1">
                        Charitable Contribution Clearance
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                        {foundDonation.donorName} {foundDonation.isAnonymous ? '(Anonymous Contributor)' : ''}
                      </h2>
                      <p className="text-sm font-semibold text-slate-600 mt-1">
                        Designated Cause: <span className="text-emerald-700 font-bold">{foundDonation.campaignName}</span>
                      </p>
                    </div>

                    <div className="text-left sm:text-right bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                      <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Contribution Cleared</span>
                      <span className="text-2xl font-black text-emerald-700">
                        {formatCurrency(foundDonation.amount, foundDonation.currency || organization.currency)} {foundDonation.currency || organization.currency}
                      </span>
                    </div>
                  </div>

                  {/* Receipt Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Contribution Date</span>
                      <span className="font-semibold text-slate-900">
                        {new Date(foundDonation.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Contribution Type</span>
                      <span className="font-semibold text-slate-900 uppercase">
                        {foundDonation.frequency || 'One-Time'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Method</span>
                      <span className="font-semibold text-slate-900 uppercase">
                        {foundDonation.paymentMethod}
                      </span>
                    </div>
                  </div>

                  {/* Approving Officer Information */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">
                          Approved & Officially Signed By
                        </div>
                        <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <span>{foundDonation.approvedBy || 'Authorized Treasury Officer'}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            (foundDonation.approverRole?.toLowerCase().includes('mod') || foundDonation.approvedBy?.toLowerCase().includes('mod'))
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {foundDonation.approverRole || (foundDonation.approvedBy?.toLowerCase().includes('mod') ? 'Moderator' : 'Admin')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 sm:text-right">
                      <div className="font-semibold text-emerald-700 flex items-center sm:justify-end gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Cleared & Audited
                      </div>
                      <div className="text-[11px] text-slate-400">Directorate of Treasury & Audits</div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => downloadReceiptPdf(foundDonation, organization)}
                      className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Download Official PDF Receipt
                    </button>
                    <button
                      type="button"
                      onClick={() => openReceiptPdfInNewTab(foundDonation, organization)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-slate-500" /> Print / View PDF
                    </button>
                    <button
                      type="button"
                      onClick={copyUrl}
                      className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Link Copied!' : 'Copy Verification Link'}
                    </button>
                  </div>
                </div>
              </div>
            ) : isSearchingDb ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-sm">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Searching Database...</h3>
                <p className="text-sm text-slate-500">Please wait while we verify this credential securely.</p>
              </div>
            ) : dbError ? (
              <div className="bg-white rounded-3xl border border-red-200 p-8 sm:p-12 text-center shadow-sm">
                <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-red-700 mb-2">Database Error</h3>
                <p className="text-sm text-red-600 mb-4">{dbError}</p>
                <p className="text-xs text-slate-500">There was an issue connecting to the database. This usually means a permission issue or a missing index.</p>
              </div>
            ) : isVerified ? (
              /* Verified Member / Volunteer Card */
              <div className="bg-white rounded-3xl border border-emerald-200 shadow-2xl overflow-hidden relative">
                {/* Official Verified Status Banner */}
                <div className="bg-gradient-to-r from-emerald-700 to-teal-700 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1 bg-white/20 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-black uppercase tracking-wider block">
                        Verified Authentic Credential
                      </span>
                      <span className="text-[11px] text-emerald-100 font-medium">
                        Scanned via QR Code &bull; Official {organization.name} Registry
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-black/20 text-emerald-50 px-3 py-1 rounded-full font-mono font-bold border border-white/10">
                      REG: {organization.registrationNumber || 'NGO-AB-2023-09412'}
                    </span>
                  </div>
                </div>

                <div className="p-6 sm:p-10 space-y-8">
                  <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                    {/* Portrait Photo with Live Status Badge */}
                    <div className="relative shrink-0">
                      <img 
                        src={foundMember?.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&q=80'} 
                        alt="Credential Portrait" 
                        className="w-36 h-36 sm:w-40 sm:h-40 rounded-3xl object-cover ring-4 ring-emerald-100 shadow-lg"
                      />
                      <span className="absolute -bottom-2.5 inset-x-2 bg-emerald-600 text-white text-[11px] font-black py-1 rounded-full uppercase border-2 border-white shadow-md text-center tracking-wider flex items-center justify-center gap-1">
                        <CheckCheck className="w-3.5 h-3.5" /> {foundMember?.status || foundVolunteer?.status || 'Active & Authorized'}
                      </span>
                    </div>

                    {/* Member Details */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1.5">
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
                            {foundMember?.role || 'Volunteer'} Credential
                          </span>
                          <span className="text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            ID: {foundMember?.memberId || foundVolunteer?.volunteerId}
                          </span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                          {foundMember ? `${foundMember.firstName} ${foundMember.lastName}` : foundVolunteer?.name}
                        </h2>
                        <p className="text-base font-semibold text-slate-600 mt-1">
                          {foundMember?.designation || 'Field Representative'} &bull; <span className="text-emerald-700">{foundMember?.department || foundVolunteer?.department}</span>
                        </p>
                      </div>

                      {/* Credential Data Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-xs">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Official ID</span>
                          <span className="font-mono font-black text-slate-900 text-sm">
                            {foundMember?.memberId || foundVolunteer?.volunteerId}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-xs">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Blood Group</span>
                          <span className="font-extrabold text-rose-600 text-sm">
                            {foundMember?.bloodGroup || 'O+'}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-xs">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Joining Date</span>
                          <span className="font-semibold text-slate-800">
                            {foundMember?.joiningDate || '2023-01-01'}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-xs">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Verification Date</span>
                          <span className="font-semibold text-slate-800">
                            {verificationTimestamp.split(' at ')[0]}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-xs">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Emergency Contact</span>
                          <span className="font-mono font-semibold text-slate-800">
                            {foundMember?.emergencyContact || organization.emergencyContact || 'Available on Request'}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-xs">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Card Validity</span>
                          <span className="font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Officially Valid
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QR Code Verification Card & Organization Seal */}
                  <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-4">
                      {/* Live Matching QR Code */}
                      <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm shrink-0">
                        <QRCodeSVG 
                          value={getMemberVerificationUrl(foundMember || foundVolunteer as any, organization)} 
                          size={84} 
                          level="M"
                        />
                      </div>
                      <div className="text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-700 font-bold mb-1">
                          <Shield className="w-4 h-4" />
                          <span>Direct QR Code Payload</span>
                        </div>
                        <p className="font-mono text-[11px] text-slate-600 break-all max-w-xs">
                          {getMemberVerificationUrl(foundMember || foundVolunteer as any, organization)}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Scan with any phone camera to verify this individual anytime.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                      <button
                        type="button"
                        onClick={copyUrl}
                        className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 rounded-xl border border-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Link Copied!' : 'Copy Verification Link'}
                      </button>
                    </div>
                  </div>

                  {/* Organization Authority Badge */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 px-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      <span>Issued and cleared by <strong className="text-slate-800">{organization.name}</strong></span>
                    </div>
                    <span>Phone: {organization.phone}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Invalid / Counterfeit Warning */
              <div className="bg-white rounded-3xl border border-rose-200 p-8 sm:p-12 text-center shadow-xl">
                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-8 ring-rose-50">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">No Verified Record Found</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
                  We could not find an authorized credential matching <span className="font-mono font-bold text-rose-600">"{searchedId}"</span> in the {organization.name} registry.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left text-xs text-amber-800 max-w-lg mx-auto mb-6 flex gap-3 shadow-xs">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-950 mb-1">Security & Fraud Advisory:</p>
                    <p className="text-amber-900/90 leading-relaxed">
                      Please confirm that you scanned the official QR code on the back of an issued card, or check the spelling of the ID number. If an unauthorized individual is presenting a counterfeit or expired card claiming to represent {organization.name}, please notify our central office at <strong className="text-amber-950">{organization.phone || 'headquarters'}</strong> immediately.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIdInput('');
                      setSearchedId(null);
                      setSearchParams({});
                    }}
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Scan or Enter Another ID
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
