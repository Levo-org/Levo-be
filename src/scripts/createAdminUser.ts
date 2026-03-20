import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase } from '@/config/database';
import User from '@/models/User';

const createAdminUser = async () => {
  try {
    await connectDatabase();
    
    const adminEmail = 'admin@levo.app';
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', adminEmail);
      console.log('Role:', existingAdmin.role);
      process.exit(0);
    }
    
    const adminUser = await User.create({
      email: adminEmail,
      name: 'Levo Admin',
      role: 'admin',
      provider: 'google',
      providerId: 'admin-google-id-' + Date.now(),
      activeLanguage: 'ko',
      onboardingCompleted: true,
    });
    
    console.log('\n✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:', adminUser.email);
    console.log('Name:', adminUser.name);
    console.log('Role:', adminUser.role);
    console.log('Provider:', adminUser.provider);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  Google OAuth로 로그인하세요:');
    console.log('   이메일:', adminEmail);
    console.log('\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser();
