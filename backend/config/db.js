import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config();

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

const connectDB = async () => {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      const conn = await mongoose.connect(
        process.env.MONGO_URI || "mongodb://localhost:27017/internlink"
      );

      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      retries++;
      const msg = error.message || String(error);
      console.error(`❌ MongoDB Connection Error (attempt ${retries}/${MAX_RETRIES}): ${msg}`);

      if (retries >= MAX_RETRIES) {
        console.error('🚨 Max retries reached. Server will continue running but DB-dependent routes will fail until connection is restored.');
        console.error('   Common fixes:');
        console.error('   1. Add your IP to MongoDB Atlas IP whitelist (Network Access → IP Whitelist)');
        console.error('   2. Verify MONGO_URI credentials and database name');
        console.error('   3. Check that the Atlas cluster is not paused');
        return; // Do NOT exit the process — server stays up for health checks and non-DB routes
      }

      console.error(`   Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
};

export default connectDB;