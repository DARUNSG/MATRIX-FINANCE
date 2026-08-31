import { ref, set, onValue } from 'firebase/database';
import { rtdb } from '../firebase/config';
import { Customer, Loan, Payment, User } from '../types';

// Save User Sign Up & Profile Details directly to Firebase Database
export async function saveUserSignUpToFirebase(user: User) {
  try {
    const userRef = ref(rtdb, `users/${user.id}`);
    const loginRef = ref(rtdb, `logins/${Date.now()}`);

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      avatar: user.avatar || '',
      createdAt: user.createdAt || new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    const loginData = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      action: 'Account Sign Up & Login',
      timestamp: new Date().toISOString()
    };

    await set(userRef, userData).catch((e) => console.warn('Firebase set user warning:', e));
    await set(loginRef, loginData).catch((e) => console.warn('Firebase set login warning:', e));
    console.log('🔥 Firebase Realtime Database: User profile saved ->', user.id);
  } catch (err) {
    console.warn('Firebase User Save Warning:', err);
  }
}

// Record User Login to Firebase Database
export async function recordUserLoginToFirebase(user: User) {
  return saveUserSignUpToFirebase(user);
}

// Add / Update Customer in Firebase Database
export async function saveCustomerToFirebase(customer: Customer) {
  try {
    const custRef = ref(rtdb, `customers/${customer.id}`);
    await set(custRef, customer).catch((e) => console.warn('Firebase set customer warning:', e));
    console.log('🔥 Firebase Realtime Database: Customer saved ->', customer.id);
  } catch (err) {
    console.warn('Firebase Customer Save Warning:', err);
  }
}

// Remove Customer from Firebase Database
export async function deleteCustomerFromFirebase(customerId: string) {
  try {
    const custRef = ref(rtdb, `customers/${customerId}`);
    await set(custRef, null).catch((e) => console.warn('Firebase delete customer warning:', e));
    console.log('🔥 Firebase Realtime Database: Customer deleted ->', customerId);
  } catch (err) {
    console.warn('Firebase Customer Delete Warning:', err);
  }
}

// Add / Update Loan in Firebase Database
export async function saveLoanToFirebase(loan: Loan) {
  try {
    const loanRef = ref(rtdb, `loans/${loan.id}`);
    await set(loanRef, loan).catch((e) => console.warn('Firebase set loan warning:', e));
    console.log('🔥 Firebase Realtime Database: Loan saved ->', loan.id);
  } catch (err) {
    console.warn('Firebase Loan Save Warning:', err);
  }
}

// Add Payment Record to Firebase Database
export async function savePaymentToFirebase(payment: Payment) {
  try {
    const payRef = ref(rtdb, `payments/${payment.id}`);
    await set(payRef, payment).catch((e) => console.warn('Firebase set payment warning:', e));
    console.log('🔥 Firebase Realtime Database: Payment saved ->', payment.id);
  } catch (err) {
    console.warn('Firebase Payment Save Warning:', err);
  }
}

// Clear All Payments from Firebase Database
export async function clearAllPaymentsFromFirebase() {
  try {
    const payRef = ref(rtdb, 'payments');
    await set(payRef, null).catch((e) => console.warn('Firebase clear payments warning:', e));
    console.log('🔥 Firebase Realtime Database: All payments cleared');
  } catch (err) {
    console.warn('Firebase Clear Payments Warning:', err);
  }
}

// Clear All Customers & Associated Loans from Firebase Database
export async function clearAllCustomersFromFirebase() {
  try {
    const custRef = ref(rtdb, 'customers');
    const loanRef = ref(rtdb, 'loans');
    await set(custRef, null).catch((e) => console.warn('Firebase clear customers warning:', e));
    await set(loanRef, null).catch((e) => console.warn('Firebase clear loans warning:', e));
    console.log('🔥 Firebase Realtime Database: All customers and loans cleared');
  } catch (err) {
    console.warn('Firebase Clear Customers Warning:', err);
  }
}

// Save Exported Report Log to Firebase Database
export async function saveReportLogToFirebase(reportType: 'PDF' | 'Excel', summary: any) {
  try {
    const reportRef = ref(rtdb, `reports/${Date.now()}`);
    await set(reportRef, {
      reportType,
      timestamp: new Date().toISOString(),
      summary
    }).catch((e) => console.warn('Firebase set report warning:', e));
    console.log('🔥 Firebase Realtime Database: Financial Report Logged');
  } catch (err) {
    console.warn('Firebase Report Save Warning:', err);
  }
}

// Realtime Listener for Firebase Data Sync into App
export function subscribeToFirebaseRealtime(onSync: (data: {
  customers: Customer[];
  loans: Loan[];
  payments: Payment[];
}) => void) {
  const rootRef = ref(rtdb);
  return onValue(rootRef, (snapshot) => {
    if (snapshot.exists()) {
      const val = snapshot.val();
      const customers = val.customers ? Object.values(val.customers) as Customer[] : [];
      const loans = val.loans ? Object.values(val.loans) as Loan[] : [];
      const payments = val.payments ? Object.values(val.payments) as Payment[] : [];
      onSync({ customers, loans, payments });
    }
  }, (err) => {
    console.warn('Firebase Realtime listener warning:', err);
  });
}
