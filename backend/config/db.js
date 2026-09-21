import mongoose from 'mongoose';

export default async function connectDB() {
  const uri = process.env.MONGO_URI ;
  mongoose.set('strictQuery', true);
  const conn = await mongoose.connect(uri);
  console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
}
