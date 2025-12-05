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

// ✅ Correct way to get dirname in ESM (important on Vercel)
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

// ✅ Serve frontend build in production (local + Vercel)
if (ENV.APP_ENV === "production") {
  // server.js is backend/src/server.js → go up 2 levels → frontend/dist
  const distPath = path.join(__dirname, "../../frontend/dist");

  app.use(express.static(distPath));

  // use regex wildcard; "*" was causing issues on Vercel
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

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

// ✅ Local dev: run full server (listen)
if (!process.env.VERCEL) {
  startServer();
} else {
  // ✅ Vercel serverless: connect DB, but do NOT listen
  connectDB().catch((error) => {
    console.error("Error connecting to DB on Vercel", error);
  });
}

export default app;
