import mongoose from "mongoose";

import { ENV } from "./env.js";

export const connectDB = async () => {
  try {
    await mongoose.connect(ENV.DB_URL);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error in ConnectDB", error);
    process.exit(1);
  }
};
