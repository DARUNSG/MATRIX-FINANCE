import React, { useState } from 'react';
import { Receipt, Search, DollarSign, Download, Filter, CheckCircle2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '../context/ToastContext';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { clearAllPaymentsFromFirebase } from '../services/firebaseService';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface PaymentsProps {
  onOpenRecordPayment: () => void;
}

export const Payments: React.FC<PaymentsProps> = ({ onOpenRecordPayment }) => {
  const { showToast } = useToast();
  const payments = useLiveQuery(() => db.payments.orderBy('date').reverse().toArray(), []) || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const filteredPayments = payments.filter((pay) => {
    const matchQuery =
      pay.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pay.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pay.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchMethod = methodFilter === 'All' ? true : pay.paymentMethod === methodFilter;
    return matchQuery && matchMethod;
  });

  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);

  const handleClearAllPayments = async () => {
    try {
      await db.payments.clear();
      await clearAllPaymentsFromFirebase();

      // Reset loan paid amounts back to zero for accuracy
      const allLoans = await db.loans.toArray();
      for (const loan of allLoans) {
        await db.loans.update(loan.id, {
          paidAmount: 0,
          remainingAmount: loan.totalPayable,
          status: 'Active'
        });
      }

      showToast(
        'Payments Cleared',
        'All payment transaction receipts cleared from localhost & Firebase Database.',
        'success'
      );
      setIsClearConfirmOpen(false);
    } catch (err) {
      console.error('Clear payments error:', err);
      showToast('Error', 'Could not clear payment details.', 'error');
    }
  };

  const downloadReceipt = (pay: any) => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text('Matrix Finance Services', 14, 22);
      doc.setFontSize(10);
      doc.text('Official EMI Payment Receipt', 14, 30);

      autoTable(doc, {
        startY: 50,
        head: [['Transaction Field', 'Value']],
        body: [
          ['Transaction ID', pay.transactionId],
          ['Receipt Number', pay.receiptNumber],
          ['Customer Name', pay.customerName],
          ['Date & Time', pay.date],
          ['Amount Paid', `INR ${pay.amount.toLocaleString()}`],
          ['Payment Method', pay.paymentMethod],
          ['Payment Type', pay.paymentType],
          ['Collected By', pay.collectedBy],
          ['Status', pay.status]
        ],
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] }
      });

      doc.save(`Receipt_${pay.receiptNumber}.pdf`);
      showToast('Receipt Downloaded', `PDF saved for Receipt #${pay.receiptNumber}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Download Error', 'Could not generate PDF receipt.', 'error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-12"
    >
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Payment Transactions</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Complete transaction ledger of EMI receipts and payment methods.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {payments.length > 0 && (
            <button
              onClick={() => setIsClearConfirmOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Clear All Payments
            </button>
          )}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenRecordPayment}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <DollarSign className="w-4 h-4" /> Record New Payment
          </motion.button>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Receipts</span>
            <h3 className="text-2xl font-bold text-white mt-1">
              <AnimatedCounter value={payments.length} suffix=" Receipts" />
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Money Collected</span>
            <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">
              <AnimatedCounter value={totalCollected} prefix="₹" />
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Filtered Count</span>
            <h3 className="text-2xl font-bold text-white mt-1">
              <AnimatedCounter value={filteredPayments.length} suffix=" Shown" />
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
            <Filter className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Filter */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, Txn ID, receipt..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Filter className="w-3.5 h-3.5 text-indigo-400" />
          <span>Payment Method:</span>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-medium focus:outline-none"
          >
            <option value="All">All Methods</option>
            <option value="UPI / QR">UPI / QR Code</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
        {filteredPayments.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-400" />
            <h3 className="text-base font-bold text-white">No payment transactions found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              All payment details have been cleared or no matching payment receipts were found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Customer</th>
                  <th className="py-3.5 px-4 font-semibold">Receipt & Txn ID</th>
                  <th className="py-3.5 px-4 font-semibold">Amount Paid</th>
                  <th className="py-3.5 px-4 font-semibold">Date & Time</th>
                  <th className="py-3.5 px-4 font-semibold">Method</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-white">{pay.customerName}</p>
                      <p className="text-[11px] text-slate-400">Loan #{pay.loanId}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs text-indigo-400 font-bold">
                        #{pay.receiptNumber}
                      </span>
                      <p className="text-[11px] font-mono text-slate-500">{pay.transactionId}</p>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-400 text-base">
                      +₹{pay.amount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">{pay.date}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs font-medium">
                        {pay.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => downloadReceipt(pay)}
                        className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal to Clear All Payments */}
      <ConfirmDialog
        isOpen={isClearConfirmOpen}
        title="Clear All Payment Transactions"
        message="Are you sure you want to clear all payment receipts? This will wipe all payment history from localhost and Firebase Realtime Database."
        confirmText="Clear All Payments"
        isDanger
        onConfirm={handleClearAllPayments}
        onCancel={() => setIsClearConfirmOpen(false)}
      />
    </motion.div>
  );
};
