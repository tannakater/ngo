import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, ShieldCheck, Check, Copy, ExternalLink, 
  Eye, X, CheckCircle2, UserCheck, 
  Heart, Sparkles, Phone, Mail, Award, Droplet, Calendar,
  ChevronLeft, ChevronRight, Users, ArrowRight
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Member } from '../../types';
import { useOrgStore } from '../../store/useOrgStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import { isIdDeleted, isStoreInitialized } from '../../lib/tombstones';

// Fallback high-fidelity seed team matching official foundation members without ID gaps
const fallbackTeam: Member[] = [
  {
    id: 'mem-seed-1',
    memberId: 'DAK-261001',
    firstName: 'Dr. Mahfuzur',
    lastName: 'Rahman',
    designation: 'President & Founder',
    department: 'Administration',
    role: 'Staff',
    phone: '+880 1711-002233',
    email: 'president@dakshebafoundation.org',
    bloodGroup: 'A+',
    dateOfBirth: '1985-03-15',
    joiningDate: '2024-01-01',
    address: 'Gulshan, Dhaka, Bangladesh',
    emergencyContact: '+880 1711-998877',
    status: 'Active',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&q=80',
    customFields: {}
  },
  {
    id: 'mem-seed-2',
    memberId: 'DAK-261002',
    firstName: 'Farhana',
    lastName: 'Yasmin',
    designation: 'General Secretary',
    department: 'Operations',
    role: 'Staff',
    phone: '+880 1722-334455',
    email: 'secretary@dakshebafoundation.org',
    bloodGroup: 'B+',
    dateOfBirth: '1990-07-20',
    joiningDate: '2024-01-10',
    address: 'Dhanmondi, Dhaka, Bangladesh',
    emergencyContact: '+880 1722-998877',
    status: 'Active',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&q=80',
    customFields: {}
  },
  {
    id: 'mem-seed-3',
    memberId: 'DAK-261003',
    firstName: 'Rafi',
    lastName: 'Rakib',
    designation: 'Vice President',
    department: 'Fundraising',
    role: 'Volunteer',
    phone: '+880 1790-650636',
    email: 'rafi@dakshebafoundation.org',
    bloodGroup: 'O+',
    dateOfBirth: '1998-05-12',
    joiningDate: '2025-11-20',
    address: 'Dhaka, Bangladesh',
    emergencyContact: '+880 1790-650636',
    status: 'Active',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&q=80',
    customFields: {}
  },
  {
    id: 'mem-seed-4',
    memberId: 'DAK-261004',
    firstName: 'Md',
    lastName: 'Parvez',
    designation: 'Senior Vice Secretary',
    department: 'General Support',
    role: 'Volunteer',
    phone: '+880 1790-650636',
    email: 'parvez@dakshebafoundation.org',
    bloodGroup: 'A+',
    dateOfBirth: '1997-03-14',
    joiningDate: '2025-10-10',
    address: 'Sylhet, Bangladesh',
    emergencyContact: '+880 1790-650636',
    status: 'Active',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&q=80',
    customFields: {}
  },
  {
    id: 'mem-seed-5',
    memberId: 'DAK-261005',
    firstName: 'Ahamed',
    lastName: 'Monir',
    designation: 'Field Officer',
    department: 'Relief & Crisis',
    role: 'Volunteer',
    phone: '+880 1790-650636',
    email: 'monir@dakshebafoundation.org',
    bloodGroup: 'AB+',
    dateOfBirth: '1996-07-09',
    joiningDate: '2025-09-01',
    address: 'Rajshahi, Bangladesh',
    emergencyContact: '+880 1790-650636',
    status: 'Active',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&q=80',
    customFields: {}
  },
  {
    id: 'mem-seed-6',
    memberId: 'DAK-261006',
    firstName: 'Saeem',
    lastName: 'Ahmed',
    designation: 'Organizing Secretary',
    department: 'Education',
    role: 'Volunteer',
    phone: '+880 1790-650636',
    email: 'saeem@dakshebafoundation.org',
    bloodGroup: 'O+',
    dateOfBirth: '1999-08-22',
    joiningDate: '2025-12-01',
    address: 'Chittagong, Bangladesh',
    emergencyContact: '+880 1790-650636',
    status: 'Active',
    photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop&q=80',
    customFields: {}
  },
  {
    id: 'mem-seed-7',
    memberId: 'DAK-261007',
    firstName: 'Tamim',
    lastName: 'Iqbal',
    designation: 'Executive Member',
    department: 'General Support',
    role: 'Volunteer',
    phone: '+880 1790-650636',
    email: 'tamim@dakshebafoundation.org',
    bloodGroup: 'B+',
    dateOfBirth: '2000-01-01',
    joiningDate: '2026-01-15',
    address: 'Dhaka, Bangladesh',
    emergencyContact: '+880 1790-650636',
    status: 'Active',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80',
    customFields: {}
  },
  {
    id: 'mem-seed-8',
    memberId: 'DAK-261008',
    firstName: 'Manob',
    lastName: 'Chowdhury',
    designation: 'Community Coordinator',
    department: 'Healthcare',
    role: 'Volunteer',
    phone: '+880 1790-650636',
    email: 'manob@dakshebafoundation.org',
    bloodGroup: 'B-',
    dateOfBirth: '1995-11-30',
    joiningDate: '2025-08-15',
    address: 'Khulna, Bangladesh',
    emergencyContact: '+880 1790-650636',
    status: 'Active',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&q=80',
    customFields: {}
  }
];

interface VolunteerTeamSectionProps {
  showTitle?: boolean;
  maxDisplay?: number;
}

export function VolunteerTeamSection({ showTitle = true, maxDisplay }: VolunteerTeamSectionProps) {
  const { organization, members } = useOrgStore();
  const { language, t } = useLanguageStore();

  const isBn = language === 'bn';

  // Use store members if available, or high-fidelity fallback team (strictly filtering deleted IDs)
  const displaySource = useMemo(() => {
    if (members && members.length > 0) {
      return members.filter(m => !isIdDeleted(m.id));
    }
    if (isStoreInitialized('org')) {
      return [];
    }
    return fallbackTeam.filter(m => !isIdDeleted(m.id));
  }, [members]);

  const [selectedMemberForModal, setSelectedMemberForModal] = useState<Member | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Active members for display - STRICTLY show ONLY approved & active members (never pending requests)
  const activeMembers = useMemo(() => {
    const list = displaySource.filter(m => m.status === 'Active');
    return maxDisplay && maxDisplay > 0 ? list.slice(0, maxDisplay) : list;
  }, [displaySource, maxDisplay]);

  // Horizontal scroll container ref and navigation states
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 15);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 15);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, activeMembers]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = Math.max(el.clientWidth * 0.75, 310);
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyVerifyLink = (memberId: string) => {
    const url = `${window.location.origin}/verify?id=${encodeURIComponent(memberId)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <section className="py-20 bg-gradient-to-b from-white via-slate-50/50 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Carousel Navigation Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          {showTitle && (
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-4 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('our_people')}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {t('volunteer_team_title')}
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mt-2 leading-relaxed">
                {t('volunteer_team_subtitle')}
              </p>
            </div>
          )}

          {/* Carousel Controls & Active Count Badge */}
          <div className="flex items-center gap-3 self-start md:self-end">
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {isBn 
                  ? `${activeMembers.length} জন সক্রিয় প্রতিনিধি` 
                  : `${activeMembers.length} Active Members`}
              </span>
            </div>

            {/* Left & Right Arrow Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                  canScrollLeft
                    ? 'bg-white hover:bg-emerald-50 border-slate-200 text-slate-800 hover:text-emerald-700 hover:border-emerald-300 active:scale-95'
                    : 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
                }`}
                title={t('scroll_left')}
                aria-label={t('scroll_left')}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                  canScrollRight
                    ? 'bg-white hover:bg-emerald-50 border-slate-200 text-slate-800 hover:text-emerald-700 hover:border-emerald-300 active:scale-95'
                    : 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
                }`}
                title={t('scroll_right')}
                aria-label={t('scroll_right')}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Side-Scrolling Carousel Track */}
        <div 
          ref={scrollContainerRef}
          className="flex items-stretch gap-5 sm:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory py-4 px-1 scrollbar-none"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {activeMembers.map((mem, memIdx) => {
            const isCopied = copiedId === mem.id;
            const photoSrc = mem.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&q=80';

            return (
              <div 
                key={mem.id ? `mem-card-${mem.id}` : `mem-card-${mem.memberId}-${memIdx}`} 
                className="snap-start shrink-0 w-[275px] sm:w-[295px] md:w-[310px] group bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-400 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between select-none"
              >
                
                {/* Top Status Bar & Photo */}
                <div className="p-6 text-center pb-4 relative">
                  
                  {/* Active Status Badge */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{t('active_status')}</span>
                  </div>

                  {/* Official Avatar with Ring & Verified Badge */}
                  <div className="relative inline-block mx-auto mb-4">
                    <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-200 shadow-sm group-hover:scale-105 transition-transform duration-300">
                      <img 
                        src={photoSrc} 
                        alt={`${mem.firstName} ${mem.lastName}`} 
                        className="w-full h-full rounded-full object-cover bg-slate-100"
                        onError={(e) => {
                          (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&q=80');
                        }}
                      />
                    </div>
                    
                    {/* Verified Shield Icon Badge */}
                    <div 
                      className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-emerald-600 text-white border-2 border-white shadow-sm flex items-center justify-center"
                      title={t('verified_volunteer')}
                    >
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Member Name */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors truncate px-2">
                    {mem.firstName} {mem.lastName}
                  </h3>

                  {/* Designation Pill */}
                  <div className="mt-1.5 inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-xs max-w-full truncate">
                    {mem.designation || 'Volunteer Member'}
                  </div>

                  {/* Department Tag */}
                  <p className="text-xs text-slate-500 mt-1 font-medium truncate">
                    {mem.department || 'General Support'}
                  </p>

                  {/* Blood Group tag if available */}
                  {mem.bloodGroup && (
                    <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                      <Droplet className="w-3 h-3 fill-rose-600" />
                      <span>{mem.bloodGroup}</span>
                    </div>
                  )}

                </div>

                {/* Bottom Action Footer */}
                <div className="bg-slate-50/80 border-t border-slate-100 p-4 space-y-2.5">
                  
                  {/* Interactive Member ID Capsule */}
                  <div className="flex items-center justify-between bg-white rounded-xl px-3 py-1.5 border border-slate-200/90 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-mono font-bold text-slate-800">{mem.memberId}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(mem.memberId, mem.id)}
                      className="text-slate-400 hover:text-emerald-700 p-1 rounded transition-colors cursor-pointer"
                      title="Copy Member ID"
                    >
                      {isCopied ? (
                        <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> {t('copied')}
                        </span>
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Dual Action Buttons: View Digital ID & Verify Online */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setSelectedMemberForModal(mem)}
                      className="w-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>{t('view_digital_id')}</span>
                    </button>

                    <Link
                      to={`/verify?id=${encodeURIComponent(mem.memberId)}`}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-2 rounded-xl text-[11px] font-bold transition-colors flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                      <span>{t('verify_official_id')}</span>
                    </Link>
                  </div>

                </div>

              </div>
            );
          })}

          {/* End-of-Carousel Directory Card */}
          <div className="snap-start shrink-0 w-[240px] sm:w-[260px] bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-2xl p-6 flex flex-col justify-between shadow-xs border border-emerald-800/50">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-800/60 border border-emerald-600/50 text-emerald-300 flex items-center justify-center mb-5">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">
                {isBn ? 'সদস্য ভেরিফিকেশন পোর্টাল' : 'Member Verification Portal'}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isBn
                  ? 'সকল ফিল্ড প্রতিনিধি ও স্বেচ্ছাসেবকদের অফিসিয়াল আইডি ও কিউআর কোড অনলাইন পোর্টালে মুহূর্তেই যাচাই করুন।'
                  : 'Instantly verify any ground volunteer, field worker, or representative in real-time.'}
              </p>
            </div>

            <Link
              to="/verify"
              className="mt-6 w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-2.5 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span>{isBn ? 'আইডি ভেরিফাই করুন' : 'Verify Any ID'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Swipe & Navigation Hint (Mobile) */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
          <span>{t('swipe_hint')}</span>
          <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
            <span>{activeMembers.length} {isBn ? 'সদস্য' : 'cards'}</span>
          </div>
        </div>

        {/* Member Verification Callout Strip */}
        <div className="mt-10 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                {isBn 
                  ? 'আমাদের সদস্য ও স্বেচ্ছাসেবক নেটওয়ার্কের যেকোনো সদস্যকে যাচাই করুন'
                  : 'Verify any volunteer or field representative from our registered network'}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isBn 
                  ? 'সকল ফিল্ড প্রতিনিধি ও স্বেচ্ছাসেবকদের অফিসিয়াল কার্ড সরাসরি ভেরিফিকেশন পোর্টালে যাচাইযোগ্য।'
                  : 'All registered ground volunteers and staff carry official cryptographic QR credentials verified in real-time.'}
              </p>
            </div>
          </div>
          <Link
            to="/verify"
            className="shrink-0 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <span>{isBn ? 'আইডি ভেরিফাই পোর্টালে যান' : 'Go to Verify Portal'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Join as Volunteer Callout Banner */}
        <div className="mt-16 bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-emerald-500/10 pointer-events-none"></div>
          <div className="space-y-2 text-center md:text-left z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-bold tracking-wider uppercase border border-emerald-400/30">
              <Heart className="w-3.5 h-3.5 text-emerald-300" />
              {isBn ? 'স্বেচ্ছাসেবী নেটওয়ার্ক' : 'Community Volunteer Network'}
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t('join_volunteer_callout')}
            </h3>
            <p className="text-emerald-100/90 text-sm max-w-xl">
              {isBn 
                ? 'ডাকসেবা ফাউন্ডেশনের সাথে যুক্ত হয়ে সুবিধাবঞ্চিত শিশুদের শিক্ষা, স্বাস্থ্য এবং দুর্যোগপীড়িত মানুষের সেবায় সক্রিয় ভূমিকা রাখুন।'
                : 'Become an official verified volunteer of DakSeba Foundation and make a tangible difference in the lives of vulnerable families.'}
            </p>
          </div>
          <div className="z-10 shrink-0">
            <Link
              to="/volunteer"
              className="bg-white hover:bg-emerald-50 text-emerald-900 font-bold px-6 py-3 rounded-xl text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-105"
            >
              <UserCheck className="w-4 h-4 text-emerald-700" />
              <span>{t('join_volunteer_btn')}</span>
            </Link>
          </div>
        </div>

      </div>

      {/* Digital ID Card Modal */}
      {selectedMemberForModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  {isBn ? 'অফিসিয়াল ডিজিটাল আইডি কার্ড' : 'Official Digital ID Pass'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMemberForModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Realistic Digital ID Card */}
            <div className="p-6 space-y-5">
              
              {/* Card Container */}
              <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden border-2 border-emerald-500/40">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none"></div>

                {/* Organization Header */}
                <div className="flex items-center justify-between border-b border-emerald-700/60 pb-3 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={organization.logoUrl || '/daksheba.jpg'} 
                      alt={organization.name}
                      className="w-9 h-9 rounded-full bg-white p-0.5 object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div>
                      <h4 className="text-xs font-bold leading-tight tracking-tight">
                        {organization.name}
                      </h4>
                      <p className="text-[9px] text-emerald-300 font-medium">
                        {organization.nameBn || 'ডাকসেবা ফাউন্ডেশন'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[9px] font-bold uppercase tracking-wider">
                      {isBn ? 'স্বেচ্ছাসেবক' : 'Volunteer'}
                    </span>
                  </div>
                </div>

                {/* Member Details & Avatar */}
                <div className="pt-4 flex gap-4 items-center relative z-10">
                  
                  {/* Photo with frame */}
                  <div className="shrink-0 relative">
                    <img 
                      src={selectedMemberForModal.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&q=80'} 
                      alt={selectedMemberForModal.firstName}
                      className="w-20 h-24 rounded-xl object-cover border-2 border-white shadow-md bg-slate-800"
                      onError={(e) => {
                        (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&q=80');
                      }}
                    />
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 rounded-full p-0.5 border border-white">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <h5 className="text-sm font-bold text-white truncate">
                      {selectedMemberForModal.firstName} {selectedMemberForModal.lastName}
                    </h5>
                    <p className="text-xs font-semibold text-emerald-300 truncate">
                      {selectedMemberForModal.designation || 'Volunteer'}
                    </p>
                    <p className="text-[11px] text-emerald-100/80 truncate">
                      Dept: {selectedMemberForModal.department || 'General Support'}
                    </p>

                    {/* ID Capsule */}
                    <div className="mt-2 pt-1 border-t border-emerald-700/50 flex items-center gap-2 text-[11px]">
                      <span className="text-emerald-300/80 font-medium">ID:</span>
                      <span className="font-mono font-bold text-white bg-black/30 px-2 py-0.5 rounded border border-white/10">
                        {selectedMemberForModal.memberId}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom QR Code & Credentials strip */}
                <div className="mt-4 pt-3 border-t border-emerald-700/60 flex items-center justify-between relative z-10">
                  <div className="space-y-1 text-[10px] text-emerald-200">
                    {selectedMemberForModal.bloodGroup && (
                      <div className="flex items-center gap-1 font-semibold">
                        <Droplet className="w-3 h-3 text-rose-400 fill-rose-400" />
                        <span>Blood: {selectedMemberForModal.bloodGroup}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-emerald-400" />
                      <span>Joined: {selectedMemberForModal.joiningDate || '2026'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-300 font-bold">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>{t('validity_active')}</span>
                    </div>
                  </div>

                  {/* Live Verification QR Code */}
                  <div className="bg-white p-1.5 rounded-xl shadow-xs border border-white/20">
                    <QRCodeSVG
                      value={`${window.location.origin}/verify?query=${encodeURIComponent(selectedMemberForModal.memberId)}`}
                      size={60}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                
                {/* 1-Click Verify */}
                <Link
                  to={`/verify?query=${encodeURIComponent(selectedMemberForModal.memberId)}`}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-200" />
                  <span>{isBn ? 'অনলাইনে আইডি যাচাই করুন (Verify Online)' : 'Verify Identity Online Now'}</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-auto" />
                </Link>

                {/* Copy Link */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => copyVerifyLink(selectedMemberForModal.memberId)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">{t('copied_link')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>{t('share_profile')}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMemberForModal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    {t('close')}
                  </button>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </section>
  );
}
