import { db } from './database';
import { User, Customer, Loan, Payment, AppNotification, SystemSettings } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'USR-001',
    name: 'Admin Manager',
    email: 'admin@finpulse.com',
    password: 'admin123',
    role: 'Admin',
    avatar: '',
    phone: '+91 98765 43210',
    createdAt: '2026-01-01',
    lastLogin: new Date().toISOString()
  },
  {
    id: 'USR-002',
    name: 'Loan Officer (Staff)',
    email: 'staff@finpulse.com',
    password: 'staff123',
    role: 'Staff',
    avatar: '',
    phone: '+91 98765 12345',
    createdAt: '2026-01-15',
    lastLogin: new Date().toISOString()
  }
];

export const INITIAL_SETTINGS: SystemSettings = {
  id: 1,
  businessName: 'My Finance Business',
  tagline: 'Customer Loan & EMI Management System',
  businessLogo: '',
  phone: '+91 98000 11122',
  email: 'admin@myfinance.in',
  address: 'Main Finance Office, City Center',
  currency: '₹',
  theme: 'dark',
  enableEmailAlerts: true,
  enableSmsAlerts: true,
  lateFeePercentage: 2
};

// Start with clean database (0 fake customers/loans/payments)
export async function seedDatabaseIfEmpty() {
  const userCount = await db.users.count();
  if (userCount === 0) {
    await db.users.bulkAdd(INITIAL_USERS);
    await db.settings.add(INITIAL_SETTINGS);
  }
}

export async function clearAllData() {
  await db.customers.clear();
  await db.loans.clear();
  await db.payments.clear();
  await db.notifications.clear();
}
