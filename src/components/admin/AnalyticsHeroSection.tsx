import React, { useState, useMemo } from 'react';
import { 
  Users, HeartHandshake, MoreVertical, ArrowUp, ArrowDown, 
  Check, ExternalLink, SlidersHorizontal, TrendingUp, Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNgoStore } from '../../store/useNgoStore';
import { useOrgStore } from '../../store/useOrgStore';
import { formatCurrency } from '../../utils';

interface MonthData {
  month: string;
  monthIndex: number;
  amount: number;
  count: number;
}

export function AnalyticsHeroSection() {
  const { donations, campaigns } = useNgoStore();
  const { organization } = useOrgStore();
  const currency = organization?.currency || 'BDT';

  const [hoveredMonth, setHoveredMonth] = useState<MonthData | null>(null);
  const [salesMenuOpen, setSalesMenuOpen] = useState(false);
  const [targetMenuOpen, setTargetMenuOpen] = useState(false);
  const [isSettingTarget, setIsSettingTarget] = useState(false);
  const [customTargetInput, setCustomTargetInput] = useState<string>('');

  // 1. Calculate Real Donors count
  const donorsCount = useMemo(() => {
    const unique = new Set(
      donations
        .map(d => d.donorEmail?.trim().toLowerCase() || d.donorName?.trim().toLowerCase())
        .filter(Boolean)
    );
    return unique.size;
  }, [donations]);

  const donorsTrend = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const thisMonthDonors = new Set<string>();
    const prevMonthDonors = new Set<string>();

    donations.forEach(d => {
      if (!d.createdAt) return;
      const dt = new Date(d.createdAt);
      const key = d.donorEmail?.trim().toLowerCase() || d.donorName?.trim().toLowerCase();
      if (!key) return;

      if (dt.getMonth() === currentMonth && dt.getFullYear() === currentYear) {
        thisMonthDonors.add(key);
      } else if (dt.getMonth() === prevMonth && dt.getFullYear() === prevYear) {
        prevMonthDonors.add(key);
      }
    });

    if (prevMonthDonors.size === 0) {
      return {
        text: thisMonthDonors.size > 0 ? '+100%' : '0%',
        isPositive: true,
      };
    }
    const diff = thisMonthDonors.size - prevMonthDonors.size;
    const pct = Math.round((diff / prevMonthDonors.size) * 100);
    return {
      text: `${pct >= 0 ? '+' : ''}${pct}%`,
      isPositive: pct >= 0,
    };
  }, [donations]);

  // 2. Calculate Real Contributions count
  const contributionsCount = useMemo(() => {
    return donations.length;
  }, [donations]);

  const contributionsTrend = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let thisMonthCount = 0;
    let prevMonthCount = 0;

    donations.forEach(d => {
      if (!d.createdAt) return;
      const dt = new Date(d.createdAt);
      if (dt.getMonth() === currentMonth && dt.getFullYear() === currentYear) {
        thisMonthCount++;
      } else if (dt.getMonth() === prevMonth && dt.getFullYear() === prevYear) {
        prevMonthCount++;
      }
    });

    if (prevMonthCount === 0) {
      return {
        text: thisMonthCount > 0 ? '+100%' : '0%',
        isPositive: true,
      };
    }
    const diff = thisMonthCount - prevMonthCount;
    const pct = Math.round((diff / prevMonthCount) * 100);
    return {
      text: `${pct >= 0 ? '+' : ''}${pct}%`,
      isPositive: pct >= 0,
    };
  }, [donations]);

  // 3. User configurable or campaign-derived Monthly Target
  const defaultTarget = useMemo(() => {
    const activeCampaignsGoal = campaigns
      .filter(c => c.status === 'Active')
      .reduce((sum, c) => sum + (c.goalAmount || 0), 0);
    return activeCampaignsGoal > 0 ? activeCampaignsGoal : 50000;
  }, [campaigns]);

  const [monthlyTarget, setMonthlyTarget] = useState<number>(() => {
    const saved = localStorage.getItem('daksheba_monthly_target');
    return saved ? Number(saved) : 50000;
  });

  const handleSaveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customTargetInput);
    if (!isNaN(val) && val > 0) {
      setMonthlyTarget(val);
      localStorage.setItem('daksheba_monthly_target', val.toString());
      setIsSettingTarget(false);
      setCustomTargetInput('');
    }
  };

  const handleResetTargetToCampaigns = () => {
    setMonthlyTarget(defaultTarget);
    localStorage.setItem('daksheba_monthly_target', defaultTarget.toString());
    setTargetMenuOpen(false);
  };

  // 4. Calculate Real Today & Month's Cleared Funds
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const { todayRaised, currentMonthRaised, allClearedRaised, prevMonthRaised } = useMemo(() => {
    let today = 0;
    let thisMonth = 0;
    let prevMonth = 0;
    let allCleared = 0;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    donations.forEach(d => {
      if (d.status !== 'Completed') return;
      const amount = Number(d.amount) || 0;
      if (isNaN(amount) || amount <= 0) return;

      allCleared += amount;

      const createdTime = d.createdAt ? new Date(d.createdAt).getTime() : 0;
      const createdDate = d.createdAt ? new Date(d.createdAt) : new Date();

      if (createdTime >= todayStart) {
        today += amount;
      }

      if (createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear) {
        thisMonth += amount;
      } else if (createdDate.getMonth() === lastMonth && createdDate.getFullYear() === lastYear) {
        prevMonth += amount;
      }
    });

    return {
      todayRaised: today,
      currentMonthRaised: thisMonth,
      allClearedRaised: allCleared,
      prevMonthRaised: prevMonth
    };
  }, [donations, todayStart]);

  // 5. Target Percentage calculation for Semicircle Gauge
  const targetPercentage = useMemo(() => {
    if (monthlyTarget <= 0) return 0;
    return Math.round((currentMonthRaised / monthlyTarget) * 100);
  }, [currentMonthRaised, monthlyTarget]);

  // Dynamic status badge under the gauge percentage
  const targetPill = useMemo(() => {
    if (monthlyTarget <= 0) return { label: 'No Goal Set', isPositive: true };
    if (targetPercentage >= 100) {
      return { label: `Goal Met (+${targetPercentage - 100}%)`, isPositive: true };
    }
    if (prevMonthRaised > 0) {
      const diff = currentMonthRaised - prevMonthRaised;
      const pct = Math.round((diff / prevMonthRaised) * 100);
      return {
        label: `${pct >= 0 ? '+' : ''}${pct}% vs last mo`,
        isPositive: pct >= 0
      };
    }
    return {
      label: `${targetPercentage}% of Target`,
      isPositive: true
    };
  }, [targetPercentage, currentMonthRaised, prevMonthRaised, monthlyTarget]);

  // Semicircular Gauge calculations (arc fill clamped to 100% max visually)
  const radius = 100;
  const arcLength = Math.PI * radius; // ~314.16
  const visualGaugePct = Math.min(100, Math.max(0, targetPercentage));
  const strokeDashoffset = arcLength * (1 - visualGaugePct / 100);

  // 6. Aggregate Real Monthly Data across Jan - Dec for the active year
  const monthlyData: MonthData[] = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const realByMonth: { amount: number; count: number }[] = Array.from({ length: 12 }, () => ({ amount: 0, count: 0 }));
    
    const currentYear = new Date().getFullYear();

    donations.forEach(d => {
      if (d.createdAt && d.status === 'Completed') {
        const date = new Date(d.createdAt);
        if (date.getFullYear() === currentYear) {
          const m = date.getMonth();
          if (m >= 0 && m < 12) {
            realByMonth[m].amount += Number(d.amount) || 0;
            realByMonth[m].count += 1;
          }
        }
      }
    });

    return months.map((month, idx) => ({
      month,
      monthIndex: idx,
      amount: realByMonth[idx].amount,
      count: realByMonth[idx].count
    }));
  }, [donations]);

  // Max value for Chart scaling (rounded to clean step)
  const maxChartValue = useMemo(() => {
    const maxVal = Math.max(...monthlyData.map(d => d.amount), 0);
    if (maxVal <= 0) return 10000;
    const step = maxVal > 50000 ? 20000 : maxVal > 10000 ? 10000 : maxVal > 5000 ? 2000 : 1000;
    return Math.max(step * 4, Math.ceil(maxVal / step) * step);
  }, [monthlyData]);

  // Y-axis grid increments (5 lines)
  const gridSteps = useMemo(() => {
    const step = maxChartValue / 4;
    return [
      { val: maxChartValue, y: 20 },
      { val: Math.round(step * 3), y: 60 },
      { val: Math.round(step * 2), y: 100 },
      { val: Math.round(step * 1), y: 140 },
      { val: 0, y: 180 },
    ];
  }, [maxChartValue]);

  return (
    <div className="space-y-4">
      {/* Target Setting Modal / Quick Popover */}
      {isSettingTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h4 className="text-base font-bold text-slate-900">Set Monthly Fundraising Goal</h4>
            <p className="text-xs text-slate-500 mt-1">
              Configure your organization's humanitarian monthly target.
            </p>

            <form onSubmit={handleSaveTarget} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Monthly Target ({currency})
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  step="100"
                  placeholder={monthlyTarget.toString()}
                  value={customTargetInput}
                  onChange={(e) => setCustomTargetInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSettingTarget(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer shadow-xs"
                >
                  Save Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Grid: Modern 2-Column Dashboard Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Side: 2 Metric Cards + 1 Wide Monthly Contributions Bar Chart */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-5">
          
          {/* Top Row: 2 Workable NGO Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            
            {/* Card 1: Total Donors */}
            <Link 
              to="/admin/donations"
              className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-xs hover:border-indigo-200 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Squircle Icon */}
                <div className="w-13 h-13 rounded-2xl bg-slate-100 group-hover:bg-indigo-50 flex items-center justify-center text-slate-700 group-hover:text-indigo-600 transition-colors mb-5">
                  <Users className="w-6 h-6 stroke-[1.8]" />
                </div>
                {/* Label */}
                <span className="text-sm font-medium text-slate-500 block mb-1">
                  Total Donors
                </span>
                {/* Value & Trend Badge */}
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-sans">
                    {donorsCount.toLocaleString()}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide shrink-0 ${
                    donorsTrend.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {donorsTrend.isPositive ? (
                      <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
                    )}
                    <span>{donorsTrend.text}</span>
                  </span>
                </div>
              </div>
            </Link>

            {/* Card 2: Total Contributions */}
            <Link 
              to="/admin/donations"
              className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-xs hover:border-emerald-200 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Squircle Icon */}
                <div className="w-13 h-13 rounded-2xl bg-slate-100 group-hover:bg-emerald-50 flex items-center justify-center text-slate-700 group-hover:text-emerald-600 transition-colors mb-5">
                  <HeartHandshake className="w-6 h-6 stroke-[1.8]" />
                </div>
                {/* Label */}
                <span className="text-sm font-medium text-slate-500 block mb-1">
                  Total Contributions
                </span>
                {/* Value & Trend Badge */}
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-sans">
                    {contributionsCount.toLocaleString()}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide shrink-0 ${
                    contributionsTrend.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {contributionsTrend.isPositive ? (
                      <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
                    )}
                    <span>{contributionsTrend.text}</span>
                  </span>
                </div>
              </div>
            </Link>

          </div>

          {/* Bottom Row: Monthly Contributions Bar Chart Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/70 shadow-xs flex-1 flex flex-col justify-between relative">
            {/* Header with Title & Three-dots Menu */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Monthly Contributions
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Yearly donation flow across community relief campaigns ({new Date().getFullYear()})
                </p>
              </div>
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSalesMenuOpen(!salesMenuOpen)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Chart options"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {salesMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-20 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-150">
                    <Link
                      to="/admin/donations"
                      onClick={() => setSalesMenuOpen(false)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700"
                    >
                      <span>Open Full Ledger</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setSalesMenuOpen(false);
                        window.print();
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-600"
                    >
                      <span>Print Analytics View</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Custom SVG Bar Chart matching the exact visual styling */}
            <div className="w-full relative select-none pt-2">
              {/* Tooltip Overlay */}
              {hoveredMonth && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-md pointer-events-none z-10 flex items-center gap-2 animate-in fade-in duration-150">
                  <span>{hoveredMonth.month}:</span>
                  <span className="text-indigo-300 font-extrabold">{formatCurrency(hoveredMonth.amount, currency)}</span>
                  <span className="text-slate-400 font-normal">({hoveredMonth.count} {hoveredMonth.count === 1 ? 'gift' : 'gifts'})</span>
                </div>
              )}

              <svg 
                viewBox="0 0 540 210" 
                className="w-full h-auto overflow-visible"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Horizontal Grid lines with dynamic Y-Axis values */}
                {gridSteps.map((grid) => (
                  <g key={grid.y}>
                    <text 
                      x="25" 
                      y={grid.y + 4} 
                      textAnchor="end" 
                      className="text-[11px] fill-slate-400 font-sans font-medium"
                    >
                      {grid.val >= 1000 ? `${Math.round(grid.val / 1000)}k` : grid.val}
                    </text>
                    <line 
                      x1="35" 
                      y1={grid.y} 
                      x2="530" 
                      y2={grid.y} 
                      stroke="#f1f5f9" 
                      strokeWidth="1.5" 
                    />
                  </g>
                ))}

                {/* 12 Vertical Bars */}
                {monthlyData.map((item, idx) => {
                  // Total chart area is y=20 to y=180. Height = 160px.
                  const hasAmount = item.amount > 0;
                  const barHeight = hasAmount ? Math.max(10, (item.amount / maxChartValue) * 160) : 4;
                  const barY = 180 - barHeight;
                  const barX = 52 + idx * 39.8;
                  const isHovered = hoveredMonth?.month === item.month;

                  return (
                    <g 
                      key={item.month}
                      className="cursor-pointer transition-transform duration-200"
                      onMouseEnter={() => setHoveredMonth(item)}
                      onMouseLeave={() => setHoveredMonth(null)}
                    >
                      {/* Invisible wider hit area for easy hover */}
                      <rect 
                        x={barX - 8} 
                        y="10" 
                        width="28" 
                        height="190" 
                        fill="transparent" 
                      />

                      {/* The Bar: Vibrant Blue #4062f6 or subtle gray when 0 */}
                      <rect 
                        x={barX} 
                        y={barY} 
                        width="12" 
                        height={barHeight} 
                        rx={hasAmount ? 6 : 2} 
                        fill={isHovered ? '#2547e0' : hasAmount ? '#4062f6' : '#e2e8f0'}
                        className="transition-all duration-300"
                        style={{
                          transformOrigin: `${barX + 6}px 180px`,
                          transform: isHovered && hasAmount ? 'scaleY(1.04)' : 'scaleY(1)',
                        }}
                      />

                      {/* Month Label */}
                      <text 
                        x={barX + 6} 
                        y="200" 
                        textAnchor="middle" 
                        className={`text-[12px] font-medium font-sans transition-colors ${
                          isHovered ? 'fill-slate-900 font-bold' : hasAmount ? 'fill-slate-700 font-semibold' : 'fill-slate-400'
                        }`}
                      >
                        {item.month}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

        </div>

        {/* Right Side: Tall Monthly Target Card */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/70 shadow-xs flex flex-col justify-between relative">
          
          <div>
            {/* Header with Title, Subtitle, and 3-dots Menu */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Monthly Target
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Target set for humanitarian relief this month
                </p>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setTargetMenuOpen(!targetMenuOpen)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Target settings"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {targetMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-20 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSettingTarget(true);
                        setTargetMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-indigo-600 font-semibold cursor-pointer"
                    >
                      <span>Adjust Monthly Goal</span>
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                    </button>
                    {defaultTarget > 0 && defaultTarget !== monthlyTarget && (
                      <button
                        type="button"
                        onClick={handleResetTargetToCampaigns}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700 cursor-pointer"
                      >
                        <span>Sync with Active Campaigns</span>
                        <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    )}
                    <Link
                      to="/admin/campaigns"
                      onClick={() => setTargetMenuOpen(false)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-600"
                    >
                      <span>View Active Campaigns</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Semicircular Progress Gauge Component */}
            <div className="mt-8 flex flex-col items-center justify-center relative">
              <div className="w-full max-w-[280px] sm:max-w-[320px] aspect-[260/150] relative flex items-center justify-center">
                <svg 
                  viewBox="0 0 260 145" 
                  className="w-full h-full overflow-visible"
                >
                  {/* Semicircle Track */}
                  <path
                    d="M 30 130 A 100 100 0 0 1 230 130"
                    fill="none"
                    stroke="#eef2f6"
                    strokeWidth="15"
                    strokeLinecap="round"
                  />

                  {/* Semicircle Progress Arc */}
                  <path
                    d="M 30 130 A 100 100 0 0 1 230 130"
                    fill="none"
                    stroke="#4062f6"
                    strokeWidth="15"
                    strokeLinecap="round"
                    strokeDasharray={arcLength}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>

                {/* Content inside the Semicircle Arc */}
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-1 text-center pointer-events-none">
                  {/* Big Percentage Number */}
                  <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-sans">
                    {targetPercentage}%
                  </div>
                  {/* Dynamic Pill underneath */}
                  <div className="mt-1.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs tracking-wider ${
                      targetPill.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {targetPill.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Workable Motivational Insight Note */}
              <p className="text-center text-xs sm:text-sm text-slate-600 mt-6 max-w-xs leading-relaxed font-normal">
                {todayRaised > 0 ? (
                  <>
                    Raised <strong>{formatCurrency(todayRaised, currency)}</strong> today across active causes. Your relief programs are delivering real community impact!
                  </>
                ) : currentMonthRaised > 0 ? (
                  <>
                    Raised <strong>{formatCurrency(currentMonthRaised, currency)}</strong> this month ({targetPercentage}% of goal). Ready for today's community outreach!
                  </>
                ) : (
                  <>
                    Target set at <strong>{formatCurrency(monthlyTarget, currency)}</strong>. Ready to record today's community contributions.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Bottom Divider & 3 Columns Stats Row */}
          <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            
            {/* Column 1: Target */}
            <div>
              <span className="text-xs text-slate-400 font-medium block mb-1">Target</span>
              <div className="text-base sm:text-lg font-black text-slate-900 flex items-center justify-center gap-0.5">
                <span>{formatCurrency(monthlyTarget, currency)}</span>
              </div>
            </div>

            {/* Column 2: Cleared / Raised */}
            <div>
              <span className="text-xs text-slate-400 font-medium block mb-1">Raised</span>
              <div className="text-base sm:text-lg font-black text-slate-900 flex items-center justify-center gap-0.5">
                <span>{formatCurrency(currentMonthRaised, currency)}</span>
                {currentMonthRaised > 0 && <ArrowUp className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />}
              </div>
            </div>

            {/* Column 3: Today */}
            <div>
              <span className="text-xs text-slate-400 font-medium block mb-1">Today</span>
              <div className="text-base sm:text-lg font-black text-slate-900 flex items-center justify-center gap-0.5">
                <span>{formatCurrency(todayRaised, currency)}</span>
                {todayRaised > 0 && <ArrowUp className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
