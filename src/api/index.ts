import app from '@/app';
import { connectDatabase } from '@/config/database';

// Vercel serverless: DB 연결을 lazy하게 처리
let isConnected = false;

const handler = async (req: any, res: any) => {
  if (!isConnected) {
    try {
      await connectDatabase();
      isConnected = true;
    } catch (error) {
      console.error('DB connection failed:', error);
      return res.status(500).json({ error: 'Database connection failed' });
    }
  }
  
  return app(req, res);
};

export default handler;
