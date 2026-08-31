import React, { useState, useEffect } from 'react';
import {
  Building2,
  Lock,
  Save,
  Moon,
  Sun,
  Download,
  Trash2,
  RefreshCw,
  Users,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { clearAllData, seedDatabaseIfEmpty } from '../db/seed';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const settingsData = useLiveQuery(() => db.settings.toCollection().first(), []) || {
    businessName: 'Apex Capital & Microfinance',
    tagline: 'Empowering Small Business Financial Growth',
    businessLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
    phone: '+91 98000 11122',
    email: 'support@apexcapital.in',
    address: 'Suite 402, Financial Tower, Bandra Kurla Complex, Mumbai, MH 400051',
    currency: '₹',
    theme: 'dark',
    enableEmailAlerts: true,
    enableSmsAlerts: true,
    lateFeePercentage: 2
  };

  const users = useLiveQuery(() => db.users.toArray(), []) || [];

  const [businessName, setBusinessName] = useState(settingsData.businessName);
  const [phone, setPhone] = useState(settingsData.phone);
  const [email, setEmail] = useState(settingsData.email);
  const [address, setAddress] = useState(settingsData.address);
  const [currency, setCurrency] = useState(settingsData.currency);
  const [emailAlerts, setEmailAlerts] = useState(settingsData.enableEmailAlerts);

  // Clear data confirmation modal
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  useEffect(() => {
    if (settingsData) {
      setBusinessName(settingsData.businessName);
      setPhone(settingsData.phone);
      setEmail(settingsData.email);
      setAddress(settingsData.address);
      setCurrency(settingsData.currency);
      setEmailAlerts(settingsData.enableEmailAlerts);
    }
  }, [settingsData]);

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    const firstObj = await db.settings.toCollection().first();
    if (firstObj && firstObj.id) {
      await db.settings.update(firstObj.id, {
        businessName,
        phone,
        email,
        address,
        currency,
        enableEmailAlerts: emailAlerts
      });
    }
    showToast('Settings Saved', 'Business configuration updated successfully.', 'success');
  };

  const handleClearDemoData = async () => {
    try {
      await clearAllData();
      setIsClearModalOpen(false);
      showToast('Database Cleared', 'All mock customer, loan, and payment records removed. Database is ready for real entry.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error', 'Failed to clear database.', 'error');
    }
  };

  const handleReloadSampleData = async () => {
    try {
      await clearAllData();
      showToast('Database Reset', 'Database reset to clean 0-customer state.', 'info');
    } catch (err) {
      console.error(err);
      showToast('Error', 'Failed to reset database.', 'error');
    }
  };

  const handleExportBackup = async () => {
    const backupData = {
      users: await db.users.toArray(),
      customers: await db.customers.toArray(),
      loans: await db.loans.toArray(),
      payments: await db.payments.toArray(),
      settings: await db.settings.toArray()
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FinPulse_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('Backup Exported', 'JSON database backup downloaded.', 'success');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-12 max-w-5xl"
    >
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">System Settings & Controls</h2>
        <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
          Configure business profile, currency format, user accounts, and database cleanup options.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Business & Theme Config */}
        <div className="md:col-span-2 space-y-6">
          {/* Business Details Form */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" /> Business Profile Information
            </h3>

            <form onSubmit={handleSaveBusiness} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Business / Firm Name
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Office Address
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Currency Symbol
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 font-bold"
                  >
                    <option value="₹">₹ (Indian Rupee - INR)</option>
                    <option value="$">$ (US Dollar - USD)</option>
                    <option value="€">€ (Euro - EUR)</option>
                    <option value="£">£ (British Pound - GBP)</option>
                  </select>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailAlerts}
                      onChange={(e) => setEmailAlerts(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0 w-4 h-4"
                    />
                    <span className="font-medium">Enable Email & SMS Due Date Alerts</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
                >
                  <Save className="w-4 h-4" /> Save Business Settings
                </button>
              </div>
            </form>
          </div>

          {/* User Accounts & Access Control */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" /> Internal Staff & Admin Accounts
              </h3>
              <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-lg border border-indigo-500/30">
                Administrative Staff Only
              </span>
            </div>

            <div className="space-y-3">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <h4 className="font-bold text-white text-sm">{u.name}</h4>
                      <p className="text-xs text-slate-400">{u.email} • {u.phone}</p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full ${
                      u.role === 'Admin'
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Database Management & Appearance */}
        <div className="space-y-6">
          {/* Appearance & Mode Toggle */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white">Appearance & Theme Mode</h3>
            <p className="text-xs text-slate-400">Switch between fintech dark mode and light theme</p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={toggleTheme}
              className="w-full p-4 rounded-xl border border-indigo-500/40 bg-slate-800/80 hover:bg-slate-800 flex items-center justify-between text-white font-bold transition-all"
            >
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-indigo-400" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-400" />
                )}
                <span>Current Mode: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
              </div>
              <span className="text-xs text-indigo-400 underline">Toggle</span>
            </motion.button>
          </div>

          {/* Database Reset & Fresh Start Section */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-400" /> Database Management
            </h3>
            <p className="text-xs text-slate-400">
              Clear demo/sample records to start with a blank database for actual business operations, or reload sample records anytime.
            </p>

            <div className="space-y-2 pt-1">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setIsClearModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border border-rose-800/60 font-bold text-xs rounded-xl transition-all shadow-lg shadow-rose-900/20"
              >
                <Trash2 className="w-4 h-4 text-rose-400" /> Clear Demo Data (Start Fresh)
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleReloadSampleData}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl transition-all"
              >
                <RefreshCw className="w-4 h-4 text-indigo-400" /> Reload Sample Business Data
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleExportBackup}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-400" /> Export JSON Backup File
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isClearModalOpen}
        title="Clear All Demo Records?"
        message="This will delete all sample customer accounts, active loans, and payment history from your browser database so you can start entering real clients."
        confirmText="Yes, Clear All Data"
        isDanger={true}
        onConfirm={handleClearDemoData}
        onCancel={() => setIsClearModalOpen(false)}
      />
    </motion.div>
  );
};
