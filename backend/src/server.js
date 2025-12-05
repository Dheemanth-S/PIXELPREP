import express from "express";
import path from "path";
import cors from "cors";
import { serve } from "inngest/express";
import { clerkMiddleware } from "@clerk/express";

import { ENV } from "./lib/env.js";
import { connectDB } from "./lib/db.js";
import { inngest, functions } from "./lib/inngest.js";
import chatRoutes from "./routes/chatRoutes.js";
import sessionRoutes from "./routes/sessionRoute.js";

const app = express();

const __dirname = path.resolve();

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

if (!process.env.VERCEL && ENV.APP_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
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

if (!process.env.VERCEL) {
  startServer();
}

export default app;
