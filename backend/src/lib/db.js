import mongoose from "mongoose";

import { ENV } from "./env.js";

export const connectDB = async () => {
  try {
    if (!ENV.DB_URL) {
      throw new error("DB_URL is not defined in environment variables");
    }
    await mongoose.connect(ENV.DB_URL);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error in ConnectDB", error);
    process.exit(1);
  }
};
