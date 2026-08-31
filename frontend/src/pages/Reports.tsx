import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { motion } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useToast } from '../context/ToastContext';
import { saveReportLogToFirebase } from '../services/firebaseService';

export const Reports: React.FC = () => {
  const { showToast } = useToast();
  const [dateFilter, setDateFilter] = useState<'All' | 'ThisMonth' | 'LastQuarter'>('ThisMonth');

  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];
  const loans = useLiveQuery(() => db.loans.toArray(), []) || [];
  const payments = useLiveQuery(() => db.payments.toArray(), []) || [];

  const totalLoans = loans.length;
  const completedLoans = loans.filter((l) => l.status === 'Completed').length;
  const pendingLoans = loans.filter((l) => l.status === 'Active' || l.status === 'Pending').length;
  const overdueLoans = loans.filter((l) => l.status === 'Overdue').length;

  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);

  // Daily collection chart data
  const dailyCollectionData = [
    { day: 'Mon 25', collection: 45000 },
    { day: 'Tue 26', collection: 72000 },
    { day: 'Wed 27', collection: 33000 },
    { day: 'Thu 28', collection: 93333 },
    { day: 'Fri 29', collection: 55000 },
    { day: 'Sat 30', collection: 33000 },
    { day: 'Sun 31', collection: 46667 }
  ];

  // Customer growth timeline data
  const customerGrowthData = [
    { month: 'Jan', count: 1 },
    { month: 'Feb', count: 2 },
    { month: 'Mar', count: 3 },
    { month: 'Apr', count: 4 },
    { month: 'May', count: 5 },
    { month: 'Jun', count: 6 },
    { month: 'Jul', count: 6 },
    { month: 'Aug', count: 6 }
  ];

  // Export as EXCEL (.xlsx)
  const exportExcel = async () => {
    try {
      const reportRows = payments.map((p) => ({
        'Transaction ID': p.transactionId,
        'Receipt Number': p.receiptNumber,
        Customer: p.customerName,
        Date: p.date,
        'Amount (INR)': p.amount,
        'Payment Method': p.paymentMethod,
        Type: p.paymentType,
        Status: p.status,
        'Collected By': p.collectedBy
      }));

      const worksheet = XLSX.utils.json_to_sheet(reportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Collections_Report');

      XLSX.writeFile(workbook, `FinPulse_Financial_Report_August2026.xlsx`);
      await saveReportLogToFirebase('Excel', { totalCollected, totalLoans, overdueLoans });
      showToast('Excel Exported & Saved to Firebase', 'Report stored in database.', 'success');
    } catch (err) {
      console.error('Excel Export Error:', err);
      showToast('Export Error', 'Could not export Excel file.', 'error');
    }
  };

  // Export as PDF (.pdf)
  const exportPDF = async () => {
    try {
      const doc = new jsPDF();

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 45, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text('FinPulse Financial Report', 14, 22);

      doc.setFontSize(10);
      doc.text('Comprehensive Portfolio & Collection Summary', 14, 32);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text(`Total Customers: ${totalLoans}`, 14, 55);
      doc.text(`Total Money Collected: INR ${totalCollected.toLocaleString()}`, 14, 63);
      doc.text(`Overdue Accounts: ${overdueLoans}`, 14, 71);

      autoTable(doc, {
        startY: 80,
        head: [['Txn ID', 'Receipt #', 'Customer', 'Date', 'Amount (INR)', 'Method', 'Status']],
        body: payments.map((p) => [
          p.transactionId,
          p.receiptNumber,
          p.customerName,
          p.date,
          p.amount.toLocaleString(),
          p.paymentMethod,
          p.status
        ]),
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }
      });

      doc.save(`FinPulse_Report_August2026.pdf`);
      await saveReportLogToFirebase('PDF', { totalCollected, totalLoans, overdueLoans });
      showToast('PDF Exported & Saved to Firebase', 'Report stored in database.', 'success');
    } catch (err) {
      console.error('PDF Export Error:', err);
      showToast('Export Error', 'Could not export PDF file.', 'error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-12"
    >
      {/* Header Bar with Export Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Reports & Analytics</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Exportable collection statements, customer growth metrics, and audit summaries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-700/20 transition-all hover:scale-[1.02]"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02]"
          >
            <FileText className="w-4 h-4" /> Export PDF Report
          </button>
        </div>
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold uppercase">Total Portfolio Loans</span>
          <h3 className="text-2xl font-extrabold text-white mt-1">{totalLoans} Accounts</h3>
          <p className="text-xs text-emerald-400 mt-1 font-medium">{completedLoans} Loans Fully Paid</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold uppercase">Total Amount Collected</span>
          <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">
            ₹{totalCollected.toLocaleString()}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Across all branches</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold uppercase">Pending Loans</span>
          <h3 className="text-2xl font-extrabold text-amber-400 mt-1">{pendingLoans} Active</h3>
          <p className="text-xs text-slate-400 mt-1">Regular monthly EMIs</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold uppercase">Overdue Payments</span>
          <h3 className="text-2xl font-extrabold text-rose-400 mt-1">{overdueLoans} Alert</h3>
          <p className="text-xs text-rose-400 mt-1 font-medium">Requires followup call</p>
        </div>
      </div>

      {/* Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Collection Bar Chart */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-1">Daily Collection Breakdown</h3>
          <p className="text-xs text-slate-400 mb-6">Collections recorded in past 7 days</p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyCollectionData}>
                <XAxis dataKey="day" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#FFF' }}
                  formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, 'Collection']}
                />
                <Bar dataKey="collection" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Growth Line Chart */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-1">Customer Onboarding Growth</h3>
          <p className="text-xs text-slate-400 mb-6">Cumulative registered customers over time</p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={customerGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#FFF' }}
                />
                <Line type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
