import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNgoStore } from '../../store/useNgoStore';
import { useOrgStore } from '../../store/useOrgStore';
import { Megaphone, Heart, Users, Target, CheckCircle2, ArrowRight, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency } from '../../utils';

export function Campaigns() {
  const { campaigns } = useNgoStore();
  const { organization } = useOrgStore();
  const [filter, setFilter] = useState<'All' | 'Active' | 'Completed'>('All');
  const navigate = useNavigate();

  const orgCurrency = organization.currency || 'USD';

  const filtered = campaigns.filter(c => {
    if (filter === 'All') return true;
    return c.status === filter;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
            Direct Emergency & Cause Appeals
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-4 mb-3">
            Active Humanitarian Campaigns
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Directly fund emergency relief kits, winter warmth clothing, and community rehabilitation. 100% transparent and tracked.
          </p>
        </motion.div>

        {/* Filter Bar */}
        <div className="flex justify-center gap-2 mb-10">
          {(['All', 'Active', 'Completed'] as const).map((tab) => (
            <button
              key={`campaign-tab-${tab}`}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer relative ${
                filter === tab
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab === 'All' ? 'All Campaigns' : `${tab} Appeals`}
            </button>
          ))}
        </div>

        {/* Campaigns Grid */}
        <motion.div 
          layout
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence>
            {filtered.map((camp, idx) => {
              const pct = Math.min(100, Math.round((camp.currentAmount / camp.goalAmount) * 100));
              const isCompleted = camp.status === 'Completed' || pct >= 100;

              return (
                <motion.div 
                  key={camp.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  <div className="relative h-56 overflow-hidden bg-slate-100">
                    <img 
                      src={camp.coverImage} 
                      alt={camp.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-slate-900/80 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full">
                        {camp.category || 'Humanitarian'}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      {camp.status === 'Active' ? (
                        <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                          <Flame className="w-3.5 h-3.5 fill-current" /> Active
                        </span>
                      ) : (
                        <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                          Completed
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors">
                        {camp.name}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-3 mb-6 leading-relaxed">
                        {camp.description}
                      </p>
                    </div>

                    <div>
                      {/* Fund Metrics */}
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6 space-y-3">
                        <div className="flex justify-between items-baseline">
                          <div>
                            <span className="text-[11px] text-slate-500 font-semibold block">Raised so far</span>
                            <span className="text-lg font-black text-emerald-600 tracking-tight">{formatCurrency(camp.currentAmount, orgCurrency)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] text-slate-500 font-semibold block">Goal</span>
                            <span className="text-sm font-bold text-slate-800">{formatCurrency(camp.goalAmount, orgCurrency)}</span>
                          </div>
                        </div>

                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: `${pct}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full rounded-full ${
                              isCompleted ? 'bg-blue-600' : 'bg-emerald-600'
                            }`}
                          />
                        </div>

                        <div className="flex justify-between items-center text-xs text-slate-500">
                          <span className="font-bold text-slate-700">{pct}% funded</span>
                          <span className="flex items-center gap-1 font-medium">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            {camp.donorsCount || 0} donors
                          </span>
                        </div>
                      </div>

                      {/* Donate Trigger */}
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(`/donate?campaign=${camp.id}`)}
                        className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                      >
                        <Heart className="w-4 h-4 fill-current text-rose-400" />
                        <span>{isCompleted ? 'Support Further Initiatives' : 'Donate to this Campaign'}</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
