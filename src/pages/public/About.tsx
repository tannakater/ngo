import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, Shield, Award, Users, Target, CheckCircle2, 
  ArrowRight, Globe2, Compass, Sparkles, Building2, FileCheck2
} from 'lucide-react';
import { useOrgStore } from '../../store/useOrgStore';
import { useNgoStore } from '../../store/useNgoStore';

export function About() {
  const { organization, members } = useOrgStore();
  const { stats } = useNgoStore();

  const leadershipTeam = members.slice(0, 4);

  const coreValues = [
    {
      title: 'Humanity & Compassion',
      desc: 'We put people, dignity, and compassion at the heart of everything we do.',
      icon: Shield
    },
    {
      title: 'Integrity & Transparency',
      desc: 'We strive to work honestly, responsibly, and transparently in every initiative.',
      icon: Users
    },
    {
      title: 'Equality & Responsibility',
      desc: 'We believe everyone deserves dignity, equal opportunity, and responsible support.',
      icon: Award
    },
    {
      title: 'Unity & Community',
      desc: 'We bring volunteers and communities together to create meaningful and sustainable social impact.',
      icon: Compass
    }
  ];

  const milestones = [
    { year: '2026', title: 'Education & Volunteerism', desc: 'Supporting education and encouraging people to contribute their time, skills, and effort through volunteering.' },
    { year: '2026', title: 'Food & Humanitarian Support', desc: 'Providing essential assistance and standing beside people during difficult circumstances.' },
    { year: '2026', title: 'Healthcare & Awareness', desc: 'Promoting health awareness and supporting community healthcare initiatives.' },
    { year: '2026', title: 'Community Development', desc: 'Working with communities to encourage positive, inclusive, and sustainable development.' }
  ];

  return (
    <div className="w-full bg-white">
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-b from-slate-900 to-slate-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Our Purpose
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
            Serving People. Supporting Communities. Creating Change.
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-10">
            {organization.name} is a volunteer-driven social and humanitarian organization dedicated to supporting underprivileged and vulnerable communities through meaningful social and humanitarian initiatives.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              to="/programs" 
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-7 py-3 rounded-full font-bold text-sm sm:text-base transition-all shadow-lg shadow-emerald-600/30 inline-flex items-center gap-2"
            >
              Explore Programs <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/transparency" 
              className="bg-white/10 hover:bg-white/20 text-white px-7 py-3 rounded-full font-bold text-sm sm:text-base transition-all border border-white/20 inline-flex items-center gap-2"
            >
              <FileCheck2 className="w-4 h-4 text-emerald-400" /> Transparency & Audits
            </Link>
          </div>
        </div>
      </section>

      {/* Mission & Vision Bento */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6">
                <Target className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Mission</h2>
              <p className="text-slate-600 leading-relaxed text-base">
                {organization.mission || 'To identify genuine community needs and create meaningful impact through volunteering, education, food support, healthcare initiatives, humanitarian assistance, and community development.'}
              </p>
              <ul className="mt-6 space-y-3">
                <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Support underprivileged and vulnerable communities
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Promote education and learning opportunities
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Provide food and essential humanitarian support
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-6">
                <Globe2 className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Vision</h2>
              <p className="text-slate-600 leading-relaxed text-base">
                {organization.vision || 'To build an inclusive society where every individual can live with dignity, equal opportunity, and hope.'}
              </p>
              <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-2xl font-extrabold text-slate-900">{stats.projectsCompleted}+</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">Community Initiatives</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-2xl font-extrabold text-emerald-600">{stats.peopleHelped}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">People Supported</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2 block">Our Values</span>
            <h2 className="text-3xl font-extrabold text-slate-900">What Guides Our Work</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {coreValues.map((val, idx) => {
              const Icon = val.icon;
              return (
                <div key={idx} className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-emerald-600 flex items-center justify-center mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{val.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{val.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Journey & Milestones */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 block">Our Work</span>
            <h2 className="text-3xl font-extrabold">Areas of Service</h2>
          </div>

          <div className="space-y-8 relative before:absolute before:inset-0 before:left-8 before:w-0.5 before:bg-slate-800 md:before:left-1/2 md:before:-ml-px">
            {milestones.map((item, idx) => (
              <div key={idx} className={`relative flex items-center md:justify-between ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                <div className="hidden md:block w-5/12"></div>
                <div className="absolute left-8 -translate-x-1/2 md:left-1/2 w-8 h-8 rounded-full bg-emerald-500 border-4 border-slate-900 flex items-center justify-center text-slate-950 font-bold text-xs z-10">
                  {idx + 1}
                </div>
                <div className="ml-16 md:ml-0 w-full md:w-5/12 bg-slate-800 p-6 rounded-2xl border border-slate-700">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{item.year}</span>
                  <h3 className="text-lg font-bold text-white mt-1 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2 block">Our People</span>
            <h2 className="text-3xl font-extrabold text-slate-900">Dedicated Volunteer Team</h2>
            <p className="text-slate-600 text-sm mt-3">Our volunteers work together with compassion, responsibility, and dedication to serve people and strengthen communities.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {leadershipTeam.map((mem) => (
              <div key={mem.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow text-center p-6">
                <img 
                  src={mem.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&q=80'} 
                  alt={`${mem.firstName} ${mem.lastName}`} 
                  className="w-28 h-28 rounded-full object-cover mx-auto mb-4 ring-4 ring-slate-100"
                />
                <h3 className="text-base font-bold text-slate-900">{mem.firstName} {mem.lastName}</h3>
                <p className="text-xs font-medium text-emerald-700 mt-1">{mem.designation}</p>
                <p className="text-xs text-slate-500 mt-0.5">{mem.department}</p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" /> ID: {mem.memberId}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-emerald-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold mb-4">Together, We Can.</h2>
          <p className="text-emerald-100 text-base max-w-2xl mx-auto mb-8">
            Join us in supporting people, strengthening communities, and creating meaningful positive change.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/donate" className="bg-white text-emerald-800 hover:bg-emerald-50 px-8 py-3.5 rounded-full font-bold text-base transition-colors shadow-md">
              Support Our Work
            </Link>
            <Link to="/volunteer" className="bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-500 px-8 py-3.5 rounded-full font-bold text-base transition-colors">
              Join as a Volunteer
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
