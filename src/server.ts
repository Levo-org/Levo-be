import dotenv from 'dotenv';
dotenv.config();

import app from '@/app';
import { connectDatabase } from '@/config/database';
import { config } from '@/config';

const startServer = async () => {
  try {
    // MongoDB 연결
    await connectDatabase();

    // 서버 시작
    const PORT = config.port;
    app.listen(PORT, () => {
      console.log('');
      console.log('╔═══════════════════════════════════════════╗');
      console.log('║         🚀 Levo API Server Started        ║');
      console.log('╠═══════════════════════════════════════════╣');
      console.log(`║  Port:     ${String(PORT).padEnd(30)}║`);
      console.log(`║  Env:      ${String(config.nodeEnv).padEnd(30)}║`);
      console.log(`║  Swagger:  http://localhost:${PORT}/api-docs   ║`);
      console.log(`║  API:      http://localhost:${PORT}/api/v1     ║`);
      console.log(`║  Health:   http://localhost:${PORT}/health     ║`);
      console.log('╚═══════════════════════════════════════════╝');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// 미처리 에러 핸들링
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();
