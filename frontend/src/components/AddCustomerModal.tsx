import React, { useState } from 'react';
import { X, User, CreditCard, CheckCircle, ArrowRight, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../db/database';
import { useToast } from '../context/ToastContext';
import { useNotifications } from '../context/NotificationContext';
import { saveCustomerToFirebase, saveLoanToFirebase } from '../services/firebaseService';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const { addNotification } = useNotifications();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Personal Details
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [occupation, setOccupation] = useState('');

  // Step 2: Loan Details
  const [principalAmount, setPrincipalAmount] = useState<number | ''>(300000);
  const [interestRate, setInterestRate] = useState<number | ''>(12);
  const [durationMonths, setDurationMonths] = useState<number | ''>(12);
  const [purpose, setPurpose] = useState('Business Expansion');

  if (!isOpen) return null;

  const p = Number(principalAmount) || 0;
  const r = Number(interestRate) || 0;
  const months = Number(durationMonths) || 1;

  const interestAmount = Math.round(p * (r / 100) * (months / 12));
  const totalPayable = p + interestAmount;
  const emiAmount = Math.round(totalPayable / months);

  const handleNext = () => {
    if (step === 1) {
      if (!fullName.trim() || !phone.trim() || !occupation.trim()) {
        showToast('Required Fields Missing', 'Please fill in Full Name, Phone, and Occupation.', 'warning');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (p <= 0 || months <= 0) {
        showToast('Invalid Loan Details', 'Please enter a valid principal amount and duration.', 'warning');
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => (prev - 1) as 1 | 2 | 3);
  };

  const handleSubmit = async () => {
    try {
      const custId = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
      const loanId = `LN-2026-${Math.floor(10 + Math.random() * 90)}`;
      const today = new Date().toISOString().split('T')[0];

      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + 30);
      const nextDueDateStr = nextDue.toISOString().split('T')[0];

      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + months);
      const endDateStr = endDate.toISOString().split('T')[0];

      const avatar = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`;

      const newCust = {
        id: custId,
        fullName,
        photo: avatar,
        phone,
        email: email || `${fullName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
        address: address || 'Main City Area',
        occupation,
        joiningDate: today,
        status: 'Active' as const
      };

      const newLoan = {
        id: loanId,
        customerId: custId,
        principalAmount: p,
        interestRate: r,
        totalPayable,
        durationMonths: months,
        emiAmount,
        startDate: today,
        endDate: endDateStr,
        nextDueDate: nextDueDateStr,
        paidAmount: 0,
        remainingAmount: totalPayable,
        status: 'Active' as const,
        purpose
      };

      // 1. Add locally
      await db.customers.add(newCust);
      await db.loans.add(newLoan);

      // 2. Sync directly to Firebase Database (finflow-aa069)
      await saveCustomerToFirebase(newCust);
      await saveLoanToFirebase(newLoan);

      await addNotification(
        'New Customer & Loan Onboarded',
        `${fullName} onboarded with loan #${loanId} of ₹${p.toLocaleString()}`,
        'Customer',
        '/customers'
      );

      showToast(
        'Customer Onboarded Successfully!',
        `Customer ID: ${custId} • Loan Account ID: ${loanId} created.`,
        'success'
      );

      setStep(1);
      setFullName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setOccupation('');
      onClose();
    } catch (err) {
      console.error('Error adding customer:', err);
      showToast('Failed to add customer', 'An error occurred while saving records.', 'error');
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
        className="relative w-full max-w-xl bg-slate-900 dark:bg-[#0f172a] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 z-10"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Onboard New Customer Loan</h3>
              <p className="text-xs text-slate-400">Internal onboarding wizard with automatic EMI schedule</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Tracker */}
        <div className="my-5 flex items-center justify-between relative px-4">
          <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-0.5 bg-slate-800 -z-0" />
          <motion.div
            className="absolute left-8 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-600 -z-0"
            animate={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
            transition={{ duration: 0.3 }}
          />

          {[
            { num: 1, label: 'Personal Details', icon: User },
            { num: 2, label: 'Loan & EMI', icon: CreditCard },
            { num: 3, label: 'Confirmation', icon: ShieldCheck }
          ].map((item) => {
            const Icon = item.icon;
            const isCompleted = step > item.num;
            const isCurrent = step === item.num;
            return (
              <div key={item.num} className="flex flex-col items-center relative z-10">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                      : isCurrent
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20 shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                </div>
                <span
                  className={`text-[11px] font-semibold mt-1.5 ${
                    isCurrent ? 'text-indigo-400' : 'text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Animated Step Transition Container */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ramesh@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Occupation / Business *
                  </label>
                  <input
                    type="text"
                    required
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="e.g. Textile Merchant"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Residential / Business Address
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Door No, Street Name, City, State"
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Loan Principal Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="5000"
                    value={principalAmount}
                    onChange={(e) => setPrincipalAmount(Number(e.target.value))}
                    placeholder="e.g. 500000"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Annual Interest Rate (% p.a.) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    step="0.5"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    placeholder="12"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Duration (Months) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(Number(e.target.value))}
                    placeholder="12"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Loan Purpose
                  </label>
                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="e.g. Inventory Expansion"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/80 to-slate-900 border border-indigo-500/40 grid grid-cols-3 gap-3 text-center">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium">Interest</span>
                  <p className="text-sm font-bold text-white mt-0.5">₹{interestAmount.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium">Total Payable</span>
                  <p className="text-sm font-bold text-white mt-0.5">₹{totalPayable.toLocaleString()}</p>
                </div>
                <div className="bg-indigo-600/30 p-2 rounded-lg border border-indigo-500/50">
                  <span className="text-[11px] text-indigo-300 font-bold uppercase">Monthly EMI</span>
                  <p className="text-base font-extrabold text-emerald-400 mt-0.5">₹{emiAmount.toLocaleString()}</p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                  <div>
                    <h4 className="font-bold text-white text-base">{fullName}</h4>
                    <p className="text-xs text-slate-400">{phone} • {occupation}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                    Ready to Save
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">Principal Loan:</span>
                    <p className="font-bold text-white text-sm">₹{p.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Interest Rate:</span>
                    <p className="font-bold text-white text-sm">{r}% p.a.</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Duration:</span>
                    <p className="font-bold text-white text-sm">{months} Months</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Monthly EMI:</span>
                    <p className="font-extrabold text-emerald-400 text-sm">₹{emiAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-700 flex justify-between text-xs text-slate-400">
                  <span>Total Amount to Collect:</span>
                  <span className="font-bold text-white">₹{totalPayable.toLocaleString()}</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 text-center">
                Clicking "Save Customer & Issue Loan" will create the customer ledger profile in your database.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
            >
              Next Step <ArrowRight className="w-4 h-4" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
            >
              <CheckCircle className="w-4 h-4" /> Save Customer & Issue Loan
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
