import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Users, Globe, Target, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useNgoStore } from '../../store/useNgoStore';
import { useOrgStore } from '../../store/useOrgStore';
import { formatCurrency } from '../../utils';
import { VolunteerTeamSection } from '../../components/public/VolunteerTeamSection';

export function Home() {
  const { stats, projects, campaigns } = useNgoStore();
  const { organization } = useOrgStore();
  const orgCurrency = organization.currency || 'USD';

  return (
    <div className="w-full overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-slate-950">
        {/* Background Image with parallax feeling & smooth gradient overlay */}
        <motion.div 
          initial={{ scale: 1.1, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop" 
            alt="Hero Humanitarian" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/75 to-slate-900/40"></div>
          <div className="absolute inset-0 bg-emerald-950/20 mix-blend-overlay"></div>
        </motion.div>
        
        {/* Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white py-20">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs sm:text-sm font-bold tracking-wider uppercase mb-6 backdrop-blur-md shadow-lg"
          >
            <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '8s' }} />
            <span>Empowering Communities Globally</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 max-w-4xl mx-auto leading-[1.15]"
          >
            Together we can create <span className="text-emerald-400 underline decoration-emerald-500/40 underline-offset-8">lasting change.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
            className="text-base sm:text-xl text-slate-200 mb-10 max-w-2xl mx-auto leading-relaxed font-normal"
          >
            Join our mission to provide sustainable solutions, emergency relief, healthcare, and education to those who need it most. Every action transforms lives.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
              <Link 
                to="/donate" 
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-full font-bold text-base sm:text-lg transition-colors shadow-lg shadow-emerald-600/40 w-full sm:w-auto"
              >
                <Heart className="w-5 h-5 fill-current" />
                <span>Donate Now</span>
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
              <Link 
                to="/volunteer" 
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/25 text-white px-8 py-4 rounded-full font-bold text-base sm:text-lg transition-colors w-full sm:w-auto shadow-md"
              >
                <Users className="w-5 h-5 text-emerald-300" />
                <span>Become a Volunteer</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Subtle Bottom Glow */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      </section>

      {/* Impact Stats Section */}
      <section className="py-16 bg-white border-b border-slate-100 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -4 }}
              className="text-center p-6 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-emerald-200 transition-colors shadow-xs"
            >
              <div className="w-12 h-12 mx-auto bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-3 shadow-2xs">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 mb-1 tracking-tight">{stats.peopleHelped}</div>
              <div className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">People Helped</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -4 }}
              className="text-center p-6 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-emerald-200 transition-colors shadow-xs"
            >
              <div className="w-12 h-12 mx-auto bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-3 shadow-2xs">
                <Heart className="w-6 h-6" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 mb-1 tracking-tight">{stats.volunteers}</div>
              <div className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wide">Volunteers</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -4 }}
              className="text-center p-6 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-emerald-200 transition-colors shadow-xs"
            >
              <div className="w-12 h-12 mx-auto bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-3 shadow-2xs">
                <Target className="w-6 h-6" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 mb-1 tracking-tight">{stats.projectsCompleted}</div>
              <div className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wide">Projects Done</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ y: -4 }}
              className="text-center p-6 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-emerald-200 transition-colors shadow-xs"
            >
              <div className="w-12 h-12 mx-auto bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-3 shadow-2xs">
                <Globe className="w-6 h-6" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 mb-1 tracking-tight">{stats.fundsRaised}</div>
              <div className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wide">Funds Raised</div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Urgent Campaigns Section */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-12 gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block mb-1">
                Active Initiatives
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Urgent Campaigns</h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl mt-1">These causes need your immediate attention and support to make a difference.</p>
            </div>
            <Link to="/campaigns" className="inline-flex items-center gap-2 text-emerald-600 font-bold hover:text-emerald-700 transition-colors">
              <span>View All Campaigns</span> <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {campaigns.slice(0, 2).map((campaign, idx) => {
              const progress = Math.min(100, Math.round((campaign.currentAmount / campaign.goalAmount) * 100));
              return (
                <motion.div 
                  key={campaign.id} 
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-200/80 group transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={campaign.coverImage} 
                      alt={campaign.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                    {campaign.status === 'Active' && (
                      <div className="absolute top-4 right-4 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                        Active
                      </div>
                    )}
                  </div>
                  
                  <div className="p-8">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors">
                      {campaign.name}
                    </h3>
                    <p className="text-slate-600 mb-6 text-sm line-clamp-2 leading-relaxed font-normal">
                      {campaign.description}
                    </p>
                    
                    <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex justify-between text-xs sm:text-sm font-bold mb-2">
                        <span className="text-emerald-600">{formatCurrency(campaign.currentAmount, orgCurrency)} raised</span>
                        <span className="text-slate-500">{formatCurrency(campaign.goalAmount, orgCurrency)} goal</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${progress}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="bg-emerald-500 h-2.5 rounded-full" 
                        />
                      </div>
                    </div>

                    <Link 
                      to={`/donate?campaign=${campaign.id}`} 
                      className="block w-full text-center bg-slate-900 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-sm transition-colors shadow-xs"
                    >
                      Donate to Campaign
                    </Link>
                  </div>
                </motion.div>
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
