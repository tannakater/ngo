import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNgoStore } from '../../store/useNgoStore';
import { useOrgStore } from '../../store/useOrgStore';
import { Megaphone, Heart, Users, Target, CheckCircle2, ArrowRight, Flame } from 'lucide-react';
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
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Direct Emergency & Cause Appeals
          </span>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mt-4 mb-3">
            Active Humanitarian Campaigns
          </h1>
          <p className="text-base sm:text-lg text-slate-600">
            Directly fund emergency relief kits, winter warmth clothing, and community rehabilitation. 100% transparent and tracked.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex justify-center gap-2 mb-10">
          {(['All', 'Active', 'Completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                filter === tab
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab === 'All' ? 'All Campaigns' : `${tab} Appeals`}
            </button>
          ))}
        </div>

        {/* Campaigns Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((camp) => {
            const pct = Math.min(100, Math.round((camp.currentAmount / camp.goalAmount) * 100));
            const isCompleted = camp.status === 'Completed' || pct >= 100;

            return (
              <div 
                key={camp.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
              >
                <div className="relative h-56 overflow-hidden bg-slate-100">
                  <img 
                    src={camp.coverImage} 
                    alt={camp.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">
                    {camp.name}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-3 mb-6 leading-relaxed flex-1">
                    {camp.description}
                  </p>

                  {/* Fund Metrics */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6 space-y-3">
                    <div className="flex justify-between items-baseline">
                      <div>
                        <span className="text-xs text-slate-500 block">Raised so far</span>
                        <span className="text-lg font-extrabold text-emerald-600">{formatCurrency(camp.currentAmount, orgCurrency)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Goal</span>
                        <span className="text-sm font-bold text-slate-800">{formatCurrency(camp.goalAmount, orgCurrency)}</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-blue-600' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{pct}% funded</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {camp.donorsCount || 0} donors
                      </span>
                    </div>
                  </div>

                  {/* Donate Trigger */}
                  <button
                    type="button"
                    onClick={() => navigate(`/donate?campaign=${camp.id}`)}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-md shadow-emerald-600/20"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                    {isCompleted ? 'Support Further Initiatives' : 'Donate to this Campaign'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
