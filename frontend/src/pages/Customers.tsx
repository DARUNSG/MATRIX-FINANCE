import React, { useState } from 'react';
import {
  Search,
  Plus,
  Grid,
  List,
  Filter,
  Briefcase,
  Phone,
  Eye,
  Edit2,
  Trash2,
  ArrowUpDown,
  UserPlus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { Customer } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { clearAllCustomersFromFirebase } from '../services/firebaseService';

interface CustomersProps {
  onSelectCustomer: (customer: Customer) => void;
  onOpenAddCustomer: () => void;
}

export const Customers: React.FC<CustomersProps> = ({
  onSelectCustomer,
  onOpenAddCustomer
}) => {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];
  const loans = useLiveQuery(() => db.loans.toArray(), []) || [];

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<'name' | 'loanAmount' | 'paidPercent'>('name');

  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const customerList = customers.map((c) => {
    const custLoans = loans.filter((l) => l.customerId === c.id);
    const totalLoan = custLoans.reduce((acc, l) => acc + l.totalPayable, 0);
    const paidAmount = custLoans.reduce((acc, l) => acc + l.paidAmount, 0);
    const pendingAmount = custLoans.reduce((acc, l) => acc + l.remainingAmount, 0);
    const emiAmount = custLoans.reduce((acc, l) => acc + l.emiAmount, 0);

    const activeLoan = custLoans.find((l) => l.status === 'Active' || l.status === 'Overdue');
    const loanStatus = activeLoan
      ? activeLoan.status
      : custLoans.length > 0
      ? 'Completed'
      : 'No Loan';

    const nextDueDate = activeLoan ? activeLoan.nextDueDate : 'N/A';

    return {
      ...c,
      totalLoan,
      paidAmount,
      pendingAmount,
      emiAmount,
      loanStatus,
      nextDueDate
    };
  });

  const filteredCustomers = customerList
    .filter((c) => {
      const matchQuery =
        c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        c.occupation.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        statusFilter === 'All'
          ? true
          : statusFilter === 'Active'
          ? c.loanStatus === 'Active'
          : statusFilter === 'Overdue'
          ? c.loanStatus === 'Overdue'
          : statusFilter === 'Completed'
          ? c.loanStatus === 'Completed'
          : true;

      return matchQuery && matchStatus;
    })
    .sort((a, b) => {
      if (sortField === 'name') return a.fullName.localeCompare(b.fullName);
      if (sortField === 'loanAmount') return b.totalLoan - a.totalLoan;
      if (sortField === 'paidPercent') {
        const pctA = a.totalLoan ? (a.paidAmount / a.totalLoan) * 100 : 0;
        const pctB = b.totalLoan ? (b.paidAmount / b.totalLoan) * 100 : 0;
        return pctB - pctA;
      }
      return 0;
    });

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    try {
      await db.customers.delete(customerToDelete.id);
      const custLoans = await db.loans.where('customerId').equals(customerToDelete.id).toArray();
      for (const l of custLoans) {
        await db.loans.delete(l.id);
      }
      showToast(
        'Customer Account Removed',
        `${customerToDelete.fullName} removed from internal records.`,
        'success'
      );
      setCustomerToDelete(null);
    } catch (err) {
      console.error('Delete customer error:', err);
      showToast('Error', 'Could not remove customer record.', 'error');
    }
  };

  // Reset Customer Count to 0
  const handleResetAllCustomers = async () => {
    try {
      await db.customers.clear();
      await db.loans.clear();
      await db.payments.clear();
      await clearAllCustomersFromFirebase();

      showToast(
        'Customer Count Reset to 0',
        'All customer records, loans, and ledgers have been reset to 0.',
        'success'
      );
      setIsResetConfirmOpen(false);
    } catch (err) {
      console.error('Reset customers error:', err);
      showToast('Error', 'Could not reset customer count.', 'error');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    await db.customers.update(editingCustomer.id, {
      fullName: editingCustomer.fullName,
      phone: editingCustomer.phone,
      email: editingCustomer.email,
      address: editingCustomer.address,
      occupation: editingCustomer.occupation
    });
    showToast('Updated', 'Customer details saved successfully.', 'success');
    setEditingCustomer(null);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.96, y: 15 },
    show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3 } }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-12"
    >
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Customer Directory</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
            Internal customer accounts, loan ledgers, and balances ({filteredCustomers.length} Records)
          </p>
        </div>
        <div className="flex items-center gap-3">
          {customers.length > 0 && (
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Reset Customers (Set to 0)
            </button>
          )}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenAddCustomer}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add New Customer
          </motion.button>
        </div>
      </div>

      {/* Control Bar: Search, Filters & View Toggle */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, ID, phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Loan</option>
              <option value="Overdue">Overdue Collection</option>
              <option value="Completed">Completed Loan</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sort:</span>
            <select
              value={sortField}
              onChange={(e: any) => setSortField(e.target.value)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none"
            >
              <option value="name">Name (A-Z)</option>
              <option value="loanAmount">Loan Amount</option>
              <option value="paidPercent">Repayment Progress</option>
            </select>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 ml-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Directory Display */}
      {filteredCustomers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-12 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-center text-slate-500 space-y-4 max-w-lg mx-auto my-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto ring-4 ring-indigo-500/20">
            <UserPlus className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Total Customer Count: 0</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Customer count is set to 0. Click "+ Add New Customer" below to onboard your first borrower.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenAddCustomer}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add New Customer
          </motion.button>
        </motion.div>
      ) : viewMode === 'grid' ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredCustomers.map((c) => {
            const paidPct = c.totalLoan ? Math.min(100, Math.round((c.paidAmount / c.totalLoan) * 100)) : 0;
            return (
              <motion.div
                key={c.id}
                variants={cardVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl relative flex flex-col justify-between group transition-all duration-300"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-400 text-white font-extrabold flex items-center justify-center text-lg shadow-lg shadow-indigo-500/20 shrink-0">
                        {getInitials(c.fullName)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight group-hover:text-indigo-400 transition-colors">
                          {c.fullName}
                        </h3>
                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                          {c.id}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                        c.loanStatus === 'Overdue'
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                          : c.loanStatus === 'Completed'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                          : c.loanStatus === 'Active'
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                      }`}
                    >
                      {c.loanStatus}
                    </span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{c.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{c.occupation || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="mt-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/60 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Total Loan:</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        ₹{c.totalLoan.toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-emerald-500">Paid: ₹{c.paidAmount.toLocaleString()}</span>
                        <span className="text-amber-500">Pending: ₹{c.pendingAmount.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${paidPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectCustomer(c)}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Ledger
                  </button>

                  <button
                    onClick={() => setEditingCustomer(c)}
                    className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                    title="Edit Details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => setCustomerToDelete(c)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                      title="Delete Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xl overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[11px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Occupation</th>
                <th className="p-4">Total Loan</th>
                <th className="p-4">Paid</th>
                <th className="p-4">Pending</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                        {getInitials(c.fullName)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{c.fullName}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{c.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-xs font-mono">{c.phone}</td>
                  <td className="p-4 text-xs">{c.occupation || 'N/A'}</td>
                  <td className="p-4 font-bold text-slate-900 dark:text-white">
                    ₹{c.totalLoan.toLocaleString()}
                  </td>
                  <td className="p-4 font-bold text-emerald-500">
                    ₹{c.paidAmount.toLocaleString()}
                  </td>
                  <td className="p-4 font-bold text-amber-500">
                    ₹{c.pendingAmount.toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${
                        c.loanStatus === 'Overdue'
                          ? 'bg-rose-500/10 text-rose-500'
                          : c.loanStatus === 'Completed'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-indigo-500/10 text-indigo-400'
                      }`}
                    >
                      {c.loanStatus}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onSelectCustomer(c)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        View
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => setCustomerToDelete(c)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal to Delete Single Customer */}
      <ConfirmDialog
        isOpen={!!customerToDelete}
        title={`Delete Customer ${customerToDelete?.fullName}`}
        message={`Are you sure you want to delete ${customerToDelete?.fullName}? All associated loan files and ledger records will be removed.`}
        confirmText="Delete Account"
        isDanger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setCustomerToDelete(null)}
      />

      {/* Confirmation Modal to Reset Customer Count to 0 */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="Reset Total Customer Count to 0"
        message="Are you sure you want to reset total customer count to 0? This will wipe all customer records, loan portfolios, and payment history from localhost and Firebase Realtime Database."
        confirmText="Reset to 0"
        isDanger
        onConfirm={handleResetAllCustomers}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white">
            <h3 className="text-xl font-bold mb-4">Edit Customer Profile</h3>
            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingCustomer.fullName}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, fullName: e.target.value })}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editingCustomer.phone}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={editingCustomer.email}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Occupation</label>
                <input
                  type="text"
                  value={editingCustomer.occupation}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, occupation: e.target.value })}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};
