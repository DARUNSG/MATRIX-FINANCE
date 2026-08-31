import Dexie, { Table } from 'dexie';
import { User, Customer, Loan, Payment, AppNotification, SystemSettings } from '../types';

export class FinPulseDatabase extends Dexie {
  users!: Table<User, string>;
  customers!: Table<Customer, string>;
  loans!: Table<Loan, string>;
  payments!: Table<Payment, string>;
  notifications!: Table<AppNotification, string>;
  settings!: Table<SystemSettings, number>;

  constructor() {
    super('FinPulseDB');
    this.version(1).stores({
      users: 'id, email, role',
      customers: 'id, fullName, phone, status',
      loans: 'id, customerId, status, nextDueDate',
      payments: 'id, transactionId, loanId, customerId, date, status',
      notifications: 'id, type, read, date',
      settings: '++id'
    });
  }
}

export const db = new FinPulseDatabase();
