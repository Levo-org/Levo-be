import mongoose from 'mongoose';
import { config } from './index';

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ MongoDB 연결 성공');

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB 연결 에러:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB 연결 해제됨');
    });
  } catch (error) {
    console.error('❌ MongoDB 초기 연결 실패:', error);
    process.exit(1);
  }
};
