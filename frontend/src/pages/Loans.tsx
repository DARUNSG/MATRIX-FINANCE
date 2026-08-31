import React, { useState, useRef } from 'react';
import {
  Search,
  Plus,
  CreditCard,
  Download,
  FileSpreadsheet,
  Trash2,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { Loan, LoanStatus, Payment } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '../context/ToastContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { saveLoanToFirebase } from '../services/firebaseService';
import { ref, set } from 'firebase/database';
import { rtdb } from '../firebase/config';

interface LoansProps {
  onOpenRecordPayment: (loanId?: string) => void;
  onOpenAddCustomer: () => void;
}

export const Loans: React.FC<LoansProps> = ({ onOpenRecordPayment, onOpenAddCustomer }) => {
  const { showToast } = useToast();
  const loans = useLiveQuery(() => db.loans.toArray(), []) || [];
  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];
  const payments = useLiveQuery(() => db.payments.toArray(), []) || [];

  const [activeTab, setActiveTab] = useState<LoanStatus | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);

  // Store last deleted loan & payments for 5-second UNDO
  const lastDeletedLoanRef = useRef<{ loan: Loan; payments: Payment[] } | null>(null);

  const counts = {
    All: loans.length,
    Active: loans.filter((l) => l.status === 'Active').length,
    Completed: loans.filter((l) => l.status === 'Completed').length,
    Overdue: loans.filter((l) => l.status === 'Overdue').length,
    Pending: loans.filter((l) => l.status === 'Pending').length
  };

  const filteredLoans = loans.filter((loan) => {
    const cust = customers.find((c) => c.id === loan.customerId);
    const custName = cust ? cust.fullName.toLowerCase() : '';
    const matchQuery =
      loan.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      custName.includes(searchQuery.toLowerCase());

    const matchTab = activeTab === 'All' ? true : loan.status === activeTab;
    return matchQuery && matchTab;
  });

  // Download PDF Loan Completion Certificate
  const downloadLoanCompletionPDF = (loan: Loan) => {
    try {
      const cust = customers.find((c) => c.id === loan.customerId);
      const custName = cust?.fullName || 'Customer';
      const doc = new jsPDF();

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 45, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text('Matrix Finance Services', 14, 22);
      doc.setFontSize(11);
      doc.text('OFFICIAL LOAN COMPLETION & NO DUES CERTIFICATE', 14, 32);

      autoTable(doc, {
        startY: 55,
        head: [['Loan Completion Detail', 'Verified Value']],
        body: [
          ['Loan ID', loan.id],
          ['Customer Name', custName],
          ['Customer ID', loan.customerId],
          ['Principal Amount Issued', `INR ${loan.principalAmount.toLocaleString()}`],
          ['Interest Rate', `${loan.interestRate}% p.a.`],
          ['Total Amount Paid', `INR ${loan.totalPayable.toLocaleString()}`],
          ['Remaining Balance', 'INR 0 (FULL CLEARANCE)'],
          ['Loan Status', 'COMPLETED / PAID IN FULL'],
          ['Completion Date', new Date().toLocaleDateString()]
        ],
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] }
      });

      doc.save(`Completion_Certificate_${loan.id}.pdf`);
      showToast(
        'Completion Certificate Downloaded',
        `PDF certificate downloaded for Loan #${loan.id}. You can now delete this completed loan.`,
        'success'
      );
      setLoanToDelete(loan);
    } catch (err) {
      console.error(err);
      showToast('Error', 'Could not generate PDF certificate.', 'error');
    }
  };

  // Download Excel Loan Completion Statement
  const downloadLoanCompletionExcel = (loan: Loan) => {
    try {
      const cust = customers.find((c) => c.id === loan.customerId);
      const custName = cust?.fullName || 'Customer';
      const loanPayments = payments.filter((p) => p.loanId === loan.id);

      let csv = `Matrix Finance - Loan Completion Statement\n`;
      csv += `Loan ID,${loan.id}\n`;
      csv += `Customer,${custName}\n`;
      csv += `Principal,INR ${loan.principalAmount}\n`;
      csv += `Total Paid,INR ${loan.totalPayable}\n`;
      csv += `Status,COMPLETED\n\n`;

      csv += `Receipt Number,Transaction ID,Payment Date,Method,Amount Paid\n`;
      loanPayments.forEach((p) => {
        csv += `${p.receiptNumber},${p.transactionId},${p.date},${p.paymentMethod},${p.amount}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Loan_Completion_Statement_${loan.id}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(
        'Excel Statement Downloaded',
        `Excel statement downloaded for Loan #${loan.id}. You can now delete this completed loan.`,
        'success'
      );
      setLoanToDelete(loan);
    } catch (err) {
      console.error(err);
      showToast('Error', 'Could not generate Excel statement.', 'error');
    }
  };

  // Undo Delete Handler
  const handleUndoDeleteLoan = async () => {
    if (!lastDeletedLoanRef.current) return;
    const { loan, payments: savedPayments } = lastDeletedLoanRef.current;
    try {
      // Re-insert loan into IndexedDB
      await db.loans.add(loan);
      for (const p of savedPayments) {
        await db.payments.put(p);
      }

      // Re-sync to Firebase
      await saveLoanToFirebase(loan);

      showToast(
        'Loan Restored!',
        `Loan #${loan.id} has been restored successfully to your ledgers.`,
        'success'
      );
      lastDeletedLoanRef.current = null;
    } catch (err) {
      console.error('Undo error:', err);
      showToast('Error', 'Could not restore deleted loan.', 'error');
    }
  };

  // Delete Loan Record with 5-Second UNDO
  const handleDeleteCompletedLoan = async () => {
    if (!loanToDelete) return;
    const targetLoan = loanToDelete;
    const targetPayments = payments.filter((p) => p.loanId === targetLoan.id);

    try {
      // Save reference for 5-second UNDO
      lastDeletedLoanRef.current = { loan: targetLoan, payments: targetPayments };

      // Delete from Dexie
      await db.loans.delete(targetLoan.id);

      // Delete from Firebase Realtime Database
      try {
        const loanRef = ref(rtdb, `loans/${targetLoan.id}`);
        await set(loanRef, null);
      } catch (fbErr) {
        console.warn('Firebase loan delete warning:', fbErr);
      }

      setLoanToDelete(null);

      // Trigger Toast with 5-second live running UNDO countdown timer!
      showToast(
        `Loan #${targetLoan.id} Deleted`,
        'Item removed. Click Undo to restore.',
        'warning',
        {
          label: 'UNDO',
          onClick: handleUndoDeleteLoan
        },
        5000 // 5 seconds timer
      );
    } catch (err) {
      console.error('Delete loan error:', err);
      showToast('Error', 'Could not delete loan record.', 'error');
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
          <h2 className="text-2xl font-bold text-white tracking-tight">Loan Portfolio Management</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Monitor customer loan portfolios, interest schedules, and repayment status.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onOpenAddCustomer}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Issue New Loan
        </motion.button>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        {(['All', 'Active', 'Overdue', 'Completed', 'Pending'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === tab
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>{tab} Loans</span>
            <span
              className={`px-2 py-0.5 text-[11px] rounded-full ${
                activeTab === tab ? 'bg-white text-indigo-700 font-extrabold' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-500 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Loan ID, Customer Name, or Customer ID..."
          className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-slate-500"
        />
      </div>

      {/* Loans Table or Empty State */}
      {filteredLoans.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 space-y-4 max-w-lg mx-auto my-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto ring-4 ring-indigo-500/20">
            <CreditCard className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white">No Loans Found</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              No active or historical loans match your current filter. Onboard a customer to generate loan portfolios.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenAddCustomer}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Issue Loan
          </motion.button>
        </motion.div>
      ) : (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-4">Loan ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Principal</th>
                <th className="p-4">Interest Rate</th>
                <th className="p-4">Total Payable</th>
                <th className="p-4">EMI</th>
                <th className="p-4">Paid / Remaining</th>
                <th className="p-4">Next Due Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLoans.map((loan) => {
                const cust = customers.find((c) => c.id === loan.customerId);
                const paidPct = Math.min(
                  100,
                  Math.round((loan.paidAmount / (loan.totalPayable || 1)) * 100)
                );
                const isCompleted = loan.status === 'Completed' || loan.remainingAmount <= 0;

                return (
                  <tr key={loan.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-indigo-400">{loan.id}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0 ring-2 ring-indigo-500/30">
                          {cust?.fullName ? cust.fullName.charAt(0) : 'C'}
                        </div>
                        <div>
                          <p className="font-bold text-white">{cust?.fullName || 'Customer'}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{loan.customerId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-white">
                      ₹{loan.principalAmount.toLocaleString()}
                    </td>
                    <td className="p-4 font-medium text-slate-300">{loan.interestRate}% p.a.</td>
                    <td className="p-4 font-bold text-white">
                      ₹{loan.totalPayable.toLocaleString()}
                    </td>
                    <td className="p-4 font-bold text-emerald-400">
                      ₹{loan.emiAmount.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="w-28 space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-emerald-400">₹{loan.paidAmount.toLocaleString()}</span>
                          <span className="text-amber-400">₹{loan.remainingAmount.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-400 h-full rounded-full"
                            style={{ width: `${paidPct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-300">{loan.nextDueDate}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-full inline-flex items-center gap-1 ${
                          loan.status === 'Overdue'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : isCompleted
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-indigo-500/20 text-indigo-400'
                        }`}
                      >
                        {isCompleted && <ShieldCheck className="w-3 h-3 text-emerald-400" />}
                        {isCompleted ? 'Completed' : loan.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {isCompleted ? (
                        <div className="flex items-center justify-end gap-1.5">
                          {/* PDF Certificate Download Button */}
                          <button
                            onClick={() => downloadLoanCompletionPDF(loan)}
                            className="p-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                            title="Download PDF Loan Completion Certificate & Delete Option"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* Excel Statement Download Button */}
                          <button
                            onClick={() => downloadLoanCompletionExcel(loan)}
                            className="p-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                            title="Download Excel Loan Completion Statement & Delete Option"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                          </button>

                          {/* Delete Completed Loan Action Button */}
                          <button
                            onClick={() => setLoanToDelete(loan)}
                            className="p-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                            title="Delete Completed Loan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenRecordPayment(loan.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                          >
                            Collect
                          </button>
                          <button
                            onClick={() => setLoanToDelete(loan)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Delete Loan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal to Delete Loan */}
      <ConfirmDialog
        isOpen={!!loanToDelete}
        title={`Delete Loan #${loanToDelete?.id}`}
        message={`Are you sure you want to delete loan #${loanToDelete?.id}? You will have 5 seconds to UNDO the deletion if removed by mistake.`}
        confirmText="Delete Loan"
        isDanger
        onConfirm={handleDeleteCompletedLoan}
        onCancel={() => setLoanToDelete(null)}
      />
    </motion.div>
  );
};
