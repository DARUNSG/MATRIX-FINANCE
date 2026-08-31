import React from 'react';
import {
  X,
  Calendar as CalendarIcon,
  CreditCard,
  TrendingUp,
  Clock,
  DollarSign,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { AnimatedCounter } from './AnimatedCounter';

interface DateDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD
}

export const DateDetailsModal: React.FC<DateDetailsModalProps> = ({
  isOpen,
  onClose,
  selectedDate
}) => {
  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];
  const loans = useLiveQuery(() => db.loans.toArray(), []) || [];
  const payments = useLiveQuery(() => db.payments.toArray(), []) || [];

  if (!isOpen) return null;

  // Format Date for Header
  const dateObj = new Date(selectedDate);
  const formattedDate = dateObj.toLocaleDateString([], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // 1. Active Loans / Plans up to/on selected date
  const activeLoansOnDate = loans.filter((l) => {
    const start = new Date(l.startDate);
    return start <= dateObj && (l.status === 'Active' || l.status === 'Overdue' || l.status === 'Completed');
  });

  // 2. Total Amount Given
  const totalAmountGivenOnDate = activeLoansOnDate.reduce((acc, l) => acc + l.principalAmount, 0);

  // 3. Total Amount Collected up to selected date
  const paymentsUpToDate = payments.filter((p) => new Date(p.date) <= dateObj && p.status === 'Paid');
  const totalCollectedUpToDate = paymentsUpToDate.reduce((acc, p) => acc + p.amount, 0);

  // 4. Pending Amount as of selected date
  const pendingAmountOnDate = Math.max(0, totalAmountGivenOnDate - totalCollectedUpToDate);

  // 5. Specific Date Collection (EXACT payments collected on this date!)
  const specificDatePayments = payments.filter((p) => p.date === selectedDate && p.status === 'Paid');
  const specificDateCollection = specificDatePayments.reduce((acc, p) => acc + p.amount, 0);

  // EMIs due on this specific date
  const emisDueOnDate = loans.filter((l) => l.nextDueDate === selectedDate);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-white relative z-10"
        >
          {/* Modal Header */}
          <div className="p-6 bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  Financial Ledger Breakdown
                </h3>
                <p className="text-xs text-indigo-400 font-semibold mt-0.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {formattedDate}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 5 Core Metric Cards */}
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Specific Date Collection Spotlight Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/40 shadow-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Collection On This Specific Date ({selectedDate})
                </span>
                <h4 className="text-3xl font-extrabold text-white mt-1">
                  <AnimatedCounter value={specificDateCollection} prefix="₹" />
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  {specificDatePayments.length} Payment receipt(s) collected on this day
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <DollarSign className="w-7 h-7" />
              </div>
            </div>

            {/* Grid of 4 Additional Date Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Active Loans / Plans */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center justify-between text-indigo-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Active Plans
                  </span>
                  <CreditCard className="w-4 h-4" />
                </div>
                <h5 className="text-xl font-bold text-white">
                  <AnimatedCounter value={activeLoansOnDate.length} />
                </h5>
                <p className="text-[11px] text-slate-400 mt-1">Active Loan Portfolios</p>
              </div>

              {/* Total Amount Given */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center justify-between text-blue-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Total Given
                  </span>
                  <Building2 className="w-4 h-4" />
                </div>
                <h5 className="text-xl font-bold text-white">
                  <AnimatedCounter value={totalAmountGivenOnDate} prefix="₹" />
                </h5>
                <p className="text-[11px] text-slate-400 mt-1">Total Principal Issued</p>
              </div>

              {/* Total Collected */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center justify-between text-emerald-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Total Collected
                  </span>
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h5 className="text-xl font-bold text-white">
                  <AnimatedCounter value={totalCollectedUpToDate} prefix="₹" />
                </h5>
                <p className="text-[11px] text-slate-400 mt-1">Cumulative Collection</p>
              </div>

              {/* Pending Amount */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center justify-between text-amber-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Pending Amount
                  </span>
                  <Clock className="w-4 h-4" />
                </div>
                <h5 className="text-xl font-bold text-white">
                  <AnimatedCounter value={pendingAmountOnDate} prefix="₹" />
                </h5>
                <p className="text-[11px] text-slate-400 mt-1">Receivable Balance</p>
              </div>
            </div>

            {/* Payments Collected On This Specific Date List */}
            <div>
              <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" /> Payments Collected On {selectedDate}
              </h4>
              {specificDatePayments.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800 text-center text-xs text-slate-400">
                  No payment collections recorded on this specific date.
                </div>
              ) : (
                <div className="space-y-2">
                  {specificDatePayments.map((p) => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-white">{p.customerName}</p>
                          <p className="text-slate-400 text-[11px]">
                            {p.paymentMethod} • Receipt #{p.receiptNumber}
                          </p>
                        </div>
                      </div>
                      <span className="font-extrabold text-emerald-400 text-sm">
                        +₹{p.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* EMIs Due On This Specific Date List */}
            <div>
              <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" /> EMIs Scheduled Due On {selectedDate}
              </h4>
              {emisDueOnDate.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800 text-center text-xs text-slate-400">
                  No loan EMIs scheduled due on this date.
                </div>
              ) : (
                <div className="space-y-2">
                  {emisDueOnDate.map((l) => {
                    const cust = customers.find((c) => c.id === l.customerId);
                    return (
                      <div
                        key={l.id}
                        className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs shrink-0">
                            {cust?.fullName ? cust.fullName.charAt(0) : 'C'}
                          </div>
                          <div>
                            <p className="font-bold text-white">{cust?.fullName || 'Customer'}</p>
                            <p className="text-slate-400 text-[11px]">Loan #{l.id}</p>
                          </div>
                        </div>
                        <span className="font-bold text-amber-400 text-sm">
                          ₹{l.emiAmount.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Close Ledger Breakdown
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
