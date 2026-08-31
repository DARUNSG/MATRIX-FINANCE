import React from 'react';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  CreditCard,
  DollarSign,
  Receipt,
  Download,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { Customer } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '../context/ToastContext';

interface CustomerProfileProps {
  customer: Customer;
  onBack: () => void;
  onOpenRecordPayment: (loanId?: string) => void;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({
  customer,
  onBack,
  onOpenRecordPayment
}) => {
  const { showToast } = useToast();

  const customerLoans = useLiveQuery(
    () => db.loans.where('customerId').equals(customer.id).toArray(),
    [customer.id]
  ) || [];

  const customerPayments = useLiveQuery(
    () => db.payments.where('customerId').equals(customer.id).toArray(),
    [customer.id]
  ) || [];

  const primaryLoan = customerLoans[0];

  const totalLoanAmount = customerLoans.reduce((acc, l) => acc + l.totalPayable, 0);
  const paidAmount = customerLoans.reduce((acc, l) => acc + l.paidAmount, 0);
  const remainingAmount = customerLoans.reduce((acc, l) => acc + l.remainingAmount, 0);

  const progressPercent = totalLoanAmount
    ? Math.min(100, Math.round((paidAmount / totalLoanAmount) * 100))
    : 0;

  const downloadReceiptPDF = (pay: any) => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text('FinPulse Microfinance', 14, 22);
      doc.setFontSize(10);
      doc.text('Official Payment Receipt', 14, 30);

      autoTable(doc, {
        startY: 50,
        head: [['Field', 'Details']],
        body: [
          ['Customer Name', customer.fullName],
          ['Customer ID', customer.id],
          ['Phone Number', customer.phone],
          ['Loan Account ID', pay.loanId],
          ['Amount Paid', `INR ${pay.amount.toLocaleString()}`],
          ['Payment Method', pay.paymentMethod],
          ['Payment Type', pay.paymentType],
          ['Collected By', pay.collectedBy],
          ['Status', pay.status]
        ],
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }
      });

      doc.save(`Receipt_${pay.receiptNumber}.pdf`);
      showToast('Receipt Downloaded', `PDF saved for Receipt #${pay.receiptNumber}`, 'success');
    } catch (err) {
      console.error('PDF error:', err);
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
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-xs sm:text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Customers
        </button>

        <button
          onClick={() => onOpenRecordPayment(primaryLoan?.id)}
          className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02]"
        >
          <DollarSign className="w-4 h-4" /> Record EMI Payment
        </button>
      </div>

      {/* Customer Profile Banner Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={customer.photo}
              alt={customer.fullName}
              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-indigo-500/40 shadow-xl shrink-0"
            />
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-extrabold text-white">{customer.fullName}</h2>
                <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full">
                  {customer.id}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                {customer.occupation} • Joined {customer.joiningDate}
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-300 mt-3 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {customer.phone}
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {customer.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {customer.address}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Loan Repayment Progress Bar */}
        <div className="mt-8 p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Loan Repayment Progress
            </h4>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="text-emerald-400">Paid: ₹{paidAmount.toLocaleString()}</span>
              <span className="text-amber-400">Remaining: ₹{remainingAmount.toLocaleString()}</span>
              <span className="text-indigo-400 font-bold">Progress: {progressPercent}%</span>
            </div>
          </div>

          <div className="w-full bg-slate-800 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className="bg-gradient-to-r from-indigo-500 via-indigo-400 to-emerald-400 h-full rounded-full transition-all duration-700 shadow-lg shadow-indigo-500/50"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Loan Details Grid Cards */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-indigo-400" /> Active Loan Portfolio
        </h3>

        {customerLoans.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-500">
            No active loans found for this customer.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase">Loan Principal</span>
              <h4 className="text-xl font-extrabold text-white mt-1">
                ₹{primaryLoan.principalAmount.toLocaleString()}
              </h4>
              <p className="text-xs text-slate-400 mt-1">Rate: {primaryLoan.interestRate}% p.a.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase">Total Payable</span>
              <h4 className="text-xl font-extrabold text-white mt-1">
                ₹{primaryLoan.totalPayable.toLocaleString()}
              </h4>
              <p className="text-xs text-slate-400 mt-1">Duration: {primaryLoan.durationMonths} Months</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase">Monthly EMI</span>
              <h4 className="text-xl font-extrabold text-emerald-400 mt-1">
                ₹{primaryLoan.emiAmount.toLocaleString()}
              </h4>
              <p className="text-xs text-slate-400 mt-1">Next Due: {primaryLoan.nextDueDate}</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase">Loan Duration</span>
              <h4 className="text-sm font-bold text-white mt-1">
                {primaryLoan.startDate} → {primaryLoan.endDate}
              </h4>
              <span
                className={`inline-block mt-2 px-2.5 py-0.5 text-xs font-bold rounded-full ${
                  primaryLoan.status === 'Overdue'
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {primaryLoan.status}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Payment History Timeline & Table */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-400" /> Payment History Ledger
          </h3>
          <span className="text-xs text-slate-400">
            {customerPayments.length} Total Receipts Recorded
          </span>
        </div>

        {customerPayments.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            No payment receipts recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Receipt #</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Payment Method</th>
                  <th className="p-3.5">Collected By</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">PDF Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {customerPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-indigo-400">
                      {pay.receiptNumber}
                    </td>
                    <td className="p-3.5 text-white">{pay.date}</td>
                    <td className="p-3.5 font-bold text-emerald-400">
                      ₹{pay.amount.toLocaleString()}
                    </td>
                    <td className="p-3.5">{pay.paymentMethod}</td>
                    <td className="p-3.5">{pay.collectedBy}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold text-xs rounded-full">
                        {pay.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => downloadReceiptPDF(pay)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
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
    </motion.div>
  );
};
