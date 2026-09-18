import { create } from 'zustand';

export type Language = 'en' | 'bn';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    home: 'Home',
    about: 'About',
    programs: 'Programs',
    campaigns: 'Campaigns',
    verify_id: 'Verify ID',
    donate_now: 'Donate Now',
    track_donation: 'Track Donation',
    volunteer: 'Volunteer',
    contact: 'Contact',
    transparency: 'Transparency',

    // Topbar
    topbar_tagline: 'Official Humanitarian & Community Trust',
    phone: 'Phone',
    email: 'Email',

    // Track Page
    track_title: 'Donation Tracker',
    track_subtitle: 'Check the real-time status and allocation of your donation',
    track_placeholder: 'Enter Receipt No (e.g. REC-2026-...) or TrxID / Phone',
    track_btn: 'Track Status',
    track_not_found: 'No donation record found matching your query.',
    track_not_found_desc: 'Please double-check your Receipt Number, Transaction ID, or Phone Number.',
    status_completed: 'Verified & Received',
    status_pending: 'Verification in Progress',
    status_failed: 'Unsuccessful / Failed',
    timeline_step1: 'Donation Initiated',
    timeline_step2: 'Bank / MFS Reconciliation',
    timeline_step3: 'Official Receipt Issued',
    timeline_step4: 'Humanitarian Fund Allocation',
    download_receipt: 'Download Receipt',
    print_receipt: 'Print / View PDF',
    need_help: 'Need assistance? Contact our accounts desk at',

    // Donate Page
    donate_title: 'Make a Donation',
    donate_subtitle: 'Support Dakseba Foundation with your direct contribution.',
    donation_amount: 'Donation Amount',
    custom_amount_placeholder: 'Or enter custom amount',
    payment_method: 'Payment Method',
    mobile_money: 'bKash / Nagad',
    bank_transfer: 'Bank Transfer',
    card: 'Credit / Debit Card',
    send_money_instructions: 'Send Money to our official merchant/personal number',
    copy: 'Copy',
    copied: 'Copied!',
    your_phone: 'Your Phone (Optional)',
    trx_id: 'Transaction ID (TrxID)',
    donor_info: 'Donor Information',
    full_name: 'Full Name',
    email_for_receipt: 'Email (for instant receipt & update)',
    donate_anon: 'Donate anonymously',
    donate_button: 'Donate',
    processing: 'Processing...',
    thank_you: 'Thank You for Donating!',
    donation_received: 'Your contribution was recorded successfully.',
    receipt_no: 'Receipt No',
    amount: 'Amount',
    donor_name: 'Donor Name',
    donate_again: 'Donate Again',
    auto_sms_email_notice: 'Automatic SMS & Email confirmation sent to your contact details.',

    // Volunteer Team
    our_people: 'Our People',
    volunteer_team_title: 'Dedicated Volunteer Team',
    volunteer_team_subtitle: 'Our volunteers work together with compassion, responsibility, and dedication to serve people and strengthen communities.',
    verified_volunteer: 'Verified Volunteer',
    active_status: 'Active',
    verify_official_id: 'Verify Official ID',
    view_digital_id: 'View Digital ID',
    search_volunteer_placeholder: 'Search volunteer by name or ID...',
    all_departments: 'All Departments',
    no_volunteers_found: 'No volunteers found matching your filter.',
    join_volunteer_callout: 'Want to make a difference in society?',
    join_volunteer_btn: 'Join as a Volunteer',
    official_id_badge: 'Official ID',
    blood_group: 'Blood Group',
    validity_active: 'Active & Verified',
    close: 'Close',
    share_profile: 'Share Verification Link',
    copied_link: 'Link Copied!',
    scroll_left: 'Scroll Left',
    scroll_right: 'Scroll Right',
    swipe_hint: 'Swipe or use arrows to view all team members',
    all_volunteers: 'All Volunteers'
  },
  bn: {
    // Navigation
    home: 'হোম',
    about: 'আমাদের সম্পর্কে',
    programs: 'কার্যক্রম',
    campaigns: 'ক্যাম্পেইন',
    verify_id: 'আইডি যাচাই',
    donate_now: 'অনুদান দিন',
    track_donation: 'অনুদান ট্র্যাকিং',
    volunteer: 'স্বেচ্ছাসেবক',
    contact: 'যোগাযোগ',
    transparency: 'স্বচ্ছতা',

    // Topbar
    topbar_tagline: 'অফিসিয়াল মানবকল্যাণ ও সামাজিক ট্রাস্ট',
    phone: 'ফোন',
    email: 'ইমেইল',

    // Track Page
    track_title: 'অনুদান ট্র্যাকার',
    track_subtitle: 'আপনার প্রদত্ত অনুদানের যাচাইকরণ অগ্রগতি ও বাস্তবসম্মত ব্যয়ের লাইভ স্ট্যাটাস দেখুন',
    track_placeholder: 'রসিদ নম্বর (যেমন: REC-2026-...) বা TrxID / ফোন নম্বর লিখুন',
    track_btn: 'স্ট্যাটাস ট্র্যাক করুন',
    track_not_found: 'আপনার প্রদত্ত তথ্যের সাথে কোনো অনুদানের রেকর্ড পাওয়া যায়নি।',
    track_not_found_desc: 'দয়া করে আপনার রসিদ নম্বর, ট্রানজ্যাকশন আইডি অথবা ফোন নম্বরটি পুনরায় মিলিয়ে দেখুন।',
    status_completed: 'যাচাইকৃত ও সফল',
    status_pending: 'যাচাইকরণ প্রক্রিয়া চলছে',
    status_failed: 'ব্যর্থ / অসম্পূর্ণ',
    timeline_step1: 'অনুদান প্রদান শুরু',
    timeline_step2: 'ব্যাংক / মোবাইল ব্যাংকিং যাচাইকরণ',
    timeline_step3: 'অফিসিয়াল রসিদ ইস্যু ও নিবন্ধন',
    timeline_step4: 'কল্যাণ তহবিলে অর্থ বরাদ্দ',
    download_receipt: 'রসিদ ডাউনলোড',
    print_receipt: 'প্রিন্ট / PDF ভিউ',
    need_help: 'যেকোনো সহায়তায় সরাসরি যোগাযোগ করুন:',

    // Donate Page
    donate_title: 'অনুদান প্রদান করুন',
    donate_subtitle: 'ডাকসেবা ফাউন্ডেশনের মানবকল্যাণমূলক কাজে আপনার হাত বাড়িয়ে দিন।',
    donation_amount: 'অনুদানের পরিমাণ',
    custom_amount_placeholder: 'অথবা ইচ্ছামতো টাকার পরিমাণ লিখুন',
    payment_method: 'পেমেন্ট মাধ্যম',
    mobile_money: 'বিকাশ / নগদ / রকেট',
    bank_transfer: 'ব্যাংক ট্রান্সফার',
    card: 'কার্ড পেমেন্ট',
    send_money_instructions: 'আমাদের অফিশিয়াল নম্বরে Send Money করুন',
    copy: 'কপি',
    copied: 'কপি হয়েছে!',
    your_phone: 'আপনার ফোন নম্বর (ঐচ্ছিক)',
    trx_id: 'ট্রানজ্যাকশন আইডি (TrxID)',
    donor_info: 'দাতার তথ্য',
    full_name: 'পূর্ণ নাম',
    email_for_receipt: 'ইমেইল (রসিদ ও আপডেটের জন্য)',
    donate_anon: 'বেনামে অনুদান দিতে চান',
    donate_button: 'অনুদান দিন',
    processing: 'প্রসেসিং হচ্ছে...',
    thank_you: 'আপনার অনুদানের জন্য আন্তরিক ধন্যবাদ!',
    donation_received: 'আপনার অনুদান সফলভাবে সিস্টেমে জমা হয়েছে।',
    receipt_no: 'রসিদ নম্বর',
    amount: 'পরিমাণ',
    donor_name: 'দাতার নাম',
    donate_again: 'আবার অনুদান দিন',
    auto_sms_email_notice: 'আপনার ফোন ও ইমেইলে স্বয়ংক্রিয় SMS ও Email নিশ্চিতকরণ বার্তা পাঠানো হয়েছে।',

    // Volunteer Team
    our_people: 'আমাদের টিম',
    volunteer_team_title: 'নিবেদিত স্বেচ্ছাসেবক দল',
    volunteer_team_subtitle: 'আমাদের স্বেচ্ছাসেবক ও প্রতিনিধিগণ নিষ্ঠা, সহানুভূতি ও দায়িত্বশীলতার সাথে সমাজের সুবিধাবঞ্চিত মানুষের পাশে কাজ করে চলেছেন।',
    verified_volunteer: 'যাচাইকৃত স্বেচ্ছাসেবক',
    active_status: 'সক্রিয়',
    verify_official_id: 'আইডি যাচাই করুন',
    view_digital_id: 'ডিজিটাল আইডি দেখুন',
    search_volunteer_placeholder: 'নাম বা আইডি দিয়ে খুঁজুন...',
    all_departments: 'সকল বিভাগ',
    no_volunteers_found: 'আপনার অনুসন্ধানের সাথে কোনো স্বেচ্ছাসেবক পাওয়া যায়নি।',
    join_volunteer_callout: 'আপনিও কি সমাজকল্যাণে কাজ করতে চান?',
    join_volunteer_btn: 'স্বেচ্ছাসেবক হিসেবে যুক্ত হোন',
    official_id_badge: 'অফিসিয়াল আইডি',
    blood_group: 'রক্তের গ্রুপ',
    validity_active: 'সক্রিয় ও যাচাইকৃত',
    close: 'বন্ধ করুন',
    share_profile: 'ভেরিফিকেশন লিঙ্ক কপি করুন',
    copied_link: 'লিঙ্ক কপি হয়েছে!',
    scroll_left: 'বামে স্ক্রোল করুন',
    scroll_right: 'ডানে স্ক্রোল করুন',
    swipe_hint: 'সকল সদস্যদের দেখতে সোয়াইপ করুন বা তীর চিহ্নে ক্লিক করুন',
    all_volunteers: 'সকল স্বেচ্ছাসেবক'
  }
};

export const useLanguageStore = create<LanguageState>((set, get) => {
  const initialLang: Language = (localStorage.getItem('app_language') as Language) || 'bn';

  return {
    language: initialLang,
    setLanguage: (lang: Language) => {
      localStorage.setItem('app_language', lang);
      set({ language: lang });
    },
    toggleLanguage: () => {
      const nextLang: Language = get().language === 'bn' ? 'en' : 'bn';
      localStorage.setItem('app_language', nextLang);
      set({ language: nextLang });
    },
    t: (key: string) => {
      const lang = get().language;
      return translations[lang]?.[key] || translations['en']?.[key] || key;
    }
  };
});
