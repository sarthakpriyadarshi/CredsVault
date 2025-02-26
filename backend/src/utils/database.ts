import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/credentials_db');
    console.log('Database connected');
  } catch (error) {
    console.error('Database connection error:', error);
  }
};

export default connectDB;