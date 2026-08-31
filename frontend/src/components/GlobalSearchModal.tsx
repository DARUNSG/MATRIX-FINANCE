import React, { useState, useEffect } from 'react';
import { Search, X, User, CreditCard, Receipt, ArrowRight } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { Customer, Loan, Payment } from '../types';
import { NavTab } from './Sidebar';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavTab, targetId?: string) => void;
  onSelectCustomer?: (customer: Customer) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectCustomer
}) => {
  const [query, setQuery] = useState('');

  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];
  const loans = useLiveQuery(() => db.loans.toArray(), []) || [];
  const payments = useLiveQuery(() => db.payments.toArray(), []) || [];

  // Keyboard shortcut listener (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmed = query.trim().toLowerCase();

  const filteredCustomers = trimmed
    ? customers.filter(
        (c) =>
          c.fullName.toLowerCase().includes(trimmed) ||
          c.id.toLowerCase().includes(trimmed) ||
          c.phone.includes(trimmed)
      )
    : [];

  const filteredLoans = trimmed
    ? loans.filter(
        (l) => l.id.toLowerCase().includes(trimmed) || l.customerId.toLowerCase().includes(trimmed)
      )
    : [];

  const filteredPayments = trimmed
    ? payments.filter(
        (p) =>
          p.transactionId.toLowerCase().includes(trimmed) ||
          p.customerName.toLowerCase().includes(trimmed) ||
          p.receiptNumber.toLowerCase().includes(trimmed)
      )
    : [];

  const totalResults = filteredCustomers.length + filteredLoans.length + filteredPayments.length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20 flex justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-slate-900 dark:bg-[#0f172a] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto animate-slide-up">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customer name, Customer ID, Phone, Loan ID, or Transaction ID..."
            className="w-full bg-transparent text-white placeholder-slate-500 text-base focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-white p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 px-2 py-1 rounded border border-slate-700 font-medium"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!trimmed ? (
            <div className="py-8 text-center text-slate-500">
              <Search className="w-10 h-10 mx-auto mb-2 opacity-30 text-indigo-400" />
              <p className="text-sm">Type to search across customers, loans & transactions</p>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <p className="text-sm font-medium">No results found for "{query}"</p>
            </div>
          ) : (
            <>
              {/* Customers Group */}
              {filteredCustomers.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-400" /> Customers ({filteredCustomers.length})
                  </h4>
                  <div className="space-y-1.5">
                    {filteredCustomers.map((cust) => (
                      <div
                        key={cust.id}
                        onClick={() => {
                          onClose();
                          if (onSelectCustomer) {
                            onSelectCustomer(cust);
                          } else {
                            onNavigate('customers', cust.id);
                          }
                        }}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={cust.photo}
                            alt={cust.fullName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">
                              {cust.fullName}
                            </p>
                            <p className="text-xs text-slate-400">
                              {cust.id} • {cust.phone} • {cust.occupation}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Loans Group */}
              {filteredLoans.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-400" /> Loans ({filteredLoans.length})
                  </h4>
                  <div className="space-y-1.5">
                    {filteredLoans.map((loan) => (
                      <div
                        key={loan.id}
                        onClick={() => {
                          onClose();
                          onNavigate('loans', loan.id);
                        }}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all group"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">
                            {loan.id} — ₹{loan.principalAmount.toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-400">
                            Status: <span className="font-medium text-slate-300">{loan.status}</span> • EMI: ₹{loan.emiAmount.toLocaleString()}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transactions Group */}
              {filteredPayments.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-indigo-400" /> Transactions ({filteredPayments.length})
                  </h4>
                  <div className="space-y-1.5">
                    {filteredPayments.map((pay) => (
                      <div
                        key={pay.id}
                        onClick={() => {
                          onClose();
                          onNavigate('payments', pay.id);
                        }}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all group"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">
                            {pay.transactionId} — ₹{pay.amount.toLocaleString()} ({pay.paymentMethod})
                          </p>
                          <p className="text-xs text-slate-400">
                            {pay.customerName} • {pay.receiptNumber} • {pay.date}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
