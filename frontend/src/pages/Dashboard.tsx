import React from 'react';
import {
  Users,
  CreditCard,
  TrendingUp,
  DollarSign,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  Receipt,
  Sparkles,
  Plus,
  BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion, Variants } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { NavTab } from '../components/Sidebar';
import { Customer } from '../types';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { useTheme } from '../context/ThemeContext';

interface DashboardProps {
  onNavigate: (tab: NavTab, targetId?: string) => void;
  onOpenRecordPayment: () => void;
  onOpenAddCustomer: () => void;
  onSelectCustomer: (cust: Customer) => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onOpenRecordPayment,
  onOpenAddCustomer
}) => {
  const { theme } = useTheme();

  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];
  const loans = useLiveQuery(() => db.loans.toArray(), []) || [];
  const payments = useLiveQuery(() => db.payments.toArray(), []) || [];

  // Core Calculations
  const totalCustomers = customers.length;
  const activeLoans = loans.filter((l) => l.status === 'Active' || l.status === 'Overdue');
  const totalAmountGiven = loans.reduce((acc, l) => acc + l.principalAmount, 0);
  const totalAmountCollected = loans.reduce((acc, l) => acc + l.paidAmount, 0);
  const pendingAmount = loans.reduce((acc, l) => acc + l.remainingAmount, 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysCollections = payments
    .filter((p) => p.date === todayStr && p.status === 'Paid')
    .reduce((acc, p) => acc + p.amount, 0);

  const currentMonth = new Date().getMonth();
  const thisMonthsCollection = payments
    .filter((p) => {
      const d = new Date(p.date);
      return d.getMonth() === currentMonth && p.status === 'Paid';
    })
    .reduce((acc, p) => acc + p.amount, 0);

  const upcomingPayments = loans.filter((l) => l.status === 'Active' || l.status === 'Overdue');

  // 7-Day Collection Performance Calculations
  const todayDate = new Date();
  const sevenDaysAgo = new Date(todayDate);
  sevenDaysAgo.setDate(todayDate.getDate() - 6);

  const fourteenDaysAgo = new Date(todayDate);
  fourteenDaysAgo.setDate(todayDate.getDate() - 13);

  // Payments in last 7 days
  const thisWeekPayments = payments.filter((p) => {
    const pDate = new Date(p.date);
    return pDate >= sevenDaysAgo && p.status === 'Paid';
  });
  const thisWeekCollection = thisWeekPayments.reduce((acc, p) => acc + p.amount, 0);

  // Payments in previous 7 days (days 8-14 ago)
  const lastWeekPayments = payments.filter((p) => {
    const pDate = new Date(p.date);
    return pDate >= fourteenDaysAgo && pDate < sevenDaysAgo && p.status === 'Paid';
  });
  const lastWeekCollection = lastWeekPayments.reduce((acc, p) => acc + p.amount, 0);

  // Percentage change vs Last Week
  let pctChange = 0;
  if (lastWeekCollection > 0) {
    pctChange = Math.round(((thisWeekCollection - lastWeekCollection) / lastWeekCollection) * 100);
  } else if (thisWeekCollection > 0) {
    pctChange = 100;
  }

  // 7-Day Sparkline Trend Chart Data
  const sparklineData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayDate);
    d.setDate(todayDate.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const daySum = payments
      .filter((p) => p.date === dateStr && p.status === 'Paid')
      .reduce((acc, p) => acc + p.amount, 0);

    sparklineData.push({ day: d.getDate(), val: daySum });
  }

  // Dynamic monthly data calculation
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const dynamicMonthlyData = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mIdx = d.getMonth();
    const yr = d.getFullYear();
    const monthLabel = `${monthNames[mIdx]}`;

    const monthSum = payments
      .filter((p) => {
        const pDate = new Date(p.date);
        return pDate.getMonth() === mIdx && pDate.getFullYear() === yr && p.status === 'Paid';
      })
      .reduce((acc, p) => acc + p.amount, 0);

    dynamicMonthlyData.push({ month: monthLabel, collection: monthSum });
  }

  // Chart Data: Loan Distribution
  const loanStatusCounts = {
    Active: loans.filter((l) => l.status === 'Active').length,
    Completed: loans.filter((l) => l.status === 'Completed').length,
    Overdue: loans.filter((l) => l.status === 'Overdue').length,
    Pending: loans.filter((l) => l.status === 'Pending').length
  };

  const loanDistributionData = [
    { name: 'Active', value: loanStatusCounts.Active, color: '#4F46E5' },
    { name: 'Completed', value: loanStatusCounts.Completed, color: '#10B981' },
    { name: 'Overdue', value: loanStatusCounts.Overdue, color: '#EF4444' },
    { name: 'Pending', value: loanStatusCounts.Pending, color: '#F59E0B' }
  ].filter((d) => d.value > 0);

  // Stats Card Config
  const statCards = [
    {
      title: 'Total Customers',
      rawNum: totalCustomers,
      isCurrency: false,
      subtext: 'Registered Borrowers',
      icon: Users,
      color: 'from-blue-600 to-indigo-600'
    },
    {
      title: 'Active Loans',
      rawNum: activeLoans.length,
      isCurrency: false,
      subtext: `${loanStatusCounts.Overdue} Overdue Accounts`,
      icon: CreditCard,
      color: 'from-indigo-600 to-purple-600'
    },
    {
      title: 'Total Amount Given',
      rawNum: totalAmountGiven,
      isCurrency: true,
      subtext: 'Total Principal Issued',
      icon: DollarSign,
      color: 'from-sky-600 to-blue-600'
    },
    {
      title: 'Total Collected',
      rawNum: totalAmountCollected,
      isCurrency: true,
      subtext: `${Math.round((totalAmountCollected / (totalAmountGiven || 1)) * 100)}% Portfolio Repaid`,
      icon: TrendingUp,
      color: 'from-emerald-600 to-teal-600'
    },
    {
      title: 'Pending Amount',
      rawNum: pendingAmount,
      isCurrency: true,
      subtext: 'Receivable Balance',
      icon: Clock,
      color: 'from-amber-600 to-orange-600'
    },
    {
      title: "Today's Collections",
      rawNum: todaysCollections,
      isCurrency: true,
      subtext: `${payments.filter((p) => p.date === todayStr).length} Payments Collected Today`,
      icon: Calendar,
      color: 'from-emerald-500 to-emerald-700'
    },
    {
      title: 'This Month Collection',
      rawNum: thisMonthsCollection,
      isCurrency: true,
      subtext: 'Current Month Total',
      icon: Receipt,
      color: 'from-violet-600 to-indigo-700'
    },
    {
      title: 'Upcoming EMIs',
      rawNum: upcomingPayments.length,
      isCurrency: false,
      subtext: 'Due for Collection',
      icon: AlertCircle,
      color: 'from-rose-600 to-pink-600'
    }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-12"
    >
      {/* Top Admin Welcome Banner */}
      <motion.div
        variants={itemVariants}
        className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 dark:from-indigo-950/90 dark:via-slate-900 dark:to-slate-950 border border-indigo-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl relative overflow-hidden text-white"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-indigo-300 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-amber-400" /> Internal Business Admin Portal
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Finance Business Dashboard
          </h2>
          <p className="text-slate-300 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Real-time calculation engine for customer loans, daily collections, and receivables.
          </p>
        </div>

        {/* Collection Performance Widget (Compact Center Area) */}
        <div className="relative z-10 hidden xl:flex items-center gap-3 bg-slate-900/90 border border-indigo-500/35 rounded-2xl px-4 py-2.5 shadow-lg shadow-indigo-500/10 backdrop-blur-md">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Collection Performance
              </span>
              <span className="px-1.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold rounded-md flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                {pctChange >= 0 ? `+${pctChange}%` : `${pctChange}%`} vs Last Week
              </span>
            </div>
            <div className="text-base font-extrabold text-white tracking-tight mt-0.5">
              This Week <span className="text-emerald-400"><AnimatedCounter value={thisWeekCollection} prefix="₹" /></span>
            </div>
          </div>

          {/* Tiny 7-Day Collection Sparkline Chart */}
          <div className="w-20 h-9 shrink-0 pl-1 border-l border-slate-800">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="val"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#sparklineGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenAddCustomer}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Customer
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenRecordPayment}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <DollarSign className="w-4 h-4" /> Record Payment
          </motion.button>
        </div>
      </motion.div>

      {/* 8 Animated Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2 } }}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl relative overflow-hidden group transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${card.color} text-white flex items-center justify-center shadow-md shrink-0 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-extrabold text-white tracking-tight">
                  <AnimatedCounter
                    value={card.rawNum}
                    prefix={card.isCurrency ? '₹' : ''}
                  />
                </h3>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-medium">
                  {card.subtext}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Monthly Collection Trend */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 p-6 rounded-2xl bg-[#0f172a]/80 border border-slate-800 shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Monthly Collection Ledger</h3>
              <p className="text-xs text-slate-400">Actual aggregated payments per month</p>
            </div>
            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded-lg border border-indigo-500/20">
              Live Database
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dynamicMonthlyData}>
                <defs>
                  <linearGradient id="colorCollection" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#64748B"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#FFF'
                  }}
                  formatter={(val: any) => [`₹${Number(val || 0).toLocaleString()}`, 'Collection']}
                />
                <Area
                  type="monotone"
                  dataKey="collection"
                  stroke="#6366F1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCollection)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Loan Distribution Donut Chart */}
        <motion.div
          variants={itemVariants}
          className="p-6 rounded-2xl bg-[#0f172a]/80 border border-slate-800 shadow-xl flex flex-col justify-between transition-all duration-300"
        >
          <div>
            <h3 className="text-lg font-bold text-white">Loan Portfolio Breakdown</h3>
            <p className="text-xs text-slate-400">Current active & overdue loan status</p>

            <div className="h-56 w-full mt-4">
              {loanDistributionData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-500 p-4">
                  <BarChart2 className="w-10 h-10 mb-2 opacity-30 text-indigo-400" />
                  <p className="font-semibold text-slate-400">No active loans issued yet</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Click "+ Add Customer" to create your first customer loan portfolio
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={loanDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {loanDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#FFF'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800">
            {loanDistributionData.length === 0 ? (
              <div className="col-span-2 text-center text-[11px] text-slate-500">
                0 Active • 0 Completed • 0 Overdue
              </div>
            ) : (
              loanDistributionData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-300 font-medium">
                    {d.name}: <strong className="text-white">{d.value}</strong>
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Transactions & Upcoming EMIs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <motion.div
          variants={itemVariants}
          className="p-6 rounded-2xl bg-[#0f172a]/80 border border-slate-800 shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
            <button
              onClick={() => onNavigate('payments')}
              className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              View All Ledger <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {payments.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30 text-indigo-400" />
                <p className="font-semibold text-slate-400">No payment receipts recorded</p>
                <p className="text-xs text-slate-500 mt-1">
                  Click "Record Payment" to issue your first EMI receipt.
                </p>
              </div>
            ) : (
              payments.slice(0, 5).map((pay) => (
                <div
                  key={pay.id}
                  className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{pay.customerName}</p>
                      <p className="text-xs text-slate-400">
                        {pay.paymentMethod} • Receipt #{pay.receiptNumber}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-emerald-400">
                      +₹{pay.amount.toLocaleString()}
                    </span>
                    <p className="text-[11px] text-slate-400">{pay.date}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Upcoming EMI Payments */}
        <motion.div
          variants={itemVariants}
          className="p-6 rounded-2xl bg-[#0f172a]/80 border border-slate-800 shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Upcoming EMI Payments</h3>
            <button
              onClick={() => onNavigate('loans')}
              className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              View All Loans <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {upcomingPayments.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30 text-indigo-400" />
                <p className="font-semibold text-slate-400">No active loans due</p>
                <p className="text-xs text-slate-500 mt-1">
                  Onboard a new customer to generate EMI schedules.
                </p>
              </div>
            ) : (
              upcomingPayments.slice(0, 5).map((loan) => {
                const cust = customers.find((c) => c.id === loan.customerId);
                const isOverdue = loan.status === 'Overdue';
                return (
                  <div
                    key={loan.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                      isOverdue
                        ? 'bg-rose-950/20 border-rose-900/50'
                        : 'bg-slate-800/40 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0 ring-2 ring-indigo-500/30">
                        {cust?.fullName ? cust.fullName.charAt(0) : 'C'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {cust?.fullName || 'Customer'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {loan.id} • Next Due:{' '}
                          <span className={isOverdue ? 'text-rose-400 font-bold' : ''}>
                            {loan.nextDueDate}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-white">
                        ₹{loan.emiAmount.toLocaleString()}
                      </span>
                      <button
                        onClick={onOpenRecordPayment}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Collect
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
