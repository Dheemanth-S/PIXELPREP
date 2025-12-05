import express from "express";
import path from "path";
import cors from "cors";
import { serve } from "inngest/express";
import { clerkMiddleware } from "@clerk/express";
import { fileURLToPath } from "url";

import { ENV } from "./lib/env.js";
import { connectDB } from "./lib/db.js";
import { inngest, functions } from "./lib/inngest.js";
import chatRoutes from "./routes/chatRoutes.js";
import sessionRoutes from "./routes/sessionRoute.js";

const app = express();

// Proper __dirname in ESM (might still be useful for other things)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

app.use(
  cors({
    origin: [ENV.CLIENT_URL, "https://pixelprep.vercel.app"],
    credentials: true,
  })
);

app.use(clerkMiddleware());

app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/chat", chatRoutes);
app.use("/api/sessions", sessionRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    env: process.env.VERCEL ? "vercel" : "local",
    url: req.url,
  });
});

// ❌ REMOVE all the frontend-serving logic from here.
// We are not doing `app.use(express.static(...))`
// and not doing `app.get(/.*/, ...)` in this file anymore.

// Local dev: full server with listen()
const startServer = async () => {
  try {
    await connectDB();
    app.listen(ENV.PORT, () =>
      console.log("Server is running on Port:", ENV.PORT)
    );
  } catch (error) {
    console.error("Error starting server", error);
  }
};

if (!process.env.VERCEL) {
  startServer();
} else {
  connectDB().catch((error) => {
    console.error("Error connecting to DB on Vercel", error);
  });
}

export default app;
