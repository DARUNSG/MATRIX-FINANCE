import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { CustomerProfile } from './pages/CustomerProfile';
import { Loans } from './pages/Loans';
import { Payments } from './pages/Payments';
import { Reports } from './pages/Reports';
import { NotificationsPage } from './pages/Notifications';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { AddCustomerModal } from './components/AddCustomerModal';
import { RecordPaymentModal } from './components/RecordPaymentModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { Customer } from './types';
import { useAuth } from './context/AuthContext';
import { subscribeToFirebaseRealtime } from './services/firebaseService';
import { db } from './db/database';

export const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Modals
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [recordPaymentLoanId, setRecordPaymentLoanId] = useState<string | undefined>(undefined);

  // Sync Firebase Realtime DB to Dexie state
  React.useEffect(() => {
    const unsubscribe = subscribeToFirebaseRealtime(async (data) => {
      try {
        if (data.customers && data.customers.length > 0) {
          await db.customers.bulkPut(data.customers);
        }
        if (data.loans && data.loans.length > 0) {
          await db.loans.bulkPut(data.loans);
        }
        if (data.payments && data.payments.length > 0) {
          await db.payments.bulkPut(data.payments);
        }
      } catch (err) {
        console.warn('Realtime sync error:', err);
      }
    });
    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-400">Loading Matrix Finance Engine...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const handleNavigate = (tab: NavTab) => {
    setActiveTab(tab);
    if (tab !== 'customers') {
      setSelectedCustomer(null);
    }
  };

  const handleOpenRecordPaymentWithLoan = (loanId?: string) => {
    setRecordPaymentLoanId(loanId);
    setIsRecordPaymentOpen(true);
  };

  const pageTitles: Record<NavTab, string> = {
    dashboard: 'Executive Dashboard',
    customers: selectedCustomer ? `Customer Profile: ${selectedCustomer.fullName}` : 'Customer Ledger Management',
    loans: 'Loan Portfolio Management',
    payments: 'Payment Transaction History',
    reports: 'Reports & Business Analytics',
    notifications: 'System Alert Center',
    settings: 'Business Settings & Controls'
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex transition-colors relative overflow-hidden font-sans">
      {/* Interactive Background Animated Orbs & Ambient Glows */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          x: [0, 50, 0],
          y: [0, -30, 0],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="fixed -top-40 -left-40 w-[45rem] h-[45rem] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none z-0"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -40, 0],
          y: [0, 40, 0],
          opacity: [0.15, 0.35, 0.15]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="fixed top-1/3 -right-40 w-[40rem] h-[40rem] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none z-0"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 30, 0],
          y: [0, 50, 0],
          opacity: [0.15, 0.3, 0.15]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="fixed -bottom-40 left-1/3 w-[38rem] h-[38rem] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none z-0"
      />

      {/* Grid Pattern Mesh */}
      <div className="fixed inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none z-0" />

      {/* Collapsible Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'customers') setSelectedCustomer(null);
        }}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 relative z-10 ${
          isSidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Sticky Header Bar */}
        <Header
          pageTitle={pageTitles[activeTab]}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAddCustomer={() => setIsAddCustomerOpen(true)}
          onOpenRecordPayment={() => handleOpenRecordPaymentWithLoan()}
        />

        {/* View Router Body */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto relative z-10">
          {activeTab === 'dashboard' && (
            <Dashboard
              onNavigate={handleNavigate}
              onOpenRecordPayment={() => handleOpenRecordPaymentWithLoan()}
              onOpenAddCustomer={() => setIsAddCustomerOpen(true)}
              onSelectCustomer={(cust) => {
                setSelectedCustomer(cust);
                setActiveTab('customers');
              }}
            />
          )}

          {activeTab === 'customers' &&
            (selectedCustomer ? (
              <CustomerProfile
                customer={selectedCustomer}
                onBack={() => setSelectedCustomer(null)}
                onOpenRecordPayment={(loanId) => handleOpenRecordPaymentWithLoan(loanId)}
              />
            ) : (
              <Customers
                onSelectCustomer={(cust) => setSelectedCustomer(cust)}
                onOpenAddCustomer={() => setIsAddCustomerOpen(true)}
              />
            ))}

          {activeTab === 'loans' && (
            <Loans
              onOpenAddCustomer={() => setIsAddCustomerOpen(true)}
              onOpenRecordPayment={(loanId) => handleOpenRecordPaymentWithLoan(loanId)}
            />
          )}

          {activeTab === 'payments' && (
            <Payments
              onOpenRecordPayment={() => handleOpenRecordPaymentWithLoan()}
            />
          )}

          {activeTab === 'reports' && <Reports />}

          {activeTab === 'notifications' && <NotificationsPage />}

          {activeTab === 'settings' && <Settings />}
        </main>
      </div>

      {/* Global Modals */}
      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
      />

      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => {
          setIsRecordPaymentOpen(false);
          setRecordPaymentLoanId(undefined);
        }}
        preselectedLoanId={recordPaymentLoanId}
      />

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
        onSelectCustomer={(cust) => {
          setSelectedCustomer(cust);
          setActiveTab('customers');
          setIsSearchOpen(false);
        }}
      />

      {/* Slide-out Notification Drawer */}
      <NotificationDrawer />
    </div>
  );
};

export default App;
