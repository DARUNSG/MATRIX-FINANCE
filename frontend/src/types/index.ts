export type UserRole = 'Admin' | 'Staff';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar: string;
  phone: string;
  createdAt: string;
  lastLogin?: string;
}

export type LoanStatus = 'Active' | 'Completed' | 'Overdue' | 'Pending';

export interface Customer {
  id: string;
  fullName: string;
  photo: string;
  phone: string;
  email: string;
  address: string;
  occupation: string;
  joiningDate: string;
  status: 'Active' | 'Inactive';
  notes?: string;
}

export interface Loan {
  id: string;
  customerId: string;
  principalAmount: number;
  interestRate: number; // annual percentage e.g. 12%
  totalPayable: number;
  durationMonths: number;
  emiAmount: number;
  startDate: string;
  endDate: string;
  nextDueDate: string;
  paidAmount: number;
  remainingAmount: number;
  status: LoanStatus;
  purpose?: string;
}

export type PaymentMethod = 'Cash' | 'UPI' | 'BankTransfer' | 'Cheque';
export type PaymentType = 'EMI' | 'LumpSum' | 'Penalty' | 'Fee';
export type PaymentStatus = 'Paid' | 'Pending' | 'Overdue' | 'Failed';

export interface Payment {
  id: string;
  transactionId: string;
  loanId: string;
  customerId: string;
  customerName: string;
  date: string;
  amount: number;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  receiptNumber: string;
  status: PaymentStatus;
  collectedBy: string;
  notes?: string;
}

export type NotificationType = 'EMI' | 'Overdue' | 'Customer' | 'Loan' | 'Payment' | 'System';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  date: string;
  read: boolean;
  link?: string;
}

export interface SystemSettings {
  id?: number;
  businessName: string;
  tagline: string;
  businessLogo: string;
  phone: string;
  email: string;
  address: string;
  currency: string; // '₹', '$', '€', '£'
  theme: 'dark' | 'light' | 'system';
  enableEmailAlerts: boolean;
  enableSmsAlerts: boolean;
  lateFeePercentage: number;
}
