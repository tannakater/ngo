import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Users, Globe, Target } from 'lucide-react';
import { useNgoStore } from '../../store/useNgoStore';
import { useOrgStore } from '../../store/useOrgStore';
import { formatCurrency } from '../../utils';
import { VolunteerTeamSection } from '../../components/public/VolunteerTeamSection';

export function Home() {
  const { stats, projects, campaigns } = useNgoStore();
  const { organization } = useOrgStore();
  const orgCurrency = organization.currency || 'USD';

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop" 
            alt="Hero Humanitarian" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/60 mix-blend-multiply"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <span className="inline-block py-1 px-3 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-semibold tracking-wider uppercase mb-6 backdrop-blur-sm">
            Empowering Communities Globally
          </span>
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
            Together we can create <span className="text-emerald-400">lasting change.</span>
          </h1>
          <p className="text-xl text-slate-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join our mission to provide sustainable solutions, emergency relief, and education to those who need it most. Every action counts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/donate" className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg shadow-emerald-600/30 w-full sm:w-auto">
              Donate Now
            </Link>
            <Link to="/volunteer" className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-full font-bold text-lg transition-all w-full sm:w-auto">
              Become a Volunteer
            </Link>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-4xl font-extrabold text-slate-900 mb-2">{stats.peopleHelped}</div>
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">People Helped</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                <Heart className="w-6 h-6" />
              </div>
              <div className="text-4xl font-extrabold text-slate-900 mb-2">{stats.volunteers}</div>
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Volunteers</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                <Target className="w-6 h-6" />
              </div>
              <div className="text-4xl font-extrabold text-slate-900 mb-2">{stats.projectsCompleted}</div>
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Projects Done</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                <Globe className="w-6 h-6" />
              </div>
              <div className="text-4xl font-extrabold text-slate-900 mb-2">{stats.fundsRaised}</div>
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Funds Raised</div>
            </div>
          </div>
        </div>
      </section>

      {/* Current Campaigns */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Urgent Campaigns</h2>
              <p className="text-lg text-slate-600 max-w-2xl">These causes need your immediate attention and support to make a difference.</p>
            </div>
            <Link to="/campaigns" className="hidden md:flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {campaigns.slice(0, 2).map(campaign => {
              const progress = Math.min(100, Math.round((campaign.currentAmount / campaign.goalAmount) * 100));
              return (
                <div key={campaign.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 group">
                  <div className="relative h-64 overflow-hidden">
                    <img src={campaign.coverImage} alt={campaign.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    {campaign.status === 'Active' && (
                      <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        Active
                      </div>
                    )}
                  </div>
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">{campaign.name}</h3>
                    <p className="text-slate-600 mb-6 line-clamp-2">{campaign.description}</p>
                    
                    <div className="mb-6">
                      <div className="flex justify-between text-sm font-semibold mb-2">
                        <span className="text-emerald-600">{formatCurrency(campaign.currentAmount, orgCurrency)} raised</span>
                        <span className="text-slate-500">{formatCurrency(campaign.goalAmount, orgCurrency)} goal</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>

                    <Link to={`/donate?campaign=${campaign.id}`} className="block w-full text-center bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-semibold transition-colors">
                      Donate to Campaign
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Verified Volunteer Team Spotlight Side-Scrolling Showcase */}
      <VolunteerTeamSection />
    </div>
  );
}
