import express, { Request, Response } from 'express';
import cors from 'cors';
import { adminDb } from './firebaseAdmin';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Server Health Check Endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    system: 'Matrix Finance Express Backend Serverless API',
    firebaseDatabase: 'https://finflow-aa069-default-rtdb.firebaseio.com',
    timestamp: new Date().toISOString()
  });
});

// Fetch Realtime Database Summary Stats
app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    const snapshot = await adminDb.ref().once('value');
    const data = snapshot.val() || {};

    const customerCount = data.customers ? Object.keys(data.customers).length : 0;
    const loanCount = data.loans ? Object.keys(data.loans).length : 0;
    const paymentCount = data.payments ? Object.keys(data.payments).length : 0;
    const userCount = data.users ? Object.keys(data.users).length : 0;

    res.json({
      success: true,
      stats: {
        customers: customerCount,
        loans: loanCount,
        payments: paymentCount,
        users: userCount
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start Express Backend Server locally if not running on Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Dedicated FinPulse Firebase Backend running on http://localhost:${PORT}`);
  });
}

export default app;
