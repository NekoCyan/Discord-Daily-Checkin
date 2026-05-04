import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_NAME = process.env.MONGODB_NAME!;

if (!MONGODB_URI) throw new Error('Missing env: MONGODB_URI');
if (!MONGODB_NAME) throw new Error('Missing env: MONGODB_NAME');

export async function dbConnect() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection; // already connected
  }

  logger.info('Connecting to MongoDB...', 'mongo-connect');

  await mongoose.connect(MONGODB_URI, {
    dbName: MONGODB_NAME,
    bufferCommands: false,
  });

  logger.info('MongoDB connected', 'mongo-connect');
  return mongoose.connection;
}

export async function dbDisconnect() {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}
