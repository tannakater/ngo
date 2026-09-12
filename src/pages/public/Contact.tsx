import React, { useState } from 'react';
import { useOrgStore } from '../../store/useOrgStore';
import { useNgoStore } from '../../store/useNgoStore';
import { 
  Mail, Phone, MapPin, Send, CheckCircle2, 
  HelpCircle, ChevronDown, ChevronUp, Clock, AlertCircle
} from 'lucide-react';

export function Contact() {
  const { organization } = useOrgStore();
  const { addMessage } = useNgoStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    addMessage({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      subject: formData.subject || 'General Inquiry',
      message: formData.message
    });

    setIsSubmitted(true);
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
  };

  const faqs = [
    {
      q: 'How do I know my donation is secure and reaching recipients?',
      a: 'We operate on a 100% auditable digital ledger. Over 92% of all received funds directly finance frontline relief and infrastructure materials, independently verified by certified public accounting auditors.'
    },
    {
      q: 'Are all field volunteers and staff registered with official IDs?',
      a: 'Yes. Every single representative carries an authorized ID card with a QR verification code. You can verify any ID in seconds via our online Verify ID portal.'
    },
    {
      q: 'Can our company or foundation partner with you for CSR initiatives?',
      a: 'Absolutely. We regularly collaborate with corporate donors on institutional projects such as school construction, solar water plants, and emergency supply kits. Contact our partnership desk using the form here.'
    },
    {
      q: 'How can I join as an active volunteer?',
      a: 'You can submit an application via our "Become a Volunteer" page. Our volunteer coordination team will review your profile, conduct a brief orientation, and issue your official ID card.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Reach Out to Our Team
          </span>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mt-3 mb-2">
            Contact & Community Support
          </h1>
          <p className="text-base sm:text-lg text-slate-600">
            Have a question, feedback, or a partnership inquiry? We are here to listen and assist 24/7.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 mb-20">
          
          {/* Contact Details Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
              
              <h2 className="text-2xl font-bold mb-6">Headquarters</h2>
              
              <div className="space-y-6 text-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase block mb-0.5">Physical Address</span>
                    <p className="text-slate-200 leading-relaxed font-medium">
                      {organization.address || 'House 42, Road 11, Block D, Banani, Dhaka'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase block mb-0.5">Direct Hotline</span>
                    <p className="text-slate-200 font-medium">{organization.phone || '+880 1711-002233'}</p>
                    <p className="text-emerald-400 text-xs mt-0.5">Emergency Toll-Free Available</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase block mb-0.5">Official Email</span>
                    <p className="text-slate-200 font-medium">{organization.email || 'contact@globalhope.org'}</p>
                    <p className="text-slate-400 text-xs mt-0.5">Response within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase block mb-0.5">Office Hours</span>
                    <p className="text-slate-200 font-medium">Sunday &ndash; Thursday: 9:00 AM &ndash; 6:00 PM</p>
                    <p className="text-slate-400 text-xs mt-0.5">Disaster Dispatch: 24/7 Active</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Verification Box */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-xs text-emerald-900">
              <span className="font-bold block text-sm text-emerald-950 mb-1">Accredited NGO Entity</span>
              <p className="text-emerald-800 mb-2">Registration No: <span className="font-mono font-bold">{organization.registrationNumber || 'NGO-AB-2023-09412'}</span></p>
              <p className="text-emerald-700 leading-relaxed">Authorized to mobilize humanitarian aid, conduct rural development programs, and accept public philanthropic contributions.</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm">
            {isSubmitted ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Message Dispatched Successfully</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
                  Thank you for reaching out. Your inquiry has been routed directly to our administration desk. We will respond promptly.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">Send an Inquiry</h2>
                <p className="text-xs text-slate-500">Fill in the details below and our team will get in touch.</p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Jenkins"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. sarah@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Subject / Topic
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Partnership / Donation Inquiry"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Your Message *
                  </label>
                  <textarea
                    rows={5}
                    required
                    placeholder="Write your message here..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Send Message
                </button>
              </form>
            )}
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div className="max-w-4xl mx-auto pt-8 border-t border-slate-200">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1 block">Help & Clarity</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-4 text-left font-bold text-sm text-slate-900 flex justify-between items-center hover:bg-slate-50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
