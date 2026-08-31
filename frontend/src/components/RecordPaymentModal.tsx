import React, { useState, useEffect } from 'react';
import { X, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { PaymentMethod, PaymentType } from '../types';
import { useToast } from '../context/ToastContext';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { savePaymentToFirebase, saveLoanToFirebase } from '../services/firebaseService';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCustomerId?: string;
  preselectedLoanId?: string;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  preselectedCustomerId,
  preselectedLoanId
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();

  const loans = useLiveQuery(() => db.loans.toArray(), []) || [];
  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];

  // Show non-completed loans first; if none, show all loans
  const activeLoans = loans.filter((l) => l.status !== 'Completed');
  const selectableLoans = activeLoans.length > 0 ? activeLoans : loans;

  const [selectedLoanId, setSelectedLoanId] = useState<string>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentType, setPaymentType] = useState<PaymentType>('EMI');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (preselectedLoanId) {
      setSelectedLoanId(preselectedLoanId);
    } else if (preselectedCustomerId) {
      const match = selectableLoans.find((l) => l.customerId === preselectedCustomerId);
      if (match) setSelectedLoanId(match.id);
    } else if (selectableLoans.length > 0 && !selectedLoanId) {
      setSelectedLoanId(selectableLoans[0].id);
    }
  }, [preselectedLoanId, preselectedCustomerId, selectableLoans, selectedLoanId]);

  const selectedLoan = loans.find((l) => l.id === selectedLoanId);
  const selectedCustomer = selectedLoan
    ? customers.find((c) => c.id === selectedLoan.customerId)
    : null;

  useEffect(() => {
    if (selectedLoan) {
      setAmount(selectedLoan.emiAmount);
    }
  }, [selectedLoanId, selectedLoan]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLoan || !selectedCustomer) {
      showToast('No Active Loan Selected', 'Please select a valid customer loan portfolio.', 'error');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      showToast('Invalid Amount', 'Please enter a valid payment amount.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payAmount = Number(amount);
      const newPaidAmount = selectedLoan.paidAmount + payAmount;
      const newRemaining = Math.max(0, selectedLoan.remainingAmount - payAmount);
      const isCompleted = newRemaining === 0;

      const updatedLoan = {
        ...selectedLoan,
        paidAmount: newPaidAmount,
        remainingAmount: newRemaining,
        status: (isCompleted ? 'Completed' : selectedLoan.status === 'Overdue' ? 'Active' : selectedLoan.status) as any
      };

      await db.loans.update(selectedLoan.id, {
        paidAmount: newPaidAmount,
        remainingAmount: newRemaining,
        status: updatedLoan.status
      });

      const txnId = `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`;
      const rcpId = `RCP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      const newPayment = {
        id: `PAY-${Date.now()}`,
        transactionId: txnId,
        loanId: selectedLoan.id,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.fullName,
        date: new Date().toISOString().split('T')[0],
        amount: payAmount,
        paymentType,
        paymentMethod,
        receiptNumber: rcpId,
        status: 'Paid' as const,
        collectedBy: user?.name || 'Staff User',
        notes
      };

      // 1. Save locally
      await db.payments.add(newPayment);

      // 2. Sync directly to Firebase Database (finflow-aa069)
      await savePaymentToFirebase(newPayment);
      await saveLoanToFirebase(updatedLoan);

      await addNotification(
        'Payment Collected',
        `₹${payAmount.toLocaleString()} collected from ${selectedCustomer.fullName} (${selectedLoan.id})`,
        'Payment',
        '/payments'
      );

      showToast(
        'Payment Recorded Successfully!',
        `Receipt #${rcpId} generated. Remaining balance: ₹${newRemaining.toLocaleString()}`,
        'success'
      );

      onClose();
    } catch (err) {
      console.error('Error recording payment:', err);
      showToast('Failed to record payment', 'An error occurred while updating backend database.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative w-full max-w-lg bg-slate-900 dark:bg-[#0f172a] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 z-10 text-white"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Record EMI Payment</h3>
              <p className="text-xs text-slate-400">Instantly update customer balance & issue receipt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {selectableLoans.length === 0 ? (
          <div className="py-8 px-4 text-center space-y-3">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto opacity-80" />
            <h4 className="text-base font-bold text-white">No Active Customer Loans Found</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              There are currently no active customer loans in the database to record payments against. Please add a customer and issue a loan first.
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Close Window
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Loan / Customer Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Select Active Loan / Customer
              </label>
              <select
                value={selectedLoanId}
                onChange={(e) => setSelectedLoanId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Select Active Loan / Customer --</option>
                {selectableLoans.map((loan) => {
                  const cust = customers.find((c) => c.id === loan.customerId);
                  return (
                    <option key={loan.id} value={loan.id}>
                      {loan.id} — {cust?.fullName || 'Customer'} (EMI: ₹{loan.emiAmount.toLocaleString()})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Selected Customer & Balance Preview Card */}
            {selectedLoan && selectedCustomer && (
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-indigo-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 ring-2 ring-indigo-500/40">
                    {selectedCustomer.fullName ? selectedCustomer.fullName.charAt(0) : 'C'}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{selectedCustomer.fullName}</p>
                    <p className="text-slate-400">{selectedCustomer.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-slate-400">Remaining Balance</p>
                  <p className="font-bold text-emerald-400 text-sm">
                    ₹{selectedLoan.remainingAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* Payment Amount & Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Amount Collected (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="e.g. 40000"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Payment Type
                </label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="EMI">Regular Monthly EMI</option>
                  <option value="LumpSum">Lump Sum Prepayment</option>
                  <option value="Penalty">Late Fee / Penalty</option>
                </select>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Payment Method
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['UPI', 'Cash', 'BankTransfer', 'Cheque'] as PaymentMethod[]).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      paymentMethod === method
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {method === 'BankTransfer' ? 'Bank Transfer' : method}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Notes / Transaction Ref (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Paid via Google Pay ref #99102"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Recording...' : 'Confirm & Issue Receipt'}</span>
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
